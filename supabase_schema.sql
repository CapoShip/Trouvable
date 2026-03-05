-- SCript de création de la table pour Supabase
-- Exécutez ce script dans l'éditeur SQL de votre tableau de bord Supabase

CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    business_type TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new'::text CHECK (status IN ('new', 'contacted', 'closed')),
    page_path TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT
);

-- Activer la sécurité au niveau des lignes (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- IMPORTANT : Ne créez AUCUNE politique "anon" (Anonymous).
-- Par défaut, quand RLS est activé sans politique, Supabase bloque toutes les requêtes directes (du client).
-- Notre route API Next.js utilise le SUPABASE_SERVICE_ROLE_KEY, qui contourne automatiquement RLS.
-- Cela garantit qu'il est absolument impossible d'insérer des données depuis le navigateur.

-------------------------------------------------------------------------
-- TÂCHE 1 : TABLE DES PROFILS CLIENTS (SEO / GEO / AEO)
-------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS client_geo_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_name TEXT NOT NULL,
    client_slug TEXT NOT NULL UNIQUE,
    website_url TEXT NOT NULL,
    business_type TEXT DEFAULT 'LocalBusiness',
    seo_title TEXT,
    seo_description TEXT,
    social_profiles JSONB DEFAULT '[]'::jsonb,
    address JSONB DEFAULT '{}'::jsonb,
    geo_faqs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Active RLS sur la nouvelle table
ALTER TABLE client_geo_profiles ENABLE ROW LEVEL SECURITY;

-- Exigence : Seulement via service_role, aucune policy publique
-- Par défaut en RLS sans policy, l'accès est refusé, seul le service_role y a accès.

-- Fonction et Trigger pour auto update 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tgr_update_client_geo_profiles_updated_at
    BEFORE UPDATE ON client_geo_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
