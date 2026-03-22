/**
 * Extrait des URLs candidates depuis une réponse texte (sources citées par le modèle).
 */
export function extractUrlsFromText(text) {
    if (!text || typeof text !== 'string') return [];
    const urlRegex = /https?:\/\/[^\s\])"'<>]+/gi;
    const raw = text.match(urlRegex) || [];
    const cleaned = raw.map((u) => u.replace(/[.,;:)]+$/, ''));
    return [...new Set(cleaned)].slice(0, 30);
}

export function hostnameFromUrl(url) {
    try {
        const u = new URL(url.startsWith('http') ? url : `https://${url}`);
        return normalizeDomainHost(u.hostname);
    } catch {
        return normalizeDomainHost(url.slice(0, 120));
    }
}

export function normalizeDomainHost(value) {
    if (!value) return '';
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .replace(/[/?#].*$/, '')
        .replace(/:\d+$/, '')
        .replace(/\.$/, '');
}
