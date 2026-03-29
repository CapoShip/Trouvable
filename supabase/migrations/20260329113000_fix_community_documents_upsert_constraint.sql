-- Migration: fix community_documents upsert constraint
-- Date: 2026-03-29
-- Risk: LOW
-- Rollback: recreate the previous partial unique index with WHERE dedupe_hash IS NOT NULL

DROP INDEX IF EXISTS public.idx_community_documents_dedupe;

CREATE UNIQUE INDEX IF NOT EXISTS idx_community_documents_dedupe
    ON public.community_documents (client_id, source, dedupe_hash);