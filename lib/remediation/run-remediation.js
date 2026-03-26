import 'server-only';

import { callAiText } from '@/lib/ai/index';
import { getBusinessShortDescription } from '@/lib/client-profile';
import { getTrendSlice } from '@/lib/continuous/jobs';
import * as db from '@/lib/db';
import { problemsFromGeoRun, problemsFromGeoRuns, problemsFromJobRun, problemsFromTrendSlice } from '@/lib/remediation/problem-mapper';
import { buildRemediationPrompt } from '@/lib/remediation/prompt-builder';
import { insertRemediationSuggestion } from '@/lib/remediation/remediation-store';

function buildClientContext(client) {
    return {
        company_name: client?.client_name || null,
        company_short_description: getBusinessShortDescription(client?.business_details) || client?.seo_description || null,
        company_city: typeof client?.address === 'object' ? (client.address?.city || client.address?.region || null) : null,
        company_website: client?.website_url || null,
    };
}

function withClientContext(problem, context) {
    return {
        ...problem,
        context: {
            ...problem.context,
            ...context,
        },
    };
}

/**
 * Generates review-only AI remediation suggestions and stores them in remediation_suggestions.
 * Never applies AI output to client content or production data.
 */
export async function generateRemediationSuggestionsForClient(clientId) {
    const client = await db.getClientById(clientId);
    const [recentRuns, trendSlice] = await Promise.all([
        db.getRecentQueryRuns(clientId, 120),
        getTrendSlice(clientId),
    ]);

    const clientContext = buildClientContext(client);

    const problems = [];

    for (const run of recentRuns || []) {
        const mapped = problemsFromGeoRun(run, clientId).map((problem) => withClientContext(problem, clientContext));
        problems.push(...mapped);
    }

    const aggregateGeoProblems = problemsFromGeoRuns(recentRuns || [], clientId)
        .map((problem) => withClientContext(problem, clientContext));
    problems.push(...aggregateGeoProblems);

    const jobs = trendSlice?.jobs?.jobs || [];
    const jobRuns = trendSlice?.jobs?.runs || [];
    const latestRunByJobId = new Map();
    for (const run of jobRuns) {
        if (!run?.job_id) continue;
        if (!latestRunByJobId.has(run.job_id)) latestRunByJobId.set(run.job_id, run);
    }

    for (const job of jobs) {
        const latestRun = latestRunByJobId.get(job.id) || null;
        const mapped = problemsFromJobRun(latestRun, job, clientId).map((problem) => withClientContext(problem, clientContext));
        problems.push(...mapped);
    }

    const trendProblems = problemsFromTrendSlice(trendSlice, clientId).map((problem) => withClientContext(problem, clientContext));
    problems.push(...trendProblems);

    const deduped = [];
    const seen = new Set();
    for (const problem of problems) {
        if (!problem?.id || seen.has(problem.id)) continue;
        seen.add(problem.id);
        deduped.push(problem);
    }

    const suggestions = [];

    for (const problem of deduped) {
        const prompt = buildRemediationPrompt(problem);
        let aiOutput = null;

        try {
            const aiResponse = await callAiText({
                messages: [
                    { role: 'system', content: prompt.system },
                    { role: 'user', content: prompt.user },
                ],
                purpose: 'audit',
                maxTokens: 1800,
            });
            aiOutput = aiResponse?.text || null;
        } catch (error) {
            // We still persist the draft suggestion for human review even when AI generation fails.
            aiOutput = null;
            console.error('[Remediation] AI generation failed:', {
                clientId,
                problemId: problem.id,
                problemType: problem.type,
                error: error?.message || error,
            });
        }

        const stored = await insertRemediationSuggestion({
            clientId,
            problem,
            prompt,
            aiOutput,
        });

        suggestions.push(stored);
    }

    return {
        clientId,
        generatedAt: new Date().toISOString(),
        totalProblems: deduped.length,
        totalSuggestions: suggestions.length,
        suggestions,
    };
}
