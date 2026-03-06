import React from 'react';
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
    { name: 'ChatGPT', desc: 'OpenAI', logo: '/logos/chatgpt.png' },
    { name: 'Gemini', desc: 'Google', logo: 'https://cdn.simpleicons.org/googlegemini/ffffff' },
    { name: 'Claude', desc: 'Anthropic', logo: '/logos/claude.png' },
    { name: 'Copilot', desc: 'Microsoft', logo: '/logos/copilot.png' },
    { name: 'Perplexity', desc: 'Answer Engine', logo: 'https://cdn.simpleicons.org/perplexity/ffffff' },
];

export default function Page() {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://trouvable.ca').replace(/\/$/, '');

    return (
        <div className="min-h-screen bg-black font-sans text-white overflow-x-hidden selection:bg-white selection:text-black">
            <GeoSeoInjector organization={true} faqs={faqs} baseUrl={appUrl} />
            <Navbar />

            {/* ─────────────── THE BLUEPRINT GRID OVERLAY ─────────────── */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden h-full">
                <div className="max-w-[1440px] mx-auto h-full grid grid-cols-4 px-6 md:px-10 opacity-30">
                    <div className="divider-v h-full"></div>
                    <div className="divider-v h-full"></div>
                    <div className="divider-v h-full"></div>
                    <div className="divider-v h-full border-r border-dashed-profound"></div>
                </div>
            </div>

            <main className="relative z-10">
                {/* ════════════════════ HERO SECTION ════════════════════ */}
                <section className="relative pt-32 pb-24 md:pt-48 md:pb-40 border-b border-white/5 bg-[linear-gradient(0deg,#0D0D0D_0%,#000000_100%)]">
                    <div className="max-w-[1440px] mx-auto px-6 md:px-10 flex flex-col items-center justify-center text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-white/[0.05] border border-white/10">
                            <Sparkles size={12} className="text-white/60" />
                            <span className="text-[10px] font-bold tracking-widest uppercase text-white/50">L'Agence de Visibilité IA</span>
                        </div>

                        <h1 className="text-[42px] leading-[0.95] md:text-[90px] font-bold text-white tracking-tighter mb-8 max-w-5xl text-balance">
                            Faites de votre entreprise le premier choix de <br />
                            <HeroTitle />
                        </h1>

                        <p className="text-[16px] md:text-[18px] text-white/50 font-medium max-w-2xl mb-12 leading-relaxed">
                            Rejoignez des millions d'utilisateurs qui utilisent l'IA pour découvrir de nouveaux produits.
                            Trouvable s'assure que vous faites exactement partie d'entre eux.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <ContactButton className="bg-white hover:bg-white/90 text-black px-10 py-4 rounded-lg font-bold text-sm transition-all duration-300 transform border border-white">
                                Obtenir un Audit Gratuit
                            </ContactButton>
                            <a href="#comment-ca-marche" className="bg-[#333333] hover:bg-[#444444] text-white border border-white/5 px-10 py-4 rounded-lg font-bold text-sm transition-all duration-300">
                                Voir comment ça marche
                            </a>
                        </div>
                    </div>
                </section>

                <div className="divider-h opacity-50"></div>

                {/* ════════════════════ LOGO WALL (BENTO MOCK) ════════════════════ */}
                <section className="py-24 border-b border-white/5 relative overflow-hidden">
                    <div className="max-w-[1440px] mx-auto px-6 md:px-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <h3 className="text-xs font-bold tracking-[0.2em] text-white/30 uppercase">Used by the best marketers</h3>
                                <h2 className="text-3xl font-bold text-white letter-tight max-w-sm">
                                    Over 100 million people search with AI every day.
                                </h2>
                                <p className="text-white/40 text-sm leading-relaxed max-w-md">
                                    Brands that aren't recommended get left behind. We provide the tools to monitor, optimize, and win in the answer engine world.
                                </p>
                            </div>

                            {/* Simulator Card - Integrated as a 'Browser Mockup' */}
                            <div className="relative group">
                                <div className="absolute -inset-4 bg-white/[0.02] rounded-[2rem] blur-2xl group-hover:bg-white/[0.04] transition-colors"></div>
                                <HeroTypingSimulator />
                            </div>
                        </div>
                    </div>
                </section>

                <div className="divider-h opacity-50"></div>

                {/* ════════════════════ FEATURES BENTO ════════════════════ */}
                <section className="py-24" id="services">
                    <div className="max-w-[1440px] mx-auto px-6 md:px-10">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-20 animate-fade-up">
                            <div className="max-w-2xl space-y-6">
                                <h2 className="text-4xl md:text-7xl font-bold text-white tracking-tighter leading-none">
                                    Des agents pour chaque <br />
                                    <span className="text-white/20">canal de marketing local.</span>
                                </h2>
                                <p className="text-white/40 text-lg md:text-xl font-medium max-w-lg">
                                    Développez votre présence, pas votre charge de travail.
                                </p>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-px bg-white/[0.06] border border-white/[0.06] rounded-2xl overflow-hidden">
                            {/* Feature 1 */}
                            <div className="bg-black p-10 space-y-8 flex flex-col justify-between group hover:bg-white/[0.01] transition-colors">
                                <div className="p-8">
                                    <h4 className="text-xl font-bold text-white mb-2">Audit de Données</h4>
                                    <p className="text-white/40 text-sm leading-relaxed mb-6">
                                        Analyse en temps réel de votre empreinte numérique sur toutes les plateformes.
                                    </p>
                                    <ul className="space-y-2">
                                        {['ChatGPT', 'Gemini', 'Claude'].map((p) => (
                                            <li key={p} className="flex items-center gap-2 text-[11px] font-bold text-white/40 uppercase">
                                                <CheckCircle2 size={10} className="text-green-400/50" /> {p} Synchronisé
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-black p-10 space-y-8 flex flex-col justify-between group hover:bg-white/[0.01] transition-colors border-l border-white/[0.06]">
                                <div className="p-8">
                                    <h4 className="text-xl font-bold text-white mb-2">Visibilité IA</h4>
                                    <p className="text-white/40 text-sm leading-relaxed mb-6">
                                        Soyez le premier choix quand vos clients interrogent l'IA.
                                    </p>
                                    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] uppercase font-bold text-white/20">Score de Présence</span>
                                            <span className="text-xs font-bold text-green-400">98%</span>
                                        </div>
                                        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-400/50 w-[98%]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-black p-10 space-y-8 flex flex-col justify-between group hover:bg-white/[0.01] transition-colors border-t border-white/[0.06]">
                                <div className="p-8">
                                    <h4 className="text-xl font-bold text-white mb-2">Analytique IA</h4>
                                    <p className="text-white/40 text-sm leading-relaxed mb-6">
                                        Suivez comment votre site est interprété par les différents modèles de langage.
                                    </p>
                                    <div className="flex items-center gap-4 text-xs font-bold text-white/60">
                                        <Activity size={14} className="text-green-400" /> +240% de Citations
                                    </div>
                                </div>
                            </div>

                            {/* Feature 4 */}
                            <div className="bg-black p-10 space-y-8 flex flex-col justify-between group hover:bg-white/[0.01] transition-colors col-span-1 md:col-span-2 lg:col-span-1">
                                <div className="p-8">
                                    <h4 className="text-xl font-bold text-white mb-2">Score de Visibilité</h4>
                                    <p className="text-white/40 text-sm leading-relaxed mb-6">
                                        Obtenez une visibilité profonde sur votre part de voix dans les réponses IA.
                                    </p>
                                    <Link href="#audit" className="inline-flex items-center gap-2 text-[10px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-[0.2em]">
                                        VOIR LE RAPPORT <ArrowRight size={12} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="divider-h opacity-50"></div>

                {/* ════════════════════ HOW IT WORKS (BLUEPRINT STYLE) ════════════════════ */}
                <section className="py-24" id="comment-ca-marche">
                    <div className="max-w-[1440px] mx-auto px-6 md:px-10 text-center mb-16">
                        <h3 className="text-[10px] font-bold tracking-widest text-white/30 uppercase mb-4">Methodology</h3>
                        <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tighter mb-8">
                            Agents for every local marketing channel.
                        </h2>
                    </div>
                    <div className="max-w-4xl mx-auto px-6 md:px-10">
                        <HowItWorksTabs />
                    </div>
                </section>

                <div className="divider-h opacity-50"></div>

                {/* ════════════════════ PARTNERS/VILLES GRID ════════════════════ */}
                <section className="py-24 border-b border-white/5">
                    <div className="max-w-[1440px] mx-auto px-6 md:px-10">
                        <div className="grid md:grid-cols-2 gap-12">
                            {/* Column 1: Expertises */}
                            <div>
                                <h4 className="text-lg font-bold text-white mb-8 border-b border-white/10 pb-4">Our Expertise</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {EXPERTISES.map(exp => (
                                        <Link
                                            key={exp.slug}
                                            href={`/expertises/${exp.slug}`}
                                            className="text-[13px] font-medium text-white/40 hover:text-white transition-colors py-1 flex items-center gap-2 group"
                                        >
                                            <div className="w-1 h-1 rounded-full bg-white/10 group-hover:bg-white/40"></div>
                                            SEO IA {exp.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                            {/* Column 2: Villes */}
                            <div>
                                <h4 className="text-lg font-bold text-white mb-8 border-b border-white/10 pb-4">In Quebec</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {VILLES.map(ville => (
                                        <Link
                                            key={ville.slug}
                                            href={`/villes/${ville.slug}`}
                                            className="text-[13px] font-medium text-white/40 hover:text-white transition-colors py-1 flex items-center gap-2 group"
                                        >
                                            <div className="w-1 h-1 rounded-full bg-white/10 group-hover:bg-white/40"></div>
                                            Visibilité IA à {ville.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ════════════════════ FAQ ════════════════════ */}
                <section className="py-32" id="faq">
                    <div className="max-w-3xl mx-auto px-6 md:px-10">
                        <h2 className="text-3xl font-bold text-white text-center mb-16 letter-tight">Questions Fréquentes</h2>
                        <FaqAccordion faqs={faqs} />
                    </div>
                </section>

                {/* ════════════════════ FINAL CTA ════════════════════ */}
                <section className="py-32 relative bg-[linear-gradient(180deg,#000000_0%,#0D0D0D_100%)] overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-white/[0.03] blur-3xl pointer-events-none rounded-full"></div>
                    <div className="max-w-[1440px] mx-auto px-6 md:px-10 flex flex-col items-center text-center">
                        <h2 className="text-[32px] md:text-[56px] font-extrabold text-white tracking-tighter mb-8 max-w-2xl leading-tight">
                            Prêt à devenir la référence sur l'IA ?
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                            <ContactButton className="bg-white text-black px-12 py-5 rounded-lg font-bold text-base hover:bg-white/90 transition-all">
                                Audit Gratuit
                            </ContactButton>
                            <ContactButton className="text-white/60 hover:text-white font-bold px-8 py-5 transition-colors">
                                Contacter notre équipe
                            </ContactButton>
                        </div>
                    </div>
                </section>
            </main>

            {/* ════════════════════ FOOTER ════════════════════ */}
            <footer className="bg-black pt-24 pb-12 border-t border-white/5 relative z-10">
                <div className="max-w-[1440px] mx-auto px-6 md:px-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-20 text-balance">
                        <div className="col-span-2 lg:col-span-2 space-y-6">
                            <div className="flex items-center gap-2 text-white">
                                <img src="/logos/trouvable_logo.png" alt="Logo" className="w-7 h-7" />
                                <span className="font-bold text-lg uppercase tracking-tighter">Trouvable</span>
                            </div>
                            <p className="text-[13px] text-white/30 max-w-xs leading-relaxed">
                                Nous aidons les marques à gagner en visibilité dans les réponses générées par l'IA et à optimiser leur présence dans le monde du "zero-click".
                            </p>
                        </div>
                        <div>
                            <h5 className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-6">Plateforme</h5>
                            <ul className="space-y-4">
                                <li><Link href="#services" className="text-[13px] text-white/50 hover:text-white">Services</Link></li>
                                <li><Link href="#comment-ca-marche" className="text-[13px] text-white/50 hover:text-white">Notre Méthode</Link></li>
                                <li><Link href="#faq" className="text-[13px] text-white/50 hover:text-white">FAQ</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Expertises</h4>
                            <ul className="space-y-4">
                                {EXPERTISES.slice(0, 5).map(e => (
                                    <li key={e.id}><Link href={`/expertises/${e.id}`} className="text-sm text-white/40 hover:text-white transition-colors">{e.name}</Link></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Villes</h4>
                            <ul className="space-y-4">
                                {VILLES.slice(0, 5).map(v => (
                                    <li key={v.id}><Link href={`/villes/${v.id}`} className="text-sm text-white/40 hover:text-white transition-colors">{v.name}</Link></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-6">Société</h4>
                            <ul className="space-y-4 text-sm text-white/40 font-medium">
                                <li><a href="#" className="hover:text-white transition-colors">Notre Méthode</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Conditions d'utilisation</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="divider-h opacity-10 mb-12"></div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="space-y-2">
                            <h4 className="text-2xl font-bold text-white tracking-tighter">Prêt à dominer l'IA ?</h4>
                            <p className="text-white/30 text-sm">Rejoignez Trouvable pour une visibilité sans égale.</p>
                        </div>
                        <ContactButton className="bg-[#333333] hover:bg-[#444444] text-white px-8 py-4 rounded-lg font-bold text-sm transition-all border border-white/10 uppercase tracking-widest">
                            Contacter notre équipe
                        </ContactButton>
                    </div>
                </div>
            </footer>

            <ContactModal />
        </div>
    );
}
