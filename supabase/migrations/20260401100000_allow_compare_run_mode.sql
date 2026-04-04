-- Allow 'compare' as a valid run_mode for GEO Compare persistence
-- The existing constraint only allows ('standard', 'benchmark')
-- Also make tracked_query_id nullable — compare runs have no tracked query,
-- and the FK already specifies ON DELETE SET NULL which requires nullability.

DO $$
BEGIN
    -- Drop the existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'query_runs_run_mode_check'
    ) THEN
        ALTER TABLE public.query_runs DROP CONSTRAINT query_runs_run_mode_check;
    END IF;

    -- Re-add with 'compare' included
    ALTER TABLE public.query_runs
        ADD CONSTRAINT query_runs_run_mode_check
        CHECK (run_mode IN ('standard', 'benchmark', 'compare'));

EXCEPTION WHEN others THEN
    RAISE NOTICE 'Could not update run_mode constraint: %', SQLERRM;
END $$;

-- Allow null tracked_query_id for compare runs
ALTER TABLE public.query_runs ALTER COLUMN tracked_query_id DROP NOT NULL;
