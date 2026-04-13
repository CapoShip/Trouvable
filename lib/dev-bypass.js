const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export const DEV_BYPASS_TURNSTILE_TOKEN = 'trouvable-dev-turnstile-bypass';

function stripPort(rawHost) {
    if (!rawHost) return '';

    if (rawHost.startsWith('[')) {
        const closingBracket = rawHost.indexOf(']');
        if (closingBracket > 0) {
            return rawHost.slice(1, closingBracket);
        }
    }

    const firstColon = rawHost.indexOf(':');
    if (firstColon === -1) {
        return rawHost;
    }

    if (rawHost.indexOf(':', firstColon + 1) !== -1) {
        return rawHost;
    }

    return rawHost.slice(0, firstColon);
}

export function normalizeHostname(value) {
    if (!value || typeof value !== 'string') return '';

    const firstValue = value.split(',')[0].trim();
    if (!firstValue) return '';

    try {
        if (firstValue.startsWith('http://') || firstValue.startsWith('https://')) {
            return new URL(firstValue).hostname.toLowerCase();
        }
    } catch {
        // Ignore invalid URL-like values and keep parsing as a raw host header.
    }

    return stripPort(firstValue).replace(/^\[|\]$/g, '').toLowerCase();
}

export function isLocalDevelopmentHost(hostname) {
    return LOCAL_HOSTS.has(normalizeHostname(hostname));
}

function isTruthyFlag(flagName) {
    return TRUE_VALUES.has(String(process.env[flagName] || '').trim().toLowerCase());
}

function isDevelopmentMode() {
    return process.env.NODE_ENV === 'development';
}

export function getHostFromHeaders(headersLike) {
    if (!headersLike || typeof headersLike.get !== 'function') return '';

    return normalizeHostname(
        headersLike.get('x-forwarded-host')
        || headersLike.get('host')
        || headersLike.get('origin')
        || ''
    );
}

export function getHostFromRequest(req) {
    if (!req) return '';

    return normalizeHostname(
        req.nextUrl?.hostname
        || req.nextUrl?.host
        || req.headers?.get?.('x-forwarded-host')
        || req.headers?.get?.('host')
        || req.headers?.get?.('origin')
        || ''
    );
}

function isBypassEnabledForHost(flagName, hostname) {
    return isDevelopmentMode()
        && isTruthyFlag(flagName)
        && isLocalDevelopmentHost(hostname);
}

export function isDevAuthBypassConfigured() {
    return isDevelopmentMode() && isTruthyFlag('DEV_BYPASS_AUTH');
}

export function isDevCloudflareBypassConfigured() {
    return isDevelopmentMode() && isTruthyFlag('DEV_BYPASS_CLOUDFLARE');
}

export function isDevAuthBypassAllowedForHeaders(headersLike) {
    return isBypassEnabledForHost('DEV_BYPASS_AUTH', getHostFromHeaders(headersLike));
}

export function isDevAuthBypassAllowedForRequest(req) {
    return isBypassEnabledForHost('DEV_BYPASS_AUTH', getHostFromRequest(req));
}

export function isDevCloudflareBypassAllowedForHeaders(headersLike) {
    return isBypassEnabledForHost('DEV_BYPASS_CLOUDFLARE', getHostFromHeaders(headersLike));
}

export function isDevCloudflareBypassAllowedForRequest(req) {
    return isBypassEnabledForHost('DEV_BYPASS_CLOUDFLARE', getHostFromRequest(req));
}

export function getDevAdminIdentity() {
    return {
        userId: process.env.DEV_BYPASS_ADMIN_USER_ID?.trim() || 'dev-local-admin',
        email: process.env.DEV_BYPASS_ADMIN_EMAIL?.trim().toLowerCase() || 'dev-admin@localhost',
        isDevBypass: true,
    };
}

export function isDevTurnstileToken(token) {
    return token === DEV_BYPASS_TURNSTILE_TOKEN;
}
