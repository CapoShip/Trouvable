/**
 * KPI Core — Pure derivation functions.
 * No DB access, no side effects. Every function is independently testable.
 */

export function kpi(value, sourceType, confidence, warnings = []) {
    return { value, sourceType, confidence, warnings };
}

export function deriveAuditMetrics(latestAudit) {
    if (!latestAudit) {
        return {
            seoScore: kpi(null, 'observed', 'low', ['Aucun audit disponible.']),
            geoScore: kpi(null, 'observed', 'low', ['Aucun audit disponible.']),
            lastAuditAt: kpi(null, 'observed', 'low'),
            strengths: [],
            issues: [],
            llmStatus: 'none',
        };
    }

    const llmStatus = latestAudit.seo_breakdown?.overall?.llm_status
        || latestAudit.geo_breakdown?.overall?.llm_status
        || 'unknown';

    const warnings = [];
    if (llmStatus === 'failed') warnings.push('Analyse LLM indisponible — score déterministe uniquement.');
    if (llmStatus === 'skipped') warnings.push('Analyse LLM non exécutée.');

    return {
        seoScore: kpi(latestAudit.seo_score ?? null, 'observed', latestAudit.seo_score != null ? 'high' : 'low', warnings),
        geoScore: kpi(latestAudit.geo_score ?? null, 'observed', latestAudit.geo_score != null ? 'high' : 'low', warnings),
        lastAuditAt: kpi(latestAudit.created_at ?? null, 'observed', 'high'),
        strengths: latestAudit.strengths || [],
        issues: latestAudit.issues || [],
        llmStatus,
    };
}

export function deriveRunMetrics(completedRuns, { totalQueryRuns = 0, brandRecommendations = 0 } = {}) {
    const tq = totalQueryRuns;
    const br = brandRecommendations;

    const visibilityProxyPercent = tq > 0 ? Math.round((br / tq) * 100) : null;
    const reliability = tq >= 10 ? 'high' : tq >= 5 ? 'medium' : tq > 0 ? 'low' : null;

    const runsByProvider = {};
    const modelAgg = new Map();

    for (const r of completedRuns || []) {
        const pk = r.provider || 'unknown';
        runsByProvider[pk] = (runsByProvider[pk] || 0) + 1;

        const mk = `${r.provider || 'unknown'}|||${r.model || 'unknown'}`;
        if (!modelAgg.has(mk)) {
            modelAgg.set(mk, { provider: r.provider || 'unknown', model: r.model || 'unknown', runs: 0, targetFound: 0, sources: 0 });
        }
        const row = modelAgg.get(mk);
        row.runs += 1;
        if (r.target_found) row.targetFound += 1;
    }

    const modelPerformance = [...modelAgg.values()]
        .map((row) => ({ ...row, targetRatePercent: row.runs > 0 ? Math.round((row.targetFound / row.runs) * 100) : 0 }))
        .sort((a, b) => b.runs - a.runs);

    return {
        totalQueryRuns: kpi(tq, 'observed', 'high'),
        visibilityProxyPercent: kpi(visibilityProxyPercent, 'derived', reliability || 'low',
            tq < 5 && tq > 0 ? ['Proxy basé sur un volume insuffisant.'] : []),
        visibilityProxyReliability: reliability,
        runsByProvider,
        modelPerformance,
        sampleSizeWarning: tq > 0 && tq < 5,
    };
}

export function deriveMentionMetrics(mentionRows, completedRuns = []) {
    let confirmedCompetitors = 0;
    let genericMentions = 0;
    let sourceMentions = 0;
    let externalSources = 0;
    let brandTargetMentions = 0;
    const sourceHosts = new Map();
    const sourceMentionsByDay = new Map();
    const runsWithSource = new Set();
    const confirmedCompetitorNames = new Map();
    const genericMentionNames = new Map();

    for (const m of mentionRows || []) {
        const et = m.entity_type || 'business';
        if (et === 'source') {
            sourceMentions += 1;
            if (m.source_type !== 'client_own') externalSources += 1;
            if (m.query_run_id) runsWithSource.add(m.query_run_id);
            if (m.created_at) {
                const d = String(m.created_at).slice(0, 10);
                sourceMentionsByDay.set(d, (sourceMentionsByDay.get(d) || 0) + 1);
            }
            const host = (m.normalized_domain || m.business_name || '').replace(/^https?:\/\//, '').split('/')[0];
            if (host) sourceHosts.set(host, (sourceHosts.get(host) || 0) + 1);
        } else if (et === 'competitor') {
            confirmedCompetitors += 1;
            const name = m.normalized_label || m.business_name || 'Inconnu';
            confirmedCompetitorNames.set(name, (confirmedCompetitorNames.get(name) || 0) + 1);
        } else if (et === 'generic_mention' || (et === 'business' && m.is_target === false)) {
            genericMentions += 1;
            const name = m.normalized_label || m.business_name || 'Inconnu';
            genericMentionNames.set(name, (genericMentionNames.get(name) || 0) + 1);
        }
        if (m.is_target === true) brandTargetMentions += 1;
    }

    const totalRuns = completedRuns.length;
    const runsWithSourceCount = runsWithSource.size;
    const citationCoverage = totalRuns > 0 ? Math.round((runsWithSourceCount / totalRuns) * 100) : null;
    const avgSourcePerRun = totalRuns > 0 ? Math.round((externalSources / totalRuns) * 10) / 10 : null;
    const citationReliability = totalRuns >= 10 ? 'high' : totalRuns >= 5 ? 'medium' : totalRuns > 0 ? 'low' : null;

    const topSources = [...sourceHosts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([host, count]) => ({ host, count }));

    const topCompetitors = [...confirmedCompetitorNames.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([name, count]) => ({ name, count }));

    const topGenericMentions = [...genericMentionNames.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ name, count }));

    const sourceMentionsTimeline = [...sourceMentionsByDay.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, count }));

    return {
        confirmedCompetitorMentions: kpi(confirmedCompetitors, 'observed', 'high'),
        genericMentions: kpi(genericMentions, 'observed', 'medium',
            genericMentions > 0 ? ['Mentions non confirmées comme concurrents.'] : []),
        sourceMentions: kpi(sourceMentions, 'observed', 'high'),
        externalSourceMentions: kpi(externalSources, 'derived', 'high'),
        brandTargetMentions: kpi(brandTargetMentions, 'observed', 'high'),
        uniqueSourceHosts: sourceHosts.size,
        topSources,
        topCompetitors,
        topGenericMentions,
        sourceMentionsTimeline,
        runsWithSourceCitation: runsWithSourceCount,
        citationCoveragePercent: kpi(citationCoverage, 'derived', citationReliability || 'low',
            totalRuns > 0 && totalRuns < 5 ? ['Volume insuffisant pour une couverture fiable.'] : []),
        avgSourceMentionsPerRun: kpi(avgSourcePerRun, 'derived', citationReliability || 'low'),
    };
}

export function derivePromptMetrics(trackedQueries, lastRunMap) {
    const total = (trackedQueries || []).length;
    let withTargetFound = 0;
    let withRunNoTarget = 0;
    let noRunYet = 0;

    for (const t of trackedQueries || []) {
        const lr = lastRunMap instanceof Map ? lastRunMap.get(t.id) : null;
        if (!lr) noRunYet += 1;
        else if (lr.target_found) withTargetFound += 1;
        else withRunNoTarget += 1;
    }

    const mentionRate = total > 0 ? Math.round((withTargetFound / total) * 100) : null;

    return {
        total: kpi(total, 'observed', 'high'),
        active: (trackedQueries || []).filter((t) => t.is_active !== false).length,
        withTargetFound,
        withRunNoTarget,
        noRunYet,
        mentionRatePercent: kpi(mentionRate, 'derived', total >= 5 ? 'medium' : 'low',
            total > 0 && total < 5 ? ['Faible nombre de prompts suivis.'] : []),
    };
}

export function buildGeoKpiSnapshot({ audit, runs, mentions, prompts, counts, lastRunAt }) {
    const guardrails = computeGuardrails({ audit, runs, mentions, prompts });

    return { audit, runs, mentions, prompts, counts, lastRunAt, guardrails };
}

export function computeGuardrails({ audit, runs, mentions, prompts }) {
    const warnings = [];
    const tq = runs?.totalQueryRuns?.value ?? 0;

    if (tq === 0) {
        warnings.push({ code: 'NO_RUNS', message: 'Aucune exécution complétée. Lancez les prompts suivis.', severity: 'info' });
    } else if (tq < 5) {
        warnings.push({ code: 'LOW_SAMPLE_SIZE', message: `Seulement ${tq} exécution(s) — les tendances ne sont pas fiables.`, severity: 'warning' });
    }

    const srcVal = mentions?.sourceMentions?.value ?? 0;
    if (tq > 0 && srcVal === 0) {
        warnings.push({ code: 'NO_SOURCES', message: 'Aucune source/citation détectée malgré des exécutions.', severity: 'warning' });
    }

    const cc = mentions?.confirmedCompetitorMentions?.value ?? 0;
    const gm = mentions?.genericMentions?.value ?? 0;
    if (tq >= 5 && cc === 0 && gm > 3) {
        warnings.push({ code: 'UNCONFIRMED_COMPETITORS', message: `${gm} mentions génériques non confirmées. Ajoutez des concurrents connus au profil.`, severity: 'warning' });
    }

    if (audit?.llmStatus === 'failed') {
        warnings.push({ code: 'LLM_DEGRADED', message: 'Analyse LLM en échec — scores déterministes uniquement.', severity: 'warning' });
    }

    if (!audit?.seoScore?.value && !audit?.geoScore?.value) {
        warnings.push({ code: 'NO_AUDIT', message: 'Aucun audit. Lancez un audit pour obtenir les scores.', severity: 'info' });
    }

    const promptTotal = prompts?.total?.value ?? 0;
    if (promptTotal === 0) {
        warnings.push({ code: 'NO_PROMPTS', message: 'Aucun prompt suivi. Ajoutez des prompts pour alimenter le moteur.', severity: 'info' });
    }

    return warnings;
}

export function enrichModelPerformanceWithSources(modelPerformance, mentionRows, completedRuns) {
    const runById = new Map((completedRuns || []).map((r) => [r.id, r]));
    const sourcesByModel = new Map();

    for (const m of mentionRows || []) {
        if (m.entity_type !== 'source') continue;
        const run = runById.get(m.query_run_id);
        if (!run) continue;
        const key = `${run.provider || 'unknown'}|||${run.model || 'unknown'}`;
        sourcesByModel.set(key, (sourcesByModel.get(key) || 0) + 1);
    }

    return (modelPerformance || []).map((row) => {
        const key = `${row.provider}|||${row.model}`;
        return { ...row, sources: sourcesByModel.get(key) || 0 };
    });
}

export function flattenSnapshotToLegacy(snapshot, latestAuditRow) {
    const { audit, runs, mentions, prompts, counts, lastRunAt, guardrails } = snapshot;

    return {
        latestAudit: latestAuditRow || null,
        lastAuditAt: audit?.lastAuditAt?.value ?? null,
        lastGeoRunAt: lastRunAt ?? null,
        openOpportunities: counts?.openOpportunities ?? 0,
        pendingMerge: counts?.pendingMerge ?? 0,
        activeTrackedQueries: counts?.activeTrackedQueries ?? 0,
        totalTrackedQueries: counts?.totalTrackedQueries ?? 0,
        totalQueryRuns: runs?.totalQueryRuns?.value ?? 0,
        brandRecommendationRuns: counts?.brandRecommendations ?? 0,
        confirmedCompetitorMentions: mentions?.confirmedCompetitorMentions?.value ?? 0,
        genericMentions: mentions?.genericMentions?.value ?? 0,
        competitorMentions: mentions?.confirmedCompetitorMentions?.value ?? 0,
        sourceMentions: mentions?.sourceMentions?.value ?? 0,
        externalSourceMentions: mentions?.externalSourceMentions?.value ?? 0,
        uniqueSourceHosts: mentions?.uniqueSourceHosts ?? 0,
        brandTargetMentions: mentions?.brandTargetMentions?.value ?? 0,
        topSources: mentions?.topSources ?? [],
        sourceMentionsTimeline: mentions?.sourceMentionsTimeline ?? [],
        runsByProvider: runs?.runsByProvider ?? {},
        visibilityProxyPercent: runs?.visibilityProxyPercent?.value ?? null,
        visibilityProxyReliability: runs?.visibilityProxyReliability ?? null,
        avgSourceMentionsPerRun: mentions?.avgSourceMentionsPerRun?.value ?? null,
        runsWithSourceCitation: mentions?.runsWithSourceCitation ?? 0,
        citationCoveragePercent: mentions?.citationCoveragePercent?.value ?? null,
        trackedPromptStats: {
            total: prompts?.total?.value ?? 0,
            withTargetFound: prompts?.withTargetFound ?? 0,
            withRunNoTarget: prompts?.withRunNoTarget ?? 0,
            noRunYet: prompts?.noRunYet ?? 0,
            mentionRatePercent: prompts?.mentionRatePercent?.value ?? null,
        },
        modelPerformance: runs?.modelPerformance ?? [],
        strengths: audit?.strengths ?? [],
        issues: audit?.issues ?? [],
        seoScore: audit?.seoScore?.value ?? null,
        geoScore: audit?.geoScore?.value ?? null,
        guardrails: guardrails ?? [],
    };
}

export function buildLastRunMap(completedRuns) {
    const map = new Map();
    const sorted = [...(completedRuns || [])].sort((a, b) =>
        String(b.created_at || '').localeCompare(String(a.created_at || '')),
    );
    for (const r of sorted) {
        if (r.tracked_query_id && !map.has(r.tracked_query_id)) {
            map.set(r.tracked_query_id, r);
        }
    }
    return map;
}
