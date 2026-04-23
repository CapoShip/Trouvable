import React, { useState } from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRightIcon, ServerIcon, CheckCircle2Icon, XCircleIcon, ClockIcon } from 'lucide-react';

const ACTIONS = [
  'Réserver un vol', 'Acheter un produit', 'Contacter le support', 
  'Demander un devis', 'Prendre RDV', 'Retourner une commande', 
  'Suivre une livraison', 'S\'inscrire à un événement'
];

const PLATFORMS = ['ChatGPT', 'Claude', 'Perplexity', 'Gemini', 'Custom MCP'];

const GRID_DATA = ACTIONS.map(action => {
  const row: Record<string, any> = { action };
  PLATFORMS.forEach(p => {
    row[p] = {
      success: Math.floor(Math.random() * 60) + 40, // 40-100%
      latency: Math.floor(Math.random() * 2000) + 300, // ms
      lastTest: `${Math.floor(Math.random() * 24)}h ago`
    };
  });
  return row;
});

const TREND_DATA = Array.from({ length: 14 }).map((_, i) => ({
  day: i,
  val: 50 + i + Math.random() * 10
}));

const DRILLDOWN_LOGS = Array.from({ length: 10 }).map((_, i) => ({
  id: `log-${i}`,
  time: new Date(Date.now() - i * 3600000).toLocaleTimeString('fr-FR'),
  agent: PLATFORMS[i % PLATFORMS.length],
  outcome: Math.random() > 0.3 ? 'success' : 'fail',
  error: Math.random() > 0.3 ? 'Invalid payload format for field `date`' : 'Rate limit exceeded',
  latency: Math.floor(Math.random() * 1500) + 200
}));

export default function AgentActionabilityPage() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="AGENT Ops"
          title="Benchmark d'Actions"
          subtitle="Taux de succès des agents IA à accomplir des tâches transactionnelles sur vos plateformes."
          actions={
            <button className={COMMAND_BUTTONS.primary}>Lancer un benchmark global</button>
          }
        />
      }
    >
      {/* Aggregate Hero */}
      <div className={cn(COMMAND_PANEL, "p-8 flex flex-col lg:flex-row items-center justify-between gap-8 bg-gradient-to-r from-emerald-500/5 to-transparent border-emerald-500/20")}>
        <div className="flex flex-col gap-2 shrink-0">
          <h2 className="text-[14px] font-semibold text-emerald-400 uppercase tracking-widest mb-1">Taux de succès global</h2>
          <div className="flex items-end gap-4">
            <span className="text-[48px] font-bold text-white tracking-tighter leading-none">67%</span>
            <div className="flex items-center gap-1 text-emerald-400 mb-2 bg-emerald-500/10 px-2 py-0.5 rounded text-[12px] font-bold">
              <ArrowUpRightIcon className="w-3 h-3" /> +12%
            </div>
          </div>
          <span className="text-[12px] text-white/50 mt-1">Comparé aux 30 derniers jours (55%)</span>
        </div>
        
        <div className="flex-1 w-full h-24 max-w-2xl">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={TREND_DATA}>
              <Line type="monotone" dataKey="val" stroke="#34d399" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-8">
        <h3 className="text-[14px] font-semibold text-white/90 mb-4 px-1">Matrice de Performance (Derniers tests)</h3>
        <div className={cn(COMMAND_PANEL, "overflow-hidden")}>
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[#090a0b]/95 border-b border-white/[0.05]">
                <tr>
                  <th className="px-5 py-4 font-semibold text-white/40 w-56">Action Transactionnelle</th>
                  {PLATFORMS.map(p => (
                    <th key={p} className="px-5 py-4 font-semibold text-white/70 text-center w-40">{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {GRID_DATA.map((row) => (
                  <tr 
                    key={row.action} 
                    onClick={() => setSelectedAction(row.action)}
                    className={cn("transition-colors cursor-pointer group",
                      selectedAction === row.action ? "bg-white/[0.06]" : "hover:bg-white/[0.02]"
                    )}
                  >
                    <td className="px-5 py-4 font-medium text-white/90 group-hover:text-indigo-300 transition-colors">
                      {row.action}
                    </td>
                    {PLATFORMS.map(p => {
                      const data = row[p];
                      return (
                        <td key={p} className="px-5 py-4 text-center group/cell">
                          <div className="flex flex-col items-center justify-center relative">
                            <span className={cn("text-[16px] font-bold tabular-nums",
                              data.success >= 80 ? "text-emerald-400" :
                              data.success >= 50 ? "text-amber-400" : "text-rose-400"
                            )}>{data.success}%</span>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-white/30 font-mono">
                              <span>{data.latency}ms</span>
                              <span>•</span>
                              <span>{data.lastTest}</span>
                            </div>
                            
                            {/* Hover Button */}
                            <div className="absolute inset-0 flex items-center justify-center bg-[#090b10] opacity-0 group-hover/cell:opacity-100 transition-opacity">
                              <button className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded text-[10px] font-bold tracking-wider uppercase transition-colors shadow-lg">
                                Re-tester
                              </button>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Drill-down Panel */}
      <AnimatePresence>
        {selectedAction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-6"
          >
            <div className={cn(COMMAND_PANEL, "flex flex-col overflow-hidden border-indigo-500/20")}>
              <div className="p-4 border-b border-white/[0.05] bg-gradient-to-r from-indigo-500/10 to-transparent flex justify-between items-center">
                <div>
                  <h3 className="text-[14px] font-bold text-white mb-1">Détail des tentatives : {selectedAction}</h3>
                  <p className="text-[11px] text-white/50">Historique des 10 dernières exécutions agentic pour cette action.</p>
                </div>
                <button onClick={() => setSelectedAction(null)} className="text-[11px] text-white/40 hover:text-white transition-colors">Fermer</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-[#06070a] border-b border-white/[0.05]">
                    <tr>
                      <th className="px-5 py-3 font-semibold text-white/40">Horodatage</th>
                      <th className="px-5 py-3 font-semibold text-white/40">Agent</th>
                      <th className="px-5 py-3 font-semibold text-white/40">Résultat</th>
                      <th className="px-5 py-3 font-semibold text-white/40">Détails techniques</th>
                      <th className="px-5 py-3 font-semibold text-white/40 text-right">Latence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {DRILLDOWN_LOGS.map(log => (
                      <tr key={log.id} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3 text-white/60 font-mono text-[11px] flex items-center gap-1.5"><ClockIcon className="w-3 h-3" /> {log.time}</td>
                        <td className="px-5 py-3 text-white/80 font-medium">{log.agent}</td>
                        <td className="px-5 py-3">
                          {log.outcome === 'success' ? (
                            <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-bold"><CheckCircle2Icon className="w-3.5 h-3.5" /> Succès</span>
                          ) : (
                            <span className="flex items-center gap-1 text-rose-400 text-[11px] font-bold"><XCircleIcon className="w-3.5 h-3.5" /> Échec</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {log.outcome === 'fail' ? (
                            <span className="text-rose-300/70 font-mono text-[10px] bg-rose-500/10 px-2 py-1 rounded">{log.error}</span>
                          ) : (
                            <span className="text-white/30 text-[11px]">-</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right text-white/60 font-mono text-[11px]">{log.latency}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </CommandPageShell>
  );
}
