import { getRequestOrigin } from '@/lib/agent-discovery/config';

function createAuthorizationMetadata(origin) {
    return {
        issuer: origin,
        authorization_endpoint: `${origin}/api/oauth/authorize`,
        token_endpoint: `${origin}/api/oauth/token`,
        jwks_uri: `${origin}/.well-known/jwks.json`,
        response_types_supported: ['code'],
        grant_types_supported: ['authorization_code', 'client_credentials', 'refresh_token'],
        token_endpoint_auth_methods_supported: ['client_secret_post'],
        scopes_supported: ['read:public', 'write:lead'],
        code_challenge_methods_supported: ['S256'],
        service_documentation: `${origin}/docs/api`,
    };
}

export function GET(request) {
    const origin = getRequestOrigin(request);
    return Response.json(createAuthorizationMetadata(origin), {
        headers: {
            'Cache-Control': 'public, max-age=3600',
        },
    });
}
