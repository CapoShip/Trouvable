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
        geo_faqs = [],
        contact_info = {},
        business_details = {},
        seo_data = {}
    } = clientProfile;

    const VALID_BUSINESS_TYPES = new Set([
        "LocalBusiness", "Store", "Restaurant", "ProfessionalService",
        "HomeAndConstructionBusiness", "LegalService", "MedicalBusiness",
        "HealthAndBeautyBusiness", "AutomotiveBusiness", "RealEstateAgent",
        "FinancialService", "FoodEstablishment", "AnimalShelter",
        "ChildCare", "DryCleaningOrLaundry", "EmergencyService",
        "EmploymentAgency", "EntertainmentBusiness", "Library",
        "LodgingBusiness", "RadioStation", "SelfStorage",
        "SportsActivityLocation", "TelevisionStation", "TouristInformationCenter",
        "TravelAgency"
    ]);

    const safeBusinessType = (business_type && VALID_BUSINESS_TYPES.has(business_type.trim()))
        ? business_type.trim()
        : 'LocalBusiness';

    const mainSchema = {
        "@type": safeBusinessType,
        "name": client_name,
    };

    if (website_url && website_url.trim() !== '') {
        mainSchema.url = website_url.trim();
    }

    // Use seo_description first, fallback to short_desc from cockpit
    if (seo_description && seo_description.trim() !== '') {
        mainSchema.description = seo_description.trim();
    } else if (business_details?.short_desc && business_details.short_desc.trim() !== '') {
        mainSchema.description = business_details.short_desc.trim();
    }

    // Cockpit Enrichments (Strictly Safe)
    if (contact_info?.phone && contact_info.phone.trim() !== '') {
        mainSchema.telephone = contact_info.phone.trim();
    }

    if (contact_info?.public_email && contact_info.public_email.trim() !== '') {
        mainSchema.email = contact_info.public_email.trim();
    }

    if (business_details?.opening_hours && Array.isArray(business_details.opening_hours) && business_details.opening_hours.length > 0) {
        mainSchema.openingHours = business_details.opening_hours;
    }

    if (seo_data?.target_cities && Array.isArray(seo_data.target_cities) && seo_data.target_cities.length > 0) {
        mainSchema.areaServed = seo_data.target_cities.map(city => ({
            "@type": "City",
            "name": city
        }));
    }

    const validSocials = Array.isArray(social_profiles) ? social_profiles.filter(p => typeof p === 'string' && p.trim() !== '') : [];
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

function buildOrganizationSchema(baseUrl, address) {
    const schema = {
        "@type": "ProfessionalService",
        "@id": `${baseUrl}#organization`,
        "name": "Trouvable",
        "url": baseUrl,
        "description": "Firme d'exécution québécoise : visibilité organique Google et cohérence de votre entreprise dans les réponses des grands modèles conversationnels. Mandats de cartographie, d'implémentation et de pilotage continu.",
        "logo": `${baseUrl}/logos/trouvable_logo_blanc1.png`,
        "sameAs": [
            "https://www.linkedin.com/company/trouvable",
        ],
        "areaServed": [
            { "@type": "City", "name": "Montréal" },
            { "@type": "City", "name": "Laval" },
            { "@type": "City", "name": "Québec" },
            { "@type": "City", "name": "Longueuil" },
            { "@type": "City", "name": "Brossard" },
        ],
        "knowsAbout": [
            "SEO local",
            "Visibilité organique Google",
            "GEO (Generative Engine Optimization)",
            "Données structurées",
            "Google Business Profile",
            "Réponses IA conversationnelles",
        ],
    };

    if (address && Object.keys(address).length > 0) {
        const addressSchema = { "@type": "PostalAddress" };
        if (address.street) addressSchema.streetAddress = address.street;
        if (address.city) addressSchema.addressLocality = address.city;
        if (address.postalCode) addressSchema.postalCode = address.postalCode;
        if (address.region) addressSchema.addressRegion = address.region;
        if (address.country) addressSchema.addressCountry = address.country;

        if (Object.keys(addressSchema).length > 1) schema.address = addressSchema;
    }

    return schema;
}

function buildServiceSchema(expertise, baseUrl) {
    return {
        "@type": "Service",
        "name": `Mandat visibilité — ${expertise.name}`,
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
    address, // New prop for Organization mode
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
        graph.push(buildOrganizationSchema(baseUrl, address));
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
