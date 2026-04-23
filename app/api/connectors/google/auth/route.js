import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET(request) {
    // Allow clients to initiate OAuth from the private email link without being logged into Clerk yet.
    // The clientId is a UUID and acts as an obscure token in this context.
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const returnTo = searchParams.get('returnTo') || `/admin/clients/${clientId}`;
    
    if (!clientId) {
        return NextResponse.json({ error: 'Missing clientId' }, { status: 400 });
    }

    // We dynamically use the request origin to avoid redirect_uri mismatches (www vs non-www, Vercel previews, etc.)
    const appUrl = new URL(request.url).origin;
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_OAUTH_CLIENT_ID,
        process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        `${appUrl}/api/connectors/google/callback`
    );

    const scopes = [
        'https://www.googleapis.com/auth/webmasters.readonly',
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/userinfo.email'
    ];

    const statePayload = Buffer.from(JSON.stringify({ clientId, returnTo })).toString('base64');

    const authorizationUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: scopes,
        state: statePayload,
    });

    return NextResponse.redirect(authorizationUrl);
}
