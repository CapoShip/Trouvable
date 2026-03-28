import { normalizeAuditProblems } from '../truth/problems.js';
import { classifySiteForAudit } from './site-classification.js';

const APPLICABILITY_MULTIPLIER = { high: 1, medium: 0.65, low: 0.3 };
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };
const DIMENSION_META = {
    technical_seo: {
        label: 'Technical SEO',
        description: 'Observed crawlability, indexing, metadata, and extractable on-page structure.',
        category: 'technical',
        provenance: 'observed',
    },
    local_readiness: {
        label: 'Local / GEO readiness',
        description: 'Observed local identity, service-area evidence, and local recommendation signals.',
        category: 'geo',
        provenance: 'observed',
    },
    ai_answerability: {
        label: 'AI answerability',
        description: 'Observed clarity, answer-friendly content, and extractable support for AI surfaces.',
        category: 'content',
        provenance: 'derived',
    },
    trust_signals: {
        label: 'Trust signals',
        description: 'Observed proof, credibility, and reassurance signals.',
        category: 'trust',
        provenance: 'observed',
    },
    identity_completeness: {
        label: 'Identity completeness',
        description: 'Observed business identity, contactability, and core business context completeness.',
        category: 'seo',
        provenance: 'observed',
    },
};

function clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
}

function toArray(value) {
    return Array.isArray(value) ? value : [];
}

function uniqueStrings(values = []) {
    return [...new Set(values.filter((value) => typeof value === 'string' && value.trim().length > 0).map((value) => value.trim()))];
}

function summarize(values = [], limit = 4) {
    return uniqueStrings(values).slice(0, limit).join(', ');
}

function applicabilityMultiplier(level) {
    return APPLICABILITY_MULTIPLIER[level] ?? APPLICABILITY_MULTIPLIER.high;
}

function applicabilityLabel(level) {
    if (level === 'high') return 'High relevance';
    if (level === 'medium') return 'Medium relevance';
    return 'Low relevance';
}

function makeIssue({
    title,
    description,
    severity = 'medium',
    priority = severity,
    category,
    dimension,
    provenance = 'observed',
    evidence_status = 'not_found',
    evidence_summary = '',
    recommended_fix = '',
}) {
    return {
        title,
        description,
        severity,
        priority,
        category,
        dimension,
        provenance,
        evidence_status,
        evidence_summary,
        recommended_fix,
    };
}

function makeStrength({ title, description, category, dimension, provenance = 'observed', evidence_summary = '' }) {
    return {
        title,
        description,
        category,
        dimension,
        provenance,
        evidence_status: 'detected',
        evidence_summary,
    };
}

function makeIndicator({ key, label, max, score, applicability = 'high', evidence = '', status = 'detected' }) {
    const effectiveMax = max * applicabilityMultiplier(applicability);
    return {
        key,
        label,
        score: clamp(score, 0, effectiveMax),
        max_score: effectiveMax,
        applicability,
        evidence,
        status,
    };
}

function summarizeDimension(key, indicators, applicabilityLevel) {
    const observed = indicators.reduce((sum, indicator) => sum + indicator.score, 0);
    const max = indicators.reduce((sum, indicator) => sum + indicator.max_score, 0);
    const score = max > 0 ? Math.round((observed / max) * 100) : 0;
    const meta = DIMENSION_META[key];

    let summary = `${meta.label} is partially supported by observed crawl evidence.`;
    if (max === 0) summary = `${meta.label} is not applicable based on observed site profile.`;
    else if (score >= 80) summary = `${meta.label} is a clear strength based on observed evidence.`;
    else if (score >= 60) summary = `${meta.label} is workable but still has actionable gaps.`;
    else if (score >= 40) summary = `${meta.label} is uneven and should be strengthened.`;
    else summary = `${meta.label} is currently weak relative to the detected site profile.`;

    return {
        key,
        label: meta.label,
        description: meta.description,
        category: meta.category,
        provenance: meta.provenance,
        score,
        score_label: max === 0 ? 'N/A' : `${score}/100`,
        applicability: applicabilityLabel(applicabilityLevel),
        summary,
        indicators: indicators.map((indicator) => ({
            key: indicator.key,
            label: indicator.label,
            score: Math.round(indicator.score),
            max_score: Math.round(indicator.max_score),
            applicability: indicator.applicability,
            evidence: indicator.evidence,
            status: indicator.status,
        })),
    };
}

function sortIssues(issues = []) {
    return [...issues].sort((a, b) => {
        const priorityDelta = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99);
        if (priorityDelta !== 0) return priorityDelta;
        return String(a.title || '').localeCompare(String(b.title || ''), 'en-CA');
    });
}

function sortStrengths(strengths = []) {
    return [...strengths].sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'en-CA'));
}

function pushAutomationData(automation_data, field_key, detected_value, confidence_level, source_type) {
    if (detected_value === null || detected_value === undefined) return;
    if (typeof detected_value === 'string' && detected_value.trim().length === 0) return;
    if (Array.isArray(detected_value) && detected_value.length === 0) return;
    if (typeof detected_value === 'object' && !Array.isArray(detected_value) && Object.keys(detected_value).length === 0) return;
    if (detected_value === false || detected_value === 0) return;

    automation_data.push({
        field_key,
        detected_value,
        normalized_value: typeof detected_value === 'string' ? detected_value.trim() : detected_value,
        confidence_level,
        source_type,
        status: 'suggested',
    });
}

function scanResultsSafeUrl(scanResults) {
    const resolved = scanResults?.resolved_url || scanResults?.source_url || '';
    return resolved || 'No resolved URL observed.';
}

function collectMetrics(scanResults) {
    const extracted = scanResults?.extracted_data || {};
    const scannedPages = toArray(scanResults?.scanned_pages);
    const successPages = scannedPages.filter((page) => page.success);
    const pageSummaries = toArray(extracted.page_summaries);
    const homePage = pageSummaries.find((page) => page.page_type === 'homepage') || pageSummaries[0] || null;
    const title = extracted.titles?.[0] || homePage?.title || '';
    const description = extracted.descriptions?.[0] || homePage?.description || '';
    const h1 = extracted.h1s?.[0] || homePage?.h1 || '';
    const totalWordCount = Number(extracted.page_stats?.total_word_count || 0);
    const appShellPages = Number(extracted.technology_signals?.app_shell_pages || 0);
    const averageWords = successPages.length > 0 ? Math.round(totalWordCount / successPages.length) : 0;

    return {
        extracted,
        title,
        description,
        h1,
        successCount: successPages.length,
        scannedCount: scannedPages.length,
        crawlSuccessRate: scannedPages.length > 0 ? successPages.length / scannedPages.length : 0,
        totalWordCount,
        averageWords,
        appShellPages,
        hydrationHints: uniqueStrings(extracted.technology_signals?.hydration_hints || []),
        hasHydrationRisk: appShellPages > 0 && (averageWords < 180 || totalWordCount < 700),
        hasHttps: String(scanResults?.resolved_url || '').startsWith('https://'),
        hasCanonical: toArray(extracted.canonicals).length > 0,
        hasNoindex: extracted.has_noindex === true,
        hasFaq: extracted.has_faq_schema === true || toArray(extracted.faq_pairs).length > 0 || Number(extracted.page_stats?.faq_pages || 0) > 0,
        hasFaqSchema: extracted.has_faq_schema === true,
        faqCount: toArray(extracted.faq_pairs).length,
        hasLocalBusinessSchema: extracted.has_local_business_schema === true,
        localSignals: extracted.local_signals || {},
        trustSignals: extracted.trust_signals || {},
        serviceSignals: extracted.service_signals || {},
        businessNames: uniqueStrings(extracted.business_names || []),
        phones: uniqueStrings(extracted.phones || []),
        emails: uniqueStrings(extracted.emails || []),
        socialLinks: uniqueStrings(extracted.social_links || []),
        schemaEntities: toArray(extracted.schema_entities),
        servicePageCount: Number(extracted.page_stats?.service_pages || 0),
        contactPageCount: Number(extracted.page_stats?.contact_pages || 0),
        aboutPageCount: Number(extracted.page_stats?.about_pages || 0),
        localPageCount: pageSummaries.filter((page) => page.page_type === 'location').length,
        h2Rich: toArray(extracted.h2_clusters).some((cluster) => cluster.length >= 3),
        localEvidence: uniqueStrings([
            ...(extracted.local_signals?.cities || []),
            ...(extracted.local_signals?.regions || []),
            ...(extracted.local_signals?.area_served || []),
            ...(extracted.local_signals?.address_lines || []),
            ...(extracted.local_signals?.local_terms || []),
        ]),
        trustEvidence: uniqueStrings([
            ...(extracted.trust_signals?.proof_terms || []),
            ...(extracted.trust_signals?.review_terms || []),
        ]),
        serviceEvidence: uniqueStrings([
            ...(extracted.service_signals?.services || []),
            ...(extracted.service_signals?.keywords || []),
        ]),
    };
}

function buildDimensionParts(scanResults, metrics, siteClassification) {
    const issues = [];
    const strengths = [];
    const localApplicability = siteClassification.applicability.local_schema;
    const serviceAreaApplicability = siteClassification.applicability.service_area;
    const publicContactApplicability = siteClassification.applicability.public_contact;

    const technical = [
        makeIndicator({ key: 'https', label: 'HTTPS', max: 18, score: metrics.hasHttps ? 18 : 0, evidence: scanResultsSafeUrl(scanResults), status: metrics.hasHttps ? 'detected' : 'not_found' }),
        makeIndicator({ key: 'title', label: 'Homepage title', max: 16, score: metrics.title.length >= 16 ? 16 : metrics.title.length >= 10 ? 8 : 0, evidence: metrics.title || 'No strong title observed.', status: metrics.title.length >= 16 ? 'detected' : metrics.title ? 'weak_evidence' : 'not_found' }),
        makeIndicator({ key: 'description', label: 'Meta description', max: 12, score: metrics.description.length >= 70 ? 12 : metrics.description.length >= 35 ? 6 : 0, evidence: metrics.description || 'No meta description observed.', status: metrics.description.length >= 70 ? 'detected' : metrics.description ? 'weak_evidence' : 'not_found' }),
        makeIndicator({ key: 'h1', label: 'Homepage H1', max: 12, score: metrics.h1.length >= 8 ? 12 : 0, evidence: metrics.h1 || 'No clear homepage H1 observed.', status: metrics.h1.length >= 8 ? 'detected' : 'not_found' }),
        makeIndicator({ key: 'canonical', label: 'Canonical', max: 10, score: metrics.hasCanonical ? 10 : 0, evidence: metrics.hasCanonical ? summarize(metrics.extracted.canonicals, 2) : 'No canonical observed.', status: metrics.hasCanonical ? 'detected' : 'not_found' }),
        makeIndicator({ key: 'indexability', label: 'Indexability', max: 14, score: metrics.hasNoindex ? 0 : 14, evidence: metrics.hasNoindex ? 'Noindex observed.' : 'No noindex observed.', status: metrics.hasNoindex ? 'not_found' : 'detected' }),
        makeIndicator({ key: 'crawl', label: 'Crawl coverage', max: 10, score: metrics.successCount >= 2 && metrics.crawlSuccessRate >= 0.5 ? 10 : metrics.successCount > 0 ? 5 : 0, evidence: `${metrics.successCount}/${metrics.scannedCount} pages returned usable HTML.`, status: metrics.successCount >= 2 && metrics.crawlSuccessRate >= 0.5 ? 'detected' : metrics.successCount > 0 ? 'weak_evidence' : 'not_found' }),
        makeIndicator({ key: 'rendered_content', label: 'Rendered content', max: 8, score: metrics.hasHydrationRisk ? 2 : metrics.totalWordCount >= 700 ? 8 : metrics.totalWordCount >= 350 ? 5 : 0, evidence: metrics.hasHydrationRisk ? `${metrics.appShellPages} app-shell-like page(s) observed: JavaScript rendering may be required.` : `${metrics.totalWordCount} visible words extracted.`, status: metrics.hasHydrationRisk ? 'weak_evidence' : metrics.totalWordCount >= 350 ? 'detected' : metrics.totalWordCount > 0 ? 'weak_evidence' : 'not_found' }),
    ];

    const local = [
        makeIndicator({ key: 'local_schema', label: 'Local schema', max: 24, applicability: localApplicability, score: metrics.hasLocalBusinessSchema ? 24 * applicabilityMultiplier(localApplicability) : 0, evidence: metrics.hasLocalBusinessSchema ? 'LocalBusiness-style schema observed.' : 'No local schema observed.', status: metrics.hasLocalBusinessSchema ? 'detected' : localApplicability === 'low' ? 'not_applicable' : 'not_found' }),
        makeIndicator({ key: 'local_footprint', label: 'Local footprint', max: 40, applicability: serviceAreaApplicability, score: metrics.localEvidence.length >= 5 ? 40 * applicabilityMultiplier(serviceAreaApplicability) : metrics.localEvidence.length >= 2 ? 24 * applicabilityMultiplier(serviceAreaApplicability) : 0, evidence: summarize(metrics.localEvidence, 5) || 'No strong local footprint observed.', status: metrics.localEvidence.length >= 5 ? 'detected' : metrics.localEvidence.length >= 2 ? 'weak_evidence' : serviceAreaApplicability === 'low' ? 'not_applicable' : 'not_found' }),
        makeIndicator({ key: 'supporting_pages', label: 'Local support pages', max: 16, applicability: serviceAreaApplicability, score: metrics.localPageCount > 0 ? 16 * applicabilityMultiplier(serviceAreaApplicability) : metrics.servicePageCount > 0 ? 8 * applicabilityMultiplier(serviceAreaApplicability) : 0, evidence: metrics.localPageCount > 0 ? `${metrics.localPageCount} local page(s) observed.` : metrics.servicePageCount > 0 ? `${metrics.servicePageCount} service page(s) observed, but no local page.` : 'No local support page observed.', status: metrics.localPageCount > 0 ? 'detected' : metrics.servicePageCount > 0 ? 'weak_evidence' : serviceAreaApplicability === 'low' ? 'not_applicable' : 'not_found' }),
        makeIndicator({ key: 'identity_local_context', label: 'Identity plus location', max: 20, applicability: serviceAreaApplicability, score: metrics.businessNames.length && metrics.localEvidence.length ? 20 * applicabilityMultiplier(serviceAreaApplicability) : metrics.businessNames.length ? 8 * applicabilityMultiplier(serviceAreaApplicability) : 0, evidence: summarize([...metrics.businessNames, ...metrics.localEvidence], 4) || 'No business-name/local-context cluster observed.', status: metrics.businessNames.length && metrics.localEvidence.length ? 'detected' : serviceAreaApplicability === 'low' ? 'not_applicable' : metrics.businessNames.length ? 'weak_evidence' : 'not_found' }),
    ];

    const answerability = [
        makeIndicator({ key: 'content_richness', label: 'Visible text richness', max: 22, score: metrics.totalWordCount >= 1400 ? 22 : metrics.totalWordCount >= 800 ? 16 : metrics.totalWordCount >= 400 ? 10 : 4, evidence: `${metrics.totalWordCount} visible words extracted.`, status: metrics.totalWordCount >= 800 ? 'detected' : 'weak_evidence' }),
        makeIndicator({ key: 'service_clarity', label: 'Service and offer clarity', max: 26, score: metrics.serviceEvidence.length >= 5 || metrics.servicePageCount > 0 ? 26 : metrics.serviceEvidence.length >= 2 ? 16 : 6, evidence: summarize(metrics.serviceEvidence, 6) || 'Little service or offer language observed.', status: metrics.serviceEvidence.length >= 5 || metrics.servicePageCount > 0 ? 'detected' : metrics.serviceEvidence.length >= 2 ? 'weak_evidence' : 'not_found' }),
        makeIndicator({ key: 'faq_support', label: 'FAQ and direct answers', max: 20, score: metrics.faqCount >= 3 || metrics.hasFaqSchema ? 20 : metrics.hasFaq ? 12 : 0, evidence: metrics.faqCount > 0 ? `${metrics.faqCount} FAQ pair(s) extracted.` : metrics.hasFaqSchema ? 'FAQ schema observed.' : 'No FAQ-like content observed.', status: metrics.faqCount >= 3 || metrics.hasFaqSchema ? 'detected' : metrics.hasFaq ? 'weak_evidence' : 'not_found' }),
        makeIndicator({ key: 'structure', label: 'Heading structure', max: 12, score: metrics.h2Rich ? 12 : metrics.h1.length >= 8 ? 6 : 0, evidence: metrics.h2Rich ? 'At least one strong H2 cluster observed.' : metrics.h1 || 'Very little heading structure observed.', status: metrics.h2Rich ? 'detected' : metrics.h1.length >= 8 ? 'weak_evidence' : 'not_found' }),
        makeIndicator({ key: 'extractable_identity', label: 'Extractable identity cues', max: 20, score: metrics.businessNames.length && metrics.schemaEntities.length ? 20 : metrics.businessNames.length || metrics.schemaEntities.length ? 11 : 0, evidence: summarize(metrics.businessNames, 2) || (metrics.schemaEntities.length ? `${metrics.schemaEntities.length} schema entities observed.` : 'Few identity cues observed.'), status: metrics.businessNames.length && metrics.schemaEntities.length ? 'detected' : metrics.businessNames.length || metrics.schemaEntities.length ? 'weak_evidence' : 'not_found' }),
    ];

    const trust = [
        makeIndicator({ key: 'proof_terms', label: 'Proof and review language', max: 38, score: metrics.trustEvidence.length >= 4 ? 38 : metrics.trustEvidence.length >= 2 ? 24 : metrics.trustEvidence.length >= 1 ? 14 : 0, evidence: summarize(metrics.trustEvidence, 6) || 'No strong trust language observed.', status: metrics.trustEvidence.length >= 4 ? 'detected' : metrics.trustEvidence.length ? 'weak_evidence' : 'not_found' }),
        makeIndicator({ key: 'social_presence', label: 'Public social presence', max: 14, score: metrics.socialLinks.length >= 3 ? 14 : metrics.socialLinks.length >= 1 ? 8 : 0, evidence: summarize(metrics.socialLinks, 3) || 'No social profiles observed.', status: metrics.socialLinks.length ? 'detected' : 'not_found' }),
        makeIndicator({ key: 'support_pages', label: 'About and contact pages', max: 24, score: metrics.aboutPageCount && metrics.contactPageCount ? 24 : metrics.aboutPageCount || metrics.contactPageCount ? 14 : 0, evidence: `${metrics.aboutPageCount} about page(s), ${metrics.contactPageCount} contact page(s).`, status: metrics.aboutPageCount && metrics.contactPageCount ? 'detected' : metrics.aboutPageCount || metrics.contactPageCount ? 'weak_evidence' : 'not_found' }),
        makeIndicator({ key: 'structured_identity', label: 'Structured identity support', max: 24, score: metrics.schemaEntities.length >= 2 ? 24 : metrics.schemaEntities.length >= 1 || metrics.hasLocalBusinessSchema ? 14 : 0, evidence: metrics.schemaEntities.length ? `${metrics.schemaEntities.length} structured entity record(s) observed.` : 'No structured identity record observed.', status: metrics.schemaEntities.length || metrics.hasLocalBusinessSchema ? 'detected' : 'not_found' }),
    ];

    const identity = [
        makeIndicator({ key: 'business_name', label: 'Business name visibility', max: 28, score: metrics.businessNames.length ? 28 : 0, evidence: summarize(metrics.businessNames, 3) || 'No clear business name cluster observed.', status: metrics.businessNames.length ? 'detected' : 'not_found' }),
        makeIndicator({ key: 'contactability', label: 'Phone and email completeness', max: 34, applicability: publicContactApplicability, score: metrics.phones.length && metrics.emails.length ? 34 * applicabilityMultiplier(publicContactApplicability) : metrics.phones.length || metrics.emails.length ? 18 * applicabilityMultiplier(publicContactApplicability) : 0, evidence: summarize([...metrics.phones, ...metrics.emails], 3) || 'No phone or email observed.', status: metrics.phones.length && metrics.emails.length ? 'detected' : metrics.phones.length || metrics.emails.length ? 'weak_evidence' : 'not_found' }),
        makeIndicator({ key: 'business_context', label: 'Business context and services', max: 22, score: metrics.serviceSignals.services?.length >= 3 ? 22 : metrics.serviceSignals.services?.length || metrics.servicePageCount ? 14 : 0, evidence: summarize(metrics.serviceSignals.services || metrics.serviceEvidence, 5) || 'Limited service detail observed.', status: metrics.serviceSignals.services?.length >= 3 ? 'detected' : metrics.serviceSignals.services?.length || metrics.servicePageCount ? 'weak_evidence' : 'not_found' }),
        makeIndicator({ key: 'support_surfaces', label: 'Support identity surfaces', max: 16, score: metrics.contactPageCount && metrics.aboutPageCount ? 16 : metrics.contactPageCount || metrics.aboutPageCount || metrics.socialLinks.length ? 9 : 0, evidence: summarize([metrics.contactPageCount ? `${metrics.contactPageCount} contact page(s)` : '', metrics.aboutPageCount ? `${metrics.aboutPageCount} about page(s)` : '', metrics.socialLinks.length ? `${metrics.socialLinks.length} social link(s)` : ''], 3) || 'Few support identity surfaces observed.', status: metrics.contactPageCount && metrics.aboutPageCount ? 'detected' : metrics.contactPageCount || metrics.aboutPageCount || metrics.socialLinks.length ? 'weak_evidence' : 'not_found' }),
    ];

    return { technical, local, answerability, trust, identity, issues, strengths, localApplicability, serviceAreaApplicability, publicContactApplicability };
}
export function scoreAuditV2(scanResults, providedSiteClassification = null, truthContext = {}) {
    const siteClassification = providedSiteClassification || classifySiteForAudit(scanResults);
    const metrics = collectMetrics(scanResults);
    const automation_data = [];
    const parts = buildDimensionParts(scanResults, metrics, siteClassification);

    if (metrics.phones.length) pushAutomationData(automation_data, 'phone', metrics.phones[0], 'high', 'Crawl');
    if (metrics.emails.length) pushAutomationData(automation_data, 'public_email', metrics.emails[0], 'high', 'Crawl');
    if (metrics.description) pushAutomationData(automation_data, 'short_desc', metrics.description, metrics.description.length >= 70 ? 'high' : 'medium', 'Meta Description');
    if (metrics.socialLinks.length) pushAutomationData(automation_data, 'social_profiles', metrics.socialLinks, 'high', 'Crawl');

    if (!metrics.hasHttps) {
        parts.issues.push(makeIssue({
            title: 'HTTPS is not enforced',
            description: 'The resolved site URL is not HTTPS, which is a trust and indexing risk.',
            severity: 'high',
            priority: 'high',
            category: 'technical',
            dimension: 'technical_seo',
            evidence_summary: scanResultsSafeUrl(scanResults),
            recommended_fix: 'Redirect the main site to HTTPS and align canonical URLs.',
        }));
    } else {
        parts.strengths.push(makeStrength({
            title: 'HTTPS is active',
            description: 'The resolved URL is served over HTTPS.',
            category: 'technical',
            dimension: 'technical_seo',
            evidence_summary: scanResultsSafeUrl(scanResults),
        }));
    }

    if (metrics.hasNoindex) {
        parts.issues.push(makeIssue({
            title: 'Homepage appears to be noindex',
            description: 'A noindex instruction was observed on the homepage, which can suppress visibility.',
            severity: 'high',
            priority: 'high',
            category: 'technical',
            dimension: 'technical_seo',
            evidence_status: 'detected',
            evidence_summary: 'Meta robots noindex was observed on the homepage.',
            recommended_fix: 'Remove noindex from the homepage unless this is an intentional private environment.',
        }));
    } else {
        parts.strengths.push(makeStrength({
            title: 'Homepage is indexable',
            description: 'No homepage noindex directive was observed.',
            category: 'technical',
            dimension: 'technical_seo',
            evidence_summary: 'No noindex signal observed.',
        }));
    }

    if (metrics.title.length < 10) {
        parts.issues.push(makeIssue({
            title: 'Homepage title is missing or too weak',
            description: 'The homepage title is missing or too short, which weakens extractable topic clarity.',
            category: 'technical',
            dimension: 'technical_seo',
            evidence_summary: metrics.title ? `Observed title is too short: "${metrics.title}".` : 'No title tag was observed on the homepage.',
            recommended_fix: 'Add a clear homepage title that names the business and primary offer.',
        }));
    }

    if (metrics.description.length < 35) {
        parts.issues.push(makeIssue({
            title: 'Meta description is missing or too thin',
            description: 'The homepage lacks a strong meta description, reducing concise business context for crawlers and operators.',
            category: 'technical',
            dimension: 'technical_seo',
            evidence_summary: metrics.description ? `Observed description is too short: "${metrics.description}".` : 'No meta description was observed on the homepage.',
            recommended_fix: 'Write a concise summary of the business, service, and local relevance in the meta description.',
        }));
    }

    if (!metrics.h1) {
        parts.issues.push(makeIssue({
            title: 'Homepage H1 is missing or unclear',
            description: 'The homepage does not expose a clear primary heading, which weakens page focus.',
            category: 'technical',
            dimension: 'technical_seo',
            evidence_summary: 'No strong H1 heading was extracted from the homepage.',
            recommended_fix: 'Add a clear H1 that explains who the business helps and what it offers.',
        }));
    }

    if (!metrics.hasCanonical) {
        parts.issues.push(makeIssue({
            title: 'Canonical is not exposed on the homepage',
            description: 'The homepage canonical tag was not observed, which can weaken canonical clarity.',
            severity: 'low',
            priority: 'low',
            category: 'technical',
            dimension: 'technical_seo',
            evidence_summary: 'No canonical tag was observed on the homepage crawl.',
            recommended_fix: 'Add a canonical tag on the homepage and key landing pages.',
        }));
    }

    if (metrics.successCount === 0) {
        parts.issues.push(makeIssue({
            title: 'Crawl coverage is very weak',
            description: 'The audit found little or no usable HTML content, which makes downstream scoring brittle.',
            severity: 'high',
            priority: 'high',
            category: 'technical',
            dimension: 'technical_seo',
            evidence_status: 'weak_evidence',
            evidence_summary: `${metrics.successCount}/${metrics.scannedCount} scanned pages returned usable HTML.`,
            recommended_fix: 'Check routing, blocking, and whether key pages are rendered enough for crawling.',
        }));
    } else if (metrics.successCount >= 2 && metrics.crawlSuccessRate >= 0.5) {
        parts.strengths.push(makeStrength({
            title: 'Crawl reached multiple pages',
            description: 'The audit extracted usable HTML from several pages.',
            category: 'technical',
            dimension: 'technical_seo',
            evidence_summary: `${metrics.successCount}/${metrics.scannedCount} pages returned usable HTML.`,
        }));
    }

    if (metrics.hasHydrationRisk) {
        parts.issues.push(makeIssue({
            title: 'Crawl is seeing thin rendered content',
            description: 'Some pages look heavily hydrated or app-shell-like, so extracted content may under-represent the real page.',
            category: 'technical',
            dimension: 'technical_seo',
            evidence_status: 'weak_evidence',
            evidence_summary: `${metrics.appShellPages} app-shell-like page(s) observed. Hydration hints: ${summarize(metrics.hydrationHints, 3) || 'none'}.`,
            recommended_fix: 'Expose key business copy, headings, and FAQ/service content in rendered HTML where possible.',
        }));
    }

    if (!metrics.phones.length && !metrics.emails.length) {
        parts.issues.push(makeIssue({
            title: 'Public contact information is weak',
            description: 'The crawl did not observe a public phone or email, which weakens recommendation confidence and lead capture.',
            severity: parts.publicContactApplicability === 'high' ? 'high' : 'medium',
            priority: parts.publicContactApplicability === 'high' ? 'high' : 'medium',
            category: 'geo',
            dimension: 'local_readiness',
            evidence_summary: 'No public phone or email was observed in links or visible text.',
            recommended_fix: 'Expose a public phone number and email on the site and in structured data.',
        }));
    } else if (metrics.phones.length && metrics.emails.length) {
        parts.strengths.push(makeStrength({
            title: 'Public contact data is visible',
            description: 'Both phone and email were observed on the site.',
            category: 'geo',
            dimension: 'local_readiness',
            evidence_summary: summarize([...metrics.phones, ...metrics.emails], 3),
        }));
    }

    if (!metrics.hasLocalBusinessSchema && parts.localApplicability !== 'low') {
        parts.issues.push(makeIssue({
            title: 'Local schema is missing for a locally relevant site',
            description: 'The crawl did not observe LocalBusiness-style schema even though the detected site type has local recommendation relevance.',
            severity: parts.localApplicability === 'high' ? 'high' : 'medium',
            priority: parts.localApplicability === 'high' ? 'high' : 'medium',
            category: 'geo',
            dimension: 'local_readiness',
            evidence_summary: 'No LocalBusiness-style schema was observed in JSON-LD.',
            recommended_fix: 'Add schema that exposes the business type, public contact details, and local footprint.',
        }));
    } else if (metrics.hasLocalBusinessSchema) {
        parts.strengths.push(makeStrength({
            title: 'Local schema is present',
            description: 'Structured local business data was observed.',
            category: 'geo',
            dimension: 'local_readiness',
            evidence_summary: 'Observed LocalBusiness-style JSON-LD.',
        }));
    }

    if (metrics.localEvidence.length < 2 && parts.serviceAreaApplicability !== 'low') {
        parts.issues.push(makeIssue({
            title: 'Local service footprint is weak',
            description: 'The site does not clearly expose the cities, regions, address, or service area that support local recommendation use cases.',
            severity: parts.serviceAreaApplicability === 'high' ? 'high' : 'medium',
            priority: parts.serviceAreaApplicability === 'high' ? 'high' : 'medium',
            category: 'geo',
            dimension: 'local_readiness',
            evidence_summary: 'Very little city, region, address, or area-served evidence was observed.',
            recommended_fix: 'Add service-area copy, address or coverage details, and supporting local landing content where relevant.',
        }));
    } else if (metrics.localEvidence.length >= 5) {
        parts.strengths.push(makeStrength({
            title: 'Local footprint is described',
            description: 'The crawl observed useful address or service-area evidence.',
            category: 'geo',
            dimension: 'local_readiness',
            evidence_summary: summarize(metrics.localEvidence, 5),
        }));
    }

    if (metrics.totalWordCount < 400) {
        parts.issues.push(makeIssue({
            title: 'Visible text is too thin for reliable answer extraction',
            description: 'The crawl extracted very little visible text, which reduces confidence in AI-oriented comprehension and Q&A coverage.',
            severity: 'high',
            priority: 'high',
            category: 'content',
            dimension: 'ai_answerability',
            evidence_status: 'weak_evidence',
            evidence_summary: `${metrics.totalWordCount} visible words were extracted across ${metrics.successCount} successful page(s).`,
            recommended_fix: 'Expose more explanatory text about the business, services, differentiators, and common questions in rendered HTML.',
        }));
    } else if (metrics.totalWordCount >= 1400) {
        parts.strengths.push(makeStrength({
            title: 'The site exposes enough visible copy',
            description: 'The crawl extracted a meaningful body of text for downstream understanding.',
            category: 'content',
            dimension: 'ai_answerability',
            evidence_summary: `${metrics.totalWordCount} visible words were extracted.`,
        }));
    }

    if (metrics.serviceEvidence.length < 2 && metrics.servicePageCount === 0) {
        parts.issues.push(makeIssue({
            title: 'Offer clarity is weak',
            description: 'The crawl found too little structured evidence about the primary services, offer, or product value.',
            severity: 'high',
            priority: 'high',
            category: 'content',
            dimension: 'ai_answerability',
            evidence_summary: 'Service and offer signals were sparse across the scanned pages.',
            recommended_fix: 'Clarify the main services, use cases, or product capabilities with dedicated headings and body copy.',
        }));
    } else if (metrics.serviceEvidence.length >= 5 || metrics.servicePageCount > 0) {
        parts.strengths.push(makeStrength({
            title: 'Offer clarity is visible',
            description: 'The crawl found clear service or offer evidence.',
            category: 'content',
            dimension: 'ai_answerability',
            evidence_summary: summarize(metrics.serviceEvidence, 6),
        }));
    }

    if (!metrics.hasFaq) {
        parts.issues.push(makeIssue({
            title: 'No clear FAQ or answer blocks were observed',
            description: 'The site lacks explicit FAQ or Q&A content, which reduces direct-answer readiness for AI surfaces.',
            category: 'content',
            dimension: 'ai_answerability',
            evidence_summary: 'No FAQ schema or visible FAQ/QA pair was observed.',
            recommended_fix: 'Add FAQ or question-led content that answers the most common buyer and local-intent questions.',
        }));
    } else if (metrics.faqCount >= 3 || metrics.hasFaqSchema) {
        parts.strengths.push(makeStrength({
            title: 'FAQ support is present',
            description: 'FAQ or question-led content was observed.',
            category: 'content',
            dimension: 'ai_answerability',
            evidence_summary: metrics.faqCount > 0 ? `${metrics.faqCount} FAQ/QA pair(s) extracted.` : 'FAQ schema was observed.',
        }));
    }

    if (!metrics.trustEvidence.length) {
        parts.issues.push(makeIssue({
            title: 'Trust evidence is weak',
            description: 'The crawl found little visible proof, review, guarantee, or expertise language.',
            category: 'trust',
            dimension: 'trust_signals',
            evidence_summary: 'No strong trust or review language was observed in visible copy.',
            recommended_fix: 'Add testimonials, guarantees, years of experience, certifications, or review references.',
        }));
    } else if (metrics.trustEvidence.length >= 4) {
        parts.strengths.push(makeStrength({
            title: 'Trust language is visible',
            description: 'The site exposes multiple proof or review cues.',
            category: 'trust',
            dimension: 'trust_signals',
            evidence_summary: summarize(metrics.trustEvidence, 6),
        }));
    }

    if (!metrics.socialLinks.length) {
        parts.issues.push(makeIssue({
            title: 'Public trust surfaces are thin',
            description: 'No public social profile links were observed, which can reduce visible trust reinforcement.',
            severity: 'low',
            priority: 'low',
            category: 'trust',
            dimension: 'trust_signals',
            evidence_summary: 'No public social profile links were observed during the crawl.',
            recommended_fix: 'Expose relevant social or trust profiles where they reinforce the business identity.',
        }));
    } else {
        parts.strengths.push(makeStrength({
            title: 'Public social profiles are linked',
            description: 'The crawl observed public social profile links.',
            category: 'trust',
            dimension: 'trust_signals',
            evidence_summary: summarize(metrics.socialLinks, 3),
        }));
    }

    if (!metrics.businessNames.length) {
        parts.issues.push(makeIssue({
            title: 'Business identity is not clearly named',
            description: 'The crawl did not extract a clear business name with confidence.',
            severity: 'high',
            priority: 'high',
            category: 'seo',
            dimension: 'identity_completeness',
            evidence_summary: 'No clear business name cluster was extracted from schema, headings, or page chrome.',
            recommended_fix: 'Expose the business name consistently in schema, headings, and primary site navigation.',
        }));
    } else {
        parts.strengths.push(makeStrength({
            title: 'Business name is visible',
            description: 'The audit extracted a clear business identity signal.',
            category: 'seo',
            dimension: 'identity_completeness',
            evidence_summary: summarize(metrics.businessNames, 3),
        }));
    }

    if (!metrics.phones.length || !metrics.emails.length) {
        parts.issues.push(makeIssue({
            title: metrics.phones.length || metrics.emails.length ? 'Contact information is only partially exposed' : 'Public contact information is missing',
            description: metrics.phones.length || metrics.emails.length ? 'Only one contact channel was clearly observed, which weakens completeness and operational trust.' : 'Neither a public phone number nor a public email was observed on the site.',
            severity: metrics.phones.length || metrics.emails.length ? 'medium' : 'high',
            priority: metrics.phones.length || metrics.emails.length ? 'medium' : 'high',
            category: 'seo',
            dimension: 'identity_completeness',
            evidence_status: metrics.phones.length || metrics.emails.length ? 'weak_evidence' : 'not_found',
            evidence_summary: summarize([...metrics.phones, ...metrics.emails], 3) || 'No public phone or email was observed.',
            recommended_fix: 'Expose both phone and email publicly and keep them consistent with structured data and profile records.',
        }));
    } else {
        parts.strengths.push(makeStrength({
            title: 'Phone and email are both visible',
            description: 'Both primary contact channels were observed.',
            category: 'seo',
            dimension: 'identity_completeness',
            evidence_summary: summarize([...metrics.phones, ...metrics.emails], 3),
        }));
    }

    const dimensions = [
        summarizeDimension('technical_seo', parts.technical, 'high'),
        summarizeDimension('local_readiness', parts.local, parts.localApplicability),
        summarizeDimension('ai_answerability', parts.answerability, 'high'),
        summarizeDimension('trust_signals', parts.trust, 'high'),
        summarizeDimension('identity_completeness', parts.identity, parts.publicContactApplicability),
    ];

    const dimensionByKey = Object.fromEntries(dimensions.map((dimension) => [dimension.key, dimension]));
    const deterministic_score = Math.round(
        (dimensionByKey.technical_seo.score * siteClassification.weight_profile.technical_seo)
        + (dimensionByKey.local_readiness.score * siteClassification.weight_profile.local_readiness)
        + (dimensionByKey.ai_answerability.score * siteClassification.weight_profile.ai_answerability)
        + (dimensionByKey.trust_signals.score * siteClassification.weight_profile.trust_signals)
        + (dimensionByKey.identity_completeness.score * siteClassification.weight_profile.identity_completeness)
    );

    const sharedBreakdown = {
        methodology: {
            type: 'deterministic_site_type_aware',
            notes: [
                'Scores are derived from observed crawl evidence and deterministic rules.',
                'Local expectations are adjusted by detected site type and applicability.',
                'Missing local signals are softened when local relevance is low.',
            ],
        },
        site_classification: {
            type: siteClassification.type,
            label: siteClassification.label,
            confidence: siteClassification.confidence,
            reasons: siteClassification.reasons || [],
            applicability: siteClassification.applicability || {},
            weight_profile: siteClassification.weight_profile || {},
            evidence_summary: siteClassification.evidence_summary || [],
        },
        overall: {
            deterministic_score,
            score_label: `${deterministic_score}/100`,
        },
        dimensions,
    };

    const normalizedIssues = normalizeAuditProblems(sortIssues(parts.issues), {
        auditId: truthContext.auditId || null,
        clientId: truthContext.clientId || null,
        sourceUrl: truthContext.sourceUrl || scanResults?.resolved_url || scanResults?.source_url || null,
    });

    return {
        seo_score: dimensionByKey.technical_seo.score,
        geo_score: dimensionByKey.local_readiness.score,
        deterministic_score,
        score_dimensions: dimensions,
        site_classification: siteClassification,
        seo_breakdown: {
            ...sharedBreakdown,
            summary: {
                score: dimensionByKey.technical_seo.score,
                label: 'Technical SEO',
                description: DIMENSION_META.technical_seo.description,
            },
        },
        geo_breakdown: {
            ...sharedBreakdown,
            summary: {
                score: dimensionByKey.local_readiness.score,
                label: 'Local / GEO readiness',
                description: DIMENSION_META.local_readiness.description,
            },
        },
        breakdown: {
            technical_seo: { score: dimensionByKey.technical_seo.score, max: 100 },
            local_readiness: { score: dimensionByKey.local_readiness.score, max: 100 },
            ai_answerability: { score: dimensionByKey.ai_answerability.score, max: 100 },
            trust_signals: { score: dimensionByKey.trust_signals.score, max: 100 },
            identity_completeness: { score: dimensionByKey.identity_completeness.score, max: 100 },
            overall: { score: deterministic_score, max: 100 },
            site_classification: {
                type: siteClassification.type,
                label: siteClassification.label,
                confidence: siteClassification.confidence,
            },
        },
        issues: normalizedIssues,
        strengths: sortStrengths(parts.strengths),
        automation_data,
    };
}
