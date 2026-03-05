import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// In-memory rate limiting cache
const rateLimitCache = new Map();
const RATE_LIMIT_POINTS = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function getClientIp(req) {
    return req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'unknown';
}

function hashIp(ip) {
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
        hash = Math.imul(31, hash) + ip.charCodeAt(i) | 0;
    }
    return hash.toString();
}

function isRateLimited(ip) {
    const hashedIp = hashIp(ip);
    const now = Date.now();
    const record = rateLimitCache.get(hashedIp);

    if (!record || now - record.windowStart > RATE_LIMIT_WINDOW) {
        rateLimitCache.set(hashedIp, { count: 1, windowStart: now });
        return false;
    }
    if (record.count >= RATE_LIMIT_POINTS) {
        return true;
    }
    record.count += 1;
    return false;
}

export async function POST(req) {
    try {
        const clientIp = getClientIp(req);
        if (isRateLimited(clientIp)) {
            return NextResponse.json({ ok: false, error: 'Trop de requêtes, veuillez réessayer plus tard.' }, { status: 429 });
        }

        const body = await req.json();

        // 1. Honeypot check: Silently succeed
        if (body.honeypot && body.honeypot.trim().length > 0) {
            return NextResponse.json({ ok: true }, { status: 200 });
        }

        // 2. Strict trimming & empty checks
        const name = (body.name || '').trim();
        const email = (body.email || '').trim();
        const message = (body.message || '').trim();
        const phone = (body.phone || '').trim();
        const businessType = (body.businessType || '').trim();
        const turnstileToken = body.turnstileToken;

        const pagePath = (body.page_path || '').trim() || null;
        const utmSource = (body.utm_source || '').trim() || null;
        const utmMedium = (body.utm_medium || '').trim() || null;
        const utmCampaign = (body.utm_campaign || '').trim() || null;

        if (!name || !email || !message) {
            return NextResponse.json({ ok: false, error: 'Champs obligatoires manquants.' }, { status: 400 });
        }

        // 3. Length checks (Reject 400 instead of truncating)
        if (name.length > 80) return NextResponse.json({ ok: false, error: 'Le nom est trop long (max 80 caractères).' }, { status: 400 });
        if (email.length > 254) return NextResponse.json({ ok: false, error: 'Le courriel est trop long (max 254 caractères).' }, { status: 400 });
        if (phone.length > 30) return NextResponse.json({ ok: false, error: 'Le téléphone est trop long (max 30 caractères).' }, { status: 400 });
        if (businessType.length > 80) return NextResponse.json({ ok: false, error: 'Le type de commerce est trop long (max 80 caractères).' }, { status: 400 });
        if (message.length > 2000) return NextResponse.json({ ok: false, error: 'Le message est trop long (max 2000 caractères).' }, { status: 400 });

        // 4. Format checks
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ ok: false, error: "Format d'email invalide." }, { status: 400 });
        }

        if (!turnstileToken) {
            return NextResponse.json({ ok: false, error: 'Vérification anti-robot manquante.' }, { status: 400 });
        }

        // 5. Turnstile Verification
        const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
        if (!turnstileSecret) {
            return NextResponse.json({ ok: false, error: 'Erreur interne de configuration.' }, { status: 500 });
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

        // 6. Supabase DB Insertion
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return NextResponse.json({ ok: false, error: 'Erreur interne de configuration.' }, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
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
            // Do not leak internal dbError info
            return NextResponse.json({ ok: false, error: 'Erreur lors de la sauvegarde.' }, { status: 500 });
        }

        // 7. Resend Email Notifications
        const resendApiKey = process.env.RESEND_API_KEY;
        const adminEmail = process.env.ADMIN_EMAIL;
        const fromEmail = process.env.FROM_EMAIL || 'Trouvable <onboarding@resend.dev>';

        if (resendApiKey && adminEmail) {
            const resend = new Resend(resendApiKey);

            // Client Email
            await resend.emails.send({
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
                                <h2 style="color: #0f172a; margin-top: 0; font-size: 22px;">Bonjour ${name},</h2>
                                <p style="color: #475569; font-size: 16px; line-height: 1.6;">
                                    Nous avons bien reçu votre demande et nous vous en remercions. Notre équipe va analyser votre besoin avec attention et reviendra vers vous dans les plus brefs délais.
                                </p>
                                <div style="background-color: #f1f5f9; padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #ea580c;">
                                    <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Rappel de votre message</p>
                                    <p style="color: #334155; font-size: 15px; line-height: 1.5; margin: 0; font-style: italic;">"${message}"</p>
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

            // Admin Email
            await resend.emails.send({
                from: fromEmail,
                to: [adminEmail],
                reply_to: email,
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
                                        <p style="margin: 0 0 8px 0; color: #18181b; font-size: 15px;"><strong>Nom :</strong> ${name}</p>
                                        <p style="margin: 0 0 8px 0; color: #18181b; font-size: 15px;"><strong>Email :</strong> <a href="mailto:${email}" style="color: #ea580c;">${email}</a></p>
                                        <p style="margin: 0; color: #18181b; font-size: 15px;"><strong>Tél :</strong> ${phone || 'Non fourni'}</p>
                                    </div>
                                    <div style="flex: 1; min-width: 250px; background-color: #f4f4f5; padding: 15px; border-radius: 8px;">
                                        <p style="margin: 0 0 5px 0; color: #71717a; font-size: 12px; text-transform: uppercase; font-weight: bold;">Projet & Tracking</p>
                                        <p style="margin: 0 0 8px 0; color: #18181b; font-size: 15px;"><strong>Type :</strong> ${businessType || 'Non précisé'}</p>
                                        <p style="margin: 0 0 8px 0; color: #18181b; font-size: 15px;"><strong>Page :</strong> <code style="background:#e4e4e7; padding:2px 6px; border-radius:4px; font-size:13px;">${pagePath || 'N/A'}</code></p>
                                        <p style="margin: 0; color: #18181b; font-size: 15px;"><strong>UTM Src :</strong> <code style="background:#e4e4e7; padding:2px 6px; border-radius:4px; font-size:13px;">${utmSource || 'N/A'}</code></p>
                                    </div>
                                </div>
                                <h3 style="color: #27272a; margin-top: 0; font-size: 16px; border-bottom: 1px solid #e4e4e7; padding-bottom: 10px;">Message du prospect</h3>
                                <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; color: #3f3f46; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            });
        }

        return NextResponse.json({ ok: true }, { status: 200 });

    } catch (err) {
        return NextResponse.json({ ok: false, error: 'Erreur inattendue du serveur.' }, { status: 500 });
    }
}
