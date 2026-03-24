import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/auth';
import { compareModels } from '@/lib/llm-comparison/compare-models';
import { LlmComparisonError, SOURCE_TYPES } from '@/lib/llm-comparison/response-contract';

const payloadSchema = z.object({
    source_type: z.enum([SOURCE_TYPES.URL, SOURCE_TYPES.TEXT]).optional(),
    url: z.string().url().optional(),
    text: z.string().min(1).optional(),
    prompt: z.string().min(1).max(20_000),
    provider_timeout_ms: z.number().int().positive().max(120_000).optional(),
    max_content_chars: z.number().int().positive().max(120_000).optional(),
}).superRefine((value, ctx) => {
    if (!value.url && !value.text) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['url'],
            message: 'Fournir au moins `url` ou `text`.',
        });
    }
});

function statusFromError(error) {
    const errClass = error?.errorClass || 'runtime_error';
    if (errClass === 'input_error') return 400;
    if (errClass === 'provider_auth_error') return 503;
    if (errClass === 'timeout') return 504;
    return 500;
}

export async function POST(request) {
    const admin = await requireAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    let payload;
    try {
        payload = await request.json();
    } catch {
        return NextResponse.json({ error: 'Payload JSON invalide' }, { status: 400 });
    }

    const parsed = payloadSchema.safeParse(payload);
    if (!parsed.success) {
        return NextResponse.json({ error: 'Payload invalide', details: parsed.error.issues }, { status: 400 });
    }

    try {
        const result = await compareModels({
            sourceType: parsed.data.source_type || null,
            url: parsed.data.url || null,
            text: parsed.data.text || null,
            prompt: parsed.data.prompt,
            providerTimeoutMs: parsed.data.provider_timeout_ms,
            maxContentChars: parsed.data.max_content_chars,
        });
        return NextResponse.json(result);
    } catch (error) {
        console.error('[api/admin/llm-compare]', error);
        if (error instanceof LlmComparisonError) {
            return NextResponse.json({
                error: {
                    class: error.errorClass,
                    message: error.message,
                },
            }, { status: statusFromError(error) });
        }
        return NextResponse.json({
            error: {
                class: 'runtime_error',
                message: error?.message || 'Execution compare impossible',
            },
        }, { status: 500 });
    }
}
