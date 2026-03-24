/**
 * GEO Workspace Snapshot — canonical assembly layer.
 *
 * Single source of truth for all workspace-level GEO metrics.
 * Fetches base data from Supabase once, derives all KPIs via kpi-core,
 * and returns a rich snapshot consumed by overview, legacy compat, models,
 * continuous jobs, and portal.
 *
 * Consumers MUST NOT re-fetch the same base data independently.
 */
import 'server-only';

import * as db from '@/lib/db';
import {
    buildGeoKpiSnapshot,
    buildLastRunMap,
    deriveAuditMetrics,
    deriveCitationDiagnosticHistogram,
    deriveMentionMetrics,
    derivePromptMetrics,
    deriveRunMetrics,
    enrichModelPerformanceWithSources,
} from '@/lib/operator-intelligence/kpi-core';
import { getAdminSupabase } from '@/lib/supabase-admin';

const MENTION_SELECT_FULL = [
    'query_run_id', 'business_name', 'normalized_label', 'entity_type',
    'is_target', 'position', 'first_position', 'confidence',
    'mention_kind', 'recommendation_strength', 'co_occurs_with_target',
    'created_at', 'normalized_domain', 'source_confidence', 'source_type',
    'verified_status',
].join(', ');

/**
 * Fetches all base workspace data and derives KPIs in one pass.
 *
 * @param {string} clientId
 * @returns {Promise<GeoWorkspaceSnapshot>}
 */
export async function getGeoWorkspaceSnapshot(clientId) {
    const supa = getAdminSupabase();

    const [
        latestAudit,
        { count: openOpportunities },
        { count: pendingMerge },
        { count: activeTrackedQueries },
        { count: totalTrackedQueries },
        { count: totalQueryRuns },
        { count: brandRecommendations },
        { data: completedRuns },
        { data: lastRunRow },
        trackedQueries,
        { data: citationDiagRuns },
    ] = await Promise.all([
        db.getLatestAudit(clientId),
        supa.from('opportunities').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'open'),
        supa.from('merge_suggestions').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'pending'),
        supa.from('tracked_queries').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('is_active', true),
        supa.from('tracked_queries').select('*', { count: 'exact', head: true }).eq('client_id', clientId),
        supa.from('query_runs').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'completed').or('run_mode.is.null,run_mode.eq.standard'),
        supa.from('query_runs').select('*', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'completed').or('run_mode.is.null,run_mode.eq.standard').eq('target_found', true),
        supa.from('query_runs').select('id, provider, model, target_found, tracked_query_id, created_at, query_text, parse_confidence, parse_status, status').eq('client_id', clientId).eq('status', 'completed').or('run_mode.is.null,run_mode.eq.standard'),
        supa.from('query_runs').select('created_at').eq('client_id', clientId).or('run_mode.is.null,run_mode.eq.standard').order('created_at', { ascending: false }).limit(1).maybeSingle(),
        db.getTrackedQueriesAll(clientId).catch(() => []),
        supa
            .from('query_runs')
            .select('raw_analysis')
            .eq('client_id', clientId)
            .eq('status', 'completed')
            .or('run_mode.is.null,run_mode.eq.standard')
            .order('created_at', { ascending: false })
            .limit(120),
    ]);

    const runIds = (completedRuns || []).map((r) => r.id);
    let mentionRows = [];
    if (runIds.length > 0) {
        const { data } = await supa
            .from('query_mentions')
            .select(MENTION_SELECT_FULL)
            .in('query_run_id', runIds);
        mentionRows = data || [];
    }

    const counts = {
        openOpportunities: openOpportunities ?? 0,
        pendingMerge: pendingMerge ?? 0,
        activeTrackedQueries: activeTrackedQueries ?? 0,
        totalTrackedQueries: totalTrackedQueries ?? 0,
        totalQueryRuns: totalQueryRuns ?? 0,
        brandRecommendations: brandRecommendations ?? 0,
    };

    const lastRunMap = buildLastRunMap(completedRuns || []);
    const lastRunAt = lastRunRow?.created_at ?? null;

    const auditMetrics = deriveAuditMetrics(latestAudit);
    const runMetrics = deriveRunMetrics(completedRuns || [], counts);
    const mentionMetrics = deriveMentionMetrics(mentionRows, completedRuns || []);
    const promptMetrics = derivePromptMetrics(trackedQueries || [], lastRunMap);
    const citationDiagnosticHistogram = deriveCitationDiagnosticHistogram(citationDiagRuns || []);

    const snapshot = buildGeoKpiSnapshot({
        audit: auditMetrics,
        runs: runMetrics,
        mentions: mentionMetrics,
        prompts: promptMetrics,
        counts,
        lastRunAt,
        citationDiagnosticHistogram,
    });

    const modelPerformance = enrichModelPerformanceWithSources(
        runMetrics.modelPerformance, mentionRows, completedRuns || [],
    );

    return {
        latestAudit,
        completedRuns: completedRuns || [],
        mentionRows,
        trackedQueries: trackedQueries || [],

        snapshot,
        auditMetrics,
        runMetrics,
        mentionMetrics,
        promptMetrics,
        counts,
        lastRunAt,
        lastRunMap,
        modelPerformance,
    };
}
