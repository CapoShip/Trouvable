import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildExtractionArtifacts } from '../lib/queries/extraction-v2.js';
import { buildPromptMetadata } from '../lib/queries/prompt-intelligence.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function normalizeLabel(value) {
    return String(value || '').trim().toLowerCase();
}

function normalizeSet(values = []) {
    return new Set((values || []).map((value) => normalizeLabel(value)).filter(Boolean));
}

function toArray(setValue) {
    return [...setValue.values()].sort((a, b) => a.localeCompare(b, 'en'));
}

function safeRate(numerator, denominator) {
    if (!denominator) return 0;
    return Number((numerator / denominator).toFixed(4));
}

function mergeScore(current, expectedSet, predictedSet) {
    for (const value of predictedSet) {
        if (expectedSet.has(value)) current.tp += 1;
        else current.fp += 1;
    }
    for (const value of expectedSet) {
        if (!predictedSet.has(value)) current.fn += 1;
    }
}

function roundPct(value) {
    return Number((value * 100).toFixed(2));
}

async function run() {
    const datasetPath = path.join(__dirname, 'quality-eval.cases.json');
    const outputDir = path.join(__dirname, 'output');
    const outputPath = path.join(outputDir, 'quality-engine-eval-report.json');

    const datasetRaw = await fs.readFile(datasetPath, 'utf8');
    const dataset = JSON.parse(datasetRaw.replace(/^\uFEFF/, ''));
    const cases = Array.isArray(dataset.cases) ? dataset.cases : [];

    assert.ok(cases.length > 0, 'Dataset evaluation vide.');

    let targetMatches = 0;
    let parseSuccessCount = 0;
    let weakPromptCount = 0;
    let usefulPredictedCount = 0;
    let usefulMatches = 0;
    let hallucinatedSourceCount = 0;
    let predictedSourceCount = 0;

    const competitorScore = { tp: 0, fp: 0, fn: 0 };
    const sourceScore = { tp: 0, fp: 0, fn: 0 };
    const perCase = [];

    for (const item of cases) {
        const extraction = buildExtractionArtifacts({
            queryText: item.query_text,
            responseText: item.response_text,
            analysis: item.analysis || {},
            clientName: item.client_name,
            competitorAliases: item.competitor_aliases || [],
            knownCompetitors: item.known_competitors || [],
        });

        const promptMetadata = buildPromptMetadata({
            queryText: item.query_text,
            clientName: item.client_name,
            city: item.city || '',
            category: item.category || '',
            services: item.services || [],
            knownCompetitors: item.known_competitors || [],
            locale: item.locale || 'fr-CA',
            promptOrigin: 'evaluation_harness',
            intentFamily: item.intent_family || null,
        });

        const predictedCompetitors = normalizeSet(
            extraction.mentionRows
                .filter((row) => row.entity_type === 'competitor')
                .map((row) => row.normalized_label || row.business_name)
        );

        const predictedSources = normalizeSet(
            extraction.mentionRows
                .filter((row) => row.entity_type === 'source')
                .map((row) => row.normalized_domain || row.mentioned_domain || row.business_name)
        );

        const expectedTarget = Boolean(item?.expected?.target_found);
        const expectedCompetitors = normalizeSet(item?.expected?.competitors || []);
        const expectedSources = normalizeSet(item?.expected?.sources || []);
        const expectedUseful = Boolean(item?.expected?.useful_answer);

        const targetMatch = extraction.targetDetection.target_found === expectedTarget;
        if (targetMatch) targetMatches += 1;

        const parseSuccess = extraction.parseStatus !== 'parsed_failed';
        if (parseSuccess) parseSuccessCount += 1;

        if (promptMetadata.quality_status === 'weak') weakPromptCount += 1;

        const usefulPredicted = parseSuccess && (
            extraction.targetDetection.target_found
            || predictedCompetitors.size > 0
            || predictedSources.size > 0
        );

        if (usefulPredicted) usefulPredictedCount += 1;
        if (usefulPredicted === expectedUseful) usefulMatches += 1;

        predictedSourceCount += predictedSources.size;
        for (const source of predictedSources) {
            if (!expectedSources.has(source)) hallucinatedSourceCount += 1;
        }

        mergeScore(competitorScore, expectedCompetitors, predictedCompetitors);
        mergeScore(sourceScore, expectedSources, predictedSources);

        perCase.push({
            id: item.id,
            parse_status: extraction.parseStatus,
            parse_confidence: extraction.parseConfidence,
            quality_status: promptMetadata.quality_status,
            target_predicted: extraction.targetDetection.target_found,
            target_expected: expectedTarget,
            target_match: targetMatch,
            competitors_predicted: toArray(predictedCompetitors),
            competitors_expected: toArray(expectedCompetitors),
            sources_predicted: toArray(predictedSources),
            sources_expected: toArray(expectedSources),
            useful_predicted: usefulPredicted,
            useful_expected: expectedUseful,
        });
    }

    const competitorPrecision = safeRate(competitorScore.tp, competitorScore.tp + competitorScore.fp);
    const competitorRecall = safeRate(competitorScore.tp, competitorScore.tp + competitorScore.fn);
    const competitorF1 = safeRate(2 * competitorPrecision * competitorRecall, competitorPrecision + competitorRecall);

    const sourcePrecision = safeRate(sourceScore.tp, sourceScore.tp + sourceScore.fp);
    const sourceRecall = safeRate(sourceScore.tp, sourceScore.tp + sourceScore.fn);
    const sourceF1 = safeRate(2 * sourcePrecision * sourceRecall, sourcePrecision + sourceRecall);

    const metrics = {
        target_detection_accuracy: safeRate(targetMatches, cases.length),
        competitor_extraction_accuracy_f1: competitorF1,
        competitor_precision: competitorPrecision,
        competitor_recall: competitorRecall,
        source_extraction_accuracy_f1: sourceF1,
        source_precision: sourcePrecision,
        source_recall: sourceRecall,
        parse_success_rate: safeRate(parseSuccessCount, cases.length),
        weak_prompt_rate: safeRate(weakPromptCount, cases.length),
        hallucinated_source_rate: safeRate(hallucinatedSourceCount, predictedSourceCount),
        useful_answer_rate: safeRate(usefulPredictedCount, cases.length),
        useful_answer_alignment: safeRate(usefulMatches, cases.length),
    };

    const report = {
        generated_at: new Date().toISOString(),
        dataset_version: dataset.dataset_version || 'unknown',
        total_cases: cases.length,
        metrics,
        score_details: {
            competitor: competitorScore,
            source: sourceScore,
            hallucinated_source_count: hallucinatedSourceCount,
            predicted_source_count: predictedSourceCount,
        },
        cases: perCase,
    };

    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf8');

    console.log('[eval] dataset:', dataset.dataset_version || 'unknown');
    console.log('[eval] target detection accuracy:', `${roundPct(metrics.target_detection_accuracy)}%`);
    console.log('[eval] competitor extraction F1:', `${roundPct(metrics.competitor_extraction_accuracy_f1)}%`);
    console.log('[eval] source extraction F1:', `${roundPct(metrics.source_extraction_accuracy_f1)}%`);
    console.log('[eval] parse success rate:', `${roundPct(metrics.parse_success_rate)}%`);
    console.log('[eval] weak prompt rate:', `${roundPct(metrics.weak_prompt_rate)}%`);
    console.log('[eval] hallucinated source rate:', `${roundPct(metrics.hallucinated_source_rate)}%`);
    console.log('[eval] useful answer rate:', `${roundPct(metrics.useful_answer_rate)}%`);
    console.log('[eval] report:', outputPath);

    assert.ok(metrics.target_detection_accuracy >= 0.66, 'target_detection_accuracy < 0.66');
    assert.ok(metrics.parse_success_rate >= 0.66, 'parse_success_rate < 0.66');
    assert.ok(metrics.useful_answer_alignment >= 0.66, 'useful_answer_alignment < 0.66');
    assert.ok(metrics.hallucinated_source_rate <= 0.5, 'hallucinated_source_rate > 0.5');
}

run()
    .then(() => {
        console.log('[test] quality engine evaluation checks passed');
    })
    .catch((error) => {
        console.error('[test] quality engine evaluation failed:', error.message);
        process.exit(1);
    });


