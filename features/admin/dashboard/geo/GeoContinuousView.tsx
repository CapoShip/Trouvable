// @ts-nocheck
'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    BellIcon,
    GitCommitIcon,
    HistoryIcon,
    SaveIcon,
    SettingsIcon,
} from 'lucide-react';

import { CommandHeader, CommandMetricCard, CommandPageShell } from '@/features/admin/dashboard/shared/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import CommandEmptyState from '@/features/admin/dashboard/shared/components/command/CommandEmptyState';
import { useGeoClient, useGeoWorkspaceSlice } from '@/features/admin/dashboard/shared/context/ClientContext';

async function parseJsonResponse(response) {
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(json.error || `Erreur ${response.status}`);
    return json;
}

function formatMetricValue(value) {
    if (value == null) return 'n.d.';
    if (typeof value === 'number' && Number.isFinite(value)) return `${value}`;
    return String(value);
}

function connectorSummary(connectors) {
    if (!connectors?.summary) return 'Aucun connecteur';
    const active = (connectors.summary.configured || 0) + (connectors.summary.healthy || 0);
    return `${active} actif(s)`;
}

export default function GeoContinuousPage() {
    const { clientId, invalidateWorkspace } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('continuous');
    const [pendingAction, setPendingAction] = useState(null);
    const [feedback, setFeedback] = useState(null);

    const diffFeed = useMemo(() => {
        const down = (data?.declining || []).map((metric) => ({ ...metric, type: 'regression' }));
        const up = (data?.improving || []).map((metric) => ({ ...metric, type: 'improvement' }));
        return [...down, ...up].slice(0, 8);
    }, [data]);

    async function triggerAction(payload, successMessage) {
        if (!clientId || pendingAction) return;
        setPendingAction(payload.action);
        setFeedback(null);
        try {
            await parseJsonResponse(await fetch(`/api/admin/geo/client/${clientId}/continuous/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }));
            setFeedback(successMessage);
            invalidateWorkspace();
        } catch (requestError) {
            setFeedback(requestError.message);
        } finally {
            setPendingAction(null);
        }
    }

    return (
        <CommandPageShell
            header={(
                <CommandHeader
                    eyebrow="GEO Ops"
                    title="Suivi continu"
                    subtitle="Monitoring quotidien branche sur les snapshots, jobs recurrents et connecteurs reels du mandat."
                    actions={(
                        <button
                            type="button"
                            className={COMMAND_BUTTONS.primary}
                            disabled={Boolean(pendingAction)}
                            onClick={() => triggerAction({ action: 'dispatch_tick', maxJobsToQueue: 20 }, 'Dispatch continu execute.')}
                        >
                            <SaveIcon className="h-3.5 w-3.5" />
                            Lancer le tick
                        </button>
                    )}
                />
            )}
        >
            {loading ? (
                <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-8 text-[13px] text-white/55">Chargement du moteur continu...</div>
            ) : error ? (
                <CommandEmptyState title="Suivi continu indisponible" description={error} />
            ) : !data ? (
                <CommandEmptyState title="Suivi continu indisponible" description="Le moteur continu ne renvoie pas encore de donnees pour ce dossier." />
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <CommandMetricCard label="Cadence" value={data?.dailyMode?.label || 'n.d.'} detail="Mode continu actif" tone="info" />
                        <CommandMetricCard label="Variations detectees" value={diffFeed.length} detail="Hausses et baisses recentes" tone={diffFeed.length > 0 ? 'warning' : 'neutral'} />
                        <CommandMetricCard label="Jobs actifs" value={data?.jobs?.summary?.activeJobs ?? 0} detail={`${data?.jobs?.summary?.failedJobs ?? 0} en echec`} tone={(data?.jobs?.summary?.failedJobs ?? 0) > 0 ? 'warning' : 'ok'} />
                        <CommandMetricCard label="Connecteurs" value={connectorSummary(data?.connectors)} detail={data?.freshness?.audit?.state || 'n.d.'} tone="neutral" />
                    </div>

                    {feedback ? (
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[12px] text-white/70">{feedback}</div>
                    ) : null}

                    <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className={cn(COMMAND_PANEL, 'lg:col-span-2 p-0 flex flex-col h-[550px]')}>
                            <div className="flex items-center justify-between border-b border-white/[0.05] bg-white/[0.02] p-4">
                                <h3 className="flex items-center gap-2 text-[13px] font-semibold text-white/90">
                                    <GitCommitIcon className="h-4 w-4 text-indigo-400" />
                                    Registre des changements
                                </h3>
                                <span className="flex items-center gap-1 text-[10px] text-white/40">
                                    <HistoryIcon className="h-3 w-3" />
                                    {data?.snapshotCoverage?.count || 0} snapshot(s)
                                </span>
                            </div>

                            <div className="flex-1 space-y-6 overflow-y-auto p-5">
                                {diffFeed.length === 0 ? (
                                    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] text-[12px] text-white/45">
                                        Pas encore assez d'historique pour construire des diffs.
                                    </div>
                                ) : (
                                    diffFeed.map((diff, index) => (
                                        <motion.div
                                            key={`${diff.key}-${index}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="overflow-hidden rounded-xl border border-white/[0.05] bg-white/[0.01]"
                                        >
                                            <div className="flex items-center justify-between border-b border-white/[0.05] bg-black/20 px-4 py-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono text-white/70">{diff.latestDate || 'n.d.'}</span>
                                                    <span className="text-[12px] font-bold text-white/90">{diff.label}</span>
                                                </div>
                                                <span className="text-[10px] text-white/40">{diff.type === 'improvement' ? 'amelioration' : 'regression'}</span>
                                            </div>

                                            <div className="font-mono text-[11px] leading-relaxed">
                                                <div className="flex gap-3 border-b border-white/[0.02] bg-rose-500/5 px-4 py-3 text-rose-200/80">
                                                    <span className="font-bold text-rose-500">-</span>
                                                    <p className="flex-1">Valeur precedente: {formatMetricValue(diff.previous)}</p>
                                                </div>
                                                <div className="flex gap-3 bg-emerald-500/5 px-4 py-3 text-emerald-200/80">
                                                    <span className="font-bold text-emerald-500">+</span>
                                                    <p className="flex-1">Valeur recente: {formatMetricValue(diff.latest)}</p>
                                                </div>
                                            </div>

                                            <div className="flex justify-end border-t border-white/[0.05] bg-black/40 px-4 py-2">
                                                <span className={cn(
                                                    'rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest',
                                                    diff.type === 'improvement' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-rose-400/10 text-rose-400',
                                                )}>
                                                    {diff.delta > 0 ? `+${diff.delta}` : diff.delta}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">
                            <div className={cn(COMMAND_PANEL, 'p-5')}>
                                <h3 className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/40">
                                    <SettingsIcon className="h-3.5 w-3.5" />
                                    Jobs recurrents
                                </h3>

                                <div className="space-y-3">
                                    {(data?.jobs?.jobs || []).map((job) => (
                                        <div key={job.id} className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[12px] font-bold text-white/90">{job.job_type}</span>
                                                <span className={cn(
                                                    'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest',
                                                    job.status === 'failed' ? 'bg-rose-500/20 text-rose-300'
                                                        : job.status === 'running' ? 'bg-indigo-500/20 text-indigo-300'
                                                            : 'bg-emerald-500/20 text-emerald-300',
                                                )}>
                                                    {job.status}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-white/40">
                                                Cadence: {job.cadence_minutes || 'n.d.'} min
                                            </div>
                                            <div className="text-[10px] text-white/30 mt-1">Prochain run: {job.next_run_at || 'n.d.'}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={cn(COMMAND_PANEL, 'p-5 flex-1')}>
                                <h3 className="mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/40">
                                    <BellIcon className="h-3.5 w-3.5" />
                                    Connecteurs & action center
                                </h3>

                                <div className="space-y-3">
                                    {(data?.connectors?.connections || []).map((connection) => (
                                        <div key={connection.id || connection.provider} className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[12px] font-bold text-white/90">{connection.provider}</span>
                                                <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-white/55">{connection.status}</span>
                                            </div>
                                            <div className="text-[10px] text-white/35">{connection.account_label || connection.account_id || 'Aucun compte expose'}</div>
                                        </div>
                                    ))}

                                    {(data?.actionCenter || []).slice(0, 3).map((item) => (
                                        <div key={item.id} className="rounded-lg border border-white/[0.05] bg-black/20 p-3">
                                            <div className="text-[11px] font-semibold text-white/88">{item.title}</div>
                                            <div className="mt-1 text-[10px] leading-relaxed text-white/45">{item.rationale}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </CommandPageShell>
    );
}
