import React from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { ArrowRightIcon, CheckCircle2Icon, ShieldAlertIcon, AlertTriangleIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const RADAR_DATA = [
  { subject: 'Définition entité', A: 90, B: 65 },
  { subject: 'Sitemap IA', A: 85, B: 40 },
  { subject: 'llms.txt', A: 100, B: 20 },
  { subject: 'Schema', A: 75, B: 60 },
  { subject: 'Citations', A: 60, B: 85 },
  { subject: 'Fraîcheur', A: 95, B: 55 },
  { subject: 'Cohérence', A: 80, B: 70 },
  { subject: 'Autorité', A: 65, B: 90 },
];

const SCORECARD = [
  { id: '1', category: 'Définition entité', score: 90, status: 'ok', desc: 'L\'entité principale est clairement définie dans les Knowledge Graphs.', action: 'Voir Graphe' },
  { id: '2', category: 'Sitemap IA', score: 85, status: 'ok', desc: 'Un sitemap dédié aux LLMs est présent et à jour.', action: 'Gérer Sitemap' },
  { id: '3', category: 'llms.txt', score: 100, status: 'ok', desc: 'Fichier d\'instruction LLM valide et accessible à la racine.', action: 'Éditer llms.txt' },
  { id: '4', category: 'Schema.org', score: 75, status: 'warning', desc: 'Balisage globalement bon, mais propriétés e-commerce manquantes.', action: 'Audit Schema' },
  { id: '5', category: 'Cohérence sémantique', score: 80, status: 'ok', desc: 'Les messages clés sont consistants à travers les sources.', action: 'Vérifier faits' },
  { id: '6', category: 'Citations / Mentions', score: 60, status: 'warning', desc: 'Volume de citations inférieur à la moyenne du marché.', action: 'Stratégie RP' },
  { id: '7', category: 'Autorité thématique', score: 65, status: 'warning', desc: 'Perçu comme expert sur 2 de vos 5 piliers.', action: 'Analyse Gaps' },
  { id: '8', category: 'Accessibilité crawlers', score: 95, status: 'ok', desc: 'Robots.txt autorise correctement les bots IA majeurs.', action: 'Logs Serveur' },
];

export default function GeoReadinessPage() {
  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="GEO Ops"
          title="Scorecard Préparation GEO"
          subtitle="Évaluation de votre infrastructure et de votre autorité pour maximiser votre présence dans les LLMs."
          actions={
            <button className={COMMAND_BUTTONS.primary}>Regénérer le Scorecard</button>
          }
        />
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CommandMetricCard label="Score Global" value="81/100" detail="Avancé" tone="ok" />
        <CommandMetricCard label="Infrastructure" value="88/100" detail="Excellent" tone="ok" />
        <CommandMetricCard label="Autorité & Signaux" value="68/100" detail="Amélioration requise" tone="warning" />
        <CommandMetricCard label="Position Marché" value="Top 15%" detail="Comparé aux concurrents directs" tone="info" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        
        {/* Left: Radar Chart */}
        <div className={cn(COMMAND_PANEL, "flex flex-col overflow-hidden min-h-[500px] relative")}>
          <div className="p-5 border-b border-white/[0.05]">
            <h3 className="text-[13px] font-semibold text-white/90">Profil de Préparation</h3>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-[10px] text-white/60"><div className="w-2.5 h-2.5 rounded bg-indigo-500" /> Trouvable (Vous)</span>
              <span className="flex items-center gap-1.5 text-[10px] text-white/60"><div className="w-2.5 h-2.5 rounded bg-white/20" /> Moyenne Catégorie</span>
            </div>
          </div>
          <div className="flex-1 relative pb-6 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={RADAR_DATA}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Moyenne" dataKey="B" stroke="rgba(255,255,255,0.3)" fill="rgba(255,255,255,0.05)" fillOpacity={1} strokeDasharray="3 3" />
                <Radar name="Vous" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Vertical Scorecard */}
        <div className={cn(COMMAND_PANEL, "p-0 overflow-hidden flex flex-col min-h-[500px]")}>
          <div className="p-5 border-b border-white/[0.05]">
            <h3 className="text-[13px] font-semibold text-white/90">Détail des Critères</h3>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-none divide-y divide-white/[0.02]">
            {SCORECARD.sort((a, b) => a.score - b.score).map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className="mt-0.5">
                    {item.status === 'ok' ? <CheckCircle2Icon className="w-4 h-4 text-emerald-400" /> :
                     item.status === 'warning' ? <ShieldAlertIcon className="w-4 h-4 text-amber-400" /> :
                     <AlertTriangleIcon className="w-4 h-4 text-rose-400" />}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-[12px] font-bold text-white/90">{item.category}</h4>
                      <span className={cn(
                        "text-[12px] font-bold tabular-nums",
                        item.status === 'ok' ? 'text-emerald-400' :
                        item.status === 'warning' ? 'text-amber-400' : 'text-rose-400'
                      )}>{item.score}/100</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                      <div 
                        className={cn("h-full rounded-full",
                          item.status === 'ok' ? 'bg-emerald-400' :
                          item.status === 'warning' ? 'bg-amber-400' : 'bg-rose-400'
                        )}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    
                    <p className="text-[11px] text-white/50 leading-relaxed mb-3 pr-4">
                      {item.desc}
                    </p>
                    
                    <button className={cn(
                      "text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors",
                      item.status === 'ok' ? "text-white/30 hover:text-white/70" : "text-indigo-400 hover:text-indigo-300"
                    )}>
                      {item.action} <ArrowRightIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </CommandPageShell>
  );
}
