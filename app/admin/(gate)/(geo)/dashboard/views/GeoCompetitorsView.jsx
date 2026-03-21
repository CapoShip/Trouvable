'use client';

import { GeoBarRow, GeoEmptyPanel, GeoKpiCard, GeoPremiumCard, GeoProvenancePill, GeoSectionTitle } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../../context/GeoClientContext';

export default function GeoCompetitorsView() {
    const { client } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('competitors');

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement…</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    }

    if (!data) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <GeoEmptyPanel title="Competitors indisponibles" description="La visibilite concurrentielle n'a pas pu etre chargee." />
            </div>
        );
    }

    const noRuns = data.summary.totalCompletedRuns === 0;
    const noCompetitorObservations = data.summary.competitorMentions + data.summary.genericNonTargetMentions === 0;

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title="Tracked-run competitors"
                subtitle={`Visibilite concurrentielle observee pour ${client?.client_name || 'ce client'}. Cette vue ne pretend pas etre une veille concurrentielle externe complete.`}
                action={(
                    <div className="flex flex-wrap gap-2">
                        <GeoProvenancePill meta={data.provenance.observation} />
                        <GeoProvenancePill meta={data.provenance.summary} />
                    </div>
                )}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <GeoKpiCard label="Completed runs" value={data.summary.totalCompletedRuns} hint="Observed completed runs" accent="blue" />
                <GeoKpiCard label="Target mentions" value={data.summary.targetMentions} hint="Observed target business mentions" accent="emerald" />
                <GeoKpiCard label="Competitor mentions" value={data.summary.competitorMentions} hint="Observed competitor entities" accent="amber" />
                <GeoKpiCard label="Target absent but competitor present" value={data.summary.runsWithoutTargetButCompetitor} hint="Derived from tracked-run observations" accent="amber" />
            </div>

            {noRuns ? (
                <GeoEmptyPanel title={data.emptyState.noRuns.title} description={data.emptyState.noRuns.description} />
            ) : noCompetitorObservations ? (
                <GeoEmptyPanel title={data.emptyState.noCompetitors.title} description={data.emptyState.noCompetitors.description} />
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <GeoPremiumCard className="p-5">
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div>
                                <div className="text-sm font-semibold text-white/95">Top competitor and non-target names</div>
                                <p className="text-[11px] text-white/35">Most frequent names observed instead of or alongside the client.</p>
                            </div>
                            <GeoProvenancePill meta={data.provenance.observation} />
                        </div>

                        <div className="space-y-3">
                            {data.topCompetitors.map((item) => (
                                <GeoBarRow
                                    key={item.name}
                                    label={item.name}
                                    value={item.count}
                                    max={Math.max(...data.topCompetitors.map((row) => row.count), 1)}
                                    color="bg-amber-500/80"
                                />
                            ))}
                        </div>
                    </GeoPremiumCard>

                    <GeoPremiumCard className="p-5">
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div>
                                <div className="text-sm font-semibold text-white/95">Prompts surfacing competitors</div>
                                <p className="text-[11px] text-white/35">Tracked prompts where competitor observations appear most often.</p>
                            </div>
                            <GeoProvenancePill meta={data.provenance.summary} />
                        </div>

                        <div className="space-y-3">
                            {data.promptsWithCompetitors.map((item) => (
                                <div key={item.id} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                                    <div className="text-sm font-semibold text-white/90">{item.query_text}</div>
                                    <div className="text-[11px] text-white/45 mt-1">{item.category}</div>
                                    <div className="text-[11px] text-white/45 mt-2">
                                        {item.competitor_mentions} competitor observations · last run {item.latest_run_at ? new Date(item.latest_run_at).toLocaleDateString('fr-CA') : '—'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GeoPremiumCard>
                </div>
            )}
        </div>
    );
}
