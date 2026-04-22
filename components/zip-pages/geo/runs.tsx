// @ts-nocheck
'use client';

import Link from 'next/link';
import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertCircleIcon,
    CheckCircle2Icon,
    ClockIcon,
    FilterIcon,
    PauseIcon,
    PlayIcon,
    RefreshCwIcon,
    SearchIcon,
    ServerIcon,
    XCircleIcon,
} from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

import { CommandHeader, CommandMetricCard, CommandPageShell } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import CommandEmptyState from '@/app/admin/(gate)/components/command/CommandEmptyState';
import { useGeoClient, useGeoWorkspaceSlice } from '@/app/admin/(gate)/context/ClientContext';

function parseJsonResponse(response) {
    return response.json().catch(() => ({})).then((json) => {
        if (!response.ok) throw new Error(json.error || `Erreur ${response.status}`);
        return json;
    });
}

function formatDateTime(value) {
    if (!value) return 'n.d.';
    try {
        return new Date(value).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return 'n.d.';
    }
}

function formatShortTime(value) {
    if (!value) return '--:--';
    try {
        return new Date(value).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '--:--';
    }
}

function timeSince(value) {
    if (!value) return 'n.d.';
    const diff = Date.now() - new Date(value).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return '< 1h';
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
}

function statusMeta(status) {
    if (status === 'completed') return { label: 'Termine', short: 'Succes', icon: CheckCircle2Icon, color: 'text-emerald-400', chip: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
    if (status === 'partial') return { label: 'Partiel', short: 'Partiel', icon: AlertCircleIcon, color: 'text-amber-400', chip: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' };
    if (status === 'running' || status === 'pending') return { label: 'En cours', short: 'En cours', icon: ServerIcon, color: 'text-indigo-400', chip: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' };
    if (status === 'partial_error') return { label: 'Erreur partielle', short: 'Erreur', icon: XCircleIcon, color: 'text-rose-400', chip: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' };
    if (status === 'failed') return { label: 'Echec', short: 'Echec', icon: XCircleIcon, color: 'text-rose-400', chip: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' };
    return { label: status || 'n.d.', short: status || 'n.d.', icon: ClockIcon, color: 'text-white/40', chip: 'bg-white/5 text-white/50 border border-white/10' };
}

function parseStatusMeta(status) {
    if (status === 'parsed_success') return { label: 'Analyse OK', color: 'text-emerald-300' };
    if (status === 'parsed_partial') return { label: 'Analyse partielle', color: 'text-amber-300' };
    if (status === 'parsed_failed') return { label: 'Analyse en echec', color: 'text-rose-300' };
    return { label: 'Analyse indisponible', color: 'text-white/40' };
}

function latencySeconds(run) {
    const ms = Number(run?.latency_ms || 0);
    if (!Number.isFinite(ms) || ms <= 0) return 1;
    return Math.max(1, Math.round(ms / 1000));
}

export default function GeoRunsPage() {
    const { clientId, invalidateWorkspace, refreshToken } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('runs');

    const [selectedRunId, setSelectedRunId] = useState(null);
    const [selectedRunDetail, setSelectedRunDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState(null);
    const [search, setSearch] = useState('');
    const [clearPending, setClearPending] = useState(false);
    const [actionMessage, setActionMessage] = useState(null);

    const geoBase = clientId ? `/admin/clients/${clientId}/geo` : '/admin/clients';
    const history = data?.history || [];
    const statusCounts = data?.summary?.statusCounts || {};
    const parseCounts = data?.summary?.parseCounts || {};

    const filteredRuns = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return history;
        return history.filter((run) => (
            String(run.id || '').toLowerCase().includes(query)
            || String(run.query_text || '').toLowerCase().includes(query)
            || String(run.provider || '').toLowerCase().includes(query)
            || String(run.model || '').toLowerCase().includes(query)
        ));
    }, [history, search]);

    const visibleRuns = useMemo(() => filteredRuns.slice(0, 50), [filteredRuns]);

    const timelineData = useMemo(() => {
        return history.slice(0, 15).reverse().map((run) => ({
            id: run.id,
            time: formatShortTime(run.created_at),
            duration: latencySeconds(run),
            status: run.status,
        }));
    }, [history]);

    const totalRuns = data?.summary?.total || 0;
    const successCount = (statusCounts.completed || 0) + (statusCounts.partial || 0);
    const failedCount = (statusCounts.failed || 0) + (statusCounts.partial_error || 0);
    const avgLatencySeconds = history.length
        ? Math.round(history.reduce((sum, run) => sum + latencySeconds(run), 0) / history.length)
        : 0;
    const parseableTotal = (parseCounts.parsed_success || 0) + (parseCounts.parsed_partial || 0) + (parseCounts.parsed_failed || 0);
    const parseSuccessRate = parseableTotal > 0 ? Math.round(((parseCounts.parsed_success || 0) / parseableTotal) * 100) : null;

    useEffect(() => {
        if (!visibleRuns.length) {
            setSelectedRunId(null);
            return;
        }
        if (!selectedRunId || !visibleRuns.some((run) => run.id === selectedRunId)) {
            setSelectedRunId(visibleRuns[0].id);
        }
    }, [selectedRunId, visibleRuns]);

    useEffect(() => {
        if (!clientId || !selectedRunId) {
            setSelectedRunDetail(null);
            setDetailError(null);
            setDetailLoading(false);
            return;
        }

        const controller = new AbortController();
        setDetailLoading(true);
        setDetailError(null);

        fetch(`/api/admin/geo/client/${clientId}/runs/${selectedRunId}?refresh=${refreshToken}`, {
            cache: 'no-store',
            signal: controller.signal,
        })
            .then(parseJsonResponse)
            .then((json) => setSelectedRunDetail(json))
            .catch((loadError) => {
                if (loadError.name === 'AbortError') return;
                setDetailError(loadError.message);
            })
            .finally(() => {
                if (!controller.signal.aborted) setDetailLoading(false);
            });

        return () => controller.abort();
    }, [clientId, refreshToken, selectedRunId]);

    async function clearErrors() {
        if (!clientId || clearPending) return;
        setClearPending(true);
        setActionMessage(null);
        try {
            const response = await fetch(`/api/admin/geo/client/${clientId}/runs/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'clear_errors' }),
            });
            const json = await parseJsonResponse(response);
            const deleted = json.deleted || 0;
            setActionMessage(`${deleted} execution(s) problematique(s) purgee(s).`);
            invalidateWorkspace();
        } catch (actionError) {
            setActionMessage(actionError.message);
        } finally {
            setClearPending(false);
        }
    }

    const headerActions = (
        <>
            <button type="button" onClick={clearErrors} disabled={clearPending} className={COMMAND_BUTTONS.secondary}>
                <PauseIcon className="h-3.5 w-3.5" />
                {clearPending ? 'Nettoyage...' : 'Purger les erreurs'}
            </button>
            <Link href={`${geoBase}/prompts`} className={COMMAND_BUTTONS.primary}>
                <PlayIcon className="h-3.5 w-3.5" />
                Declencher run
            </Link>
        </>
    );

    return (
        <CommandPageShell
            header={(
                <CommandHeader
                    eyebrow="GEO Ops"
                    title="Historique d'execution"
                    subtitle="Timeline, table et inspecteur branches sur les vraies executions GEO du dossier courant."
                    actions={headerActions}
                />
            )}
        >
            {loading ? (
                <div className={cn(COMMAND_PANEL, 'p-8')}>
                    <div className="text-[15px] font-semibold text-white/90">Chargement des executions</div>
                    <p className="mt-2 text-[13px] text-white/55">Le tableau attend les vraies executions de ce client.</p>
                </div>
            ) : error ? (
                <CommandEmptyState title="Executions indisponibles" description={error} />
            ) : history.length === 0 ? (
                <CommandEmptyState
                    title={data?.emptyState?.noRuns?.title || 'Aucune execution'}
                    description={data?.emptyState?.noRuns?.description || 'Lancez des prompts suivis pour alimenter cette vue.'}
                    action={<Link href={`${geoBase}/prompts`} className={COMMAND_BUTTONS.primary}>Ouvrir les requetes GEO</Link>}
                />
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <CommandMetricCard label="Runs" value={totalRuns} detail="Historique observe" tone="info" />
                        <CommandMetricCard label="Taux de succes" value={totalRuns ? `${Math.round((successCount / totalRuns) * 100)}%` : 'n.d.'} detail={`${failedCount} run(s) en echec`} tone={failedCount > 0 ? 'warning' : 'ok'} />
                        <CommandMetricCard label="Latence moyenne" value={avgLatencySeconds ? `${avgLatencySeconds}s` : 'n.d.'} detail="Calculee sur les runs visibles" tone="neutral" />
                        <CommandMetricCard label="Analyse parse" value={parseSuccessRate != null ? `${parseSuccessRate}%` : 'n.d.'} detail={`${parseCounts.parsed_failed || 0} echec(s) de parsing`} tone={(parseCounts.parsed_failed || 0) > 0 ? 'warning' : 'ok'} />
                    </div>

                    {actionMessage ? (
                        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[12px] text-white/70">{actionMessage}</div>
                    ) : null}

                    <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3 h-[calc(100vh-280px)] min-h-[600px]">
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            <div className={cn(COMMAND_PANEL, 'p-5 h-[220px] flex flex-col')}>
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-[12px] font-semibold text-white/90">Timeline d'execution (15 derniers runs)</h3>
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1.5 text-[10px] text-white/60"><div className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> Succes</span>
                                        <span className="flex items-center gap-1.5 text-[10px] text-white/60"><div className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> Partiel</span>
                                        <span className="flex items-center gap-1.5 text-[10px] text-white/60"><div className="h-2.5 w-2.5 rounded-sm bg-rose-500" /> Echec</span>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={timelineData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barSize={8}>
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="time" type="category" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} width={40} />
                                            <RechartsTooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                                contentStyle={{ backgroundColor: '#090a0b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                                formatter={(value) => [`${value}s`, 'Latence']}
                                            />
                                            <Bar dataKey="duration" radius={[0, 4, 4, 0]}>
                                                {timelineData.map((entry) => (
                                                    <Cell
                                                        key={entry.id}
                                                        fill={entry.status === 'completed' ? '#10b981'
                                                            : entry.status === 'partial' ? '#f59e0b'
                                                                : entry.status === 'running' || entry.status === 'pending' ? '#8b5cf6'
                                                                    : '#f43f5e'}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className={cn(COMMAND_PANEL, 'flex-1 flex flex-col p-0 overflow-hidden')}>
                                <div className="flex items-center justify-between border-b border-white/[0.05] bg-white/[0.01] p-4">
                                    <div className="relative">
                                        <SearchIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                                        <input
                                            type="text"
                                            placeholder="Rechercher par ID, requete, provider..."
                                            value={search}
                                            onChange={(event) => setSearch(event.target.value)}
                                            className="w-72 rounded-full border border-white/10 bg-black/20 py-1.5 pl-8 pr-4 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-white/55">
                                        <FilterIcon className="h-3.5 w-3.5" />
                                        {visibleRuns.length} ligne(s)
                                    </div>
                                </div>

                                <div className="flex-1 overflow-auto scrollbar-none">
                                    <table className="w-full whitespace-nowrap text-left text-[12px]">
                                        <thead className="sticky top-0 z-10 border-b border-white/[0.05] bg-[#090a0b]/95 backdrop-blur">
                                            <tr>
                                                <th className="px-5 py-3 font-semibold text-white/40">ID Run</th>
                                                <th className="px-5 py-3 font-semibold text-white/40">Prompt</th>
                                                <th className="px-5 py-3 font-semibold text-white/40">Statut</th>
                                                <th className="px-5 py-3 font-semibold text-white/40">Provider</th>
                                                <th className="px-5 py-3 font-semibold text-white/40 text-right">Latence</th>
                                                <th className="px-5 py-3 font-semibold text-white/40 text-right">Citations</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/[0.02]">
                                            {visibleRuns.map((run) => {
                                                const status = statusMeta(run.status);
                                                const StatusIcon = status.icon;
                                                const parseMeta = parseStatusMeta(run.parse_status);
                                                return (
                                                    <tr
                                                        key={run.id}
                                                        onClick={() => setSelectedRunId(run.id)}
                                                        className={cn(
                                                            'cursor-pointer transition-colors group',
                                                            selectedRunId === run.id ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]',
                                                        )}
                                                    >
                                                        <td className="px-5 py-3">
                                                            <div className="flex flex-col">
                                                                <span className={cn('font-mono font-bold', selectedRunId === run.id ? 'text-white' : 'text-white/80')}>{run.id}</span>
                                                                <span className="mt-0.5 flex items-center gap-1 text-[10px] text-white/40">
                                                                    <ClockIcon className="h-3 w-3" />
                                                                    {formatDateTime(run.created_at)}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="max-w-[320px] truncate px-5 py-3 text-white/70">{run.query_text}</td>
                                                        <td className="px-5 py-3">
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2">
                                                                    <StatusIcon className={cn('h-4 w-4', status.color, run.status === 'running' ? 'animate-pulse' : '')} />
                                                                    <span className={cn('text-[11px] font-medium', status.color)}>{status.label}</span>
                                                                </div>
                                                                <span className={cn('text-[10px]', parseMeta.color)}>{parseMeta.label}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-3 text-white/70">{[run.provider, run.model].filter(Boolean).join(' · ') || 'n.d.'}</td>
                                                        <td className="px-5 py-3 text-right font-mono text-white/70">{latencySeconds(run)}s</td>
                                                        <td className="px-5 py-3 text-right">
                                                            <span className="rounded bg-white/5 px-2 py-1 text-[11px] font-mono text-white/60">
                                                                {run.mention_counts?.sources ?? 0}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-1">
                            <AnimatePresence mode="wait">
                                {selectedRunId ? (
                                    <motion.div
                                        key={selectedRunId}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className={cn(COMMAND_PANEL, 'flex h-full flex-col overflow-hidden p-0')}
                                    >
                                        {detailLoading ? (
                                            <div className="flex h-full items-center justify-center p-6 text-[13px] text-white/45">Chargement de l'inspecteur...</div>
                                        ) : detailError ? (
                                            <div className="p-6 text-[12px] text-rose-300">{detailError}</div>
                                        ) : !selectedRunDetail?.run ? (
                                            <div className="p-6 text-[12px] text-white/45">Selectionnez un run pour afficher son detail.</div>
                                        ) : (
                                            <>
                                                <div className="border-b border-white/[0.05] bg-gradient-to-b from-white/[0.03] to-transparent p-5">
                                                    <div className="mb-4 flex items-center justify-between gap-3">
                                                        <h2 className="font-mono text-[16px] font-bold text-white">{selectedRunDetail.run.id}</h2>
                                                        <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider', statusMeta(selectedRunDetail.run.status).chip)}>
                                                            {statusMeta(selectedRunDetail.run.status).short}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <div className="mb-1 text-[10px] uppercase tracking-widest text-white/40">Demarrage</div>
                                                            <div className="text-[12px] text-white/90">{formatDateTime(selectedRunDetail.run.created_at)}</div>
                                                        </div>
                                                        <div>
                                                            <div className="mb-1 text-[10px] uppercase tracking-widest text-white/40">Latence</div>
                                                            <div className="font-mono text-[12px] text-white/90">{latencySeconds(selectedRunDetail.run)}s</div>
                                                        </div>
                                                        <div>
                                                            <div className="mb-1 text-[10px] uppercase tracking-widest text-white/40">Provider</div>
                                                            <div className="text-[12px] text-white/90">{[selectedRunDetail.run.provider, selectedRunDetail.run.model].filter(Boolean).join(' · ') || 'n.d.'}</div>
                                                        </div>
                                                        <div>
                                                            <div className="mb-1 text-[10px] uppercase tracking-widest text-white/40">Prompt</div>
                                                            <div className="text-[12px] text-white/90">{selectedRunDetail.run.query_text}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex-1 space-y-6 overflow-y-auto p-5 scrollbar-none">
                                                    <div>
                                                        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/40">Diagnostic</h3>
                                                        <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 space-y-2">
                                                            <div className="text-[12px] text-white/80">
                                                                Signal: {selectedRunDetail.diagnostics?.run_signal_tier || 'n.d.'}
                                                            </div>
                                                            <div className="text-[12px] text-white/60">
                                                                Position cible: {selectedRunDetail.run.target_position ?? 'n.d.'}
                                                            </div>
                                                            <div className="text-[12px] text-white/60">
                                                                Confiance parse: {selectedRunDetail.run.parse_confidence != null ? `${Math.round(Number(selectedRunDetail.run.parse_confidence) * 100)}%` : 'n.d.'}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/40">Citations observees</h3>
                                                        <div className="space-y-2">
                                                            {(selectedRunDetail.citations || []).slice(0, 5).map((citation, index) => (
                                                                <div key={`${citation.host}-${index}`} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                                                                    <div className="text-[12px] font-semibold text-white/85">{citation.host || 'Source'}</div>
                                                                    <div className="mt-1 text-[11px] text-white/55">{citation.evidence_span || 'Aucun extrait exploitable.'}</div>
                                                                </div>
                                                            ))}
                                                            {!(selectedRunDetail.citations || []).length ? (
                                                                <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-3 text-[11px] text-white/45">
                                                                    Aucune citation extraite pour ce run.
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-white/40">Concurrents detectes</h3>
                                                        <div className="space-y-2">
                                                            {(selectedRunDetail.competitors || []).slice(0, 5).map((competitor, index) => (
                                                                <div key={`${competitor.name}-${index}`} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-3">
                                                                    <div className="text-[12px] font-semibold text-white/85">{competitor.name}</div>
                                                                    <div className="mt-1 text-[11px] text-white/55">{competitor.evidence_span || 'Aucune preuve textuelle supplementaire.'}</div>
                                                                </div>
                                                            ))}
                                                            {!(selectedRunDetail.competitors || []).length ? (
                                                                <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-3 text-[11px] text-white/45">
                                                                    Aucun concurrent confirme sur ce run.
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </div>
                    </div>
                </>
            )}
        </CommandPageShell>
    );
}
