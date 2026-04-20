/**
 * Pure selectors / view-models for the operator Audit Lab page.
 *
 * This module is the single place where we reconcile the stable persisted
 * audit columns with the newer `extracted_data.layered_v1` structure so the
 * UI renders consistently during migration (layered pipeline may be off,
 * shadowed, or freshly rolled out against historical rows).
 *
 * The golden rule is: the Trouvable product truth lives in the persisted
 * columns (`seo_score`, `geo_score`, `geo_breakdown.overall.hybrid_score`,
 * `issues`, `strengths`). Layer 1 and Layer 2 outputs are diagnostic only.
 */

function toArray(value) {
    return Array.isArray(value) ? value : [];
}

function asNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Authoritative Trouvable final score (stable product truth).
 * Falls back to persisted scoring breakdown, then to raw `seo_score` so the
 * hero always has something meaningful.
 */
export function getFinalStableScores(audit) {
    if (!audit) return { finalScore: null, seoScore: null, geoScore: null, deterministicScore: null, hybridScore: null, llmStatus: null };

    const seoScore = asNumber(audit.seo_score);
    const geoScore = asNumber(audit.geo_score);
    const hybridScore = asNumber(audit?.geo_breakdown?.overall?.hybrid_score);
    const deterministicScore = asNumber(audit?.geo_breakdown?.overall?.deterministic_score);
    const llmStatus = audit?.geo_breakdown?.overall?.llm_status || audit?.geo_breakdown?.ai_analysis?.status || null;

    const finalScore = hybridScore ?? deterministicScore ?? geoScore ?? seoScore;

    return {
        finalScore,
        seoScore,
        geoScore,
        deterministicScore,
        hybridScore,
        llmStatus,
    };
}

export function getDimensions(audit) {
    const geoDims = toArray(audit?.geo_breakdown?.dimensions);
    if (geoDims.length > 0) return geoDims;
    return toArray(audit?.seo_breakdown?.dimensions);
}

export function getClassification(audit) {
    return audit?.geo_breakdown?.site_classification
        || audit?.seo_breakdown?.site_classification
        || audit?.extracted_data?.layered_v1?.classification
        || null;
}

/**
 * Layer 1 view-model. Merges the always-populated scanner block
 * (`extracted_data.layered_v1_layer1`) with the assembled canonical block
 * (`extracted_data.layered_v1`) when available. Tolerates either being absent.
 */
export function getLayer1ViewModel(audit) {
    const extracted = audit?.extracted_data || {};
    const scannerBlock = extracted.layered_v1_layer1 || null;
    const canonical = extracted.layered_v1 || null;

    const crawlMetadata = canonical?.crawl_metadata || scannerBlock?.crawl_metadata || null;
    const renderMetadata = canonical?.render_metadata || null;
    const renderStats = extracted.render_stats || null;
    const siteLevelRawScores = canonical?.site_level_raw_scores || scannerBlock?.site_level_raw_scores || null;
    const pageLevelChecks = canonical?.page_level_checks?.length
        ? canonical.page_level_checks
        : toArray(scannerBlock?.page_level_checks);
    const pageArtifacts = toArray(canonical?.page_artifacts);
    const scannedPages = toArray(audit?.scanned_pages);

    const hasAny = Boolean(
        crawlMetadata
        || renderStats
        || siteLevelRawScores
        || pageLevelChecks.length
        || pageArtifacts.length
        || scannedPages.length,
    );

    return {
        hasAny,
        crawlMetadata,
        renderMetadata,
        renderStats,
        siteLevelRawScores,
        pageLevelChecks,
        pageArtifacts,
        scannedPages,
    };
}

/**
 * Group page-level checks by URL so the operator sees per-page findings.
 * Each check is `{ url, check_id, passed, severity, evidence, ... }` in the
 * registry format produced by the Layer 1 scanner.
 */
export function groupPageChecksByUrl(checks) {
    const byUrl = new Map();
    for (const check of toArray(checks)) {
        const url = check?.url || check?.page_url || '—';
        if (!byUrl.has(url)) byUrl.set(url, []);
        byUrl.get(url).push(check);
    }

    const result = [];
    for (const [url, list] of byUrl.entries()) {
        const passed = list.filter((c) => c.passed === true).length;
        const failed = list.filter((c) => c.passed === false).length;
        const high = list.filter((c) => (c.severity === 'high' || c.severity === 'critical') && c.passed === false).length;
        result.push({ url, checks: list, passed, failed, high, total: list.length });
    }

    result.sort((a, b) => b.high - a.high || b.failed - a.failed);
    return result;
}

/**
 * Layer 2 view-model. Only available when the canonical layered object has
 * been persisted (not the case in shadow mode or on legacy audits).
 */
export function getLayer2ViewModel(audit) {
    const canonical = audit?.extracted_data?.layered_v1 || null;
    const expert = canonical?.site_level_expert || null;
    const summary = canonical?.subsystem_scores?.layer2_expert_summary || null;

    const modules = expert
        ? [
            { key: 'llms_txt_deep', label: 'llms.txt (validation profonde)', data: expert.llms_txt_deep },
            { key: 'ai_discovery_endpoints', label: 'Endpoints de découverte IA', data: expert.ai_discovery_endpoints },
            { key: 'brand_entity', label: 'Marque / entité', data: expert.brand_entity },
            { key: 'trust_stack', label: 'Signaux de confiance', data: expert.trust_stack },
            { key: 'negative_signals', label: 'Signaux négatifs', data: expert.negative_signals },
        ].filter((m) => m.data)
        : [];

    return {
        hasAny: modules.length > 0 || Boolean(summary),
        summary,
        modules,
    };
}

/**
 * Canonical Layer 3 / 4 view-model (normalized evidence, classification,
 * final Trouvable score, dashboard reporting fields).
 */
export function getCanonicalViewModel(audit) {
    const canonical = audit?.extracted_data?.layered_v1 || null;
    if (!canonical) return { hasAny: false, canonical: null };

    return {
        hasAny: true,
        canonical,
        schema: canonical.__schema || null,
        target: canonical.target || null,
        classification: canonical.classification || null,
        normalizedEvidence: canonical.normalized_evidence || null,
        finalScore: canonical.final_trouvable_score || null,
        dashboardReportingFields: canonical.dashboard_reporting_fields || null,
        recommendations: canonical.recommendations || null,
        subsystemScores: canonical.subsystem_scores || null,
    };
}

/**
 * Benchmark / debug view-model. Combines persisted metadata (version, status)
 * with whatever `debug_benchmark` was stored on the canonical object.
 */
export function getBenchmarkViewModel(audit) {
    const canonical = audit?.extracted_data?.layered_v1 || null;
    const debug = canonical?.debug_benchmark || null;

    return {
        auditId: audit?.id || null,
        auditVersion: audit?.audit_version || null,
        scanStatus: audit?.scan_status || null,
        createdAt: audit?.created_at || null,
        errorMessage: audit?.error_message || null,
        sourceUrl: audit?.source_url || null,
        resolvedUrl: audit?.resolved_url || null,
        timings: debug?.timings || null,
        engineId: debug?.single_engine_id || null,
        hasCanonical: Boolean(canonical),
    };
}

export function formatMs(value) {
    const num = asNumber(value);
    if (num === null) return '—';
    if (num < 1000) return `${Math.round(num)} ms`;
    return `${(num / 1000).toFixed(2)} s`;
}

export function formatDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('fr-FR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return String(iso);
    }
}

export function scoreToneClass(score) {
    const value = asNumber(score);
    if (value === null) return 'text-white/30';
    if (value >= 80) return 'text-emerald-300';
    if (value >= 60) return 'text-violet-300';
    if (value >= 40) return 'text-amber-200';
    return 'text-red-300';
}
