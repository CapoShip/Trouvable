import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isPortalRoute = createRouteMatcher(['/portal(.*)']);
const isEspaceRoute = createRouteMatcher(['/espace(.*)']);
const isPublicAdminAuthRoute = createRouteMatcher(['/admin/sign-in(.*)']);
const isPublicPortalAuthRoute = createRouteMatcher(['/portal/sign-in(.*)']);
const isEspacePostLogin = createRouteMatcher(['/espace/apres-connexion(.*)']);

// ---------------------------------------------------------------------------
// Content-Security-Policy — authoritative source of truth
// vercel.json mirrors this policy as an edge fallback for non-middleware routes.
// Any change here MUST be reflected in vercel.json to avoid CSP drift.
//
// Directive rationale (per integration):
//   Clerk v7      — *.clerk.com, *.clerk.accounts.dev (dev), clerk.trouvable.app,
//                    clerk-telemetry.com, img.clerk.com, wss:// for WebSocket auth
//   Turnstile     — challenges.cloudflare.com (script + frame + connect)
//   CF Web Analytics — static.cloudflareinsights.com (script),
//                      cloudflareinsights.com (connect), auto-injected by CF proxy
//   Vercel Analytics — va.vercel-scripts.com (script + connect)
//   Vercel Insights  — cdn.vercel-insights.com (script),
//                      vitals.vercel-insights.com (connect)
//   Supabase      — *.supabase.co (connect)
//
// 'unsafe-inline' in script-src: still required by Next.js inline scripts,
//   Clerk SDK script injection, and Vercel Analytics. Removal requires
//   nonce-based CSP (deferred to future batch).
// 'unsafe-inline' in style-src: required by Clerk UI, Framer Motion, Next.js
//   CSS injection. Removal requires nonce-based style handling (deferred).
// 'unsafe-eval' REMOVED: not required by Clerk v7, Next.js production, or
//   any first-party code. Only needed in local dev (handled separately).
// Google Fonts URLs REMOVED: next/font/google self-hosts fonts at build time.
// ---------------------------------------------------------------------------
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