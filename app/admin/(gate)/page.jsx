import Link from 'next/link';
import { listOperatorClients, enrichClientsWithOperationalSignals } from '@/lib/operator-data';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Tableau de bord — Trouvable Command',
};

const ATTENTION_ORDER = { critical: 0, needs_attention: 1, watch: 2, stable: 3 };

function DashboardKpi({ label, value, accent = 'default' }) {
    const accents = {
        default: 'text-white/90',
        critical: 'text-red-300',
        warning: 'text-amber-300',
        success: 'text-emerald-300',
        blue: 'text-[#7b8fff]',
    };
    return (
        <div className="cmd-surface px-4 py-3 min-w-[110px] flex-1 cmd-animate-in">
            <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/25 mb-1.5">{label}</div>
            <div className={`text-[22px] font-bold tabular-nums tracking-[-0.03em] ${accents[accent] || accents.default}`}>
                {value}
            </div>
        </div>
    );
}

function HealthBar({ rows }) {
    const buckets = [
        { key: 'critical', label: 'Critique', color: '#f87171' },
        { key: 'needs_attention', label: 'Action requise', color: '#fbbf24' },
        { key: 'watch', label: 'Surveillance', color: 'rgba(255,255,255,0.3)' },
        { key: 'stable', label: 'Stable', color: '#34d399' },
    ];
    const counts = {};
    buckets.forEach((b) => { counts[b.key] = rows.filter((r) => (r.operatorSignals?.attention || 'stable') === b.key).length; });
    const total = rows.length || 1;
    const activeBuckets = buckets.filter((b) => counts[b.key] > 0);
    if (activeBuckets.length <= 1) return null;

    return (
        <div className="cmd-surface px-5 py-4 cmd-animate-in">
            <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/25 mb-3">
                Santé du portefeuille
            </div>
            <div className="flex h-[8px] overflow-hidden rounded-full bg-white/[0.03] mb-3">
                {buckets.map((bucket) => {
                    const pct = (counts[bucket.key] / total) * 100;
                    if (pct === 0) return null;
                    return (
                        <div
                            key={bucket.key}
                            className="h-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: bucket.color, opacity: 0.65, marginRight: 1 }}
                        />
                    );
                })}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                {buckets.map((bucket) => {
                    if (counts[bucket.key] === 0) return null;
                    const pct = Math.round((counts[bucket.key] / total) * 100);
                    return (
                        <div key={bucket.key} className="flex items-center gap-2 text-[10px]">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ background: bucket.color, opacity: 0.7 }} />
                            <span className="text-white/40">{bucket.label}</span>
                            <span className="font-bold tabular-nums text-white/65">{counts[bucket.key]}</span>
                            <span className="text-white/20">({pct}%)</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function FreshnessGrid({ rows }) {
    const now = Date.now();
    const withRun = rows.filter((r) => r.operatorSignals?.latestRunAt);
    if (withRun.length === 0) return null;

    const fresh = withRun.filter((r) => (now - new Date(r.operatorSignals.latestRunAt).getTime()) / 3600000 < 24).length;
    const aging = withRun.filter((r) => { const h = (now - new Date(r.operatorSignals.latestRunAt).getTime()) / 3600000; return h >= 24 && h < 72; }).length;
    const stale = withRun.filter((r) => (now - new Date(r.operatorSignals.latestRunAt).getTime()) / 3600000 >= 72).length;
    const noRun = rows.length - withRun.length;

    return (
        <div className="cmd-surface px-5 py-4 cmd-animate-in">
            <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/25 mb-3">Fraîcheur des données</div>
            <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                    <div className="text-[18px] font-bold tabular-nums text-emerald-300">{fresh}</div>
                    <div className="text-[9px] text-white/25 mt-0.5">{'< 24h'}</div>
                </div>
                <div>
                    <div className="text-[18px] font-bold tabular-nums text-amber-300">{aging}</div>
                    <div className="text-[9px] text-white/25 mt-0.5">24-72h</div>
                </div>
                <div>
                    <div className="text-[18px] font-bold tabular-nums text-red-300">{stale}</div>
                    <div className="text-[9px] text-white/25 mt-0.5">{'> 72h'}</div>
                </div>
                <div>
                    <div className="text-[18px] font-bold tabular-nums text-white/30">{noRun}</div>
                    <div className="text-[9px] text-white/25 mt-0.5">Aucun run</div>
                </div>
            </div>
        </div>
    );
}

function AttentionDot({ attention }) {
    const colors = { critical: 'bg-red-400', needs_attention: 'bg-amber-400', watch: 'bg-white/30', stable: 'bg-emerald-400' };
    return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors[attention] || colors.stable} ${attention === 'critical' ? 'cmd-health-dot' : ''}`} />;
}

export default async function AdminDashboard() {
    let clients = [];
    let enrichError = null;

    try {
        const raw = await listOperatorClients();
        clients = await enrichClientsWithOperationalSignals(raw);
    } catch (err) {
        console.error('[AdminDashboard] load:', err);
        enrichError = err.message;
    }

    const sorted = [...clients].sort((a, b) => {
        const da = ATTENTION_ORDER[a.operatorSignals?.attention] ?? 9;
        const db = ATTENTION_ORDER[b.operatorSignals?.attention] ?? 9;
        return da - db;
    });

    const criticalCount = clients.filter((c) => c.operatorSignals?.attention === 'critical').length;
    const attentionCount = clients.filter((c) => c.operatorSignals?.attention === 'needs_attention').length;
    const stableCount = clients.filter((c) => c.operatorSignals?.attention === 'stable').length;
    const totalActions = clients.reduce((sum, c) => sum + (c.operatorSignals?.openOpportunities ?? 0), 0);
    const priorityClients = sorted.filter((c) => c.operatorSignals?.attention === 'critical' || c.operatorSignals?.attention === 'needs_attention').slice(0, 8);
    const latestClient = clients[0] || null;
    const criticalClient = sorted.find((c) => c.operatorSignals?.attention === 'critical') || null;

    return (
        <div className="p-5 md:p-7 space-y-5 max-w-[1400px] mx-auto">
            {/* Dashboard header */}
            <div className="cmd-animate-in">
                <h1 className="text-[22px] font-bold tracking-[-0.03em] text-white/95">Tableau de bord</h1>
                <p className="text-white/30 mt-1 text-[12px] max-w-lg leading-relaxed">
                    Triage portefeuille — mandats critiques, fraîcheur des données, prochaines actions.
                </p>
            </div>

            {enrichError && (
                <div className="cmd-surface px-4 py-3 border-red-500/20 text-red-300/80 text-[12px]">
                    Erreur de chargement : {enrichError}
                </div>
            )}

            {/* KPI strip */}
            <div className="flex flex-wrap gap-3 cmd-animate-in cmd-delay-1">
                <DashboardKpi label="Mandats actifs" value={clients.length} accent="blue" />
                {criticalCount > 0 && <DashboardKpi label="Critiques" value={criticalCount} accent="critical" />}
                {attentionCount > 0 && <DashboardKpi label="Actions requises" value={attentionCount} accent="warning" />}
                <DashboardKpi label="Stables" value={stableCount} accent="success" />
                <DashboardKpi label="Actions en file" value={totalActions} accent="default" />
            </div>

            {/* Health + freshness */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <HealthBar rows={clients} />
                <FreshnessGrid rows={clients} />
            </div>

            {/* Priority mandates */}
            {priorityClients.length > 0 && (
                <div className="cmd-surface cmd-animate-in cmd-delay-2">
                    <div className="px-5 py-3.5 border-b border-white/[0.05]">
                        <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/25">Mandats prioritaires</div>
                    </div>
                    <div className="divide-y divide-white/[0.04]">
                        {priorityClients.map((c) => {
                            const s = c.operatorSignals;
                            return (
                                <Link
                                    key={c.id}
                                    href={`/admin/clients/${c.id}/overview`}
                                    className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.025] transition-colors group"
                                >
                                    <AttentionDot attention={s?.attention} />
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[13px] font-semibold text-white/85 group-hover:text-[#a78bfa] transition-colors truncate block">
                                            {c.client_name}
                                        </span>
                                        <span className="text-[10px] text-white/25 mt-0.5 block">
                                            {s?.activePrompts ?? 0} prompts · {s?.openOpportunities ?? 0} actions · {s?.completedRunsWindow ?? 0} runs / 21j
                                        </span>
                                    </div>
                                    {s?.reasons?.length > 0 && (
                                        <div className="hidden sm:flex flex-wrap gap-1 shrink-0">
                                            {s.reasons.slice(0, 3).map((r) => (
                                                <span key={r} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30 border border-white/[0.05]">{r}</span>
                                            ))}
                                        </div>
                                    )}
                                    <svg className="w-4 h-4 text-white/15 group-hover:text-white/35 shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Quick navigation */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 cmd-animate-in cmd-delay-3">
                <Link href="/admin/clients" className="cmd-surface px-4 py-4 hover:border-white/[0.12] transition-all group">
                    <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/25 mb-2">Portefeuille</div>
                    <div className="text-[13px] font-semibold text-white/70 group-hover:text-white transition-colors">Tous les mandats →</div>
                </Link>
                <Link href="/admin/clients/new" className="cmd-surface px-4 py-4 hover:border-white/[0.12] transition-all group">
                    <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/25 mb-2">Nouveau</div>
                    <div className="text-[13px] font-semibold text-white/70 group-hover:text-white transition-colors">Créer un mandat →</div>
                </Link>
                {latestClient && (
                    <Link href={`/admin/clients/${latestClient.id}/overview`} className="cmd-surface px-4 py-4 hover:border-white/[0.12] transition-all group">
                        <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-white/25 mb-2">Dernier mandat</div>
                        <div className="text-[13px] font-semibold text-white/70 group-hover:text-white transition-colors truncate">{latestClient.client_name} →</div>
                    </Link>
                )}
                {criticalCount > 0 && criticalClient && (
                    <Link href={`/admin/clients/${criticalClient.id}/overview`} className="cmd-surface px-4 py-4 hover:border-white/[0.12] border-red-500/10 transition-all group">
                        <div className="text-[9px] font-bold uppercase tracking-[0.1em] text-red-300/40 mb-2">Critique</div>
                        <div className="text-[13px] font-semibold text-red-300/80 group-hover:text-red-200 transition-colors truncate">
                            {criticalClient.client_name} →
                        </div>
                    </Link>
                )}
            </div>
        </div>
    );
}
