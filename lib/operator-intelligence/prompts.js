import 'server-only';

import * as db from '@/lib/db';
import {
    getTrackedQueryCategoryMeta,
    getTrackedQueryCategoryOptions,
    normalizeTrackedQueryCategory,
} from '@/lib/operator-intelligence/prompt-taxonomy';
import { getProvenanceMeta } from '@/lib/operator-intelligence/provenance';

function sortPrompts(a, b) {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    return String(a.query_text || '').localeCompare(String(b.query_text || ''), 'fr-CA');
}

export async function getPromptSlice(clientId) {
    const [trackedQueries, lastRunMap, runs] = await Promise.all([
        db.getTrackedQueriesAll(clientId),
        db.getLastRunPerTrackedQuery(clientId),
        db.getQueryRunsHistory(clientId, 400).catch(() => []),
    ]);

    const historyByPrompt = new Map();
    for (const run of runs || []) {
        if (!run.tracked_query_id) continue;
        if (!historyByPrompt.has(run.tracked_query_id)) {
            historyByPrompt.set(run.tracked_query_id, {
                total: 0,
                completed: 0,
                failed: 0,
                running: 0,
                pending: 0,
            });
        }
        const bucket = historyByPrompt.get(run.tracked_query_id);
        bucket.total += 1;
        if (run.status === 'completed') bucket.completed += 1;
        else if (run.status === 'failed') bucket.failed += 1;
        else if (run.status === 'running') bucket.running += 1;
        else if (run.status === 'pending') bucket.pending += 1;
    }

    const prompts = (trackedQueries || [])
        .map((query) => {
            const categoryMeta = getTrackedQueryCategoryMeta(query.category || query.query_type, query.query_text);
            const lastRun = lastRunMap.get(query.id) || null;
            const history = historyByPrompt.get(query.id) || { total: 0, completed: 0, failed: 0, running: 0, pending: 0 };
            return {
                id: query.id,
                query_text: query.query_text,
                locale: query.locale || 'fr-CA',
                is_active: query.is_active !== false,
                category: categoryMeta.key,
                category_label: categoryMeta.label,
                category_description: categoryMeta.description,
                created_at: query.created_at,
                updated_at: query.updated_at,
                last_run: lastRun
                    ? {
                          id: lastRun.id,
                          created_at: lastRun.created_at,
                          status: lastRun.status,
                          target_found: lastRun.target_found === true,
                          provider: lastRun.provider,
                          model: lastRun.model,
                          target_position: lastRun.parsed_response?.target_position ?? null,
                      }
                    : null,
                run_history: history,
            };
        })
        .sort(sortPrompts);

    const withTargetFound = prompts.filter((prompt) => prompt.last_run?.target_found === true).length;
    const withRunNoTarget = prompts.filter((prompt) => prompt.last_run && prompt.last_run.target_found === false).length;
    const noRunYet = prompts.filter((prompt) => !prompt.last_run).length;
    const total = prompts.length;

    const categories = getTrackedQueryCategoryOptions().map((option) => ({
        ...option,
        count: prompts.filter((prompt) => normalizeTrackedQueryCategory(prompt.category, prompt.query_text) === option.key).length,
        active_count: prompts.filter((prompt) => prompt.category === option.key && prompt.is_active).length,
    }));

    return {
        provenance: getProvenanceMeta('derived'),
        categoryOptions: getTrackedQueryCategoryOptions(),
        summary: {
            total,
            active: prompts.filter((prompt) => prompt.is_active).length,
            inactive: prompts.filter((prompt) => !prompt.is_active).length,
            withTargetFound,
            withRunNoTarget,
            noRunYet,
            mentionRatePercent: total > 0 ? Math.round((withTargetFound / total) * 100) : null,
        },
        categories,
        prompts,
        emptyState: {
            title: 'No tracked prompts yet',
            description: 'Add tracked prompts to generate observed run data for visibility, citations, and competitor tracking.',
        },
    };
}
