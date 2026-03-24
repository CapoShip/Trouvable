import React from 'react';
import Navbar from '@/components/Navbar';
import SiteFooter from '@/components/SiteFooter';
import ContactButton from '@/components/ContactButton';
import FadeIn from '@/components/premium/FadeIn';
import { ArrowRight, Layers, FileCode2, LineChart, Zap, CheckCircle2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: "Notre méthode d'exécution | Trouvable",
    description: 'Mandats cadrés : visibilité organique Google et cohérence dans les réponses IA. Méthode stricte, livrables tangibles, compte rendu.',
};

const STEPS = [
    { icon: Layers, accent: '#5b73ff', title: 'Audit et cartographie initiale', desc: "Avant d'agir, nous cartographions vos signaux actuels. Nous mesurons l'exactitude de vos profils publics, la qualité technique de votre site et, surtout, nous identifions si les algorithmes (Google et IA) vous comprennent correctement face à vos concurrents." },
    { icon: FileCode2, accent: '#34d399', title: 'Mise aux normes (Google & IA)', desc: "Nos experts structurent vos informations sans perturber votre infrastructure. Nous nettoyons les incohérences de données, appliquons les formats structurés attendus (Schema.org) et créons les contenus nécessaires (fichiers llms.txt) pour nourrir les moteurs d'intelligence artificielle proprement." },
    { icon: Zap, accent: '#f59e0b', title: 'Enrichissement conversationnel (GEO)', desc: 'Nous formatons les spécificités de votre activité pour que l\'IA puisse vous recommander avec certitude aux internautes posant des questions complexes (e.g. "Quel est le meilleur constructeur près de chez moi pour mon type de projet ?").' },
    { icon: LineChart, accent: '#5b73ff', title: 'Boucle de validation et suivi', desc: "Chaque mois, nous vérifions par relevés contrôlés comment vous progressez dans les recommandations organiques. Nous ajustons notre exécution en fonction de données réelles pour pérenniser vos acquis." },
];

const OUTCOMES = [
    { title: 'Gain de temps', desc: "Nous exécutons les tâches techniques. Vous n'avez pas à en assumer la mise en \u0153uvre." },
    { title: 'Clarté commerciale', desc: 'Les clients qui cherchent vos services trouvent des informations exactes et structurées partout.' },
    { title: 'Sécurité d\u2019avenir', desc: "Pendant que vos concurrents ignorent l'IA, votre profil est déjà configuré pour être cité." },
];

export default function MethodologyPage() {
    return (
        <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
            <Navbar />
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.06),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

            <main>
                <section className="relative mt-[58px] overflow-hidden px-6 pt-[80px] pb-4 sm:pt-[110px]">
                    <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_25%,transparent_100%)]" />
                    <div className="pointer-events-none absolute left-1/2 top-[-120px] z-0 h-[600px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(91,115,255,0.12)_0%,transparent_58%)]" />

                    <div className="relative z-[1] mx-auto max-w-[860px] text-center">
                        <div className="animate-[fadeUp_0.6s_ease-out_both] mb-5 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#7b8fff]">
                            <ShieldCheck className="h-3.5 w-3.5" /> Comment nous opérons
                        </div>
                        <h1 className="animate-[fadeUp_0.7s_ease-out_0.08s_both] text-[clamp(36px,6vw,72px)] font-bold leading-[1.06] tracking-[-0.045em] mb-6">
                            Une méthode rigoureuse,<br /><span className="bg-gradient-to-b from-white/50 to-white/20 bg-clip-text text-transparent">zéro boîte noire.</span>
                        </h1>
                        <p className="animate-[fadeUp_0.6s_ease-out_0.16s_both] mx-auto max-w-[600px] text-[17px] leading-[1.65] text-[#a0a0a0] mb-10">
                            Notre approche est d&apos;une grande rigueur. Nous appliquons les standards du SEO local tout en y ajoutant les critères spécifiques exigés par les Intelligences Artificielles.
                        </p>
                        <div className="animate-[fadeUp_0.5s_ease-out_0.24s_both] flex flex-wrap justify-center gap-3">
                            <ContactButton className="rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:-translate-y-px hover:bg-[#e8e8e8]">
                                Demander un diagnostic
                            </ContactButton>
                            <Link href="/offres" className="rounded-lg border border-white/15 px-7 py-3.5 text-sm font-medium text-[#a0a0a0] transition hover:-translate-y-px hover:border-white/30 hover:text-white">
                                Voir les mandats →
                            </Link>
                        </div>
                    </div>
                </section>

                <section className="border-t border-white/[0.05] px-6 py-28 sm:px-10">
                    <div className="mx-auto max-w-[900px]">
                        <FadeIn className="mb-4 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-[#7b8fff]">
                            Les quatre phases
                        </FadeIn>
                        <FadeIn delay={0.06} className="mb-16 text-center text-[clamp(26px,3.5vw,42px)] font-bold tracking-[-0.04em]">
                            Chaque mandat suit un cadre strict
                        </FadeIn>

                        <div className="relative">
                            <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/8 to-transparent md:block" />

                            <div className="space-y-10 md:space-y-0">
                                {STEPS.map((step, i) => {
                                    const Icon = step.icon;
                                    const isLeft = i % 2 === 0;
                                    return (
                                        <FadeIn key={step.title} delay={i * 0.08} direction={isLeft ? 'right' : 'left'} className={`relative flex items-start gap-6 md:gap-0 ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} md:items-center md:py-8`}>
                                            <div className={`hidden md:flex md:w-1/2 ${isLeft ? 'md:justify-end md:pr-12' : 'md:justify-start md:pl-12'}`}>
                                                <div className="max-w-[350px] rounded-xl border border-white/6 bg-white/[0.02] p-6 transition-colors hover:border-white/12 hover:bg-white/[0.04]">
                                                    <div className="mb-2 flex items-center gap-3">
                                                        <div className="grid h-9 w-9 place-items-center rounded-lg border bg-white/[0.03]" style={{ borderColor: `${step.accent}25` }}>
                                                            <Icon className="h-4 w-4" style={{ color: step.accent }} />
                                                        </div>
                                                        <span className="text-[15px] font-semibold text-white">{step.title}</span>
                                                    </div>
                                                    <p className="text-[13px] leading-[1.6] text-[#999]">{step.desc}</p>
                                                </div>
                                            </div>

                                            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#0d0d0d] md:absolute md:left-1/2 md:-translate-x-1/2">
                                                <span className="font-mono text-[11px] font-bold" style={{ color: step.accent }}>{String(i + 1).padStart(2, '0')}</span>
                                            </div>

                                            <div className="flex-1 md:hidden">
                                                <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold text-white">
                                                    <Icon className="h-4 w-4" style={{ color: step.accent }} />
                                                    {step.title}
                                                </div>
                                                <p className="text-[13px] leading-[1.6] text-[#999]">{step.desc}</p>
                                            </div>

                                            <div className="hidden md:block md:w-1/2" />
                                        </FadeIn>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-t border-white/[0.05] bg-[#0a0a0a] px-6 py-28 sm:px-10">
                    <div className="mx-auto max-w-[1000px]">
                        <FadeIn className="mb-4 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-400">
                            Résultat pour vous
                        </FadeIn>
                        <FadeIn delay={0.06} className="mb-14 text-center text-[clamp(26px,3.5vw,42px)] font-bold tracking-[-0.04em]">
                            Ce que cela change pour vous
                        </FadeIn>

                        <div className="grid gap-5 sm:grid-cols-3">
                            {OUTCOMES.map((o, i) => (
                                <FadeIn key={o.title} delay={0.08 + i * 0.08}>
                                    <div className="group rounded-2xl border border-white/7 bg-[#0d0d0d] p-7 transition-all hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.03]">
                                        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                                        <CheckCircle2 className="mb-5 h-5 w-5 text-emerald-400" />
                                        <div className="mb-2 text-[15px] font-semibold text-white">{o.title}</div>
                                        <div className="text-[13px] leading-[1.6] text-[#888]">{o.desc}</div>
                                    </div>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="relative overflow-hidden border-t border-white/[0.05] px-6 py-28 sm:px-10">
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] bg-[radial-gradient(ellipse,rgba(91,115,255,0.06)_0%,transparent_60%)]" />
                    <FadeIn className="relative z-10 mx-auto max-w-[700px] rounded-2xl border border-white/10 bg-[#0d0d0d] p-10 sm:p-14 text-center shadow-[0_40px_100px_rgba(0,0,0,0.4)]">
                        <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7b8fff]">Prochaine étape</div>
                        <h3 className="mb-5 text-[clamp(22px,3vw,32px)] font-bold tracking-[-0.03em]">Prêt à déléguer votre visibilité ?</h3>
                        <p className="mx-auto mb-8 max-w-md text-[15px] leading-[1.65] text-[#a0a0a0]">
                            Renforcez votre acquisition là où vos clients cherchent. Notre méthode sécurise votre visibilité organique et la cohérence de votre signal.
                        </p>
                        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                            <ContactButton className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:-translate-y-px hover:bg-[#e8e8e8]">
                                Demander un diagnostic <ArrowRight className="h-4 w-4" />
                            </ContactButton>
                            <Link href="/etudes-de-cas/dossier-type" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-7 py-3.5 text-sm font-medium text-[#a0a0a0] transition hover:border-white/30 hover:text-white">
                                Consulter un dossier-type
                            </Link>
                        </div>
                    </FadeIn>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}
