'use client';

import Link from 'next/link';
import { Crown, ShieldOff } from 'lucide-react';

import {
    GeoEmptyPanel,
    GeoPremiumCard,
    GeoProvenancePill,
} from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';

const SEVERITY_CLS = {
    high: 'text-red-300 bg-red-400/10 border-red-400/25',
    medium: 'text-amber-300 bg-amber-400/10 border-amber-400/25',
    low: 'text-white/50 bg-white/[0.04] border-white/[0.12]',
};

function formatDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return '—';
    }
}

function PodiumStep({ rank, name, count }) {
    const heights = { 1: 'h-[132px]', 2: 'h-[108px]', 3: 'h-[92px]' };
    const accent =
        rank === 1
            ? 'from-amber-300/40 via-amber-200/10 to-transparent'
            : rank === 2
                ? 'from-slate-200/30 via-slate-200/5 to-transparent'
                : 'from-orange-300/25 via-orange-200/8 to-transparent';
    return (
        <div className={`relative flex flex-col items-center justify-end rounded-t-2xl border border-white/[0.08] bg-gradient-to-b ${accent} px-3 ${heights[rank] || 'h-[84px]'}`}>
            <div className="absolute -top-8 flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.12] bg-black/60 text-[11px] font-bold text-white/80">
                {rank === 1 ? <Crown className="h-4 w-4 text-amber-200" /> : rank}
            </div>
            <div className="mb-3 text-center">
                <div className="text-[11px] font-semibold text-white/90 line-clamp-2">{name}</div>
                <div className="mt-1 text-[10px] font-bold tabular-nums text-white/55">{count} mention{count > 1 ? 's' : ''}</div>
            </div>
        </div>
    );
}

export default function AgentCompetitorsView() {
    const { client } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('agent-competitors');

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm animate-pulse">Chargement…</div>;
    }
    if (error) {
        return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    }
    if (!data) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <GeoEmptyPanel title="Comparatif AGENT indisponible" description="Aucune donnée n’a pu être chargée." />
            </div>
        );
    }

    if (!data.available || data.emptyState) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200/60">Comparatif narratif</div>
                <h1 className="text-2xl font-semibold text-white/95">Comparatif AGENT</h1>
                <GeoEmptyPanel
                    title={data.emptyState?.title || 'Comparatif AGENT indisponible'}
                    description={data.emptyState?.description || 'Pas encore de signaux concurrents observés.'}
                />
            </div>
        );
    }

    const { summary, topCompetitors, promptsLost, genericMentions, provenance, links } = data;
    const podium = topCompetitors.slice(0, 3);
    const rest = topCompetitors.slice(3);

    return (
        <div className="bg-[#040308]">
            <div className="mx-auto max-w-[1650px] space-y-10 px-4 py-10 md:px-10">
                <header className="flex flex-col gap-6 border-b border-white/[0.06] pb-10 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200/75">
                            <ShieldOff className="h-4 w-4" />
                            Hors score AGENT
                        </div>
                        <h1 className="mt-4 text-[clamp(1.75rem,3.2vw,2.45rem)] font-semibold tracking-[-0.04em] text-white">
                            Arène concurrentielle
                        </h1>
                        <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-white/45">
                            Podium pour les têtes, liste dense pour la longue traîne. Aucune ligne de score AGENT ici — lecture terrain uniquement.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
                            Informatif
                        </span>
                        {provenance?.observed ? <GeoProvenancePill meta={provenance.observed} /> : null}
                    </div>
                </header>

                {summary.sampleSizeWarning && (
                    <div className="rounded-2xl border border-amber-400/22 bg-amber-400/[0.07] px-5 py-4 text-[12px] text-amber-100/85">
                        {summary.sampleSizeWarning}
                    </div>
                )}

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        ['Exécutions', summary.totalCompletedRuns, 'Runs observés'],
                        ['Mentions concurrents', summary.competitorMentions, `${summary.recommendedCompetitors} reco`],
                        ['Pression / run', summary.normalizedPressurePerRun.toFixed(1), 'Indicateur normalisé'],
                        ['Runs sans nous', summary.runsWithoutTargetButCompetitor, 'Substitution'],
                    ].map(([label, value, hint]) => (
                        <div key={label} className="rounded-2xl border border-white/[0.08] bg-[#0a0812]/90 px-5 py-4">
                            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/32">{label}</div>
                            <div className="mt-2 text-2xl font-semibold tabular-nums text-white/95">{value}</div>
                            <div className="mt-1 text-[11px] text-white/38">{hint}</div>
                        </div>
                    ))}
                </section>

                {podium.length > 0 && (
                    <section>
                        <div className="mb-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/38">Podium observé</div>
                        <div className="grid grid-cols-3 items-end gap-3 md:max-w-xl">
                            {[
                                { row: podium[1], displayRank: 2 },
                                { row: podium[0], displayRank: 1 },
                                { row: podium[2], displayRank: 3 },
                            ].map(({ row, displayRank }) => {
                                if (!row) return <div key={`empty-${displayRank}`} className="hidden sm:block" />;
                                return (
                                    <PodiumStep
                                        key={`${row.name}-${displayRank}`}
                                        rank={displayRank}
                                        name={row.name}
                                        count={row.count}
                                    />
                                );
                            })}
                        </div>
                    </section>
                )}

                <section className="grid gap-6 xl:grid-cols-2">
                    <GeoPremiumCard className="border border-white/[0.07] bg-[#07060d]/95 p-0">
                        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                            <div>
                                <div className="text-sm font-semibold text-white/95">Longue traîne</div>
                                <div className="text-[11px] text-white/40">Mentions restantes hors podium.</div>
                            </div>
                            <Link href={links.competitors} className="text-[11px] font-semibold text-violet-300 hover:text-white">
                            Carte GEO →
                            </Link>
                        </div>
                        <div className="max-h-[360px] overflow-y-auto geo-scrollbar divide-y divide-white/[0.05]">
                            {rest.length === 0 && podium.length <= 3 ? (
                                <div className="px-5 py-6 text-[12px] text-white/40">Pas d’autres concurrents dans l’extrait.</div>
                            ) : (
                                rest.map((competitor, idx) => (
                                    <div key={`r-${idx}`} className="flex items-center justify-between px-5 py-3">
                                        <span className="text-[13px] font-semibold text-white/88">{competitor.name}</span>
                                        <span className="text-[11px] font-bold tabular-nums text-white/55">{competitor.count}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </GeoPremiumCard>

                    <GeoPremiumCard className="border border-rose-400/15 bg-[#10060a]/95 p-0">
                        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                            <div>
                                <div className="text-sm font-semibold text-white/95">Prompts sous pression</div>
                                <div className="text-[11px] text-white/40">Où le mandat est absent mais un concurrent apparaît.</div>
                            </div>
                            <Link href={links.prompts} className="text-[11px] font-semibold text-rose-200 hover:text-white">
                            Requêtes →
                            </Link>
                        </div>
                        <div className="max-h-[360px] overflow-y-auto geo-scrollbar">
                            {promptsLost.length === 0 ? (
                                <div className="px-5 py-6 text-[12px] text-white/40">Aucun prompt à risque identifié.</div>
                            ) : (
                                promptsLost.map((prompt, idx) => {
                                    const cls = SEVERITY_CLS[prompt.severity] || SEVERITY_CLS.low;
                                    return (
                                        <div key={`lost-${idx}`} className="border-b border-white/[0.05] px-5 py-4 last:border-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="text-[12px] font-semibold text-white/90 line-clamp-2">{prompt.queryText}</div>
                                                    <div className="mt-1 text-[10px] uppercase tracking-wider text-white/38">
                                                        {prompt.category} · {prompt.competitorMentions} mention{prompt.competitorMentions > 1 ? 's' : ''}
                                                    </div>
                                                    <div className="mt-1 text-[10px] text-white/30">Dernier run : {formatDate(prompt.latestRunAt)}</div>
                                                </div>
                                                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${cls}`}>
                                                    {prompt.severity}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </GeoPremiumCard>
                </section>

                {genericMentions.length > 0 && (
                    <section className="rounded-[24px] border border-dashed border-white/[0.12] bg-white/[0.02] p-6">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/38">Mentions génériques (non confirmées)</div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {genericMentions.map((mention, idx) => (
                                <span
                                    key={`gm-${idx}`}
                                    className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] bg-black/30 px-3 py-1.5 text-[11px] text-white/70"
                                >
                                    {mention.name} <span className="text-white/35">× {mention.count}</span>
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                <p className="rounded-2xl border border-white/[0.06] bg-[#080510]/90 px-5 py-4 text-[11px] text-white/45 leading-relaxed">
                    Ces signaux restent <span className="text-white/75">hors pondération</span> du score AGENT. Pour agir : renforcer visibilité et actionnabilité.
                </p>
            </div>
        </div>
    );
}
