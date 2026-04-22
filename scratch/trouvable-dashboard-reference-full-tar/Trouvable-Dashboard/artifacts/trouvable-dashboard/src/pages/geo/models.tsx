import React, { useState } from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { BotIcon, ArrowUpRightIcon, ArrowDownRightIcon, SearchIcon, FilterIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

const MODELS = [
  { id: 'gpt4o', rank: 1, name: 'ChatGPT', version: 'GPT-4o', maker: 'OpenAI', score: 98.5, hallucination: 1.2, citationAcc: 95, freshness: '24h', trend: 'up', sparkline: [85, 88, 92, 95, 96, 98, 98.5], logo: 'bg-emerald-500' },
  { id: 'claude35', rank: 2, name: 'Claude', version: '3.5 Sonnet', maker: 'Anthropic', score: 96.2, hallucination: 1.8, citationAcc: 92, freshness: '48h', trend: 'up', sparkline: [80, 85, 88, 90, 92, 94, 96.2], logo: 'bg-amber-500' },
  { id: 'perplexity', rank: 3, name: 'Perplexity', version: 'Pro Search', maker: 'Perplexity AI', score: 99.1, hallucination: 0.5, citationAcc: 98, freshness: '< 1h', trend: 'stable', sparkline: [98, 99, 98.5, 99.1, 99, 99.1, 99.1], logo: 'bg-sky-500' },
  { id: 'mistral', rank: 4, name: 'Mistral', version: 'Large 2', maker: 'Mistral AI', score: 88.9, hallucination: 4.5, citationAcc: 75, freshness: '1 sem', trend: 'down', sparkline: [92, 90, 89, 88, 90, 89, 88.9], logo: 'bg-orange-500' },
  { id: 'gemini', rank: 5, name: 'Gemini', version: '1.5 Pro', maker: 'Google', score: 82.4, hallucination: 8.2, citationAcc: 60, freshness: '72h', trend: 'down', sparkline: [88, 85, 82, 80, 83, 81, 82.4], logo: 'bg-indigo-500' },
  { id: 'meta', rank: 6, name: 'Llama', version: '3.1 405B', maker: 'Meta', score: 75.0, hallucination: 12.0, citationAcc: 45, freshness: '1 mois', trend: 'stable', sparkline: [74, 75, 76, 75, 74, 75, 75.0], logo: 'bg-blue-600' },
];

export default function GeoModelsPage() {
  const [filter, setFilter] = useState('all');

  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="GEO Ops"
          title="Fiabilité des LLMs"
          subtitle="Scoreboard de l'exactitude des modèles. Quels LLMs hallucinent le plus sur votre marque ?"
          actions={
             <div className="flex gap-2">
               <button className={COMMAND_BUTTONS.secondary}>Comparer 2 modèles</button>
               <button className={COMMAND_BUTTONS.primary}>Actualiser Benchmarks</button>
             </div>
          }
        />
      }
    >
      {/* Hero Cards: Top & Worst */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 mb-6">
        <div className={cn(COMMAND_PANEL, "p-6 flex items-center justify-between border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-transparent")}>
           <div>
             <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Le plus fiable</div>
             <h3 className="text-2xl font-bold text-white mb-1">Perplexity Pro</h3>
             <p className="text-[12px] text-white/60">Seulement 0.5% d'hallucinations détectées.</p>
           </div>
           <div className="text-right">
             <div className="text-[32px] font-bold tabular-nums text-emerald-400">99.1<span className="text-lg text-emerald-400/50">%</span></div>
             <div className="text-[10px] text-white/40 uppercase tracking-widest">Score Fiabilité</div>
           </div>
        </div>
        <div className={cn(COMMAND_PANEL, "p-6 flex items-center justify-between border-rose-500/20 bg-gradient-to-r from-rose-500/10 to-transparent")}>
           <div>
             <div className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-1">Risque Élevé</div>
             <h3 className="text-2xl font-bold text-white mb-1">Gemini 1.5 Pro</h3>
             <p className="text-[12px] text-white/60">8.2% d'hallucinations. Inventions de prix fréquentes.</p>
           </div>
           <div className="text-right">
             <div className="text-[32px] font-bold tabular-nums text-rose-400">82.4<span className="text-lg text-rose-400/50">%</span></div>
             <div className="text-[10px] text-white/40 uppercase tracking-widest">Score Fiabilité</div>
           </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className={cn(COMMAND_PANEL, "p-0 overflow-hidden flex flex-col")}>
         <div className="p-4 border-b border-white/[0.05] bg-white/[0.01] flex items-center justify-between">
            <div className="flex gap-2">
              {['all', 'chat', 'search', 'agent'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors",
                    filter === f ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-white/[0.05] text-white/50 hover:text-white/80"
                  )}
                >
                  {f === 'all' ? 'Tous les modèles' : f === 'chat' ? 'Conversational' : f === 'search' ? 'AI Search' : 'Agents'}
                </button>
              ))}
            </div>
            <div className="relative">
              <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input 
                type="text" 
                placeholder="Rechercher un modèle..." 
                className="bg-black/20 border border-white/10 rounded-full pl-8 pr-4 py-1.5 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
              />
            </div>
         </div>

         <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-[12px] whitespace-nowrap">
               <thead>
                  <tr className="border-b border-white/[0.05]">
                     <th className="px-5 py-4 font-semibold text-white/40 w-16 text-center">Rang</th>
                     <th className="px-5 py-4 font-semibold text-white/40">Modèle</th>
                     <th className="px-5 py-4 font-semibold text-white/40">Fiabilité (Score)</th>
                     <th className="px-5 py-4 font-semibold text-white/40 text-right">Taux Hallucination</th>
                     <th className="px-5 py-4 font-semibold text-white/40 text-right">Prt. Citations</th>
                     <th className="px-5 py-4 font-semibold text-white/40">Fraîcheur</th>
                     <th className="px-5 py-4 font-semibold text-white/40 w-24">Tendance (30j)</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/[0.02]">
                  {MODELS.map((model, i) => (
                     <motion.tr 
                       key={model.id}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: i * 0.05 }}
                       className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                     >
                        <td className="px-5 py-4 text-center">
                           <span className={cn("text-[14px] font-bold", 
                              model.rank === 1 ? "text-amber-400" : 
                              model.rank === 2 ? "text-slate-300" : 
                              model.rank === 3 ? "text-amber-600" : "text-white/30"
                           )}>#{model.rank}</span>
                        </td>
                        <td className="px-5 py-4">
                           <div className="flex items-center gap-3">
                              <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", model.logo)}>
                                 <BotIcon className="w-3 h-3 text-white" />
                              </div>
                              <div>
                                 <div className="font-bold text-white/90 text-[13px]">{model.name} <span className="font-mono text-[10px] text-white/40 ml-1">{model.version}</span></div>
                                 <div className="text-[10px] text-white/40">{model.maker}</div>
                              </div>
                           </div>
                        </td>
                        <td className="px-5 py-4">
                           <div className="flex items-center gap-3">
                              <span className={cn("text-[14px] font-bold tabular-nums", 
                                 model.score > 95 ? "text-emerald-400" : model.score > 85 ? "text-amber-400" : "text-rose-400"
                              )}>{model.score}%</span>
                              <div className="w-24 h-1.5 bg-black/50 rounded-full overflow-hidden hidden sm:block">
                                 <div className={cn("h-full rounded-full",
                                    model.score > 95 ? "bg-emerald-400" : model.score > 85 ? "bg-amber-400" : "bg-rose-400"
                                 )} style={{ width: `${model.score}%` }} />
                              </div>
                           </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                           <span className={cn("font-bold tabular-nums",
                              model.hallucination < 2 ? "text-emerald-400" : model.hallucination < 5 ? "text-amber-400" : "text-rose-400"
                           )}>{model.hallucination}%</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                           <span className="font-mono text-white/70 tabular-nums">{model.citationAcc}%</span>
                        </td>
                        <td className="px-5 py-4">
                           <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-white/5 text-white/60">
                              {model.freshness}
                           </span>
                        </td>
                        <td className="px-5 py-4">
                           <div className="flex items-center gap-2">
                              <div className="w-16 h-6 opacity-60 group-hover:opacity-100 transition-opacity">
                                 <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={model.sparkline.map((v, i) => ({ v, i }))}>
                                       <Area type="monotone" dataKey="v" stroke={model.trend === 'up' ? '#34d399' : model.trend === 'down' ? '#fb7185' : '#94a3b8'} fill="none" strokeWidth={1.5} isAnimationActive={false} />
                                    </AreaChart>
                                 </ResponsiveContainer>
                              </div>
                              {model.trend === 'up' ? <ArrowUpRightIcon className="w-3 h-3 text-emerald-400" /> :
                               model.trend === 'down' ? <ArrowDownRightIcon className="w-3 h-3 text-rose-400" /> :
                               <div className="w-3 h-0.5 bg-slate-400 rounded-full" />}
                           </div>
                        </td>
                     </motion.tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </CommandPageShell>
  );
}
