import 'server-only';

import { callAiJson, callAiText } from '@/lib/ai/index';
import { normalizeGeoQueryAnalysis } from '@/lib/ai/normalize';
import { buildGeoQueryAnalysisPrompt, buildGeoQueryPrompt } from '@/lib/ai/prompts';
import { getBusinessShortDescription } from '@/lib/client-profile';
import * as db from '@/lib/db';
import { extractUrlsFromText, hostnameFromUrl } from '@/lib/geo-query-utils';

function resolveRunMode(trackedQueryId) {
    return trackedQueryId ? 'single_prompt' : 'active_batch';
}

export async function runTrackedQueriesForClient({
    clientId,
    trackedQueryId = null,
    performedBy = null,
    actionTypeOverride = null,
}) {
    const runMode = resolveRunMode(trackedQueryId);

    const client = await db.getClientById(clientId);
    const sourceQueries = trackedQueryId
        ? await db.getTrackedQueriesAll(clientId)
        : await db.getTrackedQueries(clientId, true);

    const queries = trackedQueryId
        ? sourceQueries.filter((query) => query.id === trackedQueryId)
        : sourceQueries;

    if (trackedQueryId && queries.length === 0) {
        return {
            notFound: true,
            message: 'Tracked prompt introuvable pour ce client.',
            runMode,
            trackedQueryId,
            runs: [],
        };
    }

    if (queries.length === 0) {
        return {
            clientId,
            runMode,
            trackedQueryId,
            totalQueries: 0,
            runs: [],
            message: 'Aucune requete active pour ce client. Ajoutez des tracked queries.',
        };
    }

    const businessContext = {
        name: client.client_name,
        description: getBusinessShortDescription(client.business_details) || client.seo_description || '',
        area: typeof client.address === 'object' ? (client.address?.city || client.address?.region || '') : '',
        services: client.business_details?.services || [],
    };

    const runs = [];

    for (const query of queries) {
        let queryRun = null;
        let aiResponse = null;
        let resolvedModel = 'unknown';

        try {
            queryRun = await db.createQueryRun({
                client_id: clientId,
                tracked_query_id: query.id,
                query_text: query.query_text,
                provider: 'pending',
                model: 'pending',
                response_text: null,
                status: 'pending',
                raw_analysis: {},
                parsed_response: {},
            });

            await db.updateQueryRun(queryRun.id, { status: 'running' });

            const queryMessages = buildGeoQueryPrompt(query.query_text, businessContext);
            aiResponse = await callAiText({ messages: queryMessages, purpose: 'query', maxTokens: 2048 });
            resolvedModel = process.env[`${String(aiResponse.provider).toUpperCase()}_MODEL_QUERY`] || 'unknown';

            const analysisMessages = buildGeoQueryAnalysisPrompt(query.query_text, aiResponse.text, client.client_name);
            const analysisResult = await callAiJson({ messages: analysisMessages, purpose: 'query', maxTokens: 2048 });

            const normalized = normalizeGeoQueryAnalysis({
                ...analysisResult.data,
                query: query.query_text,
                response_text: aiResponse.text,
            });

            const analysis = normalized.data;

            const parsedResponse = {
                label: 'GEO query run - AI recommendation check (visibility proxy)',
                query: query.query_text,
                target_found: analysis.target_found,
                target_position: analysis.target_position,
                total_businesses_mentioned: analysis.total_businesses_mentioned,
                mentioned_businesses: analysis.mentioned_businesses,
            };

            queryRun = await db.updateQueryRun(queryRun.id, {
                provider: aiResponse.provider,
                model: resolvedModel,
                response_text: aiResponse.text,
                target_found: analysis.target_found,
                target_position: analysis.target_position,
                total_mentioned: analysis.total_businesses_mentioned,
                raw_analysis: analysis,
                parsed_response: parsedResponse,
                status: 'completed',
            });

            const mentionRows = [];
            if (analysis.mentioned_businesses?.length > 0) {
                for (const mention of analysis.mentioned_businesses) {
                    mentionRows.push({
                        query_run_id: queryRun.id,
                        business_name: mention.name,
                        position: mention.position,
                        context: (mention.context || '').slice(0, 500),
                        is_target: mention.is_target,
                        sentiment: mention.sentiment || 'neutral',
                        entity_type: mention.is_target ? 'business' : 'competitor',
                    });
                }
            }

            const urls = extractUrlsFromText(aiResponse.text);
            let position = (analysis.mentioned_businesses?.length || 0) + 1;
            for (const url of urls) {
                const host = hostnameFromUrl(url);
                mentionRows.push({
                    query_run_id: queryRun.id,
                    business_name: host,
                    position: position++,
                    context: url.slice(0, 500),
                    is_target: false,
                    sentiment: 'neutral',
                    entity_type: 'source',
                });
            }

            if (mentionRows.length > 0) {
                await db.createQueryMentions(mentionRows);
            }

            runs.push({
                queryId: query.id,
                query: query.query_text,
                runId: queryRun.id,
                provider: aiResponse.provider,
                model: resolvedModel,
                targetFound: analysis.target_found,
                targetPosition: analysis.target_position,
                totalMentioned: analysis.total_businesses_mentioned,
            });
        } catch (queryError) {
            console.error(`[runTrackedQueriesForClient] Erreur pour query "${query.query_text}":`, queryError.message);

            try {
                if (queryRun?.id) {
                    await db.updateQueryRun(queryRun.id, {
                        provider: aiResponse?.provider || 'unknown',
                        model: resolvedModel || 'unknown',
                        response_text: aiResponse?.text || null,
                        status: 'failed',
                        raw_analysis: { error: queryError.message },
                        parsed_response: { error: queryError.message },
                    });
                } else {
                    await db.createQueryRun({
                        client_id: clientId,
                        tracked_query_id: query.id,
                        query_text: query.query_text,
                        provider: aiResponse?.provider || 'unknown',
                        model: resolvedModel || 'unknown',
                        response_text: aiResponse?.text || null,
                        status: 'failed',
                        raw_analysis: { error: queryError.message },
                        parsed_response: { error: queryError.message },
                    });
                }
            } catch (persistError) {
                console.error('[runTrackedQueriesForClient] Impossible d enregistrer l echec:', persistError.message);
            }

            runs.push({
                queryId: query.id,
                query: query.query_text,
                error: queryError.message,
            });
        }
    }

    await db.logAction({
        client_id: clientId,
        action_type: actionTypeOverride || (trackedQueryId ? 'geo_query_run_single' : 'geo_queries_run'),
        details: {
            mode: runMode,
            tracked_query_id: trackedQueryId || null,
            total_queries: queries.length,
            successful: runs.filter((run) => !run.error).length,
        },
        performed_by: performedBy || null,
    });

    return {
        clientId,
        runMode,
        trackedQueryId: trackedQueryId || null,
        totalQueries: queries.length,
        runs,
    };
}
