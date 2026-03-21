import 'server-only';

import * as db from '@/lib/db';
import { getNotConnectedMeta, getProvenanceMeta } from '@/lib/operator-intelligence/provenance';

const REDDIT_SEARCH_ENDPOINT = 'https://www.reddit.com/search.json';
const REDDIT_TIMEOUT_MS = 9000;
const MAX_QUERY_SEEDS = 5;
const MAX_POSTS_PER_QUERY = 20;

const COMPLAINT_TERMS = [
    'slow', 'expensive', 'problem', 'issue', 'broken', 'hate', 'frustrat', 'bad', 'worst',
    'delay', 'bug', 'support', 'cancel', 'refund', 'spam', 'scam',
    'cher', 'lent', 'probleme', 'pire', 'decu', 'mauvais', 'arnaque', 'retard',
];

const QUESTION_HINTS = ['how', 'what', 'why', 'which', 'where', 'best', 'combien', 'comment', 'pourquoi', 'quel'];
const COMPETITOR_HINTS = ['vs', 'versus', 'alternative', 'alternatives', 'instead of', 'comparer', 'compare'];
const STOPWORDS = new Set([
    'the', 'and', 'for', 'with', 'from', 'this', 'that', 'have', 'has', 'your', 'about', 'their', 'there', 'into', 'when', 'where', 'what',
    'les', 'des', 'pour', 'avec', 'dans', 'plus', 'tout', 'tous', 'chez', 'entre', 'sur', 'une', 'que', 'qui', 'est', 'sont', 'aux', 'par',
    'how', 'why', 'what', 'which', 'best', 'near', 'from', 'site', 'service', 'business', 'company',
]);

function normalizeText(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenize(value) {
    return normalizeText(value)
        .split(' ')
        .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function evidenceLevel(count) {
    if (count >= 8) return 'strong';
    if (count >= 4) return 'medium';
    return 'low';
}

function buildSeedQueries(client) {
    const clientName = String(client?.client_name || '').trim();
    const businessType = String(client?.business_type || '').trim();
    const city = String(client?.address?.city || client?.target_region || '').trim();

    const seeds = [
        `${clientName} ${city}`.trim(),
        `${businessType} ${city}`.trim(),
        `${businessType} problem`.trim(),
        `${businessType} recommendation ${city}`.trim(),
        `${clientName} alternatives`.trim(),
    ].filter(Boolean);

    return [...new Set(seeds)].slice(0, MAX_QUERY_SEEDS);
}

async function fetchJsonWithTimeout(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REDDIT_TIMEOUT_MS);
    try {
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            signal: controller.signal,
            headers: {
                'User-Agent': 'TrouvableSocialIntel/1.0 (+https://trouvable.ca)',
                Accept: 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    } finally {
        clearTimeout(timeout);
    }
}

function normalizeRedditPost(item, seedQuery) {
    const node = item?.data || {};
    return {
        id: node.id || null,
        title: String(node.title || '').trim(),
        body: String(node.selftext || '').trim(),
        subreddit: String(node.subreddit || '').trim(),
        ups: Number(node.ups || 0),
        created_at: node.created_utc ? new Date(node.created_utc * 1000).toISOString() : null,
        permalink: node.permalink ? `https://www.reddit.com${node.permalink}` : null,
        seed_query: seedQuery,
    };
}

function aggregateByLabel(rows = []) {
    const byLabel = new Map();
    for (const row of rows) {
        const label = String(row.label || '').trim();
        if (!label) continue;
        if (!byLabel.has(label)) {
            byLabel.set(label, {
                label,
                count: 0,
                subreddits: new Set(),
                example: row.example || null,
            });
        }
        const bucket = byLabel.get(label);
        bucket.count += Number(row.count || 1);
        if (row.subreddit) bucket.subreddits.add(row.subreddit);
        if (!bucket.example && row.example) bucket.example = row.example;
    }
    return [...byLabel.values()]
        .map((item) => ({
            label: item.label,
            count: item.count,
            evidence_level: evidenceLevel(item.count),
            subreddits: [...item.subreddits].slice(0, 4),
            example: item.example,
        }))
        .sort((a, b) => b.count - a.count);
}

function buildQuestionSignals(posts) {
    const rows = [];
    for (const post of posts) {
        const title = String(post.title || '').trim();
        if (!title) continue;
        const lowerTitle = title.toLowerCase();
        const looksLikeQuestion = title.includes('?') || QUESTION_HINTS.some((hint) => lowerTitle.includes(`${hint} `));
        if (!looksLikeQuestion) continue;
        rows.push({
            label: title.replace(/\?+$/, '?'),
            subreddit: post.subreddit,
            example: post.permalink,
        });
    }
    return aggregateByLabel(rows).slice(0, 10);
}

function buildComplaintSignals(posts) {
    const rows = [];
    for (const post of posts) {
        const merged = `${post.title} ${post.body}`.toLowerCase();
        const hasComplaintTerm = COMPLAINT_TERMS.some((term) => merged.includes(term));
        if (!hasComplaintTerm) continue;
        const label = post.title || merged.slice(0, 120);
        rows.push({
            label,
            subreddit: post.subreddit,
            example: post.permalink,
        });
    }
    return aggregateByLabel(rows).slice(0, 10);
}

function buildThemeSignals(posts) {
    const counts = new Map();
    for (const post of posts) {
        for (const token of tokenize(`${post.title} ${post.body}`)) {
            counts.set(token, (counts.get(token) || 0) + 1);
        }
    }
    return [...counts.entries()]
        .filter(([, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([label, count]) => ({
            label,
            count,
            evidence_level: evidenceLevel(count),
        }));
}

function buildCommunityLanguage(posts) {
    const rows = posts
        .map((post) => ({
            label: post.title,
            count: 1 + Math.min(Math.floor((post.ups || 0) / 10), 4),
            subreddit: post.subreddit,
            example: post.permalink,
        }))
        .filter((row) => row.label && row.label.length >= 12);

    return aggregateByLabel(rows).slice(0, 8);
}

function buildSourceBuckets(posts) {
    const counts = new Map();
    for (const post of posts) {
        const subreddit = post.subreddit || 'unknown';
        counts.set(subreddit, (counts.get(subreddit) || 0) + 1);
    }
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([source, count]) => ({
            source: `r/${source}`,
            count,
            evidence_level: evidenceLevel(count),
        }));
}

function buildCompetitorComplaints(posts, clientName = '') {
    const rows = [];
    const clientNameLower = String(clientName || '').toLowerCase();
    for (const post of posts) {
        const merged = `${post.title} ${post.body}`.toLowerCase();
        const competitorFraming = COMPETITOR_HINTS.some((hint) => merged.includes(hint));
        const complaintFraming = COMPLAINT_TERMS.some((term) => merged.includes(term));
        if (!competitorFraming || !complaintFraming) continue;
        const referencesClient = clientNameLower && merged.includes(clientNameLower);
        rows.push({
            label: post.title,
            subreddit: post.subreddit,
            example: post.permalink,
            count: referencesClient ? 2 : 1,
        });
    }
    return aggregateByLabel(rows).slice(0, 8);
}

function buildFaqOpportunities(questionSignals) {
    return (questionSignals || []).slice(0, 6).map((item) => ({
        title: `FAQ: ${item.label}`,
        rationale: 'Inferred from recurring community question patterns.',
        evidence_level: item.evidence_level,
        mention_count: item.count,
        provenance: getProvenanceMeta('inferred'),
    }));
}

function buildContentOpportunities(themeSignals, complaintSignals) {
    const entries = [];
    for (const theme of (themeSignals || []).slice(0, 4)) {
        entries.push({
            title: `Content angle: ${theme.label}`,
            rationale: 'Inferred from recurring external discussion themes.',
            evidence_level: theme.evidence_level,
            mention_count: theme.count,
            provenance: getProvenanceMeta('inferred'),
        });
    }
    for (const complaint of (complaintSignals || []).slice(0, 3)) {
        entries.push({
            title: `Address concern: ${complaint.label}`,
            rationale: 'Inferred from recurring complaint language in discussions.',
            evidence_level: complaint.evidence_level,
            mention_count: complaint.count,
            provenance: getProvenanceMeta('inferred'),
        });
    }
    return entries.slice(0, 8);
}

function buildDifferentiationAngles(complaintSignals) {
    return (complaintSignals || []).slice(0, 6).map((item) => ({
        title: `Differentiation angle: solve "${item.label}"`,
        rationale: 'Inferred from complaint patterns where operators can position a stronger offer.',
        evidence_level: item.evidence_level,
        mention_count: item.count,
        provenance: getProvenanceMeta('inferred'),
    }));
}

function buildNotConnectedSlice(client, seedQueries) {
    return {
        provenance: {
            observation: getProvenanceMeta('observed'),
            inferred: getProvenanceMeta('inferred'),
            not_connected: getNotConnectedMeta(),
        },
        connection: {
            status: 'not_connected',
            connector: 'reddit',
            message: 'External social connector is not enabled in this environment.',
            requirement: 'Set SOCIAL_REDDIT_CONNECTOR=1 to enable Reddit discussion ingestion.',
        },
        summary: {
            generated_at: new Date().toISOString(),
            total_discussions: 0,
            unique_sources: 0,
            site_context: {
                client_name: client?.client_name || null,
                business_type: client?.business_type || null,
                city: client?.address?.city || client?.target_region || null,
            },
            query_seeds: seedQueries,
        },
        topComplaints: [],
        topQuestions: [],
        topThemes: [],
        sourceBuckets: [],
        competitorComplaints: [],
        communityLanguage: [],
        faqOpportunities: [],
        contentOpportunities: [],
        differentiationAngles: [],
        emptyState: {
            title: 'Social listening not connected',
            description: 'No external discussion feed is currently connected. Nothing here is fabricated.',
        },
    };
}

export async function getSocialSlice(clientId) {
    const client = await db.getClientById(clientId).catch(() => null);
    const seedQueries = buildSeedQueries(client);
    const connectorEnabled = process.env.SOCIAL_REDDIT_CONNECTOR === '1';

    if (!connectorEnabled) {
        return buildNotConnectedSlice(client, seedQueries);
    }

    let posts = [];
    let connectionError = null;

    try {
        const batches = await Promise.all(
            seedQueries.map(async (query) => {
                const url = `${REDDIT_SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}&sort=top&t=year&limit=${MAX_POSTS_PER_QUERY}&raw_json=1`;
                const json = await fetchJsonWithTimeout(url);
                const children = json?.data?.children || [];
                return children.map((item) => normalizeRedditPost(item, query)).filter((post) => post.id && post.title);
            })
        );

        const dedupe = new Map();
        for (const row of batches.flat()) {
            if (!dedupe.has(row.id)) dedupe.set(row.id, row);
        }
        posts = [...dedupe.values()];
    } catch (error) {
        connectionError = error?.message || 'Failed to fetch Reddit data';
    }

    if (connectionError) {
        return {
            ...buildNotConnectedSlice(client, seedQueries),
            connection: {
                status: 'error',
                connector: 'reddit',
                message: 'Connector attempted but failed.',
                detail: connectionError,
            },
        };
    }

    const topQuestions = buildQuestionSignals(posts);
    const topComplaints = buildComplaintSignals(posts);
    const topThemes = buildThemeSignals(posts);
    const sourceBuckets = buildSourceBuckets(posts);
    const competitorComplaints = buildCompetitorComplaints(posts, client?.client_name || '');
    const communityLanguage = buildCommunityLanguage(posts);
    const faqOpportunities = buildFaqOpportunities(topQuestions);
    const contentOpportunities = buildContentOpportunities(topThemes, topComplaints);
    const differentiationAngles = buildDifferentiationAngles(topComplaints);

    return {
        provenance: {
            observation: getProvenanceMeta('observed'),
            inferred: getProvenanceMeta('inferred'),
            not_connected: getNotConnectedMeta(),
        },
        connection: {
            status: 'connected',
            connector: 'reddit',
            message: 'Observed externally from Reddit search snapshots.',
            caveat: 'Coverage is limited to tracked query seeds and not universal social monitoring.',
        },
        summary: {
            generated_at: new Date().toISOString(),
            total_discussions: posts.length,
            unique_sources: sourceBuckets.length,
            query_seeds: seedQueries,
            site_context: {
                client_name: client?.client_name || null,
                business_type: client?.business_type || null,
                city: client?.address?.city || client?.target_region || null,
            },
        },
        topComplaints,
        topQuestions,
        topThemes,
        sourceBuckets,
        competitorComplaints,
        communityLanguage,
        faqOpportunities,
        contentOpportunities,
        differentiationAngles,
        emptyState: {
            title: 'No external discussions found',
            description: 'Connector is active but no matching discussions were observed for the current seed set.',
        },
    };
}
