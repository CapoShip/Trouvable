# Fix: robots.txt "Content-Signal: Unknown directive" — Cloudflare AI bot injection

## Problem

Production audit reports:

```
Line 29
Content-Signal: search=yes,ai-train=no
Error: Unknown directive
```

This non-standard directive is **not present anywhere in the codebase**.  
It is injected by **Cloudflare's "AI Crawlers & Scrapers" feature** at the CDN/proxy layer before the response reaches the client.

## Root cause

Cloudflare added an "AI Content Signal" product that lets site operators signal preferences to AI crawlers. When enabled, Cloudflare injects a `Content-Signal` line into the robots.txt response body **after** Vercel/Next.js has generated it.

This directive is not part of the robots.txt standard (RFC 9309) and causes "Unknown directive" errors in validators and audit tools.

## What was done in-repo

| Change | Purpose |
|--------|---------|
| `vercel.json` — added `/robots.txt` header rule with `Cache-Control: no-transform` and `CDN-Cache-Control: no-transform` | HTTP-standard signal to CDN proxies not to modify the response body |
| `lib/__tests__/robots-output.test.js` — regression guard | Validates app-level robots.js output contains only standard directives |

## Required manual action (Cloudflare dashboard)

The in-repo `no-transform` header is a best-effort signal. Cloudflare's AI bot injection may not respect it. The definitive fix requires a dashboard change:

### Steps

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select the **trouvable.app** zone
3. Navigate to **Security → Bots → AI Crawlers & Scrapers**  
   *(path may vary by plan: Security → Bot Management → AI Crawlers & Scrapers)*
4. Look for the **"Content Signal"** or **"AI Content Signal"** toggle
5. **Disable** the Content Signal injection into robots.txt
6. If you want to keep the AI training opt-out, configure it using **standard robots.txt directives** instead (see below)

### Alternative: standard-compliant AI training opt-out

Instead of the non-standard `Content-Signal` directive, use standard `User-agent` / `Disallow` rules in `app/robots.js`:

```js
// Example: block AI training crawlers while allowing search
{
    userAgent: 'GPTBot',
    disallow: ['/'],
},
{
    userAgent: 'Google-Extended',
    disallow: ['/'],
},
```

This is standards-compliant and will not trigger "Unknown directive" errors.

## Cache purge after fix

After disabling the Cloudflare Content Signal:

1. **Cloudflare**: Dashboard → Caching → Purge Cache → Custom Purge → enter `https://www.trouvable.app/robots.txt`
2. **Vercel**: If using edge caching, redeploy or use `vercel --force`
3. **Verify**: `curl -s https://www.trouvable.app/robots.txt` — confirm no `Content-Signal` line

## Verification checklist

- [ ] `Content-Signal` line no longer appears in `curl https://www.trouvable.app/robots.txt`
- [ ] Robots.txt still contains `User-agent`, `Allow`, `Disallow`, `Sitemap` directives
- [ ] Sitemap reference still present
- [ ] No "Unknown directive" error in re-audit
- [ ] AI crawlers still allowed (unless intentionally blocked)
