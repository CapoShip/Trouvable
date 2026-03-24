import 'server-only';

import { callAiJson, callAiText } from '@/lib/ai/index';
import { normalizeGeoQueryAnalysis } from '@/lib/ai/normalize';
import { buildGeoQueryAnalysisPrompt, buildGeoQueryPrompt } from '@/lib/ai/prompts';
import { getBusinessShortDescription } from '@/lib/client-profile';
import * as db from '@/lib/db';
import { getExtractionVersion, buildExtractionArtifacts } from '@/lib/queries/extraction-v2';
import { resolveRequestedBenchmarkVariants, runBenchmarkVariant } from '@/lib/queries/engine-variants';

function nowMs() {
    return Date.now();
}

function resolveRunMode(trackedQueryId, runMode) {
    if (runMode === 'benchmark') return 'benchmark';
    return trackedQueryId ? 'single_prompt' : 'active_batch';
}

function normalizeKnownCompetitors(client = {}, competitorAliases = []) {
    const profileCompetitors = Array.isArray(client?.business_details?.competitors)
        ? client.business_details.competitors
        : [];

    const aliasCanonicals = (competitorAliases || [])
        .map((row) => String(row?.canonical_name || '').trim())
        .filter(Boolean);

    return [...new Set([...profileCompetitors, ...aliasCanonicals].map((value) => String(value || '').trim()).filter(Boolean))];
}

function toUsageTotals(queryUsage = {}, analysisUsage = {}) {
    const queryPrompt = Number(queryUsage.prompt_tokens || 0);
    const queryCompletion = Number(queryUsage.completion_tokens || 0);
    const analysisPrompt = Number(analysisUsage.prompt_tokens || 0);
    const analysisCompletion = Number(analysisUsage.completion_tokens || 0);

    return {
        query: {
            prompt_tokens: queryPrompt,
            completion_tokens: queryCompletion,
            total_tokens: queryPrompt + queryCompletion,
        },
        analysis: {
            prompt_tokens: analysisPrompt,
            completion_tokens: analysisCompletion,
            total_tokens: analysisPrompt + analysisCompletion,
        },
        total_tokens: queryPrompt + queryCompletion + analysisPrompt + analysisCompletion,
    };
}

function classifyRunError(errorMessage = '') {
    const message = String(errorMessage || '').toLowerCase();
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('rate') || message.includes('429')) return 'rate_limit';
    if (message.includes('provider') || message.includes('api key') || message.includes('http')) return 'provider_error';
    if (message.includes('parse') || message.includes('json')) return 'parse_error';
    return 'runtime_error';
}

function mapMentionsForInsert(queryRunId, mentions = []) {
    return (mentions || []).map((item, index) => ({
        query_run_id: queryRunId,
        business_name: item.business_name || item.normalized_label || '[unknown mention]',
        position: Number.isFinite(Number(item.position)) ? Number(item.position) : (index + 1),
        context: String(item.context || item.evidence_span || '').slice(0, 2000),
        is_target: item.is_target === true,
        sentiment: item.sentiment || 'neutral',
        entity_type: item.entity_type || 'business',
        mention_kind: item.mention_kind || 'mentioned',
        mentioned_url: item.mentioned_url || null,
        mentioned_domain: item.mentioned_domain || null,
        mentioned_source_name: item.mentioned_source_name || null,
        normalized_domain: item.normalized_domain || null,
        normalized_label: item.normalized_label || null,
        source_type: item.source_type || null,
        source_confidence: item.source_confidence ?? item.confidence ?? null,
        source_evidence_span: item.source_evidence_span || null,
        evidence_span: item.evidence_span || null,
        confidence: item.confidence ?? null,
        first_position: item.first_position ?? item.position ?? null,
        co_occurs_with_target: item.co_occurs_with_target === true,
        verified_status: item.verified_status || 'mentioned',
        recommendation_strength: item.recommendation_strength || null,
    }));
}

async function executeVariantForQuery({
    client,
    query,
    businessContext,
    knownCompetitors,
    competitorAliases,
    runMode = 'standard',
    engineVariant = 'tavily_orchestrated',
    benchmarkSessionId = null,
}) {
    const locale = query.locale || 'fr-CA';
    const extractionVersion = getExtractionVersion();
    let queryRun = null;
    let aiResponse = null;
    let analysisResult = null;
    const startedAtMs = nowMs();

    try {
        queryRun = await db.createQueryRun({
            client_id: client.id,
            tracked_query_id: query.id,
            query_text: query.query_text,
            provider: 'pending',
            model: 'pending',
            locale,
            status: 'pending',
            run_mode: runMode === 'benchmark' ? 'benchmark' : 'standard',
            engine_variant: engineVariant,
            benchmark_session_id: benchmarkSessionId,
            response_text: null,
            raw_response_full: null,
            raw_analysis: {},
            parsed_response: {},
            normalized_response: {},
            parse_status: 'parsed_failed',
            parse_warnings: [],
            usage_tokens: {},
            extraction_version: extractionVersion,
            target_detection: {},
            retry_count: 0,
        });

        await db.updateQueryRun(queryRun.id, { status: 'running' });

        const queryMessages = buildGeoQueryPrompt(query.query_text, businessContext);
        const analysisContext = {
            prompt_payload: {
                query_messages: queryMessages,
            },
        };

        if (runMode === 'benchmark') {
            const benchmarkResult = await runBenchmarkVariant({
                variant: engineVariant,
                messages: queryMessages,
                purpose: 'query',
                maxTokens: 2048,
            });

            if (!benchmarkResult.ok) {
                const latencyMs = nowMs() - startedAtMs;
                const errorMessage = benchmarkResult.error_message || 'Benchmark variant indisponible';
                await db.updateQueryRun(queryRun.id, {
                    provider: benchmarkResult.provider || 'unknown',
                    model: benchmarkResult.model || 'unknown',
                    status: 'failed',
                    error_class: benchmarkResult.error_class || 'variant_unavailable',
                    response_text: null,
                    raw_response_full: null,
                    parse_status: 'parsed_failed',
                    parse_warnings: [errorMessage],
                    latency_ms: latencyMs,
                    raw_analysis: {
                        benchmark_result: benchmarkResult,
                        ...analysisContext,
                    },
                    usage_tokens: {},
                });

                return {
                    queryId: query.id,
                    query: query.query_text,
                    runId: queryRun.id,
                    variant: engineVariant,
                    error: errorMessage,
                };
            }

            aiResponse = {
                provider: benchmarkResult.provider,
                model: benchmarkResult.model,
                text: benchmarkResult.text || '',
                usage: benchmarkResult.usage || {},
                sandbox_caveat: benchmarkResult.sandbox_caveat || null,
                cost_estimate_usd: benchmarkResult.cost_estimate_usd ?? null,
            };
        } else {
            const result = await callAiText({
                messages: queryMessages,
                purpose: 'query',
                maxTokens: 2048,
            });
            aiResponse = {
                provider: result.provider,
                model: result.model || process.env[`${String(result.provider).toUpperCase()}_MODEL_QUERY`] || 'unknown',
                text: result.text || '',
                usage: result.usage || {},
                sandbox_caveat: null,
                cost_estimate_usd: null,
            };
        }

        const analysisMessages = buildGeoQueryAnalysisPrompt(query.query_text, aiResponse.text, client.client_name);
        analysisResult = await callAiJson({
            messages: analysisMessages,
            purpose: 'query',
            maxTokens: 2048,
        });

        const normalizedAnalysis = normalizeGeoQueryAnalysis({
            ...analysisResult.data,
            query: query.query_text,
            response_text: aiResponse.text,
        });

        const extraction = buildExtractionArtifacts({
            queryText: query.query_text,
            responseText: aiResponse.text,
            analysis: normalizedAnalysis.data,
            clientName: client.client_name,
            clientDomain: client.website_url || null,
            competitorAliases,
            knownCompetitors,
        });

        const usageTokens = toUsageTotals(aiResponse.usage || {}, analysisResult.usage || {});
        const latencyMs = nowMs() - startedAtMs;
        const parsedResponse = {
            label: 'Execution GEO - verite capturee complete',
            query: query.query_text,
            target_found: extraction.targetDetection.target_found,
            target_position: extraction.targetDetection.target_position,
            total_businesses_mentioned: extraction.counts.total,
            parse_status: extraction.parseStatus,
            run_signal_tier: extraction.diagnostics.run_signal_tier,
            zero_citation_reason: extraction.diagnostics.zero_citation_reason,
            zero_competitor_reason: extraction.diagnostics.zero_competitor_reason,
            operator_reason_codes: extraction.diagnostics.operator_reason_codes || [],
        };

        await db.updateQueryRun(queryRun.id, {
            provider: aiResponse.provider || 'unknown',
            model: aiResponse.model || 'unknown',
            locale,
            response_text: aiResponse.text,
            raw_response_full: aiResponse.text,
            target_found: extraction.targetDetection.target_found,
            target_position: extraction.targetDetection.target_position,
            total_mentioned: extraction.counts.total,
            raw_analysis: {
                analysis_data: normalizedAnalysis.data,
                analysis_provider: analysisResult.provider || null,
                analysis_model: analysisResult.model || null,
                normalized_success: normalizedAnalysis.success === true,
                normalized_errors: normalizedAnalysis.errors || null,
                extraction_layers: {
                    literal: extraction.rawLayer,
                    parsed: extraction.parsedLayer,
                    normalized: extraction.normalizedLayer,
                    verified: extraction.verifiedLayer,
                },
                diagnostics: extraction.diagnostics,
                benchmark: {
                    sandbox_caveat: aiResponse.sandbox_caveat || null,
                    cost_estimate_usd: aiResponse.cost_estimate_usd,
                },
                ...analysisContext,
            },
            parsed_response: parsedResponse,
            normalized_response: extraction.normalizedResponse,
            parse_status: extraction.parseStatus,
            parse_warnings: extraction.parseWarnings,
            parse_confidence: extraction.parseConfidence,
            latency_ms: latencyMs,
            usage_tokens: usageTokens,
            error_class: null,
            extraction_version: extractionVersion,
            run_mode: runMode === 'benchmark' ? 'benchmark' : 'standard',
            engine_variant: engineVariant,
            benchmark_session_id: benchmarkSessionId,
            target_detection: extraction.targetDetection,
            status: 'completed',
        });

        const mentionRows = mapMentionsForInsert(queryRun.id, extraction.mentionRows);
        if (mentionRows.length > 0) {
            await db.createQueryMentions(mentionRows);
        } else {
            console.warn(`[runTrackedQueries] Run ${queryRun.id} (${engineVariant}) extracted 0 mentions. Source reason: ${extraction.diagnostics?.zero_citation_reason}, Competitor reason: ${extraction.diagnostics?.zero_competitor_reason}`);
        }

        return {
            queryId: query.id,
            query: query.query_text,
            runId: queryRun.id,
            variant: engineVariant,
            provider: aiResponse.provider,
            model: aiResponse.model,
            targetFound: extraction.targetDetection.target_found,
            targetPosition: extraction.targetDetection.target_position,
            totalMentioned: extraction.counts.total,
            citations: extraction.counts.sources,
            competitors: extraction.counts.competitors,
            parseStatus: extraction.parseStatus,
            parseConfidence: extraction.parseConfidence,
            latencyMs,
            costEstimateUsd: aiResponse.cost_estimate_usd,
        };
    } catch (queryError) {
        const message = queryError?.message || 'Execution run impossible';
        const latencyMs = nowMs() - startedAtMs;
        const errorClass = classifyRunError(message);

        if (queryRun?.id) {
            await db.updateQueryRun(queryRun.id, {
                provider: aiResponse?.provider || 'unknown',
                model: aiResponse?.model || 'unknown',
                response_text: aiResponse?.text || null,
                raw_response_full: aiResponse?.text || null,
                status: 'failed',
                error_class: errorClass,
                parse_status: 'parsed_failed',
                parse_warnings: [message],
                raw_analysis: {
                    error: message,
                    analysis_data: analysisResult?.data || null,
                },
                parsed_response: { error: message },
                normalized_response: {},
                latency_ms: latencyMs,
            });
        }

        return {
            queryId: query.id,
            query: query.query_text,
            runId: queryRun?.id || null,
            variant: engineVariant,
            error: message,
        };
    }
}

export async function runTrackedQueriesForClient({
    clientId,
    trackedQueryId = null,
    performedBy = null,
    actionTypeOverride = null,
    runMode = 'standard',
    benchmarkSessionId = null,
    benchmarkVariants = [],
}) {
    const mode = resolveRunMode(trackedQueryId, runMode);
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
            message: 'Prompt suivi introuvable pour ce client.',
            runMode: mode,
            trackedQueryId,
            runs: [],
        };
    }

    if (queries.length === 0) {
        return {
            clientId,
            runMode: mode,
            trackedQueryId,
            totalQueries: 0,
            runs: [],
            message: 'Aucune requete active pour ce client.',
        };
    }

    const competitorAliases = await db.getCompetitorAliases(clientId).catch(() => []);
    const knownCompetitors = normalizeKnownCompetitors(client, competitorAliases);

    const businessContext = {
        name: client.client_name,
        description: getBusinessShortDescription(client.business_details) || client.seo_description || '',
        area: typeof client.address === 'object' ? (client.address?.city || client.address?.region || '') : '',
        services: client.business_details?.services || [],
        known_competitors: knownCompetitors.slice(0, 20),
    };

    const variants = runMode === 'benchmark'
        ? resolveRequestedBenchmarkVariants(benchmarkVariants)
        : ['tavily_orchestrated'];

    const runs = [];
    for (const query of queries) {
        for (const variant of variants) {
            const run = await executeVariantForQuery({
                client,
                query,
                businessContext,
                knownCompetitors,
                competitorAliases,
                runMode: runMode === 'benchmark' ? 'benchmark' : 'standard',
                engineVariant: variant,
                benchmarkSessionId,
            });
            runs.push(run);
        }
    }

    await db.logAction({
        client_id: clientId,
        action_type: actionTypeOverride || (trackedQueryId ? 'geo_query_run_single' : 'geo_queries_run'),
        details: {
            mode,
            run_mode: runMode === 'benchmark' ? 'benchmark' : 'standard',
            benchmark_session_id: benchmarkSessionId || null,
            variants,
            tracked_query_id: trackedQueryId || null,
            total_queries: queries.length,
            total_runs: runs.length,
            successful: runs.filter((run) => !run.error).length,
        },
        performed_by: performedBy || null,
    });

    return {
        clientId,
        runMode: mode,
        trackedQueryId: trackedQueryId || null,
        benchmarkSessionId: benchmarkSessionId || null,
        variants,
        totalQueries: queries.length,
        totalRuns: runs.length,
        runs,
    };
}

export async function rerunStoredQueryRun({
    clientId,
    runId,
    performedBy = null,
}) {
    const run = await db.getQueryRunById(runId);
    if (!run || run.client_id !== clientId) {
        throw new Error('Execution introuvable pour ce client.');
    }
    if (!run.tracked_query_id) {
        throw new Error('Impossible de relancer ce run: aucun prompt suivi associe.');
    }

    return runTrackedQueriesForClient({
        clientId,
        trackedQueryId: run.tracked_query_id,
        performedBy,
        actionTypeOverride: 'geo_query_run_rerun',
    });
}

export async function reparseStoredQueryRun({
    clientId,
    runId,
    performedBy = null,
}) {
    const run = await db.getQueryRunById(runId);
    if (!run || run.client_id !== clientId) {
        throw new Error('Execution introuvable pour ce client.');
    }

    const responseText = run.raw_response_full || run.response_text || '';
    if (!responseText.trim()) {
        throw new Error('Aucune reponse brute disponible pour reparser ce run.');
    }

    const client = await db.getClientById(clientId);
    const competitorAliases = await db.getCompetitorAliases(clientId).catch(() => []);
    const knownCompetitors = normalizeKnownCompetitors(client, competitorAliases);
    const extraction = buildExtractionArtifacts({
        queryText: run.query_text,
        responseText,
        analysis: run.raw_analysis?.analysis_data || run.raw_analysis || {},
        clientName: client.client_name,
        clientDomain: client.website_url || null,
        competitorAliases,
        knownCompetitors,
    });

    await db.deleteQueryMentionsByRunId(runId);
    const mentionRows = mapMentionsForInsert(runId, extraction.mentionRows);
    if (mentionRows.length > 0) {
        await db.createQueryMentions(mentionRows);
    }

    await db.updateQueryRun(runId, {
        target_found: extraction.targetDetection.target_found,
        target_position: extraction.targetDetection.target_position,
        total_mentioned: extraction.counts.total,
        parse_status: extraction.parseStatus,
        parse_warnings: extraction.parseWarnings,
        parse_confidence: extraction.parseConfidence,
        normalized_response: extraction.normalizedResponse,
        extraction_version: extraction.extractionVersion,
        target_detection: extraction.targetDetection,
        parsed_response: {
            query: run.query_text,
            target_found: extraction.targetDetection.target_found,
            target_position: extraction.targetDetection.target_position,
            total_businesses_mentioned: extraction.counts.total,
            parse_status: extraction.parseStatus,
            reparsed_at: new Date().toISOString(),
            run_signal_tier: extraction.diagnostics.run_signal_tier,
            zero_citation_reason: extraction.diagnostics.zero_citation_reason,
            zero_competitor_reason: extraction.diagnostics.zero_competitor_reason,
            operator_reason_codes: extraction.diagnostics.operator_reason_codes || [],
        },
        raw_analysis: {
            ...(run.raw_analysis || {}),
            extraction_layers: {
                literal: extraction.rawLayer,
                parsed: extraction.parsedLayer,
                normalized: extraction.normalizedLayer,
                verified: extraction.verifiedLayer,
            },
            diagnostics: extraction.diagnostics,
        },
        status: run.status === 'failed' ? 'completed' : run.status,
    });

    await db.logAction({
        client_id: clientId,
        action_type: 'geo_query_reparse',
        details: {
            run_id: runId,
            parse_status: extraction.parseStatus,
            mention_count: extraction.counts.total,
            source_count: extraction.counts.sources,
            competitor_count: extraction.counts.competitors,
        },
        performed_by: performedBy || null,
    });

    return {
        runId,
        parseStatus: extraction.parseStatus,
        parseWarnings: extraction.parseWarnings,
        counts: extraction.counts,
    };
}
