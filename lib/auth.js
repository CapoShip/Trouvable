import { auth, currentUser } from '@clerk/nextjs/server';
import { isAdminEmail } from '@/lib/admin-email';
import { getDevAdminForCurrentRequest } from '@/lib/dev-bypass-server';

function getAllUserEmails(user) {
    return user?.emailAddresses?.map((entry) => entry.emailAddress).filter(Boolean) ?? [];
}

function getPrimaryUserEmail(user) {
    return user?.emailAddresses?.find((entry) => entry.id === user?.primaryEmailAddressId)?.emailAddress
        || user?.emailAddresses?.[0]?.emailAddress
        || '';
}

export async function getAdminAccessState() {
    const devAdmin = await getDevAdminForCurrentRequest();
    console.log('[auth] devAdmin?', devAdmin);
    if (devAdmin) {
        return {
            kind: 'dev-bypass',
            admin: devAdmin,
            user: null,
        };
    }

    const { userId } = await auth();
    if (!userId) {
        return {
            kind: 'anonymous',
            admin: null,
            user: null,
        };
    }

    const user = await currentUser();
    if (!user) {
        return {
            kind: 'anonymous',
            admin: null,
            user: null,
        };
    }

    const allEmails = getAllUserEmails(user);
    const allowed = allEmails.some((email) => isAdminEmail(email));

    if (!allowed) {
        return {
            kind: 'forbidden',
            admin: null,
            user,
        };
    }

    return {
        kind: 'clerk',
        admin: {
            userId,
            email: getPrimaryUserEmail(user) || allEmails[0] || '',
        },
        user,
    };
}

export async function requireAdmin() {
    const accessState = await getAdminAccessState();
    return accessState.admin;
}
