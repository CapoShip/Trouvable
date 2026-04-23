import React from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { AreaChart, Area, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpIcon, SearchIcon, FilterIcon, SparklesIcon, BotIcon, TrendingUpIcon, ActivityIcon, CrosshairIcon, ClockIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const FUNNEL_STAGES = [
  { id: 'discovery', name: 'Découverte', desc: 'Requêtes exploratoires', value: 12400, percent: 100, conv: 38, query: 'meilleurs crm b2b' },
  { id: 'consideration', name: 'Considération', desc: 'Comparaisons directes', value: 4820, percent: 38, conv: 36, query: 'salesforce vs hubspot' },
  { id: 'recommendation', name: 'Recommandation', desc: 'Suggestions explicites', value: 1740, percent: 14, conv: 35, query: 'quel crm pour pme' },
  { id: 'selection', name: 'Sélection', desc: 'Choix final argumenté', value: 612, percent: 5, conv: null, query: 'pourquoi choisir hubspot' },
];

const AGENTS = Array.from({ length: 12 }).map((_, i) => ({
  id: `agent-${i}`,
  rank: i + 1,
  name: ['GPT-4o', 'Claude 3.5 Sonnet', 'Perplexity Pro', 'Gemini 1.5 Pro', 'Copilot', 'Meta AI', 'Mistral Large', 'Cohere Opus', 'Phind', 'You.com', 'ChatGPT Plus', 'Grok'][i],
  platform: ['OpenAI', 'Anthropic', 'Perplexity', 'Google', 'Microsoft', 'Meta', 'Mistral', 'Cohere', 'Phind', 'You', 'OpenAI', 'xAI'][i],
  mentions: Math.floor(Math.random() * 5000) + 100,
  pos: (Math.random() * 4 + 1).toFixed(1),
  seen: `${Math.floor(Math.random() * 24) + 1}h`,
  query: ['logiciel comptabilité pme', 'automatisation marketing', 'outil seo', 'alternative salesforce', 'meilleur crm 2025'][Math.floor(Math.random() * 5)],
  sparkline: Array.from({ length: 8 }).map(() => Math.floor(Math.random() * 100))
}));

const TRENDING = [
  { topic: 'Automatisation', growth: 145 },
  { topic: 'Intégration API', growth: 84 },
  { topic: 'Prix', growth: 42 },
  { topic: 'Support Client', growth: 28 },
  { topic: 'RGPD', growth: 15 },
  { topic: 'Onboarding', growth: 12 },
  { topic: 'Export PDF', growth: 8 },
  { topic: 'Interface', growth: 5 },
  { topic: 'Application Mobile', growth: -12 },
  { topic: 'Migration', growth: -24 },
];

const CONTEXTS = [
  { name: 'Comparatif direct', count: 1240 },
  { name: 'Recherche alternative', count: 850 },
  { name: 'Question technique', count: 620 },
  { name: 'Demande de prix', count: 430 },
  { name: 'Avis utilisateurs', count: 210 },
  { name: 'Guide d\'utilisation', count: 150 },
];

export default function AgentVisibilityPage() {
  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="AGENT Ops"
          title="Entonnoir de Visibilité"
          subtitle="Mesurez comment votre marque survit au filtrage des agents IA, de la découverte à la sélection."
          actions={
            <div className="flex gap-2">
              <button className={COMMAND_BUTTONS.secondary}><FilterIcon className="w-3.5 h-3.5 mr-2" /> Filtrer par segment</button>
              <button className={COMMAND_BUTTONS.primary}>Générer Rapport</button>
            </div>
          }
        />
      }
    >
      {/* Hero KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CommandMetricCard label="Mentions IA (30j)" value="4,820" detail="+14% vs mois précédent" tone="info" />
        <CommandMetricCard label="Position Moyenne" value="2.4" detail="Objectif: < 2.0" tone="warning" />
        <CommandMetricCard label="Score Visibilité" value="67%" detail="Basé sur 12k requêtes" tone="neutral" />
        <CommandMetricCard label="Croissance Globale" value="+12%" detail="Tendance positive" tone="ok" />
      </div>

      {/* Funnel Section */}
      <div className={cn(COMMAND_PANEL, "mt-6 p-8 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,rgba(91,115,255,0.08)_0%,transparent_70%)]")}>
        <div className="w-full max-w-4xl">
          <h3 className="text-[14px] font-semibold text-white/90 mb-8 text-center uppercase tracking-widest">Entonnoir de Recommandation IA</h3>
          <div className="flex flex-col gap-2">
            {FUNNEL_STAGES.map((stage, i) => (
              <motion.div 
                key={stage.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                {/* Trapezoid visual */}
                <div 
                  className="mx-auto h-20 relative flex items-center justify-between px-6 overflow-hidden transition-all hover:brightness-110"
                  style={{ 
                    width: `${40 + (stage.percent * 0.6)}%`,
                    background: `linear-gradient(90deg, rgba(91,115,255,${0.1 + (i*0.05)}) 0%, rgba(167,139,250,${0.1 + (i*0.05)}) 100%)`,
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    borderLeft: '1px solid rgba(255,255,255,0.2)',
                    borderRight: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: i === 0 ? '12px 12px 4px 4px' : i === FUNNEL_STAGES.length - 1 ? '4px 4px 12px 12px' : '4px',
                    clipPath: i === 0 ? 'polygon(0 0, 100% 0, 98% 100%, 2% 100%)' : 
                              i === 1 ? 'polygon(2% 0, 98% 0, 94% 100%, 6% 100%)' :
                              i === 2 ? 'polygon(6% 0, 94% 0, 88% 100%, 12% 100%)' :
                              'polygon(12% 0, 88% 0, 80% 100%, 20% 100%)'
                  }}
                >
                  <div className="flex flex-col z-10">
                    <span className="text-[14px] font-bold text-white">{stage.name}</span>
                    <span className="text-[10px] text-white/50">{stage.desc}</span>
                  </div>
                  <div className="flex flex-col items-end z-10">
                    <span className="text-[20px] font-bold text-white tabular-nums">{stage.value.toLocaleString('fr-FR')}</span>
                    <span className="text-[10px] font-mono text-white/50">{stage.percent}%</span>
                  </div>
                  
                  {/* Background grid pattern */}
                  <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
                </div>
                
                {/* Conversion connector */}
                {stage.conv && (
                  <div className="h-10 flex flex-col items-center justify-center relative z-0 -my-1">
                    <div className="w-px h-full bg-gradient-to-b from-white/20 to-white/5" />
                    <div className="absolute top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#090b10] border border-white/10 rounded-full text-[10px] font-mono text-indigo-300">
                      {stage.conv}% conv.
                    </div>
                  </div>
                )}
                
                {/* Context query tooltip (absolute right) */}
                <div className="hidden lg:flex absolute top-1/2 -translate-y-1/2 left-[calc(50%+280px)] items-center gap-2 max-w-[200px]">
                  <SearchIcon className="w-3.5 h-3.5 text-white/30 shrink-0" />
                  <span className="text-[11px] font-mono text-white/40 truncate">"{stage.query}"</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* 2-col Split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
        
        {/* Left: Ranked List (60%) */}
        <div className={cn(COMMAND_PANEL, "lg:col-span-3 p-0 overflow-hidden flex flex-col h-[600px]")}>
          <div className="p-4 border-b border-white/[0.05] flex items-center justify-between">
            <h3 className="text-[12px] font-semibold text-white/90">Classement par Agent</h3>
            <div className="relative">
              <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <input type="text" placeholder="Rechercher..." className="bg-white/5 border border-white/10 rounded pl-7 pr-3 py-1 text-[11px] text-white focus:outline-none w-48" />
            </div>
          </div>
          <div className="flex-1 overflow-auto scrollbar-none">
            <table className="w-full text-left text-[12px]">
              <thead className="sticky top-0 bg-[#090b10]/95 backdrop-blur z-10 border-b border-white/[0.05]">
                <tr>
                  <th className="px-4 py-3 font-semibold text-white/40 w-12">#</th>
                  <th className="px-4 py-3 font-semibold text-white/40">Agent</th>
                  <th className="px-4 py-3 font-semibold text-white/40 text-right">Mentions</th>
                  <th className="px-4 py-3 font-semibold text-white/40 text-right">Position</th>
                  <th className="px-4 py-3 font-semibold text-white/40">Dernière requête</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {AGENTS.map((agent, i) => (
                  <motion.tr 
                    key={agent.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-white/[0.02] cursor-pointer group"
                  >
                    <td className="px-4 py-3 font-mono text-white/30">{agent.rank}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white/90">{agent.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider bg-white/5 text-white/50">{agent.platform}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono text-white/80 tabular-nums">{agent.mentions.toLocaleString()}</span>
                        <div className="w-16 h-4 opacity-50 group-hover:opacity-100 transition-opacity">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={agent.sparkline.map((v,i)=>({v,i}))}>
                              <Area type="monotone" dataKey="v" stroke="#8b5cf6" strokeWidth={1} fill="none" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("font-bold tabular-nums", parseFloat(agent.pos) < 2.0 ? "text-emerald-400" : parseFloat(agent.pos) < 4.0 ? "text-amber-400" : "text-rose-400")}>
                        {agent.pos}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-mono text-white/40 truncate max-w-[150px]">"{agent.query}"</span>
                        <span className="text-[9px] text-white/30 flex items-center gap-1"><ClockIcon className="w-2.5 h-2.5" /> {agent.seen}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Topics & Contexts (40%) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <div className={cn(COMMAND_PANEL, "p-5")}>
            <h3 className="text-[12px] font-semibold text-white/90 mb-4 flex items-center gap-2">
              <TrendingUpIcon className="w-4 h-4 text-indigo-400" />
              Sujets Émergents
            </h3>
            <div className="flex flex-wrap gap-2">
              {TRENDING.map(t => (
                <div key={t.topic} className={cn("px-2.5 py-1.5 rounded-lg border flex items-center gap-2 text-[11px]",
                  t.growth > 50 ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" :
                  t.growth > 0 ? "border-white/10 bg-white/5 text-white/80" : "border-rose-500/20 bg-rose-500/10 text-rose-300"
                )}>
                  <span>{t.topic}</span>
                  <span className="font-mono text-[9px] opacity-70">
                    {t.growth > 0 ? '+' : ''}{t.growth}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={cn(COMMAND_PANEL, "p-5 flex-1")}>
            <h3 className="text-[12px] font-semibold text-white/90 mb-4 flex items-center gap-2">
              <CrosshairIcon className="w-4 h-4 text-violet-400" />
              Top Contextes d'Apparition
            </h3>
            <div className="space-y-4">
              {CONTEXTS.map(ctx => (
                <div key={ctx.name}>
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[12px] text-white/80">{ctx.name}</span>
                    <span className="text-[10px] font-mono text-white/40">{ctx.count} citations</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500/60 rounded-full" style={{ width: `${(ctx.count / CONTEXTS[0].count) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
               <div>
                 <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Part de Voix Totale</div>
                 <div className="text-[24px] font-bold text-white tabular-nums">18.4%</div>
               </div>
               <div className="w-16 h-16 relative">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={[{v:18.4}, {v:81.6}]} dataKey="v" innerRadius="70%" outerRadius="100%" stroke="none">
                       <Cell fill="#a78bfa" />
                       <Cell fill="rgba(255,255,255,0.05)" />
                     </Pie>
                   </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex items-center justify-center">
                   <ActivityIcon className="w-4 h-4 text-violet-400" />
                 </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </CommandPageShell>
  );
}
