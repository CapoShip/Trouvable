import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('server-only', () => ({}));

// ──────────────────────────────────────────────────────────────
// Web search collector tests
// ──────────────────────────────────────────────────────────────

describe('web-search-collector', () => {
    let originalEnv;

    beforeEach(() => {
        originalEnv = { ...process.env };
        // Clear search-related env vars
        delete process.env.TAVILY_API_KEY;
        delete process.env.GOOGLE_SEARCH_API_KEY;
        delete process.env.GOOGLE_SEARCH_ENGINE_ID;
    });

    afterEach(() => {
        process.env = originalEnv;
        vi.restoreAllMocks();
    });

    // Dynamic import to get fresh module after env changes
    async function loadModule() {
        // Clear module cache for fresh import
        vi.resetModules();
        return import('@/lib/agent-reach/web-search-collector');
    }

    describe('isWebSearchAvailable', () => {
        it('returns false when no search provider is configured', async () => {
            const { isWebSearchAvailable } = await loadModule();
            expect(isWebSearchAvailable()).toBe(false);
        });

        it('returns true when TAVILY_API_KEY is set', async () => {
            process.env.TAVILY_API_KEY = 'tvly-test-key';
            const { isWebSearchAvailable } = await loadModule();
            expect(isWebSearchAvailable()).toBe(true);
        });

        it('returns true when Google CSE keys are set', async () => {
            process.env.GOOGLE_SEARCH_API_KEY = 'google-key';
            process.env.GOOGLE_SEARCH_ENGINE_ID = 'engine-id';
            const { isWebSearchAvailable } = await loadModule();
            expect(isWebSearchAvailable()).toBe(true);
        });

        it('returns false when only GOOGLE_SEARCH_API_KEY is set without ENGINE_ID', async () => {
            process.env.GOOGLE_SEARCH_API_KEY = 'google-key';
            const { isWebSearchAvailable } = await loadModule();
            expect(isWebSearchAvailable()).toBe(false);
        });
    });

    describe('collectViaWebSearch', () => {
        it('returns error diagnostics when no provider is configured', async () => {
            const { collectViaWebSearch } = await loadModule();
            const seeds = [
                { query: 'Trouvable Montréal', strategy: 'brand' },
                { query: 'meilleur agence SEO Montréal', strategy: 'buyer_intent' },
            ];
            const result = await collectViaWebSearch(seeds);

            expect(result.posts).toHaveLength(0);
            expect(result.provider).toBeNull();
            expect(result.seedDiagnostics).toHaveLength(2);
            expect(result.seedDiagnostics[0].status).toBe('error');
            expect(result.seedDiagnostics[0].failure_class).toBe('source_auth_required');
            expect(result.seedDiagnostics[0].detail).toMatch(/TAVILY_API_KEY/);
        });

        it('handles Tavily results correctly when configured', async () => {
            process.env.TAVILY_API_KEY = 'tvly-test-key';

            // Mock global fetch
            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    results: [
                        {
                            title: 'Trouvable SEO agency review - Reddit',
                            url: 'https://www.reddit.com/r/montreal/comments/abc123/trouvable_seo',
                            content: 'Great SEO agency in Montreal, highly recommended',
                            published_date: '2024-06-15',
                            score: 0.95,
                        },
                        {
                            title: 'Best SEO agencies in Montreal - Quora',
                            url: 'https://www.quora.com/What-are-the-best-SEO-agencies-in-Montreal',
                            content: 'Several good options including Trouvable',
                            score: 0.85,
                        },
                    ],
                }),
            });
            vi.stubGlobal('fetch', mockFetch);

            const { collectViaWebSearch } = await loadModule();
            const seeds = [{ query: 'Trouvable Montréal', strategy: 'brand' }];
            const result = await collectViaWebSearch(seeds);

            expect(result.posts).toHaveLength(2);
            expect(result.provider).toBe('tavily');
            expect(result.seedDiagnostics[0].status).toBe('ok');
            expect(result.seedDiagnostics[0].results).toBe(2);

            // Check Reddit URL detection
            const redditPost = result.posts.find((p) => p.permalink.includes('reddit.com'));
            expect(redditPost._source_platform).toBe('reddit');
            expect(redditPost.subreddit).toBe('montreal');

            // Check Quora URL detection
            const quoraPost = result.posts.find((p) => p.permalink.includes('quora.com'));
            expect(quoraPost._source_platform).toBe('quora');
        });

        it('deduplicates results across seeds by URL', async () => {
            process.env.TAVILY_API_KEY = 'tvly-test-key';

            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    results: [
                        {
                            title: 'Same result',
                            url: 'https://www.reddit.com/r/seo/comments/same',
                            content: 'Same content',
                        },
                    ],
                }),
            });
            vi.stubGlobal('fetch', mockFetch);

            const { collectViaWebSearch } = await loadModule();
            const seeds = [
                { query: 'query 1', strategy: 'brand' },
                { query: 'query 2', strategy: 'buyer_intent' },
            ];
            const result = await collectViaWebSearch(seeds);

            // Same URL returned for both seeds should be deduped
            expect(result.posts).toHaveLength(1);
        });

        it('handles fetch failure gracefully (all providers fail)', async () => {
            process.env.TAVILY_API_KEY = 'tvly-test-key';

            const mockFetch = vi.fn().mockRejectedValue(new Error('Network timeout'));
            vi.stubGlobal('fetch', mockFetch);

            const { collectViaWebSearch } = await loadModule();
            const seeds = [{ query: 'test query', strategy: 'brand' }];
            const result = await collectViaWebSearch(seeds);

            // searchWeb catches provider failures internally and returns null
            // The collector treats this as "searched successfully but found nothing"
            expect(result.posts).toHaveLength(0);
            expect(result.seedDiagnostics[0].status).toBe('ok');
            expect(result.seedDiagnostics[0].results).toBe(0);
        });

        it('handles legacy string seeds', async () => {
            process.env.TAVILY_API_KEY = 'tvly-test-key';

            const mockFetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ results: [] }),
            });
            vi.stubGlobal('fetch', mockFetch);

            const { collectViaWebSearch } = await loadModule();
            const seeds = ['legacy string seed'];
            const result = await collectViaWebSearch(seeds);

            expect(result.seedDiagnostics[0].seed).toBe('legacy string seed');
            expect(result.seedDiagnostics[0].strategy).toBe('legacy');
        });
    });
});
