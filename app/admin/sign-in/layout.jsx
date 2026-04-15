import AdminClerkProvider from '../components/AdminClerkProvider';

export default function AdminSignInLayout({ children }) {
    return <AdminClerkProvider>{children}</AdminClerkProvider>;
}
