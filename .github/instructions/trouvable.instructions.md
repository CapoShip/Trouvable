---
applyTo: "app/**,components/**,lib/**,middleware.ts,server/**,scripts/**,supabase/**,sql/**,tests/**,next.config.*,tailwind.config.*,postcss.config.*,vercel.json"
---

# Trouvable engineering instructions

You are working in the Trouvable repository.

## Project context
Trouvable is a production-grade web application built around:
- Next.js App Router
- React
- Tailwind CSS
- Supabase
- Vercel

The project emphasizes:
- strong product quality
- premium UX
- safe backend changes
- SEO/GEO correctness
- factual, non-invented content
- incremental implementation over reckless rewrites

## Trouvable-specific engineering rules

### 1. Prefer minimal changes
- Prefer the smallest correct change.
- Avoid broad rewrites unless explicitly requested.
- Preserve existing architecture when possible.
- Follow existing naming, file organization, and code patterns unless there is a strong reason to improve them.

### 2. Understand before editing
Before making non-trivial changes:
1. inspect the relevant files
2. identify the real execution path
3. explain root cause or implementation target
4. propose a minimal plan
5. only then implement

Do not jump directly into code edits without grounding.

### 3. Respect App Router architecture
- Preserve correct server/client component boundaries.
- Do not move logic to the client unnecessarily.
- Prefer server-side data access when appropriate.
- Avoid introducing patterns that conflict with App Router or Vercel deployment constraints.

### 4. Safe Supabase workflow
For any schema, policy, auth, or query change:
- inspect current tables, policies, and queries first
- explain impacted tables and flows
- explain RLS impact
- explain auth and session implications
- separate analysis from write operations
- propose SQL explicitly before applying it
- avoid destructive operations unless explicitly requested
- preserve least-privilege behavior

### 5. Do not invent facts
For Trouvable, never fabricate:
- product metrics
- SEO results
- GEO results
- analytics
- citations
- benchmark conclusions
- customer data
- structured data facts
- competitors’ claims

If data is missing, say it is missing.

### 6. Preserve truthfulness in SEO/GEO work
When touching:
- metadata
- JSON-LD
- citations
- GEO pages
- local business information
- expertises
- entity descriptions

Only use data that is actually present, verified, or explicitly provided.
Do not add placeholder values disguised as real content.

### 7. Validation-first mindset
After meaningful changes, always recommend the smallest relevant validation path, such as:
- lint
- targeted typecheck
- targeted unit test
- single flow Playwright check
- route-level runtime check
- browser verification steps

Do not recommend huge validation suites unless the scope justifies it.

## Output format expectations

For any non-trivial implementation task, structure your work like this:

### Analysis
- what the issue/request is
- what files and code paths matter
- what the likely root cause or implementation path is

### Plan
- concise step-by-step plan
- minimal scope
- mention risks only if real

### Changes
- list files touched
- summarize exactly what changed
- keep explanations concrete

### Validation
- give the smallest useful validation path
- include commands only if relevant
- include manual verification steps when needed

## Coding style expectations

- Write clean, direct, production-appropriate code.
- Prefer readable code over clever code.
- Avoid unnecessary abstractions.
- Avoid duplicate logic.
- Keep functions focused.
- Keep component responsibilities clear.
- Preserve semantic HTML where relevant.
- Keep Tailwind usage organized and readable.
- Avoid introducing dependencies unless there is a strong reason.

When editing existing code:
- match the local style of the repo
- do not reformat unrelated areas
- do not rename unrelated symbols
- do not move files unless necessary

## Frontend expectations

When working on UI:
- preserve or improve visual polish
- do not produce generic-looking interfaces
- maintain premium product feel
- keep layouts aligned with current design direction
- preserve accessibility basics
- avoid fragile UI logic
- verify interactive states when relevant

For front-end bugs:
- inspect real browser behavior before guessing
- prefer Chrome DevTools MCP for runtime evidence
- use Playwright MCP when the bug depends on a repeatable flow

## Backend expectations

When working on backend/data logic:
- trace the request/data path fully
- identify where state is created, transformed, and consumed
- verify assumptions against schema and code
- call out side effects
- do not silently weaken security or policy behavior

## Testing expectations

Use testing effort proportional to the change:
- small fix -> targeted validation
- moderate feature -> targeted test coverage + flow check
- risky refactor -> broader regression suggestions

Do not generate excessive test scaffolding unless requested.

Prefer tests that validate actual behavior, not superficial implementation details.

## Anti-patterns to avoid

Do NOT:
- make large rewrites for small problems
- propose destructive SQL casually
- weaken RLS or auth without explicit justification
- invent missing data
- present assumptions as facts
- touch unrelated files for style-only reasons
- recommend over-engineered solutions when a simple one works

## Default decision rules

If there is uncertainty:
- inspect more before changing code

If there are multiple valid solutions:
- choose the one with the lowest risk and smallest footprint

If the task touches production-sensitive flows:
- be conservative
- explain impact
- validate carefully