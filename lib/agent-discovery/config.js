import { SITE_URL } from '@/lib/site-config';

export const CONTENT_SIGNAL_VALUE = 'ai-train=no, search=yes, ai-input=no';

export const HOME_DISCOVERY_LINKS = [
    '</.well-known/api-catalog>; rel="api-catalog"',
    '</docs/api>; rel="service-doc"; type="text/html"',
    '</.well-known/openapi.json>; rel="service-desc"; type="application/openapi+json"',
    '</api/health>; rel="status"; type="application/json"',
    '</>; rel="alternate"; type="text/markdown"',
];

export function buildRobotsTxt() {
    return [
        'User-agent: *',
        'Allow: /',
        'Disallow: /admin/',
        'Disallow: /portal/',
        'Disallow: /espace/',
        'Disallow: /api/',
        '',
        `Sitemap: ${SITE_URL}/sitemap.xml`,
        '',
        '# Content Signals policy',
        `Content-Signal: ${CONTENT_SIGNAL_VALUE}`,
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
