import React, { useState } from 'react';
import { CommandPageShell, CommandHeader } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { SearchIcon, FilterIcon, ChevronRightIcon, WrenchIcon, CheckCircleIcon, ClockIcon, TerminalIcon, CopyIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FIXES = Array.from({ length: 18 }).map((_, i) => {
  const effort = ['XS', 'S', 'M', 'L', 'XL'][Math.floor(Math.random() * 5)];
  const impact = Math.floor(Math.random() * 10) + 1;
  const roi = Math.round((impact / (['XS', 'S', 'M', 'L', 'XL'].indexOf(effort) + 1)) * 10);
  const status = Math.random() > 0.8 ? 'done' : Math.random() > 0.6 ? 'wip' : 'todo';
  
  const titles = [
    "Standardiser l'authentification OAuth2",
    "Exposer openapi.json publiquement",
    "Documentation des paramètres de payload",
    "Implémenter Model Context Protocol (MCP)",
    "Ajouter l'en-tête Idempotency-Key",
    "Générer le fichier llms.txt dynamique",
    "Optimiser latence de l'API Search",
    "Documenter les Rate Limits",
    "Markup Schema.org pour WebAPI",
    "Gérer les erreurs 400 avec suggestions"
  ];
  
  return {
    id: `fix-${i + 1}`,
    priority: i + 1,
    title: titles[i % titles.length] + (i >= 10 ? ` (Suite ${i})` : ''),
    desc: 'Amélioration de la compatibilité technique pour augmenter le taux de succès des agents IA.',
    effort,
    impact,
    roi,
    status,
    owner: ['JD', 'MB', 'AL', '??'][Math.floor(Math.random() * 4)],
    tags: ['Auth', 'API', 'Docs', 'MCP', 'Schema'].slice(0, Math.floor(Math.random() * 2) + 1).sort(() => 0.5 - Math.random())
  };
}).sort((a, b) => b.roi - a.roi).map((f, i) => ({ ...f, priority: i + 1 }));

export default function AgentFixesPage() {
  const [selectedFixId, setSelectedFixId] = useState<string>(FIXES[0].id);
  const selectedFix = FIXES.find(f => f.id === selectedFixId)!;

  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="AGENT Ops"
          title="Backlog Correctifs"
          subtitle="Priorisation des interventions techniques pour débloquer les workflows Agentic."
          actions={
            <div className="flex gap-2">
              <button className={COMMAND_BUTTONS.secondary}>Sync JIRA</button>
              <button className={COMMAND_BUTTONS.primary}>Nouveau Ticket</button>
            </div>
          }
        />
      }
    >
      {/* Filter Bar */}
      <div className={cn(COMMAND_PANEL, "p-3 mb-6 flex flex-wrap items-center gap-4")}>
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input 
            type="text" 
            placeholder="Rechercher un correctif..." 
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-full pl-9 pr-4 py-1.5 text-[12px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2 border-l border-white/10 pl-4">
          <span className="text-[11px] text-white/50"><FilterIcon className="w-3.5 h-3.5" /></span>
          <select className="bg-transparent text-[11px] text-white/80 focus:outline-none cursor-pointer">
            <option>Effort: Tous</option>
            <option>S & XS uniquement</option>
          </select>
          <select className="bg-transparent text-[11px] text-white/80 focus:outline-none cursor-pointer">
            <option>Statut: À faire</option>
            <option>Statut: En cours</option>
            <option>Statut: Terminé</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-260px)] min-h-[600px]">
        
        {/* Left: Scrollable List (45%) */}
        <div className={cn(COMMAND_PANEL, "w-full lg:w-[45%] flex flex-col overflow-hidden")}>
          <div className="flex-1 overflow-y-auto scrollbar-none p-2 space-y-1">
            {FIXES.map((fix) => (
              <div 
                key={fix.id}
                onClick={() => setSelectedFixId(fix.id)}
                className={cn(
                  "p-4 rounded-xl cursor-pointer transition-all border flex gap-4",
                  selectedFixId === fix.id 
                    ? "bg-white/[0.05] border-indigo-500/50 shadow-[inset_4px_0_0_#6366f1]" 
                    : "bg-transparent border-transparent hover:bg-white/[0.02]"
                )}
              >
                <div className="flex flex-col items-center justify-center shrink-0 w-8">
                  <span className="text-[20px] font-bold text-white/20 tabular-nums">#{fix.priority}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-[13px] font-semibold text-white/90 truncate pr-2">{fix.title}</h4>
                    <span className={cn("shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded",
                      fix.status === 'done' ? "bg-emerald-500/20 text-emerald-400" :
                      fix.status === 'wip' ? "bg-amber-500/20 text-amber-400" : "bg-white/10 text-white/50"
                    )}>
                      {fix.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-[11px] text-white/50 truncate mb-3">{fix.desc}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[8px] font-bold text-white shadow-sm">
                        {fix.owner}
                      </div>
                      {fix.tags.map(t => (
                        <span key={t} className="text-[9px] font-mono text-white/40 bg-white/5 px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border",
                        ['L', 'XL'].includes(fix.effort) ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      )}>{fix.effort}</span>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-violet-300">
                        <WrenchIcon className="w-3 h-3" /> {fix.roi}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Detail Panel (55%) */}
        <div className={cn(COMMAND_PANEL, "w-full lg:w-[55%] flex flex-col overflow-hidden relative")}>
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedFix.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 overflow-y-auto scrollbar-none flex flex-col"
            >
              {/* Detail Header */}
              <div className="p-6 md:p-8 border-b border-white/[0.05] bg-gradient-to-b from-white/[0.02] to-transparent">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold tracking-wider uppercase border border-indigo-500/30">
                    Priorité #{selectedFix.priority}
                  </span>
                  <span className="text-[12px] font-mono text-white/40">{selectedFix.id}</span>
                </div>
                <h2 className="text-[24px] font-bold text-white leading-tight mb-3">{selectedFix.title}</h2>
                <p className="text-[14px] text-white/60 leading-relaxed">{selectedFix.desc}</p>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 divide-x divide-white/[0.05] border-b border-white/[0.05]">
                <div className="p-6 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Effort Estimé</span>
                  <span className="text-[24px] font-bold text-white">{selectedFix.effort}</span>
                  <span className="text-[10px] text-white/30">Jours/Hommes</span>
                </div>
                <div className="p-6 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Impact (1-10)</span>
                  <span className="text-[24px] font-bold text-emerald-400">{selectedFix.impact}</span>
                  <div className="w-16 h-1 mt-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${selectedFix.impact * 10}%` }} />
                  </div>
                </div>
                <div className="p-6 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">ROI Score</span>
                  <span className="text-[24px] font-bold text-violet-400">{selectedFix.roi}</span>
                  <span className="text-[10px] text-white/30">Priorité relative</span>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-6 md:p-8 space-y-8 flex-1">
                
                <section>
                  <h3 className="text-[14px] font-semibold text-white/90 mb-3">Pourquoi c'est important</h3>
                  <p className="text-[13px] text-white/70 leading-relaxed bg-white/[0.02] p-4 rounded-xl border border-white/[0.05]">
                    Actuellement, les agents IA tentent d'interagir avec nos endpoints mais échouent car ils ne peuvent pas deviner le format exact attendu. En fournissant ce correctif, nous réduirons le taux d'erreur de 40% sur les requêtes générées par machine, permettant l'exécution d'actions de bout en bout sans intervention humaine.
                  </p>
                </section>

                <section>
                  <h3 className="text-[14px] font-semibold text-white/90 mb-3">Plan d'implémentation</h3>
                  <div className="space-y-3 pl-2">
                    {[
                      "Mettre à jour le contrôleur pour accepter le nouveau paramètre.",
                      "Ajouter la validation Zod ou Joi stricte.",
                      "Générer la nouvelle définition OpenAPI.",
                      "Déployer en staging et tester avec l'outil CLI Trouvable.",
                      "Pousser en production."
                    ].map((step, i) => (
                      <div key={i} className="flex gap-3 text-[13px] text-white/70">
                        <span className="w-5 h-5 rounded bg-white/10 flex items-center justify-center shrink-0 text-[10px] font-mono font-bold text-white/50">{i+1}</span>
                        <span className="mt-0.5">{step}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[14px] font-semibold text-white/90 flex items-center gap-2">
                      <TerminalIcon className="w-4 h-4 text-white/50" /> Snippet de Référence
                    </h3>
                    <button className="text-[10px] flex items-center gap-1 text-white/40 hover:text-white/80 transition-colors">
                      <CopyIcon className="w-3 h-3" /> Copier
                    </button>
                  </div>
                  <div className="bg-[#0d1117] rounded-xl p-4 border border-white/[0.05] overflow-x-auto relative">
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-white/[0.02] border-r border-white/[0.05] flex flex-col items-center py-4 select-none">
                      {[1,2,3,4,5,6].map(l => <span key={l} className="text-[10px] font-mono text-white/20 h-[20px]">{l}</span>)}
                    </div>
                    <pre className="text-[11px] font-mono text-white/70 leading-[20px] pl-6">
<span className="text-pink-400">"components"</span>: {'{'}
  <span className="text-pink-400">"securitySchemes"</span>: {'{'}
    <span className="text-pink-400">"OAuth2"</span>: {'{'}
      <span className="text-sky-300">"type"</span>: <span className="text-emerald-300">"oauth2"</span>,
      <span className="text-sky-300">"description"</span>: <span className="text-emerald-300">"Auth for AI Agents"</span>
    {'}'}
  {'}'}
{'}'}
                    </pre>
                  </div>
                </section>

              </div>
              
              {/* Sticky Footer Actions */}
              <div className="sticky bottom-0 p-4 border-t border-white/[0.05] bg-[#090b10]/95 backdrop-blur flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-white/40">Assigné à:</span>
                  <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[7px] font-bold text-white">
                      {selectedFix.owner}
                    </div>
                    <span className="text-[11px] font-medium text-white/80">{selectedFix.owner}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-[12px] font-medium text-white/70 hover:bg-white/10 transition-colors">
                    Reporter
                  </button>
                  <button className="px-4 py-2 rounded-lg bg-indigo-500 text-[12px] font-medium text-white hover:bg-indigo-400 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20">
                    <CheckCircleIcon className="w-3.5 h-3.5" /> Marquer Traité
                  </button>
                </div>
              </div>
              
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </CommandPageShell>
  );
}
