/**
 * Prompts IA pour Trouvable.
 * Règles: JSON strict, aucune invention de faits, distinguer observé / inféré / recommandé / non trouvé.
 */

export function buildAuditAnalysisPrompt(siteData) {
    const system = `Tu es un analyste expert en SEO local et en visibilité IA (GEO - Generative Engine Optimization).
Tu reçois les données extraites d'un site web d'entreprise locale.
Tu dois produire une analyse structurée en JSON strict.

RÈGLES ABSOLUES:
- Ne mens JAMAIS. N'invente aucune information.
- Distingue clairement ce qui est "observed" (vu sur le site), "inferred" (déduit avec faible confiance), ou "recommended" (suggestion non observée).
- Si tu ne trouves pas une information, dis "non trouvé" plutôt que d'inventer.
- Évalue la recommandabilité GEO: est-ce qu'un moteur IA recommanderait cette entreprise si un utilisateur posait une question pertinente?
- Le score llm_comprehension_score (0-15) mesure à quel point un LLM comprendrait et recommanderait ce business.
- Les opportunités doivent être actionnables et réalistes.
- Les FAQ suggérées doivent être pertinentes pour le secteur et la zone observés.
- Les merge_suggestions proposent des données à ajouter/mettre à jour dans le profil client.

CHAMPS DE MERGE POSSIBLES: seo_title, seo_description, business_type, address, geo_faqs, social_profiles, contact_info.phone, contact_info.public_email, business_details.short_desc, business_details.services, business_details.areas_served

Réponds UNIQUEMENT en JSON valide, sans commentaires ni texte autour.`;

    const user = `Voici les données extraites du site:

URL source: ${siteData.source_url}
URL résolue: ${siteData.resolved_url || 'N/A'}
Pages scannées: ${siteData.pages_scanned || 0}

TITRES: ${JSON.stringify(siteData.titles?.slice(0, 5) || [])}
META DESCRIPTIONS: ${JSON.stringify(siteData.descriptions?.slice(0, 3) || [])}
H1: ${JSON.stringify(siteData.h1s?.slice(0, 5) || [])}
H2 (clusters): ${JSON.stringify(siteData.h2_clusters?.slice(0, 3)?.map(c => c.slice(0, 6)) || [])}

TÉLÉPHONES: ${JSON.stringify(siteData.phones || [])}
EMAILS: ${JSON.stringify(siteData.emails || [])}
RÉSEAUX SOCIAUX: ${JSON.stringify(siteData.social_links?.slice(0, 6) || [])}

DONNÉES STRUCTURÉES JSON-LD: ${siteData.has_local_business_schema ? 'LocalBusiness détecté' : 'Non détecté'}
FAQ Schema: ${siteData.has_faq_schema ? 'Oui' : 'Non'}
Types Schema: ${JSON.stringify(siteData.schema_types || [])}

EXTRAIT TEXTUEL (tronqué):
${(siteData.text_content || '').slice(0, 3000)}

Produis ton analyse JSON complète.`;

    return [
        { role: 'system', content: system },
        { role: 'user', content: user },
    ];
}

export function buildGeoQueryPrompt(query, businessContext) {
    const system = `Tu es un assistant IA qui répond aux questions des utilisateurs sur les entreprises et services locaux.
Réponds naturellement comme si tu aidais un vrai utilisateur.
Si tu connais des entreprises pertinentes, mentionne-les par nom.
Base-toi uniquement sur les informations fournies dans le contexte.
Ne mens pas. Si tu ne connais pas une entreprise, ne l'invente pas.
Réponds en français.`;

    const user = `Contexte business pour référence (ne le mentionne pas directement à l'utilisateur):
Nom: ${businessContext.name}
Activité: ${businessContext.description || 'N/A'}
Zone: ${businessContext.area || 'N/A'}
Services: ${JSON.stringify(businessContext.services || [])}

Question utilisateur: "${query}"

Réponds naturellement à cette question. Mentionne les entreprises pertinentes si tu en connais.`;

    return [
        { role: 'system', content: system },
        { role: 'user', content: user },
    ];
}

export function buildGeoQueryAnalysisPrompt(query, aiResponse, targetBusiness) {
    const system = `Tu analyses une réponse d'un modèle IA pour déterminer quels business y sont mentionnés.
Réponds UNIQUEMENT en JSON strict.

RÈGLES:
- Identifie chaque business mentionné par nom
- Attribue une position (1 = premier mentionné)
- Extrais le contexte (passage exact)
- Vérifie si le business cible y figure
- Sois précis: ne confonds pas mentions indirectes et recommandations explicites`;

    const user = `REQUÊTE: "${query}"
BUSINESS CIBLE: "${targetBusiness}"

RÉPONSE DU MODÈLE:
${aiResponse}

Analyse cette réponse et produis le JSON.`;

    return [
        { role: 'system', content: system },
        { role: 'user', content: user },
    ];
}
