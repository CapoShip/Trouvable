import React from 'react';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import ContactButton from '@/components/ContactButton';
import FadeIn from '@/components/premium/FadeIn';
import { Lock, ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: "Notre méthode d'évaluation & Métriques | Trouvable",
    description: 'Découvrez comment notre firme suit vos résultats sur Google et ChatGPT tout en respectant une stricte confidentialité.',
};

const METRICS = [
    { title: 'Part de recommandation IA', desc: 'Nous évaluons à quelle fréquence votre marque est citée par ChatGPT, Claude ou Gemini lorsqu\u2019un prospect local demande vos services.' },
    { title: 'Domination Google Local', desc: 'Nous suivons votre positionnement sur le \u00AB Map Pack \u00BB et le déclenchement des requêtes itinéraire, appel et clic site.' },
    { title: 'Taux de conversion', desc: 'Nous croisons la hausse de signaux de confiance avec l\u2019impact concret sur vos prises de contact et vos appels de découverte.' },
];

export default function CasesPage() {
    return (
        <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
            <Navbar />
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.06),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

            <main>
                <section className="relative mt-[58px] overflow-hidden px-6 pt-[80px] pb-4 sm:pt-[110px]">
                    <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_25%,transparent_100%)]" />
                    <div className="pointer-events-none absolute left-1/2 top-[-120px] z-0 h-[600px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(91,115,255,0.10)_0%,transparent_58%)]" />

                    <div className="relative z-[1] mx-auto max-w-[860px] text-center">
                        <div className="animate-[fadeUp_0.6s_ease-out_both] mb-5 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#7b8fff]">
                            Résultats &amp; Métriques
                        </div>
                        <h1 className="animate-[fadeUp_0.7s_ease-out_0.08s_both] text-[clamp(36px,6vw,72px)] font-bold leading-[1.06] tracking-[-0.045em] mb-6">
                            Comment nous documentons<br /><span className="bg-gradient-to-b from-white/50 to-white/20 bg-clip-text text-transparent">vos acquis.</span>
                        </h1>
                        <p className="animate-[fadeUp_0.6s_ease-out_0.16s_both] mx-auto max-w-[600px] text-[17px] leading-[1.65] text-[#a0a0a0]">
                            Par exigence de confidentialité avec nos partenaires, nous n&apos;exposons ni leurs noms ni leurs chiffres de croissance en public. Toutefois, notre mesure des résultats est implacable.
                            <br /><br />
                            <Link href="/notre-mesure" className="text-[#7b8fff] hover:underline transition-colors">Consultez notre cadre de mesure métier →</Link>
                        </p>
                    </div>
                </section>

                <section className="border-t border-white/[0.05] px-6 py-28 sm:px-10">
                    <div className="mx-auto max-w-[1100px]">
                        <div className="grid gap-5 md:grid-cols-3">
                            {METRICS.map((m, i) => (
                                <FadeIn key={m.title} delay={i * 0.08}>
                                    <div className="group relative h-full overflow-hidden rounded-2xl border border-white/7 bg-[#0d0d0d] p-8 transition-all hover:-translate-y-1 hover:border-[#5b73ff]/25 hover:bg-[#5b73ff]/[0.02] cursor-default">
                                        <div className="absolute left-0 top-0 h-full w-1 bg-[#5b73ff] opacity-0 transition-opacity group-hover:opacity-100" />
                                        <h3 className="mb-3 text-lg font-bold text-white tracking-[-0.01em]">{m.title}</h3>
                                        <p className="text-[13px] leading-[1.65] text-[#888] group-hover:text-white/70 transition-colors">{m.desc}</p>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="border-t border-white/[0.05] bg-[#0a0a0a] px-6 py-28 sm:px-10">
                    <FadeIn className="mx-auto max-w-[800px]">
                        <div className="rounded-2xl border border-white/7 bg-[#0d0d0d] p-10 md:p-14 text-center">
                            <h2 className="mb-5 text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.02em]">Ce que contient un mandat Trouvable.</h2>
                            <p className="mx-auto mb-8 max-w-lg text-[15px] leading-[1.65] text-[#888]">
                                L&apos;exécution de notre mandat produit des résultats d&apos;ingénierie que nous documentons intégralement. Consultez la vue d&apos;un <strong className="text-white/80">Dossier Type</strong>.
                            </p>
                            <Link href="/etudes-de-cas/dossier-type" className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/[0.08] hover:border-white/30">
                                Consulter un dossier-type expurgé <BookOpen className="h-4 w-4" />
                            </Link>
                        </div>
                    </FadeIn>
                </section>

                <section className="relative overflow-hidden border-t border-white/[0.05] px-6 py-28 sm:px-10">
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] bg-[radial-gradient(ellipse,rgba(91,115,255,0.06)_0%,transparent_60%)]" />
                    <FadeIn className="relative z-10 mx-auto max-w-[620px]">
                        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] p-10 md:p-14 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.04]">
                                <ShieldCheck className="h-40 w-40 text-white" />
                            </div>
                            <div className="relative z-10">
                                <div className="mb-6 grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.04]">
                                    <Lock className="h-5 w-5 text-[#888]" />
                                </div>
                                <h2 className="mb-5 text-[clamp(22px,3vw,28px)] font-bold tracking-[-0.02em]">Accès direct à nos données stratégiques</h2>
                                <p className="mb-8 text-[15px] leading-[1.65] text-[#888]">
                                    Lors de notre premier entretien, un expert de la firme vous détaillera notre méthodologie en situation réelle. Nous vous montrerons de vrais déploiements techniques et comparerons anonymement la puissance de notre infrastructure face à un cabinet concurrent de votre région.
                                </p>
                                <ContactButton className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:-translate-y-px hover:bg-[#e8e8e8]">
                                    Planifier un entretien diagnostic <ArrowRight className="h-4 w-4" />
                                </ContactButton>
                            </div>
                        </div>
                    </FadeIn>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
