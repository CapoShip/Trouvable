'use client';

import Link from 'next/link';

import {
    GeoBarRow,
    GeoPremiumCard,
    GeoProvenancePill,
    GeoStatusDot,
} from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import {
    COMMAND_BUTTONS,
    CommandEmptyState,
    CommandSkeleton,
} from '../components/command';

const STATUS_DOT = {
    couvert: 'ok',
    'à confirmer': 'warning',
    partiel: 'warning',
    bloqué: 'critical',
    absent: 'critical',
};

function HeatCell({ dimension }) {
    const status = STATUS_DOT[dimension.status] || 'idle';
    const s = Math.max(0, Math.min(100, dimension.score ?? 0));
    const heat = s / 100;
    return (
        <div
            className="relative flex min-h-[140px] flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] p-4"
            style={{
                background: `linear-gradient(145deg, rgba(45,212,191,${0.12 + heat * 0.2}) 0%, rgba(36,42,53,0.96) 65%)`,
            }}
        >
            <div className="flex items-start justify-between gap-2">
                <GeoStatusDot status={status} />
                <span className="font-mono text-[20px] font-bold tabular-nums text-white">{dimension.score}</span>
            </div>
            <div>
                <div className="text-[12px] font-semibold leading-snug text-white/92">{dimension.label}</div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white/35">{dimension.status}</div>
                {dimension.summary ? (
                    <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-white/45">{dimension.summary}</p>
                ) : null}
            </div>
        </div>
    );
}

export default function AgentReadinessView() {
    const { client, clientId } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('agent-readiness');

    if (loading) return <CommandSkeleton />;

    if (error) {
        return (
            <div className="mx-auto max-w-[1100px] p-8">
                <CommandEmptyState tone="critical" title="Préparation AGENT indisponible" description={error} />
            </div>
        );
    }

    if (!data || data.available === false) {
        return (
            <div className="mx-auto max-w-[1100px] space-y-6 px-4 py-10 md:px-8">
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-200/70">AGENT · préparation</div>
                    <h1 className="mt-3 text-2xl font-semibold text-white/95">Préparation AGENT</h1>
                    <p className="mt-2 text-[13px] text-white/45">{`Mandat ${client?.client_name || ''}`.trim()}</p>
                </div>
                <CommandEmptyState
                    title="Aucun audit exploitable"
                    description="Lancez un audit dans GEO Ops › Audit pour activer l’analyse de préparation AGENT."
                />
            </div>
        );
    }

    const { summary, topBlockers = [], dimensions = [], provenance } = data;

    return (
        <div className="min-h-[calc(100vh-6rem)] bg-[#1a2430] text-white">
            <div className="border-b border-teal-500/20 bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,rgba(20,184,166,0.14),transparent)]">
                <div className="mx-auto flex max-w-[1700px] flex-col gap-6 px-4 py-10 md:flex-row md:items-end md:justify-between md:px-10">
                    <div className="max-w-2xl space-y-4">
                        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-teal-200/70">agent.readiness.heatmap</div>
                        <h1 className="text-[clamp(1.85rem,3vw,2.5rem)] font-semibold tracking-[-0.045em]">
                            Matrice de préparation
                        </h1>
                        <p className="text-[14px] leading-relaxed text-white/45">
                            Les dimensions forment une <span className="text-white/70">grille thermique</span> plutôt que des polaroids en colonnes — barres en section finale pour comparer l’échelle.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
                                {summary.globalSignalLabel || summary.globalStatus}
                            </span>
                            <GeoProvenancePill meta={provenance?.derived} />
                        </div>
                    </div>
                    <Link href={`/admin/clients/${clientId}/geo/readiness`} className={`${COMMAND_BUTTONS.secondary} rounded-xl`}>
                        GEO Ops › Préparation
                    </Link>
                </div>
            </div>

            <div className="mx-auto max-w-[1700px] space-y-10 px-4 py-10 md:px-10 pb-16">
                <section className="flex gap-3 overflow-x-auto pb-1 geo-scrollbar md:grid md:grid-cols-4 md:overflow-visible">
                    {[
                        ['Score', summary.globalScore, 'Vue globale'],
                        ['Pages audit', summary.pageCount, 'Échantillon'],
                        ['Passages forts', summary.highPassageCount, 'Citabilité brute'],
                        ['FAQ / QA', summary.faqCount, 'Paires utiles'],
                    ].map(([k, v, d]) => (
                        <div key={k} className="min-w-[200px] shrink-0 rounded-2xl border border-slate-400/14 bg-[#252a35] px-4 py-4 md:min-w-0">
                            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">{k}</div>
                            <div className="mt-2 text-3xl font-semibold tabular-nums text-white/95">{v}</div>
                            <div className="mt-1 text-[11px] text-white/38">{d}</div>
                        </div>
                    ))}
                </section>

                <section className="grid gap-8 xl:grid-cols-[1fr_320px]">
                    <div>
                        <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">Grille thermique</div>
                        {dimensions.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-white/[0.12] p-8 text-[12px] text-white/40">Aucune dimension disponible.</div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {dimensions.map((dim) => (
                                    <HeatCell key={dim.key} dimension={dim} />
                                ))}
                            </div>
                        )}
                        <p className="mt-6 text-[11px] text-white/40">
                            Drill-down dans{' '}
                            <Link href={`/admin/clients/${clientId}/geo/readiness`} className="font-semibold text-teal-300 hover:text-white">
                                GEO Ops › Préparation
                            </Link>
                            .
                        </p>
                    </div>

                    <GeoPremiumCard className="h-fit border border-rose-400/22 bg-[linear-gradient(180deg,rgba(190,18,60,0.12),rgba(6,8,14,0.95))] p-5">
                        <div className="text-sm font-semibold text-white/95">Blocages</div>
                        <div className="mt-1 text-[11px] text-white/40">File verticale serrée</div>
                        {topBlockers.length === 0 ? (
                            <div className="mt-4 text-[12px] text-white/40">Aucun blocage majeur détecté.</div>
                        ) : (
                            <ul className="mt-4 max-h-[min(60vh,520px)] space-y-2 overflow-y-auto geo-scrollbar pr-1">
                                {topBlockers.slice(0, 8).map((blocker, idx) => (
                                    <li key={`${blocker.title}-${idx}`} className="rounded-xl border border-white/[0.06] bg-black/40 px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <GeoStatusDot status={STATUS_DOT[blocker.status] || 'idle'} />
                                            <span className="text-[12px] font-semibold text-white/90">{blocker.title}</span>
                                        </div>
                                        {blocker.detail ? (
                                            <div className="mt-1 text-[11px] text-white/45 leading-snug">{blocker.detail}</div>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </GeoPremiumCard>
                </section>

                <GeoPremiumCard className="border border-slate-400/15 bg-[#252a35] p-6 rounded-[28px]">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-white/95">Comparateur 0–100</div>
                        <div className="text-[11px] text-white/38">Barres alignées</div>
                    </div>
                    <div className="space-y-3">
                        {dimensions.map((dim) => (
                            <GeoBarRow
                                key={`bar-${dim.key}`}
                                label={dim.label}
                                sub={dim.signalLabel || dim.status}
                                value={dim.score}
                                max={100}
                                color={dim.score >= 70 ? 'bg-emerald-400/75' : dim.score >= 40 ? 'bg-amber-400/75' : 'bg-red-400/75'}
                            />
                        ))}
                    </div>
                </GeoPremiumCard>
            </div>
        </div>
    );
}
