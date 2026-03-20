'use server';

import { requireAdmin } from '@/lib/auth';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { runSiteAudit } from '@/lib/audit/scanner';
import { scoreAudit } from '@/lib/audit/scorer';

export async function launchSiteAuditAction(clientId, url) {
    const admin = await requireAdmin();
    if (!admin) {
        return { error: 'Accès refusé. Réservé aux administrateurs.' };
    }

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
        return { error: 'URL invalide. Doit commencer par http:// ou https://' };
    }

    const supabase = getAdminSupabase();

    // Create pending audit record
    const { data: auditRecord, error: insertError } = await supabase
        .from('client_site_audits')
        .insert({
            client_id: clientId,
            source_url: url,
            scan_status: 'running',
            audit_version: '1.0'
        })
        .select()
        .single();

    if (insertError) {
        console.error('[launchSiteAuditAction] Error creating audit record:', insertError);
        return { error: 'Impossible de créer le rapport d\'audit.' };
    }

    try {
        // Run Scanner
        const rawResults = await runSiteAudit(url);

        // Handle global failure
        if (rawResults.error_message) {
            await supabase.from('client_site_audits').update({
                scan_status: 'failed',
                error_message: rawResults.error_message
            }).eq('id', auditRecord.id);
            revalidatePath(`/admin/clients/${clientId}/audit`);
            return { error: rawResults.error_message };
        }

        // Run Scorer
        const scoredResults = scoreAudit(rawResults);

        // Check if any pages failed to determine partial error
        const hasFailedPages = rawResults.scanned_pages.some(p => !p.success);
        const finalStatus = hasFailedPages ? 'partial_error' : 'success';

        // >>> V1.1 AUTOMATION : SAFE MERGE LOGIC <<<
        const { data: profile } = await supabase
            .from('client_geo_profiles')
            .select('contact_info, business_details, seo_data')
            .eq('id', clientId)
            .single();

        let updatesToCockpit = {};
        const newContactInfo = profile ? { ...profile.contact_info } : {};
        const newBusinessDetails = profile ? { ...profile.business_details } : {};
        const newSeoData = profile ? { ...profile.seo_data } : {};

        let hasCockpitUpdates = false;

        // Traverse automation_data to apply High confidence missing fields
        const processedAutomationData = scoredResults.automation_data.map(item => {
            let autoApplied = false;

            if (item.confidence_level === 'high') {
                if (item.field_key === 'phone') {
                    if (!newContactInfo.phone) {
                        newContactInfo.phone = item.normalized_value;
                        hasCockpitUpdates = true;
                        autoApplied = true;
                    } else if (newContactInfo.phone === item.normalized_value) {
                        item.status = 'already_covered';
                        item.requires_review = false;
                    }
                }
                else if (item.field_key === 'public_email') {
                    if (!newContactInfo.public_email) {
                        newContactInfo.public_email = item.normalized_value;
                        hasCockpitUpdates = true;
                        autoApplied = true;
                    } else if (newContactInfo.public_email === item.normalized_value) {
                        item.status = 'already_covered';
                        item.requires_review = false;
                    }
                }
            }

            // Medium confidence
            if (item.confidence_level === 'medium' && item.field_key === 'short_desc') {
                if (newBusinessDetails.short_desc && newBusinessDetails.short_desc === item.normalized_value) {
                    item.status = 'already_covered';
                    item.requires_review = false;
                }
            }

            if (autoApplied) {
                item.applied_to_cockpit = true;
                item.requires_review = false;
                item.status = 'auto_applied';
            }

            return item;
        });

        // Apply automatic updates to Cockpit if any
        if (hasCockpitUpdates) {
            updatesToCockpit.contact_info = newContactInfo;
            // Add business_details or seo_data later if we auto-apply them

            await supabase
                .from('client_geo_profiles')
                .update(updatesToCockpit)
                .eq('id', clientId);
        }

        // Update Audit Record
        const { error: updateError } = await supabase
            .from('client_site_audits')
            .update({
                scan_status: finalStatus,
                resolved_url: rawResults.resolved_url,
                scanned_pages: rawResults.scanned_pages,
                extracted_data: rawResults.extracted_data,
                seo_score: scoredResults.seo_score,
                geo_score: scoredResults.geo_score,
                seo_breakdown: scoredResults.seo_breakdown,
                geo_breakdown: scoredResults.geo_breakdown,
                issues: scoredResults.issues,
                strengths: scoredResults.strengths,
                prefill_suggestions: processedAutomationData // We store the rich array instead of the flat obj
            })
            .eq('id', auditRecord.id);

        if (updateError) {
            console.error('[launchSiteAuditAction] Error saving audit results:', updateError);
            return { error: 'Erreur lors de la sauvegarde des résultats.' };
        }

        revalidatePath(`/admin/clients/${clientId}/seo-geo`);
        revalidatePath(`/admin/clients/${clientId}/audit`);
        return { success: true, auditId: auditRecord.id };

    } catch (e) {
        console.error('[launchSiteAuditAction] Critical Audit Error:', e);
        await supabase.from('client_site_audits').update({
            scan_status: 'failed',
            error_message: e.message || "Erreur système critique."
        }).eq('id', auditRecord.id);
        revalidatePath(`/admin/clients/${clientId}/audit`);
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
