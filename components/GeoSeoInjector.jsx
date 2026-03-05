import React from 'react';

/**
 * GeoSeoInjector — Injects JSON-LD structured data.
 * 
 * Modes:
 *   - localBusiness (client profiles)
 *   - organization (homepage)
 *   - faqPage (any page with FAQs)
 *   - breadcrumb (sub-pages)
 *   - service (expertise pages)
 * 
 * STRICT RULES:
 *   - No fake telephone, priceRange, or placeholder image
 *   - Every property is conditional — only injected if data is real
 *   - JSON-LD must reflect content visible on the page
 */

function buildLocalBusinessSchema(clientProfile) {
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
    };

    if (website_url) mainSchema.url = website_url;
    if (seo_description) mainSchema.description = seo_description;

    const validSocials = Array.isArray(social_profiles) ? social_profiles.filter(Boolean) : [];
    if (validSocials.length > 0) mainSchema.sameAs = validSocials;

    if (address && Object.keys(address).length > 0) {
        const addressSchema = { "@type": "PostalAddress" };
        if (address.street) addressSchema.streetAddress = address.street;
        if (address.city) addressSchema.addressLocality = address.city;
        if (address.postalCode) addressSchema.postalCode = address.postalCode;
        if (address.region) addressSchema.addressRegion = address.region;
        if (address.country) addressSchema.addressCountry = address.country;

        if (Object.keys(addressSchema).length > 1) mainSchema.address = addressSchema;
    }

    const graph = [mainSchema];

    const validFaqs = Array.isArray(geo_faqs) ? geo_faqs.filter(faq => faq && faq.question && faq.answer) : [];
    if (validFaqs.length > 0) {
        graph.push(buildFaqSchema(validFaqs));
    }

    return graph;
}

function buildFaqSchema(faqs) {
    return {
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };
}

function buildBreadcrumbSchema(items, baseUrl) {
    return {
        "@type": "BreadcrumbList",
        "itemListElement": items.map((item, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "name": item.name,
            "item": item.url ? `${baseUrl}${item.url}` : undefined
        }))
    };
}

function buildOrganizationSchema(baseUrl) {
    return {
        "@type": "Organization",
        "name": "Trouvable",
        "url": baseUrl,
        "description": "L'agence spécialiste en visibilité IA pour les PME et commerces locaux. Nous plaçons votre entreprise en tête des recommandations de l'intelligence artificielle.",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "1000 Avenue McGill College",
            "addressLocality": "Montréal",
            "addressRegion": "QC",
            "postalCode": "H3B 4W5",
            "addressCountry": "CA"
        }
    };
}

function buildServiceSchema(expertise, baseUrl) {
    return {
        "@type": "Service",
        "name": `Visibilité IA pour ${expertise.name}`,
        "description": expertise.description,
        "url": `${baseUrl}/expertises/${expertise.slug}`,
        "provider": {
            "@type": "Organization",
            "name": "Trouvable",
            "url": baseUrl
        },
        "areaServed": {
            "@type": "Place",
            "name": "Québec, Canada"
        }
    };
}

/**
 * GeoSeoInjector component.
 * 
 * Props:
 *   - clientProfile: for /clients/* pages (LocalBusiness mode)
 *   - faqs: array of { question, answer } for FAQPage schema
 *   - breadcrumbs: array of { name, url } for BreadcrumbList schema
 *   - organization: boolean, inject Organization schema (homepage)
 *   - service: expertise object for Service schema
 *   - baseUrl: site base URL
 */
export default function GeoSeoInjector({
    clientProfile,
    faqs,
    breadcrumbs,
    organization,
    service,
    baseUrl = ''
}) {
    const graph = [];

    // Mode: LocalBusiness (client profiles)
    if (clientProfile) {
        graph.push(...buildLocalBusinessSchema(clientProfile));
    }

    // Mode: Organization (homepage)
    if (organization && baseUrl) {
        graph.push(buildOrganizationSchema(baseUrl));
    }

    // Mode: FAQPage (any page with visible FAQs)
    const validFaqs = Array.isArray(faqs) ? faqs.filter(faq => faq && faq.question && faq.answer) : [];
    if (validFaqs.length > 0 && !clientProfile) {
        // Skip if clientProfile is set — its FAQs are already handled in buildLocalBusinessSchema
        graph.push(buildFaqSchema(validFaqs));
    }

    // Mode: BreadcrumbList (sub-pages)
    if (Array.isArray(breadcrumbs) && breadcrumbs.length > 0 && baseUrl) {
        graph.push(buildBreadcrumbSchema(breadcrumbs, baseUrl));
    }

    // Mode: Service (expertise pages)
    if (service && baseUrl) {
        graph.push(buildServiceSchema(service, baseUrl));
    }

    // Don't render empty graph
    if (graph.length === 0) return null;

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
