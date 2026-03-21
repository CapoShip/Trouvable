import 'server-only';

import * as db from '@/lib/db';
import { getProvenanceMeta } from '@/lib/operator-intelligence/provenance';
import { getTrackedQueryCategoryMeta } from '@/lib/operator-intelligence/prompt-taxonomy';
import { getAdminSupabase } from '@/lib/supabase-admin';

function normalizeHost(value) {
    return String(value || '').replace(/^https?:\/\//, '').split('/')[0];
}

export async function getSourceSlice(clientId) {
    const supabase = getAdminSupabase();
    const runRows = await db.getCompletedQueryRuns(clientId);
    const runIds = runRows.map((run) => run.id);

    let mentionRows = [];
    if (runIds.length > 0) {
        const { data, error } = await supabase
            .from('query_mentions')
            .select('query_run_id, business_name, entity_type, created_at')
            .in('query_run_id', runIds)
            .eq('entity_type', 'source');
        if (error) throw new Error(`[OperatorIntelligence/sources] mentions: ${error.message}`);
        mentionRows = data || [];
    }

    const runsById = new Map(runRows.map((run) => [run.id, run]));
    const hostCounts = new Map();
    const providerCounts = new Map();
    const promptCounts = new Map();
    const timeline = new Map();
    const runsWithSources = new Set();

    for (const mention of mentionRows) {
        const host = normalizeHost(mention.business_name);
        if (host) hostCounts.set(host, (hostCounts.get(host) || 0) + 1);
        if (mention.created_at) {
            const day = String(mention.created_at).slice(0, 10);
            timeline.set(day, (timeline.get(day) || 0) + 1);
        }
        runsWithSources.add(mention.query_run_id);

        const run = runsById.get(mention.query_run_id);
        if (!run) continue;

        const providerKey = `${run.provider || 'unknown'} · ${run.model || 'unknown'}`;
        providerCounts.set(providerKey, (providerCounts.get(providerKey) || 0) + 1);

        const promptKey = run.tracked_query_id || run.query_text || run.id;
        if (!promptCounts.has(promptKey)) {
            promptCounts.set(promptKey, {
                query_text: run.query_text || 'Tracked prompt',
                count: 0,
                last_seen_at: run.created_at,
                category: getTrackedQueryCategoryMeta(
                    run.tracked_queries?.category || run.tracked_queries?.query_type,
                    run.query_text || run.tracked_queries?.query_text || ''
                ).label,
            });
        }
        const bucket = promptCounts.get(promptKey);
        bucket.count += 1;
        if (String(run.created_at || '').localeCompare(String(bucket.last_seen_at || '')) > 0) {
            bucket.last_seen_at = run.created_at;
        }
    }

    return {
        provenance: {
            observation: getProvenanceMeta('observed'),
            summary: getProvenanceMeta('derived'),
        },
        summary: {
            totalCompletedRuns: runRows.length,
            runsWithCitations: runsWithSources.size,
            citationCoveragePercent: runRows.length > 0 ? Math.round((runsWithSources.size / runRows.length) * 100) : null,
            totalSourceMentions: mentionRows.length,
            uniqueSourceHosts: hostCounts.size,
        },
        topHosts: [...hostCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .map(([host, count]) => ({ host, count })),
        byProviderModel: [...providerCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([label, count]) => ({ label, count })),
        promptCoverage: [...promptCounts.values()].sort((a, b) => b.count - a.count).slice(0, 8),
        timeline: [...timeline.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, count]) => ({ date, count })),
        emptyState: {
            noRuns: {
                title: 'No runs yet',
                description: 'Execute tracked prompts first. Citation coverage is based only on observed stored runs.',
            },
            noObservedCitations: {
                title: 'No observed citations yet',
                description: 'Completed runs exist, but no source mentions have been captured from those responses yet.',
            },
        },
    };
}
