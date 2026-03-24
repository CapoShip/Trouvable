-- Prompt Contract v2 persistence hardening
-- Adds first-class columns for canonical prompt contract fields
-- while keeping backward compatibility with prompt_metadata.

ALTER TABLE public.tracked_queries
    ADD COLUMN IF NOT EXISTS prompt_mode TEXT DEFAULT 'user_like',
    ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'review',
    ADD COLUMN IF NOT EXISTS validation_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS offer_anchor TEXT,
    ADD COLUMN IF NOT EXISTS user_visible_offering TEXT,
    ADD COLUMN IF NOT EXISTS target_audience TEXT,
    ADD COLUMN IF NOT EXISTS primary_use_case TEXT,
    ADD COLUMN IF NOT EXISTS differentiation_angle TEXT;

UPDATE public.tracked_queries
SET
    prompt_mode = COALESCE(NULLIF(BTRIM(prompt_mode), ''), NULLIF(BTRIM(prompt_metadata ->> 'prompt_mode'), ''), 'user_like'),
    validation_status = COALESCE(
        NULLIF(BTRIM(validation_status), ''),
        NULLIF(BTRIM(prompt_metadata ->> 'validation_status'), ''),
        quality_status,
        'review'
    ),
    validation_reasons = COALESCE(
        validation_reasons,
        CASE
            WHEN jsonb_typeof(prompt_metadata -> 'validation_reasons') = 'array'
                THEN prompt_metadata -> 'validation_reasons'
            ELSE NULL
        END,
        quality_reasons,
        '[]'::jsonb
    ),
    offer_anchor = COALESCE(NULLIF(BTRIM(offer_anchor), ''), NULLIF(BTRIM(prompt_metadata ->> 'offer_anchor'), ''), NULL),
    user_visible_offering = COALESCE(NULLIF(BTRIM(user_visible_offering), ''), NULLIF(BTRIM(prompt_metadata ->> 'user_visible_offering'), ''), NULL),
    target_audience = COALESCE(NULLIF(BTRIM(target_audience), ''), NULLIF(BTRIM(prompt_metadata ->> 'target_audience'), ''), NULL),
    primary_use_case = COALESCE(NULLIF(BTRIM(primary_use_case), ''), NULLIF(BTRIM(prompt_metadata ->> 'primary_use_case'), ''), NULL),
    differentiation_angle = COALESCE(NULLIF(BTRIM(differentiation_angle), ''), NULLIF(BTRIM(prompt_metadata ->> 'differentiation_angle'), ''), NULL);

UPDATE public.tracked_queries
SET
    prompt_mode = CASE
        WHEN prompt_mode IN ('user_like', 'operator_probe') THEN prompt_mode
        ELSE 'user_like'
    END,
    validation_status = CASE
        WHEN validation_status IN ('strong', 'review', 'weak') THEN validation_status
        WHEN quality_status IN ('strong', 'review', 'weak') THEN quality_status
        ELSE 'review'
    END,
    validation_reasons = COALESCE(validation_reasons, '[]'::jsonb);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tracked_queries_prompt_mode_check'
    ) THEN
        ALTER TABLE public.tracked_queries
            ADD CONSTRAINT tracked_queries_prompt_mode_check
            CHECK (prompt_mode IN ('user_like', 'operator_probe'));
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tracked_queries_validation_status_check'
    ) THEN
        ALTER TABLE public.tracked_queries
            ADD CONSTRAINT tracked_queries_validation_status_check
            CHECK (validation_status IN ('strong', 'review', 'weak'));
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_tracked_queries_prompt_mode
    ON public.tracked_queries (prompt_mode);

CREATE INDEX IF NOT EXISTS idx_tracked_queries_validation_status
    ON public.tracked_queries (validation_status);
