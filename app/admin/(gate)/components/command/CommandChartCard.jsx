import { COMMAND_SURFACE_SOFT, COMMAND_TEXT, cn } from './tokens';

export default function CommandChartCard({
    eyebrow = 'Tendance',
    title,
    description = null,
    action = null,
    legend = null,
    empty = null,
    children,
}) {
    return (
        <section className={cn(COMMAND_SURFACE_SOFT, 'overflow-hidden p-5 sm:p-6')}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                    <div className={COMMAND_TEXT.eyebrow}>{eyebrow}</div>
                    <div className="mt-3 text-[22px] font-semibold tracking-[-0.03em] text-white">{title}</div>
                    {description ? <p className="mt-2 text-[13px] leading-relaxed text-white/[0.62]">{description}</p> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {legend}
                    {action}
                </div>
            </div>

            <div className="mt-6 rounded-[22px] border border-white/[0.08] bg-black/20 p-4 sm:p-5">
                {empty || children}
            </div>
        </section>
    );
}
