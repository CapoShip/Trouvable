/**
 * Admin allowlist + Gmail-aware normalization (dots in local part are ignored by Google).
 */

const DEFAULT_ADMIN = 'contactmarchadidi@gmail.com';

/** Comma-separated. Prefer CLERK_ADMIN_EMAIL so ADMIN_EMAIL (Resend) reste distinct. */
function rawAdminList() {
    return process.env.CLERK_ADMIN_EMAIL || process.env.ADMIN_PANEL_EMAIL || DEFAULT_ADMIN;
}

function normalizeEmail(email) {
    if (!email || typeof email !== 'string') return '';
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
    const n = normalizeEmail(email);
    return getAdminEmailsNormalized().includes(n);
}
