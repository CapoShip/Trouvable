import AdminSidebar from './components/AdminSidebar';

export const metadata = {
    title: 'Trouvable OS — Gestion clients',
    robots: { index: false, follow: false }
};

export default function AdminLayout({ children }) {
    return (
        <div className="min-h-screen bg-[var(--geo-bg)] text-[var(--geo-t1)] flex">
            <AdminSidebar />
            <main className="flex-1 ml-0 lg:ml-[210px] p-4 pt-16 sm:p-6 sm:pt-16 lg:p-6 lg:pt-6 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

