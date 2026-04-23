# Current Structure

This document is the source of truth for the active repository structure after the April 2026 product-structure consolidation.

## Top-level boundaries

- `app/`
  - Next.js App Router only.
  - Keeps route files, layouts, metadata assets, redirects, loading states, and API route handlers.
  - Does not host public page implementations, portal widgets, auth screens, admin dashboard UI, or reusable feature logic.
- `features/public/`
  - Canonical home for every public marketing and discovery surface.
  - Public pages now live directly under this folder, one folder per surface:
    - `about/`
    - `case-studies/`
    - `case-study-sample/`
    - `city/`
    - `client-profile/`
    - `contact/`
    - `expertise/`
    - `home/`
    - `legal-notice/`
    - `measurement/`
    - `methodology/`
    - `offers/`
    - `privacy-policy/`
  - `shared/`
    - public-only shared site elements such as navbar, footer, contact flow, FAQ, and SEO injection.
- `features/admin/dashboard/`
  - Canonical home for the operator workspace, grouped by actual dashboard sections.
  - `home/`
  - `portfolio/`
  - `dossier/`
  - `geo/`
  - `seo/`
  - `agent/`
  - `portal/`
  - `shared/`
- `features/portal/`
  - Dedicated client-portal product surface.
  - Keeps portal route entrypoints, dashboard widgets, and portal-only server helpers.
  - `dashboard/`
  - `server/`
- `features/espace/`
  - Dedicated `/espace` surface.
  - Keeps the espace layout and post-sign-in routing result page.
- `features/auth/`
  - Auth-only code across product worlds.
  - `admin/`
  - `portal/`
  - `espace/`
  - shared auth shell and post-sign-in resolver at the feature root.
- `components/ui/`
  - reusable primitives only.
  - Active contents: `button.jsx`, `card.jsx`
- `components/shared/`
  - cross-product shared helpers that are not low-level primitives.
  - `animation/`
  - `metrics/`
- `lib/`
  - low-level and broad shared services: database, auth primitives, AI, background jobs, operator slices, and technical helpers.
  - Portal and auth surface-specific helpers were moved out when they clearly belonged to a product universe.
- `docs/architecture/`
  - architecture source of truth.
- `archive/`
  - archived references and inactive material only.

## Product map

- Public site pages: `features/public/*`
- Admin dashboard sections: `features/admin/dashboard/*`
- Client portal: `features/portal/*`
- Espace flow: `features/espace/*`
- Auth-only screens and helpers: `features/auth/*`
- Shared UI primitives: `components/ui/*`
- Shared cross-product display helpers: `components/shared/*`

## App Router discipline

`app/` is routing only.

Allowed in `app/`:

- `page.*`, `layout.*`, `loading.*`, `error.*`, `not-found.*`, `template.*`, `default.*`
- `route.*`
- route metadata assets (`robots`, `sitemap`, icons, social images)
- thin redirects and compatibility aliases
- thin imports or re-exports toward `features/public/*`, `features/portal/*`, `features/espace/*`, `features/auth/*`, or `features/admin/dashboard/*`

Disallowed in `app/`:

- page composition for public surfaces
- portal dashboard widgets
- auth screen bodies
- admin dashboard views and shells
- feature contexts, builders, and transforms
- reusable feature components

## How To Find Things Fast

- Public page implementation: open `features/public/<surface>/`
- Admin dashboard section: open `features/admin/dashboard/<section>/`
- Portal route entrypoint or portal-only server logic: open `features/portal/`
- Espace route flow: open `features/espace/`
- Any sign-in screen or auth redirect logic: open `features/auth/`
- Shared metrics widgets used across admin and portal: open `components/shared/metrics/`

## Remaining intentional exceptions

- `app/layout.jsx`
  - required root layout
  - still owns global styles, analytics, and the lazy public contact modal mount
- route-local metadata layouts such as `app/contact/layout.jsx`, `app/methodologie/layout.jsx`, `app/notre-mesure/layout.jsx`, `app/etudes-de-cas/layout.jsx`
  - still App Router concerns because they only attach metadata or segment-level wrappers
- `lib/operator-intelligence/*`, `lib/operator-data.js`, and related admin backend modules
  - still live in `lib/` because they are shared across server pages, route handlers, and recurring jobs
  - splitting them further would be a separate backend refactor, not just a structure cleanup
