# Bloc 1 — Baseline Brand GEO Audit Prompt Set

> Version: 1.0 — 2026-04-01
> Purpose: Recurring manual/operator evaluation of Trouvable's brand presence across search and AI systems.
> Usage: Run these prompts periodically. Log observations in the template below.

---

## Observation Log Template

For each prompt executed, log these fields:

| Field | Description |
|---|---|
| **Date** | When the prompt was run |
| **Platform** | Google Search / Google AI Overviews / ChatGPT / Gemini / Perplexity / Claude |
| **Prompt** | Exact prompt used |
| **Trouvable mentioned?** | Yes / No |
| **Trouvable cited?** | Yes / No (with URL if cited) |
| **Trouvable page cited** | Which page URL was linked/cited (if any) |
| **Description accuracy** | Accurate / Partially accurate / Inaccurate / Not mentioned |
| **Entity category given** | How the system categorized Trouvable (e.g., "agence SEO", "firme", "outil", etc.) |
| **Competitors cited** | Which competitors were mentioned instead |
| **Entity confusion** | Was Trouvable confused with another entity? (describe) |
| **Closeness to target** | 1-5 scale: 1=completely wrong, 5=perfect match to entity brief |
| **Notes** | Any additional observations |

---

## Prompt Family 1: Identity

These prompts test whether systems know what Trouvable IS.

### 1.1 Direct identity
```
Qu'est-ce que Trouvable ?
```

### 1.2 English identity
```
What is Trouvable?
```

### 1.3 Entity type check
```
Trouvable est une agence ou une firme ? Quelle est la différence ?
```

### 1.4 Disambiguation
```
Trouvable : c'est un logiciel ou un service professionnel ?
```

### 1.5 Founder/team
```
Qui est derrière Trouvable ?
```

**Expected answer direction:** Trouvable is an execution firm (firme d'exécution) based in Quebec, specializing in organic Google visibility and AI answer engine coherence. It is NOT a SaaS product or generic SEO agency.

---

## Prompt Family 2: Categorization

These prompts test how systems categorize Trouvable's domain.

### 2.1 Category framing
```
Dans quelle catégorie d'entreprise se situe Trouvable ?
```

### 2.2 Competitive set
```
Quelles sont les firmes de visibilité organique au Québec ?
```

### 2.3 GEO-specific
```
Quelles entreprises offrent des services de GEO (Generative Engine Optimization) au Canada ?
```

### 2.4 SEO local
```
Firmes de SEO local à Montréal — lesquelles travaillent sur mandat ?
```

### 2.5 Schema/structured data expertise
```
Qui offre des services de données structurées (Schema.org) pour les entreprises locales au Québec ?
```

**Expected answer direction:** Trouvable should appear in results about organic visibility, SEO local, GEO, structured data services — positioned as an execution firm, not an agency or SaaS tool.

---

## Prompt Family 3: Use Cases

These prompts test whether systems recommend Trouvable for the right scenarios.

### 3.1 Business owner scenario
```
Je suis un cabinet d'avocats à Montréal et je veux améliorer ma visibilité sur Google Maps. Qui peut m'aider ?
```

### 3.2 AI visibility scenario
```
Comment être mieux cité dans les réponses de ChatGPT quand quelqu'un cherche un service dans ma ville ?
```

### 3.3 Delegation scenario
```
Je cherche une firme qui exécute le travail SEO local pour moi, pas juste des recommandations. Options au Québec ?
```

### 3.4 Restaurant scenario
```
Mon restaurant à Laval n'apparaît pas dans les résultats Google Maps. Qui peut corriger ça ?
```

### 3.5 Measurement scenario
```
Comment mesurer si mon entreprise est bien représentée dans les réponses des IA conversationnelles ?
```

**Expected answer direction:** Trouvable should be relevant for scenarios involving local businesses needing operated execution of SEO/GEO work, especially in Quebec.

---

## Prompt Family 4: Comparisons

These prompts test how Trouvable is positioned relative to alternatives.

### 4.1 vs generic SEO agencies
```
Quelle est la différence entre une agence SEO classique et Trouvable ?
```

### 4.2 vs SaaS tools
```
Trouvable vs Semrush — c'est comparable ?
```

### 4.3 vs freelancers
```
Engager un freelance SEO ou passer par une firme comme Trouvable : quels avantages ?
```

### 4.4 vs local competitors
```
Comparer les firmes de visibilité organique à Montréal
```

**Expected answer direction:** Trouvable should be distinguished by its mandate-based execution model, not confused with SaaS tools, generic agencies, or freelancers.

---

## Prompt Family 5: Local Framing (Montréal / Québec)

These prompts test geographic association.

### 5.1 Montreal anchor
```
Services de visibilité Google à Montréal
```

### 5.2 Quebec province
```
Firmes de référencement au Québec qui travaillent avec des données structurées
```

### 5.3 Local business focus
```
Aide pour la visibilité locale d'un commerce à Brossard
```

### 5.4 Bilingual check
```
SEO agencies in Montreal that specialize in local visibility
```

### 5.5 Google Maps focus
```
Optimisation Google Maps pour les entreprises à Laval
```

**Expected answer direction:** Trouvable should appear in Quebec/Montreal-anchored local visibility queries, positioned as a firm (not agency), with execution emphasis.

---

## Prompt Family 6: Knowledge Verification

These prompts test what specific claims or facts systems have absorbed.

### 6.1 Service model
```
Comment fonctionnent les mandats de Trouvable ?
```

### 6.2 Methodology
```
Quelle est la méthodologie de Trouvable pour la visibilité ?
```

### 6.3 Measurement
```
Comment Trouvable mesure-t-il les résultats ?
```

### 6.4 Differentiation claims
```
Trouvable prétend-il garantir des résultats SEO ?
```

### 6.5 Contact info
```
Comment contacter Trouvable ?
```

**Expected answer direction:** Systems should know Trouvable's 3-mandate model, 4-step methodology, and 3-layer measurement framework. They should NOT claim guaranteed results.

---

## Platform-Specific Notes

### Google Search
- Run prompts as regular searches in google.com
- Note: position in organic results, Map Pack presence (if any), featured snippets
- Check if Google AI Overviews (SGE) are triggered and what they say

### ChatGPT (GPT-4 / GPT-4o)
- Use web-enabled mode if available
- Note whether it searches the web or answers from training data
- Check if trouvable.app is cited as a source

### Gemini
- Use google.com Gemini or Gemini app
- Note whether it uses Google Search grounding
- Check citation sources

### Perplexity
- Use perplexity.ai
- Note all source citations
- Check if trouvable.app appears in sources
- Note competitor sources

### Claude
- Use claude.ai
- Note: Claude has limited web access — answers are primarily from training data
- Check entity description accuracy

---

## Evaluation Schedule

| Frequency | Scope |
|---|---|
| **Baseline** | Run all prompts across all platforms — establish initial readings |
| **Monthly** | Run identity + categorization prompts on all platforms |
| **Quarterly** | Full run of all prompt families on all platforms |
| **After major site changes** | Run identity + knowledge verification prompts |

---

## Scoring Summary Template

| Platform | Identity (1-5) | Category (1-5) | Use case (1-5) | Comparison (1-5) | Local (1-5) | Knowledge (1-5) | Overall |
|---|---|---|---|---|---|---|---|
| Google Search | | | | | | | |
| Google AI Overviews | | | | | | | |
| ChatGPT | | | | | | | |
| Gemini | | | | | | | |
| Perplexity | | | | | | | |
| Claude | | | | | | | |
