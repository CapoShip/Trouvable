-- Migration: Add AI task runs table for generic AI traceability
-- This provides cross-domain logging for all AI task executions (community, audit, remediation, etc.)

CREATE TABLE IF NOT EXISTS public.ai_task_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.client_geo_profiles(id) ON DELETE SET NULL,
    task_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    input_hash TEXT,
    input_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    output_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    usage_tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
    latency_ms INTEGER,
    error_message TEXT,
    error_class TEXT,
    validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'partial', 'invalid')),
    validation_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    trigger_source TEXT NOT NULL DEFAULT 'system' CHECK (trigger_source IN ('cron', 'manual', 'pipeline', 'system')),
    parent_run_id UUID REFERENCES public.ai_task_runs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_task_runs ENABLE ROW LEVEL SECURITY;

-- Index for "what AI calls ran for client X recently?"
CREATE INDEX IF NOT EXISTS idx_ai_task_runs_client_task
    ON public.ai_task_runs (client_id, task_id, created_at DESC);

-- Index for monitoring: recent failures across all tasks
CREATE INDEX IF NOT EXISTS idx_ai_task_runs_status
    ON public.ai_task_runs (status, created_at DESC)
    WHERE status = 'failed';

-- Index for parent/child task tracing
CREATE INDEX IF NOT EXISTS idx_ai_task_runs_parent
    ON public.ai_task_runs (parent_run_id)
    WHERE parent_run_id IS NOT NULL;
