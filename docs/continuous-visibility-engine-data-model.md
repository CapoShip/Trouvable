# Continuous Visibility Engine - Data Model Notes

Date: 2026-03-21

## Why these tables exist

- `recurring_jobs`:
  - one row per `(client_id, job_type)` schedule definition
  - stores cadence, retry policy, lock metadata, and next-run targeting
- `recurring_job_runs`:
  - immutable-ish execution history for each queued/attempted run
  - tracks lifecycle status (`pending/running/completed/failed/cancelled`)
  - stores retry counters, error text, and result summary
- `visibility_metric_snapshots`:
  - durable trend points for key visibility KPIs
  - designed for 7d/30d/90d window queries
  - one row per `(client_id, snapshot_date)` for practical daily rollups
- `client_data_connectors`:
  - connector readiness state machine per client/provider
  - currently powers GA4/GSC stubs (`not_connected`, `configured`, `disabled`, `sample_mode`, `error`)

## Data flow

1. Vercel Cron triggers `/api/cron/continuous/dispatch`.
2. Dispatch selects due `recurring_jobs` and queues `recurring_job_runs` (idempotent dedupe key).
3. Runnable pending runs are claimed and moved to `running`.
4. Job type execution:
   - `audit_refresh` -> `runFullAudit(...)`
   - `prompt_rerun` -> `runTrackedQueriesForClient(...)`
5. Run finalization:
   - success -> `completed`, schedule next run, snapshot capture
   - failure with budget -> backoff + return to `pending`
   - failure without budget -> `failed`, next cadence scheduled
6. Daily cron `/api/cron/continuous/snapshot` captures baseline snapshots for all active clients.

## Daily-first Hobby policy (Phase 3.1)

- Deployment mode is daily-first by default (`CONTINUOUS_DAILY_FIRST_MODE=1`).
- Cron cadence in `vercel.json` is intentionally daily-compatible on Hobby:
  - dispatch: `0 3 * * *`
  - snapshot: `17 4 * * *`
- Runtime guardrail enforces a minimum cadence of 24h on recurring jobs when daily-first mode is on.
- UI wording and health interpretation are aligned with daily freshness, not near-real-time assumptions.

To switch later to Pro/per-minute assumptions:

1. set `CONTINUOUS_DAILY_FIRST_MODE=0`
2. update cron frequency in `vercel.json`
3. re-open infra-daily cadence controls in operator UX if needed

## Query model choices

- Trend queries are server-side and built from `visibility_metric_snapshots`.
- Metric summaries compute:
  - latest
  - previous
  - delta
  - windowed summaries (`7d`, `30d`, `90d`)
- Operator views use full trend + job health context.
- Portal uses a reduced, safe trend subset only.

## Idempotency and overlap strategy

- Queue dedupe: `dedupe_key` unique index in `recurring_job_runs`.
- Overlap prevention:
  - unique partial index for running `(client_id, job_type)`
  - explicit pre-claim overlap check in service logic
- Stale running recovery:
  - long-running stale runs are re-queued (if retry budget remains) or failed.

## Not implemented in this phase

- Live OAuth/token exchange for GA4/GSC.
- External queue worker platform beyond Vercel Cron + route handlers.
- Multi-provider connector sync pipelines with background ingestion.

