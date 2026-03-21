# Audit QA Plan — Trouvable Internal Validation System

## 1. What the Audit Currently Outputs

The audit pipeline (`lib/audit/run-audit.js`) produces the following data, persisted to `client_site_audits`:

| Output                | DB Column          | Type   | Description |
|-----------------------|--------------------|--------|-------------|
| SEO score             | `seo_score`        | int    | Dimension score for technical SEO (0–100) |
| GEO score             | `geo_score`        | int    | Dimension score for local readiness (0–100) |
| SEO breakdown         | `seo_breakdown`    | JSONB  | Full dimension/indicator detail incl. site classification, methodology |
| GEO breakdown         | `geo_breakdown`    | JSONB  | Same structure + AI analysis layer (business_summary, geo_recommendability) |
| Extracted data        | `extracted_data`   | JSONB  | Raw crawl signals: phones, emails, social, schema, local/trust/service signals, page summaries |
| Issues                | `issues`           | JSONB  | Array of structured issues with title, severity, evidence, provenance |
| Strengths             | `strengths`        | JSONB  | Array of structured strengths with title, evidence, provenance |
| Prefill suggestions   | `prefill_suggestions` | JSONB | Automation data: detected field values with confidence |

### Downstream tables

| Table                 | Content |
|-----------------------|---------|
| `opportunities`       | Actionable issues derived from audit issues + AI opportunities |
| `merge_suggestions`   | Field-level suggestions for enriching client profile |

### Internal scoring structure

The deterministic score is composed of **5 dimensions**, each with multiple indicators:

1. **technical_seo** — HTTPS, title, description, H1, canonical, indexability, crawl, rendered content
2. **local_readiness** — local schema, public contact, local footprint, supporting pages, identity + location
3. **ai_answerability** — content richness, service clarity, FAQ support, heading structure, extractable identity
4. **trust_signals** — proof/review language, social presence, support pages, structured identity
5. **identity_completeness** — business name, contactability, business context, support surfaces

Each indicator has: `key`, `label`, `score`, `max_score`, `applicability`, `evidence`, `status`.

### Site classification

Detected type from: `local_business`, `saas_software`, `hybrid_business`, `content_led`, `generic_business`.
Classification drives: weight profiles and applicability levels for each dimension.

---

## 2. Signal Classification: Deterministic vs Heuristic vs Inferred

### Deterministic (directly observable from crawl HTML)

| Signal | Source |
|--------|--------|
| `has_https` | Resolved URL starts with `https://` |
| `title_present` | `<title>` tag text ≥ threshold |
| `meta_description_present` | `<meta name="description">` content ≥ threshold |
| `h1_present` | `<h1>` text ≥ threshold |
| `canonical_present` | `<link rel="canonical">` found |
| `noindex_present` | `<meta name="robots" content="noindex">` found |
| `phone_extracted` | `tel:` link or regex match |
| `email_extracted` | `mailto:` link or regex match |
| `social_links_present` | Links to known social networks |
| `local_business_schema_present` | JSON-LD with LocalBusiness-like type |
| `faq_schema_present` | JSON-LD with FAQPage type |
| `faq_pairs_count` | Count of extracted Q/A pairs |
| `crawl_success_rate` | Pages returning usable HTML |
| `word_count` | Total visible words extracted |
| `contact_page_present` | Page classified as "contact" |
| `about_page_present` | Page classified as "about" |

### Heuristic (rule-based inference from crawl data)

| Signal | Method |
|--------|--------|
| `site_type_classification` | Multi-signal scoring (schema types, keywords, page types) |
| `local_footprint_strength` | Count of local signals (cities, regions, addresses) |
| `service_clarity` | Service keywords + service page detection |
| `trust_evidence_strength` | Count of trust/review terms in body text |
| `business_name_extracted` | Schema + OG + heading + title extraction |
| `hydration_risk` | App shell detection + low word count |
| `page_type_classification` | URL + title + content keyword matching |

### Inferred (LLM-driven)

| Signal | Source |
|--------|--------|
| `business_summary` | LLM analysis of crawl data |
| `geo_recommendability` | LLM assessment |
| `geo_recommendability_rationale` | LLM explanation |
| `answerability_summary` | LLM assessment |
| `llm_comprehension_score` | LLM self-assessed score (0–15) |
| `ai_opportunities` | LLM-generated opportunity suggestions |
| `ai_merge_suggestions` | LLM-suggested profile field changes |

---

## 3. What We Will Validate Now

### Tier 1 — Deterministic signals (strict validation)

- Presence/absence of: HTTPS, title, description, H1, canonical, noindex
- Phone/email extraction correctness
- Social link detection
- Schema detection (LocalBusiness, FAQ)
- FAQ pair extraction
- Page type classification
- Crawl coverage counts

### Tier 2 — Heuristic signals (range-based / directional validation)

- Site type classification matches expected type
- Dimension scores fall within expected ranges
- Applicability levels are reasonable for given site type
- Issues and strengths set contains expected items (by title keyword)
- Weight profiles are correct for classified type

### Tier 3 — Score-level validation

- Overall deterministic score within expected range
- Dimension sub-scores within expected ranges
- Penalty/bonus directionality (e.g., SaaS not crushed on local)
- Not-applicable signals treated fairly

---

## 4. What Remains Harder to Validate Automatically

| Area | Why |
|------|-----|
| LLM summary quality | Subjective, non-deterministic, model-dependent |
| Geo recommendability accuracy | Requires domain expertise to grade |
| AI opportunity relevance | Hard to define ground truth for generated suggestions |
| Trust signal _quality_ (vs presence) | Presence ≠ quality |
| Content richness _usefulness_ | Word count is proxy only |
| Cross-site fairness | Needs many test cases to assess systematically |

These should be noted as limitations in the QA system — not faked with pseudo-precision.
