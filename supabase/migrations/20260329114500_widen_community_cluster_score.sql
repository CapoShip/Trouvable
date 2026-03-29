-- Migration: widen community_clusters score precision
-- Date: 2026-03-29
-- Risk: LOW
-- Rollback: ALTER COLUMN score TYPE NUMERIC(5,2) if values fit the narrower range

ALTER TABLE public.community_clusters
    ALTER COLUMN score TYPE NUMERIC(10,2)
    USING score::NUMERIC(10,2);