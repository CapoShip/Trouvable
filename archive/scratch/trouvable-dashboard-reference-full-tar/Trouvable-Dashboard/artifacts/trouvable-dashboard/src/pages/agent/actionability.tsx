import React, { useState } from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area, Tooltip as RechartsTooltip } from 'recharts';
import { ArrowUpRightIcon, ServerIcon, CheckCircleIcon, XCircleIcon, ClockIcon, RotateCcwIcon, ZapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HERO_DATA = Array.from({ length: 30 }).map((_, i) => ({
  date: `J-${30-i}`,
  value: 40 + (i * 1.2) + Math.random() * 15
}));

const ACTIONS = [
  { id: 'reserver', name: 'Réserver une table', path: 'POST /api/bookings' },
  { id: 'acheter', name: 'Acheter un produit', path: 'POST /api/checkout' },
  { id: 'contacter', name: 'Contacter support', path: 'POST /api/tickets' },
  { id: 'devis', name: 'Demander un devis', path: 'POST /api/quotes' },
  { id: 'rdv', name: 'Prendre RDV', path: 'POST /api/calendar/slots' },
  { id: 'retour', name: 'Retourner commande', path: 'POST /api/orders/{id}/returns' },
  { id: 'suivi', name: 'Suivre commande', path: 'GET /api/orders/{id}/tracking' },
  { id: 'inscription', name: 'S\'inscrire', path: 'POST /api/users/register' },
];

const PLATFORMS = [
  { id: 'gpt', name: 'ChatGPT' },
  { id: 'claude', name: 'Claude' },
  { id: 'gemini', name: 'Gemini' },
  { id: 'perplexity', name: 'Perplexity' },
  { id: 'custom', name: 'Custom (API)' },
];

// Generate Grid Data
const GRID_DATA: Record<string, Record<string, any>> = {};
ACTIONS.forEach(action => {
  GRID_DATA[action.id] = {};
  PLATFORMS.forEach(plat => {
    const successRate = Math.floor(Math.random() * 60) + 40; // 40-100%
    GRID_DATA[action.id][plat.id] = {
      successRate,
      latency: (Math.random() * 2 + 0.5).toFixed(1),
      time: `${Math.floor(Math.random() * 24) + 1}h`,
      status: successRate > 85 ? 'ok' : successRate > 60 ? 'warn' : 'error'
    };
  });
});

const DRILLDOWN_LOGS = Array.from({ length: 10 }).map((_, i) => {
  const isError = Math.random() > 0.7;
  return {
    id: `req-${1000 + i}`,
    time: new Date(Date.now() - i * 3600000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    agent: PLATFORMS[Math.floor(Math.random() * PLATFORMS.length)].name,
    status: isError ? 'error' : 'success',
    msg: isError ? ['Missing required field "date"', 'Invalid auth token', 'Rate limit exceeded'][Math.floor(Math.random() * 3)] : '201 Created',
    latency: Math.floor(Math.random() * 800) + 200
  };
});

export default function AgentActionabilityPage() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="AGENT Ops"
          title="Actionnabilité IA"
          subtitle="Taux de succès des agents IA essayant d'interagir avec vos systèmes transactionnels."
          actions={
            <div className="flex gap-2">
              <button className={COMMAND_BUTTONS.secondary}>Rapport d'Erreurs</button>
              <button className={COMMAND_BUTTONS.primary}><ZapIcon className="w-3.5 h-3.5 mr-1" /> Re-tester tout</button>
            </div>
          }
        />
      }
    >
      {/* Hero KPI with background chart */}
      <div className={cn(COMMAND_PANEL, "relative overflow-hidden p-6 lg:p-8 flex items-center justify-between border-indigo-500/20 bg-indigo-900/5")}>
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={HERO_DATA}>
              <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={3} dot={false} isAnimationActive={true} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="relative z-10">
          <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-indigo-300 mb-2">Taux de succès global (Actions)</div>
          <div className="flex items-baseline gap-4">
            <span className="text-[64px] font-bold tracking-tighter text-white tabular-nums leading-none">67<span className="text-[32px] text-white/50">%</span></span>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[12px] font-bold shadow-[0_0_15px_rgba(52,211,153,0.2)]">
              <ArrowUpRightIcon className="w-4 h-4" /> +8% vs last month
            </div>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mt-6">
        <CommandMetricCard label="Tests exécutés (7j)" value="1,240" detail="Simulations automatisées" tone="info" />
        <CommandMetricCard label="Réussis" value="831" detail="Actions complétées" tone="ok" />
        <CommandMetricCard label="Échecs" value="409" detail="Erreurs bloquantes" tone="critical" />
        <CommandMetricCard label="Latence (p95)" value="2.4s" detail="Temps d'exécution total" tone="warning" />
      </div>

      {/* Benchmark Grid */}
      <div className={cn(COMMAND_PANEL, "mt-6 p-0 overflow-hidden")}>
        <div className="p-5 border-b border-white/[0.05] flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-white/90">Benchmark d'Exécution par Action</h3>
          <span className="text-[11px] text-white/40">Cliquez sur une ligne pour voir les logs</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                <th className="px-5 py-4 font-medium text-white/40 w-[240px]">Action Cible</th>
                {PLATFORMS.map(plat => (
                  <th key={plat.id} className="px-4 py-4 font-medium text-white/70 text-center">{plat.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {ACTIONS.map((action, i) => {
                const isSelected = selectedAction === action.id;
                return (
                  <React.Fragment key={action.id}>
                    <motion.tr 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedAction(isSelected ? null : action.id)}
                      className={cn(
                        "cursor-pointer transition-colors group",
                        isSelected ? "bg-indigo-500/5 border-l-2 border-l-indigo-500" : "hover:bg-white/[0.02] border-l-2 border-l-transparent"
                      )}
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-white/90 mb-1">{action.name}</div>
                        <div className="text-[10px] font-mono text-white/40 bg-white/5 inline-block px-1.5 py-0.5 rounded">{action.path}</div>
                      </td>
                      {PLATFORMS.map(plat => {
                        const cell = GRID_DATA[action.id][plat.id];
                        const isHovered = hoveredCell === `${action.id}-${plat.id}`;
                        return (
                          <td 
                            key={plat.id} 
                            className="px-4 py-4 text-center relative"
                            onMouseEnter={() => setHoveredCell(`${action.id}-${plat.id}`)}
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            <div className="flex flex-col items-center gap-1.5">
                              <span className={cn("text-[18px] font-bold tabular-nums tracking-tight", 
                                cell.status === 'ok' ? 'text-emerald-400' :
                                cell.status === 'warn' ? 'text-amber-400' : 'text-rose-400'
                              )}>
                                {cell.successRate}%
                              </span>
                              <div className="flex items-center gap-2 text-[9px] text-white/30 font-mono">
                                <span>{cell.latency}s</span>
                                <span>&bull;</span>
                                <span>-{cell.time}</span>
                              </div>
                            </div>

                            <AnimatePresence>
                              {isHovered && !isSelected && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  className="absolute inset-0 bg-[#141720]/95 backdrop-blur-sm flex items-center justify-center rounded-lg m-1 border border-white/10 z-10 shadow-xl"
                                >
                                  <button className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-300 hover:text-indigo-200 transition-colors bg-indigo-500/20 px-3 py-1.5 rounded-md">
                                    <RotateCcwIcon className="w-3 h-3" /> Re-tester
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </td>
                        );
                      })}
                    </motion.tr>
                    
                    {/* Drill-down Panel */}
                    <AnimatePresence>
                      {isSelected && (
                        <tr className="bg-black/20 border-b-2 border-b-indigo-500/20 shadow-inner">
                          <td colSpan={PLATFORMS.length + 1} className="p-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
                                {/* Left: Logs */}
                                <div className="lg:col-span-3">
                                  <h4 className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                                    <ServerIcon className="w-3.5 h-3.5" /> Dernières tentatives ({action.name})
                                  </h4>
                                  <div className="bg-[#090b10] rounded-xl border border-white/[0.05] overflow-hidden">
                                    <table className="w-full text-left text-[11px]">
                                      <thead className="bg-white/[0.02] text-white/40">
                                        <tr>
                                          <th className="px-4 py-2 font-medium">Heure</th>
                                          <th className="px-4 py-2 font-medium">Agent Cible</th>
                                          <th className="px-4 py-2 font-medium">Résultat</th>
                                          <th className="px-4 py-2 font-medium">Message (Payload/Error)</th>
                                          <th className="px-4 py-2 font-medium text-right">Latence</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-white/[0.02]">
                                        {DRILLDOWN_LOGS.map(log => (
                                          <tr key={log.id} className="hover:bg-white/[0.02]">
                                            <td className="px-4 py-2 font-mono text-white/50">{log.time}</td>
                                            <td className="px-4 py-2 text-white/80">{log.agent}</td>
                                            <td className="px-4 py-2">
                                              {log.status === 'success' ? (
                                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">Succès</span>
                                              ) : (
                                                <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-medium">Échec</span>
                                              )}
                                            </td>
                                            <td className="px-4 py-2 font-mono text-[10px] text-white/60 truncate max-w-[200px]">{log.msg}</td>
                                            <td className="px-4 py-2 text-right font-mono text-white/50">{log.latency}ms</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                                
                                {/* Right: Sparklines */}
                                <div className="flex flex-col justify-center">
                                  <h4 className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-4">Stabilité (30j)</h4>
                                  <div className="h-32 w-full bg-[#090b10] rounded-xl border border-white/[0.05] p-4 flex items-end">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={Array.from({length: 30}).map(() => ({v: Math.random() * 100}))}>
                                        <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={1.5} fill="url(#blueGradient)" />
                                        <defs>
                                          <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                                          </linearGradient>
                                        </defs>
                                      </AreaChart>
                                    </ResponsiveContainer>
                                  </div>
                                  <button className="mt-4 w-full py-2 bg-white/5 hover:bg-white/10 text-white/80 text-[11px] font-medium rounded-lg transition-colors border border-white/10">
                                    Configurer une alerte
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </CommandPageShell>
  );
}
