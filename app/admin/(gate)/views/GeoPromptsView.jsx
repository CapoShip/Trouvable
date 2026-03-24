'use client';

import { useState } from 'react';
import Link from 'next/link';

import { GeoEmptyPanel, GeoKpiCard, GeoPremiumCard, GeoProvenancePill, GeoSectionTitle } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import { ADMIN_GEO_LABELS, runStatusLabelFr } from '@/lib/i18n/admin-fr';

const DEFAULT_FORM = {
    query_text: '',
    category: 'discovery',
    locale: 'fr-CA',
    is_active: true,
};

function formatDateTime(value) {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return '-';
    }
}

function statusPillClass(status) {
    if (status === 'completed') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
    if (status === 'running') return 'border-violet-400/20 bg-violet-400/10 text-violet-300';
    if (status === 'pending') return 'border-amber-400/20 bg-amber-400/10 text-amber-300';
    if (status === 'failed') return 'border-red-400/20 bg-red-400/10 text-red-300';
    return 'border-white/10 bg-white/[0.03] text-white/50';
}

function qualityPillClass(status) {
    if (status === 'strong') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
    if (status === 'review') return 'border-amber-400/20 bg-amber-400/10 text-amber-300';
    return 'border-red-400/20 bg-red-400/10 text-red-300';
}

function qualityLabel(status) {
    if (status === 'strong') return 'Qualite forte';
    if (status === 'review') return 'A revoir';
    return 'Qualite faible';
}

async function parseJsonResponse(response) {
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(json.error || `Erreur ${response.status}`);
    }
    return json;
}

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
    const latestStatusCounts = data?.summary?.latestStatusCounts || { completed: 0, failed: 0, running: 0, pending: 0, no_run: 0 };

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
            setActionNotice(nextState ? 'Prompt active.' : 'Prompt desactive.');
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
            setActionNotice('Prompt suivi supprime.');
            invalidateWorkspace();
        } catch (submitError) {
            setActionError(submitError.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function runQueries(payload, promptLabel = 'les prompts actifs') {
        clearMessages();
        try {
            const response = await fetch('/api/admin/queries/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const json = await parseJsonResponse(response);
            const runRows = Array.isArray(json.runs) ? json.runs : [];
            const successCount = runRows.filter((item) => !item.error).length;
            const failedCount = runRows.filter((item) => item.error).length;
            if (failedCount === 0) setActionNotice(`Exécution terminée pour ${promptLabel}: ${successCount} succès.`);
            else setActionError(`Exécution terminée avec erreurs pour ${promptLabel}: ${successCount} succès, ${failedCount} échec(s).`);
            invalidateWorkspace();
        } catch (runError) {
            setActionError(runError.message);
        }
    }

    if (loading) return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement...</div>;
    if (error) return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    if (!data) return <div className="p-4 md:p-6 max-w-[1600px] mx-auto"><GeoEmptyPanel title="Prompts indisponibles" description="L'espace prompts suivis n'a pas pu être chargé." /></div>;

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1550px] mx-auto">
            <GeoSectionTitle
                title={ADMIN_GEO_LABELS.nav.prompts}
                subtitle={`Espace opérateur pour ${client?.client_name || 'ce client'}. Les résultats proviennent uniquement des exécutions observées.`}
                action={(
                    <div className="flex flex-wrap gap-2">
                        <GeoProvenancePill meta={data.provenance?.observéd} />
                        <GeoProvenancePill meta={data.provenance?.dérivéd} />
                        <GeoProvenancePill meta={data.provenance?.inferred} />
                        <button type="button" className="geo-btn geo-btn-pri" disabled={!hasActivePrompt || runningBatch || submitting} onClick={async () => { setRunningBatch(true); await runQueries({ clientId }); setRunningBatch(false); }}>
                            {runningBatch ? 'Exécution...' : ADMIN_GEO_LABELS.actions.runActivePrompts}
                        </button>
                        <Link href={`/admin/clients/${clientId}/runs`} className="geo-btn geo-btn-ghost">{ADMIN_GEO_LABELS.nav.runHistory}</Link>
                    </div>
                )}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                <GeoKpiCard label="Total prompts suivis" value={data.summary.total} hint="Prompts suivis stockes" />
                <GeoKpiCard label="Actifs" value={data.summary.active} hint="Prets a exécutér" accent="emerald" />
                <GeoKpiCard label="Sans exécution" value={data.summary.noRunYet} hint="En attente de premiere exécution" accent="amber" />
                <GeoKpiCard label="Taux cible détectée" value={data.summary.mentionRatePercent != null ? `${data.summary.mentionRatePercent}%` : null} hint="Dernière exécution par prompt" accent="violet" />
                <GeoKpiCard label="Dernier statut: terminée" value={latestStatusCounts.completed} hint="Statut le plus récent" accent="blue" />
                <GeoKpiCard label="Dernier statut: échec" value={latestStatusCounts.failed} hint="Statut le plus récent" accent="amber" />
                <GeoKpiCard label="Dernier statut: en cours" value={latestStatusCounts.running} hint="Statut le plus récent" accent="violet" />
                <GeoKpiCard label="Prompts faibles" value={data.summary.weakPromptCount || 0} hint="Revue operateur requise" accent="amber" />
            </div>

            <GeoPremiumCard className="p-5">
                <div className="text-sm font-semibold text-white/95 mb-3">Ajouter un prompt suivi</div>
                <form onSubmit={handleCreate} className="grid gap-3 lg:grid-cols-[1.8fr_180px_120px_auto]">
                    <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" value={form.query_text} onChange={(event) => setForm((current) => ({ ...current, query_text: event.target.value }))} placeholder="Ex. meilleur plombier a Quebec" disabled={submitting} />
                    <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} disabled={submitting}>
                        {categoryOptions.map((option) => <option key={option.key} value={option.key} className="bg-[#101010]">{option.label}</option>)}
                    </select>
                    <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" value={form.locale} onChange={(event) => setForm((current) => ({ ...current, locale: event.target.value }))} disabled={submitting} />
                    <button type="submit" disabled={submitting || !form.query_text.trim()} className="geo-btn geo-btn-pri justify-center">Ajouter</button>
                </form>
                {actionNotice && <div className="text-sm text-emerald-300 mt-3">{actionNotice}</div>}
                {actionError && <div className="text-sm text-red-400 mt-3">{actionError}</div>}
            </GeoPremiumCard>

            {starterPrompts.length > 0 ? (
                <GeoPremiumCard className="p-5">
                    <div className="text-sm font-semibold text-white/95 mb-3">Pack de prompts suggere</div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {starterPrompts.map((prompt) => (
                            <div key={prompt.id} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                                <div className="text-sm font-semibold text-white/90">{prompt.query_text}</div>
                                <div className="text-[11px] text-white/45 mt-1">{prompt.category} - {prompt.locale}</div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${qualityPillClass(prompt.quality_status)}`}>
                                        {qualityLabel(prompt.quality_status)}
                                    </span>
                                    <span className="text-[10px] text-white/45">Score {prompt.quality_score ?? '-'}</span>
                                </div>
                                <div className="text-[11px] text-white/40 mt-2">{prompt.rationale}</div>
                                {Array.isArray(prompt.quality_reasons) && prompt.quality_reasons.length > 0 ? (
                                    <div className="text-[11px] text-white/45 mt-2">{prompt.quality_reasons[0]}</div>
                                ) : null}
                                {prompt.activation_blocked ? (
                                    <div className="text-[11px] text-amber-300 mt-2">Prompt faible: revisez le texte avant activation.</div>
                                ) : null}
                                <button type="button" onClick={() => setForm((current) => ({ ...current, query_text: prompt.query_text, category: prompt.category, locale: prompt.locale || current.locale }))} className="geo-btn geo-btn-ghost mt-3">Utiliser dans le formulaire</button>
                            </div>
                        ))}
                    </div>
                </GeoPremiumCard>
            ) : null}

            {prompts.length === 0 ? (
                <GeoEmptyPanel title={data.emptyState.title} description={data.emptyState.description} />
            ) : (
                <GeoPremiumCard className="p-0 overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/[0.08] bg-black/25 text-sm font-semibold text-white/95">Prompts suivis ({prompts.length})</div>
                    <div className="divide-y divide-white/[0.06]">
                        {prompts.map((prompt) => {
                            const isEditing = editingId === prompt.id;
                            return (
                                <div key={prompt.id} className="px-5 py-4 space-y-3">
                                    {isEditing ? (
                                        <div className="space-y-3">
                                            <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" value={editingForm.query_text} onChange={(event) => setEditingForm((current) => ({ ...current, query_text: event.target.value }))} disabled={submitting} />
                                            <div className="grid grid-cols-2 gap-3">
                                                <select className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" value={editingForm.category} onChange={(event) => setEditingForm((current) => ({ ...current, category: event.target.value }))} disabled={submitting}>
                                                    {categoryOptions.map((option) => <option key={option.key} value={option.key} className="bg-[#101010]">{option.label}</option>)}
                                                </select>
                                                <input className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" value={editingForm.locale} onChange={(event) => setEditingForm((current) => ({ ...current, locale: event.target.value }))} disabled={submitting} />
                                            </div>
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => handleSave(prompt.id)} className="geo-btn geo-btn-pri" disabled={submitting || !editingForm.query_text.trim()}>Enregistrer</button>
                                                <button type="button" onClick={() => setEditingId(null)} className="geo-btn geo-btn-ghost" disabled={submitting}>Annuler</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex flex-col lg:flex-row lg:items-start gap-3 justify-between">
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold text-white/90">{prompt.query_text}</div>
                                                    <div className="text-[11px] text-white/35 mt-1">{prompt.category_label} - {prompt.locale} - {prompt.is_active ? 'actif' : 'inactif'}</div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${qualityPillClass(prompt.quality_status)}`}>{qualityLabel(prompt.quality_status)}</span>
                                                    <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${statusPillClass(prompt.last_run?.status)}`}>{runStatusLabelFr(prompt.last_run?.status)}</span>
                                                </div>
                                            </div>
                                            <div className="text-[11px] text-white/45">Dernière exécution: {prompt.last_run ? formatDateTime(prompt.last_run.created_at) : 'Aucune exécution'} - Confiance parse: {prompt.last_run?.parse_confidence != null ? `${Math.round(prompt.last_run.parse_confidence * 100)}%` : '-'}</div>
                                            {Array.isArray(prompt.quality_reasons) && prompt.quality_reasons.length > 0 ? (
                                                <ul className="text-[11px] text-white/55 space-y-1">
                                                    {prompt.quality_reasons.slice(0, 3).map((reason, index) => <li key={`${reason}-${index}`}>- {reason}</li>)}
                                                </ul>
                                            ) : null}
                                            <div className="flex flex-wrap gap-2">
                                                <button type="button" onClick={async () => { setRunningPromptId(prompt.id); await runQueries({ clientId, trackedQueryId: prompt.id }, `\"${prompt.query_text}\"`); setRunningPromptId(null); }} className="geo-btn geo-btn-pri" disabled={runningPromptId === prompt.id || submitting}>{runningPromptId === prompt.id ? 'Exécution...' : ADMIN_GEO_LABELS.actions.runNow}</button>
                                                <button type="button" onClick={() => { setEditingId(prompt.id); setEditingForm({ query_text: prompt.query_text, category: prompt.category, locale: prompt.locale, is_active: prompt.is_active }); }} className="geo-btn geo-btn-ghost" disabled={submitting}>{ADMIN_GEO_LABELS.actions.edit}</button>
                                                <button type="button" onClick={() => handleToggle(prompt.id, !prompt.is_active)} className="geo-btn geo-btn-ghost" disabled={submitting}>{prompt.is_active ? 'Desactiver' : 'Activer'}</button>
                                                <button type="button" onClick={() => handleDelete(prompt.id)} className="geo-btn geo-btn-ghost text-red-300 border-red-300/20" disabled={submitting}>Supprimer</button>
                                                <Link href={`/admin/clients/${clientId}/runs?prompt=${prompt.id}`} className="geo-btn geo-btn-ghost">{ADMIN_GEO_LABELS.nav.runHistory}</Link>
                                                <Link href={`/admin/clients/${clientId}/citations`} className="geo-btn geo-btn-ghost">Citations</Link>
                                                <Link href={`/admin/clients/${clientId}/competitors`} className="geo-btn geo-btn-ghost">Concurrents</Link>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </GeoPremiumCard>
            )}
        </div>
    );
}



