import React from 'react';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import ContactButton from '@/components/ContactButton';
import { ArrowRight, Layers, FileCode2, LineChart, Zap, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
export const metadata = {
    title: 'Notre méthode d\'exécution | Trouvable',
    description: 'Mandats cadrés : visibilité organique Google et cohérence dans les réponses IA. Méthode stricte, livrables tangibles, compte rendu.',
};

export default function MethodologyPage() {
    return (
        <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
            <Navbar />
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.08),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

            <main className="pt-32 pb-24 px-6 md:px-10 max-w-5xl mx-auto">
                <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8fff]">
                    Comment nous opérons
                </div>
                <h1 className="text-[clamp(36px,5vw,56px)] font-bold leading-[1.08] tracking-[-0.04em] mb-8 max-w-3xl">
                    Une méthode rigoureuse, <br/><span className="text-[#666]">zéro boîte noire.</span>
                </h1>
                <p className="text-lg leading-relaxed text-[#a0a0a0] mb-16 max-w-2xl">
                    Notre approche est d'une grande rigueur. Nous appliquons les standards du SEO local tout en y ajoutant les critères spécifiques exigés par les Intelligences Artificielles (ChatGPT, Claude, Gemini).
                </p>

                <div className="relative border-l border-white/10 ml-4 md:ml-8 pl-8 md:pl-12 space-y-16 mb-24 mt-8">
                    
                    <div className="relative">
                        <div className="absolute -left-[41px] md:-left-[57px] top-1 w-8 h-8 rounded-full bg-[#0d0d0d] border border-white/20 flex items-center justify-center">
                            <Layers className="w-4 h-4 text-[#5b73ff]" />
                        </div>
                        <h2 className="text-xl font-bold mb-3 tracking-[-0.01em]">1. Audit et cartographie initiale</h2>
                        <p className="text-[15px] text-[#a0a0a0] leading-relaxed max-w-2xl">
                            Avant d'agir, nous cartographions vos signaux actuels. Nous mesurons l'exactitude de vos profils publics, la qualité technique de votre site et, surtout, nous identifions si les algorithmes (Google et IA) vous comprennent correctement face à vos concurrents.
                        </p>
                    </div>

                    <div className="relative">
                        <div className="absolute -left-[41px] md:-left-[57px] top-1 w-8 h-8 rounded-full bg-[#0d0d0d] border border-white/20 flex items-center justify-center">
                            <FileCode2 className="w-4 h-4 text-emerald-400" />
                        </div>
                        <h2 className="text-xl font-bold mb-3 tracking-[-0.01em]">2. Mise aux normes (Google & IA)</h2>
                        <p className="text-[15px] text-[#a0a0a0] leading-relaxed max-w-2xl">
                            Nos experts structurent vos informations sans perturber votre infrastructure. Nous nettoyons les incohérences de données, appliquons les formats structurés attendus (Schema.org) et créons les contenus nécessaires (fichiers llms.txt) pour nourrir les moteurs d'intelligence artificielle proprement.
                        </p>
                    </div>

                    <div className="relative">
                        <div className="absolute -left-[41px] md:-left-[57px] top-1 w-8 h-8 rounded-full bg-[#0d0d0d] border border-white/20 flex items-center justify-center">
                            <Zap className="w-4 h-4 text-amber-400" />
                        </div>
                        <h2 className="text-xl font-bold mb-3 tracking-[-0.01em]">3. Enrichissement conversationnel (GEO)</h2>
                        <p className="text-[15px] text-[#a0a0a0] leading-relaxed max-w-2xl">
                            Nous formatons les spécificités de votre activité pour que l'IA puisse vous recommander avec certitude aux internautes posant des questions complexes (e.g. "Quel est le meilleur constructeur près de chez moi pour mon type de projet ?").
                        </p>
                    </div>

                    <div className="relative">
                        <div className="absolute -left-[41px] md:-left-[57px] top-1 w-8 h-8 rounded-full bg-[#0d0d0d] border border-white/20 flex items-center justify-center">
                            <LineChart className="w-4 h-4 text-[#5b73ff]" />
                        </div>
                        <h2 className="text-xl font-bold mb-3 tracking-[-0.01em]">4. Boucle de validation et suivi</h2>
                        <p className="text-[15px] text-[#a0a0a0] leading-relaxed max-w-2xl">
                            Chaque mois, nous vérifions par relevés contrôlés comment vous progressez dans les recommandations organiques. Nous ajustons notre exécution en fonction de données réelles pour pérenniser vos acquis.
                        </p>
                    </div>
                </div>

                <div className="mb-20">
                    <h3 className="text-lg font-bold mb-6 tracking-[-0.01em]">Ce que cela change pour vous</h3>
                    <div className="grid sm:grid-cols-3 gap-6">
                        <div className="rounded-xl border border-white/7 bg-[#0d0d0d] p-6">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-4" />
                            <div className="font-semibold text-[15px] mb-2">Gain de temps</div>
                            <div className="text-sm text-[#888] leading-relaxed">Nous exécutons les tâches techniques. Vous n&apos;avez pas à en assumer la mise en œuvre.</div>
                        </div>
                        <div className="rounded-xl border border-white/7 bg-[#0d0d0d] p-6">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-4" />
                            <div className="font-semibold text-[15px] mb-2">Clarté commerciale</div>
                            <div className="text-sm text-[#888] leading-relaxed">Les clients qui cherchent vos services trouvent des informations exactes et structurées partout.</div>
                        </div>
                        <div className="rounded-xl border border-white/7 bg-[#0d0d0d] p-6">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-4" />
                            <div className="font-semibold text-[15px] mb-2">Sécurité d'avenir</div>
                            <div className="text-sm text-[#888] leading-relaxed">Pendant que vos concurrents ignorent l'IA, votre profil est déjà configuré pour être cité.</div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/7 bg-[#0f0f0f] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                    <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#5b73ff]/40 to-transparent" />
                    <div className="max-w-xl">
                        <h3 className="text-2xl font-bold mb-3 tracking-[-0.02em]">Prêt à déléguer votre visibilité ?</h3>
                        <p className="text-[15px] text-[#888] leading-relaxed mb-6">
                            Renforcez votre acquisition là où vos clients cherchent. Notre méthode sécurise votre visibilité organique et la cohérence de votre signal face à Google et aux réponses IA.
                        </p>
                        <Link href="/etudes-de-cas/dossier-type" className="inline-flex items-center gap-2 text-sm font-medium text-[#7b8fff] hover:text-white transition group">
                            Consulter un dossier-type expurgé <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <Link href="/offres" className="whitespace-nowrap px-6 py-3 rounded-lg border border-white/10 bg-white/[0.03] text-[14px] font-[600] transition hover:bg-white/[0.08]">
                            Voir nos prestations
                        </Link>
                        <ContactButton className="whitespace-nowrap px-6 py-3 rounded-lg bg-white text-black text-[14px] font-[600] transition hover:bg-[#e0e0e0]">
                            Demander un diagnostic
                        </ContactButton>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
