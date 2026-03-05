import React from 'react';
import { notFound } from 'next/navigation';
import { EXPERTISES } from '../../../lib/data/geo-architecture';
import Navbar from '../../../components/Navbar';
import ContactModal from '../../../components/ContactModal';
import ContactButton from '../../../components/ContactButton';
import { ArrowRight, Briefcase } from 'lucide-react';

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
        description: `Agence experte en SEO et GEO pour le secteur: ${expertise.name}. ${expertise.description}`,
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

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <Navbar />

            <main>
                <article className="max-w-4xl mx-auto px-4 py-20">
                    <header className="mb-12 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium text-sm border border-blue-100 mb-6">
                            <Briefcase size={16} />
                            Expertise par Secteur
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                            Devenez la recommandation IA #1 en <span className="text-orange-600">{expertise.name}</span>
                        </h1>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
                            {expertise.description}
                        </p>
                        <p className="text-slate-500 max-w-2xl mx-auto mt-4">
                            Lorsque les clients sollicitent des recommandations expertes à ChatGPT, Claude ou Perplexity, nous formatons vos données pour que l'intelligence artificielle vous cite comme la référence incontournable de votre industrie.
                        </p>
                    </header>

                    <section className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100 mt-12 text-center">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Passez devant vos concurrents</h2>
                        <p className="text-slate-600 mb-8 max-w-xl mx-auto">
                            Le GEO (Generative Engine Optimization) est plus puissant que le SEO traditionnel. Découvrons ensemble comment positionner votre activité.
                        </p>

                        <ContactButton className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-full font-bold transition-all shadow-xl shadow-orange-600/30 inline-flex items-center justify-center gap-2 text-lg">
                            Obtenir mon plan d'action IA <ArrowRight size={20} />
                        </ContactButton>
                    </section>
                </article>
            </main>

            <footer className="bg-slate-950 text-slate-400 py-12 text-center mt-20">
                <p>© 2026 Trouvable — Votre partenaire GEO en {expertise.name}.</p>
            </footer>

            <ContactModal />
        </div>
    );
}
