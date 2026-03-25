/**
 * Admin allowlist + Gmail-aware normalization (dots in local part are ignored by Google).
 */

/** Comma-separated. Prefer CLERK_ADMIN_EMAIL so ADMIN_EMAIL (Resend) reste distinct. */
function rawAdminList() {
    const admin = process.env.CLERK_ADMIN_EMAIL || process.env.ADMIN_PANEL_EMAIL;
    if (!admin) {
        if (process.env.NODE_ENV === 'development') {
            console.warn("⚠️ CLERK_ADMIN_EMAIL non définie en développement. Fallback universel activé.");
            // En développement pur sans variables d'environnement définies, 
            // On bypass la vérification en retournant 'BYPASS_LOCAL_CHECK' 
            // que l'on traitera dans contains/isAdminEmail plus bas.
            return 'BYPASS_LOCAL_CHECK';
        }
        throw new Error("CLERK_ADMIN_EMAIL env var is required — no admin fallback in production");
    }
    return admin;
}

function normalizeEmail(email) {
    if (!email || typeof email !== 'string') return '';
    if (email === 'BYPASS_LOCAL_CHECK') return email;
    const trimmed = email.trim().toLowerCase();
    const at = trimmed.lastIndexOf('@');
    if (at <= 0) return trimmed;
    const local = trimmed.slice(0, at);
    const domain = trimmed.slice(at + 1);
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
        return `${local.replace(/\./g, '')}@${domain}`;
    }
    return trimmed;
}

/** Comma-separated list in CLERK_ADMIN_EMAIL / ADMIN_PANEL_EMAIL, or default */
export function getAdminEmailsNormalized() {
    const raw = rawAdminList();
    return raw
        .split(',')
        .map((e) => normalizeEmail(e))
        .filter(Boolean);
}

export function isAdminEmail(email) {
    if (!email) return false;
    const adminEmails = getAdminEmailsNormalized();
    
    // Bypass local development si aucunes variables d'environnement n'ont été identifiées
    if (adminEmails.includes('BYPASS_LOCAL_CHECK')) {
        return true;
    }

    const n = normalizeEmail(email);
    return adminEmails.includes(n);
}
