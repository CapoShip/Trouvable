-- Add discovery_mode to tracked_queries and query_runs.
-- discovery_mode distinguishes brand_aware (context-injected) from blind_discovery (target-blind).
-- Default is 'brand_aware' for backward compatibility with all existing data.

-- tracked_queries: records the intended discovery mode for the prompt
ALTER TABLE public.tracked_queries
    ADD COLUMN IF NOT EXISTS discovery_mode TEXT NOT NULL DEFAULT 'brand_aware';

-- query_runs: records the actual discovery mode used at run time
ALTER TABLE public.query_runs
    ADD COLUMN IF NOT EXISTS discovery_mode TEXT NOT NULL DEFAULT 'brand_aware';

-- Backfill: all existing rows are brand_aware (they were generated with full business context)
UPDATE public.tracked_queries SET discovery_mode = 'brand_aware' WHERE discovery_mode IS NULL OR discovery_mode = '';
UPDATE public.query_runs SET discovery_mode = 'brand_aware' WHERE discovery_mode IS NULL OR discovery_mode = '';

-- Index for filtering runs by discovery mode
CREATE INDEX IF NOT EXISTS idx_query_runs_discovery_mode
    ON public.query_runs (client_id, discovery_mode, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tracked_queries_discovery_mode
    ON public.tracked_queries (client_id, discovery_mode);

COMMENT ON COLUMN public.tracked_queries.discovery_mode IS
    'brand_aware = context injected in generation prompt; blind_discovery = target-blind generation, evaluation-only target awareness.';

COMMENT ON COLUMN public.query_runs.discovery_mode IS
    'brand_aware = context injected in generation prompt; blind_discovery = target-blind generation, evaluation-only target awareness.';
