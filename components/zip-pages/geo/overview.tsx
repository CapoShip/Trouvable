// @ts-nocheck
'use client';

import Link from 'next/link';
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    Cell,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    AlertTriangleIcon,
    ArrowUpRightIcon,
    BotIcon,
    QuoteIcon,
    SparklesIcon,
} from 'lucide-react';

import { CommandHeader, CommandPageShell } from '@/components/command';
import { CommandChartCard } from '@/components/command/CommandChartCard';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import CommandEmptyState from '@/app/admin/(gate)/components/command/CommandEmptyState';
import { useGeoClient, useGeoWorkspaceSlice } from '@/app/admin/(gate)/context/ClientContext';
import { buildGeoOverviewCommandModel } from '@/app/admin/(gate)/views/geo-overview-model';

const EASE = [0.16, 1, 0.3, 1];

function providerColor(index) {
    const colors = ['bg-emerald-500', 'bg-sky-500', 'bg-indigo-500', 'bg-amber-500', 'bg-orange-500'];
    return colors[index % colors.length];
}

function providerAccent(index) {
    const colors = ['#10b981', '#0ea5e9', '#6366f1', '#f59e0b', '#f97316'];
    return colors[index % colors.length];
}

function normalizeLabel(value) {
    return String(value || 'n.d.')
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '');
}

function formatMetric(value, suffix = '') {
    if (value == null || value === '') return 'n.d.';
    return `${value}${suffix}`;
}

function buildHeroData(model) {
    const primarySeries = model?.trend?.series?.find((item) => item.id === 'geo')
        || model?.trend?.series?.find((item) => item.id === 'visibility')
        || model?.trend?.series?.[0];
    if (!primarySeries || !Array.isArray(model?.trend?.labels)) return [];

    return model.trend.labels.map((label, index) => ({
        date: label,
        value: primarySeries.values?.[index] ?? null,
    })).filter((row) => typeof row.value === 'number' && Number.isFinite(row.value));
}

function buildModelsData(data) {
    return (data?.visibility?.topProvidersModels || []).slice(0, 5).map((item, index) => ({
        id: `${item.provider || 'provider'}-${item.model || index}`,
        name: [item.provider, item.model].filter(Boolean).join(' · ') || 'Modele observe',
        logo: providerColor(index),
        accent: providerAccent(index),
        share: item.targetRatePercent ?? null,
        citations: item.sources ?? 0,
        runs: item.runs ?? 0,
    }));
}

function buildFeedItems(model) {
    return (model?.timeline?.items || []).slice(0, 8).map((item, index) => ({
        id: item.id || `timeline-${index}`,
        type: item.tone === 'critical' || item.tone === 'warning' ? 'alert' : 'citation',
        model: item.provenanceLabel || 'Observed',
        query: item.title || 'Activite recente',
        snippet: item.description || 'Aucun detail supplementaire disponible.',
        time: item.relativeTime || 'n.d.',
        href: item.href || null,
    }));
}

function buildTopics(data) {
    return (data?.sources?.topHosts || []).slice(0, 6).map((item) => ({
        topic: normalizeLabel(item.host || item.label || 'source'),
        value: Number(item.count || 0),
    }));
}

function StateCard({ title, description, actionLabel, actionHref }) {
    return (
        <CommandEmptyState
            title={title}
            description={description}
            action={actionHref ? <Link href={actionHref} className={COMMAND_BUTTONS.secondary}>{actionLabel}</Link> : null}
        />
    );
}

export default function GeoOverviewPage() {
    const { client, clientId, workspace, audit } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('overview');

    const geoBase = clientId ? `/admin/clients/${clientId}/geo` : '/admin/clients';
    const seoBase = clientId ? `/admin/clients/${clientId}/seo` : '/admin/clients';
    const dossierBase = clientId ? `/admin/clients/${clientId}/dossier` : '/admin/clients';

    const model = useMemo(() => {
        if (!data) return null;
        return buildGeoOverviewCommandModel({ clientId, client, workspace, audit, data });
    }, [audit, client, clientId, data, workspace]);

    const heroData = useMemo(() => buildHeroData(model), [model]);
    const modelsData = useMemo(() => buildModelsData(data), [data]);
    const feedItems = useMemo(() => buildFeedItems(model), [model]);
    const topics = useMemo(() => buildTopics(data), [data]);

    return (
        <CommandPageShell
            header={(
                <CommandHeader
                    eyebrow="GEO Ops"
                    title="Situation GEO"
                    subtitle={`Cockpit de lecture GEO pour ${client?.client_name || 'ce mandat'} : meme rendu premium que le ZIP, alimente uniquement par le workspace overview du dossier courant.`}
                    actions={(
                        <>
                            <Link href={`${geoBase}/opportunities`} className={COMMAND_BUTTONS.secondary}>File d'action</Link>
                            <Link href={`${geoBase}/runs`} className={COMMAND_BUTTONS.secondary}>Execution</Link>
                            <Link href={`${dossierBase}/connectors`} className={COMMAND_BUTTONS.primary}>Connecteurs</Link>
                        </>
                    )}
                />
            )}
        >
            {loading ? (
                <div className={cn(COMMAND_PANEL, 'p-8')}>
                    <div className="text-[15px] font-semibold text-white/90">Chargement de la situation GEO</div>
                    <p className="mt-2 text-[13px] text-white/55">Le dashboard attend les donnees reelles du slice overview pour ce dossier.</p>
                </div>
            ) : error ? (
                <StateCard
                    title="Situation GEO indisponible"
                    description={error}
                    actionLabel="Ouvrir les runs"
                    actionHref={`${geoBase}/runs`}
                />
            ) : !data || !model ? (
                <StateCard
                    title="Aucune donnee overview"
                    description="Les blocs apparaitront des que le workspace remontera des signaux observes pour ce dossier."
                    actionLabel="Voir la sante SEO"
                    actionHref={`${seoBase}/health`}
                />
            ) : (
                <>
                    <div className={cn(COMMAND_PANEL, 'relative overflow-hidden p-0 h-[240px] flex items-center justify-center border-indigo-500/20')}>
                        <div className="absolute inset-0 opacity-30">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={heroData}>
                                    <defs>
                                        <linearGradient id="geoOverviewHeroGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.45} />
                                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} fill="url(#geoOverviewHeroGradient)" isAnimationActive={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="relative z-10 flex flex-col items-center px-4 text-center">
                            <div className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-indigo-300">
                                <SparklesIcon className="h-4 w-4" />
                                Visibilite IA globale
                            </div>
                            <div className="flex items-baseline gap-4">
                                <span className="text-[72px] font-bold leading-none tracking-tighter text-white tabular-nums">
                                    {model.hero?.score?.value ?? 'n.d.'}
                                    <span className="text-[40px] text-white/50">{model.hero?.score?.value != null ? '/100' : ''}</span>
                                </span>
                                <div className={cn(
                                    'flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm font-bold',
                                    model.hero?.status?.tone === 'critical'
                                        ? 'border-rose-500/20 bg-rose-500/10 text-rose-300'
                                        : model.hero?.status?.tone === 'warning'
                                            ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                                            : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
                                )}>
                                    <ArrowUpRightIcon className="h-4 w-4" />
                                    {model.hero?.status?.label || 'Stable'}
                                </div>
                            </div>
                            <div className="mt-4 text-[13px] text-white/60">
                                {model.hero?.status?.summary || 'Lecture consolidee des audits, runs et signaux observes.'}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <h3 className="mb-3 ml-1 text-[12px] font-semibold text-white/90">Performance par LLM</h3>
                        {modelsData.length === 0 ? (
                            <div className={cn(COMMAND_PANEL, 'p-5 text-[12px] text-white/50')}>
                                Les colonnes par modele apparaitront des qu'un historique de runs sera disponible sur ce dossier.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                                {modelsData.map((modelRow, index) => (
                                    <motion.div
                                        key={modelRow.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05, duration: 0.35, ease: EASE }}
                                        className={cn(COMMAND_PANEL, 'group flex cursor-pointer flex-col p-4 transition-colors hover:bg-white/[0.04]')}
                                    >
                                        <div className="mb-4 flex items-center gap-2">
                                            <div className={cn('flex h-5 w-5 items-center justify-center rounded-full shadow-lg', modelRow.logo)}>
                                                <BotIcon className="h-3 w-3 text-white" />
                                            </div>
                                            <span className="truncate text-[12px] font-bold text-white/90">{modelRow.name}</span>
                                        </div>

                                        <div className="mb-4 flex items-end justify-between">
                                            <div>
                                                <div className="text-[24px] font-bold leading-none text-white tabular-nums">{formatMetric(modelRow.share, '%')}</div>
                                                <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">Presence</div>
                                            </div>
                                            <div className="w-16">
                                                <div className="h-1.5 overflow-hidden rounded-full bg-white/6">
                                                    <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, modelRow.share || 0))}%`, backgroundColor: modelRow.accent }} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-auto grid grid-cols-2 gap-2 border-t border-white/[0.05] pt-4">
                                            <div>
                                                <div className="mb-0.5 text-[10px] text-white/40">Citations</div>
                                                <div className="text-[12px] font-semibold text-white/80 tabular-nums">{modelRow.citations}</div>
                                            </div>
                                            <div>
                                                <div className="mb-0.5 text-[10px] text-white/40">Runs</div>
                                                <div className="text-[12px] font-semibold text-white/80 tabular-nums">{modelRow.runs}</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <div className={cn(COMMAND_PANEL, 'col-span-1 lg:col-span-2 p-0 overflow-hidden flex flex-col h-[400px]')}>
                            <div className="flex items-center justify-between border-b border-white/[0.05] bg-white/[0.02] p-4">
                                <h3 className="text-[12px] font-semibold text-white/90">Flux en temps reel</h3>
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                    </span>
                                    <span className="text-[10px] font-mono text-emerald-400">LIVE</span>
                                </div>
                            </div>

                            <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-none">
                                {feedItems.length === 0 ? (
                                    <div className="flex h-full min-h-[240px] items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] text-center text-[12px] text-white/45">
                                        Aucune activite recente partageable dans le workspace overview.
                                    </div>
                                ) : (
                                    feedItems.map((item, index) => (
                                        <div key={item.id} className="relative pl-6 pb-2">
                                            {index !== feedItems.length - 1 ? <div className="absolute left-[11px] top-6 bottom-0 w-px bg-white/[0.05]" /> : null}
                                            <div className={cn(
                                                'absolute left-0 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full border-4 border-[#0a0c12]',
                                                item.type === 'alert' ? 'bg-amber-500 text-amber-950' : 'bg-indigo-500 text-white',
                                            )}>
                                                {item.type === 'alert' ? <AlertTriangleIcon className="h-3 w-3" /> : <QuoteIcon className="h-3 w-3" />}
                                            </div>

                                            <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]">
                                                <div className="mb-2 flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/80">{item.model}</span>
                                                        <span className="text-[11px] font-mono text-white/50">{item.query}</span>
                                                    </div>
                                                    <span className="text-[10px] text-white/30">{item.time}</span>
                                                </div>
                                                <p className="border-l-2 border-white/10 pl-3 text-[13px] italic leading-relaxed text-white/80">{item.snippet}</p>
                                                {item.href ? (
                                                    <div className="mt-3 flex gap-2">
                                                        <Link href={item.href} className="rounded bg-white/5 px-3 py-1 text-[10px] font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                                                            Ouvrir
                                                        </Link>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className={cn(COMMAND_PANEL, 'col-span-1 p-5 flex flex-col h-[400px]')}>
                            <h3 className="mb-1 text-[12px] font-semibold text-white/90">Empreinte sources</h3>
                            <p className="mb-6 text-[10px] text-white/40">Domaines reellement cites dans les reponses observees.</p>

                            {topics.length === 0 ? (
                                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] text-center text-[12px] text-white/45">
                                    Aucune citation source exploitable pour l'instant.
                                </div>
                            ) : (
                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={topics} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                            <XAxis type="number" hide />
                                            <YAxis
                                                dataKey="topic"
                                                type="category"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
                                                width={120}
                                            />
                                            <RechartsTooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                contentStyle={{ backgroundColor: '#090a0b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                            />
                                            <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                                                {topics.map((entry, index) => (
                                                    <Cell key={`cell-${entry.topic}-${index}`} fill={`rgba(139,92,246,${0.35 + (Math.min(entry.value, 100) / 100) * 0.65})`} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
                        {(model.topActions || []).slice(0, 3).map((action) => (
                            <CommandChartCard key={action.id} title={action.title} subtitle={action.proof || 'Action priorisee depuis le workspace overview.'}>
                                <div className="flex h-full flex-col justify-between gap-4 rounded-[18px] border border-white/[0.06] bg-white/[0.02] p-4">
                                    <p className="text-[13px] leading-relaxed text-white/70">{action.impact || 'Action operateur prete a etre ouverte.'}</p>
                                    <Link href={action.href || `${geoBase}/opportunities`} className={cn(COMMAND_BUTTONS.secondary, 'w-fit')}>
                                        Ouvrir
                                        <ArrowUpRightIcon className="h-4 w-4" />
                                    </Link>
                                </div>
                            </CommandChartCard>
                        ))}
                    </div>
                </>
            )}
        </CommandPageShell>
    );
}
