# Phase 3 Implementation Plan (Continuous Visibility Engine)

Date: 2026-03-21

## Current architecture (repo truth)

- Framework: Next.js App Router + Supabase + Clerk + Tailwind.
- Operator boundary: `/admin/*` (Clerk-protected in `proxy.js`).
- Portal boundary: `/portal/*` (Clerk-protected + membership checks in `lib/portal-access.js`).
- Public crawl surfaces remain public and outside Clerk gating loops.
- GEO operator workspace is slice-driven:
  - shell/context: `app/admin/(gate)/(geo)/layout.jsx`, `context/GeoClientContext.jsx`
  - slice API: `app/api/admin/geo/client/[id]/[slice]/route.js`
  - server intelligence: `lib/operator-intelligence/*`

## Current crawl stack

- Audit crawl remains hybrid-ready in the repo:
  - URL fetching and extraction contracts are stable for scoring/QA.
  - Rendered crawling uses Playwright support where enabled, with fallback behavior.
- Extraction/scoring pipeline contract remains unchanged for downstream QA compatibility.

## Current prompt flow

- Prompt CRUD: `/api/admin/queries/{create,update,toggle,delete}`.
- Run execution: `/api/admin/queries/run`.
- Prompt workspace UI: `GeoPromptsView`, linked to `runs/citations/competitors` slices.
- Canonical taxonomy enforced in app + DB migration reconciliation.

## Current onboarding / client creation flow

- Onboarding wizard already exists:
  - step 1 minimal input
  - step 2 enrichment + initial audit
  - step 3 operator review
  - step 4 activation in draft-safe mode
- Routes/services:
  - `app/api/admin/clients/onboarding/start/route.js`
  - `app/api/admin/clients/onboarding/activate/route.js`
  - `lib/onboarding/client-onboarding.js`

## Current external discovery/social placeholders

- Operator-only social discovery slice exists (`lib/operator-intelligence/social.js`).
- Honest connection states are used (`connected`, `not_connected`, `error`).
- No fake universal monitoring claims.

## What Phase 3 changes (this implementation)

1. Recurring job foundation (Vercel Cron + Route Handlers + Supabase state)
- Adds canonical recurring tables and constraints:
  - `recurring_jobs`
  - `recurring_job_runs`
- Adds secure cron entrypoints:
  - `/api/cron/continuous/dispatch`
  - `/api/cron/continuous/snapshot`
- Adds idempotent queueing, status transitions, overlap prevention, retry-safe behavior, stale-running recovery.

2. Historical trend storage
- Adds `visibility_metric_snapshots` for durable trend points.
- Supports practical 7d/30d/90d windows in server-side trend computation.

3. Derived metrics/trend computation
- Computes latest/previous/delta windows and improving/declining leaders.
- Computes freshness states and action-center priorities grounded in stored data.

4. Operator command center
- Adds continuous view in GEO workspace (`view=continuous`) with:
  - trend metrics
  - recurring job health
  - recent recurring runs
  - action center
  - connector state controls

5. Portal-safe trend evolution
- Adds client-safe trend summaries to portal dashboard using snapshot data only.
- Avoids exposing operator-only internal details.

6. Connector-ready attribution foundation
- Adds normalized contracts and stub providers for GA4/GSC.
- Adds connector table + states without implementing live OAuth yet.

## What Phase 3 does not change

- Clerk auth model is unchanged.
- `/admin` and `/portal` boundaries stay strict.
- Public routes remain crawl-safe and publicly reachable.
- No fake live Google integrations or fake live monitoring claims.

## Risks / assumptions

- Cron endpoints require correct `CRON_SECRET` deployment.
- Snapshot trend quality depends on cadence and run volume over time.
- Retry policy is intentionally practical, not a full queue-worker platform.
- GA4/GSC are stub contracts until OAuth and sync are implemented in a later phase.

## Setup/runtime impacts

- New env vars:
  - `CRON_SECRET` (required for cron route auth)
  - `CONNECTOR_SAMPLE_MODE` (optional dev stub mode)
- Vercel config now includes cron schedules in `vercel.json`.

## Schema/migration impacts

- Adds migration: `20260321150000_continuous_visibility_engine.sql`.
- Adds/normalizes:
  - `recurring_jobs`
  - `recurring_job_runs`
  - `visibility_metric_snapshots`
  - `client_data_connectors`
- Seeds default recurring jobs and connector rows for active clients.

## Validation plan

- `npm run lint`
- `npm run build`
- Verify cron endpoints with `CRON_SECRET`.
- Verify operator continuous view:
  - run-now
  - toggle
  - cadence update
  - connector state updates
- Verify portal renders trend summary safely when snapshots exist.
