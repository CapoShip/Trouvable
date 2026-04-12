/**
 * CSP policy structure tests — ensures the Content-Security-Policy stays
 * hardened and doesn't regress.  Validates both proxy.js and vercel.json
 * express the same policy and that dangerous directives stay removed.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── helpers ──────────────────────────────────────────────────────────────────

function extractProxyCsp() {
    const src = readFileSync(resolve(process.cwd(), 'proxy.js'), 'utf-8');
    // Match the array passed to .join('; ')
    const match = src.match(/const cspHeader = \[([\s\S]*?)\]\.join/);
    if (!match) throw new Error('Could not extract CSP from proxy.js');
    // Support both single and double quoted string literals
    const entries = [...match[1].matchAll(/(['"])(.*?)\1/g)].map((m) => m[2]);
    if (entries.length < 5) throw new Error(`Expected ≥5 CSP directives, got ${entries.length}`);
    return entries.join('; ');
}

function extractVercelCsp() {
    const json = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf-8'));
    const globalHeaders = json.headers.find((h) => h.source === '/(.*)')?.headers ?? [];
    const cspEntry = globalHeaders.find((h) => h.key === 'Content-Security-Policy');
    if (!cspEntry?.value) return '';
    // Normalize: split → trim → rejoin for consistent comparison with proxy.js output
    return cspEntry.value.split(';').map((s) => s.trim()).filter(Boolean).join('; ');
}

function parseDirectives(csp) {
    const map = {};
    for (const part of csp.split(';')) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        const [name, ...values] = trimmed.split(/\s+/);
        map[name] = values;
    }
    return map;
}

// ── tests ────────────────────────────────────────────────────────────────────

describe('CSP policy hardening', () => {
    const proxyCsp = extractProxyCsp();
    const vercelCsp = extractVercelCsp();
    const proxyDir = parseDirectives(proxyCsp);
    const vercelDir = parseDirectives(vercelCsp);

    // Phase B regression guards
    it("script-src does NOT contain 'unsafe-eval'", () => {
        expect(proxyDir['script-src']).not.toContain("'unsafe-eval'");
        expect(vercelDir['script-src']).not.toContain("'unsafe-eval'");
    });

    it('style-src does NOT allow external Google Fonts', () => {
        expect(proxyDir['style-src']).not.toContain('https://fonts.googleapis.com');
        expect(vercelDir['style-src']).not.toContain('https://fonts.googleapis.com');
    });

    it('font-src does NOT allow external Google Fonts', () => {
        expect(proxyDir['font-src']).not.toContain('https://fonts.gstatic.com');
        expect(vercelDir['font-src']).not.toContain('https://fonts.gstatic.com');
    });

    it('includes frame-ancestors none', () => {
        expect(proxyDir['frame-ancestors']).toEqual(["'none'"]);
        expect(vercelDir['frame-ancestors']).toEqual(["'none'"]);
    });

    it('includes upgrade-insecure-requests', () => {
        expect(proxyDir).toHaveProperty('upgrade-insecure-requests');
        expect(vercelDir).toHaveProperty('upgrade-insecure-requests');
    });

    it("object-src is 'none'", () => {
        expect(proxyDir['object-src']).toEqual(["'none'"]);
        expect(vercelDir['object-src']).toEqual(["'none'"]);
    });

    it("base-uri is 'self'", () => {
        expect(proxyDir['base-uri']).toEqual(["'self'"]);
        expect(vercelDir['base-uri']).toEqual(["'self'"]);
    });

    // Alignment guard — both sources must express the same directives
    it('proxy.js and vercel.json CSP directives are aligned', () => {
        const proxyKeys = Object.keys(proxyDir).sort();
        const vercelKeys = Object.keys(vercelDir).sort();
        expect(proxyKeys).toEqual(vercelKeys);

        for (const key of proxyKeys) {
            expect(proxyDir[key].sort(), `directive ${key}`).toEqual(vercelDir[key].sort());
        }
    });

    // Ensure essential integrations are still allowed
    it('allows Clerk domains in script-src', () => {
        expect(proxyDir['script-src']).toContain('https://*.clerk.com');
    });

    it('allows Turnstile domain in script-src', () => {
        expect(proxyDir['script-src']).toContain('https://challenges.cloudflare.com');
    });

    it('allows Vercel Analytics in script-src', () => {
        expect(proxyDir['script-src']).toContain('https://va.vercel-scripts.com');
    });

    it('allows Supabase in connect-src', () => {
        expect(proxyDir['connect-src']).toContain('https://*.supabase.co');
    });
});
