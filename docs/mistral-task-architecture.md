# Mistral Task Architecture — Decision Record

## Status: APPROVED

## Context

Mistral is already integrated as a provider in the AI abstraction layer (`lib/ai/providers/mistral.js`) and used in:
- **GEO query engine** (`engine-variants.js`): `mistral_geo_default` and `mistral_small_non_grounded` variants
- **Remediation AI** (`remediation-ai.js`): text generation for 6 remediation problem types
- **LLM comparison** (`llm-comparison/adapters/mistral.js`): as one of 4 comparison providers
- **Benchmark sandbox** (`engine-variants.js`): production_candidate and sandbox modes

### What's missing

1. **No task-level abstraction** — each call site configures provider/model/temperature/maxTokens independently
2. **No AI traceability** — no generic AI task run logging (community_collection_runs exists but is domain-specific)
3. **No Zod validation at the execution layer** — schemas exist in `lib/ai/schemas.js` but validation happens downstream
4. **Agent Reach enrichment is keyword-only** — Stage 4 of the community pipeline uses regex/keyword matching for mention extraction, with no LLM involvement. This is the highest-leverage gap.

## Verified

- Provider abstraction (`callAiText`, `callAiJson`, `callAiWithFallback`) is sound and tested
- Mistral provider has retry logic (2 retries, exponential backoff), 30s timeout, rate limiting via `MistralRateLimiter`
- Zod schemas exist for audit analysis, GEO queries, and community entities
- Normalization layer handles partial validation failures gracefully
- Community pipeline writes to 5 tables with full evidence tracking (evidence_level, provenance)
- Continuous engine already calls `runCommunityPipeline` as a recurring job type

## Gaps

- Mistral provider does NOT pass `jsonMode` (no `response_format` support) — must rely on prompt-instructed JSON + fence stripping
- No centralized task registry — provider selection is scattered across 4+ files
- No AI run log table — cannot answer "what AI calls ran for client X this week?"
- Agent Reach mention extraction misses nuance that keyword matching cannot capture (sarcasm, implicit complaints, context-dependent recommendations)

## Architecture Decision

### 1. Task Execution Layer (`lib/ai/tasks/`)

A thin task wrapper around the existing provider abstraction. Each task is a named, self-contained unit:

```
lib/ai/tasks/
  registry.js        — task registry + executeTask() entry point
  log.js             — AI task run persistence
  community-classify.js   — mention classification task
  community-labels.js     — cluster label normalization task
  community-synthesize.js — opportunity synthesis task
```

Each task defines:
- `taskId` — unique string identifier
- `provider` — preferred provider (default: `'mistral'`)
- `fallbackProvider` — optional fallback (default: `null` for Mistral tasks, meaning fail-safe rather than switch)
- `buildMessages(input)` — prompt construction
- `outputSchema` — Zod schema for response validation
- `normalize(raw)` — graceful normalization on partial failure
- `temperature`, `maxTokens`, `purpose` — provider params

**Design constraint**: Tasks are pure configuration + prompt. They reuse `callAiJson`/`callAiText` from `lib/ai/index.js`. No new provider abstractions.

### 2. AI Task Run Log Table (`ai_task_runs`)

Generic traceability for all AI task executions. Follows the pattern of `community_collection_runs` but domain-agnostic.

```sql
CREATE TABLE IF NOT EXISTS public.ai_task_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.client_geo_profiles(id) ON DELETE SET NULL,
    task_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    input_hash TEXT,
    input_summary JSONB DEFAULT '{}'::jsonb,
    output_summary JSONB DEFAULT '{}'::jsonb,
    usage_tokens JSONB DEFAULT '{}'::jsonb,
    latency_ms INTEGER,
    error_message TEXT,
    error_class TEXT,
    validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'partial', 'invalid')),
    validation_warnings JSONB DEFAULT '[]'::jsonb,
    trigger_source TEXT DEFAULT 'system' CHECK (trigger_source IN ('cron', 'manual', 'pipeline', 'system')),
    parent_run_id UUID REFERENCES public.ai_task_runs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3. Concrete Mistral Tasks

#### Task 1: Community Mention Classification (`community-classify`)
- **Input**: document text + client context (business type, competitors)
- **Output**: array of classified mentions with `mention_type`, `label`, `snippet`, `evidence_level`, `provenance`
- **Replaces**: deterministic keyword extraction in Agent Reach Stage 4
- **Fallback**: on failure, falls back to existing keyword extraction (zero regression risk)
- **Zod schema**: extends existing `mentionSchema` from `contracts.js`

#### Task 2: Cluster Label Normalization (`community-labels`)
- **Input**: array of raw cluster labels + types
- **Output**: normalized, deduplicated labels with canonical forms
- **Purpose**: improve cluster quality when keyword-derived labels are noisy
- **Fallback**: original labels preserved on failure

#### Task 3: Opportunity Synthesis (`community-synthesize`)
- **Input**: top clusters + mention counts + evidence levels
- **Output**: operator-facing opportunity descriptions with actionable rationale
- **Purpose**: transform mechanical cluster data into clear operator intelligence
- **Fallback**: existing `deriveOpportunitiesFromClusters` output preserved

### 4. Integration Strategy

- Agent Reach pipeline gains an optional LLM enrichment path in Stage 4
- Controlled by `COMMUNITY_USE_LLM_ENRICHMENT` env flag (default: `false` initially)
- Pipeline tracks which enrichment method was used (`enrichment_method: 'keyword' | 'llm'`) in run context
- All 3 tasks log to `ai_task_runs` for traceability
- Mistral remains replaceable — tasks use `provider` config, not hard-coded calls

## Risks

| Risk | Mitigation |
|------|------------|
| Mistral API downtime | Graceful fallback to keyword extraction; pipeline never blocks |
| Rate limiting | Existing `MistralRateLimiter` + batch documents (classify multiple docs per call) |
| JSON parse failures | Fence stripping in `callAiJson` + Zod validation with partial normalization |
| Cost escalation | Log token usage per task; batch where possible; use `mistral-small-2603` |
| Schema drift | Zod schemas enforce contract; `validation_warnings` track partial failures |

## Non-goals

- Replacing Groq/Gemini as primary providers for GEO/audit (Mistral supplements, does not replace)
- Adding new public-facing features (this is internal operator tooling)
- Refactoring the existing provider abstraction layer
