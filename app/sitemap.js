import { getAdminSupabase } from '@/lib/supabase-admin';
import { VILLES, EXPERTISES } from '../lib/data/geo-architecture';

export const revalidate = 3600; // Revalider le sitemap toutes les heures (3600 secondes)

export default async function sitemap() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trouvable.ca';
    const baseUrl = appUrl.replace(/\/$/, '');

    const routes = [
        {
            url: baseUrl,
            changeFrequency: 'weekly',
            priority: 1.0,
        }
    ];

    // Build static programmatic SEO routes (Villes & Expertises)
    VILLES.forEach(ville => {
        routes.push({
            url: `${baseUrl}/villes/${ville.slug}`,
            changeFrequency: 'monthly',
            priority: 0.9,
        });
    });

    EXPERTISES.forEach(expertise => {
        routes.push({
            url: `${baseUrl}/expertises/${expertise.slug}`,
            changeFrequency: 'monthly',
            priority: 0.9,
        });
    });

    // Fetch published clients for the sitemap (server-side only, uses service_role)
    try {
        const supabase = getAdminSupabase();

        const { data: clients } = await supabase
            .from('client_geo_profiles')
            .select('client_slug, updated_at')
            .eq('is_published', true);

        if (clients && clients.length > 0) {
            const clientRoutes = clients.map((client) => ({
                url: `${baseUrl}/clients/${client.client_slug}`,
                lastModified: new Date(client.updated_at),
                changeFrequency: 'monthly',
                priority: 0.8,
            }));

            routes.push(...clientRoutes);
        }
    } catch (err) {
        console.error('[Sitemap] Error fetching clients:', err.message);
    }

    return routes;
}

