import { beforeEach, describe, expect, it, vi } from 'vitest';

const redirectMock = vi.fn();

vi.mock('next/navigation', () => ({
    redirect: redirectMock,
}));

describe('seo actions route wiring', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('redirects the client SEO actions route to the GEO remediation queue', async () => {
        const { default: SeoActionsPage } = await import('@/app/admin/(gate)/clients/[id]/seo/actions/page');

        await SeoActionsPage({
            params: Promise.resolve({ id: 'client-123' }),
        });

        expect(redirectMock).toHaveBeenCalledWith('/admin/clients/client-123/geo/opportunities');
    });
});