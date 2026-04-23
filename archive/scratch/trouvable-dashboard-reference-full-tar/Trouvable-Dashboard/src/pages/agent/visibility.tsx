import React, { useState } from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { ArrowRightIcon, TrendingUpIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const FUNNEL = [
  { id: 'f1', label: 'Découverte', count: 12400, color: 'bg-indigo-500', nextPct: 38.8, query: 'outils audit seo ia' },
  { id: 'f2', label: 'Considération', count: 4820, color: 'bg-violet-500', nextPct: 36.1, query: 'comparaison trouvable vs semrush' },
  { id: 'f3', label: 'Recommandation', count: 1740, color: 'bg-emerald-500', nextPct: 35.1, query: 'meilleur outil geo' },
  { id: 'f4', label: 'Sélection (Action)', count: 612, color: 'bg-amber-500', nextPct: null, query: 'réserver démo trouvable' },
];

const RANKED_AGENTS = Array.from({ length: 12 }).map((_, i) => ({
  id: i,
  rank: i + 1,
  name: [
    'B2B Software Matchmaker', 'SEO Audit Assistant', 'Enterprise Tool Recommender', 
    'Tech Stack Analyzer', 'Marketing Budget Optimizer'
  ][i % 5] + (i > 4 ? ` v${i}` : ''),
  platform: ['OpenAI GPTs', 'Claude Projects', 'Perplexity Pro', 'Custom AI'][i % 4],
  mentions: Math.floor(Math.random() * 500) + 50,
  position: (Math.random() * 4 + 1).toFixed(1),
  lastSeen: `Aujourd'hui`,
  sample: ['"Trouvable est le choix #1 pour l\'optimisation LLM"', '"Je recommande Trouvable pour sa matrice de cohérence"'][i%2]
})).sort((a, b) => a.rank - b.rank);

const TOPICS = [
  { name: 'Audit SEO Technique', growth: 24 },
  { name: 'Optimisation LLM', growth: 42 },
  { name: 'Veille Concurrentielle IA', growth: 15 },
  { name: 'Cohérence de Marque', growth: 8 },
  { name: 'APIs Agentic', growth: 56 },
];

export default function AgentVisibilityPage() {
  const [sort, setSort] = useState<'rank'|'mentions'>('rank');

  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="AGENT Ops"
          title="Entonnoir & Visibilité"
          subtitle="Comment les agents autonomes découvrent, évaluent et recommandent votre marque."
          actions={
            <button className={COMMAND_BUTTONS.primary}>Exporter rapport</button>
          }
        />
      }
    >
      {/* Funnel */}
      <div className={cn(COMMAND_PANEL, "p-8 mb-8")}>
        <div className="flex flex-col md:flex-row items-center gap-2 w-full">
          {FUNNEL.map((step, i) => (
            <React.Fragment key={step.id}>
              <div className="flex-1 flex flex-col items-center">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-3">{step.label}</span>
                <div className={cn("w-full h-16 rounded-lg flex items-center justify-center border border-white/10 relative overflow-hidden group", 
                  "bg-white/[0.02]"
                )}>
                  <div className={cn("absolute bottom-0 left-0 right-0 h-1 transition-all group-hover:h-full opacity-20", step.color)} />
                  <span className="text-[20px] font-bold text-white tabular-nums z-10">{step.count.toLocaleString('fr-FR')}</span>
                </div>
                <div className="mt-3 bg-white/5 border border-white/10 rounded px-2 py-1 text-[10px] font-mono text-white/40 truncate w-full text-center" title={step.query}>
                  > {step.query}
                </div>
              </div>
              
              {step.nextPct && (
                <div className="flex flex-col items-center justify-center w-16 shrink-0 mt-8 md:mt-0">
                  <span className="text-[10px] text-indigo-400 font-bold mb-1">{step.nextPct}%</span>
                  <ArrowRightIcon className="w-4 h-4 text-white/20 rotate-90 md:rotate-0" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Ranked List */}
        <div className="flex-1">
          <div className="flex justify-between items-end mb-4 px-1">
            <h3 className="text-[14px] font-semibold text-white/90">Agents Recommandant la Marque (30j)</h3>
            <div className="flex bg-white/[0.04] rounded-full p-1 border border-white/[0.05]">
              <button onClick={() => setSort('rank')} className={cn("px-3 py-1 text-[11px] font-medium rounded-full transition-colors", sort === 'rank' ? "bg-white/[0.1] text-white" : "text-white/50")}>Par Position</button>
              <button onClick={() => setSort('mentions')} className={cn("px-3 py-1 text-[11px] font-medium rounded-full transition-colors", sort === 'mentions' ? "bg-white/[0.1] text-white" : "text-white/50")}>Par Mentions</button>
            </div>
          </div>
          
          <div className={cn(COMMAND_PANEL, "overflow-hidden")}>
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[#090a0b]/95 border-b border-white/[0.05]">
                <tr>
                  <th className="px-5 py-3 font-semibold text-white/40 w-12 text-center">#</th>
                  <th className="px-5 py-3 font-semibold text-white/40">Agent / Assistant</th>
                  <th className="px-5 py-3 font-semibold text-white/40 text-center">Mentions</th>
                  <th className="px-5 py-3 font-semibold text-white/40 text-center">Pos. Moyenne</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {[...RANKED_AGENTS].sort((a,b) => sort === 'rank' ? a.rank - b.rank : b.mentions - a.mentions).map((agent, i) => (
                  <tr key={agent.id} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                    <td className="px-5 py-4 text-center font-bold text-white/30 group-hover:text-white/60">{i+1}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-white/90 mb-1">{agent.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/50 border border-white/10">{agent.platform}</span>
                        <span className="text-[10px] text-white/30 truncate max-w-[200px] italic">{agent.sample}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center font-mono text-white/80">{agent.mentions}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={cn("inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-[13px] tabular-nums",
                        parseFloat(agent.position) <= 2 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        parseFloat(agent.position) <= 5 ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" :
                        "bg-white/5 text-white/50 border border-white/10"
                      )}>
                        {agent.position}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Rail */}
        <div className="w-full lg:w-[320px] flex flex-col gap-6">
          <div className={cn(COMMAND_PANEL, "p-6")}>
            <h3 className="text-[12px] font-semibold text-white/90 mb-4">Sujets en croissance (Intention)</h3>
            <div className="flex flex-wrap gap-2">
              {TOPICS.map(topic => (
                <div key={topic.name} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2">
                  <span className="text-[12px] text-white/80">{topic.name}</span>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center"><TrendingUpIcon className="w-3 h-3 mr-0.5"/> {topic.growth}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className={cn(COMMAND_PANEL, "p-6 flex flex-col items-center text-center")}>
            <h3 className="text-[12px] font-semibold text-white/90 mb-6 w-full text-left">Share of Voice (Agents B2B)</h3>
            <div className="w-32 h-32 relative mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{value: 28}, {value: 72}]} cx="50%" cy="50%" innerRadius={50} outerRadius={60} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                    <Cell fill="#a78bfa" />
                    <Cell fill="rgba(255,255,255,0.05)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">28%</div>
            </div>
            <p className="text-[12px] text-white/50 leading-relaxed">Trouvable apparaît dans 28% des recommandations générées par les agents B2B analysés.</p>
          </div>
        </div>
      </div>
    </CommandPageShell>
  );
}
