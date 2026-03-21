-- Comprehensive DB/code reconciliation for the current Trouvable app.
-- This migration is intentionally defensive and idempotent.

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
    status TEXT NOT NULL DEFAULT 'new',
    page_path TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT
);

ALTER TABLE public.leads
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS business_type TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new',
    ADD COLUMN IF NOT EXISTS page_path TEXT,
    ADD COLUMN IF NOT EXISTS utm_source TEXT,
    ADD COLUMN IF NOT EXISTS utm_medium TEXT,
    ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

UPDATE public.leads
SET
    status = CASE
        WHEN status IN ('new', 'contacted', 'closed') THEN status
        ELSE 'new'
    END,
    created_at = COALESCE(created_at, now());

ALTER TABLE public.leads
    DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE public.leads
    ADD CONSTRAINT leads_status_check
    CHECK (status IN ('new', 'contacted', 'closed'));

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.rate_limits (
    ip TEXT PRIMARY KEY,
    window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    request_count INTEGER NOT NULL DEFAULT 1
);

ALTER TABLE public.rate_limits
    ADD COLUMN IF NOT EXISTS window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS request_count INTEGER NOT NULL DEFAULT 1;

UPDATE public.rate_limits
SET
    window_start = COALESCE(window_start, now()),
    request_count = COALESCE(request_count, 1);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start
    ON public.rate_limits(window_start);

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
    ALTER COLUMN business_type SET DEFAULT 'LocalBusiness',
    ALTER COLUMN social_profiles SET DEFAULT '[]'::jsonb,
    ALTER COLUMN address SET DEFAULT '{}'::jsonb,
    ALTER COLUMN geo_faqs SET DEFAULT '[]'::jsonb,
    ALTER COLUMN is_published SET DEFAULT false,
    ALTER COLUMN publication_status SET DEFAULT 'draft',
    ALTER COLUMN contact_info SET DEFAULT '{}'::jsonb,
    ALTER COLUMN business_details SET DEFAULT '{}'::jsonb,
    ALTER COLUMN seo_data SET DEFAULT '{}'::jsonb,
    ALTER COLUMN geo_ai_data SET DEFAULT '{}'::jsonb,
    ALTER COLUMN internal_notes SET DEFAULT '',
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN updated_at SET DEFAULT now();

UPDATE public.client_geo_profiles
SET
    business_type = COALESCE(NULLIF(BTRIM(business_type), ''), 'LocalBusiness'),
    social_profiles = CASE
        WHEN social_profiles IS NULL OR jsonb_typeof(social_profiles) <> 'array' THEN '[]'::jsonb
        ELSE social_profiles
    END,
    address = CASE
        WHEN address IS NULL OR jsonb_typeof(address) <> 'object' THEN '{}'::jsonb
        ELSE address
    END,
    geo_faqs = CASE
        WHEN geo_faqs IS NULL OR jsonb_typeof(geo_faqs) <> 'array' THEN '[]'::jsonb
        ELSE geo_faqs
    END,
    contact_info = CASE
        WHEN contact_info IS NULL OR jsonb_typeof(contact_info) <> 'object' THEN '{}'::jsonb
        ELSE contact_info
    END,
    business_details = CASE
        WHEN business_details IS NULL OR jsonb_typeof(business_details) <> 'object' THEN '{}'::jsonb
        ELSE business_details
    END,
    seo_data = CASE
        WHEN seo_data IS NULL OR jsonb_typeof(seo_data) <> 'object' THEN '{}'::jsonb
        ELSE seo_data
    END,
    geo_ai_data = CASE
        WHEN geo_ai_data IS NULL OR jsonb_typeof(geo_ai_data) <> 'object' THEN '{}'::jsonb
        ELSE geo_ai_data
    END,
    internal_notes = COALESCE(internal_notes, ''),
    publication_status = CASE
        WHEN publication_status IN ('draft', 'ready', 'published') THEN publication_status
        WHEN is_published = true THEN 'published'
        ELSE 'draft'
    END,
    created_at = COALESCE(created_at, now()),
    updated_at = COALESCE(updated_at, now());

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
SET contact_info = jsonb_set(
    contact_info,
    '{email}',
    to_jsonb(contact_info ->> 'public_email'),
    true
)
WHERE COALESCE(contact_info ->> 'email', '') = ''
  AND COALESCE(contact_info ->> 'public_email', '') <> '';

UPDATE public.client_geo_profiles
SET business_details = jsonb_set(
    business_details,
    '{short_desc}',
    to_jsonb(business_details ->> 'short_description'),
    true
)
WHERE COALESCE(business_details ->> 'short_desc', '') = ''
  AND COALESCE(business_details ->> 'short_description', '') <> '';

UPDATE public.client_geo_profiles
SET business_details = jsonb_set(
    business_details,
    '{short_description}',
    to_jsonb(business_details ->> 'short_desc'),
    true
)
WHERE COALESCE(business_details ->> 'short_description', '') = ''
  AND COALESCE(business_details ->> 'short_desc', '') <> '';

ALTER TABLE public.client_geo_profiles
    DROP CONSTRAINT IF EXISTS client_geo_profiles_publication_status_check;

ALTER TABLE public.client_geo_profiles
    ADD CONSTRAINT client_geo_profiles_publication_status_check
    CHECK (publication_status IN ('draft', 'ready', 'published'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_geo_profiles_client_slug
    ON public.client_geo_profiles (client_slug);

CREATE INDEX IF NOT EXISTS idx_client_geo_profiles_archived_at
    ON public.client_geo_profiles (archived_at);

CREATE INDEX IF NOT EXISTS idx_client_geo_profiles_archived_updated_at
    ON public.client_geo_profiles (archived_at, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_geo_profiles_published_updated_at
    ON public.client_geo_profiles (updated_at DESC)
    WHERE is_published = true;

ALTER TABLE public.client_geo_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read_published_profiles ON public.client_geo_profiles;
CREATE POLICY public_read_published_profiles
ON public.client_geo_profiles
FOR SELECT
TO anon
USING (is_published = true);

CREATE OR REPLACE FUNCTION public.sync_client_geo_profiles_compatibility()
RETURNS trigger AS $$
DECLARE
    next_public_email TEXT;
    next_short_desc TEXT;
BEGIN
    NEW.business_type := COALESCE(NULLIF(BTRIM(NEW.business_type), ''), 'LocalBusiness');
    NEW.social_profiles := CASE
        WHEN NEW.social_profiles IS NULL OR jsonb_typeof(NEW.social_profiles) <> 'array' THEN '[]'::jsonb
        ELSE NEW.social_profiles
    END;
    NEW.address := CASE
        WHEN NEW.address IS NULL OR jsonb_typeof(NEW.address) <> 'object' THEN '{}'::jsonb
        ELSE NEW.address
    END;
    NEW.geo_faqs := CASE
        WHEN NEW.geo_faqs IS NULL OR jsonb_typeof(NEW.geo_faqs) <> 'array' THEN '[]'::jsonb
        ELSE NEW.geo_faqs
    END;
    NEW.contact_info := CASE
        WHEN NEW.contact_info IS NULL OR jsonb_typeof(NEW.contact_info) <> 'object' THEN '{}'::jsonb
        ELSE NEW.contact_info
    END;
    NEW.business_details := CASE
        WHEN NEW.business_details IS NULL OR jsonb_typeof(NEW.business_details) <> 'object' THEN '{}'::jsonb
        ELSE NEW.business_details
    END;
    NEW.seo_data := CASE
        WHEN NEW.seo_data IS NULL OR jsonb_typeof(NEW.seo_data) <> 'object' THEN '{}'::jsonb
        ELSE NEW.seo_data
    END;
    NEW.geo_ai_data := CASE
        WHEN NEW.geo_ai_data IS NULL OR jsonb_typeof(NEW.geo_ai_data) <> 'object' THEN '{}'::jsonb
        ELSE NEW.geo_ai_data
    END;
    NEW.internal_notes := COALESCE(NEW.internal_notes, '');

    next_public_email := COALESCE(
        NULLIF(BTRIM(NEW.contact_info ->> 'public_email'), ''),
        NULLIF(BTRIM(NEW.contact_info ->> 'email'), '')
    );

    IF next_public_email IS NOT NULL THEN
        NEW.contact_info := jsonb_set(NEW.contact_info, '{public_email}', to_jsonb(next_public_email), true);
        NEW.contact_info := jsonb_set(NEW.contact_info, '{email}', to_jsonb(next_public_email), true);
    END IF;

    next_short_desc := COALESCE(
        NULLIF(BTRIM(NEW.business_details ->> 'short_desc'), ''),
        NULLIF(BTRIM(NEW.business_details ->> 'short_description'), '')
    );

    IF next_short_desc IS NOT NULL THEN
        NEW.business_details := jsonb_set(NEW.business_details, '{short_desc}', to_jsonb(next_short_desc), true);
        NEW.business_details := jsonb_set(NEW.business_details, '{short_description}', to_jsonb(next_short_desc), true);
    END IF;

    IF NEW.publication_status IS NULL OR NEW.publication_status NOT IN ('draft', 'ready', 'published') THEN
        NEW.publication_status := CASE
            WHEN COALESCE(NEW.is_published, false) THEN 'published'
            ELSE 'draft'
        END;
    END IF;

    NEW.is_published := (NEW.publication_status = 'published');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tgr_sync_client_geo_profiles_compatibility ON public.client_geo_profiles;
CREATE TRIGGER tgr_sync_client_geo_profiles_compatibility
    BEFORE INSERT OR UPDATE ON public.client_geo_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE public.sync_client_geo_profiles_compatibility();

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
    ALTER COLUMN audit_version SET DEFAULT '1.0',
    ALTER COLUMN scan_status SET DEFAULT 'pending',
    ALTER COLUMN scanned_pages SET DEFAULT '[]'::jsonb,
    ALTER COLUMN seo_score SET DEFAULT 0,
    ALTER COLUMN geo_score SET DEFAULT 0,
    ALTER COLUMN seo_breakdown SET DEFAULT '{}'::jsonb,
    ALTER COLUMN geo_breakdown SET DEFAULT '{}'::jsonb,
    ALTER COLUMN extracted_data SET DEFAULT '{}'::jsonb,
    ALTER COLUMN issues SET DEFAULT '[]'::jsonb,
    ALTER COLUMN strengths SET DEFAULT '[]'::jsonb,
    ALTER COLUMN prefill_suggestions SET DEFAULT '[]'::jsonb,
    ALTER COLUMN created_at SET DEFAULT now();

UPDATE public.client_site_audits
SET source_url = COALESCE(
        NULLIF(BTRIM(source_url), ''),
        NULLIF(BTRIM(resolved_url), ''),
        NULLIF(BTRIM(profile.website_url), '')
    )
FROM public.client_geo_profiles AS profile
WHERE profile.id = client_site_audits.client_id
  AND (client_site_audits.source_url IS NULL OR BTRIM(client_site_audits.source_url) = '');

UPDATE public.client_site_audits
SET
    audit_version = COALESCE(NULLIF(BTRIM(audit_version), ''), '1.0'),
    scan_status = CASE
        WHEN scan_status IN ('pending', 'running', 'success', 'partial_error', 'failed') THEN scan_status
        WHEN scan_status = 'error' THEN 'failed'
        WHEN scan_status = 'partial' THEN 'partial_error'
        ELSE 'pending'
    END,
    scanned_pages = CASE
        WHEN scanned_pages IS NULL OR jsonb_typeof(scanned_pages) <> 'array' THEN '[]'::jsonb
        ELSE scanned_pages
    END,
    seo_score = COALESCE(seo_score, 0),
    geo_score = COALESCE(geo_score, 0),
    seo_breakdown = CASE
        WHEN seo_breakdown IS NULL OR jsonb_typeof(seo_breakdown) <> 'object' THEN '{}'::jsonb
        ELSE seo_breakdown
    END,
    geo_breakdown = CASE
        WHEN geo_breakdown IS NULL OR jsonb_typeof(geo_breakdown) <> 'object' THEN '{}'::jsonb
        ELSE geo_breakdown
    END,
    extracted_data = CASE
        WHEN extracted_data IS NULL OR jsonb_typeof(extracted_data) <> 'object' THEN '{}'::jsonb
        ELSE extracted_data
    END,
    issues = CASE
        WHEN issues IS NULL OR jsonb_typeof(issues) <> 'array' THEN '[]'::jsonb
        ELSE issues
    END,
    strengths = CASE
        WHEN strengths IS NULL OR jsonb_typeof(strengths) <> 'array' THEN '[]'::jsonb
        ELSE strengths
    END,
    prefill_suggestions = CASE
        WHEN prefill_suggestions IS NULL THEN '[]'::jsonb
        WHEN prefill_suggestions = '{}'::jsonb THEN '[]'::jsonb
        WHEN jsonb_typeof(prefill_suggestions) <> 'array' THEN '[]'::jsonb
        ELSE prefill_suggestions
    END,
    created_at = COALESCE(created_at, now());

ALTER TABLE public.client_site_audits
    DROP CONSTRAINT IF EXISTS client_site_audits_scan_status_check;

ALTER TABLE public.client_site_audits
    ADD CONSTRAINT client_site_audits_scan_status_check
    CHECK (scan_status IN ('pending', 'running', 'success', 'partial_error', 'failed'));

CREATE INDEX IF NOT EXISTS idx_client_site_audits_client_id_created_at
    ON public.client_site_audits (client_id, created_at DESC);

ALTER TABLE public.client_site_audits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.normalize_tracked_query_category(raw_value TEXT, query_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    raw TEXT := replace(replace(lower(trim(COALESCE(raw_value, ''))), '-', '_'), ' ', '_');
    text_value TEXT := lower(trim(COALESCE(query_text, '')));
BEGIN
    IF raw IN ('local_intent', 'service_intent', 'brand', 'competitor_comparison', 'discovery') THEN
        RETURN raw;
    END IF;

    IF raw ~ '(competit|compar|versus|vs)' THEN
        RETURN 'competitor_comparison';
    END IF;

    IF raw ~ '(brand|marque)' THEN
        RETURN 'brand';
    END IF;

    IF raw ~ '(local|ville|region|quartier|geo_local)' THEN
        RETURN 'local_intent';
    END IF;

    IF raw ~ '(service|category|categorie|seo|geo|visibility)' THEN
        RETURN 'service_intent';
    END IF;

    IF raw ~ '(discovery|general|research|exploration)' THEN
        RETURN 'discovery';
    END IF;

    IF text_value = '' THEN
        RETURN 'discovery';
    END IF;

    IF text_value ~ '(versus|vs\.?|alternatives?|compare|compar|competit)' THEN
        RETURN 'competitor_comparison';
    END IF;

    IF text_value ~ '(pres de|proche de|dans |montreal|quebec city|quebec|laval|longueuil|brossard|quartier|rive-sud|rive sud|ville)' THEN
        RETURN 'local_intent';
    END IF;

    IF text_value ~ '(nom officiel|marque|avis sur|review of|site officiel|telephone|numero de|contact)' THEN
        RETURN 'brand';
    END IF;

    IF text_value ~ '(plombier|dentiste|restaurant|notaire|courtier|clinique|service|specialiste|meilleur|best )' THEN
        RETURN 'service_intent';
    END IF;

    RETURN 'discovery';
END;
$$;

CREATE TABLE IF NOT EXISTS public.tracked_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    category TEXT DEFAULT 'discovery',
    locale TEXT DEFAULT 'fr-CA',
    query_type TEXT DEFAULT 'discovery',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tracked_queries
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'discovery',
    ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'fr-CA',
    ADD COLUMN IF NOT EXISTS query_type TEXT DEFAULT 'discovery',
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.tracked_queries
    ALTER COLUMN category SET DEFAULT 'discovery',
    ALTER COLUMN locale SET DEFAULT 'fr-CA',
    ALTER COLUMN query_type SET DEFAULT 'discovery',
    ALTER COLUMN is_active SET DEFAULT true,
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN updated_at SET DEFAULT now();

UPDATE public.tracked_queries
SET
    query_text = COALESCE(NULLIF(BTRIM(query_text), ''), 'Untitled tracked prompt'),
    category = public.normalize_tracked_query_category(
        COALESCE(NULLIF(BTRIM(category), ''), NULLIF(BTRIM(query_type), '')),
        query_text
    ),
    query_type = public.normalize_tracked_query_category(
        COALESCE(NULLIF(BTRIM(category), ''), NULLIF(BTRIM(query_type), '')),
        query_text
    ),
    locale = COALESCE(NULLIF(BTRIM(locale), ''), 'fr-CA'),
    is_active = COALESCE(is_active, true),
    created_at = COALESCE(created_at, now()),
    updated_at = COALESCE(updated_at, now());

ALTER TABLE public.tracked_queries
    ALTER COLUMN query_text SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tracked_queries_client_id
    ON public.tracked_queries (client_id);

CREATE INDEX IF NOT EXISTS idx_tracked_queries_client_active_created_at
    ON public.tracked_queries (client_id, is_active, created_at);

ALTER TABLE public.tracked_queries ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.sync_tracked_queries_compatibility()
RETURNS trigger AS $$
BEGIN
    NEW.query_text := COALESCE(NULLIF(BTRIM(NEW.query_text), ''), 'Untitled tracked prompt');
    NEW.locale := COALESCE(NULLIF(BTRIM(NEW.locale), ''), 'fr-CA');
    NEW.category := public.normalize_tracked_query_category(
        COALESCE(NULLIF(BTRIM(NEW.category), ''), NULLIF(BTRIM(NEW.query_type), '')),
        NEW.query_text
    );
    NEW.query_type := NEW.category;
    NEW.is_active := COALESCE(NEW.is_active, true);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tgr_sync_tracked_queries_compatibility ON public.tracked_queries;
CREATE TRIGGER tgr_sync_tracked_queries_compatibility
    BEFORE INSERT OR UPDATE ON public.tracked_queries
    FOR EACH ROW
    EXECUTE PROCEDURE public.sync_tracked_queries_compatibility();

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
    ADD COLUMN IF NOT EXISTS query_text TEXT,
    ADD COLUMN IF NOT EXISTS response_text TEXT,
    ADD COLUMN IF NOT EXISTS target_found BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS target_position INTEGER,
    ADD COLUMN IF NOT EXISTS total_mentioned INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS raw_analysis JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS parsed_response JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.query_runs
    ALTER COLUMN target_found SET DEFAULT false,
    ALTER COLUMN total_mentioned SET DEFAULT 0,
    ALTER COLUMN raw_analysis SET DEFAULT '{}'::jsonb,
    ALTER COLUMN parsed_response SET DEFAULT '{}'::jsonb,
    ALTER COLUMN status SET DEFAULT 'completed',
    ALTER COLUMN created_at SET DEFAULT now();

UPDATE public.query_runs AS qr
SET query_text = NULLIF(BTRIM(tq.query_text), '')
FROM public.tracked_queries AS tq
WHERE qr.tracked_query_id = tq.id
  AND (qr.query_text IS NULL OR BTRIM(qr.query_text) = '');

UPDATE public.query_runs
SET query_text = COALESCE(
        NULLIF(BTRIM(query_text), ''),
        NULLIF(BTRIM(parsed_response ->> 'query'), ''),
        NULLIF(BTRIM(raw_analysis ->> 'query'), ''),
        'Legacy run (query text unavailable)'
    ),
    provider = COALESCE(NULLIF(BTRIM(provider), ''), 'unknown'),
    model = COALESCE(NULLIF(BTRIM(model), ''), 'unknown'),
    target_found = COALESCE(target_found, false),
    total_mentioned = COALESCE(total_mentioned, 0),
    raw_analysis = COALESCE(raw_analysis, '{}'::jsonb),
    parsed_response = COALESCE(parsed_response, '{}'::jsonb),
    status = CASE
        WHEN status IN ('pending', 'running', 'completed', 'failed') THEN status
        WHEN status IN ('success', 'done') THEN 'completed'
        WHEN status IN ('error') THEN 'failed'
        ELSE 'completed'
    END,
    created_at = COALESCE(created_at, now());

ALTER TABLE public.query_runs
    ALTER COLUMN query_text SET NOT NULL,
    ALTER COLUMN provider SET NOT NULL,
    ALTER COLUMN model SET NOT NULL,
    ALTER COLUMN target_found SET NOT NULL,
    ALTER COLUMN total_mentioned SET NOT NULL,
    ALTER COLUMN raw_analysis SET NOT NULL,
    ALTER COLUMN parsed_response SET NOT NULL,
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.query_runs
    DROP CONSTRAINT IF EXISTS query_runs_status_check;

ALTER TABLE public.query_runs
    ADD CONSTRAINT query_runs_status_check
    CHECK (status IN ('pending', 'running', 'completed', 'failed'));

CREATE INDEX IF NOT EXISTS idx_query_runs_client_id
    ON public.query_runs (client_id);

CREATE INDEX IF NOT EXISTS idx_query_runs_client_status_created_at
    ON public.query_runs (client_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_runs_tracked_query_created_at
    ON public.query_runs (tracked_query_id, created_at DESC);

ALTER TABLE public.query_runs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.sync_query_runs_compatibility()
RETURNS trigger AS $$
DECLARE
    tracked_query_text TEXT;
BEGIN
    NEW.provider := COALESCE(NULLIF(BTRIM(NEW.provider), ''), 'unknown');
    NEW.model := COALESCE(NULLIF(BTRIM(NEW.model), ''), 'unknown');
    NEW.status := CASE
        WHEN NEW.status IN ('pending', 'running', 'completed', 'failed') THEN NEW.status
        WHEN NEW.status IN ('success', 'done') THEN 'completed'
        WHEN NEW.status = 'error' THEN 'failed'
        ELSE 'completed'
    END;
    NEW.target_found := COALESCE(NEW.target_found, false);
    NEW.total_mentioned := COALESCE(NEW.total_mentioned, 0);
    NEW.raw_analysis := COALESCE(NEW.raw_analysis, '{}'::jsonb);
    NEW.parsed_response := COALESCE(NEW.parsed_response, '{}'::jsonb);

    IF NEW.query_text IS NULL OR BTRIM(NEW.query_text) = '' THEN
        IF NEW.tracked_query_id IS NOT NULL THEN
            SELECT tq.query_text
            INTO tracked_query_text
            FROM public.tracked_queries AS tq
            WHERE tq.id = NEW.tracked_query_id;
        END IF;

        NEW.query_text := COALESCE(
            NULLIF(BTRIM(tracked_query_text), ''),
            NULLIF(BTRIM(NEW.parsed_response ->> 'query'), ''),
            NULLIF(BTRIM(NEW.raw_analysis ->> 'query'), ''),
            'Legacy run (query text unavailable)'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tgr_sync_query_runs_compatibility ON public.query_runs;
CREATE TRIGGER tgr_sync_query_runs_compatibility
    BEFORE INSERT OR UPDATE ON public.query_runs
    FOR EACH ROW
    EXECUTE PROCEDURE public.sync_query_runs_compatibility();

COMMENT ON COLUMN public.query_runs.query_text IS
    'Snapshot of tracked_queries.query_text at run time, backfilled from tracked_query_id when available.';

CREATE TABLE IF NOT EXISTS public.query_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_run_id UUID NOT NULL REFERENCES public.query_runs(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    context TEXT,
    is_target BOOLEAN NOT NULL DEFAULT false,
    sentiment TEXT DEFAULT 'neutral',
    entity_type TEXT NOT NULL DEFAULT 'business',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Si une ancienne base utilise entity_name au lieu de business_name,
-- on la renomme proprement quand business_name n'existe pas encore.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'query_mentions'
          AND column_name = 'entity_name'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'query_mentions'
          AND column_name = 'business_name'
    ) THEN
        ALTER TABLE public.query_mentions
        RENAME COLUMN entity_name TO business_name;
    END IF;
END $$;

ALTER TABLE public.query_mentions
    ADD COLUMN IF NOT EXISTS business_name TEXT,
    ADD COLUMN IF NOT EXISTS position INTEGER,
    ADD COLUMN IF NOT EXISTS context TEXT,
    ADD COLUMN IF NOT EXISTS is_target BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS sentiment TEXT DEFAULT 'neutral',
    ADD COLUMN IF NOT EXISTS entity_type TEXT NOT NULL DEFAULT 'business',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.query_mentions
    ALTER COLUMN position SET DEFAULT 0,
    ALTER COLUMN is_target SET DEFAULT false,
    ALTER COLUMN sentiment SET DEFAULT 'neutral',
    ALTER COLUMN entity_type SET DEFAULT 'business',
    ALTER COLUMN created_at SET DEFAULT now();

-- Si les deux colonnes existent (cas legacy bricolé), on backfill business_name depuis entity_name.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'query_mentions'
          AND column_name = 'entity_name'
    ) AND EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'query_mentions'
          AND column_name = 'business_name'
    ) THEN
        EXECUTE $sql$
            UPDATE public.query_mentions
            SET business_name = COALESCE(
                NULLIF(BTRIM(business_name), ''),
                NULLIF(BTRIM(entity_name), ''),
                NULLIF(BTRIM(context), ''),
                '[unknown mention]'
            )
            WHERE business_name IS NULL OR BTRIM(business_name) = ''
        $sql$;
    END IF;
END $$;

UPDATE public.query_mentions
SET
    business_name = COALESCE(
        NULLIF(BTRIM(business_name), ''),
        NULLIF(BTRIM(context), ''),
        '[unknown mention]'
    ),
    position = COALESCE(position, 0),
    is_target = COALESCE(is_target, false),
    sentiment = COALESCE(NULLIF(BTRIM(sentiment), ''), 'neutral'),
    entity_type = CASE
        WHEN entity_type IN ('business', 'competitor', 'source') THEN entity_type
        ELSE 'business'
    END,
    created_at = COALESCE(created_at, now());

ALTER TABLE public.query_mentions
    ALTER COLUMN business_name SET NOT NULL,
    ALTER COLUMN position SET NOT NULL,
    ALTER COLUMN is_target SET NOT NULL,
    ALTER COLUMN entity_type SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.query_mentions
    DROP CONSTRAINT IF EXISTS query_mentions_entity_type_check;

ALTER TABLE public.query_mentions
    ADD CONSTRAINT query_mentions_entity_type_check
    CHECK (entity_type IN ('business', 'competitor', 'source'));

CREATE INDEX IF NOT EXISTS idx_query_mentions_query_run_id
    ON public.query_mentions (query_run_id);

CREATE INDEX IF NOT EXISTS idx_query_mentions_run_entity_position
    ON public.query_mentions (query_run_id, entity_type, position);

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
    ADD COLUMN IF NOT EXISTS severity TEXT,
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
    ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'recommended',
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open',
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE public.opportunities
    ALTER COLUMN priority SET DEFAULT 'medium',
    ALTER COLUMN severity SET DEFAULT 'medium',
    ALTER COLUMN category SET DEFAULT 'general',
    ALTER COLUMN source SET DEFAULT 'recommended',
    ALTER COLUMN status SET DEFAULT 'open',
    ALTER COLUMN created_at SET DEFAULT now();

UPDATE public.opportunities
SET
    priority = CASE
        WHEN priority IN ('high', 'medium', 'low') THEN priority
        WHEN severity IN ('high', 'medium', 'low') THEN severity
        ELSE 'medium'
    END,
    severity = CASE
        WHEN priority IN ('high', 'medium', 'low') THEN priority
        WHEN severity IN ('high', 'medium', 'low') THEN severity
        ELSE 'medium'
    END,
    category = COALESCE(NULLIF(BTRIM(category), ''), 'general'),
    source = CASE
        WHEN source IN ('observed', 'inferred', 'recommended') THEN source
        ELSE 'recommended'
    END,
    status = CASE
        WHEN status IN ('open', 'in_progress', 'done', 'dismissed') THEN status
        WHEN status = 'completed' THEN 'done'
        WHEN status = 'active' THEN 'in_progress'
        ELSE 'open'
    END,
    title = COALESCE(NULLIF(BTRIM(title), ''), COALESCE(NULLIF(BTRIM(description), ''), 'Untitled opportunity')),
    description = COALESCE(NULLIF(BTRIM(description), ''), COALESCE(NULLIF(BTRIM(title), ''), 'Untitled opportunity')),
    created_at = COALESCE(created_at, now());

DO $$
DECLARE
    constraint_row RECORD;
BEGIN
    FOR constraint_row IN
        SELECT conname, pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE conrelid = 'public.opportunities'::regclass
          AND contype = 'c'
    LOOP
        IF constraint_row.definition ILIKE '%priority%'
           OR constraint_row.definition ILIKE '%severity%'
           OR constraint_row.definition ILIKE '%source%'
           OR constraint_row.definition ILIKE '%status%' THEN
            EXECUTE format('ALTER TABLE public.opportunities DROP CONSTRAINT IF EXISTS %I', constraint_row.conname);
        END IF;
    END LOOP;
END;
$$;

ALTER TABLE public.opportunities
    ADD CONSTRAINT opportunities_priority_check
    CHECK (priority IN ('high', 'medium', 'low'));

ALTER TABLE public.opportunities
    ADD CONSTRAINT opportunities_severity_check
    CHECK (severity IN ('high', 'medium', 'low'));

ALTER TABLE public.opportunities
    ADD CONSTRAINT opportunities_source_check
    CHECK (source IN ('observed', 'inferred', 'recommended'));

ALTER TABLE public.opportunities
    ADD CONSTRAINT opportunities_status_check
    CHECK (status IN ('open', 'in_progress', 'done', 'dismissed'));

CREATE INDEX IF NOT EXISTS idx_opportunities_client_id
    ON public.opportunities (client_id);

CREATE INDEX IF NOT EXISTS idx_opportunities_audit_id
    ON public.opportunities (audit_id);

CREATE INDEX IF NOT EXISTS idx_opportunities_client_status_created_at
    ON public.opportunities (client_id, status, created_at DESC);

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.sync_opportunities_compatibility()
RETURNS trigger AS $$
BEGIN
    NEW.priority := CASE
        WHEN NEW.priority IN ('high', 'medium', 'low') THEN NEW.priority
        WHEN NEW.severity IN ('high', 'medium', 'low') THEN NEW.severity
        ELSE 'medium'
    END;
    NEW.severity := NEW.priority;
    NEW.category := COALESCE(NULLIF(BTRIM(NEW.category), ''), 'general');
    NEW.source := CASE
        WHEN NEW.source IN ('observed', 'inferred', 'recommended') THEN NEW.source
        ELSE 'recommended'
    END;
    NEW.status := CASE
        WHEN NEW.status IN ('open', 'in_progress', 'done', 'dismissed') THEN NEW.status
        WHEN NEW.status = 'completed' THEN 'done'
        WHEN NEW.status = 'active' THEN 'in_progress'
        ELSE 'open'
    END;
    NEW.title := COALESCE(NULLIF(BTRIM(NEW.title), ''), COALESCE(NULLIF(BTRIM(NEW.description), ''), 'Untitled opportunity'));
    NEW.description := COALESCE(NULLIF(BTRIM(NEW.description), ''), COALESCE(NULLIF(BTRIM(NEW.title), ''), 'Untitled opportunity'));
    NEW.created_at := COALESCE(NEW.created_at, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tgr_sync_opportunities_compatibility ON public.opportunities;
CREATE TRIGGER tgr_sync_opportunities_compatibility
    BEFORE INSERT OR UPDATE ON public.opportunities
    FOR EACH ROW
    EXECUTE PROCEDURE public.sync_opportunities_compatibility();

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

-- Convert legacy JSON/JSONB text-like columns to TEXT if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'merge_suggestions'
          AND column_name = 'field_name'
          AND data_type IN ('json', 'jsonb')
    ) THEN
        ALTER TABLE public.merge_suggestions
            ALTER COLUMN field_name TYPE TEXT
            USING CASE
                WHEN field_name IS NULL THEN NULL
                WHEN jsonb_typeof(field_name::jsonb) = 'string' THEN trim(both '"' from field_name::text)
                ELSE field_name::text
            END;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'merge_suggestions'
          AND column_name = 'current_value'
          AND data_type IN ('json', 'jsonb')
    ) THEN
        ALTER TABLE public.merge_suggestions
            ALTER COLUMN current_value TYPE TEXT
            USING CASE
                WHEN current_value IS NULL THEN NULL
                WHEN jsonb_typeof(current_value::jsonb) = 'string' THEN trim(both '"' from current_value::text)
                ELSE current_value::text
            END;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'merge_suggestions'
          AND column_name = 'suggested_value'
          AND data_type IN ('json', 'jsonb')
    ) THEN
        ALTER TABLE public.merge_suggestions
            ALTER COLUMN suggested_value DROP DEFAULT;

        ALTER TABLE public.merge_suggestions
            ALTER COLUMN suggested_value TYPE TEXT
            USING CASE
                WHEN suggested_value IS NULL THEN NULL
                WHEN jsonb_typeof(suggested_value::jsonb) = 'string' THEN trim(both '"' from suggested_value::text)
                ELSE suggested_value::text
            END;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'merge_suggestions'
          AND column_name = 'rationale'
          AND data_type IN ('json', 'jsonb')
    ) THEN
        ALTER TABLE public.merge_suggestions
            ALTER COLUMN rationale TYPE TEXT
            USING CASE
                WHEN rationale IS NULL THEN NULL
                WHEN jsonb_typeof(rationale::jsonb) = 'string' THEN trim(both '"' from rationale::text)
                ELSE rationale::text
            END;
    END IF;
END $$;

ALTER TABLE public.merge_suggestions
    ALTER COLUMN confidence SET DEFAULT 'medium',
    ALTER COLUMN source SET DEFAULT 'recommended',
    ALTER COLUMN status SET DEFAULT 'pending',
    ALTER COLUMN created_at SET DEFAULT now();

UPDATE public.merge_suggestions
SET
    field_name = COALESCE(NULLIF(BTRIM(field_name), ''), 'unknown'),
    suggested_value = COALESCE(NULLIF(BTRIM(suggested_value), ''), '[missing suggestion]'),
    confidence = CASE
        WHEN confidence IN ('high', 'medium', 'low') THEN confidence
        ELSE 'medium'
    END,
    source = CASE
        WHEN source IN ('observed', 'inferred', 'recommended') THEN source
        ELSE 'recommended'
    END,
    status = CASE
        WHEN status IN ('pending', 'applied', 'rejected') THEN status
        WHEN status = 'accepted' THEN 'applied'
        WHEN status = 'dismissed' THEN 'rejected'
        ELSE 'pending'
    END,
    created_at = COALESCE(created_at, now());

ALTER TABLE public.merge_suggestions
    ALTER COLUMN field_name SET NOT NULL,
    ALTER COLUMN suggested_value SET NOT NULL,
    ALTER COLUMN confidence SET NOT NULL,
    ALTER COLUMN source SET NOT NULL,
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL;

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

CREATE INDEX IF NOT EXISTS idx_merge_suggestions_client_status_created_at
    ON public.merge_suggestions (client_id, status, created_at DESC);

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

ALTER TABLE public.actions
    ALTER COLUMN details SET DEFAULT '{}'::jsonb,
    ALTER COLUMN created_at SET DEFAULT now();

UPDATE public.actions
SET
    action_type = COALESCE(NULLIF(BTRIM(action_type), ''), 'unknown'),
    details = COALESCE(details, '{}'::jsonb),
    created_at = COALESCE(created_at, now());

CREATE INDEX IF NOT EXISTS idx_actions_client_id
    ON public.actions (client_id);

CREATE INDEX IF NOT EXISTS idx_actions_client_created_at
    ON public.actions (client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_actions_client_action_type_created_at
    ON public.actions (client_id, action_type, created_at DESC);

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

ALTER TABLE public.client_portal_access
    ALTER COLUMN member_type SET DEFAULT 'client_contact',
    ALTER COLUMN portal_role SET DEFAULT 'viewer',
    ALTER COLUMN status SET DEFAULT 'active',
    ALTER COLUMN created_at SET DEFAULT now(),
    ALTER COLUMN updated_at SET DEFAULT now();

UPDATE public.client_portal_access
SET
    contact_email = CASE
        WHEN contact_email IS NULL THEN NULL
        ELSE lower(btrim(contact_email))
    END,
    member_type = CASE
        WHEN member_type IN ('client_contact', 'client_staff', 'internal_staff') THEN member_type
        ELSE 'client_contact'
    END,
    portal_role = CASE
        WHEN portal_role IN ('owner', 'viewer') THEN portal_role
        ELSE 'viewer'
    END,
    status = CASE
        WHEN status IN ('active', 'revoked') THEN status
        ELSE 'active'
    END,
    created_at = COALESCE(created_at, now()),
    updated_at = COALESCE(updated_at, now());

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
    CHECK (contact_email IS NULL OR contact_email = lower(btrim(contact_email)));

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
