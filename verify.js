#!/usr/bin/env node
/**
 * verify.js — Full project health check
 * Run from project root:  node verify.js
 *
 * Checks every layer of the stack and reports clearly what's passing,
 * what's failing, and exactly how to fix each issue.
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

const G = '\x1b[32m', R = '\x1b[31m', Y = '\x1b[33m', B = '\x1b[34m', Z = '\x1b[0m';
let passed = 0, failed = 0, warned = 0;

function ok(msg)        { console.log(`  ${G}✓${Z} ${msg}`); passed++; }
function fail(msg, fix) { console.log(`  ${R}✗${Z} ${msg}`); if (fix) console.log(`    ${Y}Fix:${Z} ${fix}`); failed++; }
function warn(msg)      { console.log(`  ${Y}⚠${Z} ${msg}`); warned++; }
function section(title) { console.log(`\n${B}${title}${Z}`); }

// ── Helpers ───────────────────────────────────────────────────────────────────

function fileExists(p)       { return fs.existsSync(path.resolve(p)); }
function readJSON(p)         { try { return JSON.parse(fs.readFileSync(path.resolve(p), 'utf8')); } catch { return null; } }
function readFile(p)         { try { return fs.readFileSync(path.resolve(p), 'utf8'); } catch { return ''; } }
function run(cmd, cwd = '.') {
  try {
    return { ok: true, out: execSync(cmd, { cwd, stdio: 'pipe', timeout: 30000 }).toString().trim() };
  } catch (e) {
    return { ok: false, out: e.stderr?.toString() || e.message };
  }
}

function httpPing(url, timeoutMs = 3000) {
  return new Promise(resolve => {
    const req = http.get(url, { timeout: timeoutMs }, res => resolve({ up: res.statusCode < 500, status: res.statusCode }));
    req.on('error', () => resolve({ up: false, status: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ up: false, status: 0 }); });
  });
}

// ── 1. File Structure ─────────────────────────────────────────────────────────

function checkFileStructure() {
  section('1. File Structure');

  const required = [
    // Actor
    'actor/main.js',
    'actor/package.json',
    'actor/INPUT_SCHEMA.json',
    'actor/apify.json',
    'actor/Dockerfile',
    'actor/test.js',
    // API
    'api/src/index.ts',
    'api/prisma/schema.prisma',
    'api/package.json',
    'api/Dockerfile',
    // Frontend
    'frontend/next.config.js',
    'frontend/package.json',
    'frontend/Dockerfile',
    'frontend/app/page.tsx',
    'frontend/app/events/page.tsx',
    'frontend/app/dashboard/page.tsx',
    'frontend/app/api-docs/page.tsx',
    // Root
    'docker-compose.yml',
    '.env.example',
    '.gitignore',
    'README.md',
    '.github/workflows/ci.yml',
  ];

  for (const f of required) {
    fileExists(f) ? ok(f) : fail(f, `Create this file — it's required`);
  }
}

// ── 2. next.config.js ─────────────────────────────────────────────────────────

function checkNextConfig() {
  section('2. next.config.js — standalone output');

  if (!fileExists('frontend/next.config.js')) {
    fail('frontend/next.config.js missing', 'Create it with output: "standalone"');
    return;
  }

  const content = readFile('frontend/next.config.js');
  content.includes("output: 'standalone'") || content.includes('output: "standalone"')
    ? ok('output: "standalone" is set (Docker multi-stage builds will work)')
    : fail('output: "standalone" is NOT set in next.config.js',
        'Add `output: "standalone"` to the nextConfig object');

  content.includes('reactStrictMode')
    ? ok('reactStrictMode is enabled')
    : warn('reactStrictMode not found — add it for better error detection');

  content.includes('remotePatterns') || content.includes('domains')
    ? ok('Image domains are configured')
    : warn('No image domain config — external event images may be blocked');
}

// ── 3. package.json files ─────────────────────────────────────────────────────

function checkPackageJsonFiles() {
  section('3. package.json Validity');

  // Actor
  const actor = readJSON('actor/package.json');
  if (!actor) { fail('actor/package.json is invalid JSON', 'Check for syntax errors'); }
  else {
    actor.main === './main.js' ? ok('actor: "main" → ./main.js') : fail('actor: "main" wrong', 'Set "main": "./main.js"');
    ['apify','axios','cheerio'].forEach(d => actor.dependencies?.[d] ? ok(`actor dep: ${d}`) : fail(`actor dep missing: ${d}`));
  }

  // API
  const api = readJSON('api/package.json');
  if (!api) { fail('api/package.json is invalid JSON'); }
  else {
    api.scripts?.build ? ok('api: "build" script defined') : fail('api: missing "build" script', 'Add "build": "tsc"');
    api.scripts?.dev   ? ok('api: "dev" script defined')   : warn('api: no "dev" script');
    ['express','@prisma/client'].forEach(d => api.dependencies?.[d] ? ok(`api dep: ${d}`) : fail(`api dep missing: ${d}`));
  }

  // Frontend
  const fe = readJSON('frontend/package.json');
  if (!fe) { fail('frontend/package.json is invalid JSON'); }
  else {
    fe.scripts?.build ? ok('frontend: "build" script defined') : fail('frontend: missing "build" script');
    fe.dependencies?.next ? ok(`frontend: next@${fe.dependencies.next}`) : fail('frontend: "next" not in dependencies');
  }
}

// ── 4. Prisma Schema ──────────────────────────────────────────────────────────

function checkPrismaSchema() {
  section('4. Prisma Schema');

  if (!fileExists('api/prisma/schema.prisma')) {
    fail('api/prisma/schema.prisma missing');
    return;
  }

  const schema = readFile('api/prisma/schema.prisma');
  ['Event','ScrapeRun'].forEach(model => {
    schema.includes(`model ${model}`)
      ? ok(`model ${model} is defined`)
      : fail(`model ${model} missing from schema.prisma`);
  });

  ['qualityScore','region','category','scrapedAt'].forEach(field => {
    schema.includes(field)
      ? ok(`Event.${field} is defined`)
      : warn(`Event.${field} not found in schema — may affect API queries`);
  });

  schema.includes('@@index') ? ok('Database indexes are defined') : warn('No @@index found — add indexes on region, category, date for performance');
}

// ── 5. Docker Compose ─────────────────────────────────────────────────────────

function checkDockerCompose() {
  section('5. docker-compose.yml');

  if (!fileExists('docker-compose.yml')) { fail('docker-compose.yml missing'); return; }

  const dc = readFile('docker-compose.yml');
  ['postgres','redis','api','frontend'].forEach(svc => {
    dc.includes(`${svc}:`)
      ? ok(`service "${svc}" defined`)
      : fail(`service "${svc}" missing from docker-compose.yml`);
  });

  dc.includes('healthcheck') ? ok('Healthchecks are configured') : warn('No healthchecks — services may start before dependencies are ready');
  dc.includes('depends_on')  ? ok('depends_on is configured')    : warn('No depends_on — services may start in wrong order');
  dc.includes('POSTGRES_PASSWORD') ? ok('DB credentials use env vars') : warn('DB password may be hardcoded');
}

// ── 6. Environment Files ──────────────────────────────────────────────────────

function checkEnvFiles() {
  section('6. Environment Configuration');

  fileExists('.env.example')          ? ok('.env.example exists')         : fail('.env.example missing');
  fileExists('.gitignore')            ? ok('.gitignore exists')           : fail('.gitignore missing');

  const gi = readFile('.gitignore');
  ['.env', 'node_modules', '.next', 'dist'].forEach(entry => {
    gi.includes(entry) ? ok(`.gitignore includes ${entry}`) : fail(`.gitignore missing: ${entry}`, `Add "${entry}" to .gitignore`);
  });

  const ev = readFile('.env.example');
  ['DATABASE_URL','APIFY_API_TOKEN','APIFY_ACTOR_ID','API_KEY','NEXT_PUBLIC_API_URL'].forEach(k => {
    ev.includes(k) ? ok(`.env.example has ${k}`) : warn(`.env.example missing ${k}`);
  });
}

// ── 7. GitHub Actions ─────────────────────────────────────────────────────────

function checkCI() {
  section('7. GitHub Actions CI/CD');

  if (!fileExists('.github/workflows/ci.yml')) { fail('.github/workflows/ci.yml missing'); return; }

  const ci = readFile('.github/workflows/ci.yml');
  ['node test.js','npm run build'].forEach(step => {
    ci.includes(step) ? ok(`CI runs: ${step}`) : warn(`CI may not run: ${step}`);
  });
  ci.includes('on:') && (ci.includes('push:') || ci.includes('pull_request:'))
    ? ok('CI triggers on push/PR')
    : warn('CI trigger conditions not found');
}

// ── 8. TypeScript ─────────────────────────────────────────────────────────────

function checkTypeScript() {
  section('8. TypeScript (requires node_modules installed)');

  if (!fileExists('api/node_modules')) { warn('api/node_modules not found — run: cd api && npm install'); return; }
  if (!fileExists('frontend/node_modules')) { warn('frontend/node_modules not found — run: cd frontend && npm install'); return; }

  const apiTsc   = run('npx tsc --noEmit', 'api');
  const frontTsc = run('npx tsc --noEmit', 'frontend');

  apiTsc.ok   ? ok('API: no TypeScript errors')      : fail('API TypeScript errors found', apiTsc.out.slice(0, 200));
  frontTsc.ok ? ok('Frontend: no TypeScript errors') : fail('Frontend TypeScript errors', frontTsc.out.slice(0, 200));
}

// ── 9. Actor Tests ────────────────────────────────────────────────────────────

function checkActorTests() {
  section('9. Apify Actor Tests');

  if (!fileExists('actor/test.js')) { fail('actor/test.js missing'); return; }

  const result = run('node test.js', 'actor');
  if (result.ok) {
    const match = result.out.match(/(\d+) passed/);
    ok(`Actor tests: ${match ? match[0] : 'all passed'}`);
  } else {
    fail('Actor tests failed', result.out.slice(0, 300));
  }
}

// ── 10. Live Services (if running) ────────────────────────────────────────────

async function checkLiveServices() {
  section('10. Live Services (Docker must be running)');

  const endpoints = [
    ['API Health',     'http://localhost:3001/api/health'],
    ['API Events',     'http://localhost:3001/api/events?limit=1'],
    ['API Stats',      'http://localhost:3001/api/stats'],
    ['Frontend',       'http://localhost:3000'],
  ];

  for (const [label, url] of endpoints) {
    const result = await httpPing(url);
    result.up
      ? ok(`${label} → HTTP ${result.status} ✓`)
      : warn(`${label} not reachable — start services with: docker compose up -d`);
  }
}

// ── Runner ────────────────────────────────────────────────────────────────────

(async () => {
  console.log(`\n${B}🤖 AI Festivals Scraper — Full Project Verification${Z}`);
  console.log('─'.repeat(55));

  checkFileStructure();
  checkNextConfig();
  checkPackageJsonFiles();
  checkPrismaSchema();
  checkDockerCompose();
  checkEnvFiles();
  checkCI();
  checkTypeScript();
  checkActorTests();
  await checkLiveServices();

  console.log('\n' + '─'.repeat(55));
  console.log(`${G}✓ ${passed} passed${Z}  ${warned > 0 ? Y : ''}⚠ ${warned} warnings${Z}  ${failed > 0 ? R : ''}✗ ${failed} failed${Z}\n`);

  if (failed > 0) {
    console.log(`${R}Fix the ${failed} failure(s) above before deploying.${Z}\n`);
    process.exit(1);
  } else if (warned > 0) {
    console.log(`${Y}All critical checks pass. Review ${warned} warning(s) for best practice.${Z}\n`);
  } else {
    console.log(`${G}✓ Perfect — all checks pass! Ready for: docker compose up -d${Z}\n`);
  }
})();
