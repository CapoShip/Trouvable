-- Add 'healthy' and 'syncing' connector states, and 'ga4_sync_daily' job type.
-- 'healthy' = connector has synced successfully at least once and data is fresh.
-- 'syncing' = sync is actively in progress (set by the job runner, cleared on finish).

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'client_data_connectors_status_check'
          AND conrelid = 'public.client_data_connectors'::regclass
    ) THEN
        ALTER TABLE public.client_data_connectors
            DROP CONSTRAINT client_data_connectors_status_check;
    END IF;

    ALTER TABLE public.client_data_connectors
        ADD CONSTRAINT client_data_connectors_status_check
        CHECK (status IN ('not_connected', 'configured', 'disabled', 'sample_mode', 'error', 'healthy', 'syncing'));
END
$$;

-- Add ga4_sync_daily to recurring_jobs job_type constraint.
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
        CHECK (job_type IN ('audit_refresh', 'prompt_rerun', 'gsc_sync_daily', 'ga4_sync_daily'));
END
$$;

-- Add ga4_sync_daily to recurring_job_runs job_type constraint.
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
        CHECK (job_type IN ('audit_refresh', 'prompt_rerun', 'gsc_sync_daily', 'ga4_sync_daily'));
END
$$;
