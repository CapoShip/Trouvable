# Content Signals in robots.txt (app-managed policy)

## Goal

Declare AI usage preferences directly in `robots.txt` using the `Content-Signal` directive.

Configured policy:

```txt
Content-Signal: ai-train=yes, search=yes, ai-input=yes
```

References:
- https://contentsignals.org/
- https://datatracker.ietf.org/doc/draft-romm-aipref-contentsignals/
- https://isitagentready.com/.well-known/agent-skills/content-signals/SKILL.md

## Source of truth

This project serves `robots.txt` from the app route:

- `app/robots.txt/route.js`
- `lib/agent-discovery/config.js` (`buildRobotsTxt`, `CONTENT_SIGNAL_VALUE`)

`Content-Signal` is intentionally emitted:
- In the `robots.txt` body, inside the primary `User-agent: *` block.
- As an HTTP response header (`Content-Signal`) on `/robots.txt`.

## Expected robots.txt shape

```txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /portal/
Disallow: /espace/
Disallow: /api/
Content-Signal: ai-train=yes, search=yes, ai-input=yes

Sitemap: https://www.trouvable.app/sitemap.xml
```

## Deploy and cache notes

Code changes alone are not enough if production still serves cached content.

1. Deploy the latest `main` that includes the app route output.
2. Purge cached `/robots.txt` at the CDN/proxy layer if needed.
3. Re-check the live response body and headers.

If Cloudflare AI Crawl Control is enabled, ensure dashboard settings do not override the app-managed policy with a different signal value.

## Validation checklist

- [ ] `curl -s https://www.trouvable.app/robots.txt` contains `Content-Signal: ai-train=yes, search=yes, ai-input=yes`
- [ ] `curl -I https://www.trouvable.app/robots.txt` contains `content-signal: ai-train=yes, search=yes, ai-input=yes`
- [ ] `npm.cmd test -- lib/__tests__/robots-output.test.js` passes
- [ ] `POST https://isitagentready.com/api/scan` reports `checks.botAccessControl.contentSignals.status = "pass"`
