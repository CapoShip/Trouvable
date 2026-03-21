# Phase 3 Implementation Plan

Date: 2026-03-20

## Scope and Intent

Phase 3 will extend the existing operator platform from:

- internal audit + tracked runs intelligence

to:

- stronger rendered crawl fidelity
- first external discussion intelligence layer
- semi-automated onboarding lifecycle
- a truly operational prompt workspace

This plan is based on the current repository implementation, not prior summaries.

## Current Architecture (Repository Truth)

### Route and workspace boundaries

- Public surfaces:
  - `/`
  - `/villes/[ville_slug]`
  - `/expertises/[expertise_slug]`
  - `/clients/[client_slug]`
  - `/sitemap.xml`
  - `/robots.txt`
- Operator surfaces:
  - `/admin/*` with Clerk protection in `proxy.js`
  - GEO workspace at `/admin/dashboard/[clientId]` with slice-driven views
- Portal surfaces:
  - `/portal/*` with Clerk protection in `proxy.js`
  - read-only dashboard pages gated by server-side membership checks in `lib/portal-access.js`

Current Clerk middleware matching is already narrowed to private surfaces in `proxy.js`, so public routes are crawl-safe.

### Operator GEO workspace structure

- Shell and context:
  - `app/admin/(gate)/(geo)/layout.jsx`
  - `app/admin/(gate)/(geo)/context/GeoClientContext.jsx`
- Slice endpoints:
  - `app/api/admin/geo/client/[id]/route.js`
  - `app/api/admin/geo/client/[id]/[slice]/route.js`
  - `app/api/admin/geo/client/[id]/runs/[runId]/route.js`
- Slice builders:
  - `lib/operator-intelligence/{overview,prompts,runs,sources,competitors,opportunities,models,activity}.js`

### Audit pipeline

- API entry:
  - `app/api/admin/audits/run/route.js`
- Orchestration:
  - `lib/audit/run-audit.js`
- Crawl/extraction:
  - `lib/audit/scanner.js` (fetch + Cheerio only, no browser rendering path)
  - `lib/audit/extraction-helpers.js`
  - `lib/audit/extract.js`
- Scoring:
  - `lib/audit/score.js` (deterministic site-type-aware scoring)
- QA:
  - `lib/audit/qa/*`
  - `app/api/admin/qa/route.js`

### Prompt/query flow (current)

- Prompt CRUD APIs:
  - `/api/admin/queries/{create,update,delete,toggle}`
- Run API:
  - `/api/admin/queries/run`
- Workspace UI:
  - `GeoPromptsView`, `GeoRunsView`, `GeoCitationsView`, `GeoCompetitorsView`
- Data model:
  - `tracked_queries`, `query_runs`, `query_mentions`

Current strengths:

- solid CRUD and observed run persistence
- provenance-forward competitor/citation views

Current weaknesses:

- prompt view has no direct run-now action per prompt
- post-action feedback is thin and non-persistent
- weak explicit linkage from prompt rows to latest run detail and downstream intelligence
- category buckets exist, but starter guidance and lifecycle clarity are limited

### Client creation/onboarding flow (current)

- New client page:
  - `app/admin/(gate)/(dashboard)/clients/new/page.jsx`
- Form:
  - `ClientForm.jsx` (large manual profile form)
- Save action:
  - `lib/actions/saveClientProfile.js`

Current model is profile-form-first instead of minimal-input + enrichment + review + activation.

### External discovery/social (current)

- Social view:
  - `GeoSocialView.jsx`
- Current behavior:
  - explicit placeholder marked not connected
  - no connector, no storage, no discussion intelligence pipeline

### Portal boundaries (current)

- Membership resolution:
  - `lib/portal-access.js`
- Read-only portal data loader:
  - `lib/portal-data.js`
- No operator mutation controls in portal pages.

## Current Crawl Stack

- Primary fetch path: `fetch()` with timeout and redirect follow in `scanner.js`
- Parsing/extraction: Cheerio and extraction helpers
- Page discovery: internal links with keyword-priority heuristics
- Render detection: heuristic hydration hints (`__NEXT_DATA__`, `data-reactroot`, etc.) but no rendered-browser fallback
- Risk: modern JS-heavy pages can still be under-extracted (thin text/app-shell scenarios)

## Current Prompt Flow

- Prompt list and category grouping are loaded from `getPromptSlice()`
- Run history, citations, competitors are loaded from separate slices
- Global refresh is available via `invalidateWorkspace()`
- No prompt-level run-now control in prompt rows
- Prompt lifecycle visibility (pending/running/completed/failed by prompt) is present in data but not surfaced strongly as workflow UX

## Current Onboarding / Client Creation Flow

- Operator enters many fields manually at creation time
- Immediate creation/update writes directly to `client_geo_profiles`
- No first-class onboarding draft lifecycle
- No automatic enrichment step
- No review/activation gate with confidence signaling

## Current External Discovery / Social Placeholders

- Social view explicitly says not connected
- No connector abstraction in code for Reddit/community sources
- No structured evidence buckets for complaints/questions/themes/language/opportunities

## What Phase 3 Will Change

## 1. Prompt Workspace (Priority)

- Upgrade `GeoPromptsView` from CRUD list to operational workspace:
  - prompt lifecycle visibility
  - run-now action
  - stronger success/error/loading feedback
  - clearer linkage to latest run and downstream views (runs/citations/competitors)
  - actionable empty states + starter prompts by site profile
- Add backend support where needed for prompt-centric run execution and summary linkage.

## 2. Crawl/render engine (Playwright + Cheerio hybrid)

- Add a rendered-fetch layer using Playwright for pages likely to be hydration-heavy or thin after static fetch.
- Keep Cheerio as the parser for extracted HTML.
- Preserve current extraction/scoring contracts so QA and scoring compatibility remain intact.
- Keep safe fallback when Playwright is unavailable.

## 3. Social listening / external discovery foundation

- Build operator-only external discovery module (Reddit/community-first architecture).
- Introduce honest evidence states:
  - observed externally
  - inferred from discussions
  - not connected
  - low evidence / strong evidence
- If live connector is not practical in this environment, ship connected-ready architecture and clearly label non-connected behavior.

## 4. Semi-automated onboarding lifecycle

- Replace manual first-step creation with:
  - minimal input
  - enrichment pipeline
  - operator review screen
  - activation/finalization flow
- Keep publish state safe by default (`draft`) until explicit operator publish.
- Auto-create portal access draft suggestion when contact email exists.

## What Phase 3 Will Not Change

- `/portal` remains read-only and membership-scoped.
- `/admin` remains operator-first control surface.
- Public SEO/GEO routes remain public and crawlable.
- Existing audit scoring framework and QA contract stay intact; crawl engine is upgraded under the existing contract.
- No fake claims of broad social monitoring or universal market truth.

## Risks and Assumptions

- Playwright runtime can add operational overhead; fallback must remain reliable.
- Rendered crawling can increase audit duration and resource use.
- Social connector reliability and rate-limits can vary; module must degrade gracefully.
- Onboarding automation quality depends on site crawl fidelity and available signals.
- Existing workspace is active; changes must preserve current operator workflows without route churn.

## Setup / Runtime Impacts

- New runtime dependency expected:
  - `playwright` (or `playwright-core` + browser install strategy)
- Potential requirement in deployment:
  - browser binaries availability
  - documented install/build notes in README
- Audit runtime profile may change:
  - rendered-path audits can be slower than static fetch path

## Schema / Migration Impacts (Expected)

Phase 3 likely requires additive schema for:

- onboarding runs/drafts/review state
- onboarding enrichment signals and confidence flags
- external discovery observations and rollups
- optional prompt/run linkage enhancements for workspace UX

Approach:

- additive, backward-compatible migrations only
- avoid breaking existing tables/contracts used by current views
- keep portal query model stable

## Implementation Order

1. prompt workspace hardening
2. crawl/render hybrid upgrade
3. social listening foundation
4. onboarding lifecycle refactor
5. validation and docs updates

## Validation Targets for Phase 3

- `npm run lint`
- `npm run build`
- audit run still completes and persists
- crawl output improves on at least some hydration-heavy cases
- public routes still crawl-safe
- admin/portal protections remain active
- portal remains read-only and scoped
- onboarding flow works end-to-end in operator workflow
- prompt workspace supports create/edit/activate/deactivate/delete/run-now and refreshes downstream views
- social module remains honest about connected/not-connected state
