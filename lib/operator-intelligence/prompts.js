import 'server-only';

import { getBusinessShortDescription } from '@/lib/client-profile';
import * as db from '@/lib/db';
import {
    getTrackedQueryCategoryMeta,
    getTrackedQueryCategoryOptions,
    normalizeTrackedQueryCategory,
} from '@/lib/operator-intelligence/prompt-taxonomy';
import { getProvenanceMeta } from '@/lib/operator-intelligence/provenance';
import {
    buildPromptMetadata,
    getPromptIntentFamilies,
    shouldSoftBlockPromptActivation,
} from '@/lib/queries/prompt-intelligence';
import { deserializePromptContractFromRow } from '@/lib/queries/prompt-contract-persistence';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { buildCanonicalBusinessDetection } from '@/lib/truth/detection';

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

function humanizeSlug(slug) {
    return String(slug || '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function isWeakAnchorText(value) {
    const t = String(value || '').trim().toLowerCase();
    if (t.length < 4) return true;
    if (/^(service local|general|entreprise|business|saas|saas product|logiciel|plateforme|notre activite|activite)$/.test(t)) return true;
    if (/^https?:\/\/schema\.org\//i.test(String(value || ''))) return true;
    return false;
}

/** Ancre métier pour éviter les prompts « catégorie SEO » vides. */
function resolveOfferAnchor({ services, categoryLabel, resolvedBusiness }) {
    const fromResolved = String(resolvedBusiness?.offering_anchor || '').trim();
    if (!isWeakAnchorText(fromResolved)) return fromResolved;
    const s0 = String(services[0] || '').trim();
    if (!isWeakAnchorText(s0)) return s0;
    const s1 = String(services[1] || '').trim();
    if (!isWeakAnchorText(s1)) return s1;
    const cat = String(categoryLabel || '').trim();
    if (cat.length >= 4 && !/^(localbusiness|organization|business|company|service)$/i.test(cat)) return cat;
    const slugHuman = humanizeSlug(resolvedBusiness?.canonical_category);
    if (slugHuman && !/^(service local|general)$/i.test(slugHuman)) return slugHuman;
    return '';
}

function buildPromptBlueprints({ clientName, categoryLabel, city, locale, services, knownCompetitors, resolvedBusiness }) {
    const canonicalCategory = resolvedBusiness?.canonical_category;
    const businessModel = resolvedBusiness?.business_model_detected;
    const isSaas = businessModel === 'saas' || canonicalCategory === 'ai_visibility_software';
    const cityTextWithPreposition = city ? `a ${city}` : 'dans ma zone';
    const anchor = resolveOfferAnchor({ services, categoryLabel, resolvedBusiness });
    const primaryService = String(services[0] || '').trim() || anchor;
    const declaredCompetitor = knownCompetitors[0]?.trim() || '';
    const useCaseHint = String(resolvedBusiness?.primary_use_case || '').replace(/^Livrer \/ réaliser : /i, '').trim() || anchor || `les besoins couverts par ${clientName}`;
    const normalizedOfferLabel = String(anchor || primaryService || '').replace(/^\d+\.\s*/, '').trim();
    const userVisibleOffering = normalizedOfferLabel || (isSaas ? 'visibilite IA locale' : `service ${cityTextWithPreposition}`);
    const offerAnchor = normalizedOfferLabel || String(categoryLabel || '').trim();
    const shortlistCompetitorsPrompt = `Quelles alternatives a ${clientName} existent pour ${userVisibleOffering}${city ? ` ${cityTextWithPreposition}` : ''} ?`;
    const dualChoicePrompt = declaredCompetitor
        ? `${clientName} ou ${declaredCompetitor} pour ${useCaseHint} ${cityTextWithPreposition} : que choisir et pourquoi ?`
        : shortlistCompetitorsPrompt;

    if (isSaas) {
        const softwareLabel = canonicalCategory === 'ai_visibility_software'
            ? 'visibilite dans les reponses IA pour commerces locaux'
            : (anchor || humanizeSlug(canonicalCategory) || 'logiciel metier');

        return [
            {
                id: 'brand-visibility',
                query_text: `Pour quels types d'entreprises ${clientName} est-il pertinent ?`,
                intent_family: 'brand',
                category: 'brand',
                prompt_mode: 'user_like',
                locale,
                rationale: 'Question utilisateur naturelle orientee positionnement.',
                offer_anchor: offerAnchor,
                offer_label_normalized: normalizedOfferLabel,
                user_visible_offering: userVisibleOffering,
            },
            {
                id: 'brand-use-cases',
                query_text: `Dans quels cas d'usage une entreprise locale choisirait ${clientName} ?`,
                intent_family: 'brand',
                category: 'brand',
                prompt_mode: 'user_like',
                locale,
                rationale: 'Clarifie la promesse en situation reelle.',
                offer_anchor: offerAnchor,
                offer_label_normalized: normalizedOfferLabel,
                user_visible_offering: userVisibleOffering,
            },
            {
                id: 'competitor-alternatives',
                query_text: `Quelles alternatives a ${clientName} sont citees pour ${softwareLabel} et pourquoi ?`,
                intent_family: 'competitor',
                category: 'competitor_comparison',
                prompt_mode: 'user_like',
                locale,
                rationale: 'Detection d alternatives directes cote marche.',
                offer_anchor: offerAnchor,
                offer_label_normalized: normalizedOfferLabel,
                user_visible_offering: userVisibleOffering,
            },
            {
                id: 'competitor-probe',
                query_text: declaredCompetitor
                    ? `${clientName} vs ${declaredCompetitor} : compare 3 criteres et justifie chaque ecart.`
                    : `Liste 3 options concurrentes a ${clientName}, avec un critere de differentiation par option.`,
                intent_family: 'competitor',
                category: 'competitor_comparison',
                prompt_mode: 'operator_probe',
                locale,
                rationale: 'Probe operateur pour shortlist et justification.',
                offer_anchor: offerAnchor,
                offer_label_normalized: normalizedOfferLabel,
                user_visible_offering: userVisibleOffering,
            },
            {
                id: 'pricing',
                query_text: `Que comprend une offre de ${softwareLabel}, et quels frais caches ou delais verifier ?`,
                intent_family: 'pricing',
                category: 'brand',
                prompt_mode: 'user_like',
                locale,
                rationale: 'Demande prix/inclusions/delais en une seule intention claire.',
                offer_anchor: offerAnchor,
                offer_label_normalized: normalizedOfferLabel,
                user_visible_offering: userVisibleOffering,
            },
            {
                id: 'buyer-guidance',
                query_text: `Quels criteres et quelles preuves demander avant de choisir ${clientName} ?`,
                intent_family: 'buyer_guidance',
                category: 'discovery',
                prompt_mode: 'user_like',
                locale,
                rationale: 'Guide d achat actionnable.',
                offer_anchor: offerAnchor,
                offer_label_normalized: normalizedOfferLabel,
                user_visible_offering: userVisibleOffering,
            },
            {
                id: 'implementation',
                query_text: `Quels prerequis techniques et indicateurs suivre dans les 30 premiers jours avec ${clientName} ?`,
                intent_family: 'implementation',
                category: 'discovery',
                prompt_mode: 'operator_probe',
                locale,
                rationale: 'Qualification post-signature (etapes + KPI).',
                offer_anchor: offerAnchor,
                offer_label_normalized: normalizedOfferLabel,
                user_visible_offering: userVisibleOffering,
            },
        ];
    }

    return [
        {
            id: 'brand-visibility',
            query_text: `Pour quels besoins ${clientName} est-il le plus pertinent ${city ? cityTextWithPreposition : ''} ?`,
            intent_family: 'brand',
            category: 'brand',
            prompt_mode: 'user_like',
            locale,
            rationale: 'Positionnement marque orienté besoin.',
            offer_anchor: offerAnchor,
            offer_label_normalized: normalizedOfferLabel,
            user_visible_offering: userVisibleOffering,
        },
        {
            id: 'competitor-alternatives',
            query_text: shortlistCompetitorsPrompt,
            intent_family: 'competitor',
            category: 'competitor_comparison',
            prompt_mode: 'user_like',
            locale,
            rationale: 'Expose alternatives reelles cote utilisateur.',
            offer_anchor: offerAnchor,
            offer_label_normalized: normalizedOfferLabel,
            user_visible_offering: userVisibleOffering,
        },
        {
            id: 'competitor-comparison',
            query_text: dualChoicePrompt,
            intent_family: 'competitor',
            category: 'competitor_comparison',
            prompt_mode: 'operator_probe',
            locale,
            rationale: 'Probe comparatif structuré.',
            offer_anchor: offerAnchor,
            offer_label_normalized: normalizedOfferLabel,
            user_visible_offering: userVisibleOffering,
        },
        {
            id: 'pricing',
            query_text: `Quels prix, inclusions et delais faut-il verifier pour ${userVisibleOffering} ${cityTextWithPreposition} ?`,
            intent_family: 'pricing',
            category: 'brand',
            prompt_mode: 'user_like',
            locale,
            rationale: 'Pricing concret et non vague.',
            offer_anchor: offerAnchor,
            offer_label_normalized: normalizedOfferLabel,
            user_visible_offering: userVisibleOffering,
        },
        {
            id: 'objections',
            query_text: `Quelles questions, risques et preuves verifier avant de choisir ${clientName} ?`,
            intent_family: 'buyer_guidance',
            category: 'discovery',
            prompt_mode: 'operator_probe',
            locale,
            rationale: 'Buyer guidance exploitable.',
            offer_anchor: offerAnchor,
            offer_label_normalized: normalizedOfferLabel,
            user_visible_offering: userVisibleOffering,
        },
        {
            id: 'implementation',
            query_text: `Quelles etapes, prerequis et indicateurs suivre apres signature pour ${userVisibleOffering} ?`,
            intent_family: 'implementation',
            category: 'discovery',
            prompt_mode: 'operator_probe',
            locale,
            rationale: 'Cadre implementation court et structuré.',
            offer_anchor: offerAnchor,
            offer_label_normalized: normalizedOfferLabel,
            user_visible_offering: userVisibleOffering,
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
    
    const canonicalDetection = buildCanonicalBusinessDetection({
        clientName,
        rawBusinessType: categoryLabel,
        siteClassification,
        servicesPreview: Array.isArray(client?.business_details?.services) ? client.business_details.services : [],
        shortDescription: getBusinessShortDescription(client?.business_details || {}).slice(0, 400),
        seoTeaser: String(client?.seo_description || '').trim().slice(0, 220),
        address: client?.address || {},
        targetRegion: String(client?.target_region || '').trim(),
    });
    const resolvedBusiness = canonicalDetection.resolved_business;

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
                promptMode: item.prompt_mode || 'user_like',
                offerAnchor: item.offer_anchor || '',
                userVisibleOffering: item.user_visible_offering || '',
                targetAudience: resolvedBusiness?.target_audience || '',
                primaryUseCase: resolvedBusiness?.primary_use_case || '',
                differentiationAngle: item.intent_family === 'competitor' ? 'comparative' : '',
            });

            return {
                ...item,
                ...metadata,
                prompt_mode: metadata.prompt_mode || item.prompt_mode || 'user_like',
                offer_anchor: item.offer_anchor || null,
                offer_label_normalized: item.offer_label_normalized || null,
                user_visible_offering: item.user_visible_offering || null,
                evidence: 'inferred',
                confidence: metadata.quality_status === 'strong' ? 'high' : metadata.quality_status === 'review' ? 'medium' : 'low',
                activation_blocked: shouldSoftBlockPromptActivation(metadata),
                validation: {
                    status: metadata.validation_status || metadata.quality_status,
                    is_valid: metadata.quality_status !== 'weak',
                    reasons: Array.isArray(metadata.validation_reasons) ? metadata.validation_reasons : metadata.quality_reasons,
                },
                is_selected_default: metadata.quality_status === 'strong',
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
                promptMode: query.prompt_mode || query.prompt_metadata?.prompt_mode || 'user_like',
                offerAnchor: query.offer_anchor || query.prompt_metadata?.offer_anchor || '',
                userVisibleOffering: query.user_visible_offering || query.prompt_metadata?.user_visible_offering || '',
                targetAudience: query.target_audience || query.prompt_metadata?.target_audience || '',
                primaryUseCase: query.primary_use_case || query.prompt_metadata?.primary_use_case || '',
                differentiationAngle: query.differentiation_angle || query.prompt_metadata?.differentiation_angle || '',
            });

            const contract = deserializePromptContractFromRow({
                row: query,
                computed: computedMetadata,
            });

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
                prompt_metadata: query.prompt_metadata || {},
                prompt_origin: contract.prompt_origin,
                intent_family: contract.intent_family,
                prompt_mode: contract.prompt_mode,
                query_type_v2: contract.query_type_v2,
                funnel_stage: contract.funnel_stage,
                geo_scope: contract.geo_scope,
                brand_scope: contract.brand_scope,
                comparison_scope: contract.comparison_scope,
                validation_status: contract.validation_status,
                validation_reasons: contract.validation_reasons,
                offer_anchor: contract.offer_anchor,
                user_visible_offering: contract.user_visible_offering,
                target_audience: contract.target_audience,
                primary_use_case: contract.primary_use_case,
                differentiation_angle: contract.differentiation_angle,
                quality_status: contract.quality_status,
                quality_score: contract.quality_score,
                quality_reasons: contract.quality_reasons,
                activation_blocked: shouldSoftBlockPromptActivation({ quality_status: contract.quality_status }),
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
                        run_signal_tier: lastRun.parsed_response?.run_signal_tier || null,
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
    const canonicalDetection = buildCanonicalBusinessDetection({
        clientName: client?.client_name || '',
        rawBusinessType: String(client?.business_type || '').trim(),
        siteClassification,
        servicesPreview: Array.isArray(client?.business_details?.services) ? client.business_details.services : [],
        shortDescription: getBusinessShortDescription(client?.business_details || {}).slice(0, 400),
        seoTeaser: String(client?.seo_description || '').trim().slice(0, 220),
        address: client?.address || {},
        targetRegion: client?.target_region || '',
        localSignals: latestAudit?.extracted_data?.local_signals || {},
        pageSummaries: latestAudit?.extracted_data?.page_summaries || [],
    });
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
            resolved_business: canonicalDetection.resolved_business,
            canonical_detection: canonicalDetection,
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
