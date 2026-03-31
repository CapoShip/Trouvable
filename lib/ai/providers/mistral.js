import 'server-only';

import { Mistral } from '@mistralai/mistralai';

import { scheduleMistralRequest } from '@/lib/llm-comparison/mistral-rate-limit';

const DEFAULT_TIMEOUT = 30_000;
const MAX_RETRIES = 2;

function getApiKey() {
    const key = process.env.MISTRAL_API_KEY;
    if (!key) throw new Error('[AI/Mistral] MISTRAL_API_KEY manquante');
    return key;
}

function getModel(purpose = 'audit') {
    if (purpose === 'query') return process.env.MISTRAL_MODEL_QUERY || process.env.MISTRAL_MODEL_COMPARE || 'mistral-small-2603';
    return process.env.MISTRAL_MODEL_AUDIT || process.env.MISTRAL_MODEL_COMPARE || 'mistral-small-2603';
}

function withTimeout(promise, timeoutMs = DEFAULT_TIMEOUT) {
    let timer = null;
    const timeoutPromise = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`[AI/Mistral] Timeout apres ${timeoutMs}ms`)), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

export async function callMistral({
    messages,
    purpose = 'audit',
    temperature = 0.2,
    maxTokens = 4096,
    modelOverride = null,
}) {
    const apiKey = getApiKey();
    const client = new Mistral({ apiKey });
    const model = modelOverride || getModel(purpose);

    let lastError = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await scheduleMistralRequest(() => withTimeout(client.chat.complete({
                model,
                temperature,
                maxTokens,
                messages,
            }), DEFAULT_TIMEOUT));

            const usage = response?.usage || {};
            return {
                text: String(response?.choices?.[0]?.message?.content || ''),
                usage: {
                    prompt_tokens: Number(usage.promptTokens || usage.prompt_tokens || 0),
                    completion_tokens: Number(usage.completionTokens || usage.completion_tokens || 0),
                },
                model,
            };
        } catch (error) {
            lastError = error;
            const message = String(error?.message || '');
            const shouldRetry = message.includes('429') || message.toLowerCase().includes('rate') || message.toLowerCase().includes('timeout');
            if (attempt < MAX_RETRIES && shouldRetry) {
                const wait = Math.min(2000 * 2 ** attempt, 8000);
                console.warn(`[AI/Mistral] Erreur: ${message}. Retry ${attempt + 1}/${MAX_RETRIES} dans ${wait}ms...`);
                await new Promise((resolve) => setTimeout(resolve, wait));
                continue;
            }
        }
    }

    throw lastError || new Error('[AI/Mistral] Echec appel provider');
}
