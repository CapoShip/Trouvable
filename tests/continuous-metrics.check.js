import assert from 'node:assert/strict';

import {
    buildMetricTrendSummary,
    classifyFreshness,
    computeDelta,
    splitImprovingDeclining,
} from '../lib/continuous/metrics-core.js';

function runChecks() {
    assert.deepEqual(computeDelta(10, 8), {
        latest: 10,
        previous: 8,
        delta: 2,
    });

    assert.deepEqual(computeDelta(null, 8), {
        latest: null,
        previous: 8,
        delta: null,
    });

    const now = Date.now();
    const toDay = (offsetDays) => {
        const date = new Date(now + (offsetDays * 24 * 60 * 60 * 1000));
        return date.toISOString().slice(0, 10);
    };

    const snapshots = [
        { snapshot_date: toDay(-3), seo_score: 64 },
        { snapshot_date: toDay(-2), seo_score: 66 },
        { snapshot_date: toDay(-1), seo_score: 70 },
    ];

    const summary = buildMetricTrendSummary({
        snapshots,
        metricKey: 'seo_score',
        days: 7,
    });

    assert.equal(summary.latest, 70);
    assert.equal(summary.previous, 66);
    assert.equal(summary.delta, 4);

    const freshIso = new Date(Date.now() - (2 * 60 * 60 * 1000)).toISOString();
    const staleIso = new Date(Date.now() - (200 * 60 * 60 * 1000)).toISOString();

    assert.equal(classifyFreshness(freshIso, 72).state, 'fresh');
    assert.equal(classifyFreshness(staleIso, 72).state, 'stale');

    const split = splitImprovingDeclining([
        { key: 'a', delta: 5 },
        { key: 'b', delta: -2 },
        { key: 'c', delta: 0 },
        { key: 'd', delta: -8 },
        { key: 'e', delta: 4 },
    ]);

    assert.deepEqual(split.improving.map((item) => item.key), ['a', 'e']);
    assert.deepEqual(split.declining.map((item) => item.key), ['d', 'b']);
}

runChecks();
console.log('[test] continuous metrics checks passed');

