# Bloc 1 — SEO/GEO Foundation Audit

> Audit date: 2026-04-01
> Scope: Trouvable brand entity signals across public site code, metadata, structured data, and crawl policy.
> Method: Repository inspection + code-level analysis. Runtime-only observations marked where applicable.

---

## 1. Current Public Entity Read

### 1.1 Homepage (`app/page.jsx` + `components/TrouvablePremiumPreview.jsx`)

| Signal | Value | Status |
|---|---|---|
| `<title>` | Trouvable — Firme de visibilité Google et réponses IA | ✅ VERIFIED — service firm framing |
| `meta description` | Mandats d'exécution : visibilité organique locale sur Google et crédibilité de votre entreprise dans les réponses des grands modèles. Vous déléguez, nous exécutons. | ✅ VERIFIED — execution firm, not SaaS |
| Hero headline | "Votre visibilité, prise en charge." | ✅ VERIFIED — operated-service framing |
| Hero subtext | "Votre visibilité organique locale, la cohérence de votre signal face aux moteurs de recherche et aux systèmes conversationnels, des livrables vérifiables. Vous déléguez, nous exécutons." | ✅ VERIFIED |
| CTA buttons | "Demander une cartographie" / "Voir les mandats" | ✅ VERIFIED — mandate language, not software trial |
| JSON-LD Organization | `@type: Organization`, name: Trouvable, description: firm framing | ✅ VERIFIED |
| JSON-LD FAQPage | 3 FAQs about GEO/SEO distinction, timelines | ✅ VERIFIED |
| Open Graph | title/description consistent with metadata | ✅ VERIFIED |
| Impression: service firm vs software | **Service firm** — consistent throughout | ✅ CORRECT |

### 1.2 À propos (`app/a-propos/page.jsx`)

| Signal | Value | Status |
|---|---|---|
| `<title>` | À propos \| Trouvable | ✅ VERIFIED |
| `meta description` | Trouvable est une firme d'exécution spécialisée en visibilité Google et réponses IA. Principes clairs, travail fait pour vous, résultats mesurables. | ✅ VERIFIED |
| H1 | "La firme derrière votre visibilité." | ✅ VERIFIED — firm language |
| Key statement | "Trouvable n'est pas une agence SEO générique. Nous sommes une firme d'exécution sur mandat" | ✅ VERIFIED — explicit differentiation |
| Positioning card | "Firme d'exécution sur mandat", "Interlocuteur unique par dossier", "Livrables vérifiables", "Cadre de mesure transparent" | ✅ VERIFIED |
| "Ce que nous faisons" vs "Ce que nous ne faisons pas" | Present and clear | ✅ VERIFIED |
| JSON-LD | ⚠️ NONE — no structured data on this page | MISSING |
| Impression | **Service firm** — strongest brand page for entity definition | ✅ CORRECT |

### 1.3 Offres (`app/offres/page.jsx`)

| Signal | Value | Status |
|---|---|---|
| `<title>` | Mandats de visibilité \| Trouvable | ✅ VERIFIED |
| `meta description` | Trois mandats : cartographie stratégique, implémentation encadrée, pilotage continu. Visibilité Google et réponses IA, exécutée par notre équipe. | ✅ VERIFIED |
| Structure | 3 mandates: Cartographie stratégique, Mandat d'implémentation, Pilotage continu | ✅ VERIFIED |
| Target audience | "Dirigeants de firmes de services professionnels — cabinets juridiques, financiers, de santé, d'ingénierie" | ✅ VERIFIED |
| JSON-LD | ⚠️ NONE | MISSING |
| Impression | **Service firm** — mandate/engagement language throughout | ✅ CORRECT |

### 1.4 Méthodologie (`app/methodologie/page.jsx`)

| Signal | Value | Status |
|---|---|---|
| `<title>` | Méthodologie \| Trouvable | ✅ VERIFIED |
| `meta description` | Protocole en 4 étapes : audit de visibilité, mise aux normes, enrichissement IA et validation continue. | ✅ VERIFIED |
| Steps | 4-step methodology: Audit, Mise aux normes, Enrichissement IA, Boucle de validation | ✅ VERIFIED |
| JSON-LD | ⚠️ NONE | MISSING |
| Impression | **Service firm** — execution-focused methodology | ✅ CORRECT |

### 1.5 Notre mesure (`app/notre-mesure/page.jsx`)

| Signal | Value | Status |
|---|---|---|
| `<title>` | Notre mesure \| Trouvable | ✅ VERIFIED |
| `meta description` | Cadre de mesure en 3 couches : signaux techniques, présence dans les réponses IA et indicateurs d'affaires. | ✅ VERIFIED |
| Framework | 3 layers: Signaux (foundation), Présence (ranking), Business (outcomes) | ✅ VERIFIED |
| JSON-LD | ⚠️ NONE | MISSING |
| Impression | **Service firm** — measurement framework, not product dashboard | ✅ CORRECT |

### 1.6 Contact (`app/contact/page.jsx`)

| Signal | Value | Status |
|---|---|---|
| `<title>` | Contact \| Trouvable | ✅ VERIFIED |
| `meta description` | Planifiez un appel découverte avec Trouvable. | ✅ VERIFIED |
| Contact info | Email: contact.marchadidi@gmail.com, Phone: 514-715-2421 | ✅ VERIFIED (from lib/site-contact.js) |
| Process steps | Analyse de repérage → Appel découverte → Plan d'action | ✅ VERIFIED |
| JSON-LD | ⚠️ NONE | MISSING |
| ⚠️ Email is gmail | `contact.marchadidi@gmail.com` — not a branded domain email | NOTED |

### 1.7 Footer (`components/SiteFooter.jsx`)

| Signal | Value | Status |
|---|---|---|
| Description | "Firme québécoise : mandats de visibilité organique Google et de cohérence dans les réponses IA — exécution faite pour vous." | ✅ VERIFIED — consistent |
| Location | "Interventions sur le Grand Montréal et Québec" | ✅ VERIFIED |
| Contact | Email + phone from lib/site-contact.js | ✅ VERIFIED |
| Navigation | Mandats, Expertises, Marchés locaux, Entreprise sections | ✅ VERIFIED |
| Status indicator | "Accompagnement en cours" with green pulse | ✅ VERIFIED |

### 1.8 Navbar (`components/Navbar.jsx`)

| Signal | Value | Status |
|---|---|---|
| Brand name | "Trouvable" with logo | ✅ VERIFIED |
| Navigation | Mandats, Méthodologie, Cas clients, La Firme | ✅ VERIFIED |
| CTA | "Planifier un appel" | ✅ VERIFIED — service framing |

### 1.9 Overall Consistency Assessment

**Strengths:**
- ✅ Trouvable is consistently described as a "firme d'exécution" across all surfaces
- ✅ Language consistently uses "mandat" (mandate/engagement), not "subscription" or "plan"
- ✅ The "Vous déléguez, nous exécutons" tagline is consistently used
- ✅ No SaaS/software language anywhere in public pages
- ✅ Target client profile is consistent: "firmes de services professionnels"
- ✅ Geographic focus is consistent: Grand Montréal / Québec

**Gaps:**
- ⚠️ Minor variation: homepage says "firme d'exécution", footer says "firme québécoise", à-propos says "firme d'exécution sur mandat" — not a problem, but slight inconsistency
- ⚠️ The GEO framing varies between "cohérence dans les réponses IA" and "crédibilité dans les réponses des grands modèles conversationnels" — both correct, but the canonical phrasing should be established
- ⚠️ No explicit mention of "ProfessionalService" schema type for Trouvable itself (uses generic Organization)

---

## 2. Current Machine-Readable Entity State

### 2.1 JSON-LD Structured Data (GeoSeoInjector)

**Homepage Organization schema:**
```json
{
  "@type": "Organization",
  "@id": "https://www.trouvable.app#organization",
  "name": "Trouvable",
  "url": "https://www.trouvable.app",
  "description": "Firme d'exécution : visibilité organique Google et cohérence de votre entreprise dans les réponses des grands modèles conversationnels. Mandats de cartographie, d'implémentation et de pilotage continu."
}
```

**Assessment:**

| Field | Status | Notes |
|---|---|---|
| `@type` | ⚠️ IMPROVABLE | `Organization` is correct but `ProfessionalService` is more specific and accurate for a service firm |
| `@id` | ✅ CORRECT | Canonical ID with fragment identifier |
| `name` | ✅ CORRECT | |
| `url` | ✅ CORRECT | |
| `description` | ✅ CORRECT | Truthful, service-firm framing |
| `areaServed` | ❌ MISSING | Should specify Quebec/Montréal |
| `knowsAbout` | ❌ MISSING | Should list core competency topics |
| `sameAs` | ❌ MISSING (but correctly absent if no verified profiles exist) | Do NOT add until real profiles exist |
| `address` | ❌ MISSING | Prop is available but not passed from page.jsx |
| `logo` | ❌ MISSING | Logo exists at `/logos/trouvable_logo_blanc1.png` |
| `contactPoint` | ❌ MISSING | Phone/email exist in site-contact.js but not in schema |
| `foundingDate` | ❌ MISSING | Only add if verified |
| `founder` | ❌ MISSING | Only add if verified/approved |

**Other pages:** No JSON-LD beyond homepage, expertise pages, and ville pages. The `/a-propos`, `/offres`, `/methodologie`, `/notre-mesure`, and `/contact` pages have NO structured data.

### 2.2 Metadata / Canonical State

| Page | Title | Description | Canonical | OG |
|---|---|---|---|---|
| Homepage | ✅ | ✅ | ✅ (via metadataBase) | ✅ |
| /a-propos | ✅ | ✅ | ⚠️ Inherits from root | ⚠️ Inherits |
| /offres | ✅ | ✅ | ⚠️ Inherits | ⚠️ Inherits |
| /methodologie | ✅ | ✅ | ⚠️ Inherits | ⚠️ Inherits |
| /notre-mesure | ✅ | ✅ | ⚠️ Inherits | ⚠️ Inherits |
| /contact | ✅ | ✅ | ⚠️ Inherits | ⚠️ Inherits |

Note: `metadataBase` is set at root layout, so canonical URLs inherit correctly in Next.js App Router. This is acceptable but page-level canonical alternates would be more explicit.

### 2.3 Robots / Sitemap / llms.txt

**robots.js:**
```js
{
  rules: { userAgent: '*', allow: '/', disallow: ['/admin/', '/portal/'] },
  host: SITE_URL,
  sitemap: `${SITE_URL}/sitemap.xml`
}
```

| Aspect | Status | Notes |
|---|---|---|
| Allows all bots | ✅ CORRECT | `*` with `allow: /` |
| Blocks admin/portal | ✅ CORRECT | Private areas blocked |
| Sitemap reference | ✅ CORRECT | Points to sitemap.xml |
| GPTBot policy | ⚠️ IMPLICIT | Not explicitly allowed — the wildcard allows it, but explicit `User-agent: GPTBot / Allow: /` would be clearer for GEO |
| ClaudeBot policy | ⚠️ IMPLICIT | Same as above |
| OAI-SearchBot policy | ⚠️ IMPLICIT | Same |
| PerplexityBot policy | ⚠️ IMPLICIT | Same |

**Recommendation:** Explicit AI bot rules are optional since the wildcard `allow: /` already permits them. However, adding explicit `User-agent` blocks for major AI crawlers with `Allow: /` makes the intent unambiguous and is recommended for GEO clarity.

**sitemap.js:**
- ✅ Includes all static pages (homepage, offres, methodologie, notre-mesure, a-propos, contact, etudes-de-cas, dossier-type)
- ✅ Includes ville pages and expertise pages dynamically
- ✅ Includes published client pages
- ✅ Revalidates hourly
- ✅ Correct priority assignments (homepage 1.0, static pages 0.85, villes/expertises 0.9)

**llms.txt:**
- ✅ Present at `/public/llms.txt`
- ✅ Correct format: H1, blockquote description, H2 sections
- ✅ Content is truthful and consistent with site messaging
- ⚠️ No `llms-full.txt` — optional, but could provide deeper context
- ⚠️ `contact.marchadidi@gmail.com` appears here — matches site-contact.js

### 2.4 Risks, Gaps, and Contradictions

| Risk | Severity | Details |
|---|---|---|
| Organization type too generic | Medium | `@type: Organization` should be `ProfessionalService` for a service firm |
| No areaServed in Organization schema | Medium | Google cannot determine geographic scope from schema alone |
| No structured data on /a-propos | Medium | The page that best defines Trouvable as an entity has no JSON-LD |
| No knowsAbout | Low | Would help LLMs understand Trouvable's domain expertise |
| No sameAs | Low-None | Correctly absent IF no verified social profiles exist — do NOT fabricate |
| No logo in schema | Low | Logo file exists but not referenced in JSON-LD |
| No contactPoint in schema | Low | Contact info exists in site-contact.js but not in Organization schema |
| Gmail contact email | Low | `contact.marchadidi@gmail.com` is not a branded domain — not a blocking issue but noted |
| No explicit AI bot rules | Low | Wildcard already allows, but explicit rules improve GEO signal |

---

## 5. Crawl/Access Policy Audit

### Essential (already correct)
- ✅ `robots.txt` allows all bots, blocks `/admin/` and `/portal/`
- ✅ `sitemap.xml` references all public pages with correct priorities
- ✅ `llms.txt` is present, truthful, and well-structured
- ✅ No `noindex` on public pages
- ✅ Canonical URL set via `metadataBase`

### Optional but recommended
- ⚠️ Add explicit `User-agent` blocks for GPTBot, ChatGPT-User, Google-Extended, ClaudeBot, PerplexityBot with `Allow: /` — makes GEO intent unambiguous
- ⚠️ Consider adding `llms-full.txt` with deeper service descriptions and methodology context

### What needs change now
- 🔧 Add `areaServed` to Organization JSON-LD
- 🔧 Add `knowsAbout` to Organization JSON-LD
- 🔧 Upgrade `@type` from `Organization` to `ProfessionalService`
- 🔧 Add explicit AI bot rules to robots.js
- 🔧 Add `contactPoint` and `logo` to Organization schema (only with verified data)

---

## 6. Priority Implementation Recommendation

### Single best next step: Canonical Entity / Schema Cleanup

**Why this comes before everything else:**
1. The Organization JSON-LD on the homepage is the primary machine-readable entity signal for Trouvable. It's the single most extractable data point for Google and LLMs.
2. Upgrading `@type` to `ProfessionalService`, adding `areaServed`, `knowsAbout`, `contactPoint`, and `logo` are small, safe changes with high signal value.
3. These changes are truthful (all data already exists in the codebase), zero-risk (no new claims), and immediately verifiable.
4. The robots.js improvement (explicit AI bot rules) is a 5-line change that clarifies GEO intent.

**What NOT to do yet:**
- Do NOT add structured data to /a-propos, /offres, etc. until the entity brief is approved as canonical source of truth
- Do NOT add sameAs unless verified social profiles are confirmed
- Do NOT add foundingDate or founder unless explicitly approved
- Do NOT create new content pages

### Files involved in implementation:
1. `components/GeoSeoInjector.jsx` — upgrade `buildOrganizationSchema()` with `ProfessionalService`, `areaServed`, `knowsAbout`, `contactPoint`, `logo`
2. `app/page.jsx` — pass additional props to GeoSeoInjector
3. `app/robots.js` — add explicit AI bot rules
4. `public/llms.txt` — minor update to add `## Ce que Trouvable n'est pas` section for GEO clarity
