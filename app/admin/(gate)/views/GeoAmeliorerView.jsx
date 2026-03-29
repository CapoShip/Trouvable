'use client';

import { useMemo, useState } from 'react';

import { GeoEmptyPanel, GeoKpiCard, GeoPremiumCard, GeoProvenancePill, GeoSectionTitle } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';

const STATUS_LABELS = {
    open: 'Ouvertes',
    in_progress: 'En cours',
    done: 'Terminées',
    dismissed: 'Classées',
};

const STATUS_ACCENTS = {
    open: 'emerald',
    in_progress: 'violet',
    done: 'blue',
    dismissed: 'default',
};

const PRIORITY_BADGES = {
    high: { label: 'Haute', cls: 'text-red-300 bg-red-400/10 border-red-400/20' },
    medium: { label: 'Moyenne', cls: 'text-amber-300 bg-amber-400/10 border-amber-400/20' },
    low: { label: 'Basse', cls: 'text-white/40 bg-white/[0.03] border-white/10' },
};

const REVIEW_LABELS = {
    auto_accepted: 'Auto',
    needs_review: 'A revoir',
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

export default function GeoAmeliorerView() {
    const { clientId, invalidateWorkspace, client } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('opportunities');
    const [activeStatus, setActiveStatus] = useState('open');
    const [submittingId, setSubmittingId] = useState(null);
    const [actionError, setActionError] = useState(null);

    const visibleItems = data?.byStatus?.[activeStatus] || [];
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

    if (loading) return <div className="p-8 text-center text-[var(--geo-t3)] text-sm animate-pulse">Chargement...</div>;
    if (error) return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    if (!data) return (
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
            <GeoEmptyPanel title="Centre d'opportunités indisponible" description="La demande d'optimisation n'est pas disponible." />
        </div>
    );

    return (
        <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title="Centre d'opportunités"
                subtitle={`File opérateur pour ${client?.client_name || 'ce client'}. Provenance tracée pour chaque item.`}
                action={(
                    <div className="flex flex-wrap gap-2">
                        <GeoProvenancePill meta={data.provenance.observation} />
                        <GeoProvenancePill meta={data.provenance.summary} />
                    </div>
                )}
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                <GeoKpiCard label="Ouvertes" value={data.summary.open} hint="À traiter" accent="emerald" />
                <GeoKpiCard label="En cours" value={data.summary.in_progress} hint="Prises en charge" accent="violet" />
                <GeoKpiCard label="Terminées" value={data.summary.done} accent="blue" />
                <GeoKpiCard label="Classées" value={data.summary.dismissed} />
                <GeoKpiCard label="Merges" value={data.summary.pendingMergeCount} hint="File de fusion" accent={data.summary.pendingMergeCount > 0 ? 'amber' : 'default'} />
                <GeoKpiCard
                    label="A revoir"
                    value={data.summary.reviewQueueCount}
                    hint={`${data.summary.remediationDraftCount} remédiations draft`}
                    accent={data.summary.reviewQueueCount > 0 ? 'amber' : 'default'}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Main list */}
                <GeoPremiumCard className="xl:col-span-2 p-0 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/[0.06] bg-black/20">
                        <div className="flex flex-wrap gap-1">
                            {Object.entries(STATUS_LABELS).map(([status, label]) => {
                                const count = data.summary[status] ?? 0;
                                return (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => setActiveStatus(status)}
                                        className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                                            activeStatus === status
                                                ? 'bg-white/[0.08] text-white border border-white/15'
                                                : 'text-white/35 hover:text-white/60 border border-transparent'
                                        }`}
                                    >
                                        {label}
                                        {count > 0 && <span className="ml-1 text-white/25">{count}</span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {actionError && <div className="px-4 py-2 text-[11px] text-red-300 bg-red-400/[0.06] border-b border-white/[0.06]">{actionError}</div>}

                    {visibleItems.length === 0 ? (
                        <div className="p-5">
                            <GeoEmptyPanel
                                title={activeStatus === 'open' ? data.emptyState.noOpen.title : `Aucun élément "${STATUS_LABELS[activeStatus]}"`}
                                description={activeStatus === 'open' ? data.emptyState.noOpen.description : 'Aucune opportunité dans ce statut.'}
                            />
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.04] max-h-[700px] overflow-y-auto">
                            {visibleItems.map((item) => {
                                const pri = PRIORITY_BADGES[item.priority] || PRIORITY_BADGES.low;
                                return (
                                    <div key={item.id} className="px-4 py-3">
                                        <div className="flex flex-col lg:flex-row lg:items-start gap-3 justify-between">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <div className="text-[12px] font-semibold text-white/90">{item.title}</div>
                                                    <GeoProvenancePill meta={item.provenance} />
                                                    {item.priority && (
                                                        <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.04em] ${pri.cls}`}>
                                                            {pri.label}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-white/40 mt-1.5 line-clamp-2">{item.description}</div>
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {item.category && (
                                                        <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 text-[9px] text-white/35">{item.category}</span>
                                                    )}
                                                    {item.source && (
                                                        <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 text-[9px] text-white/35">{item.source}</span>
                                                    )}
                                                    {item.truth_class && (
                                                        <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 text-[9px] text-white/35">{item.truth_class}</span>
                                                    )}
                                                    {item.confidence && (
                                                        <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 text-[9px] text-white/35">conf. {item.confidence}</span>
                                                    )}
                                                    {item.review_status && (
                                                        <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 text-[9px] text-white/35">{REVIEW_LABELS[item.review_status] || item.review_status}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 shrink-0">
                                                {activeStatus !== 'in_progress' && activeStatus !== 'done' && (
                                                    <button type="button" onClick={() => updateStatus(item.id, 'in_progress')} className="geo-btn geo-btn-ghost text-[10px] py-1" disabled={submittingId === item.id}>
                                                        En cours
                                                    </button>
                                                )}
                                                {activeStatus !== 'done' && (
                                                    <button type="button" onClick={() => updateStatus(item.id, 'done')} className="geo-btn geo-btn-pri text-[10px] py-1" disabled={submittingId === item.id}>
                                                        Terminée
                                                    </button>
                                                )}
                                                {activeStatus !== 'dismissed' && activeStatus !== 'done' && (
                                                    <button type="button" onClick={() => updateStatus(item.id, 'dismissed')} className="text-[10px] text-white/25 hover:text-white/50 transition-colors px-1.5 py-1" disabled={submittingId === item.id}>
                                                        Classer
                                                    </button>
                                                )}
                                                {(activeStatus === 'done' || activeStatus === 'dismissed') && (
                                                    <button type="button" onClick={() => updateStatus(item.id, 'open')} className="geo-btn geo-btn-ghost text-[10px] py-1" disabled={submittingId === item.id}>
                                                        Réouvrir
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </GeoPremiumCard>

                {/* Side panels */}
                <div className="space-y-4">
                    <GeoPremiumCard className="p-4">
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="text-[12px] font-semibold text-white/80">File de revue opérateur</div>
                            <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] font-semibold text-white/45">
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
                                                {item.severity && (
                                                    <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.04em] ${pri.cls}`}>
                                                        {pri.label}
                                                    </span>
                                                )}
                                                {item.review_status && (
                                                    <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 text-[9px] text-white/35">
                                                        {REVIEW_LABELS[item.review_status] || item.review_status}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] font-medium text-white/80">{item.title}</div>
                                            <div className="text-[10px] text-white/35 mt-1 line-clamp-2">{detail}</div>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {item.family && <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 text-[9px] text-white/35">{item.family}</span>}
                                                {item.surface && <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 text-[9px] text-white/35">{item.surface}</span>}
                                                {item.truth_class && <span className="rounded-md border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 text-[9px] text-white/35">{item.truth_class}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-[10px] text-white/30">Aucun élément à revoir.</div>
                        )}
                    </GeoPremiumCard>

                    <GeoPremiumCard className="p-4">
                        <div className="text-[12px] font-semibold text-white/80 mb-3">Par catégorie</div>
                        {categorySummary.length ? (
                            <div className="space-y-1.5">
                                {categorySummary.map((item) => (
                                    <div key={item.category} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                                        <span className="text-[11px] text-white/65">{item.category}</span>
                                        <span className="text-[11px] font-bold text-white/50">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-[10px] text-white/30">Aucune catégorie.</div>
                        )}
                    </GeoPremiumCard>

                    <GeoPremiumCard className="p-4">
                        <div className="text-[12px] font-semibold text-white/80 mb-3">Par provenance</div>
                        <div className="space-y-1.5">
                            {sourceSummary.map((item) => (
                                <div key={item.source} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-white/65">{item.source}</span>
                                        <GeoProvenancePill meta={item.provenance} />
                                    </div>
                                    <span className="text-[11px] font-bold text-white/50">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </GeoPremiumCard>

                    <GeoPremiumCard className="p-4">
                        <div className="text-[12px] font-semibold text-white/80 mb-3">File de merge</div>
                        {data.mergeSuggestions.length ? (
                            <div className="space-y-1.5">
                                {data.mergeSuggestions.map((item) => (
                                    <div key={item.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                                        <div className="text-[11px] font-medium text-white/75">{item.field_name}</div>
                                        <div className="text-[10px] text-white/35 mt-0.5 line-clamp-1">{String(item.suggested_value).slice(0, 100)}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-[10px] text-white/30">Aucun merge en attente.</div>
                        )}
                    </GeoPremiumCard>
                </div>
            </div>
        </div>
    );
}
