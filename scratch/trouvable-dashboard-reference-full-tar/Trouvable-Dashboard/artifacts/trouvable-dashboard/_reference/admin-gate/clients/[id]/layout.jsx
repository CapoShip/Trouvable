import ClientWorkspaceShell from './ClientWorkspaceShell';

export const dynamic = 'force-dynamic';

export default async function ClientLayout({ children, params }) {
    const { id } = await params;
    return <ClientWorkspaceShell clientId={id}>{children}</ClientWorkspaceShell>;
}
