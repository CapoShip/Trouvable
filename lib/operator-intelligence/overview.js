import 'server-only';

import * as db from '@/lib/db';
import { getRecentSafeActivity } from '@/lib/operator-intelligence/activity';
import { getGeoWorkspaceSnapshot } from '@/lib/operator-intelligence/snapshot';
import { mapOpportunitySourceToProvenance, getProvenanceMeta } from '@/lib/operator-intelligence/provenance';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

export async function getOverviewSlice(clientId) {
    const [ws, latestOpps, activity, recentAudits, recentQueryRuns] = await Promise.all([
        getGeoWorkspaceSnapshot(clientId),
        db.getLatestOpportunities(clientId),
        getRecentSafeActivity(clientId),
        db.getRecentAudits(clientId, 24),
        db.getRecentQueryRuns(clientId, 120),
    ]);

    const {
        auditMetrics, runMetrics, mentionMetrics, promptMetrics,
        snapshot, modelPerformance, latestAudit, lastRunAt,
        completedRuns,
    } = ws;

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
            lastGeoRunAt: lastRunAt,
            promptCoverage: {
                total: promptMetrics.total.value,
                active: promptMetrics.active,
                withTargetFound: promptMetrics.withTargetFound,
                withRunNoTarget: promptMetrics.withRunNoTarget,
                noRunYet: promptMetrics.noRunYet,
                mentionRatePercent: promptMetrics.mentionRatePercent.value,
            },
            topProvidersModels: modelPerformance.slice(0, 5),
        },
        sources: {
            summary: {
                totalCompletedRuns: completedRuns.length,
                totalSourceMentions: mentionMetrics.sourceMentions.value,
                externalSourceMentions: mentionMetrics.externalSourceMentions.value,
                uniqueSourceHosts: mentionMetrics.uniqueSourceHosts,
                citationCoveragePercent: mentionMetrics.citationCoveragePercent.value,
            },
            topHosts: mentionMetrics.topSources.slice(0, 6),
        },
        competitors: {
            summary: {
                totalCompletedRuns: completedRuns.length,
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
