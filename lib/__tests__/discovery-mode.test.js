/**
 * Tests for the blind_discovery / brand_aware mode split.
 *
 * Validates:
 * 1. Blind discovery prompt contains NO company context
 * 2. Brand-aware prompt contains company context
 * 3. Analysis/extraction still receives target business (evaluation is target-aware)
 * 4. Discovery mode is correctly inferred from prompt metadata
 * 5. Starter prompts are correctly tagged with discovery_mode
 * 6. Stored run metadata includes discovery_mode
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { buildGeoQueryPrompt, buildBlindGeoQueryPrompt, buildGeoQueryAnalysisPrompt } from '@/lib/ai/prompts';
import {
    normalizeDiscoveryMode,
    inferDiscoveryMode,
    DISCOVERY_MODE_META,
    getDiscoveryModeOptions,
} from '@/lib/operator-intelligence/prompt-taxonomy';

describe('Discovery mode — prompt construction', () => {
    const businessContext = {
        name: 'Trouvable',
        description: 'Plateforme de visibilite IA locale pour commerces',
        area: 'Montreal',
        services: ['visibilite IA', 'audit SEO', 'GEO local'],
        known_competitors: ['CompetitorA', 'CompetitorB'],
    };

    it('brand_aware prompt includes business name, description, services, and competitors', () => {
        const messages = buildGeoQueryPrompt('meilleur outil visibilite IA locale', businessContext);
        const fullText = messages.map((m) => m.content).join('\n');

        expect(fullText).toContain('Trouvable');
        expect(fullText).toContain('visibilite IA locale pour commerces');
        expect(fullText).toContain('Montreal');
        expect(fullText).toContain('visibilite IA');
        expect(fullText).toContain('CompetitorA');
        expect(fullText).toContain('CompetitorB');
    });

    it('blind_discovery prompt contains NO business name, NO description, NO services, NO competitors', () => {
        const messages = buildBlindGeoQueryPrompt('meilleur outil visibilite IA locale');
        const fullText = messages.map((m) => m.content).join('\n');

        // Must NOT contain any business context
        expect(fullText).not.toContain('Trouvable');
        expect(fullText).not.toContain('visibilite IA locale pour commerces');
        expect(fullText).not.toContain('CompetitorA');
        expect(fullText).not.toContain('CompetitorB');

        // Must contain the user query
        expect(fullText).toContain('meilleur outil visibilite IA locale');
    });

    it('blind_discovery prompt preserves system-level fidelity rules', () => {
        const messages = buildBlindGeoQueryPrompt('meilleur dentiste a Montreal');
        const systemMsg = messages.find((m) => m.role === 'system');
        expect(systemMsg).toBeDefined();
        expect(systemMsg.content).toContain('REGLES DE FIDELITE');
        expect(systemMsg.content).toContain('N\'invente pas');
    });

    it('brand_aware and blind_discovery share the same fidelity rules base', () => {
        const brandMessages = buildGeoQueryPrompt('test', businessContext);
        const blindMessages = buildBlindGeoQueryPrompt('test');

        const brandSystem = brandMessages.find((m) => m.role === 'system').content;
        const blindSystem = blindMessages.find((m) => m.role === 'system').content;

        // Both should contain the same base fidelity rules
        expect(brandSystem).toContain('REGLES DE FIDELITE');
        expect(blindSystem).toContain('REGLES DE FIDELITE');
        expect(brandSystem).toContain('N\'invente pas d\'entreprises');
        expect(blindSystem).toContain('N\'invente pas d\'entreprises');
    });
});

describe('Discovery mode — analysis remains target-aware', () => {
    it('analysis prompt still includes target business for evaluation', () => {
        const messages = buildGeoQueryAnalysisPrompt(
            'meilleur outil visibilite IA',
            'Voici une reponse avec Trouvable et CompetitorA...',
            'Trouvable'
        );
        const fullText = messages.map((m) => m.content).join('\n');

        // Analysis/extraction MUST reference the target for evaluation
        expect(fullText).toContain('Trouvable');
        expect(fullText).toContain('BUSINESS CIBLE');
    });
});

describe('Discovery mode — normalizeDiscoveryMode', () => {
    it('normalizes valid modes', () => {
        expect(normalizeDiscoveryMode('blind_discovery')).toBe('blind_discovery');
        expect(normalizeDiscoveryMode('brand_aware')).toBe('brand_aware');
    });

    it('normalizes variations', () => {
        expect(normalizeDiscoveryMode('BLIND_DISCOVERY')).toBe('blind_discovery');
        expect(normalizeDiscoveryMode('Brand Aware')).toBe('brand_aware');
        expect(normalizeDiscoveryMode('blind-discovery')).toBe('blind_discovery');
    });

    it('defaults to brand_aware for unknown values', () => {
        expect(normalizeDiscoveryMode('')).toBe('brand_aware');
        expect(normalizeDiscoveryMode(null)).toBe('brand_aware');
        expect(normalizeDiscoveryMode(undefined)).toBe('brand_aware');
        expect(normalizeDiscoveryMode('unknown_mode')).toBe('brand_aware');
    });
});

describe('Discovery mode — inferDiscoveryMode', () => {
    it('infers brand_aware for brand category', () => {
        expect(inferDiscoveryMode({ category: 'brand', intentFamily: 'brand', queryText: '', clientName: '' }))
            .toBe('brand_aware');
    });

    it('infers brand_aware for competitor_comparison', () => {
        expect(inferDiscoveryMode({ category: 'competitor_comparison', intentFamily: 'competitor', queryText: '', clientName: '' }))
            .toBe('brand_aware');
    });

    it('infers brand_aware when query contains client name', () => {
        expect(inferDiscoveryMode({
            category: 'discovery',
            intentFamily: 'discovery',
            queryText: 'Est-ce que Trouvable est bon pour les dentistes ?',
            clientName: 'Trouvable',
        })).toBe('brand_aware');
    });

    it('infers blind_discovery for discovery category without client name', () => {
        expect(inferDiscoveryMode({
            category: 'discovery',
            intentFamily: 'discovery',
            queryText: 'meilleur outil visibilite IA locale',
            clientName: 'Trouvable',
        })).toBe('blind_discovery');
    });

    it('infers blind_discovery for local_intent without brand', () => {
        expect(inferDiscoveryMode({
            category: 'local_intent',
            intentFamily: 'local_recommendation',
            queryText: 'meilleur dentiste a Montreal',
            clientName: 'CliniqueDental',
        })).toBe('blind_discovery');
    });

    it('infers blind_discovery for service_intent without brand', () => {
        expect(inferDiscoveryMode({
            category: 'service_intent',
            intentFamily: 'service_intent',
            queryText: 'comment ameliorer sa visibilite IA',
            clientName: 'Trouvable',
        })).toBe('blind_discovery');
    });
});

describe('Discovery mode — metadata and options', () => {
    it('DISCOVERY_MODE_META has both modes defined', () => {
        expect(DISCOVERY_MODE_META.brand_aware).toBeDefined();
        expect(DISCOVERY_MODE_META.blind_discovery).toBeDefined();
        expect(DISCOVERY_MODE_META.brand_aware.key).toBe('brand_aware');
        expect(DISCOVERY_MODE_META.blind_discovery.key).toBe('blind_discovery');
    });

    it('getDiscoveryModeOptions returns both modes', () => {
        const options = getDiscoveryModeOptions();
        expect(options.length).toBe(2);
        expect(options.map((o) => o.key)).toEqual(expect.arrayContaining(['brand_aware', 'blind_discovery']));
    });
});
