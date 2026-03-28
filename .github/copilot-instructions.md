# Trouvable — Repository-wide Copilot instructions

## Identity

Trouvable is a production-grade SaaS platform for local business visibility, SEO/GEO optimization, and AI-powered audit intelligence.
Every change may affect real users, real search rankings, and real revenue.

## Stack

Next.js 16 App Router · React 18 · Tailwind 3 · Supabase (Postgres + RLS) · Clerk 7 · Vercel · Stripe
Testing: Vitest · AI: Mistral, Groq, Gemini · Email: Resend · Bot protection: Cloudflare Turnstile

## MCP tool routing

Use the correct MCP server for the relevant domain. Do not guess when a tool can answer.

| Domain | MCP server | When to use |
|---|---|---|
| App Router, rendering, metadata, middleware, caching, revalidation | `Next DevTools MCP` | **First** for any Next.js work |
| Browser DOM, console, network, layout | `Chrome DevTools MCP` | Runtime inspection, visual debugging |
| E2E flows, interaction verification | `Playwright MCP` | Flow testing, regression checks |
| Schema, RLS, policies, queries, auth | `Supabase MCP` | **Read mode first**, then mutations |
| Production exceptions, stack traces | `Sentry MCP` | Incident triage, regression detection |
| Framework/library API correctness | `Context7` | Before assuming any API behavior |
| Web search, external fact verification | `Tavily MCP` | Only for genuine external validation |
| Git history, PRs, issues, file contents | `GitHub MCP` | Code tracing, history, coordination |
| API contracts, endpoint testing | `Postman MCP` | When API contract artifacts matter |

**Rule:** Initialize the relevant MCP server before guessing. Use read/query mode before write mode.

## Specialist agents

Route work to the right specialist — see `.github/agents/` for the full roster:

| Agent | Domain |
|---|---|
| `trouvable-orchestrator` | Default entry point, triage and routing |
| `trouvable-architect` | Planning, new features, multi-file implementation |
| `trouvable-frontend` | Premium UI/UX, components, visual polish |
| `trouvable-data` | Supabase, schema, RLS, auth, queries |
| `trouvable-debug` | Bugs, regressions, runtime failures |
| `trouvable-seo-geo` | Metadata, JSON-LD, GEO pages, citations |
| `trouvable-billing` | Stripe, plans, subscriptions, entitlements |
| `trouvable-release` | Merge confidence, release readiness |

## Core principles

1. **Understand before changing** — inspect relevant files, trace the real execution path, explain the likely cause, propose a minimal plan, then implement.
2. **Smallest correct change** — prefer focused fixes over broad refactors.
3. **Truthfulness** — never fabricate metrics, SEO results, analytics, citations, benchmark outcomes, customer data, or structured data facts. If data is missing, say it is missing.
4. **Safety-first** — be conservative around auth, RLS, schema, caching, metadata, middleware, billing, and public-facing content.
5. **Reuse** — use existing utilities, hooks, services, and patterns before adding new abstractions.
6. **Validate** — recommend the smallest relevant validation after every meaningful change.

## Key files

| Purpose | Location |
|---|---|
| Project rules & architecture | `AGENTS.md` |
| Engineering instructions | `.github/instructions/trouvable.instructions.md` |
| Schema DDL | `supabase/schema.sql` |
| Auth helpers | `lib/auth.js` |
| Supabase facade | `lib/db.js` |
| Service-role client | `lib/supabase-admin.js` |
| Implementation plans | `docs/` |

## Git workflow

- Branch from `main` for features: `feat/short-description`
- Branch from `main` for fixes: `fix/short-description`
- Commit messages: `type(scope): description` — types: feat, fix, refactor, docs, test, chore, perf, style
- Keep commits small and atomic — one logical change per commit
- No force-pushes to `main`
- Run `npm run lint` and `npm test` before considering a PR ready

## Environment & secrets

- Never hardcode secrets, API keys, or tokens in source files
- Use `.env.local` for local development, Vercel environment variables for production
- Reference secrets via `process.env.VARIABLE_NAME`
- Clerk keys: `NEXT_PUBLIC_CLERK_*` (client) and `CLERK_*` (server)
- Supabase keys: `NEXT_PUBLIC_SUPABASE_*` (anon) and `SUPABASE_SERVICE_ROLE_KEY` (service)
- Stripe keys: `STRIPE_SECRET_KEY` (server) and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (client)
