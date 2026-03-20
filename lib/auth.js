import { auth, currentUser } from '@clerk/nextjs/server';

const ADMIN_EMAIL = 'contactmarchadidi@gmail.com';

export async function requireAdmin() {
    const { userId } = await auth();
    if (!userId) {
        return null;
    }

    const user = await currentUser();
    if (!user) return null;

    const email = user.emailAddresses?.find(
        (e) => e.id === user.primaryEmailAddressId
    )?.emailAddress;

    if (email !== ADMIN_EMAIL) return null;

    return { userId, email };
}
