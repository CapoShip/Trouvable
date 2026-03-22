# Phase 3.1 - Moteur Qualite Inspectable

Ce document decrit les choix produits/techniques ajoutes en Phase 3.1 au-dessus de la base continue Phase 3.

## 1) Mode Quotidien Strict (Vercel Hobby)

Trouvable fonctionne maintenant en mode quotidien-first par defaut:

- Cron dispatch: `/api/cron/continuous/dispatch` -> `0 3 * * *`
- Cron snapshot: `/api/cron/continuous/snapshot` -> `17 4 * * *`
- Toute cadence job inferieure a 24h est automatiquement relevee a 24h quand `CONTINUOUS_DAILY_FIRST_MODE=1`.

Comportement runtime:

- `lib/continuous/mode.js` centralise la politique daily-first.
- `lib/continuous/jobs.js` applique le plancher de cadence sur seed, update cadence, retries et prochain run.
- UI admin GEO (vue `continuous`) n expose que des options quotidiennes (24h / 48h / 7 jours) en mode Hobby.

Passage futur Pro/per-minute:

1. Mettre `CONTINUOUS_DAILY_FIRST_MODE=0`.
2. Ajuster les crons Vercel selon le plan Pro.
3. Re-ouvrir les cadences infra-journalieres en UI si souhaite.

## 2) French-First Dashboard (Admin GEO)

La couche `lib/i18n/admin-fr.js` sert de base de labels centralises pour navigation, statuts, actions et sections clefs.

Les vues operateur GEO principales utilisent des libelles FR harmonises:

- Vue d ensemble
- Prompts suivis
- Executions / Historique des executions
- Citations
- Concurrents
- Suivi quotidien
- Centre d opportunites
- Veille sociale
- Parametres

## 3) Prompt Intelligence Engine V2

Le moteur prompt ajoute une classification qualite et une taxonomie metier:

- `prompt_origin`
- `intent_family`
- `query_type_v2`
- `funnel_stage`
- `geo_scope`
- `brand_scope`
- `comparison_scope`
- `quality_status`
- `quality_score`
- `quality_reasons`

Fichier principal: `lib/queries/prompt-intelligence.js`

Flux create/update/toggle:

- Create/update: metadata qualite recalculee et persistante.
- Toggle activation: blocage doux si prompt `weak`.
- UI prompt: badge qualite + raisons + signal operateur.

## 4) Capture Complete des Runs + Inspecteur

Chaque run stocke maintenant les artefacts complets:

- prompt exact (`prompt_payload`)
- provider, model, locale
- reponse brute complete (`raw_response_full`)
- reponse normalisee (`normalized_response`)
- parse status / parse warnings / parse confidence
- latence, usage tokens
- error_class, retry_count
- extraction_version
- run_mode, engine_variant, benchmark_session_id

Inspecteur run admin:

- endpoint: `/api/admin/geo/client/[id]/runs/[runId]`
- actions: `rerun`, `reparse`
- UI: prompt exact, brut complet, parse, citations, concurrents, diagnostics 0-citation/0-concurrent.

## 5) Parsing / Citation / Competitor V2

Le pipeline d extraction est explicite en 4 couches:

1. literal (texte modele)
2. parsed (sortie parse Trouvable)
3. normalized (normalisation Trouvable)
4. verified (slot reserve verification externe)

Fichier principal: `lib/queries/extraction-v2.js`

Ajouts clefs:

- parse status: `parsed_success`, `parsed_partial`, `parsed_failed`
- heuristiques URL/domain
- normalisation host/domain
- alias concurrents exact + fuzzy-safe
- evidence spans
- diagnostics explicites pour 0 citation / 0 concurrent.

## 6) Benchmark Sandbox Gratuit

Mode comparatif operateur (sans promesse de parite native ChatGPT/Claude/Perplexity):

- variantes initiales:
  - `tavily_orchestrated`
  - `groq_compound_mini`
  - `gemini_free_non_grounded`

Composants:

- `lib/queries/engine-variants.js`
- `app/api/admin/queries/benchmark/route.js`
- vue compare dans `GeoModelesView`

Regle verite:

- si variante indisponible (credentials/config), run en echec explicite.
- pas de simulation de parite production.

## 7) Evaluation Harness

Fichiers:

- dataset: `tests/quality-eval.cases.json`
- checks extraction: `tests/extraction-v2.check.js`
- evaluation globale: `tests/quality-engine-eval.check.js`
- rapport: `tests/output/quality-engine-eval-report.json`

Metriques calculees:

- target detection accuracy
- competitor extraction accuracy (F1)
- source extraction accuracy (F1)
- parse success rate
- weak prompt rate
- hallucinated source rate
- useful answer rate (+ useful answer alignment)

Commandes:

```bash
npm run check:extraction
npm run check:eval
npm test
```

## 8) Frontiere Portal Safety

Les artefacts debug/operator restent cote admin:

- pas de brute complete run
- pas de parse warnings internes
- pas de benchmark internals
- pas de details extraction operateur

Le portal reste sur des resumes business-safe et lecture seule.

