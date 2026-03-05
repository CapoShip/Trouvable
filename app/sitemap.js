import { createClient } from '@supabase/supabase-js';

export const revalidate = 3600; // Revalider le sitemap toutes les heures (3600 secondes)

export default async function sitemap() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trouvable.ca';
    const baseUrl = appUrl.replace(/\/$/, '');

    const routes = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        }
    ];

    // Fetch live clients to dynamically populate their SEO pages
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
    }

    return routes;
}
