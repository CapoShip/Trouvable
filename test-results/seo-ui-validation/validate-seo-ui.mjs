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
  { name: 'chrome', executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' },
  { name: 'brave', executablePath: 'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe' },
];
const selectedBrowserNames = (process.env.VALIDATE_BROWSERS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

function collectPageMetrics() {
  const text = document.body?.innerText || '';
  const englishTokens = Array.from(
    new Set((text.match(/\b(?:loading|settings|save|dashboard|health|content|view|open|new|edit)\b/gi) || []).map((token) => token.toLowerCase()))
  );
  const all = Array.from(document.querySelectorAll('*'));
  const overflowers = all
    .filter((el) => el.getBoundingClientRect().width > window.innerWidth + 1)
    .slice(0, 20)
    .map((el) => ({
      tag: el.tagName,
      className: typeof el.className === 'string' ? el.className : '',
      width: Number(el.getBoundingClientRect().width.toFixed(2)),
    }));
  const horizontalScrollers = all
    .filter((el) => {
      const style = getComputedStyle(el);
      return ['auto', 'scroll'].includes(style.overflowX) && el.scrollWidth > el.clientWidth + 1;
    })
    .slice(0, 20)
    .map((el) => ({
      tag: el.tagName,
      className: typeof el.className === 'string' ? el.className : '',
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
  const activeNav = Array.from(document.querySelectorAll('nav a'))
    .map((link) => ({
      text: (link.textContent || '').trim(),
      backgroundColor: getComputedStyle(link).backgroundColor,
    }))
    .filter((link) => link.text && !['rgba(0, 0, 0, 0)', 'transparent'].includes(link.backgroundColor))
    .map((link) => link.text)
    .slice(0, 12);
  const sticky = all
    .filter((el) => getComputedStyle(el).position === 'sticky')
    .slice(0, 20)
    .map((el) => ({
      tag: el.tagName,
      className: typeof el.className === 'string' ? el.className : '',
      top: getComputedStyle(el).top,
    }));
  const buttons = Array.from(document.querySelectorAll('button, a'))
    .map((el) => (el.textContent || '').trim())
    .filter(Boolean)
    .slice(0, 30);

  return {
    title: document.title,
    h1: document.querySelector('h1')?.textContent?.trim() || null,
    hasBypassBanner: text.includes('Mode local de développement actif') && text.includes('DEV_BYPASS_AUTH=1'),
    innerWidth: window.innerWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    overflowers,
    horizontalScrollers,
    sticky,
    activeNav,
    englishTokens,
    buttons,
  };
}

async function validateBrowser(browserConfig) {
  const browser = await chromium.launch({ executablePath: browserConfig.executablePath, headless: true });
  const results = { browser: browserConfig.name, desktop: [], mobile: [] };

  const modes = browserConfig.name === 'brave' && process.env.BRAVE_DESKTOP_ONLY === '1'
    ? [{ name: 'desktop', contextOptions: { viewport: { width: 1440, height: 1200 } } }]
    : [
        { name: 'desktop', contextOptions: { viewport: { width: 1440, height: 1200 } } },
        { name: 'mobile', contextOptions: { ...devices['iPhone 13'] } },
      ];

  for (const mode of modes) {
    const context = await browser.newContext({
      ...mode.contextOptions,
      locale: 'fr-FR',
      timezoneId: 'Europe/Paris',
      colorScheme: 'dark',
    });

    for (const route of routes) {
      let page;

      try {
        page = await context.newPage();
        const consoleErrors = [];
        const pageErrors = [];
        page.on('console', (msg) => {
          if (['error', 'warning'].includes(msg.type())) {
            consoleErrors.push({ type: msg.type(), text: msg.text() });
          }
        });
        page.on('pageerror', (err) => pageErrors.push(String(err)));

        await page.goto(route.url, { waitUntil: 'networkidle', timeout: 60000 });
        await page.locator('h1').first().waitFor({ timeout: 30000 });
        const metrics = await page.evaluate(collectPageMetrics);
        const screenshotPath = path.join(outputDir, `${browserConfig.name}-${mode.name}-${route.key}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        results[mode.name].push({
          route: route.key,
          url: route.url,
          metrics,
          consoleErrors,
          pageErrors,
          screenshotPath,
          error: null,
        });
      } catch (error) {
        results[mode.name].push({
          route: route.key,
          url: route.url,
          metrics: null,
          consoleErrors: [],
          pageErrors: [],
          screenshotPath: null,
          error: String(error),
        });
      } finally {
        if (page) {
          await page.close().catch(() => {});
        }
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
const reportName = process.env.REPORT_NAME || 'report.json';
await fs.writeFile(path.join(outputDir, reportName), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
