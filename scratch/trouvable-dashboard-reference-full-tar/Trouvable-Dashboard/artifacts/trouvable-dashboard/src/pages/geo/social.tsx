import React from 'react';
import { CommandPageShell, CommandHeader, CommandMetricCard } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { MessageCircleIcon, HeartIcon, ShareIcon, TrendingUpIcon, AlertCircleIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const SENTIMENT_DATA = Array.from({ length: 30 }).map((_, i) => ({
  date: `Oct ${i+1}`,
  positive: Math.floor(Math.random() * 40) + 20,
  neutral: Math.floor(Math.random() * 30) + 10,
  negative: Math.floor(Math.random() * 10) + 2
}));

const SOCIAL_FEED = [
  { id: 1, platform: 'LinkedIn', handle: '@jeandupont_seo', type: 'Post', text: 'Très impressionné par la dernière mise à jour de Trouvable. La détection de cannibalisation est bluffante ! 🚀', sentiment: 'positive', score: 95, time: 'Il y a 2h', metrics: { likes: 124, comments: 18 } },
  { id: 2, platform: 'X (Twitter)', handle: '@seoninja', type: 'Thread', text: 'Je compare les outils GEO actuels. Trouvable vs BrightEdge. Lequel gère le mieux le tracking sur Perplexity ?', sentiment: 'neutral', score: 65, time: 'Il y a 5h', metrics: { likes: 45, comments: 12 } },
  { id: 3, platform: 'Reddit', handle: 'u/growth_hacker', type: 'Commentaire', text: 'Attention, le pricing n\'est pas super transparent sur leur site...', sentiment: 'negative', score: 20, time: 'Hier', metrics: { likes: 8, comments: 2 } },
  { id: 4, platform: 'LinkedIn', handle: '@mariep_marketing', type: 'Article', text: 'Comment nous avons augmenté notre visibilité IA de 40% grâce à Trouvable.', sentiment: 'positive', score: 98, time: 'Il y a 2j', metrics: { likes: 412, comments: 56 } },
];

const HASHTAGS = [
  { tag: '#SEO', count: '1.2k', trend: '+12%' },
  { tag: '#GEO', count: '850', trend: '+45%' },
  { tag: '#IA', count: '640', trend: '+5%' },
  { tag: '#Trouvable', count: '420', trend: '+22%' },
];

export default function GeoSocialPage() {
  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="GEO Ops"
          title="Veille Sociale & Bruit"
          subtitle="Suivi des mentions de la marque sur les réseaux sociaux. Ces signaux alimentent indirectement la confiance des LLMs."
          actions={
            <div className="flex gap-2">
               <button className={COMMAND_BUTTONS.secondary}>Connecter API Sociale</button>
               <button className={COMMAND_BUTTONS.primary}>Générer Rapport</button>
            </div>
          }
        />
      }
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <CommandMetricCard label="Volume de Mentions" value="2.4k" detail="30 derniers jours" tone="info" />
        <CommandMetricCard label="Sentiment Positif" value="78%" detail="En hausse de 5%" tone="ok" />
        <CommandMetricCard label="Bruit Négatif" value="4.2%" detail="Sous le seuil d'alerte (10%)" tone="neutral" />
        <CommandMetricCard label="Impact LLM Estimé" value="Moyen+" detail="Contribution à l'autorité" tone="warning" />
      </div>

      {/* Sentiment Chart */}
      <div className={cn(COMMAND_PANEL, "mt-4 p-5 h-[280px] flex flex-col")}>
         <div className="flex items-center justify-between mb-4">
            <h3 className="text-[12px] font-semibold text-white/90">Évolution du Sentiment Social</h3>
            <div className="flex items-center gap-4">
               <span className="flex items-center gap-1.5 text-[10px] text-white/60"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Positif</span>
               <span className="flex items-center gap-1.5 text-[10px] text-white/60"><div className="w-2.5 h-2.5 rounded-sm bg-white/20" /> Neutre</span>
               <span className="flex items-center gap-1.5 text-[10px] text-white/60"><div className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Négatif</span>
            </div>
         </div>
         <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SENTIMENT_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#090a0b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="positive" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                <Area type="monotone" dataKey="neutral" stackId="1" stroke="rgba(255,255,255,0.2)" fill="rgba(255,255,255,0.1)" fillOpacity={0.6} />
                <Area type="monotone" dataKey="negative" stackId="1" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
         
         {/* Feed */}
         <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="text-[14px] font-semibold text-white/90">Flux des Mentions</h3>
            <div className="space-y-4">
               {SOCIAL_FEED.map((post, i) => (
                  <motion.div 
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn(COMMAND_PANEL, "p-5 flex flex-col hover:border-white/20 transition-colors")}
                  >
                     <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px] text-white/50">
                              {post.platform[0]}
                           </div>
                           <div>
                              <div className="text-[12px] font-bold text-white/90">{post.handle}</div>
                              <div className="text-[10px] text-white/40">{post.platform} • {post.time}</div>
                           </div>
                        </div>
                        <div className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                           post.sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400' :
                           post.sentiment === 'negative' ? 'bg-rose-500/10 text-rose-400' : 'bg-white/5 text-white/50'
                        )}>
                           {post.sentiment}
                        </div>
                     </div>
                     
                     <p className="text-[13px] text-white/80 leading-relaxed mb-4">
                        {post.text}
                     </p>
                     
                     <div className="flex items-center justify-between border-t border-white/[0.05] pt-3">
                        <div className="flex gap-4">
                           <span className="flex items-center gap-1.5 text-[11px] text-white/50"><HeartIcon className="w-3.5 h-3.5" /> {post.metrics.likes}</span>
                           <span className="flex items-center gap-1.5 text-[11px] text-white/50"><MessageCircleIcon className="w-3.5 h-3.5" /> {post.metrics.comments}</span>
                        </div>
                        <div className="flex gap-2">
                           <button className="text-[10px] font-medium px-3 py-1.5 rounded bg-white/5 text-white/60 hover:bg-white/10 transition-colors">Marquer vu</button>
                           {post.sentiment === 'negative' && (
                              <button className="text-[10px] font-medium px-3 py-1.5 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors flex items-center gap-1"><AlertCircleIcon className="w-3 h-3" /> Escalader RP</button>
                           )}
                        </div>
                     </div>
                  </motion.div>
               ))}
            </div>
         </div>

         {/* Sidebar */}
         <div className="flex flex-col gap-6">
            <div className={cn(COMMAND_PANEL, "p-5")}>
               <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2"><TrendingUpIcon className="w-3.5 h-3.5" /> Hashtags Tendances</h3>
               <div className="space-y-3">
                  {HASHTAGS.map(tag => (
                     <div key={tag.tag} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                        <div className="text-[13px] font-bold text-white/80">{tag.tag}</div>
                        <div className="flex items-center gap-3">
                           <span className="text-[11px] text-white/40 tabular-nums">{tag.count}</span>
                           <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">{tag.trend}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            <div className={cn(COMMAND_PANEL, "p-5")}>
               <h3 className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-4">Influenceurs Clés</h3>
               <p className="text-[12px] text-white/60 leading-relaxed mb-4">
                  Personnalités dont les mentions ont un poids élevé pour l'E-E-A-T et sont susceptibles d'être ingérées par les LLMs.
               </p>
               <div className="space-y-3">
                  {['@seo_expert_fr', '@tech_news_daily', '@saas_founder'].map(handle => (
                     <div key={handle} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[10px] text-indigo-300">
                           {handle.substring(1,3).toUpperCase()}
                        </div>
                        <div>
                           <div className="text-[12px] font-bold text-white/90">{handle}</div>
                           <div className="text-[10px] text-white/40">Authority Score: 85+</div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

      </div>
    </CommandPageShell>
  );
}
