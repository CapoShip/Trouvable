'use client';

import { CumulativeModelVisibilityChart } from '../components/GeoRealCharts';
import { GeoBarRow, GeoEmptyPanel, GeoKpiCard, GeoModelAvatar, GeoPremiumCard, GeoProvenancePill, GeoSectionTitle } from '../components/GeoPremium';
import { useGeoWorkspaceSlice } from '../../context/GeoClientContext';

const CARD_COLORS = [
    'from-emerald-500/20 to-transparent',
    'from-sky-500/20 to-transparent',
    'from-orange-500/20 to-transparent',
    'from-cyan-500/20 to-transparent',
    'from-violet-500/20 to-transparent',
];

export default function GeoModelesView() {
    const { data, loading, error } = useGeoWorkspaceSlice('models');

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement…</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    }

    if (!data) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <GeoEmptyPanel title="Modeles indisponibles" description="La couche provider/model n'a pas pu etre chargee." />
            </div>
        );
    }

    const noRuns = data.summary.totalRuns === 0;

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title="Modeles IA"
                subtitle="Comparaison des providers et modeles reellement utilises dans les runs completes."
                action={(
                    <div className="flex flex-wrap gap-2">
                        <GeoProvenancePill meta={data.provenance.observed} />
                        <GeoProvenancePill meta={data.provenance.derived} />
                    </div>
                )}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <GeoKpiCard label="Completed runs" value={data.summary.totalRuns} hint="Observed completed runs" accent="blue" />
                <GeoKpiCard label="Providers" value={data.summary.totalProviders} hint="Derived from run history" accent="violet" />
                <GeoKpiCard label="Best model rate" value={data.modelPerformance[0] ? `${data.modelPerformance[0].targetRatePercent}%` : null} hint="Derived from completed runs" accent="emerald" />
                <GeoKpiCard label="Top provider" value={data.providerCounts[0]?.provider || null} hint="Most active provider by completed runs" accent="amber" />
            </div>

            {noRuns ? (
                <GeoEmptyPanel title={data.emptyState.title} description={data.emptyState.description} />
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {data.modelPerformance.slice(0, 5).map((row, index) => (
                            <GeoPremiumCard
                                key={`${row.provider}-${row.model}-${index}`}
                                className={`p-5 bg-gradient-to-b ${CARD_COLORS[index % CARD_COLORS.length]} geo-premium-glow-violet`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <GeoModelAvatar label={row.provider} color="bg-white/10" />
                                    <GeoProvenancePill meta={data.provenance.derived} className="shrink-0" />
                                </div>
                                <div className="text-[10px] text-white/40 uppercase font-bold">{row.provider}</div>
                                <div className="text-sm font-semibold text-white/95 truncate mb-3">{row.model}</div>
                                <div className="text-3xl font-bold text-emerald-400/95 mb-1">{row.targetRatePercent}%</div>
                                <div className="text-[10px] text-white/35">Target found rate</div>
                                <div className="mt-3 h-px bg-white/10" />
                                <div className="mt-2 text-[10px] text-white/40">
                                    {row.runs} runs · {row.sources} sources
                                </div>
                            </GeoPremiumCard>
                        ))}
                    </div>

                    <CumulativeModelVisibilityChart
                        recentQueryRuns={data.recentQueryRuns}
                        title="Observed trend by model"
                        subtitle="Cumulative target detection by day across models that have actually been used."
                    />

                    <GeoPremiumCard className="p-5">
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div>
                                <div className="text-sm font-semibold text-white/95">Provider volume</div>
                                <p className="text-[11px] text-white/35">Completed run count by provider.</p>
                            </div>
                            <GeoProvenancePill meta={data.provenance.summary} />
                        </div>
                        <div className="space-y-3">
                            {data.providerCounts.map((item) => (
                                <GeoBarRow
                                    key={item.provider}
                                    label={item.provider}
                                    value={item.count}
                                    max={Math.max(...data.providerCounts.map((row) => row.count), 1)}
                                    color="bg-slate-500/70"
                                />
                            ))}
                        </div>
                    </GeoPremiumCard>
                </>
            )}
        </div>
    );
}
