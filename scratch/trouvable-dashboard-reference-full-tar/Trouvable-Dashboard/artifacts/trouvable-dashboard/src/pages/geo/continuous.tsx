import React, { useState } from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { SettingsIcon, ActivityIcon, GitCommitIcon, BellIcon, SaveIcon, HistoryIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const DIFF_FEED = [
  { id: 1, query: 'tarifs agence', model: 'Claude 3.5', time: 'Aujourd\'hui 08:45', 
    before: 'Les tarifs débutent à 999€ par mois.', 
    after: 'Les tarifs débutent à 499€ par mois pour le forfait pro.',
    type: 'improvement' // False -> True
  },
  { id: 2, query: 'meilleur outil geo', model: 'ChatGPT 4o', time: 'Hier 14:20', 
    before: 'Trouvable est classé #1 dans notre comparatif des outils GEO.', 
    after: 'Trouvable et BrightEdge sont les leaders du marché GEO.',
    type: 'regression' // #1 -> Leader partagé
  },
  { id: 3, query: 'fonctionnalités trouvable', model: 'Perplexity', time: 'Il y a 2j', 
    before: 'Permet l\'audit SEO technique.', 
    after: 'Permet l\'audit SEO technique ET la préparation pour les agents (MCP).',
    type: 'addition' // New feature ingested
  }
];

export default function GeoContinuousPage() {
  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="GEO Ops"
          title="Monitoring Continu"
          subtitle="Surveillance asynchrone des modèles et détection des changements de discours (Diffs)."
          actions={
            <button className={COMMAND_BUTTONS.primary}><SaveIcon className="w-3.5 h-3.5 mr-1" /> Sauvegarder Config</button>
          }
        />
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CommandMetricCard label="Fréquence actuelle" value="Toutes les 6h" detail="Sur les mots-clés P0" tone="info" />
        <CommandMetricCard label="Variations détectées" value="12" detail="Sur les 7 derniers jours" tone="warning" />
        <CommandMetricCard label="Stabilité Globale" value="88%" detail="Peu de fluctuations" tone="ok" />
        <CommandMetricCard label="Coût API Estimé" value="$45/mo" detail="Budget maîtrisé" tone="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        
        {/* Left 2/3: Diff Feed */}
        <div className={cn(COMMAND_PANEL, "lg:col-span-2 p-0 flex flex-col h-[550px]")}>
          <div className="p-4 border-b border-white/[0.05] bg-white/[0.02] flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-white/90 flex items-center gap-2">
              <GitCommitIcon className="w-4 h-4 text-indigo-400" /> Registre des Changements (Diffs)
            </h3>
            <button className="text-[10px] font-medium text-white/50 hover:text-white flex items-center gap-1"><HistoryIcon className="w-3 h-3" /> Voir historique complet</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {DIFF_FEED.map((diff, i) => (
              <motion.div 
                key={diff.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/[0.01] border border-white/[0.05] rounded-xl overflow-hidden"
              >
                {/* Header */}
                <div className="px-4 py-2 border-b border-white/[0.05] bg-black/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono bg-white/10 text-white/70 px-2 py-0.5 rounded">{diff.model}</span>
                    <span className="text-[12px] font-bold text-white/90">{diff.query}</span>
                  </div>
                  <span className="text-[10px] text-white/40">{diff.time}</span>
                </div>
                
                {/* Diff View */}
                <div className="p-0 font-mono text-[11px] leading-relaxed">
                  <div className="px-4 py-3 bg-rose-500/5 text-rose-200/80 border-b border-white/[0.02] flex gap-3">
                    <span className="text-rose-500 font-bold select-none">-</span>
                    <p className="flex-1">{diff.before}</p>
                  </div>
                  <div className="px-4 py-3 bg-emerald-500/5 text-emerald-200/80 flex gap-3">
                    <span className="text-emerald-500 font-bold select-none">+</span>
                    <p className="flex-1">{diff.after}</p>
                  </div>
                </div>
                
                {/* Footer Action */}
                <div className="px-4 py-2 border-t border-white/[0.05] bg-black/40 flex justify-end">
                  <span className={cn("text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                    diff.type === 'improvement' ? 'text-emerald-400 bg-emerald-400/10' :
                    diff.type === 'regression' ? 'text-rose-400 bg-rose-400/10' :
                    'text-sky-400 bg-sky-400/10'
                  )}>
                    {diff.type === 'improvement' ? 'Amélioration' : diff.type === 'regression' ? 'Régression' : 'Ajout d\'information'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right 1/3: Configuration */}
        <div className="flex flex-col gap-6">
          <div className={cn(COMMAND_PANEL, "p-5")}>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
              <SettingsIcon className="w-3.5 h-3.5" /> Configuration Cron
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-white/60 mb-2 block">Fréquence des Audits P0 (Top requêtes)</label>
                <select className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[12px] text-white outline-none focus:border-indigo-500">
                  <option>Toutes les 6 heures</option>
                  <option>Quotidien (08:00 UTC)</option>
                  <option>Hebdomadaire</option>
                </select>
              </div>
              
              <div>
                <label className="text-[11px] text-white/60 mb-2 block">Fréquence des Audits P1 (Long tail)</label>
                <select className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-[12px] text-white outline-none focus:border-indigo-500">
                  <option>Hebdomadaire (Lundi)</option>
                  <option>Mensuel</option>
                  <option>Désactivé</option>
                </select>
              </div>
              
              <div className="pt-2">
                <label className="flex items-center justify-between p-3 rounded-lg border border-white/[0.05] bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors">
                  <div>
                    <div className="text-[12px] font-bold text-white/90">Smart Fallback</div>
                    <div className="text-[10px] text-white/40 mt-0.5">Réessayer les erreurs API (429) après 5min</div>
                  </div>
                  <input type="checkbox" defaultChecked className="accent-indigo-500 w-4 h-4" />
                </label>
              </div>
            </div>
          </div>

          <div className={cn(COMMAND_PANEL, "p-5 flex-1")}>
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
              <BellIcon className="w-3.5 h-3.5" /> Webhooks & Alertes
            </h3>
            
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-white/[0.05] bg-white/[0.02]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-bold text-white/90">Slack / Teams</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Actif</span>
                </div>
                <div className="text-[10px] font-mono text-white/30 truncate">https://hooks.slack.com/services/T0...</div>
              </div>
              
              <div className="p-3 rounded-lg border border-white/[0.05] bg-white/[0.02]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[12px] font-bold text-white/90">Email (Résumé Quotidien)</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Actif</span>
                </div>
                <div className="text-[10px] font-mono text-white/30">seo-team@acme.com</div>
              </div>
              
              <button className="w-full py-2.5 rounded-lg border border-dashed border-white/20 text-[11px] font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors mt-2">
                + Ajouter une intégration
              </button>
            </div>
          </div>
        </div>

      </div>
    </CommandPageShell>
  );
}
