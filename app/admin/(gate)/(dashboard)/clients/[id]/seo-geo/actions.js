'use server';

import { getAdminSupabase } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { syncClientProfileCompatibilityFields } from '@/lib/client-profile';
import { logAction } from '@/lib/db';
import { z } from 'zod';

// Helper to normalize arrays: trim spaces, remove empties, deduplicate
const normalizeStringArray = (arr) => {
    if (!Array.isArray(arr)) return [];
    const cleaned = arr.map(s => (typeof s === 'string' ? s.trim() : '')).filter(Boolean);
    return [...new Set(cleaned)];
};

// Strict schema for Cockpit (JSONB Shape validation)
const cockpitSchema = z.object({
    id: z.string().uuid(),
    publication_status: z.enum(['draft', 'ready', 'published']).default('draft'),
    internal_notes: z.string().optional().transform(v => v || ''),

    // Contact Info Structure
    contact_info: z.object({
        phone: z.string().optional().transform(v => v || ''),
        public_email: z.union([
            z.string().email("Format d'email invalide"),
            z.literal(''),
            z.null(),
            z.undefined()
        ]).transform(e => (e === null || e === undefined) ? '' : e),
    }).default({ phone: '', public_email: '' }),

    // Business Details Structure
    business_details: z.object({
        short_desc: z.string().max(300, "Description courte trop longue").optional().transform(v => v || ''),
        long_desc: z.string().max(2000, "Description longue trop longue").optional().transform(v => v || ''),
        maps_url: z.union([
            z.string().url("URL Google Maps invalide"),
            z.literal(''),
            z.null(),
            z.undefined()
        ]).transform(v => v || ''),
        opening_hours: z.array(z.string()).default([]).transform(normalizeStringArray)
    }).default({ short_desc: '', long_desc: '', maps_url: '', opening_hours: [] }),

    // SEO Data Structure
    seo_data: z.object({
        main_keywords: z.array(z.string()).default([]).transform(normalizeStringArray),
        secondary_keywords: z.array(z.string()).default([]).transform(normalizeStringArray),
        target_cities: z.array(z.string()).default([]).transform(normalizeStringArray),
        value_proposition: z.string().max(300, "Proposition de valeur trop longue").optional().transform(v => v || ''),
    }).default({ main_keywords: [], secondary_keywords: [], target_cities: [], value_proposition: '' }),

    // GEO AI Data Structure
    geo_ai_data: z.object({
        client_types: z.array(z.string()).default([]).transform(normalizeStringArray),
        objections: z.array(z.string()).default([]).transform(normalizeStringArray),
        differentiators: z.array(z.string()).default([]).transform(normalizeStringArray),
        proofs: z.array(z.string()).default([]).transform(normalizeStringArray),
        guarantees: z.array(z.string()).default([]).transform(normalizeStringArray),
        ai_summary_short: z.string().max(500, "Résumé court trop long").optional().transform(v => v || ''),
        ai_summary_long: z.string().max(3000, "Résumé long trop long").optional().transform(v => v || ''),
    }).default({ client_types: [], objections: [], differentiators: [], proofs: [], guarantees: [], ai_summary_short: '', ai_summary_long: '' })
});


export async function saveCockpitDataAction(formDataObject) {
    // 1. Mandatory Security Check
    const admin = await requireAdmin();
    if (!admin) {
        return { error: 'Non autorisé.' };
    }

    try {
        // 2. Validate and normalize the strict shape
        const validatedData = cockpitSchema.parse(formDataObject);
        const supabase = getAdminSupabase();
        const { data: currentProfile, error: currentProfileError } = await supabase
            .from('client_geo_profiles')
            .select('publication_status, is_published')
            .eq('id', validatedData.id)
            .single();

        if (currentProfileError) {
            console.error('[Admin SaveCockpit Error] Current profile lookup failed:', currentProfileError);
            return { error: 'Impossible de récupérer le statut de publication actuel.' };
        }

        // Compatibility sync: if publication_status == 'published', set is_published to true for existing queries
        const isPublishedCompat = validatedData.publication_status === 'published';

        // 3. Prepare Postgres Upsert Object
        const payload = syncClientProfileCompatibilityFields({
            contact_info: validatedData.contact_info,
            business_details: validatedData.business_details,
            seo_data: validatedData.seo_data,
            geo_ai_data: validatedData.geo_ai_data,
            internal_notes: validatedData.internal_notes,
            publication_status: validatedData.publication_status,
            is_published: isPublishedCompat
            // updated_at is handled by postgres trigger automatically
        });

        const { error: updateError } = await supabase
            .from('client_geo_profiles')
            .update(payload)
            .eq('id', validatedData.id);

        if (updateError) {
            console.error('[Admin SaveCockpit Error] DB Update failed:', updateError);
            return { error: 'Erreur lors de la sauvegarde en base de données.' };
        }

        if (
            currentProfile?.publication_status !== validatedData.publication_status
            || currentProfile?.is_published !== isPublishedCompat
        ) {
            await logAction({
                client_id: validatedData.id,
                action_type: 'publication_state_changed',
                details: {
                    publication_status: validatedData.publication_status,
                    is_published: isPublishedCompat,
                    source: 'cockpit_save',
                },
                performed_by: admin.email,
            });
        }

        revalidatePath(`/admin/clients/${validatedData.id}/seo-geo`);
        revalidatePath('/admin/clients');
        revalidatePath('/admin/dashboard');

        return { success: true };

    } catch (err) {
        if (err?.issues && Array.isArray(err.issues) && err.issues.length > 0) {
            const messages = err.issues.map(i => i.message).join(' | ');
            return { error: messages };
        }
        console.error('[Admin SaveCockpit Error]', err);
        return { error: 'Une erreur inattendue est survenue lors de la validation.' };
    }
}
