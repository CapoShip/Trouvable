import React, { useState } from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { SearchIcon, FolderIcon, FolderOpenIcon, FileTextIcon, PlayIcon, ChevronRightIcon, BotIcon, AlertTriangleIcon, CheckCircle2Icon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { id: '1', name: 'Intention Découverte', count: 45, open: true },
  { id: '2', name: 'Intention Support', count: 28, open: false },
  { id: '3', name: 'Comparaison Concurrents', count: 12, open: true },
  { id: '4', name: 'Requêtes Navigatonnelles', count: 56, open: false },
];

const PROMPTS = Array.from({ length: 25 }).map((_, i) => ({
  id: `prompt-${i}`,
  category: CATEGORIES[i % 4].id,
  text: [
    '"Quels sont les meilleurs outils d\'audit SEO pour les IA ?"',
    '"Comment contacter le support Trouvable ?"',
    '"Trouvable vs Semrush : quelles différences pour le GEO ?"',
    '"Quels sont les tarifs de Acme Corp pour une agence ?"',
    '"Peut-on exporter les données Trouvable en PDF ?"'
  ][i % 5],
  intent: ['Découverte', 'Support', 'Comparaison', 'Transactionnel', 'Technique'][i % 5],
  modelsTested: Math.floor(Math.random() * 3) + 2,
  lastRunDelta: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : -(Math.floor(Math.random() * 5) + 1),
  score: Math.floor(Math.random() * 40) + 60
}));

export default function GeoPromptsPage() {
  const [activeFolder, setActiveFolder] = useState<string>('1');
  const [selectedPrompt, setSelectedPrompt] = useState<any>(PROMPTS[0]);

  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="GEO Ops"
          title="Workbench de Prompts"
          subtitle="Gérez, organisez et simulez les requêtes des utilisateurs face aux LLMs."
          actions={
            <div className="flex gap-2">
              <button className={COMMAND_BUTTONS.secondary}>Importer CSV</button>
              <button className={COMMAND_BUTTONS.primary}>+ Nouveau Prompt</button>
            </div>
          }
        />
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CommandMetricCard label="Prompts Actifs" value="141" detail="Dans 4 catégories" tone="info" />
        <CommandMetricCard label="Score Moyen" value="76/100" detail="Fiabilité des réponses" tone="warning" />
        <CommandMetricCard label="Modèles Couverts" value="4" detail="100% de la matrice" tone="ok" />
        <CommandMetricCard label="Tests (30j)" value="4.2k" detail="Exécutions via API" tone="neutral" />
      </div>

      <div className="flex h-[calc(100vh-260px)] min-h-[600px] gap-6 mt-4">
        
        {/* Left: Folder Tree */}
        <div className={cn(COMMAND_PANEL, "w-[240px] flex flex-col p-4 overflow-y-auto shrink-0")}>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40 mb-4">Catégories</h3>
          <div className="space-y-1">
            {CATEGORIES.map(cat => (
              <div 
                key={cat.id}
                onClick={() => setActiveFolder(cat.id)}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors group",
                  activeFolder === cat.id ? "bg-indigo-500/10 text-indigo-300" : "hover:bg-white/[0.04] text-white/70"
                )}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  {activeFolder === cat.id ? <FolderOpenIcon className="w-4 h-4 shrink-0" /> : <FolderIcon className="w-4 h-4 shrink-0 opacity-60" />}
                  <span className="text-[12px] font-medium truncate">{cat.name}</span>
                </div>
                <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded opacity-60 group-hover:opacity-100 tabular-nums">
                  {cat.count}
                </span>
              </div>
            ))}
          </div>
          
          <button className="mt-4 flex items-center justify-center gap-2 text-[11px] font-medium text-white/40 hover:text-white hover:bg-white/5 py-2 rounded-lg border border-dashed border-white/10 transition-colors">
            + Nouvelle Catégorie
          </button>
        </div>

        {/* Center: Prompt List */}
        <div className={cn(COMMAND_PANEL, "flex-1 flex flex-col p-0 overflow-hidden")}>
          <div className="p-4 border-b border-white/[0.05] bg-white/[0.01]">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input 
                type="text" 
                placeholder="Rechercher un prompt exact..." 
                className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-[12px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-none divide-y divide-white/[0.02]">
            {PROMPTS.filter(p => p.category === activeFolder).map(prompt => (
              <div 
                key={prompt.id}
                onClick={() => setSelectedPrompt(prompt)}
                className={cn(
                  "p-4 cursor-pointer transition-colors group flex items-start gap-4",
                  selectedPrompt?.id === prompt.id ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                )}
              >
                <div className="mt-1">
                  <FileTextIcon className={cn("w-4 h-4", selectedPrompt?.id === prompt.id ? "text-indigo-400" : "text-white/20")} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-white/90 mb-2 font-serif italic truncate">
                    {prompt.text}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-widest font-semibold text-white/40 bg-white/5 px-2 py-0.5 rounded">
                      {prompt.intent}
                    </span>
                    <span className="text-[10px] text-white/50 flex items-center gap-1">
                      <BotIcon className="w-3 h-3" /> {prompt.modelsTested}/4 Modèles
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 pl-4 border-l border-white/[0.05]">
                  <span className={cn("text-[14px] font-bold tabular-nums",
                    prompt.score > 80 ? "text-emerald-400" : prompt.score > 60 ? "text-amber-400" : "text-rose-400"
                  )}>{prompt.score}</span>
                  <span className={cn("text-[10px] font-mono",
                    prompt.lastRunDelta > 0 ? "text-emerald-400/80" : "text-rose-400/80"
                  )}>
                    {prompt.lastRunDelta > 0 ? '+' : ''}{prompt.lastRunDelta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Inspector */}
        <div className={cn(COMMAND_PANEL, "w-[400px] flex flex-col p-0 overflow-hidden shrink-0")}>
          <AnimatePresence mode="wait">
            {selectedPrompt ? (
              <motion.div
                key={selectedPrompt.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col h-full"
              >
                {/* Inspector Header */}
                <div className="p-6 border-b border-white/[0.05] bg-gradient-to-b from-white/[0.03] to-transparent">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400 mb-3">Inspecteur de Prompt</div>
                  <div className="bg-black/40 rounded-xl p-4 border border-white/[0.05] relative group">
                    <p className="text-[14px] text-white/90 font-serif italic leading-relaxed">
                      {selectedPrompt.text}
                    </p>
                    <button className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-white/10 hover:bg-white/20 rounded text-white">
                      <PlayIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Inspector Body */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-none space-y-6">
                  
                  {/* Expected Criteria */}
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-3 flex items-center justify-between">
                      Critères Attendus (Fact-Check)
                      <button className="text-indigo-400 hover:text-indigo-300 normal-case tracking-normal text-[11px]">Éditer</button>
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-[12px] bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-lg text-emerald-200/80">
                        <CheckCircle2Icon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        Mention claire du prix de départ à 499€.
                      </div>
                      <div className="flex items-start gap-2 text-[12px] bg-emerald-500/5 border border-emerald-500/20 p-2.5 rounded-lg text-emerald-200/80">
                        <CheckCircle2Icon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        Pas de confusion avec le produit "Starter" discontinué.
                      </div>
                    </div>
                  </div>

                  {/* Last Results Across Models */}
                  <div>
                    <h4 className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-3">Derniers Résultats (Run #4052)</h4>
                    <div className="space-y-3">
                      {[
                        { model: 'GPT-4o', status: 'pass', text: 'Le tarif est de 499€ par mois pour le forfait pro.' },
                        { model: 'Claude 3.5', status: 'pass', text: 'Acme propose une formule pro à 499€ mensuels.' },
                        { model: 'Perplexity', status: 'warn', text: 'Les tarifs ne sont pas publics mais estimés à ~500€.' },
                        { model: 'Gemini 1.5', status: 'fail', text: 'Le forfait Starter est à 99€.' },
                      ].map(res => (
                        <div key={res.model} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[12px] font-bold text-white/90">{res.model}</span>
                            {res.status === 'pass' ? <CheckCircle2Icon className="w-3.5 h-3.5 text-emerald-500" /> :
                             res.status === 'warn' ? <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-500" /> :
                             <AlertTriangleIcon className="w-3.5 h-3.5 text-rose-500" />}
                          </div>
                          <p className="text-[11px] text-white/60 leading-relaxed italic border-l-2 border-white/10 pl-2">
                            "{res.text}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </motion.div>
            ) : (
               <div className="flex flex-col items-center justify-center h-full text-center p-8 text-white/40">
                  Sélectionnez un prompt pour inspecter ses détails.
               </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </CommandPageShell>
  );
}
