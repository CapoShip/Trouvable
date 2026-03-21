import 'server-only';

export const TRACKED_QUERY_CATEGORY_META = {
    local_intent: {
        key: 'local_intent',
        label: 'Local intent',
        description: 'Prompts that include a city, neighborhood, or local buying intent.',
    },
    service_intent: {
        key: 'service_intent',
        label: 'Service intent',
        description: 'Prompts focused on a service, category, or business use case.',
    },
    brand: {
        key: 'brand',
        label: 'Brand',
        description: 'Prompts that directly target the client brand or branded demand.',
    },
    competitor_comparison: {
        key: 'competitor_comparison',
        label: 'Competitor comparison',
        description: 'Prompts that compare providers, alternatives, or best-in-class options.',
    },
    discovery: {
        key: 'discovery',
        label: 'Discovery',
        description: 'Broader discovery prompts that explore market visibility or recommendation patterns.',
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
