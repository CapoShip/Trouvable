import Link from 'next/link';

function formatDateTime(iso) {
    if (!iso) return 'Aucune donnee';
    try {
        return new Date(iso).toLocaleString('fr-CA', {
            dateStyle: 'medium',
            timeStyle: 'short',
        });
    } catch {
        return 'Aucune donnee';
    }
}

function MetricCard({ label, value, helper, accent = 'text-white' }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
            <div className="text-[11px] uppercase tracking-[0.14em] text-white/35 font-semibold">{label}</div>
            <div className={`mt-3 text-3xl font-black tracking-[-0.04em] ${accent}`}>{value}</div>
            <div className="mt-2 text-sm text-white/45 leading-relaxed">{helper}</div>
        </div>
    );
}

function SectionCard({ title, subtitle, children }) {
    return (
        <section className="rounded-[24px] border border-white/10 bg-[#0f0f10] p-6 shadow-[0_18px_48px_rgba(0,0,0,0.42)]">
            <div className="mb-5">
                <h2 className="text-lg font-bold tracking-[-0.02em] text-white">{title}</h2>
                {subtitle && <p className="mt-1 text-sm text-white/40">{subtitle}</p>}
            </div>
            {children}
        </section>
    );
}

function freshnessLabel(freshness) {
    if (freshness === 'recent') return 'Audit a jour';
    if (freshness === 'outdated') return 'Audit a rafraichir';
    return 'Aucun audit recent';
}

export default function PortalDashboard({ dashboard, membershipsCount = 1 }) {
    const client = dashboard.client;
    const visibility = dashboard.visibility;
    const completeness = dashboard.completeness;

    return (
        <div className="space-y-6">
            <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(91,115,255,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.14),transparent_28%),linear-gradient(180deg,#111214_0%,#0b0b0c_100%)] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.52)]">
                <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(120deg,rgba(255,255,255,0.06),transparent_25%,transparent_70%,rgba(255,255,255,0.02))]" />
                <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                            Client Lite Portal
                        </div>
                        <h1 className="mt-4 text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
                            {client.client_name}
                        </h1>
                        <p className="mt-2 text-sm text-white/50">
                            {client.business_type || 'Entreprise locale'}
                            {client.website_url ? ' · ' : ''}
                            {client.website_url && (
                                <a
                                    href={client.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#a9b6ff] hover:text-white transition-colors"
                                >
                                    {client.website_url}
                                </a>
                            )}
                        </p>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68">
                            {client.short_description || 'Aucune description concise n est encore publiee pour ce dossier.'}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 lg:min-w-[260px]">
                        <div className="text-[11px] uppercase tracking-[0.12em] text-white/35 font-semibold">Statut</div>
                        <div className="text-sm font-semibold text-white">{freshnessLabel(visibility.audit_freshness)}</div>
                        <div className="text-sm text-white/45">Dernier audit: {formatDateTime(visibility.last_audit_at)}</div>
                        {membershipsCount > 1 && (
                            <Link
                                href="/portal"
                                className="mt-2 inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                            >
                                Changer de dossier
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <MetricCard
                    label="SEO"
                    value={visibility.seo_score != null ? `${visibility.seo_score}/100` : 'Aucun score'}
                    helper="Dernier score SEO confirme"
                    accent="text-emerald-400"
                />
                <MetricCard
                    label="GEO"
                    value={visibility.geo_score != null ? `${visibility.geo_score}/100` : 'Aucun score'}
                    helper="Dernier score GEO confirme"
                    accent="text-[#9da9ff]"
                />
                <MetricCard
                    label="Sante du profil"
                    value={`${completeness.percentage}%`}
                    helper={`${completeness.completedCount}/${completeness.totalCount} blocs complets`}
                    accent="text-white"
                />
                <MetricCard
                    label="Visibilite IA"
                    value={visibility.visibility_proxy_percent != null ? `${visibility.visibility_proxy_percent}%` : 'Aucune donnee'}
                    helper={`${visibility.total_query_runs || 0} runs completes`}
                    accent="text-[#c4b5fd]"
                />
                <MetricCard
                    label="Couverture sources"
                    value={visibility.citation_coverage_percent != null ? `${visibility.citation_coverage_percent}%` : 'Aucune donnee'}
                    helper="Runs avec au moins une source citee"
                    accent="text-amber-300"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <SectionCard
                    title="Travaux recents"
                    subtitle="Activites partageables uniquement: audits, mises a jour de publication et syntheses de prompts"
                >
                    {dashboard.recentWorkItems.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/40">
                            Aucune mise a jour partageable n est encore disponible.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {dashboard.recentWorkItems.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-sm font-semibold text-white">{item.title}</div>
                                        <div className="text-[11px] text-white/35">{formatDateTime(item.created_at)}</div>
                                    </div>
                                    <div className="mt-2 text-sm leading-6 text-white/52">{item.description}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>

                <SectionCard
                    title="Prochaines priorites"
                    subtitle="Generees a partir des opportunites ouvertes, des derniers points a corriger et des ecarts de completude"
                >
                    {dashboard.nextPriorities.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/40">
                            Aucune priorite structuree n est disponible pour le moment.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {dashboard.nextPriorities.map((priority, index) => (
                                <div
                                    key={`${priority.title}-${index}`}
                                    className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                                >
                                    <div className="text-sm font-semibold text-white">{priority.title}</div>
                                    <div className="mt-2 text-sm leading-6 text-white/52">{priority.description}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <SectionCard
                    title="Prompts suivis"
                    subtitle="Vue simplifiee des requetes de visibilite les plus utiles"
                >
                    {dashboard.topTrackedPrompts.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/40">
                            Aucun prompt suivi n a encore ete configure pour ce dossier.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {dashboard.topTrackedPrompts.map((prompt) => (
                                <div
                                    key={prompt.id}
                                    className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-semibold leading-6 text-white">{prompt.query_text}</div>
                                            <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-white/35">
                                                {prompt.category}
                                            </div>
                                        </div>
                                        <div
                                            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                                                prompt.target_found
                                                    ? 'bg-emerald-400/10 text-emerald-300'
                                                    : 'bg-white/[0.06] text-white/45'
                                            }`}
                                        >
                                            {prompt.target_found
                                                ? prompt.target_position != null
                                                    ? `Mention #${prompt.target_position}`
                                                    : 'Mention trouvee'
                                                : 'Aucune mention'}
                                        </div>
                                    </div>
                                    <div className="mt-3 text-sm text-white/45">
                                        Derniere mise a jour: {formatDateTime(prompt.last_run_at)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>

                <SectionCard
                    title="Sources les plus citees"
                    subtitle="Origines les plus souvent retrouvees dans les runs de visibilite"
                >
                    {dashboard.topSources.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-sm text-white/40">
                            Aucune source citee n est disponible pour le moment.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {dashboard.topSources.map((source) => (
                                <div
                                    key={`${source.host}-${source.count}`}
                                    className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                                >
                                    <div className="text-sm font-medium text-white">{source.host}</div>
                                    <div className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/65">
                                        {source.count} citation{source.count > 1 ? 's' : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </SectionCard>
            </div>
        </div>
    );
}
