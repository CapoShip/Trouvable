import { Link } from 'wouter';
import { 
  CommandPageShell, 
  CommandHeader, 
  CommandMetricCard,
} from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';

const MOCK_CLIENTS = [
  { id: 'demo', client_name: 'Acme Corp (Demo)', operatorSignals: { attention: 'critical', activePrompts: 124, openOpportunities: 8, completedRunsWindow: 4, reasons: ['Baisse GEO ChatGPT', 'Signaux faibles'] } },
  { id: 'client-2', client_name: 'TechFlow Inc', operatorSignals: { attention: 'needs_attention', activePrompts: 86, openOpportunities: 3, completedRunsWindow: 2, reasons: ['Schema errors'] } },
  { id: 'client-3', client_name: 'GlobalRetail', operatorSignals: { attention: 'watch', activePrompts: 412, openOpportunities: 12, completedRunsWindow: 14 } },
  { id: 'client-4', client_name: 'SaaS Platform', operatorSignals: { attention: 'stable', activePrompts: 56, openOpportunities: 0, completedRunsWindow: 5 } },
  { id: 'client-5', client_name: 'E-commerce Plus', operatorSignals: { attention: 'stable', activePrompts: 890, openOpportunities: 1, completedRunsWindow: 20 } },
];

const KPI_TONE = {
  default: 'neutral',
  blue: 'info',
  critical: 'critical',
  warning: 'warning',
  success: 'ok',
};

function HealthBar({ rows }: { rows: any[] }) {
  const buckets = [
    { key: 'critical', label: 'Critique', color: '#f87171' },
    { key: 'needs_attention', label: 'Action requise', color: '#fbbf24' },
    { key: 'watch', label: 'Surveillance', color: 'rgba(255,255,255,0.3)' },
    { key: 'stable', label: 'Stable', color: '#34d399' },
  ];
  
  const counts: Record<string, number> = {};
  buckets.forEach((b) => { counts[b.key] = rows.filter((r) => (r.operatorSignals?.attention || 'stable') === b.key).length; });
  const total = rows.length || 1;
  const activeBuckets = buckets.filter((b) => counts[b.key] > 0);
  
  if (activeBuckets.length <= 1) return null;

  return (
    <div className={cn(COMMAND_PANEL, 'px-5 py-4')}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/[0.4] mb-3">
        Santé du portefeuille
      </div>
      <div className="flex h-[8px] overflow-hidden rounded-full bg-white/[0.03] mb-3">
        {buckets.map((bucket) => {
          const pct = (counts[bucket.key] / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={bucket.key}
              className="h-full transition-all duration-700"
              style={{ width: `${pct}%`, background: bucket.color, opacity: 0.65, marginRight: 1 }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {buckets.map((bucket) => {
          if (counts[bucket.key] === 0) return null;
          const pct = Math.round((counts[bucket.key] / total) * 100);
          return (
            <div key={bucket.key} className="flex items-center gap-2 text-[10px]">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: bucket.color, opacity: 0.7 }} />
              <span className="text-white/40">{bucket.label}</span>
              <span className="font-bold tabular-nums text-white/65">{counts[bucket.key]}</span>
              <span className="text-white/20">({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FreshnessGrid() {
  return (
    <div className={cn(COMMAND_PANEL, 'px-5 py-4')}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/[0.4] mb-3">Fraîcheur des données</div>
      <div className="grid grid-cols-4 gap-3 text-center">
        <div>
          <div className="text-[18px] font-bold tabular-nums text-emerald-300">3</div>
          <div className="text-[9px] text-white/25 mt-0.5">{'< 24h'}</div>
        </div>
        <div>
          <div className="text-[18px] font-bold tabular-nums text-amber-300">2</div>
          <div className="text-[9px] text-white/25 mt-0.5">24-72h</div>
        </div>
        <div>
          <div className="text-[18px] font-bold tabular-nums text-red-300">0</div>
          <div className="text-[9px] text-white/25 mt-0.5">{'> 72h'}</div>
        </div>
        <div>
          <div className="text-[18px] font-bold tabular-nums text-white/30">0</div>
          <div className="text-[9px] text-white/25 mt-0.5">Aucune exécution</div>
        </div>
      </div>
    </div>
  );
}

function AttentionDot({ attention }: { attention: string }) {
  const colors: Record<string, string> = { critical: 'bg-red-400', needs_attention: 'bg-amber-400', watch: 'bg-white/30', stable: 'bg-emerald-400' };
  return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors[attention] || colors.stable} ${attention === 'critical' ? 'cmd-health-dot' : ''}`} />;
}

export default function DashboardHome() {
  const clients = MOCK_CLIENTS;
  
  const criticalCount = clients.filter((c) => c.operatorSignals?.attention === 'critical').length;
  const attentionCount = clients.filter((c) => c.operatorSignals?.attention === 'needs_attention').length;
  const stableCount = clients.filter((c) => c.operatorSignals?.attention === 'stable').length;
  const totalActions = clients.reduce((sum, c) => sum + (c.operatorSignals?.openOpportunities ?? 0), 0);
  
  const priorityClients = clients.filter((c) => c.operatorSignals?.attention === 'critical' || c.operatorSignals?.attention === 'needs_attention').slice(0, 8);

  const header = (
    <CommandHeader
      eyebrow="Centre de commande"
      title="Tableau de bord"
      subtitle="Triage portefeuille, mandats critiques, fraîcheur des données et prochaines actions."
      actions={(
        <>
          <Link href="/clients" className={COMMAND_BUTTONS.secondary}>
            Portefeuille
          </Link>
          <Link href="/clients/new" className={COMMAND_BUTTONS.primary}>
            Nouveau mandat
          </Link>
        </>
      )}
    />
  );

  return (
    <CommandPageShell header={header}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        <CommandMetricCard label="Mandats actifs" value={clients.length} tone={KPI_TONE.blue} />
        <CommandMetricCard
          label="Critiques"
          value={criticalCount}
          tone={criticalCount > 0 ? KPI_TONE.critical : KPI_TONE.default}
        />
        <CommandMetricCard
          label="Actions requises"
          value={attentionCount}
          tone={attentionCount > 0 ? KPI_TONE.warning : KPI_TONE.default}
        />
        <CommandMetricCard label="Stables" value={stableCount} tone={KPI_TONE.success} />
        <CommandMetricCard label="Actions en file" value={totalActions} tone={KPI_TONE.default} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <HealthBar rows={clients} />
        <FreshnessGrid />
      </div>

      {priorityClients.length > 0 && (
        <div className={cn(COMMAND_PANEL, 'overflow-hidden p-0')}>
          <div className="px-5 py-3.5 border-b border-white/[0.05]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/[0.4]">Mandats prioritaires</div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {priorityClients.map((c) => {
              const s = c.operatorSignals;
              return (
                <Link
                  key={c.id}
                  href={`/clients/demo/dossier`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.025] transition-colors group"
                >
                  <AttentionDot attention={s?.attention} />
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-semibold text-white/85 group-hover:text-[#a78bfa] transition-colors truncate block">
                      {c.client_name}
                    </span>
                    <span className="text-[10px] text-white/25 mt-0.5 block">
                      {s?.activePrompts ?? 0} prompts · {s?.openOpportunities ?? 0} actions · {s?.completedRunsWindow ?? 0} exécutions / 21 j
                    </span>
                  </div>
                  {s?.reasons && s.reasons.length > 0 && (
                    <div className="hidden sm:flex flex-wrap gap-1 shrink-0">
                      {s.reasons.slice(0, 3).map((r: string) => (
                        <span key={r} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30 border border-white/[0.05]">{r}</span>
                      ))}
                    </div>
                  )}
                  <svg className="w-4 h-4 text-white/15 group-hover:text-white/35 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </CommandPageShell>
  );
}
