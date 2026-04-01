import { SITE_URL } from '@/lib/site-config';

export default function robots() {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/portal/'],
        },
        host: SITE_URL,
        sitemap: `${SITE_URL}/sitemap.xml`,
    }
}
