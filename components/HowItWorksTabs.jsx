"use client";
import React, { useState } from 'react';
import { Search, Zap, Users, CheckCircle2, TrendingUp, ArrowRight } from 'lucide-react';

const features = [
    {
        id: 'audit',
        icon: <Search size={20} />,
        title: "Audit de présence IA",
        desc: "Analyse approfondie de votre visibilité sur ChatGPT, Gemini et Claude.",
        detail: "En 48h, nous vérifions ce que chaque assistant IA dit de votre commerce. Vous recevez un rapport clair avec votre score de visibilité.",
        metrics: [
            { label: 'ChatGPT', value: 'Non trouvé', bad: true },
            { label: 'Gemini', value: 'Absent', bad: true },
            { label: 'Claude', value: 'Non référencé', bad: true },
        ],
    },
    {
        id: 'optimisation',
        icon: <Zap size={20} />,
        title: "Optimisation assistants IA",
        desc: "Structuration complète de vos données pour les moteurs de recommandation IA.",
        detail: "Notre équipe optimise votre contenu, Schema.org, et vos informations pour que les IA vous comprennent et vous recommandent.",
        checks: [
            "Informations complètes et à jour",
            "Contenu optimisé pour l'IA",
            "Présence sur toutes les plateformes",
        ],
    },
    {
        id: 'generation',
        icon: <Users size={20} />,
        title: "Génération de clients",
        desc: "Convertissez les recommandations IA en nouveaux clients réels.",
        detail: "Vos futurs clients vous trouvent naturellement quand ils demandent des recommandations aux assistants virtuels.",
        metrics: [
            { label: 'ChatGPT', value: 'Top 3', bad: false },
            { label: 'Gemini', value: 'Recommandé', bad: false },
            { label: 'Claude', value: 'Référencé', bad: false },
        ],
    },
];

export default function HowItWorksTabs() {
    const [activeId, setActiveId] = useState('optimisation');
    const active = features.find(f => f.id === activeId);

    return (
        <div className="relative">
            {/* Grid Overlay for the component itself */}
            <div className="absolute inset-0 z-0 pointer-events-none grid grid-cols-[280px_1fr] opacity-20">
                <div className="divider-v h-full border-r border-dashed-profound"></div>
                <div className="h-full"></div>
            </div>

            <div className="relative z-10 grid lg:grid-cols-[280px_1fr] gap-0 border border-white/10 rounded-2xl overflow-hidden bg-black/40 backdrop-blur-sm">
                {/* Tab list */}
                <div className="flex lg:flex-col p-4 gap-1 border-r border-white/10 bg-white/[0.02]">
                    {features.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setActiveId(f.id)}
                            className={`group flex items-center justify-between px-4 py-4 rounded-xl text-left transition-all duration-300 ${activeId === f.id
                                    ? 'bg-white text-black font-bold scale-[1.02] shadow-xl'
                                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.05]'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className={activeId === f.id ? 'text-black' : 'text-white/30 group-hover:text-white/60 transition-colors'}>
                                    {f.icon}
                                </span>
                                <span className="text-[13px] tracking-tight hidden lg:block uppercase font-bold">{f.id}</span>
                            </div>
                            {activeId === f.id && <ArrowRight size={14} className="text-black" />}
                        </button>
                    ))}
                </div>

                {/* Content panel */}
                <div className="p-10 min-h-[400px] flex flex-col justify-center animate-fade-in" key={activeId}>
                    <div className="inline-block px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 mb-8 w-fit">
                        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/40">{active.title}</span>
                    </div>

                    <h3 className="text-3xl font-bold text-white tracking-tighter mb-6 leading-none">
                        {active.desc}
                    </h3>

                    <p className="text-white/40 text-lg mb-10 leading-relaxed max-w-xl">
                        {active.detail}
                    </p>

                    <div className="divider-h opacity-20 mb-10"></div>

                    {active.metrics && (
                        <div className="grid grid-cols-3 gap-6">
                            {active.metrics.map((m, i) => (
                                <div key={i} className="space-y-2">
                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{m.label}</p>
                                    <p className={`text-xl font-bold tracking-tighter ${m.bad ? 'text-red-400/60' : 'text-green-400/60'}`}>
                                        {m.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {active.checks && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {active.checks.map((c, i) => (
                                <div key={i} className="flex items-center gap-3 text-[13px] font-medium text-white/60">
                                    <div className="w-1 h-1 rounded-full bg-green-400/50"></div>
                                    {c}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
