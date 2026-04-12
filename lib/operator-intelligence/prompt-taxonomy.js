import 'server-only';

/**
 * Discovery mode determines whether the generation prompt is target-aware or target-blind.
 *
 * - brand_aware: company context IS injected into the generation prompt.
 *   Used for brand queries, comparisons, objections, pricing — questions that
 *   explicitly target the company.
 *
 * - blind_discovery: company context is NOT injected into the generation prompt.
 *   The prompt is sent as a pure market question. Target evaluation still happens
 *   afterward in the extraction/analysis layer. This mode measures spontaneous
 *   mention / true visibility.
 */
export const DISCOVERY_MODE_META = {
    brand_aware: {
        key: 'brand_aware',
        label: 'Marque explicite',
        description: 'Le contexte entreprise est injecte dans le prompt de generation. Pour requetes marque, comparaisons, objections.',
    },
    blind_discovery: {
        key: 'blind_discovery',
        label: 'Decouverte spontanee',
        description: 'Aucun contexte entreprise dans le prompt de generation. Mesure la visibilite spontanee reelle.',
    },
};

const VALID_DISCOVERY_MODES = new Set(Object.keys(DISCOVERY_MODE_META));

/**
 * Normalize a discovery_mode value. Falls back to 'brand_aware' for backward compatibility
 * (all existing prompts/runs are effectively brand_aware).
 */
export function normalizeDiscoveryMode(value) {
    const raw = String(value || '').trim().toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
    if (VALID_DISCOVERY_MODES.has(raw)) return raw;
    return 'brand_aware';
}

/**
 * Infer the correct discovery_mode from prompt metadata.
 * brand/competitor_comparison categories → brand_aware
 * discovery/local_intent/service_intent → blind_discovery when no brand reference in query text
 */
export function inferDiscoveryMode({ category, intentFamily, queryText = '', clientName = '' }) {
    // Explicit brand or competitor categories are always brand_aware
    if (category === 'brand' || category === 'competitor_comparison') return 'brand_aware';
    if (intentFamily === 'brand' || intentFamily === 'competitor' || intentFamily === 'competitor_comparison') return 'brand_aware';

    // If the query text explicitly contains the client name, it's brand_aware
    if (clientName) {
        const queryLower = String(queryText || '').toLowerCase();
        const nameLower = String(clientName).toLowerCase().trim();
        if (nameLower && queryLower.includes(nameLower)) return 'brand_aware';
    }

    // Discovery, local_intent, service_intent without brand reference → blind_discovery
    if (category === 'discovery' || category === 'local_intent' || category === 'service_intent') {
        return 'blind_discovery';
    }

    return 'brand_aware';
}

export function getDiscoveryModeOptions() {
    return Object.values(DISCOVERY_MODE_META);
}

export const TRACKED_QUERY_CATEGORY_META = {
    local_intent: {
        key: 'local_intent',
        label: 'Recommandation locale',
        description: 'Prompts avec ville/quartier ou intention locale explicite.',
    },
    service_intent: {
        key: 'service_intent',
        label: 'Intention service',
        description: 'Prompts axes sur un service, une categorie ou un cas d usage.',
    },
    brand: {
        key: 'brand',
        label: 'Marque',
        description: 'Prompts qui ciblent explicitement la marque cliente.',
    },
    competitor_comparison: {
        key: 'competitor_comparison',
        label: 'Comparaison concurrentielle',
        description: 'Prompts de comparaison, alternatives ou concurrence directe.',
    },
    discovery: {
        key: 'discovery',
        label: 'Decouverte',
        description: 'Prompts de decouverte plus larges pour couvrir la visibilite du marche.',
    },
};

const CATEGORY_KEYS = new Set(Object.keys(TRACKED_QUERY_CATEGORY_META));

function normalizeRaw(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/-/g, '_');
}

function inferFromQueryText(queryText = '') {
    const text = String(queryText || '').trim().toLowerCase();

    if (!text) return 'discovery';
    if (/(versus|vs\.?|alternatives?|compare|compar|competit)/.test(text)) return 'competitor_comparison';
    if (/(pres de|proche de|a |à |dans |montreal|montreal|quebec|quebec city|laval|longueuil|brossard|quartier|rive-sud|rive sud|ville)/.test(text)) {
        return 'local_intent';
    }
    if (/(nom officiel|marque|avis sur|review of|site officiel|telephone|numero de|contact)/.test(text)) return 'brand';
    if (/(plombier|dentiste|restaurant|notaire|courtier|clinique|service|specialiste|meilleur|best )/.test(text)) {
        return 'service_intent';
    }
    return 'discovery';
}

export function normalizeTrackedQueryCategory(value, queryText = '') {
    const raw = normalizeRaw(value);
    if (CATEGORY_KEYS.has(raw)) return raw;
    if (/(competit|compar|versus|vs)/.test(raw)) return 'competitor_comparison';
    if (/(brand|marque)/.test(raw)) return 'brand';
    if (/(local|ville|region|quartier|geo_local)/.test(raw)) return 'local_intent';
    if (/(service|category|categorie|seo|geo|visibility)/.test(raw)) return 'service_intent';
    if (/(discovery|general|research|exploration)/.test(raw)) return 'discovery';
    return inferFromQueryText(queryText);
}

export function prepareTrackedQueryWrite(input, existing = {}) {
    const queryText = input.query_text ?? existing.query_text ?? '';
    const locale = input.locale ?? existing.locale ?? 'fr-CA';
    const category = normalizeTrackedQueryCategory(input.category ?? input.query_type ?? existing.category ?? existing.query_type, queryText);

    return {
        ...input,
        locale,
        category,
        query_type: category,
    };
}

export function getTrackedQueryCategoryMeta(value, queryText = '') {
    return TRACKED_QUERY_CATEGORY_META[normalizeTrackedQueryCategory(value, queryText)] || TRACKED_QUERY_CATEGORY_META.discovery;
}

export function getTrackedQueryCategoryOptions() {
    return Object.values(TRACKED_QUERY_CATEGORY_META);
}
