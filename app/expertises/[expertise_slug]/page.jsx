import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EXPERTISES, VILLES } from '../../../lib/data/geo-architecture';
import Navbar from '../../../components/Navbar';
import ContactModal from '../../../components/ContactModal';
import ContactButton from '../../../components/ContactButton';
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trouvable.ca';
    const baseUrl = appUrl.replace(/\/$/, '');

    return {
        title: `Visibilité IA pour ${expertise.name} | Référencement ChatGPT | Trouvable`,
        description: expertise.description,
        metadataBase: new URL(baseUrl),
        alternates: {
            canonical: `/expertises/${expertise.slug}`,
        },
        openGraph: {
            title: `Visibilité IA & GEO - ${expertise.name} | Trouvable`,
            description: expertise.description,
            url: `/expertises/${expertise.slug}`,
            siteName: 'Trouvable',
            locale: 'fr_CA',
            type: 'website',
        }
    };
}

export default async function ExpertisePage({ params }) {
    const resolvedParams = await params;
    const expertise = EXPERTISES.find((e) => e.slug === resolvedParams.expertise_slug);

    if (!expertise) {
        notFound();
    }

    const linkedVilles = expertise.linkedVilles
        .map(slug => VILLES.find(v => v.slug === slug))
        .filter(Boolean);

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <Navbar />

            <main>
                <article className="max-w-4xl mx-auto px-4 py-20">
                    {/* HEADER */}
                    <header className="mb-16 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium text-sm border border-blue-100 mb-6">
                            <Briefcase size={16} />
                            Expertise Sectorielle
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                            Devenez la recommandation IA #1 en <span className="text-orange-600">{expertise.name}</span>
                        </h1>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
                            {expertise.description}
                        </p>
                    </header>

                    {/* SECTION 1 — Intentions de recherche typiques */}
                    <section className="bg-white rounded-3xl shadow-lg p-8 md:p-10 border border-slate-100 mb-8" aria-labelledby="intents-heading">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-50 rounded-xl"><Search size={22} className="text-purple-500" /></div>
                            <h2 id="intents-heading" className="text-2xl font-bold text-slate-900">
                                Ce que vos futurs clients demandent à l'IA
                            </h2>
                        </div>
                        <p className="text-slate-600 mb-6">
                            Voici les types de requêtes que les consommateurs formulent quotidiennement à ChatGPT, Gemini et Perplexity pour votre secteur :
                        </p>
                        <ul className="space-y-3">
                            {expertise.searchIntents.map((intent, i) => (
                                <li key={i} className="flex items-start gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <span className="mt-0.5 text-purple-400 font-mono text-sm shrink-0">→</span>
                                    <span className="text-slate-700 italic">{intent}</span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* SECTION 2 — Angles de contenu & Entités */}
                    <section className="bg-white rounded-3xl shadow-lg p-8 md:p-10 border border-slate-100 mb-8" aria-labelledby="content-heading">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 rounded-xl"><Layers size={22} className="text-blue-500" /></div>
                            <h2 id="content-heading" className="text-2xl font-bold text-slate-900">
                                Ce que nous structurons pour votre secteur
                            </h2>
                        </div>
                        <ul className="space-y-4">
                            {expertise.contentAngles.map((angle, i) => (
                                <li key={i} className="flex items-start gap-3 text-slate-700">
                                    <span className="mt-1 w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                                    {angle}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* SECTION 3 — Cas d'usage / Exemples de pages */}
                    <section className="bg-white rounded-3xl shadow-lg p-8 md:p-10 border border-slate-100 mb-8" aria-labelledby="usecases-heading">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-50 rounded-xl"><BookOpen size={22} className="text-green-500" /></div>
                            <h2 id="usecases-heading" className="text-2xl font-bold text-slate-900">
                                Exemples concrets de pages GEO
                            </h2>
                        </div>
                        <p className="text-slate-600 mb-6">
                            Voici le type de contenu que nous créons pour maximiser la visibilité IA dans votre industrie :
                        </p>
                        <ol className="space-y-4">
                            {expertise.useCases.map((useCase, i) => (
                                <li key={i} className="flex items-start gap-4 text-slate-700">
                                    <span className="shrink-0 w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold text-sm flex items-center justify-center">
                                        {i + 1}
                                    </span>
                                    {useCase}
                                </li>
                            ))}
                        </ol>
                    </section>

                    {/* SECTION 4 — FAQ Verticale */}
                    <section className="bg-white rounded-3xl shadow-lg p-8 md:p-10 border border-slate-100 mb-8" aria-labelledby="faq-heading">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-orange-50 rounded-xl"><HelpCircle size={22} className="text-orange-500" /></div>
                            <h2 id="faq-heading" className="text-2xl font-bold text-slate-900">
                                Questions fréquentes — GEO en {expertise.name}
                            </h2>
                        </div>
                        <div className="space-y-6">
                            {expertise.faqs.map((faq, i) => (
                                <div key={i} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                                    <h3 className="font-bold text-slate-800 mb-2">{faq.question}</h3>
                                    <p className="text-slate-600">{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* INTERNAL LINKING — Villes */}
                    {linkedVilles.length > 0 && (
                        <section className="bg-slate-100 rounded-3xl p-8 md:p-10 mb-8" aria-labelledby="villes-heading">
                            <h2 id="villes-heading" className="text-xl font-bold text-slate-900 mb-6">
                                {expertise.name} : nos marchés locaux
                            </h2>
                            <div className="grid sm:grid-cols-3 gap-4">
                                {linkedVilles.map(ville => (
                                    <Link key={ville.slug} href={`/villes/${ville.slug}`}
                                        className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all group">
                                        <h3 className="font-bold text-slate-800 mb-2 group-hover:text-orange-600 transition-colors">
                                            Visibilité IA à {ville.name}
                                        </h3>
                                        <p className="text-sm text-slate-500 line-clamp-2">{ville.description}</p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* CTA */}
                    <section className="bg-slate-900 rounded-3xl p-8 md:p-12 text-center mt-12">
                        <h2 className="text-2xl font-bold text-white mb-4">Passez devant vos concurrents en {expertise.name}</h2>
                        <p className="text-slate-300 mb-8 max-w-xl mx-auto">
                            Le GEO est plus puissant que le SEO traditionnel. Découvrons ensemble comment positionner votre activité.
                        </p>
                        <ContactButton className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-full font-bold transition-all shadow-xl shadow-orange-600/30 inline-flex items-center justify-center gap-2 text-lg">
                            Obtenir mon plan d'action IA <ArrowRight size={20} />
                        </ContactButton>
                    </section>
                </article>
            </main>

            <footer className="bg-slate-950 text-slate-400 py-12 text-center mt-20">
                <p className="text-sm">© 2026 <Link href="/" className="hover:text-orange-500 transition-colors">Trouvable</Link> — Votre partenaire GEO en {expertise.name}.</p>
            </footer>

            <ContactModal />
        </div>
    );
}
