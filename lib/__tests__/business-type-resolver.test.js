import { describe, it, expect } from 'vitest';
import { resolveBusinessType } from '@/lib/ai/business-type-resolver';

// ──────────────────────────────────────────────────────────────
// Business type resolver — canonical resolution tests
// ──────────────────────────────────────────────────────────────

describe('resolveBusinessType', () => {
    it('resolves Trouvable to ai_visibility_software even with weak profile data', () => {
        // Simulates Trouvable with empty/generic business_type and no site_classification
        const result = resolveBusinessType('', {}, 'Trouvable');
        expect(result.canonical_category).toBe('ai_visibility_software');
        expect(result.canonical_subcategory).toBe('local_ai_visibility_platform');
        expect(result.business_model_detected).toBe('saas');
        expect(result.target_audience).toBe('b2b');
        expect(result.category_confidence).toBe('strong');
        expect(result.needs_review).toBe(false);
    });

    it('resolves Trouvable with generic LocalBusiness schema type', () => {
        const result = resolveBusinessType('LocalBusiness', { type: 'generic_business' }, 'Trouvable');
        expect(result.canonical_category).toBe('ai_visibility_software');
        expect(result.business_model_detected).toBe('saas');
        expect(result.target_audience).toBe('b2b');
        expect(result.category_confidence).toBe('strong');
    });

    it('resolves Trouvable with explicit SEO signals in site_classification', () => {
        const result = resolveBusinessType('', { type: 'saas_software', label: 'SEO platform' }, 'Trouvable');
        expect(result.canonical_category).toBe('ai_visibility_software');
        expect(result.business_model_detected).toBe('saas');
        expect(result.category_confidence).toBe('strong');
    });

    it('returns unknown for generic client with empty profile', () => {
        const result = resolveBusinessType('', {}, 'Acme Corp');
        expect(result.canonical_category).toBe('unknown');
        expect(result.needs_review).toBe(true);
        expect(result.category_confidence).toBe('weak');
    });

    it('resolves descriptive Schema.org types correctly', () => {
        const result = resolveBusinessType('Restaurant', {}, 'Le Petit Bistro');
        expect(result.business_model_detected).toBe('local_service');
        expect(result.target_audience).toBe('b2c');
        expect(result.category_confidence).toBe('high');
    });

    it('resolves SaaS signals from services in site_classification', () => {
        const result = resolveBusinessType('', {
            type: 'generic_business',
            services_preview: ['Cloud platform', 'API integration'],
        }, 'TechCo');
        expect(result.business_model_detected).toBe('saas');
        expect(result.target_audience).toBe('b2b');
    });

    it('uses client name as part of resolution signals', () => {
        // A client named "Salon Beauté" should contribute to resolution
        const result = resolveBusinessType('', {}, 'Salon Beauté Montreal');
        expect(result.business_model_detected).toBe('local_service');
    });
});
