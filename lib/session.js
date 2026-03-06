import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.SESSION_SECRET;
if (!secretKey) {
    throw new Error('CRITICAL: SESSION_SECRET environment variable is missing.');
}
const encodedKey = new TextEncoder().encode(secretKey);

export async function createSession(userId) {
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

    // Create JWT
    const sessionToken = await new SignJWT({ userId, role: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('8h')
        .sign(encodedKey);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: expiresAt,
        sameSite: 'lax',
        path: '/admin',
    });
}

export async function verifySession() {
    const cookieStore = await cookies();
    const cookie = cookieStore.get('admin_session')?.value;
    if (!cookie) return null;
    try {
        const { payload } = await jwtVerify(cookie, encodedKey, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (err) {
        console.error('[Session Error]', err.message);
        return null;
    }
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.set('admin_session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/admin',
        maxAge: 0,
        sameSite: 'lax',
    });
}
