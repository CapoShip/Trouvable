import AdminSidebar from './components/AdminSidebar';
import AdminTopCommandBar from './components/AdminTopCommandBar';
import './admin-shell.css';

export const metadata = {
    title: 'Trouvable — Centre de commande',
    robots: { index: false, follow: false },
};

export default async function AdminGateLayout({ children }) {
    return (
        <div className="geo-shell">
            <AdminSidebar />
            <div className="geo-main">
                <AdminTopCommandBar />
                <div className="geo-content">{children}</div>
            </div>
        </div>
    );
}
