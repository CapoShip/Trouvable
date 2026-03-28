---
name: trouvable-supabase-safe-change
description: Step-by-step workflow for safe Supabase schema, policy, and data changes with rollback planning.
---

# Supabase Safe Change Skill

## When to use

- Before executing ANY DDL statement (CREATE, ALTER, DROP)
- Before modifying RLS policies
- Before running data migrations or backfills
- When adding or modifying Supabase client queries in `lib/`
- When debugging data access or permission issues

## Pre-flight checklist

Before making any change, answer:
1. What is the current state? (Read schema.sql, check existing policies)
2. What exactly will change? (Exact SQL statements)
3. What could break? (Downstream consumers, RLS, auth boundaries)
4. Can this be rolled back? (Reversible vs destructive)
5. Who needs to know? (Frontend, API routes, server actions affected)

## Steps

### 1. Read current state

```bash
# Files to inspect
supabase/schema.sql         # Canonical DDL
supabase/setup_*.sql        # Migration scripts
lib/db.js                   # Anon client patterns
lib/supabase-admin.js       # Service-role client
lib/db/                     # Domain-specific data modules
lib/queries/                # Query utilities
lib/actions/                # Server actions
```

### 2. Write migration SQL

**Template:**
```sql
-- Migration: [description]
-- Date: [YYYY-MM-DD]
-- Risk: [LOW/MEDIUM/HIGH]
-- Rollback: [rollback SQL or "N/A - additive only"]

-- Guard: idempotent execution
ALTER TABLE public.<table> ADD COLUMN IF NOT EXISTS <column> <type>;

-- Policy changes (always drop-then-create)
DROP POLICY IF EXISTS "<policy_name>" ON public.<table>;
CREATE POLICY "<policy_name>"
ON public.<table>
FOR <SELECT|INSERT|UPDATE|DELETE>
TO <role>
USING (<condition>);

-- Index (if needed)
CREATE INDEX IF NOT EXISTS idx_<table>_<column> ON public.<table> (<column>);
```

### 3. Risk classification

| Change type | Risk | Requires |
|---|---|---|
| ADD COLUMN (nullable) | LOW | Schema update + migration script |
| ADD COLUMN (NOT NULL) | MEDIUM | Default value + backfill plan |
| ADD INDEX | LOW | Performance check for large tables |
| ADD POLICY | MEDIUM | Verify doesn't conflict with existing policies |
| ALTER COLUMN type | HIGH | Data compatibility check + rollback SQL |
| DROP COLUMN | HIGH | Verify no downstream consumers + rollback SQL |
| DROP POLICY | HIGH | Security impact assessment + rollback SQL |
| DROP TABLE | CRITICAL | Human approval required |

### 4. Update canonical schema

After migration script is validated:
- Add new table/column definitions to `supabase/schema.sql`
- Create `supabase/setup_<feature>.sql` for the migration
- Update `lib/db/` or `lib/queries/` if query patterns change

### 5. Downstream verification

- [ ] All `lib/` modules that query affected tables still work
- [ ] Server actions in `lib/actions/` handle new columns
- [ ] API routes in `app/api/` return correct data
- [ ] Admin UI in `app/admin/` displays correctly
- [ ] Portal views in `app/portal/` unaffected or updated

### 6. Validation

```bash
# After applying migration
npm run lint          # Catch any broken imports
npm test              # Run test suite
# Then: manual verification of affected routes
```

## References

- `supabase/schema.sql` — canonical DDL
- `supabase/setup_*.sql` — migration scripts
- `lib/db.js` — anon Supabase client
- `lib/supabase-admin.js` — service-role client
- `.github/instructions/supabase.instructions.md` — detailed Supabase rules
- `.github/agents/trouvable-data.agent.md` — data specialist agent
