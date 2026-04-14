import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { auth } from '@clerk/nextjs/server';
import { updateConnectorState, getClientConnectorRows } from '@/lib/connectors/repository';

export async function GET(request) {
    const { userId } = await auth();
    // Support non-admin portal flow if userId is not present but state is valid.
    /*
    if (!userId) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/admin/login`);
    }
    */

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const statePayload = searchParams.get('state');
    const errorParam = searchParams.get('error');

    const appUrl = process.env.NODE_ENV === 'production' ? 'https://trouvable.app' : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

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
        const existingConfig = gscConnector.config || {};

        const newConfig = {
            ...existingConfig,
            google_access_token: tokens.access_token,
            google_email: googleEmail,
        };

        if (tokens.refresh_token) {
            newConfig.google_refresh_token = tokens.refresh_token;
        }

        await updateConnectorState({
            clientId,
            provider: 'gsc',
            status: 'configured',
            config: newConfig,
            lastError: null,
        });

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
