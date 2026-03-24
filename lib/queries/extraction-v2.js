import 'server-only';

import {
    extractUrlsFromText,
    hostnameFromUrl,
    normalizeDomainHost,
    classifySourceType,
    computeSourceConfidence,
} from '../geo-query-utils.js';

const EXTRACTION_VERSION = 'v2.2.0';

function normalizeText(value) {
    return String(value || '').trim();
}

function normalizeLower(value) {
    return normalizeText(value).toLowerCase();
}

function uniqueBy(values, keyFn) {
    const seen = new Set();
    const output = [];
    for (const value of values || []) {
        const key = keyFn(value);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        output.push(value);
    }
    return output;
}

function escapeRegex(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findEvidenceSpan(text, needle) {
    if (!text || !needle) return null;
    const haystack = String(text);
    const index = haystack.toLowerCase().indexOf(String(needle).toLowerCase());
    if (index === -1) return null;
    const start = Math.max(0, index - 45);
    const end = Math.min(haystack.length, index + needle.length + 45);
    return haystack.slice(start, end);
}

function evidenceWindowFromIndex(text, index, tokenLength) {
    if (index == null || index < 0) return null;
    const source = String(text || '');
    const start = Math.max(0, index - 45);
    const end = Math.min(source.length, index + Math.max(8, tokenLength) + 45);
    return source.slice(start, end);
}

function buildAliasIndex({ aliases = [], knownCompetitors = [] }) {
    const exact = new Map();
    const canonicalFromAlias = new Map();

    for (const competitor of knownCompetitors || []) {
        const canonical = normalizeText(competitor);
        if (!canonical) continue;
        const key = canonical.toLowerCase();
        exact.set(key, canonical);
        canonicalFromAlias.set(key, canonical);
    }

    for (const row of aliases || []) {
        const alias = normalizeText(row?.alias);
        const canonical = normalizeText(row?.canonical_name);
        if (!alias || !canonical) continue;
        exact.set(alias.toLowerCase(), canonical);
        canonicalFromAlias.set(alias.toLowerCase(), canonical);
    }

    return { exact, canonicalFromAlias };
}

function tokenSimilarity(a, b) {
    const aTokens = new Set(normalizeLower(a).split(/\s+/).filter(Boolean));
    const bTokens = new Set(normalizeLower(b).split(/\s+/).filter(Boolean));
    if (aTokens.size === 0 || bTokens.size === 0) return 0;

    let intersection = 0;
    for (const token of aTokens) {
        if (bTokens.has(token)) intersection += 1;
    }
    const union = new Set([...aTokens, ...bTokens]).size;
    return union > 0 ? intersection / union : 0;
}

function fuzzyResolveCanonical(name, aliases = []) {
    const sourceName = normalizeText(name);
    if (!sourceName) return null;

    let best = null;
    for (const row of aliases || []) {
        if (row?.match_type !== 'fuzzy_safe') continue;
        const alias = normalizeText(row.alias);
        if (!alias) continue;
        const similarity = tokenSimilarity(sourceName, alias);
        if (similarity < 0.82) continue;
        if (!best || similarity > best.similarity) {
            best = {
                canonical_name: normalizeText(row.canonical_name),
                similarity,
            };
        }
    }
    return best;
}

function classifyParseStatus({ hasAnalysis, hasResponseText, targetSignals, mentionCount, warningsCount }) {
    if (!hasResponseText) return 'parsed_failed';
    if (!hasAnalysis && mentionCount === 0 && targetSignals === 0) return 'parsed_partial';
    if (warningsCount > 0 && mentionCount === 0 && targetSignals === 0) return 'parsed_partial';
    if (mentionCount > 0 || targetSignals > 0) return 'parsed_success';
    if (hasAnalysis) return 'parsed_partial';
    return 'parsed_failed';
}

function parseMentionedBusinesses(structured = []) {
    return (Array.isArray(structured) ? structured : [])
        .map((item, index) => ({
            name: normalizeText(item?.name),
            position: Number.isFinite(Number(item?.position)) ? Math.max(1, Number(item.position)) : (index + 1),
            context: normalizeText(item?.context),
            is_target: item?.is_target === true,
            sentiment: normalizeText(item?.sentiment) || 'neutral',
        }))
        .filter((item) => item.name);
}

function inferRecommendationStrength(mentionContext = '') {
    const text = normalizeLower(mentionContext);
    if (/(top\s|meilleur|recommand[eé]|strongly|highly|best choice|incontournable|référence)/.test(text)) return 'strong';
    if (/(bon\b|good\b|option|suggest|consider|populaire|apprécié)/.test(text)) return 'medium';
    return 'weak';
}

function detectTarget({ responseText, clientName, structuredBusinesses = [] }) {
    const target = normalizeText(clientName);
    if (!target) {
        return {
            target_found: false,
            target_position: null,
            detection_method: 'none',
            evidence_span: null,
            confidence: 0.2,
        };
    }

    const byStructured = structuredBusinesses.find((row) => row.is_target === true || normalizeLower(row.name) === normalizeLower(target));
    if (byStructured) {
        return {
            target_found: true,
            target_position: byStructured.position ?? null,
            detection_method: 'structured',
            evidence_span: byStructured.context || findEvidenceSpan(responseText, byStructured.name),
            confidence: 0.92,
        };
    }

    const regex = new RegExp(`\\b${escapeRegex(target)}\\b`, 'i');
    const match = String(responseText || '').match(regex);
    if (match?.index != null) {
        return {
            target_found: true,
            target_position: null,
            detection_method: 'regex',
            evidence_span: evidenceWindowFromIndex(responseText, match.index, target.length),
            confidence: 0.72,
        };
    }

    return {
        target_found: false,
        target_position: null,
        detection_method: 'none',
        evidence_span: null,
        confidence: 0.55,
    };
}

function buildSourceMentions({ responseText, urls, clientDomain }) {
    const mentions = [];
    for (const url of urls || []) {
        const domain = normalizeDomainHost(url);
        if (!domain) continue;
        const sourceType = classifySourceType(domain, clientDomain);
        const confidence = computeSourceConfidence(url, domain, sourceType);
        const evidenceSpan = findEvidenceSpan(responseText, url) || findEvidenceSpan(responseText, domain) || '';

        mentions.push({
            entity_type: 'source',
            business_name: domain,
            position: null,
            context: evidenceSpan || url,
            is_target: false,
            sentiment: 'neutral',
            mention_kind: sourceType === 'client_own' ? 'self_citation' : 'mentioned',
            mentioned_url: url,
            mentioned_domain: hostnameFromUrl(url),
            mentioned_source_name: domain,
            normalized_domain: domain,
            normalized_label: domain,
            source_type: sourceType,
            source_confidence: confidence,
            source_evidence_span: evidenceSpan || url,
            evidence_span: evidenceSpan || url,
            confidence,
            first_position: null,
            co_occurs_with_target: false,
            verified_status: 'mentioned',
            recommendation_strength: null,
        });
    }
    return uniqueBy(mentions, (item) => `${item.entity_type}:${item.normalized_domain}:${item.mentioned_url}`);
}

/**
 * Classifies a non-target business mention as either a confirmed competitor
 * or a generic mention based on multiple signals:
 * - Known competitor list or alias match → competitor
 * - LLM marked as competitor in context → competitor
 * - Recommendation strength strong/medium → competitor
 * - Otherwise → generic_mention (noise reduction)
 */
function classifyEntityType({
    isTarget,
    isKnownCompetitor,
    recommendationStrength,
    sentiment,
    mentionContext,
}) {
    if (isTarget) return 'business';
    if (isKnownCompetitor) return 'competitor';

    if (recommendationStrength === 'strong') return 'competitor';

    const contextLower = normalizeLower(mentionContext);
    const competitorSignals = /(concurrent|compétit|vs\b|versus|alternative|rival|concurrent|competitor|competing)/;
    if (competitorSignals.test(contextLower)) return 'competitor';

    if (recommendationStrength === 'medium' && sentiment !== 'neutral') return 'competitor';

    return 'generic_mention';
}

function buildBusinessAndCompetitorMentions({
    responseText,
    structuredBusinesses,
    targetName,
    competitorAliases,
    knownCompetitors,
    targetDetection,
}) {
    const aliasIndex = buildAliasIndex({
        aliases: competitorAliases,
        knownCompetitors,
    });
    const targetLower = normalizeLower(targetName);
    const mentions = [];
    let competitorPressure = 0;

    for (const business of structuredBusinesses || []) {
        const normalizedName = normalizeText(business.name);
        if (!normalizedName) continue;
        const lower = normalizedName.toLowerCase();

        const isTarget = business.is_target === true || (targetLower && lower === targetLower);
        const exactCanonical = aliasIndex.exact.get(lower) || null;
        const fuzzyCanonical = exactCanonical ? null : fuzzyResolveCanonical(normalizedName, competitorAliases);
        const isKnownCompetitor = Boolean(exactCanonical || fuzzyCanonical);

        const competitorCanonical = !isTarget
            ? (exactCanonical || fuzzyCanonical?.canonical_name || null)
            : null;

        const evidenceSpan = business.context
            || findEvidenceSpan(responseText, normalizedName)
            || null;

        const recommendationStrength = inferRecommendationStrength(business.context || '');

        const entityType = classifyEntityType({
            isTarget,
            isKnownCompetitor,
            recommendationStrength,
            sentiment: business.sentiment || 'neutral',
            mentionContext: business.context || '',
        });

        const confidence = competitorCanonical
            ? (fuzzyCanonical ? Math.max(0.6, fuzzyCanonical.similarity) : 0.9)
            : (isTarget ? 0.9 : entityType === 'competitor' ? 0.7 : 0.45);

        mentions.push({
            entity_type: entityType,
            business_name: competitorCanonical || normalizedName,
            position: business.position ?? null,
            context: evidenceSpan || business.context || normalizedName,
            is_target: isTarget,
            sentiment: business.sentiment || 'neutral',
            mention_kind: recommendationStrength === 'strong' && entityType === 'competitor' ? 'recommended' : 'mentioned',
            mentioned_url: null,
            mentioned_domain: null,
            mentioned_source_name: null,
            normalized_domain: null,
            normalized_label: competitorCanonical || normalizedName,
            source_type: null,
            source_confidence: null,
            source_evidence_span: null,
            evidence_span: evidenceSpan,
            confidence,
            first_position: business.position ?? null,
            co_occurs_with_target: targetDetection?.target_found === true,
            verified_status: 'mentioned',
            recommendation_strength: recommendationStrength,
        });

        if (entityType === 'competitor') {
            competitorPressure += recommendationStrength === 'strong' ? 2 : 1;
        }
    }

    return {
        mentions: uniqueBy(mentions, (item) => `${item.entity_type}:${normalizeLower(item.normalized_label)}:${item.position ?? 0}`),
        competitorPressureScore: competitorPressure,
    };
}

export function buildExtractionArtifacts({
    queryText,
    responseText,
    analysis,
    clientName,
    clientDomain = null,
    competitorAliases = [],
    knownCompetitors = [],
}) {
    const warnings = [];
    const normalizedResponseText = normalizeText(responseText);
    const hasResponseText = Boolean(normalizedResponseText);
    const hasAnalysis = Boolean(analysis && typeof analysis === 'object');

    if (!hasResponseText) warnings.push('Aucune reponse brute disponible.');
    if (!hasAnalysis) warnings.push('Analyse structuree absente; heuristiques de secours appliquees.');

    const structuredBusinesses = parseMentionedBusinesses(analysis?.mentioned_businesses || []);
    if (structuredBusinesses.length === 0) {
        warnings.push('Aucun business structure detecte dans la sortie d analyse.');
    }

    const urls = extractUrlsFromText(normalizedResponseText);
    if (urls.length === 0) {
        warnings.push('Aucune URL explicite detectee dans la reponse brute.');
    }

    const targetDetection = detectTarget({
        responseText: normalizedResponseText,
        clientName,
        structuredBusinesses,
    });

    const sourceMentions = buildSourceMentions({
        responseText: normalizedResponseText,
        urls,
        clientDomain,
    });

    const businessAndCompetitor = buildBusinessAndCompetitorMentions({
        responseText: normalizedResponseText,
        structuredBusinesses,
        targetName: clientName,
        competitorAliases,
        knownCompetitors,
        targetDetection,
    });

    const mentionRows = [
        ...businessAndCompetitor.mentions,
        ...sourceMentions,
    ];

    const mentionCount = mentionRows.length;
    const targetSignals = targetDetection.target_found ? 1 : 0;
    const parseStatus = classifyParseStatus({
        hasAnalysis,
        hasResponseText,
        targetSignals,
        mentionCount,
        warningsCount: warnings.length,
    });

    const competitorMentions = mentionRows.filter((item) => item.entity_type === 'competitor');
    const genericMentions = mentionRows.filter((item) => item.entity_type === 'generic_mention');
    const sourceRows = mentionRows.filter((item) => item.entity_type === 'source');
    const selfCitations = sourceRows.filter((item) => item.source_type === 'client_own');
    const externalSources = sourceRows.filter((item) => item.source_type !== 'client_own');
    const parseConfidence = Math.max(
        0.1,
        Math.min(
            0.99,
            Number(
                (
                    (targetDetection.confidence * 0.35)
                    + ((mentionCount > 0 ? 0.75 : 0.3) * 0.25)
                    + ((externalSources.length > 0 ? 0.9 : 0.4) * 0.2)
                    + ((warnings.length === 0 ? 0.9 : 0.55) * 0.2)
                ).toFixed(4)
            )
        )
    );

    const normalized = {
        query: normalizeText(queryText),
        target_detection: targetDetection,
        mention_count: mentionCount,
        competitor_mentions: competitorMentions.length,
        generic_mentions: genericMentions.length,
        source_mentions: sourceRows.length,
        external_source_mentions: externalSources.length,
        self_citations: selfCitations.length,
        competitor_pressure_score: businessAndCompetitor.competitorPressureScore,
        entities: mentionRows.map((row) => ({
            entity_type: row.entity_type,
            label: row.normalized_label || row.business_name,
            confidence: row.confidence,
            evidence_span: row.evidence_span || null,
            recommended: row.mention_kind === 'recommended',
            source_type: row.source_type || null,
        })),
    };

    const rawLayer = {
        response_text: normalizedResponseText,
        analysis,
        urls_detected: urls,
    };

    const parsedLayer = {
        mentioned_businesses: structuredBusinesses,
        warnings,
    };

    const normalizedLayer = {
        ...normalized,
        parse_status: parseStatus,
        parse_confidence: parseConfidence,
    };

    const verifiedLayer = {
        sources_verified: [],
        competitors_verified: [],
    };

    const hasWebData = normalizedResponseText.toLowerCase().includes('http') || urls.length > 0;

    let zeroCitationReason = null;
    if (sourceRows.length === 0) {
        if (!hasWebData) {
            zeroCitationReason = 'non_grounded_lane';
        } else {
            zeroCitationReason = 'no_source_detected';
        }
    }

    let zeroCompetitorReason = null;
    if (competitorMentions.length === 0) {
        if (structuredBusinesses.length === 0) {
            zeroCompetitorReason = 'no_businesses_in_analysis';
        } else if (genericMentions.length > 0) {
            zeroCompetitorReason = 'only_generic_mentions';
        } else if (parseConfidence < 0.4) {
            zeroCompetitorReason = 'parser_low_confidence';
        } else {
            zeroCompetitorReason = 'no_competitor_detected';
        }
    }

    const extSourceCount = externalSources.length;
    const competitorCount = competitorMentions.length;
    const genericCount = genericMentions.length;
    const targetFound = targetDetection.target_found === true;
    const structuredNamedCount = structuredBusinesses.length;
    /** Utile = sources externes, concurrents confirmés, ou au moins 2 entités métier dans l’analyse (paysage comparable). */
    const hasComparableLandscape = extSourceCount > 0
        || competitorCount > 0
        || structuredNamedCount >= 2;

    let runSignalTier = 'empty_signal';
    if (!hasResponseText || mentionCount === 0) {
        runSignalTier = 'empty_signal';
    } else if (hasComparableLandscape) {
        runSignalTier = 'useful';
    } else if (targetFound || genericCount > 0 || structuredNamedCount > 0) {
        runSignalTier = parseStatus === 'parsed_failed' ? 'empty_signal' : 'low_yield';
    } else {
        runSignalTier = parseStatus === 'parsed_failed' ? 'empty_signal' : 'low_yield';
    }

    const operatorReasonCodes = [];
    if (!hasResponseText) operatorReasonCodes.push('NO_RESPONSE_TEXT');
    if (!hasAnalysis) operatorReasonCodes.push('MISSING_STRUCTURED_ANALYSIS');
    if (structuredBusinesses.length === 0) operatorReasonCodes.push('NO_STRUCTURED_BUSINESSES');
    if (urls.length === 0) operatorReasonCodes.push('NO_URLS_IN_RESPONSE');
    if (extSourceCount === 0 && urls.length === 0) operatorReasonCodes.push('CITATIONS_REQUIRE_URLS');
    if (!targetFound) operatorReasonCodes.push('TARGET_NOT_FOUND');
    if (competitorCount === 0 && genericCount > 0) operatorReasonCodes.push('COMPETITORS_NEED_CONFIRMATION_OR_RECO');
    if (competitorCount === 0 && genericCount === 0 && structuredBusinesses.length <= 1) {
        operatorReasonCodes.push('NO_NAMED_ALTERNATIVES');
    }
    if (parseStatus === 'parsed_partial') operatorReasonCodes.push('PARSE_PARTIAL');
    if (parseStatus === 'parsed_failed') operatorReasonCodes.push('PARSE_FAILED');
    if (zeroCitationReason === 'non_grounded_lane') operatorReasonCodes.push('NON_GROUNDED_OR_NO_LINKS');
    if (runSignalTier === 'low_yield' && mentionCount > 0) {
        operatorReasonCodes.push('THIN_NAMED_LANDSCAPE');
    }

    const diagnostics = {
        zero_citation_reason: zeroCitationReason,
        zero_competitor_reason: zeroCompetitorReason,
        run_signal_tier: runSignalTier,
        operator_reason_codes: [...new Set(operatorReasonCodes)],
        entity_breakdown: {
            competitors: competitorMentions.length,
            generic_mentions: genericMentions.length,
            sources: sourceRows.length,
            external_sources: externalSources.length,
            self_citations: selfCitations.length,
        },
        sample_size_warning: mentionCount < 3 ? 'low_sample' : null,
    };

    return {
        extractionVersion: EXTRACTION_VERSION,
        parseStatus,
        parseWarnings: warnings,
        parseConfidence,
        targetDetection,
        normalizedResponse: normalized,
        rawLayer,
        parsedLayer,
        normalizedLayer,
        verifiedLayer,
        diagnostics,
        mentionRows,
        counts: {
            total: mentionRows.length,
            sources: sourceRows.length,
            external_sources: externalSources.length,
            competitors: competitorMentions.length,
            generic_mentions: genericMentions.length,
        },
    };
}

export function getExtractionVersion() {
    return EXTRACTION_VERSION;
}
