-- Enforce cross-client serialization for the prompt-run family.
-- This is intentionally narrow: only prompt_rerun is globally serialized.

-- If concurrent prompt_rerun rows are already in running state, keep the oldest
-- and defer the rest so the unique partial index can be created safely.
WITH ranked_running AS (
    SELECT
        id,
        row_number() OVER (
            PARTITION BY job_type
            ORDER BY started_at ASC NULLS LAST, created_at ASC, id ASC
        ) AS rank_in_family
    FROM public.recurring_job_runs
    WHERE status = 'running'
    AND job_type = 'prompt_rerun'
)
UPDATE public.recurring_job_runs
SET
    status = 'pending',
    started_at = NULL,
    scheduled_for = now() + interval '3 minutes',
    error_message = 'Deferred by migration to enforce global prompt-run lock.'
WHERE id IN (
    SELECT id
    FROM ranked_running
    WHERE rank_in_family > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_recurring_job_runs_running_prompt_rerun_global
    ON public.recurring_job_runs (job_type)
    WHERE status = 'running'
    AND job_type = 'prompt_rerun';
