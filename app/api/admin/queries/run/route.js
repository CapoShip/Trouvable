import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryRunPayloadSchema } from '@/lib/ai/schemas';
import { callAiText, callAiJson } from '@/lib/ai/index';
import { buildGeoQueryPrompt, buildGeoQueryAnalysisPrompt } from '@/lib/ai/prompts';
import { normalizeGeoQueryAnalysis } from '@/lib/ai/normalize';
import { getBusinessShortDescription } from '@/lib/client-profile';
import * as db from '@/lib/db';
import { extractUrlsFromText, hostnameFromUrl } from '@/lib/geo-query-utils';

function resolveRunMode(trackedQueryId) {
    return trackedQueryId ? 'single_prompt' : 'active_batch';
}

export async function POST(request) {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

    let body;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Payload JSON invalide' }, { status: 400 });
    }

    const validation = queryRunPayloadSchema.safeParse(body);
    if (!validation.success) {
        return NextResponse.json({ error: 'Payload invalide', details: validation.error.issues }, { status: 400 });
    }

    const { clientId, trackedQueryId } = validation.data;
    const runMode = resolveRunMode(trackedQueryId);

    try {
        const client = await db.getClientById(clientId);
        const sourceQueries = trackedQueryId
            ? await db.getTrackedQueriesAll(clientId)
            : await db.getTrackedQueries(clientId, true);

        const queries = trackedQueryId
            ? sourceQueries.filter((query) => query.id === trackedQueryId)
            : sourceQueries;

        if (trackedQueryId && queries.length === 0) {
            return NextResponse.json({ error: 'Tracked prompt introuvable pour ce client.' }, { status: 404 });
        }

        if (queries.length === 0) {
            return NextResponse.json({
                message: 'Aucune requete active pour ce client. Ajoutez des tracked queries.',
                runMode,
                trackedQueryId: trackedQueryId || null,
                runs: [],
            });
        }

        const businessContext = {
            name: client.client_name,
            description: getBusinessShortDescription(client.business_details) || client.seo_description || '',
            area: typeof client.address === 'object' ? (client.address?.city || client.address?.region || '') : '',
            services: client.business_details?.services || [],
        };

        const runs = [];

        for (const tq of queries) {
            let queryRun = null;
            let aiResponse = null;
            let resolvedModel = 'unknown';
            try {
                queryRun = await db.createQueryRun({
                    client_id: clientId,
                    tracked_query_id: tq.id,
                    query_text: tq.query_text,
                    provider: 'pending',
                    model: 'pending',
                    response_text: null,
                    status: 'pending',
                    raw_analysis: {},
                    parsed_response: {},
                });

                await db.updateQueryRun(queryRun.id, { status: 'running' });

                const queryMessages = buildGeoQueryPrompt(tq.query_text, businessContext);
                aiResponse = await callAiText({ messages: queryMessages, purpose: 'query', maxTokens: 2048 });
                resolvedModel = process.env[`${String(aiResponse.provider).toUpperCase()}_MODEL_QUERY`] || 'unknown';

                const analysisMessages = buildGeoQueryAnalysisPrompt(tq.query_text, aiResponse.text, client.client_name);
                const analysisResult = await callAiJson({ messages: analysisMessages, purpose: 'query', maxTokens: 2048 });

                const normalized = normalizeGeoQueryAnalysis({
                    ...analysisResult.data,
                    query: tq.query_text,
                    response_text: aiResponse.text,
                });

                const analysis = normalized.data;

                const parsedResponse = {
                    label: 'GEO query run - AI recommendation check (visibility proxy)',
                    query: tq.query_text,
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
                    queryId: tq.id,
                    query: tq.query_text,
                    runId: queryRun.id,
                    provider: aiResponse.provider,
                    model: resolvedModel,
                    targetFound: analysis.target_found,
                    targetPosition: analysis.target_position,
                    totalMentioned: analysis.total_businesses_mentioned,
                });
            } catch (queryErr) {
                console.error(`[API/queries/run] Erreur pour query "${tq.query_text}":`, queryErr.message);
                try {
                    if (queryRun?.id) {
                        await db.updateQueryRun(queryRun.id, {
                            provider: aiResponse?.provider || 'unknown',
                            model: resolvedModel || 'unknown',
                            response_text: aiResponse?.text || null,
                            status: 'failed',
                            raw_analysis: { error: queryErr.message },
                            parsed_response: { error: queryErr.message },
                        });
                    } else {
                        await db.createQueryRun({
                            client_id: clientId,
                            tracked_query_id: tq.id,
                            query_text: tq.query_text,
                            provider: aiResponse?.provider || 'unknown',
                            model: resolvedModel || 'unknown',
                            response_text: aiResponse?.text || null,
                            status: 'failed',
                            raw_analysis: { error: queryErr.message },
                            parsed_response: { error: queryErr.message },
                        });
                    }
                } catch (error) {
                    console.error('[API/queries/run] Impossible d enregistrer l echec:', error.message);
                }
                runs.push({
                    queryId: tq.id,
                    query: tq.query_text,
                    error: queryErr.message,
                });
            }
        }

        await db.logAction({
            client_id: clientId,
            action_type: trackedQueryId ? 'geo_query_run_single' : 'geo_queries_run',
            details: {
                mode: runMode,
                tracked_query_id: trackedQueryId || null,
                total_queries: queries.length,
                successful: runs.filter((run) => !run.error).length,
            },
            performed_by: admin.email,
        });

        return NextResponse.json({
            clientId,
            runMode,
            trackedQueryId: trackedQueryId || null,
            totalQueries: queries.length,
            runs,
        });
    } catch (err) {
        console.error('[API/queries/run] Erreur:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
