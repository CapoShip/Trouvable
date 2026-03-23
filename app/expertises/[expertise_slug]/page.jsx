import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EXPERTISES, VILLES } from '../../../lib/data/geo-architecture';
import Navbar from '../../../components/Navbar';
import SiteFooter from '../../../components/SiteFooter';
import ContactButton from '../../../components/ContactButton';
import GeoSeoInjector from '../../../components/GeoSeoInjector';
import { SITE_URL } from '@/lib/site-config';
import { ArrowRight, Briefcase, Search, Layers, BookOpen, HelpCircle } from 'lucide-react';

export function generateStaticParams() {
    return EXPERTISES.map((expertise) => ({
        expertise_slug: expertise.slug,
    }));
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
        }
    };
}

export default async function ExpertisePage({ params }) {
    const resolvedParams = await params;
    const expertise = EXPERTISES.find((e) => e.slug === resolvedParams.expertise_slug);
    if (!expertise) { notFound(); }

    const linkedVilles = expertise.linkedVilles
        .map(slug => VILLES.find(v => v.slug === slug))
        .filter(Boolean);

    return (
        <div className="min-h-screen bg-[#080808] font-sans text-[#f0f0f0]">
            <Navbar />

            <GeoSeoInjector
                service={expertise}
                faqs={expertise.faqs}
                breadcrumbs={[
                    { name: 'Accueil', url: '/' },
                    { name: 'Expertises', url: null },
                    { name: expertise.name, url: '/expertises/' + expertise.slug }
                ]}
                baseUrl={SITE_URL}
            />

            <main>
                <article className="max-w-4xl mx-auto px-4 pt-28 pb-20">
                    {/* HEADER */}
                    <header className="mb-16 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5b73ff]/10 text-[#7b8fff] font-medium text-sm border border-[#5b73ff]/20 mb-6">
                            <Briefcase size={16} />
                            Expertise Sectorielle
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
                            Devenez la recommandation IA #1 en <span className="bg-gradient-to-r from-[#5b73ff] to-[#9333ea] bg-clip-text text-transparent">{expertise.name}</span>
                        </h1>
                        <p className="text-xl text-[#a0a0a0] max-w-2xl mx-auto font-medium">
                            {expertise.description}
                        </p>
                    </header>

                    {/* SECTION 1 */}
                    <section className="bg-[#0f0f0f] rounded-2xl p-8 md:p-10 border border-white/10 mb-8" aria-labelledby="intents-heading">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-violet-500/10 rounded-xl"><Search size={22} className="text-violet-400" /></div>
                            <h2 id="intents-heading" className="text-2xl font-bold text-white">
                                Ce que vos futurs clients demandent à l'IA
                            </h2>
                        </div>
                        <p className="text-[#a0a0a0] mb-6">
                            Voici les types de requêtes que les consommateurs formulent quotidiennement à ChatGPT, Gemini et Perplexity pour votre secteur :
                        </p>
                        <ul className="space-y-3">
                            {expertise.searchIntents.map((intent, i) => (
                                <li key={i} className="flex items-start gap-3 bg-white/[0.03] rounded-xl p-4 border border-white/[0.07]">
                                    <span className="mt-0.5 text-violet-400 font-mono text-sm shrink-0">→</span>
                                    <span className="text-[#a0a0a0] italic">{intent}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* SECTION 2 */}
                    <section className="bg-[#0f0f0f] rounded-2xl p-8 md:p-10 border border-white/10 mb-8" aria-labelledby="content-heading">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-[#5b73ff]/10 rounded-xl"><Layers size={22} className="text-[#7b8fff]" /></div>
                            <h2 id="content-heading" className="text-2xl font-bold text-white">
                                Ce que nous structurons pour votre secteur
                            </h2>
                        </div>
                        <ul className="space-y-4">
                            {expertise.contentAngles.map((angle, i) => (
                                <li key={i} className="flex items-start gap-3 text-[#a0a0a0]">
                                    <span className="mt-1 w-2 h-2 rounded-full bg-[#5b73ff] shrink-0" />
                                    {angle}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* SECTION 3 */}
                    <section className="bg-[#0f0f0f] rounded-2xl p-8 md:p-10 border border-white/10 mb-8" aria-labelledby="usecases-heading">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-400/10 rounded-xl"><BookOpen size={22} className="text-emerald-400" /></div>
                            <h2 id="usecases-heading" className="text-2xl font-bold text-white">
                                Exemples concrets de pages GEO
                            </h2>
                        </div>
                        <p className="text-[#a0a0a0] mb-6">
                            Voici le type de contenu que nous créons pour maximiser la visibilité IA dans votre industrie :
                        </p>
                        <ol className="space-y-4">
                            {expertise.useCases.map((useCase, i) => (
                                <li key={i} className="flex items-start gap-4 text-[#a0a0a0]">
                                    <span className="shrink-0 w-8 h-8 rounded-full bg-emerald-400/10 text-emerald-400 font-bold text-sm flex items-center justify-center border border-emerald-400/20">
                                        {i + 1}
                                    </span>
                                    {useCase}
                                </li>
                            ))}
                        </ol>
                    </section>

                    {/* SECTION 4 */}
                    <section className="bg-[#0f0f0f] rounded-2xl p-8 md:p-10 border border-white/10 mb-8" aria-labelledby="faq-heading">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-amber-400/10 rounded-xl"><HelpCircle size={22} className="text-amber-400" /></div>
                            <h2 id="faq-heading" className="text-2xl font-bold text-white">
                                Questions fréquentes — GEO en {expertise.name}
                            </h2>
                        </div>
                        <div className="space-y-6">
                            {expertise.faqs.map((faq, i) => (
                                <div key={i} className="border-b border-white/[0.07] pb-5 last:border-0 last:pb-0">
                                    <h3 className="font-bold text-white mb-2">{faq.question}</h3>
                                    <p className="text-[#a0a0a0]">{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* INTERNAL LINKING */}
                    {linkedVilles.length > 0 && (
                        <section className="bg-white/[0.02] rounded-2xl p-8 md:p-10 border border-white/[0.07] mb-8" aria-labelledby="villes-heading">
                            <h2 id="villes-heading" className="text-xl font-bold text-white mb-6">
                                {expertise.name} : nos marchés locaux
                            </h2>
                            <div className="grid sm:grid-cols-3 gap-4">
                                {linkedVilles.map(ville => (
                                    <Link key={ville.slug} href={'/villes/' + ville.slug}
                                        className="bg-[#0f0f0f] rounded-xl p-5 border border-white/10 hover:border-[#5b73ff]/40 hover:bg-[#5b73ff]/5 transition-all group">
                                        <h3 className="font-bold text-white mb-2 group-hover:text-[#7b8fff] transition-colors">
                                            Visibilité IA à {ville.name}
                                        </h3>
                                        <p className="text-sm text-white/30 line-clamp-2">{ville.description}</p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* CTA */}
                    <section className="bg-[#0f0f0f] rounded-2xl p-8 md:p-12 text-center mt-12 border border-white/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#5b73ff]/5 to-[#9333ea]/5 pointer-events-none" />
                        <div className="relative z-10">
                            <h2 className="text-2xl font-bold text-white mb-4">Passez devant vos concurrents en {expertise.name}</h2>
                            <p className="text-[#a0a0a0] mb-8 max-w-xl mx-auto">
                                Le GEO est plus puissant que le SEO traditionnel. Découvrons ensemble comment positionner votre activité.
                            </p>
                            <ContactButton className="bg-white hover:bg-[#d6d6d6] text-black px-8 py-4 rounded-full font-bold transition-all inline-flex items-center justify-center gap-2 text-lg">
                                Obtenir mon plan d'action IA <ArrowRight size={20} />
                            </ContactButton>
                        </div>
                    </section>
                </article>
            </main>

            <SiteFooter />
        </div>
    );
}
