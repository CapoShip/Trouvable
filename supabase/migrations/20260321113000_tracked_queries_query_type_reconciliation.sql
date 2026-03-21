-- Reconcile tracked_queries category/query_type constraints with the canonical phase-2 taxonomy.
-- This migration is idempotent and hardens legacy environments that still enforce older query_type values.

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

ALTER TABLE public.tracked_queries
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'discovery',
    ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'fr-CA',
    ADD COLUMN IF NOT EXISTS query_type TEXT DEFAULT 'discovery',
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.tracked_queries
    ALTER COLUMN category SET DEFAULT 'discovery',
    ALTER COLUMN locale SET DEFAULT 'fr-CA',
    ALTER COLUMN query_type SET DEFAULT 'discovery',
    ALTER COLUMN is_active SET DEFAULT true;

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
    ALTER COLUMN query_text SET NOT NULL,
    ALTER COLUMN category SET NOT NULL,
    ALTER COLUMN locale SET NOT NULL,
    ALTER COLUMN query_type SET NOT NULL,
    ALTER COLUMN is_active SET NOT NULL;

DO $$
DECLARE
    constraint_row RECORD;
BEGIN
    FOR constraint_row IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE con.contype = 'c'
          AND nsp.nspname = 'public'
          AND rel.relname = 'tracked_queries'
          AND (
              con.conname = 'tracked_queries_query_type_check'
              OR con.conname = 'tracked_queries_category_check'
              OR con.conname = 'tracked_queries_category_query_type_sync_check'
              OR pg_get_constraintdef(con.oid) ILIKE '%query_type%'
              OR pg_get_constraintdef(con.oid) ILIKE '%category%'
          )
    LOOP
        EXECUTE format('ALTER TABLE public.tracked_queries DROP CONSTRAINT IF EXISTS %I', constraint_row.conname);
    END LOOP;
END;
$$;

ALTER TABLE public.tracked_queries
    ADD CONSTRAINT tracked_queries_category_check
    CHECK (category IN ('local_intent', 'service_intent', 'brand', 'competitor_comparison', 'discovery'));

ALTER TABLE public.tracked_queries
    ADD CONSTRAINT tracked_queries_query_type_check
    CHECK (query_type IN ('local_intent', 'service_intent', 'brand', 'competitor_comparison', 'discovery'));

ALTER TABLE public.tracked_queries
    ADD CONSTRAINT tracked_queries_category_query_type_sync_check
    CHECK (query_type = category);

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
    NEW.created_at := COALESCE(NEW.created_at, now());
    NEW.updated_at := COALESCE(NEW.updated_at, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tgr_sync_tracked_queries_compatibility ON public.tracked_queries;
CREATE TRIGGER tgr_sync_tracked_queries_compatibility
    BEFORE INSERT OR UPDATE ON public.tracked_queries
    FOR EACH ROW
    EXECUTE PROCEDURE public.sync_tracked_queries_compatibility();
