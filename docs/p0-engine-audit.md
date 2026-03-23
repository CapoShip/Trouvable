# P0 Engine Audit — Trouvable

**Date**: 2026-03-23  
**Scope**: Core engine pipeline (audit, GEO execution, overview, citations, competitors, KPIs)

---

## A. Audit Engine Pipeline

### Current Flow

```
POST /api/admin/audits/run
  → runFullAudit(clientId, url)
    → createAuditRun (DB row, status: running)
    → runSiteAudit (scanner.js — BFS crawl, up to 10 pages, fetch + optional Playwright)
    → classifySiteForAudit (site type → weight profile + applicability)
    → scoreAuditV2 (deterministic scoring: 5 dimensions, site-type-aware)
    → extractForLLM (compact payload for LLM)
    → callAiJson (LLM analysis — Groq/Gemini)
    → normalizeAuditAnalysis (Zod validation)
    → Hybrid score = deterministic * 0.85 + LLM * 0.15
    → updateAuditRun (persist all)
    → archiveOldOpportunities + generateOpportunities
    → archiveOldMergeSuggestions + generateMergeSuggestions
    → logAction
```

### Source of Truth

- **Table**: `client_site_audits`
- **Scores**: `seo_score` = technical_seo dimension, `geo_score` = local_readiness dimension
- **Hybrid score**: stored in `seo_breakdown.overall.hybrid_score` / `geo_breakdown.overall.hybrid_score`
- **Issues/Strengths**: stored as JSONB arrays
- **Automation data**: stored in `prefill_suggestions`

### Critical Problems

1. **Dead code**: `lib/audit/scorer.js` is the legacy V1 scorer — not imported by `runFullAudit`. Should be deleted.
2. **`seo_score` / `geo_score` naming is misleading**: they represent single dimensions (technical_seo, local_readiness) not overall SEO/GEO scores. The UI shows them as if they were comprehensive scores.
3. **Opportunities fetch is unscoped**: `getOpportunities(clientId)` returns ALL opportunities for the client (including dismissed), not filtered to latest audit. This can show stale data.
4. **LLM fallback is silent**: when LLM fails, score defaults to 85% deterministic + 0% LLM. No operator-visible warning about degraded scoring.
5. **`automation_data` stored as `prefill_suggestions`**: naming mismatch between code and storage.

---

## B. GEO Execution Pipeline

### Current Flow

```
POST /api/admin/queries/run
  → runTrackedQueriesForClient(clientId, ...)
    → getTrackedQueries (active only, or filter by ID)
    → getCompetitorAliases → normalizeKnownCompetitors
    → Per query × variant:
      → executeVariantForQuery
        → createQueryRun (pending)
        → buildGeoQueryPrompt → callAiText (answer)
        → buildGeoQueryAnalysisPrompt → callAiJson (structured analysis)
        → normalizeGeoQueryAnalysis (Zod)
        → buildExtractionArtifacts (extraction-v2)
          → parseMentionedBusinesses
          → detectTarget
          → buildSourceMentions (URL regex → entity_type: 'source')
          → buildBusinessAndCompetitorMentions
        → updateQueryRun (completed)
        → createQueryMentions (bulk insert)
    → logAction
```

### Source of Truth

- **Tables**: `tracked_queries`, `query_runs`, `query_mentions`
- **Mentions**: `entity_type` ∈ {`business`, `competitor`, `source`}
- **Competitor aliases**: `competitor_aliases` table

### Critical Problems

1. **Entity typing is too coarse**: only 3 entity types (business, competitor, source). Any non-target business is labeled 'competitor' by default, even if it's just a generic mention (e.g., "restaurants in Montreal" listing random names). No 'generic_mention' or 'noise' type.
2. **Competitor classification lacks rigor**: `buildBusinessAndCompetitorMentions` marks everything non-target as `competitor`. A plumber mentioned alongside a restaurant client would be a "competitor".
3. **Citation extraction is URL-only**: `extractUrlsFromText` regex-scans URLs from raw text. No source typing (editorial, directory, review site, social, etc.).
4. **Source confidence is flat 0.9**: all extracted sources get the same confidence regardless of quality.
5. **`inferRecommendationStrength` is noisy**: regex on entire `responseText` (not just the mention context), leading to inflated "strong" recommendations.
6. **Competitor pressure score is simplistic**: +1 per mention, +2 per "recommended". No normalization by run count.
7. **Benchmark mode can pollute standard metrics**: benchmark runs are filtered by `run_mode`, but edge cases exist where run_mode is null.
8. **No validation of LLM analysis quality**: `normalizeGeoQueryAnalysis` does Zod parsing but doesn't validate if `mentioned_businesses` actually appear in the response text.

---

## C. Overview / KPIs

### Current KPI Cards (GeoOverviewView)

| KPI | Source | Provenance | Issues |
|-----|--------|-----------|--------|
| Score SEO | `client_site_audits.seo_score` | observed | Names a single dimension "SEO Score" |
| Score GEO | `client_site_audits.geo_score` | observed | Names a single dimension "GEO Score" |
| Prompts suivis | `tracked_queries` count | observed | OK |
| Exécutions terminées | completed standard runs count | observed | OK |
| Taux de mention | last run per prompt → target_found % | derived | Computed differently in db.js vs prompts.js (same logic, duplicated) |
| Couverture citations | runs with ≥1 source mention / total | derived | OK concept, but inflated by URL regex noise |
| Mentions concurrents | competitors + genericNonTargetMentions | derived | **Inflated**: sums real competitors AND generic non-target mentions |
| Opportunités ouvertes | opportunities with status=open count | observed | OK |

### Additional KPIs (visibility panel)

| KPI | Issues |
|-----|--------|
| Proxy visibilité | target_found / total_completed_runs. **Labeled as proxy** (good). But prominent placement implies higher reliability than warranted. |
| Couverture prompts bars | Good: shows clear breakdown of target found / no target / no run. |

### Critical Problems

1. **`competitorMentionsCount` is inflated**: sums `competitorMentions + genericNonTargetMentions`. A generic "ABC Company" mention that's not the target gets counted as a competitor mention. Misleading for operator.
2. **`getClientGeoMetrics` is a 230-line monolith**: makes 10+ sequential DB calls, duplicates aggregation logic from individual slices (sources.js, competitors.js, prompts.js). Creates maintenance drift.
3. **Overview loads ALL slices**: `getOverviewSlice` calls `getClientGeoMetrics` + `getPromptSlice` + `getSourceSlice` + `getCompetitorSlice` + `getOpportunitySlice` + `getRecentSafeActivity` in parallel. Each slice independently fetches completed runs. Same data queried multiple times.
4. **Provenance key mismatch in UI**: `GeoOverviewView.jsx` references `provenance.observéd` and `provenance.dérivéd` (with accents) but the API returns `provenance.observed` and `provenance.derived` (ASCII). This likely breaks the provenance pills.
5. **`visibilityProxyPercent`**: good that it's labeled "proxy", but the lack of a "reliability warning" when sample size is small (< 5 runs) means operators may over-trust a 100% based on 1 run.
6. **Mention rate and citation coverage are duplicated**: computed both in `getClientGeoMetrics` (for overview) and in individual slices (prompts.js, sources.js). Values may drift.

---

## D. Citations System

### Current Implementation

- **Extraction**: `extractUrlsFromText` in `geo-query-utils.js` — regex scan for URLs in raw response text
- **Storage**: `query_mentions` with `entity_type = 'source'`
- **Display**: `getSourceSlice` aggregates by domain, timeline, provider
- **Coverage KPI**: runs with ≥1 source / total completed runs

### Critical Problems

1. **No source type classification**: all sources treated equally — a Wikipedia link vs a Yelp review vs the client's own site vs a social media post
2. **No client-domain filtering**: client's own website appearing in citations inflates counts
3. **Flat confidence 0.9**: no differentiation between a clearly cited source and a URL extracted from noise
4. **No URL validation**: broken URLs, image URLs, tracking URLs all counted as "citations"
5. **Domain normalization is basic**: `normalizeDomainHost` strips www but doesn't handle subdomains or CDN domains

---

## E. Competitors System

### Current Implementation

- **Detection**: from LLM `mentioned_businesses` array, anything not matching target is `competitor`
- **Alias resolution**: exact match + fuzzy token similarity (threshold 0.82)
- **Storage**: `query_mentions` with `entity_type = 'competitor'`
- **Display**: `getCompetitorSlice` — top names, prompt buckets, pressure score

### Critical Problems

1. **No distinction between competitor and noise**: a restaurant name mentioned alongside a plumber client is a "competitor"
2. **`genericNonTargetMentions` are not generic**: entity_type `business` + `is_target === false` gets counted alongside competitors in KPIs
3. **Alias fuzzy matching threshold 0.82 is aggressive**: can create false merges
4. **No competitor type classification**: direct competitor vs adjacent business vs directory vs brand mention
5. **Competitor pressure score has no normalization**: raw sum, not normalized per run or per prompt

---

## F. Dashboard Pipeline

### Source of Truth Tables

| Table | Role |
|-------|------|
| `client_geo_profiles` | Client entity (root) |
| `client_site_audits` | Audit results, scores |
| `tracked_queries` | Tracked prompts |
| `query_runs` | Execution results |
| `query_mentions` | Extracted entities (source, competitor, business) |
| `opportunities` | Audit-generated action items |
| `merge_suggestions` | Profile auto-fill suggestions |
| `visibility_metric_snapshots` | Daily aggregated KPIs for trends |

### Logic Duplication

1. **Run counts**: counted in `getClientGeoMetrics`, `getCompetitorSlice`, `getSourceSlice` — each independently queries `query_runs`
2. **Mention aggregation**: done in `getClientGeoMetrics` (all mention types) AND in `getSourceSlice` (sources only) AND in `getCompetitorSlice` (competitors only) — 3 separate queries to `query_mentions`
3. **Tracked prompt stats**: computed in `getClientGeoMetrics` AND `getPromptSlice` with same logic

---

## G. Technical Debt

1. **`lib/audit/scorer.js`**: dead code, legacy V1 scorer — DELETE
2. **`getClientGeoMetrics` monolith**: 230+ lines, should be split into focused functions
3. **`entity_type` schema is too narrow**: need `generic_mention` type to distinguish real competitors from noise
4. **Provenance keys mismatch**: ASCII in API vs accented in UI
5. **`inferRecommendationStrength` scans full response**: should scope to mention context only
6. **Source confidence hardcoded at 0.9**: needs gradation
7. **No runtime validation on KPI derivation**: division by zero is handled but small sample sizes are not warned
8. **No integration tests** for extraction pipeline

---

## Refactoring Decisions

### DELETE
- `lib/audit/scorer.js` (dead legacy code)

### RESTRUCTURE
- `getClientGeoMetrics` → split into `getAuditMetrics`, `getRunMetrics`, `getMentionMetrics`, `getTrackedQueryMetrics`
- `extraction-v2.js` → add entity type `generic_mention`, add source type classification, fix recommendation strength scoping
- `competitors.js` → separate genuine competitors from generic mentions in KPIs

### FIX
- Provenance key mismatch in `GeoOverviewView.jsx`
- Competitor KPI inflation (don't sum generic + competitor)
- Source confidence gradation based on URL quality
- `inferRecommendationStrength` context scoping
- Small sample size warnings for proxy metrics

### ADD
- Source type classification (editorial, directory, social, review, client_own, other)
- Entity type `generic_mention` for non-target businesses that aren't real competitors
- Confidence thresholds for citation quality
- Tests for extraction, entity typing, scoring

### KEEP
- `score.js` (scoreAuditV2) — well-structured, site-type-aware
- `run-audit.js` orchestration — clean pipeline
- `run-tracked-queries.js` — good structure, needs entity typing fix
- `provenance.js` — good provenance metadata system
- `GeoPremium.jsx` components — clean UI primitives

---

## Execution Order

1. Delete dead code (`scorer.js`)
2. Fix entity typing in `extraction-v2.js`
3. Harden source/citation extraction
4. Fix competitor classification
5. Split `getClientGeoMetrics`
6. Fix overview KPIs and provenance keys
7. Update operator views
8. Add tests
