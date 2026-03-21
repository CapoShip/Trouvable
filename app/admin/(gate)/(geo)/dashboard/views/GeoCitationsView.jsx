'use client';

import { SourcesTimelineChart } from '../components/GeoRealCharts';
import { GeoBarRow, GeoEmptyPanel, GeoKpiCard, GeoPremiumCard, GeoProvenancePill, GeoSectionTitle } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../../context/GeoClientContext';

export default function GeoCitationsView() {
    const { client } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('citations');

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement…</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    }

    if (!data) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <GeoEmptyPanel title="Citations indisponibles" description="La couche de sources observees n'a pas pu etre chargee." />
            </div>
        );
    }

    const noRuns = data.summary.totalCompletedRuns === 0;
    const noCitations = data.summary.totalSourceMentions === 0;

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title="Observed citations"
                subtitle={`Sources observees dans les reponses stockees pour ${client?.client_name || 'ce client'}. Cette vue reste limitee a ce qui a vraiment ete capture pendant les tracked runs.`}
                action={(
                    <div className="flex flex-wrap gap-2">
                        <GeoProvenancePill meta={data.provenance.observation} />
                        <GeoProvenancePill meta={data.provenance.summary} />
                    </div>
                )}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <GeoKpiCard label="Completed runs" value={data.summary.totalCompletedRuns} hint="Observed runs" accent="blue" />
                <GeoKpiCard label="Runs with citations" value={data.summary.runsWithCitations} hint="Observed source mentions present" accent="emerald" />
                <GeoKpiCard label="Citation coverage" value={data.summary.citationCoveragePercent != null ? `${data.summary.citationCoveragePercent}%` : null} hint="Derived from observed runs" accent="violet" />
                <GeoKpiCard label="Unique hosts" value={data.summary.uniqueSourceHosts} hint="Observed source hosts" accent="amber" />
            </div>

            {noRuns ? (
                <GeoEmptyPanel title={data.emptyState.noRuns.title} description={data.emptyState.noRuns.description} />
            ) : noCitations ? (
                <GeoEmptyPanel title={data.emptyState.noObservedCitations.title} description={data.emptyState.noObservedCitations.description} />
            ) : (
                <>
                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                        <div className="xl:col-span-3">
                            <SourcesTimelineChart sourceMentionsTimeline={data.timeline} />
                        </div>
                        <GeoPremiumCard className="xl:col-span-2 p-5">
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <div>
                                    <div className="text-sm font-semibold text-white/95">By provider/model</div>
                                    <p className="text-[11px] text-white/35">Observed source host mentions per provider/model pair.</p>
                                </div>
                                <GeoProvenancePill meta={data.provenance.summary} />
                            </div>
                            <div className="space-y-3">
                                {data.byProviderModel.map((item) => (
                                    <GeoBarRow
                                        key={item.label}
                                        label={item.label}
                                        value={item.count}
                                        max={Math.max(...data.byProviderModel.map((row) => row.count), 1)}
                                        color="bg-fuchsia-500/75"
                                    />
                                ))}
                            </div>
                        </GeoPremiumCard>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <GeoPremiumCard className="p-5">
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <div>
                                    <div className="text-sm font-semibold text-white/95">Top source hosts</div>
                                    <p className="text-[11px] text-white/35">Most frequently observed hosts across completed runs.</p>
                                </div>
                                <GeoProvenancePill meta={data.provenance.observation} />
                            </div>
                            <div className="space-y-3">
                                {data.topHosts.map((item) => (
                                    <GeoBarRow
                                        key={item.host}
                                        label={item.host}
                                        value={item.count}
                                        max={Math.max(...data.topHosts.map((row) => row.count), 1)}
                                        color="bg-violet-500/80"
                                    />
                                ))}
                            </div>
                        </GeoPremiumCard>

                        <GeoPremiumCard className="p-5">
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <div>
                                    <div className="text-sm font-semibold text-white/95">Prompts with source coverage</div>
                                    <p className="text-[11px] text-white/35">Prompts that currently surface observed source hosts.</p>
                                </div>
                                <GeoProvenancePill meta={data.provenance.summary} />
                            </div>
                            {data.promptCoverage.length ? (
                                <div className="space-y-2">
                                    {data.promptCoverage.map((item) => (
                                        <div key={`${item.query_text}-${item.last_seen_at}`} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                                            <div className="text-sm font-semibold text-white/90">{item.query_text}</div>
                                            <div className="text-[11px] text-white/45 mt-1">{item.category}</div>
                                            <div className="text-[11px] text-white/45 mt-2">
                                                {item.count} source observations · last seen {item.last_seen_at ? new Date(item.last_seen_at).toLocaleDateString('fr-CA') : '—'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <GeoEmptyPanel title="No prompt-level citation coverage yet" description="Source coverage by prompt appears once observed source hosts have been captured." />
                            )}
                        </GeoPremiumCard>
                    </div>
                </>
            )}
        </div>
    );
}
