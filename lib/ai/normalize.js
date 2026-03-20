import { auditAnalysisSchema, geoQueryRunSchema } from './schemas.js';

/**
 * Valide et normalise la réponse d'analyse d'audit via Zod.
 * Retourne { success, data, errors }.
 */
export function normalizeAuditAnalysis(rawData) {
    if (!rawData || typeof rawData !== 'object') {
        console.warn('[AI/Normalize] rawData absent ou non-objet, retour par défaut');
        rawData = {};
    }

    const result = auditAnalysisSchema.safeParse(rawData);
    if (result.success) {
        return { success: true, data: result.data, errors: null };
    }

    console.warn('[AI/Normalize] Audit analysis validation partielle:', result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`));

    const partial = {
        business_summary: rawData?.business_summary || 'Résumé non disponible',
        geo_recommendability: ['strong', 'moderate', 'weak', 'unclear'].includes(rawData?.geo_recommendability) ? rawData.geo_recommendability : 'unclear',
        geo_recommendability_rationale: rawData?.geo_recommendability_rationale || '',
        llm_comprehension_score: typeof rawData?.llm_comprehension_score === 'number' ? Math.min(15, Math.max(0, rawData.llm_comprehension_score)) : 0,
        opportunities: Array.isArray(rawData?.opportunities) ? rawData.opportunities.filter(o => o.title && o.description) : [],
        faq_suggestions: Array.isArray(rawData?.faq_suggestions) ? rawData.faq_suggestions.filter(f => f.question) : [],
        merge_suggestions: Array.isArray(rawData?.merge_suggestions) ? rawData.merge_suggestions.filter(m => m.field_name && m.suggested_value) : [],
        detected_services: Array.isArray(rawData?.detected_services) ? rawData.detected_services : [],
        detected_areas: Array.isArray(rawData?.detected_areas) ? rawData.detected_areas : [],
        detected_business_name: rawData?.detected_business_name || null,
    };

    return { success: false, data: partial, errors: result.error.issues };
}

/**
 * Valide et normalise la réponse d'analyse de GEO query.
 */
export function normalizeGeoQueryAnalysis(rawData) {
    if (!rawData || typeof rawData !== 'object') {
        console.warn('[AI/Normalize] rawData GEO absent ou non-objet, retour par défaut');
        rawData = {};
    }

    const result = geoQueryRunSchema.safeParse(rawData);
    if (result.success) {
        return { success: true, data: result.data, errors: null };
    }

    console.warn('[AI/Normalize] GEO query validation partielle:', result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`));

    const partial = {
        query: rawData?.query || '',
        response_text: rawData?.response_text || '',
        mentioned_businesses: Array.isArray(rawData?.mentioned_businesses) ? rawData.mentioned_businesses : [],
        total_businesses_mentioned: rawData?.total_businesses_mentioned || 0,
        target_found: rawData?.target_found ?? false,
        target_position: rawData?.target_position ?? null,
    };

    return { success: false, data: partial, errors: result.error.issues };
}
