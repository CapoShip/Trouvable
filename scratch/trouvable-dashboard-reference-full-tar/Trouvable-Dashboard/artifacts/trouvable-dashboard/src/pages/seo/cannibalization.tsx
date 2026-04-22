import React, { useState } from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { NetworkIcon, GitMergeIcon, ExternalLinkIcon, ShieldAlertIcon, ArrowRightIcon, GripHorizontalIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const KEYWORDS = ['logiciel paie', 'tarifs agence', 'guide seo', 'contact support', 'audit technique', 'consultant paris', 'formation rh', 'comparatif sirh'];

// Generate mock conflict clusters
const CLUSTERS = Array.from({ length: 8 }).map((_, i) => ({
  id: `cluster-${i}`,
  keyword: KEYWORDS[i],
  severity: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)],
  trafficRisk: Math.floor(Math.random() * 2000) + 100,
  urls: Array.from({ length: Math.floor(Math.random() * 2) + 2 }).map((_, j) => ({
    id: `url-${i}-${j}`,
    path: j === 0 ? `/${KEYWORDS[i].replace(' ', '-')}` : `/blog/${KEYWORDS[i].replace(' ', '-')}-2024`,
    position: Math.floor(Math.random() * 50) + 1,
    clicks: Math.floor(Math.random() * 500) + 10,
    intent: j === 0 ? 'Transactionnel' : 'Informationnel'
  }))
}));

// Calculate total traffic of a cluster
CLUSTERS.forEach(c => {
  const totalClicks = c.urls.reduce((sum, u) => sum + u.clicks, 0);
  c.urls.forEach(u => {
    (u as any).share = Math.round((u.clicks / totalClicks) * 100);
  });
});

// Sort by severity (mock order)
const severityOrder: Record<string, number> = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
CLUSTERS.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

const HeatmapCell = ({ severity }: { severity: string }) => {
  const colors: Record<string, string> = {
    'critical': 'bg-rose-500/80',
    'high': 'bg-rose-500/40',
    'medium': 'bg-amber-500/40',
    'low': 'bg-white/5',
    'none': 'bg-white/[0.02]'
  };
  return <div className={cn("w-full h-8 rounded-sm transition-colors cursor-pointer hover:ring-1 ring-white/20", colors[severity] || colors.none)} title={`Sévérité: ${severity}`} />;
};

export default function SeoCannibalizationPage() {
  const [expandedCluster, setExpandedCluster] = useState<string | null>(CLUSTERS[0].id);

  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="SEO Ops"
          title="Graphe de Cannibalisation"
          subtitle="Détection des conflits de mots-clés où plusieurs pages de votre site se concurrencent dans les SERPs."
          actions={
            <button className={COMMAND_BUTTONS.primary}>Lancer une détection</button>
          }
        />
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CommandMetricCard label="Conflits Critiques" value="3" detail="Perte de position directe" tone="critical" />
        <CommandMetricCard label="Trafic à Risque" value="4.5k" detail="Visites mensuelles" tone="warning" />
        <CommandMetricCard label="Pages Impliquées" value="18" detail="Dans des clusters de conflit" tone="info" />
        <CommandMetricCard label="Conflits Résolus" value="12" detail="Les 30 derniers jours" tone="ok" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        
        {/* Left: Conflict List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="text-[14px] font-semibold text-white/90">Clusters de Conflit</div>
          
          <div className="space-y-3">
            {CLUSTERS.map((cluster, i) => {
              const isExpanded = expandedCluster === cluster.id;
              
              return (
                <motion.div 
                  key={cluster.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    COMMAND_PANEL, 
                    "p-0 overflow-hidden transition-all duration-300",
                    isExpanded ? "ring-1 ring-indigo-500/30" : "hover:bg-white/[0.04]"
                  )}
                >
                  {/* Cluster Header (Clickable) */}
                  <div 
                    onClick={() => setExpandedCluster(isExpanded ? null : cluster.id)}
                    className="p-4 flex items-center justify-between cursor-pointer select-none bg-white/[0.01]"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        cluster.severity === 'critical' ? 'bg-rose-500' :
                        cluster.severity === 'high' ? 'bg-rose-400' :
                        cluster.severity === 'medium' ? 'bg-amber-400' : 'bg-white/20'
                      )} />
                      <div>
                        <div className="text-[13px] font-bold text-white/90">"{cluster.keyword}"</div>
                        <div className="text-[10px] text-white/40 mt-0.5">{cluster.urls.length} URLs en compétition</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <div className="text-[10px] text-white/40 uppercase tracking-widest font-semibold mb-0.5">Trafic à risque</div>
                        <div className="text-[12px] font-mono text-amber-400 font-bold">{cluster.trafficRisk.toLocaleString()} clics/mo</div>
                      </div>
                      <ChevronRightIcon className={cn("w-4 h-4 text-white/30 transition-transform duration-300", isExpanded && "rotate-90")} />
                    </div>
                  </div>
                  
                  {/* Expanded Detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-white/[0.05] bg-black/20"
                      >
                        <div className="p-4 space-y-4">
                          {/* URLs in conflict */}
                          <div className="space-y-2">
                            {cluster.urls.sort((a, b) => b.clicks - a.clicks).map((url: any, idx) => (
                              <div key={url.id} className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.05] bg-white/[0.02]">
                                <GripHorizontalIcon className="w-4 h-4 text-white/10 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[12px] font-mono text-white/80 truncate">{url.path}</span>
                                    {idx === 0 && <span className="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest bg-emerald-400/10 text-emerald-400 font-bold">Leader</span>}
                                  </div>
                                  <div className="flex items-center gap-3 text-[10px]">
                                    <span className="text-white/40">Intention: <span className="text-white/70">{url.intent}</span></span>
                                    <span className="text-white/40">Pos: <span className="text-white/70 font-bold">#{url.position}</span></span>
                                    <span className="text-white/40">Clics: <span className="text-white/70 tabular-nums">{url.clicks}</span></span>
                                  </div>
                                </div>
                                <div className="w-24 shrink-0 px-2">
                                  <div className="flex justify-between text-[9px] mb-1">
                                    <span className="text-white/40">Part</span>
                                    <span className="text-white font-bold">{url.share}%</span>
                                  </div>
                                  <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${url.share}%` }} />
                                  </div>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <button className="p-1.5 hover:bg-white/10 rounded text-white/40 hover:text-white transition-colors" title="Voir l'URL">
                                    <ExternalLinkIcon className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Action Block */}
                          <div className="mt-4 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <div className="text-[11px] font-semibold text-indigo-300 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                <GitMergeIcon className="w-3.5 h-3.5" /> Recommandation IA
                              </div>
                              <p className="text-[12px] text-white/70 leading-relaxed max-w-lg">
                                L'intention des deux pages se chevauche fortement. Nous recommandons de <strong>fusionner</strong> le contenu du blog vers la page commerciale et de mettre en place une redirection 301.
                              </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button className={cn(COMMAND_BUTTONS.subtle, "border-white/10")}>Ignorer</button>
                              <button className={COMMAND_BUTTONS.primary}>Générer Plan d'action</button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Rail: Visual Graph & Heatmap */}
        <div className="col-span-1 flex flex-col gap-6">
          
          {/* Heatmap */}
          <div className={cn(COMMAND_PANEL, "p-5")}>
            <div className="flex items-center gap-2 mb-4 text-white/90 font-semibold text-[13px]">
              <ShieldAlertIcon className="w-4 h-4 text-amber-400" /> Matrice de Sévérité
            </div>
            
            <div className="flex">
              {/* Y Axis (Keywords) */}
              <div className="w-24 flex flex-col gap-1 mt-4 mr-2">
                {KEYWORDS.slice(0, 5).map(k => <div key={k} className="h-8 flex items-center text-[9px] text-white/40 font-mono truncate justify-end">{k}</div>)}
              </div>
              
              {/* Grid */}
              <div className="flex-1">
                {/* X Axis labels */}
                <div className="flex gap-1 mb-2 h-4">
                  {Array.from({ length: 5 }).map((_, i) => <div key={i} className="flex-1 text-[9px] text-white/30 text-center">/url-{i+1}</div>)}
                </div>
                {/* Cells */}
                <div className="flex flex-col gap-1">
                  {Array.from({ length: 5 }).map((_, r) => (
                    <div key={r} className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, c) => {
                        const sev = r === c ? 'critical' : Math.random() > 0.8 ? 'high' : Math.random() > 0.6 ? 'medium' : Math.random() > 0.4 ? 'low' : 'none';
                        return <div key={`${r}-${c}`} className="flex-1"><HeatmapCell severity={sev} /></div>;
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-3 mt-6">
              <span className="flex items-center gap-1.5 text-[9px] text-white/40"><div className="w-2 h-2 bg-rose-500 rounded-sm" /> Critique</span>
              <span className="flex items-center gap-1.5 text-[9px] text-white/40"><div className="w-2 h-2 bg-amber-500/50 rounded-sm" /> Moyen</span>
              <span className="flex items-center gap-1.5 text-[9px] text-white/40"><div className="w-2 h-2 bg-white/5 rounded-sm" /> Sain</span>
            </div>
          </div>

          {/* Network Graph Placeholder */}
          <div className={cn(COMMAND_PANEL, "p-5 flex-1 min-h-[300px] flex flex-col")}>
            <div className="flex items-center gap-2 mb-4 text-white/90 font-semibold text-[13px]">
              <NetworkIcon className="w-4 h-4 text-indigo-400" /> Topologie
            </div>
            <div className="flex-1 relative border border-white/[0.05] rounded-xl bg-black/20 overflow-hidden flex items-center justify-center">
              {/* Pseudo force-directed graph with CSS */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <svg width="100%" height="100%">
                  <line x1="50%" y1="50%" x2="30%" y2="30%" stroke="white" strokeWidth="1" />
                  <line x1="50%" y1="50%" x2="70%" y2="30%" stroke="white" strokeWidth="1" />
                  <line x1="50%" y1="50%" x2="50%" y2="70%" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4" />
                </svg>
              </div>
              <div className="relative w-full h-full">
                {/* Central Keyword Node */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-400 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)] z-10">
                    <span className="text-indigo-200 font-bold text-xs">KW</span>
                  </div>
                  <span className="mt-2 text-[10px] bg-black/60 px-2 py-0.5 rounded border border-white/10 text-white/80">logiciel paie</span>
                </div>
                {/* Connected URL Nodes */}
                <div className="absolute top-[25%] left-[25%] flex flex-col items-center">
                  <div className="w-8 h-8 rounded bg-white/5 border border-white/20 flex items-center justify-center z-10">
                    <span className="text-white/60 text-[10px]">URL</span>
                  </div>
                  <span className="mt-1 text-[8px] text-white/40">/produits/paie</span>
                </div>
                <div className="absolute top-[25%] right-[25%] flex flex-col items-center">
                  <div className="w-8 h-8 rounded bg-white/5 border border-white/20 flex items-center justify-center z-10">
                    <span className="text-white/60 text-[10px]">URL</span>
                  </div>
                  <span className="mt-1 text-[8px] text-white/40">/tarifs</span>
                </div>
                <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className="w-10 h-10 rounded bg-rose-500/10 border border-rose-500 flex items-center justify-center z-10 animate-pulse">
                    <span className="text-rose-400 text-[10px] font-bold">URL</span>
                  </div>
                  <span className="mt-1 text-[8px] text-rose-400/80 font-bold">/blog/logiciel</span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-white/40 mt-3 text-center">Sélectionnez un cluster pour visualiser ses relations.</p>
          </div>
        </div>

      </div>
    </CommandPageShell>
  );
}

// Simple internal icon for chevron right since it's not imported above to save space in imports
function ChevronRightIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
