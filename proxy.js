import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isPortalRoute = createRouteMatcher(['/portal(.*)']);
const isEspaceRoute = createRouteMatcher(['/espace(.*)']);
const isPublicAdminAuthRoute = createRouteMatcher(['/admin/sign-in(.*)']);
const isPublicPortalAuthRoute = createRouteMatcher(['/portal/sign-in(.*)']);
/** Connexion publique sous /espace ; seul le routage post-login exige une session. */
const isEspacePostLogin = createRouteMatcher(['/espace/apres-connexion(.*)']);

export default clerkMiddleware(
    async (auth, req) => {
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
