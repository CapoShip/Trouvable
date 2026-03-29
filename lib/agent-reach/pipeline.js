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
    'the', 'and', 'for', 'with', 'from', 'this', 'that', 'have', 'has', 'your', 'about', 'their', 'there', 'into', 'when', 'where', 'what',
    'les', 'des', 'pour', 'avec', 'dans', 'plus', 'tout', 'tous', 'chez', 'entre', 'sur', 'une', 'que', 'qui', 'est', 'sont', 'aux', 'par',
    'how', 'why', 'what', 'which', 'best', 'near', 'from', 'site', 'service', 'business', 'company',
]);

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

function extractMentionsFromDocuments(documents, clientId) {
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

        // Theme tokens
        const tokens = tokenize(merged);
        for (const token of tokens) {
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

function aggregateMentionsToClusters(mentions, clientId) {
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
        .map((c) => ({
            ...c,
            sources: [...c.sources],
            evidence_level: evidenceLevel(c.mention_count),
            score: c.mention_count,
            last_seen_at: new Date().toISOString(),
        }));
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

        // Stage 4: Enrich — extract mentions from unprocessed documents
        const unprocessed = await listDocuments(clientId, { source: 'reddit', unprocessedOnly: true });
        const mentions = extractMentionsFromDocuments(unprocessed, clientId);

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
        const clusters = aggregateMentionsToClusters(allMentions, clientId);
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
