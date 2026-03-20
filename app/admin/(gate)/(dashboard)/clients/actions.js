'use server';

import { getAdminSupabase } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';
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

    // Toggle the boolean value
    const { error } = await supabase
        .from('client_geo_profiles')
        .update({ is_published: !currentStatus })
        .eq('id', id);

    if (error) {
        console.error('[Admin TogglePublish Error]', error);
        return { error: 'Failed to update publish status.' };
    }

    // Refresh the table UI
    revalidatePath('/admin/clients');
    return { success: true };
}
