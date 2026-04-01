# Trouvable — Canonical Entity Brief

> Version: 1.0 — 2026-04-01
> Status: DRAFT — pending operator approval before implementation
> Purpose: Single source of truth for all machine-readable and human-facing Trouvable brand entity definitions.

---

## 1. Canonical Identity

| Field | Value | Source |
|---|---|---|
| **Legal name** | Trouvable | VERIFIED — consistent across all site surfaces |
| **Type** | ProfessionalService (schema.org) | RECOMMENDED — upgrade from generic Organization |
| **Category** | Firme d'exécution en visibilité organique | VERIFIED — used in site copy and JSON-LD |
| **Language** | fr-CA (Français canadien) | VERIFIED — `<html lang="fr">`, OG locale `fr_CA` |
| **URL** | https://www.trouvable.app | VERIFIED — lib/site-config.js |
| **Contact email** | contact.marchadidi@gmail.com | VERIFIED — lib/site-contact.js |
| **Contact phone** | 514-715-2421 / +15147152421 | VERIFIED — lib/site-contact.js |

---

## 2. Canonical Descriptions

### Short description (≤160 chars, for meta/OG/schema)
> Firme d'exécution québécoise : visibilité organique Google et cohérence de votre entreprise dans les réponses des grands modèles conversationnels.

### Long description (for llms.txt / about / schema)
> Trouvable est une firme d'exécution basée au Québec, spécialisée en visibilité organique sur Google et en cohérence de la présence des entreprises dans les réponses des grands modèles conversationnels (GEO). Le travail est livré sur mandat : cartographie stratégique, implémentation encadrée et pilotage continu. Vous déléguez, l'équipe exécute.

### English short description (if needed for cross-language contexts)
> Quebec-based execution firm specializing in organic Google visibility and business presence coherence in AI conversational responses (GEO).

---

## 3. What Trouvable Sells

| Offering | Canonical name | Description |
|---|---|---|
| Audit / diagnostic | Cartographie stratégique | Diagnostic croisé de la visibilité Google et de la crédibilité dans les réponses IA. Plan d'action priorisé. |
| Execution engagement | Mandat d'implémentation | Corrections et enrichissements techniques sur un périmètre défini. Travail exécuté par l'équipe. |
| Ongoing monitoring | Pilotage continu | Suivi, mesure et ajustements continus de la visibilité organique. |

**Pricing model:** Engagement-based mandates (mandat), not subscriptions or SaaS pricing.

---

## 4. Who Trouvable Serves

### Target client profile
- Dirigeants de firmes de services professionnels
- Cabinets juridiques, financiers, de santé, d'ingénierie
- Entreprises locales dont la confiance et la réputation locale sont déterminantes

### Sector expertise (VERIFIED from geo-architecture data)
- Restaurants
- Immobilier
- Santé & Cliniques
- Avocats & Notaires
- Services Résidentiels

---

## 5. Markets / Regions Served

| Level | Value | Status |
|---|---|---|
| Primary region | Québec, Canada | VERIFIED |
| Primary metro | Grand Montréal | VERIFIED |
| Named cities | Montréal, Laval, Québec, Longueuil, Brossard | VERIFIED — from llms.txt and geo-architecture |
| Country | Canada | VERIFIED |

**Note:** Trouvable intervenes across Quebec, not only Montréal. Geographic claims should say "Grand Montréal et Québec" — not "Canada-wide" or "nationwide".

---

## 6. Approved Schema Fields

These fields may be populated in Organization/ProfessionalService JSON-LD:

| Field | Value | Authority |
|---|---|---|
| `@type` | ProfessionalService | RECOMMENDED |
| `@id` | https://www.trouvable.app#organization | VERIFIED |
| `name` | Trouvable | VERIFIED |
| `url` | https://www.trouvable.app | VERIFIED |
| `description` | (use canonical short description above) | VERIFIED |
| `areaServed` | [Montréal, Laval, Québec, Longueuil, Brossard] as City types | VERIFIED |
| `knowsAbout` | SEO local, visibilité organique Google, GEO (Generative Engine Optimization), données structurées, Google Business Profile, réponses IA | INFERRED from site content — needs operator confirmation |
| `contactPoint` | phone + email from lib/site-contact.js | VERIFIED |
| `logo` | https://www.trouvable.app/logos/trouvable_logo_blanc1.png | VERIFIED — file exists |
| `address.addressRegion` | Québec | VERIFIED |
| `address.addressCountry` | CA | VERIFIED |

---

## 7. Forbidden Claims (unless explicitly verified)

| Claim type | Rule |
|---|---|
| **"Leader" / "#1" / "meilleur"** | ❌ FORBIDDEN unless proven by independent source |
| **Awards / certifications** | ❌ FORBIDDEN unless verified award exists |
| **Client count / revenue** | ❌ FORBIDDEN — confidential |
| **"Trusted by X companies"** | ❌ FORBIDDEN unless real count available |
| **sameAs social profiles** | ❌ FORBIDDEN until real profiles confirmed |
| **foundingDate** | ❌ FORBIDDEN until operator confirms exact date |
| **founder / employee data** | ❌ FORBIDDEN until operator explicitly approves |
| **Google Partner / certified** | ❌ FORBIDDEN unless certification exists |
| **Guaranteed results / rankings** | ❌ FORBIDDEN — impossible to guarantee |
| **Physical address** | ❌ FORBIDDEN until a public business address is confirmed |

---

## 8. Approved Semantic Associations

These concepts may be associated with Trouvable in content and schema:

### Core (VERIFIED — directly offered)
- Visibilité organique Google
- SEO local
- Référencement local
- GEO (Generative Engine Optimization)
- Cohérence des réponses IA
- Données structurées / Schema.org
- Google Business Profile optimization
- Mandats d'exécution

### Adjacent (INFERRED — discussed in methodology/content)
- Visibilité dans les systèmes conversationnels
- Signaux publics d'entreprise
- Crédibilité dans les réponses IA
- Mesure de la présence IA (Share of Model)
- Audit technique SEO

### Forbidden associations
- ❌ SaaS / software product
- ❌ Social media management
- ❌ Paid advertising / PPC / Google Ads
- ❌ Web development / design agency
- ❌ Content marketing agency
- ❌ PR / media relations firm

---

## 9. sameAs Policy

**Current state:** No sameAs in Organization schema. This is CORRECT if no verified social/directory profiles exist.

**Rules:**
- Only add sameAs URLs that point to real, active, verified profiles owned by Trouvable
- Candidates for future sameAs: LinkedIn company page, Google Business Profile, industry directories
- Each sameAs URL must be manually verified before addition
- Do NOT add placeholder or aspirational sameAs values

---

## 10. What Trouvable Does NOT Claim

These explicit negations protect against entity confusion:

1. Trouvable is **not** a SaaS product or software company
2. Trouvable is **not** a generic SEO agency
3. Trouvable is **not** a web development agency
4. Trouvable does **not** sell subscriptions or self-serve tools
5. Trouvable does **not** manage paid advertising campaigns
6. Trouvable does **not** guarantee specific rankings or positions
7. Trouvable does **not** operate nationally (Canada-wide) — focus is Québec
8. Trouvable does **not** publish vanity metrics or unverifiable results

---

## 11. Implementation Guidance

When implementing this entity brief in code:

1. **GeoSeoInjector** (`components/GeoSeoInjector.jsx`) — upgrade `buildOrganizationSchema()` to use approved fields
2. **llms.txt** (`public/llms.txt`) — ensure content matches canonical descriptions
3. **Metadata** (layout.jsx files) — ensure title/description patterns use canonical phrasing
4. **Footer** (`components/SiteFooter.jsx`) — verify description matches canonical short description
5. **OG image** (`app/opengraph-image.jsx`) — verify subtitle uses canonical category

All implementations must use data from this brief as the source of truth. Do not invent additional facts.
