import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const failures = [];

function fail(message) {
  failures.push(message);
}

async function readRequired(relativePath) {
  try {
    return await readFile(path.join(root, relativePath), 'utf8');
  } catch (error) {
    fail(`${relativePath}: missing or unreadable (${error.code || error.message})`);
    return '';
  }
}

function assertStaticHtml(relativePath, html) {
  if (!html) return;
  if (!/^<!doctype html>/i.test(html.trimStart())) {
    fail(`${relativePath}: must start with <!doctype html>`);
  }
  if (!/<meta[^>]+name=["']robots["'][^>]+noindex/i.test(html)) {
    fail(`${relativePath}: must declare robots noindex`);
  }
  if (/<script\b/i.test(html)) {
    fail(`${relativePath}: scripts are forbidden in hibernation mode`);
  }
  if (/<form\b/i.test(html)) {
    fail(`${relativePath}: forms are forbidden in hibernation mode`);
  }
  if (/\b(?:src|href)\s*=\s*["']https?:\/\//i.test(html) || /@import\s+url/i.test(html)) {
    fail(`${relativePath}: external network resources are forbidden`);
  }
  if (/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/i.test(html)) {
    fail(`${relativePath}: runtime network calls are forbidden`);
  }
}

const indexHtml = await readRequired('parking/index.html');
const notFoundHtml = await readRequired('parking/404.html');
const robotsTxt = await readRequired('parking/robots.txt');
const vercelRaw = await readRequired('vercel.json');
const ignoreScript = await readRequired('scripts/vercel-ignore-hibernation.mjs');

assertStaticHtml('parking/index.html', indexHtml);
assertStaticHtml('parking/404.html', notFoundHtml);

if (indexHtml && !/Trouvable est temporairement en pause/i.test(indexHtml)) {
  fail('parking/index.html: missing the public hibernation message');
}
if (robotsTxt && (!/^User-agent:\s*\*$/im.test(robotsTxt) || !/^Disallow:\s*\/$/im.test(robotsTxt))) {
  fail('parking/robots.txt: must disallow every crawler');
}

if (vercelRaw) {
  try {
    const config = JSON.parse(vercelRaw);
    if (config.framework !== null) fail('vercel.json: framework must be null (Other preset)');
    if (config.installCommand !== '') fail('vercel.json: installCommand must be empty');
    if (config.buildCommand !== 'node scripts/validate-hibernation.mjs') {
      fail('vercel.json: buildCommand must run the hibernation validator');
    }
    if (config.outputDirectory !== 'parking') fail('vercel.json: outputDirectory must be parking');
    if (config.ignoreCommand !== 'node scripts/vercel-ignore-hibernation.mjs') {
      fail('vercel.json: ignoreCommand must enforce the hibernation deployment allowlist');
    }
    for (const forbiddenKey of ['functions', 'crons', 'rewrites', 'routes']) {
      if (Object.prototype.hasOwnProperty.call(config, forbiddenKey)) {
        fail(`vercel.json: ${forbiddenKey} is forbidden in static hibernation mode`);
      }
    }
    const allHeaders = (config.headers || []).flatMap((entry) => entry.headers || []);
    const headerMap = new Map(allHeaders.map((entry) => [String(entry.key).toLowerCase(), String(entry.value)]));
    if (!/noindex/i.test(headerMap.get('x-robots-tag') || '')) {
      fail('vercel.json: X-Robots-Tag must disable indexing');
    }
    if (!/default-src 'none'/i.test(headerMap.get('content-security-policy') || '')) {
      fail("vercel.json: CSP must default to 'none'");
    }
  } catch (error) {
    fail(`vercel.json: invalid JSON (${error.message})`);
  }
}

if (ignoreScript && !/VERCEL_GIT_COMMIT_REF/.test(ignoreScript)) {
  fail('scripts/vercel-ignore-hibernation.mjs: must inspect VERCEL_GIT_COMMIT_REF');
}

try {
  const files = await readdir(path.join(root, 'parking'));
  const allowed = new Set(['404.html', 'index.html', 'robots.txt']);
  for (const file of files) {
    if (!allowed.has(file)) fail(`parking/${file}: unexpected deployment artifact`);
  }
} catch {
  // readRequired already reports the missing directory through required files.
}

if (failures.length > 0) {
  console.error('Hibernation validation failed:');
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log('Hibernation validation passed: static-only deployment, no runtime dependencies.');
