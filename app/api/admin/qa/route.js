import { NextResponse } from 'next/server';
import { getQaCases, getQaCaseById, runQaComparison } from '@/lib/audit/qa/run-qa.js';
import { aggregateQaStats } from '@/lib/audit/qa/compare.js';
import { getLatestAuditByUrl } from '@/lib/db.js';

/**
 * GET /api/admin/qa
 * List all QA test cases. If ?withResults=true, also run comparisons against latest audit data.
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const withResults = searchParams.get('withResults') === 'true';

        const cases = getQaCases();

        if (!withResults) {
            return NextResponse.json({ cases });
        }

        // Run comparisons by looking up latest audit for each case's URL
        const results = [];
        for (const testCase of cases) {
            const fullCase = getQaCaseById(testCase.id);
            if (!fullCase) continue;

            const auditData = await getLatestAuditByUrl(fullCase.url);
            const result = runQaComparison(testCase.id, auditData);
            results.push(result);
        }

        const caseResults = results.filter((r) => !r.error && !r.status);
        const aggregate = aggregateQaStats(caseResults);

        return NextResponse.json({ cases, results, aggregate });
    } catch (err) {
        console.error('[QA API] GET error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/qa
 * Run QA comparison for a specific case.
 * Body: { caseId: string, auditData?: object }
 * If auditData is not provided, looks up the latest audit by the case's URL.
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { caseId, auditData } = body;

        if (!caseId) {
            return NextResponse.json({ error: 'Missing caseId' }, { status: 400 });
        }

        const testCase = getQaCaseById(caseId);
        if (!testCase) {
            return NextResponse.json({ error: `QA case "${caseId}" not found` }, { status: 404 });
        }

        // If no auditData provided, try to find the latest audit for this URL
        let resolvedAuditData = auditData || null;
        if (!resolvedAuditData) {
            resolvedAuditData = await getLatestAuditByUrl(testCase.url);
        }

        const result = runQaComparison(caseId, resolvedAuditData);
        return NextResponse.json(result);
    } catch (err) {
        console.error('[QA API] POST error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
