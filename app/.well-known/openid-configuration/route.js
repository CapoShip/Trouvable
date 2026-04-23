import { getRequestOrigin } from '@/lib/agent-discovery/config';

function createOpenIdConfiguration(origin) {
    return {
        issuer: origin,
        authorization_endpoint: `${origin}/api/oauth/authorize`,
        token_endpoint: `${origin}/api/oauth/token`,
        jwks_uri: `${origin}/.well-known/jwks.json`,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'client_credentials', 'refresh_token'],
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        scopes_supported: ['openid', 'profile', 'read:public', 'write:lead'],
        token_endpoint_auth_methods_supported: ['client_secret_post'],
        code_challenge_methods_supported: ['S256'],
        claims_supported: ['iss', 'sub', 'aud', 'exp', 'iat', 'scope'],
    };
}

export function GET(request) {
    const origin = getRequestOrigin(request);
    return Response.json(createOpenIdConfiguration(origin), {
        headers: {
            'Cache-Control': 'public, max-age=3600',
        },
    });
}
