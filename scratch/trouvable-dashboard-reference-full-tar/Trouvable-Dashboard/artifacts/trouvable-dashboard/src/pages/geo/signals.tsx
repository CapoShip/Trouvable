import React from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ExternalLinkIcon, ArrowUpRightIcon, StarIcon, NewspaperIcon, LinkIcon, Share2Icon, MicIcon, MessageSquareIcon, HashIcon, RefreshCwIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const RADAR_DATA = [
  { subject: 'RP & Médias', A: 85 },
  { subject: 'Avis G2/Capterra', A: 65 },
  { subject: 'Backlinks (.edu/.gov)', A: 90 },
  { subject: 'Mentions Sociales', A: 45 },
  { subject: 'Podcasts/Audio', A: 30 },
  { subject: 'Forums (Reddit)', A: 55 },
  { subject: 'Données Structurées', A: 95 },
  { subject: 'Fraîcheur (Updates)', A: 80 },
];

const SIGNAL_SOURCES = [
  { id: 'pr', name: 'Mentions Presse', icon: NewspaperIcon, strength: 85, trend: '+12%', color: 'text-indigo-400', bg: 'bg-indigo-400' },
  { id: 'reviews', name: 'Avis Logiciels', icon: StarIcon, strength: 65, trend: '+5%', color: 'text-amber-400', bg: 'bg-amber-400' },
  { id: 'links', name: 'Backlinks d\'Autorité', icon: LinkIcon, strength: 90, trend: 'Stable', color: 'text-emerald-400', bg: 'bg-emerald-400' },
  { id: 'social', name: 'Engagement Social', icon: Share2Icon, strength: 45, trend: '-8%', color: 'text-rose-400', bg: 'bg-rose-400' },
  { id: 'audio', name: 'Podcasts & Vidéos', icon: MicIcon, strength: 30, trend: '+2%', color: 'text-sky-400', bg: 'bg-sky-400' },
  { id: 'forums', name: 'Forums Communautaires', icon: MessageSquareIcon, strength: 55, trend: '+15%', color: 'text-violet-400', bg: 'bg-violet-400' },
  { id: 'schema', name: 'Densité Schema.org', icon: HashIcon, strength: 95, trend: 'Stable', color: 'text-emerald-400', bg: 'bg-emerald-400' },
  { id: 'fresh', name: 'Vélocité de publication', icon: RefreshCwIcon, strength: 80, trend: '+25%', color: 'text-emerald-400', bg: 'bg-emerald-400' },
];

const EVENTS = [
  { id: 1, source: 'TechCrunch', title: 'Trouvable lève 5M€ pour le GEO', type: 'RP', impact: 'high', time: 'Aujourd\'hui' },
  { id: 2, source: 'G2.com', title: 'Nouvel avis 5 étoiles (Enterprise)', type: 'Avis', impact: 'medium', time: 'Hier' },
  { id: 3, source: 'Reddit r/SEO', title: 'Mention naturelle dans un top 10', type: 'Forum', impact: 'medium', time: 'Il y a 2j' },
  { id: 4, source: 'Université Paris 8', title: 'Lien entrant depuis un syllabus (.edu)', type: 'Backlink', impact: 'high', time: 'Il y a 5j' },
];

export default function GeoSignalsPage() {
  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="GEO Ops"
          title="Signaux de Confiance"
          subtitle="Évaluation des signaux externes (E-E-A-T) utilisés par les LLMs pour jauger l'autorité de votre marque."
          actions={
            <div className="flex gap-2">
               <button className={COMMAND_BUTTONS.secondary}>Connecter APIs (Ahrefs, G2)</button>
               <button className={COMMAND_BUTTONS.primary}>Exporter Scorecard</button>
            </div>
          }
        />
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CommandMetricCard label="Score d'Autorité Global" value="78/100" detail="Forte confiance LLM" tone="ok" />
        <CommandMetricCard label="Signaux Positifs (30j)" value="142" detail="+24% vs mois préc." tone="info" />
        <CommandMetricCard label="Mentions Haut-Tiers" value="18" detail="Sites DR > 70" tone="ok" />
        <CommandMetricCard label="Lacune Principale" value="Audio/Vidéo" detail="Peu de mentions YouTube/Podcasts" tone="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        
        {/* Left: Polar Chart */}
        <div className={cn(COMMAND_PANEL, "flex flex-col p-0 overflow-hidden h-[420px]")}>
          <div className="p-5 border-b border-white/[0.05] bg-white/[0.02]">
            <h3 className="text-[12px] font-semibold text-white/90">Empreinte des Signaux</h3>
          </div>
          <div className="flex-1 relative pb-6">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={RADAR_DATA}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
                <Radar name="Intensité" dataKey="A" stroke="#5b73ff" strokeWidth={2} fill="#5b73ff" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Center: Source Breakdown Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
           {SIGNAL_SOURCES.map((source, i) => {
             const Icon = source.icon;
             return (
               <motion.div 
                 key={source.id}
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: i * 0.05 }}
                 className={cn(COMMAND_PANEL, "p-4 flex flex-col justify-between hover:bg-white/[0.04] transition-colors")}
               >
                 <div className="flex justify-between items-start mb-4">
                   <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.05]", source.color)}>
                     <Icon className="w-4 h-4" />
                   </div>
                   <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1", 
                     source.trend.includes('+') ? "text-emerald-400 bg-emerald-400/10" : 
                     source.trend.includes('-') ? "text-rose-400 bg-rose-400/10" : "text-white/40 bg-white/5"
                   )}>
                     {source.trend}
                   </span>
                 </div>
                 
                 <div>
                   <h4 className="text-[11px] font-semibold text-white/60 mb-1">{source.name}</h4>
                   <div className="flex items-end gap-2">
                     <span className="text-[24px] font-bold text-white tabular-nums leading-none">{source.strength}</span>
                     <span className="text-[10px] text-white/30 mb-0.5">/100</span>
                   </div>
                   <div className="h-1 w-full bg-white/5 rounded-full mt-3 overflow-hidden">
                     <div className={cn("h-full rounded-full", source.bg)} style={{ width: `${source.strength}%` }} />
                   </div>
                 </div>
               </motion.div>
             )
           })}
        </div>
      </div>

      {/* Bottom: Event Feed */}
      <div className={cn(COMMAND_PANEL, "mt-6 p-0 overflow-hidden")}>
         <div className="p-5 border-b border-white/[0.05] bg-white/[0.02]">
            <h3 className="text-[12px] font-semibold text-white/90">Événements de Signaux Récents</h3>
         </div>
         <div className="divide-y divide-white/[0.02]">
            {EVENTS.map(ev => (
               <div key={ev.id} className="p-4 hover:bg-white/[0.02] transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                     <div className={cn("w-2 h-2 rounded-full", ev.impact === 'high' ? 'bg-indigo-400' : 'bg-white/20')} />
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{ev.source}</span>
                           <span className="text-[10px] px-1.5 py-0.5 bg-white/5 text-white/50 rounded">{ev.type}</span>
                        </div>
                        <h4 className="text-[13px] font-medium text-white/90">{ev.title}</h4>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="text-[11px] text-white/40">{ev.time}</span>
                     <button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white">
                        <ArrowUpRightIcon className="w-4 h-4" />
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </CommandPageShell>
  );
}
