import React from 'react';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import ContactButton from '@/components/ContactButton';
import { ArrowRight, CheckCircle2, Shield, XCircle, Users, Target } from 'lucide-react';

export const metadata = {
    title: 'À propos de notre Firme | Trouvable',
    description: 'Découvrez la firme Trouvable : notre engagement, notre méthode et ce qui nous distingue des agences traditionnelles.',
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
            <Navbar />
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.08),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

            <main className="pt-32 pb-24 px-6 md:px-10 max-w-5xl mx-auto">
                <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#7b8fff]">
                    Notre firme
                </div>
                <h1 className="text-[clamp(36px,5vw,56px)] font-bold leading-[1.08] tracking-[-0.04em] mb-8">
                    L'équipe d'experts derrière <br/><span className="text-[#666]">votre visibilité IA.</span>
                </h1>
                <p className="text-lg leading-relaxed text-[#a0a0a0] mb-16 max-w-3xl">
                    Trouvable n'est pas une "agence SEO" classique ni un logiciel d'analyse. Nous sommes une firme d'exécution spécialisée en visibilité locale et intelligence générative. 
                    <br/><br/>
                    Notre mission est univoque : garantir que votre entreprise soit trouvée, comprise et recommandée en priorité par les nouveaux moteurs de recherche et les intelligences artificielles (ChatGPT, Gemini, Claude).
                </p>

                <div className="grid md:grid-cols-2 gap-8 mb-20">
                    <div className="rounded-2xl border border-white/7 bg-[#0d0d0d] p-8 md:p-10 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-bold tracking-[-0.02em]">Ce que nous faisons</h2>
                        </div>
                        <ul className="space-y-4 relative z-10">
                            <li className="flex gap-3 text-sm text-[#a0a0a0] leading-relaxed">
                                <span className="opacity-50 mt-1 font-mono text-[11px]">01</span>
                                <span>Nous assurons une exécution technique complète (Schema.org, données structurées) pour que les algorithmes comprennent votre activité.</span>
                            </li>
                            <li className="flex gap-3 text-sm text-[#a0a0a0] leading-relaxed">
                                <span className="opacity-50 mt-1 font-mono text-[11px]">02</span>
                                <span>Nous enrichissons votre présence en ligne en préparant votre marque pour les requêtes conversationnelles (GEO).</span>
                            </li>
                            <li className="flex gap-3 text-sm text-[#a0a0a0] leading-relaxed">
                                <span className="opacity-50 mt-1 font-mono text-[11px]">03</span>
                                <span>Nous assurons un suivi continu, face à des moteurs de recherche en mutation permanente, pour que vous gardiez votre avance acquise.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-2xl border border-white/7 bg-[#0d0d0d] p-8 md:p-10 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20">
                                <XCircle className="w-5 h-5 text-rose-400" />
                            </div>
                            <h2 className="text-xl font-bold tracking-[-0.02em]">Ce que nous ne faisons pas</h2>
                        </div>
                        <ul className="space-y-4 relative z-10">
                            <li className="flex gap-3 text-sm text-[#a0a0a0] leading-relaxed">
                                <span className="opacity-50 mt-1 font-mono text-[11px]">01</span>
                                <span>Nous ne vendons pas d'accès à un logiciel vide (SaaS) en vous demandant d'apprendre à vous en servir. Nous opérons pour vous.</span>
                            </li>
                            <li className="flex gap-3 text-sm text-[#a0a0a0] leading-relaxed">
                                <span className="opacity-50 mt-1 font-mono text-[11px]">02</span>
                                <span>Nous ne produisons pas de "rapports automatisés" standardisés et inutiles ; nous produisons des résultats vérifiables.</span>
                            </li>
                            <li className="flex gap-3 text-sm text-[#a0a0a0] leading-relaxed">
                                <span className="opacity-50 mt-1 font-mono text-[11px]">03</span>
                                <span>Nous ne nous occupons pas de création de sites vitrines créatifs. Notre spécialité est l'ingénierie stricte de la visibilité.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-8 md:p-12 mb-20 relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#5b73ff]/40 to-transparent" />
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-2xl font-bold mb-5 tracking-[-0.02em] text-white">Notre philosophie d'intervention</h2>
                            <p className="text-[15px] leading-relaxed text-[#a0a0a0] mb-6">
                                La technologie doit propulser le commerce local, et non l'alourdir. Vous n'avez pas le temps de décrypter l'algorithme de ChatGPT, ni de gérer un nouvel outil SaaS supplémentaire.
                                <br/><br/>
                                C'est notre rôle. Nous traduisons l'excellence de votre métier en signaux techniques et sémantiques irréprochables pour que les intelligences artificielles vous reconnaissent intuitivement comme le leader de votre marché.
                            </p>
                            <ContactButton className="inline-flex items-center gap-2 text-sm font-medium text-[#7b8fff] hover:text-white transition group">
                                Rencontrer l'équipe <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </ContactButton>
                        </div>
                        <div className="space-y-4">
                            <div className="flex bg-[#141414] border border-white/5 rounded-xl p-5 items-start gap-4">
                                <Shield className="w-5 h-5 text-amber-500 mt-1 shrink-0" />
                                <div>
                                    <div className="font-semibold text-white/90 text-sm mb-1">Confidentialité absolue</div>
                                    <div className="text-xs text-[#888] leading-relaxed">Les données de stratégies et les chiffres de croissance de nos clients sont protégés et jamais diffusés publiquement sans accord.</div>
                                </div>
                            </div>
                            <div className="flex bg-[#141414] border border-white/5 rounded-xl p-5 items-start gap-4">
                                <Target className="w-5 h-5 text-[#5b73ff] mt-1 shrink-0" />
                                <div>
                                    <div className="font-semibold text-white/90 text-sm mb-1">Rigueur d'exécution</div>
                                    <div className="text-xs text-[#888] leading-relaxed">Une méthodologie stricte appuyée par un contrôle humain à chaque étape du déploiement.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
