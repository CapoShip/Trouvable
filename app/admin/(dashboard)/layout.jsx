import AdminSidebar from './components/AdminSidebar';

export const metadata = {
    title: 'Admin Dashboard - Trouvable',
    robots: { index: false, follow: false }
};

export default function AdminLayout({ children }) {
    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 flex">
            {/* The Sidebar is fixed on the left */}
            <AdminSidebar />

            {/* Main Content Area (offset by sidebar width on desktop) */}
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
