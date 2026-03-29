import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db', () => ({}));
vi.mock('@/lib/db/community', () => ({}));

import {
    buildSeedQueries,
    buildRelevanceAnchors,
    scoreThemeRelevance,
    THEME_RELEVANCE_THRESHOLD,
    extractMentionsFromDocuments,
    aggregateMentionsToClusters,
    deriveOpportunitiesFromClusters,
} from '@/lib/agent-reach/pipeline';

// ──────────────────────────────────────────────────────────────
// Test helpers — simulate the internal pipeline functions
// We re-implement the pure functions here for testability since
// extractMentionsFromDocuments and aggregateMentionsToClusters are
// not exported. Instead we test the exported building blocks and
// simulate the pipeline flow.
// ──────────────────────────────────────────────────────────────

const TROUVABLE_CLIENT = {
    client_name: 'Trouvable',
    business_type: 'agence SEO GEO visibilité IA',
    address: { city: 'Montréal' },
    target_region: 'Québec',
};

const BAKERY_CLIENT = {
    client_name: 'Boulangerie Artisan',
    business_type: 'boulangerie pâtisserie',
    address: { city: 'Lyon' },
};

const SPARSE_CLIENT = {
    client_name: 'AcmeCorp',
    business_type: '',
    address: {},
};

// ──────────────────────────────────────────────────────────────
// buildSeedQueries
// ──────────────────────────────────────────────────────────────

describe('buildSeedQueries', () => {
    it('generates seeds from client context', () => {
        const seeds = buildSeedQueries(TROUVABLE_CLIENT);
        expect(seeds.length).toBeGreaterThan(0);
        expect(seeds.length).toBeLessThanOrEqual(5);
        // Should include client name + city
        expect(seeds.some((s) => s.includes('Trouvable') || s.includes('trouvable'))).toBe(true);
    });

    it('handles missing client fields gracefully', () => {
        const seeds = buildSeedQueries({ client_name: 'Test' });
        expect(seeds.length).toBeGreaterThan(0);
    });

    it('uses resolved business context for richer seeds when raw type is weak', () => {
        const weakClient = { client_name: 'Trouvable', business_type: '', address: { city: 'Montréal' } };
        const seeds = buildSeedQueries(weakClient);
        expect(seeds.length).toBeGreaterThan(0);
        // Should still produce seeds with the client name even if business_type is empty
        expect(seeds.some((s) => s.includes('Trouvable'))).toBe(true);
    });

    it('includes review/avis seed for client', () => {
        const seeds = buildSeedQueries(TROUVABLE_CLIENT);
        expect(seeds.some((s) => s.includes('avis'))).toBe(true);
    });

    it('does not produce empty-string seeds', () => {
        const seeds = buildSeedQueries({ client_name: '', business_type: '', address: {} });
        seeds.forEach((s) => {
            expect(s.trim().length).toBeGreaterThan(0);
        });
    });
});

// ──────────────────────────────────────────────────────────────
// buildRelevanceAnchors
// ──────────────────────────────────────────────────────────────

describe('buildRelevanceAnchors', () => {
    it('includes client name tokens as anchors', () => {
        const anchors = buildRelevanceAnchors(TROUVABLE_CLIENT);
        expect(anchors.has('trouvable')).toBe(true);
    });

    it('includes city tokens as anchors', () => {
        const anchors = buildRelevanceAnchors(TROUVABLE_CLIENT);
        expect(anchors.has('montreal')).toBe(true);
    });

    it('includes business type tokens as anchors', () => {
        const anchors = buildRelevanceAnchors(TROUVABLE_CLIENT);
        expect(anchors.has('seo')).toBe(true);
        expect(anchors.has('geo')).toBe(true);
    });

    it('expands industry vocabulary when business_type matches', () => {
        const anchors = buildRelevanceAnchors(TROUVABLE_CLIENT);
        // SEO industry vocab should be expanded
        expect(anchors.has('referencement')).toBe(true);
        expect(anchors.has('backlink')).toBe(true);
        expect(anchors.has('ranking')).toBe(true);
    });

    it('includes intent vocabulary', () => {
        const anchors = buildRelevanceAnchors(TROUVABLE_CLIENT);
        expect(anchors.has('recommandation')).toBe(true);
        expect(anchors.has('alternative')).toBe(true);
        expect(anchors.has('compare')).toBe(true);
    });

    it('falls back to all industry vocab when business_type is sparse', () => {
        const anchors = buildRelevanceAnchors(SPARSE_CLIENT);
        // All industry vocab should be included as safe fallback
        expect(anchors.has('seo')).toBe(true);
        expect(anchors.has('marketing')).toBe(true);
        expect(anchors.has('web')).toBe(true);
    });

    it('includes location for non-SEO clients too', () => {
        const anchors = buildRelevanceAnchors(BAKERY_CLIENT);
        expect(anchors.has('lyon')).toBe(true);
    });

    it('enriches anchors via resolved business type when raw type is available', () => {
        // TROUVABLE_CLIENT has business_type 'agence SEO GEO visibilité IA'
        // The resolver should identify this as ai_visibility_software → adding category tokens
        const anchors = buildRelevanceAnchors(TROUVABLE_CLIENT);
        expect(anchors.has('visibility')).toBe(true);
    });
});

// ──────────────────────────────────────────────────────────────
// scoreThemeRelevance
// ──────────────────────────────────────────────────────────────

describe('scoreThemeRelevance', () => {
    const trouvableAnchors = buildRelevanceAnchors(TROUVABLE_CLIENT);

    it('scores relevant single tokens positively', () => {
        expect(scoreThemeRelevance('seo', trouvableAnchors)).toBeGreaterThan(0);
        expect(scoreThemeRelevance('referencement', trouvableAnchors)).toBeGreaterThan(0);
        expect(scoreThemeRelevance('trouvable', trouvableAnchors)).toBeGreaterThan(0);
    });

    it('scores irrelevant single tokens as zero', () => {
        expect(scoreThemeRelevance('park', trouvableAnchors)).toBe(0);
        expect(scoreThemeRelevance('oven', trouvableAnchors)).toBe(0);
        expect(scoreThemeRelevance('bagels', trouvableAnchors)).toBe(0);
        expect(scoreThemeRelevance('canadian', trouvableAnchors)).toBe(0);
    });

    it('scores relevant bigrams higher than single tokens', () => {
        const singleScore = scoreThemeRelevance('seo', trouvableAnchors);
        const bigramScore = scoreThemeRelevance('seo local', trouvableAnchors);
        expect(bigramScore).toBeGreaterThan(singleScore);
    });

    it('scores irrelevant bigrams as zero', () => {
        expect(scoreThemeRelevance('park bench', trouvableAnchors)).toBe(0);
        expect(scoreThemeRelevance('oven repair', trouvableAnchors)).toBe(0);
    });

    it('returns zero for empty/null labels', () => {
        expect(scoreThemeRelevance('', trouvableAnchors)).toBe(0);
        expect(scoreThemeRelevance(null, trouvableAnchors)).toBe(0);
    });

    it('returns zero when anchors are empty', () => {
        expect(scoreThemeRelevance('seo', new Set())).toBe(0);
    });

    it('caps score at maximum', () => {
        const score = scoreThemeRelevance('seo', trouvableAnchors);
        expect(score).toBeLessThanOrEqual(2.0);
    });
});

// ──────────────────────────────────────────────────────────────
// End-to-end theme filtering simulation
// ──────────────────────────────────────────────────────────────

describe('pipeline theme filtering (simulated end-to-end)', () => {
    it('filters out junk tokens for a Trouvable-like client', () => {
        const anchors = buildRelevanceAnchors(TROUVABLE_CLIENT);
        const junkTokens = ['park', 'oven', 'bagels', 'people', 'canadian', 'sandwich', 'hockey', 'winter'];
        const relevantTokens = ['seo', 'referencement', 'visibilite', 'citation', 'agence', 'ranking', 'local'];

        for (const token of junkTokens) {
            const score = scoreThemeRelevance(token, anchors);
            expect(score).toBe(0);
        }

        for (const token of relevantTokens) {
            const score = scoreThemeRelevance(token, anchors);
            expect(score).toBeGreaterThan(0);
        }
    });

    it('relevant themes outrank noisy frequent tokens', () => {
        const anchors = buildRelevanceAnchors(TROUVABLE_CLIENT);

        // Simulate cluster scoring: frequency × (1 + relevance)
        const junkCluster = { label: 'park', mention_count: 20 };
        const relevantCluster = { label: 'seo', mention_count: 5 };

        const junkRelevance = scoreThemeRelevance(junkCluster.label, anchors);
        const relevantRelevance = scoreThemeRelevance(relevantCluster.label, anchors);

        // Junk should have zero relevance → score = frequency × 1 = 20
        // But with threshold filtering, junk won't even make it to clusters
        expect(junkRelevance).toBe(0);
        expect(relevantRelevance).toBeGreaterThan(0);

        // The key point is that junk with relevance=0 gets filtered out entirely
        expect(junkRelevance).toBeLessThan(THEME_RELEVANCE_THRESHOLD); // Below threshold → filtered out
        expect(relevantRelevance).toBeGreaterThanOrEqual(THEME_RELEVANCE_THRESHOLD); // Above threshold → kept
    });

    it('sparse client context does not collapse relevance quality', () => {
        const anchors = buildRelevanceAnchors(SPARSE_CLIENT);

        // Even with sparse context, intent vocab should still work
        expect(scoreThemeRelevance('recommandation', anchors)).toBeGreaterThan(0);
        expect(scoreThemeRelevance('alternative', anchors)).toBeGreaterThan(0);

        // And generic industry vocab should be available as fallback
        expect(scoreThemeRelevance('seo', anchors)).toBeGreaterThan(0);

        // But pure junk should still score zero
        expect(scoreThemeRelevance('park', anchors)).toBe(0);
        expect(scoreThemeRelevance('oven', anchors)).toBe(0);
    });

    it('opportunities are derived from meaningful evidence only', () => {
        const anchors = buildRelevanceAnchors(TROUVABLE_CLIENT);

        // Simulate cluster labels that would become opportunities
        const goodThemes = ['seo local', 'visibilite', 'agence', 'referencement'];
        const badThemes = ['park', 'oven', 'bagels', 'hockey'];

        for (const theme of goodThemes) {
            const relevance = scoreThemeRelevance(theme, anchors);
            expect(relevance).toBeGreaterThanOrEqual(THEME_RELEVANCE_THRESHOLD);
        }

        for (const theme of badThemes) {
            const relevance = scoreThemeRelevance(theme, anchors);
            expect(relevance).toBeLessThan(THEME_RELEVANCE_THRESHOLD);
        }
    });

    it('does not over-filter for a bakery client', () => {
        const anchors = buildRelevanceAnchors(BAKERY_CLIENT);

        // Bakery-relevant terms should score positively
        expect(scoreThemeRelevance('lyon', anchors)).toBeGreaterThan(0);
        expect(scoreThemeRelevance('artisan', anchors)).toBeGreaterThan(0);

        // Intent terms should still work
        expect(scoreThemeRelevance('recommandation', anchors)).toBeGreaterThan(0);
        expect(scoreThemeRelevance('prix', anchors)).toBeGreaterThan(0);

        // But random noise should still be blocked
        expect(scoreThemeRelevance('hockey', anchors)).toBe(0);
    });

    it('zero-relevance theme clusters do not survive', () => {
        const anchors = buildRelevanceAnchors(TROUVABLE_CLIENT);

        // Even with high mention count, zero-relevance themes should be blocked
        const zeroRelevanceThemes = ['park', 'oven', 'bagels'];
        for (const label of zeroRelevanceThemes) {
            const relevance = scoreThemeRelevance(label, anchors);
            expect(relevance).toBeLessThan(THEME_RELEVANCE_THRESHOLD);
        }
    });

    it('bigrams with relevant content outrank single tokens', () => {
        const anchors = buildRelevanceAnchors(TROUVABLE_CLIENT);

        const bigramScore = scoreThemeRelevance('seo local', anchors);
        const singleScore = scoreThemeRelevance('seo', anchors);

        expect(bigramScore).toBeGreaterThan(singleScore);
    });
});

// ──────────────────────────────────────────────────────────────
// Real pipeline behavior tests — extractMentionsFromDocuments
// ──────────────────────────────────────────────────────────────

let _testDocIdCounter = 0;
function makeDoc(title, body = '', opts = {}) {
    _testDocIdCounter += 1;
    return {
        id: opts.id || `test-doc-${_testDocIdCounter}`,
        title,
        body,
        source: opts.source || 'reddit',
        engagement_score: opts.engagement_score || 0,
    };
}

describe('extractMentionsFromDocuments (real pipeline stage 4)', () => {
    const CLIENT_ID = '00000000-0000-0000-0000-000000000001';
    const trouvableAnchors = buildRelevanceAnchors(TROUVABLE_CLIENT);

    it('does not emit junk single tokens as theme mentions for a Trouvable-like client', () => {
        const docs = [
            makeDoc('Best park near Montreal for a walk', 'People love the park with bagels and oven-baked goods. Canadian winter is long.'),
        ];
        const mentions = extractMentionsFromDocuments(docs, CLIENT_ID, trouvableAnchors);
        const themeLabels = mentions.filter((m) => m.mention_type === 'theme').map((m) => m.label);

        // These junk tokens must NOT appear as themes
        expect(themeLabels).not.toContain('park');
        expect(themeLabels).not.toContain('oven');
        expect(themeLabels).not.toContain('bagels');
        expect(themeLabels).not.toContain('canadian');
        expect(themeLabels).not.toContain('winter');
        expect(themeLabels).not.toContain('walk');
    });

    it('emits relevant category/entity terms as theme mentions', () => {
        const docs = [
            makeDoc('Best SEO agency in Montreal for local ranking', 'Looking for a good agence SEO to improve referencement and visibility in local search.'),
        ];
        const mentions = extractMentionsFromDocuments(docs, CLIENT_ID, trouvableAnchors);
        const themeLabels = mentions.filter((m) => m.mention_type === 'theme').map((m) => m.label);

        // At least some relevant terms should appear
        const hasRelevantTheme = themeLabels.some((label) =>
            ['seo', 'agence', 'montreal', 'ranking', 'referencement', 'local'].includes(label) ||
            label.includes('seo') || label.includes('agence')
        );
        expect(hasRelevantTheme).toBe(true);
    });

    it('still detects questions and complaints regardless of theme relevance', () => {
        const docs = [
            makeDoc('Why is this oven so slow and expensive?', 'I hate how my oven takes forever to heat up.'),
        ];
        const mentions = extractMentionsFromDocuments(docs, CLIENT_ID, trouvableAnchors);
        const types = new Set(mentions.map((m) => m.mention_type));

        // Question and complaint detection should still work
        expect(types.has('question')).toBe(true);
        expect(types.has('complaint')).toBe(true);

        // But no junk theme tokens should appear
        const themeLabels = mentions.filter((m) => m.mention_type === 'theme').map((m) => m.label);
        expect(themeLabels).not.toContain('oven');
    });

    it('does not let intent-only tokens pass as themes', () => {
        // Intent vocab words like "help", "support", "problem" should NOT
        // alone qualify a random token as a theme — they need to score
        // above the threshold, which means they need more evidence.
        const docs = [
            makeDoc('Need help with my kitchen problem', 'Support for fixing broken appliance issue.'),
        ];
        const mentions = extractMentionsFromDocuments(docs, CLIENT_ID, trouvableAnchors);
        const themeLabels = mentions.filter((m) => m.mention_type === 'theme').map((m) => m.label);

        // Generic words that only match intent vocab weakly should be filtered
        expect(themeLabels).not.toContain('kitchen');
        expect(themeLabels).not.toContain('broken');
        expect(themeLabels).not.toContain('appliance');
        expect(themeLabels).not.toContain('fixing');
    });

    it('emits bigrams only when they meet the relevance threshold', () => {
        const docs = [
            makeDoc('SEO local vs park bench comparison', 'Best local agence for referencement.'),
        ];
        const mentions = extractMentionsFromDocuments(docs, CLIENT_ID, trouvableAnchors);
        const themeBigrams = mentions
            .filter((m) => m.mention_type === 'theme')
            .map((m) => m.label)
            .filter((l) => l.includes(' '));

        // "park bench" bigram should NOT be emitted
        expect(themeBigrams).not.toContain('park bench');
    });
});

// ──────────────────────────────────────────────────────────────
// Real pipeline behavior tests — aggregateMentionsToClusters
// ──────────────────────────────────────────────────────────────

describe('aggregateMentionsToClusters (real pipeline stage 5)', () => {
    const CLIENT_ID = '00000000-0000-0000-0000-000000000001';
    const trouvableAnchors = buildRelevanceAnchors(TROUVABLE_CLIENT);

    it('zero-relevance theme clusters do not survive even with high mention_count', () => {
        // Simulate many mentions of an irrelevant token
        const junkMentions = Array.from({ length: 30 }, () => ({
            mention_type: 'theme',
            label: 'park',
            snippet: null,
            source: 'reddit',
        }));
        const clusters = aggregateMentionsToClusters(junkMentions, CLIENT_ID, trouvableAnchors);
        const themeLabels = clusters.filter((c) => c.cluster_type === 'theme').map((c) => c.label);

        expect(themeLabels).not.toContain('park');
    });

    it('relevant theme clusters survive and get relevance-weighted scores', () => {
        const relevantMentions = Array.from({ length: 5 }, () => ({
            mention_type: 'theme',
            label: 'seo',
            snippet: null,
            source: 'reddit',
        }));
        const clusters = aggregateMentionsToClusters(relevantMentions, CLIENT_ID, trouvableAnchors);
        const seoClusters = clusters.filter((c) => c.cluster_type === 'theme' && c.label === 'seo');

        expect(seoClusters.length).toBe(1);
        // Score should be > mention_count because relevance multiplier is applied
        expect(seoClusters[0].score).toBeGreaterThan(seoClusters[0].mention_count);
    });

    it('relevant themes outrank frequent junk in final clusters', () => {
        const mentions = [
            // 20 mentions of junk
            ...Array.from({ length: 20 }, () => ({
                mention_type: 'theme',
                label: 'park',
                snippet: null,
                source: 'reddit',
            })),
            // 3 mentions of relevant term
            ...Array.from({ length: 3 }, () => ({
                mention_type: 'theme',
                label: 'seo',
                snippet: null,
                source: 'reddit',
            })),
        ];
        const clusters = aggregateMentionsToClusters(mentions, CLIENT_ID, trouvableAnchors);
        const themeLabels = clusters.filter((c) => c.cluster_type === 'theme').map((c) => c.label);

        // Park must not appear despite being 20× more frequent
        expect(themeLabels).not.toContain('park');

        // SEO must appear (it has >= 2 mentions and passes relevance threshold)
        expect(themeLabels).toContain('seo');
    });

    it('non-theme cluster types (question, complaint) are not relevance-gated', () => {
        const mentions = [
            { mention_type: 'question', label: 'How do I fix my oven?', snippet: 'Some text', source: 'reddit' },
            { mention_type: 'question', label: 'How do I fix my oven?', snippet: 'Some text', source: 'reddit' },
            { mention_type: 'complaint', label: 'Oven is broken', snippet: 'Complaint', source: 'reddit' },
            { mention_type: 'complaint', label: 'Oven is broken', snippet: 'Complaint', source: 'reddit' },
        ];
        const clusters = aggregateMentionsToClusters(mentions, CLIENT_ID, trouvableAnchors);
        const questionClusters = clusters.filter((c) => c.cluster_type === 'question');
        const complaintClusters = clusters.filter((c) => c.cluster_type === 'complaint');

        // Non-theme types should pass through — questions and complaints don't need relevance scoring
        expect(questionClusters.length).toBe(1);
        expect(complaintClusters.length).toBe(1);
    });
});

// ──────────────────────────────────────────────────────────────
// Real pipeline behavior — deriveOpportunitiesFromClusters
// ──────────────────────────────────────────────────────────────

describe('deriveOpportunitiesFromClusters (real pipeline stage 6)', () => {
    const CLIENT_ID = '00000000-0000-0000-0000-000000000001';
    const trouvableAnchors = buildRelevanceAnchors(TROUVABLE_CLIENT);

    it('does not derive content opportunities from irrelevant theme clusters', () => {
        // Even if an irrelevant theme cluster somehow made it through,
        // opportunity derivation should still block it
        const clusters = [
            {
                cluster_type: 'theme',
                label: 'park',
                mention_count: 10,
                evidence_level: 'medium',
                id: null,
            },
        ];
        const opps = deriveOpportunitiesFromClusters(clusters, CLIENT_ID, trouvableAnchors);
        const contentOpps = opps.filter((o) => o.opportunity_type === 'content');

        expect(contentOpps.length).toBe(0);
    });

    it('derives content opportunities from relevant theme clusters', () => {
        const clusters = [
            {
                cluster_type: 'theme',
                label: 'seo',
                mention_count: 5,
                evidence_level: 'medium',
                id: null,
            },
        ];
        const opps = deriveOpportunitiesFromClusters(clusters, CLIENT_ID, trouvableAnchors);
        const contentOpps = opps.filter((o) => o.opportunity_type === 'content');

        expect(contentOpps.length).toBe(1);
        expect(contentOpps[0].title).toContain('seo');
    });

    it('still derives FAQ opportunities from question clusters (no relevance gate)', () => {
        const clusters = [
            {
                cluster_type: 'question',
                label: 'How to fix a broken oven?',
                mention_count: 3,
                evidence_level: 'low',
                id: null,
            },
        ];
        const opps = deriveOpportunitiesFromClusters(clusters, CLIENT_ID, trouvableAnchors);
        const faqOpps = opps.filter((o) => o.opportunity_type === 'faq');

        expect(faqOpps.length).toBe(1);
    });
});

// ──────────────────────────────────────────────────────────────
// Full pipeline flow: extraction → clustering → opportunities
// ──────────────────────────────────────────────────────────────

describe('full pipeline flow (extraction → clustering → opportunities)', () => {
    const CLIENT_ID = '00000000-0000-0000-0000-000000000001';

    it('Trouvable-like client: junk does not appear in final themes or opportunities', () => {
        const anchors = buildRelevanceAnchors(TROUVABLE_CLIENT);

        // Simulate a batch of documents with mixed relevant and irrelevant content
        const docs = [
            makeDoc('Best SEO agence in Montreal', 'Looking for local SEO agency for better ranking and visibility.'),
            makeDoc('Best SEO agence in Montreal', 'Looking for local SEO agency for better ranking and visibility.'),
            makeDoc('Best SEO agence in Montreal', 'Looking for local SEO agency for better ranking and visibility.'),
            makeDoc('Park near downtown Montreal', 'People love the park. Great bagels nearby. Canadian winter hockey.'),
            makeDoc('Park near downtown Montreal', 'People love the park. Great bagels nearby. Canadian winter hockey.'),
            makeDoc('Park near downtown Montreal', 'People love the park. Great bagels nearby. Canadian winter hockey.'),
            makeDoc('My oven is broken, need help', 'This expensive oven has a serious problem. Worst purchase ever.'),
            makeDoc('My oven is broken, need help', 'This expensive oven has a serious problem. Worst purchase ever.'),
        ];

        // Stage 4: Extract
        const mentions = extractMentionsFromDocuments(docs, CLIENT_ID, anchors);

        // Stage 5: Cluster
        const clusters = aggregateMentionsToClusters(mentions, CLIENT_ID, anchors);

        // Stage 6: Opportunities
        const opps = deriveOpportunitiesFromClusters(clusters, CLIENT_ID, anchors);

        // Verify: no junk in theme clusters
        const themeLabels = clusters.filter((c) => c.cluster_type === 'theme').map((c) => c.label);
        expect(themeLabels).not.toContain('park');
        expect(themeLabels).not.toContain('oven');
        expect(themeLabels).not.toContain('bagels');
        expect(themeLabels).not.toContain('hockey');
        expect(themeLabels).not.toContain('winter');

        // Verify: no junk in content opportunities (theme-derived opportunities)
        // Note: complaint-type opportunities are observed signals, not theme-derived,
        // so they correctly include irrelevant topics if users actually complained about them.
        const contentOpps = opps.filter((o) => o.opportunity_type === 'content' && o.title.startsWith('Angle contenu'));
        for (const opp of contentOpps) {
            expect(opp.title).not.toContain('park');
            expect(opp.title).not.toContain('oven');
            expect(opp.title).not.toContain('bagels');
        }

        // Verify: relevant terms survive (at least some SEO/Montreal-related themes)
        const allThemeLabels = themeLabels.join(' ');
        const hasRelevant = allThemeLabels.includes('seo') ||
            allThemeLabels.includes('agence') ||
            allThemeLabels.includes('montreal') ||
            allThemeLabels.includes('ranking') ||
            allThemeLabels.includes('local');
        expect(hasRelevant).toBe(true);
    });

    it('sparse client context still blocks junk but keeps intent/industry fallback', () => {
        const anchors = buildRelevanceAnchors(SPARSE_CLIENT);

        const docs = [
            makeDoc('Best SEO tools recommendation', 'Compare the top SEO platforms for your business.'),
            makeDoc('Best SEO tools recommendation', 'Compare the top SEO platforms for your business.'),
            makeDoc('Best SEO tools recommendation', 'Compare the top SEO platforms for your business.'),
            makeDoc('Best park for kids', 'A beautiful park with playground.'),
            makeDoc('Best park for kids', 'A beautiful park with playground.'),
            makeDoc('Best park for kids', 'A beautiful park with playground.'),
        ];

        const mentions = extractMentionsFromDocuments(docs, CLIENT_ID, anchors);
        const clusters = aggregateMentionsToClusters(mentions, CLIENT_ID, anchors);
        const themeLabels = clusters.filter((c) => c.cluster_type === 'theme').map((c) => c.label);

        // Park must not survive even for sparse context
        expect(themeLabels).not.toContain('park');
        expect(themeLabels).not.toContain('playground');
        expect(themeLabels).not.toContain('kids');
        expect(themeLabels).not.toContain('beautiful');
    });
});
