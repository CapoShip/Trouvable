import * as cheerio from 'cheerio';
import {
    appendTextChunks,
    collectSchemaData,
    collectTextChunks,
    extractBusinessNames,
    extractFaqPairsFromDom,
    extractLocalSignals,
    extractPhonesAndEmails,
    extractServiceSignals,
    extractSocialLinks,
    extractTrustSignals,
    firstNonEmpty,
    inferPageType,
    mergeUnique,
    normalizeWhitespace,
    scoreLinkPriority,
    truncate,
    uniqueStrings,
} from './extraction-helpers.js';
import { createPlaywrightRenderer } from './playwright-renderer.js';

const FETCH_TIMEOUT_MS = 9000;
const MAX_PAGES_TO_SCAN = 10;
const STATIC_WORD_CONFIDENCE_THRESHOLD = 220;
const RENDERED_PAGE_ATTEMPT_LIMIT = 8;

const KEYWORD_PAGES = [
    'contact', 'about', 'a-propos', 'propos', 'service', 'services', 'prestation', 'solution',
    'faq', 'question', 'questions', 'zone', 'ville', 'region', 'secteur', 'pricing', 'tarif',
    'features', 'feature', 'product', 'produit', 'blog', 'article', 'guide', 'docs', 'documentation',
];

async function fetchWithTimeout(url) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, TrouvableAuditBot/3.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            redirect: 'follow',
        });
        clearTimeout(id);
        return response;
    } catch (err) {
        clearTimeout(id);
        throw err;
    }
}

function quickWordCountFromHtml(html = '') {
    if (!html) return 0;
    try {
        const $ = cheerio.load(html);
        const text = normalizeWhitespace($('body').text());
        if (!text) return 0;
        return text.split(/\s+/).length;
    } catch {
        return 0;
    }
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

function shouldAttemptRenderedPage({
    rendererAvailable,
    renderAttempts,
    pageIndex,
    pageType,
    staticWordCount,
    staticHydrationHints,
}) {
    if (!rendererAvailable) return false;
    if (renderAttempts >= RENDERED_PAGE_ATTEMPT_LIMIT) return false;
    if (pageType === 'homepage') return true;
    if (pageIndex <= 3) return true;
    if (staticHydrationHints.length > 0) return true;
    if (staticWordCount < STATIC_WORD_CONFIDENCE_THRESHOLD) return true;
    return false;
}

function createEmptyExtractedData() {
    return {
        emails: new Set(),
        phones: new Set(),
        social_links: new Set(),
        h1s: [],
        titles: [],
        descriptions: [],
        h2_clusters: [],
        canonicals: [],
        has_noindex: false,
        structured_data: [],
        has_faq_schema: false,
        has_local_business_schema: false,
        has_organization_schema: false,
        text_chunks: [],
        page_summaries: [],
        schema_entities: [],
        faq_pairs: [],
        business_names: [],
        local_signals: {
            cities: [],
            regions: [],
            area_served: [],
            address_lines: [],
            maps_links: [],
            local_terms: [],
        },
        service_signals: {
            services: [],
            keywords: [],
        },
        trust_signals: {
            proof_terms: [],
            review_terms: [],
            social_networks: [],
        },
        page_stats: {
            successful_pages: 0,
            faq_pages: 0,
            service_pages: 0,
            about_pages: 0,
            contact_pages: 0,
            total_word_count: 0,
        },
        technology_signals: {
            has_next_data: false,
            hydration_hints: [],
            app_shell_pages: 0,
        },
        render_stats: {
            playwright_available: false,
            playwright_reason: null,
            rendered_pages: 0,
            static_pages: 0,
            render_fallback_pages: 0,
            render_failures: 0,
        },
    };
}

export async function runSiteAudit(startUrl) {
    const results = {
        source_url: startUrl,
        resolved_url: null,
        scanned_pages: [],
        extracted_data: createEmptyExtractedData(),
        error_message: null,
    };

    let baseUrlObj;
    try {
        baseUrlObj = new URL(startUrl.startsWith('http') ? startUrl : `https://${startUrl}`);
    } catch {
        results.error_message = 'URL de depart invalide.';
        return results;
    }

    const renderer = await createPlaywrightRenderer();
    results.extracted_data.render_stats.playwright_available = renderer.available === true;
    results.extracted_data.render_stats.playwright_reason = renderer.reason || null;

    const pagesToVisit = new Map([[baseUrlObj.href, 100]]);
    const visitedPages = new Set();
    const queuedUrls = new Set([baseUrlObj.href]);
    let renderAttempts = 0;

    try {
        while (visitedPages.size < MAX_PAGES_TO_SCAN && pagesToVisit.size > 0) {
            const [targetUrl] = [...pagesToVisit.entries()].sort((a, b) => b[1] - a[1])[0];
            pagesToVisit.delete(targetUrl);

            if (visitedPages.has(targetUrl)) continue;
            visitedPages.add(targetUrl);

            const pageRecord = {
                url: targetUrl,
                final_url: null,
                status_code: null,
                page_type: 'unknown',
                success: false,
                error_message: null,
                title: null,
                render_mode: 'static',
                render_error: null,
            };

            try {
                const response = await fetchWithTimeout(targetUrl);
                pageRecord.status_code = response.status;
                pageRecord.final_url = response.url;

                if (!results.resolved_url) {
                    results.resolved_url = response.url;
                    pageRecord.page_type = 'homepage';
                }

                if (!response.ok) {
                    pageRecord.error_message = `HTTP ${response.status}`;
                    results.scanned_pages.push(pageRecord);
                    continue;
                }

                const contentType = response.headers.get('content-type') || '';
                if (!contentType.includes('text/html')) {
                    pageRecord.error_message = `Not HTML (${contentType})`;
                    results.scanned_pages.push(pageRecord);
                    continue;
                }

                const staticHtml = await response.text();
                const staticHydrationHints = detectHydrationHints(staticHtml);
                const staticWordCount = quickWordCountFromHtml(staticHtml);
                const pageIndex = visitedPages.size;

                let finalHtml = staticHtml;
                let finalHydrationHints = [...staticHydrationHints];

                const shouldRender = shouldAttemptRenderedPage({
                    rendererAvailable: renderer.available === true,
                    renderAttempts,
                    pageIndex,
                    pageType: pageRecord.page_type,
                    staticWordCount,
                    staticHydrationHints,
                });

                if (shouldRender) {
                    renderAttempts += 1;
                    const rendered = await renderer.render(pageRecord.final_url || targetUrl);
                    if (rendered.ok && rendered.html) {
                        const renderedWordCount = Number(rendered.visibleWordCount || 0);
                        const staticLooksThin = staticWordCount < STATIC_WORD_CONFIDENCE_THRESHOLD || staticHydrationHints.length > 0;
                        const renderImprovesCoverage = renderedWordCount >= (staticWordCount + 80);
                        const preferRendered = pageRecord.page_type === 'homepage' || staticLooksThin || renderImprovesCoverage;

                        if (preferRendered) {
                            finalHtml = rendered.html;
                            pageRecord.render_mode = 'playwright';
                            results.extracted_data.render_stats.rendered_pages += 1;
                        } else {
                            pageRecord.render_mode = 'static_preferred';
                            results.extracted_data.render_stats.static_pages += 1;
                        }

                        pageRecord.final_url = rendered.finalUrl || pageRecord.final_url;
                        if (!results.resolved_url && pageRecord.final_url) {
                            results.resolved_url = pageRecord.final_url;
                        }

                        finalHydrationHints = mergeUnique(finalHydrationHints, rendered.hydrationHints || []);
                    } else {
                        pageRecord.render_mode = 'static_fallback';
                        pageRecord.render_error = rendered.error || 'playwright_render_failed';
                        results.extracted_data.render_stats.render_fallback_pages += 1;
                        results.extracted_data.render_stats.render_failures += 1;
                    }
                } else {
                    results.extracted_data.render_stats.static_pages += 1;
                }

                const $ = cheerio.load(finalHtml);

                const title = firstNonEmpty($('title').text(), $('meta[property="og:title"]').attr('content'));
                const description = firstNonEmpty(
                    $('meta[name="description"]').attr('content'),
                    $('meta[property="og:description"]').attr('content'),
                    $('meta[name="twitter:description"]').attr('content'),
                );
                const h1 = normalizeWhitespace($('h1').first().text());
                const h2s = uniqueStrings($('h2').map((_, el) => $(el).text()).get()).slice(0, 12);
                const canonical = firstNonEmpty($('link[rel="canonical"]').attr('href'));
                const robots = firstNonEmpty($('meta[name="robots"]').attr('content')).toLowerCase();
                const bodyText = normalizeWhitespace($('body').text()).toLowerCase();

                pageRecord.title = title;
                pageRecord.success = true;
                if (pageRecord.page_type !== 'homepage') {
                    pageRecord.page_type = inferPageType(targetUrl, title, h1, bodyText);
                }

                const pageTextChunks = collectTextChunks($);
                const pageText = normalizeWhitespace(pageTextChunks.join(' '));
                const wordCount = pageText ? pageText.split(/\s+/).length : 0;

                const schemaData = collectSchemaData($, pageRecord.final_url || targetUrl);
                const faqPairs = [...schemaData.faqPairs, ...extractFaqPairsFromDom($, pageRecord.final_url || targetUrl)];
                const contacts = extractPhonesAndEmails($);
                const socialLinks = extractSocialLinks($);
                const businessNames = extractBusinessNames($, schemaData.schemaEntities);
                const localSignals = extractLocalSignals($, bodyText, schemaData.schemaEntities, targetUrl);
                const serviceSignals = extractServiceSignals($, pageRecord.page_type, bodyText);
                const trustSignals = extractTrustSignals(bodyText, socialLinks);

                results.extracted_data.technology_signals.has_next_data ||= finalHtml.includes('__NEXT_DATA__');
                results.extracted_data.technology_signals.hydration_hints = mergeUnique(
                    results.extracted_data.technology_signals.hydration_hints,
                    finalHydrationHints
                );
                if (wordCount < 120 && finalHydrationHints.length > 0) {
                    results.extracted_data.technology_signals.app_shell_pages += 1;
                }

                if (title) results.extracted_data.titles.push(title);
                if (description) results.extracted_data.descriptions.push(description);
                if (h1) results.extracted_data.h1s.push(h1);
                if (h2s.length > 0) results.extracted_data.h2_clusters.push(h2s);
                if (canonical && pageRecord.page_type === 'homepage') results.extracted_data.canonicals.push(canonical);
                if (robots.includes('noindex') && pageRecord.page_type === 'homepage') results.extracted_data.has_noindex = true;

                results.extracted_data.structured_data.push(...schemaData.structuredData);
                results.extracted_data.schema_entities.push(...schemaData.schemaEntities);
                results.extracted_data.has_faq_schema ||= schemaData.hasFaqSchema;
                results.extracted_data.has_local_business_schema ||= schemaData.hasLocalBusinessSchema;
                results.extracted_data.has_organization_schema ||= schemaData.hasOrganizationSchema;
                results.extracted_data.faq_pairs.push(...faqPairs);
                results.extracted_data.business_names = mergeUnique(results.extracted_data.business_names, businessNames);
                results.extracted_data.text_chunks = appendTextChunks(results.extracted_data.text_chunks, pageTextChunks);

                contacts.phones.forEach((phone) => results.extracted_data.phones.add(phone));
                contacts.emails.forEach((email) => results.extracted_data.emails.add(email));
                socialLinks.forEach((link) => results.extracted_data.social_links.add(link));

                results.extracted_data.local_signals = {
                    cities: mergeUnique(results.extracted_data.local_signals.cities, localSignals.cities),
                    regions: mergeUnique(results.extracted_data.local_signals.regions, localSignals.regions),
                    area_served: mergeUnique(results.extracted_data.local_signals.area_served, localSignals.area_served),
                    address_lines: mergeUnique(results.extracted_data.local_signals.address_lines, localSignals.address_lines),
                    maps_links: mergeUnique(results.extracted_data.local_signals.maps_links, localSignals.maps_links),
                    local_terms: mergeUnique(results.extracted_data.local_signals.local_terms, localSignals.local_terms),
                };

                results.extracted_data.service_signals = {
                    services: mergeUnique(results.extracted_data.service_signals.services, serviceSignals.services),
                    keywords: mergeUnique(results.extracted_data.service_signals.keywords, serviceSignals.keywords),
                };

                results.extracted_data.trust_signals = {
                    proof_terms: mergeUnique(results.extracted_data.trust_signals.proof_terms, trustSignals.proof_terms),
                    review_terms: mergeUnique(results.extracted_data.trust_signals.review_terms, trustSignals.review_terms),
                    social_networks: mergeUnique(results.extracted_data.trust_signals.social_networks, trustSignals.social_networks),
                };

                results.extracted_data.page_stats.successful_pages += 1;
                results.extracted_data.page_stats.total_word_count += wordCount;
                if (pageRecord.page_type === 'faq' || faqPairs.length > 0) results.extracted_data.page_stats.faq_pages += 1;
                if (pageRecord.page_type === 'services') results.extracted_data.page_stats.service_pages += 1;
                if (pageRecord.page_type === 'about') results.extracted_data.page_stats.about_pages += 1;
                if (pageRecord.page_type === 'contact') results.extracted_data.page_stats.contact_pages += 1;

                results.extracted_data.page_summaries.push({
                    url: pageRecord.final_url || targetUrl,
                    page_type: pageRecord.page_type,
                    title,
                    description,
                    h1,
                    word_count: wordCount,
                    faq_pairs_count: faqPairs.length,
                    local_signal_count: localSignals.cities.length + localSignals.regions.length + localSignals.area_served.length + localSignals.address_lines.length,
                    service_signal_count: serviceSignals.services.length,
                    text_sample: truncate(pageText, 280),
                });

                if (visitedPages.size <= 4) {
                    $('a[href]').each((_, link) => {
                        const href = $(link).attr('href');
                        if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;

                        try {
                            const linkUrl = new URL(href, pageRecord.final_url || targetUrl);
                            if (linkUrl.hostname !== baseUrlObj.hostname) return;

                            const cleanUrl = linkUrl.href.split('#')[0];
                            if (visitedPages.has(cleanUrl) || queuedUrls.has(cleanUrl)) return;

                            const anchorText = normalizeWhitespace($(link).text());
                            pagesToVisit.set(cleanUrl, scoreLinkPriority(cleanUrl, anchorText, KEYWORD_PAGES));
                            queuedUrls.add(cleanUrl);
                        } catch {
                            // ignore malformed internal URLs
                        }
                    });
                }

                results.scanned_pages.push(pageRecord);
            } catch (err) {
                pageRecord.error_message = err.message || 'Network / timeout error';
                results.scanned_pages.push(pageRecord);
            }
        }
    } finally {
        await renderer.close().catch(() => { });
    }

    results.extracted_data.emails = uniqueStrings([...results.extracted_data.emails]);
    results.extracted_data.phones = uniqueStrings([...results.extracted_data.phones]);
    results.extracted_data.social_links = uniqueStrings([...results.extracted_data.social_links]);
    results.extracted_data.titles = uniqueStrings(results.extracted_data.titles).slice(0, 12);
    results.extracted_data.descriptions = uniqueStrings(results.extracted_data.descriptions).slice(0, 12);
    results.extracted_data.h1s = uniqueStrings(results.extracted_data.h1s).slice(0, 12);
    results.extracted_data.canonicals = uniqueStrings(results.extracted_data.canonicals).slice(0, 4);
    results.extracted_data.faq_pairs = results.extracted_data.faq_pairs.slice(0, 16);
    results.extracted_data.business_names = uniqueStrings(results.extracted_data.business_names).slice(0, 8);
    results.extracted_data.schema_entities = results.extracted_data.schema_entities.slice(0, 20);
    results.extracted_data.structured_data = results.extracted_data.structured_data.slice(0, 20);
    results.extracted_data.page_summaries = results.extracted_data.page_summaries.slice(0, MAX_PAGES_TO_SCAN);

    return results;
}
