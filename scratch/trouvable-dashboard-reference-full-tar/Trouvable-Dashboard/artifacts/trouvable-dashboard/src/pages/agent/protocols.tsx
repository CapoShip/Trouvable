import React, { useState } from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { CheckCircle2Icon, AlertCircleIcon, XCircleIcon, MinusCircleIcon, LinkIcon, BookOpenIcon, GitCommitIcon, TerminalIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const PROTOCOLS = [
  { id: 'mcp', name: 'Model Context Protocol', version: 'v1.0', adoption: 15, status: 'warn', features: ['Outils locaux', 'Accès fichiers', 'Ressources distantes', 'Prompts dynamiques', 'Transport SSE'] },
  { id: 'openapi', name: 'OpenAPI Specification', version: '3.1.0', adoption: 95, status: 'ok', features: ['Découvrabilité JSON', 'Validation schémas', 'Sécurité OAuth', 'Webhooks', 'Callbacks'] },
  { id: 'a2a', name: 'Agent-to-Agent (A2A)', version: 'Bêta', adoption: 5, status: 'error', features: ['Négociation de protocole', 'Délégation de tâche', 'Partage de contexte', 'Résolution de conflit'] },
  { id: 'anp', name: 'Agent Network Protocol', version: 'Draft', adoption: 0, status: 'none', features: ['Routage sémantique', 'Découverte P2P', 'Garanties d\'exécution', 'Preuves cryptographiques'] },
];

const ENDPOINTS = Array.from({ length: 15 }).map((_, i) => {
  const paths = ['/api/v1/auth/token', '/api/v1/users/me', '/api/v1/products', '/api/v1/products/{id}', '/api/v1/orders', '/api/v1/orders/{id}', '/api/v1/orders/{id}/cancel', '/api/v1/quotes', '/api/v1/quotes/{id}/accept', '/api/v1/inventory', '/api/v1/webhooks', '/openapi.json', '/.well-known/llms.txt', '/api/v1/search', '/api/v1/recommendations'];
  const descs = ['Authentification OAuth2', 'Profil utilisateur', 'Catalogue produits', 'Détails produit', 'Création commande', 'Suivi commande', 'Annulation commande', 'Génération devis', 'Validation devis', 'Vérification stock', 'Configuration événements', 'Spécification API', 'Instructions LLM', 'Recherche sémantique', 'Moteur de recommandation'];
  
  return {
    id: `ep-${i}`,
    path: paths[i],
    desc: descs[i],
    mcp: Math.random() > 0.7 ? 'none' : Math.random() > 0.4 ? 'warn' : 'ok',
    openapi: i === 12 ? 'none' : Math.random() > 0.1 ? 'ok' : 'warn',
    a2a: Math.random() > 0.8 ? 'warn' : 'none',
    anp: 'none'
  };
});

const TIMELINE = [
  { id: 'm1', q: 'Q4 2024', title: 'Standardisation OpenAPI 3.1', status: 'ok', desc: 'Migration complète vers la spécification 3.1.' },
  { id: 'm2', q: 'Q1 2025', title: 'Preuve de concept MCP', status: 'warn', desc: 'Déploiement du serveur interne pour tests.' },
  { id: 'm3', q: 'Q2 2025', title: 'Support Claude Desktop', status: 'warn', desc: 'Intégration officielle MCP v1.' },
  { id: 'm4', q: 'Q3 2025', title: 'Découvrabilité Sémantique', status: 'none', desc: 'Enrichissement des schémas avec vecteurs.' },
  { id: 'm5', q: 'Q4 2025', title: 'A2A Interopérabilité', status: 'none', desc: 'Premiers tests de délégation entre agents.' },
  { id: 'm6', q: 'Q1 2026', title: 'Agent Network Ready', status: 'none', desc: 'Compatibilité avec le routage ANP.' },
];

export default function AgentProtocolsPage() {
  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="AGENT Ops"
          title="Protocoles de Communication"
          subtitle="Standards et interfaces supportés pour permettre aux agents IA de dialoguer avec votre infrastructure."
          actions={
            <button className={COMMAND_BUTTONS.primary}>Actualiser la matrice</button>
          }
        />
      }
    >
      {/* Protocol Lanes */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-2">
        {PROTOCOLS.map((proto, i) => (
          <motion.div 
            key={proto.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(COMMAND_PANEL, "p-5 flex flex-col hover:bg-white/[0.04] transition-colors")}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {proto.status === 'ok' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> :
                   proto.status === 'warn' ? <AlertCircleIcon className="w-4 h-4 text-amber-400" /> :
                   proto.status === 'error' ? <XCircleIcon className="w-4 h-4 text-rose-400" /> :
                   <MinusCircleIcon className="w-4 h-4 text-white/30" />}
                  <span className="font-bold text-white/90 truncate">{proto.name}</span>
                </div>
                <div className="flex gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider bg-white/10 text-white/60 font-mono">{proto.version}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[18px] font-bold tabular-nums text-white/90">{proto.adoption}%</span>
                <span className="text-[9px] uppercase tracking-widest text-white/40">Adoption</span>
              </div>
            </div>
            
            <div className="flex-1 mb-4">
              <ul className="space-y-1.5">
                {proto.features.map(f => (
                  <li key={f} className="flex items-center gap-1.5 text-[11px] text-white/70">
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            
            <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-[11px] font-medium transition-colors border border-white/10">
              <BookOpenIcon className="w-3.5 h-3.5" /> Documentation
            </button>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        
        {/* Main Table (3 cols) */}
        <div className={cn(COMMAND_PANEL, "lg:col-span-3 p-0 overflow-hidden flex flex-col")}>
          <div className="p-4 border-b border-white/[0.05] flex items-center justify-between">
            <h3 className="text-[12px] font-semibold text-white/90 flex items-center gap-2">
              <TerminalIcon className="w-4 h-4 text-white/50" /> Registre des Endpoints
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-white/[0.02]">
                <tr className="border-b border-white/[0.05]">
                  <th className="px-4 py-3 font-semibold text-white/40">Endpoint</th>
                  <th className="px-4 py-3 font-semibold text-white/40 w-[100px] text-center">OpenAPI</th>
                  <th className="px-4 py-3 font-semibold text-white/40 w-[100px] text-center">MCP</th>
                  <th className="px-4 py-3 font-semibold text-white/40 w-[100px] text-center">A2A</th>
                  <th className="px-4 py-3 font-semibold text-white/40 w-[100px] text-center">ANP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {ENDPOINTS.map((ep, i) => (
                  <tr key={ep.id} className="hover:bg-white/[0.02] group transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-medium text-white/80">{ep.path}</div>
                      <div className="text-[10px] text-white/50 mt-0.5">{ep.desc}</div>
                    </td>
                    {[ep.openapi, ep.mcp, ep.a2a, ep.anp].map((status, idx) => (
                      <td key={idx} className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium tracking-wide",
                            status === 'ok' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            status === 'warn' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                            status === 'error' ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                            "bg-white/5 text-white/30 border border-white/10"
                          )}>
                            {status === 'ok' ? 'Supporté' :
                             status === 'warn' ? 'Partiel' :
                             status === 'error' ? 'Non' : 'N/A'}
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Rail */}
        <div className="flex flex-col gap-6">
          <div className={cn(COMMAND_PANEL, "p-5")}>
             <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-4">Couverture par Protocole</h3>
             <div className="grid grid-cols-2 gap-4">
               {[
                 { name: 'OpenAPI', val: 92, color: '#10b981' },
                 { name: 'MCP', val: 35, color: '#f59e0b' },
                 { name: 'A2A', val: 8, color: '#6366f1' },
                 { name: 'ANP', val: 0, color: '#475569' }
               ].map(p => (
                 <div key={p.name} className="flex flex-col items-center">
                   <div className="w-20 h-20 relative">
                     <ResponsiveContainer width="100%" height="100%">
                       <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={6} data={[{v: p.val}]} startAngle={90} endAngle={-270}>
                         <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                         <RadialBar background={{ fill: 'rgba(255,255,255,0.05)' }} dataKey="v" cornerRadius={10} fill={p.color} />
                       </RadialBarChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex items-center justify-center text-[12px] font-bold text-white tabular-nums">{p.val}%</div>
                   </div>
                   <span className="text-[10px] text-white/60 font-mono mt-1">{p.name}</span>
                 </div>
               ))}
             </div>
          </div>

          <div className={cn(COMMAND_PANEL, "p-5 flex-1")}>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
              <GitCommitIcon className="w-4 h-4 text-indigo-400" /> Roadmap Protocoles
            </h3>
            <div className="relative pl-4 space-y-6">
              <div className="absolute top-2 bottom-2 left-[5px] w-px bg-white/10" />
              {TIMELINE.map((milestone, i) => (
                <div key={milestone.id} className="relative">
                  <div className={cn("absolute -left-[14.5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-[#090b10]",
                    milestone.status === 'ok' ? 'bg-emerald-400' :
                    milestone.status === 'warn' ? 'bg-amber-400' : 'bg-white/20'
                  )} />
                  <div className="text-[10px] font-mono text-indigo-300 mb-0.5">{milestone.q}</div>
                  <div className="text-[12px] font-medium text-white/90 mb-1">{milestone.title}</div>
                  <div className="text-[11px] text-white/50 leading-relaxed">{milestone.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </CommandPageShell>
  );
}
