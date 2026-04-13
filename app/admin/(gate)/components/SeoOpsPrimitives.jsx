import Link from 'next/link';

import ReliabilityPill from '@/components/ui/ReliabilityPill';

const ACCENT_CLASSES = {
    emerald: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    sky: 'border-sky-400/20 bg-sky-400/10 text-sky-200',
    amber: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
    slate: 'border-white/10 bg-white/[0.04] text-white/60',
};

const PANEL_TONE_CLASSES = {
    default: 'border-white/[0.08] bg-[#0b1110]/85',
    success: 'border-emerald-400/18 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_48%),linear-gradient(180deg,rgba(9,16,14,0.92),rgba(7,11,10,0.96))]',
    info: 'border-sky-400/18 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_48%),linear-gradient(180deg,rgba(8,16,20,0.92),rgba(7,11,14,0.96))]',
    warning: 'border-amber-400/18 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_48%),linear-gradient(180deg,rgba(18,14,8,0.92),rgba(12,10,7,0.96))]',
    critical: 'border-red-400/18 bg-[radial-gradient(circle_at_top_right,rgba(248,113,113,0.14),transparent_48%),linear-gradient(180deg,rgba(22,10,10,0.92),rgba(12,7,7,0.96))]',
};

const STATUS_META = {
    ok: {
        label: 'Sain',
        className: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
    },
    warning: {
        label: 'À surveiller',
        className: 'border-amber-400/20 bg-amber-400/10 text-amber-100',
    },
    critical: {
        label: 'Action requise',
        className: 'border-red-400/20 bg-red-400/10 text-red-200',
    },
    unavailable: {
        label: 'Indisponible',
        className: 'border-white/10 bg-white/[0.04] text-white/55',
    },
};

const SPARKLINE_COLORS = {
    emerald: { stroke: '#34d399', fill: 'rgba(52, 211, 153, 0.16)' },
    sky: { stroke: '#38bdf8', fill: 'rgba(56, 189, 248, 0.16)' },
    amber: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.16)' },
    slate: { stroke: '#cbd5e1', fill: 'rgba(203, 213, 225, 0.12)' },
};

export function formatNumber(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
    return Number(value).toLocaleString('fr-FR');
}

export function formatPercent(value, decimals = 1) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
    return `${(Number(value) * 100).toFixed(decimals)}%`;
}

export function formatPosition(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
    return Number(value).toFixed(1);
}

export function formatDateLabel(value) {
    if (!value) return 'Indisponible';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Indisponible';
    return parsed.toLocaleDateString('fr-CA', { dateStyle: 'medium' });
}

export function formatDateTimeLabel(value) {
    if (!value) return 'Indisponible';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Indisponible';
    return parsed.toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' });
}

export function getPanelToneFromStatus(status) {
    if (status === 'ok') return 'success';
    if (status === 'warning') return 'warning';
    if (status === 'critical') return 'critical';
    if (status === 'unavailable') return 'default';
    return 'default';
}

export function SeoStatusBadge({ status, label = null, className = '' }) {
    const resolved = STATUS_META[status] || STATUS_META.unavailable;

    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${resolved.className} ${className}`}>
            {label || resolved.label}
        </span>
    );
}

function buildSparklinePoints(values) {
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    return values.map((value, index) => {
        const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
        const y = 40 - (((value - min) / range) * 32);
        return { x, y };
    });
}

export function SeoSparkline({ points, valueKey, color = 'emerald' }) {
    const values = (points || [])
        .map((point) => Number(point?.[valueKey]))
        .filter((value) => Number.isFinite(value));

    if (values.length < 2) return null;

    const coords = buildSparklinePoints(values);
    const linePath = coords.map((coord) => `${coord.x},${coord.y}`).join(' ');
    const areaPath = ['0,40', ...coords.map((coord) => `${coord.x},${coord.y}`), '100,40'].join(' ');
    const palette = SPARKLINE_COLORS[color] || SPARKLINE_COLORS.emerald;

    return (
        <svg viewBox="0 0 100 42" className="h-12 w-full" preserveAspectRatio="none" aria-hidden="true">
            <polygon points={areaPath} fill={palette.fill} />
            <polyline
                points={linePath}
                fill="none"
                stroke={palette.stroke}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function SeoPageHeader({ eyebrow = 'SEO Ops', title, subtitle, actions = null }) {
    return (
        <section className="relative overflow-hidden rounded-[28px] border border-emerald-400/16 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_36%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.14),transparent_34%),linear-gradient(180deg,rgba(10,16,15,0.96),rgba(6,10,10,0.98))] px-5 py-6 sm:px-6 lg:px-8 lg:py-7">
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/35 to-transparent" />
            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-4xl">
                    <div className="inline-flex items-center rounded-full border border-emerald-400/18 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-100/90">
                        {eyebrow}
                    </div>
                    <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                        {title}
                    </h1>
                    {subtitle ? (
                        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/62 sm:text-[15px]">
                            {subtitle}
                        </p>
                    ) : null}
                </div>

                {actions ? (
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:justify-end">
                        {actions}
                    </div>
                ) : null}
            </div>
        </section>
    );
}

export function SeoStatCard({ label, value, detail, reliability = 'unavailable', accent = 'emerald', href = null, trend = null }) {
    const content = (
        <div className="rounded-[24px] border border-white/[0.08] bg-[#0b1110]/88 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.2)] transition-colors hover:border-white/[0.12]">
            <div className="flex items-start justify-between gap-3">
                <div className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${ACCENT_CLASSES[accent] || ACCENT_CLASSES.emerald}`}>
                    {label}
                </div>
                <ReliabilityPill value={reliability} />
            </div>

            <div className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white">
                {value}
            </div>

            {detail ? (
                <p className="mt-2 text-[12px] leading-relaxed text-white/48">
                    {detail}
                </p>
            ) : null}

            {trend ? (
                <div className="mt-4">
                    <SeoSparkline points={trend.points} valueKey={trend.valueKey} color={trend.color || accent} />
                </div>
            ) : null}
        </div>
    );

    if (!href) return content;

    return (
        <Link href={href} className="block">
            {content}
        </Link>
    );
}

export function SeoPanel({ id, title, subtitle = null, action = null, reliability = null, tone = 'default', children }) {
    return (
        <section id={id} className={`rounded-[26px] border p-5 shadow-[0_20px_70px_rgba(0,0,0,0.18)] ${PANEL_TONE_CLASSES[tone] || PANEL_TONE_CLASSES.default}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold tracking-[-0.02em] text-white">
                            {title}
                        </h2>
                        {reliability ? <ReliabilityPill value={reliability} /> : null}
                    </div>
                    {subtitle ? (
                        <p className="mt-1 text-[12px] leading-relaxed text-white/48">
                            {subtitle}
                        </p>
                    ) : null}
                </div>

                {action ? <div className="shrink-0">{action}</div> : null}
            </div>

            <div className="mt-4 space-y-4">
                {children}
            </div>
        </section>
    );
}

export function SeoEmptyState({ title, description, action = null }) {
    return (
        <div className="rounded-[24px] border border-dashed border-white/12 bg-white/[0.03] p-6 text-center">
            <div className="text-base font-semibold text-white/85">{title}</div>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
                {description}
            </p>
            {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
        </div>
    );
}