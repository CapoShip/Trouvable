import 'server-only';

import * as db from '@/lib/db';
import { getProvenanceMeta } from '@/lib/operator-intelligence/provenance';
import { getTrackedQueryCategoryMeta } from '@/lib/operator-intelligence/prompt-taxonomy';
import { getAdminSupabase } from '@/lib/supabase-admin';

export async function getCompetitorSlice(clientId) {
    const supabase = getAdminSupabase();
    const runRows = await db.getCompletedQueryRuns(clientId);
    const runIds = runRows.map((run) => run.id);

    let mentionRows = [];
    if (runIds.length > 0) {
        const { data, error } = await supabase
            .from('query_mentions')
            .select('query_run_id, business_name, entity_type, is_target, position')
            .in('query_run_id', runIds)
            .neq('entity_type', 'source');
        if (error) throw new Error(`[OperatorIntelligence/competitors] mentions: ${error.message}`);
        mentionRows = data || [];
    }

    const runsById = new Map(runRows.map((run) => [run.id, run]));
    const topNames = new Map();
    const promptBuckets = new Map();
    let targetMentions = 0;
    let competitorMentions = 0;
    let genericNonTargetMentions = 0;
    let runsWithoutTargetButCompetitor = 0;
    const competitorRunIds = new Set();

    for (const mention of mentionRows) {
        const run = runsById.get(mention.query_run_id);
        if (!run) continue;

        const entityType = mention.entity_type || 'business';
        if (entityType === 'competitor') {
            competitorMentions += 1;
            competitorRunIds.add(mention.query_run_id);
        } else if (mention.is_target === true) {
            targetMentions += 1;
        } else {
            genericNonTargetMentions += 1;
        }

        if (entityType !== 'competitor' && mention.is_target === true) continue;

        const name = mention.business_name || 'Unknown';
        topNames.set(name, (topNames.get(name) || 0) + 1);

        const queryText = run.query_text || run.tracked_queries?.query_text || 'Tracked prompt';
        const promptKey = run.tracked_query_id || queryText;
        if (!promptBuckets.has(promptKey)) {
            promptBuckets.set(promptKey, {
                id: run.tracked_query_id || promptKey,
                query_text: queryText,
                category: getTrackedQueryCategoryMeta(
                    run.tracked_queries?.category || run.tracked_queries?.query_type,
                    queryText
                ).label,
                competitor_mentions: 0,
                latest_run_at: run.created_at,
            });
        }
        const bucket = promptBuckets.get(promptKey);
        bucket.competitor_mentions += 1;
        if (String(run.created_at || '').localeCompare(String(bucket.latest_run_at || '')) > 0) {
            bucket.latest_run_at = run.created_at;
        }
    }

    for (const run of runRows) {
        if (run.target_found === false && competitorRunIds.has(run.id)) {
            runsWithoutTargetButCompetitor += 1;
        }
    }

    return {
        provenance: {
            observation: getProvenanceMeta('observed'),
            summary: getProvenanceMeta('derived'),
        },
        summary: {
            totalCompletedRuns: runRows.length,
            targetMentions,
            competitorMentions,
            genericNonTargetMentions,
            runsWithoutTargetButCompetitor,
        },
        topCompetitors: [...topNames.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .map(([name, count]) => ({ name, count })),
        promptsWithCompetitors: [...promptBuckets.values()]
            .sort((a, b) => b.competitor_mentions - a.competitor_mentions)
            .slice(0, 12),
        emptyState: {
            noRuns: {
                title: 'No runs yet',
                description: 'Execute tracked prompts first. Competitor visibility is based only on stored tracked-run observations.',
            },
            noCompetitors: {
                title: 'No competitor observations yet',
                description: 'Completed runs exist, but no competitor or non-target business mentions have been captured yet.',
            },
        },
    };
}
