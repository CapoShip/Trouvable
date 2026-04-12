import 'server-only';

import { z } from 'zod';
import { registerTask } from './registry.js';

const opportunitySchema = z.object({
    cluster_label: z.string(),
    cluster_type: z.string(),
    opportunity_type: z.string(),
    headline: z.string(),
    rationale: z.string(),
    suggested_action: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    evidence_strength: z.enum(['strong', 'moderate', 'weak']),
});

const outputSchema = z.object({
    opportunities: z.array(opportunitySchema).default([]),
});

function buildMessages(input) {
    const { clientName, businessType, clusters } = input;

    const clusterSummary = clusters.map((c, i) =>
        `${i + 1}. [${c.cluster_type}] "${c.label}" — ${c.mention_count} mentions, sources: ${c.sources?.join(', ') || 'unknown'}`
    ).join('\n');

    return [
        {
            role: 'system',
            content: [
                'You are an expert business strategist specializing in local business visibility and reputation.',
                'Your task is to synthesize raw community intelligence clusters into actionable operator opportunities.',
                '',
                'Rules:',
                '- Each opportunity must be grounded in the cluster data provided. Do NOT invent signals.',
                '- headline: one-line operator-facing summary (clear, direct, jargon-free).',
                '- rationale: 1-2 sentences explaining why this matters, referencing the evidence.',
                '- suggested_action: concrete next step the operator can take.',
                '- priority: based on mention volume and business impact (high = many mentions + high impact).',
                '- evidence_strength: strong (10+ mentions, consistent), moderate (3-9 mentions), weak (1-2 mentions).',
                '- opportunity_type must be one of: response, faq, content, differentiation, recurring_buyer_question, comparison_discussion, recurring_pain_point, response_opportunity, ai_mention_opportunity, content_opportunity.',
                '- Use the expanded types when appropriate: recurring_buyer_question for buyer questions, comparison_discussion for vs/compare threads, recurring_pain_point for strong pain signals, response_opportunity for direct reply threads, ai_mention_opportunity for AI-related topics, content_opportunity for general content angles.',
                '- Write in the same language as the cluster labels (French if labels are French).',
                '- Respond with valid JSON only. No commentary.',
            ].join('\n'),
        },
        {
            role: 'user',
            content: [
                `Business: ${clientName || 'Unknown'} (${businessType || 'local business'})`,
                '',
                'Community clusters:',
                clusterSummary,
                '',
                'Synthesize into opportunities as JSON: { "opportunities": [{ "cluster_label": "...", "cluster_type": "...", "opportunity_type": "response|faq|content|differentiation|recurring_buyer_question|comparison_discussion|recurring_pain_point|response_opportunity|ai_mention_opportunity|content_opportunity", "headline": "...", "rationale": "...", "suggested_action": "...", "priority": "high|medium|low", "evidence_strength": "strong|moderate|weak" }] }',
            ].join('\n'),
        },
    ];
}

function normalize(raw, input) {
    const opportunities = raw?.opportunities || [];
    const validTypes = ['response', 'faq', 'content', 'differentiation', 'recurring_buyer_question', 'comparison_discussion', 'recurring_pain_point', 'response_opportunity', 'ai_mention_opportunity', 'content_opportunity'];

    return opportunities.map((opp) => ({
        cluster_label: String(opp.cluster_label || ''),
        cluster_type: String(opp.cluster_type || ''),
        opportunity_type: validTypes.includes(opp.opportunity_type) ? opp.opportunity_type : 'content',
        headline: String(opp.headline || '').slice(0, 200),
        rationale: String(opp.rationale || '').slice(0, 500),
        suggested_action: String(opp.suggested_action || '').slice(0, 500),
        priority: ['high', 'medium', 'low'].includes(opp.priority) ? opp.priority : 'medium',
        evidence_strength: ['strong', 'moderate', 'weak'].includes(opp.evidence_strength) ? opp.evidence_strength : 'weak',
        client_id: input?.clientId || null,
    }));
}

registerTask({
    taskId: 'community-synthesize',
    mode: 'json',
    provider: 'mistral',
    fallbackProvider: null,
    purpose: 'query',
    temperature: 0.3,
    maxTokens: 3000,
    buildMessages,
    outputSchema,
    normalize,
});
