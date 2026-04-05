'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';

import { GeoEmptyPanel, GeoKpiCard, GeoPremiumCard } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import { ADMIN_GEO_LABELS } from '@/lib/i18n/admin-fr';
import { translateRunSignalTier } from '@/lib/i18n/run-diagnostics-fr';
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

function executionStatusMeta(status) {
    if (status === 'completed') return { label: 'Terminée', cls: 'text-emerald-400', dot: 'bg-emerald-400' };
    if (status === 'running') return { label: 'En cours', cls: 'text-violet-400', dot: 'bg-violet-400' };
    if (status === 'pending') return { label: 'En attente', cls: 'text-amber-400', dot: 'bg-amber-400' };
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
                    <Link href={`/admin/clients/${clientId}/runs`} className="geo-btn geo-btn-ghost">{ADMIN_GEO_LABELS.nav.runHistory}</Link>
                    <Link href={`/admin/clients/${clientId}/signals`} className="geo-btn geo-btn-ghost">Signaux</Link>
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

    const handleAiRefine = useCallback(async () => {
        const rawText = form.query_text.trim();
        if (!rawText || rawText.length < 5) return;
        setAiRefining(true);
        setAiSuggestion(null);
        try {
            const response = await fetch('/api/admin/clients/onboarding/suggest-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    current_query: rawText,
                    business_name: client?.client_name || '',
                    business_type: client?.business_type || '',
                    target_region: client?.address?.city || client?.target_region || '',
                    seo_description: client?.seo_description || '',
                    services: Array.isArray(client?.business_details?.services) ? client.business_details.services.join(', ') : '',
                    intent_family: form.category,
                    prompt_mode: form.prompt_mode,
                }),
            });
            const json = await parseJsonResponse(response);
            if (json.suggestion) setAiSuggestion(json.suggestion);
        } catch {
            setAiSuggestion(null);
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
                <div className="relative">
                    <input
                        className="w-full bg-white/[0.04] border border-white/[0.10] rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-violet-500/40 focus:outline-none transition-colors"
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
                            className="absolute right-2 top-1/2 -translate-y-1/2 geo-btn geo-btn-vio text-[10px] px-2.5 py-1"
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
                                <button type="button" onClick={() => { setForm((c) => ({ ...c, query_text: aiSuggestion })); setAiSuggestion(null); }} className="geo-btn geo-btn-vio text-[10px] px-2 py-1">Utiliser</button>
                                <button type="button" onClick={() => setAiSuggestion(null)} className="geo-btn geo-btn-ghost text-[10px] px-2 py-1">Ignorer</button>
                            </div>
                        </div>
                    </div>
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

function SuggestedPromptPack({ suggestions, onUse }) {
    if (!suggestions || suggestions.length === 0) return null;
    const sorted = prioritySortSuggestions(suggestions);
    const strong = sorted.filter((p) => p.quality_status === 'strong');
    const rest = sorted.filter((p) => p.quality_status !== 'strong');

    return (
        <GeoPremiumCard className="p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                    <div className="text-sm font-semibold text-white/95">Prompts suggérés</div>
                    <p className="text-[11px] text-white/40 mt-0.5">Suggestions basées sur le profil métier — les plus pertinentes en premier.</p>
                </div>
                <span className="text-[10px] text-white/30 tabular-nums">{suggestions.length} disponible{suggestions.length > 1 ? 's' : ''}</span>
            </div>

            {strong.length > 0 && (
                <div className="space-y-2 mb-3">
                    <p className="text-[10px] font-semibold text-emerald-400/70 uppercase tracking-[0.06em]">Recommandés</p>
                    {strong.map((prompt) => (
                        <SuggestedPromptRow key={prompt.id} prompt={prompt} onUse={onUse} />
                    ))}
                </div>
            )}

            {rest.length > 0 && (
                <div className="space-y-2">
                    {strong.length > 0 && <p className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.06em] mt-2">Autres suggestions</p>}
                    {rest.map((prompt) => (
                        <SuggestedPromptRow key={prompt.id} prompt={prompt} onUse={onUse} />
                    ))}
                </div>
            )}
        </GeoPremiumCard>
    );
}

function SuggestedPromptRow({ prompt, onUse }) {
    const mode = prompt.prompt_mode || prompt.prompt_metadata?.prompt_mode || 'user_like';
    return (
        <div className="group flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] px-4 py-3 transition-colors">
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
            <button
                type="button"
                onClick={() => onUse(prompt)}
                className="geo-btn geo-btn-ghost text-[10px] px-2.5 py-1 opacity-60 group-hover:opacity-100 shrink-0 transition-opacity"
            >
                Utiliser
            </button>
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
    clientId,
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
                        clientId={clientId}
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
                        clientId={clientId}
                    />
                ))}
            </div>
        </GeoPremiumCard>
    );
}

function TrackedPromptRow({ prompt, categoryOptions, isEditing, editingForm, setEditingForm, setEditingId, submitting, isRunning, onSave, onToggle, onDelete, onRun, clientId }) {
    const lifecycle = promptLifecycleLabel(prompt);
    const mode = resolvePromptMode(prompt);
    const execStatus = executionStatusMeta(prompt.last_run?.status);

    if (isEditing) {
        return (
            <div className="px-5 py-4 space-y-3 bg-white/[0.02]">
                <input className="w-full bg-white/[0.04] border border-violet-500/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none" value={editingForm.query_text} onChange={(event) => setEditingForm((current) => ({ ...current, query_text: event.target.value }))} disabled={submitting} />
                <div className="grid grid-cols-3 gap-3">
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

    return (
        <div className={`group px-5 py-3.5 hover:bg-white/[0.02] transition-colors ${!prompt.is_active ? 'opacity-50' : ''}`}>
            <div className="flex items-start gap-3">
                {/* Status dot */}
                <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${prompt.is_active ? (prompt.quality_status === 'strong' ? 'bg-emerald-400' : prompt.quality_status === 'weak' ? 'bg-red-400' : 'bg-amber-400') : 'bg-white/15'}`} />

                {/* Content */}
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-white/90 leading-relaxed">{prompt.query_text}</p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[10px]">
                        <span className={`font-semibold ${lifecycle.cls}`}>{lifecycle.text}</span>
                        <span className="text-white/30">{prompt.category_label}</span>
                        <span className="text-white/25">{PROMPT_MODE_LABELS[mode] || mode}</span>
                        {prompt.last_run && (
                            <>
                                <span className="flex items-center gap-1">
                                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${execStatus.dot}`} />
                                    <span className={execStatus.cls}>{execStatus.label}</span>
                                </span>
                                {prompt.last_run.target_found && <span className="text-emerald-400">Cible détectée</span>}
                                {prompt.last_run.run_signal_tier && <span className="text-white/35">{translateRunSignalTier(prompt.last_run.run_signal_tier)}</span>}
                            </>
                        )}
                        {!prompt.last_run && <span className="text-white/20">Jamais exécuté</span>}
                    </div>
                </div>

                {/* Actions — compact, appear on hover on desktop */}
                <div className="flex items-center gap-1.5 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={() => onRun(prompt)} className="geo-btn geo-btn-ghost text-[10px] px-2 py-1" disabled={isRunning || submitting}>{isRunning ? '…' : 'Exécuter'}</button>
                    <button type="button" onClick={() => { setEditingId(prompt.id); setEditingForm({ query_text: prompt.query_text, category: prompt.category, locale: prompt.locale, prompt_mode: mode, is_active: prompt.is_active }); }} className="geo-btn geo-btn-ghost text-[10px] px-2 py-1" disabled={submitting}>Modifier</button>
                    <button type="button" onClick={() => onToggle(prompt.id, !prompt.is_active)} className="geo-btn geo-btn-ghost text-[10px] px-2 py-1" disabled={submitting}>{prompt.is_active ? 'Pause' : 'Activer'}</button>
                    <button type="button" onClick={() => onDelete(prompt.id)} className="geo-btn geo-btn-ghost text-[10px] px-2 py-1 text-red-300/60 hover:text-red-300" disabled={submitting}>×</button>
                    <Link href={`/admin/clients/${clientId}/runs?prompt=${prompt.id}`} className="geo-btn geo-btn-ghost text-[10px] px-2 py-1">Runs</Link>
                </div>
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
            else setActionError(`Exécution terminée avec erreurs pour « ${prompt.query_text} ».`);
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
            else setActionError(`Exécution terminée : ${successCount} succès, ${failedCount} échec(s).`);
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
            category: prompt.category,
            locale: prompt.locale || current.locale,
        }));
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

            {/* 4. Suggested prompts — prioritized */}
            <SuggestedPromptPack
                suggestions={starterPrompts}
                onUse={handleUseSuggestion}
            />

            {/* 5. Tracked prompts — clean list */}
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
                    clientId={clientId}
                />
            )}
        </div>
    );
}

