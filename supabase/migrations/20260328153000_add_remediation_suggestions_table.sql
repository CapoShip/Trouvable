-- Migration: Add remediation_suggestions table
-- Date: 2026-03-28
-- Risk: LOW (additive admin-only table)
-- Rollback:
--   DROP TRIGGER IF EXISTS tgr_update_remediation_suggestions_updated_at ON public.remediation_suggestions;
--   DROP TABLE IF EXISTS public.remediation_suggestions;

CREATE TABLE IF NOT EXISTS public.remediation_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    problem_type TEXT NOT NULL,
    problem_source TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'draft',
    prompt_system TEXT NOT NULL,
    prompt_user TEXT NOT NULL,
    ai_output TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.remediation_suggestions
    DROP CONSTRAINT IF EXISTS remediation_suggestions_problem_type_check;

ALTER TABLE public.remediation_suggestions
    ADD CONSTRAINT remediation_suggestions_problem_type_check
    CHECK (problem_type IN (
        'missing_faq_for_intent',
        'target_never_found',
        'weak_local_clarity',
        'schema_missing_or_incoherent',
        'job_audit_flaky',
        'job_prompt_rerun_inactive',
        'visibility_declining',
        'ai_crawlers_blocked',
        'llms_txt_missing'
    ));

ALTER TABLE public.remediation_suggestions
    DROP CONSTRAINT IF EXISTS remediation_suggestions_problem_source_check;

ALTER TABLE public.remediation_suggestions
    ADD CONSTRAINT remediation_suggestions_problem_source_check
    CHECK (problem_source IN ('geo_runs', 'continuous_jobs', 'action_center', 'audit'));

ALTER TABLE public.remediation_suggestions
    DROP CONSTRAINT IF EXISTS remediation_suggestions_severity_check;

ALTER TABLE public.remediation_suggestions
    ADD CONSTRAINT remediation_suggestions_severity_check
    CHECK (severity IN ('low', 'medium', 'high', 'critical'));

ALTER TABLE public.remediation_suggestions
    DROP CONSTRAINT IF EXISTS remediation_suggestions_status_check;

ALTER TABLE public.remediation_suggestions
    ADD CONSTRAINT remediation_suggestions_status_check
    CHECK (status IN ('draft', 'approved', 'applied', 'discarded'));

CREATE INDEX IF NOT EXISTS idx_remediation_suggestions_client_created_at
    ON public.remediation_suggestions (client_id, created_at DESC);

ALTER TABLE public.remediation_suggestions ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tgr_update_remediation_suggestions_updated_at ON public.remediation_suggestions;
CREATE TRIGGER tgr_update_remediation_suggestions_updated_at
    BEFORE UPDATE ON public.remediation_suggestions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();