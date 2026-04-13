import { chromium, devices } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const outputDir = path.resolve('test-results/seo-ui-validation');
const clientId = '0d3978b4-8e21-42de-9fa5-771f549a4dc6';
const base = `http://localhost:3000/admin/clients/${clientId}`;
const routes = [
  { key: 'visibility', url: `${base}/seo/visibility` },
  { key: 'health', url: `${base}/seo/health` },
  { key: 'on-page', url: `${base}/seo/on-page` },
  { key: 'content', url: `${base}/seo/content` },
];
const browsers = [
  {
    name: 'chrome',
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    modes: [
      { name: 'desktop', contextOptions: { viewport: { width: 1440, height: 1200 } } },
      { name: 'mobile', contextOptions: { ...devices['iPhone 13'] } },
    ],
  },
  {
    name: 'brave',
    executablePath: 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',
    modes: [{ name: 'desktop', contextOptions: { viewport: { width: 1440, height: 1200 } } }],
  },
];

const selectedBrowserNames = (process.env.VALIDATE_BROWSERS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

function captureScrollState() {
  const scrollRoot = document.querySelector('.geo-content') || document.scrollingElement || document.documentElement;
  const headings = Array.from(document.querySelectorAll('h1, h2, h3'));
  const visibleHeadings = headings
    .filter((heading) => {
      const rect = heading.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    })
    .map((heading) => heading.textContent?.trim() || '')
    .filter(Boolean)
    .slice(0, 8);

  return {
    scrollTop: scrollRoot.scrollTop,
    clientHeight: scrollRoot.clientHeight,
    scrollHeight: scrollRoot.scrollHeight,
    bottomGap: scrollRoot.scrollHeight - scrollRoot.clientHeight - scrollRoot.scrollTop,
    reachedBottom: scrollRoot.scrollHeight - scrollRoot.clientHeight - scrollRoot.scrollTop <= 4,
    visibleHeadings,
  };
}

async function getAnchorLinks(page) {
  return page.locator('a[href^="#"]').evaluateAll((elements) => {
    return elements
      .map((element) => ({
        label: (element.textContent || '').trim(),
        href: element.getAttribute('href') || '',
      }))
      .filter((item) => item.href.startsWith('#'));
  });
}

async function clickAnchorAndMeasure(page, link) {
  await page.locator(`a[href="${link.href}"]`).first().click();
  await page.waitForTimeout(250);

  return page.evaluate(({ href, label }) => {
    const scrollRoot = document.querySelector('.geo-content') || document.scrollingElement || document.documentElement;
    const target = document.querySelector(href);
    const targetRect = target?.getBoundingClientRect() || null;
    const rootRect = scrollRoot.getBoundingClientRect();

    return {
      label,
      href,
      hash: location.hash,
      targetExists: Boolean(target),
      targetTop: targetRect ? Number(targetRect.top.toFixed(2)) : null,
      targetVisibleInViewport: Boolean(targetRect && targetRect.bottom > 0 && targetRect.top < window.innerHeight),
      targetVisibleInScrollRoot: Boolean(
        targetRect && targetRect.bottom > rootRect.top && targetRect.top < rootRect.bottom
      ),
      targetNearTopOfScrollRoot: Boolean(
        targetRect && targetRect.top >= rootRect.top - 8 && targetRect.top <= rootRect.top + 180
      ),
      scrollTop: scrollRoot.scrollTop,
      bottomGap: scrollRoot.scrollHeight - scrollRoot.clientHeight - scrollRoot.scrollTop,
    };
  }, link);
}

async function scrollToBottomAndCapture(page, browserName, modeName, routeKey) {
  await page.evaluate(() => {
    const scrollRoot = document.querySelector('.geo-content') || document.scrollingElement || document.documentElement;
    scrollRoot.scrollTo({ top: scrollRoot.scrollHeight, behavior: 'instant' });
  });
  await page.waitForTimeout(150);
  const bottomState = await page.evaluate(captureScrollState);
  const screenshotPath = path.join(outputDir, `${browserName}-${modeName}-${routeKey}-bottom.png`);
  await page.screenshot({ path: screenshotPath });
  return { bottomState, screenshotPath };
}

async function validateRoute(page, browserName, modeName, route) {
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (msg) => {
    if (['error', 'warning'].includes(msg.type())) {
      consoleErrors.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on('pageerror', (error) => pageErrors.push(String(error)));

  await page.goto(route.url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.locator('h1').first().waitFor({ timeout: 30000 });

  const initialState = await page.evaluate(captureScrollState);
  const anchorLinks = await getAnchorLinks(page);
  const anchorResults = [];

  for (const link of anchorLinks) {
    anchorResults.push(await clickAnchorAndMeasure(page, link));
  }

  await page.evaluate(() => {
    const scrollRoot = document.querySelector('.geo-content') || document.scrollingElement || document.documentElement;
    scrollRoot.scrollTo({ top: 0, behavior: 'instant' });
    history.replaceState(null, '', location.pathname + location.search);
  });
  await page.waitForTimeout(100);

  const { bottomState, screenshotPath } = await scrollToBottomAndCapture(page, browserName, modeName, route.key);

  return {
    route: route.key,
    url: route.url,
    title: await page.title(),
    initialState,
    anchorLinks,
    anchorResults,
    bottomState,
    bottomScreenshotPath: screenshotPath,
    consoleErrors,
    pageErrors,
  };
}

async function validateBrowser(browserConfig) {
  const browser = await chromium.launch({ executablePath: browserConfig.executablePath, headless: true });
  const results = { browser: browserConfig.name, modes: {} };

  for (const mode of browserConfig.modes) {
    const context = await browser.newContext({
      ...mode.contextOptions,
      locale: 'fr-FR',
      timezoneId: 'Europe/Paris',
      colorScheme: 'dark',
    });

    results.modes[mode.name] = [];

    for (const route of routes) {
      const page = await context.newPage();
      try {
        results.modes[mode.name].push(await validateRoute(page, browserConfig.name, mode.name, route));
      } catch (error) {
        results.modes[mode.name].push({
          route: route.key,
          url: route.url,
          error: String(error),
        });
      } finally {
        await page.close().catch(() => {});
      }
    }

    await context.close();
  }

  await browser.close();
  return results;
}

await fs.mkdir(outputDir, { recursive: true });
const report = [];
for (const browserConfig of browsers.filter((entry) => !selectedBrowserNames.length || selectedBrowserNames.includes(entry.name))) {
  report.push(await validateBrowser(browserConfig));
}
const reportName = process.env.REPORT_NAME || 'scroll-report.json';
await fs.writeFile(path.join(outputDir, reportName), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
