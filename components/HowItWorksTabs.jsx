"use client";
import React, { useState } from 'react';
import { Search, Zap, Users, CheckCircle2, TrendingUp } from 'lucide-react';

export default function HowItWorksTabs() {
    const [activeTab, setActiveTab] = useState('optimisation');

    return (
        <>
            <style jsx>{`
                @keyframes localFadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .local-fade-in {
                    animation: localFadeIn 0.35s ease forwards;
                }
            `}</style>
            <div className="flex flex-col md:flex-row justify-center gap-4 mb-12">
                {[
                    { id: 'audit', icon: <Search size={20} />, title: "Audit de présence IA" },
                    { id: 'optimisation', icon: <Zap size={20} />, title: "Optimisation pour assistants virtuels" },
                    { id: 'generation', icon: <Users size={20} />, title: "Génération de clients locaux" }
                ].map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center p-6 rounded-2xl border-2 transition-all ${activeTab === tab.id ? 'border-orange-600 bg-white shadow-lg shadow-orange-100 text-orange-600 scale-105' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                        <div className={`p-4 rounded-full mb-4 ${activeTab === tab.id ? 'bg-orange-100' : 'bg-slate-100'}`}>{tab.icon}</div>
                        <span className="font-bold text-center text-sm">{tab.title}</span>
                    </button>
                ))}
            </div>
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100 text-center max-w-3xl mx-auto">
                {activeTab === 'audit' && (
                    <div className="local-fade-in">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"><Search size={32} /></div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Nous analysons votre visibilité actuelle</h3>
                        <p className="text-slate-600 mb-8">Nous vérifions ce que ChatGPT, Gemini et les autres assistants IA disent de votre commerce. Vous recevez un rapport clair et simple à comprendre.</p>
                        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><p className="text-xs text-slate-500 mb-2">Trouvé par ChatGPT</p><p className="font-bold text-red-500">Non</p></div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><p className="text-xs text-slate-500 mb-2">Position Gemini</p><p className="font-bold text-red-500">Absent</p></div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><p className="text-xs text-slate-500 mb-2">Recommandé Claude</p><p className="font-bold text-red-500">Non</p></div>
                        </div>
                    </div>
                )}
                {activeTab === 'optimisation' && (
                    <div className="local-fade-in">
                        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6"><Zap size={32} /></div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Nous optimisons votre présence en ligne</h3>
                        <p className="text-slate-600 mb-8">Notre équipe ajuste votre contenu et vos informations pour que les assistants virtuels vous trouvent et vous recommandent naturellement.</p>
                        <div className="text-left max-w-md mx-auto space-y-4">
                            <div className="flex items-start gap-3"><CheckCircle2 className="text-green-500 mt-1" size={20} /><div><p className="font-bold text-slate-800">Informations complètes et à jour</p><p className="text-sm text-slate-500">Horaires, adresse, services, photos</p></div></div>
                            <div className="flex items-start gap-3"><CheckCircle2 className="text-green-500 mt-1" size={20} /><div><p className="font-bold text-slate-800">Contenu optimisé pour l'IA</p><p className="text-sm text-slate-500">Descriptions claires et pertinentes</p></div></div>
                            <div className="flex items-start gap-3"><CheckCircle2 className="text-green-500 mt-1" size={20} /><div><p className="font-bold text-slate-800">Présence sur toutes les plateformes</p><p className="text-sm text-slate-500">ChatGPT, Gemini, Claude, Copilot...</p></div></div>
                        </div>
                    </div>
                )}
                {activeTab === 'generation' && (
                    <div className="local-fade-in">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"><Users size={32} /></div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Vous recevez plus de clients</h3>
                        <p className="text-slate-600 mb-8">Vos futurs clients vous trouvent naturellement quand ils demandent des recommandations aux assistants IA. Vous gagnez en visibilité sans effort.</p>
                        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100"><p className="text-xs text-slate-500 mb-2">Trouvé par ChatGPT</p><p className="font-bold text-green-600 flex items-center justify-center gap-1"><CheckCircle2 size={16} /> Oui</p></div>
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100"><p className="text-xs text-slate-500 mb-2">Position Gemini</p><p className="font-bold text-green-600 flex items-center justify-center gap-1"><TrendingUp size={16} /> Top 3</p></div>
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100"><p className="text-xs text-slate-500 mb-2">Recommandé Claude</p><p className="font-bold text-green-600 flex items-center justify-center gap-1"><CheckCircle2 size={16} /> Oui</p></div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
