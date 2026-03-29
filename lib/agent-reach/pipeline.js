import 'server-only';

import crypto from 'crypto';

import { resolveBusinessType } from '@/lib/ai/business-type-resolver';
import * as db from '@/lib/db';
import {
    insertCollectionRun,
    updateCollectionRun,
    upsertDocuments,
    listDocuments,
    markDocumentsProcessed,
    insertMentions,
    deleteMentionsForDocuments,
    upsertClusters,
    clearClusters,
    upsertOpportunities,
} from '@/lib/db/community';
import { evidenceLevel } from '@/lib/agent-reach/contracts';

// ──────────────────────────────────────────────────────────────
// Reddit collector constants
// ──────────────────────────────────────────────────────────────

const REDDIT_SEARCH_ENDPOINT = 'https://www.reddit.com/search.json';
const REDDIT_TIMEOUT_MS = 9000;
const MAX_QUERY_SEEDS = 5;
const MAX_POSTS_PER_QUERY = 20;

// ──────────────────────────────────────────────────────────────
// Text analysis constants (from social.js — canonical copies)
// ──────────────────────────────────────────────────────────────

const COMPLAINT_TERMS = [
    'slow', 'expensive', 'problem', 'issue', 'broken', 'hate', 'frustrat', 'bad', 'worst',
    'delay', 'bug', 'support', 'cancel', 'refund', 'spam', 'scam',
    'cher', 'lent', 'probleme', 'pire', 'decu', 'mauvais', 'arnaque', 'retard',
];

const QUESTION_HINTS = ['how', 'what', 'why', 'which', 'where', 'best', 'combien', 'comment', 'pourquoi', 'quel'];
const COMPETITOR_HINTS = ['vs', 'versus', 'alternative', 'alternatives', 'instead of', 'comparer', 'compare'];
const STOPWORDS = new Set([
    // English function words & generic terms
    'the', 'and', 'for', 'with', 'from', 'this', 'that', 'have', 'has', 'your', 'about', 'their', 'there', 'into',
    'when', 'where', 'what', 'how', 'why', 'which', 'best', 'near', 'been', 'being', 'were', 'will', 'would',
    'could', 'should', 'just', 'also', 'like', 'even', 'only', 'very', 'really', 'much', 'more', 'most', 'some',
    'many', 'than', 'then', 'them', 'they', 'these', 'those', 'such', 'each', 'every', 'other', 'another',
    'same', 'here', 'well', 'still', 'back', 'after', 'before', 'over', 'under', 'between', 'through', 'during',
    'because', 'since', 'while', 'though', 'although', 'until', 'unless', 'however', 'therefore', 'actually',
    'know', 'think', 'feel', 'want', 'need', 'make', 'take', 'give', 'come', 'going', 'does', 'done', 'doing',
    'thing', 'things', 'something', 'anything', 'everything', 'nothing', 'someone', 'anyone', 'everyone',
    'people', 'person', 'place', 'places', 'time', 'times', 'year', 'years', 'day', 'days', 'way', 'ways',
    'case', 'point', 'part', 'kind', 'type', 'sort', 'lot', 'lots', 'bit', 'stuff', 'area', 'around',
    'work', 'working', 'works', 'used', 'using', 'use', 'look', 'looking', 'looks', 'good', 'great',
    'right', 'said', 'say', 'says', 'told', 'tell', 'get', 'got', 'getting', 'pretty', 'literally',
    'too', 'but', 'not', 'out', 'its', 'can', 'had', 'was', 'are', 'all', 'you', 'now', 'new', 'old',
    'own', 'may', 'try', 'yes', 'per', 'put', 'end', 'big', 'long', 'real', 'able', 'sure', 'keep', 'help',
    'post', 'read', 'edit', 'link', 'thread', 'comment', 'reddit', 'subreddit', 'upvote', 'downvote',
    'site', 'service', 'business', 'company',
    // French function words & generic terms
    'les', 'des', 'pour', 'avec', 'dans', 'plus', 'tout', 'tous', 'chez', 'entre', 'sur', 'une', 'que',
    'qui', 'est', 'sont', 'aux', 'par', 'pas', 'mais', 'aussi', 'bien', 'fait', 'faire', 'peut', 'comme',
    'etre', 'avoir', 'tres', 'peu', 'bon', 'elle', 'elles', 'ils', 'nous', 'vous', 'leur', 'ses', 'son',
    'mon', 'mes', 'nos', 'vos', 'cela', 'ceci', 'celui', 'cette', 'ces', 'dont', 'donc', 'car', 'parce',
    'encore', 'deja', 'toujours', 'jamais', 'rien', 'quelque', 'autre', 'autres', 'meme', 'tant', 'assez',
    'gens', 'chose', 'choses', 'truc', 'trucs', 'moment', 'fois', 'jour', 'jours', 'temps', 'annee',
]);

// Minimum relevance score for a theme cluster to be displayed
export const THEME_RELEVANCE_THRESHOLD = 0.15;

// Relevance scoring weights:
// - TOKEN_MATCH_SCORE: awarded per anchor token found in the label
// - BIGRAM_EXACT_BONUS: extra bonus when a multi-word label exactly matches an anchor
// - PARTIAL_MATCH_SCORE: awarded for substring anchor matches (compound words)
// - MAX_RELEVANCE_SCORE: cap to prevent runaway scores
// Cluster score formula: mention_count × (1 + relevance), so relevance amplifies
// frequency but never replaces it. Zero-relevance themes are filtered out entirely.
const TOKEN_MATCH_SCORE = 0.5;
const BIGRAM_EXACT_BONUS = 0.5;
const PARTIAL_MATCH_SCORE = 0.3;
const MAX_RELEVANCE_SCORE = 2.0;
const MIN_PARTIAL_MATCH_LENGTH = 4;

// ──────────────────────────────────────────────────────────────
// Text helpers
// ──────────────────────────────────────────────────────────────

function normalizeText(value) {
    return String(value || '')
        .toLowerCase()
        // Strip diacritics so accented text matches anchors (e.g. Montréal → montreal)
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenize(value) {
    return normalizeText(value)
        .split(' ')
        .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function extractBigrams(tokens) {
    const bigrams = [];
    for (let i = 0; i < tokens.length - 1; i++) {
        bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
    }
    return bigrams;
}

// ──────────────────────────────────────────────────────────────
// Client-context relevance scoring
// ──────────────────────────────────────────────────────────────

const INDUSTRY_VOCAB = {
    seo: ['seo', 'referencement', 'serp', 'ranking', 'rank', 'indexation', 'crawl', 'sitemap', 'backlink', 'backlinks', 'meta', 'metadata', 'schema', 'keyword', 'keywords', 'organic', 'search', 'optimization', 'optimisation'],
    geo: ['geo', 'local', 'localisation', 'maps', 'google-maps', 'google-business', 'gmb', 'fiche', 'annuaire', 'directory', 'listing', 'listings', 'geolocation', 'geolocalisation', 'proximite'],
    ai: ['ia', 'intelligence-artificielle', 'llm', 'gpt', 'chatgpt', 'gemini', 'mistral', 'openai', 'ai-overview', 'ai-overviews', 'citation', 'citations', 'generative', 'prompt', 'rag'],
    marketing: ['marketing', 'visibilite', 'visibility', 'branding', 'strategie', 'acquisition', 'conversion', 'leads', 'inbound', 'outbound', 'content', 'contenu', 'campagne', 'campaign'],
    agency: ['agence', 'agency', 'consultant', 'consulting', 'freelance', 'prestataire', 'cabinet', 'firme', 'firm', 'studio', 'expert', 'expertise'],
    web: ['web', 'website', 'site-web', 'digital', 'numerique', 'online', 'ligne', 'internet', 'app', 'application', 'plateforme', 'platform'],
};

const INTENT_VOCAB = [
    'recommandation', 'recommendation', 'recommander', 'recommend',
    'alternative', 'alternatives', 'compare', 'comparer', 'comparison', 'comparaison',
    'meilleur', 'meilleure', 'meilleurs', 'meilleures',
    'avis', 'review', 'reviews', 'opinion', 'opinions', 'temoignage',
    'prix', 'tarif', 'tarifs', 'pricing', 'cost', 'cout', 'devis', 'quote',
    'probleme', 'problem', 'issue', 'issues', 'erreur', 'error', 'bug',
    'question', 'questions', 'aide', 'help', 'support',
];

export function buildRelevanceAnchors(client) {
    const anchors = new Set();
    const clientName = normalizeText(client?.client_name || '');
    const rawBusinessType = normalizeText(client?.business_type || '');
    const city = normalizeText(client?.address?.city || client?.target_region || '');

    // Resolve richer context when raw business_type is weak
    const siteClassification = client?.site_classification || {};
    const resolved = resolveBusinessType(
        String(client?.business_type || '').trim(),
        siteClassification,
        String(client?.client_name || '').trim(),
    );
    const resolvedCategory = normalizeText(resolved.canonical_category || '');
    const resolvedOffering = normalizeText(resolved.offering_anchor || '');

    // Entity anchors — client name tokens
    for (const token of clientName.split(' ').filter(Boolean)) {
        if (token.length >= 2) anchors.add(token);
    }

    // Location anchors
    for (const token of city.split(' ').filter(Boolean)) {
        if (token.length >= 2) anchors.add(token);
    }

    // Business type anchors — combine raw + resolved
    const combinedBusinessText = `${rawBusinessType} ${resolvedCategory} ${resolvedOffering}`;
    for (const token of combinedBusinessText.split(' ').filter(Boolean)) {
        if (token.length >= 2 && !STOPWORDS.has(token)) anchors.add(token);
    }

    // Industry vocabulary — match relevant industries from combined context
    const contextHay = combinedBusinessText.toLowerCase();
    for (const vocab of Object.values(INDUSTRY_VOCAB)) {
        for (const term of vocab) {
            if (contextHay.includes(term) || clientName.includes(term)) {
                vocab.forEach((v) => anchors.add(v));
                break;
            }
        }
    }

    // Always include intent vocab as weak anchors (scored lower)
    // and industry-agnostic anchors
    for (const term of INTENT_VOCAB) {
        anchors.add(term);
    }

    // If business_type is weak/unknown, add safe cross-industry fallbacks
    if (!rawBusinessType || rawBusinessType.length < 3) {
        for (const vocab of Object.values(INDUSTRY_VOCAB)) {
            vocab.forEach((v) => anchors.add(v));
        }
    }

    return anchors;
}

export function scoreThemeRelevance(label, anchors) {
    if (!label || !anchors?.size) return 0;
    const normalized = normalizeText(label);
    const tokens = normalized.split(' ').filter(Boolean);

    let score = 0;

    // Exact full-label match bonus — only for multi-word labels
    if (tokens.length > 1 && anchors.has(normalized)) {
        score += BIGRAM_EXACT_BONUS;
    }

    // Token-level matches
    for (const token of tokens) {
        if (anchors.has(token)) {
            score += TOKEN_MATCH_SCORE;
        }
    }

    // Substring/partial matching for compound words or aliases.
    // Skip tokens already counted above to avoid double-scoring the same match.
    for (const anchor of anchors) {
        if (anchor.length >= MIN_PARTIAL_MATCH_LENGTH && normalized.includes(anchor) && !tokens.includes(anchor)) {
            score += PARTIAL_MATCH_SCORE;
        }
    }

    return Math.min(score, MAX_RELEVANCE_SCORE);
}

function dedupeHash(source, externalId, title) {
    const raw = `${source}:${externalId || ''}:${(title || '').trim().toLowerCase().slice(0, 120)}`;
    return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 40);
}

// ──────────────────────────────────────────────────────────────
// Stage 1 — Seed generation
// ──────────────────────────────────────────────────────────────

export function buildSeedQueries(client) {
    const clientName = String(client?.client_name || '').trim();
    const rawBusinessType = String(client?.business_type || '').trim();
    const city = String(client?.address?.city || client?.target_region || '').trim();

    // Resolve richer context when raw business_type is weak
    const siteClassification = client?.site_classification || {};
    const resolved = resolveBusinessType(rawBusinessType, siteClassification, clientName);
    const categoryLabel = resolved.canonical_category && resolved.canonical_category !== 'unknown'
        ? resolved.canonical_category.replace(/_/g, ' ')
        : '';
    const offeringAnchor = String(resolved.offering_anchor || '').trim();

    // Pick the strongest business descriptor available
    const businessDesc = offeringAnchor || categoryLabel || rawBusinessType;

    const seeds = [
        clientName && city ? `${clientName} ${city}` : '',
        businessDesc && city ? `${businessDesc} ${city}` : '',
        businessDesc ? `${businessDesc} recommandation ${city}`.trim() : '',
        clientName ? `${clientName} avis` : '',
        clientName ? `${clientName} alternatives` : '',
    ].map((s) => s.trim()).filter(Boolean);

    return [...new Set(seeds)].slice(0, MAX_QUERY_SEEDS);
}

// ──────────────────────────────────────────────────────────────
// Stage 2 — Collect (Reddit)
// ──────────────────────────────────────────────────────────────

async function fetchJsonWithTimeout(url) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REDDIT_TIMEOUT_MS);
    try {
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'follow',
            signal: controller.signal,
            headers: {
                'User-Agent': 'TrouvableSocialIntel/1.0 (+https://www.trouvable.app)',
                Accept: 'application/json',
            },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } finally {
        clearTimeout(timeout);
    }
}

async function collectRedditPosts(seedQueries) {
    const batches = await Promise.all(
        seedQueries.map(async (query) => {
            const url = `${REDDIT_SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}&sort=top&t=year&limit=${MAX_POSTS_PER_QUERY}&raw_json=1`;
            try {
                const json = await fetchJsonWithTimeout(url);
                const children = json?.data?.children || [];
                return children
                    .map((item) => {
                        const node = item?.data || {};
                        return {
                            id: node.id || null,
                            title: String(node.title || '').trim(),
                            body: String(node.selftext || '').trim(),
                            subreddit: String(node.subreddit || '').trim(),
                            ups: Number(node.ups || 0),
                            created_at: node.created_utc ? new Date(node.created_utc * 1000).toISOString() : null,
                            permalink: node.permalink ? `https://www.reddit.com${node.permalink}` : null,
                            seed_query: query,
                        };
                    })
                    .filter((post) => post.id && post.title);
            } catch {
                return [];
            }
        })
    );

    const dedupe = new Map();
    for (const post of batches.flat()) {
        if (!dedupe.has(post.id)) dedupe.set(post.id, post);
    }
    return [...dedupe.values()];
}

// ──────────────────────────────────────────────────────────────
// Stage 3 — Normalize & persist documents
// ──────────────────────────────────────────────────────────────

function toDocumentRows(rawPosts, clientId, collectionRunId) {
    return rawPosts.map((post) => ({
        client_id: clientId,
        collection_run_id: collectionRunId,
        source: 'reddit',
        external_id: post.id,
        url: post.permalink || null,
        title: post.title,
        body: post.body || null,
        author: null,
        published_at: post.created_at || null,
        source_metadata: { subreddit: post.subreddit, ups: post.ups },
        normalized_content: normalizeText(`${post.title} ${post.body}`),
        language: 'fr',
        engagement_score: Math.min(post.ups || 0, 9999),
        seed_query: post.seed_query || null,
        dedupe_hash: dedupeHash('reddit', post.id, post.title),
        is_processed: false,
    }));
}

// ──────────────────────────────────────────────────────────────
// Stage 4 — Enrich: extract mentions from unprocessed documents
// ──────────────────────────────────────────────────────────────

export function extractMentionsFromDocuments(documents, clientId, relevanceAnchors = new Set()) {
    const mentions = [];

    for (const doc of documents) {
        const merged = `${doc.title || ''} ${doc.body || ''}`;
        const mergedLower = merged.toLowerCase();
        const titleLower = (doc.title || '').toLowerCase();

        // Question signals
        const looksLikeQuestion = (doc.title || '').includes('?') || QUESTION_HINTS.some((h) => titleLower.includes(`${h} `));
        if (looksLikeQuestion) {
            mentions.push({
                client_id: clientId,
                document_id: doc.id,
                mention_type: 'question',
                label: (doc.title || '').replace(/\?+$/, '?'),
                snippet: merged.slice(0, 300),
                evidence_level: 'low',
                provenance: 'observed',
                source: doc.source,
            });
        }

        // Complaint signals
        const hasComplaint = COMPLAINT_TERMS.some((term) => mergedLower.includes(term));
        if (hasComplaint) {
            mentions.push({
                client_id: clientId,
                document_id: doc.id,
                mention_type: 'complaint',
                label: doc.title || mergedLower.slice(0, 120),
                snippet: merged.slice(0, 300),
                evidence_level: 'low',
                provenance: 'observed',
                source: doc.source,
            });
        }

        // Competitor signals
        const hasCompetitor = COMPETITOR_HINTS.some((h) => mergedLower.includes(h));
        if (hasCompetitor && hasComplaint) {
            mentions.push({
                client_id: clientId,
                document_id: doc.id,
                mention_type: 'competitor',
                label: doc.title || '',
                snippet: merged.slice(0, 300),
                evidence_level: 'low',
                provenance: 'observed',
                source: doc.source,
            });
        }

        // Theme tokens — only emit if relevance meets the threshold.
        // A simple > 0 check is too permissive because intent vocab (help, support,
        // problem…) is always included as anchors and would match many irrelevant
        // documents. Requiring >= THEME_RELEVANCE_THRESHOLD ensures only genuinely
        // business-relevant tokens become theme mentions.
        const tokens = tokenize(merged);
        for (const token of tokens) {
            const relevance = scoreThemeRelevance(token, relevanceAnchors);
            if (relevance >= THEME_RELEVANCE_THRESHOLD) {
                mentions.push({
                    client_id: clientId,
                    document_id: doc.id,
                    mention_type: 'theme',
                    label: token,
                    snippet: null,
                    evidence_level: 'low',
                    provenance: 'derived',
                    source: doc.source,
                });
            }
        }

        // Bigram theme candidates — phrase-level signals.
        // Same threshold applies: bigrams need real relevance, not just one
        // weak intent-vocab match from a constituent token.
        const bigrams = extractBigrams(tokens);
        for (const bigram of bigrams) {
            const relevance = scoreThemeRelevance(bigram, relevanceAnchors);
            if (relevance >= THEME_RELEVANCE_THRESHOLD) {
                mentions.push({
                    client_id: clientId,
                    document_id: doc.id,
                    mention_type: 'theme',
                    label: bigram,
                    snippet: null,
                    evidence_level: 'low',
                    provenance: 'derived',
                    source: doc.source,
                });
            }
        }

        // Language signals — high-engagement titles
        const engagement = doc.engagement_score || 0;
        if ((doc.title || '').length >= 12 && engagement >= 5) {
            mentions.push({
                client_id: clientId,
                document_id: doc.id,
                mention_type: 'language',
                label: doc.title,
                snippet: merged.slice(0, 300),
                evidence_level: 'low',
                provenance: 'observed',
                source: doc.source,
            });
        }
    }

    return mentions;
}

// ──────────────────────────────────────────────────────────────
// Stage 5 — Cluster: aggregate mentions into clusters
// ──────────────────────────────────────────────────────────────

export function aggregateMentionsToClusters(mentions, clientId, relevanceAnchors = new Set()) {
    const TYPE_TO_CLUSTER = {
        complaint: 'complaint',
        question: 'question',
        theme: 'theme',
        competitor: 'competitor_complaint',
        language: 'language',
    };

    const buckets = new Map();

    for (const mention of mentions) {
        const clusterType = TYPE_TO_CLUSTER[mention.mention_type];
        if (!clusterType) continue;
        const key = `${clusterType}::${mention.label}`;
        if (!buckets.has(key)) {
            buckets.set(key, {
                client_id: clientId,
                cluster_type: clusterType,
                label: mention.label,
                mention_count: 0,
                sources: new Set(),
                example_url: null,
                example_snippet: null,
                last_seen_at: null,
                metadata: {},
            });
        }
        const bucket = buckets.get(key);
        bucket.mention_count += 1;
        if (mention.source) bucket.sources.add(mention.source);
        if (!bucket.example_snippet && mention.snippet) bucket.example_snippet = mention.snippet;
    }

    // Also build source_bucket clusters from document metadata
    const sourceCounts = new Map();
    for (const mention of mentions) {
        const src = mention.source || 'unknown';
        sourceCounts.set(src, (sourceCounts.get(src) || 0) + 1);
    }
    for (const [source, count] of sourceCounts) {
        const key = `source_bucket::${source}`;
        buckets.set(key, {
            client_id: clientId,
            cluster_type: 'source_bucket',
            label: source,
            mention_count: count,
            sources: new Set([source]),
            example_url: null,
            example_snippet: null,
            last_seen_at: null,
            metadata: {},
        });
    }

    return [...buckets.values()]
        .filter((c) => {
            if (c.cluster_type === 'source_bucket') return true;
            if (c.mention_count < 2) return false;

            // Theme clusters must pass a relevance gate
            if (c.cluster_type === 'theme') {
                const relevance = scoreThemeRelevance(c.label, relevanceAnchors);
                if (relevance < THEME_RELEVANCE_THRESHOLD) return false;
            }

            return true;
        })
        .map((c) => {
            // Compute relevance-weighted score for theme clusters
            let score = c.mention_count;
            if (c.cluster_type === 'theme') {
                const relevance = scoreThemeRelevance(c.label, relevanceAnchors);
                // Score = frequency amplified by relevance (relevance acts as multiplier)
                score = c.mention_count * (1 + relevance);
            }
            return {
                ...c,
                sources: [...c.sources],
                evidence_level: evidenceLevel(c.mention_count),
                score: Math.round(score * 100) / 100,
                last_seen_at: new Date().toISOString(),
            };
        });
}

// ──────────────────────────────────────────────────────────────
// Stage 6 — Derive opportunities from clusters
// ──────────────────────────────────────────────────────────────

export function deriveOpportunitiesFromClusters(clusters, clientId, relevanceAnchors = new Set()) {
    const opportunities = [];

    const questions = clusters.filter((c) => c.cluster_type === 'question').slice(0, 6);
    for (const q of questions) {
        opportunities.push({
            client_id: clientId,
            opportunity_type: 'faq',
            title: `FAQ: ${q.label}`,
            rationale: 'Inféré des questions communautaires récurrentes observées.',
            evidence_level: q.evidence_level,
            mention_count: q.mention_count,
            provenance: 'inferred',
            source_cluster_id: q.id || null,
            status: 'open',
        });
    }

    // Only derive content opportunities from relevant theme clusters
    const themes = clusters
        .filter((c) => c.cluster_type === 'theme')
        .filter((c) => scoreThemeRelevance(c.label, relevanceAnchors) >= THEME_RELEVANCE_THRESHOLD)
        .slice(0, 4);
    for (const theme of themes) {
        opportunities.push({
            client_id: clientId,
            opportunity_type: 'content',
            title: `Angle contenu: ${theme.label}`,
            rationale: 'Inféré des thèmes de discussion externe récurrents.',
            evidence_level: theme.evidence_level,
            mention_count: theme.mention_count,
            provenance: 'inferred',
            source_cluster_id: theme.id || null,
            status: 'open',
        });
    }

    const complaints = clusters.filter((c) => c.cluster_type === 'complaint').slice(0, 4);
    for (const complaint of complaints) {
        opportunities.push({
            client_id: clientId,
            opportunity_type: 'content',
            title: `Traiter la préoccupation: ${complaint.label}`,
            rationale: 'Inféré du langage de plainte récurrent observé dans les discussions.',
            evidence_level: complaint.evidence_level,
            mention_count: complaint.mention_count,
            provenance: 'inferred',
            source_cluster_id: complaint.id || null,
            status: 'open',
        });
    }

    const competitorComplaints = clusters.filter((c) => c.cluster_type === 'competitor_complaint').slice(0, 4);
    for (const cc of competitorComplaints) {
        opportunities.push({
            client_id: clientId,
            opportunity_type: 'differentiation',
            title: `Angle de différenciation: résoudre "${cc.label}"`,
            rationale: 'Inféré des patterns de plaintes où l\'opérateur peut mieux se différencier.',
            evidence_level: cc.evidence_level,
            mention_count: cc.mention_count,
            provenance: 'inferred',
            source_cluster_id: cc.id || null,
            status: 'open',
        });
    }

    return opportunities;
}

// ──────────────────────────────────────────────────────────────
// Main pipeline orchestrator
// ──────────────────────────────────────────────────────────────

export async function runCommunityPipeline(clientId, { triggerSource = 'system' } = {}) {
    const client = await db.getClientById(clientId).catch(() => null);
    if (!client) {
        return { success: false, error: 'Client introuvable', summary: {} };
    }

    const seedQueries = buildSeedQueries(client);

    // Create collection run record
    const run = await insertCollectionRun({
        client_id: clientId,
        source: 'reddit',
        status: 'running',
        started_at: new Date().toISOString(),
        seed_queries: seedQueries,
        trigger_source: triggerSource,
    });

    try {
        // Stage 2: Collect
        const rawPosts = await collectRedditPosts(seedQueries);

        // Stage 3: Normalize & persist
        const documentRows = toDocumentRows(rawPosts, clientId, run.id);
        const { persisted, skipped } = await upsertDocuments(documentRows);

        await updateCollectionRun(run.id, {
            documents_collected: rawPosts.length,
            documents_persisted: persisted,
            documents_skipped: skipped,
        });

        // Build relevance anchors from client context
        const relevanceAnchors = buildRelevanceAnchors(client);

        // Stage 4: Enrich — extract mentions from unprocessed documents
        const unprocessed = await listDocuments(clientId, { source: 'reddit', unprocessedOnly: true });
        const mentions = extractMentionsFromDocuments(unprocessed, clientId, relevanceAnchors);

        if (mentions.length > 0) {
            // Clear old mentions for these documents before re-inserting
            const docIds = unprocessed.map((d) => d.id);
            await deleteMentionsForDocuments(docIds);
            await insertMentions(mentions);
            await markDocumentsProcessed(docIds);
        }

        // Stage 5: Cluster — rebuild clusters from all mentions
        const allMentions = await listMentionsForClustering(clientId);
        await clearClusters(clientId);
        const clusters = aggregateMentionsToClusters(allMentions, clientId, relevanceAnchors);
        const persistedClusters = clusters.length > 0 ? await upsertClusters(clusters) : [];

        // Stage 6: Derive opportunities
        const opportunities = deriveOpportunitiesFromClusters(persistedClusters, clientId, relevanceAnchors);
        if (opportunities.length > 0) {
            await upsertOpportunities(opportunities);
        }

        // Finalize run
        await updateCollectionRun(run.id, {
            status: 'completed',
            finished_at: new Date().toISOString(),
            run_context: {
                mentions_extracted: mentions.length,
                clusters_built: persistedClusters.length,
                opportunities_derived: opportunities.length,
            },
        });

        return {
            success: true,
            error: null,
            summary: {
                documents_collected: rawPosts.length,
                documents_persisted: persisted,
                documents_skipped: skipped,
                mentions_extracted: mentions.length,
                clusters_built: persistedClusters.length,
                opportunities_derived: opportunities.length,
            },
        };
    } catch (err) {
        await updateCollectionRun(run.id, {
            status: 'failed',
            finished_at: new Date().toISOString(),
            error_message: err?.message || 'Pipeline execution failed',
        }).catch(() => {});

        return {
            success: false,
            error: err?.message || 'Pipeline execution failed',
            summary: {},
        };
    }
}

// ──────────────────────────────────────────────────────────────
// Internal helper — fetch all mentions for re-clustering
// ──────────────────────────────────────────────────────────────

async function listMentionsForClustering(clientId) {
    const { getAdminSupabase } = await import('@/lib/supabase-admin');
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
        .from('community_mentions')
        .select('mention_type, label, snippet, source')
        .eq('client_id', clientId);
    if (error) throw new Error(`[Community] listMentionsForClustering: ${error.message}`);
    return data || [];
}
