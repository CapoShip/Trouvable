'use client';

import { useMemo, useState } from 'react';

import { GeoProvenancePill } from '../components/GeoPremium';
import IssueQuickAction from '../components/IssueQuickAction';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import {
    COMMAND_PANEL,
    CommandEmptyState,
    CommandHeader,
    CommandMetricCard,
    CommandPageShell,
    CommandSkeleton,
    cn,
    getToneMeta,
} from '../components/command';

const STATUS_DEFS = [
    { id: 'open', label: 'Ouvertes', tone: 'ok' },
    { id: 'in_progress', label: 'En cours', tone: 'info' },
    { id: 'done', label: 'Terminées', tone: 'neutral' },
    { id: 'dismissed', label: 'Classées', tone: 'neutral' },
];

const STATUS_LABELS = STATUS_DEFS.reduce((acc, status) => {
    acc[status.id] = status.label;
    return acc;
}, {});

const PRIORITY_BADGES = {
    high: { label: 'Haute', cls: 'text-red-300 bg-red-400/10 border-red-400/20' },
    medium: { label: 'Moyenne', cls: 'text-amber-300 bg-amber-400/10 border-amber-400/20' },
    low: { label: 'Basse', cls: 'text-white/40 bg-white/[0.03] border-white/10' },
};

const REVIEW_LABELS = {
    auto_accepted: 'Auto',
    needs_review: 'À revoir',
    reviewed_confirmed: 'Confirmé',
    reviewed_rejected: 'Rejeté',
    blocked: 'Bloqué',
};

const REVIEW_ITEM_LABELS = {
    problem: 'Audit',
    merge_suggestion: 'Merge',
    remediation_suggestion: 'Remédiation',
    opportunity: 'Opportunité',
};

async function parseJsonResponse(response) {
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.error || `Erreur ${response.status}`);
    return json;
}

function buildOpportunityProblemRef(item, clientId) {
    if (!clientId || !item?.id) return null;
    return {
        source: 'geo_opportunity',
        clientId,
        opportunityId: String(item.id),
        issueId: item.issue_id || null,
        category: item.category || null,
        label: item.title,
        taskType: 'geo_improvement',
    };
}

function OpportunityCard({ item, activeStatus, onUpdateStatus, submittingId, clientId }) {
    const priority = PRIORITY_BADGES[item.priority] || PRIORITY_BADGES.low;
    const isSubmitting = submittingId === item.id;
    const problemRef = buildOpportunityProblemRef(item, clientId);

    return (
        <div className="rounded-2xl border border-white/[0.08] bg-[#0c0e12]/90 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <div className="flex flex-wrap items-center gap-2">
                <span className={cn('inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.04em]', priority.cls)}>
                    {priority.label}
                </span>
                {item.category ? (
                    <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 text-[9px] text-white/40">{item.category}</span>
                ) : null}
            </div>
            <div className="mt-2 text-[13px] font-semibold text-white/95 leading-snug">{item.title}</div>
            <div className="mt-2 text-[11.5px] text-white/50 leading-relaxed line-clamp-3">{item.description}</div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <GeoProvenancePill meta={item.provenance} />
                {item.review_status ? (
                    <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 text-[9px] text-white/40">
                        {REVIEW_LABELS[item.review_status] || item.review_status}
                    </span>
                ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
                {problemRef ? (
                    <IssueQuickAction problemRef={problemRef} label="Prompt IA" size="xs" variant="primary" />
                ) : null}
                {activeStatus !== 'in_progress' && activeStatus !== 'done' ? (
                    <button
                        type="button"
                        onClick={() => onUpdateStatus(item.id, 'in_progress')}
                        className="geo-btn geo-btn-ghost text-[10px] py-1"
                        disabled={isSubmitting}
                    >
                        En cours
                    </button>
                ) : null}
                {activeStatus !== 'done' ? (
                    <button
                        type="button"
                        onClick={() => onUpdateStatus(item.id, 'done')}
                        className="geo-btn geo-btn-pri text-[10px] py-1"
                        disabled={isSubmitting}
                    >
                        Terminée
                    </button>
                ) : null}
                {activeStatus !== 'dismissed' && activeStatus !== 'done' ? (
                    <button
                        type="button"
                        onClick={() => onUpdateStatus(item.id, 'dismissed')}
                        className="text-[10px] text-white/30 hover:text-white/55 transition-colors px-1.5 py-1"
                        disabled={isSubmitting}
                    >
                        Classer
                    </button>
                ) : null}
                {(activeStatus === 'done' || activeStatus === 'dismissed') ? (
                    <button
                        type="button"
                        onClick={() => onUpdateStatus(item.id, 'open')}
                        className="geo-btn geo-btn-ghost text-[10px] py-1"
                        disabled={isSubmitting}
                    >
                        Réouvrir
                    </button>
                ) : null}
            </div>
        </div>
    );
}

export default function GeoAmeliorerView() {
    const { clientId, invalidateWorkspace, client } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('opportunities');
    const [submittingId, setSubmittingId] = useState(null);
    const [actionError, setActionError] = useState(null);

    const categorySummary = useMemo(() => data?.byCategory || [], [data]);
    const sourceSummary = useMemo(() => data?.bySource || [], [data]);
    const reviewQueue = useMemo(() => data?.reviewQueue || [], [data]);

    async function updateStatus(opportunityId, status) {
        if (!clientId) return;
        setSubmittingId(opportunityId);
        setActionError(null);
        try {
            const response = await fetch(`/api/admin/geo/client/${clientId}/opportunities/${opportunityId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            await parseJsonResponse(response);
            invalidateWorkspace();
        } catch (submitError) {
            setActionError(submitError.message);
        } finally {
            setSubmittingId(null);
        }
    }

    if (loading) return <CommandSkeleton />;

    if (error) {
        return (
            <CommandPageShell>
                <CommandEmptyState tone="critical" title="Chargement impossible" description={error} />
            </CommandPageShell>
        );
    }

    if (!data) {
        return (
            <CommandPageShell>
                <CommandEmptyState
                    title="File d'actions indisponible"
                    description="La file d'actions n'est pas disponible pour ce mandat."
                />
            </CommandPageShell>
        );
    }

    const header = (
        <CommandHeader
            eyebrow="GEO Ops · Kanban"
            title="File d'actions GEO"
            subtitle={`Colonnes par statut pour ${client?.client_name || 'ce mandat'}. Faites glisser mentalement du gauche vers la droite : ouvert → en cours → terminé / classé.`}
            actions={(
                <>
                    <GeoProvenancePill meta={data.provenance?.observation} />
                    <GeoProvenancePill meta={data.provenance?.summary} />
                </>
            )}
        />
    );

    return (
        <CommandPageShell header={header}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                <CommandMetricCard label="Ouvertes" value={data.summary.open} detail="À traiter" tone={data.summary.open > 0 ? 'ok' : 'neutral'} />
                <CommandMetricCard label="En cours" value={data.summary.in_progress} detail="Prises en charge" tone="info" />
                <CommandMetricCard label="Terminées" value={data.summary.done} tone="neutral" />
                <CommandMetricCard label="Classées" value={data.summary.dismissed} tone="neutral" />
                <CommandMetricCard
                    label="Merges"
                    value={data.summary.pendingMergeCount}
                    detail="File de fusion"
                    tone={data.summary.pendingMergeCount > 0 ? 'warning' : 'neutral'}
                />
                <CommandMetricCard
                    label="À revoir"
                    value={data.summary.reviewQueueCount}
                    detail={`${data.summary.remediationDraftCount} remédiations draft`}
                    tone={data.summary.reviewQueueCount > 0 ? 'warning' : 'neutral'}
                />
            </div>

            {actionError ? (
                <div className="rounded-lg border border-red-400/20 bg-red-400/10 px-4 py-2 text-[11px] text-red-200">{actionError}</div>
            ) : null}

            <div className="flex gap-4 overflow-x-auto pb-2 geo-scrollbar lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
                {STATUS_DEFS.map((status) => {
                    const colItems = data.byStatus?.[status.id] || [];
                    const toneMeta = getToneMeta(status.tone);
                    const count = data.summary[status.id] ?? 0;

                    return (
                        <div
                            key={status.id}
                            className="flex min-w-[280px] flex-1 flex-col rounded-[22px] border border-white/[0.07] bg-[#08090c]/80 lg:min-w-0"
                        >
                            <div className={cn('border-b border-white/[0.06] px-4 py-3', toneMeta.pill)}>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[12px] font-semibold text-white/90">{status.label}</span>
                                    <span className="rounded-full bg-black/30 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white/70">
                                        {count}
                                    </span>
                                </div>
                            </div>
                            <div className="flex max-h-[min(72vh,780px)] flex-col gap-3 overflow-y-auto p-3 geo-scrollbar">
                                {colItems.length === 0 ? (
                                    <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-3 py-6 text-center text-[11px] text-white/35">
                                        {status.id === 'open'
                                            ? (data.emptyState?.noOpen?.description || 'Rien à traiter pour l’instant.')
                                            : `Aucun élément « ${STATUS_LABELS[status.id]} ».`}
                                    </div>
                                ) : (
                                    colItems.map((item) => (
                                        <OpportunityCard
                                            key={item.id}
                                            item={item}
                                            activeStatus={status.id}
                                            onUpdateStatus={updateStatus}
                                            submittingId={submittingId}
                                            clientId={clientId}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <section className={cn(COMMAND_PANEL, 'p-4')}>
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/70">File de revue</div>
                        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] font-semibold text-white/50">
                            {data.summary.reviewQueueCount}
                        </span>
                    </div>
                    {reviewQueue.length ? (
                        <div className="space-y-2">
                            {reviewQueue.slice(0, 6).map((item) => {
                                const pri = PRIORITY_BADGES[item.severity] || PRIORITY_BADGES.medium;
                                const detail = item.evidence_summary || item.recommended_fix || item.description;

                                return (
                                    <div key={`${item.item_type}-${item.id}`} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                            <span className="rounded-md border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.04em] text-white/45">
                                                {REVIEW_ITEM_LABELS[item.item_type] || 'Revue'}
                                            </span>
                                            {item.severity ? (
                                                <span className={cn('inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.04em]', pri.cls)}>
                                                    {pri.label}
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="text-[11px] font-medium text-white/80">{item.title}</div>
                                        <div className="text-[10px] text-white/40 mt-1 line-clamp-2">{detail}</div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-[11px] text-white/35">Aucun élément à revoir.</div>
                    )}
                </section>

                <section className={cn(COMMAND_PANEL, 'p-4')}>
                    <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/70 mb-3">Par catégorie</div>
                    {categorySummary.length ? (
                        <div className="space-y-1.5">
                            {categorySummary.map((item) => (
                                <div key={item.category} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                                    <span className="text-[11px] text-white/70">{item.category}</span>
                                    <span className="text-[11px] font-bold text-white/55">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-[11px] text-white/35">Aucune catégorie.</div>
                    )}
                </section>

                <div className="space-y-4">
                    <section className={cn(COMMAND_PANEL, 'p-4')}>
                        <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/70 mb-3">Par provenance</div>
                        {sourceSummary.length ? (
                            <div className="space-y-1.5">
                                {sourceSummary.map((item) => (
                                    <div key={item.source} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] text-white/70">{item.source}</span>
                                            <GeoProvenancePill meta={item.provenance} />
                                        </div>
                                        <span className="text-[11px] font-bold text-white/55">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-[11px] text-white/35">Aucune source.</div>
                        )}
                    </section>

                    <section className={cn(COMMAND_PANEL, 'p-4')}>
                        <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/70 mb-3">File de merge</div>
                        {data.mergeSuggestions?.length ? (
                            <div className="space-y-1.5">
                                {data.mergeSuggestions.map((item) => (
                                    <div key={item.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                                        <div className="text-[11px] font-medium text-white/80">{item.field_name}</div>
                                        <div className="text-[10px] text-white/40 mt-0.5 line-clamp-1">{String(item.suggested_value).slice(0, 100)}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-[11px] text-white/35">Aucun merge en attente.</div>
                        )}
                    </section>
                </div>
            </div>
        </CommandPageShell>
    );
}
