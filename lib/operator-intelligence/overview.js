import 'server-only';

import * as db from '@/lib/db';
import { getRecentSafeActivity } from '@/lib/operator-intelligence/activity';
import {
    buildGeoKpiSnapshot,
    buildLastRunMap,
    deriveAuditMetrics,
    deriveMentionMetrics,
    derivePromptMetrics,
    deriveRunMetrics,
    enrichModelPerformanceWithSources,
} from '@/lib/operator-intelligence/kpi-core';
import { mapOpportunitySourceToProvenance } from '@/lib/operator-intelligence/provenance';
import { getProvenanceMeta } from '@/lib/operator-intelligence/provenance';
import { getAdminSupabase } from '@/lib/supabase-admin';

const MENTION_SELECT = [
    'query_run_id', 'business_name', 'normalized_label', 'entity_type',
    'is_target', 'position', 'first_position', 'confidence',
    'mention_kind', 'recommendation_strength', 'co_occurs_with_target',
    'created_at', 'normalized_domain', 'source_confidence', 'source_type',
    'verified_status',
].join(', ');

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export async function getOverviewSlice(clientId) {
    const supa = getAdminSupabase();

    const [
        latestAudit,
        { count: openOpps },
        { count: pendingMerge },
        { count: activeTQ },
        { count: totalTQ },
        { count: totalRuns },
        { count: brandRecs },
        { data: completedRuns },
        { data: lastRunRow },
        trackedQueries,
        latestOpps,
        activity,
        recentAudits,
        recentQueryRuns,
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
        db.getTrackedQueriesAll(clientId),
        db.getLatestOpportunities(clientId),
        getRecentSafeActivity(clientId),
        db.getRecentAudits(clientId, 24),
        db.getRecentQueryRuns(clientId, 120),
    ]);

    const runIds = (completedRuns || []).map((r) => r.id);
    let allMentions = [];
    if (runIds.length > 0) {
        const { data } = await supa
            .from('query_mentions')
            .select(MENTION_SELECT)
            .in('query_run_id', runIds);
        allMentions = data || [];
    }

    const counts = {
        openOpportunities: openOpps ?? 0,
        pendingMerge: pendingMerge ?? 0,
        activeTrackedQueries: activeTQ ?? 0,
        totalTrackedQueries: totalTQ ?? 0,
        totalQueryRuns: totalRuns ?? 0,
        brandRecommendations: brandRecs ?? 0,
    };

    const lastRunMap = buildLastRunMap(completedRuns || []);

    const auditMetrics = deriveAuditMetrics(latestAudit);
    const runMetrics = deriveRunMetrics(completedRuns || [], counts);
    const mentionMetrics = deriveMentionMetrics(allMentions, completedRuns || []);
    const promptMetrics = derivePromptMetrics(trackedQueries || [], lastRunMap);

    const snapshot = buildGeoKpiSnapshot({
        audit: auditMetrics,
        runs: runMetrics,
        mentions: mentionMetrics,
        prompts: promptMetrics,
        counts,
        lastRunAt: lastRunRow?.created_at ?? null,
    });

    const modelPerf = enrichModelPerformanceWithSources(
        runMetrics.modelPerformance, allMentions, completedRuns || [],
    );

    const relevantOpps = latestOpps?.active?.filter((o) => o.status === 'open') ?? [];
    const staleOppsCount = latestOpps?.stale?.length ?? 0;

    return {
        provenance: {
            observed: getProvenanceMeta('observed'),
            derived: getProvenanceMeta('derived'),
        },
        kpis: {
            seoScore: auditMetrics.seoScore.value,
            geoScore: auditMetrics.geoScore.value,
            trackedPromptsTotal: promptMetrics.total.value,
            completedRunsTotal: runMetrics.totalQueryRuns.value,
            mentionRatePercent: promptMetrics.mentionRatePercent.value,
            citationCoveragePercent: mentionMetrics.citationCoveragePercent.value,
            competitorMentionsCount: mentionMetrics.confirmedCompetitorMentions.value,
            genericMentionsCount: mentionMetrics.genericMentions.value,
            openOpportunitiesCount: relevantOpps.length,
            staleOpportunitiesCount: staleOppsCount,
            visibilityProxyPercent: runMetrics.visibilityProxyPercent.value,
            visibilityProxyReliability: runMetrics.visibilityProxyReliability,
            avgParseConfidence: runMetrics.avgParseConfidence.value,
            parseFailureRate: runMetrics.parseFailureRate.value,
        },
        visibility: {
            lastAuditAt: latestAudit?.created_at ?? null,
            lastGeoRunAt: lastRunRow?.created_at ?? null,
            promptCoverage: {
                total: promptMetrics.total.value,
                active: promptMetrics.active,
                withTargetFound: promptMetrics.withTargetFound,
                withRunNoTarget: promptMetrics.withRunNoTarget,
                noRunYet: promptMetrics.noRunYet,
                mentionRatePercent: promptMetrics.mentionRatePercent.value,
            },
            topProvidersModels: modelPerf.slice(0, 5),
        },
        sources: {
            summary: {
                totalCompletedRuns: (completedRuns || []).length,
                totalSourceMentions: mentionMetrics.sourceMentions.value,
                externalSourceMentions: mentionMetrics.externalSourceMentions.value,
                uniqueSourceHosts: mentionMetrics.uniqueSourceHosts,
                citationCoveragePercent: mentionMetrics.citationCoveragePercent.value,
            },
            topHosts: mentionMetrics.topSources.slice(0, 6),
        },
        competitors: {
            summary: {
                totalCompletedRuns: (completedRuns || []).length,
                competitorMentions: mentionMetrics.confirmedCompetitorMentions.value,
                genericNonTargetMentions: mentionMetrics.genericMentions.value,
            },
            topCompetitors: mentionMetrics.topCompetitors.slice(0, 6),
        },
        opportunities: {
            summary: {
                open: relevantOpps.length,
                total: relevantOpps.length,
            },
            openItems: relevantOpps
                .sort((a, b) => {
                    const pa = PRIORITY_ORDER[a.priority] ?? 99;
                    const pb = PRIORITY_ORDER[b.priority] ?? 99;
                    return pa !== pb ? pa - pb : String(b.created_at || '').localeCompare(String(a.created_at || ''));
                })
                .slice(0, 6)
                .map((o) => ({
                    ...o,
                    provenance: mapOpportunitySourceToProvenance(o.source),
                })),
        },
        guardrails: snapshot.guardrails,
        recentActivity: activity.items,
        recentAudits,
        recentQueryRuns,
    };
}
