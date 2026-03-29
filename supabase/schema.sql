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
