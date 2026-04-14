'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';

import { GeoEmptyPanel, GeoKpiCard, GeoPremiumCard } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import { ADMIN_GEO_LABELS } from '@/lib/i18n/admin-fr';
import { translateRunSignalTier } from '@/lib/i18n/run-diagnostics-fr';
import { translateRunErrorMessage } from '@/lib/i18n/run-diagnostics-fr';
import QualityPill from '@/components/ui/QualityPill';

/* ─── Constants ─── */

const DEFAULT_FORM = {
    query_text: '',
    category: 'discovery',
    locale: 'fr-CA',
    prompt_mode: 'user_like',
    is_active: true,
};

const PROMPT_MODE_LABELS = {
    user_like: 'Question naturelle',
    operator_probe: 'Sonde opérateur',
};

/* ─── Helpers ─── */

function resolvePromptMode(prompt) {
    return prompt.prompt_mode || prompt.prompt_metadata?.prompt_mode || 'user_like';
}

function promptStatusDotClass(prompt) {
    if (!prompt.is_active) return 'bg-white/15';
    if (prompt.quality_status === 'strong') return 'bg-emerald-400';
    if (prompt.quality_status === 'weak') return 'bg-red-400';
    return 'bg-amber-400';
}

function executionStatusMeta(status) {
    if (status === 'completed') return { label: 'Terminée', cls: 'text-emerald-400', dot: 'bg-emerald-400' };
    if (status === 'partial') return { label: 'Partielle', cls: 'text-amber-300', dot: 'bg-amber-400' };
    if (status === 'running') return { label: 'En cours', cls: 'text-violet-400', dot: 'bg-violet-400' };
    if (status === 'pending') return { label: 'En attente', cls: 'text-amber-400', dot: 'bg-amber-400' };
    if (status === 'partial_error') return { label: 'Erreur partielle', cls: 'text-red-300', dot: 'bg-red-400' };
    if (status === 'failed') return { label: 'Échouée', cls: 'text-red-400', dot: 'bg-red-400' };
    return { label: 'Aucune', cls: 'text-white/40', dot: 'bg-white/20' };
}

function promptLifecycleLabel(prompt) {
    if (!prompt.is_active) return { text: 'Inactif', cls: 'text-white/35' };
    if (prompt.quality_status === 'weak') return { text: 'À renforcer', cls: 'text-red-300' };
    if (prompt.quality_status === 'review') return { text: 'À revoir', cls: 'text-amber-300' };
    if (!prompt.last_run) return { text: 'Prêt', cls: 'text-blue-300' };
    if (prompt.last_run.target_found) return { text: 'Performant', cls: 'text-emerald-300' };
    return { text: 'Actif', cls: 'text-white/60' };
}

function prioritySortSuggestions(suggestions) {
    const order = { strong: 0, review: 1, weak: 2 };
    return [...suggestions].sort((a, b) => (order[a.quality_status] ?? 1) - (order[b.quality_status] ?? 1));
}

async function parseJsonResponse(response) {
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.error || `Erreur ${response.status}`);
    return json;
}

function buildOperatorRunErrorMessage(prefix, runRows = []) {
    const failedRun = runRows.find((item) => item?.error);
    if (!failedRun?.error) return prefix;
    return `${prefix} ${translateRunErrorMessage(failedRun.error)}`;
}

/* ─── AI Refine Helper ─── */

async function fetchAiRefinement({ queryText, client, category, promptMode }) {
    const response = await fetch('/api/admin/clients/onboarding/suggest-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            current_query: queryText,
            business_name: client?.client_name || '',
            business_type: client?.business_type || '',
            target_region: client?.address?.city || client?.target_region || '',
            seo_description: client?.seo_description || '',
            services: Array.isArray(client?.business_details?.services) ? client.business_details.services.join(', ') : '',
            intent_family: category || '',
            prompt_mode: promptMode || 'user_like',
        }),
    });
    const json = await parseJsonResponse(response);
    if (!json.suggestion) throw new Error('Aucune suggestion générée.');
    return json.suggestion;
}

/* ─── Sub-Components ─── */

function PromptCommandHeader({ client, summary, hasActivePrompt, runningBatch, submitting, onRunAll, clientId }) {
    const mentionRate = summary?.mentionRatePercent;
    const healthLevel = mentionRate == null ? 'neutral' : mentionRate >= 60 ? 'good' : mentionRate >= 30 ? 'moderate' : 'low';
    const healthColors = { good: 'text-emerald-400', moderate: 'text-amber-400', low: 'text-red-400', neutral: 'text-white/40' };
    const healthLabels = { good: 'Bonne couverture', moderate: 'Couverture partielle', low: 'Couverture faible', neutral: 'Pas de données' };

    return (
        <div className="relative rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.06] via-white/[0.02] to-transparent p-6 before:absolute before:top-0 before:left-6 before:right-6 before:h-px before:bg-gradient-to-r before:from-transparent before:via-violet-400/30 before:to-transparent">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold tracking-[-0.02em] text-white/95">Stratégie prompts</h1>
                    <p className="text-[13px] text-white/40 mt-0.5">
                        Centre de contrôle pour {client?.client_name || 'ce client'}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" className="geo-btn geo-btn-pri" disabled={!hasActivePrompt || runningBatch || submitting} onClick={onRunAll}>
                        {runningBatch ? 'Exécution…' : ADMIN_GEO_LABELS.actions.runActivePrompts}
                    </button>
                    <Link href={`/admin/clients/${clientId}/geo/runs`} className="geo-btn geo-btn-ghost">{ADMIN_GEO_LABELS.nav.runHistory}</Link>
                    <Link href={`/admin/clients/${clientId}/geo/signals`} className="geo-btn geo-btn-ghost">Signaux</Link>
                </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-[12px]">
                <span className="text-white/50">{summary?.total || 0} prompts · {summary?.active || 0} actifs</span>
                <span className={healthColors[healthLevel]}>
                    {healthLabels[healthLevel]}{mentionRate != null ? ` (${mentionRate}% cible détectée)` : ''}
                </span>
                {(summary?.weakPromptCount || 0) > 0 && (
                    <span className="text-amber-400">{summary.weakPromptCount} à renforcer</span>
                )}
            </div>
        </div>
    );
}

function PromptOverviewBand({ summary }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <GeoKpiCard label="Prompts actifs" value={summary.active} hint="Prêts à exécuter" accent="emerald" />
            <GeoKpiCard label="Taux cible" value={summary.mentionRatePercent != null ? `${summary.mentionRatePercent}%` : '—'} hint="Détection dans les réponses IA" accent="violet" />
            <GeoKpiCard label="Sans exécution" value={summary.noRunYet} hint="En attente de lancement" accent="amber" />
            <GeoKpiCard label="Échecs récents" value={(summary.latestStatusCounts?.failed || 0)} hint="Dernière exécution échouée" accent="amber" />
        </div>
    );
}

function PromptCreationSurface({ form, setForm, categoryOptions, submitting, onSubmit, clientId, client, actionNotice, actionError }) {
    const [aiRefining, setAiRefining] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [aiError, setAiError] = useState(null);

    const handleAiRefine = useCallback(async () => {
        const rawText = form.query_text.trim();
        if (!rawText || rawText.length < 5) return;
        setAiRefining(true);
        setAiSuggestion(null);
        setAiError(null);
        try {
            const suggestion = await fetchAiRefinement({ queryText: rawText, client, category: form.category, promptMode: form.prompt_mode });
            setAiSuggestion(suggestion);
        } catch {
            setAiError('Impossible de générer une suggestion pour le moment.');
        } finally {
            setAiRefining(false);
        }
    }, [form, client]);

    return (
        <GeoPremiumCard className="p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                    <div className="text-sm font-semibold text-white/95">Créer un prompt</div>
                    <p className="text-[11px] text-white/40 mt-0.5">Décrivez une intention de recherche — l&apos;IA peut affiner le texte.</p>
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        className="flex-1 bg-white/[0.04] border border-white/[0.10] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-violet-500/40 focus:outline-none transition-colors"
                        value={form.query_text}
                        onChange={(event) => setForm((current) => ({ ...current, query_text: event.target.value }))}
                        placeholder="Ex. Quel plombier recommander à Québec pour une urgence ?"
                        disabled={submitting}
                    />
                    {form.query_text.trim().length >= 5 && (
                        <button
                            type="button"
                            onClick={handleAiRefine}
                            disabled={aiRefining || submitting}
                            className="geo-btn geo-btn-vio text-[11px] px-3 py-2.5 shrink-0"
                        >
                            {aiRefining ? 'Réflexion…' : '✦ Affiner avec IA'}
                        </button>
                    )}
                </div>

                {aiSuggestion && (
                    <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold text-violet-300/80 uppercase tracking-[0.06em] mb-1">Suggestion IA</p>
                                <p className="text-[13px] text-white/85 leading-relaxed">{aiSuggestion}</p>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                                <button type="button" onClick={() => { setForm((c) => ({ ...c, query_text: aiSuggestion })); setAiSuggestion(null); setAiError(null); }} className="geo-btn geo-btn-vio text-[10px] px-2 py-1">Utiliser</button>
                                <button type="button" onClick={() => setAiSuggestion(null)} className="geo-btn geo-btn-ghost text-[10px] px-2 py-1">Ignorer</button>
                            </div>
                        </div>
                    </div>
                )}

                {aiError && (
                    <p className="text-[11px] text-amber-400/80 px-1">{aiError}</p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <select className="bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white focus:border-violet-500/40 focus:outline-none" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} disabled={submitting}>
                        {categoryOptions.map((option) => <option key={option.key} value={option.key} className="bg-[#101010]">{option.label}</option>)}
                    </select>
                    <select className="bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white focus:border-violet-500/40 focus:outline-none" value={form.prompt_mode} onChange={(event) => setForm((current) => ({ ...current, prompt_mode: event.target.value }))} disabled={submitting}>
                        <option value="user_like" className="bg-[#101010]">Question naturelle</option>
                        <option value="operator_probe" className="bg-[#101010]">Sonde opérateur</option>
                    </select>
                    <input className="bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white focus:border-violet-500/40 focus:outline-none" value={form.locale} onChange={(event) => setForm((current) => ({ ...current, locale: event.target.value }))} disabled={submitting} />
                    <button type="submit" disabled={submitting || !form.query_text.trim()} className="geo-btn geo-btn-pri justify-center py-2">Ajouter le prompt</button>
                </div>
            </form>

            {actionNotice && <div className="text-[12px] text-emerald-300 mt-3 px-1">{actionNotice}</div>}
            {actionError && <div className="text-[12px] text-red-400 mt-3 px-1">{actionError}</div>}
        </GeoPremiumCard>
    );
}

/* ─── AI Prompt List Generation ─── */

async function createPromptDirectly({ clientId, queryText, category, promptMode, locale }) {
    const response = await fetch('/api/admin/queries/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            clientId,
            query_text: queryText,
            category: category || 'discovery',
            query_type: category || 'discovery',
            locale: locale || 'fr-CA',
            prompt_mode: promptMode || 'user_like',
            is_active: true,
            prompt_origin: 'ai_generated_list',
        }),
    });
    return parseJsonResponse(response);
}

function AiPromptListSurface({ client, clientId, invalidateWorkspace, categoryOptions, submitting: parentSubmitting }) {
    const [open, setOpen] = useState(false);
    const [guidance, setGuidance] = useState('');
    const [category, setCategory] = useState('');
    const [promptMode, setPromptMode] = useState('');
    const [count, setCount] = useState(4);
    const [generating, setGenerating] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(new Set());
    const [showGuidance, setShowGuidance] = useState(false);

    /* ─ AI refine per-item ─ */
    const [refiningId, setRefiningId] = useState(null);
    const [refinements, setRefinements] = useState({});
    const [refineError, setRefineError] = useState(null);

    /* ─ Direct-add tracking ─ */
    const [addingIds, setAddingIds] = useState(new Set());
    const [addedIds, setAddedIds] = useState(new Set());
    const [addNotice, setAddNotice] = useState(null);
    const [addError, setAddError] = useState(null);

    const mandateContext = [client?.client_name, client?.business_type, client?.address?.city || client?.target_region].filter(Boolean);
    const hasMandateContext = mandateContext.length > 0;

    const handleGenerate = useCallback(async () => {
        if (!hasMandateContext && (!guidance.trim() || guidance.trim().length < 5)) return;
        setGenerating(true);
        setResults(null);
        setError(null);
        setSelected(new Set());
        setRefinements({});
        setRefineError(null);
        setAddedIds(new Set());
        setAddingIds(new Set());
        setAddNotice(null);
        setAddError(null);
        try {
            const response = await fetch('/api/admin/clients/onboarding/generate-prompt-list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    intent: guidance.trim() || undefined,
                    category,
                    prompt_mode: promptMode || undefined,
                    count,
                    business_name: client?.client_name || '',
                    business_type: client?.business_type || '',
                    target_region: client?.address?.city || client?.target_region || '',
                    seo_description: client?.seo_description || '',
                    services: Array.isArray(client?.business_details?.services) ? client.business_details.services.join(', ') : '',
                }),
            });
            const json = await parseJsonResponse(response);
            if (!json.prompts || json.prompts.length === 0) throw new Error('Aucun prompt généré.');
            setResults(json.prompts);
        } catch (err) {
            setError(err.message || 'Échec de la génération.');
        } finally {
            setGenerating(false);
        }
    }, [guidance, category, promptMode, count, client, hasMandateContext]);

    const handleRefineItem = useCallback(async (item) => {
        setRefiningId(item.id);
        setRefineError(null);
        try {
            const suggestion = await fetchAiRefinement({
                queryText: item.query_text,
                client,
                category: item.intent_family || category,
                promptMode: item.prompt_mode || 'user_like',
            });
            setRefinements((prev) => ({ ...prev, [item.id]: suggestion }));
        } catch {
            setRefineError('Impossible d\u2019améliorer ce prompt pour le moment.');
        } finally {
            setRefiningId(null);
        }
    }, [client, category]);

    const toggleSelect = useCallback((id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }, []);

    /* ─ Direct single-item add via API ─ */
    const handleAddItem = useCallback(async (item) => {
        if (!clientId) return;
        const text = refinements[item.id] || item.query_text;
        setAddingIds((prev) => new Set(prev).add(item.id));
        setAddError(null);
        try {
            await createPromptDirectly({
                clientId,
                queryText: text,
                category: item.intent_family || 'discovery',
                promptMode: item.prompt_mode || 'user_like',
            });
            setAddedIds((prev) => new Set(prev).add(item.id));
            setSelected((prev) => { const next = new Set(prev); next.delete(item.id); return next; });
            invalidateWorkspace();
        } catch (err) {
            setAddError(err.message || 'Échec de l\u2019ajout.');
        } finally {
            setAddingIds((prev) => { const next = new Set(prev); next.delete(item.id); return next; });
        }
    }, [clientId, refinements, invalidateWorkspace]);

    /* ─ True batch add — sequential API calls with per-item tracking ─ */
    const handleAddSelected = useCallback(async () => {
        if (!results || !clientId) return;
        const items = results.filter((r) => selected.has(r.id) && !addedIds.has(r.id));
        if (items.length === 0) return;
        setAddError(null);
        setAddNotice(null);
        let successCount = 0;
        let failCount = 0;
        for (const item of items) {
            const text = refinements[item.id] || item.query_text;
            setAddingIds((prev) => new Set(prev).add(item.id));
            try {
                await createPromptDirectly({
                    clientId,
                    queryText: text,
                    category: item.intent_family || 'discovery',
                    promptMode: item.prompt_mode || 'user_like',
                });
                setAddedIds((prev) => new Set(prev).add(item.id));
                successCount++;
            } catch {
                failCount++;
            } finally {
                setAddingIds((prev) => { const next = new Set(prev); next.delete(item.id); return next; });
            }
        }
        setSelected(new Set());
        if (failCount === 0) {
            setAddNotice(`${successCount} prompt${successCount > 1 ? 's' : ''} ajouté${successCount > 1 ? 's' : ''} avec succès.`);
        } else {
            setAddError(`${successCount} ajouté${successCount > 1 ? 's' : ''}, ${failCount} échec${failCount > 1 ? 's' : ''}.`);
        }
        invalidateWorkspace();
    }, [results, selected, addedIds, clientId, refinements, invalidateWorkspace]);

    const handleClearRefinement = useCallback((id) => {
        setRefinements((prev) => { const next = { ...prev }; delete next[id]; return next; });
    }, []);

    const selectableCount = results ? results.filter((r) => !addedIds.has(r.id)).length : 0;

    if (!open) {
        return (
            <GeoPremiumCard className="p-5">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="text-sm font-semibold text-white/95">Générer des prompts à partir du mandat</div>
                        <p className="text-[11px] text-white/40 mt-0.5">
                            {hasMandateContext
                                ? `L'IA génère des prompts adaptés pour ${mandateContext.join(' · ')}`
                                : 'Génération IA basée sur le contexte client'}
                        </p>
                    </div>
                    <button type="button" onClick={() => setOpen(true)} className="geo-btn geo-btn-vio shrink-0">
                        ✦ Générer des prompts
                    </button>
                </div>
            </GeoPremiumCard>
        );
    }

    return (
        <GeoPremiumCard className="p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                    <div className="text-sm font-semibold text-white/95">Générer des prompts pour ce mandat</div>
                    <p className="text-[11px] text-white/40 mt-0.5">
                        {hasMandateContext
                            ? `Contexte : ${mandateContext.join(' · ')}`
                            : 'Aucun contexte mandat détecté — ajoutez une consigne ci-dessous.'}
                    </p>
                </div>
                <button type="button" onClick={() => { setOpen(false); setResults(null); setError(null); setAddNotice(null); setAddError(null); }} className="geo-btn geo-btn-ghost text-[10px] px-2 py-1">Fermer</button>
            </div>

            {/* ─ Mandate context summary ─ */}
            {hasMandateContext && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 mb-3">
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-white/50">
                        {client?.client_name && <span><span className="text-white/25">Client :</span> {client.client_name}</span>}
                        {client?.business_type && <span><span className="text-white/25">Type :</span> {client.business_type}</span>}
                        {(client?.address?.city || client?.target_region) && <span><span className="text-white/25">Région :</span> {client.address?.city || client.target_region}</span>}
                        {client?.seo_description && <span className="basis-full"><span className="text-white/25">Description :</span> {client.seo_description.length > 80 ? client.seo_description.slice(0, 80) + '…' : client.seo_description}</span>}
                    </div>
                </div>
            )}

            {/* ─ Controls + Generate ─ */}
            <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <select
                        className="bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white focus:border-violet-500/40 focus:outline-none"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        disabled={generating}
                    >
                        <option value="" className="bg-[#101010]">Catégorie (auto)</option>
                        {categoryOptions.map((opt) => <option key={opt.key} value={opt.key} className="bg-[#101010]">{opt.label}</option>)}
                    </select>
                    <select
                        className="bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white focus:border-violet-500/40 focus:outline-none"
                        value={promptMode}
                        onChange={(e) => setPromptMode(e.target.value)}
                        disabled={generating}
                    >
                        <option value="" className="bg-[#101010]">Mode (varié)</option>
                        <option value="user_like" className="bg-[#101010]">Question naturelle</option>
                        <option value="operator_probe" className="bg-[#101010]">Sonde opérateur</option>
                    </select>
                    <select
                        className="bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white focus:border-violet-500/40 focus:outline-none"
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                        disabled={generating}
                    >
                        <option value={3} className="bg-[#101010]">3 prompts</option>
                        <option value={4} className="bg-[#101010]">4 prompts</option>
                        <option value={5} className="bg-[#101010]">5 prompts</option>
                        <option value={6} className="bg-[#101010]">6 prompts</option>
                    </select>
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={generating || (!hasMandateContext && (!guidance.trim() || guidance.trim().length < 5)) || parentSubmitting}
                        className="geo-btn geo-btn-pri justify-center py-2"
                    >
                        {generating ? 'Génération…' : '✦ Générer'}
                    </button>
                </div>

                {/* ─ Optional guidance (collapsed by default) ─ */}
                {!showGuidance ? (
                    <button
                        type="button"
                        onClick={() => setShowGuidance(true)}
                        className="text-[11px] text-violet-300/60 hover:text-violet-300/90 transition-colors"
                    >
                        + Ajouter une consigne additionnelle
                    </button>
                ) : (
                    <div>
                        <label className="text-[11px] text-white/35 mb-1 block">Angle supplémentaire (optionnel)</label>
                        <input
                            type="text"
                            className="w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-4 py-2 text-sm text-white placeholder:text-white/25 focus:border-violet-500/40 focus:outline-none transition-colors"
                            value={guidance}
                            onChange={(e) => setGuidance(e.target.value)}
                            placeholder="Ex. Focus sur les services d'urgence, ou cibler les jeunes familles"
                            disabled={generating}
                        />
                    </div>
                )}
            </div>

            {error && <p className="text-[11px] text-amber-400/80 mt-3 px-1">{error}</p>}

            {/* ─ Results list ─ */}
            {results && results.length > 0 && (
                <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-[10px] font-semibold text-violet-300/80 uppercase tracking-[0.06em]">
                            {results.length} prompt{results.length > 1 ? 's' : ''} généré{results.length > 1 ? 's' : ''}
                            {addedIds.size > 0 && <span className="text-emerald-400/80 ml-2">· {addedIds.size} ajouté{addedIds.size > 1 ? 's' : ''}</span>}
                        </p>
                        {selected.size > 0 && (
                            <button type="button" onClick={handleAddSelected} className="geo-btn geo-btn-vio text-[10px] px-2.5 py-1" disabled={parentSubmitting || addingIds.size > 0}>
                                {addingIds.size > 0 ? 'Ajout…' : `Ajouter ${selected.size} sélectionné${selected.size > 1 ? 's' : ''}`}
                            </button>
                        )}
                    </div>

                    {addNotice && <p className="text-[11px] text-emerald-300/80 px-1 mb-1">{addNotice}</p>}
                    {addError && <p className="text-[11px] text-amber-400/80 px-1 mb-1">{addError}</p>}
                    {refineError && <p className="text-[11px] text-amber-400/80 px-1 mb-1">{refineError}</p>}

                    {results.map((item) => {
                        const isAdded = addedIds.has(item.id);
                        const isAdding = addingIds.has(item.id);
                        return (
                            <div key={item.id} className={`group rounded-xl border px-4 py-3 transition-colors ${isAdded ? 'border-emerald-500/20 bg-emerald-500/[0.03]' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'}`}>
                                <div className="flex items-start gap-3">
                                    {/* Checkbox or added indicator */}
                                    {isAdded ? (
                                        <div className="mt-0.5 w-4 h-4 rounded bg-emerald-500/80 flex items-center justify-center shrink-0">
                                            <span className="text-[10px] text-white leading-none">✓</span>
                                        </div>
                                    ) : (
                                        <label className="mt-0.5 shrink-0 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(item.id)}
                                                onChange={() => toggleSelect(item.id)}
                                                className="sr-only peer"
                                                disabled={isAdding}
                                            />
                                            <div className="w-4 h-4 rounded border border-white/20 peer-checked:bg-violet-500/80 peer-checked:border-violet-500/80 flex items-center justify-center transition-colors">
                                                {selected.has(item.id) && <span className="text-[10px] text-white leading-none">✓</span>}
                                            </div>
                                        </label>
                                    )}

                                    {/* Content */}
                                    <div className={`min-w-0 flex-1 ${isAdded ? 'opacity-60' : ''}`}>
                                        <p className="text-[13px] text-white/85 leading-relaxed">{refinements[item.id] || item.query_text}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                            <span className="text-[10px] text-violet-300/60">{item.intent_family}</span>
                                            <span className="text-[10px] text-white/30">{PROMPT_MODE_LABELS[item.prompt_mode] || item.prompt_mode}</span>
                                            {isAdded && <span className="text-[10px] text-emerald-400/70">Ajouté</span>}
                                            {item.rationale && !isAdded && <span className="text-[10px] text-white/25 hidden md:inline">— {item.rationale}</span>}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {!isAdded && (
                                        <div className="flex gap-1.5 shrink-0">
                                            {!refinements[item.id] && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRefineItem(item)}
                                                    disabled={refiningId === item.id || isAdding}
                                                    className="geo-btn geo-btn-vio text-[10px] px-2.5 py-1 opacity-60 group-hover:opacity-100 transition-opacity"
                                                >
                                                    {refiningId === item.id ? '…' : '✦ Améliorer'}
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleAddItem(item)}
                                                disabled={parentSubmitting || isAdding}
                                                className="geo-btn geo-btn-ghost text-[10px] px-2.5 py-1 opacity-60 group-hover:opacity-100 transition-opacity"
                                            >
                                                {isAdding ? '…' : 'Ajouter'}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Refined version */}
                                {refinements[item.id] && !isAdded && (
                                    <div className="mt-2.5 rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-semibold text-violet-300/80 uppercase tracking-[0.06em] mb-1">Version améliorée</p>
                                                <p className="text-[13px] text-white/85 leading-relaxed">{refinements[item.id]}</p>
                                            </div>
                                            <div className="flex gap-1.5 shrink-0">
                                                <button type="button" onClick={() => handleClearRefinement(item.id)} className="geo-btn geo-btn-ghost text-[10px] px-2 py-1">Original</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </GeoPremiumCard>
    );
}

function SuggestedPromptPack({ suggestions, onUse, client }) {
    if (!suggestions || suggestions.length === 0) return null;
    const sorted = prioritySortSuggestions(suggestions);
    const strong = sorted.filter((p) => p.quality_status === 'strong');
    const rest = sorted.filter((p) => p.quality_status !== 'strong');

    const [improvingId, setImprovingId] = useState(null);
    const [improvements, setImprovements] = useState({});
    const [improveError, setImproveError] = useState(null);

    const handleImprove = useCallback(async (prompt) => {
        setImprovingId(prompt.id);
        setImproveError(null);
        try {
            const suggestion = await fetchAiRefinement({
                queryText: prompt.query_text,
                client,
                category: prompt.category,
                promptMode: prompt.prompt_mode || prompt.prompt_metadata?.prompt_mode || 'user_like',
            });
            setImprovements((prev) => ({ ...prev, [prompt.id]: suggestion }));
        } catch {
            setImproveError('Impossible d\u2019améliorer cette suggestion.');
        } finally {
            setImprovingId(null);
        }
    }, [client]);

    const handleClearImprovement = useCallback((id) => {
        setImprovements((prev) => { const next = { ...prev }; delete next[id]; return next; });
    }, []);

    return (
        <GeoPremiumCard className="p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                    <div className="text-sm font-semibold text-white/95">Prompts suggérés</div>
                    <p className="text-[11px] text-white/40 mt-0.5">Suggestions basées sur le profil métier — les plus pertinentes en premier.</p>
                </div>
                <span className="text-[10px] text-white/30 tabular-nums">{suggestions.length} disponible{suggestions.length > 1 ? 's' : ''}</span>
            </div>

            {improveError && <p className="text-[11px] text-amber-400/80 mb-3 px-1">{improveError}</p>}

            {strong.length > 0 && (
                <div className="space-y-2 mb-3">
                    <p className="text-[10px] font-semibold text-emerald-400/70 uppercase tracking-[0.06em]">Recommandés</p>
                    {strong.map((prompt) => (
                        <SuggestedPromptRow key={prompt.id} prompt={prompt} onUse={onUse} onImprove={handleImprove} isImproving={improvingId === prompt.id} improvedText={improvements[prompt.id] || null} onClearImprovement={handleClearImprovement} />
                    ))}
                </div>
            )}

            {rest.length > 0 && (
                <div className="space-y-2">
                    {strong.length > 0 && <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.06em] mt-2">Autres suggestions</p>}
                    {rest.map((prompt) => (
                        <SuggestedPromptRow key={prompt.id} prompt={prompt} onUse={onUse} onImprove={handleImprove} isImproving={improvingId === prompt.id} improvedText={improvements[prompt.id] || null} onClearImprovement={handleClearImprovement} />
                    ))}
                </div>
            )}
        </GeoPremiumCard>
    );
}

function SuggestedPromptRow({ prompt, onUse, onImprove, isImproving, improvedText, onClearImprovement }) {
    const mode = prompt.prompt_mode || prompt.prompt_metadata?.prompt_mode || 'user_like';
    const canImprove = prompt.quality_status !== 'strong';

    return (
        <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] px-4 py-3 transition-colors">
            <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-white/85 leading-relaxed">{prompt.query_text}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <QualityPill status={prompt.quality_status} />
                        <span className="text-[10px] text-white/30">{prompt.category}</span>
                        <span className="text-[10px] text-white/30">{PROMPT_MODE_LABELS[mode] || mode}</span>
                        {prompt.rationale && <span className="text-[10px] text-white/25 hidden md:inline">— {prompt.rationale}</span>}
                    </div>
                    {prompt.activation_blocked && (
                        <p className="text-[10px] text-amber-300/80 mt-1">Reformulez avant activation.</p>
                    )}
                </div>
                <div className="flex gap-1.5 shrink-0">
                    {canImprove && !improvedText && (
                        <button
                            type="button"
                            onClick={() => onImprove(prompt)}
                            disabled={isImproving}
                            className="geo-btn geo-btn-vio text-[10px] px-2.5 py-1 opacity-60 group-hover:opacity-100 transition-opacity"
                        >
                            {isImproving ? '…' : '✦ Améliorer'}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => onUse(prompt)}
                        className="geo-btn geo-btn-ghost text-[10px] px-2.5 py-1 opacity-60 group-hover:opacity-100 shrink-0 transition-opacity"
                    >
                        Utiliser
                    </button>
                </div>
            </div>

            {improvedText && (
                <div className="mt-2.5 rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-violet-300/80 uppercase tracking-[0.06em] mb-1">Version améliorée</p>
                            <p className="text-[13px] text-white/85 leading-relaxed">{improvedText}</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                            <button type="button" onClick={() => onUse({ ...prompt, query_text: improvedText })} className="geo-btn geo-btn-vio text-[10px] px-2 py-1">Utiliser</button>
                            <button type="button" onClick={() => onClearImprovement(prompt.id)} className="geo-btn geo-btn-ghost text-[10px] px-2 py-1">Ignorer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function TrackedPromptsList({
    prompts,
    categoryOptions,
    editingId,
    setEditingId,
    editingForm,
    setEditingForm,
    submitting,
    runningPromptId,
    onSave,
    onToggle,
    onDelete,
    onRun,
    onImprove,
    pendingRefineId,
    onClearPendingRefine,
    clientId,
    client,
}) {
    if (prompts.length === 0) return null;

    const active = prompts.filter((p) => p.is_active);
    const inactive = prompts.filter((p) => !p.is_active);

    return (
        <GeoPremiumCard className="p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                    <div className="text-sm font-semibold text-white/95">Prompts suivis</div>
                    <p className="text-[11px] text-white/35 mt-0.5">{active.length} actif{active.length > 1 ? 's' : ''}{inactive.length > 0 ? ` · ${inactive.length} inactif${inactive.length > 1 ? 's' : ''}` : ''}</p>
                </div>
            </div>

            <div className="divide-y divide-white/[0.05]">
                {active.map((prompt) => (
                    <TrackedPromptRow
                        key={prompt.id}
                        prompt={prompt}
                        categoryOptions={categoryOptions}
                        isEditing={editingId === prompt.id}
                        editingForm={editingForm}
                        setEditingForm={setEditingForm}
                        setEditingId={setEditingId}
                        submitting={submitting}
                        isRunning={runningPromptId === prompt.id}
                        onSave={onSave}
                        onToggle={onToggle}
                        onDelete={onDelete}
                        onRun={onRun}
                        onImprove={onImprove}
                        pendingRefineId={pendingRefineId}
                        onClearPendingRefine={onClearPendingRefine}
                        clientId={clientId}
                        client={client}
                    />
                ))}
                {inactive.length > 0 && active.length > 0 && (
                    <div className="px-5 py-2 bg-white/[0.015]">
                        <p className="text-[10px] font-semibold text-white/25 uppercase tracking-[0.06em]">Inactifs</p>
                    </div>
                )}
                {inactive.map((prompt) => (
                    <TrackedPromptRow
                        key={prompt.id}
                        prompt={prompt}
                        categoryOptions={categoryOptions}
                        isEditing={editingId === prompt.id}
                        editingForm={editingForm}
                        setEditingForm={setEditingForm}
                        setEditingId={setEditingId}
                        submitting={submitting}
                        isRunning={runningPromptId === prompt.id}
                        onSave={onSave}
                        onToggle={onToggle}
                        onDelete={onDelete}
                        onRun={onRun}
                        onImprove={onImprove}
                        pendingRefineId={pendingRefineId}
                        onClearPendingRefine={onClearPendingRefine}
                        clientId={clientId}
                        client={client}
                    />
                ))}
            </div>
        </GeoPremiumCard>
    );
}

function TrackedPromptRow({ prompt, categoryOptions, isEditing, editingForm, setEditingForm, setEditingId, submitting, isRunning, onSave, onToggle, onDelete, onRun, onImprove, pendingRefineId, onClearPendingRefine, clientId, client }) {
    const lifecycle = promptLifecycleLabel(prompt);
    const mode = resolvePromptMode(prompt);
    const execStatus = executionStatusMeta(prompt.last_run?.status);
    const isWeak = prompt.is_active && (prompt.quality_status === 'weak' || prompt.quality_status === 'review');

    /* ─ AI refine state for edit mode ─ */
    const [aiRefining, setAiRefining] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [aiError, setAiError] = useState(null);
    const didAutoRefine = useRef(false);
    const hasMinimumQuery = editingForm?.query_text?.trim().length >= 5;

    const handleEditAiRefine = useCallback(async () => {
        const rawText = editingForm?.query_text?.trim();
        if (!rawText || rawText.length < 5) return;
        setAiRefining(true);
        setAiSuggestion(null);
        setAiError(null);
        try {
            const suggestion = await fetchAiRefinement({ queryText: rawText, client, category: editingForm.category, promptMode: editingForm.prompt_mode });
            setAiSuggestion(suggestion);
        } catch {
            setAiError('Impossible de générer une suggestion.');
        } finally {
            setAiRefining(false);
        }
    }, [editingForm, client]);

    /* Auto-refine when entering edit mode via "Améliorer".
       Deps intentionally limited: we only want to trigger on edit mode entry or pendingRefine change,
       not on every keystroke in editingForm. handleEditAiRefine captures current editingForm via closure. */
    useEffect(() => {
        if (isEditing && pendingRefineId === prompt.id && !didAutoRefine.current && hasMinimumQuery) {
            didAutoRefine.current = true;
            onClearPendingRefine();
            handleEditAiRefine();
        }
        if (!isEditing) {
            didAutoRefine.current = false;
            setAiSuggestion(null);
            setAiError(null);
        }
    }, [isEditing, pendingRefineId]); // eslint-disable-line react-hooks/exhaustive-deps

    if (isEditing) {
        return (
            <div className="px-5 py-4 space-y-3 bg-white/[0.02]">
                <div className="flex flex-col sm:flex-row gap-2">
                    <input className="flex-1 bg-white/[0.04] border border-violet-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none" value={editingForm.query_text} onChange={(event) => setEditingForm((current) => ({ ...current, query_text: event.target.value }))} disabled={submitting} />
                    {hasMinimumQuery && (
                        <button
                            type="button"
                            onClick={handleEditAiRefine}
                            disabled={aiRefining || submitting}
                            className="geo-btn geo-btn-vio text-[11px] px-3 py-2.5 shrink-0"
                        >
                            {aiRefining ? 'Réflexion…' : '✦ Affiner avec IA'}
                        </button>
                    )}
                </div>

                {aiSuggestion && (
                    <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold text-violet-300/80 uppercase tracking-[0.06em] mb-1">Suggestion IA</p>
                                <p className="text-[13px] text-white/85 leading-relaxed">{aiSuggestion}</p>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                                <button type="button" onClick={() => { setEditingForm((c) => ({ ...c, query_text: aiSuggestion })); setAiSuggestion(null); }} className="geo-btn geo-btn-vio text-[10px] px-2 py-1">Utiliser</button>
                                <button type="button" onClick={() => setAiSuggestion(null)} className="geo-btn geo-btn-ghost text-[10px] px-2 py-1">Ignorer</button>
                            </div>
                        </div>
                    </div>
                )}

                {aiError && <p className="text-[11px] text-amber-400/80 px-1">{aiError}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select className="bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white focus:outline-none" value={editingForm.category} onChange={(event) => setEditingForm((current) => ({ ...current, category: event.target.value }))} disabled={submitting}>
                        {categoryOptions.map((option) => <option key={option.key} value={option.key} className="bg-[#101010]">{option.label}</option>)}
                    </select>
                    <input className="bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white focus:outline-none" value={editingForm.locale} onChange={(event) => setEditingForm((current) => ({ ...current, locale: event.target.value }))} disabled={submitting} />
                    <select className="bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-[12px] text-white focus:outline-none" value={editingForm.prompt_mode || 'user_like'} onChange={(event) => setEditingForm((current) => ({ ...current, prompt_mode: event.target.value }))} disabled={submitting}>
                        <option value="user_like" className="bg-[#101010]">Question naturelle</option>
                        <option value="operator_probe" className="bg-[#101010]">Sonde opérateur</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={() => onSave(prompt.id)} className="geo-btn geo-btn-pri" disabled={submitting || !editingForm.query_text.trim()}>Enregistrer</button>
                    <button type="button" onClick={() => setEditingId(null)} className="geo-btn geo-btn-ghost" disabled={submitting}>Annuler</button>
                </div>
            </div>
        );
    }

    const enterEditMode = () => {
        setEditingId(prompt.id);
        setEditingForm({ query_text: prompt.query_text, category: prompt.category, locale: prompt.locale, prompt_mode: mode, is_active: prompt.is_active });
    };

    return (
        <div className={`group px-4 md:px-5 py-3.5 hover:bg-white/[0.02] transition-colors ${!prompt.is_active ? 'opacity-50' : ''}`}>
            {/* Row 1 — status dot + prompt text + desktop-inline actions */}
            <div className="flex items-start gap-3">
                {/* Status dot */}
                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${promptStatusDotClass(prompt)}`} />

                {/* Content */}
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-white/90 leading-relaxed">{prompt.query_text}</p>

                    {/* Metadata: lifecycle (primary) · category · mode · execution (secondary) */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[10px]">
                        <span className={`font-semibold ${lifecycle.cls}`}>{lifecycle.text}</span>
                        <span className="text-white/30">{prompt.category_label}</span>
                        <span className="text-white/25">{PROMPT_MODE_LABELS[mode] || mode}</span>
                        {prompt.last_run && (
                            <>
                                <span className="text-white/30">
                                    Exécution : <span className="text-white/45">{execStatus.label.toLowerCase()}</span>
                                </span>
                                {prompt.last_run.target_found && <span className="text-emerald-400/80">Cible détectée</span>}
                                {prompt.last_run.run_signal_tier && <span className="text-white/30">{translateRunSignalTier(prompt.last_run.run_signal_tier)}</span>}
                            </>
                        )}
                        {!prompt.last_run && <span className="text-white/20">Jamais exécuté</span>}
                    </div>
                </div>

                {/* Actions — desktop only: inline, hover-reveal */}
                <div className="hidden md:flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isWeak && (
                        <button type="button" onClick={() => onImprove(prompt)} className="geo-btn geo-btn-vio text-[10px] px-2 py-1" disabled={submitting}>✦ Améliorer</button>
                    )}
                    <button type="button" onClick={() => onRun(prompt)} className="geo-btn geo-btn-ghost text-[10px] px-2 py-1" disabled={isRunning || submitting}>{isRunning ? '…' : 'Exécuter'}</button>
                    <button type="button" onClick={enterEditMode} className="geo-btn geo-btn-ghost text-[10px] px-2 py-1" disabled={submitting}>Modifier</button>
                    <button type="button" onClick={() => onToggle(prompt.id, !prompt.is_active)} className="geo-btn geo-btn-ghost text-[10px] px-2 py-1" disabled={submitting}>{prompt.is_active ? 'Pause' : 'Activer'}</button>
                    <button type="button" onClick={() => onDelete(prompt.id)} className="geo-btn geo-btn-ghost text-[10px] px-2 py-1 text-red-300/60 hover:text-red-300" disabled={submitting} aria-label="Supprimer">×</button>
                    <Link href={`/admin/clients/${clientId}/geo/runs?prompt=${prompt.id}`} className="geo-btn geo-btn-ghost text-[10px] px-2 py-1">Runs</Link>
                </div>
            </div>

            {/* Row 2 — mobile actions: visible below content, wrapping gracefully */}
            <div className="flex md:hidden flex-wrap items-center gap-1.5 mt-2.5 pl-5">
                {isWeak && (
                    <button type="button" onClick={() => onImprove(prompt)} className="geo-btn geo-btn-vio text-[10px] px-2.5 py-1.5" disabled={submitting}>✦ Améliorer</button>
                )}
                <button type="button" onClick={() => onRun(prompt)} className="geo-btn geo-btn-ghost text-[10px] px-2.5 py-1.5" disabled={isRunning || submitting}>{isRunning ? '…' : 'Exécuter'}</button>
                <button type="button" onClick={enterEditMode} className="geo-btn geo-btn-ghost text-[10px] px-2.5 py-1.5" disabled={submitting}>Modifier</button>
                <button type="button" onClick={() => onToggle(prompt.id, !prompt.is_active)} className="geo-btn geo-btn-ghost text-[10px] px-2.5 py-1.5" disabled={submitting}>{prompt.is_active ? 'Pause' : 'Activer'}</button>
                <button type="button" onClick={() => onDelete(prompt.id)} className="geo-btn geo-btn-ghost text-[10px] px-2.5 py-1.5 text-red-300/60 hover:text-red-300" disabled={submitting} aria-label="Supprimer">×</button>
                <Link href={`/admin/clients/${clientId}/geo/runs?prompt=${prompt.id}`} className="geo-btn geo-btn-ghost text-[10px] px-2.5 py-1.5">Runs</Link>
            </div>
        </div>
    );
}

/* ─── Main View ─── */

export default function GeoPromptsView() {
    const { clientId, invalidateWorkspace, client } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('prompts');
    const [form, setForm] = useState(DEFAULT_FORM);
    const [editingId, setEditingId] = useState(null);
    const [editingForm, setEditingForm] = useState(DEFAULT_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [runningPromptId, setRunningPromptId] = useState(null);
    const [runningBatch, setRunningBatch] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [actionNotice, setActionNotice] = useState(null);
    const [pendingRefineId, setPendingRefineId] = useState(null);

    const categoryOptions = data?.categoryOptions || [];
    const prompts = data?.prompts || [];
    const starterPrompts = data?.starterPack?.prompts || [];
    const hasActivePrompt = prompts.some((prompt) => prompt.is_active);

    function clearMessages() {
        setActionError(null);
        setActionNotice(null);
    }

    async function handleCreate(event) {
        event.preventDefault();
        if (!clientId || !form.query_text.trim()) return;
        setSubmitting(true);
        clearMessages();
        try {
            const response = await fetch('/api/admin/queries/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId,
                    query_text: form.query_text.trim(),
                    category: form.category,
                    query_type: form.category,
                    locale: form.locale,
                    prompt_mode: form.prompt_mode,
                    is_active: form.is_active,
                }),
            });
            const json = await parseJsonResponse(response);
            setForm(DEFAULT_FORM);
            setActionNotice(json.warning || 'Prompt suivi créé avec succès.');
            invalidateWorkspace();
        } catch (submitError) {
            setActionError(submitError.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleSave(promptId) {
        setSubmitting(true);
        clearMessages();
        try {
            const response = await fetch('/api/admin/queries/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: promptId,
                    query_text: editingForm.query_text.trim(),
                    category: editingForm.category,
                    query_type: editingForm.category,
                    locale: editingForm.locale,
                    prompt_mode: editingForm.prompt_mode || 'user_like',
                }),
            });
            const json = await parseJsonResponse(response);
            setEditingId(null);
            setActionNotice(json.warning || 'Prompt suivi mis à jour.');
            invalidateWorkspace();
        } catch (submitError) {
            setActionError(submitError.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleToggle(promptId, nextState) {
        setSubmitting(true);
        clearMessages();
        try {
            const response = await fetch('/api/admin/queries/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: promptId, is_active: nextState }),
            });
            await parseJsonResponse(response);
            setActionNotice(nextState ? 'Prompt activé.' : 'Prompt désactivé.');
            invalidateWorkspace();
        } catch (submitError) {
            setActionError(submitError.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(promptId) {
        if (!window.confirm('Supprimer ce prompt suivi ?')) return;
        setSubmitting(true);
        clearMessages();
        try {
            const response = await fetch('/api/admin/queries/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: promptId }),
            });
            await parseJsonResponse(response);
            if (editingId === promptId) setEditingId(null);
            setActionNotice('Prompt suivi supprimé.');
            invalidateWorkspace();
        } catch (submitError) {
            setActionError(submitError.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleRun(prompt) {
        setRunningPromptId(prompt.id);
        clearMessages();
        try {
            const response = await fetch('/api/admin/queries/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId, trackedQueryId: prompt.id }),
            });
            const json = await parseJsonResponse(response);
            const runRows = Array.isArray(json.runs) ? json.runs : [];
            const failedCount = runRows.filter((item) => item.error).length;
            if (failedCount === 0) setActionNotice(`Exécution terminée pour « ${prompt.query_text} ».`);
            else setActionError(buildOperatorRunErrorMessage(`Exécution terminée avec erreurs pour « ${prompt.query_text} ».`, runRows));
            invalidateWorkspace();
        } catch (runError) {
            setActionError(runError.message);
        } finally {
            setRunningPromptId(null);
        }
    }

    async function handleRunAll() {
        setRunningBatch(true);
        clearMessages();
        try {
            const response = await fetch('/api/admin/queries/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId }),
            });
            const json = await parseJsonResponse(response);
            const runRows = Array.isArray(json.runs) ? json.runs : [];
            const successCount = runRows.filter((item) => !item.error).length;
            const failedCount = runRows.filter((item) => item.error).length;
            if (failedCount === 0) setActionNotice(`Exécution terminée : ${successCount} succès.`);
            else setActionError(buildOperatorRunErrorMessage(`Exécution terminée : ${successCount} succès, ${failedCount} échec(s).`, runRows));
            invalidateWorkspace();
        } catch (runError) {
            setActionError(runError.message);
        } finally {
            setRunningBatch(false);
        }
    }

    function handleUseSuggestion(prompt) {
        setForm((current) => ({
            ...current,
            query_text: prompt.query_text,
            category: prompt.category || current.category,
            locale: prompt.locale || current.locale,
            prompt_mode: prompt.prompt_mode || current.prompt_mode,
        }));
    }

    function handleImprove(prompt) {
        const mode = resolvePromptMode(prompt);
        setEditingId(prompt.id);
        setEditingForm({ query_text: prompt.query_text, category: prompt.category, locale: prompt.locale, prompt_mode: mode, is_active: prompt.is_active });
        setPendingRefineId(prompt.id);
    }

    if (loading) return <div className="p-8 text-center text-white/30 text-sm">Chargement…</div>;
    if (error) return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    if (!data) return <div className="p-4 md:p-6 max-w-[1600px] mx-auto"><GeoEmptyPanel title="Prompts indisponibles" description="L&apos;espace prompts suivis n&apos;a pas pu être chargé." /></div>;

    return (
        <div className="p-4 md:p-6 space-y-4 max-w-[1550px] mx-auto">
            {/* 1. Command header — premium hero */}
            <PromptCommandHeader
                client={client}
                summary={data.summary}
                hasActivePrompt={hasActivePrompt}
                runningBatch={runningBatch}
                submitting={submitting}
                onRunAll={handleRunAll}
                clientId={clientId}
            />

            {/* 2. Overview band — 4 essential KPIs */}
            <PromptOverviewBand summary={data.summary} />

            {/* 3. Prompt creation — assisted with Mistral */}
            <PromptCreationSurface
                form={form}
                setForm={setForm}
                categoryOptions={categoryOptions}
                submitting={submitting}
                onSubmit={handleCreate}
                clientId={clientId}
                client={client}
                actionNotice={actionNotice}
                actionError={actionError}
            />

            {/* 4. AI prompt list generation — curated batch from business objective */}
            <AiPromptListSurface
                client={client}
                clientId={clientId}
                invalidateWorkspace={invalidateWorkspace}
                categoryOptions={categoryOptions}
                submitting={submitting}
            />

            {/* 6. Suggested prompts — prioritized, with AI improvement */}
            <SuggestedPromptPack
                suggestions={starterPrompts}
                onUse={handleUseSuggestion}
                client={client}
            />

            {/* 7. Tracked prompts — clean list with AI-assisted improvement */}
            {prompts.length === 0 ? (
                <GeoEmptyPanel title={data.emptyState.title} description={data.emptyState.description} />
            ) : (
                <TrackedPromptsList
                    prompts={prompts}
                    categoryOptions={categoryOptions}
                    editingId={editingId}
                    setEditingId={setEditingId}
                    editingForm={editingForm}
                    setEditingForm={setEditingForm}
                    submitting={submitting}
                    runningPromptId={runningPromptId}
                    onSave={handleSave}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onRun={handleRun}
                    onImprove={handleImprove}
                    pendingRefineId={pendingRefineId}
                    onClearPendingRefine={() => setPendingRefineId(null)}
                    clientId={clientId}
                    client={client}
                />
            )}
        </div>
    );
}

