import React, { useState } from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { SearchIcon, GlobeIcon, Image as ImageIcon, LinkIcon, FileCodeIcon, CheckCircle2Icon, AlertCircleIcon, ArrowRightIcon, ChevronRightIcon, ExternalLinkIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const PAGES = Array.from({ length: 30 }).map((_, i) => {
  const score = Math.floor(Math.random() * 40) + 50;
  return {
    id: `page-${i}`,
    url: ['/blog/guide-seo', '/produits/premium', '/tarifs', '/contact', '/a-propos', '/services/audit'][i % 6] + (i > 5 ? `-${i}` : ''),
    score,
    status: score > 80 ? 'ok' : score > 60 ? 'warning' : 'critical',
    lastAudit: `Il y a ${Math.floor(Math.random() * 24) + 1}h`,
    sparkline: Array.from({ length: 10 }).map(() => Math.floor(Math.random() * 100)),
    metrics: {
      title: score > 70 ? 'ok' : 'warning',
      meta: score > 65 ? 'ok' : 'warning',
      h1: score > 80 ? 'ok' : 'critical',
      schema: score > 90 ? 'ok' : 'warning',
      internalLinks: Math.floor(Math.random() * 20),
      images: Math.floor(Math.random() * 10),
      words: Math.floor(Math.random() * 2000) + 300
    }
  };
});

const RUBRIC = [
  { id: 'title', label: 'Balise Title', icon: FileCodeIcon, score: 85, recommendation: 'Optimisé. Longueur correcte et mot-clé principal présent.' },
  { id: 'meta', label: 'Meta Description', icon: FileCodeIcon, score: 45, recommendation: 'Trop courte (42 caractères). Ajoutez un appel à l\'action fort.' },
  { id: 'h1', label: 'Titre H1', icon: FileCodeIcon, score: 90, recommendation: 'Unique et sémantiquement correct.' },
  { id: 'schema', label: 'Schema.org', icon: FileCodeIcon, score: 30, recommendation: 'Balises Article et Breadcrumb manquantes. Requis pour Rich Snippets.' },
  { id: 'links', label: 'Maillage interne', icon: LinkIcon, score: 65, recommendation: 'Seulement 2 liens entrants trouvés. Visez au moins 5 liens depuis des pages thématiques similaires.' },
  { id: 'images', label: 'Images & Médias', icon: ImageIcon, score: 15, recommendation: '3 images n\'ont pas d\'attribut alt. Poids total trop élevé (2.4Mo).' },
];

export default function SeoOnPagePage() {
  const [selectedPage, setSelectedPage] = useState(PAGES[0]);
  const [search, setSearch] = useState('');

  const filteredPages = PAGES.filter(p => p.url.includes(search));

  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="SEO Ops"
          title="Inspecteur On-Page"
          subtitle="Analyse granulaire et recommandations sémantiques page par page."
          actions={
            <div className="flex items-center gap-2">
              <button className={COMMAND_BUTTONS.secondary}>Scanner une URL</button>
              <button className={COMMAND_BUTTONS.primary}>Exporter l'audit complet</button>
            </div>
          }
        />
      }
    >
      <div className="flex h-[calc(100vh-180px)] min-h-[600px] gap-4 mt-4">
        
        {/* Left 35% - Page List */}
        <div className={cn(COMMAND_PANEL, "w-[35%] flex flex-col overflow-hidden p-0")}>
          <div className="p-4 border-b border-white/[0.05] bg-white/[0.02]">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input 
                type="text" 
                placeholder="Rechercher une URL..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-[12px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div className="flex items-center justify-between mt-3 px-1 text-[10px] text-white/40 uppercase tracking-widest font-semibold">
              <span>{filteredPages.length} Pages indexées</span>
              <span>Score</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-none divide-y divide-white/[0.02]">
            {filteredPages.map((page, i) => (
              <div 
                key={page.id}
                onClick={() => setSelectedPage(page)}
                className={cn(
                  "p-3 flex items-center justify-between cursor-pointer transition-colors group",
                  selectedPage.id === page.id ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                )}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <GlobeIcon className={cn("w-3.5 h-3.5 shrink-0", 
                      page.status === 'ok' ? 'text-emerald-400' : 
                      page.status === 'warning' ? 'text-amber-400' : 'text-rose-400'
                    )} />
                    <span className={cn(
                      "text-[12px] font-mono truncate transition-colors",
                      selectedPage.id === page.id ? "text-white" : "text-white/70 group-hover:text-white/90"
                    )}>
                      {page.url}
                    </span>
                  </div>
                  <span className="text-[10px] text-white/30 pl-5.5">{page.lastAudit}</span>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-12 h-4 opacity-50 group-hover:opacity-100 transition-opacity">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={page.sparkline.map((v, i) => ({ v, i }))}>
                        <Area type="monotone" dataKey="v" stroke={page.status === 'ok' ? '#34d399' : page.status === 'warning' ? '#fbbf24' : '#f87171'} fill="none" strokeWidth={1.5} isAnimationActive={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={cn(
                    "w-8 h-8 rounded bg-white/5 border flex items-center justify-center text-[11px] font-bold tabular-nums",
                    page.status === 'ok' ? 'border-emerald-400/20 text-emerald-400' : 
                    page.status === 'warning' ? 'border-amber-400/20 text-amber-400' : 'border-rose-400/20 text-rose-400'
                  )}>
                    {page.score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 65% - Inspector */}
        <div className={cn(COMMAND_PANEL, "w-[65%] flex flex-col overflow-hidden p-0")}>
          {/* Inspector Header */}
          <div className="p-6 border-b border-white/[0.05] bg-gradient-to-b from-white/[0.03] to-transparent">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 text-[11px] text-white/40 mb-2">
                  <span>Domaine principal</span>
                  <ChevronRightIcon className="w-3 h-3" />
                  <span className="truncate max-w-[200px]">{selectedPage.url.split('/')[1]}</span>
                  <ChevronRightIcon className="w-3 h-3" />
                  <span className="text-white/80">{selectedPage.url.split('/').pop()}</span>
                </div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {selectedPage.url}
                  <a href="#" className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white transition-colors">
                    <ExternalLinkIcon className="w-4 h-4" />
                  </a>
                </h2>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Score de la page</span>
                <span className="text-3xl font-bold tabular-nums tracking-tight text-white">{selectedPage.score}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-black/40 rounded-xl p-3 border border-white/[0.05]">
                <div className="text-[10px] text-white/40 mb-1">Mots</div>
                <div className="text-[14px] font-semibold tabular-nums text-white/90">{selectedPage.metrics.words}</div>
              </div>
              <div className="bg-black/40 rounded-xl p-3 border border-white/[0.05]">
                <div className="text-[10px] text-white/40 mb-1">Liens entrants</div>
                <div className="text-[14px] font-semibold tabular-nums text-white/90">{selectedPage.metrics.internalLinks}</div>
              </div>
              <div className="bg-black/40 rounded-xl p-3 border border-white/[0.05]">
                <div className="text-[10px] text-white/40 mb-1">Images</div>
                <div className="text-[14px] font-semibold tabular-nums text-white/90">{selectedPage.metrics.images}</div>
              </div>
              <div className="bg-black/40 rounded-xl p-3 border border-white/[0.05]">
                <div className="text-[10px] text-white/40 mb-1">Indexabilité</div>
                <div className="text-[14px] font-semibold text-emerald-400 flex items-center gap-1"><CheckCircle2Icon className="w-3.5 h-3.5"/> Indexable</div>
              </div>
            </div>
          </div>

          {/* Inspector Body */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
            <h3 className="text-[12px] font-semibold uppercase tracking-widest text-white/40 mb-4">Rubrique de notation</h3>
            
            <div className="space-y-4 mb-8">
              {RUBRIC.map((item, i) => {
                const Icon = item.icon;
                const status = item.score > 80 ? 'ok' : item.score > 50 ? 'warning' : 'critical';
                
                return (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                        status === 'ok' ? 'bg-emerald-400/10 text-emerald-400' :
                        status === 'warning' ? 'bg-amber-400/10 text-amber-400' : 'bg-rose-400/10 text-rose-400'
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-[13px] font-semibold text-white/90">{item.label}</h4>
                          <span className={cn("text-[12px] font-bold tabular-nums", 
                            status === 'ok' ? 'text-emerald-400' :
                            status === 'warning' ? 'text-amber-400' : 'text-rose-400'
                          )}>{item.score}/100</span>
                        </div>
                        
                        <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden mb-3">
                          <div 
                            className={cn("h-full rounded-full transition-all duration-1000",
                              status === 'ok' ? 'bg-emerald-400' :
                              status === 'warning' ? 'bg-amber-400' : 'bg-rose-400'
                            )} 
                            style={{ width: `${item.score}%` }} 
                          />
                        </div>
                        
                        <p className="text-[12px] text-white/60 leading-relaxed">
                          {item.recommendation}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Code Snippet Suggestion */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 overflow-hidden">
              <div className="px-4 py-2 border-b border-indigo-500/20 flex items-center justify-between bg-indigo-500/10">
                <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-widest">Suggestion : Schema.org</span>
                <button className="text-[10px] font-medium text-white/70 hover:text-white bg-black/40 px-2 py-1 rounded transition-colors">Copier le code</button>
              </div>
              <div className="p-4 bg-black/40 overflow-x-auto">
                <pre className="text-[11px] font-mono text-white/70 leading-relaxed">
                  <code>
<span className="text-violet-400">&lt;script</span> <span className="text-sky-300">type</span>=<span className="text-emerald-300">"application/ld+json"</span><span className="text-violet-400">&gt;</span>{`\n{\n  `}
<span className="text-sky-300">"@context"</span>{`: `}<span className="text-emerald-300">"https://schema.org"</span>{`,\n  `}
<span className="text-sky-300">"@type"</span>{`: `}<span className="text-emerald-300">"Article"</span>{`,\n  `}
<span className="text-sky-300">"headline"</span>{`: `}<span className="text-emerald-300">"Titre optimisé généré par IA"</span>{`,\n  `}
<span className="text-sky-300">"datePublished"</span>{`: `}<span className="text-emerald-300">"2024-10-24T08:00:00+08:00"</span>{`\n}\n`}
<span className="text-violet-400">&lt;/script&gt;</span>
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CommandPageShell>
  );
}
