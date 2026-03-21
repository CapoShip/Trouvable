'use client';

import { useState } from 'react';
import Link from 'next/link';

import { useGeoClient } from '../../context/GeoClientContext';

export default function GeoCockpitView() {
    const { client, audit, workspace, clientId, getInitials } = useGeoClient();
    const [activeTab, setActiveTab] = useState('hub');

    const contact = client?.contact_info || {};
    const business = client?.business_details || {};
    const geoData = client?.geo_ai_data || {};
    const differentiators = geoData.differentiators || [];
    const seoScore = audit?.seo_score ?? null;
    const geoScore = audit?.geo_score ?? null;
    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';
    const lastAudit = workspace?.latestAuditAt
        ? new Date(workspace.latestAuditAt).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' })
        : null;
    const lastRun = workspace?.latestRunAt
        ? new Date(workspace.latestRunAt).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' })
        : null;

    return (
        <div className="p-[18px] pr-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center font-['Plus_Jakarta_Sans',sans-serif] text-lg font-extrabold text-white shadow-[0_4px_12px_rgba(124,58,237,0.3)]">
                        {client ? getInitials(client.client_name) : '?'}
                    </div>
                    <div>
                        <div className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-bold tracking-tight mb-0.5">
                            {client?.client_name || 'Chargement...'}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--geo-t3)] flex-wrap">
                            <span>Profil client</span>
                            <span>·</span>
                            {client?.website_url ? (
                                <a href={client.website_url} target="_blank" rel="noopener noreferrer" className="text-[#a78bfa] hover:underline">
                                    {client.website_url}
                                </a>
                            ) : (
                                <span className="text-white/40">Site non renseigne</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Link href={`${baseHref}?view=audit`} className="geo-btn geo-btn-ghost">
                        Audit
                    </Link>
                    <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-pri">
                        Opportunity center
                    </Link>
                </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-[var(--geo-s1)] border border-white/10 rounded-[var(--geo-r2)] mb-5 text-xs text-[var(--geo-t2)]">
                <span className="w-2 h-2 rounded-full bg-white/30 mt-1 shrink-0" />
                <div>
                    <b className="text-[var(--geo-t1)]">Donnees affichees</b> : profil en base, dernier audit observe et dernier tracked run observe.
                    {lastAudit && (
                        <>
                            {' '}Dernier audit : <span className="text-white/70">{lastAudit}</span>.
                        </>
                    )}
                    {lastRun && (
                        <>
                            {' '}Dernier run : <span className="text-white/70">{lastRun}</span>.
                        </>
                    )}
                </div>
            </div>

            <div className="flex gap-1 mb-4 p-1 bg-[var(--geo-s1)] border border-[var(--geo-bd)] rounded-[var(--geo-r2)]">
                {[
                    { id: 'hub', label: 'Vue d ensemble' },
                    { id: 'knowledge', label: 'Fiche' },
                    { id: 'signals', label: 'Signaux' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-all text-center ${
                            activeTab === tab.id
                                ? 'bg-[var(--geo-s3)] text-[var(--geo-t1)] border border-[var(--geo-bd)]'
                                : 'text-[var(--geo-t2)] hover:bg-white/[0.04] hover:text-[var(--geo-t1)] border border-transparent'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'hub' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div className="geo-card p-5">
                        <h3 className="geo-ct text-[var(--geo-t1)] mb-3">Parcours type</h3>
                        <ol className="list-decimal list-inside space-y-2 text-xs text-[var(--geo-t2)]">
                            <li>Audit du site (SEO + signaux GEO)</li>
                            <li>Tracked prompts + execution des runs</li>
                            <li>Safe merge et priorisation operator-first</li>
                        </ol>
                        <p className="mt-4 text-[11px] text-white/35">
                            Consultez le dashboard principal pour les vues observees, derivees et la priorisation operateur.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="geo-card p-5 bg-[var(--geo-violet-bg)] border-[var(--geo-violet-bd)]">
                            <h3 className="geo-ct text-[var(--geo-violet)] mb-2">Resume profil</h3>
                            <div className="text-xs text-[var(--geo-t2)] leading-relaxed">
                                {geoData.ai_summary_short ||
                                    `Aucun resume IA stocke pour ${client?.client_name || 'ce client'}. Il apparaitra apres un audit ou une mise a jour de profil.`}
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <Link href={`${baseHref}?view=audit`} className="geo-card p-4 text-center hover:border-[var(--geo-bd2)] transition-colors">
                                <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[28px] font-extrabold text-[var(--geo-green)]">{seoScore != null ? seoScore : '—'}</div>
                                <div className="text-[10px] text-[var(--geo-t3)] uppercase font-bold mt-0.5">SEO</div>
                            </Link>
                            <Link href={`${baseHref}?view=overview`} className="geo-card p-4 text-center hover:border-[var(--geo-bd2)] transition-colors">
                                <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[28px] font-extrabold text-[#a78bfa]">{geoScore != null ? geoScore : '—'}</div>
                                <div className="text-[10px] text-[var(--geo-t3)] uppercase font-bold mt-0.5">Overview</div>
                            </Link>
                            <Link href={`${baseHref}?view=runs`} className="geo-card p-4 text-center hover:border-[var(--geo-bd2)] transition-colors">
                                <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[28px] font-extrabold text-[var(--geo-amber)]">{workspace?.completedRunCount ?? 0}</div>
                                <div className="text-[10px] text-[var(--geo-t3)] uppercase font-bold mt-0.5">Runs</div>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'knowledge' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div className="geo-card">
                        <div className="geo-ch">
                            <div>
                                <div className="geo-ct">Donnees profil</div>
                                <div className="geo-csub">Champs stockes pour ce client</div>
                            </div>
                        </div>
                        <div className="geo-cb space-y-4">
                            <div>
                                <div className="text-[13px] font-medium text-[var(--geo-t1)]">Nom</div>
                                <div className="text-[11px] text-[var(--geo-t3)]">{client?.client_name || '—'}</div>
                            </div>
                            <div>
                                <div className="text-[13px] font-medium text-[var(--geo-t1)]">Telephone</div>
                                <div className="text-[11px] text-[var(--geo-t3)]">{contact.phone || '—'}</div>
                            </div>
                            <div>
                                <div className="text-[13px] font-medium text-[var(--geo-t1)]">Site</div>
                                <div className="text-[11px] text-[var(--geo-t3)]">{client?.website_url || '—'}</div>
                            </div>
                            <div>
                                <div className="text-[13px] font-medium text-[var(--geo-t1)]">Horaires</div>
                                <div className="text-[11px] text-[var(--geo-t3)]">{business.opening_hours?.length ? 'Renseignes' : '—'}</div>
                            </div>
                            <div>
                                <div className="text-[13px] font-medium text-[var(--geo-t1)]">Type d activite</div>
                                <div className="text-[11px] text-[var(--geo-t3)]">{client?.business_type || '—'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="geo-card">
                        <div className="geo-ch">
                            <div>
                                <div className="geo-ct">Adresse et contact</div>
                            </div>
                        </div>
                        <div className="geo-cb space-y-3">
                            {client?.address && (
                                <div>
                                    <div className="text-[13px] font-medium text-[var(--geo-t1)]">Adresse</div>
                                    <div className="text-[11px] text-[var(--geo-t3)]">
                                        {[client.address.street, client.address.city, client.address.region, client.address.postalCode, client.address.country]
                                            .filter(Boolean)
                                            .join(', ') || '—'}
                                    </div>
                                </div>
                            )}
                            {contact.public_email && (
                                <div>
                                    <div className="text-[13px] font-medium text-[var(--geo-t1)]">Email</div>
                                    <div className="text-[11px] text-[var(--geo-t3)]">{contact.public_email}</div>
                                </div>
                            )}
                            {client?.social_profiles?.length > 0 && (
                                <div>
                                    <div className="text-[13px] font-medium text-[var(--geo-t1)] mb-1">Reseaux</div>
                                    {client.social_profiles.map((url, index) => (
                                        <a
                                            key={index}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block text-[11px] text-[#a78bfa] hover:underline truncate"
                                        >
                                            {url}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'signals' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div className="geo-card">
                        <div className="geo-ch">
                            <div>
                                <div className="geo-ct">Differenciateurs</div>
                                <div className="geo-csub">Donnees configurees ou extraites</div>
                            </div>
                        </div>
                        <div className="geo-cb space-y-2">
                            {differentiators.length > 0 ? (
                                differentiators.map((item, index) => (
                                    <div key={index} className="p-2.5 bg-[var(--geo-s2)] border border-[var(--geo-bd)] rounded-[var(--geo-r)]">
                                        <span className="text-xs font-medium text-[var(--geo-t1)]">{typeof item === 'string' ? item : item.text || item}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-[var(--geo-t3)]">Aucun differenciateur enregistre.</p>
                            )}
                        </div>
                    </div>

                    {audit?.issues?.length > 0 && (
                        <div className="geo-card border-[var(--geo-red-bd)]">
                            <div className="geo-ch bg-[var(--geo-red-bg)]">
                                <div>
                                    <div className="geo-ct text-[var(--geo-red)]">Points de friction ({audit.issues.length})</div>
                                </div>
                                <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-ghost text-[10px] py-1 px-2">
                                    Voir →
                                </Link>
                            </div>
                            <div className="p-3 space-y-0">
                                {audit.issues.slice(0, 3).map((issue, index) => (
                                    <div key={index} className="flex items-center gap-2.5 py-2 border-b border-[var(--geo-bd)] last:border-0">
                                        <div className="w-6 h-6 rounded-md bg-[var(--geo-red-bg)] text-[var(--geo-red)] flex items-center justify-center font-bold text-xs">!</div>
                                        <div className="flex-1">
                                            <div className="text-[13px] font-semibold text-[var(--geo-t1)]">{typeof issue === 'string' ? issue : issue.title || issue.description || 'Issue'}</div>
                                            {typeof issue === 'object' && issue.description && (
                                                <div className="text-xs text-[var(--geo-t3)]">{issue.description}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
