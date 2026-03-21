# Trouvable

Trouvable est un AI Visibility OS pour commerces locaux, construit en **Next.js App Router + Supabase + Clerk + Tailwind**.

Les phases 1 et 2 posent maintenant une architecture claire:

- **`/admin`** = workspace interne complet pour l equipe operateur
- **`/portal`** = portail client lite, lecture seule, scope par membership
- **surfaces publiques SEO/GEO** = homepage, pages villes, pages expertises, profils clients publies, sitemap et robots
- **workspace GEO phase 2** = intelligence operateur par client, chargee par slices, avec provenance explicite et langage honnete

## Vision Produit

Trouvable evolue vers un produit service-led:

- l operateur garde tous les controles et tous les details
- le client voit un reporting simple, propre et non technique
- les surfaces publiques restent un moat GEO/SEO local
- le socle d audit et de tracking sert de base a une vraie couche AI visibility / source discovery, sans faire de promesses non connectees

## Phase 3 Highlights

- Prompt Workspace renforce:
  - create / edit / activate / deactivate / delete
  - run-now par prompt et run batch
  - statut lifecycle visible (pending/running/completed/failed)
  - lien explicite vers runs, citations, competitors
  - starter prompts inferred et feedback UI plus clair
- Crawl engine hybride:
  - fetch statique + rendu Playwright quand necessaire
  - parsing Cheerio conserve
  - fallback securise si Playwright indisponible
- Social discovery operateur:
  - module externe Reddit seed-based
  - etats honnetes `connected / not_connected / error`
  - signal buckets: complaints, questions, themes, language, opportunities
- Onboarding semi-automatique:
  - minimal input -> auto-enrichment -> review -> activation
  - audit initial lance pendant enrichment
  - profile finalise en draft (pas d auto-publication)
  - draft d acces portal prepare en statut `pending` si email fourni

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

Le workspace GEO par client reste sous `/admin/dashboard/[clientId]` avec ces vues principales:

- `overview`
- `prompts`
- `runs`
- `citations`
- `competitors`
- `modeles`
- `ameliorer` (opportunity center)
- `cockpit`
- `audit`
- `settings`

`social` est une vue operateur secondaire avec etats honnetes:

- `connected` quand un connecteur externe est actif
- `not_connected` quand aucun connecteur n est configure
- `error` quand un connecteur est configure mais echoue

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
- le workspace GEO charge un **shell leger** puis des **slices serveur** par vue pour eviter un payload monolithique

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

`client_geo_profiles` reste le record principal du produit. Les champs JSON canoniques utilises aujourd hui sont:

- `contact_info.public_email`
- `business_details.short_desc`
- `seo_data`
- `geo_ai_data`
- `address`
- `geo_faqs`

La publication suit ce contrat:

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

Le socle est stabilise, mais la plateforme n introduit pas encore de workers async ou de queue de fond.

## Phase 2 - Operator Intelligence

La phase 2 transforme le workspace GEO en produit operateur plus utile sans pretendre que la decouverte externe est deja complete.

### Ce que l operateur voit maintenant

- KPI de synthese par client
- performance des tracked prompts
- historique et inspection bornees des runs
- visibilite source / citation observee
- visibilite concurrentielle observee dans les tracked runs
- vraie file d opportunities dans `ameliorer`
- activite systeme recente sure et partageable

### Langage et provenance

Le produit distingue explicitement:

- **Observed**: donnees stockees directement (audits, query runs, query mentions, actions)
- **Derived**: aggregations deterministes (coverage, rates, completeness, KPI composes)
- **Inferred**: interpretations ou items suggeres, par exemple certaines opportunities
- **Not connected**: capacites encore non branchees a des sources reelles

Les vues de visibilite, citations, concurrents et opportunities affichent cette provenance pour eviter les faux signaux.

### Verite Produit

- la visibilite actuelle reste une **tracked-run truth**
- ce n est **pas** une verite universelle du marche
- la couverture citation/source depend uniquement des runs observes et stockes
- la visibilite concurrentielle depend uniquement des mentions observees dans ces tracked runs

## GEO Workspace Technique

Le workspace GEO phase 2 n utilise plus un gros payload unique.

### Shell leger

- `lib/operator-data.js` fournit le shell du workspace
- `GeoClientContext` conserve seulement:
  - client identity
  - clients list
  - active client id
  - audit summary
  - workspace summary
  - refresh token partage

### Intelligence server-side

Les derives operateur sont centralises dans `lib/operator-intelligence/`:

- `base`
- `overview`
- `prompts`
- `runs`
- `sources`
- `competitors`
- `opportunities`
- `activity`
- `models`
- `provenance`

### Slice Endpoints

Le workspace charge des slices serveur via:

- `/api/admin/geo/client/[id]`
- `/api/admin/geo/client/[id]/overview`
- `/api/admin/geo/client/[id]/prompts`
- `/api/admin/geo/client/[id]/runs`
- `/api/admin/geo/client/[id]/runs/[runId]`
- `/api/admin/geo/client/[id]/citations`
- `/api/admin/geo/client/[id]/competitors`
- `/api/admin/geo/client/[id]/models`
- `/api/admin/geo/client/[id]/opportunities`
- `/api/admin/geo/client/[id]/opportunities/[opportunityId]`
- `/api/admin/geo/client/[id]/activity`

Chaque slice est derivee cote serveur, lue en `no-store`, et invalidee apres mutation pour garder overview, prompts, runs, citations, competitors et opportunities coherents.

## Portal Data Model

Le portal client reste volontairement limite a des donnees business-safe:

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

La phase 2 renforce seulement les **inputs safe** du portal:

- meilleurs resumes de tracked prompts
- meilleurs resumes de sources observees
- meilleurs recent work items surs
- prochaines priorites issues de sources structurees

Le portal reste lecture seule et ne consomme pas les slices operateur brutes.

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

Le portal est un rendu lecture seule:

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

### Audit Crawl Runtime

- `AUDIT_DISABLE_PLAYWRIGHT=1` pour forcer le mode fetch statique uniquement
- `AUDIT_PLAYWRIGHT_TIMEOUT_MS` pour ajuster le timeout de rendu

### Social Discovery

- `SOCIAL_REDDIT_CONNECTOR=1` pour activer la collecte Reddit seed-based

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

Si vous activez le rendu Playwright en environnement vierge, installez aussi les binaires navigateurs:

```bash
npx playwright install chromium
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

## Phase 2 - Ce Qui A Ete Ajoute

- refactor du workspace GEO vers un chargement par slices
- couche `lib/operator-intelligence/` pour les derives serveur
- dashboard operateur plus utile avec KPI, couverture prompts, sources, concurrents et activite
- vraie gestion des tracked prompts dans la vue GEO `prompts`
- historique de runs + run inspector borne et operationnel
- vraie couche citations/sources observees
- vraie couche competitor visibility a partir des tracked runs observes
- `ameliorer` transforme en opportunity center sans churn de route
- provenance explicite `Observed / Derived / Inferred / Not connected`
- nettoyage des faux signaux UI, notamment la mise a l ecart de `social` comme capacite non connectee

## Phase 3 - Ce Qui A Ete Ajoute

- upgrade crawl/audit vers un mode hybride rendered-first (Playwright) avec fallback statique
- social discovery operateur branche sur un module externe seed-based (Reddit) avec etats de connexion explicites
- onboarding client refactorise en flow semi-automatique 4 etapes
- preparation d acces portal en mode draft (`pending`) lors de l onboarding
- Prompt Workspace transforme en vrai flux operateur de visibilite trackee

## Limitations Actuelles

- les GEO query runs restent un **proxy** de visibilite, pas une mesure externe officielle
- les slices operateur reposent encore sur des runs executes a la demande, pas sur des connectors externes continus
- pas de workers async / queue de fond pour les audits
- pas encore de vraie couche CrowdReply-style pour la decouverte de sources / opportunites externes
- le provisioning des acces portal reste manuel via l admin
- le portal est volontairement lecture seule

## Phase 4 Recommandee

Priorite recommandee pour la suite:

1. execution async des audits et query runs
2. vraie discovery externe des sources / citations / opportunites
3. suivi concurrentiel structure par client
4. reporting client plus riche (exports, periode, benchmarks)
5. lifecycle membership plus complet (invites, reveils, revoke flows, automatisation)

## Fichiers de Reference

- `docs/phase-1-implementation-plan.md`
- `docs/phase-2-implementation-plan.md`
- `supabase/migrations/20260320100000_phase1_schema_alignment.sql`
- `lib/portal-access.js`
- `lib/portal-data.js`
- `lib/operator-data.js`
- `lib/operator-intelligence/`
- `lib/client-profile.js`
