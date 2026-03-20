# Phase 1 Implementation Plan

## What Exists Today

### Repo and Route Structure
- `app/`
  - Public pages:
    - `/`
    - `/villes/[ville_slug]`
    - `/expertises/[expertise_slug]`
    - `/clients/[client_slug]`
    - `robots.txt`
    - `sitemap.xml`
  - Operator pages:
    - `/admin/sign-in`
    - `/admin/clients`
    - `/admin/clients/new`
    - `/admin/clients/[id]`
    - `/admin/clients/[id]/edit`
    - `/admin/clients/[id]/audit`
    - `/admin/clients/[id]/seo-geo`
    - `/admin/dashboard`
    - `/admin/dashboard/new`
    - `/admin/dashboard/[clientId]?view=...`
  - APIs:
    - `/api/submit-lead`
    - `/api/admin/audits/run`
    - `/api/admin/clients/*`
    - `/api/admin/geo/*`
    - `/api/admin/merge/*`
    - `/api/admin/queries/*`
- `components/`
  - Public marketing and SEO/GEO presentation components
- `lib/`
  - Supabase helpers
  - Clerk auth helpers
  - audit pipeline
  - GEO/query utilities
  - AI provider wrappers
- `supabase/`
  - Setup SQL snapshots and incremental SQL scripts, but no canonical migration history yet

### Public Surfaces
- Homepage and public GEO/SEO landing experience are already present.
- Programmatic public city and expertise pages are already implemented.
- Public client profile pages already exist and are fed from `client_geo_profiles`.
- Sitemap, robots, metadata, and JSON-LD injection are already active and must be preserved.

### Operator Surfaces
- There is already a strong internal operator workspace, but it is split across two overlapping route groups:
  - `/admin/clients/...` is the canonical CRUD/editor/audit area in practice.
  - `/admin/dashboard/...` is a GEO analytics workspace with multiple views and duplicated ownership for some flows.
- The split is usable but currently creates duplication and drift risk.

### Supabase Usage and Implied Schema
- The app currently depends on these tables:
  - `leads`
  - `rate_limits`
  - `client_geo_profiles`
  - `client_site_audits`
  - `tracked_queries`
  - `query_runs`
  - `query_mentions`
  - `opportunities`
  - `merge_suggestions`
  - `actions`
- `client_geo_profiles` is the main product record and already implies these fields:
  - scalar fields such as `client_name`, `client_slug`, `website_url`, `business_type`, `seo_title`, `seo_description`, `is_published`, `publication_status`, `internal_notes`, `notes`, `target_region`, `archived_at`
  - JSON fields such as `social_profiles`, `address`, `geo_faqs`, `contact_info`, `business_details`, `seo_data`, `geo_ai_data`
- Existing SQL scripts are helpful references but do not currently act as the single source of truth.

### Auth and Role Assumptions
- Clerk is already installed and working.
- Middleware protects `/admin/*`.
- Authorization is currently based on an admin email allowlist.
- There is no persisted client portal membership model yet.
- There is no true client-lite route space yet.

### Audit and Tracking Pipeline
- The current audit flow is already real and worth preserving:
  - crawl site
  - extract compact audit payload
  - compute deterministic scores
  - run LLM analysis
  - persist audit
  - create opportunities
  - create merge suggestions
  - log actions
- GEO tracking already exists through:
  - tracked queries
  - query runs
  - query mentions
  - metrics aggregation for the GEO dashboard

## What Is Broken or Risky

### Confirmed Runtime or Stability Problems
- `app/admin/(gate)/(dashboard)/clients/[id]/audit/actions.js` calls `getAdminSupabase()` without importing it.
- `app/api/submit-lead/route.js` accesses `parsed.error.errors[0]`, but the installed Zod version exposes `issues`, not `errors`.
- `next build` compiled successfully in this environment, but final validation was interrupted by a sandbox `spawn EPERM` after the TypeScript step. This needs re-checking in a less restricted environment after code changes.

### Schema and Naming Drift
- Contact email naming drifts between `contact_info.public_email` and `contact_info.email`.
- Business description naming drifts between `business_details.short_desc` and `business_details.short_description`.
- Publication state drifts between `publication_status` and `is_published`.
- `client_site_audits.prefill_suggestions` is treated like an array in code but is initialized as an object in one SQL script.

### Product/Architecture Drift
- `/admin/dashboard/new` duplicates client creation logic that already exists in `/admin/clients/new`.
- `/admin/dashboard/...` and `/admin/clients/...` both load overlapping client data differently.
- Several GEO dashboard views already state that some data is not real, which is good, but the architecture still needs a proper client-safe read model.
- There is no clean separation yet between operator-only data and client-safe reporting data.

### Scope and Product Direction Mismatch
- The product vision is operator-first and client-lite, but the codebase only has operator/admin flows today.
- There is no membership model for portal access.
- There is no safe client activity feed or client-safe prioritization model yet.
- Social listening and advanced opportunity discovery are mostly placeholders and should not be presented as completed product capability.

## Phase 1 Changes

### 1. Documentation First
- Create this implementation plan file before major edits.

### 2. Canonical Database Alignment
- Add ordered migrations under `supabase/migrations`.
- Align all existing code-used tables and columns.
- Add `client_portal_access` for future-proof portal membership handling.
- Backfill and normalize legacy JSON/publication field shapes.

### 3. Shared Server-Only Foundations
- Add shared normalization helpers for canonical client profile fields.
- Add shared admin and portal access helpers.
- Add shared portal-safe loaders scoped by resolved membership only.

### 4. True Client Lite Portal
- Add `/portal/sign-in`, `/portal`, and `/portal/[client_slug]`.
- Keep portal reads server-side only.
- Limit portal data to business-safe reporting information.

### 5. Operator Workspace Cleanup
- Keep `/admin/clients/...` as the canonical operator source of truth.
- Make `/admin/dashboard/...` reuse canonical loaders/actions instead of owning duplicate flows.
- Add portal membership management to operator-side client management.

### 6. Stability and Audit Improvements
- Fix the confirmed runtime issues.
- Normalize legacy field usage.
- Improve audit contact extraction for North America / Canada / Quebec.

### 7. Documentation Refresh
- Update `README.md` to reflect the real architecture after the refactor.

## What Is Deferred to Phase 2
- Background/async job execution for audits and query runs
- Real external opportunity discovery and source monitoring
- CrowdReply-style social/source connectors
- Rich competitor intelligence
- Deeper client/staff lifecycle automation
- Expanded portal reporting/export

## Preserve vs Refactor vs Add

### Preserve
- Public homepage
- Public city and expertise pages
- Public client profile pages
- Sitemap, robots, metadata, and JSON-LD injection
- Supabase
- Clerk
- Tailwind
- Existing audit/query foundation

### Refactor
- Schema ownership and migration strategy
- Admin/client data loading boundaries
- Duplicate ownership between `/admin/clients` and `/admin/dashboard`
- Canonical field normalization
- Contact extraction reliability

### Add
- Canonical migrations directory
- `client_portal_access`
- Shared portal membership helpers
- Client-lite portal routes and UI
- Safe work item and safe priority derivation for clients
- Operator-side portal membership management
