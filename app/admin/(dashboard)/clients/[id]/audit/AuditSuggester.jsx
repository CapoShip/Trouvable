'use client';

import { useState, useTransition, useEffect } from 'react';
import { applySuggestionsToCockpitAction } from './actions';
import { Sparkles, Check, ArrowRight, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import Toast from '@/app/admin/(dashboard)/components/Toast';

export default function AuditSuggester({ clientId, automationData = [] }) {
    const [isPending, startTransition] = useTransition();
    const [selected, setSelected] = useState({});
    const [toast, setToast] = useState(null);

    const autoApplied = automationData.filter(item => item.status === 'auto_applied');
    const alreadyCovered = automationData.filter(item => item.status === 'already_covered');
    const suggested = automationData.filter(item => item.status === 'suggested');
    const hasSuggestions = suggested.length > 0;

    useEffect(() => {
        const initialSelected = {};
        suggested.forEach(item => { initialSelected[item.field_key] = true; });
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
            <div className="bg-[#0f0f0f] border border-white/10 p-6 md:p-8 rounded-2xl text-center">
                <p className="text-[#a0a0a0]">Aucune donnée claire extraite pour le moment.</p>
            </div>
        );
    }

    return (
        <div className="relative bg-[#0f0f0f] border border-white/10 p-6 md:p-8 rounded-2xl">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex items-center gap-3 mb-8 border-b border-white/[0.07] pb-6">
                <div className="p-2 bg-[#5b73ff]/15 rounded-lg">
                    <Sparkles size={24} className="text-[#7b8fff]" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Centre d'Automatisation</h2>
                    <p className="text-[#a0a0a0] text-sm">Synchronisation des données du site avec le profil du client.</p>
                </div>
            </div>

            <div className="space-y-8">
                {autoApplied.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <CheckCircle2 size={16} /> Appliqué automatiquement
                        </h3>
                        <div className="space-y-2">
                            {autoApplied.map((item, idx) => (
                                <div key={idx} className="bg-emerald-400/10 border border-emerald-400/20 rounded-lg p-3 flex justify-between items-center">
                                    <div>
                                        <div className="text-xs text-emerald-300 font-medium mb-1">{getFieldLabel(item.field_key)}</div>
                                        <div className="text-white text-sm truncate max-w-[200px] md:max-w-md">{item.normalized_value}</div>
                                    </div>
                                    <div className="text-[10px] text-emerald-400 border border-emerald-400/30 px-2 py-0.5 rounded-full bg-emerald-400/10">Haute Confiance</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {hasSuggestions && (
                    <div>
                        <h3 className="text-sm font-bold text-[#7b8fff] uppercase tracking-wider mb-3 flex items-center gap-2">
                            <AlertCircle size={16} /> Suggestions (À Valider)
                        </h3>
                        <div className="space-y-3">
                            {suggested.map((item, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleToggle(item.field_key)}
                                    className={"flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer " + (selected[item.field_key] ? 'bg-[#5b73ff]/10 border-[#5b73ff]/30' : 'bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.04]')}
                                >
                                    <div className={"mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded border transition-colors " + (selected[item.field_key] ? 'bg-[#5b73ff] border-[#5b73ff] text-white' : 'border-white/20')}>
                                        {selected[item.field_key] && <Check size={14} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="text-xs font-semibold text-white/60 uppercase">{getFieldLabel(item.field_key)}</div>
                                            <div className="text-[10px] text-white/30 bg-white/[0.04] px-2 rounded-full border border-white/10">{item.confidence_level} conf.</div>
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
                                className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-lg font-bold hover:bg-[#d6d6d6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isPending ? 'Application en cours...' : 'Appliquer au Cockpit'}
                                {!isPending && <ArrowRight size={18} />}
                            </button>
                        </div>
                    </div>
                )}

                {alreadyCovered.length > 0 && (
                    <div>
                        <h3 className="text-sm font-bold text-white/30 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Info size={16} /> Déjà couvert dans le Cockpit
                        </h3>
                        <div className="space-y-2">
                            {alreadyCovered.map((item, idx) => (
                                <div key={idx} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
                                    <div className="text-xs text-white/30 font-medium mb-1">{getFieldLabel(item.field_key)} détecté</div>
                                    <div className="text-white/20 text-sm italic">Profil déjà bien renseigné pour cette donnée.</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
