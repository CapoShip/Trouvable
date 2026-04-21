-- Migration: Add correction_prompts table
-- Date: 2026-04-20
-- Risk: LOW (additive admin-only table for prompt generation history)
-- Rollback:
--   DROP TRIGGER IF EXISTS tgr_update_correction_prompts_updated_at ON public.correction_prompts;
--   DROP TABLE IF EXISTS public.correction_prompts;
--
-- Purpose:
--   Persist every prompt correctif généré via la page « Prompts de correction »
--   ou le drawer universel. Supporte toutes les sources ProblemRef (SEO Health,
--   Lab Layer 1/2, opportunités SEO/GEO, alertes, agent fixes, etc.), ainsi que
--   tous les taskType (correction, rewrite, geo_improvement, seo_improvement,
--   entity_trust, citation_readability, prompt_ready_content, page_specific).
--
--   Sert à l'historique opérateur, à la dé-duplication des générations, et au
--   futur suivi de l'état « draft / copied / applied / discarded » des prompts.

CREATE TABLE IF NOT EXISTS public.correction_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,

    -- Référence du problème d'origine (ProblemRef canonique)
    source TEXT NOT NULL,
    issue_id TEXT,
    check_id TEXT,
    finding_id TEXT,
    opportunity_id TEXT,
    page_url TEXT,
    layer TEXT,
    dimension TEXT,
    category TEXT,

    -- Paramètres de génération
    task_type TEXT NOT NULL DEFAULT 'correction',
    variant TEXT,                    -- 'standard' | 'strict' | NULL (les deux générés)
    trigger_source TEXT NOT NULL DEFAULT 'manual',

    -- Sortie Mistral structurée + plaintext
    prompt_standard TEXT,
    prompt_strict TEXT,
    context_summary JSONB,
    validation JSONB,
    ai_run_id UUID,

    -- Suivi opérateur
    status TEXT NOT NULL DEFAULT 'draft',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.correction_prompts
    DROP CONSTRAINT IF EXISTS correction_prompts_source_check;

ALTER TABLE public.correction_prompts
    ADD CONSTRAINT correction_prompts_source_check
    CHECK (source IN (
        'seo_health_issue',
        'lab_layer1_check',
        'lab_layer2_finding',
        'seo_opportunity',
        'seo_cannibalization',
        'seo_on_page',
        'geo_opportunity',
        'geo_readiness_blocker',
        'geo_consistency_gap',
        'geo_alert',
        'agent_fix',
        'audit_priority_problem'
    ));

ALTER TABLE public.correction_prompts
    DROP CONSTRAINT IF EXISTS correction_prompts_task_type_check;

ALTER TABLE public.correction_prompts
    ADD CONSTRAINT correction_prompts_task_type_check
    CHECK (task_type IN (
        'correction',
        'rewrite_content',
        'geo_improvement',
        'seo_improvement',
        'entity_trust',
        'citation_readability',
        'prompt_ready_content',
        'page_specific'
    ));

ALTER TABLE public.correction_prompts
    DROP CONSTRAINT IF EXISTS correction_prompts_status_check;

ALTER TABLE public.correction_prompts
    ADD CONSTRAINT correction_prompts_status_check
    CHECK (status IN ('draft', 'copied', 'applied', 'discarded'));

CREATE INDEX IF NOT EXISTS idx_correction_prompts_client_created_at
    ON public.correction_prompts (client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_correction_prompts_client_source
    ON public.correction_prompts (client_id, source);

CREATE INDEX IF NOT EXISTS idx_correction_prompts_issue
    ON public.correction_prompts (client_id, issue_id)
    WHERE issue_id IS NOT NULL;

ALTER TABLE public.correction_prompts ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tgr_update_correction_prompts_updated_at ON public.correction_prompts;
CREATE TRIGGER tgr_update_correction_prompts_updated_at
    BEFORE UPDATE ON public.correction_prompts
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

COMMENT ON TABLE public.correction_prompts IS
    'Historique des prompts correctifs générés par l''admin dashboard. Supporte toutes les sources ProblemRef et tous les taskType. Admin-only via service role.';
