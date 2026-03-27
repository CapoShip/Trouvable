---
name: trouvable-release-check
description: Run a release-minded check on Trouvable changes. Use before shipping meaningful work that touches UI, data, auth, SEO/GEO, or user-critical flows.
---

# Trouvable release check

Use this skill when the task involves:
- pre-release review
- risky changes
- user-critical flows
- auth-sensitive changes
- data-path changes
- SEO/GEO visibility changes
- multi-file implementation that should be sanity-checked before shipping

## Required workflow
1. Identify what changed and what user-facing behavior is affected.
2. Identify the smallest set of validations needed to reduce shipping risk.
3. Check for obvious security, data, UX, and truthfulness regressions.
4. Prefer focused checks over giant blanket test plans.
5. Produce a concise release-readiness summary.

## Rules
- Do not propose massive validation suites by default.
- Prioritize user-critical and regression-prone paths.
- Explicitly flag anything that is not validated.
- Treat auth, RLS, citations, and public-facing metadata as sensitive.
- Prefer honest release notes over false confidence.

## Output format
1. Scope of change
2. Risk areas
3. Focused validation checklist
4. Gaps or unknowns
5. Release recommendation

## Validation guidance
Possible checks:
- targeted lint/typecheck
- one focused Playwright path
- one focused browser/runtime check
- one focused data/auth check
- one focused SEO/GEO correctness check