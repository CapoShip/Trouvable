import React from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { BookOpenIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon, ExternalLinkIcon } from 'lucide-react';

const PROTOCOLS = [
  { id: 'mcp', name: 'Model Context Protocol', version: 'v1.0.2', adoption: 45, status: 'warn', docs: '/docs/mcp', features: ['Context Injection', 'Tool Calling', 'Resource Reading'] },
  { id: 'openapi', name: 'OpenAPI (REST)', version: 'v3.1.0', adoption: 92, status: 'pass', docs: '/docs/openapi', features: ['Standard Endpoints', 'Schema Validation', 'Bearer Auth'] },
  { id: 'a2a', name: 'Agent-to-Agent', version: 'Draft', adoption: 10, status: 'fail', docs: null, features: ['Negotiation', 'P2P Messaging'] },
  { id: 'anp', name: 'Agentic Network Protocol', version: 'v0.5-beta', adoption: 25, status: 'warn', docs: '/docs/anp', features: ['Discovery', 'Identity Verification'] },
];

const ENDPOINTS = Array.from({ length: 15 }).map((_, i) => {
  const path = ['/api/products', '/api/orders', '/api/users/me', '/api/quotes/new', '/api/inventory/check'][i % 5] + (i > 4 ? `/${i}` : '');
  return {
    id: i,
    path,
    mcp: Math.random() > 0.5 ? 'full' : 'partial',
    openapi: 'full',
    a2a: 'none',
    anp: Math.random() > 0.8 ? 'partial' : 'none'
  };
});

const TIMELINE = [
  { quarter: 'Q3 2024', item: 'OpenAPI 3.1 Standard', status: 'done' },
  { quarter: 'Q4 2024', item: 'Serveur MCP v1', status: 'done' },
  { quarter: 'Q1 2025', item: 'A2A Authentication Draft', status: 'doing' },
  { quarter: 'Q2 2025', item: 'ANP Discovery Node', status: 'todo' },
  { quarter: 'Q3 2025', item: 'MCP Streaming Support', status: 'todo' },
];

export default function AgentProtocolsPage() {
  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="AGENT Ops"
          title="Couverture Protocoles"
          subtitle="Suivi de l'adoption des standards de communication IA."
          actions={
            <button className={COMMAND_BUTTONS.primary}>Générer Spécifications</button>
          }
        />
      }
    >
      {/* Top Lanes */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {PROTOCOLS.map(p => (
          <div key={p.id} className={cn(COMMAND_PANEL, "p-5 flex flex-col h-full relative overflow-hidden group hover:border-white/20 transition-colors")}>
            <div className={cn("absolute top-0 left-0 right-0 h-1", 
              p.status === 'pass' ? 'bg-emerald-500' : p.status === 'warn' ? 'bg-amber-500' : 'bg-rose-500'
            )} />
            
            <div className="flex justify-between items-start mb-4 mt-2">
              <h3 className="text-[15px] font-bold text-white/90">{p.name}</h3>
              <span className="text-[10px] font-mono text-white/40 bg-white/5 px-1.5 py-0.5 rounded">{p.version}</span>
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                <span className="text-[12px] font-bold text-white tabular-nums">{p.adoption}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-white/40">Adoption Marché</span>
                <span className={cn("text-[11px] font-medium mt-0.5", 
                  p.status === 'pass' ? 'text-emerald-400' : p.status === 'warn' ? 'text-amber-400' : 'text-rose-400'
                )}>
                  {p.status === 'pass' ? 'Support Optimal' : p.status === 'warn' ? 'En développement' : 'Non supporté'}
                </span>
              </div>
            </div>

            <div className="space-y-2 flex-1">
              <h4 className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">Fonctionnalités Clés</h4>
              {p.features.map(f => (
                <div key={f} className="text-[12px] text-white/70 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-white/20" /> {f}
                </div>
              ))}
            </div>

            {p.docs && (
              <a href="#" className="mt-6 pt-4 border-t border-white/5 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors">
                <BookOpenIcon className="w-3.5 h-3.5" /> Consulter la documentation
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Center: Endpoint Registry */}
      <div className="mt-8">
        <h3 className="text-[14px] font-semibold text-white/90 mb-4 px-1">Registre d'Endpoints et Compatibilité</h3>
        <div className={cn(COMMAND_PANEL, "overflow-hidden")}>
          <div className="overflow-x-auto scrollbar-none h-[300px]">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[#090a0b]/95 border-b border-white/[0.05] sticky top-0 z-10">
                <tr>
                  <th className="px-5 py-3 font-semibold text-white/40">Chemin API</th>
                  {PROTOCOLS.map(p => (
                    <th key={p.id} className="px-5 py-3 font-semibold text-white/40 text-center">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {ENDPOINTS.map(ep => (
                  <tr key={ep.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 font-mono text-[11px] text-indigo-300/80">{ep.path}</td>
                    {PROTOCOLS.map(p => {
                      const val = (ep as any)[p.id];
                      return (
                        <td key={p.id} className="px-5 py-3 text-center">
                          <div className="flex justify-center">
                            {val === 'full' ? <CheckCircleIcon className="w-4 h-4 text-emerald-500/80" /> :
                             val === 'partial' ? <AlertCircleIcon className="w-4 h-4 text-amber-500/80" /> :
                             <XCircleIcon className="w-4 h-4 text-white/10" />}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Split */}
      <div className="flex flex-col lg:flex-row gap-6 mt-8">
        {/* Roadmap */}
        <div className={cn(COMMAND_PANEL, "flex-1 p-6")}>
          <h3 className="text-[14px] font-semibold text-white/90 mb-6">Roadmap Protocoles</h3>
          <div className="relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/5" />
            <div className="flex justify-between relative z-10">
              {TIMELINE.map((item, i) => (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div className={cn("w-8 h-8 rounded-full border-4 border-[#090b10] flex items-center justify-center mb-3",
                    item.status === 'done' ? 'bg-emerald-500' :
                    item.status === 'doing' ? 'bg-indigo-500' : 'bg-white/10'
                  )}>
                    {item.status === 'done' && <CheckCircleIcon className="w-4 h-4 text-[#090b10]" />}
                  </div>
                  <span className="text-[10px] font-mono text-white/40 mb-1">{item.quarter}</span>
                  <span className="text-[11px] font-medium text-white/80 text-center px-2">{item.item}</span>
                  <span className={cn("text-[9px] uppercase tracking-widest mt-2",
                    item.status === 'done' ? 'text-emerald-400' :
                    item.status === 'doing' ? 'text-indigo-400' : 'text-white/30'
                  )}>
                    {item.status === 'done' ? 'Adopté' : item.status === 'doing' ? 'En cours' : 'À évaluer'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Radial Summary */}
        <div className={cn(COMMAND_PANEL, "w-full lg:w-[320px] p-6 flex flex-col items-center justify-center text-center")}>
          <h3 className="text-[12px] font-semibold text-white/90 mb-4 w-full text-left uppercase tracking-widest">Score de Couverture</h3>
          <div className="w-32 h-32 relative mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{value: 68}, {value: 32}]} cx="50%" cy="50%" innerRadius={50} outerRadius={60} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                  <Cell fill="#34d399" />
                  <Cell fill="rgba(255,255,255,0.05)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white">68%</span>
              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Global</span>
            </div>
          </div>
          <p className="text-[11px] text-white/50 leading-relaxed">
            Votre couverture actuelle permet des interactions complexes avec la majorité des LLMs majeurs via OpenAPI.
          </p>
        </div>
      </div>
    </CommandPageShell>
  );
}
