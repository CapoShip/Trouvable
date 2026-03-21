'use client';

import { useMemo, useState } from 'react';

import {
    GeoBarRow,
    GeoEmptyPanel,
    GeoKpiCard,
    GeoPremiumCard,
    GeoSectionTitle,
} from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../../context/GeoClientContext';

const CADENCE_OPTIONS = [
    { label: 'Every 6h', value: 360 },
    { label: 'Every 12h', value: 720 },
    { label: 'Every 24h', value: 1440 },
    { label: 'Every 48h', value: 2880 },
    { label: 'Weekly', value: 10080 },
];

function formatDateTime(value) {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return '-';
    }
}

function statusPillClass(status) {
    if (status === 'completed') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
    if (status === 'running') return 'border-violet-400/20 bg-violet-400/10 text-violet-300';
    if (status === 'pending') return 'border-amber-400/20 bg-amber-400/10 text-amber-300';
    if (status === 'failed') return 'border-red-400/20 bg-red-400/10 text-red-300';
    if (status === 'cancelled') return 'border-white/15 bg-white/[0.03] text-white/55';
    return 'border-white/10 bg-white/[0.03] text-white/50';
}

function freshnessText(freshness) {
    if (!freshness) return 'missing';
    if (freshness.state === 'missing') return 'missing';
    if (freshness.state === 'fresh') return `fresh (${freshness.hours}h)`;
    if (freshness.state === 'warning') return `warning (${freshness.hours}h)`;
    return `stale (${freshness.hours}h)`;
}

function deltaClass(value) {
    if (value == null) return 'text-white/40';
    if (value > 0) return 'text-emerald-300';
    if (value < 0) return 'text-red-300';
    return 'text-white/50';
}

function formatDelta(value) {
    if (value == null) return '—';
    return `${value > 0 ? '+' : ''}${value}`;
}

function connectorStatusClass(status) {
    if (status === 'configured') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
    if (status === 'sample_mode') return 'border-violet-400/20 bg-violet-400/10 text-violet-300';
    if (status === 'disabled') return 'border-white/15 bg-white/[0.03] text-white/55';
    if (status === 'error') return 'border-red-400/20 bg-red-400/10 text-red-300';
    return 'border-amber-400/20 bg-amber-400/10 text-amber-300';
}

async function parseJsonResponse(response) {
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(json.error || `Erreur ${response.status}`);
    }
    return json;
}

function summarizeConnectorData(providerSnapshot) {
    if (!providerSnapshot) return 'No connector data.';
    if (providerSnapshot.provider === 'ga4') {
        const traffic = providerSnapshot.trafficTrend?.length || 0;
        const landing = providerSnapshot.landingPages?.length || 0;
        return `${traffic} traffic points • ${landing} landing rows`;
    }
    if (providerSnapshot.provider === 'gsc') {
        const queries = providerSnapshot.searchQueryTrend?.length || 0;
        const landing = providerSnapshot.landingPageTrend?.length || 0;
        return `${queries} query points • ${landing} landing rows`;
    }
    return 'No connector data.';
}

function metricMaxAbs(items = []) {
    const values = items
        .map((item) => Math.abs(Number(item?.delta || 0)))
        .filter((value) => Number.isFinite(value));
    return values.length ? Math.max(...values) : 1;
}

export default function GeoContinuousView() {
    const { clientId, client, invalidateWorkspace } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('continuous');
    const [actionPending, setActionPending] = useState(null);
    const [actionMessage, setActionMessage] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [cadenceDraft, setCadenceDraft] = useState({});

    const jobs = data?.jobs?.jobs || [];
    const runs = data?.jobs?.runs || [];
    const metricRows = data?.metrics || [];
    const improving = data?.improving || [];
    const declining = data?.declining || [];
    const actions = data?.actionCenter || [];
    const connectors = data?.connectors?.connections || [];
    const connectorSnapshots = data?.connectors?.providers || {};

    const topRunRows = useMemo(() => runs.slice(0, 12), [runs]);
    const improvingMax = metricMaxAbs(improving);
    const decliningMax = metricMaxAbs(declining);

    async function triggerAction(payload, successMessage, pendingKey) {
        if (!clientId) return;
        setActionPending(pendingKey || payload.action);
        setActionError(null);
        setActionMessage(null);
        try {
            await parseJsonResponse(
                await fetch(`/api/admin/geo/client/${clientId}/continuous/actions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
            );
            setActionMessage(successMessage);
            invalidateWorkspace();
        } catch (requestError) {
            setActionError(requestError.message);
        } finally {
            setActionPending(null);
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    }

    if (!data) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <GeoEmptyPanel
                    title="Continuous workspace unavailable"
                    description="Continuous trends and recurring jobs could not be loaded."
                />
            </div>
        );
    }

    const statusCounts = data.jobs?.summary?.statusCounts || {
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
    };

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title="Continuous visibility engine"
                subtitle={`Recurring audit and prompt execution for ${client?.client_name || 'this client'}, with durable trends and action prioritization.`}
                action={(
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className="geo-btn geo-btn-ghost"
                            disabled={Boolean(actionPending)}
                            onClick={() => triggerAction(
                                { action: 'capture_snapshot' },
                                'Snapshot captured.',
                                'capture_snapshot'
                            )}
                        >
                            Capture snapshot
                        </button>
                        <button
                            type="button"
                            className="geo-btn geo-btn-pri"
                            disabled={Boolean(actionPending)}
                            onClick={() => triggerAction(
                                { action: 'dispatch_tick', maxJobsToQueue: 20, maxRunsToExecute: 8 },
                                'Manual dispatch tick completed.',
                                'dispatch_tick'
                            )}
                        >
                            Run scheduler tick
                        </button>
                    </div>
                )}
            />

            {actionMessage ? <div className="text-sm text-emerald-300">{actionMessage}</div> : null}
            {actionError ? <div className="text-sm text-red-400">{actionError}</div> : null}

            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                <GeoKpiCard label="Snapshots" value={data.snapshotCoverage?.count ?? 0} hint="Durable daily + run-linked trend points" accent="blue" />
                <GeoKpiCard label="Active jobs" value={data.jobs?.summary?.activeJobs ?? 0} hint="Recurring jobs enabled" accent="emerald" />
                <GeoKpiCard label="Failed jobs" value={data.jobs?.summary?.failedJobs ?? 0} hint="Jobs currently in failed state" accent="amber" />
                <GeoKpiCard label="Pending runs" value={statusCounts.pending} hint="Queued runs waiting to start" accent="amber" />
                <GeoKpiCard label="Running runs" value={statusCounts.running} hint="Runs currently in progress" accent="violet" />
                <GeoKpiCard label="Freshness audit" value={freshnessText(data.freshness?.audit)} hint={`Last audit: ${formatDateTime(data.freshness?.latestAuditAt)}`} />
                <GeoKpiCard label="Freshness runs" value={freshnessText(data.freshness?.runs)} hint={`Last run: ${formatDateTime(data.freshness?.latestRunAt)}`} />
                <GeoKpiCard label="Connector states" value={`${data.connectors?.summary?.configured || 0} configured`} hint="Stub adapters keep contracts stable" />
            </div>

            <GeoPremiumCard className="p-5">
                <div className="flex items-center justify-between gap-2 mb-4">
                    <div>
                        <div className="text-sm font-semibold text-white/95">Trend metrics (7d / 30d / 90d)</div>
                        <p className="text-[11px] text-white/35">
                            Derived from stored visibility snapshots. Deltas are based on observed stored values.
                        </p>
                    </div>
                    <div className="text-[11px] text-white/40">
                        {data.snapshotCoverage?.startDate || '-'} to {data.snapshotCoverage?.endDate || '-'}
                    </div>
                </div>
                {metricRows.length === 0 ? (
                    <GeoEmptyPanel title="No historical snapshots yet" description="Run the scheduler or capture a snapshot to initialize trend history." />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {metricRows.map((metric) => (
                            <div key={metric.key} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                                <div className="text-sm font-semibold text-white/90">{metric.label}</div>
                                <div className="text-2xl font-bold text-white mt-2">{metric.latest ?? '—'}</div>
                                <div className="grid grid-cols-3 gap-2 mt-3 text-[11px]">
                                    <div>
                                        <div className="text-white/35">7d</div>
                                        <div className={deltaClass(metric.windows?.d7?.delta)}>{formatDelta(metric.windows?.d7?.delta)}</div>
                                    </div>
                                    <div>
                                        <div className="text-white/35">30d</div>
                                        <div className={deltaClass(metric.windows?.d30?.delta)}>{formatDelta(metric.windows?.d30?.delta)}</div>
                                    </div>
                                    <div>
                                        <div className="text-white/35">90d</div>
                                        <div className={deltaClass(metric.windows?.d90?.delta)}>{formatDelta(metric.windows?.d90?.delta)}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </GeoPremiumCard>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <GeoPremiumCard className="p-5">
                    <div className="text-sm font-semibold text-white/95 mb-3">Top improving metrics</div>
                    {improving.length === 0 ? (
                        <GeoEmptyPanel title="No positive deltas yet" description="Improving metrics appear here once at least two snapshots exist in the trend window." />
                    ) : (
                        <div className="space-y-3">
                            {improving.map((metric) => (
                                <GeoBarRow
                                    key={metric.key}
                                    label={`${metric.label} (${formatDelta(metric.delta)})`}
                                    value={Math.abs(Number(metric.delta || 0))}
                                    max={improvingMax}
                                    color="bg-emerald-500/80"
                                />
                            ))}
                        </div>
                    )}
                </GeoPremiumCard>

                <GeoPremiumCard className="p-5">
                    <div className="text-sm font-semibold text-white/95 mb-3">Top declining metrics</div>
                    {declining.length === 0 ? (
                        <GeoEmptyPanel title="No negative deltas yet" description="Declining metrics appear here once trend changes are detected." />
                    ) : (
                        <div className="space-y-3">
                            {declining.map((metric) => (
                                <GeoBarRow
                                    key={metric.key}
                                    label={`${metric.label} (${formatDelta(metric.delta)})`}
                                    value={Math.abs(Number(metric.delta || 0))}
                                    max={decliningMax}
                                    color="bg-red-500/80"
                                />
                            ))}
                        </div>
                    )}
                </GeoPremiumCard>
            </div>

            <GeoPremiumCard className="p-5">
                <div className="text-sm font-semibold text-white/95 mb-3">Action center</div>
                {actions.length === 0 ? (
                    <GeoEmptyPanel
                        title="No urgent derived actions"
                        description="Action priorities are generated from trend changes, freshness signals, and stored run coverage."
                    />
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {actions.map((item) => (
                            <div key={item.id} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-sm font-semibold text-white/90">{item.title}</div>
                                    <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${item.priority === 'high' ? 'border-red-400/20 bg-red-400/10 text-red-300' : item.priority === 'medium' ? 'border-amber-400/20 bg-amber-400/10 text-amber-300' : 'border-white/10 bg-white/[0.04] text-white/55'}`}>
                                        {item.priority}
                                    </span>
                                </div>
                                <div className="text-[11px] text-white/45 mt-2">{item.rationale}</div>
                                <div className="text-[10px] text-white/35 mt-2 uppercase tracking-[0.08em]">{item.category}</div>
                            </div>
                        ))}
                    </div>
                )}
            </GeoPremiumCard>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <GeoPremiumCard className="p-0 overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/[0.08] bg-black/25">
                        <div className="text-sm font-semibold text-white/95">Recurring jobs</div>
                        <div className="text-[11px] text-white/35">Schedule, run-now controls, and overlap-safe execution status.</div>
                    </div>
                    {(jobs || []).length === 0 ? (
                        <div className="p-5">
                            <GeoEmptyPanel title="No recurring jobs found" description="Jobs are created automatically for active clients. Trigger a scheduler tick to seed them." />
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.06]">
                            {jobs.map((job) => {
                                const selectedCadence = cadenceDraft[job.id] ?? String(job.cadence_minutes || 1440);
                                return (
                                    <div key={job.id} className="px-5 py-4 space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <div className="text-sm font-semibold text-white/90">{job.job_type}</div>
                                                <div className="text-[11px] text-white/45">
                                                    Next run {formatDateTime(job.next_run_at)} • Last success {formatDateTime(job.last_success_at)}
                                                </div>
                                            </div>
                                            <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${statusPillClass(job.status)}`}>
                                                {job.status}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                className="geo-btn geo-btn-pri"
                                                disabled={Boolean(actionPending)}
                                                onClick={() => triggerAction(
                                                    { action: 'run_now', jobId: job.id },
                                                    `Run queued for ${job.job_type}.`,
                                                    `run_now_${job.id}`
                                                )}
                                            >
                                                Run now
                                            </button>
                                            <button
                                                type="button"
                                                className="geo-btn geo-btn-ghost"
                                                disabled={Boolean(actionPending)}
                                                onClick={() => triggerAction(
                                                    { action: 'toggle_job', jobId: job.id, is_active: !job.is_active },
                                                    job.is_active ? `${job.job_type} disabled.` : `${job.job_type} enabled.`,
                                                    `toggle_${job.id}`
                                                )}
                                            >
                                                {job.is_active ? 'Disable' : 'Enable'}
                                            </button>
                                            <select
                                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white"
                                                value={selectedCadence}
                                                onChange={(event) => setCadenceDraft((current) => ({ ...current, [job.id]: event.target.value }))}
                                                disabled={Boolean(actionPending)}
                                            >
                                                {CADENCE_OPTIONS.map((option) => (
                                                    <option key={option.value} value={String(option.value)} className="bg-[#111111]">
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                className="geo-btn geo-btn-ghost"
                                                disabled={Boolean(actionPending)}
                                                onClick={() => triggerAction(
                                                    {
                                                        action: 'update_cadence',
                                                        jobId: job.id,
                                                        cadence_minutes: Number(selectedCadence),
                                                        retry_limit: job.retry_limit ?? 2,
                                                        retry_backoff_minutes: job.retry_backoff_minutes ?? 30,
                                                    },
                                                    `Cadence updated for ${job.job_type}.`,
                                                    `cadence_${job.id}`
                                                )}
                                            >
                                                Save cadence
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </GeoPremiumCard>

                <GeoPremiumCard className="p-0 overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/[0.08] bg-black/25">
                        <div className="text-sm font-semibold text-white/95">Recent recurring runs</div>
                        <div className="text-[11px] text-white/35">Pending, running, completed, failed, and retry-safe run history.</div>
                    </div>
                    {topRunRows.length === 0 ? (
                        <div className="p-5">
                            <GeoEmptyPanel title="No recurring runs yet" description="Runs will appear here after scheduler dispatch or manual run-now actions." />
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.06] max-h-[620px] overflow-y-auto">
                            {topRunRows.map((run) => (
                                <div key={run.id} className="px-5 py-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-sm font-semibold text-white/90">{run.job_type}</div>
                                        <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${statusPillClass(run.status)}`}>
                                            {run.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] text-white/45">
                                        <div>Scheduled: {formatDateTime(run.scheduled_for)}</div>
                                        <div>Started: {formatDateTime(run.started_at)}</div>
                                        <div>Finished: {formatDateTime(run.finished_at)}</div>
                                        <div>Attempt: {run.attempt_count}/{run.max_attempts}</div>
                                    </div>
                                    {run.error_message ? (
                                        <div className="text-[11px] text-red-300 mt-2">{run.error_message}</div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    )}
                </GeoPremiumCard>
            </div>

            <GeoPremiumCard className="p-5">
                <div className="text-sm font-semibold text-white/95 mb-3">Connector-ready attribution foundation</div>
                <p className="text-[11px] text-white/35 mb-4">
                    Stub adapters are active to keep contracts stable before live OAuth/SDK implementation. Sample mode is explicitly labeled non-production.
                </p>
                {connectors.length === 0 ? (
                    <GeoEmptyPanel title="No connectors initialized" description="Connector rows are seeded automatically with recurring jobs." />
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {connectors.map((connector) => {
                            const providerSnapshot = connectorSnapshots[connector.provider];
                            return (
                                <div key={connector.provider} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-sm font-semibold text-white/90">{connector.provider.toUpperCase()}</div>
                                        <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${connectorStatusClass(connector.status)}`}>
                                            {connector.status}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-white/45 mt-2">
                                        {providerSnapshot?.message || 'No provider message.'}
                                    </div>
                                    <div className="text-[11px] text-white/35 mt-1">
                                        {summarizeConnectorData(providerSnapshot)}
                                    </div>
                                    <div className="text-[11px] text-white/35 mt-1">
                                        Last sync: {formatDateTime(connector.last_synced_at)}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <button
                                            type="button"
                                            className="geo-btn geo-btn-ghost"
                                            disabled={Boolean(actionPending)}
                                            onClick={() => triggerAction(
                                                { action: 'connector_state', provider: connector.provider, status: 'sample_mode' },
                                                `${connector.provider.toUpperCase()} set to sample_mode.`,
                                                `connector_sample_${connector.provider}`
                                            )}
                                        >
                                            Sample mode
                                        </button>
                                        <button
                                            type="button"
                                            className="geo-btn geo-btn-ghost"
                                            disabled={Boolean(actionPending)}
                                            onClick={() => triggerAction(
                                                { action: 'connector_state', provider: connector.provider, status: 'configured' },
                                                `${connector.provider.toUpperCase()} set to configured.`,
                                                `connector_configured_${connector.provider}`
                                            )}
                                        >
                                            Configured
                                        </button>
                                        <button
                                            type="button"
                                            className="geo-btn geo-btn-ghost"
                                            disabled={Boolean(actionPending)}
                                            onClick={() => triggerAction(
                                                { action: 'connector_state', provider: connector.provider, status: 'not_connected' },
                                                `${connector.provider.toUpperCase()} reset to not_connected.`,
                                                `connector_reset_${connector.provider}`
                                            )}
                                        >
                                            Not connected
                                        </button>
                                        <button
                                            type="button"
                                            className="geo-btn geo-btn-ghost"
                                            disabled={Boolean(actionPending)}
                                            onClick={() => triggerAction(
                                                { action: 'connector_state', provider: connector.provider, status: 'disabled' },
                                                `${connector.provider.toUpperCase()} disabled.`,
                                                `connector_disabled_${connector.provider}`
                                            )}
                                        >
                                            Disable
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </GeoPremiumCard>
        </div>
    );
}
