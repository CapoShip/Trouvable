---
name: trouvable-stripe-billing
description: Safely implement or review Stripe billing for Trouvable. Use for plans, checkout/session flows, entitlements, webhooks, subscription logic, and billing-related access control.
---

# Trouvable Stripe billing

Use this skill when the task involves:
- Stripe integration
- pricing plans
- checkout flows
- subscriptions
- entitlements
- webhook handling
- billing-linked access rules
- premium/ultimate feature gating

## Required workflow
1. Identify the pricing model and access model clearly.
2. Trace how billing state affects application access.
3. Separate Stripe events from internal entitlement state.
4. Prefer explicit mapping between plan, entitlement, and UI behavior.
5. Validate webhook and state-transition behavior before trusting it.

## Rules
- Do not treat checkout success alone as durable entitlement state.
- Do not rely on client-only billing truth for access control.
- Keep webhook handling explicit and idempotent.
- Clearly distinguish subscription state, product tier, and in-app access rights.
- Call out security or downgrade/upgrade edge cases.

## Output format
1. Current billing/access model
2. Problem or implementation target
3. Minimal safe implementation path
4. Risk and edge cases
5. Validation steps

## Validation guidance
Check:
- checkout/session creation
- webhook handling
- entitlement mapping
- upgrade/downgrade behavior
- access gating in the app