import React, { useState } from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon, ChevronDownIcon, ExternalLinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const SECTIONS = [
  { id: 'auth', title: 'Authentification & Accès', score: 85 },
  { id: 'disco', title: 'Découvrabilité API', score: 92 },
  { id: 'mcp', title: 'Serveur MCP', score: 40 },
  { id: 'schema', title: 'Sémantique Schema.org', score: 78 },
  { id: 'rate', title: 'Gestion des Rate Limits', score: 100 },
  { id: 'docs', title: 'Documentation Agentic', score: 65 },
  { id: 'idem', title: 'Idempotence', score: 88 },
  { id: 'webhooks', title: 'Webhooks & Callbacks', score: 50 },
];

const CHECKLIST = SECTIONS.reduce((acc, section) => {
  acc[section.id] = Array.from({ length: Math.floor(Math.random() * 3) + 5 }).map((_, i) => ({
    id: `${section.id}-${i}`,
    title: [
      `Vérification du endpoint /api/v1/auth`,
      `Présence du fichier openapi.json à la racine`,
      `Support des tokens de session longue durée`,
      `Implémentation du header X-Agent-ID`,
      `Définition des scopes granulaires`
    ][i % 5],
    status: Math.random() > 0.7 ? 'fail' : Math.random() > 0.4 ? 'warn' : 'pass',
    evidence: `https://api.trouvable.ai/docs#${section.id}-${i}`,
    steps: [
      "1. Analyser les logs d'erreur de l'agent 403.",
      "2. Mettre à jour la politique CORS pour autoriser l'origine de l'agent.",
      "3. Déployer et relancer le test d'intégration."
    ]
  }));
  return acc;
}, {} as Record<string, any[]>);

export default function AgentReadinessPage() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="AGENT Ops"
          title="Checklist Préparation"
          subtitle="Évaluation détaillée des prérequis techniques pour l'intégration des agents autonomes."
          actions={
            <button className={COMMAND_BUTTONS.primary}>Télécharger Rapport</button>
          }
        />
      }
    >
      <div className="flex flex-col lg:flex-row gap-6 items-start h-[calc(100vh-180px)] min-h-[600px] overflow-hidden">
        {/* Left Rail: TOC & Overall Score */}
        <div className={cn(COMMAND_PANEL, "w-full lg:w-[280px] shrink-0 p-5 flex flex-col h-full overflow-hidden")}>
          <div className="flex flex-col items-center justify-center py-4 border-b border-white/5 mb-4 shrink-0">
            <div className="w-32 h-32 relative mb-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={[{value: 75}, {value: 25}]} cx="50%" cy="50%" innerRadius={45} outerRadius={60} startAngle={225} endAngle={-45} dataKey="value" stroke="none">
                    <Cell fill="#a78bfa" />
                    <Cell fill="rgba(255,255,255,0.05)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <span className="text-2xl font-bold text-white tracking-tighter">75%</span>
                <span className="text-[9px] uppercase tracking-widest text-white/40">Readiness</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-none space-y-1">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group",
                  activeSection === section.id 
                    ? "bg-white/[0.08] border border-white/10" 
                    : "hover:bg-white/[0.04] border border-transparent"
                )}
              >
                <div className="flex flex-col">
                  <span className={cn("text-[12px] font-medium transition-colors", activeSection === section.id ? "text-white" : "text-white/70 group-hover:text-white")}>{section.title}</span>
                  <span className="text-[10px] text-white/40">{CHECKLIST[section.id].filter(i=>i.status==='pass').length}/{CHECKLIST[section.id].length} validés</span>
                </div>
                <div className={cn("text-[11px] font-bold tabular-nums px-2 py-0.5 rounded",
                  section.score >= 80 ? "text-emerald-400 bg-emerald-500/10" :
                  section.score >= 60 ? "text-amber-400 bg-amber-500/10" : "text-rose-400 bg-rose-500/10"
                )}>
                  {section.score}%
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Center: Checklist Panels */}
        <div className="flex-1 w-full h-full overflow-y-auto scrollbar-none pr-2 pb-12 space-y-8">
          {SECTIONS.map((section) => (
            <div key={section.id} id={`section-${section.id}`} className={cn(COMMAND_PANEL, "p-6")}>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                <div>
                  <h3 className="text-[18px] font-semibold text-white/90">{section.title}</h3>
                  <p className="text-[12px] text-white/50 mt-1">Évaluation technique des prérequis de {section.title.toLowerCase()}.</p>
                </div>
                <div className={cn("text-2xl font-bold tabular-nums",
                  section.score >= 80 ? "text-emerald-400" : section.score >= 60 ? "text-amber-400" : "text-rose-400"
                )}>
                  {section.score}%
                </div>
              </div>

              <div className="space-y-3">
                {CHECKLIST[section.id].map((item: any) => (
                  <div key={item.id} className={cn("rounded-xl border transition-colors",
                    expandedItems[item.id] ? "bg-white/[0.04] border-white/10" : "bg-white/[0.02] border-white/[0.05] hover:border-white/10"
                  )}>
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer select-none"
                      onClick={() => toggleItem(item.id)}
                    >
                      <div className="flex items-center gap-3">
                        {item.status === 'pass' ? <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0" /> :
                         item.status === 'warn' ? <AlertTriangleIcon className="w-5 h-5 text-amber-400 shrink-0" /> :
                         <XCircleIcon className="w-5 h-5 text-rose-400 shrink-0" />}
                        <span className="text-[13px] font-medium text-white/80">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn("text-[10px] uppercase tracking-wider font-bold",
                          item.status === 'pass' ? "text-emerald-400/50" :
                          item.status === 'warn' ? "text-amber-400/50" : "text-rose-400/50"
                        )}>
                          {item.status === 'pass' ? 'Validé' : item.status === 'warn' ? 'Améliorable' : 'Critique'}
                        </span>
                        <ChevronDownIcon className={cn("w-4 h-4 text-white/30 transition-transform", expandedItems[item.id] && "rotate-180")} />
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedItems[item.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 pt-0 border-t border-white/5 mt-2 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                              <div className="text-[11px] font-mono text-indigo-300 flex items-center gap-1.5">
                                <ExternalLinkIcon className="w-3.5 h-3.5" />
                                {item.evidence}
                              </div>
                            </div>
                            
                            {item.status !== 'pass' && (
                              <div className="bg-[#06070a] p-4 rounded-lg border border-white/5">
                                <h4 className="text-[11px] uppercase tracking-widest text-white/40 mb-2 font-semibold">Comment fixer</h4>
                                <div className="space-y-1.5">
                                  {item.steps.map((step: string, i: number) => (
                                    <p key={i} className="text-[12px] text-white/70">{step}</p>
                                  ))}
                                </div>
                                <div className="mt-4 flex gap-2">
                                  <button className={COMMAND_BUTTONS.secondary}>Ouvrir la documentation</button>
                                  <button className="px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white text-[12px] font-semibold transition-colors">Ignorer l'avertissement</button>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-white/40">Dernier audit: {new Date().toLocaleDateString('fr-FR')}</span>
                <button className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-full">Re-tester la section</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CommandPageShell>
  );
}
