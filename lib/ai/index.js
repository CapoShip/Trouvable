import 'server-only';
import { callGroq } from './providers/groq.js';
import { callGemini } from './providers/gemini.js';

const PROVIDERS = { groq: callGroq, gemini: callGemini };

function getProvider(name) {
    const fn = PROVIDERS[name];
    if (!fn) throw new Error(`[AI] Provider inconnu: "${name}"`);
    return fn;
}

function getPrimary() {
    return process.env.AI_PRIMARY_PROVIDER || 'groq';
}

function getFallback() {
    return process.env.AI_FALLBACK_PROVIDER || 'gemini';
}

/**
 * Appelle le provider principal, puis le fallback en cas d'échec.
 * @returns {Promise<{text:string, usage:object, provider:string}>}
 */
export async function callAiText({ messages, purpose = 'audit', temperature = 0.2, maxTokens = 4096 }) {
    const primary = getPrimary();
    const fallback = getFallback();

    try {
        const result = await getProvider(primary)({ messages, purpose, jsonMode: false, temperature, maxTokens });
        return { ...result, provider: primary };
    } catch (primaryErr) {
        console.warn(`[AI] ${primary} échoué: ${primaryErr.message}. Fallback → ${fallback}`);
        try {
            const result = await getProvider(fallback)({ messages, purpose, jsonMode: false, temperature, maxTokens });
            return { ...result, provider: fallback };
        } catch (fallbackErr) {
            throw new Error(`[AI] Tous les providers ont échoué. Primary(${primary}): ${primaryErr.message} | Fallback(${fallback}): ${fallbackErr.message}`);
        }
    }
}

/**
 * Comme callAiText mais force le mode JSON et parse la réponse.
 * @returns {Promise<{data:object, usage:object, provider:string}>}
 */
export async function callAiJson({ messages, purpose = 'audit', temperature = 0.1, maxTokens = 4096 }) {
    const primary = getPrimary();
    const fallback = getFallback();

    async function tryProvider(name) {
        const result = await getProvider(name)({ messages, purpose, jsonMode: true, temperature, maxTokens });
        const parsed = parseJsonResponse(result.text);
        return { data: parsed, usage: result.usage, provider: name };
    }

    try {
        return await tryProvider(primary);
    } catch (primaryErr) {
        console.warn(`[AI] ${primary} JSON échoué: ${primaryErr.message}. Fallback → ${fallback}`);
        try {
            return await tryProvider(fallback);
        } catch (fallbackErr) {
            throw new Error(`[AI] JSON: tous échoué. Primary: ${primaryErr.message} | Fallback: ${fallbackErr.message}`);
        }
    }
}

/**
 * Appel explicite avec fallback, retourne le résultat brut + provider.
 */
export async function callAiWithFallback(params) {
    if (params.jsonMode) return callAiJson(params);
    return callAiText(params);
}

/**
 * Parse du JSON depuis une réponse LLM (gère les markdown fences).
 */
function parseJsonResponse(text) {
    if (!text || !text.trim()) throw new Error('[AI] Réponse vide, impossible de parser en JSON');

    let cleaned = text.trim();

    const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
    if (fenceMatch) cleaned = fenceMatch[1].trim();

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        const startIdx = cleaned.indexOf('{');
        const endIdx = cleaned.lastIndexOf('}');
        if (startIdx !== -1 && endIdx > startIdx) {
            try {
                return JSON.parse(cleaned.slice(startIdx, endIdx + 1));
            } catch { /* fall through */ }
        }

        const arrStart = cleaned.indexOf('[');
        const arrEnd = cleaned.lastIndexOf(']');
        if (arrStart !== -1 && arrEnd > arrStart) {
            try {
                return JSON.parse(cleaned.slice(arrStart, arrEnd + 1));
            } catch { /* fall through */ }
        }

        throw new Error(`[AI] JSON invalide: ${cleaned.slice(0, 200)}...`);
    }
}
