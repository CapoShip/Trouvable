'use server';

import { getAdminSupabase } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
import { logAction } from '@/lib/db';
import { z } from 'zod';

export async function togglePublishAction(id, currentStatus) {
    // 0. Input validation
    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
        console.error('[Admin TogglePublish Error] Invalid UUID.');
        return { error: 'Invalid profile ID.' };
    }

    // 1. Mandatory Security Check
    const admin = await requireAdmin();
    if (!admin) {
        console.error('[Admin TogglePublish Error] Unauthorized action attempt.');
        return { error: 'Non autorisé.' };
    }

    // 2. Database Action
    const supabase = getAdminSupabase();
    const nextPublished = !currentStatus;

    // Toggle the boolean value
    const { error } = await supabase
        .from('client_geo_profiles')
        .update({
            is_published: nextPublished,
            publication_status: nextPublished ? 'published' : 'draft',
        })
        .eq('id', id);

    if (error) {
        console.error('[Admin TogglePublish Error]', error);
        return { error: 'Failed to update publish status.' };
    }

    await logAction({
        client_id: id,
        action_type: 'publication_state_changed',
        details: {
            is_published: nextPublished,
            publication_status: nextPublished ? 'published' : 'draft',
            source: 'clients_list_toggle',
        },
        performed_by: admin.email,
    });

    // Refresh the table UI
    revalidatePath('/admin/clients');
    revalidatePath('/admin/clients');
    return { success: true };
}
