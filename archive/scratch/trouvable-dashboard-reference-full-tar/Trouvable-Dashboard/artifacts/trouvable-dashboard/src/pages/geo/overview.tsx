import React from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { CommandChartCard } from '@/components/command/CommandChartCard';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { SparklesIcon, AlertTriangleIcon, CheckCircle2Icon, ArrowUpRightIcon, BotIcon, ZapIcon, MessageSquareIcon, QuoteIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const HERO_DATA = Array.from({ length: 90 }).map((_, i) => ({
  date: `Jour ${i}`,
  value: 40 + Math.sin(i / 10) * 15 + (i / 90) * 20 + (Math.random() * 5)
}));

const MODELS_DATA = [
  { id: 'gpt4o', name: 'ChatGPT 4o', logo: 'bg-emerald-500', share: 92, citations: 450, sentiment: 'positive', pos: 1.2, sparkline: [40, 50, 45, 60, 80, 85, 92] },
  { id: 'claude35', name: 'Claude 3.5', logo: 'bg-amber-500', share: 78, citations: 210, sentiment: 'neutral', pos: 2.1, sparkline: [30, 40, 35, 45, 55, 70, 78] },
  { id: 'perplexity', name: 'Perplexity', logo: 'bg-sky-500', share: 96, citations: 890, sentiment: 'positive', pos: 1.1, sparkline: [70, 75, 80, 85, 90, 95, 96] },
  { id: 'gemini', name: 'Gemini 1.5', logo: 'bg-indigo-500', share: 45, citations: 85, sentiment: 'neutral', pos: 4.5, sparkline: [20, 25, 22, 30, 35, 40, 45] },
  { id: 'mistral', name: 'Mistral Large', logo: 'bg-orange-500', share: 30, citations: 42, sentiment: 'negative', pos: 5.2, sparkline: [40, 35, 30, 25, 28, 30, 30] },
];

const TIMELINE = [
  { id: 1, type: 'citation', model: 'Perplexity', query: 'meilleures agences seo paris', snippet: '"L\'agence Nova se distingue par son expertise technique..."', time: 'Il y a 12 min' },
  { id: 2, type: 'citation', model: 'ChatGPT 4o', query: 'outil audit sémantique', snippet: '"Trouvable propose une suite complète pour l\'analyse sémantique..."', time: 'Il y a 45 min' },
  { id: 3, type: 'alert', model: 'Claude 3.5', query: 'tarifs trouvable', snippet: '"Les tarifs débutent à 999€/mois" (Faux: 499€)', time: 'Il y a 2h' },
  { id: 4, type: 'citation', model: 'Gemini 1.5', query: 'alternative ahrefs france', snippet: '"Parmi les alternatives françaises, on retrouve Trouvable..."', time: 'Il y a 4h' },
];

const TOPICS = [
  { topic: 'Audit Technique', value: 85 },
  { topic: 'Outils SEO', value: 65 },
  { topic: 'Analyse Sémantique', value: 45 },
  { topic: 'Agences Paris', value: 30 },
  { topic: 'Formation', value: 15 },
];

export default function GeoOverviewPage() {
  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="GEO Ops"
          title="Command Bridge IA"
          subtitle="Générative Engine Optimization. Surveillez comment les LLMs parlent de votre marque en temps réel."
          actions={
            <div className="flex gap-2">
              <button className={COMMAND_BUTTONS.secondary}>Configurer alertes</button>
              <button className={COMMAND_BUTTONS.primary}><ZapIcon className="w-3.5 h-3.5 mr-1" /> Lancer Scan Global</button>
            </div>
          }
        />
      }
    >
      {/* Hero Section */}
      <div className={cn(COMMAND_PANEL, "relative overflow-hidden p-0 h-[240px] flex items-center justify-center border-indigo-500/20")}>
        {/* Background Chart */}
        <div className="absolute inset-0 opacity-30">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={HERO_DATA}>
              <defs>
                <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.5}/>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} fill="url(#heroGradient)" isAnimationActive={true} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-indigo-300 mb-2 flex items-center gap-2">
            <SparklesIcon className="w-4 h-4" /> Visibilité IA Globale
          </div>
          <div className="flex items-baseline gap-4">
            <span className="text-[72px] font-bold tracking-tighter text-white tabular-nums leading-none">67<span className="text-[40px] text-white/50">%</span></span>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold">
              <ArrowUpRightIcon className="w-4 h-4" /> +12%
            </div>
          </div>
          <div className="mt-4 text-[13px] text-white/60">Basé sur 2,450 requêtes transactionnelles sur les 30 derniers jours</div>
        </div>
      </div>

      {/* Model Columns */}
      <div className="mt-4">
        <h3 className="text-[12px] font-semibold text-white/90 mb-3 ml-1">Performance par LLM</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {MODELS_DATA.map((model, i) => (
            <motion.div 
              key={model.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(COMMAND_PANEL, "p-4 flex flex-col hover:bg-white/[0.04] transition-colors cursor-pointer group")}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shadow-lg", model.logo)}>
                  <BotIcon className="w-3 h-3 text-white" />
                </div>
                <span className="text-[12px] font-bold text-white/90 truncate">{model.name}</span>
              </div>
              
              <div className="flex items-end justify-between mb-4">
                <div>
                  <div className="text-[24px] font-bold text-white tabular-nums leading-none">{model.share}%</div>
                  <div className="text-[10px] text-white/40 mt-1 uppercase tracking-widest font-semibold">Présence</div>
                </div>
                <div className="w-16 h-8 opacity-60 group-hover:opacity-100 transition-opacity">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={model.sparkline.map((v, i) => ({ v, i }))}>
                      <Area type="monotone" dataKey="v" stroke="#fff" strokeWidth={1.5} fill="none" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-white/[0.05]">
                <div>
                  <div className="text-[10px] text-white/40 mb-0.5">Citations</div>
                  <div className="text-[12px] font-semibold text-white/80 tabular-nums">{model.citations}</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/40 mb-0.5">Position avg</div>
                  <div className="text-[12px] font-semibold text-white/80 tabular-nums">#{model.pos}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Layout: Feeds & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        
        {/* Timeline Feed (Left 60%) */}
        <div className={cn(COMMAND_PANEL, "col-span-1 lg:col-span-2 p-0 overflow-hidden flex flex-col h-[400px]")}>
          <div className="p-4 border-b border-white/[0.05] bg-white/[0.02] flex items-center justify-between">
            <h3 className="text-[12px] font-semibold text-white/90">Flux en Temps Réel</h3>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">LIVE</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
            {TIMELINE.map((item, i) => (
              <div key={item.id} className="relative pl-6 pb-2">
                {/* Timeline line */}
                {i !== TIMELINE.length - 1 && <div className="absolute left-[11px] top-6 bottom-0 w-px bg-white/[0.05]" />}
                
                {/* Timeline dot */}
                <div className={cn(
                  "absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-[#0a0c12] flex items-center justify-center z-10",
                  item.type === 'alert' ? 'bg-amber-500 text-amber-950' : 'bg-indigo-500 text-white'
                )}>
                  {item.type === 'alert' ? <AlertTriangleIcon className="w-3 h-3" /> : <QuoteIcon className="w-3 h-3" />}
                </div>
                
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 hover:bg-white/[0.04] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/80">{item.model}</span>
                      <span className="text-[11px] font-mono text-white/50">{item.query}</span>
                    </div>
                    <span className="text-[10px] text-white/30">{item.time}</span>
                  </div>
                  <p className="text-[13px] text-white/80 leading-relaxed font-serif italic border-l-2 border-white/10 pl-3">
                    {item.snippet}
                  </p>
                  {item.type === 'alert' && (
                    <div className="mt-3 flex gap-2">
                      <button className="text-[10px] px-3 py-1 bg-amber-500/20 text-amber-300 rounded font-medium hover:bg-amber-500/30 transition-colors">Corriger Fait</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 40% - Coverage Chart */}
        <div className={cn(COMMAND_PANEL, "col-span-1 p-5 flex flex-col h-[400px]")}>
          <h3 className="text-[12px] font-semibold text-white/90 mb-1">Couverture Topique</h3>
          <p className="text-[10px] text-white/40 mb-6">Dans quels contextes l'IA mentionne la marque.</p>
          
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TOPICS} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="topic" type="category" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }} width={120} />
                <RechartsTooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                  contentStyle={{ backgroundColor: '#090a0b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]}>
                  {TOPICS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`rgba(139, 92, 246, ${0.4 + (entry.value / 100) * 0.6})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </CommandPageShell>
  );
}
