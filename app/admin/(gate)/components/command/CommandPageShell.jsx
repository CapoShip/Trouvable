import { cn } from './tokens';

export default function CommandPageShell({ header = null, hero = null, children, drawer = null, className = '' }) {
    return (
        <div className={cn('relative isolate overflow-hidden', className)}>
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[-12%] top-0 h-[28rem] w-[28rem] rounded-full bg-sky-400/10 blur-3xl" />
                <div className="absolute right-[-10%] top-[10%] h-[26rem] w-[26rem] rounded-full bg-violet-400/10 blur-3xl" />
                <div className="absolute inset-x-0 top-[18rem] h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
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
