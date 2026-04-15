import { beforeEach, describe, expect, it, vi } from 'vitest';

const redirectMock = vi.fn();
const geoOverviewViewMock = vi.fn(() => null);
const geoCrawlersViewMock = vi.fn(() => null);
const geoSchemaViewMock = vi.fn(() => null);
const geoReadinessViewMock = vi.fn(() => null);

vi.mock('next/navigation', () => ({
    redirect: redirectMock,
}));

vi.mock('@/app/admin/(gate)/views/GeoCrawlersView', () => ({
    default: geoCrawlersViewMock,
}));

vi.mock('@/app/admin/(gate)/views/GeoOverviewView', () => ({
    default: geoOverviewViewMock,
}));

vi.mock('@/app/admin/(gate)/views/GeoSchemaView', () => ({
    default: geoSchemaViewMock,
}));

vi.mock('@/app/admin/(gate)/views/GeoReadinessView', () => ({
    default: geoReadinessViewMock,
}));

describe('geo foundation route wiring', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('wires the client GEO crawlers route to the crawlers view', async () => {
        const { default: GeoCrawlersPage } = await import('@/app/admin/(gate)/clients/[id]/geo/crawlers/page');

        const element = GeoCrawlersPage();

        expect(element.type).toBe(geoCrawlersViewMock);
        expect(element.props).toEqual({});
    });

    it('wires the client GEO overview route to the overview view', async () => {
        const { default: GeoOverviewPage } = await import('@/app/admin/(gate)/clients/[id]/geo/page');

        const element = GeoOverviewPage();

        expect(element.type).toBe(geoOverviewViewMock);
        expect(element.props).toEqual({});
    });

    it('wires the client GEO schema route to the schema view', async () => {
        const { default: GeoSchemaPage } = await import('@/app/admin/(gate)/clients/[id]/geo/schema/page');

        const element = GeoSchemaPage();

        expect(element.type).toBe(geoSchemaViewMock);
        expect(element.props).toEqual({});
    });

    it('wires the client GEO readiness route to the readiness view', async () => {
        const { default: GeoReadinessPage } = await import('@/app/admin/(gate)/clients/[id]/geo/readiness/page');

        const element = GeoReadinessPage();

        expect(element.type).toBe(geoReadinessViewMock);
        expect(element.props).toEqual({});
    });

    it('redirects the client crawlers alias to the GEO namespace', async () => {
        const { default: GeoCrawlersAliasPage } = await import('@/app/admin/(gate)/clients/[id]/crawlers/page');

        await GeoCrawlersAliasPage({
            params: Promise.resolve({ id: 'client-123' }),
        });

        expect(redirectMock).toHaveBeenCalledWith('/admin/clients/client-123/geo/crawlers');
    });

    it('redirects the client schema alias to the GEO namespace', async () => {
        const { default: GeoSchemaAliasPage } = await import('@/app/admin/(gate)/clients/[id]/schema/page');

        await GeoSchemaAliasPage({
            params: Promise.resolve({ id: 'client-123' }),
        });

        expect(redirectMock).toHaveBeenCalledWith('/admin/clients/client-123/geo/schema');
    });

    it('redirects the client overview alias to the GEO namespace', async () => {
        const { default: OverviewAliasPage } = await import('@/app/admin/(gate)/clients/[id]/overview/page');

        await OverviewAliasPage({
            params: Promise.resolve({ id: 'client-123' }),
        });

        expect(redirectMock).toHaveBeenCalledWith('/admin/clients/client-123/geo');
    });
});
