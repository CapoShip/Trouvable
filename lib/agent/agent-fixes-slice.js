import 'server-only';

import { getOpportunitySlice } from '@/lib/operator-intelligence/opportunities';
import { getProvenanceMeta } from '@/lib/operator-intelligence/provenance';

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function sortByPriorityRecent(a, b) {
    const pa = PRIORITY_ORDER[a.priority] ?? 99;
    const pb = PRIORITY_ORDER[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;
    return String(b.created_at || '').localeCompare(String(a.created_at || ''));
}

function buildEmptyState(opportunitySlice) {
    if (!opportunitySlice) {
        return {
            title: 'Correctifs AGENT indisponibles',
            description: 'La file d’actions n’est pas disponible pour ce mandat.',
        };
    }
    const openCount = opportunitySlice?.summary?.open ?? 0;
    if (openCount === 0) {
        return {
            title: 'Aucun correctif ouvert',
            description:
                'Aucune opportunité ouverte à traiter cette semaine. '
                + 'Consultez la file complète dans GEO Ops › File d’actions pour l’historique.',
        };
    }
    return null;
}

export async function getAgentFixesSlice(clientId) {
    const opportunitySlice = await getOpportunitySlice(clientId).catch((error) => {
        console.error(`[agent-fixes-slice] opportunities ${clientId}`, error);
        return null;
    });

    if (!opportunitySlice) {
        return {
            provenance: {
                observed: getProvenanceMeta('observed'),
                derived: getProvenanceMeta('derived'),
            },
            summary: null,
            topFixes: [],
            auditEvidence: [],
            byPriority: { high: 0, medium: 0, low: 0 },
            links: {
                geoOpportunities: `/admin/clients/${clientId}/geo/opportunities`,
            },
            emptyState: buildEmptyState(null),
        };
    }

    const openItems = opportunitySlice?.byStatus?.open || [];
    const sorted = [...openItems].sort(sortByPriorityRecent);

    const byPriority = { high: 0, medium: 0, low: 0 };
    for (const item of openItems) {
        const key = item.priority || 'medium';
        if (byPriority[key] !== undefined) byPriority[key] += 1;
    }

    const topFixes = sorted.slice(0, 5).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        category: item.category,
        priority: item.priority,
        status: item.status,
        created_at: item.created_at,
        provenance: item.provenance || null,
    }));

    const auditEvidence = (opportunitySlice.auditIssues || []).slice(0, 5).map((issue) => ({
        id: issue.id,
        title: issue.title,
        priority: issue.priority,
        category: issue.category,
        evidence_summary: issue.evidence_summary,
        recommended_fix: issue.recommended_fix,
        truth_class: issue.truth_class,
    }));

    return {
        provenance: {
            observed: getProvenanceMeta('observed'),
            derived: getProvenanceMeta('derived'),
        },
        summary: {
            open: opportunitySlice?.summary?.open ?? 0,
            highPriorityOpen: opportunitySlice?.summary?.highPriorityOpen ?? 0,
            inProgress: opportunitySlice?.summary?.in_progress ?? 0,
            pendingMergeCount: opportunitySlice?.summary?.pendingMergeCount ?? 0,
            reviewQueueCount: opportunitySlice?.summary?.reviewQueueCount ?? 0,
            remediationDraftCount: opportunitySlice?.summary?.remediationDraftCount ?? 0,
        },
        byPriority,
        topFixes,
        auditEvidence,
        staleWarning: opportunitySlice?.staleWarning || null,
        links: {
            geoOpportunities: `/admin/clients/${clientId}/geo/opportunities`,
        },
        emptyState: buildEmptyState(opportunitySlice),
    };
}
