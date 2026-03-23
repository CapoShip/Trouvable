import { SITE_URL } from '@/lib/site-config';

export default function robots() {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/portal/'],
        },
        // Bots IA Explicitement autorisés pour le référencement "GEO" (Generative Engine Optimization)
        host: SITE_URL,
        sitemap: `${SITE_URL}/sitemap.xml`,
    }
}
