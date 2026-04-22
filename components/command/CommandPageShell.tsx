import { cn } from '@/lib/tokens';
import React from 'react';

export function CommandPageShell({
    header = null,
    hero = null,
    children,
    drawer = null,
    className = '',
}: {
    header?: React.ReactNode;
    hero?: React.ReactNode;
    children?: React.ReactNode;
    drawer?: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('relative isolate overflow-hidden', className)}>
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[-10%] top-[-4%] h-[32rem] w-[32rem] rounded-full bg-cyan-400/16 blur-3xl" />
                <div className="absolute right-[-12%] top-[6%] h-[30rem] w-[30rem] rounded-full bg-violet-500/18 blur-3xl" />
                <div className="absolute left-[18%] top-[26%] h-[18rem] w-[18rem] rounded-full bg-emerald-400/6 blur-3xl" />
                <div className="absolute inset-x-0 top-[18rem] h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
            </div>

            <div className="relative mx-auto flex w-full max-w-[1680px] flex-col gap-5 px-4 py-5 sm:px-6 lg:gap-6 lg:px-8 lg:py-8">
                {header}
                {hero}
                {children}
            </div>

            {drawer}
        </div>
    );
}

export default CommandPageShell;
