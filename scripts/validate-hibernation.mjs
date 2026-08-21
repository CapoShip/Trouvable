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
    fail(`${relativePath}: first-party scripts are forbidden in hibernation mode`);
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

function assertManualOnlyWorkflow(relativePath, yaml) {
  if (!yaml) return;
  if (!/^\s*workflow_dispatch:\s*$/m.test(yaml)) {
    fail(`${relativePath}: workflow_dispatch is required`);
  }
  for (const trigger of ['schedule', 'push', 'pull_request', 'merge_group']) {
    if (new RegExp(`^\\s*${trigger}:\\s*$`, 'm').test(yaml)) {
      fail(`${relativePath}: automatic trigger ${trigger} is forbidden while hibernating`);
    }
  }
}

const indexHtml = await readRequired('parking/index.html');
const notFoundHtml = await readRequired('parking/404.html');
const robotsTxt = await readRequired('parking/robots.txt');
const vercelRaw = await readRequired('vercel.json');
const ignoreScript = await readRequired('scripts/vercel-ignore-hibernation.mjs');
const ciWorkflow = await readRequired('.github/workflows/ci.yml');
const cronWorkflow = await readRequired('.github/workflows/external-cron.yml');
const codeqlWorkflow = await readRequired('.github/workflows/codeql.yml');
const dependencyWorkflow = await readRequired('.github/workflows/dependency-review.yml');
const dependabotConfig = await readRequired('.github/dependabot.yml');

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
    if (config.git?.deploymentEnabled !== false) {
      fail('vercel.json: automatic Git deployments must be disabled after the static production rollout');
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

if (ignoreScript) {
  if (!/VERCEL_GIT_COMMIT_REF/.test(ignoreScript)) {
    fail('scripts/vercel-ignore-hibernation.mjs: must inspect VERCEL_GIT_COMMIT_REF');
  }
  if (!/process\.exit\(0\)/.test(ignoreScript) || !/process\.exit\(1\)/.test(ignoreScript)) {
    fail('scripts/vercel-ignore-hibernation.mjs: must implement explicit ignore/build exit codes');
  }
}

if (ciWorkflow) {
  if (!/^name:\s*Hibernation Gate\s*$/m.test(ciWorkflow)) {
    fail('.github/workflows/ci.yml: must remain the Hibernation Gate');
  }
  if (!/node scripts\/validate-hibernation\.mjs/.test(ciWorkflow)) {
    fail('.github/workflows/ci.yml: must execute the hibernation validator');
  }
  if (/npm\s+(?:ci|install|test|run\s+build)/i.test(ciWorkflow)) {
    fail('.github/workflows/ci.yml: dependency installation and application suites are forbidden while hibernating');
  }
  if (/^\s*schedule:\s*$/m.test(ciWorkflow)) {
    fail('.github/workflows/ci.yml: scheduled validation is forbidden while hibernating');
  }
}

assertManualOnlyWorkflow('.github/workflows/external-cron.yml', cronWorkflow);
if (cronWorkflow && !/RUN_ONCE/.test(cronWorkflow)) {
  fail('.github/workflows/external-cron.yml: explicit RUN_ONCE confirmation is required');
}
assertManualOnlyWorkflow('.github/workflows/codeql.yml', codeqlWorkflow);
assertManualOnlyWorkflow('.github/workflows/dependency-review.yml', dependencyWorkflow);

if (dependabotConfig) {
  const disabledLimits = dependabotConfig.match(/open-pull-requests-limit:\s*0/g) || [];
  if (disabledLimits.length < 2) {
    fail('.github/dependabot.yml: npm and GitHub Actions version updates must both be disabled');
  }
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

try {
  const workflowFiles = await readdir(path.join(root, '.github/workflows'));
  const allowedWorkflows = new Set(['ci.yml', 'codeql.yml', 'dependency-review.yml', 'external-cron.yml']);
  for (const file of workflowFiles) {
    if (!allowedWorkflows.has(file)) {
      fail(`.github/workflows/${file}: unexpected workflow could reintroduce automatic resource use`);
    }
  }
} catch (error) {
  fail(`.github/workflows: missing or unreadable (${error.code || error.message})`);
}

if (failures.length > 0) {
  console.error('Hibernation validation failed:');
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}

console.log('Hibernation validation passed: static-only deployment, dormant automation, and Git deployment freeze enforced.');
