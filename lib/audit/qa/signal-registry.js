/**
 * Signal Registry — Central registry of all QA-testable audit signals.
 *
 * Each signal has:
 *  - key: unique identifier matching expected_signals keys in fixtures
 *  - label: human-readable name
 *  - provenance: 'deterministic' | 'heuristic' | 'inferred'
 *  - extract(audit): function that returns the actual value from an audit record
 *
 * Provenance drives comparison strictness:
 *  - deterministic: strict yes/no comparison
 *  - heuristic: directional / range-tolerant comparison
 *  - inferred: noted but not strictly graded
 */

function toArray(v) { return Array.isArray(v) ? v : []; }

function getExtracted(audit) { return audit?.extracted_data || {}; }

function getBreakdown(audit) {
    return audit?.geo_breakdown?.dimensions
        ? audit.geo_breakdown
        : audit?.seo_breakdown?.dimensions
            ? audit.seo_breakdown
            : null;
}

function getClassification(audit) {
    const bd = getBreakdown(audit);
    return bd?.site_classification || null;
}

function getDimensions(audit) {
    const bd = getBreakdown(audit);
    return toArray(bd?.dimensions);
}

function findIndicator(audit, dimensionKey, indicatorKey) {
    const dim = getDimensions(audit).find((d) => d.key === dimensionKey);
    if (!dim) return null;
    return toArray(dim.indicators).find((i) => i.key === indicatorKey) || null;
}

export const SIGNAL_REGISTRY = [
    // ─── Deterministic signals ──────────────────────────────────────────────────
    {
        key: 'https_present',
        label: 'HTTPS enforced',
        provenance: 'deterministic',
        extract: (audit) => {
            const url = audit?.resolved_url || audit?.source_url || '';
            return url.startsWith('https://') ? 'yes' : 'no';
        },
    },
    {
        key: 'title_present',
        label: 'Homepage title present',
        provenance: 'deterministic',
        extract: (audit) => {
            const titles = getExtracted(audit).titles || [];
            return titles.length > 0 && titles[0].length >= 10 ? 'yes' : 'no';
        },
    },
    {
        key: 'meta_description_present',
        label: 'Meta description present',
        provenance: 'deterministic',
        extract: (audit) => {
            const descs = getExtracted(audit).descriptions || [];
            return descs.length > 0 && descs[0].length >= 35 ? 'yes' : 'no';
        },
    },
    {
        key: 'h1_present',
        label: 'Homepage H1 present',
        provenance: 'deterministic',
        extract: (audit) => {
            const h1s = getExtracted(audit).h1s || [];
            return h1s.length > 0 && h1s[0].length >= 8 ? 'yes' : 'no';
        },
    },
    {
        key: 'canonical_present',
        label: 'Canonical tag present',
        provenance: 'deterministic',
        extract: (audit) => {
            const canonicals = getExtracted(audit).canonicals || [];
            return canonicals.length > 0 ? 'yes' : 'no';
        },
    },
    {
        key: 'noindex_present',
        label: 'Noindex detected',
        provenance: 'deterministic',
        extract: (audit) => {
            return getExtracted(audit).has_noindex === true ? 'yes' : 'no';
        },
    },
    {
        key: 'phone_present',
        label: 'Phone number extracted',
        provenance: 'deterministic',
        extract: (audit) => {
            const phones = getExtracted(audit).phones || [];
            return phones.length > 0 ? 'yes' : 'no';
        },
    },
    {
        key: 'email_present',
        label: 'Email extracted',
        provenance: 'deterministic',
        extract: (audit) => {
            const emails = getExtracted(audit).emails || [];
            return emails.length > 0 ? 'yes' : 'no';
        },
    },
    {
        key: 'social_profiles_present',
        label: 'Social profile links present',
        provenance: 'deterministic',
        extract: (audit) => {
            const links = getExtracted(audit).social_links || [];
            return links.length > 0 ? 'yes' : 'no';
        },
    },
    {
        key: 'local_business_schema_present',
        label: 'LocalBusiness schema present',
        provenance: 'deterministic',
        extract: (audit) => {
            return getExtracted(audit).has_local_business_schema === true ? 'yes' : 'no';
        },
    },
    {
        key: 'organization_schema_present',
        label: 'Organization schema present',
        provenance: 'deterministic',
        extract: (audit) => {
            const entities = toArray(getExtracted(audit).schema_entities);
            const hasOrg = entities.some((e) =>
                toArray(e.types).some((t) => /organization/i.test(t))
            );
            return hasOrg ? 'yes' : 'no';
        },
    },
    {
        key: 'faq_present',
        label: 'FAQ content detected',
        provenance: 'deterministic',
        extract: (audit) => {
            const ed = getExtracted(audit);
            const hasFaq = ed.has_faq_schema === true
                || toArray(ed.faq_pairs).length > 0
                || Number(ed.page_stats?.faq_pages || 0) > 0;
            return hasFaq ? 'yes' : 'no';
        },
    },
    {
        key: 'visible_contact_page',
        label: 'Contact page found',
        provenance: 'deterministic',
        extract: (audit) => {
            return Number(getExtracted(audit).page_stats?.contact_pages || 0) > 0 ? 'yes' : 'no';
        },
    },
    {
        key: 'visible_about_page',
        label: 'About page found',
        provenance: 'deterministic',
        extract: (audit) => {
            return Number(getExtracted(audit).page_stats?.about_pages || 0) > 0 ? 'yes' : 'no';
        },
    },

    // ─── Heuristic signals ──────────────────────────────────────────────────────
    {
        key: 'business_identity_clear',
        label: 'Business name extracted',
        provenance: 'heuristic',
        extract: (audit) => {
            const names = getExtracted(audit).business_names || [];
            return names.length > 0 ? 'yes' : 'no';
        },
    },
    {
        key: 'city_or_region_present',
        label: 'City or region mentioned',
        provenance: 'heuristic',
        extract: (audit) => {
            const ls = getExtracted(audit).local_signals || {};
            const count = (ls.cities || []).length + (ls.regions || []).length;
            return count > 0 ? 'yes' : 'no';
        },
    },
    {
        key: 'strong_local_signal',
        label: 'Strong local footprint',
        provenance: 'heuristic',
        extract: (audit) => {
            const ls = getExtracted(audit).local_signals || {};
            const count = (ls.cities || []).length + (ls.regions || []).length
                + (ls.area_served || []).length + (ls.address_lines || []).length
                + (ls.local_terms || []).length;
            return count >= 5 ? 'yes' : count >= 2 ? 'partial' : 'no';
        },
    },
    {
        key: 'trust_signal_present',
        label: 'Trust/proof language detected',
        provenance: 'heuristic',
        extract: (audit) => {
            const ts = getExtracted(audit).trust_signals || {};
            const count = (ts.proof_terms || []).length + (ts.review_terms || []).length;
            return count >= 2 ? 'yes' : count >= 1 ? 'partial' : 'no';
        },
    },
    {
        key: 'service_clarity_present',
        label: 'Service/offer clarity observed',
        provenance: 'heuristic',
        extract: (audit) => {
            const ss = getExtracted(audit).service_signals || {};
            const sp = Number(getExtracted(audit).page_stats?.service_pages || 0);
            return (ss.services || []).length >= 3 || sp > 0 ? 'yes' : (ss.services || []).length >= 1 ? 'partial' : 'no';
        },
    },

    // ─── Classification (heuristic) ─────────────────────────────────────────────
    {
        key: 'site_type',
        label: 'Site type classification',
        provenance: 'heuristic',
        extract: (audit) => {
            const cls = getClassification(audit);
            return cls?.type || 'unknown';
        },
    },

    // ─── Inferred (LLM) ────────────────────────────────────────────────────────
    {
        key: 'geo_recommendability',
        label: 'GEO recommendability',
        provenance: 'inferred',
        extract: (audit) => {
            return audit?.geo_breakdown?.ai_analysis?.geo_recommendability || 'unknown';
        },
    },
];

/** Lookup signal definition by key */
export function getSignalDef(key) {
    return SIGNAL_REGISTRY.find((s) => s.key === key) || null;
}

/** Extract all actual signal values from an audit record */
export function extractAllSignals(audit) {
    const result = {};
    for (const signal of SIGNAL_REGISTRY) {
        try {
            result[signal.key] = signal.extract(audit);
        } catch {
            result[signal.key] = 'error';
        }
    }
    return result;
}

/** Get dimension scores from audit breakdown */
export function extractDimensionScores(audit) {
    const dims = getDimensions(audit);
    const scores = {};
    for (const d of dims) {
        scores[d.key] = d.score;
    }

    const bd = getBreakdown(audit);
    if (bd?.overall?.deterministic_score != null) {
        scores.overall = bd.overall.deterministic_score;
    } else if (bd?.overall?.hybrid_score != null) {
        scores.overall = bd.overall.hybrid_score;
    }

    return scores;
}

/** Get issue titles from audit */
export function extractIssueTitles(audit) {
    return toArray(audit?.issues).map((i) => (typeof i === 'string' ? i : i?.title || '')).filter(Boolean);
}
