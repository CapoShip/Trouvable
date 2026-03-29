-- Bloc 6: Agent-Reach / Community Intelligence foundation
-- Creates the persistence layer for community collection, documents, mentions,
-- clusters, opportunities, and collection runs.
-- Extends connector and job CHECK constraints for the agent_reach provider and community_sync job.

-- ============================================================================
-- 1. community_collection_runs — tracks each collection execution
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.community_collection_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    documents_collected INTEGER NOT NULL DEFAULT 0,
    documents_persisted INTEGER NOT NULL DEFAULT 0,
    documents_skipped INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    seed_queries JSONB NOT NULL DEFAULT '[]'::jsonb,
    run_context JSONB NOT NULL DEFAULT '{}'::jsonb,
    trigger_source TEXT NOT NULL DEFAULT 'system',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT community_collection_runs_source_check
        CHECK (source IN ('reddit', 'web', 'github', 'x', 'youtube')),
    CONSTRAINT community_collection_runs_status_check
        CHECK (status IN ('pending', 'running', 'completed', 'failed', 'partial')),
    CONSTRAINT community_collection_runs_trigger_check
        CHECK (trigger_source IN ('cron', 'manual', 'retry', 'system'))
);

CREATE INDEX IF NOT EXISTS idx_community_collection_runs_client
    ON public.community_collection_runs (client_id, source, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_collection_runs_status
    ON public.community_collection_runs (status, created_at DESC);

ALTER TABLE public.community_collection_runs ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tgr_community_collection_runs_updated_at ON public.community_collection_runs;
CREATE TRIGGER tgr_community_collection_runs_updated_at
    BEFORE UPDATE ON public.community_collection_runs
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- ============================================================================
-- 2. community_documents — raw + normalized community content
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.community_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    collection_run_id UUID REFERENCES public.community_collection_runs(id) ON DELETE SET NULL,
    source TEXT NOT NULL,
    external_id TEXT,
    url TEXT,
    title TEXT,
    body TEXT,
    author TEXT,
    published_at TIMESTAMPTZ,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    source_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    normalized_content TEXT,
    language TEXT DEFAULT 'fr',
    engagement_score INTEGER NOT NULL DEFAULT 0,
    seed_query TEXT,
    dedupe_hash TEXT,
    is_processed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT community_documents_source_check
        CHECK (source IN ('reddit', 'web', 'github', 'x', 'youtube'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_community_documents_dedupe
    ON public.community_documents (client_id, source, dedupe_hash)
    WHERE dedupe_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_community_documents_client_source
    ON public.community_documents (client_id, source, collected_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_documents_unprocessed
    ON public.community_documents (is_processed, created_at)
    WHERE is_processed = false;

ALTER TABLE public.community_documents ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tgr_community_documents_updated_at ON public.community_documents;
CREATE TRIGGER tgr_community_documents_updated_at
    BEFORE UPDATE ON public.community_documents
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- ============================================================================
-- 3. community_mentions — extracted mention signals from documents
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.community_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.community_documents(id) ON DELETE CASCADE,
    mention_type TEXT NOT NULL,
    label TEXT NOT NULL,
    snippet TEXT,
    evidence_level TEXT NOT NULL DEFAULT 'low',
    provenance TEXT NOT NULL DEFAULT 'observed',
    source TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT community_mentions_type_check
        CHECK (mention_type IN ('complaint', 'question', 'theme', 'competitor', 'recommendation', 'opportunity', 'language')),
    CONSTRAINT community_mentions_evidence_check
        CHECK (evidence_level IN ('low', 'medium', 'strong')),
    CONSTRAINT community_mentions_provenance_check
        CHECK (provenance IN ('observed', 'derived', 'inferred')),
    CONSTRAINT community_mentions_source_check
        CHECK (source IN ('reddit', 'web', 'github', 'x', 'youtube'))
);

CREATE INDEX IF NOT EXISTS idx_community_mentions_client_type
    ON public.community_mentions (client_id, mention_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_mentions_document
    ON public.community_mentions (document_id);

ALTER TABLE public.community_mentions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. community_clusters — aggregated theme/topic clusters
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.community_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    cluster_type TEXT NOT NULL,
    label TEXT NOT NULL,
    mention_count INTEGER NOT NULL DEFAULT 0,
    evidence_level TEXT NOT NULL DEFAULT 'low',
    sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    example_url TEXT,
    example_snippet TEXT,
    last_seen_at TIMESTAMPTZ,
    score NUMERIC(5,2) NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT community_clusters_type_check
        CHECK (cluster_type IN ('complaint', 'question', 'theme', 'competitor_complaint', 'language', 'source_bucket')),
    CONSTRAINT community_clusters_evidence_check
        CHECK (evidence_level IN ('low', 'medium', 'strong'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_community_clusters_client_type_label
    ON public.community_clusters (client_id, cluster_type, label);

CREATE INDEX IF NOT EXISTS idx_community_clusters_client
    ON public.community_clusters (client_id, cluster_type, score DESC);

ALTER TABLE public.community_clusters ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tgr_community_clusters_updated_at ON public.community_clusters;
CREATE TRIGGER tgr_community_clusters_updated_at
    BEFORE UPDATE ON public.community_clusters
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- ============================================================================
-- 5. community_opportunities — actionable opportunities derived from community data
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.community_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    opportunity_type TEXT NOT NULL,
    title TEXT NOT NULL,
    rationale TEXT,
    evidence_level TEXT NOT NULL DEFAULT 'low',
    mention_count INTEGER NOT NULL DEFAULT 0,
    provenance TEXT NOT NULL DEFAULT 'inferred',
    source_cluster_id UUID REFERENCES public.community_clusters(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'open',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT community_opportunities_type_check
        CHECK (opportunity_type IN ('faq', 'content', 'differentiation', 'positioning', 'response')),
    CONSTRAINT community_opportunities_evidence_check
        CHECK (evidence_level IN ('low', 'medium', 'strong')),
    CONSTRAINT community_opportunities_provenance_check
        CHECK (provenance IN ('observed', 'derived', 'inferred')),
    CONSTRAINT community_opportunities_status_check
        CHECK (status IN ('open', 'acted', 'dismissed', 'expired'))
);

CREATE INDEX IF NOT EXISTS idx_community_opportunities_client
    ON public.community_opportunities (client_id, opportunity_type, status);

ALTER TABLE public.community_opportunities ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tgr_community_opportunities_updated_at ON public.community_opportunities;
CREATE TRIGGER tgr_community_opportunities_updated_at
    BEFORE UPDATE ON public.community_opportunities
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- ============================================================================
-- 6. Extend connector CHECK to include agent_reach
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'client_data_connectors_provider_check'
          AND conrelid = 'public.client_data_connectors'::regclass
    ) THEN
        ALTER TABLE public.client_data_connectors
            DROP CONSTRAINT client_data_connectors_provider_check;
    END IF;

    ALTER TABLE public.client_data_connectors
        ADD CONSTRAINT client_data_connectors_provider_check
        CHECK (provider IN ('ga4', 'gsc', 'agent_reach'));
END
$$;

-- ============================================================================
-- 7. Extend recurring_jobs job_type CHECK to include community_sync
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'recurring_jobs_job_type_check'
          AND conrelid = 'public.recurring_jobs'::regclass
    ) THEN
        ALTER TABLE public.recurring_jobs
            DROP CONSTRAINT recurring_jobs_job_type_check;
    END IF;

    ALTER TABLE public.recurring_jobs
        ADD CONSTRAINT recurring_jobs_job_type_check
        CHECK (job_type IN ('audit_refresh', 'prompt_rerun', 'gsc_sync_daily', 'ga4_sync_daily', 'community_sync'));
END
$$;

-- ============================================================================
-- 8. Extend recurring_job_runs job_type CHECK to include community_sync
-- ============================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'recurring_job_runs_job_type_check'
          AND conrelid = 'public.recurring_job_runs'::regclass
    ) THEN
        ALTER TABLE public.recurring_job_runs
            DROP CONSTRAINT recurring_job_runs_job_type_check;
    END IF;

    ALTER TABLE public.recurring_job_runs
        ADD CONSTRAINT recurring_job_runs_job_type_check
        CHECK (job_type IN ('audit_refresh', 'prompt_rerun', 'gsc_sync_daily', 'ga4_sync_daily', 'community_sync'));
END
$$;
