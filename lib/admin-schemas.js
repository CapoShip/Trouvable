import { z } from 'zod';

export const clientCreateSchema = z.object({
    client_name: z.string().min(1).max(200),
    client_slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/),
    website_url: z.string().url(),
    business_type: z.string().max(120).optional(),
    target_region: z.string().max(200).optional().nullable(),
    notes: z.string().max(5000).optional().nullable(),
});

export const clientUpdateSchema = z.object({
    id: z.string().uuid(),
    client_name: z.string().min(1).max(200).optional(),
    client_slug: z.string().min(1).max(120).regex(/^[a-z0-9-]+$/).optional(),
    website_url: z.string().url().optional(),
    business_type: z.string().max(120).optional().nullable(),
    target_region: z.string().max(200).optional().nullable(),
    notes: z.string().max(5000).optional().nullable(),
    seo_title: z.string().max(300).optional().nullable(),
    seo_description: z.string().max(2000).optional().nullable(),
});

export const clientIdSchema = z.object({
    clientId: z.string().uuid(),
});

export const trackedQueryCreateSchema = z.object({
    clientId: z.string().uuid(),
    query_text: z.string().min(1).max(2000),
    category: z.string().max(64).optional(),
    locale: z.string().max(20).optional(),
    query_type: z.string().max(64).optional(),
    is_active: z.boolean().optional(),
});

export const trackedQueryUpdateSchema = z.object({
    id: z.string().uuid(),
    query_text: z.string().min(1).max(2000).optional(),
    category: z.string().max(64).optional(),
    locale: z.string().max(20).optional(),
    query_type: z.string().max(64).optional(),
    is_active: z.boolean().optional(),
});

export const trackedQueryIdSchema = z.object({
    id: z.string().uuid(),
});

export const trackedQueryToggleSchema = z.object({
    id: z.string().uuid(),
    is_active: z.boolean(),
});
