/**
 * Layer 1 public surface.
 *
 * This index re-exports the pure URL utilities, sitemap discovery, page check
 * registry, and raw scoring helpers. The Trouvable scanner wires them in via
 * `lib/audit/scanner.js` so there remains a SINGLE primary crawl engine.
 */

export { normalizeUrl, isLikelyHtmlUrl, sameOrigin, extractSameOriginLinks, originFor, pathOnly } from './url-utils.js';
export { discoverSitemapUrls } from './sitemap.js';
export { runPageChecks, PAGE_CHECK_CATEGORIES, PAGE_CHECK_STATUS } from './page-checks.js';
export { aggregateRawScores } from './raw-scoring.js';
