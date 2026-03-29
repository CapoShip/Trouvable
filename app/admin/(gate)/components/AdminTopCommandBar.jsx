'use client';

import { usePathname } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';

function useCurrentTime() {
    const [time, setTime] = useState(null);
    useEffect(() => {
        setTime(new Date());
        const id = setInterval(() => setTime(new Date()), 30000);
        return () => clearInterval(id);
    }, []);
    return time;
}

export default function AdminTopCommandBar() {
    const pathname = usePathname();
    const time = useCurrentTime();

    const context = useMemo(() => {
        if (pathname === '/admin/clients' || pathname === '/admin/clients/')
            return { label: 'Portefeuille', section: 'supervision' };
        if (pathname?.startsWith('/admin/clients/new') || pathname?.startsWith('/admin/clients/create') || pathname?.startsWith('/admin/clients/onboarding'))
            return { label: 'Nouveau mandat', section: 'onboarding' };

        const clientMatch = pathname?.match(/\/admin\/clients\/([^/]+)/);
        if (clientMatch) {
            const sub = pathname.replace(`/admin/clients/${clientMatch[1]}`, '').split('/').filter(Boolean)[0];
            const map = {
                overview: 'Situation',
                runs: 'Exécution',
                audit: 'Audit',
                signals: 'Signaux',
                social: 'Veille sociale',
                opportunities: 'File d\'actions',
                portal: 'Restitution',
                settings: 'Paramètres',
                'geo-compare': 'GEO Compare',
                prompts: 'Prompts',
                edit: 'Édition',
            };
            return { label: map[sub] || 'Pilotage mission', section: 'mission' };
        }
        return { label: 'Centre de commande', section: 'home' };
    }, [pathname]);

    return (
        <div className="cmd-topbar">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 cmd-health-dot shrink-0" />
                <span className="text-[11px] font-semibold text-white/55 truncate tracking-wide">
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
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/70" />
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.08em]">Opérationnel</span>
                </div>
            </div>
        </div>
    );
}
