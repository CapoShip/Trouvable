import React from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { PlusIcon, FileTextIcon, ArrowUpRightIcon, StarIcon } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const TOPICS = ['Logiciels RH', 'Management', 'Recrutement', 'QVT', 'Formation'];
const FUNNEL_STAGES = [
  { id: 'tofu', label: 'TOFU (Sensibilisation)', color: 'bg-sky-400' },
  { id: 'mofu', label: 'MOFU (Considération)', color: 'bg-indigo-400' },
  { id: 'bofu', label: 'BOFU (Décision)', color: 'bg-violet-400' }
];

// Matrix: Topic x Funnel Stage -> Count of articles
const MATRIX_DATA: Record<string, Record<string, number>> = {
  'Logiciels RH': { tofu: 12, mofu: 8, bofu: 15 },
  'Management': { tofu: 24, mofu: 5, bofu: 2 },
  'Recrutement': { tofu: 18, mofu: 12, bofu: 6 },
  'QVT': { tofu: 35, mofu: 4, bofu: 0 },
  'Formation': { tofu: 8, mofu: 3, bofu: 1 },
};

const TOP_ARTICLES = Array.from({ length: 5 }).map((_, i) => ({
  id: `art-${i}`,
  title: ['Guide complet de la paie 2024', 'Comparatif logiciels SIRH', 'Comment fidéliser ses talents', 'Calculer le ROI d\'un recrutement', 'Modèle de fiche de poste'][i],
  topic: ['Logiciels RH', 'Logiciels RH', 'Management', 'Recrutement', 'Recrutement'][i],
  stage: ['tofu', 'bofu', 'tofu', 'mofu', 'bofu'][i],
  traffic: Math.floor(Math.random() * 5000) + 1000,
  conversions: Math.floor(Math.random() * 50) + 5,
  score: Math.floor(Math.random() * 20) + 80,
  sparkline: Array.from({ length: 15 }).map(() => Math.floor(Math.random() * 100))
}));

// Generate a mock calendar grid
const WEEKS = 5;
const DAYS = 7;
const CALENDAR_START = new Date();
CALENDAR_START.setDate(CALENDAR_START.getDate() - CALENDAR_START.getDay() - 7); // Start a bit in the past, on Sunday

const generateCalendar = () => {
  const grid = [];
  let currentDate = new Date(CALENDAR_START);
  
  for (let w = 0; w < WEEKS; w++) {
    const week = [];
    for (let d = 0; d < DAYS; d++) {
      const hasContent = Math.random() > 0.6;
      const status = hasContent ? ['publie', 'programme', 'draft', 'idee'][Math.floor(Math.random() * 4)] : null;
      week.push({
        date: new Date(currentDate),
        isToday: currentDate.toDateString() === new Date().toDateString(),
        content: hasContent ? {
          title: `Article SEO #${Math.floor(Math.random() * 100)}`,
          status
        } : null
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    grid.push(week);
  }
  return grid;
};

const CALENDAR = generateCalendar();

export default function SeoContentPage() {
  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="SEO Ops"
          title="Matrice de Contenu"
          subtitle="Planification éditoriale, analyse des gaps sémantiques par étape du tunnel."
          actions={
            <button className={COMMAND_BUTTONS.primary}>Générer un brief IA</button>
          }
        />
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CommandMetricCard label="Score Couverture" value="64%" detail="Objectif: 80%" tone="warning" />
        <CommandMetricCard label="Gaps BOFU" value="12" detail="Sujets sans contenu de décision" tone="critical" />
        <CommandMetricCard label="Articles Programmés" value="8" detail="30 prochains jours" tone="info" />
        <CommandMetricCard label="Taux de Conversion SEO" value="2.4%" detail="+0.3% ce mois" tone="ok" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-4">
        
        {/* Left: Content Matrix */}
        <div className={cn(COMMAND_PANEL, "flex flex-col overflow-hidden p-0 h-[480px]")}>
          <div className="p-5 border-b border-white/[0.05] bg-white/[0.02]">
            <h3 className="text-[12px] font-semibold text-white/90">Matrice Sémantique vs Tunnel</h3>
            <p className="text-[11px] text-white/50 mt-1">Identification des opportunités ("gaps") par cluster thématique.</p>
          </div>
          
          <div className="flex-1 overflow-x-auto overflow-y-auto p-5">
            <div className="min-w-[500px]">
              <div className="grid grid-cols-4 gap-2 mb-2">
                <div className="col-span-1"></div>
                {FUNNEL_STAGES.map(stage => (
                  <div key={stage.id} className="text-center">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">{stage.id}</div>
                    <div className="text-[9px] text-white/30 truncate px-1">{stage.label.split(' ')[1].replace(/[()]/g, '')}</div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2">
                {TOPICS.map((topic, i) => (
                  <motion.div 
                    key={topic}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="grid grid-cols-4 gap-2"
                  >
                    <div className="col-span-1 flex items-center justify-end pr-3">
                      <span className="text-[11px] font-medium text-white/80 text-right">{topic}</span>
                    </div>
                    {FUNNEL_STAGES.map(stage => {
                      const count = MATRIX_DATA[topic]?.[stage.id] || 0;
                      const isEmpty = count === 0;
                      const isLow = count > 0 && count <= 3;
                      
                      return (
                        <div 
                          key={`${topic}-${stage.id}`}
                          className={cn(
                            "relative h-12 rounded-lg flex items-center justify-center group cursor-pointer border transition-colors",
                            isEmpty ? "bg-rose-400/5 border-rose-400/20 hover:bg-rose-400/10" :
                            isLow ? "bg-amber-400/5 border-amber-400/20 hover:bg-amber-400/10" :
                            "bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.08]"
                          )}
                        >
                          {isEmpty ? (
                            <div className="flex flex-col items-center">
                              <span className="text-[14px] font-bold text-rose-400/50 group-hover:hidden">0</span>
                              <PlusIcon className="w-4 h-4 text-rose-400 hidden group-hover:block" />
                            </div>
                          ) : (
                            <span className={cn(
                              "text-[14px] font-bold tabular-nums",
                              isLow ? "text-amber-400/80" : "text-white/70"
                            )}>
                              {count}
                            </span>
                          )}
                          
                          {/* Tooltip on hover */}
                          <div className="absolute inset-0 bg-black/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-10">
                            <span className="text-[9px] font-semibold text-white/90">
                              {isEmpty ? "Créer brief" : `Voir ${count} articles`}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Editorial Calendar */}
        <div className={cn(COMMAND_PANEL, "flex flex-col overflow-hidden p-0 h-[480px]")}>
          <div className="p-5 border-b border-white/[0.05] bg-white/[0.02] flex items-center justify-between">
            <div>
              <h3 className="text-[12px] font-semibold text-white/90">Calendrier Éditorial</h3>
              <p className="text-[11px] text-white/50 mt-1">Novembre 2024</p>
            </div>
            <div className="flex gap-3">
              <span className="flex items-center gap-1.5 text-[9px] text-white/60 uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-emerald-400/50" /> Publié</span>
              <span className="flex items-center gap-1.5 text-[9px] text-white/60 uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-sky-400/50" /> Programmé</span>
              <span className="flex items-center gap-1.5 text-[9px] text-white/60 uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-amber-400/50" /> Brouillon</span>
            </div>
          </div>
          
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(d => (
                <div key={d} className="text-center text-[9px] font-bold uppercase tracking-widest text-white/30 py-1">{d}</div>
              ))}
            </div>
            
            <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-1">
              {CALENDAR.flat().map((day, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "rounded-md border p-1 flex flex-col relative group transition-colors overflow-hidden",
                    day.isToday ? "border-indigo-500/50 bg-indigo-500/10" : "border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.04]"
                  )}
                >
                  <span className={cn(
                    "text-[9px] font-semibold mb-1 w-full text-right pr-1",
                    day.isToday ? "text-indigo-300" : "text-white/30"
                  )}>
                    {day.date.getDate()}
                  </span>
                  
                  {day.content && (
                    <div className={cn(
                      "flex-1 rounded p-1 flex flex-col justify-center",
                      day.content.status === 'publie' ? "bg-emerald-400/10 border border-emerald-400/20" :
                      day.content.status === 'programme' ? "bg-sky-400/10 border border-sky-400/20" :
                      day.content.status === 'draft' ? "bg-amber-400/10 border border-amber-400/20" :
                      "bg-white/5 border border-white/10"
                    )}>
                      <FileTextIcon className={cn("w-3 h-3 mb-0.5 mx-auto",
                        day.content.status === 'publie' ? "text-emerald-400" :
                        day.content.status === 'programme' ? "text-sky-400" :
                        day.content.status === 'draft' ? "text-amber-400" :
                        "text-white/40"
                      )} />
                      <span className="text-[7px] text-white/70 leading-tight text-center line-clamp-2 hidden lg:block">
                        {day.content.title}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Top Performing Articles */}
      <div className={cn(COMMAND_PANEL, "mt-6 overflow-hidden p-0")}>
        <div className="p-5 border-b border-white/[0.05] bg-white/[0.02]">
          <h3 className="text-[12px] font-semibold text-white/90">Top Contenus (30 derniers jours)</h3>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="px-5 py-3 font-medium text-white/40">Article</th>
                <th className="px-5 py-3 font-medium text-white/40">Cluster & Tunnel</th>
                <th className="px-5 py-3 font-medium text-white/40 text-right">Trafic SEO</th>
                <th className="px-5 py-3 font-medium text-white/40 text-right">Conversions</th>
                <th className="px-5 py-3 font-medium text-white/40 w-32">Score d'Optimisation</th>
                <th className="px-5 py-3 font-medium text-white/40 w-32">Tendance Trafic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {TOP_ARTICLES.map((art, i) => (
                <motion.tr 
                  key={art.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="hover:bg-white/[0.02] group transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3 font-medium text-white/90">
                    <div className="flex items-center gap-2">
                      <StarIcon className={cn("w-3.5 h-3.5", i === 0 ? "text-amber-400 fill-amber-400/20" : "text-transparent")} />
                      {art.title}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white/60">{art.topic}</span>
                      <span className="text-white/20 text-[10px]">•</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">{art.stage}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-bold tabular-nums text-white/80">
                    {art.traffic.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="font-bold tabular-nums text-emerald-400">{art.conversions}</span>
                      <ArrowUpRightIcon className="w-3 h-3 text-emerald-400/50" />
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-black/50 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${art.score}%` }} />
                      </div>
                      <span className="text-[10px] font-bold tabular-nums text-white/60 w-6">{art.score}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="w-24 h-6 opacity-60 group-hover:opacity-100 transition-opacity">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={art.sparkline.map((v, i) => ({ v, i }))}>
                          <Area type="step" dataKey="v" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={1} isAnimationActive={false} />
                        </AreaChart>
                      </ResponsiveContainer>
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
