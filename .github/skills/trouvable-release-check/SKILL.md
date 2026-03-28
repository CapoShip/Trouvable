---
name: trouvable-release-check
description: Pre-release validation checklist for deployment readiness — covers build, lint, tests, security, SEO, and domain-specific checks.
---

# Release Check Skill

## When to use

- Before merging a feature branch to `main`
- Before deploying to production via Vercel
- After completing a significant feature or refactor
- When assessing merge confidence for a PR

## Steps

### 1. Build verification

```bash
npm run build         # Must pass with zero errors
npm run lint          # Must pass with zero errors
npm test              # Must pass with zero failures
```

### 2. Domain-specific checklists

#### Auth & Security
- [ ] No secrets or API keys in source code
- [ ] Clerk middleware routes are correctly protected
- [ ] Admin routes gated by email allowlist
- [ ] Portal routes gated by membership scope
- [ ] RLS policies unchanged or intentionally updated
- [ ] No new `dangerouslySetInnerHTML` without sanitization

#### SEO/GEO
- [ ] New pages have metadata (title, description, OG tags)
- [ ] JSON-LD structured data is truthful
- [ ] No fabricated citations, ratings, or business data
- [ ] `sitemap.js` and `robots.js` still valid
- [ ] Internal links point to existing routes

#### Billing/Subscriptions
- [ ] Stripe webhook handlers tested
- [ ] Plan entitlements correctly enforce access
- [ ] Checkout flows complete successfully
- [ ] No billing data exposed to unauthorized users

#### Database
- [ ] Schema changes have migration scripts
- [ ] `supabase/schema.sql` updated if structural change
- [ ] RLS not weakened
- [ ] Queries handle errors explicitly

#### UI/Frontend
- [ ] Responsive at mobile, tablet, and desktop
- [ ] Interactive states present (hover, focus, loading, error)
- [ ] No hydration mismatches
- [ ] No console errors in browser
- [ ] Accessibility basics intact (headings, labels, alt text)

### 3. Risk assessment

| Factor | Level | Notes |
|---|---|---|
| Auth boundary change | 🔴 HIGH | Requires manual verification |
| RLS policy change | 🔴 HIGH | Requires manual verification |
| Billing logic change | 🔴 HIGH | Requires Stripe test mode verification |
| Schema migration | 🟡 MEDIUM | Verify idempotency |
| New public page | 🟡 MEDIUM | SEO/metadata check required |
| Component styling | 🟢 LOW | Visual regression check |
| Internal refactor | 🟢 LOW | Test suite coverage |

### 4. Merge confidence verdict

Based on checks above, assign one of:

- **✅ READY** — All checks pass, no open risks
- **⚠️ READY WITH VALIDATIONS** — Checks pass but manual verification recommended for specific areas
- **❌ NOT READY** — Failing checks or unresolved risks
- **🚫 BLOCKED** — Critical issues that prevent deployment

### 5. Output format

```markdown
## Release Check: [Branch/PR]

### Build: ✅/❌
### Lint: ✅/❌
### Tests: ✅/❌

### Domain Checks:
- Auth: ✅/⚠️/❌
- SEO/GEO: ✅/⚠️/❌
- Billing: ✅/⚠️/❌ (or N/A)
- Database: ✅/⚠️/❌ (or N/A)
- UI: ✅/⚠️/❌

### Risk Level: LOW / MEDIUM / HIGH
### Verdict: READY / READY WITH VALIDATIONS / NOT READY / BLOCKED

### Post-deploy verification:
1. [Specific route or flow to check]
```

## References

- `.github/agents/trouvable-release.agent.md` — release specialist agent
- `AGENTS.md` — build and test commands
- `vercel.json` — deployment configuration
