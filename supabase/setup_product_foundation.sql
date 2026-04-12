-- =============================================================
-- Trouvable Product Foundation v1 — Tables additionnelles
-- À exécuter dans Supabase SQL Editor (idempotent)
-- Référence: client_geo_profiles.id comme client_id partout
-- =============================================================

-- Tracked Queries (requêtes GEO suivies par client)
CREATE TABLE IF NOT EXISTS public.tracked_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    discovery_mode TEXT NOT NULL DEFAULT 'brand_aware',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Query Runs (exécution d'une requête GEO via modèle IA)
CREATE TABLE IF NOT EXISTS public.query_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    tracked_query_id UUID REFERENCES public.tracked_queries(id) ON DELETE SET NULL,
    query_text TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    response_text TEXT,
    target_found BOOLEAN DEFAULT false,
    target_position INT,
    total_mentioned INT DEFAULT 0,
    discovery_mode TEXT NOT NULL DEFAULT 'brand_aware',
    raw_analysis JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Query Mentions (business mentionnés dans une réponse IA)
CREATE TABLE IF NOT EXISTS public.query_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_run_id UUID NOT NULL REFERENCES public.query_runs(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    position INT NOT NULL,
    context TEXT,
    is_target BOOLEAN DEFAULT false,
    sentiment TEXT DEFAULT 'neutral',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Opportunities (issues détectées lors d'un audit)
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    audit_id UUID REFERENCES public.client_site_audits(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    category TEXT DEFAULT 'general',
    source TEXT DEFAULT 'recommended' CHECK (source IN ('observed', 'inferred', 'recommended')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'done', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Merge Suggestions (données suggérées pour enrichir le profil)
CREATE TABLE IF NOT EXISTS public.merge_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    audit_id UUID REFERENCES public.client_site_audits(id) ON DELETE SET NULL,
    field_name TEXT NOT NULL,
    current_value TEXT,
    suggested_value TEXT NOT NULL,
    confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('high', 'medium', 'low')),
    rationale TEXT,
    source TEXT DEFAULT 'recommended' CHECK (source IN ('observed', 'inferred', 'recommended')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'rejected')),
    applied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Actions Log (journal d'actions admin)
CREATE TABLE IF NOT EXISTS public.actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    performed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tracked_queries_client ON public.tracked_queries(client_id);
CREATE INDEX IF NOT EXISTS idx_query_runs_client ON public.query_runs(client_id);
CREATE INDEX IF NOT EXISTS idx_query_mentions_run ON public.query_mentions(query_run_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_client ON public.opportunities(client_id);
CREATE INDEX IF NOT EXISTS idx_merge_suggestions_client ON public.merge_suggestions(client_id);
CREATE INDEX IF NOT EXISTS idx_actions_client ON public.actions(client_id);

-- RLS (toutes les tables admin-only, pas de policies public)
ALTER TABLE public.tracked_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merge_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;

-- Triggers updated_at
DROP TRIGGER IF EXISTS tgr_tracked_queries_updated_at ON public.tracked_queries;
CREATE TRIGGER tgr_tracked_queries_updated_at
    BEFORE UPDATE ON public.tracked_queries
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
