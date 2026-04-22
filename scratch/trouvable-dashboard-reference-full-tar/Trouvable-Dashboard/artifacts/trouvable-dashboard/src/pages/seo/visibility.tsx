import React, { useState } from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { CommandTable } from '@/components/command/CommandTable';
import { CommandChartCard } from '@/components/command/CommandChartCard';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon, SearchIcon, FilterIcon, MoreHorizontalIcon, LayoutGridIcon, SmartphoneIcon, MonitorIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const KEYWORDS = Array.from({ length: 40 }).map((_, i) => ({
  id: `kw-${i}`,
  term: [
    'logiciel seo', 'outil audit seo', 'plateforme referencement', 'agence seo paris', 'optimisation on-page',
    'analyse semantique', 'suivi positionnement', 'audit technique seo', 'creation cocon semantique', 'backlinks qualite'
  ][i % 10] + (i >= 10 ? ` ${i}` : ''),
  position: Math.floor(Math.random() * 20) + 1,
  delta: Math.floor(Math.random() * 10) - 4,
  volume: Math.floor(Math.random() * 20000) + 1000,
  intent: ['Transactionnel', 'Informationnel', 'Navigationnel', 'Commercial'][i % 4],
  serpFeatures: ['knowledge_panel', 'featured_snippet', 'people_also_ask', 'local_pack'].slice(0, Math.floor(Math.random() * 3) + 1),
  share: Math.floor(Math.random() * 80) + 5,
  sparkline: Array.from({ length: 10 }).map(() => Math.floor(Math.random() * 100))
}));

const DEVICE_DATA = [
  { name: 'Mobile', value: 68, color: '#5b73ff' },
  { name: 'Desktop', value: 29, color: '#a78bfa' },
  { name: 'Tablette', value: 3, color: '#34d399' },
];

const INTENT_DATA = [
  { name: 'Transactionnel', value: 45 },
  { name: 'Informationnel', value: 30 },
  { name: 'Commercial', value: 15 },
  { name: 'Navigationnel', value: 10 },
];

export default function SeoVisibilityPage() {
  const [timeRange, setTimeRange] = useState('30d');
  
  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="SEO Ops"
          title="Visibilité SEO"
          subtitle="Salle de marché organique. Suivi des positions, part de voix et mots-clés stratégiques."
          actions={
            <div className="flex items-center gap-2">
              <div className="flex bg-white/[0.04] rounded-full p-1 border border-white/[0.05]">
                {['7d', '30d', '90d', '12m'].map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={cn(
                      "px-3 py-1 text-[11px] font-medium rounded-full transition-colors",
                      timeRange === range ? "bg-white/[0.1] text-white" : "text-white/50 hover:text-white/80"
                    )}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <button className={COMMAND_BUTTONS.secondary}>
                <FilterIcon className="w-3.5 h-3.5" />
                Filtres
              </button>
              <button className={COMMAND_BUTTONS.primary}>Exporter</button>
            </div>
          }
        />
      }
    >
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {['Concurrent A', 'Concurrent B', 'Concurrent C', 'Concurrent D'].map((comp, i) => (
          <div key={comp} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer whitespace-nowrap">
            <div className={cn("w-2 h-2 rounded-full", ['bg-indigo-400', 'bg-violet-400', 'bg-emerald-400', 'bg-amber-400'][i])} />
            <span className="text-[12px] font-medium text-white/80">{comp}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-280px)] min-h-[600px]">
        {/* Left: Trading desk table (2/3) */}
        <div className={cn(COMMAND_PANEL, "col-span-1 lg:col-span-2 flex flex-col overflow-hidden")}>
          <div className="p-4 border-b border-white/[0.05] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input 
                  type="text" 
                  placeholder="Rechercher un mot-clé..." 
                  className="bg-white/[0.03] border border-white/[0.08] rounded-full pl-8 pr-4 py-1.5 text-[12px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64 transition-all"
                />
              </div>
              <span className="text-[11px] text-white/40">{KEYWORDS.length} mots-clés suivis</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="sticky top-0 bg-[#090a0b]/95 backdrop-blur z-10">
                <tr className="border-b border-white/[0.05]">
                  <th className="px-4 py-2 font-medium text-white/40">Mot-clé</th>
                  <th className="px-4 py-2 font-medium text-white/40 w-24">Position</th>
                  <th className="px-4 py-2 font-medium text-white/40 w-32">Intention</th>
                  <th className="px-4 py-2 font-medium text-white/40 w-24 text-right">Volume</th>
                  <th className="px-4 py-2 font-medium text-white/40 w-32">Tendance (30j)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {KEYWORDS.map((kw, i) => (
                  <motion.tr 
                    key={kw.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.02 }}
                    className="group hover:bg-white/[0.02] cursor-pointer"
                  >
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white/90">{kw.term}</span>
                        <div className="flex gap-1">
                          {kw.serpFeatures.map(f => (
                            <span key={f} className="w-1.5 h-1.5 rounded-full bg-white/20" title={f} />
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 tabular-nums">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{kw.position}</span>
                        {kw.delta !== 0 ? (
                          <span className={cn(
                            "flex items-center text-[10px] px-1.5 py-0.5 rounded",
                            kw.delta > 0 ? "bg-emerald-400/10 text-emerald-400" : "bg-rose-400/10 text-rose-400"
                          )}>
                            {kw.delta > 0 ? <ArrowUpIcon className="w-2.5 h-2.5 mr-0.5" /> : <ArrowDownIcon className="w-2.5 h-2.5 mr-0.5" />}
                            {Math.abs(kw.delta)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-white/30 px-1.5 py-0.5">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full border",
                        kw.intent === 'Transactionnel' ? "border-violet-400/20 bg-violet-400/10 text-violet-300" :
                        kw.intent === 'Informationnel' ? "border-sky-400/20 bg-sky-400/10 text-sky-300" :
                        kw.intent === 'Commercial' ? "border-amber-400/20 bg-amber-400/10 text-amber-300" :
                        "border-white/10 bg-white/5 text-white/60"
                      )}>
                        {kw.intent}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-white/70">
                      {kw.volume.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-2">
                      <div className="w-24 h-6 flex items-end gap-0.5">
                        {kw.sparkline.map((val, idx) => (
                          <div 
                            key={idx} 
                            className="flex-1 bg-indigo-500/40 rounded-t-[1px] group-hover:bg-indigo-400 transition-colors"
                            style={{ height: `${Math.max(10, val)}%` }}
                          />
                        ))}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right rail */}
        <div className="col-span-1 flex flex-col gap-4 overflow-y-auto pr-2 scrollbar-none">
          {/* Share of voice donut */}
          <div className={cn(COMMAND_PANEL, "p-5")}>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-4">Part de voix (Desktop vs Mobile)</h3>
            <div className="h-40 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={DEVICE_DATA}
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {DEVICE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#090a0b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-white tracking-tight">35%</span>
                <span className="text-[10px] text-white/40">Globale</span>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {DEVICE_DATA.map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[11px] text-white/60">{d.name}</span>
                  <span className="text-[11px] font-semibold text-white/90 tabular-nums">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Intent breakdown */}
          <div className={cn(COMMAND_PANEL, "p-5")}>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-4">Répartition par Intention</h3>
            <div className="space-y-3">
              {INTENT_DATA.map(intent => (
                <div key={intent.name}>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-white/70">{intent.name}</span>
                    <span className="text-white font-medium tabular-nums">{intent.value}%</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-violet-400/80" 
                      style={{ width: `${intent.value}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Movers Split */}
          <div className={cn(COMMAND_PANEL, "p-0 overflow-hidden flex flex-col min-h-[200px]")}>
            <div className="flex border-b border-white/[0.05]">
              <div className="flex-1 p-3 text-center border-r border-white/[0.05] bg-emerald-400/5 text-emerald-400 text-[11px] font-semibold uppercase tracking-wider">
                Gagnants
              </div>
              <div className="flex-1 p-3 text-center bg-rose-400/5 text-rose-400 text-[11px] font-semibold uppercase tracking-wider">
                Perdants
              </div>
            </div>
            <div className="flex flex-1 divide-x divide-white/[0.05]">
              <div className="flex-1 p-3 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-[11px] text-white/80 truncate pr-2">mot clé gagnant {i}</span>
                    <span className="text-[10px] text-emerald-400 font-bold tabular-nums flex items-center shrink-0">
                      <ArrowUpIcon className="w-2.5 h-2.5 mr-0.5" />{Math.floor(Math.random()*10)+1}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex-1 p-3 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-[11px] text-white/80 truncate pr-2">mot clé perdant {i}</span>
                    <span className="text-[10px] text-rose-400 font-bold tabular-nums flex items-center shrink-0">
                      <ArrowDownIcon className="w-2.5 h-2.5 mr-0.5" />{Math.floor(Math.random()*10)+1}
                    </span>
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
