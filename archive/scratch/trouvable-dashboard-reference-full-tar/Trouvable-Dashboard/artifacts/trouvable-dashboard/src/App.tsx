import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { AdminLayout } from "@/components/layout/AdminLayout";
import DashboardHome from "@/pages/dashboard";

import SeoVisibilityPage from "@/pages/seo/visibility";
import SeoHealthPage from "@/pages/seo/health";
import SeoCorrectionPromptsPage from "@/pages/seo/correction-prompts";
import SeoOnPagePage from "@/pages/seo/on-page";
import SeoContentPage from "@/pages/seo/content";
import SeoCannibalizationPage from "@/pages/seo/cannibalization";

import GeoOverviewPage from "@/pages/geo/overview";
import GeoPromptsPage from "@/pages/geo/prompts";
import GeoCrawlersPage from "@/pages/geo/crawlers";
import GeoModelsPage from "@/pages/geo/models";
import GeoSchemaPage from "@/pages/geo/schema";
import GeoConsistencyPage from "@/pages/geo/consistency";
import GeoAlertsPage from "@/pages/geo/alerts";
import GeoRunsPage from "@/pages/geo/runs";
import GeoComparePage from "@/pages/geo/compare";
import GeoSignalsPage from "@/pages/geo/signals";
import GeoSocialPage from "@/pages/geo/social";
import GeoOpportunitiesPage from "@/pages/geo/opportunities";
import GeoLlmsTxtPage from "@/pages/geo/llms-txt";
import GeoContinuousPage from "@/pages/geo/continuous";

import AgentOverviewPage from "@/pages/agent/overview";
import AgentActionabilityPage from "@/pages/agent/actionability";
import AgentReadinessPage from "@/pages/agent/readiness";
import AgentProtocolsPage from "@/pages/agent/protocols";
import AgentCompetitorsPage from "@/pages/agent/competitors";
import AgentFixesPage from "@/pages/agent/fixes";
import AgentVisibilityPage from "@/pages/agent/visibility";

import { CommandPageShell, CommandHeader, CommandMetricCard } from "@/components/command";

const queryClient = new QueryClient();

// Generic placeholder generator
const GenericPage = ({ eyebrow, title }: { eyebrow: string, title: string }) => (
  <CommandPageShell
    header={<CommandHeader eyebrow={eyebrow} title={title} subtitle="Page en cours de construction. Données simulées." />}
  >
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
       <CommandMetricCard label="Statut" value="Actif" tone="ok"/>
       <CommandMetricCard label="Mises à jour" value="12" />
       <CommandMetricCard label="Taux de complétion" value="85%" />
       <CommandMetricCard label="Alertes" value="0" />
    </div>
    <div className="mt-8 p-12 border border-dashed border-white/10 rounded-[22px] flex items-center justify-center">
       <span className="text-white/30 text-sm uppercase tracking-widest">{title} - Bientôt disponible</span>
    </div>
  </CommandPageShell>
);

function Router() {
  return (
    <AdminLayout>
      <Switch>
        <Route path="/" component={DashboardHome} />
        
        {/* SEO Ops */}
        <Route path="/clients/demo/seo/visibility" component={SeoVisibilityPage} />
        <Route path="/clients/demo/seo/health" component={SeoHealthPage} />
        <Route path="/clients/demo/seo/correction-prompts" component={SeoCorrectionPromptsPage} />
        <Route path="/clients/demo/seo/on-page" component={SeoOnPagePage} />
        <Route path="/clients/demo/seo/content" component={SeoContentPage} />
        <Route path="/clients/demo/seo/cannibalization" component={SeoCannibalizationPage} />
        
        {/* GEO Ops */}
        <Route path="/clients/demo/geo" component={GeoOverviewPage} />
        <Route path="/clients/demo/geo/crawlers" component={GeoCrawlersPage} />
        <Route path="/clients/demo/geo/schema" component={GeoSchemaPage} />
        <Route path="/clients/demo/geo/readiness"><GenericPage eyebrow="GEO Ops" title="Préparation GEO" /></Route>
        <Route path="/clients/demo/geo/consistency" component={GeoConsistencyPage} />
        <Route path="/clients/demo/geo/alerts" component={GeoAlertsPage} />
        <Route path="/clients/demo/geo/runs" component={GeoRunsPage} />
        <Route path="/clients/demo/geo/prompts" component={GeoPromptsPage} />
        <Route path="/clients/demo/geo/compare" component={GeoComparePage} />
        <Route path="/clients/demo/geo/signals" component={GeoSignalsPage} />
        <Route path="/clients/demo/geo/social" component={GeoSocialPage} />
        <Route path="/clients/demo/geo/opportunities" component={GeoOpportunitiesPage} />
        <Route path="/clients/demo/geo/llms-txt" component={GeoLlmsTxtPage} />
        <Route path="/clients/demo/geo/models" component={GeoModelsPage} />
        <Route path="/clients/demo/geo/continuous" component={GeoContinuousPage} />

        {/* AGENT Ops */}
        <Route path="/clients/demo/agent" component={AgentOverviewPage} />
        <Route path="/clients/demo/agent/visibility" component={AgentVisibilityPage} />
        <Route path="/clients/demo/agent/readiness" component={AgentReadinessPage} />
        <Route path="/clients/demo/agent/actionability" component={AgentActionabilityPage} />
        <Route path="/clients/demo/agent/protocols" component={AgentProtocolsPage} />
        <Route path="/clients/demo/agent/competitors" component={AgentCompetitorsPage} />
        <Route path="/clients/demo/agent/fixes" component={AgentFixesPage} />

        {/* Dossier Placeholders */}
        <Route path="/clients/demo/dossier"><GenericPage eyebrow="Dossier partagé" title="Vue dossier" /></Route>
        <Route path="/clients/demo/dossier/audit"><GenericPage eyebrow="Dossier partagé" title="Laboratoire audit" /></Route>
        <Route path="/clients/demo/dossier/audit/comparison"><GenericPage eyebrow="Dossier partagé" title="Comparaison audits" /></Route>
        <Route path="/clients/demo/dossier/activity"><GenericPage eyebrow="Dossier partagé" title="Activité" /></Route>
        <Route path="/clients/demo/dossier/connectors"><GenericPage eyebrow="Dossier partagé" title="Connecteurs" /></Route>
        <Route path="/clients/demo/dossier/settings"><GenericPage eyebrow="Dossier partagé" title="Paramètres" /></Route>
        <Route path="/clients/demo/portal"><GenericPage eyebrow="Dossier partagé" title="Restitution client" /></Route>
        
        <Route component={NotFound} />
      </Switch>
    </AdminLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
