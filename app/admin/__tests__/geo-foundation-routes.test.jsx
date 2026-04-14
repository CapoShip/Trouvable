import { beforeEach, describe, expect, it, vi } from 'vitest';

const redirectMock = vi.fn();
const geoCrawlersViewMock = vi.fn(() => null);
const geoSchemaViewMock = vi.fn(() => null);

vi.mock('next/navigation', () => ({
    redirect: redirectMock,
}));

vi.mock('@/app/admin/(gate)/views/GeoCrawlersView', () => ({
    default: geoCrawlersViewMock,
}));

vi.mock('@/app/admin/(gate)/views/GeoSchemaView', () => ({
    default: geoSchemaViewMock,
}));

describe('geo foundation route wiring', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('wires the client GEO crawlers route to the crawlers view', async () => {
        const { default: GeoCrawlersPage } = await import('@/app/admin/(gate)/clients/[id]/geo/crawlers/page');

        GeoCrawlersPage();

        expect(geoCrawlersViewMock).toHaveBeenCalledTimes(1);
        expect(geoCrawlersViewMock).toHaveBeenCalledWith({}, undefined);
    });

    it('wires the client GEO schema route to the schema view', async () => {
        const { default: GeoSchemaPage } = await import('@/app/admin/(gate)/clients/[id]/geo/schema/page');

        GeoSchemaPage();

        expect(geoSchemaViewMock).toHaveBeenCalledTimes(1);
        expect(geoSchemaViewMock).toHaveBeenCalledWith({}, undefined);
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
});