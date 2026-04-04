import 'server-only';

import { Resend } from 'resend';

/**
 * Sends a portal invitation email to the client contact.
 * Non-blocking — caller should `.catch()` to avoid breaking the upsert flow.
 */
export async function sendPortalInvitationEmail({ contactEmail, clientName }) {
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || 'Trouvable <contact@trouvable.app>';

    if (!resendApiKey) {
        console.warn('[PortalEmail] RESEND_API_KEY non configurée — invitation non envoyée.');
        return { sent: false, reason: 'no_api_key' };
    }

    if (!contactEmail) {
        return { sent: false, reason: 'no_email' };
    }

    const resend = new Resend(resendApiKey);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trouvable.app';
    const portalUrl = `${appUrl}/espace`;
    const displayName = clientName || 'votre dossier';

    const { error } = await resend.emails.send({
        from: fromEmail,
        to: [contactEmail],
        subject: `Votre compte Trouvable est créé — ${displayName}`,
        html: `
            <!DOCTYPE html>
            <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                    <div style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Trouvable</h1>
                        <p style="color: #a1a1aa; margin: 10px 0 0 0; font-size: 16px;">Votre compte est créé</p>
                    </div>
                    <div style="padding: 40px 30px;">
                        <p style="color: #27272a; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                            Bonjour,
                        </p>
                        <p style="color: #3f3f46; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                            Votre compte Trouvable pour <strong>${escapeHtml(displayName)}</strong> est créé. Vous pouvez maintenant accéder à votre tableau de bord client.
                        </p>
                        <p style="color: #3f3f46; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                            Connectez-vous avec l'adresse <strong>${escapeHtml(contactEmail)}</strong> sur l'espace client.
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${escapeHtml(portalUrl)}" style="display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #db2777 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; letter-spacing: 0.2px;">
                                Accéder à mon tableau de bord
                            </a>
                        </div>
                    </div>
                    <div style="background-color: #f4f4f5; padding: 20px 30px; text-align: center;">
                        <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                            Trouvable — Créateurs de visibilité · <a href="https://trouvable.app" style="color: #71717a;">trouvable.app</a>
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `,
    });

    if (error) {
        console.error('[PortalEmail] Erreur envoi invitation:', error);
        return { sent: false, reason: 'send_error', detail: error.message };
    }

    return { sent: true };
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
