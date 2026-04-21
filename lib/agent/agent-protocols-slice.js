import 'server-only';

import * as db from '@/lib/db';
import { getProvenanceMeta } from '@/lib/operator-intelligence/provenance';

import { buildProtocolsReport } from './protocols';

export async function getAgentProtocolsSlice(clientId) {
    const latestAudit = await db.getLatestAudit(clientId).catch((error) => {
        console.error(`[agent-protocols-slice] audit ${clientId}`, error);
        return null;
    });

    const report = buildProtocolsReport({ audit: latestAudit });

    return {
        provenance: {
            observed: getProvenanceMeta('observed'),
            derived: getProvenanceMeta('derived'),
        },
        available: report.available,
        reliability: report.reliability,
        summary: report.summary,
        dimensions: report.dimensions,
        topFixes: report.topFixes,
        topStrengths: report.topStrengths,
        freshness: {
            auditCreatedAt: latestAudit?.created_at || null,
            scanStatus: latestAudit?.scan_status || null,
        },
        links: {
            audit: `/admin/clients/${clientId}/dossier/audit`,
            opportunities: `/admin/clients/${clientId}/geo/opportunities`,
        },
        emptyState: report.emptyState,
    };
}
