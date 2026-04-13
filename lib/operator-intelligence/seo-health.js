import 'server-only';

import * as db from '@/lib/db';

const PRIORITY_ORDER = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
};

function toArray(value) {
    return Array.isArray(value) ? value : [];
}

function compactString(value) {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function timeSince(value) {
    if (!value) return null;

    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) return null;

    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);

    if (hours < 1) return '< 1h';
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}j`;
}

function sortIssues(left, right) {
    const leftPriority = PRIORITY_ORDER[left.priority] ?? 99;
    const rightPriority = PRIORITY_ORDER[right.priority] ?? 99;
    if (leftPriority !== rightPriority) return leftPriority - rightPriority;
    return String(left.title || '').localeCompare(String(right.title || ''), 'fr-CA');
}

function getTechnicalDimension(audit) {
    return toArray(audit?.seo_breakdown?.dimensions).find((dimension) => dimension?.key === 'technical_seo') || null;
}

function getIndicator(audit, key) {
    return toArray(getTechnicalDimension(audit)?.indicators).find((indicator) => indicator?.key === key) || null;
}

function indicatorStatus(indicator, missingSeverity = 'warning') {
    if (!indicator) return 'unavailable';
    if (indicator.status === 'detected') return 'ok';
    if (indicator.status === 'weak_evidence') return 'warning';
    if (indicator.status === 'not_found') return missingSeverity;
    return 'unavailable';
}

function findIssueOrStrength(audit, matcher) {
    const issue = toArray(audit?.issues).find((item) => matcher(item));
    if (issue) return { kind: 'issue', item: issue };

    const strength = toArray(audit?.strengths).find((item) => matcher(item));
    if (strength) return { kind: 'strength', item: strength };

    return null;
}

function getPromptType(issue) {
    const title = String(issue?.title || '').toLowerCase();
    const category = String(issue?.category || '').toLowerCase();

    if (title.includes('faq') || (category === 'content' && title.includes('question'))) return 'missing_faq_for_intent';
    if (title.includes('local') || title.includes('nap') || title.includes('adresse')) return 'weak_local_clarity';
    if (title.includes('schema') || title.includes('json-ld') || title.includes('données structurées')) return 'schema_missing_or_incoherent';
    if (title.includes('llms.txt')) return 'llms_txt_missing';
    if (title.includes('crawler') || title.includes('robots') || title.includes('bot')) return 'ai_crawlers_blocked';
    return null;
}

function issueReliability(issue) {
    const provenance = issue?.provenance || issue?.truth_class;
    if (provenance === 'observed') return 'measured';
    if (provenance === 'derived') return 'calculated';
    if (provenance === 'inferred') return 'ai_analysis';
    return 'unavailable';
}

function normalizeIssue(issue) {
    return {
        id: issue?.id || String(issue?.title || issue?.description || 'issue'),
        title: issue?.title || issue?.description || 'Point à corriger',
        description: issue?.description || issue?.title || 'Point à corriger',
        priority: issue?.priority || issue?.severity || 'medium',
        category: issue?.category || 'seo',
        dimension: issue?.dimension || null,
        evidence: compactString(issue?.evidence_summary)
            || compactString(toArray(issue?.evidence).map((item) => item?.summary).filter(Boolean).join(' · '))
            || 'Preuve non détaillée dans cet audit.',
        recommendedFix: compactString(issue?.recommended_fix) || 'Correction à préciser depuis la preuve observée.',
        reliability: issueReliability(issue),
        promptType: getPromptType(issue),
    };
}

function buildCheck({ id, label, status, detail, evidence, reliability, action }) {
    return {
        id,
        label,
        status,
        detail,
        evidence,
        reliability,
        action,
    };
}

export async function getSeoHealthSlice(clientId) {
    const audit = await db.getLatestAudit(clientId).catch(() => null);

    if (!audit) {
        return {
            emptyState: {
                title: 'Santé SEO indisponible',
                description: 'Aucun audit exploitable n’est disponible pour ce mandat. Relancez un audit avant d’ouvrir la lecture technique.',
            },
        };
    }

    const technicalIndicator = getTechnicalDimension(audit);
    const schemaEntities = toArray(audit?.extracted_data?.schema_entities);
    const schemaTypes = schemaEntities.map((entity) => compactString(entity?.type)).filter(Boolean);

    const robotsSignal = findIssueOrStrength(audit, (item) => {
        const title = String(item?.title || '').toLowerCase();
        return title.includes('crawler') || title.includes('robots');
    });

    const indexationIndicator = getIndicator(audit, 'indexability');
    const canonicalIndicator = getIndicator(audit, 'canonical');
    const crawlIndicator = getIndicator(audit, 'crawl');
    const renderedIndicator = getIndicator(audit, 'rendered_content');
    const httpsIndicator = getIndicator(audit, 'https');

    const normalizedIssues = toArray(audit?.issues)
        .filter((issue) => {
            const title = `${issue?.title || ''} ${issue?.description || ''}`.toLowerCase();
            return issue?.dimension === 'technical_seo'
                || issue?.category === 'technical'
                || /canonical|https|crawl|render|robots|crawler|schema|index|noindex|llms/i.test(title);
        })
        .map(normalizeIssue)
        .sort(sortIssues)
        .slice(0, 8);

    const promptableIssueCount = normalizedIssues.filter((issue) => Boolean(issue.promptType)).length;

    return {
        auditMeta: {
            createdAt: audit?.created_at || null,
            sourceUrl: audit?.resolved_url || audit?.source_url || null,
            seoScore: audit?.seo_score ?? null,
            scannedPages: toArray(audit?.scanned_pages).length,
            technicalSummary: technicalIndicator?.summary || null,
        },
        summaryCards: [
            {
                id: 'latest_audit',
                label: 'Dernier audit',
                value: timeSince(audit?.created_at) || 'Indisponible',
                detail: audit?.created_at ? 'Audit technique observé' : 'Aucun audit récent',
                reliability: 'measured',
                accent: 'emerald',
            },
            {
                id: 'technical_score',
                label: 'Score technique',
                value: audit?.seo_score ?? '—',
                detail: technicalIndicator?.summary || 'Synthèse technique non disponible',
                reliability: audit?.seo_score !== null && audit?.seo_score !== undefined ? 'calculated' : 'unavailable',
                accent: 'sky',
            },
            {
                id: 'technical_issues',
                label: 'Points critiques',
                value: normalizedIssues.length,
                detail: normalizedIssues.length > 0 ? 'Problèmes techniques prioritaires issus du dernier audit' : 'Aucun problème technique majeur remonté',
                reliability: 'calculated',
                accent: normalizedIssues.length > 0 ? 'amber' : 'emerald',
            },
            {
                id: 'promptable_issues',
                label: 'Prompts prêts',
                value: promptableIssueCount,
                detail: promptableIssueCount > 0 ? 'Types de correction déjà couverts par l’infra de remédiation' : 'Aucun type stable de prompt de correction détecté',
                reliability: 'calculated',
                accent: promptableIssueCount > 0 ? 'emerald' : 'slate',
            },
        ],
        checks: [
            buildCheck({
                id: 'indexation',
                label: 'Indexation',
                status: indicatorStatus(indexationIndicator, 'critical'),
                detail: indexationIndicator?.status === 'detected'
                    ? 'Aucune instruction `noindex` n’a été observée sur la page d’entrée auditée.'
                    : 'Un signal de blocage d’indexation a été observé ou la preuve est insuffisante.',
                evidence: indexationIndicator?.evidence || 'Aucune preuve d’indexation exploitable dans cet audit.',
                reliability: indexationIndicator ? 'calculated' : 'unavailable',
                action: 'Vérifier les balises index/noindex et relancer l’audit après correction.',
            }),
            buildCheck({
                id: 'robots',
                label: 'Robots',
                status: !robotsSignal ? 'unavailable' : robotsSignal.kind === 'strength' ? 'ok' : (robotsSignal.item?.priority === 'high' ? 'critical' : 'warning'),
                detail: !robotsSignal
                    ? 'Aucune preuve robots exploitable n’a été persistée dans le dernier audit.'
                    : robotsSignal.kind === 'strength'
                        ? 'Les crawlers critiques ne sont pas bloqués dans la preuve observée.'
                        : 'Un blocage robots / crawler ressort dans le dernier audit.',
                evidence: robotsSignal?.item?.evidence_summary || robotsSignal?.item?.description || 'Preuve robots absente.',
                reliability: robotsSignal ? 'measured' : 'unavailable',
                action: 'Corriger robots.txt ou les règles crawler avant un nouveau passage.',
            }),
            buildCheck({
                id: 'canonical',
                label: 'Canonical',
                status: indicatorStatus(canonicalIndicator, 'warning'),
                detail: canonicalIndicator?.status === 'detected'
                    ? 'Une balise canonique a été observée sur la homepage auditée.'
                    : 'La clarté canonique reste insuffisante sur la page d’entrée auditée.',
                evidence: canonicalIndicator?.evidence || 'Aucune preuve canonique exploitable.',
                reliability: canonicalIndicator ? 'calculated' : 'unavailable',
                action: 'Aligner la balise canonique sur la page canonique réelle.',
            }),
            buildCheck({
                id: 'hreflang',
                label: 'Hreflang',
                status: 'unavailable',
                detail: 'Le pipeline d’audit actuel ne persiste pas encore un contrôle hreflang exploitable mandat par mandat.',
                evidence: 'Aucune mesure `hreflang` structurée disponible dans les sources admin actuelles.',
                reliability: 'unavailable',
                action: 'Préparer un point de contrôle hreflang dans une vague ultérieure si le besoin multilingue est confirmé.',
            }),
            buildCheck({
                id: 'sitemap',
                label: 'Sitemap',
                status: 'unavailable',
                detail: 'Le dernier audit ne conserve pas un signal sitemap exploitable côté admin, même si le repo sait analyser `robots.txt`.',
                evidence: 'Aucune preuve sitemap persistée avec le dernier audit client.',
                reliability: 'unavailable',
                action: 'Préparer une persistance sitemap dédiée avant de promettre un suivi opérateur fiable.',
            }),
            buildCheck({
                id: 'schema',
                label: 'Schema',
                status: schemaTypes.length > 0 ? 'ok' : 'warning',
                detail: schemaTypes.length > 0
                    ? `${schemaTypes.length} type(s) de données structurées observé(s).`
                    : 'Aucune entité structurée exploitable n’a été détectée dans l’échantillon audité.',
                evidence: schemaTypes.length > 0 ? schemaTypes.slice(0, 4).join(' · ') : 'Aucune entité Schema.org persistée dans l’audit.',
                reliability: schemaTypes.length > 0 ? 'measured' : 'unavailable',
                action: 'Vérifier la présence et la cohérence du JSON-LD sur les pages stratégiques.',
            }),
        ],
        indicators: [
            {
                id: 'https',
                label: 'HTTPS',
                status: indicatorStatus(httpsIndicator, 'critical'),
                evidence: httpsIndicator?.evidence || 'Preuve HTTPS indisponible.',
            },
            {
                id: 'crawl',
                label: 'Couverture de crawl',
                status: indicatorStatus(crawlIndicator, 'warning'),
                evidence: crawlIndicator?.evidence || 'Preuve de crawl indisponible.',
            },
            {
                id: 'rendered_content',
                label: 'Contenu rendu',
                status: indicatorStatus(renderedIndicator, 'warning'),
                evidence: renderedIndicator?.evidence || 'Preuve de rendu indisponible.',
            },
        ],
        issues: normalizedIssues,
        emptyState: null,
    };
}