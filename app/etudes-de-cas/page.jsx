import React from 'react';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import ContactButton from '@/components/ContactButton';
import { Lock, ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';

export const metadata = {
    title: 'Notre méthode d\'évaluation & Métriques | Trouvable',
    description: 'Découvrez comment notre firme suit vos résultats sur Google et ChatGPT tout en respectant une stricte confidentialité.',
};

export default function CasesPage() {
    return (
        <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
            <Navbar />
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.08),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

            <main className="pt-32 pb-24 px-6 md:px-10 max-w-4xl mx-auto text-center">
                <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8fff]">
                    Résultats & Métriques
                </div>
                <h1 className="text-[clamp(36px,5vw,56px)] font-bold leading-[1.08] tracking-[-0.04em] mb-6">
                    Comment nous documentons <br/><span className="text-[#666]">vos acquis.</span>
                </h1>
                <p className="text-lg leading-relaxed text-[#a0a0a0] mb-20 mx-auto max-w-2xl">
                    Nous travaillons au cœur du réacteur des entreprises locales. Par exigence de confidentialité avec nos partenaires, nous n'exposons ni leurs noms ni leurs chiffres de croissance en public. Toutefois, notre mesure des résultats est implacable.
                </p>

                <div className="grid md:grid-cols-3 gap-6 mb-24 max-w-5xl mx-auto text-left">
                    <div className="rounded-2xl border border-white/7 bg-[#0f0f0f] p-8 transition hover:bg-white/[0.02]">
                        <h3 className="text-lg font-bold mb-3 text-white tracking-[-0.01em]">Part de recommandation IA</h3>
                        <p className="text-sm text-[#888] leading-relaxed">
                            Nous évaluons à quelle fréquence de recommandation stricte votre marque est citée par ChatGPT, Claude ou Gemini lorsqu'un prospect local demande vos services.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-white/7 bg-[#0f0f0f] p-8 transition hover:bg-white/[0.02]">
                        <h3 className="text-lg font-bold mb-3 text-white tracking-[-0.01em]">Domination Google Local</h3>
                        <p className="text-sm text-[#888] leading-relaxed">
                            Nous suivons techniquement votre positionnement sur le "Map Pack" et surveillons le déclenchement des requêtes de type itinéraire, appel, ou clic site originant du trafic naturel.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-[#5b73ff]/20 bg-[#0d0d0d] p-8 relative overflow-hidden shadow-[0_4px_20px_rgba(91,115,255,0.04)]">
                        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#5b73ff]/50 to-transparent" />
                        <h3 className="text-lg font-bold mb-3 text-white tracking-[-0.01em]">Taux de conversion</h3>
                        <p className="text-sm text-[#888] leading-relaxed">
                            Toute visibilité doit se transformer en client entrant. Nous croisons la hausse de signaux de confiance avec l'impact concret sur vos prises de contact et vos appels de découverte.
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/7 bg-[#0d0d0d] p-10 md:p-14 max-w-2xl mx-auto relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <ShieldCheck className="w-40 h-40 text-blue-50" />
                    </div>
                    <div className="relative z-10 text-left">
                        <div className="w-12 h-12 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center mb-6">
                            <Lock className="w-5 h-5 text-[#888]" />
                        </div>
                        <h2 className="text-2xl font-bold mb-5 tracking-[-0.02em]">Accès privé aux dossiers complets</h2>
                        <p className="text-[15px] text-[#888] mb-8 leading-relaxed max-w-lg">
                            Lors de notre de premier entretien, un expert de la firme vous détaillera notre méthodologie en situation réelle.<br/><br/>
                            Nous vous montrerons un dossier-type expurgé des données critiques et nous analyserons, de pair, le périmètre d'amélioration propre à votre entreprise.
                        </p>
                        <ContactButton className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-[14px] font-semibold text-black transition hover:bg-[#e0e0e0]">
                            Planifier un entretien diagnostic <ArrowRight className="h-4 w-4" />
                        </ContactButton>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
