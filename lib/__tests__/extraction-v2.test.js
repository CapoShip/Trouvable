import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { buildExtractionArtifacts, getExtractionVersion } from '../queries/extraction-v2.js';

describe('getExtractionVersion', () => {
    it('returns v2.2.0', () => {
        expect(getExtractionVersion()).toBe('v2.2.0');
    });
});

describe('buildExtractionArtifacts', () => {
    const baseParams = {
        queryText: 'Best plumber in Montreal',
        responseText: 'ABC Plumbing is a top plumber in Montreal. XYZ Services also operates there. Visit https://yelp.com/biz/abc for reviews.',
        analysis: {
            mentioned_businesses: [
                { name: 'ABC Plumbing', position: 1, context: 'ABC Plumbing is a top plumber', is_target: true, sentiment: 'positive' },
                { name: 'XYZ Services', position: 2, context: 'XYZ Services also operates', is_target: false, sentiment: 'neutral' },
            ],
        },
        clientName: 'ABC Plumbing',
        clientDomain: 'https://abcplumbing.com',
        competitorAliases: [],
        knownCompetitors: ['XYZ Services'],
    };

    it('detects the target business', () => {
        const result = buildExtractionArtifacts(baseParams);
        expect(result.targetDetection.target_found).toBe(true);
        expect(result.targetDetection.detection_method).toBe('structured');
    });

    it('classifies known competitors as competitor entity type', () => {
        const result = buildExtractionArtifacts(baseParams);
        const competitors = result.mentionRows.filter((r) => r.entity_type === 'competitor');
        expect(competitors.length).toBeGreaterThanOrEqual(1);
        expect(competitors.some((c) => c.business_name === 'XYZ Services')).toBe(true);
    });

    it('classifies unknown non-target businesses as generic_mention', () => {
        const params = {
            ...baseParams,
            knownCompetitors: [],
            analysis: {
                mentioned_businesses: [
                    { name: 'ABC Plumbing', position: 1, context: 'ABC Plumbing is a top plumber', is_target: true, sentiment: 'positive' },
                    { name: 'Random Restaurant', position: 2, context: 'Random Restaurant is nearby', is_target: false, sentiment: 'neutral' },
                ],
            },
        };
        const result = buildExtractionArtifacts(params);
        const generic = result.mentionRows.filter((r) => r.entity_type === 'generic_mention');
        expect(generic.length).toBeGreaterThanOrEqual(1);
        expect(generic.some((g) => g.business_name === 'Random Restaurant')).toBe(true);
    });

    it('classifies peers in French comparative prose as competitors (response window + cues)', () => {
        const responseText =
            "PortfolioSignal se démarque. Contrairement à des plateformes comme Wealthsimple (https://www.wealthsimple.com/) ou Nest Wealth (https://www.nestwealth.com/), automatisées. "
            + "D'autres entreprises, telles que Questrade (https://www.questrade.com/), existent aussi.";
        const result = buildExtractionArtifacts({
            queryText: "Qu'est-ce qui démarque Portfolio Signal ?",
            responseText,
            analysis: {
                mentioned_businesses: [
                    { name: 'PortfolioSignal', position: 1, context: 'PortfolioSignal se démarque', is_target: true, sentiment: 'positive' },
                    { name: 'Wealthsimple', position: 2, context: 'Wealthsimple', is_target: false, sentiment: 'neutral' },
                    { name: 'Nest Wealth', position: 3, context: 'Nest Wealth', is_target: false, sentiment: 'neutral' },
                    { name: 'Questrade', position: 4, context: 'Questrade', is_target: false, sentiment: 'neutral' },
                ],
            },
            clientName: 'PortfolioSignal',
            clientDomain: null,
            competitorAliases: [],
            knownCompetitors: [],
        });
        for (const name of ['Wealthsimple', 'Nest Wealth', 'Questrade']) {
            const row = result.mentionRows.find((r) => r.business_name === name);
            expect(row, `expected mention row for ${name}`).toBeTruthy();
            expect(row.entity_type).toBe('competitor');
        }
    });

    it('extracts source mentions from URLs', () => {
        const result = buildExtractionArtifacts(baseParams);
        const sources = result.mentionRows.filter((r) => r.entity_type === 'source');
        expect(sources.length).toBeGreaterThanOrEqual(1);
        expect(sources[0].source_type).toBe('review_platform');
    });

    it('produces correct counts separating competitors from generic', () => {
        const result = buildExtractionArtifacts(baseParams);
        expect(result.counts.competitors).toBeGreaterThanOrEqual(0);
        expect(typeof result.counts.generic_mentions).toBe('number');
        expect(typeof result.counts.external_sources).toBe('number');
    });

    it('handles empty response gracefully', () => {
        const result = buildExtractionArtifacts({
            ...baseParams,
            responseText: '',
            analysis: {},
        });
        expect(result.parseStatus).toBe('parsed_failed');
        expect(result.parseWarnings.length).toBeGreaterThan(0);
        expect(result.targetDetection.target_found).toBe(false);
    });

    it('handles missing analysis gracefully', () => {
        const result = buildExtractionArtifacts({
            ...baseParams,
            analysis: null,
        });
        expect(result.parseWarnings).toContain('Analyse structuree absente; heuristiques de secours appliquees.');
    });

    it('produces diagnostics for zero competitors', () => {
        const params = {
            ...baseParams,
            knownCompetitors: [],
            analysis: {
                mentioned_businesses: [
                    { name: 'ABC Plumbing', position: 1, context: 'top plumber', is_target: true, sentiment: 'positive' },
                ],
            },
        };
        const result = buildExtractionArtifacts(params);
        expect(result.diagnostics.zero_competitor_reason).toBeTruthy();
    });

    it('marks competitor context strength correctly (scoped to context only)', () => {
        const params = {
            ...baseParams,
            knownCompetitors: ['Strong Comp'],
            analysis: {
                mentioned_businesses: [
                    { name: 'ABC Plumbing', position: 1, context: 'top plumber', is_target: true, sentiment: 'positive' },
                    { name: 'Strong Comp', position: 2, context: 'Strong Comp is the top meilleur choice', is_target: false, sentiment: 'positive' },
                ],
            },
        };
        const result = buildExtractionArtifacts(params);
        const comp = result.mentionRows.find((r) => r.business_name === 'Strong Comp');
        expect(comp).toBeTruthy();
        expect(comp.recommendation_strength).toBe('strong');
    });

    it('provides entity_breakdown in diagnostics', () => {
        const result = buildExtractionArtifacts(baseParams);
        expect(result.diagnostics.entity_breakdown).toBeDefined();
        expect(typeof result.diagnostics.entity_breakdown.competitors).toBe('number');
        expect(typeof result.diagnostics.entity_breakdown.generic_mentions).toBe('number');
        expect(typeof result.diagnostics.entity_breakdown.sources).toBe('number');
    });
});
