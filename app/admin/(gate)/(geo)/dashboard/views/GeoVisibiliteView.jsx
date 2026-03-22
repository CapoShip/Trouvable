'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useGeoClient } from '../../context/GeoClientContext';
import { AuditScoresLineChart, CumulativeModelVisibilityChart, QueryRunsVisibilityChart } from '../components/GeoRealCharts';
import { GeoDeltaPill, GeoModelAvatar, GeoPremiumCard, GeoBarRow } from '../components/GeoPremium';
import { visibilityTrendPercentPoints } from '@/lib/geo-trends';

const TOPIC_COLORS = ['bg-violet-500/80', 'bg-emerald-500/75', 'bg-sky-500/75', 'bg-amber-500/70', 'bg-fuchsia-500/70'];

export default function GeoVisibilitéView() {
    const { client, metrics, clientId, loading, recentAudits, recentQueryRuns, trackedQueries, lastRunByQuery } =
        useGeoClient();
    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';
    const m = metrics;

    const visTrend = useMemo(() => visibilityTrendPercentPoints(recentQueryRuns || []), [recentQueryRuns]);

    const topicRows = useMemo(() => {
        const list = trackedQueries || [];
        const withRun = list
            .map((tq) => ({
                tq,
                run: lastRunByQuery?.[tq.id],
            }))
            .filter((x) => x.run)
            .slice(0, 5);
        return withRun;
    }, [trackedQueries, lastRunByQuery]);

    const modelCols = useMemo(() => (m?.modelPerformance || []).slice(0, 5), [m?.modelPerformance]);

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement…</div>;
    }

    const hasRuns = (m?.totalQueryRuns ?? 0) > 0;
    const vis = m?.visibilityProxyPercent;

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <div className="text-2xl font-bold tracking-[-0.03em] text-white font-['Plus_Jakarta_Sans',sans-serif]">
                        Visibilité IA
                    </div>
                    <p className="text-[13px] text-white/40 mt-1">
                        Suivi de votre présence dans les réponses IA — {client?.client_name || 'client'}
                    </p>
                </div>
                <Link href={`${baseHref}?view=améliorer`} className="geo-btn geo-btn-vio px-4 py-2 text-xs">
                    Améliorer le score →
                </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <GeoPremiumCard className="p-4 md:p-5">
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-[0.1em]">Score global (proxy)</div>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl md:text-4xl font-bold text-white geo-premium-hero-num">{vis != null ? `${vis}%` : '—'}</span>
                        {visTrend != null && <GeoDeltaPill value={visTrend} unit=" pts" />}
                    </div>
                    <p className="text-[10px] text-white/35 mt-2">Basé sur les runs terminés</p>
                </GeoPremiumCard>
                <GeoPremiumCard className="p-4 md:p-5">
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-[0.1em]">Rang interne</div>
                    <div className="text-3xl md:text-4xl font-bold text-white mt-2">
                        {modelCols.length ? `#${1}` : '—'}
                    </div>
                    <p className="text-[10px] text-white/35 mt-2">Meilleur modèle (taux détection)</p>
                </GeoPremiumCard>
                <GeoPremiumCard className="p-4 md:p-5">
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-[0.1em]">Réponses analysées</div>
                    <div className="text-3xl md:text-4xl font-bold text-white mt-2">{m?.totalQueryRuns ?? 0}</div>
                    <span className="inline-block mt-2 geo-pill-n'text-[9px]">Runs terminés</span>
                </GeoPremiumCard>
                <GeoPremiumCard className="p-4 md:p-5">
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-[0.1em]">Citations détectées</div>
                    <div className="text-3xl md:text-4xl font-bold text-violet-300/95 mt-2">{m?.sourceMentions ?? 0}</div>
                    <p className="text-[10px] text-white/35 mt-2">Mentions type source</p>
                </GeoPremiumCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <CumulativeModelVisibilityChart
                    recentQueryRuns={recentQueryRuns}
                    title="Évolution du score de visibilité"
                    subtitle="Tendance cumulée par modèle réel — pas de courbes concurrentes fictives"
                />
                <GeoPremiumCard className="p-5">
                    <div className="flex justify-between items-start gap-2 mb-4">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Visibilité par prompt</div>
                            <p className="text-[11px] text-white/35">Dernier run connu par requête suivie</p>
                        </div>
                        <div className="geo-tabs">
                            <span className="geo-tab on">Prompts</span>
                            <span className="geo-tab opacity-40 cursor-default">Modèles</span>
                        </div>
                    </div>
                    {topicRows.length === 0 ? (
                        <p className="text-xs text-white/35">Aucun prompt avec run — ajoutez des tracked queries.</p>
                    ) : (
                        <div className="space-y-4">
                            {topicRows.map(({ tq, run }, i) => {
                                const pct = run.target_found ? 100 : 0;
                                return (
                                    <div key={tq.id}>
                                        <div className="flex justify-between gap-2 text-[11px] text-white/55 mb-1">
                                            <span className="truncate flex-1">{tq.query_text}</span>
                                            <span className="text-white/40 font-mono">{pct}%</span>
                                        </div>
                                        <GeoBarRow
                                            label=""
                                            value={pct}
                                            max={100}
                                            color={TOPIC_COLORS[i % TOPIC_COLORS.length]}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </GeoPremiumCard>
            </div>

            <GeoPremiumCard className="p-5">
                <div className="mb-5">
                    <div className="text-sm font-semibold text-white/95">Performance par modèle IA</div>
                    <p className="text-[11px] text-white/35">Comparaison détaillée — uniquement les moteurs présents dans vos runs</p>
                </div>
                {!hasRuns || modelCols.length === 0 ? (
                    <p className="text-xs text-white/35 py-8 text-center border border-dashed border-white/10 rounded-xl">
                        Aucun run — les cartes modèles apparaîtront après'exécution.
                    </p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {modelCols.map((row, i) => (
                            <div
                                key={`${row.provider}-${row.model}-${i}`}
                                className="rounded-xl border border-white/[0.08] bg-black/40 p-4 text-center hover:border-violet-500/30 transition-colors"
                            >
                                <div className="flex justify-center mb-2">
                                    <GeoModelAvatar label={row.provider} color="bg-white/10" />
                                </div>
                                <div className="text-[10px] text-white/40 uppercase font-bold truncate">{row.provider}</div>
                                <div className="text-xs font-medium text-white/90 truncate mb-2">{row.model}</div>
                                <div className="text-2xl font-bold text-emerald-400/95">{row.targetRatePercent}%</div>
                                <div className="mt-2 text-[10px] text-white/35">{row.runs} runs · {row.sources} src.</div>
                            </div>
                        ))}
                    </div>
                )}
            </GeoPremiumCard>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <AuditScoresLineChart recentAudits={recentAudits} />
                <QueryRunsVisibilityChart recentQueryRuns={recentQueryRuns} />
            </div>
        </div>
    );
}
