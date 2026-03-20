import Link from 'next/link';
import ClientForm from '../ClientForm';

export const metadata = {
    title: 'Nouveau client - Admin',
};

export default function NewClientPage() {
    return (
        <div className="space-y-6 max-w-5xl">
            <div className="bg-[#0f0f0f] p-6 rounded-2xl border border-white/10 flex flex-col justify-center">
                <Link href="/admin/clients" className="text-sm font-medium text-[#a0a0a0] hover:text-white flex items-center gap-2 mb-4">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Retour aux clients
                </Link>
                <h1 className="text-3xl font-bold tracking-tight text-white">Nouveau Profil Local</h1>
                <p className="text-[#a0a0a0] mt-1">Créez une nouvelle fiche GEO/SEO pour un client.</p>
            </div>

            <ClientForm />
        </div>
    );
}
