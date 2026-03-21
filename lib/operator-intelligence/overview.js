import 'server-only';

import * as db from '@/lib/db';
import { getRecentSafeActivity } from '@/lib/operator-intelligence/activity';
import { getCompetitorSlice } from '@/lib/operator-intelligence/competitors';
import { getOpportunitySlice } from '@/lib/operator-intelligence/opportunities';
import { getPromptSlice } from '@/lib/operator-intelligence/prompts';
import { getProvenanceMeta } from '@/lib/operator-intelligence/provenance';
import { getSourceSlice } from '@/lib/operator-intelligence/sources';

export async function getOverviewSlice(clientId) {
    const [metrics, prompts, sources, competitors, opportunities, activity, recentAudits, recentQueryRuns] = await Promise.all([
        db.getClientGeoMetrics(clientId),
        getPromptSlice(clientId),
        getSourceSlice(clientId),
        getCompetitorSlice(clientId),
        getOpportunitySlice(clientId),
        getRecentSafeActivity(clientId),
        db.getRecentAudits(clientId, 24),
        db.getRecentQueryRuns(clientId, 120),
    ]);

    return {
        provenance: {
            observed: getProvenanceMeta('observed'),
            derived: getProvenanceMeta('derived'),
        },
        kpis: {
            seoScore: metrics?.seoScore ?? null,
            geoScore: metrics?.geoScore ?? null,
            trackedPromptsTotal: prompts.summary.total,
            completedRunsTotal: metrics?.totalQueryRuns ?? 0,
            mentionRatePercent: prompts.summary.mentionRatePercent,
            citationCoveragePercent: sources.summary.citationCoveragePercent,
            competitorMentionsCount: competitors.summary.competitorMentions + competitors.summary.genericNonTargetMentions,
            openOpportunitiesCount: opportunities.summary.open,
            visibilityProxyPercent: metrics?.visibilityProxyPercent ?? null,
        },
        visibility: {
            lastAuditAt: metrics?.lastAuditAt ?? null,
            lastGeoRunAt: metrics?.lastGeoRunAt ?? null,
            promptCoverage: prompts.summary,
            topProvidersModels: (metrics?.modelPerformance || []).slice(0, 5),
        },
        sources: {
            summary: sources.summary,
            topHosts: sources.topHosts.slice(0, 6),
        },
        competitors: {
            summary: competitors.summary,
            topCompetitors: competitors.topCompetitors.slice(0, 6),
        },
        opportunities: {
            summary: opportunities.summary,
            openItems: opportunities.byStatus.open.slice(0, 6),
        },
        recentActivity: activity.items,
        recentAudits,
        recentQueryRuns,
    };
}
