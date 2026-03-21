'use client';

import { useState, useEffect, useCallback } from 'react';

function VerdictPill({ verdict }) {
    const styles = {
        pass: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
        partial_pass: 'bg-amber-400/10 text-amber-200 border-amber-400/20',
        fail: 'bg-red-400/10 text-red-300 border-red-400/20',
        correct: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
        partially_correct: 'bg-amber-400/10 text-amber-200 border-amber-400/20',
        incorrect: 'bg-red-400/10 text-red-300 border-red-400/20',
        not_applicable: 'bg-white/[0.05] text-white/45 border-white/10',
        unknown: 'bg-white/[0.05] text-white/35 border-white/10',
        noted: 'bg-violet-400/10 text-violet-300 border-violet-400/20',
        in_range: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
        out_of_range: 'bg-red-400/10 text-red-300 border-red-400/20',
        missing: 'bg-white/[0.05] text-white/35 border-white/10',
        insufficient_data: 'bg-white/[0.05] text-white/35 border-white/10',
        no_data: 'bg-white/[0.05] text-white/35 border-white/10',
    };
    const labels = {
        pass: 'Pass', partial_pass: 'Partial', fail: 'Fail',
        correct: 'Correct', partially_correct: 'Partial', incorrect: 'Incorrect',
        not_applicable: 'N/A', unknown: 'Unknown', noted: 'Noted',
        in_range: 'In Range', out_of_range: 'Out of Range', missing: 'Missing',
        insufficient_data: 'No Data', no_data: 'No Data',
    };
    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${styles[verdict] || styles.unknown}`}>
            {labels[verdict] || verdict}
        </span>
    );
}

function ProvenancePill({ provenance }) {
    const styles = {
        deterministic: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
        heuristic: 'bg-amber-400/10 text-amber-200 border-amber-400/20',
        inferred: 'bg-violet-400/10 text-violet-300 border-violet-400/20',
    };
    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${styles[provenance] || 'bg-white/[0.05] text-white/35 border-white/10'}`}>
            {provenance}
        </span>
    );
}

function HealthBar({ value, label }) {
    if (value == null) return <span className="text-xs text-white/30">—</span>;
    const color = value >= 80 ? 'bg-emerald-400' : value >= 60 ? 'bg-amber-400' : 'bg-red-400';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
            </div>
            <span className="text-xs font-semibold text-white/60 tabular-nums w-10 text-right">{value}%</span>
            {label && <span className="text-[10px] text-white/30">{label}</span>}
        </div>
    );
}

function CaseCard({ caseResult, onSelect }) {
    const isNoData = caseResult.status === 'no_data' || caseResult.error;
    return (
        <button
            onClick={() => onSelect(caseResult)}
            className="w-full text-left rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 hover:bg-white/[0.05] transition-colors"
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-sm font-semibold text-white/90">{caseResult.case_label || caseResult.label}</div>
                    <div className="text-xs text-white/40 mt-1">{caseResult.case_url || caseResult.url}</div>
                </div>
                <VerdictPill verdict={isNoData ? 'no_data' : caseResult.summary?.overall_verdict || 'unknown'} />
            </div>
            {!isNoData && caseResult.summary && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                        <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Signal Health</div>
                        <HealthBar value={caseResult.summary.signal_health} />
                    </div>
                    <div>
                        <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Score Health</div>
                        <HealthBar value={caseResult.summary.score_health} />
                    </div>
                </div>
            )}
            {isNoData && (
                <p className="mt-3 text-xs text-white/30">No audit data found for this URL. Run an audit first.</p>
            )}
        </button>
    );
}

function CaseDetail({ result, onBack }) {
    if (!result) return null;

    return (
        <div className="space-y-5">
            <button
                onClick={onBack}
                className="text-sm text-white/50 hover:text-white/80 transition-colors flex items-center gap-1"
            >
                ← Back to all cases
            </button>

            {/* Header */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-lg font-bold text-white/90">{result.case_label}</div>
                        <div className="text-xs text-white/40 mt-1">{result.case_url}</div>
                        {result.case_notes && <p className="text-xs text-white/35 mt-2">{result.case_notes}</p>}
                    </div>
                    <VerdictPill verdict={result.summary?.overall_verdict || 'unknown'} />
                </div>
                {result.summary && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-[10px] text-white/25 uppercase">Signal Health</div>
                            <div className="text-xl font-bold text-white/80 mt-1">{result.summary.signal_health ?? '—'}%</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-white/25 uppercase">Score Health</div>
                            <div className="text-xl font-bold text-white/80 mt-1">{result.summary.score_health ?? '—'}%</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-white/25 uppercase">Det. Accuracy</div>
                            <div className="text-xl font-bold text-white/80 mt-1">{result.summary.deterministic_accuracy ?? '—'}%</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-white/25 uppercase">Heur. Accuracy</div>
                            <div className="text-xl font-bold text-white/80 mt-1">{result.summary.heuristic_accuracy ?? '—'}%</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Site Type */}
            {result.site_type && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                    <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-white/30 mb-3">Site Type Classification</div>
                    <div className="flex items-center gap-3">
                        <div className="text-sm text-white/70">Expected: <span className="font-semibold text-white/90">{result.site_type.expected}</span></div>
                        <span className="text-white/20">→</span>
                        <div className="text-sm text-white/70">Actual: <span className="font-semibold text-white/90">{result.site_type.actual || '—'}</span></div>
                        <VerdictPill verdict={result.site_type.verdict} />
                    </div>
                    {result.site_type.reason && <p className="text-xs text-white/40 mt-2">{result.site_type.reason}</p>}
                </div>
            )}

            {/* Signals */}
            {result.signals?.length > 0 && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-white/30">Signal Comparison</div>
                        <div className="text-xs text-white/30">
                            {result.summary?.signal_stats?.correct || 0} correct /
                            {result.summary?.signal_stats?.total || 0} total
                        </div>
                    </div>
                    <div className="space-y-1">
                        {result.signals.map((signal) => (
                            <div key={signal.key} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/[0.02]">
                                <div className="w-48 text-xs text-white/60 truncate">{signal.label}</div>
                                <ProvenancePill provenance={signal.provenance} />
                                <div className="flex-1 flex items-center gap-2 text-xs">
                                    <span className="text-white/35">exp:</span>
                                    <span className="text-white/60 font-mono">{signal.expected}</span>
                                    <span className="text-white/20">→</span>
                                    <span className="text-white/35">got:</span>
                                    <span className="text-white/60 font-mono">{signal.actual}</span>
                                </div>
                                <VerdictPill verdict={signal.verdict} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Score Ranges */}
            {result.scores?.length > 0 && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                    <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-white/30 mb-4">Score Range Validation</div>
                    <div className="space-y-3">
                        {result.scores.map((score) => (
                            <div key={score.dimension} className="flex items-center gap-3">
                                <div className="w-44 text-xs text-white/60">{score.dimension.replace(/_/g, ' ')}</div>
                                <div className="flex-1">
                                    <div className="relative h-2 bg-white/[0.06] rounded-full overflow-hidden">
                                        {/* Expected range bar */}
                                        <div
                                            className="absolute h-full bg-white/10 rounded-full"
                                            style={{
                                                left: `${score.expected_min}%`,
                                                width: `${score.expected_max - score.expected_min}%`,
                                            }}
                                        />
                                        {/* Actual value marker */}
                                        {score.actual != null && (
                                            <div
                                                className={`absolute h-full w-1 rounded-full ${score.verdict === 'in_range' ? 'bg-emerald-400' : 'bg-red-400'}`}
                                                style={{ left: `${Math.min(score.actual, 100)}%` }}
                                            />
                                        )}
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[10px] text-white/25">[{score.expected_min}–{score.expected_max}]</span>
                                        <span className="text-[10px] text-white/40 font-mono">{score.actual ?? '—'}</span>
                                    </div>
                                </div>
                                <VerdictPill verdict={score.verdict} />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Issues Check */}
            {result.issues?.length > 0 && (
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                    <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-white/30 mb-4">Issue Presence/Absence Check</div>
                    <div className="space-y-2">
                        {result.issues.map((issue, idx) => (
                            <div key={idx} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/[0.02]">
                                <span className={`text-xs ${issue.direction === 'expected_present' ? 'text-amber-200/60' : 'text-white/40'}`}>
                                    {issue.direction === 'expected_present' ? 'Should exist' : 'Should NOT exist'}
                                </span>
                                <span className="flex-1 text-xs text-white/60">"{issue.title}"</span>
                                <VerdictPill verdict={issue.verdict} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AuditQaPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [selectedCase, setSelectedCase] = useState(null);

    const loadResults = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/qa?withResults=true');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setData(json);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadResults();
    }, [loadResults]);

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-white/90">Audit QA</h1>
                <div className="flex items-center gap-3 text-white/40">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                    Loading QA cases...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-white/90">Audit QA</h1>
                <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5">
                    <p className="text-sm text-red-300">Error loading QA data: {error}</p>
                    <button onClick={loadResults} className="mt-3 text-xs text-white/50 hover:text-white/80">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (selectedCase && !selectedCase.status && !selectedCase.error) {
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-white/90">Audit QA</h1>
                <CaseDetail result={selectedCase} onBack={() => setSelectedCase(null)} />
            </div>
        );
    }

    const results = data?.results || [];
    const aggregate = data?.aggregate || {};

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white/90">Audit QA</h1>
                <button
                    onClick={loadResults}
                    className="text-xs text-white/40 hover:text-white/70 border border-white/10 px-3 py-1.5 rounded-lg transition-colors"
                >
                    Refresh
                </button>
            </div>

            <p className="text-sm text-white/40">
                Internal validation system — compare expected truths against actual audit outputs.
            </p>

            {/* Aggregate Stats */}
            {Object.keys(aggregate).length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                        <div className="text-[10px] text-white/25 uppercase tracking-wider">Cases</div>
                        <div className="text-xl font-bold text-white/80 mt-1">{aggregate.total_cases || 0}</div>
                    </div>
                    <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/5 p-4">
                        <div className="text-[10px] text-emerald-300/50 uppercase tracking-wider">Pass</div>
                        <div className="text-xl font-bold text-emerald-300 mt-1">{aggregate.pass || 0}</div>
                    </div>
                    <div className="rounded-xl border border-amber-400/10 bg-amber-400/5 p-4">
                        <div className="text-[10px] text-amber-200/50 uppercase tracking-wider">Partial</div>
                        <div className="text-xl font-bold text-amber-200 mt-1">{aggregate.partial_pass || 0}</div>
                    </div>
                    <div className="rounded-xl border border-red-400/10 bg-red-400/5 p-4">
                        <div className="text-[10px] text-red-300/50 uppercase tracking-wider">Fail</div>
                        <div className="text-xl font-bold text-red-300 mt-1">{aggregate.fail || 0}</div>
                    </div>
                </div>
            )}

            {/* Case List */}
            <div className="space-y-3">
                {results.map((result) => (
                    <CaseCard key={result.case_id || result.id} caseResult={result} onSelect={setSelectedCase} />
                ))}
                {results.length === 0 && (
                    <p className="text-sm text-white/30">No QA cases loaded.</p>
                )}
            </div>
        </div>
    );
}
