'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useGeoClient } from '../../context/GeoClientContext';
import { CumulativeModelVisibilityChart } from '../components/GeoRealCharts';
import { GeoModelAvatar, GeoPremiumCard, GeoBarRow } from '../components/GeoPremium';

const CARD_COLORS = [
    'from-emerald-500/20 to-transparent',
    'from-sky-500/20 to-transparent',
    'from-orange-500/20 to-transparent',
    'from-cyan-500/20 to-transparent',
    'from-violet-500/20 to-transparent',
];

export default function GeoModelesView() {
    const { metrics, clientId, loading, recentQueryRuns } = useGeoClient();
    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';
    const byProv = metrics?.runsByProvider || {};
    const entries = Object.entries(byProv).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((a, [, n]) => a + n, 0);
    const modelPerf = metrics?.modelPerformance || [];

    const maxRuns = useMemo(() => Math.max(1, ...modelPerf.map((r) => r.runs)), [modelPerf]);

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement…</div>;
    }

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <div className="text-2xl font-bold tracking-[-0.03em] text-white font-['Plus_Jakarta_Sans',sans-serif]">
                        Modèles IA
                    </div>
                    <p className="text-[13px] text-white/40 mt-1">Performance détaillée par moteur génératif (données réelles)</p>
                </div>
                <Link href={`${baseHref}?view=visibilite`} className="geo-btn geo-btn-ghost border border-white/12">
                    Voir la visibilité complète →
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {modelPerf.length === 0 ? (
                    <div className="col-span-full geo-premium-card p-10 text-center text-sm text-white/35 border border-dashed border-white/15">
                        Aucun GEO query run — les cartes modèles s’afficheront après exécution.
                    </div>
                ) : (
                    modelPerf.slice(0, 5).map((row, i) => (
                        <GeoPremiumCard
                            key={`${row.provider}-${row.model}-${i}`}
                            className={`p-5 bg-gradient-to-b ${CARD_COLORS[i % CARD_COLORS.length]} geo-premium-glow-violet`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <GeoModelAvatar label={row.provider} color="bg-white/10" />
                            </div>
                            <div className="text-[10px] text-white/40 uppercase font-bold">{row.provider}</div>
                            <div className="text-sm font-semibold text-white/95 truncate mb-3">{row.model}</div>
                            <div className="text-3xl font-bold text-emerald-400/95 mb-1">{row.targetRatePercent}%</div>
                            <div className="text-[10px] text-white/35">Taux détection marque</div>
                            <div className="mt-3 h-px bg-white/10" />
                            <div className="mt-2 text-[10px] text-white/40">
                                {row.runs} runs · {row.sources} sources
                            </div>
                        </GeoPremiumCard>
                    ))
                )}
            </div>

            <CumulativeModelVisibilityChart
                recentQueryRuns={recentQueryRuns}
                title="Évolution par modèle"
                subtitle="Comparaison cumulée — top modèles présents dans l’historique des runs"
            />

            <GeoPremiumCard className="p-5">
                <div className="text-[11px] font-bold text-white/25 uppercase mb-3">Volume par provider</div>
                {entries.length === 0 ? (
                    <p className="text-xs text-white/35">—</p>
                ) : (
                    <div className="space-y-3">
                        {entries.map(([provider, count]) => (
                            <GeoBarRow
                                key={provider}
                                label={provider}
                                value={count}
                                max={Math.max(...entries.map(([, c]) => c), 1)}
                                color="bg-slate-500/70"
                            />
                        ))}
                    </div>
                )}
                <p className="text-[10px] text-white/30 mt-3">Total : {total} runs</p>
            </GeoPremiumCard>
        </div>
    );
}
