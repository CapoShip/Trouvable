import 'server-only';

import { z } from 'zod';
import { registerTask } from './registry.js';

const mentionSchema = z.object({
    mention_type: z.enum(['complaint', 'question', 'theme', 'competitor', 'recommendation', 'opportunity', 'language']),
    label: z.string().min(1).max(500),
    snippet: z.string().max(500).nullable().optional(),
    evidence_level: z.enum(['low', 'medium', 'strong']).default('low'),
    provenance: z.enum(['observed', 'derived', 'inferred']).default('derived'),
});

const outputSchema = z.object({
    mentions: z.array(mentionSchema).default([]),
});

function buildMessages(input) {
    const { documents, clientName, businessType, competitors } = input;

    const docSummaries = documents.map((doc, i) => {
        const title = String(doc.title || '').trim();
        const body = String(doc.body || '').slice(0, 600).trim();
        return `--- Document ${i + 1} (id: ${doc.id}) ---\nTitle: ${title}\nBody: ${body}`;
    }).join('\n\n');

    const competitorList = (competitors || []).length > 0
        ? `Known competitors: ${competitors.join(', ')}`
        : 'No known competitors provided.';

    return [
        {
            role: 'system',
            content: [
                'You are an expert business intelligence analyst.',
                'Your task is to extract structured mentions from community documents (Reddit posts, forum threads).',
                'Classify each mention into one of these types:',
                '- complaint: user expressing dissatisfaction, frustration, or a problem',
                '- question: user asking for advice, recommendations, or how-to information',
                '- theme: recurring topic or keyword relevant to the business domain',
                '- competitor: mention of a competing business, product, or alternative',
                '- recommendation: user recommending a specific business or solution',
                '- language: distinctive phrases or titles with high engagement that reveal user vocabulary',
                '',
                'Rules:',
                '- Only extract mentions that are genuinely present in the text. Never invent mentions.',
                '- A single document may produce 0 to 5 mentions — extract only what is clearly there.',
                '- For each mention, provide a concise label and a relevant snippet (max 300 chars) from the source text.',
                '- Set evidence_level to "medium" when the signal is clear and unambiguous, "low" when it is weak or contextual.',
                '- Set provenance to "observed" for directly stated content, "derived" for inferred patterns.',
                '- Do NOT include the document id in the label or snippet.',
                '- Respond with valid JSON only. No commentary, no markdown fences.',
            ].join('\n'),
        },
        {
            role: 'user',
            content: [
                `Business: ${clientName || 'Unknown'}`,
                `Business type: ${businessType || 'Unknown'}`,
                competitorList,
                '',
                'Documents to analyze:',
                '',
                docSummaries,
                '',
                'Extract all mentions as JSON: { "mentions": [...] }',
            ].join('\n'),
        },
    ];
}

/**
 * Normalizes raw LLM output, attaching document-level fields after classification.
 * Returns the mentions array with document metadata attached.
 */
function normalize(raw, input) {
    const mentions = raw?.mentions || [];
    const { documents, clientId, source } = input;

    // If there's only one document batch, we can map mentions back
    // For multi-doc batches, mentions are document-agnostic from the LLM
    // We attach document_id from the first doc as default, caller overrides per-mention
    const defaultDocId = documents?.[0]?.id || null;
    const defaultSource = source || documents?.[0]?.source || 'reddit';

    return mentions.map((m) => ({
        client_id: clientId,
        document_id: m.document_id || defaultDocId,
        mention_type: m.mention_type,
        label: String(m.label || '').slice(0, 500),
        snippet: m.snippet ? String(m.snippet).slice(0, 500) : null,
        evidence_level: m.evidence_level || 'low',
        provenance: m.provenance || 'derived',
        source: defaultSource,
    }));
}

registerTask({
    taskId: 'community-classify',
    mode: 'json',
    provider: 'mistral',
    fallbackProvider: null,
    purpose: 'query',
    temperature: 0.1,
    maxTokens: 2048,
    buildMessages,
    outputSchema,
    normalize,
});
