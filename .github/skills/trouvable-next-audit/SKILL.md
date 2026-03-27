---
name: trouvable-next-audit
description: Audit Next.js App Router behavior in Trouvable. Use for rendering, metadata, route handlers, middleware, caching, revalidation, and framework-correct architecture decisions.
---

# Trouvable Next.js audit

Use this skill when the task involves:
- App Router architecture
- layouts or pages
- route handlers
- metadata
- server/client boundaries
- rendering behavior
- caching or revalidation
- middleware
- Next.js runtime or build issues

## Required workflow
1. Call `init` from `next-devtools-mcp` first.
2. Inspect the relevant files and route boundaries.
3. Identify the real rendering/data path.
4. Verify framework behavior before proposing fixes.
5. Prefer the smallest framework-correct change.

## Rules
- Do not guess Next.js behavior.
- Preserve App Router patterns.
- Do not move server work into client code without a strong reason.
- Prefer repository-consistent solutions over generic examples.
- Use Context7 for current library/framework patterns when relevant.

## Output format
1. Current behavior
2. Relevant files and route boundaries
3. Root cause or architecture finding
4. Minimal fix or recommendation
5. Validation steps

## Validation guidance
Prefer the smallest relevant validation path:
- focused route check
- focused browser check
- focused runtime/build verification
- Playwright flow only when the issue involves a user journey