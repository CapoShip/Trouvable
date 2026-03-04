import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Vercel Serverless Function Config
export const config = {
    runtime: 'edge',
};

// In-memory rate limiting (IP-hash -> { count, windowStart })
const rateLimitCache = new Map();
const RATE_LIMIT_POINTS = 5; // max 5 requests
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour window

function getClientIp(req) {
    return req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'unknown';
}

function hashIp(ip) {
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
        const char = ip.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

function isRateLimited(ip) {
    const hashedIp = hashIp(ip);
    const now = Date.now();
    const record = rateLimitCache.get(hashedIp);

    if (!record) {
        rateLimitCache.set(hashedIp, { count: 1, windowStart: now });
        return false;
    }

    if (now - record.windowStart > RATE_LIMIT_WINDOW) {
        rateLimitCache.set(hashedIp, { count: 1, windowStart: now });
        return false;
    }

    if (record.count >= RATE_LIMIT_POINTS) {
        return true;
    }

    record.count += 1;
    return false;
}

export default async function handler(req) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const clientIp = getClientIp(req);
        if (isRateLimited(clientIp)) {
            return new Response(JSON.stringify({ error: 'Trop de requêtes, veuillez réessayer plus tard.' }), {
                status: 429,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const body = await req.json();

        // Anti-spam: check if honeypot was filled
        if (body.honeypot && body.honeypot.trim().length > 0) {
            // Silently drop bots that filled the invisible field
            return new Response(JSON.stringify({ success: true, warning: 'Bot caught' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Extract and Validate
        const rawName = body.name || '';
        const rawEmail = body.email || '';
        const rawMessage = body.message || '';
        const turnstileToken = body.turnstileToken;

        const name = rawName.trim().substring(0, 100);
        const email = rawEmail.trim().substring(0, 100);
        const phone = (body.phone || '').trim().substring(0, 50);
        const businessType = (body.businessType || '').trim().substring(0, 50);
        const message = rawMessage.trim().substring(0, 2000);
        const pagePath = (body.page_path || '').trim().substring(0, 200);
        const utmSource = (body.utm_source || '').trim().substring(0, 100);
        const utmMedium = (body.utm_medium || '').trim().substring(0, 100);
        const utmCampaign = (body.utm_campaign || '').trim().substring(0, 100);

        if (!name || !email || !message) {
            return new Response(JSON.stringify({ error: 'Champs obligatoires manquants.' }), { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new Response(JSON.stringify({ error: 'Format d\'email invalide.' }), { status: 400 });
        }

        if (!turnstileToken) {
            return new Response(JSON.stringify({ error: 'Token Turnstile manquant' }), { status: 400 });
        }

        // Cloudflare Turnstile Verification
        const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
        if (!turnstileSecret) {
            console.error('Missing TURNSTILE_SECRET_KEY in server environment.');
            return new Response(JSON.stringify({ error: 'Erreur interne du serveur.' }), { status: 500 });
        }

        const turnstileForm = new FormData();
        turnstileForm.append('secret', turnstileSecret);
        turnstileForm.append('response', turnstileToken);

        const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: turnstileForm,
        });
        const turnstileOutcome = await turnstileRes.json();

        if (!turnstileOutcome.success) {
            return new Response(JSON.stringify({ error: 'Échec de la vérification anti-robot' }), { status: 403 });
        }

        // Supabase Insertion (Using Server Service Role Key)
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
            return new Response(JSON.stringify({ error: 'Erreur interne du serveur.' }), { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { error: dbError } = await supabase
            .from('leads')
            .insert([{
                name: name,
                email: email,
                phone: phone || null,
                business_type: businessType || null,
                message: message,
                status: 'new',
                page_path: pagePath || null,
                utm_source: utmSource || null,
                utm_medium: utmMedium || null,
                utm_campaign: utmCampaign || null
            }]);

        if (dbError) {
            console.error('Supabase Error:', dbError);
            return new Response(JSON.stringify({ error: 'Erreur lors de la sauvegarde du lead.' }), { status: 500 });
        }

        // Resend Email Notifications
        const resendApiKey = process.env.RESEND_API_KEY;
        const adminEmail = process.env.ADMIN_EMAIL;
        const fromEmail = process.env.FROM_EMAIL || 'Trouvable <onboarding@resend.dev>';

        if (resendApiKey && adminEmail) {
            const resend = new Resend(resendApiKey);

            // Notify Client
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

            if (clientEmailError) console.error('Resend Client Error:', clientEmailError);

            // Notify Admin
            const { error: adminEmailError } = await resend.emails.send({
                from: fromEmail,
                to: [adminEmail],
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

            if (adminEmailError) console.error('Resend Admin Error:', adminEmailError);
        }

        // Success
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Unexpected Function Error:', err);
        return new Response(JSON.stringify({ error: 'Erreur interne du serveur. Veuillez réessayer plus tard.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
