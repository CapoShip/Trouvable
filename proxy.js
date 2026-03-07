import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.SESSION_SECRET;
const encodedKey = secretKey ? new TextEncoder().encode(secretKey) : null;

export async function proxy(req) {
    const path = req.nextUrl.pathname;

    // Protect /admin routes
    if (path.startsWith('/admin')) {
        // Always allow access to login page(s)
        if (path.startsWith('/admin/login')) {
            return NextResponse.next();
        }

        // If the secret is entirely missing, block protected /admin routes to prevent bypasses
        if (!encodedKey) {
            console.error('[Middleware] CRITICAL: SESSION_SECRET is missing. Admin access blocked.');
            return NextResponse.json({ error: 'Internal Server Configuration Error' }, { status: 500 });
        }

        const cookie = req.cookies.get('admin_session')?.value;
        if (!cookie) {
            console.log('[Middleware] No session cookie. Redirecting to login.');
            return NextResponse.redirect(new URL('/admin/login', req.url));
        }

        try {
            await jwtVerify(cookie, encodedKey, {
                algorithms: ['HS256'],
            });
            // Valid session
            return NextResponse.next();
        } catch (err) {
            console.log('[Middleware] Invalid or expired session. Redirecting to login.');
            // Invalid session
            return NextResponse.redirect(new URL('/admin/login', req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
