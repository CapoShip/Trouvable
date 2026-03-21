-- Repair legacy foreign keys that still reference old tables such as public.clients.
-- This migration reasserts the canonical relationships used by the current app.

DO $$
DECLARE
    fk_row RECORD;
BEGIN
    FOR fk_row IN
        SELECT
            n.nspname AS schema_name,
            c.relname AS table_name,
            con.conname AS constraint_name,
            a.attname AS column_name
        FROM pg_constraint con
        JOIN pg_class c ON c.oid = con.conrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN unnest(con.conkey) AS cols(attnum) ON true
        JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = cols.attnum
        WHERE con.contype = 'f'
          AND n.nspname = 'public'
          AND (
              (c.relname IN ('client_site_audits', 'tracked_queries', 'query_runs', 'opportunities', 'merge_suggestions', 'actions', 'client_portal_access') AND a.attname = 'client_id')
              OR (c.relname = 'query_runs' AND a.attname = 'tracked_query_id')
              OR (c.relname = 'query_mentions' AND a.attname = 'query_run_id')
              OR (c.relname IN ('opportunities', 'merge_suggestions') AND a.attname = 'audit_id')
          )
    LOOP
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I', fk_row.schema_name, fk_row.table_name, fk_row.constraint_name);
    END LOOP;
END;
$$;

ALTER TABLE public.client_site_audits
    ADD CONSTRAINT client_site_audits_client_id_fkey
    FOREIGN KEY (client_id)
    REFERENCES public.client_geo_profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.tracked_queries
    ADD CONSTRAINT tracked_queries_client_id_fkey
    FOREIGN KEY (client_id)
    REFERENCES public.client_geo_profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.query_runs
    ADD CONSTRAINT query_runs_client_id_fkey
    FOREIGN KEY (client_id)
    REFERENCES public.client_geo_profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.query_runs
    ADD CONSTRAINT query_runs_tracked_query_id_fkey
    FOREIGN KEY (tracked_query_id)
    REFERENCES public.tracked_queries(id)
    ON DELETE SET NULL;

ALTER TABLE public.query_mentions
    ADD CONSTRAINT query_mentions_query_run_id_fkey
    FOREIGN KEY (query_run_id)
    REFERENCES public.query_runs(id)
    ON DELETE CASCADE;

ALTER TABLE public.opportunities
    ADD CONSTRAINT opportunities_client_id_fkey
    FOREIGN KEY (client_id)
    REFERENCES public.client_geo_profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.opportunities
    ADD CONSTRAINT opportunities_audit_id_fkey
    FOREIGN KEY (audit_id)
    REFERENCES public.client_site_audits(id)
    ON DELETE SET NULL;

ALTER TABLE public.merge_suggestions
    ADD CONSTRAINT merge_suggestions_client_id_fkey
    FOREIGN KEY (client_id)
    REFERENCES public.client_geo_profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.merge_suggestions
    ADD CONSTRAINT merge_suggestions_audit_id_fkey
    FOREIGN KEY (audit_id)
    REFERENCES public.client_site_audits(id)
    ON DELETE SET NULL;

ALTER TABLE public.actions
    ADD CONSTRAINT actions_client_id_fkey
    FOREIGN KEY (client_id)
    REFERENCES public.client_geo_profiles(id)
    ON DELETE CASCADE;

ALTER TABLE public.client_portal_access
    ADD CONSTRAINT client_portal_access_client_id_fkey
    FOREIGN KEY (client_id)
    REFERENCES public.client_geo_profiles(id)
    ON DELETE CASCADE;
