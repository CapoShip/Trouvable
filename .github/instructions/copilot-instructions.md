# Trouvable - Repository Copilot Instructions

You are working in the Trouvable repository.

Treat this codebase as a production-grade product, not a toy project.

## Project identity

Trouvable is built around:
- Next.js App Router
- React
- Tailwind CSS
- Supabase
- Vercel

Core expectations:
- premium product quality
- strong technical correctness
- safe incremental changes
- truthful SEO/GEO implementation
- no fabricated data, citations, or results
- minimal-risk engineering decisions

This file defines repository-wide behavior.
More specific behavior may also be defined in scoped instruction files under `.github/instructions/`.

## Global operating principles

### 1. Understand before changing
Before making any non-trivial code change:
1. inspect the relevant files
2. identify the real execution path
3. explain the likely root cause or implementation path
4. propose a minimal plan
5. then implement

Do not jump straight into edits without grounding.

### 2. Prefer minimal, high-confidence changes
- prefer the smallest correct fix
- avoid broad rewrites unless explicitly requested
- preserve working architecture when possible
- do not refactor unrelated areas opportunistically
- do not change naming, formatting, or structure outside the real scope of the task

### 3. Be factual
Never invent:
- product metrics
- benchmark outcomes
- citations
- customer data
- analytics
- SEO/GEO claims
- structured data facts
- competitor facts
- implementation status

If information is missing, say it is missing.

### 4. Production mindset
Assume changes may affect real users, real data, and real deployment behavior.
Be conservative around:
- auth
- RLS
- schema changes
- caching
- metadata
- middleware
- billing
- production incidents
- public-facing SEO/GEO content

### 5. Keep solutions compatible with the stack
All solutions should remain compatible with:
- Next.js App Router
- React
- Tailwind CSS
- Supabase
- Vercel deployment

Do not introduce patterns that conflict with this stack unless explicitly justified.

## Mandatory tool routing

Use the right tool for the right class of problem.

### Next.js / framework behavior
For any task involving:
- App Router
- layouts
- pages
- route handlers
- rendering
- metadata
- middleware
- caching
- revalidation
- server vs client component boundaries
- build/runtime framework errors

Call `init` from `next-devtools-mcp` FIRST.

After initialization:
- use official Next.js guidance through `next-devtools-mcp`
- do not guess framework behavior when the tool can answer it
- if the tool is unavailable, say so explicitly before proceeding

### Library / API usage
For framework- or library-specific behavior:
- use Context7 before assuming APIs or patterns
- prefer current documented usage over memory

### Repository structure / tracing / implementation discovery
Use GitHub MCP for:
- file discovery
- architecture tracing
- related code paths
- previous implementation patterns
- issue / PR / repo context
- code search across the repository

### Browser debugging
Use Chrome DevTools MCP first for:
- UI bugs
- hydration issues
- broken interactions
- browser runtime errors
- layout issues
- network failures
- console errors
- client-side regressions

### Reproducible end-to-end flows
Use Playwright MCP for:
- repeatable user journeys
- onboarding flows
- dashboard flows
- regression verification
- multi-step interaction checks

### Database / schema / policies / auth data flow
Use Supabase MCP first in read/query mode for:
- schema inspection
- query review
- policies
- RLS
- auth-related data flow
- SQL review

Do not treat write operations casually.

### Production debugging
Use Sentry MCP for:
- incidents
- error triage
- runtime regressions
- production exceptions
- issue investigation

### Fresh external research
Use Tavily for:
- current external facts
- competitor checks
- web research
- recent changes outside the repo

### API collections / specs / environments
Use Postman MCP only when the task is specifically about:
- API collections
- environments
- API testing flows
- specs
- workspace/API collaboration artifacts

Do not default to Postman MCP for normal app debugging.

## Change workflow

For non-trivial tasks, follow this order:

1. **Analysis**
   - define the problem clearly
   - identify files and paths involved
   - explain likely cause or implementation target

2. **Plan**
   - propose the smallest reasonable plan
   - keep scope tight
   - mention real risks only when they matter

3. **Implementation**
   - change only what is necessary
   - match repository style
   - avoid unrelated edits

4. **Validation**
   - recommend the smallest relevant validation path
   - include targeted checks, not blanket heavy workflows by default

## Response format expectations

For meaningful implementation work, structure output as:

### Analysis
- what is happening
- what files matter
- what the likely cause/path is

### Plan
- concise steps
- minimal scope

### Changes
- files touched
- what changed
- why it changed

### Validation
- smallest useful validation path
- targeted commands or manual checks when relevant

Keep explanations concrete.
Avoid vague summaries.

## Validation rules

After meaningful changes, recommend the smallest relevant validation path, such as:
- lint
- targeted typecheck
- targeted test
- single route check
- focused Playwright flow
- browser verification steps
- specific runtime verification

Do not recommend large test suites unless justified by the scope.

Prefer validating actual behavior over superficial implementation details.

## Coding style expectations

- write clean, production-appropriate code
- prefer readability over cleverness
- avoid unnecessary abstractions
- avoid duplicate logic
- keep functions focused
- keep components cohesive
- preserve semantic HTML where relevant
- keep Tailwind usage readable
- avoid introducing dependencies unless there is a strong reason

When editing existing code:
- follow the local style of the repository
- do not reformat unrelated code
- do not rename unrelated symbols
- do not move files unless necessary

## Anti-patterns to avoid

Do NOT:
- guess Next.js behavior without using `next-devtools-mcp`
- guess library APIs when Context7 can verify them
- rewrite large areas for a small fix
- introduce destructive SQL casually
- weaken RLS or auth without explicit reasoning
- invent missing facts
- present assumptions as facts
- touch unrelated files unnecessarily
- over-engineer a simple problem
- optimize prematurely without evidence

## Default decision policy

When uncertain:
- inspect more before changing code

When multiple valid solutions exist:
- choose the lower-risk, smaller-footprint option

When the task affects production-sensitive flows:
- be conservative
- explain impact
- validate carefully

When a tool would reduce guessing:
- use the tool