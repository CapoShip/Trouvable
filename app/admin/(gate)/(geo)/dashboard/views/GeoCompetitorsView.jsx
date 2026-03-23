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
                <GeoEmptyPanel title="Concurrents indisponibles" description="Les données concurrentielles ne sont pas disponibles pour le moment." />
            </div>
        );
    }

    const noRuns = data.summary.totalCompletedRuns === 0;
    const noConfirmedCompetitors = data.summary.competitorMentions === 0;
    const hasGenericOnly = noConfirmedCompetitors && data.summary.genericNonTargetMentions > 0;

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title="Concurrents confirmés"
                subtitle={`Visibilité concurrentielle pour ${client?.client_name || 'ce client'}. Seuls les concurrents confirmés (connus ou détectés avec confiance) sont affichés.`}
                action={(
                    <div className="flex flex-wrap gap-2">
                        <GeoProvenancePill meta={data.provenance.observation} />
                        <GeoProvenancePill meta={data.provenance.summary} />
                    </div>
                )}
            />

            {data.summary.sampleSizeWarning && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] text-amber-200/70">
                    {data.summary.sampleSizeWarning}
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <GeoKpiCard label="Exécutions terminées" value={data.summary.totalCompletedRuns} hint="Exécutions standard terminées" accent="blue" />
                <GeoKpiCard label="Mentions cible" value={data.summary.targetMentions} hint="Mentions confirmées de la marque cible" accent="emerald" />
                <GeoKpiCard label="Concurrents confirmés" value={data.summary.competitorMentions} hint="Concurrents identifiés avec confiance" accent="amber" />
                <GeoKpiCard label="Mentions génériques" value={data.summary.genericNonTargetMentions} hint="Mentions non classifiées comme concurrents" />
                <GeoKpiCard label="Cible absente + concurrent" value={data.summary.runsWithoutTargetButCompetitor} hint="Runs sans cible mais avec concurrent confirmé" accent="amber" />
            </div>

            {noRuns ? (
                <GeoEmptyPanel title={data.emptyState.noRuns.title} description={data.emptyState.noRuns.description} />
            ) : noConfirmedCompetitors ? (
                <GeoEmptyPanel
                    title={data.emptyState.noCompetitors.title}
                    description={data.emptyState.noCompetitors.description}
                />
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <GeoPremiumCard className="p-5">
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div>
                                <div className="text-sm font-semibold text-white/95">Top concurrents confirmés</div>
                                <p className="text-[11px] text-white/35">Concurrents les plus fréquemment mentionnés dans les exécutions.</p>
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

                        {hasGenericOnly && data.genericMentions?.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/[0.06]">
                                <div className="text-[11px] text-white/30 mb-2 font-semibold uppercase tracking-wide">Mentions génériques (non confirmées)</div>
                                <div className="space-y-2">
                                    {data.genericMentions.slice(0, 5).map((item) => (
                                        <div key={item.name} className="flex items-center justify-between text-[11px]">
                                            <span className="text-white/50">{item.name}</span>
                                            <span className="text-white/30">{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </GeoPremiumCard>

                    <GeoPremiumCard className="p-5">
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div>
                                <div className="text-sm font-semibold text-white/95">Prompts exposant des concurrents</div>
                                <p className="text-[11px] text-white/35">Prompts suivis où des concurrents confirmés remontent le plus.</p>
                            </div>
                            <GeoProvenancePill meta={data.provenance.summary} />
                        </div>

                        <div className="space-y-3">
                            {data.promptsWithCompetitors.map((item) => (
                                <div key={item.id} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                                    <div className="text-sm font-semibold text-white/90">{item.query_text}</div>
                                    <div className="text-[11px] text-white/45 mt-1">{item.category}</div>
                                    <div className="text-[11px] text-white/45 mt-2">
                                        {item.competitor_mentions} mention(s) concurrente(s)
                                        {item.recommended_competitors > 0 ? ` dont ${item.recommended_competitors} recommandé(s)` : ''}
                                        {' — '}dernier run {item.latest_run_at ? new Date(item.latest_run_at).toLocaleDateString('fr-CA') : '-'}
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

