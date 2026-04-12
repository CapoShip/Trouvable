import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isPortalRoute = createRouteMatcher(['/portal(.*)']);
const isEspaceRoute = createRouteMatcher(['/espace(.*)']);
const isPublicAdminAuthRoute = createRouteMatcher(['/admin/sign-in(.*)']);
const isPublicPortalAuthRoute = createRouteMatcher(['/portal/sign-in(.*)']);
const isEspacePostLogin = createRouteMatcher(['/espace/apres-connexion(.*)']);

const cspHeader = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
    "worker-src 'self' blob:",
    "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.trouvable.app https://clerk-telemetry.com https://*.clerk-telemetry.com https://va.vercel-scripts.com https://cdn.vercel-insights.com",
    "connect-src 'self' https://challenges.cloudflare.com https://cloudflareinsights.com https://*.supabase.co https://*.clerk.accounts.dev https://*.clerk.com https://clerk.trouvable.app wss://*.clerk.accounts.dev wss://clerk-telemetry.com wss://*.clerk-telemetry.com https://clerk-telemetry.com https://*.clerk-telemetry.com https://va.vercel-scripts.com https://vitals.vercel-insights.com",
    "frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev https://*.clerk.com https://clerk.trouvable.app",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self' data: blob: https: https://img.clerk.com",
    "object-src 'none'",
].join('; ');

export default clerkMiddleware(
    async (auth, req) => {
        if (req.nextUrl.pathname === '/favicon.ico') {
            return NextResponse.redirect(new URL('/icon.png', req.url), 307);
        }

        if (isAdminRoute(req) && !isPublicAdminAuthRoute(req)) {
            await auth.protect({ unauthenticatedUrl: new URL('/espace', req.url).toString() });
        }
        if (isPortalRoute(req) && !isPublicPortalAuthRoute(req)) {
            await auth.protect({ unauthenticatedUrl: new URL('/espace', req.url).toString() });
        }
        if (isEspaceRoute(req) && isEspacePostLogin(req)) {
            await auth.protect({ unauthenticatedUrl: new URL('/espace', req.url).toString() });
        }

        const response = NextResponse.next();
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
        '/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
