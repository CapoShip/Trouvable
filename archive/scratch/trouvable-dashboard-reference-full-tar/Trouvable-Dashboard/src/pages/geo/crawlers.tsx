import React, { useState, useEffect } from 'react';
import { CommandPageShell, CommandHeader } from '@/components/command';
import { COMMAND_BUTTONS, COMMAND_PANEL, cn } from '@/lib/tokens';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PlayIcon, PauseIcon, TerminalIcon, ShieldCheckIcon, ShieldAlertIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BOTS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'ChatGPT-User', 'anthropic-ai'];

const GENERATE_LOG = () => {
  const bot = BOTS[Math.floor(Math.random() * BOTS.length)];
  const status = Math.random() > 0.8 ? (Math.random() > 0.5 ? 403 : 404) : 200;
  const time = new Date().toISOString().split('T')[1].slice(0, -1);
  return {
    id: Math.random().toString(36).substr(2, 9),
    time,
    ua: `Mozilla/5.0 (compatible; ${bot}/2.0; +http://...)`,
    url: ['/tarifs', '/blog/guide-2024', '/api/v1/data', '/a-propos', '/'][Math.floor(Math.random() * 5)],
    status,
    ms: Math.floor(Math.random() * 150) + 20,
    allowed: status !== 403,
    bytes: Math.floor(Math.random() * 50000) + 1024
  };
};

const CHART_DATA = Array.from({ length: 30 }).map((_, i) => ({
  day: `J-${30-i}`,
  GPTBot: Math.floor(Math.random() * 500) + 100,
  ClaudeBot: Math.floor(Math.random() * 300) + 50,
  PerplexityBot: Math.floor(Math.random() * 200) + 20,
}));

export default function GeoCrawlersPage() {
  const [logs, setLogs] = useState<any[]>(Array.from({ length: 20 }).map(GENERATE_LOG));
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setLogs(prev => [GENERATE_LOG(), ...prev].slice(0, 50));
    }, 1500);
    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <CommandPageShell
      header={
        <CommandHeader
          eyebrow="GEO Ops"
          title="Live Crawler Stream"
          subtitle="Analyse en temps réel du trafic généré par les robots d'IA."
          actions={
            <button className={COMMAND_BUTTONS.secondary}>Modifier robots.txt</button>
          }
        />
      }
    >
      {/* Top Chart */}
      <div className={cn(COMMAND_PANEL, "p-6 h-[200px] mb-6")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={CHART_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="day" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#090a0b', border: '1px solid rgba(255,255,255,0.1)' }} />
            <Bar dataKey="GPTBot" stackId="a" fill="#5b73ff" radius={[0,0,0,0]} />
            <Bar dataKey="ClaudeBot" stackId="a" fill="#a78bfa" radius={[0,0,0,0]} />
            <Bar dataKey="PerplexityBot" stackId="a" fill="#34d399" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-450px)] min-h-[500px]">
        {/* Left: Terminal Log */}
        <div className={cn(COMMAND_PANEL, "flex-1 flex flex-col overflow-hidden bg-[#06070a] border-white/10")}>
          <div className="p-3 border-b border-white/10 bg-white/[0.02] flex justify-between items-center">
            <div className="flex items-center gap-2 text-white/50 text-[12px] font-mono">
              <TerminalIcon className="w-4 h-4" /> access.log
            </div>
            <div className="flex items-center gap-4">
              <select className="bg-black/50 border border-white/10 rounded px-2 py-1 text-[11px] text-white/70 outline-none">
                <option>Tous les bots</option>
                {BOTS.map(b => <option key={b}>{b}</option>)}
              </select>
              <button 
                onClick={() => setIsLive(!isLive)}
                className={cn("flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-bold tracking-wider uppercase transition-colors border",
                  isLive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 text-white/40 border-white/10"
                )}
              >
                {isLive ? <><PauseIcon className="w-3 h-3"/> Live</> : <><PlayIcon className="w-3 h-3"/> Paused</>}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-[#0a0c10] p-4 font-mono text-[11px] leading-relaxed scrollbar-none">
            <AnimatePresence initial={false}>
              {logs.map((log, i) => (
                <motion.div 
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn("flex gap-4 py-1 hover:bg-white/[0.02] px-2 -mx-2 rounded", 
                    i % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
                  )}
                >
                  <span className="text-white/30 shrink-0 w-24">{log.time}</span>
                  <span className={cn("shrink-0 w-12",
                    log.status === 200 ? "text-emerald-400" :
                    log.status === 403 ? "text-amber-400" : "text-rose-400"
                  )}>{log.status}</span>
                  <span className="text-indigo-300 shrink-0 w-12">{log.ms}ms</span>
                  <span className="text-white/40 truncate w-48 shrink-0" title={log.ua}>{log.ua.split(';')[1]?.trim() || log.ua}</span>
                  <span className="text-white/80 truncate flex-1">{log.url}</span>
                  <span className="text-white/30 shrink-0 w-16 text-right">{(log.bytes/1024).toFixed(1)}kb</span>
                  <span className="shrink-0 w-6 flex justify-end">
                    {log.allowed ? <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500/50" /> : <ShieldAlertIcon className="w-3.5 h-3.5 text-amber-500/50" />}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Stat Cards */}
        <div className="w-full lg:w-[280px] grid grid-cols-2 lg:grid-cols-1 gap-4 overflow-y-auto pr-2 scrollbar-none">
          {BOTS.map((bot, i) => (
            <div key={bot} className={cn(COMMAND_PANEL, "p-4 flex flex-col gap-3")}>
              <div className="flex justify-between items-start">
                <span className="font-semibold text-white/90 text-[13px]">{bot}</span>
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded",
                  i < 3 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                )}>
                  {i < 3 ? 'Autorisé' : 'Limité'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest">Hits 24h</div>
                  <div className="text-[16px] font-mono text-white mt-0.5">{Math.floor(Math.random()*5000)+100}</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest">Top URL</div>
                  <div className="text-[11px] font-mono text-indigo-300 mt-1.5 truncate">/tarifs</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </CommandPageShell>
  );
}
