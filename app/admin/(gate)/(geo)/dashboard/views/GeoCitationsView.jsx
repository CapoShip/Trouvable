'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useGeoClient } from '../../context/GeoClientContext';
import { SourcesTimelineChart } from '../components/GeoRealCharts';
import { GeoPremiumCard, GeoBarRow } from '../components/GeoPremium';
import GeoDonut from '../components/GeoDonut';

export default function GeoCitationsView() {
    const { client, metrics, clientId, loading } = useGeoClient();
    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';
    const top = metrics?.topSources || [];
    const totalSources = metrics?.sourceMentions ?? 0;
    const unique = metrics?.uniqueSourceHosts ?? 0;
    const timeline = metrics?.sourceMentionsTimeline || [];
    const modelPerf = metrics?.modelPerformance || [];

    const modelsWithSources = useMemo(
        () => [...modelPerf].filter((r) => r.sources > 0).sort((a, b) => b.sources - a.sources),
        [modelPerf]
    );
    const maxSrcModel = useMemo(() => Math.max(1, ...modelPerf.map((r) => r.sources)), [modelPerf]);

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement…</div>;
    }

    const cov = metrics?.citationCoveragePercent;

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <div className="text-2xl font-bold tracking-[-0.03em] text-white font-['Plus_Jakarta_Sans',sans-serif]">
                        Citations
                    </div>
                    <p className="text-[13px] text-white/40 mt-1">
                        Sources réellement extraites des réponses pour {client?.client_name || 'ce client'}
                    </p>
                </div>
                <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-vio px-4 py-2 text-xs">
                    Améliorer les citations →
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <GeoPremiumCard className="p-4 md:p-5">
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-[0.1em]">Total citations</div>
                    <div className="text-3xl font-bold text-white mt-2">{totalSources}</div>
                    <p className="text-[10px] text-white/35 mt-2">Mentions source</p>
                </GeoPremiumCard>
                <GeoPremiumCard className="p-4 md:p-5">
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-[0.1em]">Domaines</div>
                    <div className="text-3xl font-bold text-white mt-2">{unique}</div>
                    <span className="inline-block mt-2 geo-pill-n text-[9px]">uniques</span>
                </GeoPremiumCard>
                <GeoPremiumCard className="p-4 md:p-5 flex flex-col justify-center items-center text-center">
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-[0.1em] w-full text-left mb-2">
                        Couverture (runs)
                    </div>
                    <GeoDonut percent={cov ?? undefined} size={100} stroke={8} color="#a78bfa">
                        <div className="text-lg font-bold text-white">{cov != null ? `${cov}%` : '—'}</div>
                    </GeoDonut>
                    <p className="text-[9px] text-white/35 mt-2">Runs avec ≥1 source</p>
                </GeoPremiumCard>
                <GeoPremiumCard className="p-4 md:p-5">
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-[0.1em]">Typologie</div>
                    <p className="text-[11px] text-white/38 mt-3 leading-relaxed">
                        Classification UGC / éditorial non disponible sans règles métier — à venir.
                    </p>
                </GeoPremiumCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
                <div className="xl:col-span-3">
                    <SourcesTimelineChart sourceMentionsTimeline={timeline} />
                </div>
                <GeoPremiumCard className="xl:col-span-2 p-5">
                    <div className="flex justify-between items-start gap-2 mb-3">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Sources par modèle IA</div>
                            <p className="text-[11px] text-white/35">Nombre de mentions source par moteur</p>
                        </div>
                        <div className="geo-tabs opacity-90">
                            <span className="geo-tab on">Domaines</span>
                            <span className="geo-tab opacity-40 cursor-default">Modèles</span>
                        </div>
                    </div>
                    {modelsWithSources.length === 0 ? (
                        <p className="text-xs text-white/35">—</p>
                    ) : (
                        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                            {modelsWithSources.slice(0, 6).map((row) => (
                                <GeoBarRow
                                    key={`${row.provider}-${row.model}`}
                                    label={`${row.provider} · ${row.model}`}
                                    sub={`${row.runs} runs`}
                                    value={row.sources}
                                    max={maxSrcModel}
                                    color="bg-fuchsia-500/75"
                                />
                            ))}
                        </div>
                    )}
                </GeoPremiumCard>
            </div>

            <GeoPremiumCard className="p-0 overflow-hidden">
                <div className="px-5 py-3 border-b border-white/[0.08] bg-black/30">
                    <div className="text-sm font-semibold text-white/95">Sources de citations</div>
                    <p className="text-[11px] text-white/35">Domaines les plus fréquents dans les réponses</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[10px] uppercase tracking-[0.08em] text-white/35 border-b border-white/[0.06]">
                                <th className="px-5 py-3 font-bold">Domaine</th>
                                <th className="px-3 py-3 font-bold">Type</th>
                                <th className="px-3 py-3 font-bold text-right">Part</th>
                                <th className="px-5 py-3 font-bold text-right">Mentions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {top.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-10 text-center text-white/35 text-xs">
                                        Aucune source détectée — lancez des GEO query runs.
                                    </td>
                                </tr>
                            ) : (
                                top.map((row) => {
                                    const share = totalSources > 0 ? Math.round((row.count / totalSources) * 100) : 0;
                                    return (
                                        <tr key={row.host} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                                            <td className="px-5 py-3 font-medium text-white/90">
                                                <span className="inline-flex items-center gap-2">
                                                    <span className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-[10px] text-white/50">
                                                        {row.host.slice(0, 2).toUpperCase()}
                                                    </span>
                                                    {row.host}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className="geo-pill-v text-[9px]">Source</span>
                                            </td>
                                            <td className="px-3 py-3 text-right font-mono text-white/60">{share}%</td>
                                            <td className="px-5 py-3 text-right font-mono text-white/80">{row.count}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </GeoPremiumCard>
        </div>
    );
}
