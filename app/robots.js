export default function robots() {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
        },
        // Bots IA Explicitement autorisés pour le référencement "GEO" (Generative Engine Optimization)
        // Les bots d'OpenAI, Google, et Anthropic.
        host: 'https://trouvable.ca',
        sitemap: 'https://trouvable.ca/sitemap.xml',
    }
}
