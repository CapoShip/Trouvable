import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return unsafe;
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

const leadSchema = z.object({
    name: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caractères').max(80, 'Le nom est trop long (max 80 caractères)'),
    email: z.string().trim().email("Format d'email invalide").max(254, 'Le courriel est trop long'),
    message: z.string().trim().min(10, 'Le message doit contenir au moins 10 caractères').max(2000, 'Le message est trop long (max 2000 caractères)'),
    phone: z.string().trim().max(30, 'Le téléphone est trop long').optional().nullable(),
    businessType: z.string().trim().max(80, 'Le type de commerce est trop long').optional().nullable(),
    turnstileToken: z.string({ required_error: 'Vérification anti-robot manquante' }).min(1, 'Vérification anti-robot manquante'),
    page_path: z.string().trim().optional().nullable(),
    utm_source: z.string().trim().optional().nullable(),
    utm_medium: z.string().trim().optional().nullable(),
    utm_campaign: z.string().trim().optional().nullable()
});

// Les variables de rate limit sont gérées dans la BDD Supabase via RPC (check_rate_limit)
const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MINUTES = 10;

function getClientIp(req) {
    const forwardedFor = req.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    return req.headers.get('x-real-ip') || 'unknown';
}

export async function POST(req) {
    try {
        const clientIp = getClientIp(req);

        // Initialiser Supabase tôt pour le Rate Limiting
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('[SubmitLead API] Missing Supabase keys in environment');
            return NextResponse.json({ ok: false, error: 'Erreur interne du serveur. Veuillez réessayer plus tard.' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Rate Limiting Atomique via Supabase
        const { data: isBlocked, error: rateError } = await supabase.rpc('check_rate_limit', {
            client_ip: clientIp,
            max_requests: RATE_LIMIT_MAX_REQUESTS,
            window_minutes: RATE_LIMIT_WINDOW_MINUTES
        });

        if (rateError) {
            console.error('[SubmitLead API] Rate Limit DB Error:', rateError);
            // On laisse passer en cas d'erreur DB (mieux vaut un spam qu'une perte de lead légitime)
        } else if (isBlocked) {
            console.warn(`[SubmitLead API] IP bloquée par le Rate Limit: ${clientIp}`);
            return NextResponse.json({ ok: false, error: 'Trop de requêtes, veuillez réessayer dans quelques minutes.' }, { status: 429 });
        }

        const body = await req.json();

        // 2. Honeypot check: Silently succeed (no email, no DB)
        if (body.honeypot && body.honeypot.trim().length > 0) {
            return NextResponse.json({ ok: true }, { status: 200 });
        }

        // 2. Schema Validation with Zod
        const parsed = leadSchema.safeParse(body);
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]?.message || 'Validation invalide.';
            return NextResponse.json({ ok: false, error: firstError }, { status: 400 });
        }

        const {
            name,
            email,
            message,
            phone,
            businessType,
            turnstileToken,
            page_path: pagePath,
            utm_source: utmSource,
            utm_medium: utmMedium,
            utm_campaign: utmCampaign
        } = parsed.data;

        // 5. Turnstile Verification
        const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
        if (!turnstileSecret) {
            console.error('[SubmitLead API] Missing TURNSTILE_SECRET_KEY in environment');
            return NextResponse.json({ ok: false, error: 'Erreur interne du serveur.' }, { status: 500 });
        }

        const turnstileForm = new URLSearchParams();
        turnstileForm.append('secret', turnstileSecret);
        turnstileForm.append('response', turnstileToken);

        const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: turnstileForm,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const turnstileOutcome = await turnstileRes.json();
        if (!turnstileOutcome.success) {
            return NextResponse.json({ ok: false, error: 'Échec de la vérification anti-robot.' }, { status: 403 });
        }

        // 7. Supabase DB Insertion (MAIN ACTION)
        const { error: dbError } = await supabase.from('leads').insert([{
            name,
            email,
            phone: phone || null,
            business_type: businessType || null,
            message,
            status: 'new',
            page_path: pagePath,
            utm_source: utmSource,
            utm_medium: utmMedium,
            utm_campaign: utmCampaign
        }]);

        if (dbError) {
            console.error('[SubmitLead API] Supabase Insertion Error:', dbError);
            return NextResponse.json({ ok: false, error: 'Impossible d\'enregistrer votre demande. Veuillez réessayer plus tard.' }, { status: 500 });
        }

        // 8. Resend Email Notifications (Separate try/catch)
        // We do not fail the request if emails fail, to prevent user from resubmitting and creating duplicates.
        try {
            const resendApiKey = process.env.RESEND_API_KEY;
            const adminEmail = process.env.ADMIN_EMAIL;
            const fromEmail = process.env.FROM_EMAIL || 'Trouvable <onboarding@resend.dev>';

            if (resendApiKey && adminEmail) {
                const resend = new Resend(resendApiKey);

                // Admin Email First
                const { error: adminEmailError } = await resend.emails.send({
                    from: fromEmail,
                    to: [adminEmail],
                    replyTo: email,
                    subject: `Nouveau Lead : ${name} (${businessType || 'Non précisé'})`,
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
                            <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e4e4e7;">
                                <div style="background-color: #18181b; padding: 24px; border-bottom: 4px solid #ea580c;">
                                    <h2 style="color: #ffffff; margin: 0; font-size: 20px;">⚡ Nouveau Lead Entrant</h2>
                                </div>
                                <div style="padding: 30px;">
                                    <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 30px;">
                                        <div style="flex: 1; min-width: 250px; background-color: #f4f4f5; padding: 15px; border-radius: 8px;">
                                            <p style="margin: 0 0 5px 0; color: #71717a; font-size: 12px; text-transform: uppercase; font-weight: bold;">Contact</p>
                                            <p style="margin: 0 0 8px 0; color: #18181b; font-size: 15px;"><strong>Nom :</strong> ${escapeHtml(name)}</p>
                                            <p style="margin: 0 0 8px 0; color: #18181b; font-size: 15px;"><strong>Email :</strong> <a href="mailto:${encodeURIComponent(email)}" style="color: #ea580c;">${escapeHtml(email)}</a></p>
                                            <p style="margin: 0; color: #18181b; font-size: 15px;"><strong>Tél :</strong> ${escapeHtml(String(phone || '')) || 'Non fourni'}</p>
                                        </div>
                                        <div style="flex: 1; min-width: 250px; background-color: #f4f4f5; padding: 15px; border-radius: 8px;">
                                            <p style="margin: 0 0 5px 0; color: #71717a; font-size: 12px; text-transform: uppercase; font-weight: bold;">Projet & Tracking</p>
                                            <p style="margin: 0 0 8px 0; color: #18181b; font-size: 15px;"><strong>Type :</strong> ${escapeHtml(String(businessType || '')) || 'Non précisé'}</p>
                                            <p style="margin: 0 0 8px 0; color: #18181b; font-size: 15px;"><strong>Page :</strong> <code style="background:#e4e4e7; padding:2px 6px; border-radius:4px; font-size:13px;">${escapeHtml(String(pagePath || '')) || 'N/A'}</code></p>
                                            <p style="margin: 0; color: #18181b; font-size: 15px;"><strong>UTM Src :</strong> <code style="background:#e4e4e7; padding:2px 6px; border-radius:4px; font-size:13px;">${escapeHtml(String(utmSource || '')) || 'N/A'}</code></p>
                                        </div>
                                    </div>
                                    <h3 style="color: #27272a; margin-top: 0; font-size: 16px; border-bottom: 1px solid #e4e4e7; padding-bottom: 10px;">Message du prospect</h3>
                                    <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; color: #3f3f46; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</div>
                                </div>
                            </div>
                        </body>
                        </html>
                    `
                });

                if (adminEmailError) {
                    console.error('[SubmitLead API] Resend Admin Email Error:', adminEmailError);
                }

                // Client Email
                const { error: clientEmailError } = await resend.emails.send({
                    from: fromEmail,
                    to: [email],
                    subject: 'Nous avons bien reçu votre demande - Trouvable',
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 0;">
                            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                                <div style="background: linear-gradient(135deg, #ea580c 0%, #db2777 100%); padding: 40px 30px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Trouvable</h1>
                                    <p style="color: #ffedd5; margin: 10px 0 0 0; font-size: 16px;">Créateurs de visibilité</p>
                                </div>
                                <div style="padding: 40px 30px;">
                                    <h2 style="color: #0f172a; margin-top: 0; font-size: 22px;">Bonjour ${escapeHtml(name)},</h2>
                                    <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                                        Nous avons bien reçu votre demande et nous vous en remercions. Notre équipe va analyser votre besoin avec attention et reviendra vers vous dans les plus brefs délais.
                                    </p>
                                    <div style="background-color: #f1f5f9; padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #ea580c;">
                                        <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Rappel de votre message</p>
                                        <p style="color: #334155; font-size: 15px; line-height: 1.5; margin: 0; font-style: italic;">"${escapeHtml(message)}"</p>
                                    </div>
                                    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 0;">
                                        À très bientôt,<br>
                                        <strong>L'équipe Trouvable</strong>
                                    </p>
                                </div>
                                <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                    <p style="color: #94a3b8; font-size: 13px; margin: 0;">
                                        Trouvable - Propulsez votre entreprise au premier plan.
                                    </p>
                                </div>
                            </div>
                        </body>
                        </html>
                    `
                });

                if (clientEmailError) {
                    console.error('[SubmitLead API] Resend Client Email Error:', clientEmailError);
                }
            } else {
                console.warn('[SubmitLead API] Resend API Key or Admin Email not configured, skipping emails.');
            }
        } catch (resendException) {
            console.error('[SubmitLead API] Unhandled Resend exception:', resendException);
        }

        // Always return success if DB insert succeeded, regardless of email status
        return NextResponse.json({ ok: true }, { status: 200 });

    } catch (err) {
        console.error('[SubmitLead API] Global API Exception:', err);
        return NextResponse.json({ ok: false, error: 'Erreur inattendue du serveur.' }, { status: 500 });
    }
}
