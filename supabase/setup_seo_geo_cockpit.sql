-- setup_seo_geo_cockpit.sql
-- Ajout des colonnes JSONB pour la V1 du Cockpit SEO/GEO
-- Maintient la compatibilité avec is_published actuel

ALTER TABLE public.client_geo_profiles
    ADD COLUMN IF NOT EXISTS contact_info JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS business_details JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS seo_data JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS geo_ai_data JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS internal_notes TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS publication_status TEXT DEFAULT 'draft' CHECK (publication_status IN ('draft', 'ready', 'published'));

-- Commentaire: geo_faqs, social_profiles, address restent les sources uniques de vérité.
-- is_published coexiste avec publication_status pour ne pas casser l'existant.
