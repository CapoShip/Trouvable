import { useLocation } from 'wouter';
import { useMemo, useState, useEffect } from 'react';

function useCurrentTime() {
  const [time, setTime] = useState<Date | null>(null);
  useEffect(() => {
    setTime(new Date());
    const id = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function AdminTopCommandBar() {
  const [location] = useLocation();
  const time = useCurrentTime();

  const context = useMemo(() => {
    if (location === '/clients' || location === '/clients/')
      return { label: 'Portefeuille', section: 'supervision', sectionLabel: 'Supervision' };
    if (location === '/clients/new')
      return { label: 'Nouveau mandat', section: 'onboarding', sectionLabel: 'Supervision' };

    if (location.startsWith('/clients/demo')) {
      const activePath = location.replace('/clients/demo', '');
      const parts = activePath.split('/').filter(Boolean);
      const [sub, nested] = parts;

      if (sub === 'seo') {
        const seoMap: Record<string, any> = {
          visibility: { label: 'Visibilité SEO', section: 'seo', sectionLabel: 'SEO Ops' },
          health: { label: 'Santé SEO', section: 'seo', sectionLabel: 'SEO Ops' },
          'correction-prompts': { label: 'Prompts correction IA', section: 'seo', sectionLabel: 'SEO Ops' },
          'on-page': { label: 'Optimisation on-page', section: 'seo', sectionLabel: 'SEO Ops' },
          content: { label: 'Contenu SEO', section: 'seo', sectionLabel: 'SEO Ops' },
          cannibalization: { label: 'Cannibalisation SEO', section: 'seo', sectionLabel: 'SEO Ops' },
        };
        return seoMap[nested || 'visibility'] || { label: 'SEO Ops', section: 'seo', sectionLabel: 'SEO Ops' };
      }

      if (sub === 'geo') {
        const geoMap: Record<string, any> = {
          undefined: { label: 'Situation GEO', section: 'geo', sectionLabel: 'GEO Ops' },
          crawlers: { label: 'Crawlers IA', section: 'geo', sectionLabel: 'GEO Ops' },
          schema: { label: 'Schema & entité', section: 'geo', sectionLabel: 'GEO Ops' },
          readiness: { label: 'Préparation GEO', section: 'geo', sectionLabel: 'GEO Ops' },
          consistency: { label: 'Cohérence marque', section: 'geo', sectionLabel: 'GEO Ops' },
          alerts: { label: 'Alertes GEO', section: 'geo', sectionLabel: 'GEO Ops' },
          runs: { label: 'Exécutions GEO', section: 'geo', sectionLabel: 'GEO Ops' },
          prompts: { label: 'Requêtes GEO', section: 'geo', sectionLabel: 'GEO Ops' },
          compare: { label: 'GEO Compare', section: 'geo', sectionLabel: 'GEO Ops' },
          signals: { label: 'Signaux GEO', section: 'geo', sectionLabel: 'GEO Ops' },
          social: { label: 'Veille sociale', section: 'geo', sectionLabel: 'GEO Ops' },
          opportunities: { label: "File d'actions", section: 'geo', sectionLabel: 'GEO Ops' },
          'llms-txt': { label: 'llms.txt', section: 'geo', sectionLabel: 'GEO Ops' },
          models: { label: 'Fiabilité IA', section: 'geo', sectionLabel: 'GEO Ops' },
          continuous: { label: 'Suivi continu', section: 'geo', sectionLabel: 'GEO Ops' },
        };
        return geoMap[nested as string] || geoMap.undefined;
      }

      if (sub === 'agent') {
        const agentMap: Record<string, any> = {
          undefined: { label: 'Vue AGENT', section: 'agent', sectionLabel: 'AGENT Ops' },
          visibility: { label: 'Visibilité AGENT', section: 'agent', sectionLabel: 'AGENT Ops' },
          readiness: { label: 'Préparation AGENT', section: 'agent', sectionLabel: 'AGENT Ops' },
          actionability: { label: 'Actionnabilité AGENT', section: 'agent', sectionLabel: 'AGENT Ops' },
          protocols: { label: 'Protocoles AGENT', section: 'agent', sectionLabel: 'AGENT Ops' },
          competitors: { label: 'Comparatif AGENT', section: 'agent', sectionLabel: 'AGENT Ops' },
          fixes: { label: 'Correctifs AGENT', section: 'agent', sectionLabel: 'AGENT Ops' },
        };
        return agentMap[nested as string] || agentMap.undefined;
      }

      const map: Record<string, any> = {
        dossier: nested === 'activity' ? { label: 'Activité du dossier', section: 'shared', sectionLabel: 'Dossier partagé' }
          : nested === 'connectors' ? { label: 'Connecteurs du dossier', section: 'shared', sectionLabel: 'Dossier partagé' }
          : nested === 'settings' ? { label: 'Paramètres mandat', section: 'shared', sectionLabel: 'Dossier partagé' }
          : { label: 'Dossier partagé', section: 'shared', sectionLabel: 'Dossier partagé' },
        portal: { label: 'Restitution', section: 'shared', sectionLabel: 'Dossier partagé' },
      };
      return map[sub] || { label: 'Pilotage mission', section: 'shared', sectionLabel: 'Dossier partagé' };
    }
    return { label: 'Centre de commande', section: 'home', sectionLabel: 'Supervision' };
  }, [location]);

  const sectionClasses: Record<string, string> = {
    shared: 'border-white/[0.08] bg-white/[0.04] text-white/70',
    seo: 'border-sky-400/20 bg-sky-400/12 text-sky-100',
    geo: 'border-violet-400/20 bg-violet-400/10 text-violet-200',
    agent: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    onboarding: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
    supervision: 'border-white/[0.08] bg-white/[0.03] text-white/55',
    home: 'border-white/[0.08] bg-white/[0.03] text-white/55',
  };

  const dotClasses: Record<string, string> = {
    shared: 'bg-white/40',
    seo: 'bg-sky-400',
    geo: 'bg-violet-400',
    agent: 'bg-emerald-400',
    onboarding: 'bg-amber-400',
    supervision: 'bg-white/30',
    home: 'bg-white/30',
  };

  const mobileLabelMap: Record<string, string> = {
    'Dossier partagé': 'Dossier',
    'Activité du dossier': 'Activité',
    'Connecteurs du dossier': 'Connecteurs',
    'Paramètres mandat': 'Paramètres',
    Restitution: 'Restitution',
    'Pilotage mission': 'Mission',
  };

  const mobileLabel = mobileLabelMap[context.label] || context.label;

  return (
    <div className="cmd-topbar">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className={`w-1.5 h-1.5 rounded-full cmd-health-dot shrink-0 ${dotClasses[context.section] || dotClasses.home}`} />
        <span className={`inline-flex w-fit items-center rounded-full border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] ${sectionClasses[context.section] || sectionClasses.home}`}>
          {context.sectionLabel || 'Supervision'}
        </span>
        <span className="sm:hidden text-[10px] font-semibold text-white/55 tracking-wide leading-none min-w-0">
          {mobileLabel}
        </span>
        <span className="hidden sm:block text-[11px] font-semibold text-white/55 truncate tracking-wide min-w-0">
          {context.label}
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {time && (
          <span className="text-[10px] font-mono text-white/20 tabular-nums hidden sm:block">
            {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.025] border border-white/[0.05]">
          <div className={`w-1.5 h-1.5 rounded-full ${dotClasses[context.section] || dotClasses.home}`} />
          <span className="text-[9px] font-bold text-white/35 uppercase tracking-[0.08em]">Vue opérateur</span>
        </div>
      </div>
    </div>
  );
}
