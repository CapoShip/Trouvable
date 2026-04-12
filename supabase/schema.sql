-- schema.sql
-- Run this in Supabase SQL editor to initialize the active database tables.

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. LEADS TABLE (Contact Forms)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    business_type TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
    page_path TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT
);

-- Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
-- Note: No policies are added. All writes are done via service_role bypassing RLS.

-- ==========================================
-- 2. CLIENT GEO PROFILES TABLE (SEO/AEO/GEO)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.client_geo_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    client_slug TEXT NOT NULL UNIQUE,
    website_url TEXT NOT NULL,
    business_type TEXT DEFAULT 'LocalBusiness',
    seo_title TEXT,
    seo_description TEXT,
    social_profiles JSONB DEFAULT '[]'::jsonb,
    address JSONB DEFAULT '{}'::jsonb,
    geo_faqs JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT false,
    publication_status TEXT DEFAULT 'draft' CHECK (publication_status IN ('draft', 'published')),
    lifecycle_status TEXT DEFAULT 'prospect' CHECK (lifecycle_status IN ('prospect', 'onboarding', 'active', 'paused', 'archived')),
    archived_at TIMESTAMPTZ,
    social_watch_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Row Level Security
ALTER TABLE public.client_geo_profiles ENABLE ROW LEVEL SECURITY;

-- Ajout de la politique de lecture publique (ANON) pour les profils publiés uniquement
DROP POLICY IF EXISTS "public_read_published_profiles" ON public.client_geo_profiles;
CREATE POLICY "public_read_published_profiles"
ON public.client_geo_profiles
FOR SELECT
TO anon
USING (is_published = true);

-- Note: All writes are done via service_role bypassing RLS.

-- Function and Trigger for auto-updating 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tgr_update_client_geo_profiles_updated_at ON public.client_geo_profiles;
CREATE TRIGGER tgr_update_client_geo_profiles_updated_at
    BEFORE UPDATE ON public.client_geo_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- 3. REMEDIATION SUGGESTIONS TABLE (Admin Review)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.remediation_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    problem_type TEXT NOT NULL CHECK (problem_type IN (
        'missing_faq_for_intent',
        'target_never_found',
        'weak_local_clarity',
        'schema_missing_or_incoherent',
        'job_audit_flaky',
        'job_prompt_rerun_inactive',
        'visibility_declining',
        'ai_crawlers_blocked',
        'llms_txt_missing'
    )),
    problem_source TEXT NOT NULL CHECK (problem_source IN ('geo_runs', 'continuous_jobs', 'action_center', 'audit')),
    severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'applied', 'discarded')),
    prompt_system TEXT NOT NULL,
    prompt_user TEXT NOT NULL,
    ai_output TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.remediation_suggestions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_remediation_suggestions_client_created_at
    ON public.remediation_suggestions (client_id, created_at DESC);

DROP TRIGGER IF EXISTS tgr_update_remediation_suggestions_updated_at ON public.remediation_suggestions;
CREATE TRIGGER tgr_update_remediation_suggestions_updated_at
    BEFORE UPDATE ON public.remediation_suggestions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- 4. COMMUNITY INTELLIGENCE TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.community_collection_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('reddit', 'web', 'github', 'x', 'youtube')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'partial')),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    documents_collected INTEGER NOT NULL DEFAULT 0,
    documents_persisted INTEGER NOT NULL DEFAULT 0,
    documents_skipped INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    seed_queries JSONB NOT NULL DEFAULT '[]'::jsonb,
    run_context JSONB NOT NULL DEFAULT '{}'::jsonb,
    trigger_source TEXT NOT NULL DEFAULT 'system' CHECK (trigger_source IN ('cron', 'manual', 'retry', 'system')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_collection_runs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_community_collection_runs_client
    ON public.community_collection_runs (client_id, source, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_collection_runs_status
    ON public.community_collection_runs (status, created_at DESC);

DROP TRIGGER IF EXISTS tgr_community_collection_runs_updated_at ON public.community_collection_runs;
CREATE TRIGGER tgr_community_collection_runs_updated_at
    BEFORE UPDATE ON public.community_collection_runs
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.community_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    collection_run_id UUID REFERENCES public.community_collection_runs(id) ON DELETE SET NULL,
    source TEXT NOT NULL CHECK (source IN ('reddit', 'web', 'github', 'x', 'youtube')),
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_documents ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS idx_community_documents_dedupe
    ON public.community_documents (client_id, source, dedupe_hash);

CREATE INDEX IF NOT EXISTS idx_community_documents_client_source
    ON public.community_documents (client_id, source, collected_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_documents_unprocessed
    ON public.community_documents (is_processed, created_at)
    WHERE is_processed = false;

DROP TRIGGER IF EXISTS tgr_community_documents_updated_at ON public.community_documents;
CREATE TRIGGER tgr_community_documents_updated_at
    BEFORE UPDATE ON public.community_documents
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.community_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.community_documents(id) ON DELETE CASCADE,
    mention_type TEXT NOT NULL CHECK (mention_type IN ('complaint', 'question', 'theme', 'competitor', 'recommendation', 'opportunity', 'language')),
    label TEXT NOT NULL,
    snippet TEXT,
    evidence_level TEXT NOT NULL DEFAULT 'low' CHECK (evidence_level IN ('low', 'medium', 'strong')),
    provenance TEXT NOT NULL DEFAULT 'observed' CHECK (provenance IN ('observed', 'derived', 'inferred')),
    source TEXT NOT NULL CHECK (source IN ('reddit', 'web', 'github', 'x', 'youtube')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_mentions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_community_mentions_client_type
    ON public.community_mentions (client_id, mention_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_mentions_document
    ON public.community_mentions (document_id);

CREATE TABLE IF NOT EXISTS public.community_clusters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    cluster_type TEXT NOT NULL CHECK (cluster_type IN ('complaint', 'question', 'theme', 'competitor_complaint', 'language', 'source_bucket')),
    label TEXT NOT NULL,
    mention_count INTEGER NOT NULL DEFAULT 0,
    evidence_level TEXT NOT NULL DEFAULT 'low' CHECK (evidence_level IN ('low', 'medium', 'strong')),
    sources JSONB NOT NULL DEFAULT '[]'::jsonb,
    example_url TEXT,
    example_snippet TEXT,
    last_seen_at TIMESTAMPTZ,
    score NUMERIC(10,2) NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_clusters ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS idx_community_clusters_client_type_label
    ON public.community_clusters (client_id, cluster_type, label);

CREATE INDEX IF NOT EXISTS idx_community_clusters_client
    ON public.community_clusters (client_id, cluster_type, score DESC);

DROP TRIGGER IF EXISTS tgr_community_clusters_updated_at ON public.community_clusters;
CREATE TRIGGER tgr_community_clusters_updated_at
    BEFORE UPDATE ON public.community_clusters
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.community_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('faq', 'content', 'differentiation', 'positioning', 'response')),
    title TEXT NOT NULL,
    rationale TEXT,
    evidence_level TEXT NOT NULL DEFAULT 'low' CHECK (evidence_level IN ('low', 'medium', 'strong')),
    mention_count INTEGER NOT NULL DEFAULT 0,
    provenance TEXT NOT NULL DEFAULT 'inferred' CHECK (provenance IN ('observed', 'derived', 'inferred')),
    source_cluster_id UUID REFERENCES public.community_clusters(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acted', 'dismissed', 'expired')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_opportunities ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_community_opportunities_client
    ON public.community_opportunities (client_id, opportunity_type, status);

DROP TRIGGER IF EXISTS tgr_community_opportunities_updated_at ON public.community_opportunities;
CREATE TRIGGER tgr_community_opportunities_updated_at
    BEFORE UPDATE ON public.community_opportunities
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- ── AI Task Runs ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ai_task_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.client_geo_profiles(id) ON DELETE SET NULL,
    task_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    input_hash TEXT,
    input_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    usage_tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
    latency_ms INTEGER,
    error_message TEXT,
    error_class TEXT,
    validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'partial', 'invalid')),
    validation_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    trigger_source TEXT NOT NULL DEFAULT 'system' CHECK (trigger_source IN ('cron', 'manual', 'pipeline', 'system')),
    parent_run_id UUID REFERENCES public.ai_task_runs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_task_runs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_task_runs_client_task
    ON public.ai_task_runs (client_id, task_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_task_runs_status
    ON public.ai_task_runs (status, created_at DESC)
    WHERE status = 'failed';

CREATE INDEX IF NOT EXISTS idx_ai_task_runs_parent
    ON public.ai_task_runs (parent_run_id)
    WHERE parent_run_id IS NOT NULL;
