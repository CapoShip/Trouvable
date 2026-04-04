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

    const logoUrl = `${appUrl}/logos/trouvable_logo_blanc1.png`;

    const { error } = await resend.emails.send({
        from: fromEmail,
        to: [contactEmail],
        subject: `Votre compte Trouvable est créé — ${displayName}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; margin: 0; padding: 0;">
                <div style="max-width: 600px; margin: 0 auto; padding: 40px 16px;">

                    <!-- Header with logo -->
                    <div style="text-align: center; padding: 48px 30px 40px 30px; background: linear-gradient(160deg, #18181b 0%, #1c1917 50%, #18181b 100%); border-radius: 20px 20px 0 0; border-bottom: 1px solid #27272a;">
                        <img src="${escapeHtml(logoUrl)}" alt="Trouvable" width="56" height="56" style="display: inline-block; width: 56px; height: 56px; object-fit: contain; margin-bottom: 16px;" />
                        <h1 style="color: #ffffff; margin: 0 0 6px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">Trouvable</h1>
                        <p style="color: #a1a1aa; margin: 0; font-size: 14px; letter-spacing: 1.5px; text-transform: uppercase;">Créateurs de visibilité</p>
                    </div>

                    <!-- Main content -->
                    <div style="background-color: #ffffff; padding: 44px 36px 40px 36px;">
                        <p style="color: #18181b; font-size: 20px; font-weight: 700; line-height: 1.4; margin: 0 0 8px 0;">
                            Bienvenue sur Trouvable
                        </p>
                        <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 0 0 28px 0;">
                            Votre espace client est prêt.
                        </p>

                        <p style="color: #3f3f46; font-size: 15px; line-height: 1.7; margin: 0 0 24px 0;">
                            Votre compte pour <strong style="color: #18181b;">${escapeHtml(displayName)}</strong> a été créé avec succès. Vous pouvez dès maintenant accéder à votre tableau de bord et suivre votre visibilité.
                        </p>

                        <!-- Credentials card -->
                        <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 20px 24px; margin: 0 0 32px 0;">
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 6px 0; color: #71717a; font-size: 13px; width: 100px;">Adresse</td>
                                    <td style="padding: 6px 0; color: #18181b; font-size: 14px; font-weight: 600;">${escapeHtml(contactEmail)}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; color: #71717a; font-size: 13px;">Connexion</td>
                                    <td style="padding: 6px 0; color: #18181b; font-size: 14px; font-weight: 600;">Code par courriel</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; color: #71717a; font-size: 13px;">Espace</td>
                                    <td style="padding: 6px 0;"><a href="${escapeHtml(portalUrl)}" style="color: #ea580c; font-size: 14px; font-weight: 600; text-decoration: none;">${escapeHtml(portalUrl)}</a></td>
                                </tr>
                            </table>
                        </div>

                        <!-- CTA button -->
                        <div style="text-align: center; margin: 0 0 32px 0;">
                            <a href="${escapeHtml(portalUrl)}" style="display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 15px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 4px 14px rgba(234,88,12,0.3);">
                                Accéder à mon tableau de bord →
                            </a>
                        </div>

                        <!-- Help note -->
                        <p style="color: #a1a1aa; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                            Aucun mot de passe requis — un code de vérification sera envoyé à votre adresse courriel lors de la connexion.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #18181b; padding: 28px 30px; text-align: center; border-radius: 0 0 20px 20px;">
                        <p style="color: #52525b; font-size: 12px; margin: 0 0 4px 0;">
                            © ${new Date().getFullYear()} Trouvable · <a href="https://trouvable.app" style="color: #71717a; text-decoration: none;">trouvable.app</a>
                        </p>
                        <p style="color: #3f3f46; font-size: 11px; margin: 0;">
                            Cet email a été envoyé automatiquement suite à la création de votre compte.
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
