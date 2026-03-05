import React from 'react';
import Script from 'next/script';
import Link from 'next/link';
import {
    Search, CheckCircle2, ChevronDown, ChevronUp, Menu, X,
    MessageSquare, Sparkles, Smartphone, Globe,
    TrendingUp, Users, ArrowRight, Zap, Target,
    Scissors, Activity, Coffee, Car, PlusSquare, Star
} from 'lucide-react';

import Navbar from '../components/Navbar';
import HeroTitle from '../components/HeroTitle';
import HowItWorksTabs from '../components/HowItWorksTabs';
import FaqAccordion from '../components/FaqAccordion';
import ContactButton from '../components/ContactButton';
import HeroTypingSimulator from '../components/HeroTypingSimulator';
import ContactModal from '../components/ContactModal';
import GeoSeoInjector from '../components/GeoSeoInjector';
import { VILLES, EXPERTISES } from '../lib/data/geo-architecture';

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
];

export default function Page() {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://trouvable.ca').replace(/\/$/, '');

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-orange-100 selection:text-orange-900">
            <GeoSeoInjector
                organization={true}
                faqs={faqs}
                baseUrl={appUrl}
            />

            {/* NAVBAR (Client Component) */}
            <Navbar />

            <main>
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
                                <HeroTitle />
                            </h1>
                            <p className="text-xl text-slate-600 font-medium">
                                Quand vos clients cherchent sur ChatGPT, nous nous assurons qu'ils vous trouvent.
                            </p>
                            <p className="text-slate-500">
                                Restaurant, salon de coiffure, clinique ou boutique : nous optimisons votre présence pour que les assistants virtuels recommandent votre commerce en premier.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <ContactButton className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-orange-600/30 flex items-center justify-center gap-2">
                                    <Search size={20} />
                                    Demander mon audit gratuit
                                </ContactButton>
                                <a href="#comment-ca-marche" className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2">
                                    <Target size={20} />
                                    Comment ça marche
                                </a>
                            </div>
                            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-slate-500 pt-4">
                                <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Audit gratuit en 48h</div>
                                <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Sans engagement</div>
                                <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Support dédié</div>
                            </div>
                        </div>
                        {/* TYPING SIMULATOR (Client Component) */}
                        <HeroTypingSimulator />
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
                        {/* HOW IT WORKS TABS (Client Component) */}
                        <HowItWorksTabs />
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
                                <ContactButton className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-full font-bold whitespace-nowrap transition-colors">
                                    Demander mon audit gratuit
                                </ContactButton>
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
                        <div className="flex flex-wrap justify-center gap-4 md:gap-6 max-w-5xl mx-auto">
                            {platforms.map((platform, i) => (
                                <div key={i} className="w-[calc(50%-0.5rem)] md:w-[calc(33.333%-1rem)] lg:w-[calc(20%-1.2rem)] max-w-[240px] bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col items-center text-center">
                                    <div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:-translate-y-2 transition-transform duration-300 shadow-sm"
                                        style={{
                                            backgroundColor: platform.bg,
                                            border: platform.border ? '1px solid #e2e8f0' : 'none'
                                        }}
                                    >
                                        <img
                                            src={platform.logo}
                                            alt={`Logo ${platform.name}`}
                                            width="32"
                                            height="32"
                                            style={{ objectFit: 'contain', display: 'block' }}
                                        />
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-[15px] mb-2">{platform.name}</h4>
                                    <p className="text-[13px] text-slate-500 leading-snug">{platform.desc}</p>
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
                                    <div><h4 className="font-bold text-slate-900">Marie D.</h4><p className="text-sm text-slate-500">Salon de coiffure Élégance, Laval</p></div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-slate-200 flex items-center justify-between text-sm">
                                    <span className="font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">+15 clients/mois</span>
                                    <span className="text-slate-500 flex items-center gap-1"><MessageSquare size={14} /> Recommandé sur ChatGPT</span>
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 relative">
                                <div className="flex text-orange-400 mb-6"><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /></div>
                                <p className="text-slate-700 text-lg italic mb-8">"Incroyable ! Grâce à Trouvable, quand les touristes demandent à Gemini où manger à Montréal, mon restaurant apparaît dans le top 3. Mes réservations ont explosé."</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl">T</div>
                                    <div><h4 className="font-bold text-slate-900">Thomas M.</h4><p className="text-sm text-slate-500">Restaurant Le Gourmet, Montréal</p></div>
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
                            <ContactButton className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg transition-colors">Demander mon audit gratuit</ContactButton>
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
                        {/* FAQ ACCORDION (Client Component) */}
                        <FaqAccordion faqs={faqs} />
                        <div className="text-center mt-12">
                            <p className="text-slate-600 mb-4">Vous avez d'autres questions ?</p>
                            <ContactButton className="text-orange-600 font-bold border-b-2 border-orange-600 pb-1 hover:text-orange-700 hover:border-orange-700 transition-colors">
                                Contactez notre équipe <ArrowRight size={16} className="inline ml-1" />
                            </ContactButton>
                        </div>
                    </div>
                </section>

                {/* FINAL BANNER */}
                <section className="bg-slate-900 py-16 border-b border-slate-800">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                            Vos concurrents sont peut-être déjà visibles sur ChatGPT. <span className="text-orange-500">Et vous ?</span>
                        </h2>
                        <ContactButton className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-full font-bold transition-colors inline-flex items-center gap-2 mt-4 text-sm md:text-base">
                            Demander mon audit gratuit <ArrowRight size={18} />
                        </ContactButton>
                    </div>
                </section>
            </main>

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
                                <p className="flex items-center gap-3"><span className="text-orange-500">📞</span> +1 514 555-0123</p>
                                <p className="flex items-center gap-3"><span className="text-orange-500">✉️</span> contact@trouvable.ca</p>
                                <p className="flex items-center gap-3"><span className="text-orange-500">📍</span> 1000 Avenue McGill College, Montréal, QC H3B 4W5</p>
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
                            <h4 className="text-white font-bold mb-6">Nos expertises</h4>
                            <ul className="space-y-3 text-sm">
                                {EXPERTISES.map(exp => (
                                    <li key={exp.slug}>
                                        <Link href={`/expertises/${exp.slug}`} className="hover:text-orange-500 transition-colors">
                                            SEO IA {exp.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-6">Au Québec</h4>
                            <ul className="space-y-3 text-sm">
                                {VILLES.map(ville => (
                                    <li key={ville.slug}>
                                        <Link href={`/villes/${ville.slug}`} className="hover:text-orange-500 transition-colors">
                                            Visibilité IA à {ville.name}
                                        </Link>
                                    </li>
                                ))}
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
            {/* GLOBAL CONTACT MODAL */}
            <ContactModal />
        </div>
    );
}
