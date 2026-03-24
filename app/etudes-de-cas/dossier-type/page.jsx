import React from 'react';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import ContactButton from '@/components/ContactButton';
import FadeIn from '@/components/premium/FadeIn';
import { ArrowRight, Lock, CheckCircle2, ChevronRight, FileSearch, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: "Structure d'un Dossier Type | Trouvable",
    description: "Découvrez la structure et le niveau de détail d'un mandat d'exécution chez Trouvable, avec des exemples concrets anonymisés.",
};

export default function DossierTypePage() {
    return (
        <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
            <Navbar />
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.06),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

            <main>
                <section className="relative mt-[58px] overflow-hidden px-6 pt-[80px] pb-4 sm:pt-[100px]">
                    <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_25%,transparent_100%)]" />
                    <div className="pointer-events-none absolute left-1/2 top-[-120px] z-0 h-[600px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(91,115,255,0.10)_0%,transparent_58%)]" />

                    <div className="relative z-[1] mx-auto max-w-[860px]">
                        <nav className="animate-[fadeUp_0.5s_ease-out_both] mb-8 flex items-center gap-2 text-[12px] font-medium text-white/40">
                            <Link href="/etudes-de-cas" className="transition-colors hover:text-white">Résultats</Link>
                            <ChevronRight className="h-3 w-3" />
                            <span className="text-[#a0a0a0]">Dossier Type</span>
                        </nav>
                        <div className="animate-[fadeUp_0.6s_ease-out_0.06s_both] mb-6 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-1.5 text-[11px] font-medium text-white/60">
                            <Lock className="h-3.5 w-3.5" /> Données anonymisées pour confidentialité
                        </div>
                        <h1 className="animate-[fadeUp_0.7s_ease-out_0.1s_both] text-[clamp(32px,5vw,64px)] font-bold leading-[1.06] tracking-[-0.045em] mb-6">
                            Anatomie d&apos;un<br /><span className="bg-gradient-to-b from-white/50 to-white/20 bg-clip-text text-transparent">Mandat d&apos;Exécution.</span>
                        </h1>
                        <p className="animate-[fadeUp_0.6s_ease-out_0.16s_both] max-w-[600px] text-[17px] leading-[1.65] text-[#a0a0a0]">
                            Nos clients n&apos;achètent pas une promesse, ils acquièrent une ingénierie stricte. Voici exactement à quoi ressemble un dossier de déploiement avant, pendant et après notre intervention.
                        </p>
                    </div>
                </section>

                <section className="border-t border-white/[0.05] px-6 py-20 sm:px-10">
                    <div className="mx-auto max-w-[900px] space-y-10">
                        <FadeIn>
                            <div className="overflow-hidden rounded-2xl border border-white/7 bg-[#0d0d0d]">
                                <div className="flex items-center justify-between border-b border-white/5 bg-[#121212] px-8 py-5">
                                    <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-white/50">
                                        <FileSearch className="h-4 w-4" /> 1. Le Diagnostic Avant Intervention
                                    </h2>
                                    <span className="rounded bg-red-500/10 px-2 py-1 text-[10px] font-bold uppercase text-red-400">Risque Critique</span>
                                </div>
                                <div className="p-8">
                                    <p className="mb-6 text-[14px] leading-[1.65] text-[#a0a0a0]">
                                        Exemple concret d&apos;un cabinet juridique montréalais générant déjà du bouche-à-oreille, mais invisible sur les nouveaux algorithmes locaux.
                                    </p>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="group relative overflow-hidden rounded-xl border border-red-500/10 bg-red-500/[0.02] p-5 transition-all hover:border-red-500/25 hover:bg-red-500/[0.05] cursor-default">
                                            <div className="absolute left-0 top-0 h-full w-1 bg-red-500 opacity-0 transition-opacity group-hover:opacity-100" />
                                            <div className="mb-2 text-[13px] font-bold uppercase tracking-wide text-red-400">Faille SEO (Google Maps)</div>
                                            <ul className="space-y-2 text-[13px] text-[#888] group-hover:text-white/70 transition-colors">
                                                <li>• Fiche d&apos;établissement revendiquée mais non catégorisée.</li>
                                                <li>• Aucune donnée Schema.org pour confirmer l&apos;adresse à Google.</li>
                                            </ul>
                                        </div>
                                        <div className="group relative overflow-hidden rounded-xl border border-amber-500/10 bg-amber-500/[0.02] p-5 transition-all hover:border-amber-500/25 hover:bg-amber-500/[0.05] cursor-default">
                                            <div className="absolute left-0 top-0 h-full w-1 bg-amber-500 opacity-0 transition-opacity group-hover:opacity-100" />
                                            <div className="mb-2 text-[13px] font-bold uppercase tracking-wide text-amber-500">Faille IA (GEO)</div>
                                            <ul className="space-y-2 text-[13px] text-[#888] group-hover:text-white/70 transition-colors">
                                                <li>• Sur 10 questions à ChatGPT, le cabinet n&apos;est jamais cité.</li>
                                                <li>• Claude cite un concurrent car sa base est mieux structurée.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>

                        <FadeIn delay={0.1}>
                            <div className="overflow-hidden rounded-2xl border border-white/7 bg-[#0d0d0d]">
                                <div className="flex items-center justify-between border-b border-white/5 bg-[#121212] px-8 py-5">
                                    <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.08em] text-white/50">
                                        <ShieldCheck className="h-4 w-4" /> 2. Le Déploiement Trouvable
                                    </h2>
                                    <span className="rounded bg-[#5b73ff]/10 px-2 py-1 text-[10px] font-bold uppercase text-[#5b73ff]">Ingénierie Structurée</span>
                                </div>
                                <div className="p-8">
                                    <p className="mb-6 text-[14px] leading-[1.65] text-[#a0a0a0]">
                                        Sans que le client n&apos;ait à coder quoi que ce soit, notre équipe produit et intègre l&apos;ensemble de l&apos;architecture visible.
                                    </p>
                                    <div className="space-y-3">
                                        {[
                                            { title: 'Injection Schema.org "Attorney" Local', desc: 'Codage en JSON-LD de tous les champs essentiels pour aligner fiche Maps et entité web à 100%.' },
                                            { title: 'Création de la surcouche "llms.txt"', desc: "Un fichier brut optimisé pour les IA, décrivant l'expertise du cabinet en format Markdown RAG." },
                                            { title: 'Alignement des Signaux de Confiance', desc: "Nettoyage des annuaires juridiques incohérents brouillant l'autorité du cabinet au niveau local." },
                                        ].map((item) => (
                                            <div key={item.title} className="group relative flex gap-4 overflow-hidden rounded-xl border border-white/5 bg-white/[0.01] p-5 transition-all hover:border-emerald-500/20 hover:bg-emerald-500/[0.02] cursor-default">
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0 w-1 rounded-r-full bg-emerald-500 opacity-0 transition-all group-hover:h-3/4 group-hover:opacity-100" />
                                                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                                                <div>
                                                    <div className="mb-1 text-[14px] font-semibold text-white/90 group-hover:text-white transition-colors">{item.title}</div>
                                                    <div className="text-[13px] text-[#888] group-hover:text-white/70 transition-colors">{item.desc}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </FadeIn>

                        <FadeIn delay={0.15}>
                            <div className="relative overflow-hidden rounded-2xl border border-[#5b73ff]/20 bg-[#0d0d0d] shadow-[0_10px_40px_rgba(91,115,255,0.05)]">
                                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-[#5b73ff] to-transparent" />
                                <div className="p-8">
                                    <h2 className="mb-4 text-xl font-bold tracking-[-0.02em]">Ce que nous suivons mois par mois (Mois 3-6)</h2>
                                    <p className="mb-8 text-[14px] leading-[1.65] text-[#a0a0a0]">
                                        Le suivi de notre firme porte sur les dimensions qui créent de l&apos;impact financier pur.
                                    </p>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {[
                                            { label: 'Appels entrants (Maps)', desc: 'Augmentation des clics vers le standard téléphonique.' },
                                            { label: 'Cov. IA', desc: 'Évolution des mentions par ChatGPT sur requêtes locales.' },
                                        ].map((item) => (
                                            <div key={item.label} className="group relative overflow-hidden rounded-xl border border-white/8 bg-white/[0.02] p-5 transition-all hover:border-[#5b73ff]/25 hover:bg-[#5b73ff]/[0.02] cursor-default">
                                                <div className="absolute left-0 top-0 h-full w-1 bg-[#5b73ff] opacity-0 transition-opacity group-hover:opacity-100" />
                                                <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-white/40 group-hover:text-[#7b8fff] transition-colors">{item.label}</div>
                                                <div className="text-sm font-semibold text-white">{item.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-8 border-t border-white/5 pt-6">
                                        <Link href="/notre-mesure" className="inline-flex items-center gap-2 text-[13px] font-medium text-[#7b8fff] transition-colors hover:text-white">
                                            Voir notre cadre de mesure des résultats <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </section>

                <section className="relative overflow-hidden border-t border-white/[0.05] px-6 py-28 sm:px-10">
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] bg-[radial-gradient(ellipse,rgba(91,115,255,0.06)_0%,transparent_60%)]" />
                    <FadeIn className="relative z-10 mx-auto max-w-[620px] text-center">
                        <h3 className="mb-4 text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.02em]">Ouvrez un dossier avec nous.</h3>
                        <p className="mx-auto mb-8 max-w-md text-[15px] leading-[1.65] text-[#a0a0a0]">
                            Le processus est invisible de l&apos;extérieur pour vos concurrents, et totalement pris en charge pour vous de l&apos;intérieur.
                        </p>
                        <ContactButton className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-[15px] font-semibold text-black transition hover:-translate-y-px hover:bg-[#e8e8e8] hover:shadow-[0_20px_60px_rgba(255,255,255,0.06)]">
                            Demander un diagnostic initial <ArrowRight className="h-4 w-4" />
                        </ContactButton>
                    </FadeIn>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
