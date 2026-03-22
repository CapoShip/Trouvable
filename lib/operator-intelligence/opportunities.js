import 'server-only';

import * as db from '@/lib/db';
import { getProvenanceMeta, mapOpportunitySourceToProvenance } from '@/lib/operator-intelligence/provenance';

const STATUS_ORDER = ['open', 'in_progress', 'done', 'dismissed'];
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function normalizeIssue(issue, index) {
    if (typeof issue === 'string') {
        return {
            id: `issue-${index}`,
            title: issue,
            description: issue,
            evidence_summary: '',
            recommended_fix: '',
            priority: 'medium',
            category: 'seo',
        };
    }

    return {
        id: `issue-${index}`,
        title: issue?.title || issue?.description || 'Point a corriger',
        description: issue?.description || issue?.title || 'Point a corriger',
        evidence_summary: issue?.evidence_summary || '',
        recommended_fix: issue?.recommended_fix || '',
        priority: issue?.priority || issue?.severity || 'medium',
        category: issue?.category || 'seo',
    };
}

function sortOpportunities(a, b) {
    const priorityA = PRIORITY_ORDER[a.priority] ?? 99;
    const priorityB = PRIORITY_ORDER[b.priority] ?? 99;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return String(b.created_at || '').localeCompare(String(a.created_at || ''));
}

export async function getOpportunitySlice(clientId) {
    const [opportunities, mergeSuggestions, latestAudit] = await Promise.all([
        db.getOpportunities(clientId).catch(() => []),
        db.getMergeSuggestions(clientId, 'pending').catch(() => []),
        db.getLatestAudit(clientId).catch(() => null),
    ]);

    const mapped = (opportunities || []).map((opportunity) => ({
        ...opportunity,
        provenance: mapOpportunitySourceToProvenance(opportunity.source),
    }));

    const byStatus = Object.fromEntries(STATUS_ORDER.map((status) => [status, mapped.filter((item) => item.status === status).sort(sortOpportunities)]));
    const byCategory = [...new Set(mapped.map((item) => item.category).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'fr-CA'))
        .map((category) => ({
            category,
            count: mapped.filter((item) => item.category === category).length,
        }));

    const bySource = ['observed', 'inferred', 'recommended'].map((source) => ({
        source,
        count: mapped.filter((item) => item.source === source).length,
        provenance: mapOpportunitySourceToProvenance(source),
    }));

    const auditIssues = Array.isArray(latestAudit?.issues) ? latestAudit.issues.map(normalizeIssue) : [];

    return {
        provenance: {
            observation: getProvenanceMeta('observed'),
            summary: getProvenanceMeta('derived'),
        },
        summary: {
            total: mapped.length,
            open: byStatus.open.length,
            in_progress: byStatus.in_progress.length,
            done: byStatus.done.length,
            dismissed: byStatus.dismissed.length,
            highPriorityOpen: byStatus.open.filter((item) => item.priority === 'high').length,
            pendingMergeCount: (mergeSuggestions || []).length,
        },
        byStatus,
        byCategory,
        bySource,
        mergeSuggestions: (mergeSuggestions || []).slice(0, 12),
        auditIssues: auditIssues.slice(0, 8),
        emptyState: {
            noOpen: {
                title: 'Aucune opportunite ouverte',
                description: 'Les opportunites apparaissent ici apres audit ou analyse des executions.',
            },
        },
    };
}
