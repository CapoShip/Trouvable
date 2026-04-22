'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, CircleDot, Hexagon, Orbit, RadioTower } from 'lucide-react';

import ReliabilityPill from '@/components/ui/ReliabilityPill';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import {
    DossierEmptyState,
    DossierErrorState,
    DossierLoadingState,
    DossierTimelineItem,
    connectorStatusLabel,
    timeSince,
} from './DossierViewShared';

function Chip({ children, tone = 'neutral' }) {
    const tones = {
        neutral: 'border-white/[0.08] bg-white/[0.04] text-white/55',
        ok: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100/90',
        warn: 'border-amber-400/25 bg-amber-400/10 text-amber-100/90',
        info: 'border-sky-400/25 bg-sky-400/10 text-sky-100/90',
    };
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${tones[tone] || tones.neutral}`}>
            {children}
        </span>
    );
}

function IdentityStrip({ items }) {
    if (!items?.length) return null;
    return (
        <div className="grid gap-0 divide-y divide-slate-400/10 rounded-2xl border border-slate-400/15 bg-[#242830]/90 overflow-hidden">
            {items.map((item) => (
                <div key={item.id} className="flex flex-col gap-1 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30">{item.label}</span>
                    <div className="flex items-center gap-2 min-w-0 sm:justify-end">
                        <span className="text-[13px] font-semibold text-white/88 truncate text-right">{item.value ?? '—'}</span>
                        <ReliabilityPill value={item?.reliability} />
                    </div>
                    {item.detail ? <p className="text-[11px] text-white/38 sm:col-span-2 sm:mt-1">{item.detail}</p> : null}
                </div>
            ))}
        </div>
    );
}

function KpiOrbit({ cards }) {
    if (!cards?.length) return null;
    return (
        <div className="relative">
            <div className="pointer-events-none absolute -inset-6 rounded-[40px] bg-[radial-gradient(ellipse_at_30%_0%,rgba(91,115,255,0.18),transparent_55%)]" />
            <div className="relative grid gap-3 sm:grid-cols-3">
                {cards.map((item, i) => {
                    const body = (
                        <div
                            className={`relative h-full overflow-hidden rounded-3xl border border-white/[0.09] bg-gradient-to-br p-5 ${
                                i === 0
                                    ? 'from-[#5b73ff]/18 via-[#2a2f3a] to-[#22262f]'
                                    : 'from-white/[0.08] via-[#2a2f3a] to-[#22262f]'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <Hexagon className="h-4 w-4 text-white/20 shrink-0" />
                                <ReliabilityPill value={item?.reliability} />
                            </div>
                            <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">{item.label}</div>
                            <div className="mt-2 text-[clamp(1.75rem,4vw,2.35rem)] font-bold tabular-nums tracking-tight text-white">{item.value ?? '—'}</div>
                            {item.detail ? <p className="mt-2 text-[11px] leading-relaxed text-white/40">{item.detail}</p> : null}
                        </div>
                    );
                    return item.href ? (
                        <Link key={item.id} href={item.href} className="block min-h-[140px]">
                            {body}
                        </Link>
                    ) : (
                        <div key={item.id} className="min-h-[140px]">
                            {body}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function FreshnessLanes({ items }) {
    if (!items?.length) return null;
    return (
        <div className="flex gap-3 overflow-x-auto pb-2 geo-scrollbar">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="min-w-[240px] shrink-0 rounded-2xl border border-slate-400/12 bg-[#22262f] px-4 py-3"
                >
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30">{item.label}</div>
                    <div className="mt-2 text-[15px] font-semibold text-white/90">{item.value ?? '—'}</div>
                    {item.detail ? <p className="mt-1 text-[11px] text-white/38">{item.detail}</p> : null}
                </div>
            ))}
        </div>
    );
}

function ActionQueue({ actions, clientBase }) {
    const items = actions?.items || [];
    const stale = actions?.staleCount || 0;
    const open = actions?.totalOpen || 0;

    return (
        <div className="flex h-full min-h-[320px] flex-col rounded-3xl border border-slate-400/15 bg-[#232730] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.28)]">
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/35">
                    <Orbit className="h-3.5 w-3.5 text-violet-300/80" />
                    File tactique
                </div>
                <Link href={`${clientBase}/geo/opportunities`} className="text-[11px] font-semibold text-violet-300 hover:text-violet-200">
                    Ouvrir
                </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
                <Chip tone={open > 0 ? 'info' : 'ok'}>
                    <CircleDot className="h-3 w-3" />
                    {open} ouverte{open !== 1 ? 's' : ''}
                </Chip>
                {stale > 0 ? (
                    <Chip tone="warn">
                        {stale} à revalider
                    </Chip>
                ) : null}
            </div>
            <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 geo-scrollbar">
                {items.length > 0 ? (
                    items.map((item) => <DossierTimelineItem key={item.id} item={item} />)
                ) : (
                    <DossierEmptyState {...(actions?.emptyState || { title: 'Rien en attente', description: 'La file est vide pour ce mandat.' })} />
                )}
            </div>
        </div>
    );
}

function ConnectorBus({ preview, emptyState, clientBase }) {
    return (
        <div className="rounded-3xl border border-slate-400/14 bg-[linear-gradient(180deg,#2e3440_0%,#242830_100%)] p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/28">Bus sources</div>
                    <p className="mt-1 max-w-xl text-[12px] text-white/45">Lecture linéaire : chaque connecteur est un segment du bus, sans grille de cartes.</p>
                </div>
                <Link
                    href={`${clientBase}/dossier/connectors`}
                    className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-white/70 hover:border-violet-400/30 hover:text-white"
                >
                    Baie complète
                    <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
            </div>
            <div className="mt-5 space-y-2">
                {preview?.length > 0 ? (
                    preview.map((item) => (
                        <div
                            key={item.id}
                            className="flex flex-col gap-2 rounded-2xl border border-slate-400/12 bg-[#2a2f3a] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div className="min-w-0">
                                <div className="text-[13px] font-semibold text-white/90">{item.label}</div>
                                {item.detail ? <p className="text-[11px] text-white/38 mt-0.5">{item.detail}</p> : null}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/55">
                                    {connectorStatusLabel(item?.status)}
                                </span>
                                <ReliabilityPill value={item?.reliability} />
                            </div>
                        </div>
                    ))
                ) : (
                    <DossierEmptyState {...emptyState} />
                )}
            </div>
        </div>
    );
}

function QuickDock({ shared = [], seo = [], geo = [], clientBase }) {
    const groups = [
        { label: 'Dossier', items: shared },
        { label: 'SEO', items: seo },
        { label: 'GEO', items: geo },
    ].filter((g) => g.items?.length);

    if (!groups.length) return null;

    return (
        <div className="rounded-3xl border border-dashed border-slate-400/20 bg-[#22262f]/80 p-5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/28">
                <RadioTower className="h-3.5 w-3.5" />
                Accès direct
            </div>
            <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:gap-10">
                {groups.map((g) => (
                    <div key={g.label} className="min-w-0 flex-1">
                        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/22 mb-2">{g.label}</div>
                        <div className="flex flex-wrap gap-2">
                            {g.items.map((item) => (
                                <Link
                                    key={`${g.label}-${item.id}`}
                                    href={item.href}
                                    className="group rounded-2xl border border-slate-400/15 bg-[#252a35] px-3 py-2 transition-colors hover:border-[#5b73ff]/40"
                                >
                                    <div className="text-[12px] font-semibold text-white/85 group-hover:text-white">{item.label}</div>
                                    {item.description ? (
                                        <div className="text-[10px] text-white/35 mt-0.5 max-w-[200px] line-clamp-2">{item.description}</div>
                                    ) : null}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
                <Link href={`${clientBase}/dossier/activity`} className="text-[11px] font-semibold text-sky-300/90 hover:text-sky-200">
                    Journal brut →
                </Link>
                <span className="text-white/15">|</span>
                <Link href={`${clientBase}/geo/opportunities`} className="text-[11px] font-semibold text-fuchsia-300/90 hover:text-fuchsia-200">
                    File d&apos;actions →
                </Link>
            </div>
        </div>
    );
}

export default function DossierOverviewView() {
    const { clientId } = useGeoClient() || {};
    const { data, loading, error } = useGeoWorkspaceSlice('dossier');
    const clientBase = clientId ? `/admin/clients/${clientId}` : '';

    if (loading) return <DossierLoadingState label="Chargement du dossier partagé…" />;
    if (error) return <DossierErrorState message={error} />;
    if (!data) {
        return (
            <div className="p-5 md:p-7 max-w-[1600px] mx-auto">
                <DossierEmptyState
                    title="Dossier partagé indisponible"
                    description="La synthèse transverse du mandat n'a pas pu être chargée proprement."
                />
            </div>
        );
    }

    const h = data.header || {};
    const updated = h.lastUpdatedAt ? timeSince(h.lastUpdatedAt) : null;

    return (
        <div className="min-h-[calc(100vh-6rem)] bg-[#1a1d24] text-white">
            <div className="relative overflow-hidden border-b border-white/[0.06]">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,rgba(91,115,255,0.12)_0%,transparent_42%,rgba(236,72,153,0.08)_100%)]" />
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative mx-auto max-w-[1800px] px-4 py-10 md:px-10"
                >
                    <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-3xl space-y-4">
                            <div className="font-mono text-[11px] text-white/35">dossier.shared.mandate</div>
                            <h1 className="text-[clamp(1.85rem,4.2vw,3rem)] font-semibold tracking-[-0.055em] leading-[1.05]">
                                {h.title || 'Dossier partagé'}
                            </h1>
                            <p className="text-[14px] leading-relaxed text-white/48 max-w-2xl">{h.subtitle || 'Synthèse transverse du mandat.'}</p>
                            <div className="flex flex-wrap gap-2">
                                {h.lifecycleLabel ? <Chip>{h.lifecycleLabel}</Chip> : null}
                                {h.publicationLabel ? <Chip tone="info">{h.publicationLabel}</Chip> : null}
                                {updated ? <Chip>Mis à jour {updated}</Chip> : null}
                                {h.website ? (
                                    <a
                                        href={h.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-[11px] font-medium text-sky-200/90 hover:bg-white/[0.07]"
                                    >
                                        {String(h.website).replace(/^https?:\/\//, '')}
                                        <ArrowUpRight className="h-3 w-3" />
                                    </a>
                                ) : null}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 xl:pb-1">
                            <Link
                                href={`${clientBase}/geo/opportunities`}
                                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#5b73ff] to-[#7c3aed] px-5 py-3 text-[12px] font-semibold text-white shadow-[0_12px_40px_rgba(91,115,255,0.35)]"
                            >
                                Prioriser la file
                            </Link>
                            <Link
                                href={`${clientBase}/dossier/activity`}
                                className="inline-flex items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.04] px-5 py-3 text-[12px] font-semibold text-white/85"
                            >
                                Flux temps réel
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="mx-auto max-w-[1800px] space-y-10 px-4 py-10 md:px-10 pb-16">
                <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
                    <div className="space-y-6">
                        <KpiOrbit cards={data.summaryCards} />
                        <div>
                            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/28">Identité mandatée</div>
                            <IdentityStrip items={data.identityCards} />
                        </div>
                        <div>
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/28">Cadence observée</span>
                            </div>
                            <FreshnessLanes items={data.freshnessCards} />
                        </div>
                    </div>
                    <ActionQueue actions={data.actions} clientBase={clientBase} />
                </section>

                <section>
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/28">Pellicule d&apos;activité</div>
                            <p className="mt-1 text-[12px] text-white/42">Derniers signaux — défilement horizontal, pas de pile verticale classique.</p>
                        </div>
                        <Link href={`${clientBase}/dossier/activity`} className="text-[11px] font-semibold text-white/50 hover:text-white">
                            Tout le journal
                        </Link>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 geo-scrollbar">
                        {data.activity.items.length > 0 ? (
                            data.activity.items.map((item) => (
                                <div key={item.id} className="min-w-[300px] max-w-[340px] shrink-0">
                                    <DossierTimelineItem item={item} />
                                </div>
                            ))
                        ) : (
                            <div className="min-w-full">
                                <DossierEmptyState {...data.activity.emptyState} />
                            </div>
                        )}
                    </div>
                </section>

                <ConnectorBus preview={data.connectors.preview} emptyState={data.connectors.emptyState} clientBase={clientBase} />

                <QuickDock shared={data.quickLinks?.shared} seo={data.quickLinks?.seo} geo={data.quickLinks?.geo} clientBase={clientBase} />
            </div>
        </div>
    );
}
