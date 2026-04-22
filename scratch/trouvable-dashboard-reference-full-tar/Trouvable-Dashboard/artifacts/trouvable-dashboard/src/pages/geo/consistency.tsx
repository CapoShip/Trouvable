import React from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { CommandTable } from '@/components/command/CommandTable';
import { COMMAND_BUTTONS, cn } from '@/lib/tokens';

const CONSISTENCY = [
  ['Description de la marque', 'Plateforme de gestion SEO/GEO pour entreprises', 'Outil de référencement B2B', 'Différence mineure'],
  ['Tarif de base', '499€ / mois', '299€ / mois (Ancien tarif)', 'Incohérence majeure'],
  ['Fonctionnalité clé', 'Analyse multi-modèles IA', 'Analyse multi-modèles IA', 'Cohérent'],
  ['Année de création', '2022', '2021', 'Incohérence majeure'],
];

export default function GeoConsistencyPage() {
  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="GEO Ops"
          title="Cohérence marque"
          subtitle="Suivi des divergences d'information entre votre site et les réponses des IA."
          actions={
            <button className={COMMAND_BUTTONS.primary}>Relancer l'analyse</button>
          }
        />
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CommandMetricCard label="Score de Cohérence" value="78%" detail="En baisse de 5%" tone="warning" />
        <CommandMetricCard label="Incohérences Majeures" value="2" detail="Impactent la décision" tone="critical" />
        <CommandMetricCard label="Points de vérité" value="15" detail="Faits vérifiés" tone="info" />
        <CommandMetricCard label="Modèle le plus à jour" value="Perplexity" detail="Cohérence 95%" tone="ok" />
      </div>

      <div className="mt-6">
        <div className="text-[14px] font-semibold text-white/90 mb-4">Divergences détectées (Agrégées)</div>
        <CommandTable
          headers={['Fait (Point de vérité)', 'Votre Site (Source)', 'Réponse IA (Moyenne)', 'Statut']}
          rows={CONSISTENCY.map(row => [
            <span className="text-white/80 font-medium">{row[0]}</span>,
            <span className="text-emerald-400/80 text-[12px]">{row[1]}</span>,
            <span className={cn("text-[12px]", row[3] === 'Cohérent' ? "text-emerald-400/80" : "text-rose-400/80")}>{row[2]}</span>,
            <span className={cn("px-2 py-0.5 rounded text-[10px]", 
              row[3] === 'Cohérent' ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20' : 
              row[3] === 'Différence mineure' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' : 
              'bg-red-400/10 text-red-400 border border-red-400/20'
            )}>{row[3]}</span>
          ])}
        />
      </div>
    </CommandPageShell>
  );
}
