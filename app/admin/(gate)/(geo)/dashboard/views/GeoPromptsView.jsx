'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { GeoEmptyPanel, GeoKpiCard, GeoPremiumCard, GeoProvenancePill, GeoSectionTitle } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../../context/GeoClientContext';

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

function statusLabel(status) {
    if (status === 'completed') return 'Completed';
    if (status === 'running') return 'Running';
    if (status === 'pending') return 'Pending';
    if (status === 'failed') return 'Failed';
    return 'No run';
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
    const latestStatusCounts = data?.summary?.latestStatusCounts || {
        completed: 0,
        failed: 0,
        running: 0,
        pending: 0,
        no_run: 0,
    };

    const promptsByCategory = useMemo(() => {
        const buckets = new Map();
        for (const item of prompts) {
            if (!buckets.has(item.category)) buckets.set(item.category, []);
            buckets.get(item.category).push(item);
        }
        return buckets;
    }, [prompts]);

    const hasActivePrompt = useMemo(() => prompts.some((prompt) => prompt.is_active), [prompts]);

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
            await parseJsonResponse(response);
            setForm(DEFAULT_FORM);
            setActionNotice('Tracked prompt cree avec succes.');
            invalidateWorkspace();
        } catch (submitError) {
            setActionError(submitError.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleToggle(id, isActive) {
        setSubmitting(true);
        clearMessages();
        try {
            const response = await fetch('/api/admin/queries/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_active: isActive }),
            });
            await parseJsonResponse(response);
            setActionNotice(isActive ? 'Prompt active.' : 'Prompt desactive.');
            invalidateWorkspace();
        } catch (submitError) {
            setActionError(submitError.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm('Supprimer ce tracked prompt ?')) return;
        setSubmitting(true);
        clearMessages();
        try {
            const response = await fetch('/api/admin/queries/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            await parseJsonResponse(response);
            if (editingId === id) setEditingId(null);
            setActionNotice('Tracked prompt supprime.');
            invalidateWorkspace();
        } catch (submitError) {
            setActionError(submitError.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleSave(id) {
        setSubmitting(true);
        clearMessages();
        try {
            const response = await fetch('/api/admin/queries/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    query_text: editingForm.query_text.trim(),
                    category: editingForm.category,
                    query_type: editingForm.category,
                    locale: editingForm.locale,
                }),
            });
            await parseJsonResponse(response);
            setEditingId(null);
            setActionNotice('Tracked prompt mis a jour.');
            invalidateWorkspace();
        } catch (submitError) {
            setActionError(submitError.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function runQueries(payload, options = {}) {
        const { promptLabel = 'les prompts selectionnes' } = options;
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

            if (runRows.length === 0) {
                setActionNotice(json.message || 'Aucun run lance.');
            } else if (failedCount === 0) {
                setActionNotice(`Run termine pour ${promptLabel}: ${successCount} succes.`);
            } else {
                setActionError(`Run termine avec erreurs pour ${promptLabel}: ${successCount} succes, ${failedCount} echec(s).`);
            }

            invalidateWorkspace();
        } catch (runError) {
            setActionError(runError.message);
        }
    }

    async function handleRunNowPrompt(prompt) {
        if (!clientId) return;
        setRunningPromptId(prompt.id);
        await runQueries(
            { clientId, trackedQueryId: prompt.id },
            { promptLabel: `"${prompt.query_text}"` }
        );
        setRunningPromptId(null);
    }

    async function handleRunNowActiveBatch() {
        if (!clientId) return;
        setRunningBatch(true);
        await runQueries({ clientId }, { promptLabel: 'les prompts actifs' });
        setRunningBatch(false);
    }

    function startEdit(prompt) {
        setEditingId(prompt.id);
        setEditingForm({
            query_text: prompt.query_text,
            category: prompt.category,
            locale: prompt.locale,
            is_active: prompt.is_active,
        });
    }

    function applyStarterPrompt(prompt) {
        setForm((current) => ({
            ...current,
            query_text: prompt.query_text,
            category: prompt.category,
            locale: prompt.locale || current.locale,
        }));
        setActionNotice('Suggestion chargee dans le formulaire. Verifiez puis ajoutez.');
        setActionError(null);
    }

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    }

    if (!data) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <GeoEmptyPanel title="Prompts indisponibles" description="Le workspace de prompts n'a pas pu etre charge." />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1550px] mx-auto">
            <GeoSectionTitle
                title="Prompt workspace"
                subtitle={`Workspace operateur pour ${client?.client_name || 'ce client'}. Les resultats ci-dessous viennent uniquement des tracked runs observes.`}
                action={(
                    <div className="flex flex-wrap gap-2">
                        <GeoProvenancePill meta={data.provenance?.observed} />
                        <GeoProvenancePill meta={data.provenance?.derived} />
                        <GeoProvenancePill meta={data.provenance?.inferred} />
                        <button
                            type="button"
                            className="geo-btn geo-btn-pri"
                            disabled={!hasActivePrompt || runningBatch || submitting}
                            onClick={handleRunNowActiveBatch}
                        >
                            {runningBatch ? 'Execution...' : 'Run active prompts'}
                        </button>
                        <Link href={`/admin/dashboard/${clientId}?view=runs`} className="geo-btn geo-btn-ghost">
                            Runs view
                        </Link>
                    </div>
                )}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                <GeoKpiCard label="Total prompts" value={data.summary.total} hint="Stored tracked prompts" />
                <GeoKpiCard label="Active" value={data.summary.active} hint="Ready to run" accent="emerald" />
                <GeoKpiCard label="No run yet" value={data.summary.noRunYet} hint="Waiting first observed run" accent="amber" />
                <GeoKpiCard label="Target found rate" value={data.summary.mentionRatePercent != null ? `${data.summary.mentionRatePercent}%` : null} hint="Latest run per prompt" accent="violet" />
                <GeoKpiCard label="Latest completed" value={latestStatusCounts.completed} hint="Prompt latest status" accent="blue" />
                <GeoKpiCard label="Latest failed" value={latestStatusCounts.failed} hint="Prompt latest status" accent="amber" />
                <GeoKpiCard label="Latest running" value={latestStatusCounts.running} hint="Prompt latest status" accent="violet" />
                <GeoKpiCard label="Latest pending" value={latestStatusCounts.pending} hint="Prompt latest status" accent="amber" />
            </div>

            <GeoPremiumCard className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white/85">Tracked-run truth</span>
                    <GeoProvenancePill meta={data.provenance?.observed} />
                </div>
                <p className="text-[12px] text-white/45 mt-2">
                    Prompts in this workspace drive stored run observations and downstream intelligence views. These metrics are not universal market truth.
                </p>
            </GeoPremiumCard>

            <GeoPremiumCard className="p-5">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div>
                        <div className="text-sm font-semibold text-white/95">Starter prompt pack</div>
                        <p className="text-[11px] text-white/35">
                            Inferred suggestions from current client profile and detected site type: {data.siteContext?.siteTypeLabel || 'unknown'}.
                        </p>
                    </div>
                    <GeoProvenancePill meta={data.provenance?.inferred} />
                </div>

                {starterPrompts.length === 0 ? (
                    <GeoEmptyPanel title={data.starterPack?.title || 'Starter pack deja couvert'} description={data.starterPack?.description || 'No additional starter prompts suggested.'} />
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {starterPrompts.map((prompt) => (
                            <div key={prompt.id} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                                <div className="text-sm font-semibold text-white/90">{prompt.query_text}</div>
                                <div className="text-[11px] text-white/45 mt-1">{prompt.category} · {prompt.locale}</div>
                                <div className="text-[11px] text-white/40 mt-2">{prompt.rationale}</div>
                                <div className="mt-3">
                                    <button
                                        type="button"
                                        onClick={() => applyStarterPrompt(prompt)}
                                        className="geo-btn geo-btn-ghost"
                                    >
                                        Use in form
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </GeoPremiumCard>

            <GeoPremiumCard className="p-5">
                <div className="flex items-center justify-between gap-2 mb-4">
                    <div>
                        <div className="text-sm font-semibold text-white/95">Create tracked prompt</div>
                        <p className="text-[11px] text-white/35">Add prompt, classify it, then run it to populate runs/citations/competitors views.</p>
                    </div>
                    <GeoProvenancePill meta={data.provenance?.derived} />
                </div>

                <form onSubmit={handleCreate} className="grid gap-3 lg:grid-cols-[1.8fr_180px_120px_auto]">
                    <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        value={form.query_text}
                        onChange={(event) => setForm((current) => ({ ...current, query_text: event.target.value }))}
                        placeholder="Ex. meilleur plombier a Quebec"
                        disabled={submitting}
                    />
                    <select
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        value={form.category}
                        onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                        disabled={submitting}
                    >
                        {categoryOptions.map((option) => (
                            <option key={option.key} value={option.key} className="bg-[#101010]">
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        value={form.locale}
                        onChange={(event) => setForm((current) => ({ ...current, locale: event.target.value }))}
                        disabled={submitting}
                    />
                    <button type="submit" disabled={submitting || !form.query_text.trim()} className="geo-btn geo-btn-pri justify-center">
                        Ajouter
                    </button>
                </form>

                {actionNotice && <div className="text-sm text-emerald-300 mt-3">{actionNotice}</div>}
                {actionError && <div className="text-sm text-red-400 mt-3">{actionError}</div>}
            </GeoPremiumCard>

            {prompts.length === 0 ? (
                <GeoEmptyPanel title={data.emptyState.title} description={data.emptyState.description} />
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {data.categories.map((category) => (
                        <GeoPremiumCard key={category.key} className="p-0 overflow-hidden">
                            <div className="px-5 py-4 border-b border-white/[0.08] bg-black/25">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <div className="text-sm font-semibold text-white/95">{category.label}</div>
                                        <div className="text-[11px] text-white/35">{category.description}</div>
                                    </div>
                                    <div className="text-[11px] text-white/45">{category.count} prompt(s)</div>
                                </div>
                            </div>

                            <div className="divide-y divide-white/[0.06]">
                                {(promptsByCategory.get(category.key) || []).length === 0 ? (
                                    <div className="px-5 py-6 text-sm text-white/35">Aucun prompt dans cette categorie.</div>
                                ) : (
                                    (promptsByCategory.get(category.key) || []).map((prompt) => {
                                        const isEditing = editingId === prompt.id;
                                        const runHref = `/admin/dashboard/${clientId}?view=runs&prompt=${prompt.id}`;
                                        const citationsHref = `/admin/dashboard/${clientId}?view=citations`;
                                        const competitorsHref = `/admin/dashboard/${clientId}?view=competitors`;

                                        return (
                                            <div key={prompt.id} className="px-5 py-4">
                                                {isEditing ? (
                                                    <div className="space-y-3">
                                                        <input
                                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                                            value={editingForm.query_text}
                                                            onChange={(event) => setEditingForm((current) => ({ ...current, query_text: event.target.value }))}
                                                            disabled={submitting}
                                                        />
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <select
                                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                                                value={editingForm.category}
                                                                onChange={(event) => setEditingForm((current) => ({ ...current, category: event.target.value }))}
                                                                disabled={submitting}
                                                            >
                                                                {categoryOptions.map((option) => (
                                                                    <option key={option.key} value={option.key} className="bg-[#101010]">
                                                                        {option.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <input
                                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                                                                value={editingForm.locale}
                                                                onChange={(event) => setEditingForm((current) => ({ ...current, locale: event.target.value }))}
                                                                disabled={submitting}
                                                            />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSave(prompt.id)}
                                                                className="geo-btn geo-btn-pri"
                                                                disabled={submitting || !editingForm.query_text.trim()}
                                                            >
                                                                Enregistrer
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingId(null)}
                                                                className="geo-btn geo-btn-ghost"
                                                                disabled={submitting}
                                                            >
                                                                Annuler
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="flex flex-col lg:flex-row lg:items-start gap-3 justify-between">
                                                            <div className="min-w-0">
                                                                <div className="text-sm font-semibold text-white/90">{prompt.query_text}</div>
                                                                <div className="text-[11px] text-white/35 mt-1">
                                                                    {prompt.category_label} · {prompt.locale} · {prompt.is_active ? 'active' : 'inactive'}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${statusPillClass(prompt.last_run?.status)}`}>
                                                                    {statusLabel(prompt.last_run?.status)}
                                                                </span>
                                                                <div className="text-[11px] text-white/45">
                                                                    {prompt.last_run ? `${prompt.last_run.provider} · ${prompt.last_run.model}` : 'No run yet'}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 text-[11px] text-white/45">
                                                            <div>Last run: {prompt.last_run ? formatDateTime(prompt.last_run.created_at) : 'No run yet'}</div>
                                                            <div>History: {prompt.run_history.completed} completed · {prompt.run_history.failed} failed</div>
                                                            <div>Latest target: {prompt.last_run ? (prompt.last_run.target_found ? 'found' : 'absent') : 'No run yet'}</div>
                                                            <div>Position: {prompt.last_run?.target_position ?? '-'}</div>
                                                            <div>Sources: {prompt.last_run?.mention_counts?.source ?? 0}</div>
                                                            <div>Competitors: {(prompt.last_run?.mention_counts?.competitor ?? 0) + (prompt.last_run?.mention_counts?.non_target ?? 0)}</div>
                                                        </div>

                                                        {prompt.last_run?.response_excerpt ? (
                                                            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                                                                <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold">Latest run summary</div>
                                                                <div className="text-[12px] text-white/60 mt-2 leading-relaxed whitespace-pre-wrap">
                                                                    {prompt.last_run.response_excerpt}
                                                                    {prompt.last_run.has_more_response ? '...' : ''}
                                                                </div>
                                                            </div>
                                                        ) : null}

                                                        <div className="flex flex-wrap gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRunNowPrompt(prompt)}
                                                                className="geo-btn geo-btn-pri"
                                                                disabled={runningPromptId === prompt.id || submitting}
                                                            >
                                                                {runningPromptId === prompt.id ? 'Execution...' : 'Run now'}
                                                            </button>
                                                            <button type="button" onClick={() => startEdit(prompt)} className="geo-btn geo-btn-ghost" disabled={submitting}>
                                                                Editer
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggle(prompt.id, !prompt.is_active)}
                                                                className="geo-btn geo-btn-ghost"
                                                                disabled={submitting}
                                                            >
                                                                {prompt.is_active ? 'Desactiver' : 'Activer'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(prompt.id)}
                                                                className="geo-btn geo-btn-ghost text-red-300 border-red-300/20"
                                                                disabled={submitting}
                                                            >
                                                                Supprimer
                                                            </button>
                                                            <Link href={runHref} className="geo-btn geo-btn-ghost">
                                                                Run history
                                                            </Link>
                                                            <Link href={citationsHref} className="geo-btn geo-btn-ghost">
                                                                Citations
                                                            </Link>
                                                            <Link href={competitorsHref} className="geo-btn geo-btn-ghost">
                                                                Competitors
                                                            </Link>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </GeoPremiumCard>
                    ))}
                </div>
            )}
        </div>
    );
}
