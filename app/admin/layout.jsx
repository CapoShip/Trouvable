export const metadata = {
    robots: { index: false, follow: false },
};

/** Enveloppe légère : la vérif admin est dans (gate)/layout.jsx uniquement (pas sur /admin/sign-in). */
export default function AdminShellLayout({ children }) {
    return <>{children}</>;
}
