# Bloc 2 — Admin Structural Audit

> Operator-admin clarification pass: legibility, differentiation, decision-orientation, coherence with Trouvable as an operator-led system.

---

## Part 0 — Inspection scope

### Files inspected (code-level)

| File | Status |
|---|---|
| `app/admin/(gate)/page.jsx` | ✅ Full read — Admin Dashboard |
| `app/admin/(gate)/layout.jsx` | ✅ Full read — Auth gate + shell |
| `app/admin/(gate)/components/AdminSidebar.jsx` | ✅ Full read — Navigation |
| `app/admin/(gate)/components/AdminTopCommandBar.jsx` | ✅ Full read — Context bar |
| `app/admin/(gate)/clients/page.jsx` | ✅ Full read — Portfolio list |
| `app/admin/(gate)/clients/[id]/page.jsx` | ✅ Full read — Redirect to /overview |
| `app/admin/(gate)/clients/[id]/layout.jsx` | ✅ Full read — Client layout |
| `app/admin/(gate)/clients/[id]/ClientWorkspaceShell.jsx` | ✅ Full read — MissionCommandHeader |
| `app/admin/(gate)/context/ClientContext.jsx` | ✅ Full read — Data wiring |
| `app/admin/(gate)/views/GeoOverviewView.jsx` | ✅ Full read — Situation |
| `app/admin/(gate)/views/GeoAuditView.jsx` | ✅ Full read — Audit |
| `app/admin/(gate)/views/GeoRunsView.jsx` | ✅ Full read — Exécution |
| `app/admin/(gate)/views/GeoPromptsView.jsx` | ✅ Full read — Prompts |
| `app/admin/(gate)/views/GeoSignalsView.jsx` | ✅ Full read — Signaux (container) |
| `app/admin/(gate)/views/GeoCitationsView.jsx` | ✅ Full read — Citations |
| `app/admin/(gate)/views/GeoCompetitorsView.jsx` | ✅ Full read — Concurrents |
| `app/admin/(gate)/views/GeoSocialView.jsx` | ✅ Full read — Veille sociale |
| `app/admin/(gate)/views/GeoAmeliorerView.jsx` | ✅ Full read — File d'actions |
| `app/admin/(gate)/views/GeoContinuousView.jsx` | ✅ Full read — Suivi continu |
| `app/admin/(gate)/views/GeoCompareView.jsx` | ✅ Full read — GEO Compare |
| `app/admin/(gate)/views/GeoModelesView.jsx` | ✅ Full read — Modèles |
| `app/admin/(gate)/views/GeoLlmsTxtView.jsx` | ✅ Full read — llms.txt |
| `app/admin/(gate)/views/GeoSettingsView.jsx` | ✅ Full read — Paramètres |
| `lib/operator-data.js` | ✅ Referenced — Portfolio signals |

### Runtime verification

Not performed. All findings are code-level. Pages marked `CODE_ONLY`.

---

## Part 1 — Admin page inventory

### Portfolio-level pages (no client context)

| # | Route | Sidebar label | Sidebar group | Server/Client | Metadata title |
|---|---|---|---|---|---|
| P1 | `/admin` | Tableau de bord | Supervision | Server | Tableau de bord — Trouvable Command |
| P2 | `/admin/clients` | Portefeuille | Supervision | Server | Portefeuille — Trouvable Command |
| P3 | `/admin/clients/new` | Nouveau mandat | Supervision | — | (onboarding flow) |

### Client-level pages (inside ClientWorkspaceShell)

| # | Route | Sidebar label | Sidebar group | View component | Data source |
|---|---|---|---|---|---|
| C1 | `/clients/[id]` | — | — | Redirect → `/overview` | — |
| C2 | `/clients/[id]/overview` | Situation | Mission | `GeoOverviewView` | `useGeoWorkspaceSlice('overview')` |
| C3 | `/clients/[id]/runs` | Exécution | Mission | `GeoRunsView` | `useGeoWorkspaceSlice('runs')` |
| C4 | `/clients/[id]/prompts` | Prompts | Mission | `GeoPromptsView` | `useGeoWorkspaceSlice('prompts')` |
| C5 | `/clients/[id]/audit` | Audit | Mission | `GeoAuditView` | `useGeoClient()` (audit slot) |
| C6 | `/clients/[id]/geo-compare` | GEO Compare | Mission | `GeoCompareView` | Custom LLM comparison |
| C7 | `/clients/[id]/signals` | Signaux | Recherche & signaux | `GeoSignalsView` | Container only |
| C7a | `/clients/[id]/citations` | (sub-view) | — | `GeoCitationsView` | `useGeoWorkspaceSlice('citations')` |
| C7b | `/clients/[id]/competitors` | (sub-view) | — | `GeoCompetitorsView` | `useGeoWorkspaceSlice('competitors')` |
| C8 | `/clients/[id]/social` | Veille sociale | Recherche & signaux | `GeoSocialView` | `useGeoWorkspaceSlice('social')` |
| C9 | `/clients/[id]/opportunities` | File d'actions | Recherche & signaux | `GeoAmeliorerView` | `useGeoWorkspaceSlice('opportunities')` |
| C10 | `/clients/[id]/llms-txt` | llms.txt | Optimisation | `GeoLlmsTxtView` | API remediation endpoint |
| C11 | `/clients/[id]/models` | Modèles | Optimisation | `GeoModelesView` | `useGeoWorkspaceSlice('models')` |
| C12 | `/clients/[id]/continuous` | Suivi continu | Optimisation | `GeoContinuousView` | Connectors + cadence |
| C13 | `/clients/[id]/portal` | Restitution client | Restitution | — | Portal preview |
| C14 | `/clients/[id]/settings` | Paramètres | (footer) | `GeoSettingsView` | Client profile + Clerk |

---

## Part 2 — Page-role matrix

### Legend
- **Verification**: `CODE_ONLY` (no runtime check)
- **Duplication**: `HEALTHY` (same signal, different scope/audience) / `HARMFUL` (copy-paste without differentiation) / `OVERLAP` (partial, borderline)
- **Recommendation**: `OK` / `CLARIFY` / `REFACTOR` / `MERGE` / `RENAME`

| Page | Canonical mission | Main operator decision | Main data surface | Duplication status | Copy issues | Rec. |
|---|---|---|---|---|---|---|
| **P1 — Tableau de bord** | Portfolio triage: which client needs attention now? | Pick the next mandate to open | KPI strip + HealthBar + FreshnessGrid + priority list | OVERLAP with P2 (see Part 5) | None | CLARIFY |
| **P2 — Portefeuille** | Client list: find, filter, sort mandates | Open a client workspace | Client rows + AttentionBadge + PortfolioHealthBoard + PortfolioFreshnessStrip | OVERLAP with P1 (see Part 5) | None | CLARIFY |
| **C2 — Situation** | Client-level triage: what is the mandate's operational status? | Decide where to act inside this mandate | GlobalStatusBanner + EngineHealthStrip + KPIs + ActionCenter (now/next/watch) | OVERLAP w/ dashboard freshness + continuous freshness | None | OK (see Part 4) |
| **C3 — Exécution** | Run-level diagnostics | Review/flag/rerun problematic runs | Run list + status filters + parse confidence + signal tier | HEALTHY | None | OK |
| **C4 — Prompts** | Prompt authoring + execution | Create, edit, run, disable prompts | Prompt form + quality indicators + run counts | HEALTHY | None | OK |
| **C5 — Audit** | Site-level SEO/GEO assessment | Trigger scan, read scores, understand citability | URL input + scores + explainability + citability | HEALTHY | "Audit observé du site avec extraction réelle, scoring déterministe adapté au profil et synthèse IA défensive" — strong, accurate | OK |
| **C6 — GEO Compare** | Side-by-side LLM comparison | Compare LLM answers for a query | Query form + comparison result | HEALTHY | None | OK |
| **C7 — Signaux** | Container for Citations + Competitors | Navigate between sub-views | Thin sticky-nav wrapper | N/A | "Visibilité observée" framing is acceptable | OK |
| **C7a — Citations** | Source visibility analysis | Understand which sources appear in AI answers | Citation KPIs + source list | HEALTHY | None | OK |
| **C7b — Concurrents** | Competitive landscape in AI answers | Identify substitution risk | Competitor rows + substitution alert | HEALTHY | None | OK |
| **C8 — Veille sociale** | External social signal monitoring | Review social mentions and evidence | Insight list + evidence pills | HEALTHY | None | OK |
| **C9 — File d'actions** | Operator action queue | Prioritize and execute remediation | Status tabs + priority badges + merge queue | HEALTHY | "Centre d'opportunités" header vs "File d'actions" sidebar label — mismatch | RENAME |
| **C10 — llms.txt** | llms.txt generation + management | Generate/copy llms.txt draft | Detection + draft + history | HEALTHY | None | OK |
| **C11 — Modèles** | AI model variant benchmarking | Select models, compare visibility | Variant catalog + benchmark chart | HEALTHY | None | OK |
| **C12 — Suivi continu** | Continuous monitoring infrastructure | Configure cadence, check connectors | Cadence options + connector status + deltas | OVERLAP w/ Situation freshness indicators | None | CLARIFY |
| **C13 — Restitution** | Client-facing portal preview | Review what the client sees | Portal embed | HEALTHY | None | OK |
| **C14 — Paramètres** | Admin + client settings | View/edit account and client config | Clerk info + client details + contact info | None | "Trouvable contact info" section is confusingly placed in settings | CLARIFY |

---

## Part 3 — Company-level dashboard assessment (`/admin`)

### Current structure

The dashboard is a **server component** (no client-side data) that:
1. Loads all operator clients via `listOperatorClients()`
2. Enriches with operational signals via `enrichClientsWithOperationalSignals()`
3. Renders:
   - **KPI strip**: mandats actifs, critiques, actions requises, stables, actions en file
   - **HealthBar**: portfolio health distribution (stacked bar)
   - **FreshnessGrid**: data freshness summary (<24h / 24-72h / >72h / no run)
   - **Priority mandates list**: top 8 critical/needs_attention sorted, with reasons and links
   - **Quick navigation cards**: Portefeuille, Nouveau mandat, Dernier mandat, Critique

### Assessment

**Strengths:**
- Genuinely operator-focused: answers "what needs my attention across the portfolio?"
- Clean attention-based priority sorting
- Data freshness as a first-class portfolio signal
- Quick nav to critical and recent mandates
- No fabricated metrics, all data is derived from real execution signals

**Issues:**

| # | Finding | Severity | Detail |
|---|---|---|---|
| D-1 | Header framing is generic | Low | "Vue d'ensemble opérateur. Priorisez, supervisez, agissez." — correct but could be more specific about what the dashboard uniquely provides vs the portfolio page |
| D-2 | HealthBar is near-identical to PortfolioHealthBoard on `/admin/clients` | Medium | Both render the same attention distribution as a stacked bar with % legend. Harmful duplication. (See Part 5) |
| D-3 | FreshnessGrid is near-identical to PortfolioFreshnessStrip on `/admin/clients` | Medium | Both compute identical freshness buckets (<24h / 24-72h / >72h / no run). Harmful duplication. (See Part 5) |
| D-4 | No differentiation statement between dashboard and portfolio | Medium | An operator with 5 mandates sees very similar content on both pages with no clear reason to choose one over the other |
| D-5 | Quick nav "Dernier mandat" is based on `clients[0]` (update order) | Low | Not necessarily the most recent mandate by creation — but acceptable convention |

### Recommendation

The dashboard and portfolio pages are **not clearly differentiated**. The dashboard should focus on **triage + next action** (what to do now), while the portfolio should focus on **inventory + search** (find any mandate). Currently both show health bars, freshness grids, and attention sorting.

**Minimal fix:** Add differentiating headers and remove the duplicated HealthBar + FreshnessGrid from the portfolio page (keep them on the dashboard only). The portfolio page already has inline `AttentionBadge` per row which subsumes the health distribution.

---

## Part 4 — Situation page assessment (`/clients/[id]/overview`)

### Current structure

The Situation page is the **most complex client-level view**. It uses `useGeoWorkspaceSlice('overview')` and renders:

1. **GlobalStatusBanner**: Attention level with computed label (critical → healthy) + detail text
2. **EngineHealthStrip**: 3 health indicators (freshness, parse failure, mention rate) + 4 sub-metrics (last run, last audit, prompt coverage, parse confidence)
3. **MissionKpiCards**: SEO score, GEO score, mention rate, open opportunities — each linking to relevant sub-page
4. **Score rings + coverage meters**: Visual score representations
5. **Source distribution**: Donut chart of source types
6. **ActionCenter**: 3-column now/next/watch triage with computed action items that link to sub-pages

### Assessment

**Strengths:**
- Genuinely fulfills the "Situation" role: synthesizes signals into an actionable operator picture
- GlobalStatusBanner provides a clear mandate-level verdict
- ActionCenter with now/next/watch triage is well-structured and decision-oriented
- All action items link to the relevant sub-pages (runs, prompts, opportunities, signals)
- Health indicators are multi-dimensional (freshness, parse, mention) not just a single score
- Robust guardrail integration — critical/warning guardrails feed directly into ActionCenter

**Issues:**

| # | Finding | Severity | Detail |
|---|---|---|---|
| S-1 | Freshness indicators overlap with Suivi continu | Low | EngineHealthStrip shows "Fraîcheur Xh" which is the same data concept as GeoContinuousView's freshness tracking. But the scope is different: Situation = summary health dot, Continuous = detailed cadence/connector management. This is **healthy overlap**. |
| S-2 | KPI cards overlap with sub-page header KPIs | Low | Each sub-page repeats its own KPI in its header. The Situation KPIs are summary-level with links — this is **healthy aggregation**, not harmful duplication. |
| S-3 | "Hub opérateur" loading text vs "Situation" sidebar label | Low | Minor label inconsistency. "Situation" is the sidebar name but the loading state says "Chargement du hub opérateur…" |
| S-4 | No page-level subtitle explaining Situation vs other pages | Low | The page uses the client name as title and business type as subtitle, but has no framing copy explaining the page's purpose (unlike Audit which has a subtitle) |

### Recommendation

The Situation page is well-designed and genuinely serves its purpose. **No structural change needed.** Minor improvements:
- Add a brief framing subtitle: "Synthèse opérateur — état du mandat, signaux prioritaires et prochaines actions."
- Fix loading text from "hub opérateur" to "Chargement de la situation…"

---

## Part 5 — Duplication map

### HARMFUL duplication (same data, same presentation, no differentiation)

| # | Surface A | Surface B | Duplicated element | Evidence | Fix |
|---|---|---|---|---|---|
| DUP-1 | P1 `HealthBar` | P2 `PortfolioHealthBoard` | Attention distribution stacked bar + % legend | Both iterate the same 4 buckets (critical/needs_attention/watch/stable), use identical colors, identical layout, near-identical CSS. `DashboardKpi` and `PortfolioKpi` are copy-pasted with different names. | Remove `PortfolioHealthBoard` and `PortfolioFreshnessStrip` from P2. P2 already has per-row `AttentionBadge` which is sufficient for a list view. |
| DUP-2 | P1 `FreshnessGrid` | P2 `PortfolioFreshnessStrip` | Data freshness 4-bucket grid | Both compute identical freshness buckets with identical colors and layout. | Same as DUP-1. |
| DUP-3 | P1 `DashboardKpi` | P2 `PortfolioKpi` | KPI card component | Identical component body, different names. | Extract to shared `OperatorKpi` in `components/` if both are kept, or remove P2's copy. |

### HEALTHY overlap (same data concept, different scope or audience)

| # | Surface A | Surface B | Overlap | Why healthy |
|---|---|---|---|---|
| OVL-1 | P1 FreshnessGrid (portfolio) | C2 EngineHealthStrip (client) | Freshness | Dashboard = portfolio-wide count. Situation = single-client health indicator. Different granularity. |
| OVL-2 | C2 MissionKpiCards | C5/C7a/C9 header KPIs | Score/count values | Situation = summary with links. Sub-pages = detailed view with context. Standard hub-and-spoke. |
| OVL-3 | C2 ActionCenter | C9 File d'actions | Opportunity items | Situation shows top-priority subset. File d'actions = full queue with status management. |
| OVL-4 | C2 EngineHealthStrip | C12 Suivi continu | Freshness/runs | Situation = health dot. Continuous = cadence config + connector management. Different purpose. |

---

## Part 6 — Stale copy map

| # | Location | Current copy | Issue | Fix |
|---|---|---|---|---|
| SC-1 | C9 header | "Centre d'opportunités" | Sidebar says "File d'actions" — naming mismatch confuses navigation | Rename header to "File d'actions" with subtitle "File opérateur de remédiation pour {client}." |
| SC-2 | C2 loading | "Chargement du hub opérateur…" | Page is called "Situation" everywhere else | Change to "Chargement de la situation…" |
| SC-3 | C14 mixed scope | Shows Trouvable contact info (support@trouvable.com etc.) alongside client settings | Trouvable company contact info belongs on a different surface, not mixed with per-client settings | Remove Trouvable contact block from settings, or move to a separate "Support" section clearly separated |
| SC-4 | All views | `Geo*View` component names | Historical "Geo" prefix from earlier architecture; now these serve broader operator functions | Low priority — internal naming only, no user-facing impact. Leave as-is. |

---

## Part 7 — Recommended target admin information architecture

### Navigation structure (proposed minimal changes)

```
Supervision (portfolio-level)
├── Tableau de bord    /admin              — Portfolio triage + attention
├── Portefeuille       /admin/clients      — Client list + search (remove health bar/freshness)
└── Nouveau mandat     /admin/clients/new  — Onboarding

Mission (client-level, unchanged)
├── Situation          /clients/[id]/overview   — Client triage hub ← add framing subtitle
├── Exécution          /clients/[id]/runs       — Run diagnostics
├── Prompts            /clients/[id]/prompts    — Prompt management
├── Audit              /clients/[id]/audit      — SEO/GEO assessment
└── GEO Compare        /clients/[id]/geo-compare — LLM comparison

Recherche & signaux (unchanged)
├── Signaux            /clients/[id]/signals      — Citations + Competitors container
├── Veille sociale     /clients/[id]/social       — Social monitoring
└── File d'actions     /clients/[id]/opportunities — Action queue ← fix header copy

Optimisation (unchanged)
├── llms.txt           /clients/[id]/llms-txt     — llms.txt management
├── Modèles            /clients/[id]/models       — Model benchmarking
└── Suivi continu      /clients/[id]/continuous   — Monitoring infrastructure

Restitution (unchanged)
└── Restitution client /clients/[id]/portal       — Portal preview

Paramètres             /clients/[id]/settings     — Settings ← clean up mixed scope
```

### Key changes from current

1. **Portfolio page**: Remove `PortfolioHealthBoard` + `PortfolioFreshnessStrip` duplicates
2. **Dashboard header**: Add differentiation text explaining dashboard = triage vs portfolio = inventory
3. **Situation**: Add framing subtitle, fix loading text
4. **File d'actions**: Fix header/sidebar label mismatch
5. **Settings**: Separate Trouvable contact info from client settings

### What is NOT changed (and why)

- Navigation groups: well-organized, clear semantic grouping
- Sidebar structure: correctly distinguishes portfolio (always visible) from mission (client context)
- View component architecture: solid pattern with ClientContext + workspace slices
- Page-level content: each page serves a distinct operator decision
- EngineHealthStrip / Situation design: genuinely valuable and not duplicative

---

## Part 8 — Minimal implementation plan for Bloc 2

### Priority order

| # | Change | Files | Risk | Effort |
|---|---|---|---|---|
| FIX-1 | Remove PortfolioHealthBoard + PortfolioFreshnessStrip from portfolio page | `clients/page.jsx` | Very low — removes unused components from a single file | Small |
| FIX-2 | Add differentiation headers to dashboard and portfolio | `page.jsx`, `clients/page.jsx` | Very low — copy-only change | Small |
| FIX-3 | Fix "Centre d'opportunités" → "File d'actions" header mismatch | `views/GeoAmeliorerView.jsx` | Very low — copy-only | Trivial |
| FIX-4 | Fix Situation loading text "hub opérateur" → "situation" | `views/GeoOverviewView.jsx` | Very low — copy-only | Trivial |
| FIX-5 | Add Situation page framing subtitle | `views/GeoOverviewView.jsx` | Very low — copy-only | Trivial |
| FIX-6 | Clean up Settings mixed-scope Trouvable contact block | `views/GeoSettingsView.jsx` | Low — UI change, no data impact | Small |

### Out of scope for Bloc 2

- Renaming `Geo*View` component files (internal, no user impact)
- Restructuring navigation groups (already well-organized)
- Merging GeoSignalsView container with sub-views (works correctly as-is)
- Refactoring shared KPI component (DashboardKpi vs PortfolioKpi) — can be done in a tech-debt pass
- Portal page comparison (separate audit scope)
