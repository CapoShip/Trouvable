import React from 'react';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import ContactButton from '@/components/ContactButton';
import FadeIn from '@/components/premium/FadeIn';
import { ArrowRight, CheckCircle2, XCircle, Users, Target, MapPin, Shield } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'À propos de notre Firme | Trouvable',
    description: 'Découvrez la firme Trouvable : notre engagement, notre méthode et ce qui nous distingue des agences traditionnelles.',
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
            <Navbar />
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.06),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

            <main>
                <section className="relative mt-[58px] overflow-hidden px-6 pt-[80px] pb-4 sm:pt-[110px]">
                    <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_25%,transparent_100%)]" />
                    <div className="pointer-events-none absolute left-1/2 top-[-120px] z-0 h-[600px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(91,115,255,0.12)_0%,transparent_58%)]" />

                    <div className="relative z-[1] mx-auto max-w-[860px]">
                        <div className="animate-[fadeUp_0.6s_ease-out_both] mb-5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#7b8fff]">Notre firme</div>
                        <h1 className="animate-[fadeUp_0.7s_ease-out_0.08s_both] text-[clamp(36px,6vw,72px)] font-bold leading-[1.06] tracking-[-0.045em] mb-6">
                            Une firme derrière<br /><span className="bg-gradient-to-b from-white/50 to-white/20 bg-clip-text text-transparent">votre signal public.</span>
                        </h1>
                        <p className="animate-[fadeUp_0.6s_ease-out_0.16s_both] max-w-[640px] text-[17px] leading-[1.65] text-[#a0a0a0]">
                            Trouvable n&apos;est pas une étiquette &laquo;&nbsp;agence SEO&nbsp;&raquo; générique : nous sommes une firme d&apos;exécution sur mandat, spécialisée en visibilité organique locale sur Google et en cohérence de votre présence dans les réponses des grands modèles conversationnels.
                        </p>
                    </div>
                </section>

                <section className="border-t border-white/[0.05] px-6 py-28 sm:px-10">
                    <div className="mx-auto max-w-[1100px] grid gap-8 md:grid-cols-2">
                        <FadeIn>
                            <div className="relative h-full overflow-hidden rounded-2xl border border-white/7 bg-[#0d0d0d] p-8 md:p-10 transition-colors hover:border-emerald-400/15">
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-emerald-400/40 to-transparent" />
                                <div className="flex items-center gap-3 mb-7">
                                    <div className="grid h-10 w-10 place-items-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                    </div>
                                    <h2 className="text-xl font-bold tracking-[-0.02em]">Ce que nous faisons</h2>
                                </div>
                                <ul className="space-y-5">
                                    {[
                                        'Nous assurons une exécution technique complète (Schema.org, données structurées) pour que les algorithmes comprennent votre activité.',
                                        'Nous enrichissons votre présence en ligne en préparant votre marque pour les requêtes conversationnelles (GEO).',
                                        'Nous assurons un suivi continu, face à des moteurs de recherche en mutation permanente, pour que vous gardiez votre avance.',
                                    ].map((text, i) => (
                                        <li key={i} className="flex gap-3 text-[14px] text-[#a0a0a0] leading-[1.65]">
                                            <span className="mt-1 font-mono text-[11px] text-white/25 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                                            <span>{text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </FadeIn>
                        <FadeIn delay={0.1}>
                            <div className="relative h-full overflow-hidden rounded-2xl border border-white/7 bg-[#0d0d0d] p-8 md:p-10 transition-colors hover:border-rose-400/15">
                                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-rose-400/40 to-transparent" />
                                <div className="flex items-center gap-3 mb-7">
                                    <div className="grid h-10 w-10 place-items-center rounded-lg border border-rose-500/20 bg-rose-500/10">
                                        <XCircle className="h-5 w-5 text-rose-400" />
                                    </div>
                                    <h2 className="text-xl font-bold tracking-[-0.02em]">Ce que nous ne faisons pas</h2>
                                </div>
                                <ul className="space-y-5">
                                    {[
                                        'Nous ne vendons pas d\u2019accès à un produit à configurer vous-même. Nous opérons pour vous, sur mandat.',
                                        'Nous ne produisons pas de \u00AB rapports automatisés \u00BB inutiles ; nous produisons des résultats vérifiables.',
                                        'Nous ne nous occupons pas de création de sites vitrines créatifs. Notre spécialité est l\u2019ingénierie de la visibilité.',
                                    ].map((text, i) => (
                                        <li key={i} className="flex gap-3 text-[14px] text-[#a0a0a0] leading-[1.65]">
                                            <span className="mt-1 font-mono text-[11px] text-white/25 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                                            <span>{text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </FadeIn>
                    </div>
                </section>

                <section className="border-t border-white/[0.05] bg-[#0a0a0a] px-6 py-28 sm:px-10">
                    <div className="mx-auto max-w-[1100px] grid gap-8 md:grid-cols-2">
                        <FadeIn>
                            <div className="group rounded-2xl border border-white/7 bg-[#0d0d0d] p-8 md:p-10 transition-all hover:border-[#5b73ff]/25">
                                <Users className="mb-6 h-6 w-6 text-[#5b73ff]" />
                                <h3 className="mb-3 text-xl font-bold tracking-[-0.02em]">Nos domaines d&apos;intervention</h3>
                                <p className="mb-8 text-[15px] leading-[1.65] text-[#a0a0a0]">
                                    Nous opérons exclusivement pour des firmes de services locaux dont l&apos;expertise implique un haut niveau de confiance (droit, finance, construction, santé).
                                </p>
                                <Link href="/expertises/avocats" className="inline-flex items-center gap-2 text-[14px] font-medium text-[#7b8fff] transition-colors hover:text-white">
                                    Voir nos expertises sectorielles <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </FadeIn>
                        <FadeIn delay={0.1}>
                            <div className="group rounded-2xl border border-white/7 bg-[#0d0d0d] p-8 md:p-10 transition-all hover:border-emerald-400/25">
                                <MapPin className="mb-6 h-6 w-6 text-emerald-400" />
                                <h3 className="mb-3 text-xl font-bold tracking-[-0.02em]">Notre ancrage local</h3>
                                <p className="mb-8 text-[15px] leading-[1.65] text-[#a0a0a0]">
                                    Nos stratégies ciblent la domination géographique stricte. Nos experts préparent votre marque pour les plus grands marchés de la province.
                                </p>
                                <Link href="/villes/montreal" className="inline-flex items-center gap-2 text-[14px] font-medium text-emerald-400 transition-colors hover:text-white">
                                    Découvrir nos marchés locaux <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </FadeIn>
                    </div>
                </section>

                <section className="border-t border-white/[0.05] px-6 py-28 sm:px-10">
                    <FadeIn className="mx-auto max-w-[1000px]">
                        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] p-8 md:p-12">
                            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-[#5b73ff]/40 to-transparent" />
                            <div className="grid gap-12 md:grid-cols-2 items-center">
                                <div>
                                    <h2 className="mb-5 text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.03em]">Notre philosophie d&apos;intervention</h2>
                                    <p className="mb-6 text-[15px] leading-[1.65] text-[#a0a0a0]">
                                        La technologie doit propulser le commerce local, et non l&apos;alourdir. Vous n&apos;avez pas le temps de décrypter l&apos;algorithme de ChatGPT, ni de gérer un nouvel outil supplémentaire.
                                    </p>
                                    <p className="mb-8 text-[15px] leading-[1.65] text-[#a0a0a0]">
                                        C&apos;est notre rôle. Nous traduisons l&apos;excellence de votre métier en signaux techniques et sémantiques irréprochables pour que les intelligences artificielles vous reconnaissent intuitivement comme le leader de votre marché.
                                    </p>
                                    <ContactButton className="inline-flex items-center gap-2 text-sm font-medium text-[#7b8fff] transition hover:text-white">
                                        Rencontrer l&apos;équipe <ArrowRight className="h-4 w-4" />
                                    </ContactButton>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-5 items-start transition-colors hover:border-white/10 hover:bg-white/[0.04]">
                                        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                                        <div>
                                            <div className="mb-1 text-sm font-semibold text-white/90">Confidentialité absolue</div>
                                            <div className="text-[12px] leading-[1.6] text-[#888]">Les données de stratégies et les chiffres de croissance de nos clients sont protégés et jamais diffusés publiquement sans accord.</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-5 items-start transition-colors hover:border-white/10 hover:bg-white/[0.04]">
                                        <Target className="mt-0.5 h-5 w-5 shrink-0 text-[#5b73ff]" />
                                        <div>
                                            <div className="mb-1 text-sm font-semibold text-white/90">Rigueur d&apos;exécution</div>
                                            <div className="text-[12px] leading-[1.6] text-[#888]">Une méthodologie stricte appuyée par un contrôle humain à chaque étape du déploiement.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeIn>
                </section>

                <section className="relative overflow-hidden border-t border-white/[0.05] bg-[#0a0a0a] px-6 py-28 sm:px-10">
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] bg-[radial-gradient(ellipse,rgba(91,115,255,0.06)_0%,transparent_60%)]" />
                    <FadeIn className="relative z-10 mx-auto max-w-[620px] text-center">
                        <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7b8fff]">Prochaine étape</div>
                        <h3 className="mb-5 text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.03em]">Prêt à travailler avec nous ?</h3>
                        <p className="mx-auto mb-8 max-w-md text-[15px] leading-[1.65] text-[#a0a0a0]">
                            Découvrez nos mandats et identifions ensemble le périmètre adapté à votre situation.
                        </p>
                        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                            <ContactButton className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:-translate-y-px hover:bg-[#e8e8e8]">
                                Planifier un appel <ArrowRight className="h-4 w-4" />
                            </ContactButton>
                            <Link href="/offres" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-7 py-3.5 text-sm font-medium text-[#a0a0a0] transition hover:border-white/30 hover:text-white">
                                Voir les mandats
                            </Link>
                        </div>
                    </FadeIn>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
