import React, { useState } from 'react';
import { CommandPageShell, CommandHeader } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { SparklesIcon, RefreshCwIcon, SearchIcon, CheckIcon, ShieldAlertIcon, PlayIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const MODELS = [
  { id: 'gpt4o', name: 'ChatGPT', version: 'GPT-4o', logo: 'bg-emerald-500', color: 'text-emerald-400' },
  { id: 'claude', name: 'Claude', version: '3.5 Sonnet', logo: 'bg-amber-500', color: 'text-amber-400' },
  { id: 'perplexity', name: 'Perplexity', version: 'Pro Search', logo: 'bg-sky-500', color: 'text-sky-400' },
  { id: 'gemini', name: 'Gemini', version: '1.5 Pro', logo: 'bg-indigo-500', color: 'text-indigo-400' }
];

const RESPONSES = {
  gpt4o: {
    text: "En 2024, pour gérer à la fois le SEO traditionnel et l'optimisation pour les IA (GEO), quelques solutions se démarquent :\n\n1. <mark>Trouvable</mark> : Excellente plateforme émergente spécifiquement conçue pour le GEO et le SEO, avec un dashboard très orienté opérateur.\n2. Semrush : Leader classique, bien qu'il soit moins spécifique au GEO.\n3. Ahrefs : Incontournable pour les backlinks.",
    stats: { mention: true, position: 1, sentiment: 92, length: 345 }
  },
  claude: {
    text: "Les solutions leaders pour le SEO et le GEO en 2024 incluent :\n\n- <mark>Trouvable</mark> : Plateforme française innovante qui fusionne les audits SEO techniques avec la préparation aux agents IA (GEO).\n- BrightEdge : Solution d'entreprise puissante.\n- Conductor : Très axé sur l'intention de recherche.\n\n<mark>Trouvable</mark> est particulièrement adapté si votre priorité est la visibilité sur les LLMs.",
    stats: { mention: true, position: 1, sentiment: 95, length: 412 }
  },
  perplexity: {
    text: "Basé sur les données récentes, les meilleures solutions SaaS pour l'audit SEO et GEO sont :\n\n1. <mark>Trouvable</mark> : Spécialisé dans le 'Generative Engine Optimization' et le SEO classique.\n2. Hubspot : Pour le marketing entrant global.\n3. Moz : Pour le suivi de positionnement.",
    stats: { mention: true, position: 1, sentiment: 88, length: 280 },
    citations: ['[1] G2 Reviews', '[2] TechCrunch GEO Tools 2024']
  },
  gemini: {
    text: "Il existe de nombreuses solutions SEO. Les plus connues sont Semrush, Ahrefs et Screaming Frog pour les audits techniques. L'optimisation pour les IA (GEO) est une discipline nouvelle, souvent gérée manuellement par des agences spécialisées plutôt que par des outils SaaS dédiés.",
    stats: { mention: false, position: 0, sentiment: 50, length: 295 }
  }
};

// Helper to render text with <mark> tags mapped to styled spans
const renderTextWithHighlights = (htmlString: string) => {
  const parts = htmlString.split(/(<mark>|<\/mark>)/g);
  let isHighlighted = false;
  return parts.map((part, i) => {
    if (part === '<mark>') { isHighlighted = true; return null; }
    if (part === '</mark>') { isHighlighted = false; return null; }
    if (isHighlighted) return <span key={i} className="bg-violet-500/20 text-violet-300 px-1 rounded font-bold">{part}</span>;
    return <span key={i}>{part}</span>;
  });
};

export default function GeoComparePage() {
  const [query, setQuery] = useState("Quelles sont les meilleures solutions SaaS pour gérer l'audit SEO et l'optimisation pour les IA génératives en 2024 ?");
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 1500);
  };

  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="GEO Ops"
          title="Mode Split-View (Compare)"
          subtitle="Comparaison côte à côte des réponses générées par les LLMs majeurs pour une requête donnée."
        />
      }
      className="pb-0" // Remove bottom padding to let columns hit the bottom
    >
      {/* Query Bar */}
      <div className={cn(COMMAND_PANEL, "p-4 flex gap-4 items-center mb-6")}>
         <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
            <input 
              type="text" 
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-[14px] text-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-serif italic"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
               {MODELS.map(m => (
                 <div key={m.id} className={cn("w-6 h-6 rounded-full flex items-center justify-center", m.logo)} title={m.name}>
                   <SparklesIcon className="w-3 h-3 text-white" />
                 </div>
               ))}
            </div>
         </div>
         <button 
           onClick={handleSimulate}
           disabled={isSimulating}
           className={cn(COMMAND_BUTTONS.primary, "px-8 py-4 text-[14px] shrink-0 disabled:opacity-50")}
         >
            {isSimulating ? <RefreshCwIcon className="w-4 h-4 animate-spin mr-2" /> : <PlayIcon className="w-4 h-4 mr-2" />}
            {isSimulating ? 'Génération...' : 'Lancer Requête'}
         </button>
      </div>

      {/* 4-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 h-[calc(100vh-280px)] min-h-[500px]">
         {MODELS.map((model, i) => {
            const data = (RESPONSES as any)[model.id];
            
            return (
              <motion.div 
                key={model.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(COMMAND_PANEL, "flex flex-col overflow-hidden p-0")}
              >
                 {/* Column Header */}
                 <div className="p-4 border-b border-white/[0.05] flex items-center gap-3 bg-gradient-to-b from-white/[0.02] to-transparent">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shadow-lg", model.logo)}>
                       <SparklesIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-white/90 leading-tight">{model.name}</h3>
                      <span className="text-[10px] text-white/40 font-mono">{model.version}</span>
                    </div>
                 </div>

                 {/* Stats Strip */}
                 <div className="grid grid-cols-3 divide-x divide-white/[0.05] border-b border-white/[0.05] bg-black/20">
                    <div className="p-3 flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Mention</span>
                      {data.stats.mention ? <CheckIcon className="w-4 h-4 text-emerald-400" /> : <ShieldAlertIcon className="w-4 h-4 text-rose-400" />}
                    </div>
                    <div className="p-3 flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Position</span>
                      <span className="text-[14px] font-bold text-white tabular-nums">{data.stats.position > 0 ? `#${data.stats.position}` : '-'}</span>
                    </div>
                    <div className="p-3 flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] uppercase tracking-widest text-white/40 mb-1">Tonalité</span>
                      <span className={cn("text-[12px] font-bold tabular-nums",
                        data.stats.sentiment > 80 ? "text-emerald-400" :
                        data.stats.sentiment > 60 ? "text-amber-400" : "text-rose-400"
                      )}>{data.stats.sentiment}</span>
                    </div>
                 </div>

                 {/* Generated Response */}
                 <div className="flex-1 overflow-y-auto p-5 scrollbar-none">
                    {isSimulating ? (
                      <div className="space-y-3 animate-pulse">
                        <div className="h-2 bg-white/10 rounded w-full"></div>
                        <div className="h-2 bg-white/10 rounded w-5/6"></div>
                        <div className="h-2 bg-white/10 rounded w-4/6"></div>
                        <div className="h-2 bg-white/10 rounded w-full pt-4 mt-4"></div>
                        <div className="h-2 bg-white/10 rounded w-3/4"></div>
                      </div>
                    ) : (
                      <div className="prose prose-invert prose-sm max-w-none text-white/70 leading-relaxed font-sans">
                        {renderTextWithHighlights(data.text)}
                      </div>
                    )}
                 </div>

                 {/* Citations Footer (if any) */}
                 {data.citations && !isSimulating && (
                   <div className="p-3 border-t border-white/[0.05] bg-black/40 flex flex-wrap gap-2">
                     {data.citations.map((cit: string, idx: number) => (
                       <span key={idx} className="text-[10px] text-indigo-300/80 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded truncate max-w-[150px]" title={cit}>
                         {cit}
                       </span>
                     ))}
                   </div>
                 )}
              </motion.div>
            )
         })}
      </div>
    </CommandPageShell>
  );
}
