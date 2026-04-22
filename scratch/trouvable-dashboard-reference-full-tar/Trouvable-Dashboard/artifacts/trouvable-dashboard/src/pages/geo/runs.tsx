import React, { useState } from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { PlayIcon, ClockIcon, ServerIcon, ExternalLinkIcon, CheckCircle2Icon, AlertCircleIcon, XCircleIcon, SearchIcon, FilterIcon, PauseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

// Generate Mock Data for Gantt / Runs
const RUNS = Array.from({ length: 40 }).map((_, i) => {
  const status = i === 0 ? 'running' : Math.random() > 0.85 ? 'failed' : Math.random() > 0.7 ? 'partial' : 'success';
  const duration = status === 'running' ? Math.floor(Math.random() * 60) + 10 : Math.floor(Math.random() * 300) + 120;
  const startTime = new Date(Date.now() - (i * 3600000) - Math.floor(Math.random() * 1800000));
  
  return {
    id: `run-${4052 - i}`,
    trigger: i % 5 === 0 ? 'Manuel (Jean D.)' : 'Planifié (Quotidien)',
    status,
    startTime,
    duration, // seconds
    promptsCount: Math.floor(Math.random() * 50) + 100,
    models: ['GPT-4o', 'Claude 3.5', 'Perplexity', 'Gemini'].slice(0, Math.floor(Math.random() * 2) + 3),
    cost: Math.floor(Math.random() * 1500) + 500, // tokens in K
    errors: status === 'failed' ? ['Timeout API OpenAI', 'Rate limit Claude'] : status === 'partial' ? ['Rate limit Perplexity'] : []
  };
});

const TIMELINE_DATA = RUNS.slice(0, 15).reverse().map(r => ({
  id: r.id,
  time: r.startTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  duration: r.duration,
  status: r.status
}));

export default function GeoRunsPage() {
  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [search, setSearch] = useState('');

  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="GEO Ops"
          title="Historique d'Exécution"
          subtitle="Monitoring des runs d'audit automatisés sur les modèles d'IA."
          actions={
            <div className="flex gap-2">
              <button className={COMMAND_BUTTONS.secondary}><PauseIcon className="w-3.5 h-3.5 mr-1"/> Suspendre planning</button>
              <button className={COMMAND_BUTTONS.primary}><PlayIcon className="w-3.5 h-3.5 mr-1" /> Déclencher Run</button>
            </div>
          }
        />
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CommandMetricCard label="Runs (30j)" value="124" detail="4 runs planifiés / jour" tone="info" />
        <CommandMetricCard label="Taux de succès" value="92.5%" detail="Objectif: >95%" tone="warning" />
        <CommandMetricCard label="Durée Moyenne" value="3m 45s" detail="-12s vs mois préc." tone="ok" />
        <CommandMetricCard label="Coût Estimé" value="$42.50" detail="1.2M tokens consommés" tone="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 h-[calc(100vh-280px)] min-h-[600px]">
        
        {/* Left 2/3: Gantt Chart & Table */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Timeline / Gantt */}
          <div className={cn(COMMAND_PANEL, "p-5 h-[220px] flex flex-col")}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-semibold text-white/90">Timeline d'Exécution (Derniers 15 runs)</h3>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-[10px] text-white/60"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Succès</span>
                <span className="flex items-center gap-1.5 text-[10px] text-white/60"><div className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Partiel</span>
                <span className="flex items-center gap-1.5 text-[10px] text-white/60"><div className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Échec</span>
              </div>
            </div>
            
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={TIMELINE_DATA} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barSize={8}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="time" type="category" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }} width={40} />
                  <RechartsTooltip 
                    cursor={{fill: 'rgba(255,255,255,0.02)'}} 
                    contentStyle={{ backgroundColor: '#090a0b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginBottom: '4px' }}
                  />
                  <Bar dataKey="duration" radius={[0, 4, 4, 0]}>
                    {TIMELINE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        entry.status === 'success' ? '#10b981' : 
                        entry.status === 'partial' ? '#f59e0b' : 
                        entry.status === 'running' ? '#8b5cf6' : '#f43f5e'
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Runs Table */}
          <div className={cn(COMMAND_PANEL, "flex-1 flex flex-col p-0 overflow-hidden")}>
            <div className="p-4 border-b border-white/[0.05] bg-white/[0.01] flex items-center justify-between">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input 
                  type="text" 
                  placeholder="Rechercher par ID ou déclencheur..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="bg-black/20 border border-white/10 rounded-full pl-8 pr-4 py-1.5 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64"
                />
              </div>
              <button className="text-[11px] flex items-center gap-1.5 text-white/60 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <FilterIcon className="w-3.5 h-3.5" /> Filtrer
              </button>
            </div>
            
            <div className="flex-1 overflow-auto scrollbar-none">
              <table className="w-full text-left text-[12px] whitespace-nowrap">
                <thead className="sticky top-0 bg-[#090a0b]/95 backdrop-blur z-10 border-b border-white/[0.05]">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-white/40">ID Run</th>
                    <th className="px-5 py-3 font-semibold text-white/40">Déclencheur</th>
                    <th className="px-5 py-3 font-semibold text-white/40">Statut</th>
                    <th className="px-5 py-3 font-semibold text-white/40">Modèles</th>
                    <th className="px-5 py-3 font-semibold text-white/40 text-right">Durée</th>
                    <th className="px-5 py-3 font-semibold text-white/40 text-right">Coût (Tokens)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {RUNS.filter(r => r.id.includes(search) || r.trigger.toLowerCase().includes(search.toLowerCase())).map((run) => (
                    <tr 
                      key={run.id} 
                      onClick={() => setSelectedRun(run)}
                      className={cn(
                        "transition-colors cursor-pointer group",
                        selectedRun?.id === run.id ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                      )}
                    >
                      <td className="px-5 py-3">
                        <div className="flex flex-col">
                          <span className={cn("font-mono font-bold", selectedRun?.id === run.id ? "text-white" : "text-white/80")}>{run.id}</span>
                          <span className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5">
                            <ClockIcon className="w-3 h-3" />
                            {run.startTime.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-white/70">{run.trigger}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          {run.status === 'success' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> :
                           run.status === 'partial' ? <AlertCircleIcon className="w-4 h-4 text-amber-400" /> :
                           run.status === 'running' ? <ServerIcon className="w-4 h-4 text-indigo-400 animate-pulse" /> :
                           <XCircleIcon className="w-4 h-4 text-rose-400" />}
                          <span className={cn("text-[11px] font-medium",
                            run.status === 'success' ? "text-emerald-400" :
                            run.status === 'partial' ? "text-amber-400" :
                            run.status === 'running' ? "text-indigo-400" : "text-rose-400"
                          )}>
                            {run.status === 'success' ? 'Terminé' :
                             run.status === 'partial' ? 'Partiel' :
                             run.status === 'running' ? 'En cours...' : 'Échec'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          {run.models.map((m, i) => (
                            <span key={i} className="w-2 h-2 rounded-full bg-white/20" title={m} />
                          ))}
                          <span className="text-[10px] text-white/40 ml-1">{run.models.length}/4</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-white/70">
                        {Math.floor(run.duration / 60)}m {(run.duration % 60).toString().padStart(2, '0')}s
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-[11px] font-mono bg-white/5 text-white/60 px-2 py-1 rounded">
                          {(run.cost / 1000).toFixed(1)}k
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1/3: Detail Drawer (Inline) */}
        <div className="col-span-1">
          <AnimatePresence mode="wait">
            {selectedRun ? (
              <motion.div
                key={selectedRun.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={cn(COMMAND_PANEL, "flex flex-col h-full p-0 overflow-hidden")}
              >
                <div className="p-5 border-b border-white/[0.05] bg-gradient-to-b from-white/[0.03] to-transparent">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-[16px] font-bold text-white font-mono">{selectedRun.id}</h2>
                    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      selectedRun.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      selectedRun.status === 'partial' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      selectedRun.status === 'running' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    )}>
                      {selectedRun.status === 'success' ? 'Succès Complet' :
                       selectedRun.status === 'partial' ? 'Succès Partiel' :
                       selectedRun.status === 'running' ? 'Exécution en cours' : 'Échec Critique'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Démarrage</div>
                      <div className="text-[12px] text-white/90">{selectedRun.startTime.toLocaleTimeString('fr-FR')}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Durée</div>
                      <div className="text-[12px] font-mono text-white/90">{Math.floor(selectedRun.duration / 60)}m {selectedRun.duration % 60}s</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Déclencheur</div>
                      <div className="text-[12px] text-white/90">{selectedRun.trigger}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Prompts envoyés</div>
                      <div className="text-[12px] font-mono text-white/90">{selectedRun.promptsCount}</div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 scrollbar-none space-y-6">
                  
                  {/* Errors Block */}
                  {selectedRun.errors.length > 0 && (
                    <div>
                      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-rose-400 mb-3 flex items-center gap-2">
                        <AlertCircleIcon className="w-3.5 h-3.5" /> Exceptions
                      </h3>
                      <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 space-y-2">
                        {selectedRun.errors.map((err: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-[12px] text-rose-200/80">
                            <XCircleIcon className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                            {err}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Models Block */}
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-3">Couverture Modèles</h3>
                    <div className="space-y-2">
                      {['GPT-4o', 'Claude 3.5', 'Perplexity', 'Gemini'].map(model => {
                        const isIncluded = selectedRun.models.includes(model);
                        const hasError = selectedRun.errors.some((e:string) => e.includes(model.split(' ')[0]));
                        
                        return (
                          <div key={model} className="flex items-center justify-between p-3 rounded-xl border border-white/[0.05] bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                              <div className={cn("w-2 h-2 rounded-full", 
                                !isIncluded ? "bg-white/10" : 
                                hasError ? "bg-rose-500" : "bg-emerald-500"
                              )} />
                              <span className={cn("text-[12px] font-medium", isIncluded ? "text-white/90" : "text-white/40")}>{model}</span>
                            </div>
                            <span className="text-[10px] text-white/40">
                              {!isIncluded ? 'Ignoré' : hasError ? 'Erreur API' : '100% Complété'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* API Payload Preview (Mock) */}
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-3 flex items-center justify-between">
                      Payload Preview
                      <button className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 normal-case tracking-normal"><ExternalLinkIcon className="w-3 h-3" /> Logs complets</button>
                    </h3>
                    <div className="bg-[#0d1117] rounded-xl p-4 border border-white/[0.05] overflow-x-auto">
                      <pre className="text-[10px] font-mono text-white/60 leading-relaxed">
{`{
  "run_id": "${selectedRun.id}",
  "config": {
    "temperature": 0.1,
    "max_tokens": 1024,
    "timeout_ms": 30000
  },
  "batch_size": 25,
  "system_prompt": "You are an AI assistant evaluating..."
}`}
                      </pre>
                    </div>
                  </div>

                </div>
              </motion.div>
            ) : (
              <div className={cn(COMMAND_PANEL, "flex flex-col items-center justify-center h-full text-center p-8")}>
                <ServerIcon className="w-12 h-12 text-white/10 mb-4" />
                <h3 className="text-white/80 font-medium mb-2">Aucun run sélectionné</h3>
                <p className="text-white/40 text-[12px] leading-relaxed max-w-[200px]">Sélectionnez un run dans le tableau pour visualiser ses détails et logs d'exécution.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </CommandPageShell>
  );
}
