import React from 'react';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import ContactButton from '@/components/ContactButton';
import { ArrowRight, Search, ShieldCheck, TrendingUp } from 'lucide-react';

export const metadata = {
    title: 'Nos Offres | Trouvable',
    description: 'Une offre de service structurée pour dominer la visibilité locale Google et IA.',
};

export default function OffersPage() {
    return (
        <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
            <Navbar />
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.08),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

            <main className="pt-32 pb-24 px-6 md:px-10 max-w-[1140px] mx-auto">
                <div className="text-center mb-20 max-w-3xl mx-auto">
                    <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8fff]">
                        Un service complet
                    </div>
                    <h1 className="text-[clamp(36px,5vw,56px)] font-bold leading-[1.08] tracking-[-0.04em] mb-6">
                        Déléguez, <br/><span className="text-[#666]">nous exécutons.</span>
                    </h1>
                    <p className="text-lg leading-relaxed text-[#a0a0a0]">
                        Pas de logiciel à configurer, pas de tableau de bord vide. Vous engagez notre équipe d'experts pour prendre en charge de A à Z votre présence sur Google et les moteurs IA.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-20">
                    <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-8 flex flex-col">
                        <div className="h-12 w-12 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center mb-6">
                            <Search className="w-5 h-5 text-[#5b73ff]" />
                        </div>
                        <h2 className="text-xl font-bold mb-3 tracking-[-0.02em]">1. Diagnostic initial</h2>
                        <p className="text-[14px] leading-relaxed text-[#a0a0a0] mb-8 flex-1">
                            Nous analysons en profondeur l'état actuel de vos signaux locaux, votre référencement Google et la manière dont les IA vous interprètent.
                        </p>
                        <ul className="space-y-3 mb-8 text-sm text-[#888]">
                            <li>&bull; Audit de contenu</li>
                            <li>&bull; Test de réponses IA</li>
                            <li>&bull; Vérification technique</li>
                        </ul>
                        <ContactButton className="w-full py-3 rounded-lg border border-white/10 bg-white/[0.03] text-sm font-medium hover:bg-white/[0.06] transition text-center">
                            Demander un diagnostic
                        </ContactButton>
                    </div>

                    <div className="rounded-2xl border border-[#5b73ff]/30 bg-[#0d0d0d]/80 p-8 flex flex-col relative overflow-hidden shadow-[0_0_40px_rgba(91,115,255,0.1)]">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#5b73ff] to-emerald-400" />
                        <div className="h-12 w-12 rounded-xl border border-[#5b73ff]/20 bg-[#5b73ff]/10 flex items-center justify-center mb-6">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-bold mb-3 tracking-[-0.02em]">2. Structuration</h2>
                        <p className="text-[14px] leading-relaxed text-[#a0a0a0] mb-8 flex-1">
                            Notre équipe assainit toutes vos fondations : données structurées, maillage, corrections sémantiques et ajout de FAQ formatées pour le GEO.
                        </p>
                        <ul className="space-y-3 mb-8 text-sm text-[#888]">
                            <li>&bull; Déploiement Schema.org</li>
                            <li>&bull; Enrichissement Sémantique</li>
                            <li>&bull; Sécurisation profils locaux</li>
                        </ul>
                        <ContactButton className="w-full py-3 rounded-lg bg-white text-black text-sm font-medium hover:bg-white/90 transition text-center">
                            Démarrer le mandat
                        </ContactButton>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#0d0d0d] p-8 flex flex-col">
                        <div className="h-12 w-12 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center mb-6">
                            <TrendingUp className="w-5 h-5 text-[#5b73ff]" />
                        </div>
                        <h2 className="text-xl font-bold mb-3 tracking-[-0.02em]">3. Accompagnement</h2>
                        <p className="text-[14px] leading-relaxed text-[#a0a0a0] mb-8 flex-1">
                            Les algorithmes IA évoluent sans cesse. Nous surveillons et ajustons vos signaux chaque mois pour garantir que vous conservez votre avance.
                        </p>
                        <ul className="space-y-3 mb-8 text-sm text-[#888]">
                            <li>&bull; Reporting humain direct</li>
                            <li>&bull; Mises à jour IA (Gemini, Claude)</li>
                            <li>&bull; Ajustements stratégiques</li>
                        </ul>
                        <ContactButton className="w-full py-3 rounded-lg border border-white/10 bg-white/[0.03] text-sm font-medium hover:bg-white/[0.06] transition text-center">
                            Nous parler
                        </ContactButton>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-10 text-center max-w-2xl mx-auto">
                    <h3 className="text-2xl font-bold mb-4 tracking-[-0.02em]">Chaque mandat est sur-mesure</h3>
                    <p className="text-[#a0a0a0] mb-8 text-sm leading-relaxed">
                        Le besoin d'un avocat d'affaires n'est pas celui d'un entrepreneur en construction. Nous discutons de votre périmètre pour vous présenter un plan d'action aligné sur vos objectifs de visibilité.
                    </p>
                    <ContactButton className="inline-flex items-center gap-2 rounded-lg bg-[#5b73ff] px-6 py-3 text-[14px] font-medium text-white transition hover:-translate-y-px hover:shadow-[0_10px_20px_rgba(91,115,255,0.2)]">
                        Planifier un appel de découverte <ArrowRight className="h-4 w-4" />
                    </ContactButton>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
