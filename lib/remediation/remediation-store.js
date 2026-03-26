import { getAdminSupabase } from '@/lib/supabase-admin';

// TODO: creer la table remediation_suggestions dans la base (SQL/migration).

/**
 * @typedef {Object} RemediationSuggestion
 * @property {string} id
 * @property {string} client_id
 * @property {string} problem_type
 * @property {string} problem_source
 * @property {string} severity
 * @property {'draft' | 'approved' | 'applied' | 'discarded'} status
 * @property {string} prompt_system
 * @property {string} prompt_user
 * @property {string | null} ai_output
 * @property {string} created_at
 */

/**
 * Persists one remediation suggestion as review-only draft.
 * @param {{
 *  clientId: string,
 *  problem: import('./problem-types').Problem,
 *  prompt: import('./prompt-builder').RemediationPrompt,
 *  aiOutput: string | null,
 * }} input
 * @returns {Promise<RemediationSuggestion>}
 */
export async function insertRemediationSuggestion(input) {
    const supabase = getAdminSupabase();
    const payload = {
        client_id: input.clientId,
        problem_type: input.problem.type,
        problem_source: input.problem.source,
        severity: input.problem.severity,
        status: 'draft',
        prompt_system: input.prompt.system,
        prompt_user: input.prompt.user,
        ai_output: input.aiOutput,
    };

    const { data, error } = await supabase
        .from('remediation_suggestions')
        .insert(payload)
        .select('*')
        .single();

    if (error) {
        throw new Error(`[RemediationStore] insertRemediationSuggestion: ${error.message}`);
    }

    return data;
}

/**
 * Lists remediation suggestions for one client.
 * @param {string} clientId
 * @returns {Promise<RemediationSuggestion[]>}
 */
export async function listRemediationSuggestionsForClient(clientId) {
    const supabase = getAdminSupabase();

    const { data, error } = await supabase
        .from('remediation_suggestions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(`[RemediationStore] listRemediationSuggestionsForClient: ${error.message}`);
    }

    return data || [];
}
