'use client';

import { useState, useTransition, useEffect } from 'react';
import { applySuggestionsToCockpitAction } from './actions';
import { Sparkles, Check, ArrowRight, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import Toast from '@/app/admin/(dashboard)/components/Toast';

export default function AuditSuggester({ clientId, automationData = [] }) {
    const [isPending, startTransition] = useTransition();
    const [selected, setSelected] = useState({});
    const [toast, setToast] = useState(null);

    // Filter and group automation data
    const autoApplied = automationData.filter(item => item.status === 'auto_applied');
    const alreadyCovered = automationData.filter(item => item.status === 'already_covered');
    const suggested = automationData.filter(item => item.status === 'suggested');

    const hasSuggestions = suggested.length > 0;

    // Initialize checkboxes for suggested items only
    useEffect(() => {
        const initialSelected = {};
        suggested.forEach(item => {
            initialSelected[item.field_key] = true; // Pre-select by default
        });
        setSelected(initialSelected);
    }, [suggested.length]);

    const handleToggle = (key) => {
        setSelected(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleApply = () => {
        const payloadToApply = {};
        for (const [key, isSelected] of Object.entries(selected)) {
            if (isSelected) {
                const item = suggested.find(i => i.field_key === key);
                if (item) payloadToApply[key] = item.normalized_value;
            }
        }

        if (Object.keys(payloadToApply).length === 0) {
            setToast({ type: 'error', message: "Aucune suggestion sélectionnée." });
            return;
        }

        startTransition(async () => {
            const res = await applySuggestionsToCockpitAction(clientId, payloadToApply);
            if (res?.error) {
                setToast({ type: 'error', message: res.error });
            } else {
                setToast({ type: 'success', message: "Suggestions appliquées avec succès au Cockpit !" });
                // Note: ideally we would refresh the data here to update the state from 'suggested' to 'already_covered'
                // the revalidatePath in the server action will force a page reload and reflect this.
            }
        });
    };

    const getFieldLabel = (key) => {
        switch (key) {
            case 'phone': return 'Téléphone détecté';
            case 'public_email': return 'Email public';
            case 'short_desc': return 'Description courte (depuis Meta)';
            case 'differentiators': return 'Différenciateur détecté';
            default: return key;
        }
    };

    if (automationData.length === 0) {
        return (
            <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-xl shadow-lg ring-1 ring-white/10 text-center">
                <p className="text-slate-400">Aucune donnée claire extraite pour le moment.</p>
            </div>
        );
    }

    return (
        <div className="relative bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-xl shadow-lg ring-1 ring-white/10">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-6">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <Sparkles size={24} className="text-indigo-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Centre d'Automatisation</h2>
                    <p className="text-slate-400 text-sm">Synchronisation des données du site avec le profil du client.</p>
                </div>
            </div>

            <div className="space-y-8">

                {/* 1. AUTO APPLIED (HIGH CONFIDENCE + EMPTY COCKPIT) */}
                {autoApplied.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <CheckCircle2 size={16} /> Appliqué automatiquement
                        </h3>
                        <div className="space-y-2">
                            {autoApplied.map((item, idx) => (
                                <div key={idx} className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex justify-between items-center">
                                    <div>
                                        <div className="text-xs text-green-300 font-medium mb-1">{getFieldLabel(item.field_key)}</div>
                                        <div className="text-white text-sm truncate max-w-[200px] md:max-w-md">{item.normalized_value}</div>
                                    </div>
                                    <div className="text-[10px] text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full bg-green-500/10">Haute Confiance</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. SUGGESTIONS (REQUIRE REVIEW) */}
                {hasSuggestions && (
                    <div>
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <AlertCircle size={16} /> Suggestions (À Valider)
                        </h3>
                        <div className="space-y-3">
                            {suggested.map((item, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleToggle(item.field_key)}
                                    className={`flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer ${selected[item.field_key] ? 'bg-indigo-900/40 border-indigo-500/50' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80'}`}
                                >
                                    <div className={`mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded border transition-colors ${selected[item.field_key] ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-500'}`}>
                                        {selected[item.field_key] && <Check size={14} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="text-xs font-semibold text-slate-300 uppercase">{getFieldLabel(item.field_key)}</div>
                                            <div className="text-[10px] text-slate-400 bg-slate-800 px-2 rounded-full border border-slate-700">{item.confidence_level} conf.</div>
                                        </div>
                                        <div className="text-white text-sm mt-1 leading-relaxed">
                                            {typeof item.normalized_value === 'string' ? item.normalized_value : JSON.stringify(item.normalized_value)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleApply}
                                disabled={isPending || !Object.values(selected).some(v => v)}
                                className="flex items-center gap-2 bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-bold shadow-sm hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isPending ? 'Application en cours...' : 'Appliquer au Cockpit'}
                                {!isPending && <ArrowRight size={18} />}
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. ALREADY COVERED (CONFLICT OR BETTER DATA IN COCKPIT) */}
                {alreadyCovered.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Info size={16} /> Déjà couvert dans le Cockpit
                        </h3>
                        <div className="space-y-2">
                            {alreadyCovered.map((item, idx) => (
                                <div key={idx} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3">
                                    <div className="text-xs text-slate-400 font-medium mb-1">{getFieldLabel(item.field_key)} détecté</div>
                                    <div className="text-slate-500 text-sm italic">Profil déjà bien renseigné pour cette donnée.</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
