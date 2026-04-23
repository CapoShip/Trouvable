import React, { useState } from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { NetworkIcon, CheckCircle2Icon, AlertTriangleIcon, InfoIcon, ShieldAlertIcon, GlobeIcon, ChevronRightIcon, HashIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SCHEMAS = Array.from({ length: 15 }).map((_, i) => {
  const types = [
    ['Organization', 'WebSite'],
    ['Product', 'BreadcrumbList', 'Review'],
    ['Article', 'FAQPage'],
    ['LocalBusiness', 'PostalAddress'],
    ['CollectionPage']
  ];
  const type = types[i % types.length];
  const status = Math.random() > 0.8 ? 'error' : Math.random() > 0.5 ? 'warning' : 'valid';
  return {
    id: `schema-${i}`,
    url: ['/accueil', '/produits/premium', '/blog/guide-ia', '/contact', '/tarifs'][i % 5] + (i > 4 ? `-${i}` : ''),
    types: type,
    status,
    lines: Math.floor(Math.random() * 200) + 50,
    lastValidated: `Il y a ${Math.floor(Math.random() * 24) + 1}h`,
    issues: status === 'valid' ? [] : 
            status === 'warning' ? ['Propriété recommandée "priceValidUntil" manquante', 'Champ "aggregateRating" sans avis'] : 
            ['Erreur syntaxe JSON-LD', 'Propriété requise "name" manquante pour Article']
  };
});

const JSON_PREVIEW = `{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Acme Corp",
  "url": "https://acme.com",
  "logo": "https://acme.com/logo.png",
  "sameAs": [
    "https://twitter.com/acme",
    "https://linkedin.com/company/acme"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+33-1-23-45-67-89",
    "contactType": "customer service"
  }
}`;

export default function GeoSchemaPage() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="GEO Ops"
          title="Graphe d'Entité & Schema"
          subtitle="Validation du balisage de données structurées et de la définition de l'entité marque pour les LLMs."
          actions={
            <div className="flex gap-2">
              <button className={COMMAND_BUTTONS.secondary}>Exporter Rapport</button>
              <button className={COMMAND_BUTTONS.primary}>Valider le Domaine</button>
            </div>
          }
        />
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CommandMetricCard label="Couverture Schema" value="84%" detail="+5% ce mois" tone="ok" />
        <CommandMetricCard label="Entités Détectées" value="1,240" detail="Types distincts: 14" tone="info" />
        <CommandMetricCard label="Erreurs Critiques" value="12" detail="Impact sur Rich Snippets" tone="critical" />
        <CommandMetricCard label="Avertissements" value="45" detail="Propriétés recommandées" tone="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 h-[calc(100vh-280px)] min-h-[600px]">
        
        {/* Left: Entity Graph Visualizer */}
        <div className={cn(COMMAND_PANEL, "lg:col-span-1 p-0 flex flex-col overflow-hidden")}>
          <div className="p-5 border-b border-white/[0.05] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-white/90">
              <NetworkIcon className="w-4 h-4 text-indigo-400" />
              Graphe d'Entité Marque
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400">Organization</span>
          </div>
          
          <div className="flex-1 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black/20 to-transparent">
            {/* SVG Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.3 }}>
              <line x1="50%" y1="50%" x2="50%" y2="15%" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="50%" y1="50%" x2="15%" y2="40%" stroke="#8b5cf6" strokeWidth="2" />
              <line x1="50%" y1="50%" x2="85%" y2="40%" stroke="#8b5cf6" strokeWidth="2" />
              <line x1="50%" y1="50%" x2="25%" y2="80%" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="50%" y1="50%" x2="75%" y2="80%" stroke="#8b5cf6" strokeWidth="2" />
            </svg>
            
            {/* Nodes */}
            <div className="absolute inset-0">
              {/* Center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer z-20">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-400 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-transform group-hover:scale-110">
                  <span className="text-white font-bold text-sm">Marque</span>
                </div>
              </div>
              
              {/* Satellites */}
              <div className="absolute top-[10%] left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/20 flex items-center justify-center mb-1"><HashIcon className="w-4 h-4 text-white/50" /></div>
                <span className="text-[10px] text-white/60 font-mono bg-black/50 px-2 py-0.5 rounded">FAQPage</span>
              </div>
              <div className="absolute top-[35%] left-[10%] flex flex-col items-center z-10">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/20 flex items-center justify-center mb-1"><HashIcon className="w-4 h-4 text-white/50" /></div>
                <span className="text-[10px] text-white/60 font-mono bg-black/50 px-2 py-0.5 rounded">Person (CEO)</span>
              </div>
              <div className="absolute top-[35%] right-[10%] flex flex-col items-center z-10">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-1"><HashIcon className="w-4 h-4 text-emerald-400" /></div>
                <span className="text-[10px] text-emerald-400/80 font-mono bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-500/20">Service</span>
              </div>
              <div className="absolute bottom-[15%] left-[20%] flex flex-col items-center z-10">
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/20 flex items-center justify-center mb-1"><HashIcon className="w-4 h-4 text-white/50" /></div>
                <span className="text-[10px] text-white/60 font-mono bg-black/50 px-2 py-0.5 rounded">LocalBusiness</span>
              </div>
              <div className="absolute bottom-[15%] right-[20%] flex flex-col items-center z-10">
                <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-1 animate-pulse"><HashIcon className="w-4 h-4 text-rose-400" /></div>
                <span className="text-[10px] text-rose-400/80 font-mono bg-rose-900/30 px-2 py-0.5 rounded border border-rose-500/20">Product (Erreur)</span>
              </div>
            </div>
            
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <span className="text-[10px] text-white/40">Graphe de connaissances déduit de votre balisage JSON-LD.</span>
            </div>
          </div>
        </div>

        {/* Right: Validator List & Editor */}
        <div className={cn(COMMAND_PANEL, "lg:col-span-2 flex flex-col overflow-hidden p-0")}>
          <div className="p-4 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
            <h3 className="text-[12px] font-semibold text-white/90">Validateur d'URL (Page-by-page)</h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-[10px] text-white/50 bg-white/5 px-2 py-1 rounded border border-white/10"><CheckCircle2Icon className="w-3 h-3 text-emerald-400" /> 124 Valides</span>
              <span className="flex items-center gap-1 text-[10px] text-white/50 bg-white/5 px-2 py-1 rounded border border-white/10"><ShieldAlertIcon className="w-3 h-3 text-amber-400" /> 45 Avert.</span>
              <span className="flex items-center gap-1 text-[10px] text-white/50 bg-white/5 px-2 py-1 rounded border border-white/10"><AlertTriangleIcon className="w-3 h-3 text-rose-400" /> 12 Erreurs</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-none divide-y divide-white/[0.02]">
            {SCHEMAS.map((schema, i) => (
              <div key={schema.id} className="flex flex-col">
                {/* Row */}
                <div 
                  onClick={() => setExpandedRow(expandedRow === schema.id ? null : schema.id)}
                  className="p-3 flex items-center gap-4 hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                  <div className="w-6 flex justify-center">
                    {schema.status === 'valid' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> :
                     schema.status === 'warning' ? <ShieldAlertIcon className="w-4 h-4 text-amber-400" /> :
                     <AlertTriangleIcon className="w-4 h-4 text-rose-400" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12px] font-mono text-white/80 group-hover:text-white transition-colors">{schema.url}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {schema.types.map(t => (
                        <span key={t} className="text-[9px] font-mono text-indigo-300/70 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{t}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-white/40 tabular-nums">{schema.lines} lignes JSON-LD</div>
                    <div className="text-[9px] text-white/30">{schema.lastValidated}</div>
                  </div>
                  
                  <ChevronRightIcon className={cn("w-4 h-4 text-white/20 transition-transform duration-200", expandedRow === schema.id && "rotate-90")} />
                </div>
                
                {/* Expanded State (JSON Viewer + Issues) */}
                <AnimatePresence>
                  {expandedRow === schema.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/[0.05] bg-black/20 overflow-hidden"
                    >
                      <div className="p-4 flex flex-col gap-4">
                        {/* Issues List */}
                        {schema.issues.length > 0 && (
                          <div className={cn(
                            "p-3 rounded-lg border",
                            schema.status === 'error' ? "bg-rose-500/5 border-rose-500/20" : "bg-amber-500/5 border-amber-500/20"
                          )}>
                            <div className="text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: schema.status === 'error' ? '#fb7185' : '#fbbf24' }}>
                              {schema.status === 'error' ? <AlertTriangleIcon className="w-3 h-3" /> : <ShieldAlertIcon className="w-3 h-3" />}
                              Problèmes détectés
                            </div>
                            <ul className="space-y-1">
                              {schema.issues.map((issue, idx) => (
                                <li key={idx} className="text-[11px] text-white/70 flex items-start gap-2">
                                  <span className="mt-1 w-1 h-1 rounded-full bg-white/20 shrink-0" />
                                  {issue}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* JSON Viewer */}
                        <div className="rounded-lg border border-white/[0.05] overflow-hidden bg-[#0d1117] flex flex-col">
                          <div className="px-3 py-1.5 bg-black/40 border-b border-white/[0.05] flex items-center justify-between">
                            <span className="text-[10px] font-mono text-white/40">application/ld+json</span>
                            <button className="text-[9px] text-indigo-400 hover:text-indigo-300">Copier</button>
                          </div>
                          <div className="p-3 overflow-x-auto">
                            <pre className="text-[11px] font-mono leading-relaxed">
                              <code>
                                <span className="text-white/80">{`{\n`}</span>
                                <span className="text-sky-300">  "@context"</span><span className="text-white/80">: </span><span className="text-emerald-300">"https://schema.org"</span><span className="text-white/80">{`,\n`}</span>
                                <span className="text-sky-300">  "@type"</span><span className="text-white/80">: </span><span className="text-emerald-300">"Organization"</span><span className="text-white/80">{`,\n`}</span>
                                <span className="text-sky-300">  "name"</span><span className="text-white/80">: </span><span className="text-emerald-300">"Acme Corp"</span><span className="text-white/80">{`,\n`}</span>
                                {schema.status === 'error' && (
                                  <div className="bg-rose-500/20 -mx-3 px-3 border-l-2 border-rose-500 inline-block w-full">
                                    <span className="text-rose-300">  // Missing required property 'logo'</span><span className="text-white/80">{`\n`}</span>
                                  </div>
                                )}
                                <span className="text-sky-300">  "url"</span><span className="text-white/80">: </span><span className="text-emerald-300">"https://acme.com"</span><span className="text-white/80">{`\n`}</span>
                                <span className="text-white/80">{`}`}</span>
                              </code>
                            </pre>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CommandPageShell>
  );
}
