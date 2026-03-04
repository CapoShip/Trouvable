-- schema.sql
-- Run this in Supabase SQL editor to initialize the tracking database

-- 1. Enable pgcrypto (for UUID generation if needed, though gen_random_uuid() is built-in in PG13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create the leads table with robust tracking fields
CREATE TABLE IF NOT EXISTS public.leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    business_type text,
    message text NOT NULL,
    status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
    page_path text,
    utm_source text,
    utm_medium text,
    utm_campaign text
);

-- 3. Row Level Security Posture
-- By default block all web client access. 
-- The Vercel API will use the SUPABASE_SERVICE_ROLE_KEY which automatically bypasses RLS.
-- Therefore, we keep RLS enabled to secure the frontend, but we don't need anon policies.
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Remove previously created unsafe anon policy to enforce service_role only writes
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.leads;

-- Note: No policies are added because service_role bypasses RLS.
