import React from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { CommandTable } from '@/components/command/CommandTable';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircleIcon, CheckCircle2Icon, XCircleIcon, InfoIcon, RefreshCwIcon, ShieldAlertIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const CRAWL_ISSUES = Array.from({ length: 28 }).map((_, i) => ({
  id: `iss-${i}`,
  severity: i % 7 === 0 ? 'critical' : i % 3 === 0 ? 'warning' : 'info',
  url: ['/produits/ancienne-collection', '/blog/article-tres-long', '/a-propos', '/api/panier/add', '/checkout', '/tarifs', '/contact'][i % 7] + (i > 6 ? `?ref=${i}` : ''),
  status: [404, 500, 301, 403, 502, 503, 302][i % 7],
  bot: ['Googlebot', 'Bingbot', 'ClaudeBot', 'GPTBot'][i % 4],
  lastSeen: `Il y a ${Math.floor(Math.random() * 24) + 1}h`,
  occurrences: Math.floor(Math.random() * 500) + 10,
}));

const QUICK_FIXES = [
  { id: 1, title: 'Corriger 404 sur /produits/*', impact: 9, effort: 2 },
  { id: 2, title: 'Réduire LCP sur la page d\'accueil', impact: 8, effort: 5 },
  { id: 3, title: 'Supprimer chaînes de redirection', impact: 6, effort: 3 },
  { id: 4, title: 'Optimiser images /blog/*', impact: 5, effort: 4 },
  { id: 5, title: 'Ajouter balises hreflang', impact: 7, effort: 6 },
  { id: 6, title: 'Réparer liens cassés footer', impact: 4, effort: 1 },
  { id: 7, title: 'Mise en cache requêtes API', impact: 8, effort: 7 },
  { id: 8, title: 'Minifier CSS/JS global', impact: 6, effort: 4 },
];

export default function SeoHealthPage() {
  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="SEO Ops"
          title="Diagnostic Cockpit"
          subtitle="Audit technique, Core Web Vitals et erreurs d'exploration."
          actions={
            <button className={COMMAND_BUTTONS.primary}>Lancer un audit complet</button>
          }
        />
      }
    >
      {/* Top: Core Web Vitals Strip */}
      <div className={cn(COMMAND_PANEL, "p-6 flex flex-col md:flex-row gap-8")}>
        {[
          { label: 'LCP', name: 'Largest Contentful Paint', value: '1.2s', target: '< 2.5s', status: 'good', data: [1.2, 1.3, 1.1, 1.4, 1.2, 1.5, 1.2, 1.1, 1.3, 1.2] },
          { label: 'FID', name: 'First Input Delay', value: '45ms', target: '< 100ms', status: 'good', data: [40, 50, 45, 60, 42, 48, 45, 41, 46, 45] },
          { label: 'CLS', name: 'Cumulative Layout Shift', value: '0.12', target: '< 0.1', status: 'warn', data: [0.05, 0.08, 0.1, 0.15, 0.12, 0.11, 0.13, 0.12, 0.14, 0.12] },
        ].map((metric, i) => (
          <div key={metric.label} className="flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-[18px] font-bold text-white tracking-tight">{metric.label}</h3>
                <p className="text-[11px] text-white/50">{metric.name}</p>
              </div>
              <div className="text-right">
                <span className={cn("text-[24px] font-semibold tabular-nums tracking-tight", metric.status === 'good' ? 'text-emerald-400' : 'text-amber-400')}>{metric.value}</span>
                <p className="text-[10px] text-white/40">Cible: {metric.target}</p>
              </div>
            </div>
            <div className="h-12 w-full mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metric.data.map((v, i) => ({ val: v, i }))}>
                  <Line type="monotone" dataKey="val" stroke={metric.status === 'good' ? '#34d399' : '#fbbf24'} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className={cn(COMMAND_PANEL, "p-6")}>
        <h3 className="text-[12px] font-semibold text-white/90 uppercase tracking-widest mb-6">Entonnoir d'Indexation (12 mois)</h3>
        <div className="flex flex-col gap-2">
          {[
            { label: 'Découvertes', value: '14.2M', width: '100%', color: 'bg-indigo-500/20', border: 'border-indigo-500/30' },
            { label: 'Explorées', value: '11.5M', width: '85%', color: 'bg-sky-500/20', border: 'border-sky-500/30', drop: '80.9%' },
            { label: 'Indexées', value: '8.7M', width: '65%', color: 'bg-emerald-500/20', border: 'border-emerald-500/30', drop: '75.6%' },
            { label: 'Classées', value: '3.1M', width: '25%', color: 'bg-amber-500/20', border: 'border-amber-500/30', drop: '35.6%' },
            { label: 'Cliquées', value: '412k', width: '8%', color: 'bg-rose-500/20', border: 'border-rose-500/30', drop: '13.2%' },
          ].map((stage, i, arr) => (
            <div key={stage.label} className="relative flex items-center justify-center">
              <div 
                className={cn("h-12 flex items-center justify-between px-4 border rounded-sm transition-all", stage.color, stage.border)}
                style={{ width: stage.width }}
              >
                <span className="text-[12px] font-medium text-white/80">{stage.label}</span>
                <span className="text-[14px] font-bold text-white tabular-nums">{stage.value}</span>
              </div>
              {stage.drop && (
                <div className="absolute right-0 translate-x-[110%] text-[10px] text-white/40 font-mono flex items-center">
                  <div className="w-4 h-px bg-white/20 mr-2" />
                  {stage.drop} conv.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Split: Log & Fixes */}
      <div className="flex flex-col lg:flex-row gap-6 h-[600px]">
        {/* Left: Log */}
        <div className={cn(COMMAND_PANEL, "flex-1 flex flex-col overflow-hidden p-0")}>
          <div className="p-4 border-b border-white/[0.05] bg-white/[0.01]">
            <h3 className="text-[12px] font-semibold text-white/90">Journal des erreurs d'exploration</h3>
          </div>
          <div className="flex-1 overflow-auto scrollbar-none">
            <table className="w-full text-left text-[12px]">
              <thead className="sticky top-0 bg-[#090a0b]/95 backdrop-blur z-10 border-b border-white/[0.05]">
                <tr>
                  <th className="px-4 py-3 font-semibold text-white/40 w-10"></th>
                  <th className="px-4 py-3 font-semibold text-white/40">URL</th>
                  <th className="px-4 py-3 font-semibold text-white/40">Statut</th>
                  <th className="px-4 py-3 font-semibold text-white/40">Bot</th>
                  <th className="px-4 py-3 font-semibold text-white/40">Dernière vue</th>
                  <th className="px-4 py-3 font-semibold text-white/40 text-right">Occurrences</th>
                  <th className="px-4 py-3 font-semibold text-white/40 w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {CRAWL_ISSUES.map((issue, i) => (
                  <motion.tr 
                    key={issue.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      {issue.severity === 'critical' ? <XCircleIcon className="w-4 h-4 text-red-400" /> :
                       issue.severity === 'warning' ? <ShieldAlertIcon className="w-4 h-4 text-amber-400" /> :
                       <InfoIcon className="w-4 h-4 text-sky-400" />}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-white/70 max-w-[200px] truncate">{issue.url}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] tabular-nums font-bold", 
                        issue.status >= 500 ? 'bg-red-500/10 text-red-400' :
                        issue.status >= 400 ? 'bg-amber-500/10 text-amber-400' : 'bg-sky-500/10 text-sky-400'
                      )}>{issue.status}</span>
                    </td>
                    <td className="px-4 py-3 text-white/60">{issue.bot}</td>
                    <td className="px-4 py-3 text-white/50">{issue.lastSeen}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-white/80">{issue.occurrences}</td>
                    <td className="px-4 py-3">
                      <button className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-all">
                        <RefreshCwIcon className="w-3 h-3" /> Réessayer
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Quick Fixes */}
        <div className={cn(COMMAND_PANEL, "w-full lg:w-[320px] flex flex-col p-5 bg-white/[0.01]")}>
          <h3 className="text-[12px] font-semibold text-white/90 uppercase tracking-widest mb-6">Quick Fixes Priorisés</h3>
          <div className="flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-none">
            {QUICK_FIXES.map((fix, i) => (
              <motion.div 
                key={fix.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <h4 className="text-[13px] font-medium text-white/90 mb-3 leading-snug">{fix.title}</h4>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <div className="text-[9px] text-white/40 uppercase tracking-wider mb-1 flex justify-between">
                      <span>Impact</span>
                      <span className="text-emerald-400">{fix.impact}/10</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${fix.impact * 10}%` }} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[9px] text-white/40 uppercase tracking-wider mb-1 flex justify-between">
                      <span>Effort</span>
                      <span className="text-rose-400">{fix.effort}/10</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-400 rounded-full" style={{ width: `${fix.effort * 10}%` }} />
                    </div>
                  </div>
                </div>
                <button className="w-full py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-[11px] font-medium transition-colors border border-white/10 hover:border-white/20">
                  Lancer le correctif
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </CommandPageShell>
  );
}
