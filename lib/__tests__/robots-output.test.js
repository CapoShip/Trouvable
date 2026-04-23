import { describe, it, expect } from 'vitest';

import { buildRobotsTxt, CONTENT_SIGNAL_VALUE } from '../agent-discovery/config';

describe('/robots.txt content signals contract', () => {
    it('includes Content-Signal directives in robots.txt body', () => {
        const text = buildRobotsTxt();
        const lines = text.split('\n');
        const firstBlankLineIndex = lines.indexOf('');
        const contentSignalLineIndex = lines.findIndex((line) => line.startsWith('Content-Signal: '));

        expect(text).toContain('User-agent: *');
        expect(text).toContain('Allow: /');
        expect(text).toContain('Disallow: /admin/');
        expect(text).toContain('Disallow: /portal/');
        expect(text).toContain('Disallow: /espace/');
        expect(text).toContain('Disallow: /api/');
        expect(text).toContain('Sitemap:');
        expect(text).toContain(`Content-Signal: ${CONTENT_SIGNAL_VALUE}`);
        expect(text).toContain('ai-train=yes');
        expect(text).toContain('search=yes');
        expect(text).toContain('ai-input=yes');
        expect(contentSignalLineIndex).toBeGreaterThan(-1);
        expect(firstBlankLineIndex).toBeGreaterThan(-1);
        expect(contentSignalLineIndex).toBeLessThan(firstBlankLineIndex);
    });

    it('serves /robots.txt as text/plain with Content-Signal response header', async () => {
        const mod = await import('../../app/robots.txt/route.js');
        const response = mod.GET(new Request('https://www.trouvable.app/robots.txt'));

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toContain('text/plain');
        expect(response.headers.get('content-signal')).toBe(CONTENT_SIGNAL_VALUE);

        const body = await response.text();
        expect(body).toContain(`Content-Signal: ${CONTENT_SIGNAL_VALUE}`);
    });
});
