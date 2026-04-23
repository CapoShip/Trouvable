import React from 'react';
import { CommandPageShell, CommandHeader } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { TrophyIcon, TargetIcon, ZapIcon, LightbulbIcon, ArrowUpRightIcon, ArrowDownRightIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const BRANDS = [
  { id: 'us', name: 'Trouvable', score: 74, delta: 5, rank: 2 },
  { id: 'c1', name: 'Optimize360', score: 82, delta: 2, rank: 1 },
  { id: 'c2', name: 'AgenceLune', score: 65, delta: -3, rank: 3 },
  { id: 'c3', name: 'VisibleAI', score: 58, delta: 8, rank: 4 },
  { id: 'c4', name: 'StratéGEO', score: 41, delta: -1, rank: 5 },
];

const METRICS = [
  { id: 'vis', label: 'Visibilité IA (Share)', data: [18, 35, 22, 15, 10] },
  { id: 'act', label: 'Actionnabilité (%)', data: [67, 85, 45, 30, 20] },
  { id: 'lat', label: 'Latence Moyenne (ms, inversé)', data: [80, 95, 60, 50, 40] }, // higher is better for chart
  { id: 'pro', label: 'Couverture Protocoles', data: [60, 90, 40, 20, 10] },
  { id: 'sch', label: 'Fraîcheur Schema.org', data: [95, 100, 70, 85, 50] },
  { id: 'err', label: 'Taux Succès (100-Err)', data: [88, 96, 75, 60, 55] },
];

const INSIGHTS_THEY_DO_BETTER = [
  { comp: 'Optimize360', msg: 'Support natif complet du protocole MCP avec auth persistante.' },
  { comp: 'Optimize360', msg: 'Documentation LLM (llms.txt) extrêmement riche en exemples de payloads.' },
  { comp: 'AgenceLune', msg: 'Latence API de 120ms (vs 240ms pour nous) favorisée par les agents.' },
  { comp: 'VisibleAI', msg: 'Croissance agressive sur les requêtes de comparaison directes.' },
];

const INSIGHTS_WE_DO_BETTER = [
  { msg: 'Meilleure gestion des erreurs 4xx avec suggestions d\'autocorrection.' },
  { msg: 'Seul acteur avec un Schema.org parfaitement aligné sur le graphe de connaissances Google.' },
  { msg: 'Taux de conversion supérieur une fois l\'agent dans le tunnel (idempotence forte).' },
  { msg: 'Couverture des modèles open-source (Mistral, Llama) nettement supérieure.' },
];

export default function AgentCompetitorsPage() {
  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="AGENT Ops"
          title="Benchmark Concurrentiel"
          subtitle="Cockpit de comparaison: comment vos concurrents s'intègrent-ils dans l'écosystème Agentic ?"
          actions={
             <div className="flex gap-2">
               <button className={COMMAND_BUTTONS.secondary}>Configurer concurrents</button>
               <button className={COMMAND_BUTTONS.primary}>Générer Benchmark PDF</button>
             </div>
          }
        />
      }
    >
      {/* Brands Header Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-2">
        {BRANDS.map((brand, i) => (
          <motion.div 
            key={brand.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(COMMAND_PANEL, "p-5 flex flex-col relative overflow-hidden", brand.id === 'us' ? 'border-violet-500/30 bg-violet-500/5' : '')}
          >
            {brand.id === 'us' && <div className="absolute top-0 left-0 w-full h-1 bg-violet-500" />}
            
            <div className="flex items-start justify-between mb-4">
              <span className={cn("text-[12px] font-bold truncate pr-2", brand.id === 'us' ? 'text-violet-300' : 'text-white/90')}>{brand.name}</span>
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-white/10 text-[10px] font-bold text-white/70">#{brand.rank}</div>
            </div>
            
            <div className="flex items-end gap-2 mb-1">
              <span className="text-[32px] font-bold tabular-nums leading-none text-white">{brand.score}</span>
              <span className="text-[12px] text-white/40 mb-1">/100</span>
            </div>
            
            <div className="mt-auto pt-4 flex items-center gap-1.5">
              <span className={cn("flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded",
                brand.delta > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
              )}>
                {brand.delta > 0 ? <ArrowUpRightIcon className="w-3 h-3 mr-0.5" /> : <ArrowDownRightIcon className="w-3 h-3 mr-0.5" />}
                {Math.abs(brand.delta)} pts
              </span>
              <span className="text-[10px] text-white/40">(30j)</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Metrics Stacked Bars */}
      <div className={cn(COMMAND_PANEL, "p-6 mt-6")}>
        <h3 className="text-[14px] font-semibold text-white/90 mb-6 flex items-center gap-2">
          <TargetIcon className="w-4 h-4 text-indigo-400" /> Comparaison Dimensionnelle
        </h3>
        
        <div className="space-y-6">
          {METRICS.map((metric, i) => (
            <div key={metric.id} className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-3 lg:col-span-2 text-[12px] font-medium text-white/70 text-right pr-4">{metric.label}</div>
              <div className="col-span-9 lg:col-span-10 flex gap-1 h-8">
                {metric.data.map((val, j) => (
                  <motion.div 
                    key={j}
                    initial={{ width: 0 }}
                    animate={{ width: `${(val / Math.max(...metric.data)) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 + j * 0.05 }}
                    className={cn("h-full rounded-sm flex items-center justify-end px-2 group relative",
                      BRANDS[j].id === 'us' ? 'bg-violet-500' : 'bg-white/10 hover:bg-white/20 transition-colors cursor-pointer'
                    )}
                    style={{ flexGrow: val }}
                  >
                    <span className={cn("text-[10px] font-bold tabular-nums opacity-0 group-hover:opacity-100 transition-opacity",
                      BRANDS[j].id === 'us' ? 'text-white' : 'text-white/70'
                    )}>{val}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-col Insight Panel & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Qualitative Insights */}
        <div className="flex flex-col gap-6">
          <div className={cn(COMMAND_PANEL, "p-5")}>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-rose-400 mb-4">Ce qu'ils font mieux</h4>
            <ul className="space-y-3">
              {INSIGHTS_THEY_DO_BETTER.map((item, i) => (
                <li key={i} className="flex gap-3 text-[12px]">
                  <span className="shrink-0 mt-0.5 px-1.5 py-0.5 rounded bg-white/5 text-white/50 text-[9px] font-bold uppercase w-[80px] text-center">{item.comp}</span>
                  <span className="text-white/70 leading-relaxed">{item.msg}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className={cn(COMMAND_PANEL, "p-5")}>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400 mb-4">Ce que nous faisons mieux</h4>
            <ul className="space-y-3">
              {INSIGHTS_WE_DO_BETTER.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px]">
                  <TrophyIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-white/70 leading-relaxed">{item.msg}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Plan */}
        <div className={cn(COMMAND_PANEL, "p-0 overflow-hidden flex flex-col")}>
          <div className="p-5 border-b border-white/[0.05] bg-gradient-to-r from-indigo-500/10 to-transparent">
            <h3 className="text-[14px] font-semibold text-white/90 flex items-center gap-2">
              <LightbulbIcon className="w-4 h-4 text-indigo-400" /> Plan d'Action Recommandé
            </h3>
            <p className="text-[11px] text-white/50 mt-1">Actions priorisées pour rattraper Optimize360 (#1).</p>
          </div>
          
          <div className="flex flex-col divide-y divide-white/[0.05]">
            <div className="p-5">
              <h4 className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-3">À copier d'urgence</h4>
              <div className="space-y-2">
                {[
                  { act: "Implémenter le serveur MCP local pour l'API Core.", effort: "L" },
                  { act: "Réécrire openapi.json pour inclure les `examples` sur chaque payload POST.", effort: "M" },
                  { act: "Optimiser la latence du webhook de création de devis (< 500ms).", effort: "XL" }
                ].map((act, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-[12px] text-white/80">{act.act}</span>
                    <span className={cn("text-[9px] font-bold px-2 py-1 rounded bg-white/10", 
                      act.effort === 'L' || act.effort === 'XL' ? 'text-amber-300' : 'text-emerald-300'
                    )}>{act.effort}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-5">
              <h4 className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-3">À différencier</h4>
              <div className="space-y-2">
                {[
                  { act: "Exposer l'historique conversationnel aux agents (Mémoire long-terme).", effort: "XL" },
                  { act: "Ajouter la délégation d'achat (Token de paiement à usage unique).", effort: "M" }
                ].map((act, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-[12px] text-white/80">{act.act}</span>
                    <span className={cn("text-[9px] font-bold px-2 py-1 rounded bg-white/10", 
                      act.effort === 'L' || act.effort === 'XL' ? 'text-amber-300' : 'text-emerald-300'
                    )}>{act.effort}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </CommandPageShell>
  );
}
