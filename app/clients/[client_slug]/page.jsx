import React from 'react';
import GeoSeoInjector from '../../../components/GeoSeoInjector';

// MOCK PROFILE
const getMockProfile = (slug) => {
    return {
        id: "a1b2c3d4-e5f6-7890-1234-56789abcdef0",
        client_name: "Boulangerie Artisan",
        client_slug: slug,
        website_url: "https://boulangerie-artisan.ca",
        business_type: "Bakery",
        seo_title: "Boulangerie Artisan | Pains et Pâtisseries à Montréal",
        seo_description: "Découvrez nos pains artisanaux et pâtisseries fraîches au cœur de Montréal. Ingrédients locaux et savoir-faire traditionnel.",
        social_profiles: [
            "https://facebook.com/boulangerieartisan",
            "https://instagram.com/boulangerieartisan"
        ],
        address: {
            street: "123 Rue de la Baguette",
            city: "Montréal",
            postalCode: "H2X 1Y2"
        },
        geo_faqs: [
            { question: "Quelles sont vos heures d'ouverture ?", answer: "Nous sommes ouverts du mardi au dimanche de 7h à 19h." },
            { question: "Faites-vous des gâteaux sur commande ?", answer: "Oui, veuillez nous contacter 48h à l'avance pour toute commande spéciale." }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
};

export async function generateMetadata({ params }) {
    const { client_slug } = params;
    const profile = getMockProfile(client_slug);

    return {
        title: profile.seo_title || profile.client_name,
        description: profile.seo_description,
        metadataBase: new URL(profile.website_url),
        openGraph: {
            title: profile.seo_title,
            description: profile.seo_description,
            url: profile.website_url,
            siteName: profile.client_name,
            locale: 'fr_CA',
            type: 'website',
        }
    };
}

export default function ClientPage({ params }) {
    const { client_slug } = params;
    const profile = getMockProfile(client_slug);

    return (
        <div className="min-h-screen bg-slate-50 py-20 px-4">
            {/* Injection JSON-LD pour SEO/GEO/AEO */}
            <GeoSeoInjector clientProfile={profile} />

            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100">
                <div className="mb-8 border-b border-slate-100 pb-8">
                    <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold mb-4">
                        Page D'exemple SEO
                    </span>
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4">{profile.client_name}</h1>
                    <p className="text-lg text-slate-600">{profile.seo_description}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Informations</h3>
                        <ul className="space-y-3 text-slate-700">
                            <li><strong>Type :</strong> {profile.business_type}</li>
                            <li><strong>Adresse :</strong> {profile.address?.street}, {profile.address?.city} ({profile.address?.postalCode})</li>
                            <li><strong>Site Web :</strong> <a href={profile.website_url} className="text-blue-600 hover:underline">{profile.website_url}</a></li>
                        </ul>
                    </div>
                </div>

                {profile.geo_faqs && profile.geo_faqs.length > 0 && (
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Foire Aux Questions (AEO optimisé)</h3>
                        <div className="space-y-4">
                            {profile.geo_faqs.map((faq, i) => (
                                <div key={i}>
                                    <p className="font-bold text-slate-800">{faq.question}</p>
                                    <p className="text-slate-600 mt-1">{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
