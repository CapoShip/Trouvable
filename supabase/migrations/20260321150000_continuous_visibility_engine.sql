-- Continuous Visibility Engine foundation
-- - recurring job definitions and runs (vercel-cron driven)
-- - historical metric snapshots for trend windows (7d / 30d / 90d)
-- - connector-ready connection state model (GA4 / GSC stubs)

CREATE TABLE IF NOT EXISTS public.recurring_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL,
    cadence_minutes INTEGER NOT NULL DEFAULT 1440,
    status TEXT NOT NULL DEFAULT 'pending',
    is_active BOOLEAN NOT NULL DEFAULT true,
    retry_limit INTEGER NOT NULL DEFAULT 2,
    retry_backoff_minutes INTEGER NOT NULL DEFAULT 30,
    next_run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_run_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    locked_until TIMESTAMPTZ,
    lock_token TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_jobs
    ADD COLUMN IF NOT EXISTS cadence_minutes INTEGER NOT NULL DEFAULT 1440,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS retry_limit INTEGER NOT NULL DEFAULT 2,
    ADD COLUMN IF NOT EXISTS retry_backoff_minutes INTEGER NOT NULL DEFAULT 30,
    ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_success_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_failure_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS lock_token TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.recurring_jobs
SET
    cadence_minutes = GREATEST(15, COALESCE(cadence_minutes, 1440)),
    status = COALESCE(NULLIF(BTRIM(status), ''), 'pending'),
    is_active = COALESCE(is_active, true),
    retry_limit = GREATEST(0, COALESCE(retry_limit, 2)),
    retry_backoff_minutes = GREATEST(5, COALESCE(retry_backoff_minutes, 30)),
    next_run_at = COALESCE(next_run_at, now()),
    metadata = COALESCE(metadata, '{}'::jsonb),
    created_at = COALESCE(created_at, now()),
    updated_at = COALESCE(updated_at, now())
WHERE true;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'recurring_jobs_job_type_check'
    ) THEN
        ALTER TABLE public.recurring_jobs
            ADD CONSTRAINT recurring_jobs_job_type_check
            CHECK (job_type IN ('audit_refresh', 'prompt_rerun'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'recurring_jobs_status_check'
    ) THEN
        ALTER TABLE public.recurring_jobs
            ADD CONSTRAINT recurring_jobs_status_check
            CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'recurring_jobs_cadence_minutes_check'
    ) THEN
        ALTER TABLE public.recurring_jobs
            ADD CONSTRAINT recurring_jobs_cadence_minutes_check
            CHECK (cadence_minutes BETWEEN 15 AND 10080);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'recurring_jobs_retry_limit_check'
    ) THEN
        ALTER TABLE public.recurring_jobs
            ADD CONSTRAINT recurring_jobs_retry_limit_check
            CHECK (retry_limit BETWEEN 0 AND 10);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'recurring_jobs_retry_backoff_minutes_check'
    ) THEN
        ALTER TABLE public.recurring_jobs
            ADD CONSTRAINT recurring_jobs_retry_backoff_minutes_check
            CHECK (retry_backoff_minutes BETWEEN 5 AND 1440);
    END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_recurring_jobs_client_type_unique
    ON public.recurring_jobs (client_id, job_type);

CREATE INDEX IF NOT EXISTS idx_recurring_jobs_next_run
    ON public.recurring_jobs (is_active, next_run_at, status);

CREATE INDEX IF NOT EXISTS idx_recurring_jobs_client_status
    ON public.recurring_jobs (client_id, status, updated_at DESC);

ALTER TABLE public.recurring_jobs ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tgr_recurring_jobs_updated_at ON public.recurring_jobs;
CREATE TRIGGER tgr_recurring_jobs_updated_at
    BEFORE UPDATE ON public.recurring_jobs
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();


CREATE TABLE IF NOT EXISTS public.recurring_job_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.recurring_jobs(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL,
    trigger_source TEXT NOT NULL DEFAULT 'cron',
    status TEXT NOT NULL DEFAULT 'pending',
    attempt_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    retry_of UUID REFERENCES public.recurring_job_runs(id) ON DELETE SET NULL,
    dedupe_key TEXT,
    error_message TEXT,
    result_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    run_context JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_job_runs
    ADD COLUMN IF NOT EXISTS trigger_source TEXT NOT NULL DEFAULT 'cron',
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS max_attempts INTEGER NOT NULL DEFAULT 3,
    ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS retry_of UUID REFERENCES public.recurring_job_runs(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS dedupe_key TEXT,
    ADD COLUMN IF NOT EXISTS error_message TEXT,
    ADD COLUMN IF NOT EXISTS result_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS run_context JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.recurring_job_runs
SET
    trigger_source = COALESCE(NULLIF(BTRIM(trigger_source), ''), 'cron'),
    status = COALESCE(NULLIF(BTRIM(status), ''), 'pending'),
    attempt_count = GREATEST(0, COALESCE(attempt_count, 0)),
    max_attempts = GREATEST(1, COALESCE(max_attempts, 3)),
    scheduled_for = COALESCE(scheduled_for, now()),
    result_summary = COALESCE(result_summary, '{}'::jsonb),
    run_context = COALESCE(run_context, '{}'::jsonb),
    created_at = COALESCE(created_at, now()),
    updated_at = COALESCE(updated_at, now())
WHERE true;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'recurring_job_runs_job_type_check'
    ) THEN
        ALTER TABLE public.recurring_job_runs
            ADD CONSTRAINT recurring_job_runs_job_type_check
            CHECK (job_type IN ('audit_refresh', 'prompt_rerun'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'recurring_job_runs_trigger_source_check'
    ) THEN
        ALTER TABLE public.recurring_job_runs
            ADD CONSTRAINT recurring_job_runs_trigger_source_check
            CHECK (trigger_source IN ('cron', 'manual', 'retry', 'system'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'recurring_job_runs_status_check'
    ) THEN
        ALTER TABLE public.recurring_job_runs
            ADD CONSTRAINT recurring_job_runs_status_check
            CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'recurring_job_runs_attempt_count_check'
    ) THEN
        ALTER TABLE public.recurring_job_runs
            ADD CONSTRAINT recurring_job_runs_attempt_count_check
            CHECK (attempt_count BETWEEN 0 AND 20);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'recurring_job_runs_max_attempts_check'
    ) THEN
        ALTER TABLE public.recurring_job_runs
            ADD CONSTRAINT recurring_job_runs_max_attempts_check
            CHECK (max_attempts BETWEEN 1 AND 20);
    END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_recurring_job_runs_dedupe
    ON public.recurring_job_runs (dedupe_key)
    WHERE dedupe_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recurring_job_runs_runnable
    ON public.recurring_job_runs (status, scheduled_for, created_at);

CREATE INDEX IF NOT EXISTS idx_recurring_job_runs_job_created
    ON public.recurring_job_runs (job_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recurring_job_runs_client_created
    ON public.recurring_job_runs (client_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_recurring_job_runs_running_client_type
    ON public.recurring_job_runs (client_id, job_type)
    WHERE status = 'running';

ALTER TABLE public.recurring_job_runs ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tgr_recurring_job_runs_updated_at ON public.recurring_job_runs;
CREATE TRIGGER tgr_recurring_job_runs_updated_at
    BEFORE UPDATE ON public.recurring_job_runs
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();


CREATE TABLE IF NOT EXISTS public.visibility_metric_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    source_job_run_id UUID REFERENCES public.recurring_job_runs(id) ON DELETE SET NULL,
    source TEXT NOT NULL DEFAULT 'system',
    snapshot_date DATE NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    seo_score INTEGER,
    geo_score INTEGER,
    visibility_proxy_percent INTEGER,
    mention_rate_percent INTEGER,
    citation_coverage_percent INTEGER,
    competitor_visibility_count INTEGER,
    freshness_audit_at TIMESTAMPTZ,
    freshness_run_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.visibility_metric_snapshots
    ADD COLUMN IF NOT EXISTS source_job_run_id UUID REFERENCES public.recurring_job_runs(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'system',
    ADD COLUMN IF NOT EXISTS snapshot_date DATE,
    ADD COLUMN IF NOT EXISTS captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS seo_score INTEGER,
    ADD COLUMN IF NOT EXISTS geo_score INTEGER,
    ADD COLUMN IF NOT EXISTS visibility_proxy_percent INTEGER,
    ADD COLUMN IF NOT EXISTS mention_rate_percent INTEGER,
    ADD COLUMN IF NOT EXISTS citation_coverage_percent INTEGER,
    ADD COLUMN IF NOT EXISTS competitor_visibility_count INTEGER,
    ADD COLUMN IF NOT EXISTS freshness_audit_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS freshness_run_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.visibility_metric_snapshots
SET
    source = COALESCE(NULLIF(BTRIM(source), ''), 'system'),
    snapshot_date = COALESCE(snapshot_date, (COALESCE(captured_at, created_at, now()))::date),
    metadata = COALESCE(metadata, '{}'::jsonb),
    captured_at = COALESCE(captured_at, created_at, now()),
    created_at = COALESCE(created_at, now())
WHERE true;

ALTER TABLE public.visibility_metric_snapshots
    ALTER COLUMN snapshot_date SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'visibility_metric_snapshots_source_check'
    ) THEN
        ALTER TABLE public.visibility_metric_snapshots
            ADD CONSTRAINT visibility_metric_snapshots_source_check
            CHECK (source IN ('system', 'cron', 'manual'));
    END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_visibility_metric_snapshots_client_day
    ON public.visibility_metric_snapshots (client_id, snapshot_date);

CREATE INDEX IF NOT EXISTS idx_visibility_metric_snapshots_client_captured
    ON public.visibility_metric_snapshots (client_id, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_visibility_metric_snapshots_client_day_desc
    ON public.visibility_metric_snapshots (client_id, snapshot_date DESC);

ALTER TABLE public.visibility_metric_snapshots ENABLE ROW LEVEL SECURITY;


CREATE TABLE IF NOT EXISTS public.client_data_connectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_connected',
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_synced_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_data_connectors
    ADD COLUMN IF NOT EXISTS provider TEXT,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'not_connected',
    ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_error TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.client_data_connectors
SET
    provider = COALESCE(NULLIF(BTRIM(provider), ''), 'ga4'),
    status = COALESCE(NULLIF(BTRIM(status), ''), 'not_connected'),
    config = COALESCE(config, '{}'::jsonb),
    created_at = COALESCE(created_at, now()),
    updated_at = COALESCE(updated_at, now())
WHERE true;

ALTER TABLE public.client_data_connectors
    ALTER COLUMN provider SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'client_data_connectors_provider_check'
    ) THEN
        ALTER TABLE public.client_data_connectors
            ADD CONSTRAINT client_data_connectors_provider_check
            CHECK (provider IN ('ga4', 'gsc'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'client_data_connectors_status_check'
    ) THEN
        ALTER TABLE public.client_data_connectors
            ADD CONSTRAINT client_data_connectors_status_check
            CHECK (status IN ('not_connected', 'configured', 'disabled', 'sample_mode', 'error'));
    END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_client_data_connectors_client_provider
    ON public.client_data_connectors (client_id, provider);

CREATE INDEX IF NOT EXISTS idx_client_data_connectors_client_status
    ON public.client_data_connectors (client_id, status, updated_at DESC);

ALTER TABLE public.client_data_connectors ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tgr_client_data_connectors_updated_at ON public.client_data_connectors;
CREATE TRIGGER tgr_client_data_connectors_updated_at
    BEFORE UPDATE ON public.client_data_connectors
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();


-- Backfill default recurring jobs for every active client (idempotent by unique index)
INSERT INTO public.recurring_jobs (
    client_id,
    job_type,
    cadence_minutes,
    status,
    is_active,
    retry_limit,
    retry_backoff_minutes,
    next_run_at,
    metadata
)
SELECT
    c.id,
    seed.job_type,
    seed.cadence_minutes,
    'pending',
    true,
    2,
    30,
    now() + (seed.initial_delay_minutes || ' minutes')::interval,
    jsonb_build_object('seeded_by_migration', true, 'version', 'phase3_continuous_visibility')
FROM public.client_geo_profiles c
CROSS JOIN (
    VALUES
        ('audit_refresh'::text, 1440::integer, 5::integer),
        ('prompt_rerun'::text, 720::integer, 15::integer)
) AS seed(job_type, cadence_minutes, initial_delay_minutes)
WHERE c.archived_at IS NULL
ON CONFLICT (client_id, job_type) DO NOTHING;


-- Backfill connector rows for existing clients
INSERT INTO public.client_data_connectors (client_id, provider, status, config)
SELECT c.id, seed.provider, 'not_connected', '{}'::jsonb
FROM public.client_geo_profiles c
CROSS JOIN (VALUES ('ga4'::text), ('gsc'::text)) AS seed(provider)
WHERE c.archived_at IS NULL
ON CONFLICT (client_id, provider) DO NOTHING;
