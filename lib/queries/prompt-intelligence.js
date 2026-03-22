import 'server-only';

const INTENT_FAMILIES = [
    'brand',
    'alternatives',
    'competitor_comparison',
    'pricing',
    'discovery',
    'local_recommendation',
    'service_intent',
    'buyer_guidance',
    'trust_reviews',
    'use_case',
];

const INTENT_SET = new Set(INTENT_FAMILIES);

const GENERIC_TERMS = [
    'business',
    'entreprise',
    'service',
    'company',
    'localbusiness',
    'solution',
    'software',
    'platform',
];

function normalizeText(value) {
    return String(value || '').trim();
}

function normalizeLower(value) {
    return normalizeText(value).toLowerCase();
}

function uniqueList(values = []) {
    const seen = new Set();
    const output = [];
    for (const rawValue of values || []) {
        const value = normalizeText(rawValue);
        if (!value) continue;
        const key = value.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        output.push(value);
    }
    return output;
}

function tokenize(value) {
    return normalizeLower(value)
        .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean);
}

function includesAny(haystack, needles = []) {
    const text = normalizeLower(haystack);
    return needles.some((needle) => text.includes(normalizeLower(needle)));
}

export function getPromptIntentFamilies() {
    return [...INTENT_FAMILIES];
}

export function normalizeIntentFamily(rawValue, queryText = '') {
    const value = normalizeLower(rawValue).replace(/\s+/g, '_').replace(/-/g, '_');
    if (INTENT_SET.has(value)) return value;

    const query = normalizeLower(queryText);
    if (/(alternatives?|option|remplacer|replacement)/.test(query)) return 'alternatives';
    if (/(vs|versus|compare|compar|concurrent|competitor)/.test(query)) return 'competitor_comparison';
    if (/(prix|tarif|pricing|cout|cost)/.test(query)) return 'pricing';
    if (/(avis|review|temoignage|fiabilite|trust)/.test(query)) return 'trust_reviews';
    if (/(pres de moi|a montreal|a quebec|a laval|ville|quartier|proche)/.test(query)) return 'local_recommendation';
    if (/(comment choisir|guide|how to choose|buyer|achat)/.test(query)) return 'buyer_guidance';
    if (/(cas d usage|use case|workflow|scenario)/.test(query)) return 'use_case';
    if (/(service|specialiste|agence|expert)/.test(query)) return 'service_intent';
    if (/(marque|nom officiel|site officiel|contact)/.test(query)) return 'brand';
    return 'discovery';
}

function inferFunnelStage(intentFamily, queryText = '') {
    const query = normalizeLower(queryText);
    if (intentFamily === 'discovery' || intentFamily === 'local_recommendation') return 'awareness';
    if (intentFamily === 'alternatives' || intentFamily === 'competitor_comparison') return 'consideration';
    if (intentFamily === 'pricing' || /(prix|tarif|devis|quote|cost)/.test(query)) return 'decision';
    if (intentFamily === 'buyer_guidance') return 'consideration';
    return 'consideration';
}

function inferComparisonScope(intentFamily, queryText = '') {
    if (intentFamily === 'competitor_comparison' || intentFamily === 'alternatives') return 'explicit';
    if (/(vs|versus|alternatives?|compare|compar)/.test(normalizeLower(queryText))) return 'explicit';
    return 'none';
}

function inferBrandScope(queryText = '', clientName = '') {
    const query = normalizeLower(queryText);
    const brand = normalizeLower(clientName);
    if (brand && query.includes(brand)) return 'brand_explicit';
    if (/(marque|nom officiel|site officiel)/.test(query)) return 'brand_explicit';
    return 'market_generic';
}

function inferGeoScope(queryText = '', city = '', region = '') {
    const query = normalizeLower(queryText);
    if (city && query.includes(normalizeLower(city))) return 'city';
    if (region && query.includes(normalizeLower(region))) return 'region';
    if (/(pres de moi|near me|proche|quartier|ville)/.test(query)) return 'local';
    return 'market';
}

function inferQueryTypeMeta(intentFamily, queryText = '') {
    const query = normalizeLower(queryText);
    if (/(quel|quelle|quels|which|what)/.test(query)) return 'question';
    if (/(meilleur|best|top|top 10)/.test(query)) return 'ranking';
    if (intentFamily === 'pricing') return 'transactional';
    if (intentFamily === 'buyer_guidance') return 'guidance';
    return 'informational';
}

export function evaluatePromptQuality({
    queryText,
    clientName = '',
    city = '',
    category = '',
    services = [],
    knownCompetitors = [],
    intentFamily,
}) {
    const query = normalizeText(queryText);
    const lowered = normalizeLower(query);
    const reasons = [];
    let score = 100;

    if (!query || query.length < 14) {
        score -= 40;
        reasons.push('Prompt trop court pour produire un signal stable.');
    }

    const tokens = tokenize(query);
    const tokenSet = new Set(tokens);
    const genericHits = GENERIC_TERMS.filter((term) => tokenSet.has(term));
    if (genericHits.length >= 2) {
        score -= 20;
        reasons.push('Prompt trop generique (vocabulaire peu discriminant).');
    }

    if (/(localbusiness software|business software|service software)/.test(lowered)) {
        score -= 35;
        reasons.push('Formulation generique de type placeholder detectee.');
    }

    if (city && !includesAny(lowered, [city]) && intentFamily === 'local_recommendation') {
        score -= 20;
        reasons.push('Intention locale sans precision geographique explicite.');
    }

    if (!city && intentFamily === 'local_recommendation' && !/(pres de moi|near me|proche)/.test(lowered)) {
        score -= 15;
        reasons.push('Intention locale sans indice de proximite.');
    }

    if (clientName && includesAny(lowered, [clientName])) {
        score += 8;
    } else if (intentFamily === 'brand') {
        score -= 18;
        reasons.push('Prompt de marque sans mention explicite de la marque cliente.');
    }

    const serviceHints = uniqueList([category, ...(services || [])]).slice(0, 8);
    if (serviceHints.length > 0 && includesAny(lowered, serviceHints)) {
        score += 6;
    } else if (intentFamily === 'service_intent') {
        score -= 12;
        reasons.push('Intention service sans service/categorie explicite.');
    }

    const competitorHints = uniqueList(knownCompetitors);
    if (competitorHints.length > 0 && includesAny(lowered, competitorHints)) {
        score += 8;
    } else if (intentFamily === 'competitor_comparison') {
        score -= 12;
        reasons.push('Comparaison concurrentielle sans concurrent connu explicite.');
    }

    if (tokens.length > 24) {
        score -= 8;
        reasons.push('Prompt trop long et potentiellement ambigu.');
    }

    const bounded = Math.max(0, Math.min(100, Math.round(score)));
    const qualityStatus = bounded >= 75 ? 'strong' : bounded >= 50 ? 'review' : 'weak';

    if (qualityStatus === 'strong' && reasons.length === 0) {
        reasons.push('Prompt specifique et exploitable.');
    }

    return {
        quality_status: qualityStatus,
        quality_score: bounded,
        quality_reasons: reasons,
    };
}

export function buildPromptMetadata({
    queryText,
    clientName = '',
    city = '',
    region = '',
    locale = 'fr-CA',
    category = '',
    services = [],
    knownCompetitors = [],
    promptOrigin = 'manual_operator',
    intentFamily = null,
}) {
    const resolvedIntentFamily = normalizeIntentFamily(intentFamily, queryText);
    const quality = evaluatePromptQuality({
        queryText,
        clientName,
        city,
        category,
        services,
        knownCompetitors,
        intentFamily: resolvedIntentFamily,
    });

    return {
        prompt_origin: promptOrigin,
        intent_family: resolvedIntentFamily,
        query_type_v2: inferQueryTypeMeta(resolvedIntentFamily, queryText),
        funnel_stage: inferFunnelStage(resolvedIntentFamily, queryText),
        geo_scope: inferGeoScope(queryText, city, region),
        brand_scope: inferBrandScope(queryText, clientName),
        comparison_scope: inferComparisonScope(resolvedIntentFamily, queryText),
        quality_status: quality.quality_status,
        quality_score: quality.quality_score,
        quality_reasons: quality.quality_reasons,
        locale: locale || 'fr-CA',
    };
}

export function shouldSoftBlockPromptActivation(metadata) {
    return metadata?.quality_status === 'weak';
}
