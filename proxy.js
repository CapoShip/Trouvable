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
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        '/(api|trpc)(.*)',
    ],
};
