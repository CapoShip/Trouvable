# Phase 2.5 Audit Hardening Plan

Date: 2026-03-20

## Current Audit Architecture

- Entry points:
  - `app/api/admin/audits/run/route.js`
  - `app/admin/(gate)/(dashboard)/clients/[id]/audit/actions.js`
- Orchestration:
  - `lib/audit/run-audit.js`
- Crawl / extraction:
  - `lib/audit/scanner.js`
  - `lib/audit/extract.js`
- Deterministic scoring:
  - `lib/audit/score.js`
- LLM layer:
  - `lib/ai/prompts.js`
  - `lib/ai/schemas.js`
  - `lib/ai/normalize.js`
  - `lib/ai/index.js`
- Derived operator outputs:
  - `lib/audit/opportunities.js`
  - `lib/audit/merge.js`
- Audit UI:
  - `app/admin/(gate)/(geo)/dashboard/views/GeoAuditView.jsx`
  - `app/admin/(gate)/(dashboard)/clients/[id]/audit/page.jsx`
  - `app/admin/(gate)/(dashboard)/clients/[id]/audit/AuditSuggester.jsx`

## What Exists Today

- The audit runs end to end and persists:
  - crawl output
  - deterministic scores
  - LLM analysis
  - issues
  - strengths
  - prefill suggestions
  - opportunities
  - merge suggestions
- The scanner already captures:
  - title
  - meta description
  - canonical
  - noindex
  - h1 / h2
  - JSON-LD
  - phone / email
  - social links
  - text chunks
- The scoring layer already returns:
  - `seo_score`
  - `geo_score`
  - issue list
  - strengths list
  - prefill suggestions
- The operator UI already shows:
  - latest scores
  - issues
  - strengths
  - scanned pages
  - cockpit prefill suggestions

## Current Weaknesses

### Crawl / extraction

- HTML-only fetch path with Cheerio parsing
- No rendered-content fallback for hydration-heavy pages
- Text extraction is shallow and body-wide
- FAQ detection is weak and mostly keyword/schema-based
- Structured data extraction is coarse and does not normalize entities deeply
- Local signals, business identity, trust signals, and service-area evidence are only partially extracted
- Page discovery is limited to a small keyword URL heuristic

### Scoring

- Current rubric is still too monolithic and local-business-biased
- Sub-scores are not credible enough for different site types
- The audit treats SaaS, hybrid, content-led, and generic business sites too similarly
- Issues are mostly plain strings, so the operator loses severity, evidence, provenance, and fix direction
- The current score explanation is too opaque for a product-trust surface

### LLM layer

- Prompt is too thin for reliable structured output
- Schema is useful but narrow
- Partial normalization currently degrades to coarse generic arrays
- The audit stays alive on partial failure, but not gracefully enough

### Opportunities / merge suggestions

- Opportunities are derived from string-heavy issues, which makes them generic
- Merge suggestions are useful but do not surface enough evidence context
- Operator value is reduced when outputs feel detached from observed evidence

### UI / explainability

- Audit views mostly show two numbers and generic issue lists
- There is little distinction between:
  - observed
  - inferred
  - not found
  - low relevance / not applicable
- Operators cannot easily see why a score was assigned

## What Will Be Fixed Now

### Extraction hardening

- Expand extraction into richer normalized evidence:
  - normalized JSON-LD entities
  - FAQ pairs and FAQ-like sections
  - business identity signals
  - local signals
  - trust signals
  - richer text blocks and page summaries
  - stronger contact/social extraction
- Improve link discovery and page-type heuristics
- Add a hybrid extraction path that materially improves non-trivial sites without requiring a full Playwright migration in this pass

### Site-type classification

- Add deterministic site classification before scoring:
  - `local_business`
  - `saas_software`
  - `hybrid_business`
  - `content_led`
  - `generic_business`
- Use classification to adjust:
  - score weighting
  - expected signals
  - issue severity
  - relevance / not-applicable handling

### Scoring refactor

- Refactor to structured, explainable sub-scores:
  - technical SEO
  - local / GEO readiness
  - AI answerability / AEO readiness
  - trust / identity completeness
- Keep an overall score, but derive it transparently
- Tie issues and strengths to specific signal failures or wins

### Issue / opportunity quality

- Replace string-heavy issues with structured issue objects that include:
  - title
  - explanation
  - severity / priority
  - category
  - provenance
  - evidence summary
  - recommended fix direction
- Use those structured issues to generate more useful operator opportunities

### LLM hardening

- Strengthen prompt instructions and response shape
- Make normalization more schema-safe and coercive
- Preserve useful partial outputs instead of falling back to generic blobs

### UI / explainability

- Improve operator audit views with:
  - sub-score cards
  - site-type summary
  - evidence-driven issue rendering
  - provenance labels
  - extraction/evidence snapshots
  - clearer fallback/empty states

## Deferred To Phase 3

- Full Playwright-first rendering pipeline
- Background audit workers / orchestration
- Deep JavaScript execution coverage across all pages
- Broader external authority / backlink / citation intelligence
- More advanced competitor-aware audit logic
- Full benchmark calibration from larger audit datasets

## Risks / Assumptions

- This pass should stay incremental and keep the current product architecture intact
- Existing `client_site_audits` JSON columns are sufficient for richer audit evidence, so a schema rewrite should not be necessary
- Full rendered extraction is still deferred unless a lightweight integration proves safe during implementation
- The audit must remain useful even when the enhanced extraction path cannot recover certain signals
- Portal-safe surfaces must remain untouched except for safer upstream structured summaries
