# Admin Pages Inventory — Trouvable Command

> Generated research report. Updated after the admin IA clarification pass; headings, descriptions, and subtitles below reflect the current UI.

---

## Table of Contents

1. [Gate Layout](#1-gate-layout)
2. [Company Dashboard](#2-company-dashboard)
3. [Client Portfolio List](#3-client-portfolio-list)
4. [Client Workspace Layout + Shell](#4-client-workspace-layout--shell)
5. [Client Index (Redirect)](#5-client-index-redirect)
6. [GeoOverviewView — Situation](#6-geooverviewview--situation)
7. [GeoRunsView — Supervision d'exécution](#7-georunsview--supervision-dexécution)
8. [GeoPromptsView — Prompts](#8-geopromptsview--prompts)
9. [GeoAuditView — Audit](#9-geoauditview--audit)
10. [GeoCompareView — GEO Compare](#10-geocompareview--geo-compare)
11. [GeoSignalsView — Signaux (composite)](#11-geosignalsview--signaux-composite)
12. [GeoCitationsView — Citations observées](#12-geocitationsview--citations-observées)
13. [GeoCompetitorsView — Concurrents confirmés](#13-geocompetitorsview--concurrents-confirmés)
14. [GeoSocialView — Veille Reddit](#14-geosocialview--veille-reddit)
15. [GeoAmeliorerView — Centre d'opportunités](#15-geoameliorerview--centre-dopportunités)
16. [GeoModelesView — Modèles observés](#16-geomodelesview--modèles-observés)
17. [GeoContinuousView — Suivi quotidien](#17-geocontinuousview--suivi-quotidien)
18. [GeoLlmsTxtView — llms.txt](#18-geollmstxtview--llmstxt)
19. [GeoSettingsView — Paramètres](#19-geosettingsview--paramètres)
20. [Client Portal Page](#20-client-portal-page)
21. [Client Edit Page](#21-client-edit-page)
22. [AdminSidebar](#22-adminsidebar)
23. [AdminTopCommandBar](#23-admintopcommandbar)
24. [Sub-route Page Wrappers](#24-sub-route-page-wrappers)
25. [Redirect Pages](#25-redirect-pages)
26. [Shared Components (GeoPremium suite)](#26-shared-components-geopremium-suite)
27. [Cross-Page Patterns](#27-cross-page-patterns)
28. [Notable Issues & Observations](#28-notable-issues--observations)

---

## 1. Gate Layout

**File:** `app/admin/(gate)/layout.jsx`  
**Type:** Auth gate + layout shell · Server component

### Exact Copy
- Denied state `h1`: **"Accès administration refusé"**
- Denied state `p`: **"Le compte {email} n'est pas dans la liste des opérateurs Trouvable (CLERK_ADMIN_EMAIL)."**
- Portal button (if membership): **"Ouvrir mon espace client"**
- Portal button (if no membership): **"Ouvrir le portail client"**  
- Metadata title: **"Trouvable — Centre de commande"**

### Structure
```
div.geo-shell
  ├── AdminSidebar
  └── div.geo-main
       ├── AdminTopCommandBar
       └── div.geo-content → {children}
```

### Data Sources
- `currentUser()` (Clerk) → `isAdminEmail()` gate
- `resolvePortalMembership()` for portal redirect

### Components
`AdminSidebar`, `AdminTopCommandBar`, `SwitchAccountButton`

---

## 2. Company Dashboard

**File:** `app/admin/(gate)/page.jsx`  
**Type:** Dashboard · Server component · `force-dynamic`

### Exact Copy
- `h1`: **"Tableau de bord"**
- `p`: **"Vue d'ensemble opérateur. Priorisez, supervisez, agissez."**
- Metadata title: **"Tableau de bord — Trouvable Command"**

### Sections
| Section | Label | Description |
|---------|-------|-------------|
| KPI strip | Mandats actifs, Critiques, Actions requises, Stables, Actions en file | 5 top-line KPIs |
| HealthBar | "Santé du portefeuille" | Stacked bar: Critique / Action requise / Surveillance / Stable |
| FreshnessGrid | "Fraîcheur des données" | Buckets: <24h / 24-72h / >72h / Aucun run |
| Priority mandates | (inline list) | Sorted by attention level |
| Quick navigation | (cards) | Links to client pages |

### Data Sources
- `listOperatorClients()` → `enrichClientsWithOperationalSignals()`

### Components (local)
`DashboardKpi`, `HealthBar`, `FreshnessGrid`, `AttentionDot`

---

## 3. Client Portfolio List

**File:** `app/admin/(gate)/clients/page.jsx`  
**Type:** Dashboard + Control surface · Server component · 50 items/page

### Exact Copy
- `h1`: **"Portefeuille"**
- `p`: **"Supervision globale des mandats. Priorisez l'attention par état moteur, alertes et file d'actions."**
- Metadata title: **"Portefeuille — Trouvable Command"**
- Button: **"+ Nouveau mandat"**

### Sections
| Section | Description |
|---------|-------------|
| SearchBar + archive toggle | Filter + show archived |
| KPI strip | Portfolio-level KPIs |
| PortfolioHealthBoard | Health distribution |
| PortfolioFreshnessStrip | Data freshness distribution |
| Client rows table | Sortable list with signals |

### Data Sources
- `getAdminSupabase()` → `client_geo_profiles` (search/pagination/archive filters)
- `enrichClientsWithOperationalSignals()`

### Components
`SearchBar`, `PublishToggle`, `ClientListActions`, `LifecycleBadge`, `PortfolioKpi`, `PortfolioHealthBoard`, `PortfolioFreshnessStrip`, `AttentionBadge`, `FreshnessIndicator`

---

## 4. Client Workspace Layout + Shell

### Layout
**File:** `app/admin/(gate)/clients/[id]/layout.jsx`  
**Type:** Layout wrapper / guard · Server component

Validates client exists in `client_geo_profiles` via `getAdminSupabase()`. Calls `notFound()` if missing. Wraps children in `ClientWorkspaceShell`.

### Shell
**File:** `app/admin/(gate)/clients/[id]/ClientWorkspaceShell.jsx`  
**Type:** Persistent chrome / control surface · Client component

### Exact Copy
- Client name: **`{client?.client_name || 'Chargement du mandat…'}`**
- Freshness states: **"Données fraîches"** / **"Fraîcheur dégradée"** / **"Données obsolètes"** / **"En attente"**
- Lifecycle: **"Changer le cycle de vie"**
- Refresh: **"Actualiser"**
- Website: **"Site"**

### Features
- Persistent header bar across all client sub-routes
- Lifecycle state machine (`getAllowedNextStates`, `LIFECYCLE_META`, `transitionLifecycleAction`)
- Freshness color coding (emerald < 24h, amber 24-72h, red > 72h)
- Framer Motion animation
- `ClientProvider` context wrapper

---

## 5. Client Index (Redirect)

**File:** `app/admin/(gate)/clients/[id]/page.jsx`  
**Type:** Redirect

Pure redirect: `redirect(\`/admin/clients/${id}/overview\`)`

---

## 6. GeoOverviewView — Situation

**File:** `app/admin/(gate)/views/GeoOverviewView.jsx`  
**Type:** Dashboard (operational command center) · Client component · Framer Motion stagger

### Exact Copy
- Heading: **`{client?.client_name || 'Mandat'}`**
- Empty state: **title="Situation indisponible"**
- Global status labels: **"Intervention requise"** / **"Moteur à l'arrêt"** / **"Attention opérateur"** / **"À surveiller"** / **"Mandat stable"**
- Engine: **"Moteur d'exécution"**
- Engine health: **"Inactif"** / **"Fraîcheur {time}"** / **"Parse {n}% échec"** / **"Mention {n}%"**
- Action center columns: **Maintenant** / **Prochaine étape** / **Surveillance**

### Sections
| Section | Description |
|---------|-------------|
| GlobalStatusBanner | Overall mandate health status |
| EngineHealthStrip | Execution engine vitals |
| Mission KPI cards (8) | Core metrics |
| 3-column ActionCenter | Prioritized action queue |
| ScoreRing + CoverageMeter + GeoDonut | Visual analytics |

### Data Sources
`useGeoWorkspaceSlice('overview')` → `{kpis, visibility, sources, competitors, opportunities, recentActivity, provenance, guardrails}`

---

## 7. GeoRunsView — Supervision d'exécution

**File:** `app/admin/(gate)/views/GeoRunsView.jsx`  
**Type:** Diagnostic + Control · Client component

### Exact Copy
- Title: **"Supervision d'exécution"**
- Subtitle: **"Priorisez les runs à relancer, reparser ou inspecter — {client_name}."**
- Empty: **title="Exécutions indisponibles"** · **description="Les observations d'exécutions n'ont pas pu être chargées."**
- Triage: **"Runs à revoir"** / **"Échecs totaux"** / **"Conf. parse < 50%"**
- Quality parse: **"OK"** / **"Partiel"** / **"Échec"**
- Noisiest models: **"Modèles les plus bruyants"**
- Latest per prompt: **"Dernier run par prompt"**
- History: **"Historique"**

### Sections
| Section | Description |
|---------|-------------|
| Supervision triage panel | 3-column: review queue / parse quality / noisiest models |
| 4 KPI cards | Total observé, Terminés/échecs, En file, Parse |
| Latest-per-prompt | Scrollable per-prompt latest run |
| Status-filtered history | Tabs: Tous, À traiter, Échecs, Terminés, En cours, Problématiques |
| Run detail inspector | Loaded via API, rerun/reparse actions |
| Problematic runs alert | Animated red dot + count |

### Data Sources
- `useGeoWorkspaceSlice('runs')` → `{summary, history, latestPerPrompt, provenance, emptyState}`
- API: `/api/admin/geo/client/${clientId}/runs/${selectedRunId}` (GET detail, POST `{action: 'rerun'|'reparse'}`)

### Logic
- `isProblematic(run)`: failed / parsed_failed / parsed_partial
- `needsOperatorReview(run)`: failed / bad parse / low confidence (<50%)

### i18n
`parseStatusLabelFr`, `runStatusLabelFr`, `translateOperatorReasonCode`, `translateRunSignalTier`, `translateZeroCitationReason`, `translateZeroCompetitorReason`

---

## 8. GeoPromptsView — Prompts

**File:** `app/admin/(gate)/views/GeoPromptsView.jsx`  
**Type:** Control surface (full CRUD + execution) · Client component

### Exact Copy
- Title: from `ADMIN_GEO_LABELS.nav.prompts`
- Subtitle: **"Espace opérateur pour {client_name}."**
- KPIs: **"Total prompts suivis"** / **"Actifs"** / **"Sans exécution"** / **"Taux cible détectée"** / **"Prompts faibles"**
- Form: **"Ajouter un prompt suivi"**
- Starter: **"Pack de prompts suggéré"**
- Table: **"Prompts suivis ({count})"**

### Data Sources
- `useGeoWorkspaceSlice('prompts')`
- APIs: `/api/admin/queries/create|update|toggle|delete|run`

---

## 9. GeoAuditView — Audit

**File:** `app/admin/(gate)/views/GeoAuditView.jsx`  
**Type:** Diagnostic + Control · Client component

### Exact Copy
- `h2`: **"Audit SEO / GEO"**
- `p`: **"Audit observé du site avec extraction réelle, scoring déterministe adapté au profil et synthèse IA défensive."**
- Score cards: **"SEO technique"** / **"Score GEO Inféré"** / **"Vue audit hybride"**
- Empty: **"Aucun audit pour le moment"**

### Data Sources
- `useGeoClient()` for `client`, `audit`, `clientId`
- API: `/api/admin/audits/run`

### Components
Pas de sous-panneau dédié après simplification. La vue s'appuie directement sur les composants GEO partagés.

---

## 10. GeoCompareView — GEO Compare

**File:** `app/admin/(gate)/views/GeoCompareView.jsx`  
**Type:** Control surface + Dashboard · Client component · ~470 lines

### Exact Copy
- Title: **"GEO Compare"**
- Subtitle (client mode): **"Comparer un même prompt entre providers avec le contexte client (prompts suivis, domaine, concurrents)."**
- Subtitle (global mode): **"Comparer un même prompt entre providers pour valider sa robustesse GEO."**
- Empty: **title="Aucune comparaison"** · **description="Lancez une comparaison pour visualiser les signaux GEO par provider."**
- Error partial: **"Succès partiel: au moins un provider a échoué mais la comparaison reste exploitable."**
- Error full: **"Aucun provider exploitable: vérifiez clés API, timeouts et connectivité."**
- Launch objective: **"Objectif: tester le même prompt sur plusieurs providers. Les variantes internes de prompts et modèles se pilotent depuis Modèles observés."**
- Synthesis: **"Synthèse comparative"** with sub-items: "Plus de citations" / "Plus de concurrents" / "Meilleur exploitable" / "Marque mentionnée"

### Modes
1. **Client-linked mode** (`linkedClientId` prop) — pre-fills from client tracked prompts, domain, competitors
2. **Global free mode** — operator loads any client or uses free prompt

### Form Sections
| Section | Description |
|---------|-------------|
| Contexte opérateur | Client selector or linked context display |
| Lancement | Timeout config + submit |
| Prompt | Tracked prompt selector or free text |
| Source | URL (primary) or expert text mode (collapsible) |

### Results Display
- 4 KPI cards: Providers OK, Providers en erreur, Meilleur score, Mentions marque
- Per-provider cards (3-col): status, model, latency, GEO score, citations, competitors, brand detection, raw response, detected citations
- Synthesis card: comparative summary + hints

### Data Sources
- `buildComparisonViewModel()` from `@/lib/llm-comparison/geo-insights`
- `defaultGeoCompareForm`, `applyPromptMode`, `applyTrackedPromptSelection`, `buildClientPromptPrefill` from `@/lib/llm-comparison/geo-compare-form`
- API: `/api/admin/llm-compare` (POST)
- Client context: `/api/admin/geo/client/${clientId}`, `/api/admin/geo/client/${clientId}/prompts`

---

## 11. GeoSignalsView — Signaux (composite)

**File:** `app/admin/(gate)/views/GeoSignalsView.jsx`  
**Type:** Composite container · Client component

### Exact Copy
- `h1`: **"Signaux"**
- `p`: **"Visibilité observée (sources + paysage concurrentiel) pour {client_name}."**
- Section nav: **"Citations & sources"** / **"Concurrents"**

### Structure
Container that renders `GeoCitationsView` and `GeoCompetitorsView` in scrollable sections.

---

## 12. GeoCitationsView — Citations observées

**File:** `app/admin/(gate)/views/GeoCitationsView.jsx`  
**Type:** Dashboard (analytics/diagnostics) · Client component · ~180 lines

### Exact Copy
- Title: **"Citations observées"**
- Subtitle: **"Sources détectées dans les réponses IA pour {client_name}."**
- Empty: **title="Citations indisponibles"**
- Top domains: **"Top domaines source"** · **"Classés par force de signal."**
- Provider breakdown: **"Par provider/modèle"** · **"Volume source par couple."**
- Coverage: **"Couverture par prompt"** · **"Prompts générant des sources."**

### Signal Strength System
| Threshold | Label | Color |
|-----------|-------|-------|
| ≥ 50% | "Fort" | emerald |
| ≥ 15% | "Modéré" | amber |
| < 15% | "Faible" | white |

### Sections
5 KPI cards (Runs terminés, Runs avec citations, Couverture %, Sources externes, Domaines uniques) + SourcesTimelineChart + Provider volume bars + Top domains with signal badges + Prompt coverage cards

### Data Sources
`useGeoWorkspaceSlice('citations')` → `{summary, topHosts, byProviderModel, promptCoverage, timeline, provenance, emptyState}`

### Notable
When no citations but runs exist → action links: **"Inspecter les runs"** and **"Ajuster les prompts"**

---

## 13. GeoCompetitorsView — Concurrents confirmés

**File:** `app/admin/(gate)/views/GeoCompetitorsView.jsx`  
**Type:** Dashboard (competitive intelligence) · Client component · ~200 lines

### Exact Copy
- Title: **"Concurrents confirmés"**
- Subtitle: **"Visibilité concurrentielle pour {client_name}. Seuls les concurrents confirmés sont affichés."**
- Empty: **title="Concurrents indisponibles"**
- Substitution alert: **"{n} runs où un concurrent apparaît mais pas la cible"** · **"Ces prompts représentent un risque de substitution directe."**
- Frequency: **"Concurrents par fréquence"** · **"Classés par niveau de menace."**
- Prompts: **"Prompts exposant des concurrents"** · **"Prompts où des concurrents remontent le plus."**
- Generic mentions: **"Mentions non confirmées « concurrent »"** · **"Des noms hors cible existent dans les réponses, mais le seuil « concurrent confirmé » (profil, reco, ou marqueurs de comparaison) n'est pas atteint."**

### Threat Level System
| Threshold | Label | Color |
|-----------|-------|-------|
| ≥ 60% | "Élevé" | red |
| ≥ 25% | "Modéré" | amber |
| < 25% | "Faible" | white |

### Data Sources
`useGeoWorkspaceSlice('competitors')` → `{summary, topCompetitors, genericMentions, promptsWithCompetitors, provenance, emptyState}`

---

## 14. GeoSocialView — Veille Reddit

**File:** `app/admin/(gate)/views/GeoSocialView.jsx`  
**Type:** Dashboard (external intelligence) · Client component · ~250 lines

### Exact Copy
- Title: **"Veille Reddit (externe)"**
- Subtitle: **"Lecture opérateur limitée à la recherche Reddit via seeds profil — pas une veille LinkedIn/X/Instagram. {client_name} : interprétez les zéros comme « collecte inactive ou vide », pas comme vérité marché absolue."**
- Empty: **title="Veille Reddit indisponible"** · **description="La tranche n'a pas pu être chargée (erreur API ou droits). Ce n'est pas une preuve d'absence de discussions sur votre marque."**
- Coverage context: **"Contexte de couverture seedée"**
- Zero explanation: **"Pourquoi tout est à zéro"** · **"Le connecteur Reddit est désactivé sur cet environnement..."**

### Connection States
`connected` = "connecté" / `error` = "erreur" / `not_connected` = "non connecté"

### Evidence Levels
strong (emerald) / medium (violet) / weak (amber)

### Sections (9 insight categories via `ExternalInsightList` reusable component)
1. Plaintes récurrentes / Questions récurrentes
2. Thèmes de discussion / Langage communautaire
3. Communautés source / Plaintes concurrentielles
4. Opportunités FAQ / Opportunités contenu / Angles de différenciation

### Data Sources
`useGeoWorkspaceSlice('social')` → `{connection, summary, topComplaints, topQuestions, topThemes, communityLanguage, sourceBuckets, competitorComplaints, faqOpportunities, contentOpportunities, differentiationAngles, provenance, emptyState}`

---

## 15. GeoAmeliorerView — Centre d'opportunités

**File:** `app/admin/(gate)/views/GeoAmeliorerView.jsx`  
**Type:** Control surface (full status workflow) · Client component

### Exact Copy
- Title: **"Centre d'opportunités"**
- Subtitle: **"File opérateur pour {client_name}. Provenance tracée pour chaque item."**
- Empty: **title="Centre d'opportunités indisponible"** · **description="La demande d'optimisation n'est pas disponible."**
- Review queue: **"File de revue opérateur"**
- Category panel: **"Par catégorie"**
- Provenance panel: **"Par provenance"**
- Merge panel: **"File de merge"**

### Status Workflow
`open` → `in_progress` → `done` / `dismissed`  
French labels: **Ouvertes**, **En cours**, **Terminées**, **Classées**

### Priority System
| Level | Label | Color |
|-------|-------|-------|
| high | "Haute" | red |
| medium | "Moyenne" | amber |
| low | "Basse" | white |

### Review Types
`auto_accepted` = "Auto" / `needs_review` = "A revoir" / `reviewed_confirmed` = "Confirmé" / `reviewed_rejected` = "Rejeté" / `blocked` = "Bloqué"

### Review Item Types
`problem` = "Audit" / `merge_suggestion` = "Merge" / `remediation_suggestion` = "Remédiation" / `opportunity` = "Opportunité"

### Data Sources
- `useGeoWorkspaceSlice('opportunities')` → `{byStatus, byCategory, bySource, reviewQueue, summary, mergeSuggestions, provenance, emptyState}`
- API: `/api/admin/geo/client/${clientId}/opportunities/${opportunityId}` (POST status update)

---

## 16. GeoModelesView — Modèles observés

**File:** `app/admin/(gate)/views/GeoModelesView.jsx`  
**Type:** Dashboard + Control (test interne de variantes) · Client component

### Exact Copy
- Title: **"Modèles observés"**
- Subtitle: **"Lecture des providers et modèles réellement utilisés dans les runs observés. Le test interne de variantes sert à comparer vos variantes, pas à faire une comparaison cross-provider d'un même prompt."**
- Empty: **title="Modèles indisponibles"** · **description="La liste des fournisseurs et modèles n'est pas disponible pour le moment."**
- Volume: **"Volume providers"** · **"Nombre d'exécutions terminées par provider."**
- Chart: **"Tendance observée par modèle"** · **"Détection cible cumulée par jour sur les modèles réellement utilisés."**
- Variant test title: **"Test interne de variantes"**
- Variant test disclaimer: **"Compare des variantes internes de prompts et de modèles. Pour comparer un même prompt entre providers, utilisez GEO Compare."**
- Variant test CTA: **"Lancer le test de variantes"** / **"Test de variantes en cours..."**
- Variant sessions: **"Sessions de variantes récentes"** · **"Comparaison interne de variantes: provider, modèle, parse, latence, cible, citations et concurrents."**
- Isolation note: **"Note : Ces essais internes n'alimentent pas l'historique officiel des citations ni des concurrents."**

### Sections
| Section | Description |
|---------|-------------|
| 4 KPI cards | Exécutions terminées, Providers, Meilleur taux modèle, Provider principal |
| Top 5 model cards | Gradient-colored performance cards (emerald/sky/orange/cyan/violet) |
| CumulativeModelVisibilityChart | Daily cumulative target detection trend |
| Provider volume bar chart | Execution count by provider |
| Variant test controls | Variant selector + run button |
| Variant sessions table | Per-variant: provider/model, parse, target found/position, citations, competitors, latency, confidence, cost estimate, error class |

### Data Sources
- `useGeoWorkspaceSlice('models')` → `{summary, modelPerformance, providerCounts, recentQueryRuns, benchmark, provenance, emptyState}`
- API: `/api/admin/queries/benchmark` (POST)

---

## 17. GeoContinuousView — Suivi quotidien

**File:** `app/admin/(gate)/views/GeoContinuousView.jsx`  
**Type:** Mixed (dashboard + control) · Client component

### Exact Copy
- Subtitle: **"Suivi quotidien pour {client_name}: jobs récurrents, snapshots et priorités opérateur."**
- Trends: **"Tendances (7j / 30j / 90j)"**
- Action queue link: **"{n} action(s) en file"** · **"Voir le centre d'actions →"**
- Jobs: **"Jobs récurrents"**
- Runs jump card: **"Historique des runs"** · **"Consultez le journal complet des runs planifiées et manuelles."**

### Sections
| Section | Description |
|---------|-------------|
| Daily mode card | Current daily-mode policy and guardrail copy |
| 6 KPI cards | Instantanés, Jobs actifs, Jobs en échec, Fraîcheur audit, Fraîcheur exécutions, Connecteurs |
| Trends | Snapshot-derived metric deltas over 7/30/90 days |
| Improving / declining panels | Positive and negative metric drift |
| Action queue jump link | Compact link to the canonical opportunities queue |
| Jobs management | Recurring jobs, run-now, activate/deactivate, cadence update |
| Runs jump card | Link out to the detailed runs supervision page |
| Connectors | Connector status, data availability, last sync, manual sync actions |

### Data Sources
- `useGeoWorkspaceSlice('continuous')`
- API: `/api/admin/geo/client/${clientId}/continuous/actions`

---

## 18. GeoLlmsTxtView — llms.txt

**File:** `app/admin/(gate)/views/GeoLlmsTxtView.jsx`  
**Type:** Control surface (generate/preview/download) · Client component · ~260 lines

### Exact Copy
- Title: **"llms.txt"**
- Subtitle: **"Fichier de description lisible par les LLM — permet aux modèles d'IA de comprendre l'activité, les services et la zone de couverture."**
- Status badges: **"Présent sur le site"** (emerald) / **"Brouillon disponible"** (amber) / **"Manquant"** (red)
- When found: **"Fichier llms.txt détecté sur le site"** · **"Le dernier audit a identifié la présence du fichier. Vous pouvez tout de même générer un brouillon amélioré."**
- When missing: **"Fichier llms.txt absent du site"** · **"Le dernier audit n'a pas trouvé de fichier llms.txt. Générez un brouillon ci-dessous."**
- Draft label: **"Brouillon généré"**
- Empty: **"Aucun brouillon llms.txt"** · **"Générez un fichier llms.txt personnalisé à partir des données du client. Le contenu est créé par IA et prêt à être déployé."**
- Actions: **"Copier"** / **"✓ Copié"** / **"Télécharger"** / **"Régénérer"** / **"Régénération…"** / **"Générer le brouillon llms.txt"** / **"Génération en cours…"**
- History: **"Historique des générations"**
- Spec reference: **"Spécification llms.txt"** with structure: H1 — Nom, Blockquote — Description, ## Services, ## Zone desservie, ## Contact, ## FAQ

### Sections
| Section | Description |
|---------|-------------|
| Context card | Client info: Entreprise, Secteur, Ville, Site web |
| Detection from audit | Whether llms.txt was found by last audit |
| Draft preview | AI-generated content with copy/download/regenerate |
| Empty state CTA | Generate button |
| History | All previous draft generations |
| Spec reference | llms.txt format documentation |

### Data Sources
- `useGeoClient()` for `client`, `clientId`, `audit`
- Detection: scans `audit.strengths[]` for "llms.txt" mention
- API: `/api/admin/remediation/suggestions/${clientId}?type=llms_txt_missing` (GET drafts)
- API: `/api/admin/remediation/generate/${clientId}?type=llms_txt_missing` (POST generate)

---

## 19. GeoSettingsView — Paramètres

**File:** `app/admin/(gate)/views/GeoSettingsView.jsx`  
**Type:** Account + contact view · Client component

### Exact Copy
- `h2`: **"Paramètres"**
- `p`: **"Compte admin, préférences locales et pilotage d'exécution pour ce client."**
- Sections: **"Compte administrateur"** / **"Contact public"** / **"Client actif — {client_name}"**
- Actions: **"+ Nouveau client"** / **"Retour au tableau de bord"** / **"Voir le site public"**

### Notable
Settings is now intentionally narrow: no pseudo-notification UI and no stale prompts redirect remain in this view.

---

## 20. Client Portal Page

**File:** `app/admin/(gate)/clients/[id]/portal/page.jsx`  
**Type:** Config + Preview · Server component · `force-dynamic`

### Exact Copy
- `h1`: **"Portail client"**
- `p`: **"{client_name} — définir qui peut ouvrir le tableau de bord lecture seule (/portal)."**
- Preview heading: **"Aperçu — tableau de bord client"**
- Preview description: **"Rendu identique à ce qu'un invité voit sur /portal/{client_slug} (mêmes données lecture seule, sans en-tête portail ni sélection multi-dossiers)."**
- Metadata title: **"Portail client — Trouvable OS"**

### Data Sources
- `getAdminSupabase()` → `client_geo_profiles`
- `listClientPortalMembers(id)`
- `getPortalDashboardData(id)`

### Components
`PortalDashboard`, `PortalAccessPanel`

---

## 21. Client Edit Page

**File:** `app/admin/(gate)/clients/[id]/edit/page.jsx`  
**Type:** Form · Server component · `force-dynamic`

### Exact Copy
- `h1`: **"Éditer : {client_name}"**
- `p`: **"Profil SEO/GEO"**
- Metadata title: **"Éditer le profil — Trouvable OS"**

### Data Sources
`getAdminSupabase()` → `client_geo_profiles` (id, client_name, client_slug, website_url, business_type, seo_title, seo_description, is_published, social_profiles, address, geo_faqs)

### Components
`ClientForm`

---

## 22. AdminSidebar

**File:** `app/admin/(gate)/components/AdminSidebar.jsx`  
**Type:** Navigation chrome · Client component · Framer Motion

### Navigation Groups
| Group Label | Items |
|-------------|-------|
| **Supervision** | Tableau de bord, Portefeuille, Nouveau mandat |
| **Mission** *(client context only)* | Situation, Exécution, Prompts, Audit, GEO Compare |
| **Recherche & signaux** *(client context only)* | Signaux, Veille sociale, File d'actions |
| **Optimisation** *(client context only)* | llms.txt, Modèles, Suivi continu |
| **Restitution** *(client context only)* | Restitution client |
| *(footer)* | Paramètres (client context), UserButton, Déconnexion |

### Brand
Logo: `Trouvable` · Sub-label: `Command`

### Behavior
- Client nav groups appear/disappear with AnimatePresence based on `clientId` in URL
- Active indicator: blue bar (`#5b73ff`) with spring animation (`layoutId="sidebar-active-indicator"`)
- Mobile: hamburger button + overlay + slide-in
- `hydrated` state guard for AnimatePresence (avoids SSR hydration mismatch)
- Routes `/citations` and `/competitors` map to `signals` active state

---

## 23. AdminTopCommandBar

**File:** `app/admin/(gate)/components/AdminTopCommandBar.jsx`  
**Type:** Status chrome · Client component · 65 lines

### Behavior
- Displays current section label based on pathname mapping
- Live clock (updated every 30s, French format `HH:MM`)
- Green dot + **"Opérationnel"** status badge

### Section Label Map
| Pathname | Label |
|----------|-------|
| `/admin/clients` | Portefeuille |
| `/admin/clients/new` | Nouveau mandat |
| Client sub-routes | Mapped: Situation, Exécution, Audit, Signaux, Veille sociale, File d'actions, Restitution, Paramètres, GEO Compare, Prompts, Édition |
| `/admin` | Centre de commande |

---

## 24. Sub-route Page Wrappers

All client sub-route pages are thin wrappers that import and render a single view component:

| Route | File | Renders |
|-------|------|---------|
| `/clients/[id]/overview` | `overview/page.jsx` | `GeoOverviewView` |
| `/clients/[id]/runs` | `runs/page.jsx` | `GeoRunsView` |
| `/clients/[id]/prompts` | `prompts/page.jsx` | `GeoPromptsView` |
| `/clients/[id]/audit` | `audit/page.jsx` | `GeoAuditView` |
| `/clients/[id]/signals` | `signals/page.jsx` | `GeoSignalsView` (with `Suspense` boundary) |
| `/clients/[id]/continuous` | `continuous/page.jsx` | `GeoContinuousView` |
| `/clients/[id]/models` | `models/page.jsx` | `GeoModelesView` |
| `/clients/[id]/opportunities` | `opportunities/page.jsx` | `GeoAmeliorerView` |
| `/clients/[id]/settings` | `settings/page.jsx` | `GeoSettingsView` |
| `/clients/[id]/social` | `social/page.jsx` | `GeoSocialView` |
| `/clients/[id]/llms-txt` | `llms-txt/page.jsx` | `GeoLlmsTxtView` |
| `/clients/[id]/geo-compare` | `geo-compare/page.jsx` | `GeoCompareView` (with `linkedClientId` + `linkedClientName` from `useGeoClient()`) |
| `/clients/[id]/portal` | `portal/page.jsx` | Server component with `PortalDashboard` + `PortalAccessPanel` |
| `/clients/[id]/edit` | `edit/page.jsx` | Server component with `ClientForm` |

**Pattern:** All client-component wrappers are `'use client'` and just return `<ViewComponent />`. Only `signals` adds a `Suspense` boundary. Only `geo-compare` passes props from context. `portal` and `edit` are server components.

---

## 25. Redirect Pages

| Route | Target |
|-------|--------|
| `/clients/[id]` | → `/admin/clients/${id}/overview` |
| `/clients/[id]/citations` | → `/admin/clients/${id}/signals?focus=citations` |
| `/clients/[id]/competitors` | → `/admin/clients/${id}/signals?focus=competitors` |
| `/clients/[id]/seo-geo/` | *(empty folder — no page)* |

---

## 26. Shared Components (GeoPremium suite)

**File:** `app/admin/(gate)/components/GeoPremium.jsx`

Shared across ALL view files:

| Component | Usage |
|-----------|-------|
| `GeoPremiumCard` | Standard card container for all view sections |
| `GeoSectionTitle` | Title + subtitle + optional action for every section |
| `GeoKpiCard` | KPI metric card (label, value, accent color, hint) |
| `GeoEmptyPanel` | Empty state with title + description + action links |
| `GeoBarRow` | Horizontal bar for charts/rankings |
| `GeoProvenancePill` | Data provenance badge (observed/derived/summary) |
| `GeoModelAvatar` | AI model icon/avatar |

Other shared components:
- `GeoRealCharts.jsx`: `CumulativeModelVisibilityChart`, `SourcesTimelineChart`
- `GeoDonut.jsx`: Donut chart
- `GeoChart.jsx`: Generic chart
- `AIModelLogos.jsx`: Provider logos
- `Toast.jsx`: Toast notifications

---

## 27. Cross-Page Patterns

### Data Loading
- **Server pages**: `getAdminSupabase()` + direct Supabase queries
- **Client views**: `useGeoWorkspaceSlice(sliceName)` for lazy-loaded data per view
- Slice names: `overview`, `prompts`, `continuous`, `models`, `opportunities`, `runs`, `citations`, `competitors`, `social`

### UI Conventions
| Pattern | Details |
|---------|---------|
| KPI strip | Every view opens with a row of KPI cards |
| Container width | All views use `max-w-[1600px] mx-auto` (GeoCompare uses 1650px) |
| Empty state | `GeoEmptyPanel` with title + description + action links |
| Provenance | `GeoProvenancePill` on every data section |
| Loading | Identical pulse animation / spinner |
| Error | Red text + error message |
| Status pills | emerald (success), amber (warning), red (failure), violet (running), zinc (neutral) |
| Action buttons | `geo-btn geo-btn-pri` (primary), `geo-btn-ghost` (secondary), `geo-btn-vio` (violet) |

### Architecture Split
| Type | Rendering | CSS system |
|------|-----------|-----------|
| Dashboard pages (top-level) | Server components | `cmd-surface`, `cmd-animate-in` classes |
| View components | Client components (`'use client'`) | `geo-card`, `geo-btn`, `geo-inp`, `geo-pill-*` classes |

### Diagnostic Badge Systems
Each diagnostic view has its own level system:
| View | Component | Levels |
|------|-----------|--------|
| Citations | `SignalBadge` | Fort / Modéré / Faible |
| Competitors | `ThreatBadge` | Élevé / Modéré / Faible |
| Social | `EvidencePill` | strong / medium / weak |
| GeoCompare | `statusClass()` | ok / warn / crit / idle |

### API Pattern
All client views:
1. `fetch()` POST/GET
2. `parseJsonResponse()` (local helper)
3. `invalidateWorkspace()` to refresh context after mutations

---

## 28. Notable Issues & Observations

1. **Settings scope is intentionally narrow** — `GeoSettingsView` is now a lightweight account/contact/client summary surface rather than a pseudo-settings panel.

2. **Inconsistent Suspense usage** — Only `signals/page.jsx` wraps its view in `<Suspense>`. All other sub-route pages render views directly without boundaries.

3. **GeoCompareView dual mode** — The same view component operates in two modes (global free / client-linked) based on props, creating divergent UX paths in a single file.

4. **Social view heavy caveats** — Extensive disclaimer text warns operators about data interpretation limitations. The subtitle alone is 160+ characters.

5. **Competitor confirmed vs generic distinction** — `GeoCompetitorsView` has a "confirmed vs generic mentions" split that may confuse operators without clear documentation.

6. **Empty `seo-geo/` folder** — Route exists but contains no `page.jsx`.

7. **LLMs.txt detection is audit-dependent** — Detection of existing llms.txt relies on scanning `audit.strengths[]` for title matches, not a direct HTTP check.

8. **Variant test isolation** — `GeoModelesView` explicitly states that internal variant-test runs do not feed the official citations or competitors history.

9. **GeoCompareView `parseJsonResponse`** — Defined locally (same name, same implementation appears in multiple views). Could be a shared utility.

10. **AdminSidebar hydration guard** — Uses `hydrated` state pattern to avoid AnimatePresence SSR mismatch (documented in user memory).

11. **Portal page is server-rendered** — Unlike all other client sub-routes, `portal/page.jsx` is a server component that fetches `PortalDashboard` data directly, not through `ClientContext`.

12. **All workspace slices use `useGeoWorkspaceSlice`** — Consistent lazy-loading pattern but no visible caching/deduplication beyond React state.
