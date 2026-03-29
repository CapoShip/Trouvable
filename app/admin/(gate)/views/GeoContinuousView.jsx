'use client';

import { useState } from 'react';
import Link from 'next/link';

import {
    GeoBarRow,
    GeoEmptyPanel,
    GeoKpiCard,
    GeoPremiumCard,
    GeoSectionTitle,
} from '../components/GeoPremium';
import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import { ADMIN_GEO_LABELS, connectorStatusLabelFr, runStatusLabelFr } from '@/lib/i18n/admin-fr';

const DAILY_CADENCE_OPTIONS = [
    { label: '24h (quotidien)', value: 1440 },
    { label: '48h', value: 2880 },
    { label: '7 jours', value: 10080 },
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
    if (!freshness) return 'inconnue';
    if (freshness.state === 'missing') return 'absence de données';
    if (freshness.state === 'fresh') return `a jour (${freshness.hours}h)`;
    if (freshness.state === 'warning') return `à surveiller (${freshness.hours}h)`;
    return `en retard (${freshness.hours}h)`;
}

function deltaClass(value) {
    if (value == null) return 'text-white/40';
    if (value > 0) return 'text-emerald-300';
    if (value < 0) return 'text-red-300';
    return 'text-white/50';
}

function formatDelta(value) {
    if (value == null) return '-';
    return `${value > 0 ? '+' : ''}${value}`;
}

function connectorStatusClass(status) {
    if (status === 'configured') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
    if (status === 'healthy') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
    if (status === 'syncing') return 'border-blue-400/20 bg-blue-400/10 text-blue-300';
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
    if (!providerSnapshot) return 'Aucune donnée connecteur.';
    if (providerSnapshot.hasRealData === false) {
        return 'Aucune série réelle disponible (mode stub/échantillon).';
    }
    if (providerSnapshot.provider === 'ga4') {
        const traffic = providerSnapshot.trafficTrend?.length || 0;
        const landing = providerSnapshot.landingPages?.length || 0;
        return `${traffic} points trafic - ${landing} pages d'atterrissage`;
    }
    if (providerSnapshot.provider === 'gsc') {
        const queries = providerSnapshot.searchQueryTrend?.length || 0;
        const landing = providerSnapshot.landingPageTrend?.length || 0;
        return `${queries} points requêtes - ${landing} pages d'atterrissage`;
    }
    return 'Aucune donnée connecteur.';
}

function metricMaxAbs(items = []) {
    const values = items
        .map((item) => Math.abs(Number(item?.delta || 0)))
        .filter((value) => Number.isFinite(value));
    return values.length ? Math.max(...values) : 1;
}

function toCadenceValue(minutes, dailyModeEnabled) {
    const numeric = Number(minutes || 0);
    if (!Number.isFinite(numeric) || numeric <= 0) return 1440;
    if (!dailyModeEnabled) return numeric;
    return Math.max(1440, numeric);
}

export default function GeoContinuousView() {
    const { clientId, client, invalidateWorkspace } = useGeoClient();
    const { data, loading, error } = useGeoWorkspaceSlice('continuous');
    const [actionPending, setActionPending] = useState(null);
    const [actionMessage, setActionMessage] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [cadenceDraft, setCadenceDraft] = useState({});

    const jobs = data?.jobs?.jobs || [];
    const metricRows = data?.metrics || [];
    const improving = data?.improving || [];
    const declining = data?.declining || [];
    const actions = data?.actionCenter || [];
    const connectors = data?.connectors?.connections || [];
    const connectorSnapshots = data?.connectors?.providers || {};
    const dailyModeEnabled = data?.dailyMode?.enabled !== false;

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
                    title="Suivi quotidien indisponible"
                    description="Les tendances et tâches récurrentes ne sont pas disponibles pour le moment."
                />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title={ADMIN_GEO_LABELS.nav.continuous}
                subtitle={`Suivi quotidien pour ${client?.client_name || 'ce client'}: jobs récurrents, snapshots et priorités operateur.`}
                action={(
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            className="geo-btn geo-btn-ghost"
                            disabled={Boolean(actionPending)}
                            onClick={() => triggerAction(
                                { action: 'capture_snapshot' },
                                'Instantané capture.',
                                'capture_snapshot'
                            )}
                        >
                            {ADMIN_GEO_LABELS.actions.captureSnapshot}
                        </button>
                        <button
                            type="button"
                            className="geo-btn geo-btn-pri"
                            disabled={Boolean(actionPending)}
                            onClick={() => triggerAction(
                                { action: 'dispatch_tick', maxJobsToQueue: 20 },
                                'Dispatch exécuté: runs planifiés/enqueue.',
                                'dispatch_tick'
                            )}
                        >
                            {ADMIN_GEO_LABELS.actions.schedulerTick}
                        </button>
                        <button
                            type="button"
                            className="geo-btn geo-btn-ghost"
                            disabled={Boolean(actionPending)}
                            onClick={() => triggerAction(
                                { action: 'worker_tick', maxRunsToExecute: 8 },
                                'Worker exécuté: runs lourds traités.',
                                'worker_tick'
                            )}
                        >
                            Exécuter worker
                        </button>
                    </div>
                )}
            />

            <GeoPremiumCard className="p-4">
                <div className="text-sm font-semibold text-white/90">{ADMIN_GEO_LABELS.sections.dailyModeTitle}</div>
                <p className="text-[12px] text-white/45 mt-1">{ADMIN_GEO_LABELS.sections.dailyModeHint}</p>
                <div className="text-[11px] text-white/35 mt-2">
                    Mode actif: <span className="text-white/75">{data?.dailyMode?.label || 'quotidien_hobby'}</span>
                </div>
            </GeoPremiumCard>

            {actionMessage ? <div className="text-sm text-emerald-300">{actionMessage}</div> : null}
            {actionError ? <div className="text-sm text-red-400">{actionError}</div> : null}

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                <GeoKpiCard label="Instantanes" value={data.snapshotCoverage?.count ?? 0} hint="Historique quotidien" accent="blue" />
                <GeoKpiCard label={ADMIN_GEO_LABELS.status.activeJobs} value={data.jobs?.summary?.activeJobs ?? 0} hint="Jobs récurrents actifs" accent="emerald" />
                <GeoKpiCard label={ADMIN_GEO_LABELS.status.failedJobs} value={data.jobs?.summary?.failedJobs ?? 0} hint="Jobs en échec" accent="amber" />
                <GeoKpiCard label="Fraicheur audit" value={freshnessText(data.freshness?.audit)} hint={`${ADMIN_GEO_LABELS.status.latestExécution}: ${formatDateTime(data.freshness?.latestAuditAt)}`} />
                <GeoKpiCard label="Fraicheur exécutions" value={freshnessText(data.freshness?.runs)} hint={`${ADMIN_GEO_LABELS.status.latestExécution}: ${formatDateTime(data.freshness?.latestRunAt)}`} />
                <GeoKpiCard label={ADMIN_GEO_LABELS.nav.connectors} value={`${(data.connectors?.summary?.configured || 0) + (data.connectors?.summary?.healthy || 0)} actifs`} hint="Connecteurs configurés ou synchronisés" />
            </div>

            <GeoPremiumCard className="p-5">
                <div className="flex items-center justify-between gap-2 mb-4">
                    <div>
                        <div className="text-sm font-semibold text-white/95">Tendances (7j / 30j / 90j)</div>
                        <p className="text-[11px] text-white/35">
                            Dérivé des instantanés stockés. Les deltas reposent uniquement sur les données observées.
                        </p>
                    </div>
                    <div className="text-[11px] text-white/40">
                        {data.snapshotCoverage?.startDate || '-'} a {data.snapshotCoverage?.endDate || '-'}
                    </div>
                </div>
                {metricRows.length === 0 ? (
                    <GeoEmptyPanel title="Aucun historique d'instantanés" description="Lancez un cycle quotidien ou capturez un instantane pour initialiser les tendances." />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {metricRows.map((metric) => (
                            <div key={metric.key} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                                <div className="text-sm font-semibold text-white/90">{metric.label}</div>
                                <div className="text-2xl font-bold text-white mt-2">{metric.latest ?? '-'}</div>
                                <div className="grid grid-cols-3 gap-2 mt-3 text-[11px]">
                                    <div>
                                        <div className="text-white/35">7j</div>
                                        <div className={deltaClass(metric.windows?.d7?.delta)}>{formatDelta(metric.windows?.d7?.delta)}</div>
                                    </div>
                                    <div>
                                        <div className="text-white/35">30j</div>
                                        <div className={deltaClass(metric.windows?.d30?.delta)}>{formatDelta(metric.windows?.d30?.delta)}</div>
                                    </div>
                                    <div>
                                        <div className="text-white/35">90j</div>
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
                    <div className="text-sm font-semibold text-white/95 mb-3">Indicateurs en progression</div>
                    {improving.length === 0 ? (
                        <GeoEmptyPanel title="Aucune progression marquee" description="Les indicateurs en hausse apparaitront apres accumulation d'instantanés." />
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
                    <div className="text-sm font-semibold text-white/95 mb-3">Indicateurs en recul</div>
                    {declining.length === 0 ? (
                        <GeoEmptyPanel title="Aucun recul détecté" description="Les reculs seront signales des qu'une variation negative apparait." />
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

            {actions.length > 0 && clientId && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-3">
                    <span className="text-sm text-white/70">{actions.length} action(s) en file</span>
                    <Link
                        href={`/admin/clients/${clientId}/opportunities`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-300 hover:text-blue-200 transition-colors"
                    >
                        Voir le centre d'actions &rarr;
                    </Link>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <GeoPremiumCard className="p-0 overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/[0.08] bg-black/25">
                        <div className="text-sm font-semibold text-white/95">Jobs récurrents</div>
                        <div className="text-[11px] text-white/35">Planification quotidienne, controle run-now et etats d'exécution.</div>
                    </div>
                    {(jobs || []).length === 0 ? (
                        <div className="p-5">
                            <GeoEmptyPanel title="Aucun job recurrent" description="Les jobs sont créés automatiquement pour les clients actifs." />
                        </div>
                    ) : (
                        <div className="divide-y divide-white/[0.06]">
                            {jobs.map((job) => {
                                const effectiveCadence = toCadenceValue(cadenceDraft[job.id] ?? job.cadence_minutes ?? 1440, dailyModeEnabled);
                                const selectedCadence = String(effectiveCadence);
                                return (
                                    <div key={job.id} className="px-5 py-4 space-y-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <div className="text-sm font-semibold text-white/90">{job.job_type}</div>
                                                <div className="text-[11px] text-white/45">
                                                    {ADMIN_GEO_LABELS.status.nextRefresh}: {formatDateTime(job.next_run_at)} - {ADMIN_GEO_LABELS.status.latestExécution}: {formatDateTime(job.last_success_at)}
                                                </div>
                                            </div>
                                            <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${statusPillClass(job.status)}`}>
                                                {runStatusLabelFr(job.status)}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                type="button"
                                                className="geo-btn geo-btn-pri"
                                                disabled={Boolean(actionPending)}
                                                onClick={() => triggerAction(
                                                    { action: 'run_now', jobId: job.id },
                                                    `Exécution ajoutee pour ${job.job_type}.`,
                                                    `run_now_${job.id}`
                                                )}
                                            >
                                                {ADMIN_GEO_LABELS.actions.runNow}
                                            </button>
                                            <button
                                                type="button"
                                                className="geo-btn geo-btn-ghost"
                                                disabled={Boolean(actionPending)}
                                                onClick={() => triggerAction(
                                                    { action: 'toggle_job', jobId: job.id, is_active: !job.is_active },
                                                    job.is_active ? `${job.job_type} desactive.` : `${job.job_type} active.`,
                                                    `toggle_${job.id}`
                                                )}
                                            >
                                                {job.is_active ? 'Desactiver' : 'Activer'}
                                            </button>
                                            <select
                                                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white"
                                                value={selectedCadence}
                                                onChange={(event) => setCadenceDraft((current) => ({ ...current, [job.id]: Number(event.target.value) }))}
                                                disabled={Boolean(actionPending)}
                                            >
                                                {DAILY_CADENCE_OPTIONS.map((option) => (
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
                                                    `Cadence enregistree pour ${job.job_type}.`,
                                                    `cadence_${job.id}`
                                                )}
                                            >
                                                Enregistrer la cadence
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </GeoPremiumCard>

                <GeoPremiumCard className="p-5 flex flex-col items-center justify-center text-center min-h-[180px]">
                    <div className="text-sm font-semibold text-white/95 mb-2">Historique des runs</div>
                    <p className="text-[11px] text-white/40 mb-4">Consultez le journal complet des runs planifiees et manuelles.</p>
                    {clientId && (
                        <Link
                            href={`/admin/clients/${clientId}/runs`}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-300 hover:text-blue-200 transition-colors"
                        >
                            Voir les runs &rarr;
                        </Link>
                    )}
                </GeoPremiumCard>
            </div>

            <GeoPremiumCard className="p-5">
                <div className="text-sm font-semibold text-white/95 mb-3">Connecteurs</div>
                <p className="text-[11px] text-white/35 mb-4">
                    État des connecteurs et dernière synchronisation. Les connecteurs actifs récupèrent des données réelles via les APIs configurées.
                </p>
                {connectors.length === 0 ? (
                    <GeoEmptyPanel title="Aucun connecteur initialise" description="Les lignes connecteurs sont créées automatiquement avec les jobs récurrents." />
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {connectors.map((connector) => {
                            const providerSnapshot = connectorSnapshots[connector.provider];
                            return (
                                <div key={connector.provider} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-sm font-semibold text-white/90">{connector.provider.toUpperCase()}</div>
                                        <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${connectorStatusClass(connector.status)}`}>
                                            {connectorStatusLabelFr(connector.status)}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-white/45 mt-2">
                                        {providerSnapshot?.message || 'Aucun message fournisseur.'}
                                    </div>
                                    <div className="text-[11px] text-white/35 mt-1">
                                        {summarizeConnectorData(providerSnapshot)}
                                    </div>
                                    <div className="text-[11px] text-white/35 mt-1">
                                        Données réelles: {providerSnapshot?.hasRealData ? 'oui' : 'non'}
                                    </div>
                                    <div className="text-[11px] text-white/35 mt-1">
                                        Dernière synchro: {formatDateTime(connector.last_synced_at)}
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <button
                                            type="button"
                                            className="geo-btn geo-btn-ghost"
                                            disabled={Boolean(actionPending)}
                                            onClick={() => triggerAction(
                                                { action: 'connector_state', provider: connector.provider, status: 'sample_mode' },
                                                `${connector.provider.toUpperCase()} passe en mode echantillon.`,
                                                `connector_sample_${connector.provider}`
                                            )}
                                        >
                                            {ADMIN_GEO_LABELS.status.sampleMode}
                                        </button>
                                        <button
                                            type="button"
                                            className="geo-btn geo-btn-ghost"
                                            disabled={Boolean(actionPending)}
                                            onClick={() => triggerAction(
                                                { action: 'connector_state', provider: connector.provider, status: 'configured' },
                                                `${connector.provider.toUpperCase()} configure.`,
                                                `connector_configured_${connector.provider}`
                                            )}
                                        >
                                            {ADMIN_GEO_LABELS.status.configured}
                                        </button>
                                        <button
                                            type="button"
                                            className="geo-btn geo-btn-ghost"
                                            disabled={Boolean(actionPending)}
                                            onClick={() => triggerAction(
                                                { action: 'connector_state', provider: connector.provider, status: 'not_connected' },
                                                `${connector.provider.toUpperCase()} repasse en non connecte.`,
                                                `connector_reset_${connector.provider}`
                                            )}
                                        >
                                            {ADMIN_GEO_LABELS.status.notConnected}
                                        </button>
                                        <button
                                            type="button"
                                            className="geo-btn geo-btn-ghost"
                                            disabled={Boolean(actionPending)}
                                            onClick={() => triggerAction(
                                                { action: 'connector_state', provider: connector.provider, status: 'disabled' },
                                                `${connector.provider.toUpperCase()} desactive.`,
                                                `connector_disabled_${connector.provider}`
                                            )}
                                        >
                                            {ADMIN_GEO_LABELS.status.disabled}
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
