// @ts-nocheck
'use client';

import React from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import { CommandHeader, CommandMetricCard, CommandPageShell } from '@/components/command';
import { CommandTable } from '@/components/command/CommandTable';
import { CommandChartCard } from '@/components/command/CommandChartCard';
import { COMMAND_BUTTONS, cn } from '@/lib/tokens';
import CommandEmptyState from '@/app/admin/(gate)/components/command/CommandEmptyState';
import { useGeoClient, useGeoWorkspaceSlice } from '@/app/admin/(gate)/context/ClientContext';

function toneFromStatus(status) {
    const normalized = String(status || '').toLowerCase();
    if (normalized.includes('autorise')) return 'ok';
    if (normalized.includes('ambigu') || normalized.includes('confirmer')) return 'warning';
    if (normalized.includes('bloque')) return 'critical';
    return 'neutral';
}

function chipClass(status) {
    const tone = toneFromStatus(status);
    if (tone === 'ok') return 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20';
    if (tone === 'warning') return 'bg-amber-400/10 text-amber-400 border border-amber-400/20';
    if (tone === 'critical') return 'bg-rose-400/10 text-rose-400 border border-rose-400/20';
    return 'bg-white/5 text-white/50 border border-white/10';
}

export default function GeoCrawlersPage() {
    const { clientId } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('crawlers');
    const geoBase = clientId ? `/admin/clients/${clientId}/geo` : '/admin/clients';
    const dossierBase = clientId ? `/admin/clients/${clientId}/dossier` : '/admin/clients';

    const chartRows = (data?.botRows || []).map((item) => ({
        name: item.name,
        rules: (item.allow?.length || 0) + (item.disallow?.length || 0),
        fill: toneFromStatus(item.operatorStatus) === 'ok' ? '#10b981'
            : toneFromStatus(item.operatorStatus) === 'warning' ? '#f59e0b'
                : toneFromStatus(item.operatorStatus) === 'critical' ? '#f43f5e'
                    : '#8b5cf6',
    }));

    return (
        <CommandPageShell
            header={(
                <CommandHeader
                    eyebrow="GEO Ops"
                    title="Crawlers IA"
                    subtitle="Lecture live de robots.txt et des restrictions reelles observees pour les bots IA sur le domaine du client."
                    actions={(
                        <>
                            <Link href={`${geoBase}/continuous`} className={COMMAND_BUTTONS.secondary}>Suivi continu</Link>
                            <Link href={`${dossierBase}/settings`} className={COMMAND_BUTTONS.secondary}>Dossier</Link>
                        </>
                    )}
                />
            )}
        >
            {loading ? (
                <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-8 text-[13px] text-white/55">Chargement des regles bots...</div>
            ) : error ? (
                <CommandEmptyState title="Lecture crawlers indisponible" description={error} />
            ) : data?.emptyState ? (
                <CommandEmptyState title={data.emptyState.title} description={data.emptyState.description} />
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <CommandMetricCard label="Bots bloques" value={data?.summary?.blockedCount ?? 0} detail={`${data?.summary?.criticalBlockedCount ?? 0} critique(s)`} tone={(data?.summary?.blockedCount ?? 0) > 0 ? 'critical' : 'neutral'} />
                        <CommandMetricCard label="Statuts ambigus" value={data?.summary?.ambiguousCount ?? 0} detail="Regles a confirmer" tone={(data?.summary?.ambiguousCount ?? 0) > 0 ? 'warning' : 'neutral'} />
                        <CommandMetricCard label="Restrictions" value={data?.summary?.restrictionCount ?? 0} detail={data?.summary?.robotsStatus || 'robots inconnu'} tone={(data?.summary?.restrictionCount ?? 0) > 0 ? 'warning' : 'ok'} />
                        <CommandMetricCard label="Fraicheur live" value={data?.summary?.liveFreshness || 'n.d.'} detail={data?.freshness?.audit?.value || 'Audit non disponible'} tone="info" />
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <CommandChartCard title="Regles observees par bot" className="lg:col-span-1 h-[320px]">
                            {chartRows.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-[12px] text-white/45">Aucune regle exploitable observee.</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartRows} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#090a0b', borderColor: 'rgba(255,255,255,0.1)' }} />
                                        <Bar dataKey="rules" radius={[0, 4, 4, 0]} barSize={16}>
                                            {chartRows.map((row) => <Cell key={row.name} fill={row.fill} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CommandChartCard>

                        <div className="lg:col-span-2 flex flex-col">
                            <div className="mb-4 px-1 text-[14px] font-semibold text-white/90">Statut des bots observes</div>
                            <CommandTable
                                className="flex-1"
                                headers={['Bot', 'Source de regle', 'Impact', 'Statut', 'Fraicheur']}
                                rows={(data?.botRows || []).map((row) => [
                                    <span className="font-medium text-violet-300">{row.name}</span>,
                                    <span className="text-[11px] text-white/50">{row.ruleSource || 'n.d.'}</span>,
                                    <span className="max-w-[360px] truncate text-[11px] text-white/70">{row.impact || row.evidence || 'Aucun impact detaille.'}</span>,
                                    <span className={cn('px-2 py-0.5 rounded text-[10px]', chipClass(row.operatorStatus))}>{row.operatorStatus}</span>,
                                    <span className="text-[11px] text-white/40">{data?.summary?.liveFreshness || 'n.d.'}</span>,
                                ])}
                            />
                        </div>
                    </div>

                    {(data?.restrictionRows || []).length > 0 ? (
                        <div className="mt-6 rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-5">
                            <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/55">Restrictions detectees</div>
                            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {data.restrictionRows.map((row, index) => (
                                    <div key={`${row.pattern}-${index}`} className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                                        <div className="text-[12px] font-semibold text-white/88">{row.pattern}</div>
                                        <div className="mt-1 text-[11px] text-white/55">{row.impact}</div>
                                        <div className="mt-2 text-[11px] text-white/42">{(row.bots || []).join(' · ') || 'Aucun bot liste'}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </>
            )}
        </CommandPageShell>
    );
}
