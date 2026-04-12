import 'server-only';

import { filterSeoRelevant } from './seo-categories';

// ──────────────────────────────────────────────────────────────
// SEO Health slice — technical SEO audit-backed health
// Source: seo_breakdown, seo_score, issues, strengths from
// client_site_audits row.
// ──────────────────────────────────────────────────────────────

/**
 * SEO Health data drawn from audit persisted columns.
 *
 * Focused on:
 * - seo_score (technical_seo dimension only — labeled truthfully)
 * - seo_breakdown methodology + site classification
 * - issues filtered to SEO-relevant categories
 * - strengths filtered to SEO-relevant categories
 *
 * Provenance: all data from latest client_site_audits row.
 */
export async function getSeoHealthSlice(clientId, { audit } = {}) {
    if (!audit || audit.scan_status === 'pending' || audit.scan_status === 'running') {
        return {
            available: false,
            emptyState: {
                title: 'Audit SEO non disponible',
                description: 'Aucun audit n\'a encore été réalisé pour ce client. Lancez un audit depuis le dossier pour activer cette vue.',
            },
        };
    }

    if (audit.scan_status === 'failed') {
        return {
            available: false,
            emptyState: {
                title: 'Dernier audit échoué',
                description: audit.error_message || 'L\'audit n\'a pas pu être complété. Relancez-le depuis le dossier.',
            },
        };
    }

    const seoBreakdown = audit.seo_breakdown || {};
    const issues = Array.isArray(audit.issues) ? audit.issues : [];
    const strengths = Array.isArray(audit.strengths) ? audit.strengths : [];

    const seoIssues = filterSeoRelevant(issues);
    const seoStrengths = filterSeoRelevant(strengths);

    // Breakdown scores from seo_breakdown.overall
    const overallScores = seoBreakdown.overall || {};
    const siteClassification = seoBreakdown.site_classification || null;

    return {
        available: true,
        seoScore: audit.seo_score ?? null,
        seoScoreLabel: 'SEO technique',
        seoScoreProvenance: 'Dimension technical_seo uniquement — ne représente pas la santé SEO globale.',
        deterministic_score: overallScores.deterministic_score ?? null,
        hybridScore: overallScores.hybrid_score ?? null,
        llmStatus: overallScores.llm_status ?? null,
        methodology: seoBreakdown.methodology || null,
        siteClassification,
        issues: seoIssues.slice(0, 30),
        strengths: seoStrengths.slice(0, 15),
        issueCount: seoIssues.length,
        strengthCount: seoStrengths.length,
        totalIssueCount: issues.length,
        auditDate: audit.created_at || null,
        scanStatus: audit.scan_status,
    };
}
