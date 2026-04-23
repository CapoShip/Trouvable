import React, { useState } from 'react';
import { CommandPageShell, CommandHeader } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { SearchIcon, FilterIcon, CodeIcon, CheckCircle2Icon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FIXES = Array.from({ length: 20 }).map((_, i) => ({
  id: `fix-${i}`,
  title: [
    'Standardiser l\'authentification (OAuth2)',
    'Exposer openapi.json publiquement',
    'Développer un Serveur MCP',
    'Corriger erreur 403 sur /api/quotes',
    'Ajouter Schema.org sur page d\'accueil',
    'Réduire latence endpoint /search',
    'Mettre à jour llms.txt'
  ][i % 7] + (i > 6 ? ` (Tâche ${i})` : ''),
  description: 'Modification de la logique métier pour accepter les tokens d\'agents autonomes plutôt que les cookies de session web classiques.',
  effort: ['XS', 'S', 'M', 'L'][i % 4],
  impact: Math.floor(Math.random() * 8) + 3,
  roi: Math.floor(Math.random() * 90) + 10,
  status: ['todo', 'doing', 'blocked', 'done'][i % 4],
  owner: ['JD', 'SM', 'AL'][i % 3],
  tags: ['API', 'Auth', 'MCP', 'Performance', 'Schema'].slice(i%5, (i%5)+2),
  codeSnippet: i % 2 === 0 ? `// Mock JSON-LD
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Trouvable"
}` : `curl -X GET "https://api.trouvable.ai/v1/auth" \\
  -H "Authorization: Bearer agent_token_xxx"`
})).sort((a,b) => b.roi - a.roi);

export default function AgentFixesPage() {
  const [selectedFix, setSelectedFix] = useState(FIXES[0]);

  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="AGENT Ops"
          title="Backlog & Correctifs"
          subtitle="Liste priorisée des actions techniques pour maximiser la compatibilité Agentic."
          actions={
            <div className="flex gap-2">
              <button className={COMMAND_BUTTONS.secondary}>Synchroniser Jira</button>
              <button className={COMMAND_BUTTONS.primary}>Nouveau Ticket</button>
            </div>
          }
        />
      }
    >
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-auto">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input 
            type="text" 
            placeholder="Rechercher un correctif..." 
            className="w-full sm:w-80 bg-[#06070a] border border-white/10 rounded-full pl-10 pr-4 py-2 text-[12px] text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-none pb-2 sm:pb-0">
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] text-white/70 hover:bg-white/10 whitespace-nowrap"><FilterIcon className="w-3 h-3" /> Effort</button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] text-white/70 hover:bg-white/10 whitespace-nowrap"><FilterIcon className="w-3 h-3" /> Statut</button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] text-white/70 hover:bg-white/10 whitespace-nowrap"><FilterIcon className="w-3 h-3" /> Tags</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] min-h-[600px]">
        {/* Left: List (45%) */}
        <div className={cn(COMMAND_PANEL, "w-full lg:w-[45%] flex flex-col p-0 overflow-hidden border-white/10")}>
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#090a0b]/80 backdrop-blur z-10 shrink-0">
            <span className="text-[12px] font-semibold text-white/90">{FIXES.length} Correctifs priorisés</span>
            <span className="text-[10px] text-white/40 uppercase tracking-widest">Tri par ROI</span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-none">
            <div className="divide-y divide-white/5">
              {FIXES.map((fix) => (
                <div 
                  key={fix.id} 
                  onClick={() => setSelectedFix(fix)}
                  className={cn(
                    "p-4 cursor-pointer transition-colors border-l-2",
                    selectedFix.id === fix.id ? "bg-white/[0.04] border-indigo-500" : "bg-transparent border-transparent hover:bg-white/[0.02]"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={cn("text-[13px] font-semibold max-w-[80%]", selectedFix.id === fix.id ? "text-white" : "text-white/80")}>{fix.title}</h3>
                    <span className="text-[18px] font-black text-white/20 tabular-nums leading-none" title="ROI Score">{fix.roi}</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                      fix.status === 'todo' ? "bg-white/10 text-white/60" :
                      fix.status === 'doing' ? "bg-indigo-500/20 text-indigo-300" :
                      fix.status === 'blocked' ? "bg-rose-500/20 text-rose-300" :
                      "bg-emerald-500/20 text-emerald-300"
                    )}>
                      {fix.status === 'todo' ? 'À faire' : fix.status === 'doing' ? 'En cours' : fix.status === 'blocked' ? 'Bloqué' : 'Fait'}
                    </span>
                    <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold font-mono",
                      fix.effort === 'XS' || fix.effort === 'S' ? "bg-emerald-500/10 text-emerald-400" :
                      fix.effort === 'M' ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"
                    )}>
                      Effort: {fix.effort}
                    </span>
                    {fix.tags.map(t => (
                      <span key={t} className="text-[9px] text-white/40">#{t}</span>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-[8px] font-bold text-white shadow-sm shrink-0">
                      {fix.owner}
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-[9px] text-white/30 uppercase tracking-widest">Impact</span>
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${fix.impact * 10}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Detail (55%) */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedFix.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={cn(COMMAND_PANEL, "flex flex-col h-full p-0 border-white/10")}
            >
              <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{selectedFix.id.toUpperCase()}</span>
                  <span className="text-[10px] text-white/40">•</span>
                  <span className="text-[10px] text-white/50 uppercase tracking-widest">{selectedFix.tags.join(' / ')}</span>
                </div>
                <h2 className="text-[20px] font-bold text-white leading-tight mb-2">{selectedFix.title}</h2>
                <p className="text-[13px] text-white/60 leading-relaxed">{selectedFix.description}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 scrollbar-none space-y-8">
                
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Effort Estimé</span>
                    <span className="text-[16px] font-mono text-white/90">{selectedFix.effort} <span className="text-[10px] text-white/30">/ Jours</span></span>
                  </div>
                  <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">Impact Attendu</span>
                    <span className="text-[16px] font-mono text-emerald-400">{selectedFix.impact}/10</span>
                  </div>
                  <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                    <span className="text-[10px] uppercase tracking-widest text-white/40 block mb-1">ROI Score</span>
                    <span className="text-[16px] font-mono text-indigo-400">{selectedFix.roi}</span>
                  </div>
                </div>

                {/* Narrative */}
                <div>
                  <h3 className="text-[12px] font-semibold text-white/90 mb-3 uppercase tracking-widest">Pourquoi (Impact)</h3>
                  <div className="text-[13px] text-white/70 leading-relaxed border-l-2 border-indigo-500/50 pl-4 py-1">
                    Sans cette correction, les agents IA rencontreront systématiquement une erreur d'autorisation lors de la tentative d'exécution de l'action. Cela dégrade la fiabilité perçue de notre API et bloque les parcours transactionnels autonomes.
                  </div>
                </div>

                {/* Steps */}
                <div>
                  <h3 className="text-[12px] font-semibold text-white/90 mb-3 uppercase tracking-widest">Comment (Étapes)</h3>
                  <div className="space-y-3">
                    {[
                      "Créer une nouvelle clé d'API / Service Account",
                      "Mettre à jour le middleware d'authentification",
                      "Déployer en staging et tester avec un script local",
                      "Mettre à jour la documentation (openapi.json)"
                    ].map((step, i) => (
                      <div key={i} className="flex gap-3 text-[13px] text-white/80">
                        <span className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-mono text-white/40 shrink-0">{i+1}</span>
                        <span className="pt-0.5">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Code Snippet */}
                <div>
                  <h3 className="text-[12px] font-semibold text-white/90 mb-3 uppercase tracking-widest flex items-center gap-2"><CodeIcon className="w-4 h-4 text-white/40" /> Exemple / Snippet</h3>
                  <div className="bg-[#06070a] border border-white/10 rounded-xl p-4 overflow-x-auto">
                    <pre className="text-[11px] font-mono text-indigo-300 leading-relaxed">
                      {selectedFix.codeSnippet}
                    </pre>
                  </div>
                </div>

              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-white/5 bg-[#090a0b] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-[10px] font-bold text-white">
                    {selectedFix.owner}
                  </div>
                  <span className="text-[11px] text-white/50">Assigné</span>
                </div>
                <div className="flex gap-2">
                  {selectedFix.status !== 'done' && (
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#06070a] rounded-full text-[12px] font-bold transition-colors shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                      <CheckCircle2Icon className="w-4 h-4" /> Marquer comme traité
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </CommandPageShell>
  );
}
