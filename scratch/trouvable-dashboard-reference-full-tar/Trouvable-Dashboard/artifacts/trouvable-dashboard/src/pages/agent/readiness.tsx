import React, { useState } from 'react';
import { CommandPageShell, CommandHeader } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import { CheckCircle2Icon, XCircleIcon, AlertCircleIcon, FileCode2Icon, ServerIcon, KeyIcon, GlobeIcon, BracesIcon, ZapIcon, LockIcon, BookOpenIcon, ChevronDownIcon, ExternalLinkIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SECTIONS = [
  { id: 'auth', title: 'Authentification & Sécurité', icon: KeyIcon, score: 90, items: [
    { status: 'ok', title: 'OAuth 2.1 PKCE configuré', desc: 'Flux d\'autorisation sécurisé pour les agents sans navigateur.', link: '/auth/oauth2' },
    { status: 'ok', title: 'Endpoint .well-known/oauth-authorization-server publié', desc: 'Découvrabilité automatique des URLs d\'autorisation.', link: '/.well-known/oauth' },
    { status: 'warn', title: 'Rotation automatique des tokens', desc: 'Les refresh tokens n\'expirent pas assez vite.', link: 'https://docs.trouvable.io/security' },
    { status: 'ok', title: 'Scopes granulaires définis', desc: 'Permissions limitées par domaine fonctionnel (read:profile, write:orders).', link: null },
    { status: 'ok', title: 'CORS restrictif configuré', desc: 'Protection contre les appels cross-origin non autorisés.', link: null },
  ]},
  { id: 'discoverability', title: 'Découvrabilité API', icon: GlobeIcon, score: 75, items: [
    { status: 'ok', title: 'openapi.json publié à la racine', desc: 'Fichier OpenAPI 3.1 accessible publiquement.', link: '/openapi.json' },
    { status: 'warn', title: 'Descriptions sémantiques riches', desc: 'Certains paramètres manquent de description en langage naturel.', link: null },
    { status: 'error', title: 'Exemples de payloads inclus', desc: 'Les agents ont besoin d\'exemples concrets pour formater les requêtes.', link: null },
    { status: 'ok', title: 'Spécification des erreurs', desc: 'Codes 4xx documentés avec format de réponse.', link: null },
    { status: 'ok', title: 'Versioning explicite', desc: 'En-tête Accept-Version supporté.', link: null },
  ]},
  { id: 'mcp', title: 'Model Context Protocol', icon: ServerIcon, score: 40, items: [
    { status: 'ok', title: 'Serveur MCP initialisé', desc: 'Connecteur de base fonctionnel.', link: 'github.com/org/mcp-server' },
    { status: 'error', title: 'Outils (Tools) exposés', desc: 'Les fonctions d\'action ne sont pas encore mappées vers MCP.', link: null },
    { status: 'error', title: 'Ressources indexées', desc: 'Le contexte statique n\'est pas fourni à l\'agent.', link: null },
    { status: 'warn', title: 'Support des prompts templates', desc: 'Templates de requêtes partiels.', link: null },
    { status: 'error', title: 'Authentification MCP (SSE)', desc: 'Transport HTTP avec SSE non sécurisé.', link: null },
  ]},
  { id: 'schema', title: 'Sémantique Schema.org', icon: BracesIcon, score: 100, items: [
    { status: 'ok', title: 'WebAPI / WebApplication markup', desc: 'Déclaration formelle du service.', link: null },
    { status: 'ok', title: 'EntryPoint déclaré', desc: 'Points d\'accès machine renseignés.', link: null },
    { status: 'ok', title: 'Documentation structurée', desc: 'Lien vers la doc développeur via TechArticle.', link: null },
    { status: 'ok', title: 'TermsOfService liés', desc: 'Conditions d\'utilisation machine-readable.', link: null },
  ]},
  { id: 'limits', title: 'Rate Limits & Quotas', icon: ZapIcon, score: 85, items: [
    { status: 'ok', title: 'En-têtes standards supportés', desc: 'RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset.', link: null },
    { status: 'warn', title: 'Quotas par client (Agent) documentés', desc: 'Les limites spécifiques aux LLMs ne sont pas explicites.', link: null },
    { status: 'ok', title: 'Réponse 429 propre', desc: 'Inclut Retry-After standard.', link: null },
    { status: 'ok', title: 'Circuit breaker pattern', desc: 'Protection anti-DDOS configurée.', link: null },
  ]},
  { id: 'idempotency', title: 'Idempotence', icon: LockIcon, score: 60, items: [
    { status: 'ok', title: 'En-tête Idempotency-Key supporté', desc: 'Sur les requêtes POST/PATCH.', link: null },
    { status: 'error', title: 'Stockage des clés (24h minimum)', desc: 'Les clés expirent après 1h.', link: null },
    { status: 'error', title: 'Documentation du comportement de reprise', desc: 'Non décrit dans OpenAPI.', link: null },
    { status: 'ok', title: 'Validation des payloads', desc: 'Rejet si la clé existe mais le payload diffère.', link: null },
  ]},
  { id: 'docs', title: 'Documentation Agentic', icon: BookOpenIcon, score: 100, items: [
    { status: 'ok', title: 'Fichier llms.txt à la racine', desc: 'Instructions pour les agents de scraping.', link: '/llms.txt' },
    { status: 'ok', title: 'Fichier llms-full.txt disponible', desc: 'Version étendue avec exemples de code.', link: '/llms-full.txt' },
    { status: 'ok', title: 'Mise à jour automatique', desc: 'Synchronisé avec la CI/CD.', link: null },
    { status: 'ok', title: 'Directives de ton et format', desc: 'Les LLMs savent comment formater leurs réponses à l\'utilisateur.', link: null },
  ]},
];

const TOTAL_SCORE = Math.round(SECTIONS.reduce((acc, s) => acc + s.score, 0) / SECTIONS.length);

export default function AgentReadinessPage() {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="AGENT Ops"
          title="Scorecard Préparation"
          subtitle="Audit technique approfondi des prérequis pour l'interaction avec les agents autonomes."
          actions={
             <div className="flex gap-2">
               <button className={COMMAND_BUTTONS.secondary}>Télécharger PDF</button>
               <button className={COMMAND_BUTTONS.primary}>Re-lancer l'audit</button>
             </div>
          }
        />
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4 relative items-start">
        
        {/* Left Rail - TOC (Sticky) */}
        <div className="lg:col-span-4 sticky top-6 space-y-6">
          {/* Main Score */}
          <div className={cn(COMMAND_PANEL, "p-6 flex flex-col items-center justify-center text-center")}>
            <div className="relative w-40 h-40 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart 
                  cx="50%" cy="50%" 
                  innerRadius="80%" outerRadius="100%" 
                  barSize={12} 
                  data={[{ name: 'Score', value: TOTAL_SCORE, fill: TOTAL_SCORE > 80 ? '#34d399' : TOTAL_SCORE > 60 ? '#fbbf24' : '#f87171' }]} 
                  startAngle={220} endAngle={-40}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                  <RadialBar background={{ fill: 'rgba(255,255,255,0.05)' }} dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[40px] font-bold tracking-tighter text-white tabular-nums leading-none">{TOTAL_SCORE}</span>
                <span className="text-[10px] text-white/40 mt-1 uppercase tracking-widest">Sur 100</span>
              </div>
            </div>
            <h3 className="text-white font-semibold">Niveau de Préparation</h3>
            <p className="text-[12px] text-white/50 mt-2 max-w-[240px]">Votre infrastructure technique est partiellement prête pour les agents autonomes.</p>
          </div>

          {/* TOC List */}
          <div className={cn(COMMAND_PANEL, "p-4")}>
            <h4 className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-4 px-2">Chapitres de l'Audit</h4>
            <div className="space-y-1">
              {SECTIONS.map(section => (
                <button 
                  key={section.id} 
                  onClick={() => scrollTo(section.id)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", 
                      section.score === 100 ? "bg-emerald-500" : 
                      section.score >= 60 ? "bg-amber-500" : "bg-rose-500"
                    )} />
                    <span className="text-[12px] text-white/80 group-hover:text-white">{section.title}</span>
                  </div>
                  <span className="text-[11px] font-mono text-white/40">{section.score}%</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Detailed Panels */}
        <div className="lg:col-span-8 space-y-8 pb-32">
          {SECTIONS.map((section, idx) => (
            <motion.div 
              key={section.id} 
              id={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(COMMAND_PANEL, "overflow-hidden scroll-mt-6")}
            >
              {/* Panel Header */}
              <div className="p-5 border-b border-white/[0.05] bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <section.icon className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-semibold text-white/90">{section.title}</h2>
                    <div className="text-[11px] text-white/40 mt-0.5">{section.items.length} points de contrôle</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className={cn("text-[20px] font-bold tabular-nums leading-none",
                      section.score === 100 ? "text-emerald-400" : 
                      section.score >= 60 ? "text-amber-400" : "text-rose-400"
                    )}>{section.score}%</span>
                    <span className="text-[10px] uppercase tracking-widest text-white/30 mt-1">Conformité</span>
                  </div>
                </div>
              </div>

              {/* Checklist Items */}
              <div className="divide-y divide-white/[0.04]">
                {section.items.map((item, i) => {
                  const isExpanded = expandedItem === `${section.id}-${i}`;
                  return (
                    <div key={i} className="p-4 hover:bg-white/[0.01] transition-colors">
                      <div 
                        className="flex items-start gap-4 cursor-pointer"
                        onClick={() => setExpandedItem(isExpanded ? null : `${section.id}-${i}`)}
                      >
                        <div className="mt-1 shrink-0">
                          {item.status === 'ok' ? <CheckCircle2Icon className="w-5 h-5 text-emerald-500/80" /> :
                           item.status === 'warn' ? <AlertCircleIcon className="w-5 h-5 text-amber-500/80" /> :
                           <XCircleIcon className="w-5 h-5 text-rose-500/80" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-white/90">{item.title}</div>
                          <div className="text-[12px] text-white/50 mt-1">{item.desc}</div>
                          
                          {/* Evidence link if ok */}
                          {item.status === 'ok' && item.link && (
                            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400/60 bg-emerald-400/5 px-2 py-1 rounded-md w-max border border-emerald-400/10">
                              <FileCode2Icon className="w-3 h-3" />
                              {item.link}
                            </div>
                          )}
                        </div>
                        
                        {/* Expand toggle for errors/warnings */}
                        {item.status !== 'ok' && (
                          <div className="shrink-0 p-1 text-white/30 hover:text-white/70 transition-colors">
                            <ChevronDownIcon className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
                          </div>
                        )}
                      </div>

                      {/* Expandable Fix Section */}
                      <AnimatePresence>
                        {isExpanded && item.status !== 'ok' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 ml-9 pl-4 border-l border-white/10 py-2">
                              <h5 className="text-[11px] font-semibold uppercase tracking-widest text-indigo-300 mb-3">Comment Fixer</h5>
                              <ol className="list-decimal list-inside space-y-2 text-[12px] text-white/70 marker:text-white/30">
                                <li>Mettre à jour la configuration du serveur API.</li>
                                <li>Ajouter les champs requis dans le schéma de réponse.</li>
                                <li>Déployer en staging et tester avec le CLI Trouvable.</li>
                                <li>Publier en production.</li>
                              </ol>
                              <button className="mt-4 text-[11px] flex items-center gap-1 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-colors border border-indigo-500/20">
                                Créer un ticket JIRA <ExternalLinkIcon className="w-3 h-3" />
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </CommandPageShell>
  );
}
