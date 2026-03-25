import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isPortalRoute = createRouteMatcher(['/portal(.*)']);
const isEspaceRoute = createRouteMatcher(['/espace(.*)']);
const isPublicAdminAuthRoute = createRouteMatcher(['/admin/sign-in(.*)']);
const isPublicPortalAuthRoute = createRouteMatcher(['/portal/sign-in(.*)']);
/** Connexion publique sous /espace ; seul le routage post-login exige une session. */
const isEspacePostLogin = createRouteMatcher(['/espace/apres-connexion(.*)']);

export default clerkMiddleware(
    async (auth, req) => {
        const nonce = crypto.randomUUID();
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set('x-nonce', nonce);

        // Build CSP with nonce injected
        const cspHeader = `default-src 'self'; base-uri 'self'; form-action 'self'; worker-src 'self' blob:; script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.com; connect-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.com https://api.clerk.com wss://*.clerk.accounts.dev wss://clerk-telemetry.com wss://*.clerk-telemetry.com https://clerk-telemetry.com https://*.clerk-telemetry.com; frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: https://img.clerk.com`;
        
        requestHeaders.set('Content-Security-Policy', cspHeader);

        if (isAdminRoute(req) && !isPublicAdminAuthRoute(req)) {
            const signIn = new URL('/espace', req.url).toString();
            await auth.protect({
                unauthenticatedUrl: signIn,
            });
        }

        if (isPortalRoute(req) && !isPublicPortalAuthRoute(req)) {
            const signIn = new URL('/espace', req.url).toString();
            await auth.protect({
                unauthenticatedUrl: signIn,
            });
        }

        if (isEspaceRoute(req) && isEspacePostLogin(req)) {
            const signIn = new URL('/espace', req.url).toString();
            await auth.protect({
                unauthenticatedUrl: signIn,
            });
        }

        const response = NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
        response.headers.set('Content-Security-Policy', cspHeader);
        return response;
    },
    {
        signInUrl: '/espace',
        signUpUrl: '/espace',
    }
);

export const config = {
    matcher: [
        // Restrict Clerk middleware to private surfaces only.
        '/admin(.*)',
        '/portal(.*)',
        '/espace(.*)',
        // Keep Clerk context available for admin API handlers that call auth().
        '/api/admin(.*)',
    ],
};
