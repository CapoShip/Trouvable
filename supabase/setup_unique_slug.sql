-- Setup script to ensure client_slug is uniquely constrained in DB
-- Run this in the Supabase SQL editor

-- Verify/Add UNIQUE constraint on the client_slug column
ALTER TABLE public.client_geo_profiles ADD CONSTRAINT client_geo_profiles_client_slug_key UNIQUE (client_slug);

-- Alternatively, creating a unique index:
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_client_geo_profiles_slug ON public.client_geo_profiles (client_slug);
