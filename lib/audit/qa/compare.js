/**
 * Audit QA Comparison Engine
 *
 * Compares expected truths from QA fixtures against actual audit outputs.
 * Distinguishes deterministic (strict) vs heuristic (relaxed) vs inferred (noted) signals.
 */

import { getSignalDef, extractAllSignals, extractDimensionScores, extractIssueTitles } from './signal-registry.js';

// ─── Signal-level comparison ────────────────────────────────────────────────

/**
 * Compare a single expected signal value against the actual extracted value.
 * Returns a verdict object.
 */
function compareOneSignal(signalKey, expectedValue, actualValue) {
    const def = getSignalDef(signalKey);
    const provenance = def?.provenance || 'unknown';

    // 'unknown' expected means we don't have a truth to compare against
    if (expectedValue === 'unknown') {
        return {
            key: signalKey,
            label: def?.label || signalKey,
            provenance,
            expected: expectedValue,
            actual: actualValue,
            verdict: 'unknown',
            reason: 'No expected truth defined for this signal.',
        };
    }

    // 'not_applicable' expected — the signal should not matter for this site type
    if (expectedValue === 'not_applicable') {
        return {
            key: signalKey,
            label: def?.label || signalKey,
            provenance,
            expected: expectedValue,
            actual: actualValue,
            verdict: 'not_applicable',
            reason: 'Signal is not applicable to this site type.',
        };
    }

    // For deterministic signals: strict yes/no match
    if (provenance === 'deterministic') {
        const match = actualValue === expectedValue;
        return {
            key: signalKey,
            label: def?.label || signalKey,
            provenance,
            expected: expectedValue,
            actual: actualValue,
            verdict: match ? 'correct' : 'incorrect',
            reason: match ? 'Actual matches expected.' : `Expected "${expectedValue}" but got "${actualValue}".`,
        };
    }

    // For heuristic signals: allow 'partial' as partially_correct
    if (provenance === 'heuristic') {
        if (actualValue === expectedValue) {
            return {
                key: signalKey,
                label: def?.label || signalKey,
                provenance,
                expected: expectedValue,
                actual: actualValue,
                verdict: 'correct',
                reason: 'Actual matches expected.',
            };
        }
        if (actualValue === 'partial' && expectedValue === 'yes') {
            return {
                key: signalKey,
                label: def?.label || signalKey,
                provenance,
                expected: expectedValue,
                actual: actualValue,
                verdict: 'partially_correct',
                reason: 'Signal partially detected; expected full detection.',
            };
        }
        return {
            key: signalKey,
            label: def?.label || signalKey,
            provenance,
            expected: expectedValue,
            actual: actualValue,
            verdict: 'incorrect',
            reason: `Expected "${expectedValue}" but got "${actualValue}".`,
        };
    }

    // For inferred signals: we note but don't strictly grade
    return {
        key: signalKey,
        label: def?.label || signalKey,
        provenance,
        expected: expectedValue,
        actual: actualValue,
        verdict: actualValue === expectedValue ? 'correct' : actualValue === 'unknown' ? 'unknown' : 'noted',
        reason: provenance === 'inferred'
            ? 'Inferred signal — noted but not strictly graded.'
            : `Expected "${expectedValue}" vs actual "${actualValue}".`,
    };
}

/**
 * Compare all expected signals against actual audit data.
 */
export function compareSignals(expectedSignals, audit) {
    const actualSignals = extractAllSignals(audit);
    const results = [];

    for (const [key, expectedValue] of Object.entries(expectedSignals || {})) {
        const actualValue = actualSignals[key] ?? 'not_extracted';
        results.push(compareOneSignal(key, expectedValue, actualValue));
    }

    return results;
}

// ─── Score range comparison ─────────────────────────────────────────────────

/**
 * Compare actual dimension scores against expected ranges.
 */
export function compareScoreRanges(expectedRanges, audit) {
    const actualScores = extractDimensionScores(audit);
    const results = [];

    for (const [dimension, range] of Object.entries(expectedRanges || {})) {
        const actual = actualScores[dimension];
        if (actual == null) {
            results.push({
                dimension,
                expected_min: range.min,
                expected_max: range.max,
                actual: null,
                verdict: 'missing',
                note: range.note || null,
                reason: 'Dimension score not found in audit output.',
            });
            continue;
        }

        const inRange = actual >= range.min && actual <= range.max;
        const deviation = inRange ? 0 : actual < range.min ? range.min - actual : actual - range.max;

        results.push({
            dimension,
            expected_min: range.min,
            expected_max: range.max,
            actual,
            verdict: inRange ? 'in_range' : 'out_of_range',
            deviation,
            note: range.note || null,
            reason: inRange
                ? `Score ${actual} is within expected range [${range.min}, ${range.max}].`
                : `Score ${actual} is outside expected range [${range.min}, ${range.max}] (deviation: ${deviation}).`,
        });
    }

    return results;
}

// ─── Site type comparison ───────────────────────────────────────────────────

/**
 * Compare expected site type against actual classification.
 */
export function compareSiteType(expectedType, audit) {
    const classification = audit?.geo_breakdown?.site_classification
        || audit?.seo_breakdown?.site_classification
        || null;

    if (!classification) {
        return {
            expected: expectedType,
            actual: null,
            verdict: 'missing',
            confidence: null,
            reason: 'No site classification found in audit output.',
        };
    }

    const actualType = classification.type;
    const match = actualType === expectedType;

    // Accept hybrid_business as a partial match if expected was local_business (and vice versa)
    const partialMatches = {
        'local_business': ['hybrid_business'],
        'hybrid_business': ['local_business', 'saas_software'],
        'content_led': ['generic_business'],
        'generic_business': ['content_led'],
    };

    const isPartial = !match && (partialMatches[expectedType] || []).includes(actualType);

    return {
        expected: expectedType,
        actual: actualType,
        verdict: match ? 'correct' : isPartial ? 'partially_correct' : 'incorrect',
        confidence: classification.confidence,
        reasons: classification.reasons || [],
        reason: match
            ? `Site type "${actualType}" matches expected.`
            : isPartial
                ? `Site type "${actualType}" is a reasonable alternative to expected "${expectedType}".`
                : `Expected "${expectedType}" but classified as "${actualType}".`,
    };
}

// ─── Issues comparison ──────────────────────────────────────────────────────

/**
 * Check whether expected issues are present or absent.
 */
export function compareIssues(expectedPresent, expectedAbsent, audit) {
    const actualTitles = extractIssueTitles(audit);
    const results = [];

    for (const title of expectedPresent || []) {
        const found = actualTitles.some((t) => t.toLowerCase().includes(title.toLowerCase()));
        results.push({
            title,
            direction: 'expected_present',
            found,
            verdict: found ? 'correct' : 'incorrect',
            reason: found ? 'Issue correctly detected.' : `Expected issue "${title}" was not found in audit output.`,
        });
    }

    for (const title of expectedAbsent || []) {
        const found = actualTitles.some((t) => t.toLowerCase().includes(title.toLowerCase()));
        results.push({
            title,
            direction: 'expected_absent',
            found,
            verdict: found ? 'incorrect' : 'correct',
            reason: found ? `Issue "${title}" should not be present but was found.` : 'Correct — issue is absent as expected.',
        });
    }

    return results;
}

// ─── Full case comparison ───────────────────────────────────────────────────

/**
 * Run full QA comparison for a single test case against an audit record.
 */
export function compareCase(testCase, audit) {
    const signalResults = compareSignals(testCase.expected_signals, audit);
    const scoreResults = compareScoreRanges(testCase.expected_score_ranges, audit);
    const siteTypeResult = compareSiteType(testCase.expected_site_type, audit);
    const issueResults = compareIssues(
        testCase.expected_issues_present,
        testCase.expected_issues_absent,
        audit
    );

    // Compute summary stats
    const signalStats = {
        total: signalResults.length,
        correct: signalResults.filter((r) => r.verdict === 'correct').length,
        incorrect: signalResults.filter((r) => r.verdict === 'incorrect').length,
        partially_correct: signalResults.filter((r) => r.verdict === 'partially_correct').length,
        not_applicable: signalResults.filter((r) => r.verdict === 'not_applicable').length,
        unknown: signalResults.filter((r) => r.verdict === 'unknown').length,
        noted: signalResults.filter((r) => r.verdict === 'noted').length,
    };

    const deterministicSignals = signalResults.filter((r) => r.provenance === 'deterministic');
    const heuristicSignals = signalResults.filter((r) => r.provenance === 'heuristic');

    const deterministicAccuracy = deterministicSignals.length > 0
        ? Math.round((deterministicSignals.filter((r) => r.verdict === 'correct').length / deterministicSignals.filter((r) => !['unknown', 'not_applicable'].includes(r.verdict)).length) * 100) || 0
        : null;

    const heuristicAccuracy = heuristicSignals.length > 0
        ? Math.round((heuristicSignals.filter((r) => ['correct', 'partially_correct'].includes(r.verdict)).length / heuristicSignals.filter((r) => !['unknown', 'not_applicable'].includes(r.verdict)).length) * 100) || 0
        : null;

    const scoreStats = {
        total: scoreResults.length,
        in_range: scoreResults.filter((r) => r.verdict === 'in_range').length,
        out_of_range: scoreResults.filter((r) => r.verdict === 'out_of_range').length,
        missing: scoreResults.filter((r) => r.verdict === 'missing').length,
    };

    const issueStats = {
        total: issueResults.length,
        correct: issueResults.filter((r) => r.verdict === 'correct').length,
        incorrect: issueResults.filter((r) => r.verdict === 'incorrect').length,
    };

    // Overall health
    const testableSignals = signalStats.total - signalStats.unknown - signalStats.not_applicable;
    const correctSignals = signalStats.correct + signalStats.partially_correct;
    const signalHealth = testableSignals > 0 ? Math.round((correctSignals / testableSignals) * 100) : null;
    const scoreHealth = scoreStats.total > 0 ? Math.round((scoreStats.in_range / scoreStats.total) * 100) : null;

    return {
        case_id: testCase.id,
        case_label: testCase.label,
        case_description: testCase.description,
        case_url: testCase.url,
        case_notes: testCase.notes,
        case_confidence: testCase.confidence,

        site_type: siteTypeResult,
        signals: signalResults,
        scores: scoreResults,
        issues: issueResults,

        summary: {
            signal_stats: signalStats,
            score_stats: scoreStats,
            issue_stats: issueStats,
            deterministic_accuracy: deterministicAccuracy,
            heuristic_accuracy: heuristicAccuracy,
            signal_health: signalHealth,
            score_health: scoreHealth,
            site_type_verdict: siteTypeResult.verdict,
            overall_verdict: determineOverallVerdict(signalHealth, scoreHealth, siteTypeResult.verdict),
        },
    };
}

function determineOverallVerdict(signalHealth, scoreHealth, siteTypeVerdict) {
    if (signalHealth == null) return 'insufficient_data';
    if (signalHealth >= 90 && (scoreHealth == null || scoreHealth >= 80) && siteTypeVerdict !== 'incorrect') return 'pass';
    if (signalHealth >= 70 && (scoreHealth == null || scoreHealth >= 60)) return 'partial_pass';
    return 'fail';
}

// ─── Aggregate stats across all cases ───────────────────────────────────────

/**
 * Generate aggregate QA stats from multiple case results.
 */
export function aggregateQaStats(caseResults) {
    const total = caseResults.length;
    const pass = caseResults.filter((r) => r.summary.overall_verdict === 'pass').length;
    const partialPass = caseResults.filter((r) => r.summary.overall_verdict === 'partial_pass').length;
    const fail = caseResults.filter((r) => r.summary.overall_verdict === 'fail').length;

    const avgSignalHealth = caseResults.reduce((sum, r) => sum + (r.summary.signal_health || 0), 0) / (total || 1);
    const avgScoreHealth = caseResults.reduce((sum, r) => sum + (r.summary.score_health || 0), 0) / (total || 1);

    return {
        total_cases: total,
        pass,
        partial_pass: partialPass,
        fail,
        avg_signal_health: Math.round(avgSignalHealth),
        avg_score_health: Math.round(avgScoreHealth),
    };
}
