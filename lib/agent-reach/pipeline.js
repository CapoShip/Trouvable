import 'server-only';

import crypto from 'crypto';

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
    // English function words & high-frequency generic tokens
    'the', 'and', 'for', 'with', 'from', 'this', 'that', 'have', 'has', 'your', 'about', 'their', 'there', 'into', 'when', 'where', 'what',
    'how', 'why', 'what', 'which', 'best', 'near', 'from', 'site', 'service', 'business', 'company',
    'also', 'just', 'like', 'really', 'very', 'much', 'more', 'most', 'some', 'other', 'only', 'even', 'still',
    'been', 'being', 'would', 'could', 'should', 'will', 'does', 'did', 'had', 'was', 'were', 'are', 'not',
    'but', 'then', 'than', 'them', 'they', 'its', 'our', 'any', 'all', 'each', 'both', 'few', 'own',
    'get', 'got', 'getting', 'make', 'made', 'take', 'took', 'come', 'came', 'going', 'gone', 'want', 'need',
    'know', 'think', 'say', 'said', 'tell', 'told', 'look', 'see', 'seem', 'find', 'give', 'use', 'used',
    'new', 'old', 'good', 'bad', 'big', 'small', 'long', 'right', 'well', 'back', 'way', 'thing', 'things',
    'people', 'time', 'year', 'years', 'day', 'days', 'lot', 'work', 'part', 'case', 'point', 'fact',
    'man', 'woman', 'life', 'world', 'hand', 'after', 'over', 'such', 'these', 'those', 'same', 'different',
    'first', 'last', 'great', 'little', 'own', 'sure', 'may', 'might', 'can', 'too', 'try', 'here',
    'every', 'many', 'already', 'around', 'always', 'never', 'often', 'maybe', 'sometimes', 'something',
    'nothing', 'everything', 'someone', 'anyone', 'everyone', 'though', 'through', 'actually', 'usually',
    'pretty', 'put', 'end', 'set', 'run', 'keep', 'let', 'start', 'seem', 'help', 'show',
    'turn', 'move', 'play', 'feel', 'must', 'between', 'before', 'under', 'while', 'since', 'without',
    'however', 'because', 'again', 'don', 'doesn', 'didn', 'won', 'isn', 'aren', 'wasn', 'weren',
    'couldn', 'wouldn', 'shouldn', 'haven', 'hasn', 'hadn',
    'reddit', 'post', 'comment', 'comments', 'thread', 'subreddit', 'edit', 'deleted', 'removed', 'upvote',
    // French function words & high-frequency generic tokens
    'les', 'des', 'pour', 'avec', 'dans', 'plus', 'tout', 'tous', 'chez', 'entre', 'sur', 'une', 'que', 'qui', 'est', 'sont', 'aux', 'par',
    'pas', 'mais', 'donc', 'car', 'soit', 'aussi', 'bien', 'encore', 'peut', 'faire', 'fait', 'dit',
    'tres', 'bon', 'peu', 'ici', 'comme', 'quand', 'alors', 'sans', 'non', 'oui', 'avoir', 'etre',
    'cette', 'ces', 'mon', 'ton', 'son', 'nos', 'vos', 'ses', 'leur', 'moi', 'toi', 'lui', 'nous', 'vous',
    'eux', 'elle', 'elles', 'cela', 'ceci', 'autre', 'autres', 'rien', 'chaque', 'meme', 'apres', 'avant',
    'sous', 'vers', 'toute', 'toutes', 'quelque', 'quelques', 'beaucoup', 'trop', 'assez', 'tant',
    'vraiment', 'juste', 'deja', 'encore', 'toujours', 'jamais', 'souvent', 'parfois',
]);

// Minimum relevance score for a theme to be surfaced (0–1 scale)
const THEME_RELEVANCE_THRESHOLD = 0.15;

// ──────────────────────────────────────────────────────────────
// Text helpers
// ──────────────────────────────────────────────────────────────

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

/**
 * Extract meaningful bigrams from normalized text.
 * Keeps only pairs where at least one token is ≥ 4 chars and not a stopword.
 */
function extractBigrams(value) {
    const tokens = normalizeText(value).split(' ').filter((t) => t.length >= 2);
    const bigrams = [];
    for (let i = 0; i < tokens.length - 1; i++) {
        const a = tokens[i];
        const b = tokens[i + 1];
        if (STOPWORDS.has(a) && STOPWORDS.has(b)) continue;
        if (a.length < 3 && b.length < 3) continue;
        bigrams.push(`${a} ${b}`);
    }
    return bigrams;
}

/**
 * Build a set of relevance anchor terms from the client profile.
 * Used to score whether a theme/phrase is relevant to this client.
 */
export function buildRelevanceAnchors(client) {
    const clientName = normalizeText(client?.client_name || '');
    const businessType = normalizeText(client?.business_type || '');
    const city = normalizeText(client?.address?.city || client?.target_region || '');

    const anchors = new Set();
    // Add individual tokens from client identity fields
    for (const field of [clientName, businessType, city]) {
        for (const token of field.split(' ').filter((t) => t.length >= 3 && !STOPWORDS.has(t))) {
            anchors.add(token);
        }
    }
    // Add the full phrases as anchors too
    if (clientName.length >= 3) anchors.add(clientName);
    if (businessType.length >= 3) anchors.add(businessType);
    if (city.length >= 3) anchors.add(city);

    return anchors;
}

/**
 * Score a theme label's relevance to the client context (0–1).
 * Higher = more relevant to the client's business/entity/market.
 */
export function scoreThemeRelevance(label, anchors) {
    if (!label || anchors.size === 0) return 0;
    const normalized = normalizeText(label);
    const tokens = normalized.split(' ').filter((t) => t.length >= 2);

    let score = 0;

    // Direct match: label IS an anchor or contains an anchor
    for (const anchor of anchors) {
        if (normalized === anchor) return 1.0;
        if (normalized.includes(anchor)) { score = Math.max(score, 0.8); }
        if (anchor.includes(normalized) && normalized.length >= 4) { score = Math.max(score, 0.6); }
    }

    // Token overlap: tokens in the label that match anchor tokens
    for (const token of tokens) {
        if (anchors.has(token)) {
            score = Math.max(score, 0.5);
        }
    }

    return score;
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
    const businessType = String(client?.business_type || '').trim();
    const city = String(client?.address?.city || client?.target_region || '').trim();

    const seeds = [
        `${clientName} ${city}`.trim(),
        `${businessType} ${city}`.trim(),
        `${businessType} probleme`.trim(),
        `${businessType} recommandation ${city}`.trim(),
        `${clientName} alternatives`.trim(),
    ].filter(Boolean);

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

function extractMentionsFromDocuments(documents, clientId, { relevanceAnchors = new Set() } = {}) {
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

        // Theme extraction — prefer relevant tokens and meaningful bigrams
        const tokens = tokenize(merged);
        const bigrams = extractBigrams(merged);
        const seenThemes = new Set();

        // Emit bigrams first (higher signal than single tokens)
        for (const bigram of bigrams) {
            if (seenThemes.has(bigram)) continue;
            // Only emit bigrams that are relevant to the client or contain a substantive token
            const relevance = scoreThemeRelevance(bigram, relevanceAnchors);
            if (relevance >= THEME_RELEVANCE_THRESHOLD || bigram.split(' ').some((t) => t.length >= 5)) {
                seenThemes.add(bigram);
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

        // Emit single tokens only if they are relevant to the client context
        // or are substantive enough (≥ 5 chars) to be meaningful standalone
        for (const token of tokens) {
            if (seenThemes.has(token)) continue;
            const relevance = scoreThemeRelevance(token, relevanceAnchors);
            if (relevance >= THEME_RELEVANCE_THRESHOLD || token.length >= 5) {
                seenThemes.add(token);
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

function aggregateMentionsToClusters(mentions, clientId, { relevanceAnchors = new Set() } = {}) {
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
        .filter((c) => c.mention_count >= 2 || c.cluster_type === 'source_bucket')
        .map((c) => {
            const relevance = c.cluster_type === 'theme'
                ? scoreThemeRelevance(c.label, relevanceAnchors)
                : 1.0; // non-theme clusters keep full relevance
            // Score combines frequency with relevance: relevant themes rank higher
            const relevanceBoost = 1 + relevance * 2; // 1x–3x multiplier
            return {
                ...c,
                sources: [...c.sources],
                evidence_level: evidenceLevel(c.mention_count),
                score: Math.round(c.mention_count * relevanceBoost),
                relevance_score: relevance,
                last_seen_at: new Date().toISOString(),
            };
        })
        // Filter out theme clusters with zero relevance and low frequency
        .filter((c) => {
            if (c.cluster_type !== 'theme') return true;
            // Keep themes that are relevant OR have strong frequency evidence
            return c.relevance_score >= THEME_RELEVANCE_THRESHOLD || c.mention_count >= 5;
        })
        .sort((a, b) => b.score - a.score);
}

// ──────────────────────────────────────────────────────────────
// Stage 6 — Derive opportunities from clusters
// ──────────────────────────────────────────────────────────────

function deriveOpportunitiesFromClusters(clusters, clientId) {
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

    const themes = clusters.filter((c) => c.cluster_type === 'theme').slice(0, 4);
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
    const connectorEnabled = process.env.SOCIAL_REDDIT_CONNECTOR === '1';

    if (!connectorEnabled) {
        return {
            success: true,
            error: null,
            summary: {
                skipped: true,
                reason: 'SOCIAL_REDDIT_CONNECTOR désactivé',
                seed_queries: seedQueries,
            },
        };
    }

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

        // Build relevance anchors from client profile for entity-aware filtering
        const relevanceAnchors = buildRelevanceAnchors(client);

        // Stage 4: Enrich — extract mentions from unprocessed documents
        const unprocessed = await listDocuments(clientId, { source: 'reddit', unprocessedOnly: true });
        const mentions = extractMentionsFromDocuments(unprocessed, clientId, { relevanceAnchors });

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
        const clusters = aggregateMentionsToClusters(allMentions, clientId, { relevanceAnchors });
        const persistedClusters = clusters.length > 0 ? await upsertClusters(clusters) : [];

        // Stage 6: Derive opportunities
        const opportunities = deriveOpportunitiesFromClusters(persistedClusters, clientId);
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
