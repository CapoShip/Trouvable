-- Migration: Add lifecycle_status to client_geo_profiles
-- Date: 2026-03-28
-- Risk: LOW (additive column, nullable with default, backfill existing rows)
-- Rollback: ALTER TABLE public.client_geo_profiles DROP COLUMN IF EXISTS lifecycle_status;

-- 1. Add lifecycle_status column
ALTER TABLE public.client_geo_profiles
    ADD COLUMN IF NOT EXISTS lifecycle_status TEXT DEFAULT 'prospect';

-- 2. Add CHECK constraint for allowed values
ALTER TABLE public.client_geo_profiles
    DROP CONSTRAINT IF EXISTS client_geo_profiles_lifecycle_status_check;

ALTER TABLE public.client_geo_profiles
    ADD CONSTRAINT client_geo_profiles_lifecycle_status_check
    CHECK (lifecycle_status IN ('prospect', 'onboarding', 'active', 'paused', 'archived'));

-- 3. Backfill existing rows based on current state signals
--    - archived_at IS NOT NULL → 'archived'
--    - publication_status = 'published' OR is_published = true → 'active'
--      (if they've been published, they've been through onboarding and are active)
--    - has at least one audit → 'onboarding' (onboarding started but not activated)
--    - otherwise → 'prospect'
UPDATE public.client_geo_profiles
SET lifecycle_status = CASE
    WHEN archived_at IS NOT NULL THEN 'archived'
    WHEN COALESCE(is_published, false) = true OR publication_status = 'published' THEN 'active'
    WHEN id IN (
        SELECT DISTINCT client_id FROM public.client_site_audits WHERE client_id IS NOT NULL
    ) THEN 'onboarding'
    ELSE 'prospect'
END
WHERE lifecycle_status IS NULL OR lifecycle_status = 'prospect';

-- 4. Drop 'ready' from publication_status CHECK (zombie state — never written by code)
--    Replace with tighter constraint: draft | published only
ALTER TABLE public.client_geo_profiles
    DROP CONSTRAINT IF EXISTS client_geo_profiles_publication_status_check;

ALTER TABLE public.client_geo_profiles
    ADD CONSTRAINT client_geo_profiles_publication_status_check
    CHECK (publication_status IN ('draft', 'published'));

-- 5. Migrate any existing 'ready' rows to 'draft' (safety — none should exist)
UPDATE public.client_geo_profiles
SET publication_status = 'draft'
WHERE publication_status = 'ready';

-- 6. Update the DB-level sync trigger to exclude 'ready' from valid values
CREATE OR REPLACE FUNCTION public.sync_client_geo_profiles_compatibility()
RETURNS TRIGGER AS $$
DECLARE
    next_public_email TEXT;
    next_short_desc TEXT;
BEGIN
    -- Sync contact_info dual fields
    IF NEW.contact_info IS NOT NULL THEN
        next_public_email := COALESCE(
            NULLIF(BTRIM(NEW.contact_info ->> 'public_email'), ''),
            NULLIF(BTRIM(NEW.contact_info ->> 'email'), '')
        );

        IF next_public_email IS NOT NULL THEN
            NEW.contact_info := jsonb_set(NEW.contact_info, '{public_email}', to_jsonb(next_public_email), true);
            NEW.contact_info := jsonb_set(NEW.contact_info, '{email}', to_jsonb(next_public_email), true);
        END IF;
    END IF;

    -- Sync business_details dual fields
    IF NEW.business_details IS NOT NULL THEN
        next_short_desc := COALESCE(
            NULLIF(BTRIM(NEW.business_details ->> 'short_desc'), ''),
            NULLIF(BTRIM(NEW.business_details ->> 'short_description'), '')
        );

        IF next_short_desc IS NOT NULL THEN
            NEW.business_details := jsonb_set(NEW.business_details, '{short_desc}', to_jsonb(next_short_desc), true);
            NEW.business_details := jsonb_set(NEW.business_details, '{short_description}', to_jsonb(next_short_desc), true);
        END IF;
    END IF;

    -- Sync publication_status <-> is_published (no more 'ready')
    IF NEW.publication_status IS NULL OR NEW.publication_status NOT IN ('draft', 'published') THEN
        NEW.publication_status := CASE
            WHEN COALESCE(NEW.is_published, false) THEN 'published'
            ELSE 'draft'
        END;
    END IF;

    NEW.is_published := (NEW.publication_status = 'published');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create index on lifecycle_status for filtered queries
CREATE INDEX IF NOT EXISTS idx_client_geo_profiles_lifecycle_status
    ON public.client_geo_profiles (lifecycle_status);
