import React from 'react';

export default function GeoSeoInjector({ clientProfile }) {
    if (!clientProfile) return null;

    const {
        client_name,
        website_url,
        business_type = 'LocalBusiness',
        seo_description,
        social_profiles = [],
        address = {},
        geo_faqs = []
    } = clientProfile;

    const mainSchema = {
        "@type": business_type || "LocalBusiness",
        "name": client_name,
        "url": website_url,
    };

    if (seo_description) {
        mainSchema.description = seo_description;
    }

    const validSocials = Array.isArray(social_profiles) ? social_profiles.filter(Boolean) : [];
    if (validSocials.length > 0) {
        mainSchema.sameAs = validSocials;
    }

    if (address && Object.keys(address).length > 0) {
        const addressSchema = { "@type": "PostalAddress" };
        if (address.street) addressSchema.streetAddress = address.street;
        if (address.city) addressSchema.addressLocality = address.city;
        if (address.postalCode) addressSchema.postalCode = address.postalCode;

        if (Object.keys(addressSchema).length > 1) {
            mainSchema.address = addressSchema;
        }
    }

    const graph = [mainSchema];

    const validFaqs = Array.isArray(geo_faqs) ? geo_faqs.filter(faq => faq && faq.question && faq.answer) : [];
    if (validFaqs.length > 0) {
        graph.push({
            "@type": "FAQPage",
            "mainEntity": validFaqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.answer
                }
            }))
        });
    }

    const payload = {
        "@context": "https://schema.org",
        "@graph": graph
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
        />
    );
}
