'use client';

import { useMemo, useState } from 'react';
import { SourcesTimelineChart } from '../components/GeoRealCharts';
import { GeoBarRow, GeoEmptyPanel, GeoKpiCard, GeoPremiumCard, GeoProvenancePill, GeoSectionTitle } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../../context/GeoClientContext';

function signalStrength(count, max) {
    if (!max || !count) return 'noise';
    const ratio = count / max;
    if (ratio >= 0.5) return 'strong';
    if (ratio >= 0.15) return 'moderate';
    return 'noise';
}

const SIGNAL_LABELS = {
    strong: { label: 'Fort', cls: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20' },
    moderate: { label: 'Modéré', cls: 'text-amber-300 bg-amber-400/10 border-amber-400/20' },
    noise: { label: 'Faible', cls: 'text-white/40 bg-white/[0.03] border-white/10' },
};

function SignalBadge({ strength }) {
    const s = SIGNAL_LABELS[strength] || SIGNAL_LABELS.noise;
    return (
        <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.04em] ${s.cls}`}>
            {s.label}
        </span>
    );
}

export default function GeoCitationsView() {
    const { client } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('citations');
    const [showAll, setShowAll] = useState(false);

    const maxHostCount = useMemo(() => {
        if (!data?.topHosts?.length) return 1;
        return Math.max(...data.topHosts.map((row) => row.count), 1);
    }, [data]);

    if (loading) return <div className="p-8 text-center text-[var(--geo-t3)] text-sm animate-pulse">Chargement...</div>;
    if (error) return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    if (!data) return (
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
            <GeoEmptyPanel title="Citations indisponibles" description="Données sources non disponibles." />
        </div>
    );

    const noRuns = data.summary.totalCompletedRuns === 0;
    const noCitations = data.summary.totalSourceMentions === 0;
    const displayHosts = showAll ? data.topHosts : data.topHosts?.slice(0, 8);

    return (
        <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title="Citations observées"
                subtitle={`Sources détectées dans les réponses IA pour ${client?.client_name || 'ce client'}.`}
                action={(
                    <div className="flex flex-wrap gap-2">
                        <GeoProvenancePill meta={data.provenance.observation} />
                        <GeoProvenancePill meta={data.provenance.summary} />
                    </div>
                )}
            />

            {data.summary.sampleSizeWarning && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3 text-[11px] text-amber-200/60">
                    {data.summary.sampleSizeWarning}
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <GeoKpiCard label="Runs terminés" value={data.summary.totalCompletedRuns} accent="blue" />
                <GeoKpiCard label="Runs avec citations" value={data.summary.runsWithCitations} accent="emerald" />
                <GeoKpiCard label="Couverture" value={data.summary.citationCoveragePercent != null ? `${data.summary.citationCoveragePercent}%` : null} accent="violet" />
                <GeoKpiCard label="Sources externes" value={data.summary.externalSourceMentions ?? data.summary.totalSourceMentions} accent="amber" />
                <GeoKpiCard label="Domaines uniques" value={data.summary.uniqueSourceHosts} />
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
                                    <div className="text-sm font-semibold text-white/95">Par provider/modèle</div>
                                    <p className="text-[11px] text-white/35">Volume source par couple.</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {data.byProviderModel.map((item) => (
                                    <GeoBarRow key={item.label} label={item.label} value={item.count} max={Math.max(...data.byProviderModel.map((row) => row.count), 1)} color="bg-fuchsia-500/75" />
                                ))}
                            </div>
                        </GeoPremiumCard>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <GeoPremiumCard className="p-5">
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <div>
                                    <div className="text-sm font-semibold text-white/95">Top domaines source</div>
                                    <p className="text-[11px] text-white/35">Classés par force de signal.</p>
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                {displayHosts?.map((item) => {
                                    const strength = signalStrength(item.count, maxHostCount);
                                    return (
                                        <div key={item.host} className="flex items-center gap-2">
                                            <div className="flex-1 min-w-0">
                                                <GeoBarRow label={item.host} value={item.count} max={maxHostCount} color="bg-violet-500/80" />
                                            </div>
                                            <SignalBadge strength={strength} />
                                        </div>
                                    );
                                })}
                            </div>
                            {data.topHosts?.length > 8 && !showAll && (
                                <button type="button" onClick={() => setShowAll(true)} className="geo-btn geo-btn-ghost w-full justify-center mt-3">
                                    Afficher tous ({data.topHosts.length})
                                </button>
                            )}
                        </GeoPremiumCard>

                        <GeoPremiumCard className="p-5">
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <div>
                                    <div className="text-sm font-semibold text-white/95">Couverture par prompt</div>
                                    <p className="text-[11px] text-white/35">Prompts générant des sources.</p>
                                </div>
                            </div>
                            {data.promptCoverage.length ? (
                                <div className="space-y-2">
                                    {data.promptCoverage.map((item) => (
                                        <div key={`${item.query_text}-${item.last_seen_at}`} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="text-[12px] font-medium text-white/85 truncate">{item.query_text}</div>
                                                <SignalBadge strength={signalStrength(item.count, data.promptCoverage[0]?.count || 1)} />
                                            </div>
                                            <div className="text-[10px] text-white/35 mt-1">
                                                {item.count} observations · {item.category} · vu {item.last_seen_at ? new Date(item.last_seen_at).toLocaleDateString('fr-CA') : '-'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <GeoEmptyPanel title="Aucune couverture" description="La couverture apparaît après détection de sources." />
                            )}
                        </GeoPremiumCard>
                    </div>
                </>
            )}
        </div>
    );
}
