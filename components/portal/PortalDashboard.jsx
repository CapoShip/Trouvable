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
        <div className="space-y-6">
            <PortalMandateHero
                client={client}
                visibility={visibility}
                completeness={completeness}
                membershipsCount={membershipsCount}
            />

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

            <div className="pt-2">
                <PortalSignalsPanel prompts={topTrackedPrompts} sources={topSources} />
            </div>

            <div className="pt-6">
                <PortalSupportForm
                    defaultEmail={viewerEmail}
                    clientLabel={clientSlug ? `${client.client_name} (${clientSlug})` : client.client_name}
                />
            </div>
        </div>
    );
}
