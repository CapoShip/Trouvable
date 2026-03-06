"use client";
import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Globe, Zap, CheckCircle2, Star } from 'lucide-react';

const steps = [
    { label: 'Analyse IA', status: 'done', icon: <Globe size={14} /> },
    { label: 'Optimisation', status: 'done', icon: <Zap size={14} /> },
    { label: 'Visibilité Active', status: 'running', icon: <Sparkles size={14} /> },
];

const scenarios = [
    {
        prompt: "Meilleur restaurant italien à Montréal ?",
        aiName: "ChatGPT",
        result: "Trattoria Bella Vista — ⭐ 4.8/5 · 247 avis",
    },
    {
        prompt: "Coiffeur pour homme à Laval ?",
        aiName: "Google Gemini",
        result: "Salon Élégance — ⭐ 4.9/5 · Top recommandation",
    },
    {
        prompt: "Dentiste disponible demain matin ?",
        aiName: "Claude",
        result: "Cabinet Dentaire Pro — Créneaux libres confirmés",
    },
];

export default function HeroTypingSimulator() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [displayedPrompt, setDisplayedPrompt] = useState("");
    const [showResult, setShowResult] = useState(false);
    const [phase, setPhase] = useState('typing'); // typing, showing, clearing

    useEffect(() => {
        const scenario = scenarios[currentIndex];

        if (phase === 'typing') {
            if (displayedPrompt.length < scenario.prompt.length) {
                const timer = setTimeout(() => {
                    setDisplayedPrompt(scenario.prompt.substring(0, displayedPrompt.length + 1));
                }, 40 + Math.random() * 30);
                return () => clearTimeout(timer);
            } else {
                const timer = setTimeout(() => {
                    setShowResult(true);
                    setPhase('showing');
                }, 400);
                return () => clearTimeout(timer);
            }
        }

        if (phase === 'showing') {
            const timer = setTimeout(() => {
                setShowResult(false);
                setPhase('clearing');
            }, 3500);
            return () => clearTimeout(timer);
        }

        if (phase === 'clearing') {
            const timer = setTimeout(() => {
                setDisplayedPrompt("");
                setCurrentIndex((prev) => (prev + 1) % scenarios.length);
                setPhase('typing');
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [displayedPrompt, phase, currentIndex]);

    return (
        <div className="relative z-10 hidden lg:block w-full max-w-lg mx-auto">
            {/* Background Glow */}
            <div className="absolute -top-20 -left-20 w-[140%] h-[140%] bg-white/[0.01] blur-[120px] rounded-full pointer-events-none"></div>

            <div className="relative bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Browser Header */}
                <div className="bg-white/[0.03] border-b border-white/10 px-4 py-3 flex items-center justify-between">
                    <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-white/10"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-white/10"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-white/10"></div>
                    </div>
                    <div className="bg-white/[0.05] border border-white/5 rounded-md px-12 py-1 flex items-center gap-2">
                        <Globe size={10} className="text-white/20" />
                        <span className="text-[9px] text-white/30 font-medium tracking-tight">try.trouvable.ca</span>
                    </div>
                    <div className="w-10"></div> {/* Spacer */}
                </div>

                {/* Main Content Area */}
                <div className="p-8 space-y-10 min-h-[440px] flex flex-col justify-center">
                    {/* User Prompt */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/40 font-bold">U</div>
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none">User Prompt</span>
                        </div>
                        <div className="bg-white/[0.02] border border-dashed-profound border-white/10 rounded-xl p-5 min-h-[60px] flex items-center">
                            <p className="text-lg md:text-xl text-white/90 font-medium tracking-tight">
                                {displayedPrompt}<span className="inline-block w-0.5 h-5 bg-white/40 ml-1 animate-pulse align-middle"></span>
                            </p>
                        </div>
                    </div>

                    {/* AI Response Card */}
                    <div className={`space-y-4 transition-all duration-700 ${showResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center text-white/60">
                                <Sparkles size={12} />
                            </div>
                            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest leading-none">
                                {scenarios[currentIndex].aiName} Response
                            </span>
                        </div>

                        <div className="bg-white/[0.01] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                            {/* Accent line */}
                            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-green-400/60 shadow-[0_0_8px_rgba(74,222,128,0.4)]"></div>
                                    <span className="text-[11px] font-bold text-green-400/80 uppercase tracking-widest">Recommended Choice</span>
                                </div>

                                <h4 className="text-2xl font-bold text-white tracking-tighter leading-none">
                                    {scenarios[currentIndex].result.split(' — ')[0]}
                                </h4>

                                <div className="flex items-center gap-4 pt-1">
                                    <div className="flex text-white/40 gap-0.5">
                                        {[...Array(5)].map((_, i) => <Star key={i} size={10} fill="currentColor" />)}
                                    </div>
                                    <span className="text-[11px] text-white/30 font-medium border-l border-white/10 pl-4 uppercase tracking-[0.1em]">
                                        {scenarios[currentIndex].result.split(' — ')[1]}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Summary Status */}
                        <div className="flex items-center justify-between text-[10px] font-medium text-white/10 px-1 pt-4 border-t border-white/5 uppercase tracking-[0.2em]">
                            <span>Citation Rank: #1</span>
                            <span>Sentiment: 98% Positive</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
