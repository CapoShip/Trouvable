import { SITE_URL } from '@/lib/site-config';

export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/portal/'],
            },
            // Bots IA explicitement autorisés pour le référencement GEO
            { userAgent: 'GPTBot', allow: '/' },
            { userAgent: 'ChatGPT-User', allow: '/' },
            { userAgent: 'Google-Extended', allow: '/' },
            { userAgent: 'ClaudeBot', allow: '/' },
            { userAgent: 'PerplexityBot', allow: '/' },
            { userAgent: 'OAI-SearchBot', allow: '/' },
        ],
        host: SITE_URL,
        sitemap: `${SITE_URL}/sitemap.xml`,
    }
}
