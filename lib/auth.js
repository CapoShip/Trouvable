import { auth, currentUser } from '@clerk/nextjs/server';
import { isAdminEmail } from '@/lib/admin-email';

export async function requireAdmin() {
    const { userId } = await auth();
    if (!userId) {
        return null;
    }

    const user = await currentUser();
    if (!user) return null;

    const allEmails =
        user.emailAddresses?.map((e) => e.emailAddress).filter(Boolean) ?? [];

    const allowed = allEmails.some((email) => isAdminEmail(email));

    if (!allowed) return null;

    const primary = user.emailAddresses?.find(
        (e) => e.id === user.primaryEmailAddressId
    )?.emailAddress;
    const email = primary || allEmails[0];
    return { userId, email };
}
