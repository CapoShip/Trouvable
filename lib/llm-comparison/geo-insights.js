import { classifySourceType, computeSourceConfidence, extractUrlsFromText, hostnameFromUrl, normalizeDomainHost } from '@/lib/geo-query-utils';

function safeText(value) {
    return String(value || '').trim();
}

function uniq(values) {
    return [...new Set(values.filter(Boolean))];
}

function normalizeList(values = []) {
    if (!Array.isArray(values)) return [];
    return uniq(values.map((item) => safeText(item).toLowerCase())).filter(Boolean);
}

export function extractCitations(text, clientDomain = null) {
    const urls = extractUrlsFromText(text);
    return urls.map((url) => {
        const host = hostnameFromUrl(url);
        const sourceType = classifySourceType(host, clientDomain);
        return {
            url,
            host,
            source_type: sourceType,
            confidence: computeSourceConfidence(url, host, sourceType),
        };
    });
}

export function computeSignalTier({ ok, citationsCount, competitorsCount, hasBrandMention, contentLength }) {
    if (!ok) return 'failed';
    if (contentLength < 80) return 'low_yield';
    if (citationsCount === 0 && competitorsCount === 0 && !hasBrandMention) return 'low_yield';
    if (citationsCount >= 2 || competitorsCount >= 2 || hasBrandMention) return 'useful';
    return 'weak';
}

function countKeywordMatches(text, keywords) {
    if (!keywords.length) return 0;
    const lowered = text.toLowerCase();
    let score = 0;
    for (const keyword of keywords) {
        if (!keyword) continue;
        if (lowered.includes(keyword)) score += 1;
    }
    return score;
}

export function buildProviderGeoInsight(result, context = {}) {
    const content = safeText(result?.content);
    const citations = extractCitations(content, context.targetDomain || null);
    const competitorKeywords = normalizeList(context.competitors || []);
    const brandKeywords = normalizeList([
        context.targetName,
        context.targetDomain,
        normalizeDomainHost(context.targetDomain || ''),
    ]);

    const competitorMatches = countKeywordMatches(content, competitorKeywords);
    const brandMatches = countKeywordMatches(content, brandKeywords);
    const hasBrandMention = brandMatches > 0;
    const signalTier = computeSignalTier({
        ok: result?.ok === true,
        citationsCount: citations.length,
        competitorsCount: competitorMatches,
        hasBrandMention,
        contentLength: content.length,
    });

    const score =
        (result?.ok ? 20 : 0)
        + Math.min(20, citations.length * 6)
        + Math.min(20, competitorMatches * 5)
        + (hasBrandMention ? 10 : 0)
        + Math.min(15, Math.floor(content.length / 250))
        - (result?.error ? 10 : 0);

    return {
        ...result,
        geo: {
            citations,
            citations_count: citations.length,
            competitors_count: competitorMatches,
            has_brand_mention: hasBrandMention,
            brand_match_count: brandMatches,
            signal_tier: signalTier,
            content_length: content.length,
            score: Math.max(0, score),
        },
    };
}

export function buildComparativeSummary(enrichedResults = []) {
    const successful = enrichedResults.filter((item) => item.ok);
    const errored = enrichedResults.filter((item) => !item.ok);
    const sortedByScore = [...enrichedResults].sort((a, b) => (b.geo?.score || 0) - (a.geo?.score || 0));
    const top = sortedByScore[0] || null;

    const bestCitations = [...enrichedResults].sort((a, b) => (b.geo?.citations_count || 0) - (a.geo?.citations_count || 0))[0] || null;
    const bestCompetitors = [...enrichedResults].sort((a, b) => (b.geo?.competitors_count || 0) - (a.geo?.competitors_count || 0))[0] || null;
    const brandMentions = enrichedResults.filter((item) => item.geo?.has_brand_mention).map((item) => item.provider);

    return {
        successful_count: successful.length,
        error_count: errored.length,
        best_overall_provider: top?.provider || null,
        most_citations_provider: bestCitations?.provider || null,
        most_competitors_provider: bestCompetitors?.provider || null,
        providers_with_brand_mention: brandMentions,
        weak_providers: enrichedResults.filter((item) => ['low_yield', 'weak', 'failed'].includes(item.geo?.signal_tier)).map((item) => item.provider),
    };
}

export function buildPromptCalibrationHints(enrichedResults = [], summary = null) {
    const hints = [];
    if (!enrichedResults.length) return hints;

    const allWeak = enrichedResults.every((item) => ['low_yield', 'weak', 'failed'].includes(item.geo?.signal_tier));
    if (allWeak) {
        hints.push('Signal faible sur tous les modèles: le prompt est probablement trop vague ou trop court.');
    }

    if ((summary?.providers_with_brand_mention || []).length === 0) {
        hints.push('Aucun modèle ne mentionne la marque cible: ajoutez explicitement le nom de marque et le contexte métier.');
    }

    const citationSpread = enrichedResults.map((item) => item.geo?.citations_count || 0);
    if (Math.max(...citationSpread) - Math.min(...citationSpread) >= 2) {
        hints.push('Forte variance des citations entre providers: ce prompt est sensible au modèle, utile pour calibration benchmark.');
    }

    const hasProviderErrors = enrichedResults.some((item) => !item.ok);
    if (hasProviderErrors) {
        hints.push('Un ou plusieurs providers ont échoué: interprétez la comparaison avec prudence (succès partiel).');
    }

    return hints;
}

export function buildComparisonViewModel(apiResponse, context = {}) {
    const results = Array.isArray(apiResponse?.results) ? apiResponse.results : [];
    const enrichedResults = results.map((result) => buildProviderGeoInsight(result, context));
    const summary = buildComparativeSummary(enrichedResults);
    const hints = buildPromptCalibrationHints(enrichedResults, summary);

    return {
        contract_version: apiResponse?.contract_version || 'v1',
        input: apiResponse?.input || null,
        results: enrichedResults,
        summary,
        hints,
        has_partial_error: summary.error_count > 0 && summary.successful_count > 0,
        has_full_error: summary.error_count > 0 && summary.successful_count === 0,
    };
}
