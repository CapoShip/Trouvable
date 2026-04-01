# LinkedIn Company Page — Audit & Optimization Package

> Date: 2026-04-01
> Context: First practical external-authority signal for Trouvable
> Source: Canonical entity brief v1.0, GEO baseline benchmark, live site inspection
> Status: Ready for manual application on LinkedIn

---

## 1. Current LinkedIn Audit

### What is publicly visible (without login)

| Element | Observed | Status |
|---|---|---|
| Page URL | `https://www.linkedin.com/company/trouvable` | VERIFIED — page exists |
| Company name | "Trouvable" | VERIFIED — visible in page title |
| Logo | Present (blue/white brand logo) | VERIFIED — thumbnail visible |
| Banner image | NOT VERIFIED — login-gated |
| Tagline | NOT VERIFIED — login-gated |
| About / Description | NOT VERIFIED — login-gated |
| Industry / Category | NOT VERIFIED — login-gated |
| Company size | NOT VERIFIED — login-gated |
| Location | NOT VERIFIED — login-gated |
| Website URL | NOT VERIFIED — login-gated |
| Specialties | NOT VERIFIED — login-gated |
| Posts / Activity | NOT VERIFIED — login-gated |
| Followers count | NOT VERIFIED — login-gated |

**Assessment:** LinkedIn gates nearly all company page content behind authentication. Only the page existence, name, and logo thumbnail are confirmed. Full audit requires manual operator review.

### What is strong

- The page exists and is claimable at the correct vanity URL (`/company/trouvable`)
- Logo is present and appears to match the brand
- The `sameAs` in Trouvable's JSON-LD already references this URL (GeoSeoInjector line 144)

### What is weak / likely weak

- **Entity brief alignment is unverified** — tagline, about, industry, and specialties cannot be confirmed from outside
- **No LinkedIn link exists on the site** — footer, /a-propos, and navbar have zero outbound links to LinkedIn
- **No content/post activity is visible** — the page likely reads as a placeholder rather than an active authority signal
- **Lexical collision risk** — LinkedIn does not distinguish "Trouvable" the company from "trouvable" the French word; a well-written About section is essential for disambiguation

### What is missing (HIGH CONFIDENCE based on typical new company pages)

- INFERRED: Full company description matching canonical entity brief
- INFERRED: Specialties / services list
- INFERRED: CTA or content strategy
- INFERRED: Banner image
- INFERRED: Regular posting cadence

---

## 2. Alignment Gaps

### LinkedIn vs Site vs Entity Brief — Expected Mismatches

| Element | Site (trouvable.app) | Entity Brief | LinkedIn (likely) | Gap |
|---|---|---|---|---|
| **Tagline** | "Nous opérons votre visibilité" (homepage H1) | "Firme d'exécution québécoise : visibilité organique Google et cohérence [...] modèles conversationnels" | Unknown — likely generic or empty | HIGH — must align |
| **Description** | Strong /a-propos copy + llms.txt | Full canonical short + long descriptions available | Unknown — likely thin or mismatched | HIGH — must align |
| **Category** | "Firme d'exécution en visibilité organique" | "ProfessionalService" / "Firme d'exécution en visibilité organique" | Unknown — likely "Marketing Services" or similar | MEDIUM — should be as specific as LinkedIn allows |
| **Location** | "Grand Montréal et Québec" | "Québec, Canada" / "Grand Montréal" | Unknown | MEDIUM |
| **Services** | 3 mandates clearly defined | Cartographie, Implémentation, Pilotage | Unknown — likely incomplete | HIGH |
| **What it is NOT** | Explicit section on /a-propos | Explicit section in entity brief | Almost certainly absent | LOW priority for LinkedIn but useful in About |
| **Website URL** | `https://www.trouvable.app` | `https://www.trouvable.app` | Unknown | Should be verified as exact match |

### Key alignment principle

LinkedIn wording should echo — not duplicate — the canonical entity brief. The goal is that Google, LLMs, and humans encountering both surfaces recognize the same entity with the same positioning.

---

## 3. LinkedIn Optimization Package — Ready to Paste

### 3.1 Company Tagline (max 120 characters)

**Recommended:**

> Firme d'exécution | Visibilité organique Google et réponses IA | Québec

**Rationale:** Entity type + core service + geographic anchor in one scannable line. Avoids "agence", avoids "SaaS", avoids fluff.

**Alternative (English-bilingual context):**

> Execution firm | Google visibility & AI answer coherence | Québec, Canada

### 3.2 Short About (~2 lines, for preview/snippet)

> Trouvable est une firme d'exécution basée au Québec, spécialisée en visibilité organique sur Google et en cohérence de la présence des entreprises dans les réponses des grands modèles conversationnels (GEO). L'équipe exécute sur mandat — vous déléguez, nous livrons.

### 3.3 Full About (for the complete description field)

> **Trouvable** est une firme d'exécution québécoise spécialisée en visibilité organique sur Google et en cohérence de la présence des entreprises dans les réponses des grands modèles conversationnels (Generative Engine Optimization — GEO).
>
> Nous ne vendons pas de logiciel. Nous ne livrons pas de recommandations sans action. Nous exécutons le travail, sur mandat, avec des livrables documentés et un interlocuteur unique par dossier.
>
> **Nos mandats :**
> • Cartographie stratégique — diagnostic croisé de la visibilité Google et de la crédibilité dans les réponses IA. Plan d'action priorisé.
> • Mandat d'implémentation — corrections et enrichissements techniques sur un périmètre défini. L'équipe exécute, vous validez.
> • Pilotage continu — suivi, mesure et ajustements continus de la visibilité organique.
>
> **Secteurs accompagnés :**
> Restaurants, immobilier, santé et cliniques, avocats et notaires, services résidentiels.
>
> **Marchés actifs :**
> Grand Montréal, Laval, Québec, Longueuil, Brossard — Québec, Canada.
>
> **Ce que Trouvable n'est pas :**
> Pas un SaaS. Pas une agence SEO générique. Pas une agence web. Pas de publicité payante. Pas de vanity metrics.
>
> 🔗 https://www.trouvable.app
> 📧 contact@trouvable.app
> 📞 514-715-2421

### 3.4 Specialties / Services (for the LinkedIn specialties field)

Enter each as a separate specialty tag:

1. Visibilité organique Google
2. SEO local
3. Référencement local
4. GEO (Generative Engine Optimization)
5. Données structurées
6. Google Business Profile
7. Cohérence des réponses IA
8. Mandats d'exécution
9. Pilotage continu de visibilité

### 3.5 Category / Industry Framing

| LinkedIn field | Recommended value |
|---|---|
| Industry | **Business Consulting and Services** (closest LinkedIn-native category to "execution firm") |
| Company size | **2–10 employees** (or accurate count — do not inflate) |
| Company type | **Privately Held** |
| Founded | Only if operator confirms the exact year — do NOT guess |

**Note:** LinkedIn does not have a "ProfessionalService" or "SEO firm" industry. "Business Consulting and Services" is the closest honest match. Avoid "Marketing Services" — it implies agency, not execution firm.

### 3.6 Location Wording

| Field | Value |
|---|---|
| Headquarters | **Montréal, Québec, Canada** |
| Location description | Leave as-is (LinkedIn auto-formats from HQ) |

### 3.7 Website URL

| Field | Value |
|---|---|
| Website | `https://www.trouvable.app` |

Must match exactly. Not `trouvable.app` without `www.`, not `https://trouvable.app`. Consistent with `SITE_URL` in repo and canonical entity brief.

### 3.8 Call to Action

| LinkedIn CTA button | Setting |
|---|---|
| CTA type | **Visit website** |
| CTA URL | `https://www.trouvable.app/contact` |

**Rationale:** "Visit website" + link to /contact keeps the conversion path simple and avoids misleading CTAs like "Sign up" (which implies SaaS).

### 3.9 "What Trouvable Is Not" — Position Guard

This is already integrated into the Full About above. On LinkedIn, it serves as a disambiguation signal for both humans skimming the page and LLMs crawling LinkedIn data:

> **Ce que Trouvable n'est pas :**
> Pas un SaaS. Pas une agence SEO générique. Pas une agence web. Pas de publicité payante. Pas de vanity metrics.

---

## 4. Starter Content Pack

### 4.1 First 3 Post Ideas

**Post 1: Entity Declaration (publish first — pin as featured)**

> **Trouvable, c'est quoi exactement ?**
>
> Pas une agence. Pas un logiciel.
>
> Trouvable est une firme d'exécution québécoise. Quand un dirigeant veut que son entreprise soit correctement visible sur Google et correctement représentée dans les réponses des systèmes conversationnels (ChatGPT, Gemini, Perplexity…), nous exécutons le travail sur mandat.
>
> Cartographie stratégique → Implémentation encadrée → Pilotage continu.
>
> Un interlocuteur unique. Des livrables documentés. Pas de rapport automatisé.
>
> Nous accompagnons des firmes de services professionnels au Québec : cabinets juridiques, cliniques, restaurateurs, courtiers, services résidentiels.
>
> 🔗 trouvable.app

**Post 2: GEO Problem Awareness**

> **Votre entreprise existe-t-elle dans les réponses de ChatGPT ?**
>
> Posez la question à ChatGPT, Gemini ou Perplexity : « Quels sont les meilleurs [votre secteur] à [votre ville] ? »
>
> Si vous n'apparaissez pas, ce n'est pas un bug — c'est un signal manquant.
>
> Les moteurs conversationnels construisent leurs réponses à partir de signaux publics structurés : votre fiche Google, votre site, vos données structurées, les mentions cohérentes de votre entreprise à travers le web.
>
> Chez Trouvable, c'est exactement ce que nous auditons et corrigeons.
> On appelle ça le GEO — Generative Engine Optimization.
>
> Ce n'est pas du SEO classique. C'est la couche au-dessus.

**Post 3: Anti-Pattern / Differentiation**

> **On nous demande souvent : « Vous êtes une agence SEO ? »**
>
> Non.
>
> Une agence SEO vous remet un rapport de recommandations. Vous le transmettez à votre développeur. Trois mois plus tard, la moitié est appliquée.
>
> Chez Trouvable, l'équipe exécute le travail elle-même, sur un mandat défini, avec un interlocuteur unique et des livrables vérifiables.
>
> C'est la différence entre déléguer et sous-traiter la gestion du sous-traitant.
>
> Si votre priorité est que le travail soit fait — pas juste documenté — c'est pour ça que Trouvable existe.

### 4.2 Post Hooks / Titles

1. **« Trouvable, c'est quoi exactement ? »** — entity declaration, disambiguation
2. **« Votre entreprise existe-t-elle dans les réponses de ChatGPT ? »** — GEO awareness
3. **« On nous demande souvent : vous êtes une agence SEO ? »** — differentiation / anti-pattern

### 4.3 Featured / Pinned Post Recommendation

**Pin Post 1 ("Trouvable, c'est quoi exactement ?")** as the featured post.

Rationale:
- First thing a visitor sees on the company page
- Directly addresses entity confusion (the #1 problem from the GEO benchmark)
- Sets the "execution firm, not agency, not SaaS" framing immediately
- Contains all key entity signals: name, type, geography, offerings, sectors

---

## 5. Repo-Side Support Changes

### 5.1 Already correct — `sameAs` in JSON-LD

The `GeoSeoInjector.jsx` (line 144) already includes:
```json
"sameAs": ["https://www.linkedin.com/company/trouvable"]
```

This is correct and should stay. The entity brief (section 9) says sameAs should only include verified, active profiles — LinkedIn qualifies once the page is fully optimized.

### 5.2 Recommended — Add LinkedIn link in footer

**Status:** Currently missing. The footer (`components/SiteFooter.jsx`) has no social links at all.

**Recommendation:** Add a small LinkedIn icon link in the footer's bottom bar. This:
- Creates a bidirectional signal (site → LinkedIn → site)
- Is a standard professional service firm convention
- Does NOT require heavy UI changes

**Proposed location:** After the "Accompagnement en cours" indicator in the footer bottom bar.

**Implementation:** Small, optional. Only worth doing once the LinkedIn page is properly optimized (i.e., after applying this package).

### 5.3 Not recommended — changes to /a-propos

The /a-propos page is already strong and entity-consistent. Adding a LinkedIn link there would be forced and unnecessary.

### 5.4 Not recommended — changes to llms.txt

The llms.txt file does not list social profiles, which is correct. It should remain focused on entity definition.

---

## 6. Final Recommendations

### What to do manually on LinkedIn — NOW

| Priority | Action | Details |
|---|---|---|
| **P0** | Verify and update company tagline | Use: "Firme d'exécution \| Visibilité organique Google et réponses IA \| Québec" |
| **P0** | Write full About description | Use the Full About from section 3.3 — paste directly |
| **P0** | Set specialties | Add all 9 specialties from section 3.4 |
| **P0** | Verify website URL | Must be exactly `https://www.trouvable.app` |
| **P0** | Set industry | "Business Consulting and Services" |
| **P0** | Set location | Montréal, Québec, Canada |
| **P0** | Set CTA | "Visit website" → `https://www.trouvable.app/contact` |
| **P1** | Upload banner image | Should be branded, premium, dark theme consistent with site. No stock photos. |
| **P1** | Publish Post 1 | "Trouvable, c'est quoi exactement ?" — pin as featured |
| **P2** | Publish Post 2 | GEO awareness post |
| **P2** | Publish Post 3 | Differentiation post |

### What to do in the repo — AFTER LinkedIn is optimized

| Priority | Action | File |
|---|---|---|
| **P2** | Add LinkedIn icon link in footer | `components/SiteFooter.jsx` |
| **None** | No other repo changes needed | — |

### What comes next after LinkedIn

1. **Google Business Profile** — if a public business address exists, create/claim GBP as the second external authority signal
2. **Quebec business directory listing** — PME Montréal, Répertoire des entreprises du Québec, etc.
3. **GEO pillar page** — create `/geo` or `/generative-engine-optimization` targeting "GEO services Québec/Canada" (benchmark shows Bluedot Marketing owns this space)
4. **First comparison page** — addresses zero presence on comparison queries
5. **Re-run GEO benchmark** — measure impact of external signals on entity visibility

---

## Verification Status of This Document

| Claim | Status |
|---|---|
| LinkedIn page exists at /company/trouvable | VERIFIED |
| Logo is present on LinkedIn page | VERIFIED |
| LinkedIn content (tagline, about, etc.) is unknown | NOT VERIFIED — login-gated |
| sameAs already exists in repo JSON-LD | VERIFIED — GeoSeoInjector.jsx line 144 |
| No LinkedIn link in site footer | VERIFIED — SiteFooter.jsx inspected |
| Canonical descriptions used in package match entity brief | VERIFIED |
| Specialties match knowsAbout from entity brief | VERIFIED |
| "What Trouvable is not" section matches entity brief section 10 | VERIFIED |
| Contact email is contact@trouvable.app | VERIFIED — lib/site-contact.js |
| No fabricated facts in post content | VERIFIED — all claims sourced from site copy and entity brief |
