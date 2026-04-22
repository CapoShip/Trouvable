import React, { useState } from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { CopyIcon, PlayIcon, CheckCircle2Icon, FilterIcon, SearchIcon, TagIcon, HashIcon, FileTextIcon, SettingsIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = [
  { id: 'meta', label: 'Meta & Titres', icon: TagIcon },
  { id: 'schema', label: 'Schema.org', icon: HashIcon },
  { id: 'contenu', label: 'Contenu', icon: FileTextIcon },
  { id: 'technique', label: 'Technique', icon: SettingsIcon },
];

const BOARD_DATA = {
  todo: [
    { id: 'p1', title: 'Optimisation balise Title', category: 'meta', urls: 12, model: 'GPT-4o',
      prompt: `Génère une balise title de moins de 60 caractères pour l'URL cible.\nContexte : intent=transactionnel, mot-clé="chaussures de course".\nContrainte : Inclus le mot-clé exact au début si possible.` },
    { id: 'p2', title: 'Amélioration H1', category: 'contenu', urls: 45, model: 'Claude Sonnet 3.5',
      prompt: `Rédige un H1 accrocheur et sémantique pour ce guide, en ciblant l'intention d'information.\nDoit être unique et > 30 caractères.` },
    { id: 'p3', title: 'Correction Cannibalisation', category: 'contenu', urls: 8, model: 'Mistral Large',
      prompt: `Propose une reformulation du contenu pour différencier cette page de /services/consulting.\nFocus sur l'intention spécifique sans chevauchement de mots-clés.` }
  ],
  review: [
    { id: 'p4', title: 'Ajout Schema FAQ', category: 'schema', urls: 3, model: 'GPT-4o',
      prompt: `Génère un balisage JSON-LD Schema.org FAQPage valide à partir des paires Q/R extraites de la page.\nN'inclus que du JSON, pas de markdown.` },
    { id: 'p5', title: 'Densité mot-clé (LSI)', category: 'contenu', urls: 28, model: 'Claude Sonnet 3.5',
      prompt: `Réécris le premier paragraphe pour intégrer naturellement les entités LSI secondaires : "agence digitale", "stratégie d'acquisition", "ROI".` }
  ],
  done: [
    { id: 'p6', title: 'Correction liens relatifs', category: 'technique', urls: 156, model: 'GPT-4o Mini',
      prompt: `Transforme tous les liens HTML relatifs du bloc de contenu en liens absolus pointant vers le domaine principal.` },
    { id: 'p7', title: 'Génération attributs Alt', category: 'technique', urls: 412, model: 'Gemini 1.5 Pro',
      prompt: `Génère des attributs alt descriptifs et SEO-friendly (max 100 caractères) pour les images fournies, basés sur leur contexte environnant.` }
  ]
};

export default function SeoCorrectionPromptsPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const Column = ({ title, count, items, color }: any) => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", color)} />
          <h3 className="text-[13px] font-semibold text-white/90">{title}</h3>
        </div>
        <span className="text-[10px] font-medium text-white/40 bg-white/5 px-2 py-0.5 rounded-full">{count}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-none pb-4">
        {items.map((item: any, i: number) => {
          if (activeCategory && item.category !== activeCategory) return null;
          const CatIcon = CATEGORIES.find(c => c.id === item.category)?.icon || TagIcon;
          
          return (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(COMMAND_PANEL, "p-4 flex flex-col gap-3 group hover:bg-white/[0.04] transition-colors")}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-[12px] font-semibold text-white/90 leading-snug">{item.title}</h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="flex items-center gap-1 text-[10px] text-white/40">
                      <CatIcon className="w-3 h-3" />
                      {CATEGORIES.find(c => c.id === item.category)?.label}
                    </span>
                    <span className="text-white/20 text-[10px]">•</span>
                    <span className="text-[10px] text-indigo-300/80">{item.urls} URLs</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-black/40 rounded-lg p-2.5 border border-white/[0.05] overflow-x-auto relative">
                <pre className="text-[10px] font-mono text-white/60 leading-relaxed whitespace-pre-wrap font-medium">
                  <span className="text-violet-300">System</span>: {item.prompt}
                </pre>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-white backdrop-blur-sm">
                    <CopyIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <select className="bg-white/[0.03] border border-white/[0.05] rounded text-[10px] text-white/70 px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="gpt4o">GPT-4o</option>
                  <option value="claude">Claude 3.5 Sonnet</option>
                  <option value="gemini">Gemini 1.5 Pro</option>
                  <option value="mistral">Mistral Large</option>
                </select>
                
                <div className="flex gap-2">
                  <button className="text-[10px] font-medium px-3 py-1 rounded bg-white/[0.05] text-white/70 hover:bg-white/[0.1] hover:text-white transition-colors flex items-center gap-1.5">
                    <PlayIcon className="w-3 h-3" /> Tester
                  </button>
                  <button className="text-[10px] font-medium px-3 py-1 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors flex items-center gap-1.5">
                    <CheckCircle2Icon className="w-3 h-3" /> Valider
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="SEO Ops"
          title="Prompts de Correction"
          subtitle="Bibliothèque de prompts pour résoudre automatiquement les erreurs techniques et sémantiques."
          actions={
            <button className={COMMAND_BUTTONS.primary}>+ Nouveau Prompt</button>
          }
        />
      }
    >
      {/* Filters Bar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="relative mr-4">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input 
              type="text" 
              placeholder="Rechercher un prompt..." 
              className="bg-white/[0.03] border border-white/[0.08] rounded-full pl-8 pr-4 py-1.5 text-[12px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64"
            />
          </div>
          
          <button 
            onClick={() => setActiveCategory(null)}
            className={cn("px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors", 
              activeCategory === null ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-white/[0.05] text-white/50 hover:text-white/80"
            )}
          >
            Tous
          </button>
          
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn("px-3 py-1.5 text-[11px] font-medium rounded-full border flex items-center gap-1.5 transition-colors", 
                  activeCategory === cat.id ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-white/[0.05] text-white/50 hover:text-white/80"
                )}
              >
                <Icon className="w-3 h-3" />
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Board Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)] min-h-[600px] mt-4">
        <Column title="À configurer" count={BOARD_DATA.todo.length} items={BOARD_DATA.todo} color="bg-slate-400" />
        <Column title="En test / Révision" count={BOARD_DATA.review.length} items={BOARD_DATA.review} color="bg-amber-400" />
        <Column title="Production (Validé)" count={BOARD_DATA.done.length} items={BOARD_DATA.done} color="bg-emerald-400" />
      </div>
    </CommandPageShell>
  );
}
