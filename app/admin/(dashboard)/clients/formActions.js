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
    website_url: z.union([
        z.string().url("L'URL du site web est invalide"),
        z.literal(''),
        z.null(),
        z.undefined()
    ]).transform(e => (e === null || e === undefined) ? '' : e),
    business_type: z.string().max(50, "Le type d'entreprise est trop long").optional().transform(e => e?.trim() || 'LocalBusiness'),
    seo_title: z.string().max(70, "Le titre SEO est trop long (max 70)").optional().nullable(),
    seo_description: z.string().max(200, "La description SEO est trop longue (max 200)").optional().nullable(),
    is_published: z.boolean().default(false),

    // Advanced UI Fields Hardening
    social_profiles: z.array(
        z.string().url("URL de profil social invalide")
    ).max(10, "Maximum 10 profils sociaux autorisés").default([]),

    address: z.object({
        street: z.string().max(100).optional().nullable(),
        city: z.string().max(60).optional().nullable(),
        region: z.string().max(60).optional().nullable(),
        postalCode: z.string().max(20).optional().nullable(),
        country: z.string().max(60).optional().nullable()
    }).default({}),

    geo_faqs: z.array(
        z.object({
            question: z.string().min(5, "Question FAQ trop courte (min 5 chars)").max(200, "Question FAQ trop longue"),
            answer: z.string().min(10, "Réponse FAQ trop courte (min 10 chars)").max(1000, "Réponse FAQ trop longue")
        })
    ).max(20, "Maximum 20 FAQs autorisées").default([])
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

        // 4. Data Refinement: Strip empty strings from address to save clean JSON
        const cleanAddress = Object.fromEntries(
            Object.entries(validatedData.address || {})
                .filter(([_, v]) => v !== null && v !== undefined && v.toString().trim() !== '')
        );

        // 5. Upsert Action
        const payload = {
            client_name: validatedData.client_name,
            client_slug: validatedData.client_slug,
            website_url: validatedData.website_url || '',
            business_type: validatedData.business_type,
            seo_title: validatedData.seo_title || null,
            seo_description: validatedData.seo_description || null,
            is_published: validatedData.is_published,
            social_profiles: validatedData.social_profiles,
            address: cleanAddress, // Pure clean JSON
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
        // Zod errors have an 'issues' array — more reliable than checking err.name
        if (err?.issues && Array.isArray(err.issues) && err.issues.length > 0) {
            const messages = err.issues.map(i => i.message).join(' | ');
            return { error: messages };
        }
        console.error('[Admin SaveClient Error]', err);
        return { error: 'Une erreur inattendue est survenue.' };
    }

    // 5. Successful Save -> Revalidate routing and redirect via Client
    revalidatePath('/admin/clients');
    return { success: true };
}
