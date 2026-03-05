-- schema.sql
-- Run this in Supabase SQL editor to initialize the active database tables.

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. LEADS TABLE (Contact Forms)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    business_type TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
    page_path TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT
);

-- Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
-- Note: No policies are added. All writes are done via service_role bypassing RLS.

-- ==========================================
-- 2. CLIENT GEO PROFILES TABLE (SEO/AEO/GEO)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.client_geo_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    client_slug TEXT NOT NULL UNIQUE,
    website_url TEXT NOT NULL,
    business_type TEXT DEFAULT 'LocalBusiness',
    seo_title TEXT,
    seo_description TEXT,
    social_profiles JSONB DEFAULT '[]'::jsonb,
    address JSONB DEFAULT '{}'::jsonb,
    geo_faqs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Row Level Security
ALTER TABLE public.client_geo_profiles ENABLE ROW LEVEL SECURITY;
-- Note: No policies are added. All reads/writes are done via service_role bypassing RLS.

-- Function and Trigger for auto-updating 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tgr_update_client_geo_profiles_updated_at ON public.client_geo_profiles;
CREATE TRIGGER tgr_update_client_geo_profiles_updated_at
    BEFORE UPDATE ON public.client_geo_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
