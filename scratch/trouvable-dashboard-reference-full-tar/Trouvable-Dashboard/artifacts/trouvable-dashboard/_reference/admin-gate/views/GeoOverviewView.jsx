'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, Orbit, ScanSearch, Sparkles, Waves } from 'lucide-react';

import { GeoEmptyPanel } from '../components/GeoPremium';
import CommandActionCard from '../components/command/CommandActionCard';
import CommandBrandLockup from '../components/command/CommandBrandLockup';
import CommandChartCard from '../components/command/CommandChartCard';
import CommandDrawer from '../components/command/CommandDrawer';
import CommandEvidenceCard from '../components/command/CommandEvidenceCard';
import CommandHealthMap from '../components/command/charts/CommandHealthMap';
import CommandLineChart from '../components/command/charts/CommandLineChart';
import CommandSkeleton from '../components/command/CommandSkeleton';
import { commandFadeUp, commandStagger } from '../components/command/motion';
import { COMMAND_BUTTONS, COMMAND_SURFACE_SOFT, cn } from '../components/command/tokens';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import { buildGeoOverviewCommandModel } from './geo-overview-model';

function getLastFiniteTrendValue(values = []) {
    for (let index = values.length - 1; index >= 0; index -= 1) {
        const value = values[index];
        if (typeof value === 'number' && Number.isFinite(value)) return value;
    }
    return null;
}

function EmptyTrendState({ title, description, href }) {
    return (
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[20px] border border-dashed border-white/[0.10] bg-white/[0.02] p-6 text-center">
            <div className="text-[15px] font-semibold tracking-[-0.02em] text-white/[0.86]">{title}</div>
            <p className="mx-auto mt-2 max-w-xl text-[12px] leading-relaxed text-white/[0.55]">{description}</p>
            {href ? (
                <Link href={href} className={cn(COMMAND_BUTTONS.secondary, 'mt-4')}>
                    Ouvrir les signaux
                    <ArrowUpRight className="h-4 w-4" />
                </Link>
            ) : null}
        </div>
    );
}

function EvidenceDrawerContent({ evidence }) {
    if (!evidence) return null;
    return (
        <div className="space-y-6">
            <section className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">Synthèse</div>
                <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-6 shadow-sm">
                    <p className="text-[15px] leading-relaxed text-white/80">{evidence.summary}</p>
                </div>
            </section>
            <section className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">Détails techniques</div>
                <div className="rounded-[24px] border border-slate-400/15 bg-[#2e3440] p-6">
                    <p className="text-[14px] leading-relaxed text-white/60">{evidence.detail}</p>
                </div>
            </section>
            <section className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">Provenance</div>
                <div className="rounded-[24px] border border-white/[0.05] bg-white/[0.015] p-5">
                    <p className="text-[13px] leading-relaxed text-white/40">
                        Signal extrait du slice <code className="rounded-md bg-white/10 px-1.5 py-0.5 text-white/70">overview</code>.
                    </p>
                </div>
            </section>
        </div>
    );
}

export default function GeoOverviewView() {
    const { client, clientId, workspace, audit } = useGeoClient();
    const { data, loading, error, refetch } = useGeoWorkspaceSlice('overview');
    const [selectedEvidence, setSelectedEvidence] = useState(null);

    const geoBase = clientId ? `/admin/clients/${clientId}/geo` : '/admin/clients';
    const seoBase = clientId ? `/admin/clients/${clientId}/seo` : '/admin/clients';
    const dossierBase = clientId ? `/admin/clients/${clientId}/dossier` : '/admin/clients';

    const model = useMemo(() => {
        if (!data) return null;
        return buildGeoOverviewCommandModel({
            clientId,
            client,
            workspace,
            audit,
            data,
        });
    }, [audit, client, clientId, data, workspace]);

    const brand = <CommandBrandLockup />;

    if (loading) {
        return <CommandSkeleton />;
    }

    if (error) {
        return (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="min-h-[50vh] bg-[#1a1d24] px-4 py-10 md:px-8">
                <div className="mx-auto max-w-[1200px] space-y-6">
                    <div className="rounded-3xl border border-rose-400/25 bg-rose-500/10 p-6">
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-200/80">
                            <Waves className="h-4 w-4" />
                            Slice overview
                        </div>
                        <h1 className="mt-3 text-2xl font-semibold text-white">Impossible de charger la situation GEO</h1>
                        <p className="mt-2 text-[13px] text-white/55">{error}</p>
                        <button type="button" onClick={() => refetch()} className={cn(COMMAND_BUTTONS.primary, 'mt-5 rounded-xl')}>
                            Réessayer
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href={`${geoBase}/runs`} className={COMMAND_BUTTONS.secondary}>Exécution</Link>
                        <Link href={`${seoBase}/health`} className={COMMAND_BUTTONS.secondary}>Santé SEO</Link>
                    </div>
                </div>
            </motion.div>
        );
    }

    if (!data || !model) {
        return (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="min-h-[50vh] bg-[#1a1d24] px-4 py-10 md:px-8">
                <div className="mx-auto max-w-[900px]">
                    <GeoEmptyPanel
                        title="Aucune donnée overview"
                        description="Les blocs apparaîtront lorsque le workspace remontera des signaux observés."
                    >
                        <div className="flex flex-wrap gap-2">
                            <Link href={`${seoBase}/health`} className={COMMAND_BUTTONS.secondary}>Santé SEO</Link>
                            <Link href={`${geoBase}/runs`} className={COMMAND_BUTTONS.secondary}>Exécution</Link>
                        </div>
                    </GeoEmptyPanel>
                </div>
            </motion.div>
        );
    }

    const evidencePreview = model.evidence.items.slice(0, 8);
    const primaryTrendSeriesId = model.trend.series.find((series) => series.id === 'geo')?.id || model.trend.series[0]?.id || null;
    const hero = model.hero;

    return (
        <motion.div initial="hidden" animate="visible" variants={commandStagger} className="bg-[#1a1d24] text-white pb-20">
            {/* Bandeau orbital — remplace cockpit + hero empilés */}
            <motion.section variants={commandFadeUp} className="relative overflow-hidden border-b border-white/[0.06]">
                <div className="pointer-events-none absolute -left-[10%] top-0 h-[420px] w-[70%] bg-[radial-gradient(closest-side,rgba(91,115,255,0.22),transparent)]" />
                <div className="pointer-events-none absolute right-0 top-20 h-[320px] w-[45%] bg-[radial-gradient(closest-side,rgba(236,72,153,0.14),transparent)]" />
                <div className="relative mx-auto grid max-w-[1800px] gap-10 px-4 py-12 md:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                    <div>
                        <div className="flex items-center gap-2 font-mono text-[11px] text-white/35">
                            <Orbit className="h-4 w-4 text-cyan-300/70" />
                            geo.situation.board
                        </div>
                        <h1 className="mt-4 text-[clamp(1.85rem,3.8vw,2.75rem)] font-semibold tracking-[-0.055em] leading-[1.05]">
                            Latitude mandat
                        </h1>
                        <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-white/48">
                            {client?.client_name ? (
                                <>Orbite de contrôle pour <span className="text-white/80">{client.client_name}</span> : même données, composition en anneaux plutôt qu’en cockpit empilé.</>
                            ) : (
                                <>Vue branchée sur le slice <code className="rounded bg-white/10 px-1 font-mono text-[11px]">overview</code>.</>
                            )}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2">
                            <Link href={`${geoBase}/opportunities`} className={cn(COMMAND_BUTTONS.primary, 'rounded-xl')}>File d&apos;actions</Link>
                            <Link href={`${geoBase}/runs`} className={cn(COMMAND_BUTTONS.secondary, 'rounded-xl')}>Exécution</Link>
                            <Link href={`${dossierBase}/connectors`} className={cn(COMMAND_BUTTONS.subtle, 'rounded-xl')}>Connecteurs</Link>
                        </div>
                    </div>

                    <div className="relative rounded-[28px] border border-slate-400/18 bg-[linear-gradient(160deg,rgba(255,255,255,0.1),#2a2f3a_55%,#242830_100%)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">Score de situation</div>
                                <div className="mt-2 text-[clamp(2.5rem,6vw,3.5rem)] font-bold tabular-nums tracking-tight text-white">
                                    {hero.score?.value != null ? `${hero.score.value}` : '—'}
                                </div>
                                <div className="mt-2 text-[12px] text-white/45">{hero.score?.label || 'Indice composite'}</div>
                                {hero.score?.captionFinal || hero.score?.caption ? (
                                    <p className="mt-2 text-[11px] text-white/35">{hero.score.captionFinal || hero.score.caption}</p>
                                ) : null}
                            </div>
                            <div className="rounded-2xl border border-slate-400/15 bg-[#323845] px-3 py-2 text-right">
                                <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/30">Statut</div>
                                <div className="mt-1 text-[13px] font-semibold text-white/85">{hero.status?.label || '—'}</div>
                            </div>
                        </div>
                        {hero.subtitle ? <p className="mt-4 text-[13px] leading-relaxed text-white/55">{hero.subtitle}</p> : null}
                        {hero.supportingMetrics?.length ? (
                            <div className="mt-5 flex flex-wrap gap-2 border-t border-white/[0.06] pt-5">
                                {hero.supportingMetrics.map((m) => (
                                    <span key={m.id} className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] text-white/60">
                                        <span className="text-white/35">{m.label} :</span>{' '}
                                        <span className="font-semibold text-white/85">{m.value}</span>
                                    </span>
                                ))}
                            </div>
                        ) : null}
                        <div className="mt-5 flex flex-wrap gap-2">
                            <Link href={`${geoBase}/signals`} className={cn(COMMAND_BUTTONS.secondary, 'rounded-xl text-[11px]')}>
                                Signaux
                            </Link>
                            <button
                                type="button"
                                onClick={() => setSelectedEvidence(model.evidence.items[0] || null)}
                                className={cn(COMMAND_BUTTONS.secondary, 'rounded-xl text-[11px] gap-2')}
                            >
                                <ScanSearch className="h-3.5 w-3.5" />
                                Preuve
                            </button>
                        </div>
                    </div>
                </div>
            </motion.section>

            <div className="mx-auto max-w-[1800px] space-y-10 px-4 md:px-10 pt-10">
                <motion.section variants={commandFadeUp} className={cn(COMMAND_SURFACE_SOFT, 'p-5 sm:p-7 rounded-[28px]')}>
                    <div className="mb-6 flex flex-col gap-2 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Cartographie des risques</div>
                            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">{model.riskMap.title}</h2>
                            {model.riskMap.description ? (
                                <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-white/50">{model.riskMap.description}</p>
                            ) : null}
                        </div>
                        <Link href={`${dossierBase}/activity`} className={cn(COMMAND_BUTTONS.subtle, 'rounded-xl')}>Journal dossier</Link>
                    </div>
                    <CommandHealthMap items={model.riskMap.items} />
                </motion.section>

                <motion.div variants={commandFadeUp} className="grid gap-8 xl:grid-cols-[340px_minmax(0,1fr)]">
                    <div className="space-y-4">
                        <div className="rounded-[24px] border border-slate-400/15 bg-[#252a35] p-5">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
                                <Sparkles className="h-3.5 w-3.5 text-amber-200/80" />
                                Preuves — carrousel vertical
                            </div>
                            <p className="mt-2 text-[12px] text-white/45">{model.evidence.description}</p>
                            <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1 geo-scrollbar">
                                {evidencePreview.map((item) => (
                                    <CommandEvidenceCard
                                        key={item.id}
                                        title={item.title}
                                        summary={item.summary}
                                        detail={item.detail}
                                        meta={item.meta}
                                        href={item.href}
                                        tone={item.tone}
                                        onOpen={() => setSelectedEvidence(item)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className={cn(COMMAND_SURFACE_SOFT, 'p-5 sm:p-6 rounded-[28px]')}>
                            <div className="mb-5">
                                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Décisions</div>
                                <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Pipeline d&apos;actions</h2>
                                <p className="mt-2 text-[12px] text-white/48">Colonne unique : on lit les blocages comme une liste d’exécution, pas une grille de cartes équivalentes.</p>
                            </div>
                            <div className="space-y-3">
                                {model.topActions.map((action, index) => (
                                    <CommandActionCard
                                        key={action.id}
                                        title={action.title}
                                        impact={action.impact}
                                        proof={action.proof}
                                        href={action.href}
                                        tone={action.tone}
                                        onInspect={() => setSelectedEvidence(model.evidence.items[index] || model.evidence.items[0] || null)}
                                    />
                                ))}
                            </div>
                        </div>

                        <CommandChartCard
                            eyebrow="Tendance"
                            title={model.trend.title}
                            description={model.trend.description}
                            action={<Link href={`${geoBase}/signals`} className={cn(COMMAND_BUTTONS.subtle, 'rounded-xl')}>Signaux</Link>}
                            legend={model.trend.state === 'ready' ? (
                                <div className="flex flex-wrap gap-2">
                                    {model.trend.series.map((series) => {
                                        const latestValue = getLastFiniteTrendValue(series.values);
                                        const isPrimary = series.id === primaryTrendSeriesId;
                                        return (
                                            <div
                                                key={series.id}
                                                className={cn(
                                                    'min-w-[140px] rounded-2xl border px-3 py-2.5',
                                                    isPrimary ? 'border-white/[0.12] bg-white/[0.06]' : 'border-white/[0.07] bg-white/[0.03]'
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="h-0.5 w-6 rounded-full" style={{ backgroundColor: series.color }} />
                                                    <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/45">{series.label}</span>
                                                </div>
                                                <div className="mt-1.5 text-lg font-semibold tabular-nums text-white/90">
                                                    {latestValue == null ? 'n.d.' : `${Math.round(latestValue)}%`}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}
                            empty={model.trend.state === 'empty' ? (
                                <EmptyTrendState title="Historique court" description={model.trend.description} href={`${geoBase}/signals`} />
                            ) : null}
                        >
                            {model.trend.state === 'ready' ? (
                                <div className="h-[280px] sm:h-[300px]">
                                    <CommandLineChart
                                        className="h-full"
                                        labels={model.trend.labels}
                                        series={model.trend.series}
                                        primarySeriesId={primaryTrendSeriesId}
                                    />
                                </div>
                            ) : null}
                        </CommandChartCard>

                        <div className="grid gap-6 lg:grid-cols-2">
                            <div className={cn(COMMAND_SURFACE_SOFT, 'p-5 sm:p-6 rounded-[28px]')}>
                                <div className="mb-4">
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Sources</div>
                                    <h2 className="mt-2 text-lg font-semibold">{model.connectorHealth.title}</h2>
                                    {model.connectorHealth.description ? (
                                        <p className="mt-2 text-[12px] text-white/48">{model.connectorHealth.description}</p>
                                    ) : null}
                                </div>
                                <CommandHealthMap items={model.connectorHealth.items} />
                                <Link href={`${dossierBase}/connectors`} className={cn(COMMAND_BUTTONS.subtle, 'mt-4 rounded-xl w-full justify-center')}>
                                    Détail connecteurs
                                </Link>
                            </div>
                            <div className={cn(COMMAND_SURFACE_SOFT, 'p-5 sm:p-6 rounded-[28px] overflow-hidden')}>
                                <div className="mb-4">
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">Chronologie</div>
                                    <h2 className="mt-2 text-lg font-semibold">{model.timeline.title}</h2>
                                    {model.timeline.description ? (
                                        <p className="mt-2 text-[12px] text-white/48">{model.timeline.description}</p>
                                    ) : null}
                                </div>
                                <div className="max-h-[340px] overflow-y-auto geo-scrollbar space-y-3 pr-1">
                                    {(model.timeline.items || []).length > 0 ? (
                                        model.timeline.items.map((it) => (
                                            <div key={it.id} className="rounded-2xl border border-slate-400/12 bg-[#2a2f3a] px-4 py-3">
                                                <div className="text-[13px] font-semibold text-white/90">{it.title}</div>
                                                {it.description ? <p className="mt-1 text-[11px] text-white/45">{it.description}</p> : null}
                                                <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-white/35">
                                                    {it.provenanceLabel ? <span>{it.provenanceLabel}</span> : null}
                                                    {it.relativeTime || it.timestamp ? <span>{it.relativeTime || it.timestamp}</span> : null}
                                                </div>
                                                {it.href ? (
                                                    <Link href={it.href} className="mt-2 inline-block text-[11px] font-semibold text-sky-300/90 hover:text-sky-200">
                                                        Ouvrir →
                                                    </Link>
                                                ) : null}
                                            </div>
                                        ))
                                    ) : (
                                        <GeoEmptyPanel title={model.timeline.empty.title} description={model.timeline.empty.description} />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <CommandDrawer
                open={Boolean(selectedEvidence)}
                title={selectedEvidence?.title}
                subtitle={selectedEvidence?.summary}
                tone={selectedEvidence?.tone}
                onClose={() => setSelectedEvidence(null)}
                footer={selectedEvidence?.href ? (
                    <Link href={selectedEvidence.href} className={cn(COMMAND_BUTTONS.primary, 'rounded-xl')}>
                        Ouvrir la page liée
                        <ArrowUpRight className="h-4 w-4" />
                    </Link>
                ) : null}
            >
                <EvidenceDrawerContent evidence={selectedEvidence} />
            </CommandDrawer>

            <div className="pointer-events-none fixed bottom-6 right-6 hidden xl:block opacity-[0.07]">
                {brand}
            </div>
        </motion.div>
    );
}
