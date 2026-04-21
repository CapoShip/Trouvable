import 'server-only';

import { normalizeClientProfileShape } from '@/lib/client-profile';
import * as db from '@/lib/db';
import { getOverviewSlice } from '@/lib/operator-intelligence/overview';
import { getReadinessSlice } from '@/lib/operator-intelligence/geo-readiness';
import { getOpportunitySlice } from '@/lib/operator-intelligence/opportunities';
import { getProvenanceMeta } from '@/lib/operator-intelligence/provenance';

import { buildActionabilityReport } from './actionability';
import { buildProtocolsReport } from './protocols';
import { computeAgentScore, deriveAgentInputs } from './score';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function pickTopFixes(opportunitySlice, limit = 5) {
    const openItems = opportunitySlice?.byStatus?.open || [];
    if (openItems.length === 0) return [];
    return [...openItems]
        .sort((a, b) => {
            const pa = PRIORITY_ORDER[a.priority] ?? 99;
            const pb = PRIORITY_ORDER[b.priority] ?? 99;
            if (pa !== pb) return pa - pb;
            return String(b.created_at || '').localeCompare(String(a.created_at || ''));
        })
        .slice(0, limit)
        .map((item) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            priority: item.priority,
            status: item.status,
            provenance: item.provenance || null,
        }));
}

function pickTopBlockers(readinessSlice, limit = 4) {
    const blockers = readinessSlice?.topBlockers || [];
    return blockers.slice(0, limit).map((blocker) => ({
        title: blocker.title,
        detail: blocker.detail,
        status: blocker.status,
        reliability: blocker.reliability,
    }));
}

function buildEmptyState({ hasAudit, hasRuns }) {
    if (hasAudit || hasRuns) return null;
    return {
        title: 'AGENT indisponible',
        description:
            "Aucun audit et aucune exécution moteur n'ont encore été enregistrés pour ce mandat. "
            + 'Lancez un audit et les prompts suivis pour activer la lecture AGENT.',
    };
}

export async function getAgentSlice(clientId) {
    const [overviewSlice, readinessSlice, opportunitySlice, clientRow, latestAudit] = await Promise.all([
        getOverviewSlice(clientId).catch((error) => {
            console.error(`[agent-slice] overview ${clientId}`, error);
            return null;
        }),
        getReadinessSlice(clientId).catch((error) => {
            console.error(`[agent-slice] readiness ${clientId}`, error);
            return null;
        }),
        getOpportunitySlice(clientId).catch((error) => {
            console.error(`[agent-slice] opportunities ${clientId}`, error);
            return null;
        }),
        db.getClientById(clientId).catch((error) => {
            console.error(`[agent-slice] client ${clientId}`, error);
            return null;
        }),
        db.getLatestAudit(clientId).catch((error) => {
            console.error(`[agent-slice] audit ${clientId}`, error);
            return null;
        }),
    ]);

    const client = clientRow ? normalizeClientProfileShape(clientRow) : null;
    const actionabilityReport = buildActionabilityReport({ client, audit: latestAudit });
    const protocolsReport = buildProtocolsReport({ audit: latestAudit });
    const inputs = deriveAgentInputs({
        overviewSlice,
        readinessSlice,
        actionabilityReport,
        protocolsReport,
    });
    const score = computeAgentScore(inputs);

    const lastAuditAt = overviewSlice?.visibility?.lastAuditAt || null;
    const lastRunAt = overviewSlice?.visibility?.lastGeoRunAt || null;
    const hasAudit = Boolean(lastAuditAt);
    const hasRuns = Boolean(overviewSlice?.kpis?.completedRunsTotal);

    const topFixes = pickTopFixes(opportunitySlice);
    const topBlockers = pickTopBlockers(readinessSlice);

    return {
        provenance: {
            observed: getProvenanceMeta('observed'),
            derived: getProvenanceMeta('derived'),
        },
        score,
        inputs: {
            visibility: inputs.visibility,
            readiness: inputs.readiness,
            actionability: inputs.actionability,
            advancedProtocols: inputs.advancedProtocols,
        },
        actionabilityTopFixes: actionabilityReport?.topFixes || [],
        protocolsTopFixes: protocolsReport?.topFixes || [],
        snapshot: {
            lastAuditAt,
            lastRunAt,
            completedRunsTotal: overviewSlice?.kpis?.completedRunsTotal ?? 0,
            trackedPromptsTotal: overviewSlice?.kpis?.trackedPromptsTotal ?? 0,
            openOpportunitiesCount: opportunitySlice?.summary?.open ?? 0,
            highPriorityOpen: opportunitySlice?.summary?.highPriorityOpen ?? 0,
        },
        topFixes,
        topBlockers,
        links: {
            visibility: `/admin/clients/${clientId}/agent/visibility`,
            readiness: `/admin/clients/${clientId}/agent/readiness`,
            actionability: `/admin/clients/${clientId}/agent/actionability`,
            protocols: `/admin/clients/${clientId}/agent/protocols`,
            competitors: `/admin/clients/${clientId}/agent/competitors`,
            fixes: `/admin/clients/${clientId}/agent/fixes`,
            geoOpportunities: `/admin/clients/${clientId}/geo/opportunities`,
            geoRuns: `/admin/clients/${clientId}/geo/runs`,
        },
        emptyState: buildEmptyState({ hasAudit, hasRuns }),
    };
}
