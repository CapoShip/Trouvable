import AdminSidebar from './components/AdminSidebar';

export const metadata = {
    title: 'Admin Dashboard - Trouvable',
    robots: { index: false, follow: false }
};

export default function AdminLayout({ children }) {
    return (
        <div className="min-h-screen bg-[#080808] text-[#f0f0f0] flex">
            {/* The Sidebar is fixed on the left */}
            <AdminSidebar />

            {/* Main Content Area (offset by sidebar width on desktop) */}
            <main className="flex-1 ml-0 lg:ml-64 p-4 pt-16 sm:p-6 sm:pt-16 lg:p-8 lg:pt-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

