import { beforeEach, describe, expect, it, vi } from 'vitest';

const geoCompareViewMock = vi.fn(() => null);
vi.mock('@/app/admin/(gate)/views/GeoCompareView', () => ({
    default: geoCompareViewMock,
}));

const useGeoClientMock = vi.fn();
vi.mock('@/app/admin/(gate)/context/ClientContext', () => ({
    useGeoClient: useGeoClientMock,
}));

describe('geo compare route wiring', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('keeps global route in free mode', async () => {
        const { default: GeoComparePage } = await import('@/app/admin/(gate)/geo-compare/page');
        GeoComparePage();

        expect(geoCompareViewMock).toHaveBeenCalledTimes(1);
        expect(geoCompareViewMock).toHaveBeenCalledWith({}, undefined);
    });

    it('wires client route with linked client context', async () => {
        useGeoClientMock.mockReturnValue({
            clientId: 'client-123',
            client: { client_name: 'Trouvable Test' },
        });

        const { default: ClientGeoComparePage } = await import('@/app/admin/(gate)/clients/[id]/geo-compare/page');
        ClientGeoComparePage();

        expect(geoCompareViewMock).toHaveBeenCalledTimes(1);
        expect(geoCompareViewMock).toHaveBeenCalledWith({
            linkedClientId: 'client-123',
            linkedClientName: 'Trouvable Test',
        }, undefined);
    });
});
