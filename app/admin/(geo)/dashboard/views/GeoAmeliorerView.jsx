'use client';

import Link from 'next/link';
import { useGeoClient } from '../../context/GeoClientContext';

export default function GeoAmeliorerView() {
    const { client, audit, clientId } = useGeoClient();
    const issues = audit?.issues || [];
    const critCount = issues.filter((i) => typeof i === 'object' ? i.severity === 'critical' : true).length;
    const highCount = issues.filter((i) => typeof i === 'object' ? i.severity === 'high' : false).length || Math.max(0, issues.length - critCount);
    const geoScore = audit?.geo_score ?? 74;
    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';

    const potentialScore = Math.min(100, geoScore + (issues.length * 4) + 8);
    const circumference = 2 * Math.PI * 36;
    const dashOffset = circumference - (geoScore / 100) * circumference;

    return (
        <div className="p-5">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                    <div className="text-xl font-bold tracking-[-0.02em]">Améliorer</div>
                    <div className="text-[13px] text-white/40">Actions recommandées pour booster le score de visibilité IA de {client?.client_name || 'votre marque'}</div>
                </div>
                <div className="flex gap-1.5 items-center">
                    {critCount > 0 && <span className="geo-pill-r text-[11px]">{critCount} critique{critCount > 1 ? 's' : ''}</span>}
                    {highCount > 0 && <span className="geo-pill-a text-[11px]">{highCount} importante{highCount > 1 ? 's' : ''}</span>}
                    {critCount === 0 && highCount === 0 && <span className="geo-pill-n text-[11px]">Aucune action critique</span>}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
                <div className="space-y-4">
                    <div className="text-[11px] font-bold text-[#f87171] uppercase tracking-wider flex items-center gap-1.5">
                        <span>🔴</span> Actions critiques — Impact élevé
                    </div>
                    {issues.length > 0 ? issues.slice(0, 4).map((issue, i) => (
                        <div key={i} className="geo-card p-4 border-l-4 border-l-[var(--geo-red)]">
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 bg-[var(--geo-red-bg)]">❌</div>
                                <div className="flex-1">
                                    <div className="text-xs font-bold text-[var(--geo-t1)] mb-1">{typeof issue === 'object' ? (issue.title || issue.description) : issue}</div>
                                    <div className="text-[11px] text-[var(--geo-t2)] leading-relaxed mb-2">{typeof issue === 'object' && issue.description}</div>
                                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--geo-t3)]">
                                        <span className="geo-pill-r text-[10px]">Impact GEO</span>
                                    </div>
                                </div>
                                <Link href={`${baseHref}?view=audit`} className="geo-btn geo-btn-pri text-xs py-1.5 px-3">Corriger →</Link>
                            </div>
                        </div>
                    )) : (
                        <div className="geo-card p-4 border-l-4 border-l-[var(--geo-red)]">
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 bg-[var(--geo-red-bg)]">❌</div>
                                <div className="flex-1">
                                    <div className="text-xs font-bold text-[var(--geo-t1)] mb-1">FAQ métier absente — Impact GEO critique</div>
                                    <div className="text-[11px] text-[var(--geo-t2)] leading-relaxed mb-2">Aucune section FAQ détectée sur le site. Les moteurs IA favorisent fortement les pages avec réponses Q&amp;A structurées.</div>
                                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--geo-t3)]">
                                        <span className="geo-pill-r text-[10px]">Critique · Impact +15pts GEO</span>
                                        <span>⏱ ~2h de travail</span>
                                    </div>
                                </div>
                                <Link href={`${baseHref}?view=audit`} className="geo-btn geo-btn-pri text-xs py-1.5 px-3">Créer FAQ →</Link>
                            </div>
                        </div>
                    )}

                    <div className="text-[11px] font-bold text-[var(--geo-amber)] uppercase tracking-wider flex items-center gap-1.5 mt-4">
                        <span>🟡</span> Actions importantes
                    </div>
                    <div className="geo-card p-4 border-l-4 border-l-[var(--geo-amber)]">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 bg-[var(--geo-amber-bg)]">⚡</div>
                            <div className="flex-1">
                                <div className="text-xs font-bold text-[var(--geo-t1)] mb-1">Vitesse de chargement trop lente — 4.2s (cible &lt; 2.5s)</div>
                                <div className="text-[11px] text-[var(--geo-t2)]">La vitesse de la page impacte la crawlabilité et indirectement les signaux de confiance des LLMs.</div>
                            </div>
                            <Link href={`${baseHref}?view=audit`} className="geo-btn geo-btn-ghost text-xs py-1.5 px-3">Diagnostic →</Link>
                        </div>
                    </div>
                    <div className="geo-card p-4 border-l-4 border-l-[var(--geo-amber)]">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 bg-[var(--geo-amber-bg)]">📊</div>
                            <div className="flex-1">
                                <div className="text-xs font-bold text-[var(--geo-t1)] mb-1">Répondre aux fils Reddit/Quora à haut impact</div>
                                <div className="text-[11px] text-[var(--geo-t2)]">14 conversations actives où votre marque n&apos;est pas encore mentionnée.</div>
                            </div>
                            <Link href={`${baseHref}?view=social`} className="geo-btn geo-btn-ghost text-xs py-1.5 px-3">Voir les fils →</Link>
                        </div>
                    </div>

                    <div className="text-[11px] font-bold text-[var(--geo-green)] uppercase tracking-wider flex items-center gap-1.5 mt-4">
                        <span>🟢</span> Quick wins
                    </div>
                    <div className="geo-card p-4 border-l-4 border-l-[var(--geo-green)]">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0 bg-[var(--geo-green-bg)]">✅</div>
                            <div className="flex-1">
                                <div className="text-xs font-bold text-[var(--geo-t1)] mb-1">Ajouter AggregateRating Schema</div>
                                <div className="text-[11px] text-[var(--geo-t2)]">Les LLMs privilégient les sites avec des évaluations structurées.</div>
                            </div>
                            <Link href={`${baseHref}?view=cockpit`} className="geo-btn geo-btn-ghost text-xs py-1.5 px-3">Configurer →</Link>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="geo-card p-4">
                        <div className="text-[11px] font-bold text-[var(--geo-t3)] uppercase tracking-wider mb-3">Score actuel</div>
                        <div className="text-center mb-3">
                            <div className="relative w-[90px] h-[90px] mx-auto">
                                <svg width="90" height="90" viewBox="0 0 90 90">
                                    <circle cx="45" cy="45" r="36" fill="none" stroke="var(--geo-s3)" strokeWidth="10" />
                                    <circle cx="45" cy="45" r="36" fill="none" stroke={geoScore >= 70 ? 'var(--geo-green)' : geoScore >= 50 ? '#f59e0b' : 'var(--geo-red)'} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset} transform="rotate(-90 45 45)" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className="font-['Plus_Jakarta_Sans',sans-serif] text-xl font-extrabold">{geoScore}</span>
                                    <span className="text-[9px] text-[var(--geo-t3)]">GEO Score</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-[var(--geo-t2)] text-center mb-2.5">En appliquant toutes les actions :</div>
                        <div className="text-center p-2.5 bg-[var(--geo-green-bg)] border border-[var(--geo-green-bd)] rounded-[var(--geo-r)]">
                            <div className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl font-extrabold text-[var(--geo-green)]">{potentialScore}</div>
                            <div className="text-[10px] text-[var(--geo-green)] mt-0.5">Score potentiel estimé</div>
                        </div>
                    </div>
                    <div className="geo-card p-4">
                        <div className="text-[11px] font-bold text-[var(--geo-t3)] uppercase tracking-wider mb-3">Navigation rapide</div>
                        <div className="space-y-2">
                            <Link href={`${baseHref}?view=audit`} className="flex items-center gap-2 px-3 py-2 rounded-[var(--geo-r)] bg-[var(--geo-s2)] border border-[var(--geo-bd)] hover:border-[var(--geo-bd2)] text-xs font-medium text-[var(--geo-t1)] transition-colors w-full">
                                🔍 Lancer un nouvel audit
                            </Link>
                            <Link href={`${baseHref}?view=prompts`} className="flex items-center gap-2 px-3 py-2 rounded-[var(--geo-r)] bg-[var(--geo-s2)] border border-[var(--geo-bd)] hover:border-[var(--geo-bd2)] text-xs font-medium text-[var(--geo-t1)] transition-colors w-full">
                                📝 Voir les prompts suivis
                            </Link>
                            <Link href={`${baseHref}?view=cockpit`} className="flex items-center gap-2 px-3 py-2 rounded-[var(--geo-r)] bg-[var(--geo-s2)] border border-[var(--geo-bd)] hover:border-[var(--geo-bd2)] text-xs font-medium text-[var(--geo-t1)] transition-colors w-full">
                                🎯 Ouvrir le Cockpit
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
