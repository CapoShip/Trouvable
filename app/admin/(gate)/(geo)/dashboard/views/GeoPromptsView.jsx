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
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return '—';
    }
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
    const [actionError, setActionError] = useState(null);

    const categoryOptions = data?.categoryOptions || [];
    const prompts = data?.prompts || [];

    const promptsByCategory = useMemo(() => {
        const buckets = new Map();
        for (const item of prompts) {
            if (!buckets.has(item.category)) buckets.set(item.category, []);
            buckets.get(item.category).push(item);
        }
        return buckets;
    }, [prompts]);

    async function handleCreate(event) {
        event.preventDefault();
        if (!clientId || !form.query_text.trim()) return;
        setSubmitting(true);
        setActionError(null);
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
            invalidateWorkspace();
        } catch (submitError) {
            setActionError(submitError.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleToggle(id, isActive) {
        setSubmitting(true);
        setActionError(null);
        try {
            const response = await fetch('/api/admin/queries/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_active: isActive }),
            });
            await parseJsonResponse(response);
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
        setActionError(null);
        try {
            const response = await fetch('/api/admin/queries/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            await parseJsonResponse(response);
            if (editingId === id) setEditingId(null);
            invalidateWorkspace();
        } catch (submitError) {
            setActionError(submitError.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleSave(id) {
        setSubmitting(true);
        setActionError(null);
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
            invalidateWorkspace();
        } catch (submitError) {
            setActionError(submitError.message);
        } finally {
            setSubmitting(false);
        }
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

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement…</div>;
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
        <div className="p-4 md:p-6 space-y-5 max-w-[1500px] mx-auto">
            <GeoSectionTitle
                title="Tracked prompts"
                subtitle={`Gestion et performance des prompts suivis pour ${client?.client_name || 'ce client'}. La performance est derivee du dernier run stocke par prompt.`}
                action={(
                    <div className="flex flex-wrap gap-2">
                        <GeoProvenancePill meta={data.provenance} />
                        <Link href={`/admin/clients/${clientId}`} className="geo-btn geo-btn-ghost">
                            Fiche client
                        </Link>
                    </div>
                )}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <GeoKpiCard label="Total prompts" value={data.summary.total} hint="Derived from stored tracked prompts" />
                <GeoKpiCard label="Active" value={data.summary.active} hint="Ready to run" accent="emerald" />
                <GeoKpiCard label="Mention rate" value={data.summary.mentionRatePercent != null ? `${data.summary.mentionRatePercent}%` : null} hint="Derived from latest run per prompt" accent="violet" />
                <GeoKpiCard label="No run yet" value={data.summary.noRunYet} hint="Prompts waiting for first observed run" accent="amber" />
            </div>

            <GeoPremiumCard className="p-5">
                <div className="flex items-center justify-between gap-2 mb-4">
                    <div>
                        <div className="text-sm font-semibold text-white/95">Add tracked prompt</div>
                        <p className="text-[11px] text-white/35">Classify prompts clearly so visibility, citations, and competitor observations stay explainable.</p>
                    </div>
                    <GeoProvenancePill meta={data.provenance} />
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
                                                            <button type="button" onClick={() => handleSave(prompt.id)} className="geo-btn geo-btn-pri" disabled={submitting || !editingForm.query_text.trim()}>
                                                                Enregistrer
                                                            </button>
                                                            <button type="button" onClick={() => setEditingId(null)} className="geo-btn geo-btn-ghost" disabled={submitting}>
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
                                                            <div className="text-[11px] text-white/45 shrink-0">
                                                                {prompt.last_run
                                                                    ? `${prompt.last_run.provider} · ${prompt.last_run.model}`
                                                                    : 'No run yet'}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 text-[11px] text-white/45">
                                                            <div>Last run: {prompt.last_run ? formatDateTime(prompt.last_run.created_at) : 'No run yet'}</div>
                                                            <div>History: {prompt.run_history.completed} completed · {prompt.run_history.failed} failed</div>
                                                            <div>Latest target: {prompt.last_run ? (prompt.last_run.target_found ? 'found' : 'absent') : 'No run yet'}</div>
                                                            <div>Position: {prompt.last_run?.target_position ?? '—'}</div>
                                                        </div>

                                                        <div className="flex flex-wrap gap-2">
                                                            <button type="button" onClick={() => startEdit(prompt)} className="geo-btn geo-btn-ghost" disabled={submitting}>
                                                                Editer
                                                            </button>
                                                            <button type="button" onClick={() => handleToggle(prompt.id, !prompt.is_active)} className="geo-btn geo-btn-ghost" disabled={submitting}>
                                                                {prompt.is_active ? 'Desactiver' : 'Activer'}
                                                            </button>
                                                            <button type="button" onClick={() => handleDelete(prompt.id)} className="geo-btn geo-btn-ghost text-red-300 border-red-300/20" disabled={submitting}>
                                                                Supprimer
                                                            </button>
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
