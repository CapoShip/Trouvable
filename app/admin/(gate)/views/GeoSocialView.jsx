'use client';

import Link from 'next/link';

import { useGeoClient, useGeoWorkspaceSlice } from '../context/ClientContext';
import { GeoEmptyPanel, GeoKpiCard, GeoPremiumCard, GeoProvenancePill, GeoSectionTitle } from '../components/GeoPremium';

function formatDateTime(value) {
    if (!value) return '-';
    try {
        return new Date(value).toLocaleString('fr-CA', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return '-';
    }
}

function evidenceToneClass(level) {
    if (level === 'strong') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300';
    if (level === 'medium') return 'border-violet-400/20 bg-violet-400/10 text-violet-300';
    return 'border-amber-400/20 bg-amber-400/10 text-amber-300';
}

function EvidencePill({ level }) {
    if (!level) return null;
    return (
        <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${evidenceToneClass(level)}`}>
            preuve {level}
        </span>
    );
}

function ExternalInsightList({ title, subtitle, items = [], emptyTitle, emptyDescription }) {
    return (
        <GeoPremiumCard className="p-5">
            <div className="mb-3">
                <div className="text-sm font-semibold text-white/95">{title}</div>
                {subtitle ? <div className="text-[11px] text-white/35 mt-1">{subtitle}</div> : null}
            </div>

            {items.length === 0 ? (
                <GeoEmptyPanel title={emptyTitle} description={emptyDescription} />
            ) : (
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <div key={`${item.label || item.title || 'item'}-${index}`} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold text-white/90 break-words">{item.label || item.title || 'Signal'}</div>
                                    {item.rationale ? <div className="text-[11px] text-white/45 mt-1">{item.rationale}</div> : null}
                                    {item.subreddits?.length ? <div className="text-[11px] text-white/35 mt-1">{item.subreddits.map((subreddit) => `r/${subreddit}`).join(' - ')}</div> : null}
                                </div>
                                <div className="text-right shrink-0 space-y-1">
                                    {item.count != null ? <div className="text-[11px] font-semibold text-white/70">{item.count} mentions</div> : null}
                                    {item.mention_count != null ? <div className="text-[11px] font-semibold text-white/70">{item.mention_count} signaux</div> : null}
                                    <EvidencePill level={item.evidence_level} />
                                </div>
                            </div>
                            {item.example ? (
                                <a
                                    href={item.example}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex mt-2 text-[11px] font-semibold text-sky-300 hover:text-sky-200"
                                >
                                    Discussion source
                                </a>
                            ) : null}
                        </div>
                    ))}
                </div>
            )}
        </GeoPremiumCard>
    );
}

function connectionLabel(status) {
    if (status === 'connected') return 'connecte';
    if (status === 'error') return 'erreur';
    if (status === 'not_connected') return 'non connecte';
    return status || 'inconnu';
}

export default function GeoSocialView() {
    const { client, clientId, loading } = useGeoClient();
    const { data, loading: sliceLoading, error } = useGeoWorkspaceSlice('social');
    const baseHref = clientId ? `/admin/clients/${clientId}` : '/admin/clients';

    if (loading || sliceLoading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    }

    if (!data) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <GeoEmptyPanel title="Veille Reddit indisponible" description="La tranche n’a pas pu être chargée (erreur API ou droits). Ce n’est pas une preuve d’absence de discussions sur votre marque." />
            </div>
        );
    }

    const connection = data.connection || {};
    const summary = data.summary || {};
    const isConnected = connection.status === 'connected';
    const isError = connection.status === 'error';
    const connectorOff = connection.status === 'not_connected';
    const shouldShowEmpty = !isConnected || summary.total_discussions === 0;

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title="Veille Reddit (externe)"
                subtitle={`Lecture opérateur limitée à la recherche Reddit via seeds profil — pas une veille LinkedIn/X/Instagram. ${client?.client_name || 'Client'} : interprétez les zéros comme « collecte inactive ou vide », pas comme vérité marché absolue.`}
                action={(
                    <div className="flex flex-wrap gap-2">
                        <GeoProvenancePill meta={data.provenance?.observation} />
                        <GeoProvenancePill meta={data.provenance?.inferred} />
                        <GeoProvenancePill meta={data.provenance?.not_connected} />
                    </div>
                )}
            />

            <GeoPremiumCard className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${isConnected ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : isError ? 'border-red-400/20 bg-red-400/10 text-red-300' : 'border-white/10 bg-white/[0.04] text-white/60'}`}>
                        {connectionLabel(connection.status)}
                    </span>
                    <span className="text-[12px] text-white/75">{connection.message || 'Aucun statut de connexion disponible.'}</span>
                </div>
                {connection.caveat ? <div className="text-[11px] text-white/45 mt-2">{connection.caveat}</div> : null}
                {connection.requirement ? <div className="text-[11px] text-white/45 mt-1">Prerequis: {connection.requirement}</div> : null}
                {connection.detail ? <div className="text-[11px] text-red-300 mt-1">Détail: {connection.detail}</div> : null}
            </GeoPremiumCard>

            {!connectorOff && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <GeoKpiCard label="Discussions observées" value={summary.total_discussions ?? 0} hint="Recherche Reddit (seeds)" accent="blue" />
                    <GeoKpiCard label="Communautes source" value={summary.unique_sources ?? 0} hint="Subreddits agrégés" accent="violet" />
                    <GeoKpiCard label="Plaintes" value={data.topComplaints?.length ?? 0} hint="Patterns dérivés des posts" accent="amber" />
                    <GeoKpiCard label="Questions" value={data.topQuestions?.length ?? 0} hint="Patterns dérivés des posts" accent="emerald" />
                </div>
            )}

            {connectorOff && (
                <GeoPremiumCard className="p-4 border border-white/[0.08] bg-white/[0.02]">
                    <div className="text-[11px] font-semibold text-white/70 mb-1">Pourquoi tout est à zéro</div>
                    <p className="text-[11px] text-white/45 leading-relaxed">
                        Le connecteur Reddit est désactivé sur cet environnement : aucune métrique ci-dessous ne reflète votre notoriété réelle.
                        Les boutons « Ajuster les prompts » concernent le moteur GEO, pas cette veille — utilisez-les seulement pour cohérence navigation.
                    </p>
                </GeoPremiumCard>
            )}

            <GeoPremiumCard className="p-5">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div>
                        <div className="text-sm font-semibold text-white/95">Contexte de couverture seedee</div>
                        <p className="text-[11px] text-white/35">
                            Genere le {formatDateTime(summary.generated_at)} à partir des seeds relies au profil client et au contexte du site.
                        </p>
                    </div>
                </div>
                <div className="text-[11px] text-white/45 break-words">
                    Seeds: {(summary.query_seeds || []).join(' - ') || 'Aucun seed pour le moment'}
                </div>
                <div className="text-[11px] text-white/45 mt-1">
                    Contexte site: {(summary.site_context?.business_type || 'type inconnu')} - {(summary.site_context?.city || 'localisation inconnue')}
                </div>
            </GeoPremiumCard>

            {shouldShowEmpty ? (
                <GeoPremiumCard className="p-6">
                    <GeoEmptyPanel
                        title={data.emptyState?.title || 'Aucune discussion externe observée'}
                        description={data.emptyState?.description || "Aucune discussion externe n'a été observée sur le scope seed actuel."}
                    >
                        <div className="flex gap-2 flex-wrap">
                            {connectorOff ? (
                                <>
                                    <Link href={`${baseHref}/settings`} className="geo-btn geo-btn-pri">
                                        Profil client (enrichir les seeds)
                                    </Link>
                                    <Link href={`${baseHref}/overview`} className="geo-btn geo-btn-ghost">
                                        Vue d&apos;ensemble
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href={`${baseHref}/settings`} className="geo-btn geo-btn-ghost">
                                        Profil client
                                    </Link>
                                    <Link href={`${baseHref}/overview`} className="geo-btn geo-btn-pri">
                                        Vue d&apos;ensemble
                                    </Link>
                                </>
                            )}
                        </div>
                    </GeoEmptyPanel>
                </GeoPremiumCard>
            ) : (
                <>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <ExternalInsightList
                            title="Plaintes recurrentes"
                            subtitle="Observees en externe et groupees par labels récurrents."
                            items={data.topComplaints || []}
                            emptyTitle="Aucun cluster de plainte"
                            emptyDescription="Aucun motif de plainte recurrent détecté sur le jeu observé actuel."
                        />
                        <ExternalInsightList
                            title="Questions recurrentes"
                            subtitle="Patterns de questions utiles pour la couverture FAQ."
                            items={data.topQuestions || []}
                            emptyTitle="Aucun cluster de question"
                            emptyDescription="Aucun motif de question recurrent détecté sur le jeu observé actuel."
                        />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <ExternalInsightList
                            title="Themes de discussion"
                            subtitle="Themes récurrents inférés'à partir du texte observé."
                            items={data.topThemes || []}
                            emptyTitle="Aucun theme"
                            emptyDescription="L'extraction de themes demande des occurrences repetees sur les discussions observées."
                        />
                        <ExternalInsightList
                            title="Langage communautaire"
                            subtitle="Langage utilise dans les discussions publiques observées."
                            items={data.communityLanguage || []}
                            emptyTitle="Aucun cluster de langage"
                            emptyDescription="Le langage communautaire apparait des qu'un volume suffisant est observé."
                        />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <ExternalInsightList
                            title="Communautes source"
                            subtitle="Communautes qui portent actuellement le volume de discussions observées."
                            items={(data.sourceBuckets || []).map((item) => ({ ...item, label: item.source }))}
                            emptyTitle="Aucune communaute source"
                            emptyDescription="Aucune communaute source n'a été observée dans la fenetre seed actuelle."
                        />
                        <ExternalInsightList
                            title="Plaintes concurrentielles"
                            subtitle="Plaintes de type comparaison ou des angles de differenciation peuvent etre positionnes."
                            items={data.competitorComplaints || []}
                            emptyTitle="Aucune plainte concurrentielle"
                            emptyDescription="Aucun pattern de plainte axe concurrent n'a été détecté."
                        />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <ExternalInsightList
                            title="Opportunités FAQ"
                            subtitle="Opportunités inférées depuis les questions externes recurrentes."
                            items={data.faqOpportunities || []}
                            emptyTitle="Aucune opportunité FAQ"
                            emptyDescription="Aucune opportunité FAQ n'a pu etre inférée depuis les preuves actuelles."
                        />
                        <ExternalInsightList
                            title="Opportunités contenu"
                            subtitle="Angles de contenu infers depuis les plaintes et themes observés."
                            items={data.contentOpportunities || []}
                            emptyTitle="Aucune opportunité contenu"
                            emptyDescription="Aucune opportunité contenu n'a pu etre dérivée des preuves actuelles."
                        />
                        <ExternalInsightList
                            title="Angles de differenciation"
                            subtitle="Pistes de positionnement operateur inférées depuis les clusters de plaintes."
                            items={data.differentiationAngles || []}
                            emptyTitle="Aucun angle de differenciation"
                            emptyDescription="Aucune suggestion de differenciation n'a été dérivée des preuves actuelles."
                        />
                    </div>
                </>
            )}
        </div>
    );
}

