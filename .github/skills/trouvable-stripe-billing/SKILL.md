---
name: trouvable-stripe-billing
description: Implement, debug, and verify Stripe billing flows — plans, checkout, subscriptions, webhooks, entitlements, and access control.
---

# Stripe Billing Skill

## When to use

- When creating or modifying subscription plans
- When building or fixing checkout flows
- When debugging webhook handling
- When implementing or verifying feature entitlements
- When handling upgrade/downgrade/cancellation flows
- When debugging billing-related access control issues

## Context

Trouvable uses Stripe for subscription billing. Server-side key: `STRIPE_SECRET_KEY`. Client-side key: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Webhook handling in `app/api/` route handlers.

## Steps

### 1. Plan and price management

- Plans are configured in Stripe Dashboard (not hardcoded in source)
- Code references plan IDs via environment variables or config
- Each plan has: name, price, billing interval, feature set
- Feature entitlements are checked server-side, never client-only

### 2. Checkout flow verification

```
User clicks upgrade → Create Checkout Session (server) → Redirect to Stripe → 
Payment → Webhook: checkout.session.completed → Update entitlements → 
Redirect to success page
```

Verify each step:
- [ ] Checkout session created with correct price ID
- [ ] Success/cancel URLs are valid routes
- [ ] Webhook handler processes `checkout.session.completed`
- [ ] User entitlements updated in Supabase after webhook
- [ ] Success page shows correct confirmation

### 3. Webhook safety

- Webhook signature verification: always validate `stripe-signature` header
- Idempotency: handle duplicate webhook deliveries gracefully
- Error handling: return 200 even on processing errors (to prevent Stripe retries)
- Log failures for debugging without exposing sensitive data

```javascript
// Pattern
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Verify webhook signature
const event = stripe.webhooks.constructEvent(
  body, sig, process.env.STRIPE_WEBHOOK_SECRET
);
```

### 4. Entitlement checks

- Check entitlements server-side in route handlers and server actions
- Never trust client-side plan checks for access control
- Cache entitlements appropriately but invalidate on webhook events
- Pattern:

```javascript
// Server-side entitlement check
const subscription = await getActiveSubscription(userId);
if (!subscription || subscription.plan !== 'premium') {
  return { error: 'Upgrade required', status: 403 };
}
```

### 5. Common issues

| Issue | Diagnosis | Fix |
|---|---|---|
| Webhook not firing | Check Stripe Dashboard webhook logs | Verify endpoint URL and events |
| Entitlements not updating | Check webhook handler + Supabase update | Verify DB write after webhook |
| Checkout redirect fails | Check success_url / cancel_url | Ensure URLs are absolute |
| Double charges | Missing idempotency key | Add idempotency handling |
| Plan mismatch | Price ID mismatch | Verify env variable matches Stripe |

### 6. Testing

- Use Stripe test mode for all development
- Test card numbers: `4242 4242 4242 4242` (success), `4000 0000 0000 0002` (decline)
- Use Stripe CLI for local webhook testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Verify webhook events in Stripe Dashboard → Developers → Webhooks

### 7. Security

- [ ] `STRIPE_SECRET_KEY` never exposed to client
- [ ] Webhook signature always validated
- [ ] Payment amounts not modifiable by client
- [ ] User cannot access features beyond their plan
- [ ] Cancelled subscriptions properly revoke access

## References

- `app/api/` — webhook route handlers
- `lib/actions/` — billing-related server actions
- `.github/agents/trouvable-billing.agent.md` — billing specialist agent
- `.github/instructions/trouvable.instructions.md` — coding standards
