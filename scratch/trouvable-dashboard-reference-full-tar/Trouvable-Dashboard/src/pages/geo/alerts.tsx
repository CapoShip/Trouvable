import React, { useState } from 'react';
import { CommandPageShell, CommandHeader } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { AlertTriangleIcon, InfoIcon, XCircleIcon, ShieldAlertIcon, CheckCircleIcon, ClockIcon, FilterIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ALERTS = Array.from({ length: 24 }).map((_, i) => {
  const severity = i % 5 === 0 ? 'critical' : i % 2 === 0 ? 'warning' : 'info';
  const group = i < 5 ? "Aujourd'hui" : i < 12 ? "Hier" : "Cette semaine";
  return {
    id: `alert-${i}`,
    group,
    severity,
    title: [
      'Chute de visibilité sur Claude 3.5',
      'Hallucination tarifaire détectée',
      'Nouvelle citation de haute autorité',
      'Divergence majeure d\'informations',
      'Baisse du score de Readiness'
    ][i % 5],
    model: ['Claude 3.5', 'GPT-4o', 'Perplexity', 'Gemini 1.5', 'System'][i % 5],
    query: ['"Meilleur outil audit SEO"', '"Tarifs Trouvable 2024"', '"Alternatives à Semrush"', '"Qui est le CEO de Trouvable?"', 'N/A'][i % 5],
    snippet: [
      '"La marque n\'apparaît plus dans le top 3 pour cette requête stratégique."',
      '"Le chatbot mentionne un forfait gratuit qui n\'existe plus depuis 2023."',
      '"Votre guide sur l\'optimisation GEO est cité comme source de vérité par Perplexity."',
      '"Le nombre d\'employés donné par Gemini (15) diffère de la source (45)."',
      '"Le fichier llms.txt n\'est plus accessible (Erreur 404)."'
    ][i % 5],
    timeAgo: `${Math.floor(Math.random() * 23) + 1}h`,
    status: 'new'
  };
});

export default function GeoAlertsPage() {
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>(['critical', 'warning', 'info']);
  const [alerts, setAlerts] = useState(ALERTS);

  const handleDismiss = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'dismissed' } : a));
  };

  const filteredAlerts = alerts.filter(a => selectedSeverities.includes(a.severity) && a.status === 'new');
  
  const groupedAlerts = filteredAlerts.reduce((acc, alert) => {
    if (!acc[alert.group]) acc[alert.group] = [];
    acc[alert.group].push(alert);
    return acc;
  }, {} as Record<string, typeof ALERTS>);

  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="GEO Ops"
          title="Incident Command Feed"
          subtitle="Centre de notification pour les changements critiques d'exposition IA."
          actions={
            <div className="flex gap-2">
              <button className={COMMAND_BUTTONS.secondary}>Règles d'escalade</button>
              <button className={COMMAND_BUTTONS.primary}>Acquitter tout</button>
            </div>
          }
        />
      }
    >
      <div className="flex flex-col lg:flex-row gap-6 mt-4 h-[calc(100vh-220px)] min-h-[600px]">
        {/* Left: Feed (70%) */}
        <div className="flex-1 flex flex-col overflow-y-auto pr-4 scrollbar-none gap-8">
          <AnimatePresence>
            {Object.entries(groupedAlerts).map(([group, groupAlerts]) => (
              <div key={group}>
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-4 sticky top-0 bg-[#06070a]/90 backdrop-blur py-2 z-10">{group}</h3>
                <div className="flex flex-col gap-3">
                  <AnimatePresence>
                    {groupAlerts.map((alert, i) => (
                      <motion.div
                        key={alert.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          COMMAND_PANEL, 
                          "relative p-5 overflow-hidden flex flex-col gap-3",
                          alert.severity === 'critical' ? 'border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.05)]' :
                          alert.severity === 'warning' ? 'border-amber-500/20' : 'border-sky-500/20'
                        )}
                      >
                        {/* Left border glow line */}
                        <div className={cn("absolute left-0 top-0 bottom-0 w-1",
                          alert.severity === 'critical' ? 'bg-rose-500' :
                          alert.severity === 'warning' ? 'bg-amber-500' : 'bg-sky-500'
                        )} />

                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className={cn("mt-0.5",
                              alert.severity === 'critical' ? 'text-rose-400' :
                              alert.severity === 'warning' ? 'text-amber-400' : 'text-sky-400'
                            )}>
                              {alert.severity === 'critical' ? <XCircleIcon className="w-5 h-5" /> :
                               alert.severity === 'warning' ? <ShieldAlertIcon className="w-5 h-5" /> :
                               <InfoIcon className="w-5 h-5" />}
                            </div>
                            <div>
                              <h4 className="text-[15px] font-semibold text-white/90 leading-tight mb-1">{alert.title}</h4>
                              <div className="flex items-center gap-2 text-[11px] font-mono text-white/50 mb-2">
                                <span className="bg-white/5 px-1.5 py-0.5 rounded">{alert.model}</span>
                                <span>•</span>
                                <span className="text-indigo-300">{alert.query}</span>
                              </div>
                              <p className="text-[13px] text-white/70 italic border-l-2 border-white/10 pl-3 py-1">
                                {alert.snippet}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-2">
                            <span className="text-[11px] text-white/40 flex items-center gap-1"><ClockIcon className="w-3 h-3" /> {alert.timeAgo}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-2 pt-3 border-t border-white/5 ml-8">
                          <button 
                            onClick={() => handleDismiss(alert.id)}
                            className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-[11px] font-medium text-white/70 transition-colors"
                          >
                            Acquitter
                          </button>
                          <button className="px-3 py-1.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-[11px] font-medium text-indigo-400 border border-indigo-500/20 transition-colors">
                            Investiguer
                          </button>
                          <button className="px-3 py-1.5 rounded bg-transparent hover:bg-white/5 text-[11px] font-medium text-white/40 hover:text-white/60 transition-colors ml-auto">
                            Ignorer (Faux positif)
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </AnimatePresence>
        </div>

        {/* Right Rail: Filters & Status (30%) */}
        <div className="w-full lg:w-[320px] flex flex-col gap-6 shrink-0">
          <div className={cn(COMMAND_PANEL, "p-5")}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[12px] font-semibold text-white/90 flex items-center gap-2"><FilterIcon className="w-3.5 h-3.5" /> Filtres</h3>
              <button className="text-[10px] text-indigo-400">Réinitialiser</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Sévérité</h4>
                <div className="flex flex-col gap-2">
                  {['critical', 'warning', 'info'].map(sev => (
                    <label key={sev} className="flex items-center gap-2 cursor-pointer group">
                      <div className={cn("w-4 h-4 rounded border flex items-center justify-center transition-colors", 
                        selectedSeverities.includes(sev) ? "bg-indigo-500 border-indigo-500" : "border-white/20 group-hover:border-white/40"
                      )}>
                        {selectedSeverities.includes(sev) && <CheckCircleIcon className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-[12px] text-white/80 capitalize">{sev === 'critical' ? 'Critique' : sev === 'warning' ? 'Avertissement' : 'Information'}</span>
                      <span className="ml-auto text-[10px] text-white/40 font-mono">
                        {alerts.filter(a => a.severity === sev && a.status === 'new').length}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/5">
                <h4 className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Modèles Source</h4>
                <div className="flex flex-wrap gap-2">
                  {['Claude 3.5', 'GPT-4o', 'Perplexity', 'Gemini 1.5'].map(model => (
                    <button key={model} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] text-white/70 border border-white/10 transition-colors">
                      {model}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* On-call Widget */}
          <div className={cn(COMMAND_PANEL, "p-5 bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20")}>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-indigo-400 mb-4">Astreinte Actuelle</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                  JD
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#090b10]" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-white">Jean Dupont</p>
                <p className="text-[11px] text-white/50">Lead SEO technique</p>
              </div>
            </div>
            <div className="text-[11px] text-white/60 space-y-2">
              <div className="flex justify-between"><span>Escalade N2:</span> <span className="text-white/90">Sarah M. (+30min)</span></div>
              <div className="flex justify-between"><span>SLA Critique:</span> <span className="text-white/90">2 heures</span></div>
            </div>
            <button className="w-full mt-4 py-2 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-[11px] font-medium transition-colors border border-indigo-500/30">
              Contacter (Slack)
            </button>
          </div>
        </div>
      </div>
    </CommandPageShell>
  );
}
