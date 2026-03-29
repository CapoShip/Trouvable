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

    it('passes boolean headless to Playwright even when @sparticuz/chromium exports a string', async () => {
        vi.stubEnv('AUDIT_DISABLE_PLAYWRIGHT', '');
        vi.stubEnv('AUDIT_BROWSER_WS_ENDPOINT', '');

        const mockBrowser = {
            newContext: vi.fn().mockResolvedValue({
                newPage: vi.fn(),
                close: vi.fn(),
            }),
            close: vi.fn(),
        };

        const launchSpy = vi.fn().mockResolvedValue(mockBrowser);

        vi.doMock('playwright-core', () => ({
            chromium: {
                launch: launchSpy,
                connect: vi.fn(),
            },
        }));

        // @sparticuz/chromium exports headless as string 'shell' — Playwright expects boolean
        vi.doMock('@sparticuz/chromium', () => ({
            default: {
                executablePath: vi.fn().mockResolvedValue('/tmp/chromium'),
                headless: 'shell',
                args: ['--no-sandbox'],
            },
        }));

        const { createPlaywrightRenderer } = await import('@/lib/audit/playwright-renderer');
        await createPlaywrightRenderer();

        expect(launchSpy).toHaveBeenCalledOnce();
        const launchConfig = launchSpy.mock.calls[0][0];
        expect(typeof launchConfig.headless).toBe('boolean');
        expect(launchConfig.headless).toBe(true);
        expect(launchConfig.executablePath).toBe('/tmp/chromium');
        expect(launchConfig.args).toEqual(['--no-sandbox']);
    });

    it('falls back to local browser when @sparticuz/chromium is unavailable and AUDIT_ALLOW_LOCAL_BROWSER is set', async () => {
        vi.stubEnv('AUDIT_DISABLE_PLAYWRIGHT', '');
        vi.stubEnv('AUDIT_BROWSER_WS_ENDPOINT', '');
        vi.stubEnv('AUDIT_ALLOW_LOCAL_BROWSER', '1');

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

    it('does not fall back to local browser when AUDIT_ALLOW_LOCAL_BROWSER is not set', async () => {
        vi.stubEnv('AUDIT_DISABLE_PLAYWRIGHT', '');
        vi.stubEnv('AUDIT_BROWSER_WS_ENDPOINT', '');
        vi.stubEnv('AUDIT_ALLOW_LOCAL_BROWSER', '');

        vi.doMock('playwright-core', () => ({
            chromium: {
                launch: vi.fn().mockRejectedValue(new Error('should not be called')),
                connect: vi.fn(),
            },
        }));

        vi.doMock('@sparticuz/chromium', () => {
            throw new Error('Module not found');
        });

        const { createPlaywrightRenderer } = await import('@/lib/audit/playwright-renderer');
        const renderer = await createPlaywrightRenderer();
        expect(renderer.available).toBe(false);
        expect(renderer.reason).toContain('No browser strategy succeeded');
        expect(renderer.reason).toContain('serverless:');
        expect(renderer.reason).toContain('local:');
    });

    it('returns available: false with truthful error chain when all strategies fail', async () => {
        vi.stubEnv('AUDIT_DISABLE_PLAYWRIGHT', '');
        vi.stubEnv('AUDIT_BROWSER_WS_ENDPOINT', '');
        vi.stubEnv('AUDIT_ALLOW_LOCAL_BROWSER', '1');

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
        expect(typeof renderer.reason).toBe('string');
        expect(renderer.reason.length).toBeGreaterThan(0);
        // Should contain the full failure chain, not just a single error
        expect(renderer.reason).toContain('No browser strategy succeeded');
        expect(renderer.reason).toContain('serverless:');
        expect(renderer.reason).toContain('local:');
    });

    it('preserves serverless chromium failure reason instead of swallowing it', async () => {
        vi.stubEnv('AUDIT_DISABLE_PLAYWRIGHT', '');
        vi.stubEnv('AUDIT_BROWSER_WS_ENDPOINT', '');
        vi.stubEnv('AUDIT_ALLOW_LOCAL_BROWSER', '');

        vi.doMock('playwright-core', () => ({
            chromium: {
                launch: vi.fn(),
                connect: vi.fn(),
            },
        }));

        vi.doMock('@sparticuz/chromium', () => {
            throw new Error('Cannot find module @sparticuz/chromium');
        });

        const { createPlaywrightRenderer } = await import('@/lib/audit/playwright-renderer');
        const renderer = await createPlaywrightRenderer();
        expect(renderer.available).toBe(false);
        // The reason should contain the serverless failure, not a misleading local browser error
        expect(renderer.reason).toContain('serverless:');
        // Regression: must NOT surface the original misleading "npx playwright install" error
        expect(renderer.reason).not.toContain('npx playwright install');
    });
});
