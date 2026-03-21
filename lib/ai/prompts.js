/**
 * Prompts IA pour Trouvable.
 * Regles: JSON strict, aucune invention de faits, distinguer observed / inferred / recommended / non trouve.
 */

export function buildAuditAnalysisPrompt(siteData) {
    const system = `Tu es un analyste expert en SEO, GEO et answerability pour Trouvable.
Tu recois un resume de crawl deja nettoye. Tu dois produire un JSON strict, utile meme si certaines donnees sont faibles.

REGLES ABSOLUES:
- N'invente aucun fait.
- Utilise "observed" seulement pour ce qui est clairement present dans les donnees.
- Utilise "inferred" seulement pour une deduction prudente basee sur plusieurs signaux.
- Utilise "recommended" pour une action conseillee non observee.
- Si un point est absent, traite-le comme "non trouve" plutot que d'inventer.
- Reste conscient du site type detecte. N'applique pas des attentes locales tres fortes a un site dont la relevance locale est faible.
- Les opportunites doivent etre actionnables, precises et non vagues.
- Les merge_suggestions doivent rester modestes et defensives.
- Le score llm_comprehension_score est un score entier de 0 a 15.
- Reponds UNIQUEMENT en JSON valide, sans texte autour.

CONTRAT JSON:
- business_summary: string bref et factuel
- geo_recommendability: "strong" | "moderate" | "weak" | "unclear"
- geo_recommendability_rationale: string
- llm_comprehension_score: integer 0-15
- answerability_summary: string court
- opportunities: array of objects with title, description, priority, category, source, evidence_summary, recommended_fix
- faq_suggestions: array of objects with question, suggested_answer, source, rationale
- merge_suggestions: array of objects with field_name, suggested_value, confidence, rationale, source
- detected_services: array of strings
- detected_areas: array of strings
- detected_business_name: string ou null

CATEGORIES AUTORISEES POUR opportunities:
- seo
- geo
- content
- technical
- trust

CHAMPS DE MERGE POSSIBLES:
- seo_title
- seo_description
- business_type
- address
- geo_faqs
- social_profiles
- contact_info.phone
- contact_info.public_email
- business_details.short_desc
- business_details.services
- business_details.areas_served`;

    const user = `Voici les donnees extraites du site:

URL source: ${siteData.source_url}
URL resolue: ${siteData.resolved_url || 'N/A'}
Pages scannees: ${siteData.pages_scanned || 0}

SITE TYPE DETECTE:
${JSON.stringify(siteData.site_classification || {}, null, 2)}

PAGES RESUMEES:
${JSON.stringify(siteData.page_summaries || [], null, 2)}

TITRES: ${JSON.stringify(siteData.titles?.slice(0, 5) || [])}
META DESCRIPTIONS: ${JSON.stringify(siteData.descriptions?.slice(0, 3) || [])}
H1: ${JSON.stringify(siteData.h1s?.slice(0, 5) || [])}
H2 CLUSTERS: ${JSON.stringify(siteData.h2_clusters?.slice(0, 3)?.map((cluster) => cluster.slice(0, 6)) || [])}

BUSINESS NAMES: ${JSON.stringify(siteData.business_names || [])}
PHONES: ${JSON.stringify(siteData.phones || [])}
EMAILS: ${JSON.stringify(siteData.emails || [])}
SOCIAL LINKS: ${JSON.stringify(siteData.social_links?.slice(0, 6) || [])}

LOCAL SIGNALS:
${JSON.stringify(siteData.local_signals || {}, null, 2)}

SERVICE SIGNALS:
${JSON.stringify(siteData.service_signals || {}, null, 2)}

TRUST SIGNALS:
${JSON.stringify(siteData.trust_signals || {}, null, 2)}

SCHEMA ENTITIES:
${JSON.stringify(siteData.schema_entities || [], null, 2)}

FAQ PAIRS:
${JSON.stringify(siteData.faq_pairs || [], null, 2)}

TECHNOLOGY SIGNALS:
${JSON.stringify(siteData.technology_signals || {}, null, 2)}

PAGE STATS:
${JSON.stringify(siteData.page_stats || {}, null, 2)}

EVIDENCE SUMMARY:
${JSON.stringify(siteData.evidence_summary || [], null, 2)}

TEXT SAMPLE:
${(siteData.text_content || '').slice(0, 3200)}

Produis maintenant le JSON strict.`;

    return [
        { role: 'system', content: system },
        { role: 'user', content: user },
    ];
}

export function buildGeoQueryPrompt(query, businessContext) {
    const system = `Tu es un assistant IA qui repond aux questions des utilisateurs sur les entreprises et services locaux.
Reponds naturellement comme si tu aidais un vrai utilisateur.
Si tu connais des entreprises pertinentes, mentionne-les par nom.
Base-toi uniquement sur les informations fournies dans le contexte.
Ne mens pas. Si tu ne connais pas une entreprise, ne l'invente pas.
Reponds en francais.`;

    const user = `Contexte business pour reference (ne le mentionne pas directement a l'utilisateur):
Nom: ${businessContext.name}
Activite: ${businessContext.description || 'N/A'}
Zone: ${businessContext.area || 'N/A'}
Services: ${JSON.stringify(businessContext.services || [])}

Question utilisateur: "${query}"

Reponds naturellement a cette question. Mentionne les entreprises pertinentes si tu en connais.`;

    return [
        { role: 'system', content: system },
        { role: 'user', content: user },
    ];
}

export function buildGeoQueryAnalysisPrompt(query, aiResponse, targetBusiness) {
    const system = `Tu analyses une reponse d'un modele IA pour determiner quels business y sont mentionnes.
Reponds UNIQUEMENT en JSON strict.

REGLES:
- Identifie chaque business mentionne par nom
- Attribue une position (1 = premier mentionne)
- Extrais le contexte (passage exact)
- Verifie si le business cible y figure
- Sois precis: ne confonds pas mentions indirectes et recommandations explicites`;

    const user = `REQUETE: "${query}"
BUSINESS CIBLE: "${targetBusiness}"

REPONSE DU MODELE:
${aiResponse}

Analyse cette reponse et produis le JSON.`;

    return [
        { role: 'system', content: system },
        { role: 'user', content: user },
    ];
}
