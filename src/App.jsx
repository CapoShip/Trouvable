import React, { useState, useEffect } from 'react';
import {
    Search, CheckCircle2, Star, ChevronDown, ChevronUp, Menu, X,
    MessageSquare, Sparkles, Smartphone, Globe,
    TrendingUp, Users, ArrowRight, Zap, Target,
    Scissors, Activity, Coffee, Car, PlusSquare
} from 'lucide-react';

export default function App() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeAi, setActiveAi] = useState('Gemini');
    const [activeTab, setActiveTab] = useState('optimisation');
    const [openFaq, setOpenFaq] = useState(0);

    useEffect(() => {
        const aiNames = ['Gemini', 'Siri', 'ChatGPT', 'Claude'];
        let currentIndex = 0;
        const interval = setInterval(() => {
            currentIndex = (currentIndex + 1) % aiNames.length;
            setActiveAi(aiNames[currentIndex]);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    const faqs = [
        {
            question: "C'est quoi exactement la visibilité IA ?",
            answer: "C'est simple : quand vos clients demandent une recommandation à ChatGPT, Gemini ou d'autres assistants virtuels (par exemple \"Quel est le meilleur restaurant italien près de chez moi ?\"), nous nous assurons que c'est votre entreprise qui apparaît en premier dans les réponses. C'est comme être en tête de Google, mais pour l'intelligence artificielle."
        },
        { question: "Est-ce que ça marche pour mon type de commerce ?", answer: "Oui, notre solution s'adapte à tous les commerces locaux." },
        { question: "Combien de temps avant de voir des résultats ?", answer: "Les premiers résultats sont généralement visibles sous 30 à 45 jours." },
        { question: "Est-ce que je dois avoir un site internet ?", answer: "Ce n'est pas strictement obligatoire, mais fortement recommandé pour optimiser les résultats." },
        { question: "Combien ça coûte ?", answer: "Nos tarifs varient selon votre secteur et la concurrence. Demandez un audit gratuit pour un devis précis." }
    ];

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
            prompt: "Où trouver un bon coiffeur pour homme à Lyon ?",
            aiName: "Google Gemini",
            responseTitle: "Le Salon Élégance est l'un des mieux notés :",
            details: [
                { icon: <Star size={16} fill="currentColor" />, label: "Note 4.9/5 • 120 avis", color: "text-orange-400" },
                { icon: <Target size={16} />, label: "7 rue de la République, Lyon", color: "text-blue-500" },
                { icon: <CheckCircle2 size={16} />, label: "Expert coloration et visagisme", color: "text-green-500" }
            ],
            aiIconBg: "bg-blue-100",
            aiIconColor: "text-blue-600"
        },
        {
            prompt: "Je cherche un dentiste disponible demain matin.",
            aiName: "Claude",
            responseTitle: "Le Cabinet Dentaire Pro a des créneaux libres :",
            details: [
                { icon: <Star size={16} fill="currentColor" />, label: "Note 4.7/5 • 310 avis", color: "text-orange-400" },
                { icon: <Target size={16} />, label: "À 1.2km de vous", color: "text-blue-500" },
                { icon: <CheckCircle2 size={16} />, label: "Urgences acceptées rapidement", color: "text-green-500" }
            ],
            aiIconBg: "bg-orange-100",
            aiIconColor: "text-orange-600"
        }
    ];

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

    const platforms = [
        {
            name: 'ChatGPT',
            desc: 'Optimisation pour OpenAI',
            bg: '#10a37f',
            border: false,
            logo: '/logos/chatgpt.png',
        },
        {
            name: 'Google Gemini',
            desc: 'Visibilité sur Google',
            bg: '#ffffff',
            border: true,
            logo: 'https://cdn.simpleicons.org/googlegemini',
        },
        {
            name: 'Microsoft Copilot',
            desc: 'Présence sur Bing/Copilot',
            bg: '#ffffff',
            border: true,
            logo: '/logos/copilot.png',
        },
        {
            name: 'Perplexity',
            desc: 'Référencement Perplexity',
            bg: '#1C1C1C',
            border: false,
            logo: 'https://cdn.simpleicons.org/perplexity/ffffff',
        },
        {
            name: 'Claude',
            desc: 'Optimisation Anthropic',
            bg: '#ffffff',
            border: true,
            logo: '/logos/claude.png',
        },
        {
            name: 'Siri',
            desc: 'Recommandations Apple',
            bg: '#f5f5f7',
            border: true,
            logo: '/logos/siri.png',
        },
        {
            name: 'Alexa',
            desc: 'Visibilité Amazon',
            bg: '#ffffff',
            border: true,
            logo: '/logos/alexa.png',
        },
        {
            name: 'Meta AI',
            desc: 'Présence Meta/Facebook',
            bg: '#ffffff',
            border: true,
            logo: 'https://cdn.simpleicons.org/meta',
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <style>
                {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 30s linear infinite;
            width: max-content;
          }
          .animate-marquee:hover { animation-play-state: paused; }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in { animation: fadeIn 0.35s ease forwards; }
        `}
            </style>

            {/* NAVBAR */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-2 cursor-pointer">
                            <img src="/logos/trouvable_logo.png" alt="Trouvable Logo" className="w-10 h-10 object-contain" />
                            <span className="font-bold text-2xl tracking-tight">Trouvable</span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
                            <a href="#services" className="hover:text-orange-600 transition-colors">Nos Services</a>
                            <a href="#comment-ca-marche" className="hover:text-orange-600 transition-colors">Comment ça marche</a>
                            <a href="#temoignages" className="hover:text-orange-600 transition-colors">Témoignages</a>
                            <a href="#contact" className="hover:text-orange-600 transition-colors">Contact</a>
                        </div>
                        <div className="hidden md:flex items-center space-x-4">
                            <button className="text-slate-600 hover:text-slate-900 font-medium text-sm">Audit Gratuit</button>
                            <button className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-full font-medium transition-colors shadow-lg shadow-orange-600/20">
                                Nous Contacter
                            </button>
                        </div>
                        <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-4">
                        <a href="#services" className="block font-medium text-slate-600">Nos Services</a>
                        <a href="#comment-ca-marche" className="block font-medium text-slate-600">Comment ça marche</a>
                        <a href="#temoignages" className="block font-medium text-slate-600">Témoignages</a>
                        <hr />
                        <button className="w-full text-center bg-orange-600 text-white px-5 py-3 rounded-full font-medium">
                            Demander mon audit gratuit
                        </button>
                    </div>
                )}
            </nav>

            {/* HERO */}
            <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 overflow-hidden">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8 z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium text-sm border border-blue-100">
                            <Sparkles size={16} />
                            Spécialistes de la visibilité IA
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-slate-900">
                            Faites de votre entreprise le premier choix de <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-600 transition-all duration-500">
                                {activeAi}
                            </span>
                        </h1>
                        <p className="text-xl text-slate-600 font-medium">
                            Quand vos clients cherchent sur ChatGPT, nous nous assurons qu'ils vous trouvent.
                        </p>
                        <p className="text-slate-500">
                            Restaurant, salon de coiffure, clinique ou boutique : nous optimisons votre présence pour que les assistants virtuels recommandent votre commerce en premier.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-orange-600/30 flex items-center justify-center gap-2">
                                <Search size={20} />
                                Demander mon audit gratuit
                            </button>
                            <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2">
                                <Target size={20} />
                                Comment ça marche
                            </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-500 pt-4">
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Audit gratuit en 48h</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Sans engagement</div>
                            <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Support dédié</div>
                        </div>
                    </div>
                    <div className="relative z-10 hidden lg:block">
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
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                        </div>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <p className="text-slate-700 text-sm leading-relaxed">{scenarios[currentScenarioIndex].responseTitle}</p>
                                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            {scenarios[currentScenarioIndex].details.map((detail, idx) => (
                                                <div key={idx} className="flex items-center gap-3 text-sm animate-fade-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                                                    <div className={detail.color}>{detail.icon}</div>
                                                    <span className="text-slate-700 font-medium">{detail.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <div className="flex-1 h-2 bg-white rounded-full overflow-hidden shadow-inner">
                                        <div className="h-full bg-orange-500 w-1/3 rounded-full"></div>
                                    </div>
                                    <div className="flex-1 h-2 bg-white rounded-full overflow-hidden shadow-inner">
                                        <div className="h-full bg-slate-200 w-full rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute -right-6 top-1/4 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center border border-slate-100 animate-bounce">
                                <Smartphone size={24} className="text-slate-800" />
                            </div>
                            <div className="absolute -left-6 bottom-1/4 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center border border-slate-100 animate-bounce" style={{ animationDelay: '1s' }}>
                                <Globe size={24} className="text-blue-500" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SOCIAL PROOF */}
            <section className="border-y border-slate-200 bg-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm font-bold tracking-widest text-orange-600 uppercase mb-8">Ils nous font confiance</p>
                    <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Plus de 150 commerces locaux optimisés</h2>
                    <div className="flex overflow-hidden w-full mb-16" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
                        <div className="flex animate-marquee py-2">
                            {Array(4).fill([
                                { name: 'Salon Élégance', cat: 'Coiffure', icon: <Scissors size={24} className="text-slate-400" /> },
                                { name: 'Clinique Santé Plus', cat: 'Santé', icon: <Activity size={24} className="text-slate-400" /> },
                                { name: 'Boulangerie Artisan', cat: 'Boulangerie', icon: <Coffee size={24} className="text-slate-400" /> },
                                { name: 'Garage Auto Pro', cat: 'Automobile', icon: <Car size={24} className="text-slate-400" /> },
                                { name: 'Pharmacie du Centre', cat: 'Pharmacie', icon: <PlusSquare size={24} className="text-slate-400" /> }
                            ]).flat().map((client, i) => (
                                <div key={i} className="mx-3 bg-slate-50 border border-slate-200 px-6 py-3 rounded-xl flex items-center gap-4 shadow-sm min-w-max cursor-pointer hover:border-slate-300 transition-colors">
                                    <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm">{client.icon}</div>
                                    <div className="flex flex-col text-left">
                                        <span className="text-slate-800 font-bold text-sm leading-tight">{client.name}</span>
                                        <span className="text-slate-500 text-xs">{client.cat}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-100">
                        <div><div className="text-4xl font-extrabold text-slate-900 mb-2">150+</div><div className="text-slate-500 text-sm font-medium">Commerces accompagnés</div></div>
                        <div><div className="text-4xl font-extrabold text-slate-900 mb-2">4.9/5</div><div className="text-slate-500 text-sm font-medium">Satisfaction client</div></div>
                        <div><div className="text-4xl font-extrabold text-slate-900 mb-2 text-green-500">+45%</div><div className="text-slate-500 text-sm font-medium">Nouveaux clients en moyenne</div></div>
                        <div><div className="text-4xl font-extrabold text-slate-900 mb-2 text-orange-600">30j</div><div className="text-slate-500 text-sm font-medium">Premiers résultats visibles</div></div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="comment-ca-marche" className="py-24 bg-slate-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-6">Comment nous vous rendons visible</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">Un processus simple et efficace pour placer votre commerce en tête des recommandations IA.</p>
                    </div>
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
                            <div className="animate-fade-in">
                                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6"><Search size={32} /></div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">Nous analysons votre visibilité actuelle</h3>
                                <p className="text-slate-600 mb-8">En 48h, nous vérifions ce que ChatGPT, Gemini et les autres assistants IA disent de votre commerce. Vous recevez un rapport clair et simple à comprendre.</p>
                                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><p className="text-xs text-slate-500 mb-2">Trouvé par ChatGPT</p><p className="font-bold text-red-500">Non</p></div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><p className="text-xs text-slate-500 mb-2">Position Gemini</p><p className="font-bold text-red-500">Absent</p></div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><p className="text-xs text-slate-500 mb-2">Recommandé Siri</p><p className="font-bold text-red-500">Non</p></div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'optimisation' && (
                            <div className="animate-fade-in">
                                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6"><Zap size={32} /></div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">Nous optimisons votre présence en ligne</h3>
                                <p className="text-slate-600 mb-8">Notre équipe ajuste votre contenu et vos informations pour que les assistants virtuels vous trouvent et vous recommandent naturellement.</p>
                                <div className="text-left max-w-md mx-auto space-y-4">
                                    <div className="flex items-start gap-3"><CheckCircle2 className="text-green-500 mt-1" size={20} /><div><p className="font-bold text-slate-800">Informations complètes et à jour</p><p className="text-sm text-slate-500">Horaires, adresse, services, photos</p></div></div>
                                    <div className="flex items-start gap-3"><CheckCircle2 className="text-green-500 mt-1" size={20} /><div><p className="font-bold text-slate-800">Contenu optimisé pour l'IA</p><p className="text-sm text-slate-500">Descriptions claires et pertinentes</p></div></div>
                                    <div className="flex items-start gap-3"><CheckCircle2 className="text-green-500 mt-1" size={20} /><div><p className="font-bold text-slate-800">Présence sur toutes les plateformes</p><p className="text-sm text-slate-500">ChatGPT, Gemini, Siri, Alexa...</p></div></div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'generation' && (
                            <div className="animate-fade-in">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"><Users size={32} /></div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-4">Vous recevez plus de clients</h3>
                                <p className="text-slate-600 mb-8">Vos futurs clients vous trouvent naturellement quand ils demandent des recommandations aux assistants IA. Vous gagnez en visibilité sans effort.</p>
                                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100"><p className="text-xs text-slate-500 mb-2">Trouvé par ChatGPT</p><p className="font-bold text-green-600 flex items-center justify-center gap-1"><CheckCircle2 size={16} /> Oui</p></div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100"><p className="text-xs text-slate-500 mb-2">Position Gemini</p><p className="font-bold text-green-600 flex items-center justify-center gap-1"><TrendingUp size={16} /> Top 3</p></div>
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100"><p className="text-xs text-slate-500 mb-2">Recommandé Siri</p><p className="font-bold text-green-600 flex items-center justify-center gap-1"><CheckCircle2 size={16} /> Oui</p></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* SCORE / DASHBOARD */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">Votre Score de Visibilité IA</h2>
                        <p className="text-lg text-slate-600">Découvrez en 48h comment les assistants virtuels parlent de votre commerce.</p>
                    </div>
                    <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 max-w-4xl mx-auto shadow-sm">
                        <div className="grid md:grid-cols-2 gap-12">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-slate-800">Avant notre intervention</h3>
                                    <span className="bg-red-100 text-red-600 font-bold px-3 py-1 rounded-full text-sm">12%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-3 mb-8 overflow-hidden">
                                    <div className="bg-red-500 h-3 rounded-full" style={{ width: '12%' }}></div>
                                </div>
                                <ul className="space-y-4">
                                    <li className="flex justify-between items-center text-sm border-b border-slate-200 pb-2"><span className="text-slate-600">Trouvé par ChatGPT</span><span className="text-red-500 font-medium flex items-center gap-1"><X size={16} /> Non</span></li>
                                    <li className="flex justify-between items-center text-sm border-b border-slate-200 pb-2"><span className="text-slate-600">Position Gemini</span><span className="text-red-500 font-medium flex items-center gap-1"><X size={16} /> Absent</span></li>
                                    <li className="flex justify-between items-center text-sm border-b border-slate-200 pb-2"><span className="text-slate-600">Recommandé Copilot</span><span className="text-red-500 font-medium flex items-center gap-1"><X size={16} /> Non</span></li>
                                </ul>
                            </div>
                            <div className="space-y-6 relative">
                                <div className="hidden md:block absolute top-1/2 -left-8 w-8 border-t-2 border-dashed border-slate-300"></div>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-slate-800">Après notre intervention</h3>
                                    <span className="bg-green-100 text-green-600 font-bold px-3 py-1 rounded-full text-sm">94%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-3 mb-8 overflow-hidden">
                                    <div className="bg-green-500 h-3 rounded-full" style={{ width: '94%' }}></div>
                                </div>
                                <ul className="space-y-4">
                                    <li className="flex justify-between items-center text-sm border-b border-slate-200 pb-2"><span className="text-slate-600">Trouvé par ChatGPT</span><span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle2 size={16} /> Oui</span></li>
                                    <li className="flex justify-between items-center text-sm border-b border-slate-200 pb-2"><span className="text-slate-600">Position Gemini</span><span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle2 size={16} /> Top 3</span></li>
                                    <li className="flex justify-between items-center text-sm border-b border-slate-200 pb-2"><span className="text-slate-600">Recommandé Copilot</span><span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle2 size={16} /> Oui</span></li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-12 bg-white rounded-2xl p-6 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                            <input type="text" placeholder="Entrez le nom de votre entreprise..."
                                className="w-full md:w-auto flex-1 bg-slate-50 border border-slate-300 text-slate-900 px-6 py-4 rounded-full outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all" />
                            <button className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-full font-bold whitespace-nowrap transition-colors">
                                Demander mon audit gratuit
                            </button>
                        </div>
                        <div className="text-center mt-4 flex items-center justify-center gap-4 text-xs font-medium text-slate-500">
                            <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500" /> Résultats en 48h</span>
                            <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500" /> Sans engagement</span>
                            <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500" /> Audit 100% gratuit</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* PLATFORMS GRID */}
            <section id="services" className="py-24 bg-slate-50 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Présents sur tous les assistants IA</h2>
                        <p className="text-slate-600">Nous optimisons votre visibilité sur l'ensemble des plateformes majeures.</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {platforms.map((platform, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group">
                                <div
                                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200"
                                    style={{
                                        backgroundColor: platform.bg,
                                        border: platform.border ? '1px solid #e2e8f0' : 'none'
                                    }}
                                >
                                    <img
                                        src={platform.logo}
                                        alt={`Logo ${platform.name}`}
                                        width="28"
                                        height="28"
                                        style={{ objectFit: 'contain', display: 'block' }}
                                    />
                                </div>
                                <h4 className="font-bold text-slate-900 text-lg mb-1">{platform.name}</h4>
                                <p className="text-sm text-slate-500">{platform.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section id="temoignages" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">Ils ont choisi Trouvable</h2>
                        <p className="text-lg text-slate-600">Des commerces locaux qui ont transformé leur visibilité grâce à notre service.</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 relative">
                            <div className="flex text-orange-400 mb-6"><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /></div>
                            <p className="text-slate-700 text-lg italic mb-8">"Depuis que Trouvable a optimisé ma présence, ChatGPT me recommande quand on cherche un coiffeur dans mon quartier. J'ai gagné 15 nouveaux clients en un mois !"</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center text-orange-700 font-bold text-xl">M</div>
                                <div><h4 className="font-bold text-slate-900">Marie D.</h4><p className="text-sm text-slate-500">Salon de coiffure Élégance, Lyon</p></div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-slate-200 flex items-center justify-between text-sm">
                                <span className="font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">+15 clients/mois</span>
                                <span className="text-slate-500 flex items-center gap-1"><MessageSquare size={14} /> Recommandé sur ChatGPT</span>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 relative">
                            <div className="flex text-orange-400 mb-6"><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /></div>
                            <p className="text-slate-700 text-lg italic mb-8">"Incroyable ! Grâce à Trouvable, quand les touristes demandent à Gemini où manger à Marseille, mon restaurant apparaît dans le top 3. Mes réservations ont explosé."</p>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl">T</div>
                                <div><h4 className="font-bold text-slate-900">Thomas M.</h4><p className="text-sm text-slate-500">Restaurant Le Gourmet, Marseille</p></div>
                            </div>
                            <div className="mt-6 pt-6 border-t border-slate-200 flex items-center justify-between text-sm">
                                <span className="font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">+40% réservations</span>
                                <span className="text-slate-500 flex items-center gap-1"><Sparkles size={14} /> Top 3 sur Gemini</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* DARK CTA BANNER */}
            <section className="bg-slate-900 py-20 text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Votre premier audit de présence IA est 100% gratuit</h2>
                    <p className="text-slate-400 text-lg mb-10">En 48h, Trouvable analyse comment ChatGPT, Gemini et les autres assistants virtuels parlent de vous. Vous recevez un rapport simple qui vous montre exactement où vous en êtes.</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-colors">Demander mon audit gratuit</button>
                        <button className="bg-transparent border border-slate-600 hover:bg-slate-800 text-white px-8 py-4 rounded-full font-bold text-lg transition-colors">Voir nos tarifs</button>
                    </div>
                    <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-slate-400 font-medium">
                        <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-orange-500" /> Sans engagement</span>
                        <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-orange-500" /> Résultats en 48h</span>
                        <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-orange-500" /> Rapport simple</span>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-24 bg-white">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-bold text-center text-slate-900 mb-12">Questions fréquentes</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                                <button className="w-full px-6 py-5 text-left font-bold text-slate-800 flex justify-between items-center hover:bg-slate-100 transition-colors"
                                    onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                                    {faq.question}
                                    {openFaq === i ? <ChevronUp className="text-orange-600 flex-shrink-0" /> : <ChevronDown className="text-slate-400 flex-shrink-0" />}
                                </button>
                                {openFaq === i && (
                                    <div className="px-6 pb-5 text-slate-600 border-t border-slate-100 pt-4 bg-white animate-fade-in">{faq.answer}</div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="text-center mt-12">
                        <p className="text-slate-600 mb-4">Vous avez d'autres questions ?</p>
                        <button className="text-orange-600 font-bold border-b-2 border-orange-600 pb-1 hover:text-orange-700 hover:border-orange-700 transition-colors">
                            Contactez notre équipe <ArrowRight size={16} className="inline ml-1" />
                        </button>
                    </div>
                </div>
            </section>

            {/* FINAL BANNER */}
            <section className="bg-slate-900 py-16 border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                        Vos concurrents sont peut-être déjà visibles sur ChatGPT. <span className="text-orange-500">Et vous ?</span>
                    </h2>
                    <button className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-full font-bold transition-colors inline-flex items-center gap-2 mt-4">
                        Demander mon audit gratuit <ArrowRight size={18} />
                    </button>
                </div>
            </section>

            {/* FOOTER */}
            <footer id="contact" className="bg-slate-950 text-slate-400 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-2 mb-6 text-white">
                                <img src="/logos/trouvable_logo.png" alt="Trouvable Logo" className="w-8 h-8 object-contain" />
                                <span className="font-bold text-xl tracking-tight">Trouvable</span>
                            </div>
                            <p className="mb-6 max-w-sm">L'agence spécialiste en visibilité IA pour les PME et commerces locaux. Nous plaçons votre entreprise en tête des recommandations de l'intelligence artificielle.</p>
                            <div className="space-y-3 text-sm">
                                <p className="flex items-center gap-3"><span className="text-orange-500">📞</span> +33 1 23 45 67 89</p>
                                <p className="flex items-center gap-3"><span className="text-orange-500">✉️</span> contact@trouvable.fr</p>
                                <p className="flex items-center gap-3"><span className="text-orange-500">📍</span> 123 Rue de la République, 69002 Lyon, France</p>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-6">Nos Services</h4>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#" className="hover:text-orange-500 transition-colors">Audit de présence IA</a></li>
                                <li><a href="#" className="hover:text-orange-500 transition-colors">Optimisation pour assistants</a></li>
                                <li><a href="#" className="hover:text-orange-500 transition-colors">Génération de clients</a></li>
                                <li><a href="#" className="hover:text-orange-500 transition-colors">Suivi de visibilité</a></li>
                                <li><a href="#" className="hover:text-orange-500 transition-colors">Nos tarifs</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-6">Ressources</h4>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#" className="hover:text-orange-500 transition-colors">Guide gratuit</a></li>
                                <li><a href="#" className="hover:text-orange-500 transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-orange-500 transition-colors">FAQ</a></li>
                                <li><a href="#" className="hover:text-orange-500 transition-colors">Études de cas</a></li>
                                <li><a href="#" className="hover:text-orange-500 transition-colors">Témoignages</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-6">Agence</h4>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#" className="hover:text-orange-500 transition-colors">Notre équipe</a></li>
                                <li><a href="#" className="hover:text-orange-500 transition-colors">Contact</a></li>
                                <li><a href="#" className="hover:text-orange-500 transition-colors">Recrutement</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                        <p>© 2026 Trouvable. Tous droits réservés.</p>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
                            <a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a>
                            <a href="#" className="hover:text-white transition-colors">CGV</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
