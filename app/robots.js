export default function robots() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trouvable.ca';
    const baseUrl = appUrl.replace(/\/$/, '');

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/admin/',
        },
        // Bots IA Explicitement autorisés pour le référencement "GEO" (Generative Engine Optimization)
        host: baseUrl,
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
