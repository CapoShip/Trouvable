'use server';

import { getAdminSupabase } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { verifySession } from '@/lib/session';
import { z } from 'zod';
import { redirect } from 'next/navigation';

// Strict validation schema for client profiles
const clientProfileSchema = z.object({
    id: z.string().uuid().optional().nullable(),
    client_name: z.string().min(2, "Le nom du client est requis (min 2 caractères)"),
    client_slug: z.string().min(2, "Le slug est requis").regex(/^[a-z0-9-]+$/, "Le slug ne doit contenir que des minuscules, chiffres et tirets"),
    website_url: z.string().url("L'URL du site web est invalide (doit commencer par http:// ou https://)"),
    business_type: z.string().optional(),
    seo_title: z.string().optional(),
    seo_description: z.string().optional(),
    is_published: z.boolean().default(false),

    // We expect these as JSON objects/arrays directly from the client component
    social_profiles: z.array(z.any()).default([]),
    address: z.record(z.string(), z.any()).default({}),
    geo_faqs: z.array(
        z.object({
            question: z.string(),
            answer: z.string()
        })
    ).default([])
});

export async function saveClientProfileAction(formDataObject) {
    // 1. Mandatory Security Check
    const session = await verifySession();
    if (!session || session.role !== 'admin') {
        console.error('[Admin SaveClient Error] Unauthorized action attempt.');
        return { error: 'Non autorisé.' };
    }

    try {
        // 2. Validate strict schema
        const validatedData = clientProfileSchema.parse(formDataObject);
        const supabase = getAdminSupabase();

        // 3. Uniqueness Check on Slug
        // We must ensure the slug isn't already used by ANOTHER profile
        let slugCheckQuery = supabase
            .from('client_geo_profiles')
            .select('id')
            .eq('client_slug', validatedData.client_slug);

        if (validatedData.id) {
            slugCheckQuery = slugCheckQuery.neq('id', validatedData.id);
        }

        const { data: existingSlugs, error: slugError } = await slugCheckQuery;

        if (slugError) throw slugError;
        if (existingSlugs && existingSlugs.length > 0) {
            return { error: 'Ce slug (URL) est déjà utilisé par un autre client.' };
        }

        // 4. Upsert Action
        const payload = {
            client_name: validatedData.client_name,
            client_slug: validatedData.client_slug,
            website_url: validatedData.website_url,
            business_type: validatedData.business_type || 'LocalBusiness',
            seo_title: validatedData.seo_title || null,
            seo_description: validatedData.seo_description || null,
            is_published: validatedData.is_published,
            social_profiles: validatedData.social_profiles,
            address: validatedData.address,
            geo_faqs: validatedData.geo_faqs,
            // updated_at is handled by postgres trigger automatically
        };

        let resultError = null;

        if (validatedData.id) {
            // EDIT Mode
            const { error: updateError } = await supabase
                .from('client_geo_profiles')
                .update(payload)
                .eq('id', validatedData.id);
            resultError = updateError;
        } else {
            // CREATE Mode
            const { error: insertError } = await supabase
                .from('client_geo_profiles')
                .insert([payload]);
            resultError = insertError;
        }

        if (resultError) {
            console.error('[Admin SaveClient Error] DB Insert/Update failed:', resultError);
            return { error: 'Erreur lors de la sauvegarde en base de données.' };
        }

    } catch (err) {
        if (err instanceof z.ZodError) {
            return { error: err.errors[0].message }; // Return first Zod error friendly message
        }
        console.error('[Admin SaveClient Error]', err);
        return { error: 'Une erreur inattendue est survenue.' };
    }

    // 5. Successful Save -> Revalidate routing and redirect via Client
    revalidatePath('/admin/clients');
    return { success: true };
}
