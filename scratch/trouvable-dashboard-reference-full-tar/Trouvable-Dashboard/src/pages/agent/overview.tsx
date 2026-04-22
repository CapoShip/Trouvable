import React from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { CheckCircleIcon, XCircleIcon, HelpCircleIcon, AlertTriangleIcon, ActivityIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const CAPABILITIES = [
  'Authentification (OAuth)',
  'Serveur MCP',
  'Spécification OpenAPI',
  'Webhooks / Callbacks',
  'Idempotence garantie',
  'Rate Limits explicites',
  'Schema.org / JSON-LD',
  'Documentation Agentic'
];

const PLATFORMS = ['ChatGPT', 'Claude', 'Perplexity', 'Gemini', 'Custom MCP'];

const MATRIX = CAPABILITIES.map(cap => {
  const row: any = { name: cap };
  PLATFORMS.forEach(p => {
    const rand = Math.random();
    row[p] = rand > 0.7 ? 'unsupported' : rand > 0.5 ? 'partial' : rand > 0.1 ? 'supported' : 'unknown';
  });
  return row;
});

const LOGS = Array.from({ length: 15 }).map((_, i) => ({
  id: i,
  agent: ['GPT-4o Assistant', 'Claude 3.5 Desktop', 'Internal Zapier Agent'][Math.floor(Math.random() * 3)],
  action: ['Créer Devis', 'Lister Factures', 'Réserver Démo', 'Vérifier Stock'][Math.floor(Math.random() * 4)],
  endpoint: ['POST /api/v1/quotes', 'GET /api/v1/invoices', 'POST /api/v1/bookings', 'GET /api/v1/stock'][Math.floor(Math.random() * 4)],
  status: Math.random() > 0.2 ? 200 : 403,
  latency: Math.floor(Math.random() * 800) + 150,
  timeAgo: `${Math.floor(Math.random() * 50) + 1}m ago`
}));

export default function AgentOverviewPage() {
  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="AGENT Ops"
          title="Capacités Agentic"
          subtitle="Évaluation de votre infrastructure technique pour l'interaction avec des agents autonomes."
          actions={
            <button className={COMMAND_BUTTONS.primary}>Lancer un audit technique</button>
          }
        />
      }
    >
      {/* Hero Score */}
      <div className={cn(COMMAND_PANEL, "p-8 flex flex-col md:flex-row items-center gap-12 bg-gradient-to-r from-indigo-500/5 to-transparent")}>
        <div className="flex items-center gap-8 shrink-0">
          <div className="w-40 h-40 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{value: 74}, {value: 26}]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                  <Cell fill="#5b73ff" />
                  <Cell fill="rgba(255,255,255,0.05)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold tracking-tighter text-white">74</span>
              <span className="text-[10px] uppercase tracking-widest text-white/40">/ 100</span>
            </div>
          </div>
          <div>
            <h2 className="text-[28px] font-bold text-white tracking-tight mb-2">Score AGENT</h2>
            <p className="text-[14px] text-white/60 max-w-xs leading-relaxed">Votre infrastructure est globalement prête, mais manque de standards d'authentification pour les actions d'écriture.</p>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-8 md:pt-0 md:pl-12 w-full">
          {[
            { label: 'Découvrabilité', score: 92, color: 'text-emerald-400' },
            { label: 'Actionnabilité', score: 68, color: 'text-amber-400' },
            { label: 'Fiabilité', score: 85, color: 'text-emerald-400' },
            { label: 'Sécurité', score: 54, color: 'text-rose-400' },
          ].map(pillar => (
            <div key={pillar.label} className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-3">{pillar.label}</span>
              <div className="flex items-end gap-2">
                <span className={cn("text-[24px] font-bold tabular-nums leading-none", pillar.color)}>{pillar.score}</span>
                <span className="text-[10px] text-white/30 mb-1">/100</span>
              </div>
              <div className="h-1 bg-white/5 mt-3 rounded-full overflow-hidden">
                <div className="h-full bg-current rounded-full" style={{ width: `${pillar.score}%`, color: pillar.score > 80 ? '#34d399' : pillar.score > 60 ? '#fbbf24' : '#f43f5e' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Matrix */}
      <div className="mt-8">
        <h3 className="text-[14px] font-semibold text-white/90 mb-4 px-1">Matrice de Compatibilité par Plateforme</h3>
        <div className={cn(COMMAND_PANEL, "overflow-hidden")}>
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[#090a0b]/95 border-b border-white/[0.05]">
                <tr>
                  <th className="px-5 py-4 font-semibold text-white/40 w-64">Capacité Technique</th>
                  {PLATFORMS.map(p => (
                    <th key={p} className="px-5 py-4 font-semibold text-white/70 text-center w-32">{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {MATRIX.map((row) => (
                  <tr key={row.name} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 font-medium text-white/80">{row.name}</td>
                    {PLATFORMS.map(p => (
                      <td key={p} className="px-5 py-4 text-center">
                        <div className="flex justify-center">
                          {row[p] === 'supported' ? <CheckCircleIcon className="w-5 h-5 text-emerald-500/80" /> :
                           row[p] === 'partial' ? <AlertTriangleIcon className="w-5 h-5 text-amber-500/80" /> :
                           row[p] === 'unsupported' ? <XCircleIcon className="w-5 h-5 text-rose-500/80" /> :
                           <HelpCircleIcon className="w-5 h-5 text-white/20" />}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="mt-8">
        <h3 className="text-[14px] font-semibold text-white/90 mb-4 px-1 flex items-center gap-2"><ActivityIcon className="w-4 h-4 text-indigo-400" /> Live Agent Activity</h3>
        <div className={cn(COMMAND_PANEL, "overflow-hidden")}>
          <table className="w-full text-left text-[12px]">
            <tbody className="divide-y divide-white/[0.02]">
              {LOGS.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-white/60 w-48 truncate">{log.agent}</td>
                  <td className="px-5 py-3 text-white/90 font-medium">{log.action}</td>
                  <td className="px-5 py-3 text-indigo-300/70 font-mono text-[10px] truncate max-w-[200px]">{log.endpoint}</td>
                  <td className="px-5 py-3">
                    <span className={cn("px-2 py-0.5 rounded text-[10px] tabular-nums font-bold", 
                      log.status === 200 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    )}>{log.status}</span>
                  </td>
                  <td className="px-5 py-3 text-white/40 font-mono text-right">{log.latency}ms</td>
                  <td className="px-5 py-3 text-white/30 text-right w-24">{log.timeAgo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </CommandPageShell>
  );
}
