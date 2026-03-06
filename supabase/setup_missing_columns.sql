-- Executer ceci dans le SQL Editor de Supabase si les colonnes manquent
-- Ceci met à jour la table client_geo_profiles existante avec les colonnes manquantes.

ALTER TABLE public.client_geo_profiles 
    ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS social_profiles JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS address JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS geo_faqs JSONB DEFAULT '[]'::jsonb;
