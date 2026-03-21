/**
 * Audit QA Runner
 *
 * Orchestrates QA comparison by loading fixtures, looking up latest audit data,
 * and running the comparison engine.
 */

import qaFixtures from './qa-fixtures.json';
import { compareCase, aggregateQaStats } from './compare.js';

/** Load all QA test case definitions */
export function getQaCases() {
    return qaFixtures.map((fixture) => ({
        id: fixture.id,
        label: fixture.label,
        description: fixture.description,
        url: fixture.url,
        expected_site_type: fixture.expected_site_type,
        confidence: fixture.confidence,
        notes: fixture.notes,
        signal_count: Object.keys(fixture.expected_signals || {}).length,
        score_range_count: Object.keys(fixture.expected_score_ranges || {}).length,
    }));
}

/** Get a single fixture by ID */
export function getQaCaseById(caseId) {
    return qaFixtures.find((f) => f.id === caseId) || null;
}

/**
 * Run QA comparison for a single case.
 * If auditData is provided, compare against it directly.
 * Otherwise, indicate that no audit data was available.
 */
export function runQaComparison(caseId, auditData = null) {
    const testCase = getQaCaseById(caseId);
    if (!testCase) {
        return { error: `QA case "${caseId}" not found.` };
    }

    if (!auditData) {
        return {
            case_id: caseId,
            case_label: testCase.label,
            error: 'No audit data provided for comparison.',
            status: 'no_data',
        };
    }

    return compareCase(testCase, auditData);
}

/**
 * Run QA comparison for all cases.
 * auditDataMap is an object: { caseId: auditData }
 */
export function runAllQaComparisons(auditDataMap = {}) {
    const results = [];

    for (const testCase of qaFixtures) {
        const auditData = auditDataMap[testCase.id] || null;
        if (auditData) {
            results.push(compareCase(testCase, auditData));
        } else {
            results.push({
                case_id: testCase.id,
                case_label: testCase.label,
                status: 'no_data',
                summary: {
                    overall_verdict: 'insufficient_data',
                    signal_health: null,
                    score_health: null,
                },
            });
        }
    }

    return {
        cases: results,
        aggregate: aggregateQaStats(results.filter((r) => !r.status)),
    };
}
