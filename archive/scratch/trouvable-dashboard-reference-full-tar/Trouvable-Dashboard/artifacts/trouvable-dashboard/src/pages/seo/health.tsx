import React from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { CommandTable } from '@/components/command/CommandTable';
import { CommandChartCard } from '@/components/command/CommandChartCard';
import { COMMAND_BUTTONS, cn } from '@/lib/tokens';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CRAWL_DATA = [
  { date: '01/10', errors: 12 },
  { date: '05/10', errors: 10 },
  { date: '10/10', errors: 15 },
  { date: '15/10', errors: 8 },
  { date: '20/10', errors: 5 },
  { date: '25/10', errors: 3 },
  { date: '30/10', errors: 2 },
];

const ISSUES = [
  ['Erreur 404 (Not Found)', '/produits/ancienne-collection', 'Critique', 'Hier'],
  ['Temps de réponse > 2s', '/blog/article-tres-long', 'Avertissement', 'Aujourd\'hui'],
  ['Chaîne de redirection', '/a-propos -> /about -> /equipe', 'Info', 'Aujourd\'hui'],
  ['Erreur 500 (Server Error)', '/api/panier/add', 'Critique', 'Il y a 3j'],
];

export default function SeoHealthPage() {
  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="SEO Ops"
          title="Santé SEO"
          subtitle="Audit technique, Core Web Vitals et erreurs de crawl."
          actions={
            <button className={COMMAND_BUTTONS.primary}>Lancer un audit complet</button>
          }
        />
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CommandMetricCard label="Score Technique" value="92/100" detail="+2 pts ce mois" tone="ok" />
        <CommandMetricCard label="Erreurs Critiques" value="2" detail="-5 depuis hier" tone="critical" />
        <CommandMetricCard label="Avertissements" value="18" detail="Stables" tone="warning" />
        <CommandMetricCard label="Vitesse Moyenne" value="1.2s" detail="LCP optimal" tone="ok" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CommandChartCard title="Évolution des Erreurs de Crawl" className="lg:col-span-2 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={CRAWL_DATA} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#090a0b', borderColor: 'rgba(255,255,255,0.1)' }} />
              <Line type="monotone" dataKey="errors" stroke="#f87171" strokeWidth={3} dot={{ r: 4, fill: '#090a0b', stroke: '#f87171', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </CommandChartCard>
        
        <div className="flex flex-col gap-4">
          <div className={cn("p-5 rounded-[22px] border border-white/[0.08] bg-white/[0.03] flex-1 flex flex-col justify-center")}>
             <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/[0.4] mb-4">Core Web Vitals</div>
             <div className="space-y-4">
                <div>
                   <div className="flex justify-between text-xs mb-1"><span className="text-white/70">LCP (Chargement)</span><span className="text-emerald-400">1.2s</span></div>
                   <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden"><div className="h-full bg-emerald-400 w-[80%] rounded-full" /></div>
                </div>
                <div>
                   <div className="flex justify-between text-xs mb-1"><span className="text-white/70">FID (Interactivité)</span><span className="text-amber-400">180ms</span></div>
                   <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden"><div className="h-full bg-amber-400 w-[60%] rounded-full" /></div>
                </div>
                <div>
                   <div className="flex justify-between text-xs mb-1"><span className="text-white/70">CLS (Stabilité visuelle)</span><span className="text-emerald-400">0.05</span></div>
                   <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden"><div className="h-full bg-emerald-400 w-[95%] rounded-full" /></div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[14px] font-semibold text-white/90 mb-4">Problèmes détectés</div>
        <CommandTable
          headers={['Type d\'erreur', 'URL concernée', 'Sévérité', 'Détection']}
          rows={ISSUES.map(row => [
            row[0], 
            <span className="text-white/40">{row[1]}</span>,
            <span className={cn("px-2 py-0.5 rounded text-[10px]", row[2] === 'Critique' ? 'bg-red-400/10 text-red-400 border border-red-400/20' : row[2] === 'Avertissement' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' : 'bg-sky-400/10 text-sky-400 border border-sky-400/20')}>{row[2]}</span>,
            row[3]
          ])}
        />
      </div>
    </CommandPageShell>
  );
}
