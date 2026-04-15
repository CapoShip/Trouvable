'use client';

import { useCallback, useEffect, useState } from 'react';
import { useGeoClient } from '../context/ClientContext';
import { GeoSectionTitle } from '../components/GeoPremium';

function StatusBadge({ status }) {
    const map = {
        present: { label: 'Présent sur le site', cls: 'text-emerald-300 border-emerald-400/20 bg-emerald-400/10' },
        draft: { label: 'Brouillon disponible', cls: 'text-amber-300 border-amber-400/20 bg-amber-400/10' },
        missing: { label: 'Manquant', cls: 'text-red-300 border-red-400/20 bg-red-400/10' },
    };
    const s = map[status] || map.missing;
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${s.cls}`}>
            {s.label}
        </span>
    );
}

export default function GeoLlmsTxtView() {
    const { client, clientId, audit } = useGeoClient();

    const [draft, setDraft] = useState(null);
    const [allDrafts, setAllDrafts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);

    // Detect if llms.txt is already present on the site from audit data
    const llmsFound = (() => {
        const strengths = Array.isArray(audit?.strengths) ? audit.strengths : [];
        return strengths.some((s) => String(s?.title || '').toLowerCase().includes('llms.txt'));
    })();

    const fetchDrafts = useCallback(async () => {
        if (!clientId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/remediation/suggestions/${clientId}?type=llms_txt_missing`);
            if (!res.ok) throw new Error(`Erreur ${res.status}`);
            const json = await res.json();
            const suggestions = json.suggestions || [];
            setAllDrafts(suggestions);
            const latest = suggestions.find((s) => s.ai_output && s.status === 'draft');
            setDraft(latest || null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        fetchDrafts();
    }, [fetchDrafts]);

    async function handleGenerate() {
        if (!clientId || generating) return;
        setGenerating(true);
        setError(null);
        try {
            const res = await fetch(`/api/admin/remediation/generate/${clientId}?type=llms_txt_missing`, { method: 'POST' });
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error(json.error || `Erreur ${res.status}`);
            }
            await fetchDrafts();
        } catch (err) {
            setError(err.message);
        } finally {
            setGenerating(false);
        }
    }

    function handleCopy() {
        if (!draft?.ai_output) return;
        navigator.clipboard.writeText(draft.ai_output).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    function handleDownload() {
        if (!draft?.ai_output) return;
        const blob = new Blob([draft.ai_output], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'llms.txt';
        a.click();
        URL.revokeObjectURL(url);
    }

    const overallStatus = llmsFound ? 'present' : draft?.ai_output ? 'draft' : 'missing';

    return (
        <div className="geo-page-shell p-6 space-y-6">
            <GeoSectionTitle
                title="llms.txt"
                subtitle="Fichier de description lisible par les LLM, qui permet aux modèles d'IA de comprendre l'activité, les services et la zone de couverture."
                action={<StatusBadge status={overallStatus} />}
            />

            {/* Context card */}
            <div className="geo-card border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-white/90">Contexte client</div>
                    {(() => {
                        const fields = [client?.client_name, client?.business_description || client?.short_description, client?.city, client?.website_url];
                        const filled = fields.filter(Boolean).length;
                        const total = fields.length;
                        const complete = filled === total;
                        return (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${complete ? 'text-emerald-300 border-emerald-400/20 bg-emerald-400/10' : 'text-amber-300 border-amber-400/20 bg-amber-400/10'}`}>
                                {filled}/{total} champs renseignés
                            </span>
                        );
                    })()}
                </div>
                <div className="text-[11px] text-white/35">
                    Ces champs alimentent le contenu du llms.txt généré. Complétez-les dans le profil client pour un résultat plus précis.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <InfoPill label="Entreprise" value={client?.client_name} />
                    <InfoPill label="Description" value={client?.business_description || client?.short_description} />
                    <InfoPill label="Ville" value={client?.city} />
                    <InfoPill label="Site web" value={client?.website_url} href={client?.website_url} />
                </div>
            </div>

            {/* Detection from audit */}
            {audit ? (
                <div className={`geo-card border p-5 ${llmsFound ? 'border-emerald-400/15 bg-emerald-400/[0.03]' : 'border-amber-400/15 bg-amber-400/[0.03]'}`}>
                    <div className="flex items-center gap-3">
                        <span className={`text-base ${llmsFound ? 'text-emerald-400' : 'text-amber-300'}`}>
                            {llmsFound ? '✓' : '⚠'}
                        </span>
                        <div>
                            <div className="text-sm font-semibold text-white/90">
                                {llmsFound ? 'Fichier llms.txt détecté sur le site' : 'Fichier llms.txt absent du site'}
                            </div>
                            <div className="text-[11px] text-white/40 mt-0.5">
                                {llmsFound
                                    ? 'Le dernier audit a identifié la présence du fichier. Vous pouvez tout de même générer un brouillon amélioré.'
                                    : 'Le dernier audit n\'a pas trouvé de fichier llms.txt. Générez un brouillon ci-dessous.'}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="geo-card border border-white/[0.08] bg-white/[0.02] p-5">
                    <div className="flex items-center gap-3">
                        <span className="text-base text-white/40">○</span>
                        <div>
                            <div className="text-sm font-semibold text-white/70">Aucun audit exécuté</div>
                            <div className="text-[11px] text-white/40 mt-0.5">
                                L&apos;audit détecte si llms.txt est déjà présent sur le site. La génération reste possible sans audit, mais le contrôle de doublon ne sera pas actif.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4 text-[12px] text-red-300">
                    {error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="geo-card border border-white/[0.06] p-8 text-center">
                    <div className="text-[13px] text-white/35 animate-pulse">Chargement des brouillons…</div>
                </div>
            )}

            {/* Draft preview */}
            {!loading && draft?.ai_output && (
                <div className="geo-card border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-5 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-sm font-semibold text-white/90">Brouillon généré</div>
                            <div className="text-[11px] text-white/35 mt-0.5">
                                {new Date(draft.created_at).toLocaleString('fr-CA', { dateStyle: 'long', timeStyle: 'short' })}, statut : {draft.status}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleCopy}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/60 hover:bg-white/[0.08] hover:text-white/80 transition-all"
                            >
                                {copied ? '✓ Copié' : 'Copier'}
                            </button>
                            <button
                                type="button"
                                onClick={handleDownload}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold text-white/60 hover:bg-white/[0.08] hover:text-white/80 transition-all"
                            >
                                Télécharger
                            </button>
                            <button
                                type="button"
                                onClick={handleGenerate}
                                disabled={generating}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--geo-violet-bd,#7c3aed33)] bg-[#7c3aed10] px-3 py-1.5 text-[11px] font-semibold text-[#a78bfa] hover:bg-[#7c3aed20] transition-all disabled:opacity-40"
                            >
                                {generating ? 'Régénération…' : 'Régénérer'}
                            </button>
                        </div>
                    </div>

                    <div className="geo-scrollbar rounded-xl border border-white/[0.08] bg-black/30 p-5 max-h-[600px] overflow-y-auto">
                        <pre className="text-[13px] leading-relaxed text-white/70 whitespace-pre-wrap font-mono">{draft.ai_output}</pre>
                    </div>
                </div>
            )}

            {/* Empty state — generate CTA */}
            {!loading && !draft?.ai_output && (
                <div className="geo-card border border-dashed border-white/15 bg-white/[0.02] p-8 text-center space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-[#7c3aed]/10 border border-[#7c3aed]/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#a78bfa]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-white/80">Aucun brouillon llms.txt</div>
                        <div className="text-[12px] text-white/40 mt-1 max-w-md mx-auto">
                            Générez un fichier llms.txt personnalisé à partir des données du client. Le contenu est créé par IA et prêt à être déployé.
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={generating}
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--geo-violet-bd,#7c3aed33)] bg-[#7c3aed10] px-5 py-2.5 text-[12px] font-semibold text-[#a78bfa] hover:bg-[#7c3aed20] transition-all disabled:opacity-40"
                    >
                        {generating ? (
                            <>
                                <span className="w-3.5 h-3.5 border-2 border-[#a78bfa]/30 border-t-[#a78bfa] rounded-full animate-spin" />
                                Génération en cours…
                            </>
                        ) : (
                            'Générer le brouillon llms.txt'
                        )}
                    </button>
                </div>
            )}

            {/* History */}
            {!loading && allDrafts.length > 1 && (
                <div className="geo-card border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-5 space-y-3">
                    <div className="text-sm font-semibold text-white/90">Historique des générations</div>
                    <div className="space-y-2">
                        {allDrafts.map((d) => (
                            <div
                                key={d.id}
                                className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
                                    d.id === draft?.id
                                        ? 'border-[#7c3aed]/30 bg-[#7c3aed]/[0.05]'
                                        : 'border-white/[0.06] bg-white/[0.02]'
                                }`}
                            >
                                <div className="min-w-0">
                                    <div className="text-[12px] font-medium text-white/70">
                                        {new Date(d.created_at).toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </div>
                                    <div className="text-[10px] text-white/30 mt-0.5">
                                        {d.status} · {d.ai_output ? `${d.ai_output.length} caractères` : 'vide'}
                                    </div>
                                </div>
                                {d.id === draft?.id && (
                                    <span className="text-[10px] font-semibold text-[#a78bfa]">Affiché</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Spec reference */}
            <div className="geo-card border border-white/[0.06] bg-gradient-to-br from-white/[0.03] to-transparent p-5 space-y-3">
                <div className="text-sm font-semibold text-white/90">Spécification llms.txt</div>
                <div className="text-[12px] text-white/45 leading-relaxed space-y-2">
                    <p>Le fichier <code className="text-white/60 bg-white/[0.06] px-1 py-0.5 rounded text-[11px]">llms.txt</code> est un standard émergent qui permet aux modèles de langage d&apos;accéder à une description structurée de l&apos;entreprise.</p>
                    <p>Structure attendue :</p>
                    <ul className="list-disc list-inside space-y-1 text-white/40">
                        <li>H1 : nom de l&apos;entreprise</li>
                        <li>Blockquote : description courte de l&apos;activité</li>
                        <li>## Services : liste des services clés</li>
                        <li>## Zone desservie : ville ou région</li>
                        <li>## Contact : coordonnées disponibles</li>
                        <li>## FAQ : 3 à 5 questions-réponses pertinentes</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

function InfoPill({ label, value, href }) {
    const display = value || 'n.d.';
    return (
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
            <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-white/25 mb-0.5">{label}</div>
            {href ? (
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#7b8fff]/80 hover:text-[#7b8fff] truncate block">
                    {display}
                </a>
            ) : (
                <div className="text-[12px] text-white/70 truncate">{display}</div>
            )}
        </div>
    );
}
