import React from 'react';
import { CommandPageShell, CommandHeader } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { PlusIcon, MessageSquareIcon, TagIcon, CalendarIcon, UserIcon, MoreHorizontalIcon, GripHorizontalIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', limit: null, color: 'text-white/50' },
  { id: 'todo', title: 'À Faire', limit: 10, color: 'text-indigo-400' },
  { id: 'doing', title: 'En Cours', limit: 3, color: 'text-amber-400' },
  { id: 'blocked', title: 'Bloqué', limit: null, color: 'text-rose-400' },
  { id: 'done', title: 'Terminé', limit: null, color: 'text-emerald-400' },
];

const CARDS = [
  { id: 'c1', col: 'todo', title: 'Ajouter balisage Schema FAQ sur /tarifs', effort: 20, impact: 80, priority: 'P1', assignee: 'JD', date: '12 Nov' },
  { id: 'c2', col: 'todo', title: 'Créer une page "Comparatif Concurrents"', effort: 60, impact: 90, priority: 'P1', assignee: 'AL', date: '15 Nov' },
  { id: 'c3', col: 'doing', title: 'Corriger l\'hallucination sur Gemini (Tarifs)', effort: 40, impact: 100, priority: 'P0', assignee: 'MB', date: 'Demain' },
  { id: 'c4', col: 'blocked', title: 'Intégration API MCP pour les Agents', effort: 90, impact: 85, priority: 'P2', assignee: 'JD', date: 'En attente IT' },
  { id: 'c5', col: 'backlog', title: 'Optimisation H1 Accueil', effort: 10, impact: 40, priority: 'P3', assignee: null, date: null },
  { id: 'c6', col: 'done', title: 'Mettre à jour le fichier llms.txt', effort: 15, impact: 75, priority: 'P1', assignee: 'MB', date: 'Hier' },
  { id: 'c7', col: 'done', title: 'Autoriser GPTBot dans robots.txt', effort: 5, impact: 90, priority: 'P0', assignee: 'JD', date: 'Il y a 3j' },
];

export default function GeoOpportunitiesPage() {
  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="GEO Ops"
          title="Plan d'Action (Kanban)"
          subtitle="Suivi des opportunités d'optimisation et des correctifs techniques identifiés."
          actions={
            <div className="flex gap-2">
              <button className={COMMAND_BUTTONS.secondary}>Trier par Priorité</button>
              <button className={COMMAND_BUTTONS.primary}>+ Nouvelle Action</button>
            </div>
          }
        />
      }
    >
      <div className="flex gap-4 h-[calc(100vh-180px)] min-h-[600px] overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 mt-4">
        {COLUMNS.map(col => {
          const colCards = CARDS.filter(c => c.col === col.id);
          
          return (
            <div key={col.id} className="flex flex-col w-[300px] shrink-0 bg-white/[0.01] rounded-[24px] border border-white/[0.03]">
              {/* Column Header */}
              <div className="p-4 flex items-center justify-between border-b border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <h3 className={cn("text-[13px] font-bold uppercase tracking-wider", col.color)}>{col.title}</h3>
                  <span className="text-[10px] font-bold text-white/30 bg-black/40 px-2 py-0.5 rounded-full tabular-nums">
                    {colCards.length}
                    {col.limit && ` / ${col.limit}`}
                  </span>
                </div>
                <button className="text-white/20 hover:text-white/60"><PlusIcon className="w-4 h-4" /></button>
              </div>

              {/* Column Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-none">
                {colCards.map((card, i) => (
                  <motion.div 
                    key={card.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      COMMAND_PANEL, 
                      "p-4 cursor-grab hover:ring-1 hover:ring-white/20 transition-all group flex flex-col gap-3",
                      col.id === 'done' && "opacity-50 hover:opacity-100"
                    )}
                  >
                    {/* Tags & Actions */}
                    <div className="flex justify-between items-start">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest",
                        card.priority === 'P0' ? "bg-rose-500/20 text-rose-300" :
                        card.priority === 'P1' ? "bg-amber-500/20 text-amber-300" :
                        "bg-white/10 text-white/50"
                      )}>{card.priority}</span>
                      
                      <GripHorizontalIcon className="w-4 h-4 text-white/10 group-hover:text-white/30 transition-colors" />
                    </div>

                    {/* Title */}
                    <h4 className="text-[13px] font-semibold text-white/90 leading-snug">
                      {card.title}
                    </h4>

                    {/* Effort/Impact Mini Bars */}
                    {col.id !== 'done' && (
                      <div className="grid grid-cols-2 gap-2 my-1">
                        <div>
                          <div className="text-[8px] uppercase tracking-widest text-white/30 mb-1">Effort</div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-sky-400" style={{ width: `${card.effort}%` }} />
                          </div>
                        </div>
                        <div>
                          <div className="text-[8px] uppercase tracking-widest text-white/30 mb-1">Impact</div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400" style={{ width: `${card.impact}%` }} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Footer Meta */}
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/[0.05]">
                      <div className="flex gap-2">
                        {card.date && (
                          <div className="flex items-center gap-1 text-[10px] text-white/40">
                            <CalendarIcon className="w-3 h-3" /> {card.date}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[10px] text-white/20">
                          <MessageSquareIcon className="w-3 h-3" /> {Math.floor(Math.random() * 5)}
                        </div>
                      </div>
                      
                      {card.assignee ? (
                        <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[9px] font-bold text-white shadow-lg" title={card.assignee}>
                          {card.assignee}
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:bg-white/10 cursor-pointer">
                          <UserIcon className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Empty State */}
                {colCards.length === 0 && (
                  <div className="h-24 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center">
                    <span className="text-[11px] text-white/20">Glisser-déposer ici</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </CommandPageShell>
  );
}
