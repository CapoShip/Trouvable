import * as cheerio from 'cheerio';

const TIMEOUT_MS = 8000;
const MAX_PAGES_TO_SCAN = 8;

const KEYWORD_PAGES = [
    'contact', 'about', 'propos', 'service', 'prestation', 'tarif', 'price',
    'faq', 'question', 'zone', 'ville', 'region', 'secteur'
];

async function fetchWithTimeout(url) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, TrouvableAuditBot/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;'
            }
        });
        clearTimeout(id);
        return response;
    } catch (err) {
        clearTimeout(id);
        throw err;
    }
}

function extractPhonesAndEmails($) {
    const phones = new Set();
    const emails = new Set();

    $('a[href^="tel:"]').each((_, el) => {
        const tel = $(el).attr('href').replace('tel:', '').trim();
        if (tel) phones.add(tel);
    });

    $('a[href^="mailto:"]').each((_, el) => {
        let mail = $(el).attr('href').replace('mailto:', '').split('?')[0].trim();
        if (mail) emails.add(mail.toLowerCase());
    });

    // Fallback: simple text match for phones if none found in href
    if (phones.size === 0) {
        const text = $('body').text();
        const phoneMatches = text.match(/(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}/g);
        if (phoneMatches) {
            phoneMatches.forEach(p => phones.add(p.trim()));
        }
    }

    return { phones: Array.from(phones), emails: Array.from(emails) };
}

function extractSocialLinks($) {
    const socials = new Set();
    const networks = ['facebook.com', 'instagram.com', 'linkedin.com', 'twitter.com', 'x.com', 'tiktok.com', 'youtube.com'];

    $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
            for (const net of networks) {
                if (href.includes(net)) {
                    socials.add(href);
                    break;
                }
            }
        }
    });
    return Array.from(socials);
}

function extractTextForGeo($, textContentArray) {
    // Extract readable text from main tags to evaluate clarity and services
    const mainText = $('main, article, .content').text().replace(/\s+/g, ' ').trim();
    if (mainText) {
        textContentArray.push(mainText);
    } else {
        textContentArray.push($('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000));
    }
}

export async function runSiteAudit(startUrl) {
    const results = {
        source_url: startUrl,
        resolved_url: null,
        scanned_pages: [],
        extracted_data: {
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
            text_chunks: []
        },
        error_message: null
    };

    let baseUrlObj;
    try {
        baseUrlObj = new URL(startUrl.startsWith('http') ? startUrl : `https://${startUrl}`);
    } catch (e) {
        results.error_message = "URL de départ invalide.";
        return results;
    }

    const pagesToVisit = new Set([baseUrlObj.href]);
    const visitedPages = new Set();
    const prioritizedLinks = [];

    let isFirstPage = true;

    try {
        while (visitedPages.size < MAX_PAGES_TO_SCAN && (pagesToVisit.size > 0 || prioritizedLinks.length > 0)) {
            let targetUrl;

            // Priority to specifically identified internal links, else just normal queue
            if (isFirstPage) {
                targetUrl = Array.from(pagesToVisit)[0];
                pagesToVisit.delete(targetUrl);
            } else if (prioritizedLinks.length > 0) {
                targetUrl = prioritizedLinks.shift();
            } else {
                targetUrl = Array.from(pagesToVisit)[0];
                pagesToVisit.delete(targetUrl);
            }

            if (visitedPages.has(targetUrl)) continue;
            visitedPages.add(targetUrl);

            const pageRecord = {
                url: targetUrl,
                final_url: null,
                status_code: null,
                page_type: 'unknown',
                success: false,
                error_message: null,
                title: null
            };

            try {
                const response = await fetchWithTimeout(targetUrl);
                pageRecord.status_code = response.status;
                pageRecord.final_url = response.url;

                if (isFirstPage) {
                    results.resolved_url = response.url;
                    pageRecord.page_type = 'homepage';
                }

                if (!response.ok) {
                    pageRecord.error_message = `HTTP ${response.status}`;
                    results.scanned_pages.push(pageRecord);
                    continue;
                }

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('text/html')) {
                    pageRecord.error_message = `Not HTML (${contentType})`;
                    results.scanned_pages.push(pageRecord);
                    continue;
                }

                const html = await response.text();
                const $ = cheerio.load(html);

                // Meta extraction
                const title = $('title').text().trim();
                const description = $('meta[name="description"]').attr('content')?.trim();
                const h1 = $('h1').first().text().replace(/\s+/g, ' ').trim();
                const h2s = $('h2').map((_, el) => $(el).text().replace(/\s+/g, ' ').trim()).get().filter(Boolean);

                const canonical = $('link[rel="canonical"]').attr('href')?.trim();
                const robots = $('meta[name="robots"]').attr('content')?.toLowerCase();

                pageRecord.title = title;
                pageRecord.success = true;

                // Determine page type heuristically based on URL and title if not homepage
                if (!isFirstPage) {
                    const tUrl = targetUrl.toLowerCase();
                    if (tUrl.includes('contact')) pageRecord.page_type = 'contact';
                    else if (tUrl.includes('service') || tUrl.includes('prestation')) pageRecord.page_type = 'services';
                    else if (tUrl.includes('about') || tUrl.includes('propos') || tUrl.includes('qui')) pageRecord.page_type = 'about';
                    else if (tUrl.includes('faq') || tUrl.includes('question')) pageRecord.page_type = 'faq';
                }

                if (title) results.extracted_data.titles.push(title);
                if (description) results.extracted_data.descriptions.push(description);
                if (h1) results.extracted_data.h1s.push(h1);
                if (h2s.length > 0) results.extracted_data.h2_clusters.push(h2s);
                if (canonical && isFirstPage) results.extracted_data.canonicals.push(canonical);
                if (robots && robots.includes('noindex') && isFirstPage) results.extracted_data.has_noindex = true;

                // JSON-LD
                $('script[type="application/ld+json"]').each((_, el) => {
                    try {
                        const json = JSON.parse($(el).html());
                        results.extracted_data.structured_data.push(json);

                        const strJson = JSON.stringify(json).toLowerCase();
                        if (strJson.includes('faqpage')) results.extracted_data.has_faq_schema = true;
                        if (strJson.includes('localbusiness') || strJson.includes('organization')) {
                            results.extracted_data.has_local_business_schema = true;
                        }
                    } catch (e) {
                        // ignore malformed JSON-LD
                    }
                });

                // Contacts & Socials
                const { phones, emails } = extractPhonesAndEmails($);
                phones.forEach(p => results.extracted_data.phones.add(p));
                emails.forEach(e => results.extracted_data.emails.add(e));

                const socials = extractSocialLinks($);
                socials.forEach(s => results.extracted_data.social_links.add(s));

                // GEO Text
                extractTextForGeo($, results.extracted_data.text_chunks);

                // Link discovery (only on homepage or first few pages)
                if (isFirstPage || visitedPages.size < 3) {
                    $('a').each((_, link) => {
                        let href = $(link).attr('href');
                        if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;

                        try {
                            const linkUrl = new URL(href, pageRecord.final_url);
                            if (linkUrl.hostname === baseUrlObj.hostname) {
                                const cleanUrl = linkUrl.href.split('#')[0];
                                if (!visitedPages.has(cleanUrl) && !pagesToVisit.has(cleanUrl)) {
                                    // prioritize keywords
                                    if (KEYWORD_PAGES.some(kw => cleanUrl.toLowerCase().includes(kw))) {
                                        prioritizedLinks.push(cleanUrl);
                                        // deduplicate
                                        pagesToVisit.add(cleanUrl); // keep track so we don't add twice
                                    } else {
                                        pagesToVisit.add(cleanUrl);
                                    }
                                }
                            }
                        } catch (e) { }
                    });
                }

                results.scanned_pages.push(pageRecord);

            } catch (err) {
                pageRecord.error_message = err.message || "Network / timeout error";
                results.scanned_pages.push(pageRecord);
            }

            isFirstPage = false;
        }
    } catch (globalErr) {
        results.error_message = "Crawl échoué de manière critique: " + globalErr.message;
    }

    // Convert Sets to Arrays for JSON serialization
    results.extracted_data.emails = Array.from(results.extracted_data.emails);
    results.extracted_data.phones = Array.from(results.extracted_data.phones);
    results.extracted_data.social_links = Array.from(results.extracted_data.social_links);

    return results;
}
