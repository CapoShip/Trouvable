import React from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';

const ALERTS = [
  { id: 1, title: 'Chute de visibilité sur Claude', desc: 'La marque n\'apparaît plus dans le top 3 pour la requête "Meilleur outil d\'audit SEO" sur Claude 3.5 Sonnet.', severity: 'critical', time: 'Il y a 2h', source: 'Suivi Continu' },
  { id: 2, title: 'Hallucination sur les tarifs (ChatGPT)', desc: 'ChatGPT (GPT-4o) mentionne un forfait gratuit qui n\'existe plus depuis 2023.', severity: 'warning', time: 'Il y a 5h', source: 'Cohérence Marque' },
  { id: 3, title: 'Nouvelle citation de haute autorité', desc: 'Votre guide sur l\'optimisation GEO est maintenant cité comme source de vérité par Perplexity.', severity: 'info', time: 'Hier', source: 'Veille Sociale' },
  { id: 4, title: 'Baisse du score de Readiness', desc: 'Le fichier llms.txt n\'est plus accessible (Erreur 404).', severity: 'critical', time: 'Hier', source: 'Préparation GEO' },
];

export default function GeoAlertsPage() {
  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="GEO Ops"
          title="Alertes GEO"
          subtitle="Centre de notification pour les changements critiques d'exposition IA."
          actions={
            <button className={COMMAND_BUTTONS.secondary}>Paramètres de notification</button>
          }
        />
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CommandMetricCard label="Alertes Actives" value="4" detail="2 critiques" tone="warning" />
        <CommandMetricCard label="Temps de résolution" value="14h" detail="Moyenne sur 7j" tone="neutral" />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {ALERTS.map(alert => (
          <div key={alert.id} className={cn(COMMAND_PANEL, "flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4")}>
             <div className="flex items-start gap-4">
                <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", 
                   alert.severity === 'critical' ? 'bg-red-400' :
                   alert.severity === 'warning' ? 'bg-amber-400' : 'bg-sky-400'
                )} />
                <div>
                   <h3 className="text-white/90 text-[14px] font-semibold">{alert.title}</h3>
                   <p className="text-white/60 text-[12px] mt-1 max-w-3xl leading-relaxed">{alert.desc}</p>
                   <div className="flex gap-3 mt-3 text-[10px] text-white/40">
                      <span>{alert.time}</span>
                      <span>•</span>
                      <span>Source: {alert.source}</span>
                   </div>
                </div>
             </div>
             <div className="flex gap-2 sm:self-center shrink-0 ml-6 sm:ml-0">
                <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/70 text-xs rounded-lg transition-colors">Ignorer</button>
                <button className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs rounded-lg transition-colors">Créer une action</button>
             </div>
          </div>
        ))}
      </div>
    </CommandPageShell>
  );
}
