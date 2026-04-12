import { SITE_URL } from '@/lib/site-config';

export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/portal/', '/espace/', '/api/'],
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
    }
}
