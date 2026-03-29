import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db', () => ({}));
vi.mock('@/lib/db/community', () => ({}));

import { buildSeedQueries, buildRelevanceAnchors, scoreThemeRelevance } from '@/lib/agent-reach/pipeline';

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
        expect(junkRelevance).toBeLessThan(0.15); // Below threshold → filtered out
        expect(relevantRelevance).toBeGreaterThanOrEqual(0.15); // Above threshold → kept
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
        const THEME_RELEVANCE_THRESHOLD = 0.15;

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
        const THEME_RELEVANCE_THRESHOLD = 0.15;

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
