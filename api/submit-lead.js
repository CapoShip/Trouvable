import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Vercel Serverless Function Config
export const config = {
    runtime: 'edge', // Using Edge runtime for ultra-fast global performance
};

export default async function handler(req) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const body = await req.json();
        const { name, email, phone, businessType, message, honeypot, turnstileToken } = body;

        // 1. Honeypot Validation (Spam Trap)
        if (honeypot && honeypot.length > 0) {
            // Silently drop bots that filled the invisible field
            return new Response(JSON.stringify({ success: true, warning: 'Bot caught' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2. Cloudflare Turnstile Validation
        if (!turnstileToken) {
            return new Response(JSON.stringify({ error: 'Token Turnstile manquant' }), { status: 400 });
        }

        const turnstileForm = new FormData();
        turnstileForm.append('secret', process.env.VITE_TURNSTILE_SECRET_KEY);
        turnstileForm.append('response', turnstileToken);

        const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: turnstileForm,
        });
        const turnstileOutcome = await turnstileRes.json();

        if (!turnstileOutcome.success) {
            return new Response(JSON.stringify({ error: 'Échec de la vérification robot' }), { status: 403 });
        }

        // 3. Supabase Database Insertion
        const supabase = createClient(
            process.env.VITE_SUPABASE_URL,
            process.env.VITE_SUPABASE_ANON_KEY
        );

        const { error: dbError } = await supabase
            .from('leads')
            .insert([
                {
                    name: name,
                    email: email,
                    phone: phone || null,
                    business_type: businessType || null,
                    message: message,
                    status: 'new'
                }
            ]);

        if (dbError) {
            console.error('Supabase Error:', dbError);
            return new Response(JSON.stringify({ error: 'Erreur de base de données', details: dbError }), { status: 500 });
        }

        // 4. Resend Email Notifications
        const resend = new Resend(process.env.RESEND_API_KEY);

        // A. Send confirmation to the client
        const { error: clientEmailError } = await resend.emails.send({
            from: 'Trouvable <onboarding@resend.dev>', // Must be a verified domain in Resend later
            to: [email], // NOTE: Resend Sandbox ONLY allows sending back to your own registered email!
            subject: 'Nous avons bien reçu votre demande - Trouvable',
            html: `
                <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
                    <h2>Bonjour ${name},</h2>
                    <p>Nous avons bien reçu votre message. Notre équipe va l'étudier avec attention et nous vous répondrons dans les 24h.</p>
                    <p><strong>Votre message :</strong><br/>"${message}"</p>
                </div>
            `
        });

        if (clientEmailError) {
            console.error('Resend Client Error:', clientEmailError);
        }

        // B. Send notification to the Admin
        // IMPORTANT: Change 'to' to your actual real email address you used to register on Resend
        const { error: adminEmailError } = await resend.emails.send({
            from: 'Trouvable <onboarding@resend.dev>',
            to: ['shippingdrop76@gmail.com'], // <--- CHANGE THIS TO YOUR PERSO EMAIL
            subject: `Nouveau Lead: ${name} (${businessType || 'Non précisé'})`,
            html: `
                <h3>Nouveau lead via le site web</h3>
                <ul>
                    <li><strong>Nom:</strong> ${name}</li>
                    <li><strong>Email:</strong> ${email}</li>
                    <li><strong>Téléphone:</strong> ${phone || 'Non fourni'}</li>
                    <li><strong>Type:</strong> ${businessType || 'Non précisé'}</li>
                </ul>
                <p><strong>Message:</strong><br/>${message}</p>
            `
        });

        if (adminEmailError) {
            console.error('Resend Admin Error:', adminEmailError);
        }

        // 5. Success
        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Function Error:', err);
        return new Response(JSON.stringify({ error: err.message || 'Erreur interne du serveur', fullError: err }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
