import React from 'react';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import ContactButton from '@/components/ContactButton';
import { ArrowRight, Search, ShieldCheck, TrendingUp, Key } from 'lucide-react';

export const metadata = {
    title: 'Nos Mandats de Visibilité | Trouvable',
    description: 'Une exécution structurée pour dominer la visibilité locale Google et IA. Pas de logiciel, c\'est nous qui le faisons pour vous.',
};

export default function OffersPage() {
    return (
        <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
            <Navbar />
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.08),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

            <main className="pt-32 pb-24 px-6 md:px-10 max-w-[1140px] mx-auto">
                <div className="text-center mb-24 max-w-3xl mx-auto">
                    <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8fff]">
                        Prestations de service
                    </div>
                    <h1 className="text-[clamp(36px,5vw,56px)] font-bold leading-[1.08] tracking-[-0.04em] mb-6">
                        Vous déléguez, <br/><span className="text-[#666]">nous exécutons.</span>
                    </h1>
                    <p className="text-lg leading-relaxed text-[#a0a0a0]">
                        Aucun logiciel complexe à configurer. Aucun abonnement sans résultat. Vous engagez notre équipe d'experts pour prendre en charge intégralement le déploiement de votre visibilité sur Google et les moteurs IA.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mb-24">
                    <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-8 flex flex-col group transition hover:-translate-y-1 hover:border-white/15">
                        <div className="h-12 w-12 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center mb-8 group-hover:bg-white/[0.06] transition">
                            <Search className="w-5 h-5 text-[#5b73ff]" />
                        </div>
                        <h2 className="text-xl font-bold mb-4 tracking-[-0.02em]">1. Diagnostic & Stratégie</h2>
                        <p className="text-sm leading-relaxed text-[#a0a0a0] mb-8 flex-1">
                            Une phase initiale d'investigation. Nous analysons l'état de vos infrastructures et mesurons rigoureusement la perception que les IA et Google ont de votre entreprise aujourd'hui.
                        </p>
                        <ul className="space-y-4 mb-8 text-[13px] text-[#888]">
                            <li className="flex gap-2 items-start"><span className="text-white/30">•</span> Cartographie sémantique</li>
                            <li className="flex gap-2 items-start"><span className="text-white/30">•</span> Repérage des réponses IA (ChatGPT, Claude)</li>
                            <li className="flex gap-2 items-start"><span className="text-white/30">•</span> Identification des blocages techniques</li>
                        </ul>
                        <ContactButton className="w-full py-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-[13px] font-semibold hover:bg-white/[0.08] transition text-center text-white/90">
                            Obtenir un premier avis
                        </ContactButton>
                    </div>

                    <div className="rounded-2xl border border-[#5b73ff]/40 bg-[#0a0a0a] p-8 flex flex-col relative overflow-hidden shadow-[0_20px_80px_rgba(91,115,255,0.15)] group transition hover:-translate-y-1">
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#5b73ff] to-emerald-400" />
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                            <Key className="w-16 h-16 text-[#5b73ff] -rotate-12" />
                        </div>
                        <div className="relative z-10 h-12 w-12 rounded-xl border border-[#5b73ff]/20 bg-[#5b73ff]/10 flex items-center justify-center mb-8 group-hover:bg-[#5b73ff]/20 transition">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-bold mb-4 tracking-[-0.02em] text-white">2. Déploiement du mandat</h2>
                        <p className="text-sm leading-relaxed text-[#a0a0a0] mb-8 flex-1 relative z-10">
                            Notre prestation centrale. L'équipe d'ingénierie nettoie vos fondations et injecte directement les marqueurs sémantiques indispensables pour positionner votre marque en leader local.
                        </p>
                        <ul className="space-y-4 mb-8 text-[13px] text-[#888] relative z-10">
                            <li className="flex gap-2 items-start"><span className="text-emerald-400/50">•</span> Déploiement Schema.org avancé</li>
                            <li className="flex gap-2 items-start"><span className="text-emerald-400/50">•</span> Création et injection LLM-ready (llms.txt)</li>
                            <li className="flex gap-2 items-start"><span className="text-emerald-400/50">•</span> Structuration de contenu conversationnel (GEO)</li>
                        </ul>
                        <ContactButton className="w-full relative z-10 py-3.5 rounded-xl bg-white text-black text-[14px] font-[600] hover:bg-neutral-200 transition text-center">
                            Démarrer le mandat
                        </ContactButton>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-8 flex flex-col group transition hover:-translate-y-1 hover:border-white/15">
                        <div className="h-12 w-12 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center mb-8 group-hover:bg-white/[0.06] transition">
                            <TrendingUp className="w-5 h-5 text-[#5b73ff]" />
                        </div>
                        <h2 className="text-xl font-bold mb-4 tracking-[-0.02em]">3. Maintien et Ajustement</h2>
                        <p className="text-sm leading-relaxed text-[#a0a0a0] mb-8 flex-1">
                            Les algorithmes (Google et modèles de langage) évoluent toutes les semaines. Nous surveillons vos résultats et procédons à des renforcements continus de votre profil.
                        </p>
                        <ul className="space-y-4 mb-8 text-[13px] text-[#888]">
                            <li className="flex gap-2 items-start"><span className="text-white/30">•</span> Veille technologique et algorithmique</li>
                            <li className="flex gap-2 items-start"><span className="text-white/30">•</span> Suivi mensuel humain et interprétation</li>
                            <li className="flex gap-2 items-start"><span className="text-white/30">•</span> Renforcement des citations de votre marque</li>
                        </ul>
                        <ContactButton className="w-full py-3.5 rounded-xl border border-white/10 bg-white/[0.03] text-[13px] font-semibold hover:bg-white/[0.08] transition text-center text-white/90">
                            Prendre contact
                        </ContactButton>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/7 bg-[#0f0f0f] p-10 md:p-14 text-center max-w-3xl mx-auto shadow-[0_40px_100px_rgba(0,0,0,0.4)]">
                    <h3 className="text-[clamp(24px,3vw,32px)] font-bold mb-6 tracking-[-0.03em] leading-snug">Chaque firme avec laquelle nous travaillons est unique.</h3>
                    <p className="text-[#a0a0a0] mb-10 text-[15px] leading-relaxed max-w-xl mx-auto">
                        Les besoins d'un cabinet juridique diffèrent de ceux d'un expert-comptable ou d'un entrepreneur général. Nous prenons le temps d'évaluer votre marché spécifique afin de concevoir un plan d'action réellement adapté à vos enjeux.
                    </p>
                    <ContactButton className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#5b73ff] px-8 py-4 text-[15px] font-[600] text-white transition hover:bg-blue-500 hover:shadow-[0_10px_30px_rgba(91,115,255,0.3)]">
                        Planifier un appel stratégique <ArrowRight className="h-4 w-4" />
                    </ContactButton>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
