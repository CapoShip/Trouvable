---
applyTo: "app/**,components/**,middleware.ts,next.config.*,lib/**"
---

# Next.js scoped instructions

For anything in this scope:
- call `init` from `next-devtools-mcp` first
- use official Next.js guidance before proposing framework-specific fixes
- preserve App Router patterns
- do not guess caching, rendering, metadata, route handler, or server/client behavior
- prefer minimal, framework-correct solutions

## Additional rules
- preserve server/client component boundaries
- do not move server work into client components unless clearly justified
- prefer route handlers, server components, and server actions only where they fit the current architecture
- avoid hacks that fight Next.js behavior
- when debugging framework behavior, verify through `next-devtools-mcp` before editing code

## Validation guidance
After meaningful Next.js changes, prefer the smallest relevant validation path:
- targeted route check
- targeted browser verification
- focused build/runtime check
- focused Playwright flow when user journeys are involved