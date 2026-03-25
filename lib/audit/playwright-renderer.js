import 'server-only';

const DEFAULT_RENDER_TIMEOUT_MS = 16000;
const DEFAULT_NETWORK_IDLE_WAIT_MS = 3200;
const DEFAULT_SETTLE_WAIT_MS = 450;

function getRendererUserAgent() {
    return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko, TrouvableAuditBot/3.0 Rendered)';
}

function detectHydrationHints(html = '') {
    const hints = [];
    if (!html) return hints;
    if (html.includes('__NEXT_DATA__')) hints.push('next_data');
    if (html.includes('data-reactroot')) hints.push('react_root');
    if (html.includes('id="__nuxt"')) hints.push('nuxt_root');
    if (html.includes('id="root"')) hints.push('root_shell');
    if (html.includes('data-hydration')) hints.push('hydration_marker');
    return [...new Set(hints)];
}

function countWords(text = '') {
    const normalized = String(text || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return 0;
    return normalized.split(' ').length;
}

export async function createPlaywrightRenderer() {
    if (process.env.VERCEL === '1' || process.env.AUDIT_DISABLE_PLAYWRIGHT === '1') {
        return {
            available: false,
            reason: 'disabled_in_serverless',
            async render() {
                return { ok: false, error: 'Playwright rendering is disabled on Vercel or by config. Falling back.' };
            },
            async close() { },
        };
    }

    try {
        const { chromium } = await import('playwright');
        const browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
        const context = await browser.newContext({
            userAgent: getRendererUserAgent(),
            ignoreHTTPSErrors: true,
        });

        return {
            available: true,
            reason: null,
            async render(url) {
                const page = await context.newPage();
                try {
                    const timeoutMs = Number(process.env.AUDIT_PLAYWRIGHT_TIMEOUT_MS || DEFAULT_RENDER_TIMEOUT_MS);
                    const response = await page.goto(url, {
                        timeout: timeoutMs,
                        waitUntil: 'domcontentloaded',
                    });

                    await Promise.race([
                        page.waitForLoadState('networkidle', { timeout: DEFAULT_NETWORK_IDLE_WAIT_MS }),
                        page.waitForTimeout(DEFAULT_NETWORK_IDLE_WAIT_MS),
                    ]).catch(() => null);

                    await page.waitForTimeout(DEFAULT_SETTLE_WAIT_MS);

                    const finalUrl = page.url();
                    const html = await page.content();
                    const title = await page.title().catch(() => '');
                    const bodyText = await page.locator('body').innerText().catch(() => '');
                    const visibleWordCount = countWords(bodyText);
                    const hydrationHints = detectHydrationHints(html);
                    const appShellLikely = visibleWordCount < 120 && hydrationHints.length > 0;

                    return {
                        ok: true,
                        url,
                        finalUrl,
                        statusCode: response?.status() || null,
                        title: title || null,
                        html,
                        visibleWordCount,
                        hydrationHints,
                        appShellLikely,
                    };
                } catch (error) {
                    return {
                        ok: false,
                        url,
                        error: error?.message || 'Playwright render failed',
                    };
                } finally {
                    await page.close().catch(() => { });
                }
            },
            async close() {
                await context.close().catch(() => { });
                await browser.close().catch(() => { });
            },
        };
    } catch (error) {
        return {
            available: false,
            reason: error?.message || 'playwright_unavailable',
            async render() {
                return { ok: false, error: 'Playwright unavailable' };
            },
            async close() { },
        };
    }
}
