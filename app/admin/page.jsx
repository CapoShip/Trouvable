import { redirect } from 'next/navigation';

export default function AdminIndex() {
    // Le dashboard par défaut redirige directement vers la liste des clients.
    redirect('/admin/clients');
}
