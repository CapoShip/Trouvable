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
        return u.hostname.replace(/^www\./, '');
    } catch {
        return url.slice(0, 120);
    }
}
