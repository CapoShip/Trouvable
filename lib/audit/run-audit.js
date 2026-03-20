import 'server-only';
import { runSiteAudit } from './scanner.js';
import { scoreAuditV2 } from './score.js';
import { extractForLLM } from './extract.js';
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
 * 3. Scorer de manière déterministe
 * 4. Appeler le LLM pour l'analyse qualitative
 * 5. Calculer le score final hybride
 * 6. Stocker tout dans la DB
 * 7. Créer opportunities + merge suggestions
 */
export async function runFullAudit(clientId, websiteUrl) {
    console.log(`[Audit] Démarrage pour client ${clientId} — ${websiteUrl}`);

    const auditRecord = await db.createAuditRun({
        client_id: clientId,
        source_url: websiteUrl,
        scan_status: 'running',
        audit_version: 'v2',
    });

    try {
        // 1. Crawl
        const scanResults = await runSiteAudit(websiteUrl);
        if (scanResults.error_message && scanResults.scanned_pages.length === 0) {
            await db.updateAuditRun(auditRecord.id, {
                scan_status: 'failed',
                error_message: scanResults.error_message,
            });
            return { success: false, error: scanResults.error_message, auditId: auditRecord.id };
        }

        // 2. Extract pour LLM (nettoyé, compact)
        const llmData = extractForLLM(scanResults);

        // 3. Score déterministe
        const deterministicScores = scoreAuditV2(scanResults);

        // 4. Appel LLM
        let aiAnalysis = null;
        let llmScore = 0;
        try {
            const messages = buildAuditAnalysisPrompt(llmData);
            const aiResult = await callAiJson({ messages, purpose: 'audit', maxTokens: 4096 });
            const normalized = normalizeAuditAnalysis(aiResult.data);
            aiAnalysis = normalized.data;
            llmScore = aiAnalysis.llm_comprehension_score || 0;
            console.log(`[Audit] LLM analyse OK via ${aiResult.provider} (score compréhension: ${llmScore}/15)`);
        } catch (aiErr) {
            console.error(`[Audit] LLM échoué: ${aiErr.message}. On continue sans.`);
        }

        // 5. Score hybride final
        const overall_score = Math.round(
            (deterministicScores.deterministic_score * 0.85) + (llmScore / 15 * 100 * 0.15)
        );

        const scoring_breakdown = {
            ...deterministicScores.breakdown,
            llm_comprehension: `${llmScore}/15`,
        };

        // 6. Stocker l'audit
        const successPages = scanResults.scanned_pages.filter(p => p.success).length;

        const hasFailedPages = scanResults.scanned_pages.some(p => !p.success);
        const finalStatus = hasFailedPages ? 'partial_error' : 'success';

        await db.updateAuditRun(auditRecord.id, {
            resolved_url: scanResults.resolved_url,
            scan_status: finalStatus,
            scanned_pages: scanResults.scanned_pages,
            seo_score: deterministicScores.seo_score,
            geo_score: deterministicScores.geo_score,
            seo_breakdown: deterministicScores.seo_breakdown,
            geo_breakdown: deterministicScores.geo_breakdown,
            extracted_data: scanResults.extracted_data,
            issues: deterministicScores.issues,
            strengths: deterministicScores.strengths,
            prefill_suggestions: deterministicScores.automation_data,
            error_message: scanResults.error_message,
        });

        // 7. Archiver les anciennes opportunities/merge pending puis créer les nouvelles
        await db.archiveOldOpportunities(clientId);
        await db.archiveOldMergeSuggestions(clientId);

        const opps = generateOpportunities({
            clientId,
            auditId: auditRecord.id,
            deterministicIssues: deterministicScores.issues,
            aiOpportunities: aiAnalysis?.opportunities || [],
        });
        const savedOpps = await db.createOpportunities(opps);

        // 8. Merge suggestions
        const client = await db.getClientById(clientId);
        const mergeSuggs = generateMergeSuggestions({
            clientId,
            auditId: auditRecord.id,
            client,
            scanResults,
            aiAnalysis,
            automationData: deterministicScores.automation_data,
        });
        const savedMerge = await db.createMergeSuggestions(mergeSuggs);

        // 9. Log
        await db.logAction({
            client_id: clientId,
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
        console.error(`[Audit] Erreur fatale:`, err);
        await db.updateAuditRun(auditRecord.id, {
            scan_status: 'failed',
            error_message: err.message,
        }).catch(() => {});
        return { success: false, error: err.message, auditId: auditRecord.id };
    }
}
