-- Trouvable v1 — colonnes et contraintes additionnelles (idempotent)
-- Exécuter dans Supabase SQL Editor après les migrations existantes.

-- Clients: archivage et notes
ALTER TABLE public.client_geo_profiles
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS target_region TEXT;

CREATE INDEX IF NOT EXISTS idx_client_geo_profiles_archived ON public.client_geo_profiles(archived_at);

-- Tracked queries: locale et type
ALTER TABLE public.tracked_queries
    ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'fr-CA',
    ADD COLUMN IF NOT EXISTS query_type TEXT DEFAULT 'general';

-- Query runs: statut et réponse structurée
ALTER TABLE public.query_runs
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';

-- Backfill statut pour lignes existantes
UPDATE public.query_runs SET status = 'completed' WHERE status IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'query_runs_status_check'
    ) THEN
        ALTER TABLE public.query_runs
            ADD CONSTRAINT query_runs_status_check
            CHECK (status IN ('pending', 'running', 'completed', 'failed'));
    END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

ALTER TABLE public.query_runs
    ADD COLUMN IF NOT EXISTS parsed_response JSONB DEFAULT '{}'::jsonb;

-- Mentions: type d'entité (marque, concurrent, source URL)
ALTER TABLE public.query_mentions
    ADD COLUMN IF NOT EXISTS entity_type TEXT DEFAULT 'business';

UPDATE public.query_mentions SET entity_type = 'business' WHERE entity_type IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'query_mentions_entity_type_check'
    ) THEN
        ALTER TABLE public.query_mentions
            ADD CONSTRAINT query_mentions_entity_type_check
            CHECK (entity_type IN ('business', 'competitor', 'source'));
    END IF;
EXCEPTION WHEN others THEN NULL;
END $$;
