import { SITE_URL } from '@/lib/site-config';

export const CONTENT_SIGNAL_VALUE = 'ai-train=yes, search=yes, ai-input=yes';

export const HOME_DISCOVERY_LINKS = [
    '</.well-known/api-catalog>; rel="api-catalog"',
    '</docs/api>; rel="service-doc"; type="text/html"',
    '</.well-known/openapi.json>; rel="service-desc"; type="application/openapi+json"',
    '</api/health>; rel="status"; type="application/json"',
    '</markdown?path=%2F>; rel="alternate"; type="text/markdown"',
    '</rss.xml>; rel="alternate"; type="application/rss+xml"',
    '</.well-known/ai.txt>; rel="alternate"; type="text/plain"',
    '</.well-known/webmcp.json>; rel="alternate"; type="application/json"',
    '</.well-known/mcp/server-card.json>; rel="service-desc"; type="application/json"',
    '</mcp>; rel="service"; type="application/json"',
];

export function buildRobotsTxt() {
    return [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin/',
        'Disallow: /portal/',
        'Disallow: /espace/',
        'Disallow: /api/',
        `Content-Signal: ${CONTENT_SIGNAL_VALUE}`,
        '',
        `Sitemap: ${SITE_URL}/sitemap.xml`,
        '',
    ].join('\n');
}

export function getRequestOrigin(request) {
    try {
        return new URL(request.url).origin;
    } catch {
        return SITE_URL;
    }
}

export function parseAcceptHeader(value) {
    if (typeof value !== 'string') return [];

    return value
        .split(',')
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean);
}

export function acceptsMarkdown(request) {
    const accepts = parseAcceptHeader(request.headers.get('accept'));
    return accepts.some((value) => value.startsWith('text/markdown'));
}
