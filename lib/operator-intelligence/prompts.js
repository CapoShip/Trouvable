import { resolveBusinessType } from '@/lib/ai/business-type-resolver';
import 'server-only';

import * as db from '@/lib/db';
import {
    getTrackedQueryCategoryMeta,
    getTrackedQueryCategoryOptions,
    normalizeTrackedQueryCategory,
} from '@/lib/operator-intelligence/prompt-taxonomy';
import { getProvenanceMeta } from '@/lib/operator-intelligence/provenance';
import { buildPromptMetadata, getPromptIntentFamilies, shouldSoftBlockPromptActivation } from '@/lib/queries/prompt-intelligence';
import { getAdminSupabase } from '@/lib/supabase-admin';

function sortPrompts(a, b) {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    if (a.quality_status !== b.quality_status) {
        const weight = { weak: 0, review: 1, strong: 2 };
        return (weight[a.quality_status] || 0) - (weight[b.quality_status] || 0);
    }
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
        || 'Entreprise generaliste'
    );
}

function extractKnownCompetitors(client = {}) {
    if (Array.isArray(client?.business_details?.competitors)) {
        return [...new Set(client.business_details.competitors.map((value) => String(value || '').trim()).filter(Boolean))];
    }
    return [];
}

function buildPromptBlueprints({ clientName, categoryLabel, city, locale, services, knownCompetitors, resolvedBusiness }) {
    const canonical_category = resolvedBusiness?.canonical_category;
    const business_model = resolvedBusiness?.business_model_detected;
    
    const isServiceOrStore = business_model !== 'saas' && business_model !== 'product';
    const isSaas = business_model === 'saas' || canonical_category === 'ai_visibility_software';
    const cityTextWithPreposition = city ? `a ${city}` : 'dans ma zone';

    if (isSaas) {
        const softwareLabel = canonical_category === 'ai_visibility_software' 
            ? 'logiciel de visibilite IA pour entreprises locales'
            : (categoryLabel || 'plateforme logicielle');
        const altHints = knownCompetitors[0] || 'une autre plateforme';

        return [
            {
                id: 'brand-visibility',
                query_text: `${clientName} avis et fiabilite`,
                intent_family: 'brand',
                category: 'brand',
                locale,
                rationale: 'Mesure la visibilite de marque et les signaux de confiance.',
            },
            {
                id: 'alternatives',
                query_text: `alternatives a ${clientName}`,
                intent_family: 'alternatives',
                category: 'competitor_comparison',
                locale,
                rationale: 'Capture la pression de remplacement autour de la marque.',
            },
            {
                id: 'use-case',
                query_text: `outil pour apparaitre dans ChatGPT pour commerces locaux`,
                intent_family: 'use_case',
                category: 'discovery',
                locale,
                rationale: 'Trouve les besoins logiciels directs lies a l\'IA.',
            },
            {
                id: 'competitor-comparison',
                query_text: `${clientName} vs ${altHints}`,
                intent_family: 'competitor_comparison',
                category: 'competitor_comparison',
                locale,
                rationale: 'Observe les comparaisons directes marque vs concurrent.',
            },
            {
                id: 'pricing',
                query_text: `${clientName} prix et options`,
                intent_family: 'pricing',
                category: 'brand',
                locale,
                rationale: 'Suit la clarte des signaux prix/forfaits autour de la marque.',
            },
            {
                id: 'discovery',
                query_text: `meilleur ${softwareLabel}`,
                intent_family: 'discovery',
                category: 'discovery',
                locale,
                rationale: 'Couverture large de decouverte pour la categorie principale.',
            },
            {
                id: 'buyer-guidance',
                query_text: `comment choisir une plateforme de visibilite IA`,
                intent_family: 'buyer_guidance',
                category: 'discovery',
                locale,
                rationale: 'Couvre les requetes de guidance pre-achat.',
            }
        ];
    }

    const serviceHint = services[0] || categoryLabel || 'service local';
    const competitorHint = knownCompetitors[0] || 'une alternative fiable';

    return [
        {
            id: 'brand-visibility',
            query_text: `${clientName} avis et fiabilite`,
            intent_family: 'brand',
            category: 'brand',
            locale,
            rationale: 'Mesure la visibilite de marque et les signaux de confiance.',
        },
        {
            id: 'alternatives',
            query_text: `alternatives a ${clientName}`,
            intent_family: 'alternatives',
            category: 'competitor_comparison',
            locale,
            rationale: 'Capture la pression de remplacement autour de la marque.',
        },
        {
            id: 'competitor-comparison',
            query_text: `${clientName} vs ${competitorHint}`,
            intent_family: 'competitor_comparison',
            category: 'competitor_comparison',
            locale,
            rationale: 'Observe les comparaisons directes marque vs concurrent.',
        },
        {
            id: 'pricing',
            query_text: `${clientName} prix et options`,
            intent_family: 'pricing',
            category: 'brand',
            locale,
            rationale: 'Suit la clarte des signaux prix/forfaits autour de la marque.',
        },
        {
            id: 'discovery',
            query_text: `meilleur ${serviceHint} ${cityTextWithPreposition}`,
            intent_family: 'discovery',
            category: 'discovery',
            locale,
            rationale: 'Couverture large de decouverte pour la categorie principale.',
        },
        {
            id: 'local-recommendation',
            query_text: `${serviceHint} recommande ${cityTextWithPreposition}`,
            intent_family: 'local_recommendation',
            category: 'local_intent',
            locale,
            rationale: 'Suit les recommandations locales explicites.',
        },
        {
            id: 'service-intent',
            query_text: `${serviceHint} specialise ${cityTextWithPreposition}`,
            intent_family: 'service_intent',
            category: 'service_intent',
            locale,
            rationale: 'Suit les requetes service a forte intention.',
        },
        {
            id: 'buyer-guidance',
            query_text: `comment choisir ${serviceHint} ${cityTextWithPreposition}`,
            intent_family: 'buyer_guidance',
            category: 'discovery',
            locale,
            rationale: 'Couvre les requetes de guidance pre-achat.',
        },
        {
            id: 'trust-reviews',
            query_text: `${serviceHint} avec meilleurs avis ${cityTextWithPreposition}`,
            intent_family: 'trust_reviews',
            category: 'brand',
            locale,
            rationale: 'Mesure le poids des preuves sociales et avis.',
        },
        {
            id: 'use-case',
            query_text: `${serviceHint} pour besoin urgent ${cityText}`,
            intent_family: 'use_case',
            category: 'service_intent',
            locale,
            rationale: 'Couvre les cas d usage concrets et scenarios d urgence.',
        },
    ];
}

export function buildStarterPromptPack({ client, siteType, siteClassification, locale, existingPrompts }) {
    const existing = new Set(
        (existingPrompts || [])
            .map((prompt) => String(prompt?.query_text || '').trim().toLowerCase())
            .filter(Boolean)
    );

    const clientName = String(client?.client_name || '').trim() || 'votre marque';
    const city = String(client?.address?.city || client?.target_region || '').trim();
    const categoryLabel = String(client?.business_type || 'service local').trim();
    const services = Array.isArray(client?.business_details?.services) ? client.business_details.services : [];
    const knownCompetitors = extractKnownCompetitors(client);
    
    const resolvedBusiness = resolveBusinessType(categoryLabel, siteClassification || {}, clientName);

    const blueprints = buildPromptBlueprints({
        clientName,
        categoryLabel,
        city,
        locale: locale || 'fr-CA',
        services,
        knownCompetitors,
        resolvedBusiness
    });

    const prompts = blueprints
        .filter((item) => !existing.has(item.query_text.toLowerCase()))
        .map((item) => {
            const metadata = buildPromptMetadata({
                queryText: item.query_text,
                clientName,
                city,
                region: String(client?.target_region || ''),
                locale: item.locale,
                category: categoryLabel,
                services,
                knownCompetitors,
                promptOrigin: `starter_pack_${siteType || 'generic'}`,
                intentFamily: item.intent_family,
            });

            return {
                ...item,
                ...metadata,
                evidence: 'inferred',
                confidence: metadata.quality_status === 'strong' ? 'high' : metadata.quality_status === 'review' ? 'medium' : 'low',
                activation_blocked: shouldSoftBlockPromptActivation(metadata),
            };
        })
        .slice(0, 10);

    const weakCount = prompts.filter((item) => item.quality_status === 'weak').length;
    return {
        title: prompts.length > 0 ? 'Pack de prompts suggeres' : 'Pack de demarrage deja couvert',
        description: prompts.length > 0
            ? 'Suggestions inferees depuis le contexte client. Les prompts faibles sont marques pour revue operateur.'
            : 'Les prompts suivis existants couvrent deja le pack de demarrage recommande.',
        prompts,
        weakPromptCount: weakCount,
        supportedIntentFamilies: getPromptIntentFamilies(),
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

    const knownCompetitors = extractKnownCompetitors(client || {});
    const city = client?.address?.city || client?.target_region || '';
    const region = client?.target_region || '';
    const services = Array.isArray(client?.business_details?.services) ? client.business_details.services : [];

    const prompts = (trackedQueries || [])
        .map((query) => {
            const categoryMeta = getTrackedQueryCategoryMeta(query.category || query.query_type, query.query_text);
            const lastRun = lastRunMap.get(query.id) || null;
            const history = historyByPrompt.get(query.id) || { total: 0, completed: 0, failed: 0, running: 0, pending: 0 };
            const mentionCounts = lastRun
                ? (mentionCountsByRunId.get(lastRun.id) || emptyMentionCounts())
                : emptyMentionCounts();
            const responseText = String(lastRun?.response_text || '').trim();

            const computedMetadata = buildPromptMetadata({
                queryText: query.query_text,
                clientName: client?.client_name || '',
                city,
                region,
                locale: query.locale || 'fr-CA',
                category: client?.business_type || '',
                services,
                knownCompetitors,
                promptOrigin: query.prompt_origin || 'manual_operator',
                intentFamily: query.intent_family || null,
            });

            const qualityStatus = query.quality_status || computedMetadata.quality_status;
            const qualityReasons = Array.isArray(query.quality_reasons) && query.quality_reasons.length > 0
                ? query.quality_reasons
                : computedMetadata.quality_reasons;

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
                prompt_origin: query.prompt_origin || computedMetadata.prompt_origin,
                intent_family: query.intent_family || computedMetadata.intent_family,
                query_type_v2: query.query_type_v2 || computedMetadata.query_type_v2,
                funnel_stage: query.funnel_stage || computedMetadata.funnel_stage,
                geo_scope: query.geo_scope || computedMetadata.geo_scope,
                brand_scope: query.brand_scope || computedMetadata.brand_scope,
                comparison_scope: query.comparison_scope || computedMetadata.comparison_scope,
                quality_status: qualityStatus,
                quality_score: query.quality_score ?? computedMetadata.quality_score,
                quality_reasons: qualityReasons,
                activation_blocked: shouldSoftBlockPromptActivation({ quality_status: qualityStatus }),
                last_run: lastRun
                    ? {
                        id: lastRun.id,
                        created_at: lastRun.created_at,
                        status: lastRun.status,
                        parse_status: lastRun.parse_status || 'parsed_failed',
                        parse_confidence: lastRun.parse_confidence ?? null,
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
    const weakPromptCount = prompts.filter((prompt) => prompt.quality_status === 'weak').length;
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
    const siteClassification = latestAudit?.geo_breakdown?.site_classification || latestAudit?.seo_breakdown?.site_classification || {};
    const locale = 'fr-CA';
    const starterPack = buildStarterPromptPack({
        client,
        siteType,
        siteClassification,
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
            weakPromptCount,
            latestStatusCounts,
            mentionRatePercent: total > 0 ? Math.round((withTargetFound / total) * 100) : null,
        },
        categories,
        prompts,
        emptyState: {
            title: 'Aucun prompt suivi pour le moment',
            description: 'Ajoutez des prompts suivis pour alimenter les exécutions, citations et signaux concurrents.',
        },
    };
}
