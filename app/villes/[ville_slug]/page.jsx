import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VILLES, EXPERTISES } from '../../../lib/data/geo-architecture';
import Navbar from '../../../components/Navbar';
import SiteFooter from '../../../components/SiteFooter';
import ContactButton from '../../../components/ContactButton';
import GeoSeoInjector from '../../../components/GeoSeoInjector';
import FadeIn from '@/components/premium/FadeIn';
import { SITE_URL } from '@/lib/site-config';
import { ArrowRight, MapPin, AlertTriangle, Wrench, BarChart3, HelpCircle, ChevronDown } from 'lucide-react';

export function generateStaticParams() {
    return VILLES.map((ville) => ({ ville_slug: ville.slug }));
}

export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    const ville = VILLES.find((v) => v.slug === resolvedParams.ville_slug);
    if (!ville) return { title: 'Non trouvé' };
    return {
        title: 'Visibilité IA & Référencement ChatGPT à ' + ville.name + ' | Trouvable',
        description: ville.description,
        metadataBase: new URL(SITE_URL),
        alternates: { canonical: '/villes/' + ville.slug },
        openGraph: {
            title: 'Visibilité IA à ' + ville.name + ' - Trouvable',
            description: ville.description,
            url: '/villes/' + ville.slug,
            siteName: 'Trouvable',
            locale: 'fr_CA',
            type: 'website',
        },
    };
}

export default async function VillePage({ params }) {
    const resolvedParams = await params;
    const ville = VILLES.find((v) => v.slug === resolvedParams.ville_slug);
    if (!ville) notFound();

    const linkedExpertises = ville.linkedExpertises.map((s) => EXPERTISES.find((e) => e.slug === s)).filter(Boolean);

    return (
        <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
            <Navbar />
            <GeoSeoInjector faqs={ville.faqs} breadcrumbs={[{ name: 'Accueil', url: '/' }, { name: 'Villes', url: null }, { name: ville.name, url: '/villes/' + ville.slug }]} baseUrl={SITE_URL} />
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.06),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

            <main>
                <section className="relative mt-[58px] overflow-hidden px-6 pt-[80px] pb-4 sm:pt-[110px]">
                    <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_25%,transparent_100%)]" />
                    <div className="pointer-events-none absolute left-1/2 top-[-120px] z-0 h-[600px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(52,211,153,0.07)_0%,rgba(91,115,255,0.06)_50%,transparent_70%)]" />

                    <div className="relative z-[1] mx-auto max-w-[860px] text-center">
                        <div className="animate-[fadeUp_0.6s_ease-out_both] mb-5 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-400">
                            <MapPin className="h-3.5 w-3.5" /> Expertise Locale : {ville.name}
                        </div>
                        <h1 className="animate-[fadeUp_0.7s_ease-out_0.08s_both] text-[clamp(32px,5.5vw,64px)] font-bold leading-[1.06] tracking-[-0.045em] mb-6">
                            Première recommandation à<br />
                            <span className="bg-gradient-to-r from-emerald-400 to-[#5b73ff] bg-clip-text text-transparent">{ville.name}</span>
                        </h1>
                        <p className="animate-[fadeUp_0.6s_ease-out_0.16s_both] mx-auto max-w-[600px] text-[17px] leading-[1.65] text-[#a0a0a0]">
                            {ville.description}
                        </p>
                    </div>
                </section>

                <article className="mx-auto max-w-[900px] px-6 pb-20">
                    <FadeIn>
                        <section className="border-t border-white/[0.05] py-16" aria-labelledby="problems-heading">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-xl border border-red-400/20 bg-red-400/10">
                                    <AlertTriangle className="h-5 w-5 text-red-400" />
                                </div>
                                <h2 id="problems-heading" className="text-xl font-bold tracking-[-0.02em]">L&apos;angle mort de la visibilité locale à {ville.name}</h2>
                            </div>
                            <ul className="space-y-3">
                                {ville.problems.map((p, i) => (
                                    <li key={i} className="flex items-start gap-3 text-[14px] leading-[1.65] text-[#a0a0a0]">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                                        {p}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </FadeIn>

                    <FadeIn>
                        <section className="border-t border-white/[0.05] py-16" aria-labelledby="methodology-heading">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#5b73ff]/20 bg-[#5b73ff]/10">
                                    <Wrench className="h-5 w-5 text-[#7b8fff]" />
                                </div>
                                <h2 id="methodology-heading" className="text-xl font-bold tracking-[-0.02em]">L&apos;infrastructure que nous déployons</h2>
                            </div>
                            <ol className="space-y-3">
                                {ville.methodology.map((step, i) => (
                                    <li key={i} className="flex items-start gap-4 text-[14px] leading-[1.65] text-[#a0a0a0]">
                                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#5b73ff]/20 bg-[#5b73ff]/10 text-[12px] font-bold text-[#7b8fff]">{i + 1}</span>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        </section>
                    </FadeIn>

                    <FadeIn>
                        <section className="border-t border-white/[0.05] py-16" aria-labelledby="signals-heading">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
                                    <BarChart3 className="h-5 w-5 text-emerald-400" />
                                </div>
                                <h2 id="signals-heading" className="text-xl font-bold tracking-[-0.02em]">Les signaux techniques maîtrisés</h2>
                            </div>
                            <ul className="space-y-3">
                                {ville.signals.map((s, i) => (
                                    <li key={i} className="flex items-start gap-3 text-[14px] leading-[1.65] text-[#a0a0a0]">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </FadeIn>

                    <FadeIn>
                        <section className="border-t border-white/[0.05] py-16" aria-labelledby="faq-heading">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-xl border border-amber-400/20 bg-amber-400/10">
                                    <HelpCircle className="h-5 w-5 text-amber-400" />
                                </div>
                                <h2 id="faq-heading" className="text-xl font-bold tracking-[-0.02em]">Questions fréquentes — Visibilité IA à {ville.name}</h2>
                            </div>
                            <div className="space-y-2" itemScope itemType="https://schema.org/FAQPage">
                                {ville.faqs.map((faq, i) => (
                                    <details key={i} itemScope itemProp="mainEntity" itemType="https://schema.org/Question" className="group rounded-xl border border-white/7 bg-white/[0.02] transition hover:border-white/15 [&_summary::-webkit-details-marker]:hidden">
                                        <summary itemProp="name" className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium text-white/90 outline-none">
                                            <span>{faq.question}</span>
                                            <ChevronDown className="h-4 w-4 shrink-0 text-white/30 transition-transform group-open:rotate-180" />
                                        </summary>
                                        <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer" className="px-5 pb-5 text-[14px] leading-[1.65] text-[#a0a0a0]">
                                            <span itemProp="text">{faq.answer}</span>
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </section>
                    </FadeIn>

                    <FadeIn>
                        <section className="rounded-2xl border border-white/7 bg-[#0d0d0d] p-8 md:p-10 mb-10" aria-labelledby="method-proof-heading">
                            <h2 id="method-proof-heading" className="mb-4 text-xl font-bold tracking-[-0.02em]">Une exigence d&apos;exécution pour le marché de {ville.name}</h2>
                            <p className="mb-6 text-[14px] leading-[1.65] text-[#a0a0a0]">
                                L&apos;écosystème local évolue vite. Notre firme prend en charge l&apos;intégralité du déploiement technique et sémantique requis pour vous positionner durablement.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link href="/methodologie" className="inline-flex items-center gap-2 text-[14px] font-medium text-[#7b8fff] transition-colors hover:text-white">
                                    Voir notre méthodologie <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link href="/etudes-de-cas/dossier-type" className="inline-flex items-center gap-2 text-[14px] font-medium text-emerald-400 transition-colors hover:text-white">
                                    Consulter la preuve (dossier-type) <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </section>
                    </FadeIn>

                    {linkedExpertises.length > 0 && (
                        <FadeIn>
                            <section className="rounded-2xl border border-white/6 bg-white/[0.02] p-8 md:p-10 mb-10" aria-labelledby="expertises-heading">
                                <h2 id="expertises-heading" className="mb-6 text-xl font-bold tracking-[-0.02em]">Nos expertises à {ville.name}</h2>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    {linkedExpertises.map((exp) => (
                                        <Link key={exp.slug} href={'/expertises/' + exp.slug} className="group rounded-xl border border-white/7 bg-[#0d0d0d] p-5 transition-all hover:-translate-y-0.5 hover:border-[#5b73ff]/30 hover:bg-[#5b73ff]/[0.03]">
                                            <h3 className="mb-2 text-sm font-bold text-white group-hover:text-[#7b8fff] transition-colors">{exp.name}</h3>
                                            <p className="text-[12px] leading-[1.6] text-white/30 line-clamp-2">{exp.description}</p>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        </FadeIn>
                    )}

                    <FadeIn>
                        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] p-8 md:p-12 text-center">
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-[#5b73ff]/[0.03]" />
                            <div className="relative z-10">
                                <h2 className="mb-4 text-[clamp(20px,3vw,26px)] font-bold tracking-[-0.02em]">Prêt à dominer le marché de {ville.name} ?</h2>
                                <p className="mx-auto mb-8 max-w-md text-[14px] leading-[1.65] text-[#a0a0a0]">
                                    Ne laissez pas vos concurrents prendre l&apos;avantage sur la nouvelle génération de recherche IA.
                                </p>
                                <ContactButton className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:-translate-y-px hover:bg-[#e8e8e8]">
                                    Diagnostic personnalisé à {ville.name} <ArrowRight className="h-4 w-4" />
                                </ContactButton>
                            </div>
                        </section>
                    </FadeIn>
                </article>
            </main>

            <SiteFooter />
        </div>
    );
}
