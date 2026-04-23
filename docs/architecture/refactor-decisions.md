# Refactor Decisions

This file records the key decisions taken during the April 2026 structure consolidation.

## Scope

Refactor target: make the repository readable by product world at a glance, not by historical implementation buckets.

The active rule is now:

- `app/` = routing only
- `features/public/*` = public marketing and discovery surfaces
- `features/admin/dashboard/*` = operator dashboard sections
- `features/portal/*` = portal product surface
- `features/espace/*` = espace product surface
- `features/auth/*` = auth only
- `components/ui/*` = primitives only
- `components/shared/*` = cross-product shared display helpers

## Decisions

1. Remove the generic public `pages/` wrapper.
- Why: `features/public/pages/*` added one more abstraction layer without adding product meaning.
- Decision: public surfaces now live directly under `features/public/<surface>/`.

2. Flatten public shared site components.
- Why: `features/public/shared/components/*` was a wrapper around files that were already all public shared components.
- Decision: those files now live directly under `features/public/shared/*`.

3. Split portal out of the public world.
- Why: portal is a distinct product surface with its own route entrypoints, widgets, and server helpers.
- Decision: portal now lives under `features/portal/*`.

4. Split espace out of the public world.
- Why: espace is a distinct authenticated surface, not a public marketing subsection.
- Decision: espace now lives under `features/espace/*`.

5. Centralize auth in one feature root.
- Why: auth code was split between `features/admin/auth`, `features/public/portal/auth`, `features/public/espace/auth`, and `features/auth/styles`.
- Decision: all auth code now lives under `features/auth/*`.

6. Keep admin dashboard grouped by dashboard sections.
- Why: this was already the clearest active source of truth and only needed cleanup around adjacent empty folders.
- Decision: `features/admin/dashboard/*` remains the admin home and legacy empty `features/admin/*` roots were removed.

7. Reclassify non-primitive metric widgets.
- Why: `components/ui/*` contained business display widgets such as `ScoreRing`, `ReliabilityPill`, and `CoverageMeter`, which are not primitives.
- Decision:
  - keep `components/ui/*` for primitives only
  - move shared metric widgets to `components/shared/metrics/*`

8. Remove artificial micro-folders.
- Why: several folders only wrapped one file or one category that was already obvious from the parent.
- Decision:
  - `features/public/city/components/` removed
  - `features/public/expertise/components/` removed
  - `features/public/home/components/` removed
  - `features/admin/dashboard/dossier/audit/components/` removed
  - `features/admin/dashboard/seo/components/` reduced into the section root
  - `features/admin/dashboard/shared/components/operator/` removed
  - `features/admin/dashboard/shared/styles/` removed

9. Move portal and post-sign-in surface helpers out of `lib/`.
- Why: `portal-access`, `portal-data`, `portal-email`, `portal-narrative`, and post-sign-in routing logic clearly belonged to product universes.
- Decision:
  - portal helpers now live in `features/portal/server/*`
  - post-sign-in resolver now lives in `features/auth/resolve-post-sign-in-destination.js`

10. Keep `app/` thin.
- Why: opening `app/` should reveal route structure, not product implementation.
- Decision: route files remain thin imports or redirects into `public`, `portal`, `espace`, `auth`, and `admin/dashboard`.

## Concrete moves applied

### Public world

- `features/public/pages/about/*` -> `features/public/about/*`
- `features/public/pages/case-studies/*` -> `features/public/case-studies/*`
- `features/public/pages/case-study-sample/*` -> `features/public/case-study-sample/*`
- `features/public/pages/city/*` -> `features/public/city/*`
- `features/public/pages/client-profile/*` -> `features/public/client-profile/*`
- `features/public/pages/contact/*` -> `features/public/contact/*`
- `features/public/pages/expertise/*` -> `features/public/expertise/*`
- `features/public/pages/home/*` -> `features/public/home/*`
- `features/public/pages/legal-notice/*` -> `features/public/legal-notice/*`
- `features/public/pages/measurement/*` -> `features/public/measurement/*`
- `features/public/pages/methodology/*` -> `features/public/methodology/*`
- `features/public/pages/offers/*` -> `features/public/offers/*`
- `features/public/pages/privacy-policy/*` -> `features/public/privacy-policy/*`
- `features/public/shared/components/*` -> `features/public/shared/*`

### Portal, espace, auth

- `features/public/portal/routing/*` -> `features/portal/*`
- `features/public/portal/components/*` -> `features/portal/dashboard/*`
- `features/public/portal/auth/*` -> `features/auth/portal/*`
- `features/public/espace/routing/*` -> `features/espace/*`
- `features/public/espace/auth/*` -> `features/auth/espace/*`
- `features/admin/auth/*` -> `features/auth/admin/*`
- `features/auth/styles/sign-in-shell.css` -> `features/auth/sign-in-shell.css`
- `lib/portal-access.js` -> `features/portal/server/access.js`
- `lib/portal-data.js` -> `features/portal/server/data.js`
- `lib/portal-email.js` -> `features/portal/server/email.js`
- `lib/portal-narrative.js` -> `features/portal/server/narrative.js`
- `lib/post-sign-in-redirect.js` -> `features/auth/resolve-post-sign-in-destination.js`

### Shared components

- `components/ui/ScoreRing.jsx` -> `components/shared/metrics/ScoreRing.jsx`
- `components/ui/ReliabilityPill.jsx` -> `components/shared/metrics/ReliabilityPill.jsx`
- `components/ui/QualityPill.jsx` -> `components/shared/metrics/QualityPill.jsx`
- `components/ui/ProvenancePill.jsx` -> `components/shared/metrics/ProvenancePill.jsx`
- `components/ui/PremiumSparkline.jsx` -> `components/shared/metrics/PremiumSparkline.jsx`
- `components/ui/DimensionsRadar.jsx` -> `components/shared/metrics/DimensionsRadar.jsx`
- `components/ui/CoverageMeter.jsx` -> `components/shared/metrics/CoverageMeter.jsx`
- `components/ui/DeltaBadge.jsx` -> `components/shared/metrics/DeltaBadge.jsx`

### Admin cleanup

- `features/admin/dashboard/dossier/audit/components/*` -> `features/admin/dashboard/dossier/audit/*`
- `features/admin/dashboard/seo/components/SeoOpsPrimitives.jsx` -> `features/admin/dashboard/seo/SeoOpsPrimitives.jsx`
- `features/admin/dashboard/seo/components/CorrectionPromptGenerator.jsx` -> `features/admin/dashboard/seo/CorrectionPromptGenerator.jsx`
- `features/admin/dashboard/shared/components/operator/OperatorScene.jsx` -> `features/admin/dashboard/shared/components/OperatorScene.jsx`
- `features/admin/dashboard/shared/styles/admin-shell.css` -> `features/admin/dashboard/shared/admin-shell.css`

## Removed Or Merged

- removed empty legacy roots:
  - `features/site/*`
  - `features/admin/auth/`
  - `features/admin/clients/`
  - `features/admin/components/`
  - `features/admin/routing/`
  - `features/admin/screens/`
  - `features/admin/styles/`
- removed empty historical wrappers:
  - `features/public/pages/`
  - `features/public/portal/`
  - `features/public/espace/`
  - `features/auth/styles/`
  - `features/admin/dashboard/shared/components/operator/`
  - `features/admin/dashboard/shared/styles/`
  - `features/admin/dashboard/seo/components/`

## Final conventions

- Open `features/public/` to find any public page.
- Open `features/admin/dashboard/` to find any admin section.
- Open `features/portal/` to find portal entrypoints, widgets, and portal server code.
- Open `features/espace/` to find espace-specific route flow.
- Open `features/auth/` to find sign-in surfaces and auth routing logic.
- Open `components/ui/` for primitives only.
- Open `components/shared/metrics/` for cross-product score and signal display widgets.

## Remaining exceptions

- `lib/operator-intelligence/*` and related admin backend helpers remain in `lib/`.
- Reason: they are still shared across route handlers, server pages, and recurring jobs, so moving them now would be a larger backend responsibility split than this structural refactor.
