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
    const knownCompetitors = Array.isArray(businessContext.known_competitors)
        ? businessContext.known_competitors.filter(Boolean).slice(0, 15)
        : [];
    const competitorLine = knownCompetitors.length
        ? `Concurrents deja connus du profil (peuvent servir de repere si pertinents): ${knownCompetitors.join(', ')}.`
        : 'Aucun concurrent declare dans le profil — cite tout de meme des alternatives nommees si tu en connais de solides.';

    const system = `Tu es un assistant IA qui repond comme un moteur conversationnel grand public (GEO / recommandations locales et B2B leger).
Reponds en francais, de maniere naturelle et directement utile.

REGLES DE FIDELITE:
- N'invente pas d'entreprises, d'avis ou de faits precis si tu n'en es pas raisonnablement sur.
- Si tu cites des sources ou des pages, inclus l'URL complete (https://...) dans le texte pour chaque source principale.
- Si tu n'as aucune source web fiable a citer, dis-le en une courte phrase au lieu d'inventer des liens.
- Quand tu compares ou listes des options, nomme explicitement les entreprises ou marques (pas seulement "plusieurs acteurs").
- Si la question appelle des alternatives ou un "meilleur choix", structure ta reponse avec 2 a 5 noms concrets lorsque c'est possible sans inventer.
- Base-toi sur le contexte fourni pour la cible; utilise ta connaissance generale prudente pour le reste.`;

    const user = `Contexte business (ne dis pas que tu as un "contexte interne"):
Nom: ${businessContext.name}
Activite: ${businessContext.description || 'N/A'}
Zone: ${businessContext.area || 'N/A'}
Services: ${JSON.stringify(businessContext.services || [])}
${competitorLine}

Question utilisateur: "${query}"

Reponds de facon exploitable pour un operateur qui doit detecter marques, alternatives et liens: noms propres explicites, comparaisons claires, URLs si tu t'appuies sur des sources web.`;

    return [
        { role: 'system', content: system },
        { role: 'user', content: user },
    ];
}

export function buildGeoQueryAnalysisPrompt(query, aiResponse, targetBusiness) {
    const system = `Tu analyses une reponse d'un modele IA (texte brut) pour en extraire des entites exploitables.
Reponds UNIQUEMENT en JSON strict, sans markdown.

CONTRAT JSON (tous les champs requis):
{
  "query": string,
  "response_text": string,
  "mentioned_businesses": [
    {
      "name": string,
      "position": integer >= 1,
      "context": string,
      "is_target": boolean,
      "sentiment": "positive" | "neutral" | "negative"
    }
  ],
  "total_businesses_mentioned": integer,
  "target_found": boolean,
  "target_position": integer | null
}

REGLES:
- "response_text" doit reprendre integralement le texte de la reponse analysee (copie fidele).
- Liste tout business / marque / etablissement nomme de facon identifiable (y compris concurrents potentiels).
- "position" = ordre d'apparition des noms dans la reponse (1 = premier nom propre pertinent).
- "context" = extrait verbatim (copier-coller) de 120 a 260 caracteres autour de la mention; inclus des indices si c'est une recommandation, une alternative ("vs", "plutot que", "autre option") ou une simple citation.
- "is_target": true uniquement pour "${targetBusiness}" (ou sa forme evidente).
- Si aucune autre entreprise nommee: tableau vide autorise seulement si la reponse ne contient vraiment aucun nom hors cible.
- Ne cree pas de faux noms pour remplir le tableau.`;

    const user = `REQUETE: "${query}"
BUSINESS CIBLE: "${targetBusiness}"

REPONSE DU MODELE:
${aiResponse}

Analyse et produis le JSON conforme au contrat.`;

    return [
        { role: 'system', content: system },
        { role: 'user', content: user },
    ];
}
