-- setup_site_audits.sql
-- Module d'Audit V1 : Table de scoring et d'historique de web crawling

CREATE TABLE IF NOT EXISTS public.client_site_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.client_geo_profiles(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL,
    resolved_url TEXT,
    audit_version TEXT DEFAULT '1.0',
    scan_status TEXT DEFAULT 'pending' CHECK (scan_status IN ('pending', 'running', 'success', 'partial_error', 'failed')),
    scanned_pages JSONB DEFAULT '[]'::jsonb,
    seo_score INTEGER DEFAULT 0,
    geo_score INTEGER DEFAULT 0,
    seo_breakdown JSONB DEFAULT '{}'::jsonb,
    geo_breakdown JSONB DEFAULT '{}'::jsonb,
    extracted_data JSONB DEFAULT '{}'::jsonb,
    issues JSONB DEFAULT '[]'::jsonb,
    strengths JSONB DEFAULT '[]'::jsonb,
    prefill_suggestions JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Accélérer le filtrage par client et la recherche du dernier audit
CREATE INDEX IF NOT EXISTS idx_client_site_audits_client_id_created_at ON public.client_site_audits(client_id, created_at DESC);

-- RLS bypass by service role (same as other tables)
ALTER TABLE public.client_site_audits ENABLE ROW LEVEL SECURITY;
