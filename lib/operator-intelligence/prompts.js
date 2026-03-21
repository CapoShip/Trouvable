import 'server-only';

import * as db from '@/lib/db';
import {
    getTrackedQueryCategoryMeta,
    getTrackedQueryCategoryOptions,
    normalizeTrackedQueryCategory,
} from '@/lib/operator-intelligence/prompt-taxonomy';
import { getProvenanceMeta } from '@/lib/operator-intelligence/provenance';
import { getAdminSupabase } from '@/lib/supabase-admin';

function sortPrompts(a, b) {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    return String(a.query_text || '').localeCompare(String(b.query_text || ''), 'fr-CA');
}

function inferSiteType(latestAudit) {
    return (
        latestAudit?.geo_breakdown?.site_classification?.type
        || latestAudit?.seo_breakdown?.site_classification?.type
        || 'generic_business'
    );
}

function inferSiteTypeLabel(latestAudit) {
    return (
        latestAudit?.geo_breakdown?.site_classification?.label
        || latestAudit?.seo_breakdown?.site_classification?.label
        || 'Generic business'
    );
}

function createStarterPrompt({ id, query_text, category, locale, rationale }) {
    return {
        id,
        query_text,
        category,
        locale,
        rationale,
        evidence: 'inferred',
        confidence: 'medium',
    };
}

export function buildStarterPromptPack({ client, siteType, locale, existingPrompts }) {
    const existing = new Set(
        (existingPrompts || [])
            .map((prompt) => String(prompt?.query_text || '').trim().toLowerCase())
            .filter(Boolean)
    );

    const clientName = String(client?.client_name || 'ce business').trim();
    const businessType = String(client?.business_type || 'service').trim();
    const city = String(client?.address?.city || client?.target_region || '').trim();
    const citySuffix = city ? ` a ${city}` : '';

    let templates;
    if (siteType === 'saas_software') {
        templates = [
            createStarterPrompt({
                id: 'saas-1',
                query_text: `best ${businessType} software for small businesses`,
                category: 'service_intent',
                locale,
                rationale: 'Captures high-intent software discovery language.',
            }),
            createStarterPrompt({
                id: 'saas-2',
                query_text: `${clientName} alternatives`,
                category: 'competitor_comparison',
                locale,
                rationale: 'Tracks comparison pressure around the brand.',
            }),
            createStarterPrompt({
                id: 'saas-3',
                query_text: `${clientName} pricing and plans`,
                category: 'brand',
                locale,
                rationale: 'Checks branded recommendation consistency around pricing.',
            }),
            createStarterPrompt({
                id: 'saas-4',
                query_text: `how to choose a ${businessType} platform`,
                category: 'discovery',
                locale,
                rationale: 'Covers top-of-funnel guidance prompts.',
            }),
        ];
    } else {
        templates = [
            createStarterPrompt({
                id: 'local-1',
                query_text: `meilleur ${businessType}${citySuffix}`,
                category: 'local_intent',
                locale,
                rationale: 'Core local buying intent pattern.',
            }),
            createStarterPrompt({
                id: 'local-2',
                query_text: `${businessType} pres de moi${city ? ` ${city}` : ''}`,
                category: 'local_intent',
                locale,
                rationale: 'Captures near-me recommendation behavior.',
            }),
            createStarterPrompt({
                id: 'local-3',
                query_text: `${clientName} avis et fiabilite`,
                category: 'brand',
                locale,
                rationale: 'Tracks branded trust and recommendation consistency.',
            }),
            createStarterPrompt({
                id: 'local-4',
                query_text: `${clientName} vs autres ${businessType}${citySuffix}`,
                category: 'competitor_comparison',
                locale,
                rationale: 'Tracks competitor comparison language for the client.',
            }),
            createStarterPrompt({
                id: 'local-5',
                query_text: `quel ${businessType} recommander${citySuffix}`,
                category: 'discovery',
                locale,
                rationale: 'Covers generic recommendation prompts for the category.',
            }),
        ];
    }

    const prompts = templates.filter((item) => !existing.has(item.query_text.trim().toLowerCase())).slice(0, 5);
    return {
        title: prompts.length > 0 ? 'Starter prompts proposes' : 'Starter pack deja couvert',
        description: prompts.length > 0
            ? 'Inferred starter prompts to bootstrap tracked visibility coverage. Review before adding.'
            : 'Current tracked prompts already cover the suggested starter set.',
        prompts,
    };
}

function emptyMentionCounts() {
    return {
        source: 0,
        competitor: 0,
        non_target: 0,
        target: 0,
    };
}

export async function getPromptSlice(clientId) {
    const supabase = getAdminSupabase();
    const [client, latestAudit, trackedQueries, lastRunMap, runs] = await Promise.all([
        db.getClientById(clientId).catch(() => null),
        db.getLatestAudit(clientId).catch(() => null),
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

    const latestRunIds = [...new Set([...lastRunMap.values()].map((run) => run?.id).filter(Boolean))];
    const mentionCountsByRunId = new Map();

    if (latestRunIds.length > 0) {
        const { data: mentionRows, error: mentionError } = await supabase
            .from('query_mentions')
            .select('query_run_id, entity_type, is_target')
            .in('query_run_id', latestRunIds);

        if (mentionError) {
            throw new Error(`[OperatorIntelligence/prompts] mentions: ${mentionError.message}`);
        }

        for (const mention of mentionRows || []) {
            if (!mentionCountsByRunId.has(mention.query_run_id)) {
                mentionCountsByRunId.set(mention.query_run_id, emptyMentionCounts());
            }
            const bucket = mentionCountsByRunId.get(mention.query_run_id);
            const entityType = mention.entity_type || 'business';

            if (entityType === 'source') {
                bucket.source += 1;
                continue;
            }
            if (entityType === 'competitor') {
                bucket.competitor += 1;
                continue;
            }
            if (mention.is_target === true) {
                bucket.target += 1;
                continue;
            }
            bucket.non_target += 1;
        }
    }

    const prompts = (trackedQueries || [])
        .map((query) => {
            const categoryMeta = getTrackedQueryCategoryMeta(query.category || query.query_type, query.query_text);
            const lastRun = lastRunMap.get(query.id) || null;
            const history = historyByPrompt.get(query.id) || { total: 0, completed: 0, failed: 0, running: 0, pending: 0 };
            const mentionCounts = lastRun
                ? (mentionCountsByRunId.get(lastRun.id) || emptyMentionCounts())
                : emptyMentionCounts();
            const responseText = String(lastRun?.response_text || '').trim();

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
                        target_position: lastRun.target_position ?? lastRun.parsed_response?.target_position ?? null,
                        total_mentioned: Number(lastRun.total_mentioned || 0),
                        mention_counts: mentionCounts,
                        response_excerpt: responseText ? responseText.slice(0, 220) : '',
                        has_more_response: responseText.length > 220,
                    }
                    : null,
                lifecycle: {
                    latest_status: lastRun?.status || 'no_run',
                    has_run: Boolean(lastRun),
                },
                run_history: history,
            };
        })
        .sort(sortPrompts);

    const withTargetFound = prompts.filter((prompt) => prompt.last_run?.target_found === true).length;
    const withRunNoTarget = prompts.filter((prompt) => prompt.last_run && prompt.last_run.target_found === false).length;
    const noRunYet = prompts.filter((prompt) => !prompt.last_run).length;
    const total = prompts.length;

    const latestStatusCounts = {
        completed: prompts.filter((prompt) => prompt.last_run?.status === 'completed').length,
        failed: prompts.filter((prompt) => prompt.last_run?.status === 'failed').length,
        running: prompts.filter((prompt) => prompt.last_run?.status === 'running').length,
        pending: prompts.filter((prompt) => prompt.last_run?.status === 'pending').length,
        no_run: noRunYet,
    };

    const categories = getTrackedQueryCategoryOptions().map((option) => ({
        ...option,
        count: prompts.filter((prompt) => normalizeTrackedQueryCategory(prompt.category, prompt.query_text) === option.key).length,
        active_count: prompts.filter((prompt) => prompt.category === option.key && prompt.is_active).length,
    }));

    const siteType = inferSiteType(latestAudit);
    const siteTypeLabel = inferSiteTypeLabel(latestAudit);
    const locale = 'fr-CA';
    const starterPack = buildStarterPromptPack({
        client,
        siteType,
        locale,
        existingPrompts: prompts,
    });

    return {
        provenance: {
            observed: getProvenanceMeta('observed'),
            derived: getProvenanceMeta('derived'),
            inferred: getProvenanceMeta('inferred'),
        },
        categoryOptions: getTrackedQueryCategoryOptions(),
        siteContext: {
            siteType,
            siteTypeLabel,
            businessType: client?.business_type || null,
            primaryCity: client?.address?.city || client?.target_region || null,
        },
        starterPack,
        summary: {
            total,
            active: prompts.filter((prompt) => prompt.is_active).length,
            inactive: prompts.filter((prompt) => !prompt.is_active).length,
            withTargetFound,
            withRunNoTarget,
            noRunYet,
            latestStatusCounts,
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
