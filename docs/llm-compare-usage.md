# LLM Compare Admin API

Route server-side: `POST /api/admin/llm-compare`

## Payload

```json
{
  "source_type": "url",
  "url": "https://example.com/article",
  "prompt": "Resume les points cles et les risques SEO",
  "provider_timeout_ms": 30000,
  "max_content_chars": 16000
}
```

Ou en texte brut:

```json
{
  "source_type": "text",
  "text": "Contenu brut a comparer...",
  "prompt": "Synthese comparative en 5 points"
}
```

## Variables d environnement

- `GOOGLE_API_KEY` (fallback accepte `GEMINI_API_KEY`)
- `GROQ_API_KEY`
- `MISTRAL_API_KEY`
- `GOOGLE_MODEL_COMPARE` (fallback `GEMINI_MODEL_COMPARE`)
- `GROQ_MODEL_COMPARE`
- `MISTRAL_MODEL_COMPARE`

## Contrat de reponse

- `contract_version` (actuellement `v1`)
- `input.source_type`, `input.url`, `input.prompt`, `input.content_preview`
- `results[]` avec:
  - `provider`, `model`
  - `ok`, `status`
  - `latency_ms`
  - `usage`
  - `content`
  - `error` (`{ class, message }` en cas d echec)

## Notes d integration

- Execution providers en `Promise.allSettled` pour supporter les erreurs partielles.
- Mistral est cadence via une queue memoire (`1 req/s`) sans impacter Gemini/Groq.
- Aucun secret API n est expose dans la sortie JSON.
