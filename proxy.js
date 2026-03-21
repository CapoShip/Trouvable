import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isPortalRoute = createRouteMatcher(['/portal(.*)']);
const isPublicAdminAuthRoute = createRouteMatcher(['/admin/sign-in(.*)']);
const isPublicPortalAuthRoute = createRouteMatcher(['/portal/sign-in(.*)']);

export default clerkMiddleware(
    async (auth, req) => {
        if (isAdminRoute(req) && !isPublicAdminAuthRoute(req)) {
            const signIn = new URL('/admin/sign-in', req.url).toString();
            await auth.protect({
                unauthenticatedUrl: signIn,
            });
        }

        if (isPortalRoute(req) && !isPublicPortalAuthRoute(req)) {
            const signIn = new URL('/portal/sign-in', req.url).toString();
            await auth.protect({
                unauthenticatedUrl: signIn,
            });
        }
    },
    {
        signInUrl: '/admin/sign-in',
        signUpUrl: '/admin/sign-in',
    }
);

export const config = {
    matcher: [
        // Restrict Clerk middleware to private surfaces only.
        '/admin(.*)',
        '/portal(.*)',
        // Keep Clerk context available for admin API handlers that call auth().
        '/api/admin(.*)',
    ],
};
