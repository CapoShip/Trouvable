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
