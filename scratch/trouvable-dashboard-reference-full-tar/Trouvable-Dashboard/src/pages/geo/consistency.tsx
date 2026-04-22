import React, { useState } from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckIcon, XIcon, AlertTriangleIcon, ChevronRightIcon, ExternalLinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FACTS = [
  { id: 'f1', label: 'Nom Complet', canonical: 'Trouvable SAS' },
  { id: 'f2', label: 'Fondation', canonical: '2022' },
  { id: 'f3', label: 'Employés', canonical: '45 collaborateurs' },
  { id: 'f4', label: 'Secteur', canonical: 'SaaS B2B, SEO/GEO' },
  { id: 'f5', label: 'Services', canonical: 'Audit IA, Monitoring Continu, Optimisation Contenu' },
  { id: 'f6', label: 'USP', canonical: '1ère plateforme européenne de GEO' },
  { id: 'f7', label: 'Prix', canonical: 'À partir de 499€ / mois' },
  { id: 'f8', label: 'Contact', canonical: 'hello@trouvable.ai' },
];

const MODELS = ['ChatGPT', 'Claude', 'Perplexity', 'Gemini', 'Mistral'];

// Generate Matrix Data
const MATRIX_DATA: Record<string, Record<string, { status: 'match' | 'warn' | 'wrong', value: string }>> = {};
FACTS.forEach(f => {
  MATRIX_DATA[f.id] = {};
  MODELS.forEach(m => {
    const rand = Math.random();
    if (rand > 0.8) {
      MATRIX_DATA[f.id][m] = { status: 'wrong', value: f.canonical === '2022' ? '2021' : f.canonical === '45 collaborateurs' ? '15 employés' : 'Information incorrecte' };
    } else if (rand > 0.6) {
      MATRIX_DATA[f.id][m] = { status: 'warn', value: f.canonical + ' (Partiel)' };
    } else {
      MATRIX_DATA[f.id][m] = { status: 'match', value: f.canonical };
    }
  });
});

const TREND_DATA = Array.from({ length: 30 }).map((_, i) => ({
  date: `Jour ${i+1}`,
  ChatGPT: 85 + Math.random() * 10,
  Claude: 90 + Math.random() * 8,
  Perplexity: 95 + Math.random() * 5,
  Gemini: 75 + Math.random() * 15,
  Mistral: 80 + Math.random() * 12,
}));

export default function GeoConsistencyPage() {
  const [expandedCell, setExpandedCell] = useState<{fact: string, model: string} | null>(null);

  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="GEO Ops"
          title="Matrice de Cohérence"
          subtitle="Vérification des faits canoniques de votre marque à travers les LLMs."
          actions={
            <button className={COMMAND_BUTTONS.primary}>Forcer rafraîchissement</button>
          }
        />
      }
    >
      {/* Source of Truth Panel */}
      <div className={cn(COMMAND_PANEL, "p-6 bg-gradient-to-r from-emerald-500/5 to-transparent border-emerald-500/10")}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-[14px] font-semibold text-emerald-400 flex items-center gap-2">
            <CheckIcon className="w-4 h-4" /> Source de Vérité (Knowledge Graph)
          </h3>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
            Synchronisé avec Schema.org
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
          {FACTS.map(f => (
            <div key={f.id} className="flex flex-col">
              <span className="text-[10px] text-white/40 uppercase tracking-widest mb-1">{f.label}</span>
              <span className="text-[13px] font-medium text-white/90">{f.canonical}</span>
            </div>
          ))}
        </div>
      </div>

      {/* The Matrix */}
      <div className="mt-8">
        <h3 className="text-[14px] font-semibold text-white/90 mb-4 px-1">Matrice de Divergence</h3>
        <div className={cn(COMMAND_PANEL, "overflow-hidden")}>
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[#090a0b]/95 border-b border-white/[0.05]">
                <tr>
                  <th className="px-5 py-4 font-semibold text-white/40 w-48">Faits Canoniques</th>
                  {MODELS.map(m => (
                    <th key={m} className="px-5 py-4 font-semibold text-white/70 text-center w-32">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {FACTS.map((fact) => (
                  <React.Fragment key={fact.id}>
                    <tr className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-5 py-4 font-medium text-white/80">{fact.label}</td>
                      {MODELS.map(model => {
                        const cell = MATRIX_DATA[fact.id][model];
                        return (
                          <td key={model} className="px-5 py-4 text-center relative">
                            <button 
                              onClick={() => cell.status !== 'match' ? setExpandedCell({fact: fact.id, model}) : null}
                              className={cn(
                                "w-full h-8 flex items-center justify-center rounded-md border transition-all",
                                cell.status === 'match' ? "bg-emerald-500/5 border-transparent text-emerald-500 cursor-default" :
                                cell.status === 'warn' ? "bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20 cursor-pointer" :
                                "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                              )}
                            >
                              {cell.status === 'match' ? <CheckIcon className="w-4 h-4" /> :
                               cell.status === 'warn' ? <AlertTriangleIcon className="w-4 h-4" /> :
                               <XIcon className="w-4 h-4" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                    
                    {/* Expandable Diff Row */}
                    <AnimatePresence>
                      {MODELS.map(model => 
                        expandedCell?.fact === fact.id && expandedCell?.model === model ? (
                          <tr key={`diff-${fact.id}-${model}`} className="bg-white/[0.01] border-b border-white/[0.05]">
                            <td colSpan={MODELS.length + 1} className="p-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="p-6 flex flex-col lg:flex-row gap-6">
                                  <div className="flex-1 space-y-2">
                                    <div className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Source de vérité</div>
                                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-white/90 text-[13px]">
                                      {fact.canonical}
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-center text-white/20">
                                    <ChevronRightIcon className="w-6 h-6" />
                                  </div>
                                  <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-center">
                                      <div className={cn("text-[10px] uppercase tracking-widest font-bold", 
                                        MATRIX_DATA[fact.id][model].status === 'warn' ? 'text-amber-400' : 'text-rose-400'
                                      )}>
                                        Sortie {model}
                                      </div>
                                      <a href="#" className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1">Voir conversation <ExternalLinkIcon className="w-3 h-3" /></a>
                                    </div>
                                    <div className={cn("p-3 border rounded-lg text-white/90 text-[13px]",
                                      MATRIX_DATA[fact.id][model].status === 'warn' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-rose-500/5 border-rose-500/20'
                                    )}>
                                      <span className="bg-rose-500/20 text-rose-200 px-1 rounded">{MATRIX_DATA[fact.id][model].value}</span>
                                    </div>
                                  </div>
                                  <div className="w-48 flex flex-col justify-center gap-2">
                                    <button className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-lg text-[11px] font-semibold transition-colors">
                                      Générer prompt de correction
                                    </button>
                                    <button onClick={() => setExpandedCell(null)} className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg text-[11px] font-medium transition-colors">
                                      Fermer
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        ) : null
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Trend Area Chart */}
      <div className="mt-8">
        <h3 className="text-[14px] font-semibold text-white/90 mb-4 px-1">Évolution de la cohérence globale (30j)</h3>
        <div className={cn(COMMAND_PANEL, "h-[300px] p-6")}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorClaude" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorGPT" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#090a0b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px' }}
                labelStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}
              />
              <Area type="monotone" dataKey="Claude" stroke="#a78bfa" fillOpacity={1} fill="url(#colorClaude)" strokeWidth={2} />
              <Area type="monotone" dataKey="ChatGPT" stroke="#34d399" fillOpacity={1} fill="url(#colorGPT)" strokeWidth={2} />
              {/* Only showing top 2 for clarity in area chart */}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </CommandPageShell>
  );
}
