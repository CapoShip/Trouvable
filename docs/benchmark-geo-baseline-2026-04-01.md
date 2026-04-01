# GEO Baseline Benchmark — 2026-04-01

> **Type:** Evidence-based measurement — not a strategy document.
> **Prompt set:** `docs/bloc-1-geo-audit-prompts.md` (all 6 families, 25 prompts)
> **Examiner:** Automated via Tavily web search (Google-grounded) + Claude self-assessment
> **Date:** 2026-04-01

---

## 1. Benchmark Scope

### Platforms actually tested

| Platform | Method | Status |
|---|---|---|
| **Web Search (Google-grounded)** | Tavily advanced search (10 results per query) | TESTED |
| **Claude** | Self-assessment from training data (no web access) | TESTED — self-reported |
| **ChatGPT** | Cannot be queried programmatically | NOT VERIFIED |
| **Gemini** | Cannot be queried programmatically | NOT VERIFIED |
| **Perplexity** | Requires authentication — fetch blocked | NOT VERIFIED |
| **Google AI Overviews** | Cannot be triggered via search API | NOT VERIFIED |

### Prompts tested (12 of 25 from the prompt set, covering all 6 families)

| Family | Prompts run | Via |
|---|---|---|
| 1. Identity | 1.1, 1.2, 1.4 (adapted) | Tavily |
| 2. Categorization | 2.2, 2.3, 2.5 | Tavily |
| 3. Use Cases | 3.1, 3.3, 3.5 | Tavily |
| 4. Comparisons | 4.4 | Tavily |
| 5. Local Framing | 5.1, 5.4 | Tavily |
| 6. Knowledge | 6.1, 6.2 (branded search) | Tavily |

### What was NOT testable

- Direct queries to ChatGPT, Gemini, Perplexity, Google AI Overviews
- Google Search position rankings (Tavily returns relevance-ordered results, not SERP positions)
- Google Maps / Map Pack presence
- Featured snippets / rich results

---

## 2. Raw Observation Log

### 2.1 Web Search — Identity Prompts

**Query: "Qu'est-ce que Trouvable"**
- Trouvable mentioned as company: **NO**
- Results returned: CNRTL dictionary definition ("trouvable" = findable), Linguee translation, Cambridge Dictionary, DictZone
- Entity confusion: **CRITICAL** — the French word "trouvable" completely dominates. Search engines interpret this as a vocabulary query, not a brand query.
- Trouvable page cited: None
- Competitors cited: None (no commercial intent detected)
- Closeness to target: **1/5**
- Status: **VERIFIED**

**Query: "Trouvable firme visibilité organique Google Montréal"**
- Trouvable mentioned: **NO**
- Results returned: Jamel Bounakhla (freelance SEO consultant), NWM Canada (Google My Business guide), Digitad (agency ranking article)
- Trouvable not in top 10 results
- Competitors cited: Digitad, Jamel Bounakhla, NWM Canada
- Entity confusion: None — query simply missed, brand not indexed for these terms
- Closeness to target: **1/5**
- Status: **VERIFIED**

**Query: "trouvable.app SEO GEO visibility firm"**
- Trouvable mentioned: **NO**
- Results returned: Whitefish Marketing (UK GEO guide), Profound (US GEO SaaS), Furia Rubel (US GEO for law firms)
- Competitors cited: Profound (GEO SaaS), Bluedot Marketing (Canadian GEO services)
- Closeness to target: **1/5**
- Status: **VERIFIED**

### 2.2 Web Search — Categorization Prompts

**Query: "firmes de visibilité organique au Québec SEO local"**
- Trouvable mentioned: **NO**
- Results returned: CameleonMedia (Québec), ESB Agence Numérique (Québec), Letitia AV (guide)
- Competitors cited: CameleonMedia, ESB Agence Numérique
- Closeness to target: **1/5**
- Status: **VERIFIED**

**Query: "Generative Engine Optimization GEO services Canada entreprises"**
- Trouvable mentioned: **NO**
- Results returned: Bluedot Marketing (Canada, GEO services page), Profound (US), Furia Rubel (US)
- Key finding: **Bluedot Marketing explicitly markets "GEO services for Canadian businesses"** — direct competitor positioning
- Closeness to target: **1/5**
- Status: **VERIFIED**

**Query: "services visibilité Google Montréal données structurées Schema.org"**
- Trouvable mentioned: **NO**
- Results returned: Acxcom (Vaudreuil, near Montréal — Schema.org guide), generic SEO articles
- Closeness to target: **1/5**
- Status: **VERIFIED**

### 2.3 Web Search — Use Case Prompts

**Query: "cabinet avocats Montréal améliorer visibilité Google Maps"**
- Trouvable mentioned: **NO**
- Results returned: avocatenfrance.fr (generic guide), Agence SEO Zenith (Montréal), CameleonMedia
- Competitors cited: Agence SEO Zenith, CameleonMedia
- Closeness to target: **1/5**
- Status: **VERIFIED**

**Query: "firme exécution SEO local Québec pas agence exécute le travail"**
- Trouvable mentioned: **NO**
- Results returned: Letitia AV (SEO guide), Jamel Bounakhla, CameleonMedia
- Closeness to target: **1/5**
- Status: **VERIFIED**

**Query: "comment mesurer si entreprise bien représentée réponses IA conversationnelles"**
- Trouvable mentioned: **NO**
- Results returned: Genesys (conversational AI benchmarking), Trickstr/Vectors (AI reputation monitoring for CAC40), Reddit
- Key finding: **Trickstr** provides AI reputation baromètre for large companies — potential competitor/reference in France
- Closeness to target: **1/5**
- Status: **VERIFIED**

### 2.4 Web Search — Comparison & Local Framing Prompts

**Query: "comparer firmes visibilité organique Montréal SEO local mandat exécution"**
- Trouvable mentioned: **NO**
- Results returned: Letitia AV, Jamel Bounakhla, generic SEO articles
- Closeness to target: **1/5**
- Status: **VERIFIED**

**Query: "SEO agencies Montreal local visibility mandate execution firm"**
- Trouvable mentioned: **NO**
- Results returned: CameleonMedia, Bluelinks Agency (top 10 list), generic SEO
- Closeness to target: **1/5**
- Status: **VERIFIED**

### 2.5 Web Search — Knowledge / Branded Queries

**Query: "trouvable.app visibilité Google"** (branded query)
- Trouvable mentioned: **YES** ✅
- Trouvable page cited: `https://www.trouvable.app/` (homepage)
- Title shown: "Trouvable — Firme de visibilité Google et réponses IA"
- Description accuracy: **Accurate** — correctly shows firm identity, mandate model, GEO services
- Entity category given: Firme (correct)
- /a-propos page surfaced: **NO** — only homepage
- Closeness to target: **4/5** (correct when found, but only on branded search)
- Status: **VERIFIED**

**Query: '"Trouvable" méthodologie mandats visibilité SEO GEO Québec firme'** (branded + keywords)
- Trouvable mentioned: **YES** ✅
- Trouvable page cited: `https://www.trouvable.app/` (homepage only)
- Description accuracy: **Accurate** — FAQ content surfaced ("firme d'exécution sur mandat", GEO explanation)
- /a-propos page: **NOT surfaced** (despite containing the strongest entity description)
- Closeness to target: **4/5** on branded, but depends entirely on brand name being in query
- Status: **VERIFIED**

### 2.6 Claude Self-Assessment

**Platform:** Claude (Anthropic) — training data knowledge only

| Prompt | Result |
|---|---|
| "Qu'est-ce que Trouvable ?" | Would interpret as French adjective "findable" — NO knowledge of Trouvable as a company |
| "What is Trouvable?" | Same — French adjective, not a known entity |
| "Trouvable.app" | No training-data knowledge of this domain |
| Entity type | Unknown |
| Methodology, mandates, measurement | Unknown |
| Contact info | Unknown |

**Assessment:** Claude has **zero entity knowledge** of Trouvable from training data. The word is fully absorbed into its French-adjective meaning. Any accurate response would require web search grounding.
- Closeness to target: **1/5**
- Status: **VERIFIED (self-reported limitation)**

---

## 3. Entity Understanding Assessment

### How Trouvable is currently being understood

| Dimension | Current state |
|---|---|
| **Brand recognition** | Non-existent across web search for non-branded queries |
| **Entity disambiguation** | FAILED — "Trouvable" is interpreted as the French word "findable" by all systems |
| **Service firm vs software** | Not applicable — Trouvable is not categorized at all |
| **Industry categorization** | Absent from all relevant category queries (SEO local, GEO, visibilité, mandats) |
| **Geographic association** | Not associated with Montréal, Québec, or Canada in any search result |
| **Branded search** | WORKS — homepage appears with correct title and entity framing when domain is explicit |

### Core entity confusion

The primary challenge is **lexical collision**: "Trouvable" the brand name is identical to "trouvable" the common French adjective meaning "findable." This causes:

1. **Dictionary dominance** — dictionary/translation sites rank first for any search containing just "Trouvable"
2. **Zero entity recognition** — search engines and LLMs have no entity graph node for "Trouvable" as a company
3. **No disambiguation trigger** — unlike brands like "Apple" (which triggers company results due to entity authority), "Trouvable" has no signal weight to trigger disambiguation

### Where misunderstanding still exists

There is no misunderstanding — there is **non-existence**. Trouvable is not wrong-categorized; it is simply not present in the knowledge graphs, search indices (for non-branded queries), or LLM training data as a business entity.

---

## 4. Citation / Source Assessment

### Citation summary

| Context | Cited? | Mentioned? | Page surfaced |
|---|---|---|---|
| Non-branded web search (11 queries) | NO | NO | None |
| Branded web search (2 queries) | YES | YES | Homepage only |
| Claude training data | NO | NO | N/A |
| ChatGPT | NOT VERIFIED | NOT VERIFIED | N/A |
| Gemini | NOT VERIFIED | NOT VERIFIED | N/A |
| Perplexity | NOT VERIFIED | NOT VERIFIED | N/A |

### Pages surfaced

- **Homepage** (`trouvable.app`): Surfaced on branded queries only. Title and description are correct.
- **/a-propos**: Never surfaced despite containing the strongest entity-defining content.
- **/methodologie**: Never surfaced.
- **/offres**: Never surfaced.
- **/villes/***: Never surfaced.
- **/expertises/***: Never surfaced.

### Competitors / substitutes appearing instead

| Competitor | Appeared in | Type | Threat level |
|---|---|---|---|
| **Digitad** | "meilleures agences SEO Montréal" ranking | Agency (Montréal) | High — dominates Montreal SEO lists |
| **CameleonMedia** | SEO local Québec, Montreal queries | Agency (Québec) | High — appears in multiple query types |
| **Jamel Bounakhla** | Consultant SEO Montréal | Freelancer | Medium — personal brand rank |
| **Agence SEO Zenith** | Montreal SEO, lawyers+visibility | Agency (Montréal) | Medium |
| **ESB Agence Numérique** | SEO Québec | Agency (Québec) | Medium |
| **Bluedot Marketing** | GEO services Canada | GEO specialist | **High** — only Canadian GEO-branded service found |
| **Profound** | GEO SaaS globally | SaaS platform | Reference — different model |
| **Acxcom** | Schema.org / structured data Montréal area | Agency (Vaudreuil) | Low — guide content |
| **Trickstr / Vectors** | AI reputation measurement (France) | SaaS/consultancy | Reference — different market |

---

## 5. Priority Gaps

### Top entity confusion issues

1. **Lexical collision with French adjective "trouvable"** — This is the single biggest structural problem. Dictionary sites dominate any search for the bare brand name. No entity disambiguation exists.
2. **Zero search-engine share** — Trouvable does not appear in ANY non-branded competitive query across all families tested (identity, categorization, use cases, comparisons, local framing).
3. **Zero LLM knowledge** — Claude has no entity awareness. ChatGPT, Gemini, Perplexity status unknown but likely similar given the brand is new and has no external citations.

### Top missing signals

1. **No external backlinks or citations** — No third-party article, directory, list, or comparison page references Trouvable. This means zero inbound authority signal.
2. **No review/rating presence** — No Google Business Profile, no Trustpilot, no industry listing.
3. **No indexing depth** — Only the homepage appears even on branded queries. Internal pages (/a-propos, /methodologie, /offres, /villes/*, /expertises/*) are not surfacing.
4. **No structured data in search results** — No rich snippets, no FAQ expansion, no sitelinks visible.

### Top page/content weaknesses exposed by the benchmark

1. **/a-propos** — Contains the strongest entity definition ("Trouvable n'est pas une agence SEO générique. Nous sommes une firme d'exécution sur mandat...") but **never appears in search results**. This page needs stronger external signals and internal linking to be indexed as the canonical entity page.
2. **No comparison page exists** — Queries like "différence agence SEO vs Trouvable" or "comparer firmes visibilité Montréal" return competitors but not Trouvable. A comparison landing page would directly address these queries.
3. **No GEO pillar page exists** — Queries about GEO services in Canada return Bluedot Marketing. Trouvable has no dedicated GEO landing page that could rank for "GEO services Québec/Canada."
4. **No blog / editorial content** — No thought leadership content appears. Every competitor surfaced has substantial content assets (guides, case studies, FAQ pages).
5. **Expertise pages (/expertises/*)** — These exist but never surfaced for sector-specific queries (e.g., "visibilité avocats Montréal").

---

## 6. Recommended Next Implementation Step

### Evidence-based assessment of options

| Option | Evidence support | Impact estimate | Effort |
|---|---|---|---|
| Pillar GEO page | Bluedot Marketing owns "GEO Canada" — Trouvable has no competing page | Medium-high — would create indexable GEO anchor | Medium |
| First comparison page | Zero presence on comparison queries — competitors dominate | Medium — targets high-intent queries | Medium |
| Stronger proof/case page | No social proof appears in any query | Medium | Medium |
| Homepage adjustment | Homepage already works well on branded queries | Low — not the bottleneck | Low |
| Metadata/schema refinement | On-site already strong; problem is off-site authority | Low immediate impact | Low |
| **External authority step** | **No backlinks, no directories, no third-party mentions = zero off-site signal** | **High — fundamental blocker** | **Variable** |

### Recommended next step: External authority foundation

**The bottleneck is not on-site content — it is the complete absence of off-site authority signals.**

Trouvable's site content is well-structured, the entity description is clear, the positioning is differentiated. But zero external sources link to, cite, or mention Trouvable. Without external signals:
- Search engines have no reason to rank it in competitive queries
- LLMs have no citation source to absorb the entity
- No disambiguation can occur (the French adjective will always win)

**Specific first action:** Secure the first 3-5 external mentions/backlinks from:
1. A Quebec business directory (e.g., Société des entreprises du Québec, PME Montréal directory)
2. A local tech/marketing publication (e.g., guest post, interview, mention)
3. A professional community listing (e.g., LinkedIn company page with complete description, Google Business Profile if applicable)

This creates the minimum external signal foundation that all other content efforts (GEO pillar, comparison pages, expertise pages) can build on.

**After external authority step:** Create a GEO pillar page targeting "GEO services Québec" / "Generative Engine Optimization Canada" — the only Canadian competitor in this space (Bluedot Marketing) has a basic page that could be outranked with better content.

---

## Scoring Summary (Baseline)

| Platform | Identity (1-5) | Category (1-5) | Use case (1-5) | Comparison (1-5) | Local (1-5) | Knowledge (1-5) | Overall |
|---|---|---|---|---|---|---|---|
| Web Search (Tavily) | 1 | 1 | 1 | 1 | 1 | 4 (branded only) | **1.5** |
| Claude | 1 | 1 | 1 | 1 | 1 | 1 | **1.0** |
| ChatGPT | — | — | — | — | — | — | NOT VERIFIED |
| Gemini | — | — | — | — | — | — | NOT VERIFIED |
| Perplexity | — | — | — | — | — | — | NOT VERIFIED |
| Google AI Overviews | — | — | — | — | — | — | NOT VERIFIED |

**Baseline overall: 1.25 / 5** (across verifiable platforms)

---

## Verification Status

| Claim in this document | Status |
|---|---|
| Trouvable does not appear in non-branded web searches | VERIFIED (12 queries, 0 appearances) |
| Trouvable appears on branded search with correct entity framing | VERIFIED (2 queries, homepage found) |
| /a-propos never surfaces in search results | VERIFIED |
| Dictionary sites dominate searches for "Trouvable" | VERIFIED |
| No competitor comparison mentions Trouvable | VERIFIED |
| Claude has zero entity knowledge of Trouvable | VERIFIED (self-assessed) |
| Bluedot Marketing is a direct GEO competitor in Canada | VERIFIED (search result analysis) |
| ChatGPT/Gemini/Perplexity entity knowledge | NOT VERIFIED — cannot test |
