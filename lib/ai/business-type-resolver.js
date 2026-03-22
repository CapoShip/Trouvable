export function resolveBusinessType(businessType, siteClassification = {}, clientName = '') {
    const rawType = String(businessType || '').trim();
    let schema_type_detected = rawType;
    let business_model_detected = siteClassification.type || 'generic_business';
    let canonical_category = 'service_local';
    let canonical_subcategory = 'entreprise';
    let target_audience = 'b2c';
    let category_confidence = 'medium';
    let category_resolution_reason = 'Fallbacks appliqués par defaut';
    let needs_review = false;

    // Detect software / platform / saas
    if (
        /software|saas|plateforme|platform|logiciel|app|trouvable|visibilite ia/i.test(rawType) ||
        business_model_detected === 'saas_software' ||
        /logiciel|plateforme/i.test(clientName)
    ) {
        business_model_detected = 'saas';
        canonical_category = 'ai_visibility_software'; // Defaulting to the closest product category for Trouvable-like products
        canonical_subcategory = 'plateforme_geo';
        target_audience = 'b2b';
        category_confidence = 'high';
        category_resolution_reason = 'Mots-cles SaaS detectes dans le type ou modele business (software, plateforme, etc.)';
    } 
    // Generic fallback for LocalBusiness
    else if (/localbusiness|business|company|service|website/i.test(rawType)) {
        needs_review = true;
        category_confidence = 'weak';
        category_resolution_reason = 'Type generique detecte, necessite une revision manuelle';
        // Try to guess from siteClassification label if it exists and isn't just "LocalBusiness"
        if (siteClassification.label && !/localbusiness|business/i.test(siteClassification.label)) {
            canonical_category = siteClassification.label.toLowerCase().replace(/\\s+/g, '_');
            category_resolution_reason = 'Resolution a partir du label de classification du site';
        }
    } 
    else {
        // Assume the raw type is somewhat descriptive
        canonical_category = rawType.toLowerCase().replace(/\\s+/g, '_');
        category_resolution_reason = 'Utilisation du type métier initial';
    }

    // specific handling for Trouvable / AI Visibility:
    if (/trouvable/i.test(clientName) || /geo|seo|visibilite ia/i.test(rawType)) {
        business_model_detected = 'saas';
        canonical_category = 'ai_visibility_software';
        canonical_subcategory = 'local_ai_visibility_platform';
        target_audience = 'b2b';
        category_confidence = 'strong';
        category_resolution_reason = 'Correspondance exacte avec la plateforme Trouvable ou metier de visibilite';
        needs_review = false;
    }

    return {
        schema_type_detected,
        business_model_detected,
        canonical_category,
        canonical_subcategory,
        target_audience,
        category_confidence,
        category_resolution_reason,
        needs_review
    };
}
