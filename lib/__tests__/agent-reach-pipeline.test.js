import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db', () => ({}));
vi.mock('@/lib/db/community', () => ({}));

import { buildSeedQueries, buildRelevanceAnchors, scoreThemeRelevance } from '../agent-reach/pipeline.js';

// ──────────────────────────────────────────────────────────────
// buildSeedQueries
// ──────────────────────────────────────────────────────────────

describe('buildSeedQueries', () => {
    it('generates seeds from client name, business type, and city', () => {
        const seeds = buildSeedQueries({
            client_name: 'Trouvable',
            business_type: 'visibilité locale',
            address: { city: 'Paris' },
        });
        expect(seeds.length).toBeGreaterThanOrEqual(3);
        expect(seeds.some((s) => s.includes('Trouvable'))).toBe(true);
        expect(seeds.some((s) => s.includes('Paris'))).toBe(true);
        expect(seeds.some((s) => s.includes('visibilité locale'))).toBe(true);
    });

    it('handles missing fields gracefully', () => {
        const seeds = buildSeedQueries({ client_name: 'Acme' });
        expect(seeds.length).toBeGreaterThanOrEqual(1);
        expect(seeds.some((s) => s.includes('Acme'))).toBe(true);
    });

    it('limits to 5 seeds', () => {
        const seeds = buildSeedQueries({
            client_name: 'LongNameCorp',
            business_type: 'consulting',
            address: { city: 'Lyon' },
        });
        expect(seeds.length).toBeLessThanOrEqual(5);
    });
});

// ──────────────────────────────────────────────────────────────
// buildRelevanceAnchors
// ──────────────────────────────────────────────────────────────

describe('buildRelevanceAnchors', () => {
    it('builds anchors from client identity fields', () => {
        const anchors = buildRelevanceAnchors({
            client_name: 'Trouvable',
            business_type: 'visibilité locale',
            address: { city: 'Paris' },
        });
        expect(anchors.has('trouvable')).toBe(true);
        expect(anchors.has('paris')).toBe(true);
        expect(anchors.has('visibilité locale')).toBe(true);
    });

    it('handles null/missing client fields', () => {
        const anchors = buildRelevanceAnchors(null);
        expect(anchors.size).toBe(0);
    });

    it('filters stopwords from tokens', () => {
        const anchors = buildRelevanceAnchors({
            client_name: 'The Best Service',
            business_type: 'web design',
        });
        // 'the' and 'best' should be filtered out as stopwords
        expect(anchors.has('the')).toBe(false);
        expect(anchors.has('best')).toBe(false);
        // but 'design' should remain
        expect(anchors.has('design')).toBe(true);
    });
});

// ──────────────────────────────────────────────────────────────
// scoreThemeRelevance
// ──────────────────────────────────────────────────────────────

describe('scoreThemeRelevance', () => {
    const anchors = new Set(['trouvable', 'visibilité', 'locale', 'paris', 'visibilité locale']);

    it('returns 1.0 for exact match', () => {
        expect(scoreThemeRelevance('trouvable', anchors)).toBe(1.0);
        expect(scoreThemeRelevance('visibilité locale', anchors)).toBe(1.0);
    });

    it('returns high score for label containing an anchor', () => {
        const score = scoreThemeRelevance('trouvable avis', anchors);
        expect(score).toBeGreaterThanOrEqual(0.6);
    });

    it('returns moderate score for token overlap', () => {
        const score = scoreThemeRelevance('paris commerce', anchors);
        expect(score).toBeGreaterThanOrEqual(0.4);
    });

    it('returns 0 for completely irrelevant themes', () => {
        const score = scoreThemeRelevance('park oven random', anchors);
        expect(score).toBe(0);
    });

    it('returns 0 for empty label or empty anchors', () => {
        expect(scoreThemeRelevance('', anchors)).toBe(0);
        expect(scoreThemeRelevance('test', new Set())).toBe(0);
    });

    it('filters junk tokens like park and oven', () => {
        expect(scoreThemeRelevance('park', anchors)).toBe(0);
        expect(scoreThemeRelevance('oven', anchors)).toBe(0);
        expect(scoreThemeRelevance('random', anchors)).toBe(0);
    });
});
