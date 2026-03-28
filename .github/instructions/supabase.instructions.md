---
applyTo: "supabase/**,sql/**,lib/db.js,lib/db/**,lib/supabase-admin.js,lib/supabase/**,lib/queries/**,lib/actions/**,lib/data/**"
---

# Supabase safety workflow

Every schema, policy, auth, or query change MUST follow this workflow.

## 1. Understand the current state

- Read `supabase/schema.sql` for the canonical DDL.
- Check `supabase/setup_*.sql` for incremental migration scripts.
- Inspect `lib/db.js` (anon facade) and `lib/supabase-admin.js` (service-role client) for current access patterns.
- Identify which tables, columns, and policies are affected.

## 2. Assess impact

Before proposing SQL:
- **RLS impact** — Does this change weaken, remove, or bypass existing row-level security?
- **Data loss risk** — Does this DROP, TRUNCATE, or ALTER columns with existing data?
- **Auth boundary** — Does this affect which users/roles can read or write?
- **Downstream consumers** — Which `lib/` modules, server actions, or API routes query this table?

## 3. Propose SQL explicitly

- Write the exact SQL statements to execute.
- Use `IF NOT EXISTS` / `IF EXISTS` guards where appropriate.
- Prefer `ALTER TABLE ... ADD COLUMN` over recreating tables.
- For destructive operations: explain why, show rollback SQL, and flag for human review.
- Never use `DROP TABLE` or `DROP POLICY` without explicit justification and backup plan.

## 4. RLS rules

- **All tables** must have RLS enabled: `ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;`
- Service-role writes bypass RLS — this is intentional for admin/server operations.
- Anon/public read access: only via explicit `FOR SELECT TO anon USING (...)` policies.
- Do not create `FOR ALL` policies — always specify the operation (SELECT, INSERT, UPDATE, DELETE).
- When adding a policy, always `DROP POLICY IF EXISTS` first to ensure idempotency.

## 5. Migration patterns

- New tables → add DDL to `supabase/schema.sql` AND create a `supabase/setup_<feature>.sql` migration script.
- Column additions → prefer `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
- Data backfills → use `UPDATE ... SET ... WHERE <column> IS NULL` with explicit WHERE clauses.
- Index creation → `CREATE INDEX IF NOT EXISTS` with meaningful names: `idx_<table>_<column>`.

## 6. Client usage patterns

```javascript
// Anon client (lib/db.js) — for public-facing reads
import supabase from '@/lib/db';
const { data, error } = await supabase.from('table').select('*').eq('published', true);

// Service-role client (lib/supabase-admin.js) — for admin writes, bypasses RLS
import { supabaseAdmin } from '@/lib/supabase-admin';
const { data, error } = await supabaseAdmin.from('table').insert({ ... });
```

- Always handle `error` — never silently ignore Supabase errors.
- Use `.single()` when expecting exactly one row.
- Use `.maybeSingle()` when expecting zero or one row.
- Prefer `.select('col1, col2')` over `.select('*')` in production queries.

## 7. Validation checklist

After any Supabase change:
- [ ] SQL is idempotent (can run multiple times safely)
- [ ] RLS is not weakened without explicit justification
- [ ] `schema.sql` is updated if structural change
- [ ] Migration script created if needed
- [ ] Downstream `lib/` consumers verified
- [ ] Error handling present in client code
