import { redirect } from 'next/navigation';

export default function AdminIndex() {
    // Redirection vers le dashboard GEO (plateforme de visibilité IA).
    redirect('/admin/dashboard');
}
