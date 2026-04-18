-- Phase 1 schema alignment
-- Canonicalizes the tables and columns the app currently uses in code.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
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

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.rate_limits (
    ip TEXT PRIMARY KEY,
    window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    request_count INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
    client_ip TEXT,
    max_requests INTEGER,
    window_minutes INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_count INTEGER;
BEGIN
    IF random() < 0.05 THEN
        DELETE FROM public.rate_limits
        WHERE window_start < NOW() - (window_minutes || ' minutes')::interval;
    END IF;

    INSERT INTO public.rate_limits (ip, window_start, request_count)
    VALUES (client_ip, NOW(), 1)
    ON CONFLICT (ip) DO UPDATE
    SET
        request_count = CASE
            WHEN public.rate_limits.window_start < NOW() - (window_minutes || ' minutes')::interval THEN 1
            ELSE public.rate_limits.request_count + 1
        END,
        window_start = CASE
            WHEN public.rate_limits.window_start < NOW() - (window_minutes || ' minutes')::interval THEN NOW()
            ELSE public.rate_limits.window_start
        END
    RETURNING request_count INTO current_count;

    RETURN current_count > max_requests;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, int, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_rate_limit(text, int, int) FROM anon;
REVOKE ALL ON FUNCTION public.check_rate_limit(text, int, int) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, int, int) TO service_role;

CREATE TABLE IF NOT EXISTS public.client_geo_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    client_slug TEXT NOT NULL,
    website_url TEXT NOT NULL,
    business_type TEXT DEFAULT 'LocalBusiness',
    seo_title TEXT,
    seo_description TEXT,
    social_profiles JSONB NOT NULL DEFAULT '[]'::jsonb,
    address JSONB NOT NULL DEFAULT '{}'::jsonb,
    geo_faqs JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_published BOOLEAN NOT NULL DEFAULT false,
    publication_status TEXT NOT NULL DEFAULT 'draft',
    contact_info JSONB NOT NULL DEFAULT '{}'::jsonb,
    business_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    seo_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    geo_ai_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    internal_notes TEXT NOT NULL DEFAULT '',
    archived_at TIMESTAMPTZ,
    notes TEXT,
    target_region TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_geo_profiles
    ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'LocalBusiness',
    ADD COLUMN IF NOT EXISTS seo_title TEXT,
    ADD COLUMN IF NOT EXISTS seo_description TEXT,
    ADD COLUMN IF NOT EXISTS social_profiles JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS address JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS geo_faqs JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS publication_status TEXT NOT NULL DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS contact_info JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS business_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS seo_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS geo_ai_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS internal_notes TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS target_region TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.client_geo_profiles
    DROP CONSTRAINT IF EXISTS client_geo_profiles_publication_status_check;

ALTER TABLE public.client_geo_profiles
    ADD CONSTRAINT client_geo_profiles_publication_status_check
    CHECK (publication_status IN ('draft', 'ready', 'published'));

UPDATE public.client_geo_profiles
SET
    social_profiles = COALESCE(social_profiles, '[]'::jsonb),
    address = COALESCE(address, '{}'::jsonb),
    geo_faqs = COALESCE(geo_faqs, '[]'::jsonb),
    contact_info = COALESCE(contact_info, '{}'::jsonb),
    business_details = COALESCE(business_details, '{}'::jsonb),
    seo_data = COALESCE(seo_data, '{}'::jsonb),
    geo_ai_data = COALESCE(geo_ai_data, '{}'::jsonb),
    internal_notes = COALESCE(internal_notes, ''),
    publication_status = CASE
        WHEN publication_status IN ('draft', 'ready', 'published') THEN publication_status
        WHEN is_published = true THEN 'published'
        ELSE 'draft'
    END;

UPDATE public.client_geo_profiles
SET is_published = (publication_status = 'published');

UPDATE public.client_geo_profiles
SET contact_info = jsonb_set(
    contact_info,
    '{public_email}',
    to_jsonb(contact_info ->> 'email'),
    true
)
WHERE COALESCE(contact_info ->> 'public_email', '') = ''
  AND COALESCE(contact_info ->> 'email', '') <> '';

UPDATE public.client_geo_profiles
SET business_details = jsonb_set(
    business_details,
    '{short_desc}',
    to_jsonb(business_details ->> 'short_description'),
    true
)
WHERE COALESCE(business_details ->> 'short_desc', '') = ''
  AND COALESCE(business_details ->> 'short_description', '') <> '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_geo_profiles_client_slug
    ON public.client_geo_profiles (client_slug);

CREATE INDEX IF NOT EXISTS idx_client_geo_profiles_archived_at
    ON public.client_geo_profiles (archived_at);

ALTER TABLE public.client_geo_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read_published_profiles ON public.client_geo_profiles;
CREATE POLICY public_read_published_profiles
ON public.client_geo_profiles
FOR SELECT
TO anon
USING (is_published = true);

DROP TRIGGER IF EXISTS tgr_update_client_geo_profiles_updated_at ON public.client_geo_profiles;
CREATE TRIGGER tgr_update_client_geo_profiles_updated_at
    BEFORE UPDATE ON public.client_geo_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.client_site_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL,
    resolved_url TEXT,
    audit_version TEXT DEFAULT '1.0',
    scan_status TEXT DEFAULT 'pending',
    scanned_pages JSONB NOT NULL DEFAULT '[]'::jsonb,
    seo_score INTEGER DEFAULT 0,
    geo_score INTEGER DEFAULT 0,
    seo_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    geo_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    extracted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    issues JSONB NOT NULL DEFAULT '[]'::jsonb,
    strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
    prefill_suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_site_audits
    ADD COLUMN IF NOT EXISTS source_url TEXT,
    ADD COLUMN IF NOT EXISTS resolved_url TEXT,
    ADD COLUMN IF NOT EXISTS audit_version TEXT DEFAULT '1.0',
    ADD COLUMN IF NOT EXISTS scan_status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS scanned_pages JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS geo_score INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS seo_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS geo_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS extracted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS issues JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS prefill_suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS error_message TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.client_site_audits
    ALTER COLUMN prefill_suggestions SET DEFAULT '[]'::jsonb;

UPDATE public.client_site_audits
SET prefill_suggestions = CASE
    WHEN prefill_suggestions IS NULL THEN '[]'::jsonb
    WHEN prefill_suggestions = '{}'::jsonb THEN '[]'::jsonb
    ELSE prefill_suggestions
END;

ALTER TABLE public.client_site_audits
    DROP CONSTRAINT IF EXISTS client_site_audits_scan_status_check;

ALTER TABLE public.client_site_audits
    ADD CONSTRAINT client_site_audits_scan_status_check
    CHECK (scan_status IN ('pending', 'running', 'success', 'partial_error', 'failed'));

CREATE INDEX IF NOT EXISTS idx_client_site_audits_client_id_created_at
    ON public.client_site_audits (client_id, created_at DESC);

ALTER TABLE public.client_site_audits ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.tracked_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    locale TEXT DEFAULT 'fr-CA',
    query_type TEXT DEFAULT 'general',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tracked_queries
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
    ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'fr-CA',
    ADD COLUMN IF NOT EXISTS query_type TEXT DEFAULT 'general',
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_tracked_queries_client_id
    ON public.tracked_queries (client_id);

ALTER TABLE public.tracked_queries ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tgr_tracked_queries_updated_at ON public.tracked_queries;
CREATE TRIGGER tgr_tracked_queries_updated_at
    BEFORE UPDATE ON public.tracked_queries
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.query_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    tracked_query_id UUID REFERENCES public.tracked_queries(id) ON DELETE SET NULL,
    query_text TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    response_text TEXT,
    target_found BOOLEAN NOT NULL DEFAULT false,
    target_position INTEGER,
    total_mentioned INTEGER NOT NULL DEFAULT 0,
    raw_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    parsed_response JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.query_runs
    ADD COLUMN IF NOT EXISTS response_text TEXT,
    ADD COLUMN IF NOT EXISTS target_found BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS target_position INTEGER,
    ADD COLUMN IF NOT EXISTS total_mentioned INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS raw_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS parsed_response JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.query_runs
SET status = 'completed'
WHERE status IS NULL;

ALTER TABLE public.query_runs
    DROP CONSTRAINT IF EXISTS query_runs_status_check;

ALTER TABLE public.query_runs
    ADD CONSTRAINT query_runs_status_check
    CHECK (status IN ('pending', 'running', 'completed', 'failed'));

CREATE INDEX IF NOT EXISTS idx_query_runs_client_id
    ON public.query_runs (client_id);

ALTER TABLE public.query_runs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.query_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_run_id UUID NOT NULL REFERENCES public.query_runs(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    position INTEGER NOT NULL,
    context TEXT,
    is_target BOOLEAN NOT NULL DEFAULT false,
    sentiment TEXT DEFAULT 'neutral',
    entity_type TEXT NOT NULL DEFAULT 'business',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.query_mentions
    ADD COLUMN IF NOT EXISTS context TEXT,
    ADD COLUMN IF NOT EXISTS is_target BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS sentiment TEXT DEFAULT 'neutral',
    ADD COLUMN IF NOT EXISTS entity_type TEXT NOT NULL DEFAULT 'business',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.query_mentions
SET entity_type = 'business'
WHERE entity_type IS NULL;

ALTER TABLE public.query_mentions
    DROP CONSTRAINT IF EXISTS query_mentions_entity_type_check;

ALTER TABLE public.query_mentions
    ADD CONSTRAINT query_mentions_entity_type_check
    CHECK (entity_type IN ('business', 'competitor', 'source'));

CREATE INDEX IF NOT EXISTS idx_query_mentions_query_run_id
    ON public.query_mentions (query_run_id);

ALTER TABLE public.query_mentions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    audit_id UUID REFERENCES public.client_site_audits(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium',
    category TEXT DEFAULT 'general',
    source TEXT NOT NULL DEFAULT 'recommended',
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.opportunities
    ADD COLUMN IF NOT EXISTS audit_id UUID REFERENCES public.client_site_audits(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium',
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
    ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'recommended',
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Fix legacy numeric priority columns before adding text CHECK constraints
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'opportunities'
          AND column_name = 'priority'
          AND data_type IN ('smallint', 'integer', 'bigint', 'numeric', 'real', 'double precision')
    ) THEN
        ALTER TABLE public.opportunities
            ALTER COLUMN priority DROP DEFAULT;

        ALTER TABLE public.opportunities
            ALTER COLUMN priority TYPE TEXT
            USING CASE
                WHEN priority::text = '3' THEN 'high'
                WHEN priority::text = '2' THEN 'medium'
                WHEN priority::text = '1' THEN 'low'
                ELSE 'medium'
            END;

        ALTER TABLE public.opportunities
            ALTER COLUMN priority SET DEFAULT 'medium';
    END IF;
END $$;

ALTER TABLE public.opportunities
    DROP CONSTRAINT IF EXISTS opportunities_priority_check;

ALTER TABLE public.opportunities
    ADD CONSTRAINT opportunities_priority_check
    CHECK (priority IN ('high', 'medium', 'low'));

ALTER TABLE public.opportunities
    DROP CONSTRAINT IF EXISTS opportunities_source_check;

ALTER TABLE public.opportunities
    ADD CONSTRAINT opportunities_source_check
    CHECK (source IN ('observed', 'inferred', 'recommended'));

ALTER TABLE public.opportunities
    DROP CONSTRAINT IF EXISTS opportunities_status_check;

ALTER TABLE public.opportunities
    ADD CONSTRAINT opportunities_status_check
    CHECK (status IN ('open', 'in_progress', 'done', 'dismissed'));

CREATE INDEX IF NOT EXISTS idx_opportunities_client_id
    ON public.opportunities (client_id);

CREATE INDEX IF NOT EXISTS idx_opportunities_audit_id
    ON public.opportunities (audit_id);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.merge_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    audit_id UUID REFERENCES public.client_site_audits(id) ON DELETE SET NULL,
    field_name TEXT NOT NULL,
    current_value TEXT,
    suggested_value TEXT NOT NULL,
    confidence TEXT NOT NULL DEFAULT 'medium',
    rationale TEXT,
    source TEXT NOT NULL DEFAULT 'recommended',
    status TEXT NOT NULL DEFAULT 'pending',
    applied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.merge_suggestions
    ADD COLUMN IF NOT EXISTS audit_id UUID REFERENCES public.client_site_audits(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS field_name TEXT,
    ADD COLUMN IF NOT EXISTS current_value TEXT,
    ADD COLUMN IF NOT EXISTS suggested_value TEXT,
    ADD COLUMN IF NOT EXISTS confidence TEXT NOT NULL DEFAULT 'medium',
    ADD COLUMN IF NOT EXISTS rationale TEXT,
    ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'recommended',
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Fix legacy numeric confidence columns before adding text CHECK constraints
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'merge_suggestions'
          AND column_name = 'confidence'
          AND data_type IN ('smallint', 'integer', 'bigint', 'numeric', 'real', 'double precision')
    ) THEN
        ALTER TABLE public.merge_suggestions
            ALTER COLUMN confidence DROP DEFAULT;

        ALTER TABLE public.merge_suggestions
            ALTER COLUMN confidence TYPE TEXT
            USING CASE
                WHEN confidence::text = '3' THEN 'high'
                WHEN confidence::text = '2' THEN 'medium'
                WHEN confidence::text = '1' THEN 'low'
                ELSE 'medium'
            END;

        ALTER TABLE public.merge_suggestions
            ALTER COLUMN confidence SET DEFAULT 'medium';
    END IF;
END $$;

ALTER TABLE public.merge_suggestions
    DROP CONSTRAINT IF EXISTS merge_suggestions_confidence_check;

ALTER TABLE public.merge_suggestions
    ADD CONSTRAINT merge_suggestions_confidence_check
    CHECK (confidence IN ('high', 'medium', 'low'));

ALTER TABLE public.merge_suggestions
    DROP CONSTRAINT IF EXISTS merge_suggestions_source_check;

ALTER TABLE public.merge_suggestions
    ADD CONSTRAINT merge_suggestions_source_check
    CHECK (source IN ('observed', 'inferred', 'recommended'));

ALTER TABLE public.merge_suggestions
    DROP CONSTRAINT IF EXISTS merge_suggestions_status_check;

ALTER TABLE public.merge_suggestions
    ADD CONSTRAINT merge_suggestions_status_check
    CHECK (status IN ('pending', 'applied', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_merge_suggestions_client_id
    ON public.merge_suggestions (client_id);

CREATE INDEX IF NOT EXISTS idx_merge_suggestions_audit_id
    ON public.merge_suggestions (audit_id);

ALTER TABLE public.merge_suggestions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    performed_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.actions
    ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS performed_by TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_actions_client_id
    ON public.actions (client_id);

ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.client_portal_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    contact_email TEXT NOT NULL,
    clerk_user_id TEXT,
    member_type TEXT NOT NULL DEFAULT 'client_contact',
    portal_role TEXT NOT NULL DEFAULT 'viewer',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_portal_access
    ADD COLUMN IF NOT EXISTS clerk_user_id TEXT,
    ADD COLUMN IF NOT EXISTS member_type TEXT NOT NULL DEFAULT 'client_contact',
    ADD COLUMN IF NOT EXISTS portal_role TEXT NOT NULL DEFAULT 'viewer',
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.client_portal_access
SET contact_email = lower(btrim(contact_email))
WHERE contact_email IS NOT NULL;

ALTER TABLE public.client_portal_access
    DROP CONSTRAINT IF EXISTS client_portal_access_member_type_check;

ALTER TABLE public.client_portal_access
    ADD CONSTRAINT client_portal_access_member_type_check
    CHECK (member_type IN ('client_contact', 'client_staff', 'internal_staff'));

ALTER TABLE public.client_portal_access
    DROP CONSTRAINT IF EXISTS client_portal_access_portal_role_check;

ALTER TABLE public.client_portal_access
    ADD CONSTRAINT client_portal_access_portal_role_check
    CHECK (portal_role IN ('owner', 'viewer'));

ALTER TABLE public.client_portal_access
    DROP CONSTRAINT IF EXISTS client_portal_access_status_check;

ALTER TABLE public.client_portal_access
    ADD CONSTRAINT client_portal_access_status_check
    CHECK (status IN ('active', 'revoked'));

ALTER TABLE public.client_portal_access
    DROP CONSTRAINT IF EXISTS client_portal_access_contact_email_normalized_check;

ALTER TABLE public.client_portal_access
    ADD CONSTRAINT client_portal_access_contact_email_normalized_check
    CHECK (contact_email = lower(btrim(contact_email)));

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_portal_access_client_email
    ON public.client_portal_access (client_id, contact_email);

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_portal_access_client_clerk
    ON public.client_portal_access (client_id, clerk_user_id)
    WHERE clerk_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_client_portal_access_contact_email
    ON public.client_portal_access (contact_email);

CREATE INDEX IF NOT EXISTS idx_client_portal_access_active_contact_email
    ON public.client_portal_access (contact_email)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_client_portal_access_active_clerk_user_id
    ON public.client_portal_access (clerk_user_id)
    WHERE status = 'active' AND clerk_user_id IS NOT NULL;

ALTER TABLE public.client_portal_access ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tgr_client_portal_access_updated_at ON public.client_portal_access;
CREATE TRIGGER tgr_client_portal_access_updated_at
    BEFORE UPDATE ON public.client_portal_access
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();