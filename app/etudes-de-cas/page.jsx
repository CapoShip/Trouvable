import React from 'react';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import ContactButton from '@/components/ContactButton';
import { Lock, ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
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
                    Nous travaillons au cœur du réacteur des entreprises locales. Par exigence de confidentialité avec nos partenaires, nous n'exposons ni leurs noms ni leurs chiffres de croissance en public. Toutefois, notre mesure des résultats est implacable. (Consultez notre <Link href="/notre-mesure" className="text-[#5b73ff] hover:underline">cadre de mesure métier</Link>).
                </p>

                <div className="grid md:grid-cols-3 gap-6 mb-24 max-w-5xl mx-auto text-left">
                    <div className="group rounded-2xl border border-white/7 bg-[#0f0f0f] p-8 hover:bg-[#5b73ff]/[0.02] hover:border-[#5b73ff]/30 hover:shadow-[0_4px_30px_rgba(91,115,255,0.05)] transition-all overflow-hidden relative cursor-default">
                        <div className="absolute left-0 top-0 h-full w-1 bg-[#5b73ff] opacity-0 group-hover:opacity-100 transition-all duration-300" />
                        <h3 className="text-lg font-bold mb-3 text-white tracking-[-0.01em]">Part de recommandation IA</h3>
                        <p className="text-sm text-[#888] group-hover:text-white/80 transition-colors leading-relaxed">
                            Nous évaluons à quelle fréquence de recommandation stricte votre marque est citée par ChatGPT, Claude ou Gemini lorsqu'un prospect local demande vos services.
                        </p>
                    </div>
                    <div className="group rounded-2xl border border-white/7 bg-[#0f0f0f] p-8 hover:bg-[#5b73ff]/[0.02] hover:border-[#5b73ff]/30 hover:shadow-[0_4px_30px_rgba(91,115,255,0.05)] transition-all overflow-hidden relative cursor-default">
                        <div className="absolute left-0 top-0 h-full w-1 bg-[#5b73ff] opacity-0 group-hover:opacity-100 transition-all duration-300" />
                        <h3 className="text-lg font-bold mb-3 text-white tracking-[-0.01em]">Domination Google Local</h3>
                        <p className="text-sm text-[#888] group-hover:text-white/80 transition-colors leading-relaxed">
                            Nous suivons techniquement votre positionnement sur le "Map Pack" et surveillons le déclenchement des requêtes de type itinéraire, appel, ou clic site originant du trafic naturel.
                        </p>
                    </div>
                    <div className="group rounded-2xl border border-white/7 bg-[#0f0f0f] p-8 hover:bg-[#5b73ff]/[0.02] hover:border-[#5b73ff]/30 hover:shadow-[0_4px_30px_rgba(91,115,255,0.05)] transition-all overflow-hidden relative cursor-default">
                        <div className="absolute left-0 top-0 h-full w-1 bg-[#5b73ff] opacity-0 group-hover:opacity-100 transition-all duration-300" />
                        <h3 className="text-lg font-bold mb-3 text-white tracking-[-0.01em]">Taux de conversion</h3>
                        <p className="text-sm text-[#888] group-hover:text-white/80 transition-colors leading-relaxed">
                            Toute visibilité doit se transformer en client entrant. Nous croisons la hausse de signaux de confiance avec l'impact concret sur vos prises de contact et vos appels de découverte.
                        </p>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/7 bg-[#0d0d0d] p-10 md:p-14 mb-20 relative overflow-hidden flex flex-col items-center text-center">
                    <h2 className="text-2xl font-bold mb-5 tracking-[-0.02em] text-white">Ce que contient un mandat Trouvable.</h2>
                    <p className="text-[15px] text-[#888] leading-relaxed max-w-2xl mb-8">
                        L'exécution de notre mandat produit des résultats d'ingénierie que nous documentons intégralement. Pour saisir l'exactitude des problèmes que nous corrigeons avant même qu'ils n'impactent votre autorité, consultez la vue d'un <strong>Dossier Type</strong>.
                    </p>
                    <Link href="/etudes-de-cas/dossier-type" className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3 text-[14px] font-[600] text-white transition hover:bg-white/[0.08] hover:border-white/30">
                        Consulter un dossier-type expurgé <BookOpen className="h-4 w-4" />
                    </Link>
                </div>

                <div className="rounded-2xl border border-white/7 bg-[#0d0d0d] p-10 md:p-14 max-w-2xl mx-auto relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 right-0 p-6 opacity-10">
                        <ShieldCheck className="w-40 h-40 text-blue-50" />
                    </div>
                    <div className="relative z-10 text-left">
                        <div className="w-12 h-12 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center mb-6">
                            <Lock className="w-5 h-5 text-[#888]" />
                        </div>
                        <h2 className="text-2xl font-bold mb-5 tracking-[-0.02em]">Accès direct à nos données stratégiques</h2>
                        <p className="text-[15px] text-[#888] mb-8 leading-relaxed max-w-lg">
                            Lors de notre de premier entretien, un expert de la firme vous détaillera notre méthodologie en situation réelle.<br/><br/>
                            Nous vous montrerons de vrais déploiements techniques et comparerons anonymement la puissance de notre infrastructure face à un cabinet concurrent de votre région.
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
