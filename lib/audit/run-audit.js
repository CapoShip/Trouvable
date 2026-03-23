import 'server-only';
import { runSiteAudit } from './scanner.js';
import { scoreAuditV2 } from './score.js';
import { extractForLLM } from './extract.js';
import { classifySiteForAudit } from './site-classification.js';
import { generateOpportunities } from './opportunities.js';
import { generateMergeSuggestions } from './merge.js';
import { callAiJson } from '../ai/index.js';
import { buildAuditAnalysisPrompt } from '../ai/prompts.js';
import { normalizeAuditAnalysis } from '../ai/normalize.js';
import * as db from '../db.js';

/**
 * Pipeline:
 *   1. Crawl (scanner) → raw pages + extracted_data
 *   2. Classify site type → weight profile + applicability
 *   3. Score deterministically (score.js) → seo_score, geo_score, issues, strengths
 *   4. Extract compact payload for LLM (extract.js)
 *   5. LLM analysis (optional, fallback-safe)
 *   6. Compute scores: deterministic_score, llm_score, hybrid_score
 *   7. Persist audit row
 *   8. Archive old opportunities/merge suggestions, create new ones
 *   9. Action log with structured step timings
 */
export async function runFullAudit(clientId, websiteUrl) {
    const startMs = Date.now();
    const stepTimings = [];

    function logStep(name, stepStartMs) {
        const duration = Date.now() - stepStartMs;
        stepTimings.push({ step: name, duration_ms: duration, status: 'ok' });
        console.log(`[Audit] [${name}] ${duration}ms`);
    }

    function logStepError(name, stepStartMs, error) {
        const duration = Date.now() - stepStartMs;
        stepTimings.push({ step: name, duration_ms: duration, status: 'error', error: error.message });
        console.error(`[Audit] [${name}] FAILED ${duration}ms: ${error.message}`);
    }

    console.log(`[Audit] Start client=${clientId} url=${websiteUrl}`);

    let auditRecord = null;

    try {
        const client = await db.getClientById(clientId);
        const resolvedClientId = client.id;
        const resolvedWebsiteUrl = websiteUrl || client.website_url;

        if (!resolvedWebsiteUrl) {
            return { success: false, error: 'website_url manquant pour ce client', auditId: null };
        }

        auditRecord = await db.createAuditRun({
            client_id: resolvedClientId,
            source_url: resolvedWebsiteUrl,
            scan_status: 'running',
            audit_version: 'v2',
        });

        if (auditRecord?.client_id && auditRecord.client_id !== resolvedClientId) {
            throw new Error(
                `[Audit] Audit/client mismatch: audit ${auditRecord.id} recorded client_id=${auditRecord.client_id} for expected client_id=${resolvedClientId}`
            );
        }

        // --- Step 1: Crawl ---
        let t0 = Date.now();
        const scanResults = await runSiteAudit(resolvedWebsiteUrl);
        const successPages = (scanResults.scanned_pages || []).filter((p) => p.success).length;
        logStep('crawl', t0);

        if (scanResults.error_message && successPages === 0) {
            await db.updateAuditRun(auditRecord.id, {
                scan_status: 'failed',
                error_message: scanResults.error_message,
            });
            return { success: false, error: scanResults.error_message, auditId: auditRecord.id };
        }

        // --- Step 2: Classify ---
        t0 = Date.now();
        const siteClassification = classifySiteForAudit(scanResults);
        logStep('classify', t0);

        // --- Step 3: Deterministic scoring ---
        t0 = Date.now();
        const deterministicScores = scoreAuditV2(scanResults, siteClassification);
        logStep('deterministic_scoring', t0);

        // --- Step 4: Extract for LLM ---
        t0 = Date.now();
        const llmData = extractForLLM(scanResults, siteClassification);
        logStep('llm_extract', t0);

        // --- Step 5: LLM analysis (fallback-safe) ---
        let aiAnalysis = null;
        let llmScore = 0;
        let llmStatus = 'skipped';
        let llmProvider = null;
        let llmDegradedMode = false;

        t0 = Date.now();
        try {
            const messages = buildAuditAnalysisPrompt(llmData);
            const aiResult = await callAiJson({ messages, purpose: 'audit', maxTokens: 4096 });
            const normalized = normalizeAuditAnalysis(aiResult.data);
            aiAnalysis = normalized.data;
            llmScore = aiAnalysis.llm_comprehension_score || 0;
            llmProvider = aiResult.provider;
            llmStatus = 'available';
            logStep('llm_analysis', t0);
        } catch (aiErr) {
            llmStatus = 'failed';
            llmDegradedMode = true;
            logStepError('llm_analysis', t0, aiErr);
        }

        // --- Step 6: Score computation ---
        const deterministicScore = deterministicScores.deterministic_score;
        const llmNormalizedScore = llmScore / 15 * 100;
        const hybridScore = Math.round(
            (deterministicScore * 0.85) + (llmNormalizedScore * 0.15)
        );

        const scoringBreakdown = {
            ...deterministicScores.breakdown,
            deterministic_score: deterministicScore,
            llm_score: llmScore,
            llm_normalized_score: Math.round(llmNormalizedScore),
            hybrid_score: hybridScore,
            llm_weight: 0.15,
            deterministic_weight: 0.85,
            llm_used: llmStatus === 'available',
            llm_degraded_mode: llmDegradedMode,
        };

        const persistedSeoBreakdown = {
            ...deterministicScores.seo_breakdown,
            overall: {
                ...(deterministicScores.seo_breakdown?.overall || {}),
                deterministic_score: deterministicScore,
                hybrid_score: hybridScore,
                llm_comprehension_score: llmScore,
                llm_status: llmStatus,
                llm_used: llmStatus === 'available',
                llm_degraded_mode: llmDegradedMode,
            },
        };

        const persistedGeoBreakdown = {
            ...deterministicScores.geo_breakdown,
            overall: {
                ...(deterministicScores.geo_breakdown?.overall || {}),
                deterministic_score: deterministicScore,
                hybrid_score: hybridScore,
                llm_comprehension_score: llmScore,
                llm_status: llmStatus,
                llm_used: llmStatus === 'available',
                llm_degraded_mode: llmDegradedMode,
                geo_recommendability: aiAnalysis?.geo_recommendability || 'unclear',
            },
            ai_analysis: {
                status: llmStatus,
                provider: llmProvider,
                llm_used: llmStatus === 'available',
                llm_degraded_mode: llmDegradedMode,
                business_summary: aiAnalysis?.business_summary || null,
                geo_recommendability: aiAnalysis?.geo_recommendability || 'unclear',
                geo_recommendability_rationale: aiAnalysis?.geo_recommendability_rationale || '',
                answerability_summary: aiAnalysis?.answerability_summary || '',
            },
        };

        // --- Step 7: Persist audit ---
        t0 = Date.now();
        const hasFailedPages = scanResults.scanned_pages.some((p) => !p.success);
        const finalStatus = hasFailedPages ? 'partial_error' : 'success';

        await db.updateAuditRun(auditRecord.id, {
            resolved_url: scanResults.resolved_url,
            scan_status: finalStatus,
            scanned_pages: scanResults.scanned_pages,
            seo_score: deterministicScores.seo_score,
            geo_score: deterministicScores.geo_score,
            seo_breakdown: persistedSeoBreakdown,
            geo_breakdown: persistedGeoBreakdown,
            extracted_data: scanResults.extracted_data,
            issues: deterministicScores.issues,
            strengths: deterministicScores.strengths,
            prefill_suggestions: deterministicScores.automation_data,
            error_message: scanResults.error_message,
        });
        logStep('persist_audit', t0);

        // --- Step 8: Opportunities + merge suggestions ---
        t0 = Date.now();
        await db.archiveOldOpportunities(resolvedClientId);
        await db.archiveOldMergeSuggestions(resolvedClientId);

        let savedOpps = [];
        try {
            const opps = generateOpportunities({
                clientId: resolvedClientId,
                auditId: auditRecord.id,
                deterministicIssues: deterministicScores.issues,
                aiOpportunities: aiAnalysis?.opportunities || [],
            });
            savedOpps = await db.createOpportunities(opps);
        } catch (oppErr) {
            console.error(`[Audit] Opportunities insert failed (non-fatal): ${oppErr.message}`);
        }

        let savedMerge = [];
        try {
            const mergeSuggs = generateMergeSuggestions({
                clientId: resolvedClientId,
                auditId: auditRecord.id,
                client,
                scanResults,
                aiAnalysis,
                automationData: deterministicScores.automation_data,
            });
            savedMerge = await db.createMergeSuggestions(mergeSuggs);
        } catch (mergeErr) {
            console.error(`[Audit] Merge suggestions insert failed (non-fatal): ${mergeErr.message}`);
        }
        logStep('opportunities_merge', t0);

        // --- Step 9: Action log ---
        const elapsedMs = Date.now() - startMs;
        await db.logAction({
            client_id: resolvedClientId,
            action_type: 'audit_completed',
            details: {
                audit_id: auditRecord.id,
                seo_score: deterministicScores.seo_score,
                geo_score: deterministicScores.geo_score,
                deterministic_score: deterministicScore,
                hybrid_score: hybridScore,
                overall_score: hybridScore,
                llm_score: llmScore,
                llm_used: llmStatus === 'available',
                llm_degraded_mode: llmDegradedMode,
                llm_status: llmStatus,
                llm_provider: llmProvider,
                pages_scanned: successPages,
                pages_failed: scanResults.scanned_pages.length - successPages,
                opportunities_count: savedOpps.length,
                merge_suggestions_count: savedMerge.length,
                site_type: siteClassification.type,
                elapsed_ms: elapsedMs,
                step_timings: stepTimings,
            },
        });

        console.log(`[Audit] Done audit=${auditRecord.id} seo=${deterministicScores.seo_score} geo=${deterministicScores.geo_score} hybrid=${hybridScore} det=${deterministicScore} llm=${llmStatus} ${elapsedMs}ms`);

        return {
            success: true,
            auditId: auditRecord.id,
            seo_score: deterministicScores.seo_score,
            geo_score: deterministicScores.geo_score,
            overall_score: hybridScore,
            deterministic_score: deterministicScore,
            llm_score: llmScore,
            scoring_breakdown: scoringBreakdown,
            llmStatus,
            llmDegradedMode,
            summary: aiAnalysis?.business_summary || null,
            geo_recommendability: aiAnalysis?.geo_recommendability || 'unclear',
            opportunitiesCount: savedOpps.length,
            mergeSuggestionsCount: savedMerge.length,
            elapsedMs,
            stepTimings,
        };
    } catch (err) {
        console.error('[Audit] Fatal error:', err);
        if (auditRecord?.id) {
            await db.updateAuditRun(auditRecord.id, {
                scan_status: 'failed',
                error_message: err.message,
            }).catch(() => { });
        }
        return { success: false, error: err.message, auditId: auditRecord?.id || null, stepTimings };
    }
}
