'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { GeoBarRow, GeoEmptyPanel, GeoKpiCard, GeoPremiumCard, GeoProvenancePill, GeoSectionTitle } from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';

function threatLevel(count, topCount) {
    if (!topCount || !count) return 'low';
    const ratio = count / topCount;
    if (ratio >= 0.6) return 'high';
    if (ratio >= 0.25) return 'medium';
    return 'low';
}

const THREAT_META = {
    high: { label: 'Élevé', cls: 'text-red-300 bg-red-400/10 border-red-400/20' },
    medium: { label: 'Modéré', cls: 'text-amber-300 bg-amber-400/10 border-amber-400/20' },
    low: { label: 'Faible', cls: 'text-white/40 bg-white/[0.03] border-white/10' },
};

function ThreatBadge({ level }) {
    const t = THREAT_META[level] || THREAT_META.low;
    return (
        <span className={`inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.04em] ${t.cls}`}>
            {t.label}
        </span>
    );
}

export default function GeoCompetitorsView() {
    const { client, clientId } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('competitors');

    const topCount = useMemo(() => {
        if (!data?.topCompetitors?.length) return 1;
        return Math.max(...data.topCompetitors.map((c) => c.count), 1);
    }, [data]);

    if (loading) return <div className="p-8 text-center text-[var(--geo-t3)] text-sm animate-pulse">Chargement...</div>;
    if (error) return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    if (!data) return (
        <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
            <GeoEmptyPanel title="Concurrents indisponibles" description="Les données concurrentielles ne sont pas disponibles." />
        </div>
    );

    const noRuns = data.summary.totalCompletedRuns === 0;
    const noConfirmed = data.summary.competitorMentions === 0;
    const hasGenericOnly = noConfirmed && data.summary.genericNonTargetMentions > 0;
    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';

    return (
        <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title="Concurrents confirmés"
                subtitle={`Visibilité concurrentielle pour ${client?.client_name || 'ce client'}. Seuls les concurrents confirmés sont affichés.`}
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

            {/* Actionable alert */}
            {data.summary.runsWithoutTargetButCompetitor > 0 && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-3 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    <div>
                        <div className="text-[11px] font-semibold text-red-300">
                            {data.summary.runsWithoutTargetButCompetitor} run{data.summary.runsWithoutTargetButCompetitor > 1 ? 's' : ''} où un concurrent apparaît mais pas la cible
                        </div>
                        <div className="text-[10px] text-red-200/50 mt-0.5">Ces prompts représentent un risque de substitution directe.</div>
                        <Link href={`${baseHref}/ameliorer`} className="inline-flex items-center gap-1 text-[10px] text-red-300/70 hover:text-red-200 mt-1.5 transition-colors">
                            Voir les opportunités →
                        </Link>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <GeoKpiCard label="Runs terminés" value={data.summary.totalCompletedRuns} accent="blue" />
                <GeoKpiCard label="Mentions cible" value={data.summary.targetMentions} accent="emerald" />
                <GeoKpiCard label="Concurrents confirmés" value={data.summary.competitorMentions} accent="amber" />
                <GeoKpiCard label="Mentions génériques" value={data.summary.genericNonTargetMentions} />
                <GeoKpiCard label="Cible absente + concurrent" value={data.summary.runsWithoutTargetButCompetitor} accent={data.summary.runsWithoutTargetButCompetitor > 0 ? 'amber' : 'default'} />
            </div>

            {noRuns ? (
                <GeoEmptyPanel title={data.emptyState.noRuns.title} description={data.emptyState.noRuns.description} />
            ) : noConfirmed ? (
                <GeoEmptyPanel
                    title={data.emptyState.noCompetitors.title}
                    description={data.emptyState.noCompetitors.description}
                />
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <GeoPremiumCard className="p-5">
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div>
                                <div className="text-sm font-semibold text-white/95">Concurrents par fréquence</div>
                                <p className="text-[11px] text-white/35">Classés par niveau de menace.</p>
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            {data.topCompetitors.map((item) => {
                                const level = threatLevel(item.count, topCount);
                                return (
                                    <div key={item.name} className="flex items-center gap-2">
                                        <div className="flex-1 min-w-0">
                                            <GeoBarRow label={item.name} value={item.count} max={topCount} color="bg-amber-500/80" />
                                        </div>
                                        <ThreatBadge level={level} />
                                    </div>
                                );
                            })}
                        </div>

                        {hasGenericOnly && data.genericMentions?.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/[0.06]">
                                <div className="text-[10px] text-white/25 mb-2 font-semibold uppercase tracking-wide">Mentions non confirmées</div>
                                <div className="space-y-1.5">
                                    {data.genericMentions.slice(0, 5).map((item) => (
                                        <div key={item.name} className="flex items-center justify-between text-[10px]">
                                            <span className="text-white/40">{item.name}</span>
                                            <span className="text-white/25">{item.count}</span>
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
                                <p className="text-[11px] text-white/35">Prompts où des concurrents remontent le plus.</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {data.promptsWithCompetitors.map((item) => (
                                <div key={item.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-[12px] font-medium text-white/85 truncate">{item.query_text}</div>
                                        {item.recommended_competitors > 0 && (
                                            <span className="inline-flex rounded-md border border-red-400/20 bg-red-400/10 px-1.5 py-0.5 text-[9px] font-bold text-red-300 uppercase">
                                                {item.recommended_competitors} recommandé{item.recommended_competitors > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-white/35 mt-1">
                                        {item.competitor_mentions} mention{item.competitor_mentions > 1 ? 's' : ''} · {item.category} · vu {item.latest_run_at ? new Date(item.latest_run_at).toLocaleDateString('fr-CA') : '-'}
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
