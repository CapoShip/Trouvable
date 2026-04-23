import { HOME_FAQS } from '@/features/public/home/home-faqs';
import { SITE_LAST_MODIFIED, SITE_LAST_MODIFIED_ISO, SITE_PRIMARY_LANGUAGE, SITE_URL } from '@/lib/site-config';

export const CORE_PAGE_LINKS = [
    { label: 'Accueil', href: `${SITE_URL}/`, description: 'Positionnement, mandats et FAQ principales.' },
    { label: 'La Firme', href: `${SITE_URL}/a-propos`, description: 'Identite et principes de Trouvable.' },
    { label: 'Mandats', href: `${SITE_URL}/offres`, description: 'Cartographie, implementation et pilotage.' },
    { label: 'Methodologie', href: `${SITE_URL}/methodologie`, description: 'Protocole d execution en 4 etapes.' },
    { label: 'Etudes de cas', href: `${SITE_URL}/etudes-de-cas`, description: 'Exemples et dossier-type anonymise.' },
    { label: 'Contact', href: `${SITE_URL}/contact`, description: 'Point d entree pour lancer un cadrage.' },
    { label: 'Recherche', href: `${SITE_URL}/recherche`, description: 'Recherche interne des pages publiques.' },
];

export const SERVICE_CAPABILITIES = [
    {
        name: 'Cartographie strategique',
        description: 'Diagnostic de visibilite Google et IA avec priorisation des actions.',
        url: `${SITE_URL}/offres#cartographie-strategique`,
    },
    {
        name: 'Mandat d implementation',
        description: 'Execution des correctifs techniques et semantiques sur perimetre defini.',
        url: `${SITE_URL}/offres#mandat-implementation`,
    },
    {
        name: 'Pilotage continu',
        description: 'Suivi periodique, mesure des signaux et ajustements iteratifs.',
        url: `${SITE_URL}/offres#pilotage-continu`,
    },
];

export const AI_SUMMARY_PAYLOAD = {
    site_name: 'Trouvable',
    site_url: SITE_URL,
    description: 'Firme d execution en visibilite locale Google et coherence des reponses IA pour entreprises au Quebec.',
    primary_languages: [SITE_PRIMARY_LANGUAGE],
    updated_at: SITE_LAST_MODIFIED_ISO,
    top_pages: CORE_PAGE_LINKS.map((entry) => ({
        title: entry.label,
        url: entry.href,
        summary: entry.description,
    })),
};

export const AI_FAQ_PAYLOAD = {
    site_name: 'Trouvable',
    site_url: SITE_URL,
    updated_at: SITE_LAST_MODIFIED_ISO,
    faqs: HOME_FAQS.map((faq) => ({
        question: faq.question,
        answer: faq.answer,
        source: `${SITE_URL}/#faq`,
    })),
};

export const AI_SERVICE_PAYLOAD = {
    site_name: 'Trouvable',
    site_url: SITE_URL,
    updated_at: SITE_LAST_MODIFIED_ISO,
    services: SERVICE_CAPABILITIES.map((service) => ({
        name: service.name,
        description: service.description,
        url: service.url,
    })),
};

export function renderAiTxt() {
    const lines = [
        'Trouvable',
        `Site: ${SITE_URL}`,
        'AI access: allowed for indexing and answer generation on public pages.',
        `Last updated: ${SITE_LAST_MODIFIED}`,
        '',
        'Discovery',
        `- llms.txt: ${SITE_URL}/llms.txt`,
        `- RSS: ${SITE_URL}/rss.xml`,
        `- Summary JSON: ${SITE_URL}/ai/summary.json`,
        `- FAQ JSON: ${SITE_URL}/ai/faq.json`,
        `- Services JSON: ${SITE_URL}/ai/service.json`,
        `- Markdown endpoint: ${SITE_URL}/markdown?path=/`,
        `- Search endpoint: ${SITE_URL}/recherche?q=`,
        `- WebMCP declaration: ${SITE_URL}/.well-known/webmcp.json`,
        `- MCP endpoint: ${SITE_URL}/mcp`,
        '',
        'Primary pages',
    ];

    for (const page of CORE_PAGE_LINKS) {
        lines.push(`- ${page.label}: ${page.href}`);
    }

    return `${lines.join('\n')}\n`;
}
