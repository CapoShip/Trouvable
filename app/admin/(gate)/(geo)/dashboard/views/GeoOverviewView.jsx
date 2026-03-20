'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useGeoClient } from '../../context/GeoClientContext';
import {
    AuditScoresLineChart,
    CumulativeModelVisibilityChart,
    QueryRunsVisibilityChart,
} from '../components/GeoRealCharts';
import {
    GeoBarRow,
    GeoDeltaPill,
    GeoModelAvatar,
    GeoPremiumCard,
    GeoSectionTitle,
} from '../components/GeoPremium';
import GeoDonut from '../components/GeoDonut';
import { visibilityTrendPercentPoints } from '@/lib/geo-trends';

function fmtDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return '—';
    }
}

const AVATAR_COLORS = [
    'bg-violet-600/40',
    'bg-sky-600/35',
    'bg-emerald-600/35',
    'bg-amber-600/35',
    'bg-rose-600/35',
];

export default function GeoOverviewView() {
    const {
        client,
        audit,
        metrics,
        clientId,
        loading,
        recentAudits,
        recentQueryRuns,
        opportunities,
        mergeSuggestionsPending,
    } = useGeoClient();
    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';

    const m = metrics;
    const seo = m?.seoScore ?? audit?.seo_score ?? null;
    const geo = m?.geoScore ?? audit?.geo_score ?? null;

    const visTrend = useMemo(() => visibilityTrendPercentPoints(recentQueryRuns || []), [recentQueryRuns]);

    const rankedModels = useMemo(() => {
        const list = [...(m?.modelPerformance || [])].sort((a, b) => b.targetRatePercent - a.targetRatePercent);
        return list.slice(0, 5);
    }, [m?.modelPerformance]);

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement…</div>;
    }

    const visPct = m?.visibilityProxyPercent;
    const covPct = m?.citationCoveragePercent;
    const mentionRate = m?.trackedPromptStats?.mentionRatePercent;

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                    <div className="text-2xl md:text-[26px] font-bold tracking-[-0.03em] text-white font-['Plus_Jakarta_Sans',sans-serif]">
                        {client ? client.client_name : 'Vue d’ensemble'}
                    </div>
                    <p className="text-[13px] text-white/40 mt-1">
                        Progression de visibilité IA · données réelles (runs & audits)
                        {client?.business_type ? ` · ${client.business_type}` : ''}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="geo-pill-pg inline-flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#4ade80]" />
                        Dernier GEO run : {fmtDate(m?.lastGeoRunAt)}
                    </span>
                    <Link href={`${baseHref}?view=audit`} className="geo-btn geo-btn-pri">
                        Audit
                    </Link>
                    <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-vio">
                        Améliorer le score →
                    </Link>
                </div>
            </div>

            {/* Rangée 1 — 3 blocs type capture */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <GeoPremiumCard className="xl:col-span-3 p-5 flex flex-col min-h-[280px]">
                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-[0.12em] mb-3">LLM visibility score</div>
                    <div className="flex items-baseline gap-3 flex-wrap">
                        <span className="text-[42px] leading-none font-bold text-white geo-premium-hero-num">
                            {visPct != null ? `${visPct}%` : '—'}
                        </span>
                        {visTrend != null && (
                            <span className="text-sm">
                                <GeoDeltaPill value={visTrend} unit=" pts" />
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-white/38 mt-2 leading-relaxed">
                        % de réponses (runs) où la marque cible est détectée (target_found)
                    </p>
                    <div className="mt-auto pt-4 rounded-xl bg-black/35 border border-white/[0.07] p-3">
                        <div className="text-[10px] text-white/35 uppercase font-bold tracking-wider mb-2">Classement interne (modèles)</div>
                        {rankedModels.length === 0 ? (
                            <p className="text-xs text-white/35">Aucun run — pas de classement.</p>
                        ) : (
                            <div className="flex gap-1.5 h-14 items-end">
                                {rankedModels.slice(0, 5).map((row, i) => {
                                    const h = Math.max(10, Math.round((row.targetRatePercent / 100) * 48));
                                    return (
                                        <div
                                            key={`${row.provider}-${row.model}-${i}`}
                                            className="flex-1 rounded-t-sm bg-gradient-to-t from-violet-900/60 to-violet-400/90 min-w-[8px] transition-all"
                                            style={{ height: h, boxShadow: '0 0 12px rgba(139,92,246,0.35)' }}
                                            title={`${row.provider} · ${row.model} · ${row.targetRatePercent}%`}
                                        />
                                    );
                                })}
                            </div>
                        )}
                        <div className="text-[10px] text-white/30 mt-2">
                            #{rankedModels.length ? '1' : '—'} meilleur taux parmi {rankedModels.length || 0} modèles suivis
                        </div>
                    </div>
                </GeoPremiumCard>

                <div className="xl:col-span-6 min-h-[280px]">
                    <CumulativeModelVisibilityChart
                        recentQueryRuns={recentQueryRuns}
                        title="Tendance visibilité IA"
                        subtitle="% détection marque cumulée par jour — top modèles présents dans vos runs"
                    />
                </div>

                <GeoPremiumCard className="xl:col-span-3 p-5 flex flex-col items-center justify-between min-h-[280px]">
                    <div className="w-full">
                        <div className="text-[10px] text-white/30 font-bold uppercase tracking-[0.12em] mb-1">Citation coverage</div>
                        <p className="text-[11px] text-white/38">% de runs avec au moins une source citée</p>
                    </div>
                    <GeoDonut percent={covPct ?? undefined} color="#a78bfa">
                        <div className="text-[28px] font-bold text-white leading-none geo-premium-hero-num">
                            {covPct != null ? `${covPct}%` : '—'}
                        </div>
                        <div className="text-[9px] text-white/35 mt-1 uppercase tracking-wider">runs couverts</div>
                    </GeoDonut>
                    <p className="text-[11px] text-center text-white/45">
                        {m?.runsWithSourceCitation != null && m?.totalQueryRuns != null ? (
                            <>
                                Citée dans{' '}
                                <span className="text-white/80 font-semibold">{m.runsWithSourceCitation}</span> /{' '}
                                <span className="text-white/80 font-semibold">{m.totalQueryRuns}</span> runs
                            </>
                        ) : (
                            '—'
                        )}
                    </p>
                    <div className="flex gap-2 justify-center text-lg text-white/20">✦ ◆ ✧ ⌖</div>
                </GeoPremiumCard>
            </div>

            {/* Rangée 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <GeoPremiumCard className="p-5">
                    <div className="flex justify-between items-start gap-2 mb-4">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Share of voice</div>
                            <p className="text-[11px] text-white/35">Votre marque (proxy) — pas de concurrents suivis en base</p>
                        </div>
                        {mentionRate != null && (
                            <span className="geo-pill-pg text-[10px]">Prompts {mentionRate}%</span>
                        )}
                    </div>
                    {visPct != null ? (
                        <GeoBarRow label={`${client?.client_name || 'Marque'} (vous)`} value={visPct} max={100} color="bg-violet-500/85" />
                    ) : (
                        <p className="text-xs text-white/35">Pas assez de runs pour calculer un share.</p>
                    )}
                    <div className="mt-4 rounded-lg border border-dashed border-white/12 p-3 bg-white/[0.02]">
                        <div className="text-[10px] text-white/30 uppercase font-bold mb-2">Concurrents</div>
                        <p className="text-[11px] text-white/38 leading-relaxed">
                            Aucune série « concurrent » n’est stockée pour l’instant. Les barres comparatives apparaîtront lorsque le
                            produit enregistrera des entités concurrentes par run.
                        </p>
                    </div>
                </GeoPremiumCard>

                <GeoPremiumCard className="p-5">
                    <div className="mb-3">
                        <div className="text-sm font-semibold text-white/95">Classement modèles</div>
                        <p className="text-[11px] text-white/35">Tri par taux de détection marque (runs réels)</p>
                    </div>
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                        {rankedModels.length === 0 ? (
                            <p className="text-xs text-white/35">—</p>
                        ) : (
                            rankedModels.map((row, i) => (
                                <div key={`${row.provider}-${row.model}-${i}`} className="flex items-center gap-3">
                                    <span className="text-[11px] text-white/25 w-4 font-mono">{i + 1}</span>
                                    <GeoModelAvatar label={row.provider} color={AVATAR_COLORS[i % AVATAR_COLORS.length]} />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-white/85 truncate">
                                            {row.provider} · {row.model}
                                        </div>
                                        <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-violet-500/80 shadow-[0_0_8px_rgba(139,92,246,0.4)]"
                                                style={{ width: `${row.targetRatePercent}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-400/90 tabular-nums">{row.targetRatePercent}%</span>
                                </div>
                            ))
                        )}
                    </div>
                </GeoPremiumCard>

                <GeoPremiumCard className="p-5 flex flex-col">
                    <div className="flex justify-between items-start gap-2 mb-3">
                        <div>
                            <div className="text-sm font-semibold text-white/95">Opportunités</div>
                            <p className="text-[11px] text-white/35">Actions issues de la base</p>
                        </div>
                        {(opportunities?.length ?? 0) > 0 && (
                            <span className="geo-pill-a text-[10px]">{opportunities.length} ouvertes</span>
                        )}
                    </div>
                    <div className="space-y-2 flex-1 overflow-y-auto max-h-[220px]">
                        {!opportunities || opportunities.length === 0 ? (
                            <p className="text-xs text-white/35">Aucune opportunité ouverte.</p>
                        ) : (
                            opportunities.slice(0, 5).map((o) => (
                                <div
                                    key={o.id}
                                    className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-black/30 border border-white/[0.06]"
                                >
                                    <div className="min-w-0">
                                        <div className="text-xs font-medium text-white/90 truncate">{o.title}</div>
                                        <div className="text-[10px] text-white/35 line-clamp-1">{o.description}</div>
                                    </div>
                                    <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-ghost text-[10px] py-1 shrink-0">
                                        Voir →
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                    {(mergeSuggestionsPending?.length ?? 0) > 0 && (
                        <div className="mt-3 text-[10px] text-white/35 border-t border-white/10 pt-2">
                            {mergeSuggestionsPending.length} suggestion{mergeSuggestionsPending.length > 1 ? 's' : ''} merge en attente
                        </div>
                    )}
                </GeoPremiumCard>
            </div>

            {/* KPI secondaires + graphiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3">
                <GeoPremiumCard className="p-4">
                    <div className="text-[10px] text-white/25 font-bold uppercase">SEO</div>
                    <div className="text-2xl font-bold mt-1">{seo != null ? seo : '—'}</div>
                </GeoPremiumCard>
                <GeoPremiumCard className="p-4">
                    <div className="text-[10px] text-white/25 font-bold uppercase">GEO audit</div>
                    <div className="text-2xl font-bold mt-1 text-[#a78bfa]">{geo != null ? geo : '—'}</div>
                </GeoPremiumCard>
                <GeoPremiumCard className="p-4">
                    <div className="text-[10px] text-white/25 font-bold uppercase">Runs</div>
                    <div className="text-2xl font-bold mt-1">{m?.totalQueryRuns ?? 0}</div>
                </GeoPremiumCard>
                <GeoPremiumCard className="p-4">
                    <div className="text-[10px] text-white/25 font-bold uppercase">Mentions source</div>
                    <div className="text-2xl font-bold mt-1 text-violet-300/90">{m?.sourceMentions ?? 0}</div>
                </GeoPremiumCard>
                <GeoPremiumCard className="p-4">
                    <div className="text-[10px] text-white/25 font-bold uppercase">Concurrents</div>
                    <div className="text-2xl font-bold mt-1 text-amber-400/90">{m?.competitorMentions ?? 0}</div>
                </GeoPremiumCard>
                <GeoPremiumCard className="p-4">
                    <div className="text-[10px] text-white/25 font-bold uppercase">Dernier audit</div>
                    <div className="text-[11px] text-white/55 mt-2 font-mono leading-snug">{fmtDate(m?.lastAuditAt)}</div>
                </GeoPremiumCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <AuditScoresLineChart recentAudits={recentAudits} />
                <QueryRunsVisibilityChart recentQueryRuns={recentQueryRuns} />
            </div>

            <GeoSectionTitle
                title="Raccourcis"
                subtitle="Navigation rapide"
                action={
                    <div className="flex gap-2 flex-wrap">
                        <Link href={`${baseHref}?view=visibilite`} className="geo-btn geo-btn-ghost">
                            Visibilité IA
                        </Link>
                        <Link href={`${baseHref}?view=prompts`} className="geo-btn geo-btn-ghost">
                            Prompts
                        </Link>
                        <Link href={`${baseHref}?view=citations`} className="geo-btn geo-btn-ghost">
                            Citations
                        </Link>
                        <Link href={`${baseHref}?view=modeles`} className="geo-btn geo-btn-ghost">
                            Modèles
                        </Link>
                    </div>
                }
            />
        </div>
    );
}
