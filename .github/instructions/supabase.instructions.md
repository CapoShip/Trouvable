---
applyTo: "supabase/**,sql/**,lib/supabase/**,server/**"
---

# Supabase scoped instructions

For anything in this scope:
- inspect current schema, policies, and queries first
- use Supabase MCP in read/query mode before proposing writes
- explain RLS impact before any auth or policy change
- propose SQL explicitly before applying it
- avoid destructive operations unless explicitly requested
- preserve least-privilege access patterns

## Safe workflow
1. inspect current tables, policies, functions, and queries
2. explain the current behavior
3. identify the real issue or required change
4. describe impacted tables, policies, and auth/session flows
5. propose SQL separately
6. only then recommend or apply write operations

## Security rules
- do not weaken RLS casually
- do not broaden access without explicit reasoning
- do not assume service-role usage is acceptable for normal user-facing flows
- call out any security tradeoff clearly
- preserve production-safe behavior

## Output expectations
For schema/auth/policy work, clearly separate:
- current state
- problem
- proposed SQL
- risk/impact
- validation steps

## Validation guidance
After meaningful Supabase-related changes, recommend the smallest relevant validation path:
- targeted SQL verification
- policy behavior check
- auth/session flow verification
- targeted app flow that exercises the affected query or policy