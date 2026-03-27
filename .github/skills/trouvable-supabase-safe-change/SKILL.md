---
name: trouvable-supabase-safe-change
description: Safely analyze and change Supabase schema, queries, policies, and auth-related behavior for Trouvable.
---

# Trouvable Supabase safe change

Use this skill when the task involves:
- schema changes
- SQL
- queries
- RLS
- policies
- auth-related data flow
- database-backed bugs
- access control

## Required workflow
1. Inspect current schema, policies, functions, and queries first.
2. Use Supabase MCP in read/query mode before proposing writes.
3. Trace the application code path that reads and uses the data.
4. Explain impacted tables, policies, and auth/session flows.
5. Propose SQL explicitly before applying any write operation.

## Rules
- Do not weaken RLS casually.
- Do not broaden access without explicit reasoning.
- Do not assume service-role access is acceptable for normal user-facing flows.
- Separate analysis from write operations.
- Avoid destructive operations unless explicitly requested.
- Preserve least-privilege behavior.

## Output format
1. Current state
2. Problem
3. Proposed SQL or policy/query change
4. Risk and impact
5. Validation steps

## Validation guidance
Use targeted validation:
- query verification
- policy behavior checks
- auth/session flow checks
- focused app flow that exercises the changed query or policy