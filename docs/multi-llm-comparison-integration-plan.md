# Multi-LLM Comparison Integration Plan

## Architecture actuelle utile

- Les appels IA centralises passent par `lib/ai/index.js` avec adapters provider dans `lib/ai/providers/*`.
- Les runs GEO sont orchestres par `lib/queries/run-tracked-queries.js` et persistes dans `query_runs` + `query_mentions`.
- Les variantes benchmark vivent dans `lib/queries/engine-variants.js`, avec conventions `ok/error_class/error_message/provider/model/usage/cost_estimate_usd`.
- Les routes admin normalisent deja l auth/validation/erreurs via `requireAdmin`, `zod`, `NextResponse`.

## Zones a reutiliser

- Conventions d erreurs (`timeout`, `rate_limit`, `provider_error`) et logging `[scope]`.
- Contrat de metriques (`latency_ms`, `usage_tokens`) deja exploite cote admin.
- Pattern route admin server-side only (`app/api/admin/.../route.js`) et payload validation zod.

## Zones a eviter

- Ne pas brancher la comparaison 3 IA directement dans `runTrackedQueriesForClient` pour eviter de polluer les runs GEO standards.
- Ne pas dupliquer le pipeline benchmark existant (sessions/runs) pour un simple usage ponctuel cote admin.
- Ne pas exposer de secrets provider en sortie API.

## Strategie retenue

1. Ajouter une brique serveur reutilisable dediee a la comparaison ponctuelle:
   - `lib/llm-comparison/adapters/*` pour Gemini/Groq/Mistral
   - `lib/llm-comparison/extract-content.js` pour URL vs texte brut
   - `lib/llm-comparison/mistral-rate-limit.js` pour 1 req/s Mistral
   - `lib/llm-comparison/compare-models.js` pour orchestration `Promise.allSettled`
   - `lib/llm-comparison/response-contract.js` pour contrat et erreurs homogenes
2. Exposer la capacite via route admin dediee:
   - `app/api/admin/llm-compare/route.js`
3. Garder la separation claire:
   - comparaison ponctuelle: nouvelle route `llm-compare`
   - GEO standard/benchmark: pipeline existant inchange
4. Aligner les conventions:
   - latence par provider
   - usage mappe en `{prompt_tokens, completion_tokens, total_tokens}`
   - erreurs structurees `{class, message}`

## Decisions d integration

- Les modeles sont configures uniquement via variables d environnement, avec defaults raisonnables.
- La limite Mistral est isolee dans un scheduler en memoire qui n impacte pas Gemini/Groq.
- L extraction URL est server-side avec nettoyage HTML (`cheerio`) et limite de taille du contenu.

## Validation cible

- Support succes complet et succes partiel provider.
- Timeouts provider explicites.
- Contrat JSON stable, exploitable pour affichage side-by-side admin.
- Tests unitaires sur orchestration, extraction, rate-limit Mistral et route API.
