import 'server-only';

import * as db from '@/lib/db';
import { getTrackedQueryCategoryMeta } from '@/lib/operator-intelligence/prompt-taxonomy';
import { getProvenanceMeta } from '@/lib/operator-intelligence/provenance';
import { getAdminSupabase } from '@/lib/supabase-admin';

function buildGroupedMentions(mentions = []) {
    const businessMentions = [];
    const competitorMentions = [];
    const genericNonTargetMentions = [];
    const sourceHosts = [];

    for (const mention of mentions) {
        const entityType = mention.entity_type || 'business';
        if (entityType === 'source') {
            sourceHosts.push(mention.business_name);
            continue;
        }
        if (entityType === 'competitor') {
            competitorMentions.push(mention);
            continue;
        }
        if (mention.is_target === true) {
            businessMentions.push(mention);
            continue;
        }
        genericNonTargetMentions.push(mention);
    }

    return { businessMentions, competitorMentions, genericNonTargetMentions, sourceHosts };
}

function buildRunSummary(run, trackedQuery, mentions = []) {
    const grouped = buildGroupedMentions(mentions);
    const queryText = run.query_text || trackedQuery?.query_text || 'Tracked prompt';
    return {
        id: run.id,
        tracked_query_id: run.tracked_query_id,
        query_text: queryText,
        category: getTrackedQueryCategoryMeta(trackedQuery?.category || trackedQuery?.query_type, queryText).label,
        provider: run.provider,
        model: run.model,
        status: run.status,
        target_found: run.target_found === true,
        target_position: run.target_position ?? null,
        total_mentioned: run.total_mentioned ?? 0,
        created_at: run.created_at,
        mention_counts: {
            target: grouped.businessMentions.length,
            competitors: grouped.competitorMentions.length,
            non_target: grouped.genericNonTargetMentions.length,
            sources: grouped.sourceHosts.length,
        },
        source_hosts_preview: [...new Set(grouped.sourceHosts)].slice(0, 4),
    };
}

export async function getRunsSlice(clientId) {
    const supabase = getAdminSupabase();
    const [runs, trackedQueries] = await Promise.all([
        db.getQueryRunsHistory(clientId, 250),
        db.getTrackedQueriesAll(clientId),
    ]);

    const runIds = (runs || []).map((run) => run.id);
    let mentionRows = [];
    if (runIds.length > 0) {
        const { data, error } = await supabase
            .from('query_mentions')
            .select('query_run_id, business_name, entity_type, is_target, position')
            .in('query_run_id', runIds);
        if (error) throw new Error(`[OperatorIntelligence/runs] mentions: ${error.message}`);
        mentionRows = data || [];
    }

    const mentionsByRunId = new Map();
    for (const mention of mentionRows) {
        if (!mentionsByRunId.has(mention.query_run_id)) mentionsByRunId.set(mention.query_run_id, []);
        mentionsByRunId.get(mention.query_run_id).push(mention);
    }

    const trackedQueriesById = new Map((trackedQueries || []).map((query) => [query.id, query]));

    const latestByPrompt = new Map();
    const statusCounts = { pending: 0, running: 0, completed: 0, failed: 0 };
    const providerCounts = new Map();

    const history = (runs || []).map((run) => {
        if (statusCounts[run.status] !== undefined) {
            statusCounts[run.status] += 1;
        }
        const providerKey = `${run.provider || 'unknown'} · ${run.model || 'unknown'}`;
        providerCounts.set(providerKey, (providerCounts.get(providerKey) || 0) + 1);
        if (run.tracked_query_id && !latestByPrompt.has(run.tracked_query_id)) {
            latestByPrompt.set(run.tracked_query_id, run);
        }
        return buildRunSummary(run, trackedQueriesById.get(run.tracked_query_id), mentionsByRunId.get(run.id) || []);
    });

    const latestPerPrompt = (trackedQueries || []).map((query) => {
        const run = latestByPrompt.get(query.id) || null;
        return {
            id: query.id,
            query_text: query.query_text,
            category: getTrackedQueryCategoryMeta(query.category || query.query_type, query.query_text).label,
            locale: query.locale || 'fr-CA',
            is_active: query.is_active !== false,
            latest_run: run ? buildRunSummary(run, query, mentionsByRunId.get(run.id) || []) : null,
        };
    });

    return {
        provenance: {
            observation: getProvenanceMeta('observed'),
            summary: getProvenanceMeta('derived'),
        },
        summary: {
            total: history.length,
            statusCounts,
            topProvidersModels: [...providerCounts.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([label, count]) => ({ label, count })),
        },
        latestPerPrompt,
        history,
        emptyState: {
            noRuns: {
                title: 'No runs yet',
                description: 'Run the tracked prompts to generate observed visibility, citation, and competitor data.',
            },
        },
    };
}

export async function getRunInspectorSlice(clientId, runId) {
    const run = await db.getQueryRunById(runId);
    if (run.client_id !== clientId) {
        throw new Error('Run not found for this client.');
    }

    const mentions = await db.getQueryRunMentions(runId);
    const grouped = buildGroupedMentions(mentions);

    const sourceHosts = [...new Set(grouped.sourceHosts)];
    const responseText = String(run.response_text || '').trim();

    return {
        provenance: {
            observation: getProvenanceMeta('observed'),
            summary: getProvenanceMeta('derived'),
        },
        run: {
            id: run.id,
            query_text: run.query_text || run.tracked_queries?.query_text || 'Tracked prompt',
            provider: run.provider,
            model: run.model,
            status: run.status,
            created_at: run.created_at,
            target_found: run.target_found === true,
            target_position: run.target_position ?? null,
            total_mentioned: run.total_mentioned ?? 0,
            response_excerpt: responseText ? responseText.slice(0, 600) : '',
            has_more_response: responseText.length > 600,
        },
        businesses: grouped.businessMentions.map((mention) => ({
            name: mention.business_name,
            position: mention.position,
            is_target: mention.is_target === true,
        })),
        competitors: grouped.competitorMentions.map((mention) => ({
            name: mention.business_name,
            position: mention.position,
        })),
        nonTargets: grouped.genericNonTargetMentions.map((mention) => ({
            name: mention.business_name,
            position: mention.position,
        })),
        sourceHosts,
    };
}
