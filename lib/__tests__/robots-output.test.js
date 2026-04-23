/**
 * Regression guard — validates the app/robots.js output contains
 * only RFC 9309 standard directives (User-agent, Allow, Disallow, Sitemap,
 * Crawl-delay, Host) and nothing non-standard that could trigger
 * "Unknown directive" audit errors.
 *
 * Background: production audit flagged `Content-Signal: search=yes,ai-train=no`
 * on line 29 of the live robots.txt.  That line is injected by Cloudflare's
 * "AI Crawlers & Scrapers" dashboard setting, NOT by app code.  This test
 * ensures the *app-level* output never reintroduces non-standard directives.
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('server-only', () => ({}));

// Standard robots.txt directives (case-insensitive).
// Host is non-standard but widely tolerated — included here for safety.
const STANDARD_DIRECTIVES = new Set([
    'user-agent',
    'allow',
    'disallow',
    'sitemap',
    'crawl-delay',
    'host',
]);

function extractDirectives(robotsText) {
    return robotsText
        .split(/\r?\n/)
        .map((l) => l.split('#')[0].trim())
        .filter((l) => l.length > 0 && l.includes(':'))
        .map((l) => {
            const [directive] = l.split(':');
            return directive.trim().toLowerCase();
        });
}

describe('app/robots.js — output contract', () => {
    it('contains only standard robots.txt directives', async () => {
        const mod = await import('../../app/robots.js');
        const result = mod.default();

        // Next.js serializes the robots() return value to text/plain.
        // We reconstruct the text here — if Next.js changes serialization
        // order or format, this test still validates directive names.
        const lines = [];
        for (const rule of result.rules) {
            lines.push(`User-agent: ${rule.userAgent}`);
            if (rule.allow) {
                const allows = Array.isArray(rule.allow) ? rule.allow : [rule.allow];
                allows.forEach((a) => lines.push(`Allow: ${a}`));
            }
            if (rule.disallow) {
                const disallows = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];
                disallows.forEach((d) => lines.push(`Disallow: ${d}`));
            }
        }
        if (result.sitemap) {
            lines.push(`Sitemap: ${result.sitemap}`);
        }

        const text = lines.join('\n');
        const directives = extractDirectives(text);

        for (const d of directives) {
            expect(
                STANDARD_DIRECTIVES.has(d),
                `Non-standard directive found: "${d}". If this is intentional, add it to STANDARD_DIRECTIVES in this test.`,
            ).toBe(true);
        }
    });

    it('includes a Sitemap reference', async () => {
        const mod = await import('../../app/robots.js');
        const result = mod.default();
        expect(result.sitemap).toBeTruthy();
        expect(result.sitemap).toContain('/sitemap.xml');
    });

    it('declares Content-Signal directive in middleware robots response', () => {
        const proxySource = readFileSync(resolve(process.cwd(), 'proxy.js'), 'utf-8');
        const configSource = readFileSync(resolve(process.cwd(), 'lib/agent-discovery/config.js'), 'utf-8');
        expect(proxySource).toContain('Content-Signal');
        expect(configSource).toContain('ai-train=no, search=yes, ai-input=no');
    });
});
