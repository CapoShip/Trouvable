import { z } from 'zod';

/**
 * Schéma de réponse pour l'analyse d'audit par le LLM.
 */
export const auditAnalysisSchema = z.object({
    business_summary: z.string().describe('Résumé court de l\'activité observée sur le site'),
    geo_recommendability: z.enum(['strong', 'moderate', 'weak', 'unclear']).describe('Niveau de recommandabilité GEO'),
    geo_recommendability_rationale: z.string().describe('Justification de l\'évaluation GEO'),
    llm_comprehension_score: z.number().min(0).max(15).describe('Score /15 de compréhension LLM'),
    opportunities: z.array(z.object({
        title: z.string(),
        description: z.string(),
        priority: z.enum(['high', 'medium', 'low']),
        category: z.enum(['seo', 'geo', 'content', 'technical', 'trust']),
        source: z.enum(['observed', 'inferred', 'recommended']),
    })).describe('Opportunités identifiées'),
    faq_suggestions: z.array(z.object({
        question: z.string(),
        suggested_answer: z.string(),
        source: z.enum(['observed', 'inferred', 'recommended']),
    })).describe('Suggestions de FAQ'),
    merge_suggestions: z.array(z.object({
        field_name: z.string(),
        suggested_value: z.any(),
        confidence: z.enum(['high', 'medium', 'low']),
        rationale: z.string(),
        source: z.enum(['observed', 'inferred', 'recommended']),
    })).describe('Suggestions de données à merger dans le profil'),
    detected_services: z.array(z.string()).optional(),
    detected_areas: z.array(z.string()).optional(),
    detected_business_name: z.string().optional(),
});

/**
 * Schéma de réponse pour un GEO query run.
 */
export const geoQueryRunSchema = z.object({
    query: z.string(),
    response_text: z.string().describe('La réponse complète générée par le modèle'),
    mentioned_businesses: z.array(z.object({
        name: z.string(),
        position: z.number().int().min(1).describe('Position dans la réponse (1 = premier mentionné)'),
        context: z.string().describe('Extrait du passage où le business est mentionné'),
        is_target: z.boolean().describe('True si c\'est le business suivi'),
        sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
    })),
    total_businesses_mentioned: z.number().int(),
    target_found: z.boolean(),
    target_position: z.number().int().nullable(),
});

/**
 * Schéma pour la validation d'un payload de lancement d'audit.
 */
export const auditRunPayloadSchema = z.object({
    clientId: z.string().uuid().optional(),
    websiteUrl: z.string().url().optional(),
    clientName: z.string().min(1).optional(),
}).refine(
    d => d.clientId || (d.websiteUrl && d.clientName),
    { message: 'clientId OU (websiteUrl + clientName) requis' }
);

/**
 * Schéma pour le payload de query run.
 */
export const queryRunPayloadSchema = z.object({
    clientId: z.string().uuid(),
});

/**
 * Schéma pour l'application d'une merge suggestion.
 */
export const mergeApplyPayloadSchema = z.object({
    mergeSuggestionId: z.string().uuid(),
});
