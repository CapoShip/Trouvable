import React from 'react';
import { notFound } from 'next/navigation';
import GeoSeoInjector from '../../../components/GeoSeoInjector';
import { getClientProfile } from '../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    // Next.js 15+ async params support (ensure compatibility with current App Router)
    const resolvedParams = await params;
    const { client_slug } = resolvedParams;

    const profile = await getClientProfile(client_slug);

    if (!profile) {
        return {
            title: 'Page Introuvable',
            description: 'Ce profil client n\'existe pas.'
        };
    }

    // Always use the primary app domain to retain SEO authority.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trouvable.ca';
    // Build a solid, sober SEO Title
    let seoTitle = profile.seo_title || profile.client_name;
    if (!profile.seo_title) {
        if (profile.business_type && profile.business_type !== 'LocalBusiness' && profile.address?.city) {
            seoTitle = `${profile.client_name} - ${profile.business_type} à ${profile.address.city} | Trouvable`;
        } else if (profile.address?.city) {
            seoTitle = `${profile.client_name} - ${profile.address.city} | Trouvable`;
        } else {
            seoTitle = `${profile.client_name} - Profil Local | Trouvable`;
        }
    }

    return {
        title: seoTitle,
        description: profile.seo_description || `Profil local de ${profile.client_name} sur Trouvable.`,
        metadataBase: new URL(baseUrl),
        alternates: {
            canonical: `/clients/${client_slug}`,
        },
        openGraph: {
            title: seoTitle,
            description: profile.seo_description || `Profil local de ${profile.client_name} sur Trouvable.`,
            url: `/clients/${client_slug}`,
            siteName: 'Trouvable',
            locale: 'fr_CA',
            type: 'website',
        }
    };
}

export default async function ClientPage({ params }) {
    // Next.js 15+ async params support
    const resolvedParams = await params;
    const { client_slug } = resolvedParams;

    const profile = await getClientProfile(client_slug);

    if (!profile) {
        // Retourne une vraie page 404 (HTTP 404)
        notFound();
    }

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <GeoSeoInjector clientProfile={profile} />

            {/* Internal Navigation (Maillage interne) */}
            <nav className="max-w-3xl mx-auto mb-8" aria-label="Fil d'Ariane">
                <a href="/" className="text-orange-600 hover:text-pink-600 font-medium text-sm flex items-center gap-2 transition-colors">
                    ← Retour à Trouvable
                </a>
            </nav>

            <article className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100">
                <header className="mb-10 border-b border-slate-100 pb-8 text-center md:text-left">
                    <span className="inline-block px-4 py-1.5 bg-orange-100 text-orange-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                        Profil AEO Vérifié
                    </span>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
                        {profile.client_name}
                    </h1>
                    {profile.seo_description && (
                        <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
                            {profile.seo_description}
                        </p>
                    )}
                </header>

                <div className="mb-12">
                    {/* Informations section */}
                    <section aria-labelledby="client-info-heading" className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100 max-w-xl">
                        <h2 id="client-info-heading" className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-200 pb-2">
                            Aperçu de l'Entreprise
                        </h2>
                        <ul className="space-y-4 text-slate-700 text-sm">
                            <li className="flex flex-col">
                                <span className="text-slate-500 font-medium text-xs uppercase mb-1">Catégorie</span>
                                <span className="font-semibold text-slate-900">{profile.business_type}</span>
                            </li>

                            {profile.address && Object.keys(profile.address).length > 0 && (
                                <li className="flex flex-col">
                                    <span className="text-slate-500 font-medium text-xs uppercase mb-1">Service Local</span>
                                    <address className="not-italic text-slate-900">
                                        {profile.address.street && <span className="block">{profile.address.street}</span>}
                                        {profile.address.city && <span>{profile.address.city}</span>}
                                        {profile.address.postalCode && <span> ({profile.address.postalCode})</span>}
                                        {profile.address.region && <span>, {profile.address.region}</span>}
                                    </address>
                                </li>
                            )}

                            {profile.website_url && (
                                <li className="flex flex-col pt-2 block">
                                    <a href={profile.website_url} className="inline-flex items-center text-orange-600 hover:text-pink-600 font-bold transition-colors" target="_blank" rel="noopener noreferrer">
                                        Visiter le site officiel ↗
                                    </a>
                                </li>
                            )}
                        </ul>
                    </section>
                </div>

                {profile.geo_faqs && profile.geo_faqs.length > 0 && (
                    <section aria-labelledby="faq-heading" className="mt-8 border-t border-slate-100 pt-8">
                        <h2 id="faq-heading" className="text-2xl font-bold text-slate-900 mb-8 tracking-tight">
                            Questions Fréquentes traitées par l'IA
                        </h2>
                        <div className="space-y-8">
                            {profile.geo_faqs.map((faq, i) => (
                                <div key={i} className="prose prose-slate max-w-none">
                                    <h3 className="text-lg font-bold text-slate-800 mb-2">{faq.question}</h3>
                                    <p className="text-slate-600 leading-relaxed m-0">{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Call to Action - Internal Maillage */}
                <footer className="mt-16 pt-8 border-t border-slate-100 text-center">
                    <p className="text-slate-600 mb-4">Vous repérez une information manquante ou vous souhaitez revendiquer ce profil ?</p>
                    <a href="/#contact" className="inline-block px-6 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors">
                        Contacter l'équipe Trouvable
                    </a>
                </footer>
            </article>
        </main>
    );
}
