'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';

export default function ClientTrackedQueries({ clientId, initialQueries = [] }) {
    const router = useRouter();
    const [queries, setQueries] = useState(initialQueries);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setQueries(initialQueries);
    }, [initialQueries]);
    const [form, setForm] = useState({
        query_text: '',
        locale: 'fr-CA',
        query_type: 'visibility',
        is_active: true,
    });

    async function handleCreate(e) {
        e.preventDefault();
        if (!form.query_text.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/queries/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId,
                    query_text: form.query_text.trim(),
                    locale: form.locale || undefined,
                    query_type: form.query_type || undefined,
                    is_active: form.is_active,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur création');
            setForm((f) => ({ ...f, query_text: '' }));
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function toggle(id, is_active) {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/queries/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_active }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur');
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function remove(id) {
        if (!window.confirm('Supprimer cette requête suivie ?')) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/queries/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur');
            router.refresh();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-1">Tracked GEO queries</h2>
            <p className="text-sm text-white/40 mb-4">Requêtes utilisées pour les GEO query runs (proxy de visibilité IA).</p>

            {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

            <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-[1fr_120px_120px_auto] md:items-end mb-6 border border-white/10 rounded-xl p-4">
                <div>
                    <label className="block text-xs text-white/40 mb-1">Texte de la requête</label>
                    <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        value={form.query_text}
                        onChange={(e) => setForm((f) => ({ ...f, query_text: e.target.value }))}
                        placeholder="Ex. meilleur plombier à Québec"
                        disabled={loading}
                    />
                </div>
                <div>
                    <label className="block text-xs text-white/40 mb-1">Locale</label>
                    <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        value={form.locale}
                        onChange={(e) => setForm((f) => ({ ...f, locale: e.target.value }))}
                        disabled={loading}
                    />
                </div>
                <div>
                    <label className="block text-xs text-white/40 mb-1">Type</label>
                    <input
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                        value={form.query_type}
                        onChange={(e) => setForm((f) => ({ ...f, query_type: e.target.value }))}
                        disabled={loading}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-white/60">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                            disabled={loading}
                        />
                        Active
                    </label>
                    <button
                        type="submit"
                        disabled={loading || !form.query_text.trim()}
                        className="inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : null}
                        Ajouter
                    </button>
                </div>
            </form>

            {queries.length === 0 ? (
                <p className="text-sm text-white/30 italic">Aucune requête suivie.</p>
            ) : (
                <ul className="space-y-2">
                    {queries.map((q) => (
                        <li key={q.id} className="flex flex-wrap items-center gap-3 justify-between bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-sm">
                            <div className="min-w-0 flex-1">
                                <div className="text-white/90 font-medium truncate">{q.query_text}</div>
                                <div className="text-xs text-white/35">
                                    {q.locale || '—'} · {q.query_type || q.category || '—'} ·{' '}
                                    {q.is_active ? <span className="text-emerald-400">active</span> : <span className="text-white/40">inactive</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => toggle(q.id, !q.is_active)}
                                    disabled={loading}
                                    className="text-xs px-2 py-1 rounded border border-white/15 hover:bg-white/5"
                                >
                                    {q.is_active ? 'Désactiver' : 'Activer'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => remove(q.id)}
                                    disabled={loading}
                                    className="p-2 text-red-400/80 hover:bg-red-400/10 rounded"
                                    aria-label="Supprimer"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
