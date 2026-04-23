# Veille sociale — Architecture Audit & Corrected Target

> **Status:** Diagnostic complete · Architecture proposal ready for review
> **Date:** 2026-04-12
> **Scope:** End-to-end audit of the community intelligence engine (Veille sociale)
> **Goal:** Define the corrected architecture that produces operator-useful outputs

---

## 1. What was inspected

| Layer | Files inspected | Lines |
|-------|----------------|-------|
| **Pipeline orchestrator** | `lib/agent-reach/pipeline.js` | 887 |
| **Data assembly (UI backend)** | `lib/operator-intelligence/social.js` | 264 |
| **DB access layer** | `lib/db/community.js` | 249 |
| **Contracts & constants** | `lib/agent-reach/contracts.js` | 140 |
| **Business type resolver** | `lib/ai/business-type-resolver.js` | 176 |
| **AI task: classify** | `lib/ai/tasks/community-classify.js` | 110 |
| **AI task: labels** | `lib/ai/tasks/community-labels.js` | 76 |
| **AI task: synthesize** | `lib/ai/tasks/community-synthesize.js` | 90 |
| **AI task: briefing** | `lib/ai/tasks/community-briefing.js` | 174 |
| **Connector provider** | `lib/connectors/providers/agent-reach.js` | 95 |
| **Continuous engine jobs** | `lib/continuous/jobs.js` + `constants.js` | ~100 |
| **API route (slice)** | `app/api/admin/geo/client/[id]/[slice]/route.js` | ~50 |
| **API route (briefing)** | `app/api/admin/geo/client/[id]/briefing/route.js` | ~100 |
| **Admin page** | `app/admin/(gate)/clients/[id]/social/page.jsx` | 5 |
| **Admin view** | `app/admin/(gate)/views/GeoSocialView.jsx` | 1001 |
| **DB schema** | `supabase/schema.sql` (community_* tables, lines 118-270) | ~150 |
| **Test suite** | `lib/__tests__/community-pipeline.test.js` | ~700 |

**Total code inspected:** ~4,367 lines across 17 files.

---

## 2. Current Veille sociale architecture

### 2.1 Data flow (end-to-end)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TRIGGER                                                                     │
│ ├─ Continuous engine (community_sync, daily, cadence: 1440min)              │
│ └─ Manual (handleLaunchCollection in GeoSocialView → worker_tick)           │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: SEED GENERATION — buildSeedQueries(client)                        │
│                                                                             │
│ Input: client_name, business_type, address.city, site_classification        │
│ Resolution: resolveBusinessType() → canonical_category, offering_anchor     │
│                                                                             │
│ Seeds generated (max 5):                                                    │
│   1. "{clientName} {city}"                                                  │
│   2. "{businessDesc} {city}"                                                │
│   3. "{businessDesc} recommandation {city}"                                 │
│   4. "{clientName} avis"                                                    │
│   5. "{clientName} alternatives"                                            │
│                                                                             │
│ businessDesc = offeringAnchor || canonicalCategory || rawBusinessType        │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 2: REDDIT COLLECTION — collectRedditPosts(seeds)                     │
│                                                                             │
│ Endpoint: https://www.reddit.com/search.json?q={seed}&sort=top&t=year      │
│ Per seed: max 20 posts, timeout 9s                                          │
│ User-Agent: TrouvableSocialIntel/1.0                                        │
│ Deduplication: by post ID across all seed batches                           │
│ Output: {posts[], seedDiagnostics[]}                                        │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 3: DOCUMENT PERSISTENCE — toDocumentRows() → upsertDocuments()       │
│                                                                             │
│ Normalize: lowercase + strip diacritics + alphanum only                     │
│ Hash: SHA256(reddit:{id}:{title[:120]})                                     │
│ Upsert: ON CONFLICT(client_id, source, dedupe_hash) DO NOTHING             │
│ Mark: is_processed = false                                                  │
│ Table: community_documents                                                  │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 4: MENTION EXTRACTION (dual path)                                    │
│                                                                             │
│ PATH A — Keyword (default, COMMUNITY_USE_LLM_ENRICHMENT=false):            │
│   • Complaint: matches 16 EN + 8 FR terms (slow, expensive, arnaque...)    │
│   • Question: title ends with ? OR starts with how/what/comment/pourquoi   │
│   • Competitor: contains vs/alternative/compare + has complaint             │
│   • Theme: tokenize → score against relevanceAnchors ≥ 0.15               │
│   • Language: title ≥ 12 chars + engagement ≥ 5                            │
│                                                                             │
│ PATH B — LLM (when COMMUNITY_USE_LLM_ENRICHMENT=true):                    │
│   • Mistral (community-classify), batch 10 docs, temp 0.1                  │
│   • Falls back to keyword on failure                                        │
│   • Types: complaint, question, theme, competitor, recommendation, language │
│                                                                             │
│ Relevance anchors: client name + city + businessType + resolved category   │
│   + industry vocab matching + intent vocab (always included)                │
│ Table: community_mentions                                                   │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 5: CLUSTERING — aggregateMentionsToClusters()                        │
│                                                                             │
│ Group: by "${cluster_type}::${label}"                                       │
│ Filter: mention_count ≥ 2 (except source_bucket)                           │
│ Theme gate: scoreThemeRelevance(label, anchors) ≥ 0.15                     │
│ Score: themes = mention_count × (1 + relevance); others = mention_count    │
│ Evidence: strong (≥8), medium (≥4), low (<4)                               │
│ Optional LLM: community-labels (Mistral, temp 0.05) for label normalization│
│ Table: community_clusters (clearClusters → upsertClusters every run)       │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 6: OPPORTUNITY DERIVATION (dual path)                                │
│                                                                             │
│ PATH A — Rule-based (default):                                             │
│   • FAQ: from question clusters (top 6)                                    │
│   • Content: from theme clusters (top 4) + complaint clusters (top 4)      │
│   • Differentiation: from competitor_complaint clusters (top 4)            │
│                                                                             │
│ PATH B — LLM (community-synthesize, Mistral, temp 0.3):                   │
│   • Types: response, faq, content, differentiation                         │
│   • Returns headline, rationale, suggested_action, priority                │
│                                                                             │
│ Bridge: also inserts into main opportunities table for action queue         │
│ Table: community_opportunities + opportunities (main)                      │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ UI ASSEMBLY — getSocialSlice(clientId) → GeoSocialView                     │
│                                                                             │
│ Reads: stats + clusters + opportunities + latest run                        │
│ Formats: topComplaints, topQuestions, topThemes, faqOpportunities,          │
│          contentOpportunities, differentiationAngles, sourceBuckets,        │
│          communityLanguage, competitorComplaints                            │
│ AI: AiBriefingPanel → POST /briefing → community-briefing task (Mistral)   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Database tables (VERIFIED from schema.sql)

| Table | Key columns | Purpose |
|-------|-------------|---------|
| `community_collection_runs` | client_id, source, status, seed_queries (JSONB), run_context (JSONB), trigger_source | Track each pipeline execution |
| `community_documents` | client_id, source, title, body, normalized_content, engagement_score, seed_query, dedupe_hash, is_processed | Raw scraped posts |
| `community_mentions` | client_id, document_id, mention_type, label, snippet, evidence_level, provenance, source | Extracted signals from documents |
| `community_clusters` | client_id, cluster_type, label, mention_count, evidence_level, sources (JSONB), score, metadata (JSONB) | Aggregated mention buckets |
| `community_opportunities` | client_id, opportunity_type, title, rationale, evidence_level, mention_count, provenance, source_cluster_id, status | Actionable insights |

**RLS:** All 5 tables have RLS enabled. No anon policies — all access is via service_role.

### 2.3 AI tasks currently registered

| Task ID | Provider | Temp | Purpose | Gate |
|---------|----------|------|---------|------|
| `community-classify` | Mistral | 0.1 | Extract mentions from doc batches | `COMMUNITY_USE_LLM_ENRICHMENT=true` |
| `community-labels` | Mistral | 0.05 | Normalize/deduplicate cluster labels | `COMMUNITY_USE_LLM_ENRICHMENT=true` |
| `community-synthesize` | Mistral | 0.3 | Derive strategic opportunities from clusters | `COMMUNITY_USE_LLM_ENRICHMENT=true` |
| `community-briefing` | Mistral (fallback: Gemini) | 0.25 | Generate operator briefing from run data | Always available (manual trigger) |

### 2.4 Client context shape used by social system

**VERIFIED from pipeline.js `buildSeedQueries()` and `buildRelevanceAnchors()`:**

```javascript
client = {
    client_name: string,         // e.g. "Trouvable"
    business_type: string,       // e.g. "agence SEO GEO visibilité IA" — often generic "LocalBusiness"
    address: { city: string },   // e.g. { city: "Montréal" }
    target_region: string,       // fallback for city
    site_classification: {       // from audit — often empty/missing
        type: string,            // e.g. "operated_service"
        label: string,
        services_preview: [],    // detected services
        detected_services: [],
        short_description_preview: string,
        seo_teaser: string,
    }
}
```

**NOT used by the social system (but available on the client record):**
- `seo_description` — **not passed** to seed generation or relevance scoring
- `services` (if stored separately) — **not passed**
- `mandate context` (intent, goals, target audience specifics) — **does not exist** as structured data
- `competitor list` — **not passed** to keyword extraction (only to LLM classify when enabled)
- `geo_faqs` — **not used**

---

## 3. Root causes of low usefulness

### 3.1 Diagnosis summary

| Root cause | Severity | Category | Status |
|------------|----------|----------|--------|
| **Weak seed strategy** — seeds are generic, not intent-targeted | 🔴 Critical | Seed generation | VERIFIED |
| **No mandate/goal context** — pipeline doesn't know what the operator cares about | 🔴 Critical | Client context | VERIFIED |
| **Reddit-only source** — single source, no subreddit targeting | 🟠 High | Ingestion | VERIFIED |
| **Keyword extraction is shallow** — static term lists, no semantic understanding | 🟠 High | Extraction | VERIFIED |
| **LLM enrichment is OFF by default** — `COMMUNITY_USE_LLM_ENRICHMENT=false` | 🟠 High | Configuration | VERIFIED |
| **No competitor awareness in keyword path** — only in LLM path | 🟡 Medium | Extraction | VERIFIED |
| **Cluster labels are raw tokens** — "seo", "marketing" not contextualized | 🟡 Medium | Clustering | VERIFIED |
| **Opportunity types too narrow** — only faq/content/differentiation | 🟡 Medium | Opportunity derivation | VERIFIED |
| **No scoring model** — clusters sorted by mention_count only | 🟡 Medium | Scoring | VERIFIED |
| **No temporal awareness** — no trend detection across runs | 🟡 Medium | Enrichment | VERIFIED |
| **Bridge to action queue is fire-and-forget** — no dedup, no update | 🟡 Medium | Persistence | VERIFIED |
| **Evidence thresholds too high** — strong ≥ 8 mentions is unrealistic for niche businesses | 🟡 Medium | Scoring | VERIFIED |

### 3.2 Detailed breakdown

#### 3.2.1 Weak seed strategy (CRITICAL)

**Current behavior (VERIFIED in pipeline.js lines 243-268):**
Seeds are mechanically generated from 3 fields: `client_name`, `business_type`, `city`.
The 5 seed templates are:
1. `"{name} {city}"` → finds direct brand mentions (useful but limited)
2. `"{businessDesc} {city}"` → generic category search (too broad)
3. `"{businessDesc} recommandation {city}"` → recommendation pattern (useful)
4. `"{name} avis"` → review pattern (useful for brand monitoring, not for opportunities)
5. `"{name} alternatives"` → alternatives pattern (useful)

**Why this fails:**
- For a business like "Boulangerie Artisan Lyon", the seeds find very little on Reddit.
- For a B2B service like an SEO agency, `"agence SEO Montréal"` finds mostly marketing spam.
- No seeds target **buyer intent** ("best bakery in Lyon"), **problem patterns** ("bakery supply chain issues"), or **community-specific subreddits** (r/Lyon, r/france, r/boulangerie).
- No seeds target what the client's **customers** are looking for.
- The `businessDesc` resolution via `resolveBusinessType()` is heuristic-based and often returns generic labels.

**Where relevance is lost:** At the very first stage — the seeds define the universe of documents, and generic seeds produce generic documents.

#### 3.2.2 No mandate/goal context (CRITICAL)

**Current behavior (VERIFIED):**
The pipeline receives `client` object but has no concept of:
- What the mandate is about (growth? reputation? competitor defense?)
- What the operator wants to monitor (specific competitors? specific market segments?)
- What the client's customers look like (B2B decision makers? Local consumers?)
- What topics matter most to this specific business

**Impact:** The engine produces the same type of generic output for a bakery and a SaaS company — both get "complaints about slow service" and "questions about pricing". The outputs are technically correct but **not useful** because they don't reflect what this specific operator needs.

#### 3.2.3 Reddit-only, untargeted ingestion (HIGH)

**Current behavior (VERIFIED in pipeline.js lines 294-331):**
- Single source: Reddit public search API
- Global search across all subreddits (`/search.json`)
- No subreddit targeting (no `/r/{subreddit}/search.json`)
- Time filter: `t=year` (last 12 months)
- Sort: `top` only (misses recent/rising discussions)
- Max 20 posts per seed × 5 seeds = theoretical max 100 posts (often <50 unique after dedup)

**Why this fails:**
- Reddit global search returns the most popular posts, which are almost always from English-speaking, US-centric subreddits.
- For French local businesses, this produces mostly irrelevant English results.
- No subreddit discovery or targeting means no community depth.
- The `language: 'fr'` hardcoded in `toDocumentRows()` is incorrect — most collected posts will be in English.

#### 3.2.4 Shallow keyword extraction (HIGH)

**Current behavior (VERIFIED in pipeline.js lines 362-474):**
- Complaint detection: 24 static terms (16 EN + 8 FR) scanned via `includes()`
- Question detection: title contains `?` OR starts with hint word
- Competitor detection: requires BOTH competitor hint AND complaint term (too restrictive)
- Theme detection: individual token matching against relevance anchors
- No semantic grouping, no phrase detection, no context-aware classification

**Problems:**
- A post saying "I love how fast their delivery is" contains "fast" but is NOT a complaint — no sentiment awareness.
- Theme tokens are single words ("seo", "marketing") — not meaningful signals.
- Bigram extraction helps but is still syntactic, not semantic.
- The `THEME_RELEVANCE_THRESHOLD = 0.15` is so low that many generic tokens pass through.

#### 3.2.5 LLM enrichment is disabled by default (HIGH)

**Current behavior (VERIFIED in pipeline.js line 27):**
```javascript
const COMMUNITY_USE_LLM_ENRICHMENT = process.env.COMMUNITY_USE_LLM_ENRICHMENT === 'true';
```

This means the 3 LLM tasks (classify, labels, synthesize) are **never executed** in production unless the env var is explicitly set. The system runs entirely on keyword heuristics.

#### 3.2.6 Missing scoring model (MEDIUM)

**Current behavior (VERIFIED):**
- Clusters are scored by `mention_count` (plain frequency) for non-themes
- Theme clusters: `mention_count × (1 + relevance_score)` where relevance is token matching
- Evidence levels: `strong ≥ 8, medium ≥ 4, low < 4` — these thresholds are too high for niche businesses that generate 20-50 documents per run
- No business relevance scoring
- No buying intent scoring
- No geographic proximity scoring
- No temporal trending

#### 3.2.7 Narrow opportunity types (MEDIUM)

**Current opportunity types (VERIFIED from contracts.js):**
- `faq` — from questions
- `content` — from themes and complaints
- `differentiation` — from competitor complaints
- `positioning` — exists in enum but never generated by code
- `response` — exists in enum but never generated by rule-based path

**Missing opportunity types for operator usefulness:**
- Reddit response opportunity (specific thread to engage)
- Buyer intent signal (someone actively looking to buy)
- Comparison discussion (head-to-head evaluation)
- Market pain point (recurring frustration pattern)
- AI mention opportunity (client mentioned in AI context)
- Recurring question (FAQ pattern worth addressing publicly)
- Content gap (topic discussed but no good answers exist)

---

## 4. Corrected target architecture

### 4.1 Architecture principles

1. **Mandate-aware** — the pipeline must know what the operator wants to achieve for this client.
2. **Intent-driven seeds** — seeds must target buyer behavior, not just brand mentions.
3. **Multi-strategy ingestion** — subreddit-targeted + global search + keyword combos.
4. **Semantic extraction** — LLM-powered by default, keyword as fallback (reverse current default).
5. **Multi-dimensional scoring** — business relevance × buying intent × execution potential.
6. **Operator-useful outputs** — every opportunity must be actionable, not just informational.
7. **Signal family taxonomy** — structured signal types that map to operator actions.
8. **Provenance tracking** — every output labeled OBSERVED / DERIVED / INFERRED.

### 4.2 Corrected pipeline stages

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 0: MANDATE CONTEXT RESOLUTION (NEW)                                  │
│                                                                             │
│ Input: client record + mandate metadata + operator-configured goals         │
│ Output: enriched context object                                             │
│   {                                                                         │
│     client_name, business_type, city, target_region,                        │
│     canonical_category, offering_anchor,                                    │
│     mandate_goals: ['growth', 'reputation', 'competitor_defense'],          │
│     target_customer_profile: 'B2B decision makers in Quebec',               │
│     known_competitors: ['CompetitorA', 'CompetitorB'],                      │
│     monitored_topics: ['pricing transparency', 'delivery speed'],           │
│     seo_description, services[],                                            │
│     language_priority: 'fr',                                                │
│   }                                                                         │
│                                                                             │
│ Source: client_geo_profiles + new mandate_context JSONB column              │
│ Provenance: VERIFIED (from operator input) or INFERRED (from audit data)   │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 1: INTELLIGENT SEED GENERATION (REWORKED)                            │
│                                                                             │
│ Seed strategies (multi-strategy, not just templates):                       │
│                                                                             │
│ A. Brand monitoring seeds:                                                  │
│    "{name}" / "{name} avis" / "{name} alternatives"                         │
│                                                                             │
│ B. Buyer intent seeds (NEW):                                                │
│    "best {offering} {city}" / "recommandation {offering} {city}"            │
│    "{offering} vs" / "looking for {offering}"                               │
│                                                                             │
│ C. Problem/pain seeds (NEW):                                                │
│    "{offering} problems" / "{offering} expensive"                           │
│    "{industry} frustration" / "{industry} alternatives"                     │
│                                                                             │
│ D. Competitor seeds (NEW):                                                  │
│    "{competitor} problems" / "{competitor} alternatives"                     │
│    "{competitor} vs {offering}"                                             │
│                                                                             │
│ E. Community-targeted seeds (NEW):                                          │
│    Subreddit-scoped: site:reddit.com/r/{relevant_sub} {topic}              │
│    Language-targeted: include FR-specific terms when language_priority=fr   │
│                                                                             │
│ Max seeds: 8-12 (up from 5), prioritized by mandate goals                  │
│ Seed metadata: each seed tagged with strategy + expected signal family      │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 2: COLLECTION (ENHANCED)                                             │
│                                                                             │
│ Source: Reddit (keep as primary, expand strategy)                           │
│ Changes:                                                                    │
│   - Add subreddit-targeted search: /r/{sub}/search.json                    │
│   - Add sort=new alongside sort=top (catch recent discussions)             │
│   - Add sort=relevance for precise queries                                  │
│   - Detect actual language of post (not hardcode 'fr')                     │
│   - Increase per-query limit to 25                                          │
│   - Add engagement threshold filter (ups ≥ 2 for quality)                  │
│   - Tag each document with the seed strategy that found it                 │
│                                                                             │
│ Future sources (not in scope now): web forums, X, YouTube comments          │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 3: DOCUMENT PERSISTENCE (MINOR CHANGES)                              │
│                                                                             │
│ Changes:                                                                    │
│   - Store detected language (not hardcoded 'fr')                           │
│   - Store seed_strategy tag alongside seed_query                           │
│   - Store subreddit as first-class field (not just in source_metadata)     │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 4: SIGNAL EXTRACTION (REWORKED)                                      │
│                                                                             │
│ Default: LLM-powered (reverse current default)                             │
│ Fallback: keyword heuristics (keep as safety net)                          │
│                                                                             │
│ LLM task (community-classify v2):                                          │
│   - Input: documents + full mandate context (not just name + type)         │
│   - Signal families: see Section 5                                          │
│   - Each signal tagged with: confidence, provenance, relevance_to_mandate  │
│   - Extract buying_intent signals (someone actively looking to buy)        │
│   - Extract comparison_intent signals (head-to-head evaluations)           │
│   - Extract response_opportunity signals (thread worth engaging)           │
│   - Extract ai_mention signals (client mentioned by AI/in AI context)      │
│                                                                             │
│ Keyword path (enhanced):                                                    │
│   - Add sentiment awareness (positive context disqualifies complaint)      │
│   - Add buying intent keywords (looking for, need, budget, hire)           │
│   - Add comparison keywords beyond vs (compared to, switch from)           │
│   - Use seed strategy tag to pre-classify expected signal type             │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 5: INTELLIGENT CLUSTERING (REWORKED)                                 │
│                                                                             │
│ Changes:                                                                    │
│   - LLM-based label normalization ON by default (not optional)             │
│   - Semantic grouping: merge similar labels before counting                │
│   - Lower mention_count threshold to 1 for high-value signal families     │
│     (buyer_question, comparison_intent, response_opportunity)              │
│   - Add temporal dimension: track first_seen_at, last_seen_at, trend      │
│   - Add subreddit attribution per cluster                                  │
│   - Drop source_bucket cluster type (low value for operator)               │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 6: MULTI-DIMENSIONAL SCORING (NEW)                                   │
│                                                                             │
│ See Section 6 for full scoring model                                        │
│                                                                             │
│ Each cluster/opportunity scored on 9 dimensions (0-1 each):                │
│   business_relevance, business_type_proximity, geographic_proximity,        │
│   problem_intensity, buying_intent, comparison_intent,                      │
│   execution_potential, ai_reusability, spam_risk (inverted)                 │
│                                                                             │
│ Composite score: weighted sum with mandate-aware weights                    │
│ Evidence thresholds: lowered for niche businesses                           │
│   strong ≥ 4 (was 8), medium ≥ 2 (was 4), low < 2 (was <4)               │
└────────────────────────────────────┬────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ STAGE 7: OPERATOR OPPORTUNITY DERIVATION (REWORKED)                        │
│                                                                             │
│ Output types (expanded from 3 to 8):                                       │
│   - reddit_opportunity: specific thread the operator can engage             │
│   - recurring_buyer_question: FAQ pattern worth public response             │
│   - comparison_discussion: head-to-head evaluation with actionable angle   │
│   - recurring_pain_point: market frustration the client can address         │
│   - differentiation_angle: competitive weakness to exploit                 │
│   - content_opportunity: topic worth creating content about                │
│   - response_opportunity: specific thread worth responding to              │
│   - ai_mention_opportunity: AI/LLM context where client is relevant        │
│                                                                             │
│ Each opportunity includes:                                                  │
│   - title, rationale, suggested_action                                     │
│   - composite_score, evidence_level                                        │
│   - source_url (specific Reddit thread when applicable)                    │
│   - signal_family, provenance                                              │
│   - expiry_hint (how long this opportunity remains actionable)             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 What stays the same

- **Database structure**: 5 community_* tables — schema is sound, needs column additions not table changes.
- **Continuous engine integration**: community_sync job, cadence, retry logic.
- **Connector architecture**: agent_reach provider, status tracking.
- **UI assembly pattern**: getSocialSlice → GeoSocialView (UI rework is a separate workstream).
- **AI task registration pattern**: registerTask() with provider, schema, buildMessages, normalize.
- **Briefing task**: community-briefing can be enhanced but the pattern works.
- **RLS policy**: all tables service_role only.

---

## 5. Proposed signal families

### 5.1 Signal family taxonomy

| Signal family | Description | Source | Provenance |
|--------------|-------------|--------|------------|
| `buyer_question` | Someone asking how to find/choose/evaluate a service in this category | Reddit posts with buying-intent language | OBSERVED |
| `comparison_intent` | Head-to-head evaluation or "X vs Y" discussion | Reddit posts with comparison language | OBSERVED |
| `best_tool_intent` | "Best {category} in {city}" or "recommend a {offering}" | Reddit posts with recommendation language | OBSERVED |
| `pain_point` | Recurring frustration, complaint, or unmet need in the market | Multiple posts expressing same pain | DERIVED (aggregated from observed) |
| `competitor_weakness` | Specific complaints about a known competitor | Posts mentioning competitor + negative sentiment | OBSERVED or DERIVED |
| `thread_opportunity` | A specific Reddit thread where the operator could usefully respond | High-engagement post with relevant question/pain | OBSERVED |
| `response_opportunity` | A specific post where a direct response would add value | Recent, unanswered or poorly answered question | OBSERVED |
| `ai_mention_opportunity` | Discussion about AI tools, LLM answers, or AI-generated recommendations relevant to the client's domain | Posts discussing AI/LLM in client's industry | OBSERVED or DERIVED |
| `content_gap` | Topic with many questions but few quality answers | Cluster with high question count, low answer quality | DERIVED |
| `market_vocabulary` | Distinctive language patterns used by the target audience | High-engagement phrases and terms | DERIVED |
| `brand_mention` | Direct mention of the client's brand or product | Posts containing client name | OBSERVED |
| `competitor_mention` | Direct mention of a known competitor | Posts containing competitor name | OBSERVED |

### 5.2 Signal family to opportunity type mapping

```
buyer_question       → recurring_buyer_question, content_opportunity
comparison_intent    → comparison_discussion, differentiation_angle
best_tool_intent     → response_opportunity, content_opportunity
pain_point           → recurring_pain_point, content_opportunity
competitor_weakness  → differentiation_angle
thread_opportunity   → reddit_opportunity, response_opportunity
response_opportunity → response_opportunity
ai_mention           → ai_mention_opportunity
content_gap          → content_opportunity
market_vocabulary    → (enrichment for other signals, not a direct opportunity)
brand_mention        → (monitoring, not a direct opportunity unless negative)
competitor_mention   → comparison_discussion
```

---

## 6. Proposed scoring model

### 6.1 Scoring dimensions

| Dimension | Range | How computed | Weight |
|-----------|-------|--------------|--------|
| `business_relevance` | 0.0–1.0 | Token overlap with offering_anchor + seo_description + services | 0.20 |
| `business_type_proximity` | 0.0–1.0 | Semantic similarity to canonical_category | 0.15 |
| `geographic_proximity` | 0.0–1.0 | Mention of client city/region OR same-language community | 0.10 |
| `problem_intensity` | 0.0–1.0 | Complaint severity + frequency + engagement | 0.10 |
| `buying_intent` | 0.0–1.0 | Buyer language: "looking for", "need", "budget", "hire", "recommend" | 0.15 |
| `comparison_intent` | 0.0–1.0 | Comparison language: "vs", "compared to", "alternative", "switch" | 0.10 |
| `execution_potential` | 0.0–1.0 | Can the operator act on this? (has URL, recent, answerable) | 0.10 |
| `ai_reusability` | 0.0–1.0 | Can this insight be reused for GEO/AEO content? | 0.05 |
| `spam_risk` | 0.0–1.0 | Inverted: low score = high spam risk (self-promo, bot, low effort) | 0.05 |

### 6.2 Composite scoring formula

```
composite_score = Σ(dimension_value × weight) × mandate_multiplier
```

Where `mandate_multiplier` adjusts weights based on mandate goals:
- Growth mandate: buying_intent weight ×1.5, comparison_intent weight ×1.3
- Reputation mandate: problem_intensity weight ×1.5, competitor_weakness ×1.3
- Content mandate: ai_reusability weight ×2.0, content_gap ×1.5

### 6.3 Evidence level thresholds (corrected)

| Level | Current | Proposed | Rationale |
|-------|---------|----------|-----------|
| Strong | ≥ 8 mentions | ≥ 4 mentions | Niche businesses rarely generate 8+ mentions per topic |
| Medium | ≥ 4 mentions | ≥ 2 mentions | Even 2 independent data points are meaningful |
| Low | < 4 mentions | 1 mention | Single data points are still signals, just low confidence |

---

## 7. Highest-leverage first changes

Ordered by impact × feasibility:

### 7.1 🔴 Phase A — Foundation (highest leverage, do first)

| # | Change | Impact | Files affected | Effort |
|---|--------|--------|----------------|--------|
| A1 | **Enable LLM enrichment by default** — flip `COMMUNITY_USE_LLM_ENRICHMENT` to true or remove the gate | High | `pipeline.js` (1 line), `.env` | Trivial |
| A2 | **Add mandate context to client record** — add `social_watch_config` JSONB column to `client_geo_profiles` with goals, competitors, monitored topics | High | `schema.sql`, `lib/db/community.js` | Small |
| A3 | **Rework seed generation** — implement multi-strategy seeds using mandate context, buyer intent patterns, competitor seeds | Critical | `pipeline.js` (buildSeedQueries) | Medium |
| A4 | **Pass full context to LLM classify** — send mandate goals, competitors, seo_description to community-classify task | High | `community-classify.js`, `pipeline.js` | Small |

### 7.2 🟠 Phase B — Extraction & scoring quality

| # | Change | Impact | Files affected | Effort |
|---|--------|--------|----------------|--------|
| B1 | **Expand signal families** — add buyer_question, comparison_intent, best_tool_intent, pain_point, competitor_weakness, thread_opportunity, response_opportunity, ai_mention_opportunity to mention_type enum | High | `contracts.js`, `community-classify.js`, `pipeline.js`, `schema.sql` | Medium |
| B2 | **Implement multi-dimensional scoring** — replace mention_count scoring with composite score | High | `pipeline.js` (aggregateMentionsToClusters), `contracts.js` | Medium |
| B3 | **Lower evidence thresholds** — strong ≥ 4, medium ≥ 2, low < 2 | Medium | `contracts.js` (evidenceLevel) | Trivial |
| B4 | **Fix language detection** — detect actual document language instead of hardcoding 'fr' | Medium | `pipeline.js` (toDocumentRows) | Small |

### 7.3 🟡 Phase C — Opportunity derivation & operator outputs

| # | Change | Impact | Files affected | Effort |
|---|--------|--------|----------------|--------|
| C1 | **Expand opportunity types** — add reddit_opportunity, recurring_buyer_question, comparison_discussion, recurring_pain_point, response_opportunity, ai_mention_opportunity | High | `contracts.js`, `pipeline.js` (deriveOpportunitiesFromClusters), `community-synthesize.js` | Medium |
| C2 | **Add source URL to opportunities** — link each opportunity to its most relevant Reddit thread | Medium | `pipeline.js`, `community_opportunities` schema | Small |
| C3 | **Add expiry/freshness tracking** — opportunities decay over time | Medium | `community_opportunities` schema, `pipeline.js` | Small |
| C4 | **Enhance opportunity bridge** — dedup before inserting into main opportunities table | Medium | `pipeline.js` (lines 816-829) | Small |

### 7.4 🔵 Phase D — Collection quality (can be parallel with B/C)

| # | Change | Impact | Files affected | Effort |
|---|--------|--------|----------------|--------|
| D1 | **Add subreddit-targeted collection** — search within relevant subreddits | High | `pipeline.js` (collectRedditPosts) | Medium |
| D2 | **Add sort=new collection** — catch recent discussions alongside top | Medium | `pipeline.js` (collectRedditPosts) | Small |
| D3 | **Add engagement threshold** — filter out low-quality posts (ups < 2) | Medium | `pipeline.js` | Small |

---

## 8. Specific files, routes, and tables involved

### 8.1 Files to modify

| File | Changes needed |
|------|---------------|
| `lib/agent-reach/pipeline.js` | Rework buildSeedQueries, enhance collectRedditPosts, expand extractMentionsFromDocuments, rework scoring in aggregateMentionsToClusters, expand deriveOpportunitiesFromClusters, pass mandate context through pipeline |
| `lib/agent-reach/contracts.js` | Add new signal families to COMMUNITY_MENTION_TYPES, new opportunity types to COMMUNITY_OPPORTUNITY_TYPES, lower evidence thresholds, add scoring dimension constants |
| `lib/ai/tasks/community-classify.js` | Expand input schema to include mandate context, expand mention_type enum, add confidence scoring |
| `lib/ai/tasks/community-synthesize.js` | Expand opportunity_type enum, add scoring dimensions, output source_url |
| `lib/ai/tasks/community-briefing.js` | Update to use new signal families in output |
| `lib/ai/business-type-resolver.js` | No changes needed — already robust |
| `lib/db/community.js` | Add queries for new columns if schema changes |
| `lib/operator-intelligence/social.js` | Update formatClusterItems and formatOpportunities for new types |
| `app/admin/(gate)/views/GeoSocialView.jsx` | Update to render new signal families and opportunity types (UI phase, later) |

### 8.2 Schema changes needed

**Column additions to `client_geo_profiles`:**
```sql
-- Mandate context for social watch system
ALTER TABLE public.client_geo_profiles
ADD COLUMN IF NOT EXISTS social_watch_config JSONB DEFAULT '{}'::jsonb;

-- Expected shape:
-- {
--   "goals": ["growth", "reputation", "competitor_defense"],
--   "known_competitors": ["CompetitorA", "CompetitorB"],
--   "monitored_topics": ["pricing", "delivery speed"],
--   "target_customer_description": "PME québécoises cherchant visibilité Google",
--   "language_priority": "fr",
--   "subreddit_targets": ["r/Quebec", "r/montreal", "r/SEO"]
-- }
```

**Column additions to `community_documents`:**
```sql
ALTER TABLE public.community_documents
ADD COLUMN IF NOT EXISTS detected_language TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS seed_strategy TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS subreddit TEXT DEFAULT NULL;
```

**Column additions to `community_mentions`:**
```sql
ALTER TABLE public.community_mentions
ADD COLUMN IF NOT EXISTS confidence NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS mandate_relevance NUMERIC DEFAULT 0;
```

**Column additions to `community_clusters`:**
```sql
ALTER TABLE public.community_clusters
ADD COLUMN IF NOT EXISTS composite_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS scoring_dimensions JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS first_seen_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS trend TEXT DEFAULT 'stable'
    CHECK (trend IN ('rising', 'stable', 'declining', 'new'));
```

**Column additions to `community_opportunities`:**
```sql
ALTER TABLE public.community_opportunities
ADD COLUMN IF NOT EXISTS source_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS composite_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS signal_family TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS suggested_action TEXT DEFAULT NULL;
```

**Mention type enum expansion (in code, not SQL constraint):**
```
Current:  complaint, question, theme, competitor, recommendation, opportunity, language
Proposed: + buyer_question, comparison_intent, best_tool_intent, pain_point,
            competitor_weakness, thread_opportunity, response_opportunity,
            ai_mention, content_gap, market_vocabulary, brand_mention, competitor_mention
```

### 8.3 Routes affected

| Route | Impact |
|-------|--------|
| `GET /api/admin/geo/client/[id]/social` | No change needed (loads via getSocialSlice) |
| `POST /api/admin/geo/client/[id]/briefing` | Minor — pass new context to briefing task |
| `POST /api/admin/geo/client/[id]/continuous` | No change — triggers same pipeline |

### 8.4 Environment variables

| Variable | Current | Proposed |
|----------|---------|----------|
| `COMMUNITY_USE_LLM_ENRICHMENT` | `false` (default) | `true` (default) or remove gate |

---

## 9. Validation plan

### 9.1 Per-phase validation

| Phase | Validation |
|-------|------------|
| **A (Foundation)** | Run pipeline for 3 test clients (Trouvable, a local bakery, a SaaS). Compare seed quality before/after. Verify LLM enrichment produces richer mentions than keyword-only. |
| **B (Scoring)** | Compare cluster ranking before/after scoring model. Verify niche businesses get reasonable evidence levels. Check signal family distribution across test clients. |
| **C (Opportunities)** | Operator review: are the new opportunity types actionable? Do they include source URLs? Is the suggested_action realistic? |
| **D (Collection)** | Compare document volume and relevance before/after subreddit targeting. Verify language detection accuracy. |

### 9.2 Regression checks

- [ ] Existing pipeline test suite passes (`lib/__tests__/community-pipeline.test.js`)
- [ ] No schema breakage (all ALTER TABLE uses IF NOT EXISTS)
- [ ] GeoSocialView renders without errors (even before UI updates)
- [ ] Continuous engine community_sync job runs successfully
- [ ] Briefing task produces valid output with new data shape
- [ ] Main opportunities bridge doesn't create duplicates

### 9.3 Quality metrics to track

| Metric | Current baseline | Target |
|--------|-----------------|--------|
| Unique signal families per run | 3-4 (complaint, question, theme, language) | 6-8 |
| Opportunities with source_url | 0% | >60% |
| Operator "useful" rating on briefing | Not measured | Introduce rating |
| Documents per run (after dedup) | 20-50 | 50-100 |
| Clusters passing relevance filter | ~10-15 | 15-25 (higher quality) |

---

## 10. What is real signal vs cosmetic output

### Currently real signal (VERIFIED)
- **Seed diagnostics** — accurate per-seed result counts
- **Document collection counts** — real Reddit data
- **Mention extraction** — real pattern matching (but shallow)
- **Cluster aggregation** — real frequency counting
- **Evidence levels** — based on real counts (but thresholds wrong)
- **Run status tracking** — accurate pipeline state

### Currently cosmetic output (VERIFIED)
- **Theme clusters** — often single-word tokens ("seo", "marketing") with no actionable context
- **FAQ opportunities** — just prepend "FAQ:" to a question title, no analysis
- **Content opportunities** — just prepend "Angle contenu:" to a theme, no strategy
- **Differentiation opportunities** — just prepend "Angle de différenciation:" to a complaint
- **Source buckets** — all show "reddit" since that's the only source
- **Language clusters** — just high-engagement titles, not actual language analysis
- **Evidence level "strong"** — almost never reached (threshold ≥ 8 is too high)

### Needs to become real signal
- Every opportunity must explain **why** it matters to **this specific business**
- Every opportunity must link to **actionable evidence** (source URL)
- Scoring must reflect **operator priority**, not just frequency
- Signal families must map to **operator actions**, not just information categories

---

## Appendix A: Verified vs inferred vs not verified

| Claim | Status | Evidence |
|-------|--------|----------|
| Seeds are generated from 3 fields only | ✅ VERIFIED | pipeline.js:243-268 |
| LLM enrichment is off by default | ✅ VERIFIED | pipeline.js:27 |
| Reddit is the only source | ✅ VERIFIED | pipeline.js:294-331, contracts.js:9 |
| Language is hardcoded to 'fr' | ✅ VERIFIED | pipeline.js:353 |
| Evidence thresholds are 8/4 | ✅ VERIFIED | contracts.js:22-26 |
| Only 3 opportunity types are generated by rules | ✅ VERIFIED | pipeline.js:606-674 |
| Clusters are cleared and rebuilt every run | ✅ VERIFIED | pipeline.js:742 |
| LLM classify uses Mistral with temp 0.1 | ✅ VERIFIED | community-classify.js:104 |
| Bridge to main opportunities has no dedup | ✅ VERIFIED | pipeline.js:816-829 |
| social_watch_config column doesn't exist yet | ✅ VERIFIED | schema.sql inspection |
| Mandate context is not available to the pipeline | ✅ VERIFIED | pipeline.js:680-684 |
| seo_description is not used by social system | ✅ VERIFIED | pipeline.js full inspection |
| Competitors are not passed to keyword extraction | ✅ VERIFIED | pipeline.js:362-474 |
| Lowered thresholds would improve niche coverage | 🔵 INFERRED | Based on typical niche run volumes |
| Multi-strategy seeds would improve relevance | 🔵 INFERRED | Based on seed-to-document analysis |
| LLM-by-default would improve extraction quality | 🔵 INFERRED | Based on comparing keyword vs LLM code paths |
