/**
 * Extrait et nettoie les données du crawl pour les envoyer au LLM.
 * Le but: produire une représentation compacte et informative,
 * sans dumper du HTML brut au modèle.
 */
export function extractForLLM(scanResults) {
    const ed = scanResults.extracted_data || {};
    const allText = (ed.text_chunks || []).join(' ');

    const cleanText = allText
        .replace(/\s+/g, ' ')
        .replace(/[^\S\n]+/g, ' ')
        .trim()
        .slice(0, 4000);

    const schemaTypes = [];
    if (ed.structured_data?.length) {
        for (const sd of ed.structured_data) {
            const typeStr = JSON.stringify(sd);
            if (typeStr.includes('LocalBusiness')) schemaTypes.push('LocalBusiness');
            if (typeStr.includes('Organization')) schemaTypes.push('Organization');
            if (typeStr.includes('FAQPage')) schemaTypes.push('FAQPage');
            if (typeStr.includes('Service')) schemaTypes.push('Service');
            if (typeStr.includes('BreadcrumbList')) schemaTypes.push('BreadcrumbList');
            if (typeStr.includes('WebSite')) schemaTypes.push('WebSite');
        }
    }

    return {
        source_url: scanResults.source_url,
        resolved_url: scanResults.resolved_url,
        pages_scanned: scanResults.scanned_pages?.length || 0,
        titles: ed.titles || [],
        descriptions: ed.descriptions || [],
        h1s: ed.h1s || [],
        h2_clusters: ed.h2_clusters || [],
        phones: ed.phones || [],
        emails: ed.emails || [],
        social_links: ed.social_links || [],
        has_local_business_schema: ed.has_local_business_schema || false,
        has_faq_schema: ed.has_faq_schema || false,
        schema_types: [...new Set(schemaTypes)],
        text_content: cleanText,
    };
}
