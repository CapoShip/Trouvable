const FETCH_TIMEOUT_MS = 8000;

const AI_CRAWLERS = {
    critical: [
        { name: 'GPTBot', service: 'OpenAI (training + ChatGPT search)' },
        { name: 'OAI-SearchBot', service: 'OpenAI (search-only)' },
        { name: 'ChatGPT-User', service: 'ChatGPT browsing mode' },
        { name: 'ClaudeBot', service: 'Anthropic / Claude' },
        { name: 'PerplexityBot', service: 'Perplexity AI search' },
    ],
    secondary: [
        { name: 'Amazonbot', service: 'Amazon / Alexa AI' },
        { name: 'Google-Extended', service: 'Google Gemini training' },
        { name: 'Bytespider', service: 'ByteDance / TikTok AI' },
        { name: 'CCBot', service: 'Common Crawl' },
        { name: 'Applebot-Extended', service: 'Apple Intelligence' },
        { name: 'FacebookBot', service: 'Meta AI' },
        { name: 'Cohere-ai', service: 'Cohere models' },
    ],
};

const CRAWLER_STATUS = {
    ALLOWED: 'allowed',
    BLOCKED: 'blocked',
    RESTRICTED: 'restricted',
    UNKNOWN: 'unknown',
};

async function fetchTextResource(url) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, TrouvableAuditBot/3.0)',
                Accept: 'text/plain, text/html, */*',
            },
            redirect: 'follow',
        });
        clearTimeout(id);
        if (!response.ok) return null;
        const text = await response.text();
        return text || null;
    } catch {
        clearTimeout(id);
        return null;
    }
}

function parseRobotsTxt(robotsTxt) {
    if (!robotsTxt || typeof robotsTxt !== 'string') return { rules: {}, hasSitemap: false };

    const lines = robotsTxt.split(/\r?\n/);
    const rules = {};
    let currentAgents = [];
    let hasSitemap = false;

    for (const rawLine of lines) {
        const line = rawLine.split('#')[0].trim();
        if (!line) continue;

        const [directive, ...rest] = line.split(':');
        const key = directive.trim().toLowerCase();
        const value = rest.join(':').trim();

        if (key === 'sitemap') {
            hasSitemap = true;
            continue;
        }

        if (key === 'user-agent') {
            currentAgents = [value];
            if (!rules[value]) rules[value] = { disallow: [], allow: [], crawlDelay: null };
            continue;
        }

        if (!currentAgents.length) continue;

        for (const agent of currentAgents) {
            if (!rules[agent]) rules[agent] = { disallow: [], allow: [], crawlDelay: null };
            if (key === 'disallow' && value) {
                rules[agent].disallow.push(value);
            } else if (key === 'allow' && value) {
                rules[agent].allow.push(value);
            } else if (key === 'crawl-delay' && value) {
                const parsed = parseInt(value, 10);
                if (!isNaN(parsed) && parsed > 0) rules[agent].crawlDelay = parsed;
            }
        }
    }

    return { rules, hasSitemap };
}

function getCrawlerStatus(crawlerName, parsedRobots) {
    const { rules } = parsedRobots;

    const crawlerRules = rules[crawlerName];
    const wildcardRules = rules['*'];

    const effectiveRules = crawlerRules || wildcardRules;

    if (!effectiveRules) return CRAWLER_STATUS.UNKNOWN;

    const hasRootBlock = effectiveRules.disallow.includes('/');
    const hasSpecificBlocks = effectiveRules.disallow.length > 0;
    const hasAllows = effectiveRules.allow.length > 0;

    if (hasRootBlock && !hasAllows) return CRAWLER_STATUS.BLOCKED;
    if (hasRootBlock && hasAllows) return CRAWLER_STATUS.RESTRICTED;
    if (hasSpecificBlocks && !hasRootBlock) return CRAWLER_STATUS.RESTRICTED;

    return CRAWLER_STATUS.ALLOWED;
}

function scoreCrawlerAccess(crawlerStatuses) {
    let score = 100;

    for (const [, entry] of Object.entries(crawlerStatuses)) {
        if (entry.status === CRAWLER_STATUS.BLOCKED) {
            score -= entry.tier === 'critical' ? 15 : 5;
        } else if (entry.status === CRAWLER_STATUS.RESTRICTED) {
            score -= entry.tier === 'critical' ? 8 : 3;
        }
    }

    return Math.max(0, score);
}

function validateLlmsTxt(content) {
    if (!content || typeof content !== 'string') return { valid: false, reason: 'empty' };

    const lines = content.trim().split(/\r?\n/);
    if (lines.length === 0) return { valid: false, reason: 'empty' };

    const firstLine = lines[0].trim();
    if (!firstLine.startsWith('# ')) return { valid: false, reason: 'missing_h1' };

    const hasH2 = lines.some((line) => line.trim().startsWith('## '));
    const hasLinks = lines.some((line) => /\[.+\]\(.+\)/.test(line));

    if (!hasH2 && !hasLinks) return { valid: true, reason: 'minimal' };
    if (hasH2 && hasLinks) return { valid: true, reason: 'complete' };

    return { valid: true, reason: 'partial' };
}

function scoreLlmsTxt(status) {
    if (!status.found) return 0;
    if (!status.validation.valid) return 30;
    if (status.validation.reason === 'minimal') return 50;
    if (status.validation.reason === 'partial') return 60;
    if (status.validation.reason === 'complete' && status.hasFullVersion) return 95;
    if (status.validation.reason === 'complete') return 80;
    return 50;
}

export async function analyzeCrawlerAccess(siteUrl) {
    let origin;
    try {
        const parsed = new URL(siteUrl);
        origin = parsed.origin;
    } catch {
        return createEmptyResult('invalid_url');
    }

    const robotsUrl = `${origin}/robots.txt`;
    const llmsTxtUrl = `${origin}/llms.txt`;
    const llmsFullTxtUrl = `${origin}/llms-full.txt`;

    const [robotsTxt, llmsTxt, llmsFullTxt] = await Promise.all([
        fetchTextResource(robotsUrl),
        fetchTextResource(llmsTxtUrl),
        fetchTextResource(llmsFullTxtUrl),
    ]);

    const parsedRobots = parseRobotsTxt(robotsTxt);

    const crawlerStatuses = {};
    for (const crawler of AI_CRAWLERS.critical) {
        crawlerStatuses[crawler.name] = {
            name: crawler.name,
            service: crawler.service,
            tier: 'critical',
            status: getCrawlerStatus(crawler.name, parsedRobots),
        };
    }
    for (const crawler of AI_CRAWLERS.secondary) {
        crawlerStatuses[crawler.name] = {
            name: crawler.name,
            service: crawler.service,
            tier: 'secondary',
            status: getCrawlerStatus(crawler.name, parsedRobots),
        };
    }

    const crawlerAccessScore = scoreCrawlerAccess(crawlerStatuses);

    const blockedCritical = Object.values(crawlerStatuses).filter((c) => c.tier === 'critical' && c.status === CRAWLER_STATUS.BLOCKED);
    const blockedSecondary = Object.values(crawlerStatuses).filter((c) => c.tier === 'secondary' && c.status === CRAWLER_STATUS.BLOCKED);

    const llmsTxtStatus = {
        found: llmsTxt !== null,
        hasFullVersion: llmsFullTxt !== null,
        validation: llmsTxt !== null ? validateLlmsTxt(llmsTxt) : { valid: false, reason: 'absent' },
    };
    const llmsTxtScore = scoreLlmsTxt(llmsTxtStatus);

    return {
        robotsTxtFound: robotsTxt !== null,
        robotsHasSitemap: parsedRobots.hasSitemap,
        crawlerStatuses,
        crawlerAccessScore,
        blockedCriticalCount: blockedCritical.length,
        blockedSecondaryCount: blockedSecondary.length,
        blockedCriticalNames: blockedCritical.map((c) => c.name),
        llmsTxt: llmsTxtStatus,
        llmsTxtScore,
        fetchError: null,
    };
}

function createEmptyResult(reason) {
    const crawlerStatuses = {};
    for (const crawler of [...AI_CRAWLERS.critical, ...AI_CRAWLERS.secondary]) {
        crawlerStatuses[crawler.name] = {
            name: crawler.name,
            service: crawler.service,
            tier: AI_CRAWLERS.critical.some((c) => c.name === crawler.name) ? 'critical' : 'secondary',
            status: CRAWLER_STATUS.UNKNOWN,
        };
    }
    return {
        robotsTxtFound: false,
        robotsHasSitemap: false,
        crawlerStatuses,
        crawlerAccessScore: 100,
        blockedCriticalCount: 0,
        blockedSecondaryCount: 0,
        blockedCriticalNames: [],
        llmsTxt: { found: false, hasFullVersion: false, validation: { valid: false, reason: 'absent' } },
        llmsTxtScore: 0,
        fetchError: reason || 'fetch_failed',
    };
}

export { AI_CRAWLERS, CRAWLER_STATUS, parseRobotsTxt, getCrawlerStatus, validateLlmsTxt, scoreLlmsTxt };
