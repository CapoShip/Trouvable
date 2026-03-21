# Phase 2 Implementation Plan

## Current Post-Phase-1 State

Phase 1 already established the core product split:

- `/admin` is the operator workspace
- `/portal` is the client-lite portal
- public GEO/SEO pages remain live
- Supabase schema and Clerk access are aligned
- portal-safe loaders already exist

The current operator GEO workspace already has usable foundations:

- a shared client shell at `/admin/dashboard/[clientId]`
- tracked query CRUD APIs
- stored query runs with provider/model/status/parsed data
- stored query mentions for target, competitor, and source observations
- opportunities with priority/category/source/status
- action logging for audits, query runs, tracked-query changes, and publication updates

## What Phase 2 Adds

Phase 2 turns the existing GEO workspace into a true operator intelligence system:

- summary-first operator dashboard
- stronger tracked prompt management
- clearer query run history and run inspection
- source/citation intelligence from observed data
- competitor/non-target visibility from tracked-run observations
- a real opportunity center inside the existing `ameliorer` view
- stronger safe reporting inputs for the client portal
- explicit provenance labels across operator views

## What Will Be Refactored

### Workspace data loading

The current GEO workspace still depends on one broad payload and client-side ad hoc shaping. Phase 2 will:

- keep `/api/admin/geo/client/[id]` as a lightweight shell endpoint
- add focused slice endpoints for overview, prompts, runs, citations, competitors, opportunities, and activity
- move heavy aggregations into server-only derived helpers under `lib/operator-intelligence/`
- keep cross-tab metrics deterministic and current by deriving slices from live DB reads

### Operator intelligence modules

Planned module boundaries:

- `lib/operator-intelligence/base.js`
- `lib/operator-intelligence/provenance.js`
- `lib/operator-intelligence/overview.js`
- `lib/operator-intelligence/prompts.js`
- `lib/operator-intelligence/runs.js`
- `lib/operator-intelligence/sources.js`
- `lib/operator-intelligence/competitors.js`
- `lib/operator-intelligence/opportunities.js`

### GEO workspace UX

The GEO workspace will be reorganized around:

- `overview`
- `prompts`
- `runs`
- `citations`
- `competitors`
- `modeles`
- `ameliorer` as the opportunity center
- `audit`
- `cockpit`
- `settings`

`social` will not remain a dead-feeling primary capability.

### Tracked prompt management

Tracked prompt CRUD will stay on the existing APIs, but the GEO `prompts` view becomes the main management surface. Prompt classification will be normalized toward:

- `local_intent`
- `service_intent`
- `brand`
- `competitor_comparison`
- `discovery`

### Run inspection

Run detail will stay bounded and operational:

- summary first
- structured business/source findings
- no raw JSON dump by default
- explicit proxy wording for tracked-run visibility

## Explicit Phase 3 Deferrals

Not included in phase 2:

- background workers
- external source connectors
- Reddit or forum ingestion
- true external discovery crawlers
- automated competitor harvesting
- full async orchestration
- portal workflow expansion beyond safe summary inputs

## Risks And Assumptions

- The GEO workspace must stay consistent across slices; mutations will need shared invalidation/refetch behavior.
- Existing schema should be mostly sufficient, but a small phase 2 migration may still be needed for taxonomy cleanup or indexes.
- Existing view labels and routes should be preserved where possible to avoid unnecessary churn.
- Provenance labeling must stay honest:
  - `Observed`
  - `Derived`
  - `Inferred`
  - `Not connected`
- Empty states must explain why data is missing and what action generates it.
