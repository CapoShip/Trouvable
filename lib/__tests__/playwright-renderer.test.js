import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

// ──────────────────────────────────────────────────────────────
// Playwright renderer — browser factory unit tests
// ──────────────────────────────────────────────────────────────

describe('playwright-renderer browser factory', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.unstubAllEnvs();
    });

    it('returns available: false when AUDIT_DISABLE_PLAYWRIGHT is set', async () => {
        vi.stubEnv('AUDIT_DISABLE_PLAYWRIGHT', '1');

        // Mock playwright-core to avoid real browser launch
        vi.doMock('playwright-core', () => ({
            chromium: {
                launch: vi.fn(),
                connect: vi.fn(),
            },
        }));

        const { createPlaywrightRenderer } = await import('@/lib/audit/playwright-renderer');
        const renderer = await createPlaywrightRenderer();
        expect(renderer.available).toBe(false);
        expect(renderer.reason).toBe('disabled_by_config');
    });

    it('attempts @sparticuz/chromium regardless of VERCEL env var', async () => {
        vi.stubEnv('AUDIT_DISABLE_PLAYWRIGHT', '');
        vi.stubEnv('VERCEL', '');
        vi.stubEnv('AUDIT_BROWSER_WS_ENDPOINT', '');

        const mockBrowser = {
            newContext: vi.fn().mockResolvedValue({
                newPage: vi.fn(),
                close: vi.fn(),
            }),
            close: vi.fn(),
        };

        vi.doMock('playwright-core', () => ({
            chromium: {
                launch: vi.fn().mockResolvedValue(mockBrowser),
                connect: vi.fn(),
            },
        }));

        vi.doMock('@sparticuz/chromium', () => ({
            default: {
                executablePath: vi.fn().mockResolvedValue('/tmp/chromium'),
                headless: 'shell',
                args: ['--no-sandbox'],
            },
        }));

        const { createPlaywrightRenderer } = await import('@/lib/audit/playwright-renderer');
        const renderer = await createPlaywrightRenderer();
        expect(renderer.available).toBe(true);
        expect(renderer.reason).toBe('serverless_chromium');
    });

    it('falls back to local browser when @sparticuz/chromium is unavailable', async () => {
        vi.stubEnv('AUDIT_DISABLE_PLAYWRIGHT', '');
        vi.stubEnv('AUDIT_BROWSER_WS_ENDPOINT', '');

        const mockBrowser = {
            newContext: vi.fn().mockResolvedValue({
                newPage: vi.fn(),
                close: vi.fn(),
            }),
            close: vi.fn(),
        };

        vi.doMock('playwright-core', () => ({
            chromium: {
                launch: vi.fn().mockResolvedValue(mockBrowser),
                connect: vi.fn(),
            },
        }));

        // Simulate @sparticuz/chromium not available
        vi.doMock('@sparticuz/chromium', () => {
            throw new Error('Module not found');
        });

        const { createPlaywrightRenderer } = await import('@/lib/audit/playwright-renderer');
        const renderer = await createPlaywrightRenderer();
        expect(renderer.available).toBe(true);
        expect(renderer.reason).toBe('local_chromium');
    });

    it('returns available: false with error reason when all strategies fail', async () => {
        vi.stubEnv('AUDIT_DISABLE_PLAYWRIGHT', '');
        vi.stubEnv('AUDIT_BROWSER_WS_ENDPOINT', '');

        vi.doMock('playwright-core', () => ({
            chromium: {
                launch: vi.fn().mockRejectedValue(new Error('libnss3.so: cannot open shared object file')),
                connect: vi.fn(),
            },
        }));

        vi.doMock('@sparticuz/chromium', () => {
            throw new Error('Module not found');
        });

        const { createPlaywrightRenderer } = await import('@/lib/audit/playwright-renderer');
        const renderer = await createPlaywrightRenderer();
        expect(renderer.available).toBe(false);
        expect(renderer.reason).toContain('libnss3');
    });
});
