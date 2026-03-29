# Admin IA — Page-Role & Differentiation Diagnosis

> Generated from full code inspection of every admin view, dashboard, sidebar, and routing file.
> This document originally covered Steps 2–4: Page-Role Inventory, Target Differentiation Model, and Pre-Implementation Diagnosis.
> The approved changes for Continuous, Settings, and Models vs GEO Compare have since been implemented; this file now records both the diagnosis and the resulting decisions.

---

## 1. Complete Page-Role Inventory

### 1.1 Portfolio Level (no client selected)

| Page | Route | Type | File | Mission |
|---|---|---|---|---|
| **Tableau de bord** | `/admin` | Command center | `(gate)/page.jsx` | Portfolio-level health: KPI strip, health distribution bar, freshness grid, priority mandates, quick navigation |
| **Portefeuille** | `/admin/clients` | Browser | `(gate)/clients/page.jsx` | Search, filter, paginate, sort clients. Health/freshness/attention badges per row. Archive toggle |
| **Nouveau mandat** | `/admin/clients/new` | Wizard | `(gate)/clients/new/` | Client onboarding flow |

### 1.2 Client Level — Sidebar Group: "Pilotage mission"

| Page | Sidebar Label | Route suffix | View file | Mission |
|---|---|---|---|---|
| **Situation** | Situation | `/` | `GeoOverviewView.jsx` | Operational command center: global status banner, engine health strip, alerts, 3-column action center (now/next/watch), score rings summary, execution metrics |
| **Exécution** | Exécution | `/runs` | `GeoRunsView.jsx` | Run-level supervision: triage (needs_review/problematic), status filters, model risk analysis, run detail inspection, rerun/reparse actions |
| **Prompts** | Prompts | `/prompts` | `GeoPromptsView.jsx` | Prompt management: full CRUD, run single or batch, quality assessment, starter pack, canonical detection |
| **Audit** | Audit | `/audit` | `GeoAuditView.jsx` | Diagnostic scan: URL input → audit trigger, SEO/GEO/Hybrid score cards, explainability panel, citability insights |
| **GEO Compare** | GEO Compare | `/geo-compare` | `GeoCompareView.jsx` | Cross-provider comparison: same prompt across providers → per-provider result cards, comparative synthesis, brand mention detection |

### 1.3 Client Level — Sidebar Group: "Recherche & signaux"

| Page | Sidebar Label | Route suffix | View file | Mission |
|---|---|---|---|---|
| **Signaux** | Signaux | `/signals` | `GeoSignalsView.jsx` | Composite container: renders Citations + Competitors as sections with sticky header + anchor nav |
| **Veille sociale** | Veille sociale | `/social` | `GeoSocialView.jsx` | Social intelligence: Reddit discussions, competitor social mentions, trending themes |
| **File d'actions** | File d'actions | `/opportunities` | `GeoAmeliorerView.jsx` | Action queue: status workflow (open→in_progress→done/dismissed), priority badges, review status, provenance, category/source summaries |

### 1.4 Client Level — Sidebar Group: "Optimisation"

| Page | Sidebar Label | Route suffix | View file | Mission |
|---|---|---|---|---|
| **llms.txt** | llms.txt | `/llms-txt` | `GeoLlmsTxtView.jsx` | Remediation artifact: detect llms.txt from audit, generate draft, copy/download |
| **Modèles observés** | Modèles | `/models` | `GeoModelesView.jsx` | Model analytics from observed runs + internal variant-test surface for prompt/model variants |
| **Suivi continu** | Suivi continu | `/continuous` | `GeoContinuousView.jsx` | Daily monitoring: trends, jobs management, connectors, action-queue jump link, runs jump link |

### 1.5 Client Level — Sidebar Group: "Restitution"

| Page | Sidebar Label | Route suffix | View file | Mission |
|---|---|---|---|---|
| **Restitution client** | Restitution client | `/portal` | Server page.jsx → `PortalDashboard` + `PortalAccessPanel` | Client portal preview + member access management |

### 1.6 Client Level — Sidebar Footer

| Page | Sidebar Label | Route suffix | View file | Mission |
|---|---|---|---|---|
| **Paramètres** | Paramètres | `/settings` | `GeoSettingsView.jsx` | Lightweight account/contact/client summary surface with no pseudo-settings workflow |

### 1.7 Sub-views (rendered inside Signaux container)

| View | File | Mission |
|---|---|---|
| **Citations** | `GeoCitationsView.jsx` | Citation intelligence: signal strength classification (strong/moderate/noise), KPIs, timeline chart, top hosts |
| **Concurrents** | `GeoCompetitorsView.jsx` | Competitor intelligence: threat level classification (high/medium/low), substitution risk alerts, confirmed competitor list |

---

## 2. Page Typology

Each admin page falls into one of these roles:

| Role | Pages | Characteristics |
|---|---|---|
| **Command Center** | Tableau de bord, Situation | High-level health view. Aggregated signals. Action-oriented routing. No CRUD |
| **Browser** | Portefeuille | Search/filter/paginate. Row-level status indicators. Drill-down links |
| **Control Surface** | Prompts, GEO Compare | User creates, configures, launches. Direct manipulation of operational inputs |
| **Diagnostic Tool** | Audit, Exécution (Runs) | Inspection, triage, root-cause analysis. Read-heavy with selective actions (rerun, reparse, scan) |
| **Intelligence Surface** | Citations, Concurrents, Veille sociale, Signaux | Observed data. Classification. No direct manipulation of the underlying data |
| **Action Queue** | File d'actions (Opportunities) | Status workflow. Operator processes items through lifecycle |
| **Monitoring Dashboard** | Suivi continu | Time-series trends, recurring job health, connector status |
| **Analytics** | Modèles | Performance data, charts, comparative metrics |
| **Remediation** | llms.txt | Artifact generation from diagnostic findings |
| **Configuration** | Paramètres | Settings, preferences, account info |
| **Restitution** | Restitution client | Portal preview + access management |
| **Wizard** | Nouveau mandat | Onboarding flow |

---

## 3. Overlap & Duplication Map

The findings in this section describe the state observed during diagnosis. The approved cleanup for `GeoContinuousView`, `GeoSettingsView`, and the Models vs GEO Compare wording has now been applied.

### 3.1 Critical Overlaps

#### A. GeoContinuousView contained duplicated sections at diagnosis time

| Section in Continuous | Canonical Home | Overlap Severity |
|---|---|---|
| "Centre d'opportunités" mini-section | **GeoAmeliorerView** (`/opportunities`) | **HIGH** — direct functional duplicate, same data, reduced controls |
| Runs history table | **GeoRunsView** (`/runs`) | **HIGH** — same data, no triage logic, no detail panel |
| 8 KPI cards (runs total/successful/failed/pending/avg duration/parse rate/target detection/active prompts) | **GeoOverviewView** (execution metrics) + **GeoRunsView** (computed stats) | **MEDIUM** — overlapping metrics, different framing but same underlying numbers |

**Impact at diagnosis time**: Continuous was functioning as a "dumping ground" — its valuable sections (trends, jobs, connectors) were buried under duplicated widgets that belonged elsewhere.

**Current status**: Implemented. Continuous now keeps the trends/jobs/connectors core and only exposes compact jump links toward Opportunities and Runs.

#### B. Two comparison surfaces existed with ambiguous naming

| Surface | What it does | Canonical? |
|---|---|---|
| **GeoCompareView** (`/geo-compare`) | Full cross-provider comparison with form, tracked prompts, URL/text source, per-provider result cards, comparative synthesis | Yes — this is the real operational tool |
| **GeoModelesView** (`/models`) | Internal variant-test launcher with variant catalog toggle selection → `/api/admin/queries/benchmark` | Partial — this is model-level variant testing, not the same question as GEO Compare |

**Verdict**: These are different operations (GEO Compare = "which provider answers best for this prompt" vs Modèles observés = "which internal variant performs best across tracked queries"). The distinction is valid and is now clarified in page copy and nav labels.

### 3.2 Healthy Cross-References (NOT duplication)

| Pattern | Where | Why it's OK |
|---|---|---|
| Score rings in Overview linking to Audit | Overview → Audit | Summary with drill-down. Different depth. Good IA |
| Overview action center referencing opportunities | Overview → Opportunities | Command center routes to queue. No inline CRUD |
| KPI grids per view | Every view | Each view's KPIs are domain-specific. This is a design pattern, not duplication |

### 3.3 Dead or Stale Content Observed at Diagnosis Time

| Issue | Location | Severity |
|---|---|---|
| Stale copy: "Les prompts sont maintenant gérés dans la section dédiée du menu latéral" | GeoSettingsView, Prompts redirect card | **LOW** — removed in implementation |
| Non-functional notifications | GeoSettingsView, Notifications section | **MEDIUM** — removed in implementation |
| handleSave pattern without backend persistence | GeoSettingsView | **MEDIUM** — removed in implementation |

---

## 4. Approved Differentiation Model

### 4.1 Continuous → Focused on what only Continuous can show

**Current**: 8 KPIs + daily toggle + trends + opportunities mini + jobs + runs + connectors (6+ distinct sections)
**Target**: Daily toggle + trends + jobs management + connectors (4 sections)

Changes:
1. **Remove** the "Centre d'opportunités" mini-section → replace with a single-line link: "Voir la file d'actions complète →"
2. **Remove** the Runs history table → replace with a single-line link: "Supervision d'exécution détaillée →"
3. **Trim** the KPI grid from 8 to 4-5 cards that are **continuous-specific**: active prompts, active jobs, avg cadence, connector health, last snapshot age. Remove the ones that duplicate Overview/Runs (runs total, successful, failed, pending)

**Result**: Continuous becomes "the engine room" — job scheduling, data freshness trends, connector health. Runs and Opportunities keep their full specialized views.

### 4.2 Settings → Clean up dead weight

Changes:
1. **Remove** the stale Prompts redirect card (information is outdated)
2. **Remove or collapse** the Notifications section → either delete entirely, or replace with a minimal "Notifications: à venir" placeholder (one line, no toggles, no save button)
3. **Keep**: Admin account display, Contact public, Client info card
4. **Consider adding**: Execution preferences (default cadence, default provider timeout) to give Settings an operational purpose beyond display

### 4.3 Models vs GEO Compare → Clarify naming

Changes:
1. **GeoModelesView**: Frame the lower surface as an internal variant test, not as a second cross-provider benchmark. Final copy: "Test interne de variantes".
2. **GeoCompareView**: Keep the route and title, but make the subtitle explicit: GEO Compare = same prompt across providers.
3. **Navigation labels**: Use "GEO Compare" in the sidebar and top command bar instead of the generic "Benchmark".
3. No structural merge needed — these serve different analytical questions.

### 4.4 Overview → No changes needed

The Overview's unique `cmd-surface` architecture, action center logic, and score ring summaries are well-differentiated from every other view. The cross-references to Audit and Opportunities are healthy navigation, not duplication.

### 4.5 All other pages → No changes needed

Citations, Competitors, Social, Signals, llms.txt, Audit, Prompts, Runs, Opportunities, Portal, Portfolio, Dashboard, New Client — all have clear, distinct missions with no meaningful overlap.

---

## 5. Implemented Change Set

### Phase 1 — GeoContinuousView cleanup

**File**: `app/admin/(gate)/views/GeoContinuousView.jsx`

| Step | Action | Risk |
|---|---|---|
| 1 | Removed the embedded opportunities mini-section | None — canonical queue remains in GeoAmeliorerView |
| 2 | Added a compact navigation link to `/opportunities` | None |
| 3 | Removed the embedded runs history table | None — canonical supervision remains in GeoRunsView |
| 4 | Added a compact navigation link to `/runs` | None |
| 5 | Reduced the KPI grid to continuous-specific signals | Low — validated in the current slice |

**Validation**: Completed. Continuous loads with trends, jobs, connectors, and the new jump links.

### Phase 2 — GeoSettingsView cleanup

**File**: `app/admin/(gate)/views/GeoSettingsView.jsx`

| Step | Action | Risk |
|---|---|---|
| 1 | Removed the stale Prompts redirect card | None |
| 2 | Removed the pseudo-notification section entirely | None |
| 3 | Removed the orphaned save logic | None |

**Validation**: Completed. Settings now reads as a narrow account/contact/client surface.

### Phase 3 — Models vs GEO Compare copy clarification

**File**: `app/admin/(gate)/views/GeoModelesView.jsx`

| Step | Action | Risk |
|---|---|---|
| 1 | Reframed the models page as "Modèles observés" with explicit internal-variant-test language | None — copy change only |
| 2 | Clarified GEO Compare as the same-prompt, cross-provider surface | None |
| 3 | Renamed the sidebar and top-bar label from "Benchmark" to "GEO Compare" | None |

**Validation**: Completed. The two pages now answer visibly different operator questions.

---

## 6. What NOT to touch

| Area | Why |
|---|---|
| GeoOverviewView architecture (cmd-surface) | Intentionally unique. Command center uses different components than other views — this is correct differentiation |
| KPI grid pattern across views | Each view's KPIs serve that view's mission. Not duplication |
| GeoSignalsView composite container | Clean architecture. Sticky header + anchor nav for Citations + Competitors is well-designed |
| Sidebar nav structure and groups | Groups are well-organized. No reshuffling needed |
| Score rings in Overview | Summary linking to Audit — healthy cross-reference |
| CSS system split (cmd-* vs geo-*) | cmd-* for server-rendered dashboards, geo-* for client views. Intentional |
| i18n labels and translation functions | Working correctly. No changes needed |
| GeoPremium shared component suite | Well-abstracted. Used consistently across views |

---

## 7. Risk Assessment

| Change | Risk Level | Mitigation |
|---|---|---|
| Remove Continuous opportunities section | **None** | Full version in dedicated view, no shared state |
| Remove Continuous runs section | **None** | Full version in dedicated view, no shared state |
| Trim Continuous KPIs | **Low** | Verify data availability in `continuous` slice for replacement KPIs |
| Remove Settings notifications | **None** | Explicitly marked as non-functional. No backend dependency |
| Remove Settings prompts card | **None** | Stale copy. Prompts accessible via sidebar |
| Clarify Models variant-test copy | **None** | Copy-only change |

---

## 8. Decisions Taken

1. **Continuous KPI trimming**: reduced to continuous-specific signals.
2. **Settings notifications**: removed entirely.
3. **Settings future scope**: deferred.
4. **Models naming**: resolved as "Modèles observés" + "Test interne de variantes", while `/geo-compare` remains "GEO Compare".

---

*Diagnosis completed, approved, and implemented for the targeted IA clarification scope.*
