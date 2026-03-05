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
    const baseUrl = appUrl.replace(/\/$/, ''); // Remove trailing slash if present

    return {
        title: profile.seo_title || profile.client_name,
        description: profile.seo_description,
        // Enforce the Trouvable platform as the base URL to prevent canonical bleed to the client's site
        metadataBase: new URL(baseUrl),
        alternates: {
            // Next.js resolves this against metadataBase -> https://trouvable.ca/clients/[slug]
            canonical: `/clients/${client_slug}`,
        },
        openGraph: {
            title: profile.seo_title || profile.client_name,
            description: profile.seo_description,
            // Explicitly associate the social graph with the Trouvable domain
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
        <main className="min-h-screen bg-slate-50 py-20 px-4">
            {/* Injection JSON-LD pour SEO/GEO/AEO */}
            <GeoSeoInjector clientProfile={profile} />

            <article className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100">
                <header className="mb-8 border-b border-slate-100 pb-8">
                    <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold mb-4">
                        Page D'exemple SEO
                    </span>
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4">{profile.client_name}</h1>
                    <p className="text-lg text-slate-600">{profile.seo_description}</p>
                </header>

                <section className="grid md:grid-cols-2 gap-8 mb-8" aria-labelledby="client-info-heading">
                    <div>
                        <h2 id="client-info-heading" className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Informations</h2>
                        <ul className="space-y-3 text-slate-700">
                            <li><strong>Type :</strong> {profile.business_type}</li>
                            <li>
                                <strong>Adresse :</strong>{' '}
                                <address className="inline not-italic">
                                    {profile.address?.street}, {profile.address?.city} ({profile.address?.postalCode})
                                </address>
                            </li>
                            {profile.website_url && (
                                <li>
                                    <strong>Site Web :</strong>{' '}
                                    <a href={profile.website_url} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                        {profile.website_url}
                                    </a>
                                </li>
                            )}
                        </ul>
                    </div>
                </section>

                {profile.geo_faqs && profile.geo_faqs.length > 0 && (
                    <section className="bg-slate-50 rounded-2xl p-6 border border-slate-100" aria-labelledby="faq-heading">
                        <h2 id="faq-heading" className="text-xl font-bold text-slate-900 mb-4">Foire Aux Questions (AEO optimisé)</h2>
                        <div className="space-y-4">
                            {profile.geo_faqs.map((faq, i) => (
                                <div key={i}>
                                    <h3 className="font-bold text-slate-800">{faq.question}</h3>
                                    <p className="text-slate-600 mt-1">{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </article>
        </main>
    );
}
