ALTER TABLE public.query_runs
    ADD COLUMN IF NOT EXISTS query_text TEXT;

UPDATE public.query_runs AS qr
SET query_text = NULLIF(BTRIM(tq.query_text), '')
FROM public.tracked_queries AS tq
WHERE qr.tracked_query_id = tq.id
  AND (qr.query_text IS NULL OR BTRIM(qr.query_text) = '');

COMMENT ON COLUMN public.query_runs.query_text IS
    'Snapshot of tracked_queries.query_text at run time, backfilled from tracked_query_id when available.';
