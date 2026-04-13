-- setup_social_watch_config.sql
-- Adds social_watch_config JSONB column to client_geo_profiles.
-- This stores structured mandate context for the Veille sociale pipeline:
--   goals, known_competitors, monitored_topics, target_customer_description,
--   language_priority, subreddit_targets.
-- Idempotent — safe to run multiple times.

ALTER TABLE public.client_geo_profiles
    ADD COLUMN IF NOT EXISTS social_watch_config JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.client_geo_profiles.social_watch_config IS
    'Structured mandate context for the Veille sociale pipeline. Keys: goals (text[]), known_competitors (text[]), monitored_topics (text[]), target_customer_description (text), language_priority (text), subreddit_targets (text[]).';
