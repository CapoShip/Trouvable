'use client';

import Link from 'next/link';

import {
    GeoBarRow,
    GeoEmptyPanel,
    GeoKpiCard,
    GeoPremiumCard,
    GeoProvenancePill,
    GeoSectionTitle,
    GeoStatusDot,
} from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';

const STATUS_DOT = {
    couvert: 'ok',
    partiel: 'warning',
    faible: 'warning',
    absent: 'critical',
    unavailable: 'idle',
};

const RELIABILITY_LABEL = {
    calculated: 'Audit récent',
    stale: 'Audit > 60 jours',
    low: 'Audit > 180 jours',
    unavailable: 'Audit indisponible',
};

const PRIORITY_CLS = {
    high: 'text-red-300 bg-red-400/10 border-red-400/25',
    medium: 'text-amber-300 bg-amber-400/10 border-amber-400/25',
    low: 'text-white/50 bg-white/[0.04] border-white/[0.12]',
};

function DimensionCard({ dimension }) {
    const status = STATUS_DOT[dimension.status] || 'idle';
    const color = dimension.score >= 70 ? 'bg-emerald-400/75' : dimension.score >= 40 ? 'bg-amber-400/75' : 'bg-red-400/75';
    return (
        <GeoPremiumCard className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <GeoStatusDot status={status} />
                        <span className="text-[13px] font-semibold text-white/95">{dimension.label}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
                            {dimension.status}
                        </span>
                    </div>
                    <div className="mt-1 text-[10px] text-white/35">
                        Poids {Math.round((dimension.weight || 0) * 100)}%
                    </div>
                </div>
                <div className="shrink-0 text-right">
                    <div className="text-[22px] font-bold tabular-nums text-white/95">{dimension.score}</div>
                    <div className="text-[10px] text-white/35">/100</div>
                </div>
            </div>

            <GeoBarRow value={dimension.score} max={100} color={color} />

            {dimension.evidence.length > 0 && (
                <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-300/70 mb-1">
                        Observé
                    </div>
                    <ul className="space-y-1">
                        {dimension.evidence.slice(0, 3).map((item, idx) => (
                            <li key={`ev-${idx}`} className="text-[11px] text-white/65 leading-snug">
                                • {item}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {dimension.gaps.length > 0 && (
                <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-300/70 mb-1">
                        Manques
                    </div>
                    <ul className="space-y-1">
                        {dimension.gaps.slice(0, 3).map((item, idx) => (
                            <li key={`gap-${idx}`} className="text-[11px] text-white/55 leading-snug">
                                — {item}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </GeoPremiumCard>
    );
}

function TopFixRow({ fix }) {
    const cls = PRIORITY_CLS[fix.priority] || PRIORITY_CLS.low;
    return (
        <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0">
            <div className="min-w-0">
                <div className="text-[12px] font-semibold text-white/90">{fix.message}</div>
                <div className="mt-1 text-[10px] uppercase tracking-wider text-white/40">
                    {fix.dimensionLabel}
                </div>
            </div>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cls}`}>
                {fix.priority}
            </span>
        </div>
    );
}

export default function AgentProtocolsView() {
    const { client, clientId } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('agent-protocols');

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm animate-pulse">Chargement…</div>;
    }
    if (error) {
        return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    }
    if (!data) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <GeoEmptyPanel title="Protocoles AGENT indisponibles" description="Aucune donnée n’a pu être chargée." />
            </div>
        );
    }

    if (data.available === false || data.emptyState) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-4">
                <GeoSectionTitle
                    title="Protocoles AGENT"
                    subtitle={`Mandat ${client?.client_name || ''}`.trim()}
                />
                <GeoEmptyPanel
                    title={data.emptyState?.title || 'Protocoles AGENT indisponibles'}
                    description={data.emptyState?.description || 'Lancez un audit pour activer cette lecture.'}
                >
                    <Link
                        href={`/admin/clients/${clientId}/dossier/audit`}
                        className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-white/75 hover:bg-white/[0.08] transition-colors"
                    >
                        Ouvrir le laboratoire audit →
                    </Link>
                </GeoEmptyPanel>
            </div>
        );
    }

    const { summary, dimensions, topFixes, topStrengths, provenance, links, reliability } = data;

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title="Protocoles AGENT"
                subtitle="Notre site expose-t-il les signaux techniques qu’un agent IA attend ?"
                action={(
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/60">
                            {RELIABILITY_LABEL[reliability] || RELIABILITY_LABEL.unavailable}
                        </span>
                        <GeoProvenancePill meta={provenance?.observed} />
                    </div>
                )}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <GeoKpiCard
                    label="Score protocoles"
                    value={summary.globalScore}
                    hint={`Statut : ${summary.globalStatus}`}
                    accent="violet"
                />
                <GeoKpiCard
                    label="Dimensions couvertes"
                    value={`${summary.coveredDimensions}/${summary.totalDimensions}`}
                    hint="Couvert = score ≥ 70"
                    accent={summary.coveredDimensions === summary.totalDimensions ? 'emerald' : 'default'}
                />
                <GeoKpiCard
                    label="Top correctifs"
                    value={topFixes.length}
                    hint="Protocoles à débloquer"
                    accent={topFixes.length > 0 ? 'amber' : 'default'}
                />
                <GeoKpiCard
                    label="Bonus AGENT"
                    value="5%"
                    hint="Poids du sous-score dans AGENT"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {dimensions.map((dim) => (
                    <DimensionCard key={dim.key} dimension={dim} />
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <GeoPremiumCard className="p-0 overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/[0.06] bg-black/20">
                        <div className="text-sm font-semibold text-white/95">Top correctifs protocoles</div>
                        <div className="text-[11px] text-white/40">Triés par priorité puis score.</div>
                    </div>
                    {topFixes.length === 0 ? (
                        <div className="px-5 py-6 text-[12px] text-white/40">Aucun correctif protocole ouvert.</div>
                    ) : (
                        <div>
                            {topFixes.map((fix, idx) => (
                                <TopFixRow key={`fix-${idx}`} fix={fix} />
                            ))}
                        </div>
                    )}
                </GeoPremiumCard>

                <GeoPremiumCard className="p-0 overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/[0.06] bg-black/20">
                        <div className="text-sm font-semibold text-white/95">Protocoles couverts</div>
                        <div className="text-[11px] text-white/40">Signaux déjà en place sur le site.</div>
                    </div>
                    {topStrengths.length === 0 ? (
                        <div className="px-5 py-6 text-[12px] text-white/40">Aucun protocole encore couvert.</div>
                    ) : (
                        <div>
                            {topStrengths.map((strength, idx) => (
                                <div key={`str-${idx}`} className="flex items-start justify-between gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0">
                                    <div className="min-w-0">
                                        <div className="text-[12px] font-semibold text-white/90">{strength.message}</div>
                                        <div className="mt-1 text-[10px] uppercase tracking-wider text-white/40">
                                            {strength.dimensionLabel}
                                        </div>
                                    </div>
                                    <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 tabular-nums">
                                        {strength.score}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </GeoPremiumCard>
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-[11px] text-white/45 leading-relaxed">
                Les protocoles avancés apportent un bonus de 5% au score AGENT. Drill-down technique dans{' '}
                <Link href={links.audit} className="text-[#7b8fff] hover:text-white">GEO Ops › Audit</Link>.
            </div>
        </div>
    );
}
