import React, { useState } from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { CommandChartCard } from '@/components/command/CommandChartCard';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import { ShieldCheckIcon, AlertTriangleIcon, XCircleIcon, MinusCircleIcon, ActivityIcon, PlayIcon, BotIcon, ZapIcon, ArrowRightIcon, TerminalSquareIcon, ClockIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PILLARS = [
  { name: 'Auth', score: 92, color: '#34d399', history: [40, 50, 60, 75, 80, 85, 92] },
  { name: 'Découvrabilité', score: 68, color: '#8b5cf6', history: [50, 45, 55, 60, 65, 68, 68] },
  { name: 'Actionnabilité', score: 71, color: '#3b82f6', history: [30, 40, 45, 55, 60, 65, 71] },
  { name: 'Fiabilité', score: 65, color: '#f59e0b', history: [80, 75, 70, 65, 60, 62, 65] },
];

const CAPABILITIES = [
  { id: 'auth', name: 'Auth OAuth 2.1', desc: 'Mécanisme d\'authentification standardisé' },
  { id: 'mcp', name: 'Serveur MCP', desc: 'Model Context Protocol pour Desktop' },
  { id: 'openapi', name: 'OpenAPI Spec', desc: 'Spécification machine-readable (openapi.json)' },
  { id: 'webhooks', name: 'Webhooks', desc: 'Notifications d\'état asynchrones' },
  { id: 'idempotency', name: 'Idempotency', desc: 'Clés d\'idempotence sur les mutations' },
  { id: 'ratelimits', name: 'Rate Limits', desc: 'En-têtes standardisés (RateLimit-Remaining)' },
  { id: 'schema', name: 'Schema.org', desc: 'Markup sémantique enrichi' },
  { id: 'docs', name: 'Documentation', desc: 'Instructions système (llms.txt)' },
];

const PLATFORMS = [
  { id: 'chatgpt', name: 'ChatGPT' },
  { id: 'claude', name: 'Claude' },
  { id: 'perplexity', name: 'Perplexity' },
  { id: 'gemini', name: 'Gemini' },
  { id: 'mcp', name: 'Custom MCP' },
];

// Generate matrix data
const MATRIX_DATA: Record<string, Record<string, { status: 'ok' | 'warn' | 'error' | 'none', date: string }>> = {};
CAPABILITIES.forEach(cap => {
  MATRIX_DATA[cap.id] = {};
  PLATFORMS.forEach(plat => {
    const rand = Math.random();
    let status: 'ok' | 'warn' | 'error' | 'none' = 'ok';
    if (rand > 0.8) status = 'error';
    else if (rand > 0.6) status = 'warn';
    else if (rand > 0.4 && (plat.id === 'mcp' || cap.id === 'mcp')) status = 'none';
    
    MATRIX_DATA[cap.id][plat.id] = {
      status,
      date: `Il y a ${Math.floor(Math.random() * 24) + 1}h`
    };
  });
});

const LOGS = Array.from({ length: 15 }).map((_, i) => ({
  id: `log-${i}`,
  agent: PLATFORMS[i % PLATFORMS.length].name,
  action: ['POST', 'GET', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)],
  endpoint: ['/api/v1/quotes', '/api/v1/bookings', '/api/v1/auth/token', '/openapi.json', '/.well-known/llms.txt', '/api/v1/users/me'][Math.floor(Math.random() * 6)],
  status: Math.random() > 0.8 ? 'error' : 'ok',
  latency: Math.floor(Math.random() * 800) + 120,
  time: `${Math.floor(Math.random() * 59) + 1} min ago`
}));

export default function AgentOverviewPage() {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="AGENT Ops"
          title="Overview AGENT"
          subtitle="Centre de commandement pour l'intégration de votre marque avec les agents autonomes."
          actions={
            <button className={COMMAND_BUTTONS.primary}>
              <PlayIcon className="w-3.5 h-3.5 mr-1.5" />
              Tester les endpoints
            </button>
          }
        />
      }
    >
      {/* Hero Section */}
      <div className={cn(COMMAND_PANEL, "p-6 flex flex-col lg:flex-row items-center gap-8")}>
        <div className="flex flex-col items-center justify-center w-full lg:w-[280px] shrink-0 border-b lg:border-b-0 lg:border-r border-white/[0.05] pb-8 lg:pb-0 lg:pr-8">
          <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-white/50 mb-6">Score AGENT Global</div>
          <div className="relative w-[180px] h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" cy="50%" 
                innerRadius="80%" outerRadius="100%" 
                barSize={12} 
                data={[{ name: 'Score', value: 74, fill: '#8b5cf6' }]} 
                startAngle={220} endAngle={-40}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: 'rgba(255,255,255,0.05)' }} dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[48px] font-bold tracking-tighter text-white tabular-nums leading-none">74</span>
              <span className="text-[12px] text-white/40 mt-1 font-mono">/ 100</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {PILLARS.map((pillar, i) => (
            <div key={pillar.name} className="flex flex-col">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-3">{pillar.name}</div>
              <div className="flex items-end justify-between mb-3">
                <span className="text-[32px] font-bold tabular-nums leading-none" style={{ color: pillar.color }}>{pillar.score}</span>
              </div>
              <div className="h-8 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pillar.history.map((v, i) => ({ v, i }))} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Bar dataKey="v" radius={[2, 2, 0, 0]}>
                      {pillar.history.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={pillar.color} fillOpacity={index === pillar.history.length - 1 ? 1 : 0.3} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Matrix Section */}
      <div className={cn(COMMAND_PANEL, "p-0 overflow-hidden")}>
        <div className="p-5 border-b border-white/[0.05] flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-white/90">Matrice de Compatibilité</h3>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-white/60"><ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400" /> Supporté</span>
            <span className="flex items-center gap-1.5 text-white/60"><AlertTriangleIcon className="w-3.5 h-3.5 text-amber-400" /> Partiel</span>
            <span className="flex items-center gap-1.5 text-white/60"><XCircleIcon className="w-3.5 h-3.5 text-rose-400" /> Erreur</span>
            <span className="flex items-center gap-1.5 text-white/60"><MinusCircleIcon className="w-3.5 h-3.5 text-white/30" /> N/A</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                <th className="px-5 py-4 font-medium text-white/40 w-[240px]">Capacité Technique</th>
                {PLATFORMS.map(plat => (
                  <th key={plat.id} className="px-4 py-4 font-medium text-white/70 text-center">{plat.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {CAPABILITIES.map((cap, i) => (
                <motion.tr 
                  key={cap.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium text-white/90">{cap.name}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{cap.desc}</div>
                  </td>
                  {PLATFORMS.map(plat => {
                    const data = MATRIX_DATA[cap.id][plat.id];
                    const isHovered = hoveredCell === `${cap.id}-${plat.id}`;
                    return (
                      <td 
                        key={plat.id} 
                        className="px-4 py-3 text-center relative"
                        onMouseEnter={() => setHoveredCell(`${cap.id}-${plat.id}`)}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <div className="flex justify-center">
                          {data.status === 'ok' ? <ShieldCheckIcon className="w-4 h-4 text-emerald-400" /> :
                           data.status === 'warn' ? <AlertTriangleIcon className="w-4 h-4 text-amber-400" /> :
                           data.status === 'error' ? <XCircleIcon className="w-4 h-4 text-rose-400" /> :
                           <MinusCircleIcon className="w-4 h-4 text-white/20" />}
                        </div>
                        <AnimatePresence>
                          {isHovered && (
                            <motion.div
                              initial={{ opacity: 0, y: 5, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-10 w-max px-2.5 py-1.5 rounded-lg bg-[#1a1d24] border border-white/10 shadow-xl text-[10px] text-white/70 pointer-events-none"
                            >
                              Vérifié: {data.date}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logs Feed */}
      <div className="mt-4">
        <h3 className="text-[14px] font-semibold text-white/90 mb-4 ml-1 flex items-center gap-2">
          <TerminalSquareIcon className="w-4 h-4 text-white/50" />
          Flux d'activité Agentic
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {LOGS.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className={cn(COMMAND_PANEL, "p-3.5 flex items-center gap-4 hover:bg-white/[0.04] transition-colors cursor-pointer")}
            >
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", 
                log.agent.includes('ChatGPT') ? 'bg-emerald-500/20 text-emerald-400' :
                log.agent.includes('Claude') ? 'bg-amber-500/20 text-amber-400' :
                log.agent.includes('Perplexity') ? 'bg-sky-500/20 text-sky-400' : 'bg-indigo-500/20 text-indigo-400'
              )}>
                <BotIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold text-white/90">{log.agent}</span>
                  <span className="text-[10px] text-white/30">&bull;</span>
                  <span className="text-[10px] text-white/50 flex items-center gap-1"><ClockIcon className="w-3 h-3" /> {log.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-bold font-mono px-1.5 py-0.5 rounded",
                    log.action === 'GET' ? 'bg-sky-500/10 text-sky-400' :
                    log.action === 'POST' ? 'bg-emerald-500/10 text-emerald-400' :
                    log.action === 'PUT' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                  )}>{log.action}</span>
                  <span className="text-[11px] font-mono text-white/70 truncate">{log.endpoint}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {log.status === 'ok' ? (
                  <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircleIcon className="w-4 h-4 text-rose-400" />
                )}
                <span className="text-[10px] font-mono text-white/40">{log.latency}ms</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </CommandPageShell>
  );
}
