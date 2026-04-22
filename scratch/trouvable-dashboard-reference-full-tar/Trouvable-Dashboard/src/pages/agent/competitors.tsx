import React from 'react';
import { CommandPageShell, CommandHeader } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { motion } from 'framer-motion';
import { TrophyIcon, TargetIcon, ZapIcon } from 'lucide-react';

const BRANDS = [
  { id: 'us', name: 'Trouvable (Vous)', color: 'bg-indigo-500', score: 74 },
  { id: 'c1', name: 'OptiRank IA', color: 'bg-white/20', score: 82 },
  { id: 'c2', name: 'SearchAgent B2B', color: 'bg-white/20', score: 65 },
  { id: 'c3', name: 'Rankify', color: 'bg-white/20', score: 58 },
  { id: 'c4', name: 'Visibility Pro', color: 'bg-white/20', score: 45 },
].sort((a,b) => b.score - a.score);

const METRICS = [
  { key: 'Visibilité IA (Mentions)', values: [85, 92, 60, 45, 30] },
  { key: 'Actionnabilité (Taux Succès)', values: [68, 88, 50, 40, 25] },
  { key: 'Latence API (Inversé)', values: [75, 60, 80, 50, 40] },
  { key: 'Couverture Protocoles', values: [60, 90, 40, 30, 20] },
  { key: 'Fraîcheur Schema.org', values: [95, 85, 70, 60, 50] },
  { key: 'Taux d\'Erreur (Inversé)', values: [70, 80, 50, 40, 30] },
];

export default function AgentCompetitorsPage() {
  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="AGENT Ops"
          title="Benchmark Concurrentiel"
          subtitle="Comparaison de votre préparation Agentic face aux acteurs clés du marché."
          actions={
            <div className="flex gap-2">
              <button className={COMMAND_BUTTONS.secondary}>Modifier Concurrents</button>
              <button className={COMMAND_BUTTONS.primary}>Générer Rapport PDF</button>
            </div>
          }
        />
      }
    >
      {/* Top: Ranking Header */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {BRANDS.map((brand, i) => (
          <div key={brand.id} className={cn(COMMAND_PANEL, "p-5 flex flex-col items-center justify-center relative overflow-hidden",
            brand.id === 'us' ? "border-indigo-500/30 bg-gradient-to-b from-indigo-500/10 to-transparent" : ""
          )}>
            {i === 0 && <TrophyIcon className="absolute top-3 right-3 w-4 h-4 text-amber-400" />}
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Rang #{i+1}</span>
            <h3 className={cn("text-[14px] font-bold mb-3 text-center", brand.id === 'us' ? 'text-indigo-300' : 'text-white/80')}>{brand.name}</h3>
            <div className="text-3xl font-black text-white tabular-nums tracking-tighter">{brand.score}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mt-8">
        {/* Left: Metric Strips */}
        <div className={cn(COMMAND_PANEL, "flex-1 p-6 flex flex-col gap-6")}>
          <h3 className="text-[14px] font-semibold text-white/90 mb-2">Comparaison détaillée par métrique</h3>
          
          <div className="space-y-6">
            {METRICS.map((metric, idx) => (
              <div key={metric.key} className="flex flex-col">
                <span className="text-[11px] uppercase tracking-widest text-white/50 font-semibold mb-3">{metric.key}</span>
                <div className="space-y-2">
                  {BRANDS.map((brand, bIdx) => {
                    const val = metric.values[bIdx];
                    return (
                      <div key={brand.id} className="flex items-center gap-3 group">
                        <span className={cn("text-[11px] w-32 truncate text-right", brand.id === 'us' ? 'text-indigo-300 font-bold' : 'text-white/60')}>{brand.name}</span>
                        <div className="flex-1 h-3 bg-white/[0.03] rounded-full overflow-hidden flex items-center">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${val}%` }}
                            transition={{ duration: 0.5, delay: idx * 0.1 + bIdx * 0.05 }}
                            className={cn("h-full rounded-full transition-colors", brand.id === 'us' ? 'bg-indigo-500' : 'bg-white/20 group-hover:bg-white/30')} 
                          />
                        </div>
                        <span className="text-[11px] font-mono text-white/70 w-8 text-right">{val}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Rail: Insights & Actions */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6">
          
          {/* Win / Lose Panel */}
          <div className={cn(COMMAND_PANEL, "p-6")}>
            <h3 className="text-[12px] font-semibold text-white/90 mb-4 flex items-center gap-2"><TargetIcon className="w-4 h-4 text-indigo-400" /> Analyse Compétitive</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-rose-400 font-bold mb-3 bg-rose-500/10 px-2 py-1 rounded inline-block">Ce qu'ils font mieux</h4>
                <ul className="space-y-2 text-[12px] text-white/70">
                  <li className="flex items-start gap-2"><span className="text-rose-400 mt-0.5">•</span> OptiRank a un support complet MCP (100%).</li>
                  <li className="flex items-start gap-2"><span className="text-rose-400 mt-0.5">•</span> Latence API inférieure de 200ms chez SearchAgent.</li>
                  <li className="flex items-start gap-2"><span className="text-rose-400 mt-0.5">•</span> Taux d'échec Auth proche de 0% pour le top 2.</li>
                </ul>
              </div>

              <div className="pt-4 border-t border-white/5">
                <h4 className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-3 bg-emerald-500/10 px-2 py-1 rounded inline-block">Ce que nous faisons mieux</h4>
                <ul className="space-y-2 text-[12px] text-white/70">
                  <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span> Documentation OpenAPI la plus riche du panel.</li>
                  <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span> Schema.org mis à jour en temps réel (vs 48h).</li>
                  <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span> Découvrabilité via llms.txt parfaite.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className={cn(COMMAND_PANEL, "p-6 bg-gradient-to-b from-indigo-500/10 to-transparent border-indigo-500/20")}>
            <h3 className="text-[12px] font-semibold text-white/90 mb-4 flex items-center gap-2"><ZapIcon className="w-4 h-4 text-amber-400" /> Plan d'Action</h3>
            
            <div className="space-y-4">
              <div className="p-3 bg-[#06070a] rounded-lg border border-white/5">
                <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">Priorité 1</span>
                <span className="text-[12px] text-white/90 font-medium block">Implémenter Serveur MCP</span>
                <span className="text-[11px] text-white/50 block mt-1">Comble le gap principal avec OptiRank IA sur Claude Desktop.</span>
              </div>
              <div className="p-3 bg-[#06070a] rounded-lg border border-white/5">
                <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">Priorité 2</span>
                <span className="text-[12px] text-white/90 font-medium block">Optimisation Latence Auth</span>
                <span className="text-[11px] text-white/50 block mt-1">Réduire le temps de vérification token sous les 50ms.</span>
              </div>
              <button className="w-full mt-2 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[11px] font-semibold rounded-lg transition-colors border border-indigo-500/20">
                Ajouter au backlog (Jira)
              </button>
            </div>
          </div>

        </div>
      </div>
    </CommandPageShell>
  );
}
