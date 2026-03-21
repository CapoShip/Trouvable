ALTER TABLE public.client_portal_access
    DROP CONSTRAINT IF EXISTS client_portal_access_status_check;

UPDATE public.client_portal_access
SET status = 'revoked'
WHERE status IS NULL
   OR status NOT IN ('active', 'revoked', 'pending');

ALTER TABLE public.client_portal_access
    ADD CONSTRAINT client_portal_access_status_check
    CHECK (status IN ('active', 'revoked', 'pending'));
