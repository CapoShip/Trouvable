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
 * Flow principal d'audit:
 * 1. Crawler le site
 * 2. Extraire et nettoyer pour le LLM
 * 3. Scorer de maniere deterministe
 * 4. Appeler le LLM pour l'analyse qualitative
 * 5. Calculer le score final hybride
 * 6. Stocker tout dans la DB
 * 7. Creer opportunities + merge suggestions
 */
export async function runFullAudit(clientId, websiteUrl) {
    console.log(`[Audit] Demarrage pour client ${clientId} - ${websiteUrl}`);

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

        // 1. Crawl
        const scanResults = await runSiteAudit(resolvedWebsiteUrl);
        if (scanResults.error_message && scanResults.scanned_pages.length === 0) {
            await db.updateAuditRun(auditRecord.id, {
                scan_status: 'failed',
                error_message: scanResults.error_message,
            });
            return { success: false, error: scanResults.error_message, auditId: auditRecord.id };
        }

        // 2. Extract pour LLM (nettoye, compact)
        const siteClassification = classifySiteForAudit(scanResults);
        const llmData = extractForLLM(scanResults, siteClassification);

        // 3. Score deterministe
        const deterministicScores = scoreAuditV2(scanResults, siteClassification);

        // 4. Appel LLM
        let aiAnalysis = null;
        let llmScore = 0;
        try {
            const messages = buildAuditAnalysisPrompt(llmData);
            const aiResult = await callAiJson({ messages, purpose: 'audit', maxTokens: 4096 });
            const normalized = normalizeAuditAnalysis(aiResult.data);
            aiAnalysis = normalized.data;
            llmScore = aiAnalysis.llm_comprehension_score || 0;
            console.log(`[Audit] LLM analyse OK via ${aiResult.provider} (score comprehension: ${llmScore}/15)`);
        } catch (aiErr) {
            console.error(`[Audit] LLM echoue: ${aiErr.message}. On continue sans.`);
        }

        // 5. Score hybride final
        const overall_score = Math.round(
            (deterministicScores.deterministic_score * 0.85) + (llmScore / 15 * 100 * 0.15)
        );

        const scoring_breakdown = {
            ...deterministicScores.breakdown,
            llm_comprehension: `${llmScore}/15`,
        };

        const persistedSeoBreakdown = {
            ...deterministicScores.seo_breakdown,
            overall: {
                ...(deterministicScores.seo_breakdown?.overall || {}),
                hybrid_score: overall_score,
                llm_comprehension_score: llmScore,
            },
        };

        const persistedGeoBreakdown = {
            ...deterministicScores.geo_breakdown,
            overall: {
                ...(deterministicScores.geo_breakdown?.overall || {}),
                hybrid_score: overall_score,
                llm_comprehension_score: llmScore,
                geo_recommendability: aiAnalysis?.geo_recommendability || 'unclear',
            },
            ai_analysis: {
                status: aiAnalysis ? 'available' : 'fallback',
                business_summary: aiAnalysis?.business_summary || 'LLM summary unavailable',
                geo_recommendability: aiAnalysis?.geo_recommendability || 'unclear',
                geo_recommendability_rationale: aiAnalysis?.geo_recommendability_rationale || '',
                answerability_summary: aiAnalysis?.answerability_summary || '',
            },
        };

        // 6. Stocker l'audit
        const successPages = scanResults.scanned_pages.filter((page) => page.success).length;
        const hasFailedPages = scanResults.scanned_pages.some((page) => !page.success);
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

        // 7. Archiver les anciennes opportunities/merge pending puis creer les nouvelles
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

        // 8. Merge suggestions
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

        // 9. Log
        await db.logAction({
            client_id: resolvedClientId,
            action_type: 'audit_completed',
            details: {
                audit_id: auditRecord.id,
                seo_score: deterministicScores.seo_score,
                geo_score: deterministicScores.geo_score,
                overall_score,
                pages_scanned: successPages,
                opportunities_count: savedOpps.length,
                merge_suggestions_count: savedMerge.length,
            },
        });

        return {
            success: true,
            auditId: auditRecord.id,
            seo_score: deterministicScores.seo_score,
            geo_score: deterministicScores.geo_score,
            overall_score,
            deterministic_score: deterministicScores.deterministic_score,
            scoring_breakdown,
            summary: aiAnalysis?.business_summary || 'Analyse LLM non disponible',
            geo_recommendability: aiAnalysis?.geo_recommendability || 'unclear',
            opportunitiesCount: savedOpps.length,
            mergeSuggestionsCount: savedMerge.length,
        };
    } catch (err) {
        console.error('[Audit] Erreur fatale:', err);
        if (auditRecord?.id) {
            await db.updateAuditRun(auditRecord.id, {
                scan_status: 'failed',
                error_message: err.message,
            }).catch(() => { });
        }
        return { success: false, error: err.message, auditId: auditRecord?.id || null };
    }
}
