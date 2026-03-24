'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function ClientListActions({ client, showArchived }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState(null);

    async function archive() {
        if (!window.confirm('Archiver ce client ?')) return;
        setBusy(true);
        setErr(null);
        try {
            const res = await fetch('/api/admin/clients/archive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId: client.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur');
            router.refresh();
        } catch (e) {
            setErr(e.message);
        } finally {
            setBusy(false);
        }
    }

    async function restore() {
        setBusy(true);
        setErr(null);
        try {
            const res = await fetch('/api/admin/clients/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId: client.id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur');
            router.refresh();
        } catch (e) {
            setErr(e.message);
        } finally {
            setBusy(false);
        }
    }

    async function hardDelete() {
        const slug = window.prompt(
            `Suppression définitive — saisissez le slug exact du client pour confirmer :\n${client.client_slug}`
        );
        if (slug == null) return;
        if (slug.trim() !== client.client_slug) {
            setErr('Slug incorrect — annulé.');
            return;
        }
        setBusy(true);
        setErr(null);
        try {
            const res = await fetch('/api/admin/clients/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId: client.id, confirmSlug: slug.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur');
            router.push('/admin/clients');
            router.refresh();
        } catch (e) {
            setErr(e.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="flex flex-col items-end gap-1">
            {err && <span className="text-[10px] text-red-400 max-w-[140px] text-right">{err}</span>}
            <div className="flex flex-wrap justify-end gap-2">
                {busy && <Loader2 className="animate-spin text-white/40" size={16} />}
                <Link href={`/admin/clients/${client.id}/overview`} className="text-white font-semibold hover:text-emerald-400 text-sm">
                    Ouvrir
                </Link>
                <Link href={`/admin/clients/${client.id}/edit`} className="text-violet-400 font-semibold hover:text-white text-sm">
                    Éditer
                </Link>
                {showArchived ? (
                    <button type="button" onClick={restore} disabled={busy} className="text-emerald-400 text-sm font-semibold hover:underline disabled:opacity-50">
                        Restaurer
                    </button>
                ) : (
                    <button type="button" onClick={archive} disabled={busy} className="text-amber-400 text-sm font-semibold hover:underline disabled:opacity-50">
                        Archiver
                    </button>
                )}
                <button type="button" onClick={hardDelete} disabled={busy} className="text-red-400/90 text-sm font-semibold hover:underline disabled:opacity-50">
                    Supprimer
                </button>
            </div>
        </div>
    );
}
