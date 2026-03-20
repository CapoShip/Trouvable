'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireAdminAccess, setClientPortalAccessStatus, upsertClientPortalAccess } from '@/lib/portal-access';

const portalAccessSchema = z.object({
    clientId: z.string().uuid(),
    contactEmail: z.string().email('Adresse courriel invalide'),
    portalRole: z.enum(['owner', 'viewer']).default('viewer'),
    memberType: z.enum(['client_contact', 'client_staff', 'internal_staff']).default('client_contact'),
});

const portalStatusSchema = z.object({
    clientId: z.string().uuid(),
    accessId: z.string().uuid(),
    status: z.enum(['active', 'revoked']),
});

export async function upsertClientPortalAccessAction(input) {
    const admin = await requireAdminAccess();
    if (!admin) {
        return { error: 'Acces refuse.' };
    }

    const parsed = portalAccessSchema.safeParse(input);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message || 'Donnees invalides.' };
    }

    try {
        const record = await upsertClientPortalAccess({
            clientId: parsed.data.clientId,
            contactEmail: parsed.data.contactEmail,
            portalRole: parsed.data.portalRole,
            memberType: parsed.data.memberType,
            status: 'active',
        });

        revalidatePath(`/admin/clients/${parsed.data.clientId}`);
        return { success: true, record };
    } catch (error) {
        console.error('[PortalAccessAction] upsert:', error);
        return { error: error.message || 'Impossible de sauvegarder cet acces.' };
    }
}

export async function setClientPortalAccessStatusAction(input) {
    const admin = await requireAdminAccess();
    if (!admin) {
        return { error: 'Acces refuse.' };
    }

    const parsed = portalStatusSchema.safeParse(input);
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message || 'Donnees invalides.' };
    }

    try {
        const record = await setClientPortalAccessStatus(parsed.data.accessId, parsed.data.status);
        revalidatePath(`/admin/clients/${parsed.data.clientId}`);
        return { success: true, record };
    } catch (error) {
        console.error('[PortalAccessAction] status:', error);
        return { error: error.message || 'Impossible de mettre a jour cet acces.' };
    }
}
