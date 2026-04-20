/**
 * Trouvable audit pipeline configuration and feature flags.
 *
 * This file is the single source of truth for toggling the layered architecture
 * (Layer 1 canonical scan, Layer 2 expert enrichments, Layer 3 normalization,
 * Layer 4 product scoring) without rewriting orchestration code.
 *
 * All flags default to enabled so the layered pipeline is the new normal path.
 * Setting `AUDIT_LAYERED_DISABLED=1` forces the legacy behavior for rollback.
 */

export const AUDIT_VERSION_LEGACY = 'v2';
export const AUDIT_VERSION_LAYERED = 'v2.1-layered';

export const LAYERED_SCHEMA_KEY = 'layered_v1';

function envEnabled(flag, defaultEnabled = true) {
    const value = String(process.env[flag] || '').trim();
    if (value === '1' || value === 'true') return true;
    if (value === '0' || value === 'false') return false;
    return defaultEnabled;
}

function envDisabled(flag) {
    const value = String(process.env[flag] || '').trim();
    return value === '1' || value === 'true';
}

export function isLayeredPipelineEnabled() {
    if (envDisabled('AUDIT_LAYERED_DISABLED')) return false;
    return envEnabled('AUDIT_LAYERED_ENABLED', true);
}

export function isSitemapFirstEnabled() {
    if (envDisabled('AUDIT_SITEMAP_FIRST_DISABLED')) return false;
    return envEnabled('AUDIT_SITEMAP_FIRST_ENABLED', true);
}

export function isLayer2ExpertEnabled() {
    if (envDisabled('AUDIT_LAYER2_DISABLED')) return false;
    return envEnabled('AUDIT_LAYER2_ENABLED', true);
}

/**
 * Shadow / benchmark mode runs the layered pipeline in parallel without
 * mutating the product final score. Off by default; enable with
 * AUDIT_SHADOW_MODE=1 to capture `debug_benchmark` comparisons only.
 */
export function isShadowModeEnabled() {
    return envDisabled('AUDIT_SHADOW_MODE');
}

export function resolveAuditVersion() {
    return isLayeredPipelineEnabled() ? AUDIT_VERSION_LAYERED : AUDIT_VERSION_LEGACY;
}

export function getCrawlBudget() {
    const raw = parseInt(process.env.AUDIT_MAX_PAGES || '', 10);
    if (Number.isFinite(raw) && raw > 0 && raw <= 50) return raw;
    return 10;
}
