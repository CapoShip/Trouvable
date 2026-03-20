# Trouvable

Trouvable est un AI Visibility OS pour commerces locaux, construit en **Next.js App Router + Supabase + Clerk + Tailwind**.

La phase 1 de cette base pose une architecture **operator-first**:

- **`/admin`** = workspace interne complet pour l equipe operateur
- **`/portal`** = portail client lite, lecture seule, scope par membership
- **surfaces publiques SEO/GEO** = homepage, pages villes, pages expertises, profils clients publies, sitemap et robots

## Vision Produit

Trouvable evolue vers un produit service-led:

- l operateur garde tous les controles et tous les details
- le client voit un reporting simple, propre et non technique
- les surfaces publiques restent un moat GEO/SEO local
- le socle d audit et de tracking sert de base a une future vraie couche AI visibility / source discovery

## Route Spaces

### Public

- `/`
- `/villes/[ville_slug]`
- `/expertises/[expertise_slug]`
- `/clients/[client_slug]`
- `/sitemap.xml`
- `/robots.txt`

### Operator Workspace

- `/admin/sign-in`
- `/admin/clients`
- `/admin/clients/new`
- `/admin/clients/[id]`
- `/admin/clients/[id]/edit`
- `/admin/clients/[id]/audit`
- `/admin/clients/[id]/seo-geo`
- `/admin/dashboard`
- `/admin/dashboard/[clientId]`
- `/admin/dashboard/new` -> redirection vers `/admin/clients/new`

### Client Lite Portal

- `/portal/sign-in`
- `/portal`
- `/portal/[client_slug]`

## Architecture Reelle

### Frontend / App Router

- `app/` contient tout le routing Next.js App Router
- `components/` contient les blocs UI publics, admin et portal
- `proxy.js` protege les espaces `/admin` et `/portal`
- `app/layout.jsx` monte Clerk globalement et garde le shell public

### Auth / Acces

- **Clerk** est le seul systeme d authentification
- **admin**: acces decide par allowlist email (`CLERK_ADMIN_EMAIL` / `ADMIN_PANEL_EMAIL`)
- **portal**: acces decide apres login via `client_portal_access`
- le portal n accorde l acces **que** via:
  - `clerk_user_id`
  - ou une **adresse Clerk verifiee**
- les lectures portal sont **server-side only**
- le portal ne fait jamais confiance a un `client_id` fourni par le navigateur

### Data / Supabase

Le code depend aujourd hui de ces tables:

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
- `client_portal_access`

`client_geo_profiles` reste le record principal du produit. Les champs JSON canoniques utilises par la phase 1 sont:

- `contact_info.public_email`
- `business_details.short_desc`
- `seo_data`
- `geo_ai_data`
- `address`
- `geo_faqs`

La publication suit maintenant ce contrat:

- `publication_status` = cycle de vie operateur (`draft | ready | published`)
- `is_published` = compatibilite publique / lecture SSR

### Audit Foundation

Le pipeline conserve l architecture existante:

1. crawl du site
2. extraction structuree
3. scoring deterministe
4. analyse LLM
5. persistence de l audit
6. generation des opportunities
7. generation des merge suggestions
8. logging dans `actions`

La phase 1 n introduit pas encore de queue async ou de workers. Le socle est simplement plus stable et plus aligne au produit.

### Portal Data Model

Le portail client est volontairement limite a des donnees business-safe:

- identite du business
- derniers scores SEO / GEO
- fraicheur du dernier audit
- sante / completude du profil
- travaux recents partageables
- prompts suivis principaux
- sources citees principales
- prochaines priorites derivees de sources structurees

Le client **ne voit pas**:

- notes internes
- merge queues brutes
- debug extraction / troubleshooting
- details techniques d erreurs
- controles operateur

## Operator vs Client Separation

### Source of Truth Operator

Le workspace operateur reste la verite de reference pour:

- gestion client
- edition du profil
- cockpit SEO/GEO
- audits
- tracked queries
- opportunities
- merge suggestions
- notes internes
- publication
- historique d actions
- gestion des acces portal

### Client Lite

Le portail est un rendu lecture seule:

- membership-first
- scoped par `client_id` resolu cote serveur
- sans donnees inventees
- avec empty states honnetes

## Migrations Supabase

La phase 1 introduit une vraie migration canonique:

- `supabase/migrations/20260320100000_phase1_schema_alignment.sql`

Cette migration:

- aligne les tables reelles utilisees par le code
- backfill les cles JSON legacy vers les cles canoniques
- synchronise `publication_status` / `is_published`
- corrige la base des audits / actions / queries / merges
- ajoute `client_portal_access`
- normalise `client_portal_access.contact_email` avec `trim + lowercase`

### Nouvelle table `client_portal_access`

Champs principaux:

- `client_id`
- `contact_email`
- `clerk_user_id`
- `member_type`
- `portal_role`
- `status`
- `created_at`
- `updated_at`

Contraintes phase 1:

- unicite `(client_id, contact_email)`
- unicite `(client_id, clerk_user_id)` si `clerk_user_id` existe
- lookup sur email normalise
- seuls les memberships `active` donnent acces au portal

### Comment appliquer

Option recommandee:

- utilisez le CLI Supabase si disponible, puis appliquez les migrations du dossier `supabase/migrations`

Alternative simple:

- executez `supabase/migrations/20260320100000_phase1_schema_alignment.sql` dans l editeur SQL Supabase

## Variables d Environnement

Voir aussi `.env.example`.

### App / URLs

- `NEXT_PUBLIC_APP_URL`

### Supabase

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY`

### Clerk

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- `CLERK_ADMIN_EMAIL`
- `ADMIN_PANEL_EMAIL` (fallback optionnel)

### Lead Capture / Email

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `RESEND_API_KEY`
- `ADMIN_EMAIL`
- `FROM_EMAIL`

### AI Providers

- `AI_PRIMARY_PROVIDER`
- `AI_FALLBACK_PROVIDER`
- `GROQ_API_KEY`
- `GROQ_MODEL_AUDIT`
- `GROQ_MODEL_QUERY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL_AUDIT`
- `GEMINI_MODEL_QUERY`

## Developpement Local

Installer puis lancer:

```bash
npm install
npm run dev
```

Validation:

```bash
npm run lint
npm run build
```

## Phase 1 - Ce Qui A Ete Stabilise

- separation claire `/admin` vs `/portal`
- membership model portal dans Supabase
- lectures portal 100% server-side
- helpers partages pour normalisation et acces
- redirection de `/admin/dashboard/new` vers `/admin/clients/new`
- correction du bug `getAdminSupabase` manquant dans les actions audit
- correction du bug Zod dans `/api/submit-lead`
- correction des drifts `short_desc`, `public_email`, `publication_status`
- extraction contact plus adaptee a l Amerique du Nord / Canada / Quebec
- README et plan d implementation alignes avec la base reelle

## Limitations Actuelles

- les GEO query runs restent un **proxy** de visibilite, pas une mesure externe officielle
- pas de workers async / queue de fond pour les audits
- pas encore de vraie couche CrowdReply-style pour la decouverte de sources / opportunites externes
- le provisioning des acces portal reste manuel via l admin
- le portal est volontairement lecture seule

## Phase 2 Recommandee

Priorite recommandee pour la suite:

1. execution async des audits et query runs
2. vraie discovery externe des sources / citations / opportunites
3. suivi concurrentiel structure par client
4. reporting client plus riche (exports, periode, benchmarks)
5. lifecycle membership plus complet (invites, reveils, revoke flows, automatisation)

## Fichiers de Reference

- `docs/phase-1-implementation-plan.md`
- `supabase/migrations/20260320100000_phase1_schema_alignment.sql`
- `lib/portal-access.js`
- `lib/portal-data.js`
- `lib/operator-data.js`
- `lib/client-profile.js`
