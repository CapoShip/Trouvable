'use client';

import { GeoBarRow, GeoEmptyPanel, GeoKpiCard, GeoPremiumCard, GeoProvenancePill, GeoSectionTitle } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../../context/GeoClientContext';

export default function GeoCompetitorsView() {
    const { client } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('competitors');

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    }

    if (!data) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <GeoEmptyPanel title="Concurrents indisponibles" description="La couche de visibilite concurrentielle n a pas pu etre chargee." />
            </div>
        );
    }

    const noRuns = data.summary.totalCompletedRuns === 0;
    const noCompetitorObservations = data.summary.competitorMentions + data.summary.genericNonTargetMentions === 0;

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title="Concurrents observes"
                subtitle={`Visibilite concurrentielle observee pour ${client?.client_name || 'ce client'}. Cette vue ne pretend pas remplacer une veille externe exhaustive.`}
                action={(
                    <div className="flex flex-wrap gap-2">
                        <GeoProvenancePill meta={data.provenance.observation} />
                        <GeoProvenancePill meta={data.provenance.summary} />
                    </div>
                )}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <GeoKpiCard label="Executions terminees" value={data.summary.totalCompletedRuns} hint="Executions observees terminees" accent="blue" />
                <GeoKpiCard label="Mentions cible" value={data.summary.targetMentions} hint="Mentions de la marque cible" accent="emerald" />
                <GeoKpiCard label="Mentions concurrents" value={data.summary.competitorMentions} hint="Entites concurrentes observees" accent="amber" />
                <GeoKpiCard label="Cible absente, concurrent present" value={data.summary.runsWithoutTargetButCompetitor} hint="Derive des runs observes" accent="amber" />
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
                                <div className="text-sm font-semibold text-white/95">Top noms concurrents et hors cible</div>
                                <p className="text-[11px] text-white/35">Noms les plus frequents observes a la place de la marque ou a ses cotes.</p>
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
                                <div className="text-sm font-semibold text-white/95">Prompts exposant des concurrents</div>
                                <p className="text-[11px] text-white/35">Prompts suivis ou des observations concurrentes remontent le plus.</p>
                            </div>
                            <GeoProvenancePill meta={data.provenance.summary} />
                        </div>

                        <div className="space-y-3">
                            {data.promptsWithCompetitors.map((item) => (
                                <div key={item.id} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                                    <div className="text-sm font-semibold text-white/90">{item.query_text}</div>
                                    <div className="text-[11px] text-white/45 mt-1">{item.category}</div>
                                    <div className="text-[11px] text-white/45 mt-2">
                                        {item.competitor_mentions} observations concurrentes - dernier run {item.latest_run_at ? new Date(item.latest_run_at).toLocaleDateString('fr-CA') : '-'}
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

