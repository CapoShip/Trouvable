import PortalMandateHero from './PortalMandateHero';
import PortalExecutiveStrip from './PortalExecutiveStrip';
import PortalActivityStory from './PortalActivityStory';
import PortalPriorityBoard from './PortalPriorityBoard';
import PortalTrendPanel from './PortalTrendPanel';
import PortalSignalsPanel from './PortalSignalsPanel';
import PortalSupportForm from './PortalSupportForm';

export default function PortalDashboard({ dashboard, membershipsCount = 1, viewerEmail = '', clientSlug = '' }) {
    const {
        client,
        visibility,
        completeness,
        trendSummary,
        recentWorkItems,
        nextPriorities,
        topTrackedPrompts,
        topSources,
    } = dashboard;

    return (
        <div className="space-y-8">
            <PortalMandateHero
                client={client}
                visibility={visibility}
                completeness={completeness}
                membershipsCount={membershipsCount}
            />

            <PortalExecutiveStrip
                visibility={visibility}
                completeness={completeness}
                recentWorkItems={recentWorkItems}
                trendSummary={trendSummary}
            />

            <PortalActivityStory items={recentWorkItems} />

            <PortalPriorityBoard priorities={nextPriorities} />

            <PortalTrendPanel trendSummary={trendSummary} />

            <PortalSignalsPanel prompts={topTrackedPrompts} sources={topSources} />

            <PortalSupportForm
                defaultEmail={viewerEmail}
                clientLabel={clientSlug ? `${client.client_name} (${clientSlug})` : client.client_name}
            />
        </div>
    );
}
