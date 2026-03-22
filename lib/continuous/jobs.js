
import 'server-only';

import * as db from '@/lib/db';
import { DEFAULT_RECURRING_JOB_CONFIG } from '@/lib/continuous/constants';
import { buildMetricTrendSummary, classifyFreshness, splitImprovingDeclining } from '@/lib/continuous/metrics';
import { enforceDailyCadenceMinutes, getContinuousModeLabelFr, isDailyFirstMode } from '@/lib/continuous/mode';
import { cronDispatchOptionsSchema } from '@/lib/continuous/schemas';
import { getConnectorOverviewForClient } from '@/lib/connectors';
import { runFullAudit } from '@/lib/audit/run-audit';
import { runTrackedQueriesForClient } from '@/lib/queries/run-tracked-queries';
import { getAdminSupabase } from '@/lib/supabase-admin';

function nowIso() {
    return new Date().toISOString();
}

function addMinutes(iso, minutes) {
    const base = iso ? new Date(iso) : new Date();
    return new Date(base.getTime() + (minutes * 60 * 1000)).toISOString();
}

function startOfTodayDateString() {
    return new Date().toISOString().slice(0, 10);
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function getEffectiveCadenceMinutes(rawCadenceMinutes) {
    return clamp(enforceDailyCadenceMinutes(rawCadenceMinutes || 1440), 15, 10080);
}

function toMetricSnapshotPayload(metrics, { clientId, source = 'system', sourceJobRunId = null, metadata = {} }) {
    return {
        client_id: clientId,
        source,
        source_job_run_id: sourceJobRunId,
        snapshot_date: startOfTodayDateString(),
        captured_at: nowIso(),
        seo_score: metrics?.seoScore ?? null,
        geo_score: metrics?.geoScore ?? null,
        visibility_proxy_percent: metrics?.visibilityProxyPercent ?? null,
        mention_rate_percent: metrics?.trackedPromptStats?.mentionRatePercent ?? null,
        citation_coverage_percent: metrics?.citationCoveragePercent ?? null,
        competitor_visibility_count: Number(metrics?.competitorMentions || 0),
        freshness_audit_at: metrics?.lastAuditAt ?? null,
        freshness_run_at: metrics?.lastGeoRunAt ?? null,
        metadata,
    };
}

export async function ensureDefaultRecurringJobs(clientId) {
    const supabase = getAdminSupabase();

    const rows = Object.entries(DEFAULT_RECURRING_JOB_CONFIG).map(([jobType, config], index) => ({
        client_id: clientId,
        job_type: jobType,
        cadence_minutes: getEffectiveCadenceMinutes(config.cadence_minutes),
        retry_limit: config.retry_limit,
        retry_backoff_minutes: config.retry_backoff_minutes,
        status: 'pending',
        is_active: true,
        next_run_at: addMinutes(nowIso(), 5 + (index * 10)),
        metadata: {
            seeded_by: 'continuous_visibility_engine',
            default_seed: true,
            mode: getContinuousModeLabelFr(),
        },
    }));

    const { error } = await supabase
        .from('recurring_jobs')
        .upsert(rows, { onConflict: 'client_id,job_type', ignoreDuplicates: true });

    if (error) {
        throw new Error(`[Continuous] ensureDefaultRecurringJobs ${clientId}: ${error.message}`);
    }
}

export async function ensureDefaultRecurringJobsForAllClients() {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
        .from('client_geo_profiles')
        .select('id')
        .is('archived_at', null)
        .order('updated_at', { ascending: false });

    if (error) {
        throw new Error(`[Continuous] ensureDefaultRecurringJobsForAllClients: ${error.message}`);
    }

    const clientIds = (data || []).map((row) => row.id).filter(Boolean);
    for (const clientId of clientIds) {
        await ensureDefaultRecurringJobs(clientId);
    }

    return clientIds.length;
}

export async function upsertVisibilitySnapshotForClient({
    clientId,
    source = 'system',
    sourceJobRunId = null,
    metadata = {},
}) {
    const supabase = getAdminSupabase();
    const metrics = await db.getClientGeoMetrics(clientId);
    const payload = toMetricSnapshotPayload(metrics, {
        clientId,
        source,
        sourceJobRunId,
        metadata,
    });

    const { data, error } = await supabase
        .from('visibility_metric_snapshots')
        .upsert(payload, { onConflict: 'client_id,snapshot_date' })
        .select('*')
        .single();

    if (error) {
        throw new Error(`[Continuous] upsertVisibilitySnapshotForClient ${clientId}: ${error.message}`);
    }

    return data;
}

export async function captureDailySnapshotsForAllClients() {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
        .from('client_geo_profiles')
        .select('id')
        .is('archived_at', null)
        .order('updated_at', { ascending: false });

    if (error) {
        throw new Error(`[Continuous] captureDailySnapshotsForAllClients: ${error.message}`);
    }

    let captured = 0;
    for (const row of data || []) {
        try {
            await upsertVisibilitySnapshotForClient({
                clientId: row.id,
                source: 'cron',
                metadata: { reason: 'daily_snapshot' },
            });
            captured += 1;
        } catch (snapshotError) {
            console.error(`[Continuous] snapshot failed for client ${row.id}:`, snapshotError.message);
        }
    }

    return { captured, total: (data || []).length };
}
async function queueDueJobs({ maxJobsToQueue, source }) {
    const supabase = getAdminSupabase();
    const now = nowIso();

    const { data: jobs, error: jobsError } = await supabase
        .from('recurring_jobs')
        .select('*')
        .eq('is_active', true)
        .neq('status', 'cancelled')
        .lte('next_run_at', now)
        .order('next_run_at', { ascending: true })
        .limit(maxJobsToQueue);

    if (jobsError) {
        throw new Error(`[Continuous] queueDueJobs list: ${jobsError.message}`);
    }

    let queued = 0;
    let skipped = 0;

    for (const job of jobs || []) {
        const { count: existingQueuedOrRunning, error: existingError } = await supabase
            .from('recurring_job_runs')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id)
            .in('status', ['pending', 'running']);

        if (existingError) {
            throw new Error(`[Continuous] queueDueJobs existing check: ${existingError.message}`);
        }

        if ((existingQueuedOrRunning || 0) > 0) {
            skipped += 1;
            continue;
        }

        const scheduledFor = job.next_run_at || now;
        const dedupeKey = `${job.id}:${String(scheduledFor).slice(0, 16)}`;

        const runInsertPayload = {
            job_id: job.id,
            client_id: job.client_id,
            job_type: job.job_type,
            trigger_source: source,
            status: 'pending',
            attempt_count: 0,
            max_attempts: clamp((job.retry_limit ?? 2) + 1, 1, 20),
            scheduled_for: scheduledFor,
            dedupe_key: dedupeKey,
            run_context: {
                queued_by: 'cron_dispatch',
                queued_at: now,
            },
            result_summary: {},
        };

        const { error: insertError } = await supabase
            .from('recurring_job_runs')
            .insert(runInsertPayload);

        if (insertError) {
            const alreadyQueued = insertError.code === '23505';
            if (alreadyQueued) {
                skipped += 1;
                continue;
            }
            throw new Error(`[Continuous] queueDueJobs insert run: ${insertError.message}`);
        }

        await supabase
            .from('recurring_jobs')
            .update({
                status: 'pending',
                updated_at: now,
            })
            .eq('id', job.id);

        queued += 1;
    }

    return {
        dueJobs: (jobs || []).length,
        queued,
        skipped,
    };
}

async function recoverStaleRunningRuns() {
    const supabase = getAdminSupabase();
    const staleBefore = addMinutes(nowIso(), -45);

    const { data: staleRuns, error: staleError } = await supabase
        .from('recurring_job_runs')
        .select('*')
        .eq('status', 'running')
        .lte('started_at', staleBefore)
        .order('started_at', { ascending: true })
        .limit(40);

    if (staleError) {
        throw new Error(`[Continuous] recoverStaleRunningRuns list: ${staleError.message}`);
    }

    if (!staleRuns || staleRuns.length === 0) {
        return { recovered: 0, failed: 0 };
    }

    const jobIds = [...new Set(staleRuns.map((row) => row.job_id).filter(Boolean))];
    const { data: jobRows, error: jobsError } = await supabase
        .from('recurring_jobs')
        .select('*')
        .in('id', jobIds);

    if (jobsError) {
        throw new Error(`[Continuous] recoverStaleRunningRuns jobs: ${jobsError.message}`);
    }

    const jobsById = new Map((jobRows || []).map((row) => [row.id, row]));

    let recovered = 0;
    let failed = 0;

    for (const run of staleRuns) {
        const job = jobsById.get(run.job_id);
        const backoff = clamp(Number(job?.retry_backoff_minutes || 30), 5, 1440);
        const shouldRetry = Number(run.attempt_count || 0) < Number(run.max_attempts || 1);

        if (shouldRetry) {
            const { error: resetError } = await supabase
                .from('recurring_job_runs')
                .update({
                    status: 'pending',
                    scheduled_for: addMinutes(nowIso(), backoff),
                    error_message: 'Recovered stale running run after timeout. Retry queued automatically.',
                    started_at: null,
                })
                .eq('id', run.id)
                .eq('status', 'running');

            if (!resetError) {
                recovered += 1;
                await supabase
                    .from('recurring_jobs')
                    .update({
                        status: 'pending',
                        last_failure_at: nowIso(),
                        next_run_at: addMinutes(nowIso(), backoff),
                    })
                    .eq('id', run.job_id);
            }
            continue;
        }

        const { error: failError } = await supabase
            .from('recurring_job_runs')
            .update({
                status: 'failed',
                finished_at: nowIso(),
                error_message: 'Run timed out and exceeded retry budget.',
            })
            .eq('id', run.id)
            .eq('status', 'running');

        if (!failError) {
            failed += 1;
            await supabase
                .from('recurring_jobs')
                    .update({
                        status: 'failed',
                        last_failure_at: nowIso(),
                        last_run_at: nowIso(),
                        next_run_at: addMinutes(nowIso(), getEffectiveCadenceMinutes(job?.cadence_minutes || 1440)),
                    })
                    .eq('id', run.job_id);
        }
    }

    return { recovered, failed };
}

async function listRunnablePendingRuns(limit = 8) {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
        .from('recurring_job_runs')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', nowIso())
        .order('scheduled_for', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(limit);

    if (error) {
        throw new Error(`[Continuous] listRunnablePendingRuns: ${error.message}`);
    }

    return data || [];
}
async function markJobRunning(job, lockToken) {
    const supabase = getAdminSupabase();
    const lockMinutes = 25;

    const { error } = await supabase
        .from('recurring_jobs')
        .update({
            status: 'running',
            lock_token: lockToken,
            locked_until: addMinutes(nowIso(), lockMinutes),
        })
        .eq('id', job.id)
        .eq('is_active', true);

    if (error) {
        throw new Error(`[Continuous] markJobRunning ${job.id}: ${error.message}`);
    }
}

async function releaseJobLock({ job, status, nextRunAt, failureAt = null, successAt = null }) {
    const supabase = getAdminSupabase();
    const payload = {
        status,
        lock_token: null,
        locked_until: null,
        last_run_at: nowIso(),
        next_run_at: nextRunAt,
    };

    if (failureAt) payload.last_failure_at = failureAt;
    if (successAt) payload.last_success_at = successAt;

    const { error } = await supabase
        .from('recurring_jobs')
        .update(payload)
        .eq('id', job.id);

    if (error) {
        throw new Error(`[Continuous] releaseJobLock ${job.id}: ${error.message}`);
    }
}

async function claimRun(run) {
    const supabase = getAdminSupabase();

    const { count: otherRunningCount, error: overlapError } = await supabase
        .from('recurring_job_runs')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', run.client_id)
        .eq('job_type', run.job_type)
        .eq('status', 'running')
        .neq('id', run.id);

    if (overlapError) {
        throw new Error(`[Continuous] claimRun overlap check: ${overlapError.message}`);
    }

    if ((otherRunningCount || 0) > 0) {
        await supabase
            .from('recurring_job_runs')
            .update({
                scheduled_for: addMinutes(nowIso(), 5),
                error_message: 'Deferred to prevent overlap for same client/job_type.',
            })
            .eq('id', run.id)
            .eq('status', 'pending');
        return { claimed: false, reason: 'overlap' };
    }

    const nextAttempt = Number(run.attempt_count || 0) + 1;

    const { data, error } = await supabase
        .from('recurring_job_runs')
        .update({
            status: 'running',
            attempt_count: nextAttempt,
            started_at: nowIso(),
            error_message: null,
        })
        .eq('id', run.id)
        .eq('status', 'pending')
        .select('*')
        .maybeSingle();

    if (error) {
        throw new Error(`[Continuous] claimRun ${run.id}: ${error.message}`);
    }

    if (!data) {
        return { claimed: false, reason: 'already_claimed' };
    }

    return { claimed: true, run: data };
}

async function executeAuditRefresh(jobRun) {
    const client = await db.getClientById(jobRun.client_id);
    if (!client?.website_url) {
        return {
            success: false,
            error: 'Client website URL is missing for scheduled audit refresh.',
            summary: {
                audit_id: null,
                seo_score: null,
                geo_score: null,
            },
        };
    }

    const result = await runFullAudit(client.id, client.website_url);

    return {
        success: result.success === true,
        error: result.success === true ? null : (result.error || 'Audit refresh failed'),
        summary: {
            audit_id: result.auditId || null,
            seo_score: result.seo_score ?? null,
            geo_score: result.geo_score ?? null,
            opportunities_count: result.opportunitiesCount ?? null,
            merge_suggestions_count: result.mergeSuggestionsCount ?? null,
        },
    };
}

async function executePromptRerun(jobRun) {
    const result = await runTrackedQueriesForClient({
        clientId: jobRun.client_id,
        trackedQueryId: null,
        performedBy: 'system@cron',
        actionTypeOverride: 'geo_queries_run_scheduled',
    });

    const successful = (result.runs || []).filter((run) => !run.error).length;
    const failed = (result.runs || []).filter((run) => run.error).length;

    if ((result.totalQueries || 0) === 0) {
        return {
            success: false,
            error: result.message || 'No active tracked prompts are available.',
            summary: {
                total_queries: 0,
                successful: 0,
                failed: 0,
            },
        };
    }

    return {
        success: failed === 0,
        error: failed === 0 ? null : `Prompt rerun completed with ${failed} failed query(ies).`,
        summary: {
            total_queries: result.totalQueries || 0,
            successful,
            failed,
        },
    };
}

async function executeRunByType(run) {
    if (run.job_type === 'audit_refresh') {
        return executeAuditRefresh(run);
    }
    if (run.job_type === 'prompt_rerun') {
        return executePromptRerun(run);
    }
    return {
        success: false,
        error: `Unsupported job type: ${run.job_type}`,
        summary: {},
    };
}
async function finalizeRunSuccess({ run, job, summary }) {
    const supabase = getAdminSupabase();
    const now = nowIso();

    const { error: runUpdateError } = await supabase
        .from('recurring_job_runs')
        .update({
            status: 'completed',
            finished_at: now,
            error_message: null,
            result_summary: summary || {},
        })
        .eq('id', run.id)
        .eq('status', 'running');

    if (runUpdateError) {
        throw new Error(`[Continuous] finalizeRunSuccess run ${run.id}: ${runUpdateError.message}`);
    }

    const nextRunAt = addMinutes(now, getEffectiveCadenceMinutes(job.cadence_minutes || 1440));
    await releaseJobLock({
        job,
        status: 'completed',
        nextRunAt,
        successAt: now,
    });

    await upsertVisibilitySnapshotForClient({
        clientId: run.client_id,
        source: 'cron',
        sourceJobRunId: run.id,
        metadata: {
            reason: 'job_success',
            job_type: run.job_type,
            run_id: run.id,
        },
    });
}

async function finalizeRunFailure({ run, job, errorMessage, summary }) {
    const supabase = getAdminSupabase();
    const now = nowIso();
    const backoffMinutes = clamp(Number(job.retry_backoff_minutes || 30), 5, 1440);

    const hasRetryBudget = Number(run.attempt_count || 0) < Number(run.max_attempts || 1);

    if (hasRetryBudget) {
        const nextAttemptAt = addMinutes(now, backoffMinutes);
        const { error: retryUpdateError } = await supabase
            .from('recurring_job_runs')
            .update({
                status: 'pending',
                scheduled_for: nextAttemptAt,
                started_at: null,
                error_message: errorMessage,
                result_summary: summary || {},
            })
            .eq('id', run.id)
            .eq('status', 'running');

        if (retryUpdateError) {
            throw new Error(`[Continuous] finalizeRunFailure retry ${run.id}: ${retryUpdateError.message}`);
        }

        await releaseJobLock({
            job,
            status: 'pending',
            nextRunAt: nextAttemptAt,
            failureAt: now,
        });

        return { retried: true };
    }

    const { error: failUpdateError } = await supabase
        .from('recurring_job_runs')
        .update({
            status: 'failed',
            finished_at: now,
            error_message: errorMessage,
            result_summary: summary || {},
        })
        .eq('id', run.id)
        .eq('status', 'running');

    if (failUpdateError) {
        throw new Error(`[Continuous] finalizeRunFailure final ${run.id}: ${failUpdateError.message}`);
    }

    const nextRunAt = addMinutes(now, getEffectiveCadenceMinutes(job.cadence_minutes || 1440));
    await releaseJobLock({
        job,
        status: 'failed',
        nextRunAt,
        failureAt: now,
    });

    return { retried: false };
}

export async function queueRecurringRunNow(jobId, triggerSource = 'manual') {
    const supabase = getAdminSupabase();
    const { data: job, error: jobError } = await supabase
        .from('recurring_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

    if (jobError || !job) {
        throw new Error(`[Continuous] queueRecurringRunNow job lookup: ${jobError?.message || 'job not found'}`);
    }

    if (job.is_active !== true) {
        throw new Error('Job is inactive. Reactivate it before running now.');
    }

    const dedupeKey = `${job.id}:manual:${String(nowIso()).slice(0, 16)}`;
    const payload = {
        job_id: job.id,
        client_id: job.client_id,
        job_type: job.job_type,
        trigger_source: triggerSource,
        status: 'pending',
        attempt_count: 0,
        max_attempts: clamp((job.retry_limit ?? 2) + 1, 1, 20),
        scheduled_for: nowIso(),
        dedupe_key: dedupeKey,
        run_context: {
            queued_by: 'manual',
        },
        result_summary: {},
    };

    const { data, error } = await supabase
        .from('recurring_job_runs')
        .insert(payload)
        .select('*')
        .single();

    if (error) {
        throw new Error(`[Continuous] queueRecurringRunNow insert: ${error.message}`);
    }

    await supabase
        .from('recurring_jobs')
        .update({
            status: 'pending',
            next_run_at: nowIso(),
        })
        .eq('id', job.id);

    return data;
}

export async function setRecurringJobActive(jobId, isActive) {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
        .from('recurring_jobs')
        .update({
            is_active: isActive,
            status: isActive ? 'pending' : 'cancelled',
            next_run_at: isActive ? nowIso() : addMinutes(nowIso(), 525600),
        })
        .eq('id', jobId)
        .select('*')
        .single();

    if (error) {
        throw new Error(`[Continuous] setRecurringJobActive: ${error.message}`);
    }

    return data;
}

export async function updateRecurringJobCadence({ jobId, cadenceMinutes, retryLimit, retryBackoffMinutes }) {
    const supabase = getAdminSupabase();
    const effectiveCadence = getEffectiveCadenceMinutes(cadenceMinutes);
    const payload = {
        cadence_minutes: effectiveCadence,
        ...(retryLimit != null ? { retry_limit: clamp(Number(retryLimit), 0, 10) } : {}),
        ...(retryBackoffMinutes != null ? { retry_backoff_minutes: clamp(Number(retryBackoffMinutes), 5, 1440) } : {}),
        next_run_at: nowIso(),
        status: 'pending',
    };

    const { data, error } = await supabase
        .from('recurring_jobs')
        .update(payload)
        .eq('id', jobId)
        .select('*')
        .single();

    if (error) {
        throw new Error(`[Continuous] updateRecurringJobCadence: ${error.message}`);
    }

    return data;
}

export async function getRecurringJobHealthSlice(clientId) {
    const supabase = getAdminSupabase();

    await ensureDefaultRecurringJobs(clientId);

    const [{ data: jobs, error: jobsError }, { data: runs, error: runsError }] = await Promise.all([
        supabase
            .from('recurring_jobs')
            .select('*')
            .eq('client_id', clientId)
            .order('job_type', { ascending: true }),
        supabase
            .from('recurring_job_runs')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })
            .limit(40),
    ]);

    if (jobsError) {
        throw new Error(`[Continuous] getRecurringJobHealthSlice jobs: ${jobsError.message}`);
    }
    if (runsError) {
        throw new Error(`[Continuous] getRecurringJobHealthSlice runs: ${runsError.message}`);
    }

    const statusCounts = {
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
    };

    for (const row of runs || []) {
        if (Object.prototype.hasOwnProperty.call(statusCounts, row.status)) {
            statusCounts[row.status] += 1;
        }
    }

    return {
        jobs: jobs || [],
        runs: runs || [],
        summary: {
            totalJobs: (jobs || []).length,
            activeJobs: (jobs || []).filter((job) => job.is_active === true).length,
            failedJobs: (jobs || []).filter((job) => job.status === 'failed').length,
            statusCounts,
        },
    };
}
export async function getTrendSlice(clientId) {
    const supabase = getAdminSupabase();

    const [metrics, jobHealth, snapshotsResult, connectors] = await Promise.all([
        db.getClientGeoMetrics(clientId),
        getRecurringJobHealthSlice(clientId),
        supabase
            .from('visibility_metric_snapshots')
            .select('*')
            .eq('client_id', clientId)
            .order('snapshot_date', { ascending: true })
            .limit(120),
        getConnectorOverviewForClient(clientId),
    ]);

    if (snapshotsResult.error) {
        throw new Error(`[Continuous] getTrendSlice snapshots: ${snapshotsResult.error.message}`);
    }

    const snapshots = snapshotsResult.data || [];

    const metricDefinitions = [
        { key: 'seo_score', label: 'Score SEO' },
        { key: 'geo_score', label: 'Score GEO' },
        { key: 'visibility_proxy_percent', label: 'Visibilite IA' },
        { key: 'mention_rate_percent', label: 'Taux de mention des prompts' },
        { key: 'citation_coverage_percent', label: 'Couverture des citations' },
        { key: 'competitor_visibility_count', label: 'Visibilite des concurrents' },
    ];

    const metricRows = metricDefinitions.map((metric) => {
        const d7 = buildMetricTrendSummary({ snapshots, metricKey: metric.key, days: 7 });
        const d30 = buildMetricTrendSummary({ snapshots, metricKey: metric.key, days: 30 });
        const d90 = buildMetricTrendSummary({ snapshots, metricKey: metric.key, days: 90 });

        return {
            key: metric.key,
            label: metric.label,
            ...d30,
            windows: {
                d7,
                d30,
                d90,
            },
        };
    });

    const board = splitImprovingDeclining(metricRows);

    const dailyFirst = isDailyFirstMode();
    const auditFreshness = classifyFreshness(metrics?.lastAuditAt, dailyFirst ? 96 : 72);
    const runFreshness = classifyFreshness(metrics?.lastGeoRunAt, dailyFirst ? 72 : 48);

    const actionCenter = [];

    for (const metric of board.declining) {
        if (metric.key === 'seo_score' || metric.key === 'geo_score') {
            actionCenter.push({
                id: `score_drop_${metric.key}`,
                category: 'profile_fixes',
                priority: 'high',
                title: `${metric.label} en baisse (${metric.delta})`,
                rationale: 'La tendance recente signale un recul. Relancez un audit et priorisez les corrections en attente.',
                evidence: 'derived_from_snapshots',
            });
        }

        if (metric.key === 'citation_coverage_percent') {
            actionCenter.push({
                id: 'citation_gap',
                category: 'citation_source_opportunities',
                priority: 'high',
                title: 'Couverture des citations en recul',
                rationale: 'La couverture des sources observees baisse. Renforcez les prompts qui generent des citations fiables.',
                evidence: 'derived_from_snapshots',
            });
        }

        if (metric.key === 'mention_rate_percent') {
            actionCenter.push({
                id: 'prompt_coverage_gap',
                category: 'prompt_coverage_gaps',
                priority: 'medium',
                title: 'Taux de mention des prompts en baisse',
                rationale: 'La visibilite issue des prompts suivis faiblit. Revoyez le pack de prompts avant la prochaine actualisation quotidienne.',
                evidence: 'derived_from_snapshots',
            });
        }
    }

    if ((metrics?.trackedPromptStats?.noRunYet || 0) > 0) {
        actionCenter.push({
            id: 'missing_prompt_runs',
            category: 'prompt_coverage_gaps',
            priority: 'medium',
            title: 'Des prompts suivis n ont pas encore d execution',
            rationale: `${metrics.trackedPromptStats.noRunYet} prompt(s) n ont pas encore de premiere observation.`,
            evidence: 'observed_prompt_state',
        });
    }

    if (auditFreshness.state === 'stale') {
        actionCenter.push({
            id: 'stale_audit',
            category: 'freshness_rerun_issues',
            priority: 'high',
            title: 'Audit quotidien en retard',
            rationale: `Le dernier audit date de ${auditFreshness.hours}h. Lancez une actualisation quotidienne.`,
            evidence: 'observed_timestamp',
        });
    }

    if (runFreshness.state === 'stale') {
        actionCenter.push({
            id: 'stale_runs',
            category: 'freshness_rerun_issues',
            priority: 'high',
            title: 'Executions quotidiennes en retard',
            rationale: `La derniere execution date de ${runFreshness.hours}h. Lancez le cycle quotidien des prompts.`,
            evidence: 'observed_timestamp',
        });
    }

    if ((metrics?.competitorMentions || 0) > Math.max(10, (metrics?.brandRecommendationRuns || 0))) {
        actionCenter.push({
            id: 'competitor_pressure',
            category: 'competitor_pressure_alerts',
            priority: 'medium',
            title: 'Pression concurrentielle elevee',
            rationale: 'Les mentions concurrentes sont elevees par rapport aux recommandations de marque.',
            evidence: 'derived_from_runs',
        });
    }

    const dedupedActionCenter = [];
    const seenActionIds = new Set();
    for (const item of actionCenter) {
        if (seenActionIds.has(item.id)) continue;
        seenActionIds.add(item.id);
        dedupedActionCenter.push(item);
    }

    return {
        metrics: metricRows,
        improving: board.improving,
        declining: board.declining,
        snapshotCoverage: {
            count: snapshots.length,
            startDate: snapshots[0]?.snapshot_date || null,
            endDate: snapshots[snapshots.length - 1]?.snapshot_date || null,
        },
        freshness: {
            audit: auditFreshness,
            runs: runFreshness,
            latestAuditAt: metrics?.lastAuditAt || null,
            latestRunAt: metrics?.lastGeoRunAt || null,
            mode: getContinuousModeLabelFr(),
        },
        snapshots,
        jobs: jobHealth,
        connectors,
        actionCenter: dedupedActionCenter.slice(0, 10),
        dailyMode: {
            enabled: dailyFirst,
            cadenceFloorMinutes: 1440,
            label: getContinuousModeLabelFr(),
        },
    };
}

export async function processContinuousTick(rawOptions = {}) {
    const options = cronDispatchOptionsSchema.parse(rawOptions);
    const summary = {
        startedAt: nowIso(),
        source: options.source,
        seededJobsForClients: 0,
        staleRecovered: { recovered: 0, failed: 0 },
        queue: { dueJobs: 0, queued: 0, skipped: 0 },
        runnable: 0,
        processed: 0,
        completed: 0,
        failed: 0,
        retried: 0,
        skippedOverlap: 0,
        errors: [],
    };

    summary.seededJobsForClients = await ensureDefaultRecurringJobsForAllClients();
    summary.staleRecovered = await recoverStaleRunningRuns();
    summary.queue = await queueDueJobs({
        maxJobsToQueue: options.maxJobsToQueue,
        source: options.source,
    });

    const runnableRuns = await listRunnablePendingRuns(options.maxRunsToExecute);
    summary.runnable = runnableRuns.length;

    const supabase = getAdminSupabase();

    for (const runnable of runnableRuns) {
        try {
            const { data: job, error: jobError } = await supabase
                .from('recurring_jobs')
                .select('*')
                .eq('id', runnable.job_id)
                .single();

            if (jobError || !job) {
                throw new Error(`Job not found for run ${runnable.id}`);
            }

            if (job.is_active !== true || job.status === 'cancelled') {
                await supabase
                    .from('recurring_job_runs')
                    .update({
                        status: 'cancelled',
                        cancelled_at: nowIso(),
                        error_message: 'Job is inactive or cancelled.',
                    })
                    .eq('id', runnable.id)
                    .eq('status', 'pending');
                continue;
            }

            const claimed = await claimRun(runnable);
            if (!claimed.claimed) {
                if (claimed.reason === 'overlap') summary.skippedOverlap += 1;
                continue;
            }

            const lockToken = `${claimed.run.id}:${Date.now()}`;
            await markJobRunning(job, lockToken);

            summary.processed += 1;

            const execution = await executeRunByType(claimed.run);
            if (execution.success) {
                await finalizeRunSuccess({
                    run: claimed.run,
                    job,
                    summary: execution.summary,
                });
                summary.completed += 1;
            } else {
                const failure = await finalizeRunFailure({
                    run: claimed.run,
                    job,
                    errorMessage: execution.error || 'Job execution failed',
                    summary: execution.summary,
                });

                if (failure.retried) summary.retried += 1;
                else summary.failed += 1;
            }
        } catch (runError) {
            summary.failed += 1;
            summary.errors.push(runError.message);
            console.error('[Continuous] processContinuousTick run error:', runError);
        }
    }

    summary.finishedAt = nowIso();
    return summary;
}
