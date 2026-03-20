'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useGeoClient } from '../../context/GeoClientContext';

export default function GeoCockpitView() {
    const { client, audit, clientId, getInitials } = useGeoClient();
    const [activeTab, setActiveTab] = useState('hub');

    const contact = client?.contact_info || {};
    const business = client?.business_details || {};
    const geoData = client?.geo_ai_data || {};
    const differentiators = geoData.differentiators || [];
    const seoScore = audit?.seo_score ?? 82;
    const geoScore = audit?.geo_score ?? 74;
    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';

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
                        <div className="flex items-center gap-1.5 text-xs text-[var(--geo-t3)]">
                            <span>Client OS</span>
                            <span>·</span>
                            {client?.website_url && (() => {
                                try {
                                    const host = new URL(client.website_url).hostname;
                                    return (
                                        <a href={client.website_url} target="_blank" rel="noopener noreferrer" className="text-[#a78bfa] hover:underline">
                                            {host} ↗
                                        </a>
                                    );
                                } catch {
                                    return <span className="text-white/40">{client.website_url}</span>;
                                }
                            })()}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href={`${baseHref}?view=audit`} className="geo-btn geo-btn-ghost">
                        <svg className="w-3 h-3" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 2H5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V9" /><polyline points="14,2 19,2 19,7" /></svg>
                        Lancer Audit
                    </Link>
                    <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-pri">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                        Améliorer
                    </Link>
                </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-[var(--geo-s1)] border border-[var(--geo-green-bd)] rounded-[var(--geo-r2)] mb-5">
                <span className="w-2 h-2 rounded-full bg-[var(--geo-green)] shadow-[0_0_8px_var(--geo-green)] geo-pulse" />
                <div className="flex-1">
                    <b className="text-xs text-[var(--geo-t1)]">Automatisation GEO Active</b>
                    <span className="text-[11px] text-[var(--geo-t2)] ml-1">· L&apos;intelligence analyse et injecte les données en continu.</span>
                </div>
                <span className="geo-pill-pg text-[10px]">✓ Payload injecté</span>
            </div>

            <div className="flex gap-1 mb-4 p-1 bg-[var(--geo-s1)] border border-[var(--geo-bd)] rounded-[var(--geo-r2)]">
                {[
                    { id: 'hub', label: 'Automation Hub' },
                    { id: 'knowledge', label: 'Knowledge Base (Extrait)' },
                    { id: 'signals', label: 'Signaux & Différenciateurs' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-semibold transition-all text-center ${activeTab === tab.id ? 'bg-[var(--geo-s3)] text-[var(--geo-t1)] border border-[var(--geo-bd)]' : 'text-[var(--geo-t2)] hover:bg-white/[0.04] hover:text-[var(--geo-t1)] border border-transparent'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'hub' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div className="geo-card p-5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="geo-ct text-[var(--geo-t1)]">Pipeline d&apos;Exécution</h3>
                            <span className="geo-pill-pg geo-pill-v">En cours</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            {[
                                { done: true, label: 'Collecte des signaux (SERPs + LLMs)', badge: 'Il y a 10m' },
                                { active: true, label: 'Analyse sémantique & Gaps de marque', badge: 'Traitement...' },
                                { label: 'Génération des recommandations', badge: 'En attente' },
                                { label: 'Injection Schema.org (JSON-LD)', badge: 'En attente' },
                            ].map((step, i) => (
                                <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-[var(--geo-r)] border ${step.done ? 'border-[var(--geo-green-bd)] bg-[var(--geo-green-bg)]' : step.active ? 'border-[var(--geo-violet-bd)] bg-[var(--geo-violet-bg)]' : 'border-[var(--geo-bd)] bg-[var(--geo-s2)] opacity-50'}`}>
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${step.done ? 'bg-[var(--geo-green-bg)] text-[var(--geo-green)]' : step.active ? 'bg-[var(--geo-violet)] text-white' : 'bg-[var(--geo-s0)] text-[var(--geo-t3)] border border-[var(--geo-bd)]'}`}>
                                        {step.done ? '✓' : step.active ? <svg className="w-3 h-3 geo-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg> : i + 1}
                                    </div>
                                    <div className="flex-1 text-xs font-semibold">{step.label}</div>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--geo-s0)] text-[var(--geo-t3)] border border-[var(--geo-bd)]">{step.badge}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="geo-card p-5 bg-[var(--geo-violet-bg)] border-[var(--geo-violet-bd)]">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="geo-ct text-[var(--geo-violet)] flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                    Résumé Exécutif IA
                                </h3>
                                <span className="geo-pill-v text-[9px]">Généré Auto</span>
                            </div>
                            <div className="text-xs text-[var(--geo-t2)] leading-relaxed italic">
                                {geoData.ai_summary_short || `Positionnement GEO de ${client?.client_name || 'ce client'}. Analyse des signaux et recommandations en cours.`}
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <Link href={`${baseHref}?view=audit`} className="geo-card p-4 text-center hover:border-[var(--geo-bd2)] transition-colors">
                                <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[28px] font-extrabold text-[var(--geo-green)]">{seoScore}</div>
                                <div className="text-[10px] text-[var(--geo-t3)] uppercase font-bold mt-0.5">Score SEO</div>
                            </Link>
                            <Link href={`${baseHref}?view=visibilite`} className="geo-card p-4 text-center hover:border-[var(--geo-bd2)] transition-colors">
                                <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[28px] font-extrabold text-[#a78bfa]">{geoScore}</div>
                                <div className="text-[10px] text-[var(--geo-t3)] uppercase font-bold mt-0.5">Score GEO</div>
                            </Link>
                            <Link href={`${baseHref}?view=social`} className="geo-card p-4 text-center hover:border-[var(--geo-bd2)] transition-colors">
                                <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[28px] font-extrabold text-[var(--geo-amber)]">68</div>
                                <div className="text-[10px] text-[var(--geo-t3)] uppercase font-bold mt-0.5">Social Score</div>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'knowledge' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                    <div className="geo-card">
                        <div className="geo-ch"><div><div className="geo-ct">Entités Extraites</div><div className="geo-csub">Données détectées par le crawl AI</div></div></div>
                        <div className="geo-cb space-y-4">
                            <div className="flex justify-between items-center">
                                <div><div className="text-[13px] font-medium text-[var(--geo-t1)]">Nom Officiel</div><div className="text-[11px] text-[var(--geo-t3)]">{client?.client_name || '—'}</div></div>
                                <span className="geo-pill-pg text-[9px]">Confiance: 99%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div><div className="text-[13px] font-medium text-[var(--geo-t1)]">Téléphone</div><div className="text-[11px] text-[var(--geo-t3)]">{contact.phone || '—'}</div></div>
                                <span className="geo-pill-pg text-[9px]">Confiance: 95%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div><div className="text-[13px] font-medium text-[var(--geo-t1)]">Site Web</div><div className="text-[11px] text-[var(--geo-t3)]">{client?.website_url || '—'}</div></div>
                                <span className="geo-pill-pg text-[9px]">Confiance: 100%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div><div className="text-[13px] font-medium text-[var(--geo-t1)]">Horaires d&apos;ouverture</div><div className="text-[11px] text-[var(--geo-amber)]">{business.opening_hours?.length ? 'Configuré' : 'Incohérence détectée'}</div></div>
                                <Link href={`${baseHref}?view=settings`} className="geo-btn geo-btn-ghost text-[10px] py-1 px-2">Mettre à jour</Link>
                            </div>
                            <div className="flex justify-between items-center">
                                <div><div className="text-[13px] font-medium text-[var(--geo-t1)]">Catégorie Schema.org</div><div className="text-[11px] text-[var(--geo-t3)]">{client?.business_type || 'LocalBusiness'}</div></div>
                            </div>
                        </div>
                    </div>

                    <div className="geo-card">
                        <div className="geo-ch"><div><div className="geo-ct">Adresse & Contact</div><div className="geo-csub">Informations structurées</div></div></div>
                        <div className="geo-cb space-y-3">
                            {client?.address && (
                                <div>
                                    <div className="text-[13px] font-medium text-[var(--geo-t1)]">Adresse</div>
                                    <div className="text-[11px] text-[var(--geo-t3)]">
                                        {[client.address.street, client.address.city, client.address.region, client.address.postalCode, client.address.country].filter(Boolean).join(', ') || '—'}
                                    </div>
                                </div>
                            )}
                            {contact.email && (
                                <div>
                                    <div className="text-[13px] font-medium text-[var(--geo-t1)]">Email</div>
                                    <div className="text-[11px] text-[var(--geo-t3)]">{contact.email}</div>
                                </div>
                            )}
                            {client?.social_profiles?.length > 0 && (
                                <div>
                                    <div className="text-[13px] font-medium text-[var(--geo-t1)] mb-1">Profils Sociaux</div>
                                    {client.social_profiles.map((url, i) => (
                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block text-[11px] text-[#a78bfa] hover:underline truncate">{url}</a>
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
                            <div><div className="geo-ct">Différenciateurs Actifs</div><div className="geo-csub">Injectés dans le Knowledge Graph</div></div>
                        </div>
                        <div className="geo-cb space-y-2">
                            {differentiators.length > 0 ? differentiators.map((d, i) => (
                                <div key={i} className="flex justify-between items-center p-2.5 bg-[var(--geo-s2)] border border-[var(--geo-bd)] rounded-[var(--geo-r)]">
                                    <span className="text-xs font-medium text-[var(--geo-t1)]">{typeof d === 'string' ? d : d.text || d}</span>
                                    <div className="w-8 h-4 rounded-full bg-[var(--geo-violet)] relative cursor-pointer" />
                                </div>
                            )) : (
                                <p className="text-xs text-[var(--geo-t3)]">Aucun différenciateur configuré.</p>
                            )}
                        </div>
                    </div>

                    {audit?.issues?.length > 0 && (
                        <div className="geo-card border-[var(--geo-red-bd)]">
                            <div className="geo-ch bg-[var(--geo-red-bg)]">
                                <div><div className="geo-ct text-[var(--geo-red)]">Points de Friction ({audit.issues.length})</div></div>
                                <Link href={`${baseHref}?view=ameliorer`} className="geo-btn geo-btn-ghost text-[10px] py-1 px-2">Résoudre →</Link>
                            </div>
                            <div className="p-3 space-y-0">
                                {audit.issues.slice(0, 3).map((issue, i) => (
                                    <div key={i} className="flex items-center gap-2.5 py-2 border-b border-[var(--geo-bd)] last:border-0">
                                        <div className="w-6 h-6 rounded-md bg-[var(--geo-red-bg)] text-[var(--geo-red)] flex items-center justify-center font-bold text-xs">!</div>
                                        <div className="flex-1">
                                            <div className="text-[13px] font-semibold text-[var(--geo-t1)]">{typeof issue === 'string' ? issue : issue.title || issue}</div>
                                            {typeof issue === 'object' && issue.description && <div className="text-xs text-[var(--geo-t3)]">{issue.description}</div>}
                                        </div>
                                        <span className="geo-pill-r text-[10px]">Critique GEO</span>
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
