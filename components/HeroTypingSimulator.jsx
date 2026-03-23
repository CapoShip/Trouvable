"use client";
import React, { useState, useEffect } from 'react';
import { Star, Target, CheckCircle2, Sparkles, Smartphone, Globe } from 'lucide-react';

const scenarios = [
    {
        prompt: "Quel est le meilleur restaurant italien près de chez moi ?",
        aiName: "ChatGPT",
        responseTitle: "Je vous recommande Trattoria Bella Vista :",
        details: [
            { icon: <Star size={16} fill="currentColor" />, label: "Note 4.8/5 avec 247 avis clients", color: "text-orange-400" },
            { icon: <Target size={16} />, label: "À 850m de votre position", color: "text-blue-500" },
            { icon: <CheckCircle2 size={16} />, label: "Spécialités maison authentiques", color: "text-green-500" }
        ],
        aiIconBg: "bg-green-100",
        aiIconColor: "text-green-600"
    },
    {
        prompt: "Où trouver un bon coiffeur pour homme à Montréal ?",
        aiName: "Google Gemini",
        responseTitle: "Le Salon Élégance est l'un des mieux notés à Montréal :",
        details: [
            { icon: <Star size={16} fill="currentColor" />, label: "Note 4.9/5 • 120 avis", color: "text-orange-400" },
            { icon: <Target size={16} />, label: "Boulevard Saint-Laurent, Montréal", color: "text-blue-500" },
            { icon: <CheckCircle2 size={16} />, label: "Expert coloration et visagisme", color: "text-green-500" }
        ],
        aiIconBg: "bg-blue-100",
        aiIconColor: "text-blue-600"
    },
    {
        prompt: "Je cherche un dentiste disponible demain matin à Laval.",
        aiName: "Claude",
        responseTitle: "Le Cabinet Dentaire Pro à Laval a des créneaux libres :",
        details: [
            { icon: <Star size={16} fill="currentColor" />, label: "Note 4.7/5 • 310 avis", color: "text-orange-400" },
            { icon: <Target size={16} />, label: "Près du Carrefour Laval", color: "text-blue-500" },
            { icon: <CheckCircle2 size={16} />, label: "Urgences acceptées rapidement", color: "text-green-500" }
        ],
        aiIconBg: "bg-orange-100",
        aiIconColor: "text-orange-600"
    }
];

export default function HeroTypingSimulator() {

    const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
    const [displayedPrompt, setDisplayedPrompt] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [showResponse, setShowResponse] = useState(false);
    const [typingSpeed, setTypingSpeed] = useState(100);

    useEffect(() => {
        const handleTyping = () => {
            const currentScenario = scenarios[currentScenarioIndex];
            const fullText = currentScenario.prompt;

            if (!isDeleting && !showResponse) {
                // Typing
                setDisplayedPrompt(fullText.substring(0, displayedPrompt.length + 1));
                setTypingSpeed(50 + Math.random() * 50);

                if (displayedPrompt === fullText) {
                    setTimeout(() => setShowResponse(true), 500);
                    setTimeout(() => {
                        setShowResponse(false);
                        setIsDeleting(true);
                    }, 4000);
                }
            } else if (isDeleting) {
                // Deleting
                setDisplayedPrompt(fullText.substring(0, displayedPrompt.length - 1));
                setTypingSpeed(30);

                if (displayedPrompt === "") {
                    setIsDeleting(false);
                    setCurrentScenarioIndex((prev) => (prev + 1) % scenarios.length);
                    setTypingSpeed(500);
                }
            }
        };

        const timer = setTimeout(handleTyping, typingSpeed);
        return () => clearTimeout(timer);
    }, [displayedPrompt, isDeleting, showResponse, currentScenarioIndex]);

    return (
        <div className="relative z-10 hidden lg:block">
            <style jsx>{`
                @keyframes localFadeIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .local-fade-in {
                    animation: localFadeIn 0.35s ease forwards;
                }
            `}</style>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-orange-100 to-blue-50 rounded-full blur-3xl opacity-50 -z-10"></div>
            <div className="bg-slate-100 rounded-[2rem] p-6 shadow-2xl border border-white relative max-w-md mx-auto transform rotate-2 hover:rotate-0 transition-transform duration-500 min-h-[460px]">
                <div className="flex justify-end mb-6">
                    <div className="bg-blue-600 text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-sm max-w-[85%] min-h-[60px] flex items-center">
                        <p className="text-sm">"{displayedPrompt}"<span className="animate-pulse">|</span></p>
                    </div>
                </div>

                <div className={`transition-all duration-700 transform ${showResponse ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                        <div className={`border-b border-slate-100 p-4 flex items-center justify-between ${scenarios[currentScenarioIndex].aiIconBg}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${scenarios[currentScenarioIndex].aiIconColor}`}>
                                    <Sparkles size={16} />
                                </div>
                                <p className="text-xs text-slate-500 font-medium whitespace-nowrap">Réponse de {scenarios[currentScenarioIndex].aiName}</p>
                            </div>
                            <div className="flex gap-1" aria-hidden="true">
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                            </div>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-slate-700 text-sm leading-relaxed">{scenarios[currentScenarioIndex].responseTitle}</p>
                            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                {scenarios[currentScenarioIndex].details.map((detail, idx) => (
                                    <div key={idx} className="local-fade-in flex items-center gap-3 text-sm" style={{ animationDelay: `${idx * 0.1}s` }}>
                                        <div className={detail.color}>{detail.icon}</div>
                                        <span className="text-slate-700 font-medium">{detail.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex gap-3" aria-hidden="true">
                        <div className="flex-1 h-2 bg-white rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-orange-500 w-1/3 rounded-full"></div>
                        </div>
                        <div className="flex-1 h-2 bg-white rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-slate-200 w-full rounded-full"></div>
                        </div>
                    </div>
                </div>

                <div className="absolute -right-6 top-1/4 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center border border-slate-100 animate-bounce" aria-hidden="true">
                    <Smartphone size={24} className="text-slate-800" />
                </div>
                <div className="absolute -left-6 bottom-1/4 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center border border-slate-100 animate-bounce" style={{ animationDelay: '1s' }} aria-hidden="true">
                    <Globe size={24} className="text-blue-500" />
                </div>
            </div>
        </div>
    );
}
