'use client';

import { useMemo, useState } from 'react';

import { GeoEmptyPanel, GeoKpiCard, GeoPremiumCard, GeoProvenancePill, GeoSectionTitle } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../../context/GeoClientContext';

const STATUS_LABELS = {
    open: 'Open',
    in_progress: 'In progress',
    done: 'Done',
    dismissed: 'Dismissed',
};

async function parseJsonResponse(response) {
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(json.error || `Erreur ${response.status}`);
    }
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

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement…</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    }

    if (!data) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <GeoEmptyPanel title="Opportunity center indisponible" description="La file d'optimisation n'a pas pu etre chargee." />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title="Opportunity center"
                subtitle={`Queue operateur pour ${client?.client_name || 'ce client'}. Les opportunites gardent leur source observee, inferee ou derivee sans pretendre a une decouverte externe complete.`}
                action={(
                    <div className="flex flex-wrap gap-2">
                        <GeoProvenancePill meta={data.provenance.observation} />
                        <GeoProvenancePill meta={data.provenance.summary} />
                    </div>
                )}
            />

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <GeoKpiCard label="Open" value={data.summary.open} hint="Ready to work" accent="emerald" />
                <GeoKpiCard label="In progress" value={data.summary.in_progress} hint="Operator-owned" accent="violet" />
                <GeoKpiCard label="Done" value={data.summary.done} hint="Completed" accent="blue" />
                <GeoKpiCard label="Dismissed" value={data.summary.dismissed} hint="Resolved or out of scope" accent="amber" />
                <GeoKpiCard label="Pending merges" value={data.summary.pendingMergeCount} hint="Separate operator-only merge queue" accent="amber" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <GeoPremiumCard className="xl:col-span-2 p-0 overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/[0.08] bg-black/25">
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(STATUS_LABELS).map(([status, label]) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setActiveStatus(status)}
                                    className={`geo-tab ${activeStatus === status ? 'on' : ''}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {actionError && <div className="px-5 py-3 text-sm text-red-400 border-b border-white/[0.08]">{actionError}</div>}

                    {visibleItems.length === 0 ? (
                        <div className="p-5">
                            <GeoEmptyPanel title={data.emptyState.noOpen.title} description={activeStatus === 'open' ? data.emptyState.noOpen.description : `No items currently in "${STATUS_LABELS[activeStatus]}".`} />
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.06]">
                            {visibleItems.map((item) => (
                                <div key={item.id} className="px-5 py-4">
                                    <div className="flex flex-col lg:flex-row lg:items-start gap-3 justify-between">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="text-sm font-semibold text-white/90">{item.title}</div>
                                                <GeoProvenancePill meta={item.provenance} />
                                            </div>
                                            <div className="text-[11px] text-white/45 mt-2">{item.description}</div>
                                            <div className="flex flex-wrap gap-2 mt-3 text-[10px] text-white/45">
                                                {item.priority && <span className="rounded-full border border-white/[0.08] px-2 py-1">{item.priority}</span>}
                                                {item.category && <span className="rounded-full border border-white/[0.08] px-2 py-1">{item.category}</span>}
                                                {item.source && <span className="rounded-full border border-white/[0.08] px-2 py-1">{item.source}</span>}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 shrink-0">
                                            {activeStatus !== 'open' && (
                                                <button type="button" onClick={() => updateStatus(item.id, 'open')} className="geo-btn geo-btn-ghost" disabled={submittingId === item.id}>
                                                    Re-open
                                                </button>
                                            )}
                                            {activeStatus !== 'in_progress' && (
                                                <button type="button" onClick={() => updateStatus(item.id, 'in_progress')} className="geo-btn geo-btn-ghost" disabled={submittingId === item.id}>
                                                    In progress
                                                </button>
                                            )}
                                            {activeStatus !== 'done' && (
                                                <button type="button" onClick={() => updateStatus(item.id, 'done')} className="geo-btn geo-btn-pri" disabled={submittingId === item.id}>
                                                    Done
                                                </button>
                                            )}
                                            {activeStatus !== 'dismissed' && (
                                                <button type="button" onClick={() => updateStatus(item.id, 'dismissed')} className="geo-btn geo-btn-ghost" disabled={submittingId === item.id}>
                                                    Dismiss
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </GeoPremiumCard>

                <div className="space-y-4">
                    <GeoPremiumCard className="p-5">
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div>
                                <div className="text-sm font-semibold text-white/95">By category</div>
                                <p className="text-[11px] text-white/35">Where work is clustering right now.</p>
                            </div>
                            <GeoProvenancePill meta={data.provenance.summary} />
                        </div>
                        {categorySummary.length ? (
                            <div className="space-y-2">
                                {categorySummary.map((item) => (
                                    <div key={item.category} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-sm text-white/75">
                                        {item.category} · {item.count}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <GeoEmptyPanel title="No categories yet" description="Categories appear once opportunities have been created in the queue." />
                        )}
                    </GeoPremiumCard>

                    <GeoPremiumCard className="p-5">
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div>
                                <div className="text-sm font-semibold text-white/95">By provenance</div>
                                <p className="text-[11px] text-white/35">Observed, inferred, or derived queue sources.</p>
                            </div>
                            <GeoProvenancePill meta={data.provenance.summary} />
                        </div>
                        <div className="space-y-2">
                            {sourceSummary.map((item) => (
                                <div key={item.source} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-sm text-white/80">{item.source}</div>
                                        <GeoProvenancePill meta={item.provenance} />
                                    </div>
                                    <div className="text-[11px] text-white/45 mt-1">{item.count} item(s)</div>
                                </div>
                            ))}
                        </div>
                    </GeoPremiumCard>

                    <GeoPremiumCard className="p-5">
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div>
                                <div className="text-sm font-semibold text-white/95">Safe merge queue</div>
                                <p className="text-[11px] text-white/35">Separate operator-only merge workflow.</p>
                            </div>
                            <GeoProvenancePill meta={data.provenance.observation} />
                        </div>
                        {data.mergeSuggestions.length ? (
                            <div className="space-y-2">
                                {data.mergeSuggestions.map((item) => (
                                    <div key={item.id} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                                        <div className="text-sm font-semibold text-white/90">{item.field_name}</div>
                                        <div className="text-[11px] text-white/45 mt-1">{String(item.suggested_value).slice(0, 120)}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <GeoEmptyPanel title="No pending merges" description="Pending merge suggestions appear here when audits or structured extraction propose safe profile updates." />
                        )}
                    </GeoPremiumCard>
                </div>
            </div>

            {data.auditIssues.length ? (
                <GeoPremiumCard className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Latest audit issues</div>
                            <p className="text-[11px] text-white/35">Observed issues from the most recent site audit.</p>
                        </div>
                        <GeoProvenancePill meta={data.provenance.observation} />
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {data.auditIssues.map((item) => (
                            <div key={item.id} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                                <div className="text-sm font-semibold text-white/90">{item.title}</div>
                                <div className="text-[11px] text-white/45 mt-1">{item.description}</div>
                                {item.evidence_summary ? (
                                    <div className="text-[11px] text-white/35 mt-2">Evidence: {item.evidence_summary}</div>
                                ) : null}
                                {item.recommended_fix ? (
                                    <div className="text-[11px] text-white/35 mt-2">Fix direction: {item.recommended_fix}</div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </GeoPremiumCard>
            ) : null}
        </div>
    );
}
