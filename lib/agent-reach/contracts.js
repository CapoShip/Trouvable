import 'server-only';

import { z } from 'zod';

// ──────────────────────────────────────────────────────────────
// Domain constants
// ──────────────────────────────────────────────────────────────

export const COMMUNITY_SOURCES = ['reddit', 'web', 'github', 'x', 'youtube'];
export const COMMUNITY_RUN_STATUSES = ['pending', 'running', 'completed', 'failed', 'partial'];
export const COMMUNITY_MENTION_TYPES = ['complaint', 'question', 'theme', 'competitor', 'recommendation', 'opportunity', 'language'];
export const COMMUNITY_CLUSTER_TYPES = ['complaint', 'question', 'theme', 'competitor_complaint', 'language', 'source_bucket'];
export const COMMUNITY_OPPORTUNITY_TYPES = ['faq', 'content', 'differentiation', 'positioning', 'response'];
export const COMMUNITY_OPPORTUNITY_STATUSES = ['open', 'acted', 'dismissed', 'expired'];
export const COMMUNITY_EVIDENCE_LEVELS = ['low', 'medium', 'strong'];
export const COMMUNITY_PROVENANCE_LEVELS = ['observed', 'derived', 'inferred'];

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

export function evidenceLevel(count) {
    if (count >= 8) return 'strong';
    if (count >= 4) return 'medium';
    return 'low';
}

// ──────────────────────────────────────────────────────────────
// Zod schemas — collection run
// ──────────────────────────────────────────────────────────────

export const communityCollectionRunSchema = z.object({
    id: z.string().uuid().optional(),
    client_id: z.string().uuid(),
    source: z.enum(COMMUNITY_SOURCES),
    status: z.enum(COMMUNITY_RUN_STATUSES).default('pending'),
    started_at: z.string().nullable().optional(),
    finished_at: z.string().nullable().optional(),
    documents_collected: z.number().int().default(0),
    documents_persisted: z.number().int().default(0),
    documents_skipped: z.number().int().default(0),
    error_message: z.string().nullable().optional(),
    seed_queries: z.array(z.string()).default([]),
    run_context: z.record(z.any()).default({}),
    trigger_source: z.enum(['cron', 'manual', 'retry', 'system']).default('system'),
});

// ──────────────────────────────────────────────────────────────
// Zod schemas — community document (raw + normalized)
// ──────────────────────────────────────────────────────────────

export const communityDocumentSchema = z.object({
    id: z.string().uuid().optional(),
    client_id: z.string().uuid(),
    collection_run_id: z.string().uuid().nullable().optional(),
    source: z.enum(COMMUNITY_SOURCES),
    external_id: z.string().nullable().optional(),
    url: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    body: z.string().nullable().optional(),
    author: z.string().nullable().optional(),
    published_at: z.string().nullable().optional(),
    source_metadata: z.record(z.any()).default({}),
    normalized_content: z.string().nullable().optional(),
    language: z.string().default('fr'),
    engagement_score: z.number().int().default(0),
    seed_query: z.string().nullable().optional(),
    dedupe_hash: z.string().nullable().optional(),
    is_processed: z.boolean().default(false),
});

// ──────────────────────────────────────────────────────────────
// Zod schemas — mention
// ──────────────────────────────────────────────────────────────

export const communityMentionSchema = z.object({
    id: z.string().uuid().optional(),
    client_id: z.string().uuid(),
    document_id: z.string().uuid(),
    mention_type: z.enum(COMMUNITY_MENTION_TYPES),
    label: z.string(),
    snippet: z.string().nullable().optional(),
    evidence_level: z.enum(COMMUNITY_EVIDENCE_LEVELS).default('low'),
    provenance: z.enum(COMMUNITY_PROVENANCE_LEVELS).default('observed'),
    source: z.enum(COMMUNITY_SOURCES),
});

// ──────────────────────────────────────────────────────────────
// Zod schemas — cluster
// ──────────────────────────────────────────────────────────────

export const communityClusterSchema = z.object({
    id: z.string().uuid().optional(),
    client_id: z.string().uuid(),
    cluster_type: z.enum(COMMUNITY_CLUSTER_TYPES),
    label: z.string(),
    mention_count: z.number().int().default(0),
    evidence_level: z.enum(COMMUNITY_EVIDENCE_LEVELS).default('low'),
    sources: z.array(z.string()).default([]),
    example_url: z.string().nullable().optional(),
    example_snippet: z.string().nullable().optional(),
    last_seen_at: z.string().nullable().optional(),
    score: z.number().default(0),
    metadata: z.record(z.any()).default({}),
});

// ──────────────────────────────────────────────────────────────
// Zod schemas — opportunity
// ──────────────────────────────────────────────────────────────

export const communityOpportunitySchema = z.object({
    id: z.string().uuid().optional(),
    client_id: z.string().uuid(),
    opportunity_type: z.enum(COMMUNITY_OPPORTUNITY_TYPES),
    title: z.string(),
    rationale: z.string().nullable().optional(),
    evidence_level: z.enum(COMMUNITY_EVIDENCE_LEVELS).default('low'),
    mention_count: z.number().int().default(0),
    provenance: z.enum(COMMUNITY_PROVENANCE_LEVELS).default('inferred'),
    source_cluster_id: z.string().uuid().nullable().optional(),
    status: z.enum(COMMUNITY_OPPORTUNITY_STATUSES).default('open'),
    metadata: z.record(z.any()).default({}),
});

// ──────────────────────────────────────────────────────────────
// Connection status contract
// ──────────────────────────────────────────────────────────────

export const COMMUNITY_CONNECTION_STATES = ['not_connected', 'connected_empty', 'syncing', 'error', 'active'];

export const communityConnectionStatusSchema = z.object({
    status: z.enum(COMMUNITY_CONNECTION_STATES),
    connector: z.string().default('agent_reach'),
    last_synced_at: z.string().nullable().optional(),
    next_sync_at: z.string().nullable().optional(),
    message: z.string().optional(),
    caveat: z.string().nullable().optional(),
    detail: z.string().nullable().optional(),
});
