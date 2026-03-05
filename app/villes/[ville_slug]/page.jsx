import React from 'react';
import { notFound } from 'next/navigation';
import { VILLES } from '../../../lib/data/geo-architecture';
import Navbar from '../../../components/Navbar';
import ContactModal from '../../../components/ContactModal';
import ContactButton from '../../../components/ContactButton';
import { ArrowRight, MapPin } from 'lucide-react';

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
        description: `L'agence experte en GEO (Generative Engine Optimization) à ${ville.name}. ${ville.description}`,
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

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <Navbar />

            <main>
                <article className="max-w-4xl mx-auto px-4 py-20">
                    <header className="mb-12 text-center">
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
                        <p className="text-slate-500 max-w-2xl mx-auto mt-4">
                            Nous adaptons votre présence numérique pour que ChatGPT, Gemini et Claude vous placent en pole position des recherches locales effectuées par vos futurs clients.
                        </p>
                    </header>

                    <section className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100 mt-12 text-center">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4">Prêt à dominer le marché de {ville.name} ?</h2>
                        <p className="text-slate-600 mb-8 max-w-xl mx-auto">
                            Ne laissez pas vos concurrents prendre l'avantage sur la nouvelle génération de recherche assistée par l'Intelligence Artificielle. Effectuons un bilan gratuit.
                        </p>

                        <ContactButton className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-full font-bold transition-all shadow-xl shadow-orange-600/30 inline-flex items-center justify-center gap-2 text-lg">
                            Demander un audit de visibilité IA gratuit <ArrowRight size={20} />
                        </ContactButton>
                    </section>
                </article>
            </main>

            {/* Footer Minimal pour les pages SEO */}
            <footer className="bg-slate-950 text-slate-400 py-12 text-center mt-20">
                <p>© 2026 Trouvable — L'agence IA de {ville.name}.</p>
            </footer>

            <ContactModal />
        </div>
    );
}
