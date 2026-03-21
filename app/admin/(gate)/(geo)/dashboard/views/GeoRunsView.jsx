'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { GeoEmptyPanel, GeoKpiCard, GeoPremiumCard, GeoProvenancePill, GeoSectionTitle } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../../context/GeoClientContext';

function formatDateTime(value) {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return '—';
    }
}

export default function GeoRunsView() {
    const { clientId, client, refreshToken } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('runs');
    const [selectedRunId, setSelectedRunId] = useState(null);
    const [runDetail, setRunDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);

    const latestSelectableRunId = data?.history?.[0]?.id || null;

    useEffect(() => {
        setSelectedRunId((current) => {
            if (!latestSelectableRunId) return null;
            if (!current) return latestSelectableRunId;
            return data?.history?.some((run) => run.id === current) ? current : latestSelectableRunId;
        });
    }, [data?.history, latestSelectableRunId]);

    useEffect(() => {
        if (!clientId || !selectedRunId) {
            setRunDetail(null);
            setDetailError(null);
            setDetailLoading(false);
            return;
        }

        const controller = new AbortController();
        const loadRunDetail = async () => {
            setDetailLoading(true);
            setDetailError(null);
            try {
                const response = await fetch(`/api/admin/geo/client/${clientId}/runs/${selectedRunId}?refresh=${refreshToken}`, {
                    cache: 'no-store',
                    signal: controller.signal,
                });
                const json = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(json.error || `Erreur ${response.status}`);
                setRunDetail(json);
            } catch (loadError) {
                if (loadError.name === 'AbortError') return;
                setDetailError(loadError.message);
            } finally {
                if (!controller.signal.aborted) setDetailLoading(false);
            }
        };

        loadRunDetail();
        return () => controller.abort();
    }, [clientId, refreshToken, selectedRunId]);

    const statusCounts = data?.summary?.statusCounts || { pending: 0, running: 0, completed: 0, failed: 0 };
    const history = data?.history || [];
    const latestPerPrompt = data?.latestPerPrompt || [];
    const topProvidersModels = data?.summary?.topProvidersModels || [];

    const historyRows = useMemo(() => history.slice(0, 40), [history]);

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement…</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    }

    if (!data) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <GeoEmptyPanel title="Runs indisponibles" description="Les observations de runs n'ont pas pu etre chargees." />
            </div>
        );
    }

    const noRunsYet = history.length === 0;

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title="Runs history"
                subtitle={`Observations stockees pour ${client?.client_name || 'ce client'}. Les details restent operationnels et bornes : pas de console de debug brute.`}
                action={(
                    <div className="flex flex-wrap gap-2">
                        <GeoProvenancePill meta={data.provenance.observation} />
                        <GeoProvenancePill meta={data.provenance.summary} />
                    </div>
                )}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
                <GeoKpiCard label="Total runs" value={data.summary.total} hint="Observed run records" accent="blue" />
                <GeoKpiCard label="Completed" value={statusCounts.completed} hint="Completed status" accent="emerald" />
                <GeoKpiCard label="Running" value={statusCounts.running} hint="Running status" accent="violet" />
                <GeoKpiCard label="Pending" value={statusCounts.pending} hint="Pending status" accent="amber" />
                <GeoKpiCard label="Failed" value={statusCounts.failed} hint="Failed status" accent="amber" />
                <GeoKpiCard label="Latest prompts" value={latestPerPrompt.length} hint="Tracked prompts with latest run state" />
            </div>

            {noRunsYet ? (
                <GeoEmptyPanel
                    title={data.emptyState.noRuns.title}
                    description={data.emptyState.noRuns.description}
                >
                    <Link href={`/admin/clients/${clientId}`} className="geo-btn geo-btn-pri">
                        Launch tracked runs
                    </Link>
                </GeoEmptyPanel>
            ) : (
                <>
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <GeoPremiumCard className="xl:col-span-2 p-0 overflow-hidden">
                            <div className="px-5 py-4 border-b border-white/[0.08] bg-black/25 flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold text-white/95">Latest run per prompt</div>
                                    <div className="text-[11px] text-white/35">Fast summary across tracked prompts before inspecting raw run detail.</div>
                                </div>
                                <GeoProvenancePill meta={data.provenance.summary} />
                            </div>
                            <div className="divide-y divide-white/[0.06]">
                                {latestPerPrompt.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setSelectedRunId(item.latest_run?.id || null)}
                                        className="w-full text-left px-5 py-4 hover:bg-white/[0.02] transition-colors"
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold text-white/90 truncate">{item.query_text}</div>
                                                <div className="text-[11px] text-white/35 mt-1">
                                                    {item.category} · {item.locale} · {item.is_active ? 'active' : 'inactive'}
                                                </div>
                                            </div>
                                            {item.latest_run ? (
                                                <div className="text-[11px] text-white/45 shrink-0">
                                                    {item.latest_run.provider} · {item.latest_run.model} · {item.latest_run.target_found ? 'target found' : 'target absent'}
                                                </div>
                                            ) : (
                                                <div className="text-[11px] text-white/35 shrink-0">No run yet</div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </GeoPremiumCard>

                        <GeoPremiumCard className="p-5">
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <div>
                                    <div className="text-sm font-semibold text-white/95">Top providers/models</div>
                                    <p className="text-[11px] text-white/35">Completed run volume only.</p>
                                </div>
                                <GeoProvenancePill meta={data.provenance.summary} />
                            </div>

                            <div className="space-y-2">
                                {topProvidersModels.length ? (
                                    topProvidersModels.map((item) => (
                                        <div key={item.label} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                                            <div className="text-sm font-semibold text-white/90">{item.label}</div>
                                            <div className="text-[11px] text-white/45 mt-1">{item.count} completed runs</div>
                                        </div>
                                    ))
                                ) : (
                                    <GeoEmptyPanel title="No providers yet" description="Completed runs will populate provider and model volume once prompts have been executed." />
                                )}
                            </div>
                        </GeoPremiumCard>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <GeoPremiumCard className="xl:col-span-2 p-0 overflow-hidden">
                            <div className="px-5 py-4 border-b border-white/[0.08] bg-black/25 flex items-center justify-between gap-3">
                                <div>
                                    <div className="text-sm font-semibold text-white/95">Runs history</div>
                                    <div className="text-[11px] text-white/35">Summary rows only. Open a run for bounded inspection.</div>
                                </div>
                                <GeoProvenancePill meta={data.provenance.observation} />
                            </div>
                            <div className="divide-y divide-white/[0.06] max-h-[720px] overflow-y-auto">
                                {historyRows.map((run) => (
                                    <button
                                        key={run.id}
                                        type="button"
                                        onClick={() => setSelectedRunId(run.id)}
                                        className={`w-full text-left px-5 py-4 hover:bg-white/[0.02] transition-colors ${selectedRunId === run.id ? 'bg-white/[0.03]' : ''}`}
                                    >
                                        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold text-white/90 truncate">{run.query_text}</div>
                                                <div className="text-[11px] text-white/35 mt-1">
                                                    {run.category} · {run.provider} · {run.model}
                                                </div>
                                            </div>
                                            <div className="text-[11px] text-white/45 shrink-0">
                                                {run.status} · {formatDateTime(run.created_at)}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-[11px] text-white/45">
                                            <div>Target: {run.target_found ? `found${run.target_position ? ` (#${run.target_position})` : ''}` : 'absent'}</div>
                                            <div>Total mentions: {run.total_mentioned}</div>
                                            <div>Source hosts: {run.mention_counts.sources}</div>
                                            <div>Competitors: {run.mention_counts.competitors + run.mention_counts.non_target}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </GeoPremiumCard>

                        <GeoPremiumCard className="p-5">
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <div>
                                    <div className="text-sm font-semibold text-white/95">Run inspector</div>
                                    <p className="text-[11px] text-white/35">Operational detail only. No raw JSON dump by default.</p>
                                </div>
                                <GeoProvenancePill meta={data.provenance.observation} />
                            </div>

                            {detailLoading ? (
                                <div className="text-sm text-white/45">Chargement du run…</div>
                            ) : detailError ? (
                                <div className="text-sm text-red-400">{detailError}</div>
                            ) : !runDetail?.run ? (
                                <GeoEmptyPanel title="No run selected" description="Select a run from the history to inspect its bounded detail view." />
                            ) : (
                                <div className="space-y-4">
                                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                                        <div className="text-sm font-semibold text-white/90">{runDetail.run.query_text}</div>
                                        <div className="text-[11px] text-white/45 mt-1">
                                            {runDetail.run.provider} · {runDetail.run.model} · {runDetail.run.status}
                                        </div>
                                        <div className="text-[11px] text-white/45 mt-1">{formatDateTime(runDetail.run.created_at)}</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                                            <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold">Target</div>
                                            <div className="text-sm font-semibold text-white mt-2">
                                                {runDetail.run.target_found ? `Found${runDetail.run.target_position ? ` at #${runDetail.run.target_position}` : ''}` : 'Not found'}
                                            </div>
                                        </div>
                                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                                            <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold">Mentions</div>
                                            <div className="text-sm font-semibold text-white mt-2">{runDetail.run.total_mentioned}</div>
                                        </div>
                                    </div>

                                    {runDetail.run.response_excerpt ? (
                                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                                            <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold">Response excerpt</div>
                                            <p className="text-[12px] text-white/60 mt-2 leading-relaxed whitespace-pre-wrap">
                                                {runDetail.run.response_excerpt}
                                                {runDetail.run.has_more_response ? '…' : ''}
                                            </p>
                                        </div>
                                    ) : null}

                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold mb-2">Observed businesses</div>
                                            {runDetail.businesses.length ? (
                                                <div className="space-y-2">
                                                    {runDetail.businesses.map((item) => (
                                                        <div key={`${item.name}-${item.position}`} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-[12px] text-white/70">
                                                            {item.position ? `#${item.position} · ` : ''}{item.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-[11px] text-white/35">No target business mentions were structured for this run.</div>
                                            )}
                                        </div>

                                        <div>
                                            <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold mb-2">Competitors and non-targets</div>
                                            {runDetail.competitors.length || runDetail.nonTargets.length ? (
                                                <div className="space-y-2">
                                                    {[...runDetail.competitors, ...runDetail.nonTargets].map((item) => (
                                                        <div key={`${item.name}-${item.position}`} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-[12px] text-white/70">
                                                            {item.position ? `#${item.position} · ` : ''}{item.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-[11px] text-white/35">No competitor observations were captured for this run.</div>
                                            )}
                                        </div>

                                        <div>
                                            <div className="text-[10px] uppercase tracking-[0.08em] text-white/30 font-bold mb-2">Observed source hosts</div>
                                            {runDetail.sourceHosts.length ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {runDetail.sourceHosts.map((host) => (
                                                        <span key={host} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] text-white/65">
                                                            {host}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-[11px] text-white/35">No source hosts were captured for this run.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </GeoPremiumCard>
                    </div>
                </>
            )}
        </div>
    );
}
