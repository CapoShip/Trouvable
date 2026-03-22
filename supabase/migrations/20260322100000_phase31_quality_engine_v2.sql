-- Phase 3.1 - Quality engine upgrade
-- Adds prompt quality metadata, full run artifacts, richer extraction fields,
-- benchmark sessions, and competitor alias registry.

-- ---------------------------------------------------------------------------
-- Benchmark sessions
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.benchmark_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    tracked_query_id UUID REFERENCES public.tracked_queries(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    requested_variants JSONB NOT NULL DEFAULT '[]'::jsonb,
    initiated_by TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.benchmark_sessions
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS tracked_query_id UUID REFERENCES public.tracked_queries(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed',
    ADD COLUMN IF NOT EXISTS requested_variants JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS initiated_by TEXT,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.benchmark_sessions
SET
    status = COALESCE(NULLIF(BTRIM(status), ''), 'completed'),
    requested_variants = COALESCE(requested_variants, '[]'::jsonb),
    created_at = COALESCE(created_at, now()),
    updated_at = COALESCE(updated_at, now());

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'benchmark_sessions_status_check'
    ) THEN
        ALTER TABLE public.benchmark_sessions
            ADD CONSTRAINT benchmark_sessions_status_check
            CHECK (status IN ('pending', 'running', 'completed', 'failed'));
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_benchmark_sessions_client_created
    ON public.benchmark_sessions (client_id, created_at DESC);

ALTER TABLE public.benchmark_sessions ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tgr_benchmark_sessions_updated_at ON public.benchmark_sessions;
CREATE TRIGGER tgr_benchmark_sessions_updated_at
    BEFORE UPDATE ON public.benchmark_sessions
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Competitor aliases
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.competitor_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    canonical_name TEXT NOT NULL,
    alias TEXT NOT NULL,
    match_type TEXT NOT NULL DEFAULT 'exact',
    locale TEXT NOT NULL DEFAULT 'fr-CA',
    is_active BOOLEAN NOT NULL DEFAULT true,
    confidence NUMERIC(5,4) NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.competitor_aliases
    ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS canonical_name TEXT,
    ADD COLUMN IF NOT EXISTS alias TEXT,
    ADD COLUMN IF NOT EXISTS match_type TEXT NOT NULL DEFAULT 'exact',
    ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'fr-CA',
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS confidence NUMERIC(5,4) NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.competitor_aliases
SET
    canonical_name = COALESCE(NULLIF(BTRIM(canonical_name), ''), '[unknown competitor]'),
    alias = COALESCE(NULLIF(BTRIM(alias), ''), '[unknown alias]'),
    match_type = CASE
        WHEN match_type IN ('exact', 'fuzzy_safe') THEN match_type
        ELSE 'exact'
    END,
    locale = COALESCE(NULLIF(BTRIM(locale), ''), 'fr-CA'),
    is_active = COALESCE(is_active, true),
    confidence = LEAST(1, GREATEST(0, COALESCE(confidence, 1))),
    created_at = COALESCE(created_at, now()),
    updated_at = COALESCE(updated_at, now());

ALTER TABLE public.competitor_aliases
    ALTER COLUMN canonical_name SET NOT NULL,
    ALTER COLUMN alias SET NOT NULL,
    ALTER COLUMN match_type SET NOT NULL,
    ALTER COLUMN locale SET NOT NULL,
    ALTER COLUMN is_active SET NOT NULL,
    ALTER COLUMN confidence SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'competitor_aliases_match_type_check'
    ) THEN
        ALTER TABLE public.competitor_aliases
            ADD CONSTRAINT competitor_aliases_match_type_check
            CHECK (match_type IN ('exact', 'fuzzy_safe'));
    END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_competitor_aliases_client_alias_unique
    ON public.competitor_aliases (client_id, lower(alias));

CREATE INDEX IF NOT EXISTS idx_competitor_aliases_client_active
    ON public.competitor_aliases (client_id, is_active, updated_at DESC);

ALTER TABLE public.competitor_aliases ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS tgr_competitor_aliases_updated_at ON public.competitor_aliases;
CREATE TRIGGER tgr_competitor_aliases_updated_at
    BEFORE UPDATE ON public.competitor_aliases
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- tracked_queries prompt quality metadata
-- ---------------------------------------------------------------------------

ALTER TABLE public.tracked_queries
    ADD COLUMN IF NOT EXISTS prompt_origin TEXT DEFAULT 'manual_operator',
    ADD COLUMN IF NOT EXISTS intent_family TEXT DEFAULT 'discovery',
    ADD COLUMN IF NOT EXISTS query_type_v2 TEXT DEFAULT 'informational',
    ADD COLUMN IF NOT EXISTS funnel_stage TEXT DEFAULT 'consideration',
    ADD COLUMN IF NOT EXISTS geo_scope TEXT DEFAULT 'market',
    ADD COLUMN IF NOT EXISTS brand_scope TEXT DEFAULT 'market_generic',
    ADD COLUMN IF NOT EXISTS comparison_scope TEXT DEFAULT 'none',
    ADD COLUMN IF NOT EXISTS quality_status TEXT DEFAULT 'review',
    ADD COLUMN IF NOT EXISTS quality_score NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS quality_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS prompt_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.tracked_queries
SET
    prompt_origin = COALESCE(NULLIF(BTRIM(prompt_origin), ''), 'manual_operator'),
    intent_family = COALESCE(NULLIF(BTRIM(intent_family), ''), 'discovery'),
    query_type_v2 = COALESCE(NULLIF(BTRIM(query_type_v2), ''), 'informational'),
    funnel_stage = COALESCE(NULLIF(BTRIM(funnel_stage), ''), 'consideration'),
    geo_scope = COALESCE(NULLIF(BTRIM(geo_scope), ''), 'market'),
    brand_scope = COALESCE(NULLIF(BTRIM(brand_scope), ''), 'market_generic'),
    comparison_scope = COALESCE(NULLIF(BTRIM(comparison_scope), ''), 'none'),
    quality_status = CASE
        WHEN quality_status IN ('strong', 'review', 'weak') THEN quality_status
        ELSE 'review'
    END,
    quality_score = COALESCE(quality_score, 0),
    quality_reasons = COALESCE(quality_reasons, '[]'::jsonb),
    prompt_metadata = COALESCE(prompt_metadata, '{}'::jsonb);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'tracked_queries_quality_status_check'
    ) THEN
        ALTER TABLE public.tracked_queries
            ADD CONSTRAINT tracked_queries_quality_status_check
            CHECK (quality_status IN ('strong', 'review', 'weak'));
    END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- query_runs full response capture + benchmark metadata
-- ---------------------------------------------------------------------------

ALTER TABLE public.query_runs
    ADD COLUMN IF NOT EXISTS run_mode TEXT DEFAULT 'standard',
    ADD COLUMN IF NOT EXISTS engine_variant TEXT DEFAULT 'tavily_orchestrated',
    ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'fr-CA',
    ADD COLUMN IF NOT EXISTS benchmark_session_id UUID REFERENCES public.benchmark_sessions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS prompt_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS raw_response_full TEXT,
    ADD COLUMN IF NOT EXISTS normalized_response JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS parse_status TEXT DEFAULT 'parsed_failed',
    ADD COLUMN IF NOT EXISTS parse_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS latency_ms INTEGER,
    ADD COLUMN IF NOT EXISTS usage_tokens JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS error_class TEXT,
    ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS extraction_version TEXT DEFAULT 'v2',
    ADD COLUMN IF NOT EXISTS parse_confidence NUMERIC(6,4),
    ADD COLUMN IF NOT EXISTS target_detection JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.query_runs
SET
    run_mode = CASE
        WHEN run_mode IN ('standard', 'benchmark') THEN run_mode
        ELSE 'standard'
    END,
    engine_variant = COALESCE(NULLIF(BTRIM(engine_variant), ''), 'tavily_orchestrated'),
    locale = COALESCE(NULLIF(BTRIM(locale), ''), 'fr-CA'),
    prompt_payload = COALESCE(prompt_payload, '{}'::jsonb),
    raw_response_full = COALESCE(raw_response_full, response_text),
    normalized_response = COALESCE(normalized_response, parsed_response, '{}'::jsonb),
    parse_status = CASE
        WHEN parse_status IN ('parsed_success', 'parsed_partial', 'parsed_failed') THEN parse_status
        WHEN status = 'completed' THEN 'parsed_partial'
        ELSE 'parsed_failed'
    END,
    parse_warnings = COALESCE(parse_warnings, '[]'::jsonb),
    usage_tokens = COALESCE(usage_tokens, '{}'::jsonb),
    retry_count = COALESCE(retry_count, 0),
    extraction_version = COALESCE(NULLIF(BTRIM(extraction_version), ''), 'v2'),
    target_detection = COALESCE(target_detection, '{}'::jsonb);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'query_runs_run_mode_check'
    ) THEN
        ALTER TABLE public.query_runs
            ADD CONSTRAINT query_runs_run_mode_check
            CHECK (run_mode IN ('standard', 'benchmark'));
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'query_runs_parse_status_check'
    ) THEN
        ALTER TABLE public.query_runs
            ADD CONSTRAINT query_runs_parse_status_check
            CHECK (parse_status IN ('parsed_success', 'parsed_partial', 'parsed_failed'));
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_query_runs_mode_created
    ON public.query_runs (run_mode, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_runs_benchmark_session
    ON public.query_runs (benchmark_session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_runs_variant_created
    ON public.query_runs (engine_variant, created_at DESC);

-- ---------------------------------------------------------------------------
-- query_mentions richer extraction metadata
-- ---------------------------------------------------------------------------

ALTER TABLE public.query_mentions
    ADD COLUMN IF NOT EXISTS mention_kind TEXT DEFAULT 'mentioned',
    ADD COLUMN IF NOT EXISTS mentioned_url TEXT,
    ADD COLUMN IF NOT EXISTS mentioned_domain TEXT,
    ADD COLUMN IF NOT EXISTS mentioned_source_name TEXT,
    ADD COLUMN IF NOT EXISTS normalized_domain TEXT,
    ADD COLUMN IF NOT EXISTS normalized_label TEXT,
    ADD COLUMN IF NOT EXISTS source_type TEXT,
    ADD COLUMN IF NOT EXISTS source_confidence NUMERIC(6,4),
    ADD COLUMN IF NOT EXISTS source_evidence_span TEXT,
    ADD COLUMN IF NOT EXISTS evidence_span TEXT,
    ADD COLUMN IF NOT EXISTS confidence NUMERIC(6,4),
    ADD COLUMN IF NOT EXISTS first_position INTEGER,
    ADD COLUMN IF NOT EXISTS co_occurs_with_target BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS verified_status TEXT DEFAULT 'mentioned',
    ADD COLUMN IF NOT EXISTS recommendation_strength TEXT;

UPDATE public.query_mentions
SET
    mention_kind = CASE
        WHEN mention_kind IN ('mentioned', 'recommended', 'normalized', 'verified', 'low_confidence') THEN mention_kind
        ELSE 'mentioned'
    END,
    normalized_domain = COALESCE(NULLIF(BTRIM(normalized_domain), ''), NULLIF(BTRIM(mentioned_domain), '')),
    normalized_label = COALESCE(NULLIF(BTRIM(normalized_label), ''), NULLIF(BTRIM(business_name), ''), '[unknown mention]'),
    source_type = COALESCE(NULLIF(BTRIM(source_type), ''), CASE WHEN entity_type = 'source' THEN 'text_mention' ELSE NULL END),
    source_confidence = LEAST(1, GREATEST(0, COALESCE(source_confidence, confidence, 0.5))),
    confidence = LEAST(1, GREATEST(0, COALESCE(confidence, 0.5))),
    first_position = COALESCE(first_position, position),
    co_occurs_with_target = COALESCE(co_occurs_with_target, false),
    verified_status = CASE
        WHEN verified_status IN ('mentioned', 'normalized', 'low_confidence', 'verified') THEN verified_status
        ELSE 'mentioned'
    END,
    recommendation_strength = CASE
        WHEN recommendation_strength IN ('strong', 'medium', 'weak') THEN recommendation_strength
        ELSE recommendation_strength
    END;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'query_mentions_mention_kind_check'
    ) THEN
        ALTER TABLE public.query_mentions
            ADD CONSTRAINT query_mentions_mention_kind_check
            CHECK (mention_kind IN ('mentioned', 'recommended', 'normalized', 'verified', 'low_confidence'));
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'query_mentions_verified_status_check'
    ) THEN
        ALTER TABLE public.query_mentions
            ADD CONSTRAINT query_mentions_verified_status_check
            CHECK (verified_status IN ('mentioned', 'normalized', 'low_confidence', 'verified'));
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'query_mentions_recommendation_strength_check'
    ) THEN
        ALTER TABLE public.query_mentions
            ADD CONSTRAINT query_mentions_recommendation_strength_check
            CHECK (
                recommendation_strength IS NULL
                OR recommendation_strength IN ('strong', 'medium', 'weak')
            );
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_query_mentions_kind
    ON public.query_mentions (mention_kind, entity_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_mentions_normalized_domain
    ON public.query_mentions (normalized_domain);

CREATE INDEX IF NOT EXISTS idx_query_mentions_normalized_label
    ON public.query_mentions (normalized_label);
