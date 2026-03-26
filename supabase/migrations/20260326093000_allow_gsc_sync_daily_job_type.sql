-- Allow GSC recurring job type used by continuous engine defaults.
-- Fixes runtime 500 on cron dispatch when upserting recurring_jobs.

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'recurring_jobs_job_type_check'
          AND conrelid = 'public.recurring_jobs'::regclass
    ) THEN
        ALTER TABLE public.recurring_jobs
            DROP CONSTRAINT recurring_jobs_job_type_check;
    END IF;

    ALTER TABLE public.recurring_jobs
        ADD CONSTRAINT recurring_jobs_job_type_check
        CHECK (job_type IN ('audit_refresh', 'prompt_rerun', 'gsc_sync_daily'));
END
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'recurring_job_runs_job_type_check'
          AND conrelid = 'public.recurring_job_runs'::regclass
    ) THEN
        ALTER TABLE public.recurring_job_runs
            DROP CONSTRAINT recurring_job_runs_job_type_check;
    END IF;

    ALTER TABLE public.recurring_job_runs
        ADD CONSTRAINT recurring_job_runs_job_type_check
        CHECK (job_type IN ('audit_refresh', 'prompt_rerun', 'gsc_sync_daily'));
END
$$;
