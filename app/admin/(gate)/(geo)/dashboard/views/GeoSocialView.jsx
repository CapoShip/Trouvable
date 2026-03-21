'use client';

import Link from 'next/link';

import { useGeoClient, useGeoWorkspaceSlice } from '../../context/GeoClientContext';
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
            {level} evidence
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
                                    <div className="text-sm font-semibold text-white/90 break-words">{item.label || item.title || 'Insight'}</div>
                                    {item.rationale ? <div className="text-[11px] text-white/45 mt-1">{item.rationale}</div> : null}
                                    {item.subreddits?.length ? <div className="text-[11px] text-white/35 mt-1">{item.subreddits.map((subreddit) => `r/${subreddit}`).join(' • ')}</div> : null}
                                </div>
                                <div className="text-right shrink-0 space-y-1">
                                    {item.count != null ? <div className="text-[11px] font-semibold text-white/70">{item.count} mentions</div> : null}
                                    {item.mention_count != null ? <div className="text-[11px] font-semibold text-white/70">{item.mention_count} signals</div> : null}
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
                                    Source thread
                                </a>
                            ) : null}
                        </div>
                    ))}
                </div>
            )}
        </GeoPremiumCard>
    );
}

export default function GeoSocialView() {
    const { client, clientId, loading } = useGeoClient();
    const { data, loading: sliceLoading, error } = useGeoWorkspaceSlice('social');
    const baseHref = clientId ? `/admin/dashboard/${clientId}` : '/admin/dashboard';

    if (loading || sliceLoading) {
        return <div className="p-8 text-center text-[var(--geo-t3)] text-sm">Chargement...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-400 text-sm">{error}</div>;
    }

    if (!data) {
        return (
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                <GeoEmptyPanel title="Social view unavailable" description="The external discovery slice could not be loaded." />
            </div>
        );
    }

    const connection = data.connection || {};
    const summary = data.summary || {};
    const isConnected = connection.status === 'connected';
    const isError = connection.status === 'error';
    const shouldShowEmpty = !isConnected || summary.total_discussions === 0;

    return (
        <div className="p-4 md:p-6 space-y-5 max-w-[1600px] mx-auto">
            <GeoSectionTitle
                title="External discovery"
                subtitle={`Operator-only community intelligence for ${client?.client_name || 'this client'}. Signals are evidence-scoped and never presented as universal market truth.`}
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
                        {connection.status || 'unknown'}
                    </span>
                    <span className="text-[12px] text-white/75">{connection.message || 'No connection status available.'}</span>
                </div>
                {connection.caveat ? <div className="text-[11px] text-white/45 mt-2">{connection.caveat}</div> : null}
                {connection.requirement ? <div className="text-[11px] text-white/45 mt-1">Setup: {connection.requirement}</div> : null}
                {connection.detail ? <div className="text-[11px] text-red-300 mt-1">Detail: {connection.detail}</div> : null}
            </GeoPremiumCard>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <GeoKpiCard label="Discussions observed" value={summary.total_discussions ?? 0} hint="Observed externally (seed-based)" accent="blue" />
                <GeoKpiCard label="Source communities" value={summary.unique_sources ?? 0} hint="Bucketed by community host" accent="violet" />
                <GeoKpiCard label="Complaints" value={data.topComplaints?.length ?? 0} hint="Recurring complaint patterns" accent="amber" />
                <GeoKpiCard label="Questions" value={data.topQuestions?.length ?? 0} hint="Recurring question patterns" accent="emerald" />
            </div>

            <GeoPremiumCard className="p-5">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div>
                        <div className="text-sm font-semibold text-white/95">Seeded coverage context</div>
                        <p className="text-[11px] text-white/35">
                            Generated at {formatDateTime(summary.generated_at)} from query seeds tied to client profile and site context.
                        </p>
                    </div>
                </div>
                <div className="text-[11px] text-white/45 break-words">
                    Seeds: {(summary.query_seeds || []).join(' • ') || 'No seeds yet'}
                </div>
                <div className="text-[11px] text-white/45 mt-1">
                    Site context: {(summary.site_context?.business_type || 'unknown type')} • {(summary.site_context?.city || 'unknown location')}
                </div>
            </GeoPremiumCard>

            {shouldShowEmpty ? (
                <GeoPremiumCard className="p-6">
                    <GeoEmptyPanel
                        title={data.emptyState?.title || 'No external discussion data yet'}
                        description={data.emptyState?.description || 'No external discussions have been observed for the current seeded scope.'}
                    >
                        <div className="flex gap-2 flex-wrap">
                            <Link href={`${baseHref}?view=prompts`} className="geo-btn geo-btn-pri">
                                Tune prompts first
                            </Link>
                            <Link href={`${baseHref}?view=overview`} className="geo-btn geo-btn-ghost">
                                Back to overview
                            </Link>
                        </div>
                    </GeoEmptyPanel>
                </GeoPremiumCard>
            ) : (
                <>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <ExternalInsightList
                            title="Recurring complaints"
                            subtitle="Observed externally and grouped by recurring labels."
                            items={data.topComplaints || []}
                            emptyTitle="No complaint clusters yet"
                            emptyDescription="No recurring complaint labels were detected in the current observed discussion set."
                        />
                        <ExternalInsightList
                            title="Recurring questions"
                            subtitle="Question patterns suitable for FAQ coverage."
                            items={data.topQuestions || []}
                            emptyTitle="No recurring questions yet"
                            emptyDescription="No recurring question patterns were detected in the current observed set."
                        />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <ExternalInsightList
                            title="Discussion themes"
                            subtitle="Token-level recurring discussion themes (inferred from observed text)."
                            items={data.topThemes || []}
                            emptyTitle="No themes yet"
                            emptyDescription="Theme extraction requires repeated terms across observed discussions."
                        />
                        <ExternalInsightList
                            title="Community language"
                            subtitle="Language users actually use in public discussions."
                            items={data.communityLanguage || []}
                            emptyTitle="No language clusters yet"
                            emptyDescription="Community language will appear once enough discussions are observed."
                        />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <ExternalInsightList
                            title="Source buckets"
                            subtitle="Top communities currently driving observed discussion volume."
                            items={(data.sourceBuckets || []).map((item) => ({ ...item, label: item.source }))}
                            emptyTitle="No source buckets yet"
                            emptyDescription="No source communities were observed in the current seed window."
                        />
                        <ExternalInsightList
                            title="Competitor complaints"
                            subtitle="Comparison-style complaints where differentiation can be positioned."
                            items={data.competitorComplaints || []}
                            emptyTitle="No competitor complaint clusters yet"
                            emptyDescription="No competitor-framed complaint patterns were detected."
                        />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <ExternalInsightList
                            title="FAQ opportunities"
                            subtitle="Inferred opportunities from recurring external questions."
                            items={data.faqOpportunities || []}
                            emptyTitle="No FAQ opportunities yet"
                            emptyDescription="No FAQ opportunities were inferred from current question evidence."
                        />
                        <ExternalInsightList
                            title="Content opportunities"
                            subtitle="Inferred content angles from complaints and themes."
                            items={data.contentOpportunities || []}
                            emptyTitle="No content opportunities yet"
                            emptyDescription="No content opportunity set could be derived from current evidence."
                        />
                        <ExternalInsightList
                            title="Differentiation angles"
                            subtitle="Operator positioning opportunities inferred from complaint clusters."
                            items={data.differentiationAngles || []}
                            emptyTitle="No differentiation angles yet"
                            emptyDescription="No differentiation suggestions were derived from current evidence."
                        />
                    </div>
                </>
            )}
        </div>
    );
}
