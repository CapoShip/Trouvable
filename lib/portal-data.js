import 'server-only';

import * as db from '@/lib/db';
import {
    getBusinessShortDescription,
    getProfileCompletenessSummary,
    getPublicContactEmail,
    normalizeClientProfileShape,
} from '@/lib/client-profile';
import { buildMetricTrendSummary } from '@/lib/continuous/metrics';
import { flattenSnapshotToLegacy } from '@/lib/operator-intelligence/kpi-core';
import { getTrackedQueryCategoryMeta } from '@/lib/operator-intelligence/prompt-taxonomy';
import { getGeoWorkspaceSnapshot } from '@/lib/operator-intelligence/snapshot';
import { getAdminSupabase } from '@/lib/supabase-admin';

const PRIORITY_WEIGHT = { high: 300, medium: 200, low: 100 };
const SOURCE_WEIGHT = { opportunity: 30, audit_issue: 20, completeness_gap: 10 };

const PRIORITY_COPY = {
    contact_completeness: {
        title: 'Completer les coordonnees publiques',
        description: 'Ajoutez un telephone et un courriel publics pour faciliter les recommandations et la prise de contact.',
    },
    service_clarity: {
        title: "Clarifier l'offre principale",
        description: 'Precisez les services et la proposition de valeur pour aider les moteurs IA a bien presenter le business.',
    },
    local_coverage: {
        title: 'Renforcer la couverture locale',
        description: 'Mettez en avant les villes, quartiers ou zones desservies pour mieux capter les recherches locales.',
    },
    structured_data: {
        title: 'Structurer les informations locales',
        description: 'Consolidez les donnees locales clefs comme le type d activite, l adresse et les horaires.',
    },
    trust_signals: {
        title: 'Mettre en avant les signaux de confiance',
        description: 'Ajoutez des preuves, garanties ou reseaux visibles qui rassurent les clients et les IA.',
    },
    faq_content: {
        title: 'Developper la FAQ et le contenu utile',
        description: 'Ajoutez des reponses directes et du contenu explicatif pour couvrir les questions frequentes.',
    },
};

function escapeHost(value) {
    if (!value || typeof value !== 'string') return '';
    return value.replace(/^https?:\/\//, '').split('/')[0];
}

function formatDate(iso) {
    if (!iso) return null;
    try {
        return new Date(iso).toLocaleDateString('fr-CA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return null;
    }
}

function buildPortalTrendSummary(snapshots = []) {
    const definitions = [
        { key: 'seo_score', label: 'Score SEO', unit: 'score' },
        { key: 'geo_score', label: 'Score GEO', unit: 'score' },
        { key: 'visibility_proxy_percent', label: 'Proxy visibilite', unit: 'percent' },
        { key: 'citation_coverage_percent', label: 'Couverture citations', unit: 'percent' },
        { key: 'mention_rate_percent', label: 'Taux de mention prompts', unit: 'percent' },
    ];

    const metrics = definitions.map((metric) => {
        const d30 = buildMetricTrendSummary({ snapshots, metricKey: metric.key, days: 30 });
        return {
            key: metric.key,
            label: metric.label,
            unit: metric.unit,
            latest: d30.latest,
            previous: d30.previous,
            delta: d30.delta,
            latestDate: d30.latestDate,
        };
    });

    return {
        coverage: {
            points: snapshots.length,
            startDate: snapshots[0]?.snapshot_date || null,
            endDate: snapshots[snapshots.length - 1]?.snapshot_date || null,
        },
        metrics,
    };
}

function getIssueText(issue) {
    if (typeof issue === 'string') return issue;
    if (issue && typeof issue === 'object') {
        return issue.description || issue.title || '';
    }
    return '';
}

function classifyPriorityBucket({ category = '', text = '' }) {
    const normalizedCategory = String(category || '').toLowerCase();
    const normalizedText = String(text || '').toLowerCase();

    if (/(telephone|t[Ã©e]l|email|courriel|contact)/.test(normalizedText)) {
        return 'contact_completeness';
    }

    if (/(ville|r[Ã©e]gion|quartier|zone|local|secteur|service g[Ã©e]ographique|area served)/.test(normalizedText)) {
        return 'local_coverage';
    }

    if (/(faq|question|contenu|texte|page services|offre|service)/.test(normalizedText)) {
        return normalizedText.includes('faq') || normalizedText.includes('question')
            ? 'faq_content'
            : 'service_clarity';
    }

    if (/(schema|structur|localbusiness|organization|canonical|https|noindex|maps|horaire)/.test(normalizedText)) {
        return 'structured_data';
    }

    if (/(avis|temoign|confiance|preuve|certif|garantie|experience|credibil)/.test(normalizedText)) {
        return 'trust_signals';
    }

    if (normalizedCategory === 'geo') return 'local_coverage';
    if (normalizedCategory === 'content') return 'faq_content';
    if (normalizedCategory === 'technical') return 'structured_data';
    if (normalizedCategory === 'trust') return 'trust_signals';

    return 'service_clarity';
}

function createPrioritySignal({ bucket, priority = 'medium', source, category = '', text = '' }) {
    const resolvedBucket = bucket || classifyPriorityBucket({ category, text });
    const copy = PRIORITY_COPY[resolvedBucket];

    return {
        bucket: resolvedBucket,
        title: copy.title,
        description: copy.description,
        weight: (PRIORITY_WEIGHT[priority] || PRIORITY_WEIGHT.medium) + (SOURCE_WEIGHT[source] || 0),
    };
}

function deriveNextPriorities({ opportunities, latestIssues, completeness }) {
    const signals = [];

    for (const opportunity of opportunities || []) {
        signals.push(
            createPrioritySignal({
                source: 'opportunity',
                priority: opportunity.priority || 'medium',
                category: opportunity.category || '',
                text: `${opportunity.title || ''} ${opportunity.description || ''}`,
            })
        );
    }

    for (const issue of latestIssues || []) {
        signals.push(
            createPrioritySignal({
                source: 'audit_issue',
                priority: 'medium',
                text: getIssueText(issue),
            })
        );
    }

    for (const gap of completeness?.gaps || []) {
        signals.push(
            createPrioritySignal({
                source: 'completeness_gap',
                priority: 'medium',
                bucket: gap.key,
            })
        );
    }

    const uniqueByBucket = new Map();

    for (const signal of signals.sort((a, b) => b.weight - a.weight)) {
        if (!uniqueByBucket.has(signal.bucket)) {
            uniqueByBucket.set(signal.bucket, {
                title: signal.title,
                description: signal.description,
            });
        }
    }

    return Array.from(uniqueByBucket.values()).slice(0, 3);
}

function mapAuditWorkItems(audits = []) {
    return audits
        .filter((audit) => audit.scan_status === 'success' || audit.scan_status === 'partial_error')
        .slice(0, 3)
        .map((audit) => ({
            id: `audit-${audit.id}`,
            created_at: audit.created_at,
            title: 'Audit du site termine',
            description: `SEO ${audit.seo_score ?? '-'} Â· GEO ${audit.geo_score ?? '-'}${formatDate(audit.created_at) ? ` Â· ${formatDate(audit.created_at)}` : ''}`,
        }));
}

function mapActionWorkItems(actions = []) {
    return actions
        .map((action) => {
            if (action.action_type === 'geo_queries_run') {
                const total = Number(action.details?.total_queries || 0);
                const successful = Number(action.details?.successful || 0);
                return {
                    id: `action-${action.id}`,
                    created_at: action.created_at,
                    title: 'Analyse des prompts suivis mise a jour',
                    description: `${successful}/${total} requetes completees`,
                };
            }

            if (action.action_type === 'publication_state_changed') {
                const isPublished = action.details?.is_published === true;
                return {
                    id: `action-${action.id}`,
                    created_at: action.created_at,
                    title: 'Page publique mise a jour',
                    description: isPublished ? 'Le profil public est maintenant publie.' : 'Le profil public a ete remis en brouillon.',
                };
            }

            return null;
        })
        .filter(Boolean);
}

function buildTopTrackedPrompts(trackedQueries, lastRunMap) {
    return (trackedQueries || [])
        .map((query) => {
            const lastRun = lastRunMap.get(query.id) || null;
            const categoryMeta = getTrackedQueryCategoryMeta(query.category || query.query_type, query.query_text);
            return {
                id: query.id,
                query_text: query.query_text,
                category: categoryMeta.label,
                last_run_at: lastRun?.created_at || null,
                target_found: lastRun?.target_found === true,
                target_position: lastRun?.target_position ?? null,
            };
        })
        .sort((a, b) => {
            if (a.target_found !== b.target_found) return a.target_found ? -1 : 1;
            return String(b.last_run_at || '').localeCompare(String(a.last_run_at || ''));
        })
        .slice(0, 5);
}

export async function getPortalDashboardData(clientId) {
    const supabase = getAdminSupabase();

    const { data: clientRow, error: clientError } = await supabase
        .from('client_geo_profiles')
        .select('*')
        .eq('id', clientId)
        .single();

    if (clientError || !clientRow) {
        return null;
    }

    const client = normalizeClientProfileShape(clientRow);

    const { data: auditRows, error: auditError } = await supabase
        .from('client_site_audits')
        .select('id, created_at, scan_status, seo_score, geo_score, issues, strengths')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(6);

    if (auditError) {
        throw new Error(`[PortalData] audits: ${auditError.message}`);
    }

    const recentAudits = auditRows || [];
    const latestAudit = recentAudits.find((audit) => audit.scan_status === 'success' || audit.scan_status === 'partial_error') || null;

    const [ws, trackedQueries, lastRunMap, opportunitiesResult, actionsResult, snapshotsResult] = await Promise.all([
        getGeoWorkspaceSnapshot(clientId).catch((error) => {
            console.error('[PortalData] metrics:', error.message);
            return null;
        }),
        db.getTrackedQueriesAll(clientId).catch((error) => {
            console.error('[PortalData] tracked queries:', error.message);
            return [];
        }),
        db.getLastRunPerTrackedQuery(clientId).catch((error) => {
            console.error('[PortalData] last runs:', error.message);
            return new Map();
        }),
        supabase
            .from('opportunities')
            .select('id, title, description, priority, category, status, created_at')
            .eq('client_id', clientId)
            .eq('status', 'open')
            .order('created_at', { ascending: false })
            .limit(12),
        supabase
            .from('actions')
            .select('id, action_type, details, created_at')
            .eq('client_id', clientId)
            .in('action_type', ['geo_queries_run', 'publication_state_changed'])
            .order('created_at', { ascending: false })
            .limit(12),
        supabase
            .from('visibility_metric_snapshots')
            .select('snapshot_date, seo_score, geo_score, visibility_proxy_percent, citation_coverage_percent, mention_rate_percent')
            .eq('client_id', clientId)
            .order('snapshot_date', { ascending: true })
            .limit(120),
    ]);

    if (opportunitiesResult.error) {
        throw new Error(`[PortalData] opportunities: ${opportunitiesResult.error.message}`);
    }

    if (actionsResult.error) {
        throw new Error(`[PortalData] actions: ${actionsResult.error.message}`);
    }
    if (snapshotsResult.error) {
        throw new Error(`[PortalData] snapshots: ${snapshotsResult.error.message}`);
    }

    const metrics = ws ? flattenSnapshotToLegacy(ws.snapshot, ws.latestAudit) : null;
    if (ws) metrics.modelPerformance = ws.modelPerformance;

    const completeness = getProfileCompletenessSummary(client);
    const topTrackedPrompts = buildTopTrackedPrompts(trackedQueries, lastRunMap instanceof Map ? lastRunMap : new Map(Object.entries(lastRunMap || {})));
    const recentWorkItems = [
        ...mapAuditWorkItems(recentAudits),
        ...mapActionWorkItems(actionsResult.data || []),
    ]
        .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
        .slice(0, 6);

    const topSources = (metrics?.topSources || []).slice(0, 6).map((source) => ({
        host: escapeHost(source.host || source.business_name || ''),
        count: source.count || 0,
    }));

    const openOpportunities = opportunitiesResult.data || [];
    const trendSummary = buildPortalTrendSummary(snapshotsResult.data || []);
    const nextPriorities = deriveNextPriorities({
        opportunities: openOpportunities,
        latestIssues: Array.isArray(latestAudit?.issues) ? latestAudit.issues : [],
        completeness,
    });

    const shortDescription = getBusinessShortDescription(client.business_details);
    const publicEmail = getPublicContactEmail(client.contact_info);
    const lastAuditDate = latestAudit?.created_at ? new Date(latestAudit.created_at) : null;
    const lastClientUpdate = client.updated_at ? new Date(client.updated_at) : null;
    const auditFreshness = lastAuditDate
        ? (lastClientUpdate && lastClientUpdate > lastAuditDate ? 'outdated' : 'recent')
        : 'none';

    return {
        client: {
            id: client.id,
            client_name: client.client_name,
            client_slug: client.client_slug,
            website_url: client.website_url,
            business_type: client.business_type,
            publication_status: client.publication_status,
            short_description: shortDescription,
            public_email: publicEmail,
        },
        visibility: {
            seo_score: latestAudit?.seo_score ?? null,
            geo_score: latestAudit?.geo_score ?? null,
            audit_freshness: auditFreshness,
            last_audit_at: latestAudit?.created_at || null,
            total_query_runs: metrics?.totalQueryRuns ?? 0,
            visibility_proxy_percent: metrics?.visibilityProxyPercent ?? null,
            citation_coverage_percent: metrics?.citationCoveragePercent ?? null,
            tracked_prompt_mention_rate_percent: metrics?.trackedPromptStats?.mentionRatePercent ?? null,
        },
        completeness,
        recentWorkItems,
        topTrackedPrompts,
        topSources,
        trendSummary,
        nextPriorities,
        openOpportunitiesCount: openOpportunities.length,
    };
}


