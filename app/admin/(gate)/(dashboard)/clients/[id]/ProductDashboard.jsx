'use client';

import { useState, useTransition } from 'react';
import { Target, Zap, GitMerge, CheckCircle2, XCircle, Clock, AlertTriangle, Play, Loader2 } from 'lucide-react';
import Toast from '../../components/Toast';

export default function ProductDashboard({ clientId, initialOpportunities = [], initialMergeSuggestions = [], initialQueryRuns = [] }) {
    const [opportunities, setOpportunities] = useState(initialOpportunities);
    const [mergeSuggestions, setMergeSuggestions] = useState(initialMergeSuggestions);
    const [queryRuns] = useState(initialQueryRuns);
    const [isAuditing, startAuditTransition] = useTransition();
    const [isQuerying, startQueryTransition] = useTransition();
    const [auditResult, setAuditResult] = useState(null);
    const [toast, setToast] = useState(null);

    async function handleRunAudit() {
        startAuditTransition(async () => {
            try {
                const res = await fetch('/api/admin/audits/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clientId }),
                });
                const data = await res.json();
                if (data.success) {
                    setAuditResult(data);
                    setToast({ type: 'success', message: `Audit terminé — SEO: ${data.seo_score}, GEO: ${data.geo_score}, ${data.opportunitiesCount} opportunités` });
                    refreshData();
                } else {
                    setToast({ type: 'error', message: data.error || 'Erreur audit' });
                }
            } catch (err) {
                setToast({ type: 'error', message: err.message });
            }
        });
    }

    async function handleRunQueries() {
        startQueryTransition(async () => {
            try {
                const res = await fetch('/api/admin/queries/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clientId }),
                });
                const data = await res.json();
                if (data.error) {
                    setToast({ type: 'error', message: data.error || data.message });
                } else {
                    setToast({ type: 'success', message: `${data.runs?.length || 0} requêtes exécutées` });
                }
            } catch (err) {
                setToast({ type: 'error', message: err.message });
            }
        });
    }

    async function handleApplyMerge(suggestionId) {
        try {
            const res = await fetch('/api/admin/merge/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mergeSuggestionId: suggestionId }),
            });
            const data = await res.json();
            if (data.success) {
                setMergeSuggestions(prev => prev.map(s => s.id === suggestionId ? { ...s, status: 'applied' } : s));
                setToast({ type: 'success', message: `Champ "${data.field}" appliqué` });
            } else {
                setToast({ type: 'error', message: data.error });
            }
        } catch (err) {
            setToast({ type: 'error', message: err.message });
        }
    }

    async function handleRejectMerge(suggestionId) {
        try {
            const res = await fetch('/api/admin/merge/reject', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mergeSuggestionId: suggestionId }),
            });
            const data = await res.json();
            if (data.success) {
                setMergeSuggestions(prev => prev.map(s => s.id === suggestionId ? { ...s, status: 'rejected' } : s));
            } else {
                setToast({ type: 'error', message: data.error || 'Erreur rejet' });
            }
        } catch (err) {
            setToast({ type: 'error', message: err.message });
        }
    }

    async function refreshData() {
        try {
            const res = await fetch(`/api/admin/clients/${clientId}/latest-audit`);
            if (res.ok) {
                const data = await res.json();
                if (data.opportunities) setOpportunities(data.opportunities);
                if (data.mergeSuggestions) setMergeSuggestions(data.mergeSuggestions);
            }
        } catch { /* silent */ }
    }

    const pendingMerge = mergeSuggestions.filter(s => s.status === 'pending');
    const appliedMerge = mergeSuggestions.filter(s => s.status === 'applied');
    const openOpps = opportunities.filter(o => o.status === 'open');

    const priorityColor = { high: 'text-red-400', medium: 'text-amber-400', low: 'text-emerald-400' };
    const confidenceColor = { high: 'bg-emerald-400/10 text-emerald-400', medium: 'bg-amber-400/10 text-amber-400', low: 'bg-red-400/10 text-red-400' };

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={handleRunAudit}
                    disabled={isAuditing}
                    className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-lg font-bold hover:bg-[#d6d6d6] disabled:opacity-50 transition-colors"
                >
                    {isAuditing ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                    {isAuditing ? 'Audit en cours...' : 'Lancer un audit IA'}
                </button>
                <button
                    onClick={handleRunQueries}
                    disabled={isQuerying}
                    className="flex items-center gap-2 bg-[#5b73ff] text-white px-5 py-2.5 rounded-lg font-bold hover:bg-[#4a62ee] disabled:opacity-50 transition-colors"
                >
                    {isQuerying ? <Loader2 size={18} className="animate-spin" /> : <Target size={18} />}
                    {isQuerying ? 'Requêtes en cours...' : 'Lancer GEO queries'}
                </button>
            </div>

            {/* Audit Result Summary */}
            {auditResult && (
                <div className="bg-[#0f0f0f] border border-emerald-400/20 p-5 rounded-2xl">
                    <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3">Résultat du dernier audit</h3>
                    <div className="grid grid-cols-3 gap-4 text-center mb-3">
                        <div>
                            <div className="text-2xl font-extrabold text-emerald-400">{auditResult.seo_score}</div>
                            <div className="text-xs text-white/40">SEO</div>
                        </div>
                        <div>
                            <div className="text-2xl font-extrabold text-[#7b8fff]">{auditResult.geo_score}</div>
                            <div className="text-xs text-white/40">GEO</div>
                        </div>
                        <div>
                            <div className="text-2xl font-extrabold text-white">{auditResult.overall_score}</div>
                            <div className="text-xs text-white/40">Global</div>
                        </div>
                    </div>
                    {auditResult.summary && <p className="text-sm text-white/60">{auditResult.summary}</p>}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Opportunities */}
                <div className="bg-[#0f0f0f] border border-white/10 p-6 rounded-2xl">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Zap size={16} className="text-amber-400" />
                        Opportunités ({openOpps.length})
                    </h3>
                    {openOpps.length === 0 ? (
                        <p className="text-sm text-white/30 italic">Aucune opportunité. Lancez un audit.</p>
                    ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                            {openOpps.map(opp => (
                                <div key={opp.id} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <span className="text-sm font-medium text-white/80">{opp.title}</span>
                                        <span className={`text-[10px] font-bold uppercase ${priorityColor[opp.priority] || ''}`}>{opp.priority}</span>
                                    </div>
                                    <p className="text-xs text-white/40 leading-relaxed">{opp.description}</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className="text-[10px] bg-white/[0.04] px-1.5 py-0.5 rounded text-white/30">{opp.category}</span>
                                        <span className="text-[10px] bg-white/[0.04] px-1.5 py-0.5 rounded text-white/30">{opp.source}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Merge Suggestions */}
                <div className="bg-[#0f0f0f] border border-white/10 p-6 rounded-2xl">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <GitMerge size={16} className="text-[#7b8fff]" />
                        Safe Merge ({pendingMerge.length} en attente)
                    </h3>
                    {pendingMerge.length === 0 && appliedMerge.length === 0 ? (
                        <p className="text-sm text-white/30 italic">Aucune suggestion de merge. Lancez un audit.</p>
                    ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                            {pendingMerge.map(ms => (
                                <div key={ms.id} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <span className="text-sm font-medium text-white/80">{ms.field_name}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${confidenceColor[ms.confidence] || ''}`}>{ms.confidence}</span>
                                    </div>
                                    <div className="text-xs text-white/40 mb-1">
                                        {ms.current_value && <span>Actuel: <span className="text-white/50">{String(ms.current_value).slice(0, 60)}</span> → </span>}
                                        <span className="text-[#7b8fff]">{String(ms.suggested_value).slice(0, 80)}</span>
                                    </div>
                                    {ms.rationale && <p className="text-[10px] text-white/30 mb-2">{ms.rationale}</p>}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApplyMerge(ms.id)}
                                            className="flex items-center gap-1 text-xs bg-emerald-400/10 text-emerald-400 px-3 py-1 rounded hover:bg-emerald-400/20 transition-colors"
                                        >
                                            <CheckCircle2 size={12} /> Appliquer
                                        </button>
                                        <button
                                            onClick={() => handleRejectMerge(ms.id)}
                                            className="flex items-center gap-1 text-xs bg-red-400/10 text-red-400 px-3 py-1 rounded hover:bg-red-400/20 transition-colors"
                                        >
                                            <XCircle size={12} /> Rejeter
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {appliedMerge.map(ms => (
                                <div key={ms.id} className="p-3 rounded-lg bg-emerald-400/5 border border-emerald-400/10 opacity-60">
                                    <div className="flex items-center gap-2 text-sm text-emerald-400/70">
                                        <CheckCircle2 size={14} /> {ms.field_name} — appliqué
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
