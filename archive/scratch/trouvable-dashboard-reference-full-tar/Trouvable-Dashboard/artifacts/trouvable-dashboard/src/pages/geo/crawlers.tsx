import React from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { CommandTable } from '@/components/command/CommandTable';
import { CommandChartCard } from '@/components/command/CommandChartCard';
import { COMMAND_BUTTONS, cn } from '@/lib/tokens';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CRAWLER_LOGS = [
  ['GPTBot', '10.24.1.5', '/tarifs', '200 OK', 'Aujourd\'hui 10:42'],
  ['ClaudeBot', '192.168.1.12', '/blog/nouveautes', '200 OK', 'Aujourd\'hui 09:15'],
  ['PerplexityBot', '8.8.8.8', '/api/data', '403 Forbidden', 'Hier 22:30'],
  ['GPTBot', '10.24.1.6', '/a-propos', '200 OK', 'Hier 18:45'],
  ['OAI-SearchBot', '10.24.1.8', '/contact', '200 OK', 'Hier 15:20'],
];

const CRAWLER_STATS = [
  { name: 'GPTBot', hits: 1450 },
  { name: 'ClaudeBot', hits: 890 },
  { name: 'PerplexityBot', hits: 1200 },
  { name: 'OAI-SearchBot', hits: 450 },
  { name: 'Google-Extended', hits: 320 },
];

export default function GeoCrawlersPage() {
  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="GEO Ops"
          title="Crawlers IA"
          subtitle="Suivi de l'activité des robots d'exploration des LLMs sur votre site."
          actions={
            <button className={COMMAND_BUTTONS.secondary}>Configurer robots.txt</button>
          }
        />
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CommandMetricCard label="Hits Totaux (30j)" value="4,310" detail="+15% vs mois prec." tone="info" />
        <CommandMetricCard label="Crawler Principal" value="GPTBot" detail="34% du trafic IA" tone="neutral" />
        <CommandMetricCard label="Erreurs d'Accès" value="24" detail="Codes 403/404" tone="warning" />
        <CommandMetricCard label="Bande Passante IA" value="1.2 GB" detail="Impact mineur" tone="ok" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-2">
        <CommandChartCard title="Répartition par Crawler" className="lg:col-span-1 h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={CRAWLER_STATS} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#090a0b', borderColor: 'rgba(255,255,255,0.1)' }}/>
              <Bar dataKey="hits" fill="#8b5cf6" radius={[0,4,4,0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </CommandChartCard>
        
        <div className="lg:col-span-2 flex flex-col">
          <div className="text-[14px] font-semibold text-white/90 mb-4 px-1">Derniers Hits Enregistrés</div>
          <CommandTable
            className="flex-1"
            headers={['User Agent', 'IP', 'Ressource', 'Statut HTTP', 'Horodatage']}
            rows={CRAWLER_LOGS.map(row => [
              <span className="text-violet-300 font-medium">{row[0]}</span>,
              <span className="text-white/40 font-mono text-[10px]">{row[1]}</span>,
              <span className="text-white/70 font-mono text-[11px]">{row[2]}</span>,
              <span className={cn("px-2 py-0.5 rounded text-[10px]", 
                (row[3] as string).includes('200') ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 
                'bg-red-400/10 text-red-400 border border-red-400/20'
              )}>{row[3]}</span>,
              <span className="text-white/40 text-[11px]">{row[4]}</span>
            ])}
          />
        </div>
      </div>
    </CommandPageShell>
  );
}
