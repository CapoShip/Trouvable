import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VILLES, EXPERTISES } from '../../../lib/data/geo-architecture';
import Navbar from '../../../components/Navbar';
import ContactModal from '../../../components/ContactModal';
import ContactButton from '../../../components/ContactButton';
import GeoSeoInjector from '../../../components/GeoSeoInjector';
import { ArrowRight, MapPin, AlertTriangle, Wrench, BarChart3, HelpCircle } from 'lucide-react';

export function generateStaticParams() {
    return VILLES.map((ville) => ({
        ville_slug: ville.slug,
    }));
}

export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    const ville = VILLES.find((v) => v.slug === resolvedParams.ville_slug);

    if (!ville) return { title: 'Non trouvé' };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trouvable.ca';
    const baseUrl = appUrl.replace(/\/$/, '');

    return {
        title: `Visibilité IA & Référencement ChatGPT à ${ville.name} | Trouvable`,
        description: ville.description,
        metadataBase: new URL(baseUrl),
        alternates: {
            canonical: `/villes/${ville.slug}`,
        },
        openGraph: {
            title: `Visibilité IA à ${ville.name} - Trouvable`,
            description: ville.description,
            url: `/villes/${ville.slug}`,
            siteName: 'Trouvable',
            locale: 'fr_CA',
            type: 'website',
        }
    };
}

export default async function VillePage({ params }) {
    const resolvedParams = await params;
    const ville = VILLES.find((v) => v.slug === resolvedParams.ville_slug);

    if (!ville) {
        notFound();
    }

    const linkedExpertises = ville.linkedExpertises
        .map(slug => EXPERTISES.find(e => e.slug === slug))
        .filter(Boolean);

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://trouvable.ca').replace(/\/$/, '');

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <Navbar />

            <GeoSeoInjector
                faqs={ville.faqs}
                breadcrumbs={[
                    { name: 'Accueil', url: '/' },
                    { name: 'Villes', url: null },
                    { name: ville.name, url: `/villes/${ville.slug}` }
                ]}
                baseUrl={appUrl}
            />

            <main>
                <article className="max-w-4xl mx-auto px-4 py-20">
                    {/* HEADER */}
                    <header className="mb-16 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium text-sm border border-blue-100 mb-6">
                            <MapPin size={16} />
                            Expertise Locale : {ville.name}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                            Soyez le premier commerce recommandé par l'IA à <span className="text-orange-600">{ville.name}</span>
                        </h1>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
                            {ville.description}
                        </p>
                    </header>

                    {/* SECTION 1 — Problèmes typiques */}
                    <section className="bg-white rounded-3xl shadow-lg p-8 md:p-10 border border-slate-100 mb-8" aria-labelledby="problems-heading">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-red-50 rounded-xl"><AlertTriangle size={22} className="text-red-500" /></div>
                            <h2 id="problems-heading" className="text-2xl font-bold text-slate-900">
                                Pourquoi les commerces de {ville.name} sont invisibles pour l'IA
                            </h2>
                        </div>
                        <ul className="space-y-4">
                            {ville.problems.map((problem, i) => (
                                <li key={i} className="flex items-start gap-3 text-slate-700">
                                    <span className="mt-1 w-2 h-2 rounded-full bg-red-400 shrink-0" />
                                    {problem}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* SECTION 2 — Méthodologie */}
                    <section className="bg-white rounded-3xl shadow-lg p-8 md:p-10 border border-slate-100 mb-8" aria-labelledby="methodology-heading">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 rounded-xl"><Wrench size={22} className="text-blue-500" /></div>
                            <h2 id="methodology-heading" className="text-2xl font-bold text-slate-900">
                                Ce que nous mettons en place à {ville.name}
                            </h2>
                        </div>
                        <ol className="space-y-4">
                            {ville.methodology.map((step, i) => (
                                <li key={i} className="flex items-start gap-4 text-slate-700">
                                    <span className="shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center">
                                        {i + 1}
                                    </span>
                                    {step}
                                </li>
                            ))}
                        </ol>
                    </section>

                    {/* SECTION 3 — Signaux & Preuves */}
                    <section className="bg-white rounded-3xl shadow-lg p-8 md:p-10 border border-slate-100 mb-8" aria-labelledby="signals-heading">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-50 rounded-xl"><BarChart3 size={22} className="text-green-500" /></div>
                            <h2 id="signals-heading" className="text-2xl font-bold text-slate-900">
                                Les signaux GEO que nous déployons
                            </h2>
                        </div>
                        <ul className="space-y-4">
                            {ville.signals.map((signal, i) => (
                                <li key={i} className="flex items-start gap-3 text-slate-700">
                                    <span className="mt-1 w-2 h-2 rounded-full bg-green-400 shrink-0" />
                                    {signal}
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* SECTION 4 — FAQ Locale */}
                    <section className="bg-white rounded-3xl shadow-lg p-8 md:p-10 border border-slate-100 mb-8" aria-labelledby="faq-heading">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-orange-50 rounded-xl"><HelpCircle size={22} className="text-orange-500" /></div>
                            <h2 id="faq-heading" className="text-2xl font-bold text-slate-900">
                                Questions fréquentes — Visibilité IA à {ville.name}
                            </h2>
                        </div>
                        <div className="space-y-6">
                            {ville.faqs.map((faq, i) => (
                                <div key={i} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                                    <h3 className="font-bold text-slate-800 mb-2">{faq.question}</h3>
                                    <p className="text-slate-600">{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* INTERNAL LINKING — Expertises */}
                    {linkedExpertises.length > 0 && (
                        <section className="bg-slate-100 rounded-3xl p-8 md:p-10 mb-8" aria-labelledby="expertises-heading">
                            <h2 id="expertises-heading" className="text-xl font-bold text-slate-900 mb-6">
                                Nos expertises à {ville.name}
                            </h2>
                            <div className="grid sm:grid-cols-3 gap-4">
                                {linkedExpertises.map(exp => (
                                    <Link key={exp.slug} href={`/expertises/${exp.slug}`}
                                        className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-orange-300 hover:shadow-md transition-all group">
                                        <h3 className="font-bold text-slate-800 mb-2 group-hover:text-orange-600 transition-colors">{exp.name}</h3>
                                        <p className="text-sm text-slate-500 line-clamp-2">{exp.description}</p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* CTA */}
                    <section className="bg-slate-900 rounded-3xl p-8 md:p-12 text-center mt-12">
                        <h2 className="text-2xl font-bold text-white mb-4">Prêt à dominer le marché de {ville.name} ?</h2>
                        <p className="text-slate-300 mb-8 max-w-xl mx-auto">
                            Ne laissez pas vos concurrents prendre l'avantage sur la nouvelle génération de recherche IA.
                        </p>
                        <ContactButton className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-full font-bold transition-all shadow-xl shadow-orange-600/30 inline-flex items-center justify-center gap-2 text-lg">
                            Demander un audit gratuit à {ville.name} <ArrowRight size={20} />
                        </ContactButton>
                    </section>
                </article>
            </main>

            <footer className="bg-slate-950 text-slate-400 py-12 text-center mt-20">
                <p className="text-sm">© 2026 <Link href="/" className="hover:text-orange-500 transition-colors">Trouvable</Link> — Visibilité IA à {ville.name}.</p>
            </footer>

            <ContactModal />
        </div>
    );
}
