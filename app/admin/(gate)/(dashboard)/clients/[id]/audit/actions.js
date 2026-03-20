'use server';

import { requireAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { runFullAudit } from '@/lib/audit/run-audit';

export async function launchSiteAuditAction(clientId, url) {
    const admin = await requireAdmin();
    if (!admin) {
        return { error: 'Accès refusé. Réservé aux administrateurs.' };
    }

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        return { error: 'URL invalide. Doit commencer par http:// ou https://' };
    }

    try {
        const result = await runFullAudit(clientId, url);

        revalidatePath(`/admin/clients/${clientId}/seo-geo`);
        revalidatePath(`/admin/clients/${clientId}/audit`);
        revalidatePath(`/admin/dashboard`);

        if (!result.success) {
            return { error: result.error || 'Audit échoué' };
        }

        return {
            success: true,
            auditId: result.auditId,
            seo_score: result.seo_score,
            geo_score: result.geo_score,
            overall_score: result.overall_score,
            summary: result.summary,
            opportunitiesCount: result.opportunitiesCount,
            mergeSuggestionsCount: result.mergeSuggestionsCount,
        };
    } catch (e) {
        console.error('[launchSiteAuditAction] Erreur:', e);
        return { error: "L'audit a échoué suite à une erreur inattendue." };
    }
}

export async function applySuggestionsToCockpitAction(clientId, selectedSuggestions) {
    const admin = await requireAdmin();
    if (!admin) {
        return { error: 'Accès refusé.' };
    }

    if (!selectedSuggestions || typeof selectedSuggestions !== 'object') {
        return { error: 'Données de suggestions invalides.' };
    }

    const supabase = getAdminSupabase();

    // Fetch existing Cockpit data to merge securely
    const { data: profile, error: profileErr } = await supabase
        .from('client_geo_profiles')
        .select('contact_info, business_details, seo_data, seo_description')
        .eq('id', clientId)
        .single();

    if (profileErr) return { error: "Client introuvable." };

    const updates = {};
    const newContactInfo = { ...profile.contact_info };
    const newBusinessDetails = { ...profile.business_details };

    // Maps suggestions safely without overwriting if not selected
    if (selectedSuggestions.phone) {
        newContactInfo.phone = selectedSuggestions.phone;
        updates.contact_info = newContactInfo;
    }
    if (selectedSuggestions.public_email) {
        newContactInfo.public_email = selectedSuggestions.public_email;
        updates.contact_info = newContactInfo;
    }
    if (selectedSuggestions.short_desc) {
        // if they select short desc, put it in business_details.short_desc, NOT seo_description 
        // to leave seo_description as primary truth if it exists, or they can use it as fallback.
        newBusinessDetails.short_desc = selectedSuggestions.short_desc;
        updates.business_details = newBusinessDetails;
    }

    if (Object.keys(updates).length === 0) {
        return { error: "Aucune mise à jour valide soumise." };
    }

    const { error: updateErr } = await supabase
        .from('client_geo_profiles')
        .update(updates)
        .eq('id', clientId);

    if (updateErr) {
        console.error('[applySuggestionsToCockpitAction] Update Error:', updateErr);
        return { error: "Erreur lors de la mise à jour du Cockpit." };
    }

    revalidatePath(`/admin/clients/${clientId}/seo-geo`);
    revalidatePath(`/admin/clients/${clientId}/audit`);

    return { success: true };
}
