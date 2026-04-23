import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { updateConnectorState, getClientConnectorRows } from '@/lib/connectors/repository';

export async function GET(request) {
    // Support non-admin portal flow when callback state is valid.

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const statePayload = searchParams.get('state');
    const errorParam = searchParams.get('error');

    // We dynamically use the request origin to avoid redirect_uri mismatches (www vs non-www, Vercel previews, etc.)
    const appUrl = new URL(request.url).origin;

    let clientId, returnTo;
    try {
        const decoded = JSON.parse(Buffer.from(statePayload, 'base64').toString('ascii'));
        clientId = decoded.clientId;
        returnTo = decoded.returnTo || `/admin/clients/${clientId}`;
    } catch {
        clientId = statePayload;
        returnTo = `/admin/clients/${clientId}`;
    }

    if (errorParam) {
        const errUrl = new URL(returnTo, appUrl);
        errUrl.searchParams.set('error', 'GoogleAuthFailed');
        return NextResponse.redirect(errUrl.toString());
    }

    if (!code || !clientId) {
        return NextResponse.json({ error: 'Invalid callback parameters' }, { status: 400 });
    }

    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_OAUTH_CLIENT_ID,
            process.env.GOOGLE_OAUTH_CLIENT_SECRET,
            `${appUrl}/api/connectors/google/callback`
        );

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const googleEmail = userInfo.data.email;

        const existingConnectors = await getClientConnectorRows(clientId);
        const gscConnector = existingConnectors.find(c => c.provider === 'gsc') || {};
        const ga4Connector = existingConnectors.find(c => c.provider === 'ga4') || {};

        const gscConfig = {
            ...(gscConnector.config || {}),
            google_access_token: tokens.access_token,
            google_email: googleEmail,
        };

        const ga4Config = {
            ...(ga4Connector.config || {}),
            google_access_token: tokens.access_token,
            google_email: googleEmail,
        };

        if (tokens.refresh_token) {
            gscConfig.google_refresh_token = tokens.refresh_token;
            ga4Config.google_refresh_token = tokens.refresh_token;
        }

        if (!ga4Config.propertyId) {
            try {
                const analyticsadmin = google.analyticsadmin({ version: 'v1beta', auth: oauth2Client });
                const accountsResp = await analyticsadmin.accountSummaries.list();
                const summaries = accountsResp?.data?.accountSummaries || [];
                
                if (summaries.length > 0 && summaries[0].propertySummaries && summaries[0].propertySummaries.length > 0) {
                    const propertyName = summaries[0].propertySummaries[0].property;
                    if (propertyName) {
                        ga4Config.propertyId = propertyName.replace('properties/', '');
                    }
                }
            } catch (err) {
                console.error('[Google OAuth] Failed to auto-fetch GA4 property:', err);
            }
        }

        await Promise.all([
            updateConnectorState({
                clientId,
                provider: 'gsc',
                status: 'configured',
                config: gscConfig,
                lastError: null,
            }),
            updateConnectorState({
                clientId,
                provider: 'ga4',
                status: 'configured',
                config: ga4Config,
                lastError: null,
            })
        ]);

        const succUrl = new URL(returnTo, appUrl);
        succUrl.searchParams.set('success', 'GoogleConnected');
        return NextResponse.redirect(succUrl.toString());
    } catch (error) {
        console.error('[Google OAuth] Callback Error:', error);
        const errUrl = new URL(returnTo, appUrl);
        errUrl.searchParams.set('error', 'GoogleAuthCallbackFailed');
        return NextResponse.redirect(errUrl.toString());
    }
}
