export function scoreAudit(results) {
    const { scanned_pages, extracted_data, resolved_url } = results;

    let seo_score = 0;
    let geo_score = 0;

    const seo_breakdown = {};
    const geo_breakdown = {};
    const issues = [];
    const strengths = [];
    const automation_data = []; // Remplace prefill_suggestions pour V1.1

    // Helper to add Automation Data easily
    const pushAutoData = (field_key, detected_value, confidence_level, source_type) => {
        if (!detected_value) return;
        automation_data.push({
            field_key,
            detected_value,
            normalized_value: typeof detected_value === 'string' ? detected_value.trim() : detected_value,
            confidence_level,
            source_type,
            applied_to_cockpit: false,
            requires_review: confidence_level !== 'high',
            status: 'suggested' // Can become 'auto_applied' or 'already_covered' later in the workflow
        });
    };

    // Helper to add SEO points
    const addSeo = (key, points, max, successMsg, failMsg) => {
        seo_score += points;
        seo_breakdown[key] = `${points}/${max}`;
        if (points === max && successMsg) strengths.push(successMsg);
        if (points < max && failMsg) issues.push(failMsg);
    };

    // Helper to add GEO points
    const addGeo = (key, points, max, successMsg, failMsg) => {
        geo_score += points;
        geo_breakdown[key] = `${points}/${max}`;
        if (points === max && successMsg) strengths.push(successMsg);
        if (points < max && failMsg) issues.push(failMsg);
    };

    // --- SEO SCORE (max 100) ---

    // 1. Title/Desc/H1 (30 pts - Reduced to make room for indexability)
    let metaPoints = 0;
    if (extracted_data.titles.length > 0) metaPoints += 10;
    if (extracted_data.descriptions.length > 0) {
        metaPoints += 10;
        pushAutoData('short_desc', extracted_data.descriptions[0], 'medium', 'Meta Description');
    }
    if (extracted_data.h1s.length > 0) metaPoints += 10;
    addSeo('metadata_h1', metaPoints, 30,
        "Balises Title, Meta Description et H1 détectées.",
        "Il manque des balises Title, Meta Description ou H1 principales.");

    // 2. Security (HTTPS) (15 pts)
    const isHttps = resolved_url?.startsWith('https');
    addSeo('security_https', isHttps ? 15 : 0, 15,
        "Le site est sécurisé en HTTPS.",
        "Le site ne semble pas rediriger vers HTTPS.");

    // 3. Indexability & Canonical (15 pts) - NEW IN V1.1
    let indexPoints = 0;
    if (!extracted_data.has_noindex) indexPoints += 10;
    if (extracted_data.canonicals.length > 0) indexPoints += 5;
    addSeo('indexability', indexPoints, 15,
        "Le site est indexable et/ou possède une balise canonical claire.",
        "Problème d'indexabilité détecté (noindex) ou manque de balise Canonical.");

    // 4. NAP - Name, Address, Phone (20 pts)
    let napPoints = 0;
    if (extracted_data.phones.length > 0) {
        napPoints += 10;
        pushAutoData('phone', extracted_data.phones[0], 'high', 'Crawl Regex/Link');
    }
    if (extracted_data.emails.length > 0) {
        napPoints += 10;
        pushAutoData('public_email', extracted_data.emails[0], 'high', 'Crawl mailto');
    }
    addSeo('contact_nap', napPoints, 20,
        "Coordonnées de contact (Email/Tél) trouvées.",
        "Contact difficile à trouver (Email/Téléphone manquants ou non cliquables).");

    // 5. Structured Data (20 pts)
    addSeo('structured_data', extracted_data.has_local_business_schema ? 20 : 0, 20,
        "Données structurées (Schema.org LocalBusiness) détectées.",
        "Aucune donnée structurée pour établissement local détectée pour les moteurs.");


    // --- GEO SCORE (max 100) ---
    const allText = extracted_data.text_chunks.join(' ').toLowerCase();

    // 1. Activity Clarity (20 pts)
    const wordCount = allText.split(/\s+/).length;
    addGeo('activity_clarity', wordCount > 300 ? 20 : (wordCount > 100 ? 10 : 0), 20,
        "Le volume de texte est suffisant pour qu'une IA comprenne l'activité.",
        "Le contenu textuel est trop faible pour qu'un moteur génératif comprenne bien l'offre.");

    // 2. Services Clarity (20 pts)
    const hasServicePage = scanned_pages.some(p => p.page_type === 'services');
    const hasMultipleH2s = extracted_data.h2_clusters.some(cluster => cluster.length > 2);
    addGeo('services_clarity', (hasServicePage || hasMultipleH2s) ? 20 : 0, 20,
        "L'offre de services est structurée (page dédiée ou sous-titres H2 précis).",
        "L'offre de services manque d'une structure claire (ex: pas de page dédiée ou peu de H2 pertinents).");

    // 3. Geographic Clarity (20 pts)
    const geoWords = ['intervention', 'secteur', 'région', 'ville', 'déplacement', 'alentours', 'situé'];
    const geoCount = geoWords.filter(w => allText.includes(w)).length;
    addGeo('geo_clarity', geoCount >= 2 ? 20 : (geoCount === 1 ? 10 : 0), 20,
        "La zone d'intervention géographique semble mentionnée.",
        "La zone géographique desservie n'est pas évidente ou manque de précision.");

    // 4. FAQ / QA (15 pts)
    const hasFaqPage = scanned_pages.some(p => p.page_type === 'faq');
    const hasFaqText = allText.includes('faq') || allText.includes('questions fréquentes');
    addGeo('faq_answers', (hasFaqPage || hasFaqText || extracted_data.has_faq_schema) ? 15 : 0, 15,
        "Présence d'une FAQ ou de réponses directes aux questions fréquentes.",
        "Il manque une section FAQ pour répondre directement aux objections des moteurs vocaux/IA.");

    // 5. Credibility (10 pts)
    const credWords = ['avis', 'client', 'étoile', 'google', 'expérience', 'depuis', 'reconnu', 'certifié', 'expert'];
    const credCount = credWords.filter(w => allText.includes(w)).length;
    addGeo('credibility_signals', credCount >= 3 ? 10 : 0, 10,
        "Signaux de crédibilité détectés (avis, expérience, certification).",
        "Peu de signaux de confiance détectables par une IA (avis, certifications).");

    // 6. Differentiators (15 pts)
    const diffWords = ['garantie', '24/7', 'urgence', 'rapide', 'gratuit', 'devis', 'sur mesure', 'qualité'];
    const diffCount = diffWords.filter(w => allText.includes(w)).length;
    addGeo('differentiators', diffCount >= 2 ? 15 : 0, 15,
        "Des mots-clés de différenciation claire sont présents (urgence, devis gratuit, garantie).",
        "Les avantages concurrentiels ne ressortent pas clairement dans le texte.");

    // Push extra automation suggestions based on heuristics
    if (diffCount >= 2) {
        pushAutoData('differentiators', [diffWords.find(w => allText.includes(w))], 'low', 'Keyword Heuristics');
    }

    return {
        seo_score,
        geo_score,
        seo_breakdown,
        geo_breakdown,
        issues,
        strengths,
        automation_data
    };
}
