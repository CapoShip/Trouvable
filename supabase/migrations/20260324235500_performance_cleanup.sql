-- Performance cleanup: remove redundant RLS policy and duplicate indexes

-- Keep only the stricter anon insert policy on leads
DROP POLICY IF EXISTS "anon_insert_leads" ON public.leads;

-- Remove duplicate indexes reported by Supabase advisors
DROP INDEX IF EXISTS public.idx_actions_client_id;
DROP INDEX IF EXISTS public.idx_client_geo_profiles_archived_at;
DROP INDEX IF EXISTS public.idx_client_geo_profiles_client_slug;
DROP INDEX IF EXISTS public.idx_merge_suggestions_client_id;
DROP INDEX IF EXISTS public.idx_opportunities_client_id;
DROP INDEX IF EXISTS public.idx_query_mentions_query_run_id;
DROP INDEX IF EXISTS public.idx_query_runs_client_id;
DROP INDEX IF EXISTS public.idx_tracked_queries_client_id;
