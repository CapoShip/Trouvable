import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EXPERTISES, VILLES } from '../../../lib/data/geo-architecture';
import Navbar from '../../../components/Navbar';
import SiteFooter from '../../../components/SiteFooter';
import ContactButton from '../../../components/ContactButton';
import GeoSeoInjector from '../../../components/GeoSeoInjector';
import FadeIn from '@/components/premium/FadeIn';
import { SITE_URL } from '@/lib/site-config';
import { ArrowRight, Briefcase, Search, Layers, BookOpen, HelpCircle, ChevronDown } from 'lucide-react';

export function generateStaticParams() {
    return EXPERTISES.map((expertise) => ({ expertise_slug: expertise.slug }));
}

export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    const expertise = EXPERTISES.find((e) => e.slug === resolvedParams.expertise_slug);
    if (!expertise) return { title: 'Non trouvé' };
    return {
        title: 'Visibilité IA pour ' + expertise.name + ' | Référencement ChatGPT | Trouvable',
        description: expertise.description,
        metadataBase: new URL(SITE_URL),
        alternates: { canonical: '/expertises/' + expertise.slug },
        openGraph: {
            title: 'Visibilité IA & GEO - ' + expertise.name + ' | Trouvable',
            description: expertise.description,
            url: '/expertises/' + expertise.slug,
            siteName: 'Trouvable',
            locale: 'fr_CA',
            type: 'website',
        },
    };
}

export default async function ExpertisePage({ params }) {
    const resolvedParams = await params;
    const expertise = EXPERTISES.find((e) => e.slug === resolvedParams.expertise_slug);
    if (!expertise) notFound();

    const linkedVilles = expertise.linkedVilles.map((s) => VILLES.find((v) => v.slug === s)).filter(Boolean);

    return (
        <div className="min-h-screen bg-[#080808] font-[Inter] text-[#f0f0f0] antialiased">
            <Navbar />
            <GeoSeoInjector service={expertise} faqs={expertise.faqs} breadcrumbs={[{ name: 'Accueil', url: '/' }, { name: 'Expertises', url: null }, { name: expertise.name, url: '/expertises/' + expertise.slug }]} baseUrl={SITE_URL} />
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.06),transparent_55%),linear-gradient(to_bottom,#080808,#080808)]" />

            <main>
                <section className="relative mt-[58px] overflow-hidden px-6 pt-[80px] pb-4 sm:pt-[110px]">
                    <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_25%,transparent_100%)]" />
                    <div className="pointer-events-none absolute left-1/2 top-[-120px] z-0 h-[600px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(147,51,234,0.08)_0%,rgba(91,115,255,0.06)_50%,transparent_70%)]" />

                    <div className="relative z-[1] mx-auto max-w-[860px] text-center">
                        <div className="animate-[fadeUp_0.6s_ease-out_both] mb-5 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#7b8fff]">
                            <Briefcase className="h-3.5 w-3.5" /> Expertise Sectorielle
                        </div>
                        <h1 className="animate-[fadeUp_0.7s_ease-out_0.08s_both] text-[clamp(32px,5.5vw,64px)] font-bold leading-[1.06] tracking-[-0.045em] mb-6">
                            La référence en visibilité pour<br />
                            <span className="bg-gradient-to-r from-[#5b73ff] to-[#a78bfa] bg-clip-text text-transparent">{expertise.name}</span>
                        </h1>
                        <p className="animate-[fadeUp_0.6s_ease-out_0.16s_both] mx-auto max-w-[600px] text-[17px] leading-[1.65] text-[#a0a0a0]">
                            {expertise.description}
                        </p>
                    </div>
                </section>

                <article className="mx-auto max-w-[900px] px-6 pb-20">
                    <FadeIn>
                        <section className="border-t border-white/[0.05] py-16" aria-labelledby="intents-heading">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-xl border border-violet-500/20 bg-violet-500/10">
                                    <Search className="h-5 w-5 text-violet-400" />
                                </div>
                                <h2 id="intents-heading" className="text-xl font-bold tracking-[-0.02em]">L&apos;intention de recherche liée à : {expertise.name}</h2>
                            </div>
                            <p className="mb-6 text-[14px] leading-[1.65] text-[#a0a0a0]">
                                Voici les types de requêtes que les consommateurs formulent quotidiennement à ChatGPT, Gemini et Perplexity pour votre secteur :
                            </p>
                            <ul className="space-y-3">
                                {expertise.searchIntents.map((intent, i) => (
                                    <li key={i} className="flex items-start gap-3 rounded-xl border border-white/6 bg-white/[0.02] p-4 transition-colors hover:border-white/12 hover:bg-white/[0.04]">
                                        <span className="mt-0.5 font-mono text-sm text-violet-400 shrink-0">→</span>
                                        <span className="text-[14px] leading-[1.6] text-[#a0a0a0] italic">{intent}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </FadeIn>

                    <FadeIn>
                        <section className="border-t border-white/[0.05] py-16" aria-labelledby="content-heading">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#5b73ff]/20 bg-[#5b73ff]/10">
                                    <Layers className="h-5 w-5 text-[#7b8fff]" />
                                </div>
                                <h2 id="content-heading" className="text-xl font-bold tracking-[-0.02em]">L&apos;architecture sémantique de votre offre</h2>
                            </div>
                            <ul className="space-y-3">
                                {expertise.contentAngles.map((angle, i) => (
                                    <li key={i} className="flex items-start gap-3 text-[14px] leading-[1.65] text-[#a0a0a0]">
                                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5b73ff]" />
                                        {angle}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </FadeIn>

                    <FadeIn>
                        <section className="border-t border-white/[0.05] py-16" aria-labelledby="usecases-heading">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-400/20 bg-emerald-400/10">
                                    <BookOpen className="h-5 w-5 text-emerald-400" />
                                </div>
                                <h2 id="usecases-heading" className="text-xl font-bold tracking-[-0.02em]">Le niveau de précision documentaire exigé</h2>
                            </div>
                            <p className="mb-6 text-[14px] leading-[1.65] text-[#a0a0a0]">
                                Voici le type de contenu que nous créons pour maximiser la visibilité IA dans votre industrie :
                            </p>
                            <ol className="space-y-3">
                                {expertise.useCases.map((uc, i) => (
                                    <li key={i} className="flex items-start gap-4 text-[14px] leading-[1.65] text-[#a0a0a0]">
                                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-[12px] font-bold text-emerald-400">{i + 1}</span>
                                        {uc}
                                    </li>
                                ))}
                            </ol>
                        </section>
                    </FadeIn>

                    <FadeIn>
                        <section className="border-t border-white/[0.05] py-16" aria-labelledby="faq-heading">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="grid h-10 w-10 place-items-center rounded-xl border border-amber-400/20 bg-amber-400/10">
                                    <HelpCircle className="h-5 w-5 text-amber-400" />
                                </div>
                                <h2 id="faq-heading" className="text-xl font-bold tracking-[-0.02em]">Questions fréquentes — GEO en {expertise.name}</h2>
                            </div>
                            <div className="space-y-2" itemScope itemType="https://schema.org/FAQPage">
                                {expertise.faqs.map((faq, i) => (
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
                        <section className="rounded-2xl border border-white/7 bg-[#0d0d0d] p-8 md:p-10 mb-10" aria-labelledby="approach-heading">
                            <h2 id="approach-heading" className="mb-4 text-xl font-bold tracking-[-0.02em]">Une exécution sur-mesure pour votre industrie</h2>
                            <p className="mb-6 text-[14px] leading-[1.65] text-[#a0a0a0]">
                                Les standards de référencement pour le secteur {expertise.name} exigent une précision technique absolue. Notre firme déploie et maintient cette infrastructure pour vous.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link href="/offres" className="inline-flex items-center gap-2 text-[14px] font-medium text-[#7b8fff] transition-colors hover:text-white">
                                    Découvrir nos mandats <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link href="/notre-mesure" className="inline-flex items-center gap-2 text-[14px] font-medium text-emerald-400 transition-colors hover:text-white">
                                    Notre cadre de mesure <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </section>
                    </FadeIn>

                    {linkedVilles.length > 0 && (
                        <FadeIn>
                            <section className="rounded-2xl border border-white/6 bg-white/[0.02] p-8 md:p-10 mb-10" aria-labelledby="villes-heading">
                                <h2 id="villes-heading" className="mb-6 text-xl font-bold tracking-[-0.02em]">{expertise.name} : nos marchés locaux</h2>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    {linkedVilles.map((v) => (
                                        <Link key={v.slug} href={'/villes/' + v.slug} className="group rounded-xl border border-white/7 bg-[#0d0d0d] p-5 transition-all hover:-translate-y-0.5 hover:border-[#5b73ff]/30 hover:bg-[#5b73ff]/[0.03]">
                                            <h3 className="mb-2 text-sm font-bold text-white group-hover:text-[#7b8fff] transition-colors">Visibilité IA à {v.name}</h3>
                                            <p className="text-[12px] leading-[1.6] text-white/30 line-clamp-2">{v.description}</p>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        </FadeIn>
                    )}

                    <FadeIn>
                        <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] p-8 md:p-12 text-center">
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#5b73ff]/[0.04] to-[#9333ea]/[0.04]" />
                            <div className="relative z-10">
                                <h2 className="mb-4 text-[clamp(20px,3vw,26px)] font-bold tracking-[-0.02em]">Passez devant vos concurrents en {expertise.name}</h2>
                                <p className="mx-auto mb-8 max-w-md text-[14px] leading-[1.65] text-[#a0a0a0]">
                                    Découvrons ensemble comment positionner votre activité sur Google et les réponses IA.
                                </p>
                                <ContactButton className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:-translate-y-px hover:bg-[#e8e8e8]">
                                    Obtenir mon plan d&apos;action <ArrowRight className="h-4 w-4" />
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
