import PortalMandateHero from './PortalMandateHero';
import PortalExecutiveStrip from './PortalExecutiveStrip';
import PortalActivityStory from './PortalActivityStory';
import PortalPriorityBoard from './PortalPriorityBoard';
import PortalTrendPanel from './PortalTrendPanel';
import PortalMomentumStrip from './PortalMomentumStrip';
import PortalSignalsPanel from './PortalSignalsPanel';
import { buildNarrativeSummary } from '@/lib/portal-narrative';
import PortalSupportForm from './PortalSupportForm';
import { GoogleConnectButton } from '@/components/GoogleConnectButton';

export default function PortalDashboard({
    dashboard,
    membershipsCount = 1,
    viewerEmail = '',
    clientSlug = '',
    cloudflareBypassEnabled = false,
}) {
    const {
        client,
        visibility,
        completeness,
        trendSummary,
        recentWorkItems,
        nextPriorities,
        topTrackedPrompts,
        topSources,
        openOpportunitiesCount,
        periodNarrativeNote,
    } = dashboard;

    const narrativeSummary = buildNarrativeSummary({
        trendSummary,
        recentWorkItems,
        manualNote: periodNarrativeNote,
    });

    return (
        <div className="space-y-6">
            <PortalMandateHero
                client={client}
                visibility={visibility}
                completeness={completeness}
                membershipsCount={membershipsCount}
            />

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-relaxed text-white/80">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/40">
                    Compte rendu de la periode
                </h2>
                <p>{narrativeSummary}</p>
            </section>

            <div className="pt-1">
                <PortalExecutiveStrip
                    visibility={visibility}
                    completeness={completeness}
                    recentWorkItems={recentWorkItems}
                    trendSummary={trendSummary}
                />
            </div>

            <div className="pt-4">
                <PortalActivityStory items={recentWorkItems} />
            </div>

            <div className="pt-2">
                <PortalPriorityBoard priorities={nextPriorities} />
            </div>

            <div className="pt-4">
                <PortalTrendPanel trendSummary={trendSummary} />
            </div>

            <div className="pt-3">
                <PortalMomentumStrip
                    visibility={visibility}
                    openOpportunitiesCount={openOpportunitiesCount}
                    sparklines={trendSummary?.sparklines}
                />
            </div>

            <div className="pt-2">
                <PortalSignalsPanel prompts={topTrackedPrompts} sources={topSources} />
            </div>

            <div className="pt-4">
                <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-sm leading-relaxed text-white/80">
                    <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/40">
                        Accès aux données et Recherche
                    </h2>
                    <p className="mb-4 text-white/60">
                        Afin de permettre à Trouvable de synchroniser votre visibilité en temps réel depuis les moteurs de recherche, veuillez connecter votre compte administrateur ci-dessous.
                    </p>
                    <GoogleConnectButton clientId={client.id} returnTo={`/portal/${clientSlug}`} />
                </section>
            </div>

            <div className="pt-6">
                <PortalSupportForm
                    defaultEmail={viewerEmail}
                    clientLabel={clientSlug ? `${client.client_name} (${clientSlug})` : client.client_name}
                    cloudflareBypassEnabled={cloudflareBypassEnabled}
                />
            </div>
        </div>
    );
}
