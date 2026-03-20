/**
 * Score hybride v2 — déterministe + breakdown explicable.
 *
 * Catégories (sur 85 pts déterministes, le LLM ajoute 15 pts):
 * - Identité / NAP: 15
 * - Schema / structured data: 15
 * - Clarté de l'offre / services: 15
 * - FAQ / questions métier: 10
 * - Crédibilité / preuves: 10
 * - Localisation / area served: 10
 * - Technique on-page: 10
 * (LLM compréhension: 15 — ajouté dans run-audit.js)
 */
export function scoreAuditV2(scanResults) {
    const ed = scanResults.extracted_data || {};
    const pages = scanResults.scanned_pages || [];
    const allText = (ed.text_chunks || []).join(' ').toLowerCase();

    let seo_score = 0;
    let geo_score = 0;
    const seo_breakdown = {};
    const geo_breakdown = {};
    const issues = [];
    const strengths = [];
    const automation_data = [];
    const breakdown = {};

    function pushAuto(field_key, detected_value, confidence, source_type) {
        if (!detected_value) return;
        automation_data.push({
            field_key,
            detected_value,
            normalized_value: typeof detected_value === 'string' ? detected_value.trim() : detected_value,
            confidence_level: confidence,
            source_type,
            status: 'suggested',
        });
    }

    // ─── 1. Identité / NAP (15 pts) ─────────────────────────────────────────
    let napPts = 0;
    if (ed.phones?.length > 0) { napPts += 5; pushAuto('phone', ed.phones[0], 'high', 'Crawl'); }
    else issues.push('Aucun téléphone cliquable trouvé sur le site.');
    if (ed.emails?.length > 0) { napPts += 5; pushAuto('public_email', ed.emails[0], 'high', 'Crawl'); }
    else issues.push('Aucun email de contact trouvé sur le site.');
    if (ed.h1s?.length > 0) { napPts += 3; }
    if (ed.titles?.length > 0 && ed.titles[0].length > 10) napPts += 2;
    napPts = Math.min(15, napPts);
    breakdown.identity_nap = `${napPts}/15`;
    if (napPts >= 12) strengths.push('Identité et coordonnées bien visibles.');

    // ─── 2. Schema / Structured Data (15 pts) ──────────────────────────────
    let schemaPts = 0;
    if (ed.has_local_business_schema) { schemaPts += 10; strengths.push('Schema LocalBusiness détecté.'); }
    else issues.push('Pas de données structurées LocalBusiness/Organization.');
    if (ed.has_faq_schema) schemaPts += 5;
    schemaPts = Math.min(15, schemaPts);
    breakdown.schema_structured = `${schemaPts}/15`;

    // ─── 3. Clarté offre / services (15 pts) ────────────────────────────────
    let servicePts = 0;
    const hasServicePage = pages.some(p => p.page_type === 'services');
    const hasMultiH2 = (ed.h2_clusters || []).some(c => c.length >= 3);
    if (hasServicePage) { servicePts += 8; strengths.push('Page services détectée.'); }
    if (hasMultiH2) servicePts += 4;
    const wordCount = allText.split(/\s+/).length;
    if (wordCount > 500) servicePts += 3;
    else if (wordCount > 200) servicePts += 1;
    else issues.push('Contenu textuel insuffisant pour une compréhension IA optimale.');
    servicePts = Math.min(15, servicePts);
    breakdown.service_clarity = `${servicePts}/15`;

    // ─── 4. FAQ / questions métier (10 pts) ──────────────────────────────────
    let faqPts = 0;
    const hasFaqPage = pages.some(p => p.page_type === 'faq');
    const hasFaqText = allText.includes('faq') || allText.includes('questions fréquentes') || allText.includes('questions courantes');
    if (hasFaqPage) faqPts += 5;
    if (ed.has_faq_schema) faqPts += 3;
    if (hasFaqText) faqPts += 2;
    if (faqPts === 0) issues.push('Pas de FAQ détectée — les IA cherchent des réponses directes.');
    else strengths.push('FAQ ou contenu Q&A détecté.');
    faqPts = Math.min(10, faqPts);
    breakdown.faq_questions = `${faqPts}/10`;

    // ─── 5. Crédibilité / preuves (10 pts) ──────────────────────────────────
    let credPts = 0;
    const credWords = ['avis', 'témoignage', 'client', 'étoile', 'google', 'expérience', 'depuis', 'certifié', 'reconnu', 'expert', 'garantie'];
    const credFound = credWords.filter(w => allText.includes(w));
    credPts = Math.min(10, credFound.length * 2);
    if (credPts >= 6) strengths.push('Signaux de crédibilité détectés (avis, expérience).');
    else if (credPts < 4) issues.push('Peu de signaux de confiance visibles pour un moteur IA.');
    breakdown.credibility = `${credPts}/10`;

    // ─── 6. Localisation / area served (10 pts) ─────────────────────────────
    let geoPts = 0;
    const geoWords = ['intervention', 'secteur', 'région', 'ville', 'déplacement', 'alentours', 'situé', 'zone', 'quartier', 'arrondissement', 'montreal', 'montréal', 'laval', 'québec', 'longueuil'];
    const geoFound = geoWords.filter(w => allText.includes(w));
    geoPts = Math.min(10, geoFound.length * 2);
    if (geoPts >= 6) strengths.push('Zone géographique clairement mentionnée.');
    else if (geoPts < 4) issues.push('La zone de service géographique est mal définie.');
    breakdown.localization = `${geoPts}/10`;

    // ─── 7. Technique on-page (10 pts) ──────────────────────────────────────
    let techPts = 0;
    const isHttps = scanResults.resolved_url?.startsWith('https');
    if (isHttps) { techPts += 4; }
    else issues.push('Le site ne redirige pas vers HTTPS.');
    if (!ed.has_noindex) techPts += 3;
    else issues.push('Le site a une balise noindex — invisible pour les moteurs.');
    if ((ed.canonicals || []).length > 0) techPts += 2;
    if (ed.descriptions?.length > 0) techPts += 1;
    techPts = Math.min(10, techPts);
    breakdown.technical_onpage = `${techPts}/10`;

    // ─── Totaux ──────────────────────────────────────────────────────────────
    const deterministic_score = napPts + schemaPts + servicePts + faqPts + credPts + geoPts + techPts;

    seo_score = Math.min(100, Math.round((napPts + schemaPts + techPts) / 40 * 100));
    geo_score = Math.min(100, Math.round((servicePts + faqPts + credPts + geoPts) / 45 * 100));

    seo_breakdown.identity_nap = breakdown.identity_nap;
    seo_breakdown.schema_structured = breakdown.schema_structured;
    seo_breakdown.technical_onpage = breakdown.technical_onpage;

    geo_breakdown.service_clarity = breakdown.service_clarity;
    geo_breakdown.faq_questions = breakdown.faq_questions;
    geo_breakdown.credibility = breakdown.credibility;
    geo_breakdown.localization = breakdown.localization;

    // Social links for automation
    if (ed.social_links?.length > 0) {
        pushAuto('social_profiles', ed.social_links, 'high', 'Crawl');
    }

    // Description
    if (ed.descriptions?.length > 0) {
        pushAuto('short_desc', ed.descriptions[0], 'medium', 'Meta Description');
    }

    return {
        seo_score,
        geo_score,
        deterministic_score,
        seo_breakdown,
        geo_breakdown,
        breakdown,
        issues,
        strengths,
        automation_data,
    };
}
