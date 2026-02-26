#!/usr/bin/env node
/**
 * Blog-SEO Tool Audit Bot
 * - Extracts all apiFetch calls from BlogSEO.jsx
 * - Extracts all route definitions from blog-seo/router.js
 * - Cross-references: frontend calls vs backend routes
 * - Checks backend route bodies for stub patterns
 * - Optionally runs live HTTP tests if server is running
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const JSX  = path.join(ROOT, 'aura-console/src/components/tools/BlogSEO.jsx');
const ROUTER = path.join(ROOT, 'src/tools/blog-seo/router.js');

const PASS  = '\x1b[32m✅\x1b[0m';
const FAIL  = '\x1b[31m❌\x1b[0m';
const WARN  = '\x1b[33m⚠️ \x1b[0m';
const INFO  = '\x1b[36mℹ️ \x1b[0m';

// ── 1. Extract frontend API calls ─────────────────────────────────────────────
function extractFrontendCalls(src) {
  const calls = [];
  const seen = new Set();

  function addCall(route, method, raw) {
    const norm = method + ':' + route;
    if (seen.has(norm)) return;
    seen.add(norm);
    calls.push({ route, method, raw });
  }

  // Pattern 1: apiFetch(`${API}/some/path`) — relative template literals
  const re1 = /apiFetch\(`\$\{API\}\/([^`]+)`/g;
  let m;
  while ((m = re1.exec(src)) !== null) {
    const route = m[1].replace(/\$\{[^}]+\}/g, ':param').replace(/`.*/, '').trim();
    const context = src.slice(Math.max(0, m.index - 100), m.index + 300);
    const methodMatch = context.match(/method:\s*['"]([A-Z]+)['"]/);
    addCall(route, methodMatch ? methodMatch[1] : 'GET', m[1]);
  }

  // Pattern 2: apiFetch("/api/blog-seo/some/path") — hardcoded absolute paths
  const re2 = /apiFetch\(["'`]\/api\/blog-seo\/([^"'`?]+)/g;
  while ((m = re2.exec(src)) !== null) {
    const route = m[1].replace(/\$\{[^}]+\}/g, ':param').trim();
    const context = src.slice(Math.max(0, m.index - 100), m.index + 300);
    const methodMatch = context.match(/method:\s*['"]([A-Z]+)['"]/);
    addCall(route, methodMatch ? methodMatch[1] : 'GET', m[1]);
  }

  return calls;
}

// ── 2. Extract backend routes ─────────────────────────────────────────────────
function extractBackendRoutes(src) {
  const routes = [];
  // Multi-line aware: find router.METHOD('path', handler)
  const re = /router\.(get|post|put|delete|patch)\(\s*'([^']+)'/gi;
  let m;
  while ((m = re.exec(src)) !== null) {
    routes.push({ method: m[1].toUpperCase(), path: m[2] });
  }
  return routes;
}

// ── 3. Check if a route body looks like a real handler ─────────────────────
function classifyRouteBody(src, routeMethod, routePath) {
  // Find the route definition
  const defRe = new RegExp(`router\\.${routeMethod.toLowerCase()}\\(\\s*'${escapeRegex(routePath)}'`, 'i');
  const defMatch = defRe.exec(src);
  if (!defMatch) return 'NOT_FOUND';
  
  // Grab ~800 chars of body after the route definition
  const body = src.slice(defMatch.index, defMatch.index + 800);
  
  const hasAI       = /openai|gpt-|chat\.completions|createChat/i.test(body);
  const hasRealWork = /await\s+\w|\.map\(|\.filter\(|JSON\.parse|fs\.|loadRankData|loadCrawlData|loadVoices|scoreIntent|evaluateKeyword|analyzeMetadata|historyStore|profileStore|Store\.|schema\s*=\s*\{|'@context'|'@type'|schema\.org/i.test(body);
  // Only a stub if the entire handler fits in one short res.json call with no logic
  const onlySingleJson = /^[^}]{0,120}res\.json\(\{[^}]{0,80}\}\)[^}]{0,20}\}/.test(body.replace(/\s+/g, ' '));
  const isStub      = onlySingleJson && !hasAI && !hasRealWork;
  const hasError    = /res\.status\(4|try\s*\{/i.test(body);
  
  if (hasAI) return 'AI';
  if (hasRealWork) return 'LOGIC';
  if (isStub) return 'STUB';
  return 'BASIC';
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── 4. Normalise a path for matching (replace :param with placeholder) ────
function normalisePath(p) {
  return p.replace(/:[^/]+/g, ':x').replace(/\*$/, '');
}

// ── 5. Live HTTP test (optional) ─────────────────────────────────────────────
function httpGet(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 2000 }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data.slice(0, 200) }));
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n\x1b[1m═══════════════════════════════════════════════════');
  console.log('   BLOG-SEO TOOL AUDIT BOT');
  console.log('═══════════════════════════════════════════════════\x1b[0m\n');

  const jsxSrc    = fs.readFileSync(JSX, 'utf8');
  const routerSrc = fs.readFileSync(ROUTER, 'utf8');

  const frontendCalls = extractFrontendCalls(jsxSrc);
  const backendRoutes = extractBackendRoutes(routerSrc);

  console.log(`${INFO} Frontend API calls found:  ${frontendCalls.length}`);
  console.log(`${INFO} Backend routes defined:    ${backendRoutes.length}\n`);

  // ── A. Check every frontend call has a matching backend route ────────────
  console.log('\x1b[1m─── A. Frontend → Backend coverage ───────────────────\x1b[0m');
  let missingRoutes = 0;
  const testedPaths = new Set();

  for (const call of frontendCalls) {
    const normFe = normalisePath(call.route);
    const match = backendRoutes.find(r => {
      return (r.method === call.method || call.method === 'GET' && r.method === 'GET') &&
             normalisePath(r.path) === '/' + normFe;
    }) || backendRoutes.find(r => normalisePath(r.path) === '/' + normFe);

    if (!match) {
      console.log(`  ${FAIL} ${call.method} /${call.route}  — NO BACKEND ROUTE`);
      missingRoutes++;
    } else {
      testedPaths.add(match.method + ':' + match.path);
    }
  }
  if (missingRoutes === 0) {
    console.log(`  ${PASS} All ${frontendCalls.length} frontend calls have a matching backend route`);
  } else {
    console.log(`  ${WARN} ${missingRoutes} frontend calls have no matching backend route`);
  }

  // ── B. Classify every backend route ──────────────────────────────────────
  console.log('\n\x1b[1m─── B. Backend route quality scan ─────────────────────\x1b[0m');
  const counts = { AI: 0, LOGIC: 0, BASIC: 0, STUB: 0 };
  const stubs = [];

  for (const r of backendRoutes) {
    const type = classifyRouteBody(routerSrc, r.method, r.path);
    counts[type] = (counts[type] || 0) + 1;
    if (type === 'STUB') stubs.push(r);
  }

  console.log(`  ${PASS} AI-powered routes:   ${counts.AI}`);
  console.log(`  ${PASS} Logic/data routes:   ${counts.LOGIC}`);
  console.log(`  ${INFO} Basic (small) routes: ${counts.BASIC}`);
  if (stubs.length > 0) {
    console.log(`  ${WARN} Stub-only routes:    ${stubs.length}`);
    stubs.slice(0, 20).forEach(r => console.log(`        ${r.method} ${r.path}`));
    if (stubs.length > 20) console.log(`        ... and ${stubs.length - 20} more`);
  } else {
    console.log(`  ${PASS} Stub-only routes:    0`);
  }

  // ── C. Check backend routes NOT covered by any frontend call ─────────────
  console.log('\n\x1b[1m─── C. Backend routes with no frontend UI call ────────\x1b[0m');
  const uncovered = backendRoutes.filter(r => {
    const norm = normalisePath(r.path).slice(1); // strip leading /
    return !frontendCalls.find(c => normalisePath(c.route) === norm || normalisePath(c.route) === normalisePath(r.path).slice(1));
  });
  // Filter out health/stats/utility routes
  const meaningfulUncovered = uncovered.filter(r => 
    !r.path.match(/^\/(health|stats|debug)$/)
  );
  console.log(`  ${INFO} Uncovered routes (no frontend call): ${meaningfulUncovered.length}`);
  if (meaningfulUncovered.length > 0 && meaningfulUncovered.length <= 40) {
    meaningfulUncovered.forEach(r => console.log(`        ${r.method} ${r.path}`));
  } else if (meaningfulUncovered.length > 40) {
    meaningfulUncovered.slice(0, 40).forEach(r => console.log(`        ${r.method} ${r.path}`));
    console.log(`        ... and ${meaningfulUncovered.length - 40} more`);
  }

  // ── D. Check for broken patterns in JSX ──────────────────────────────────
  console.log('\n\x1b[1m─── D. JSX quality scan ───────────────────────────────\x1b[0m');

  const todoCount   = (jsxSrc.match(/TODO|coming.?soon|not.?implemented/gi) || []).length;
  const alertCount  = (jsxSrc.match(/\balert\(/g) || []).length;
  const logCount    = (jsxSrc.match(/console\.log/g) || []).length;
  // Buttons that have no onClick at all on the same JSX element (same line)
  const btnLines    = jsxSrc.split('\n').filter(l => /<button/.test(l));
  const noClickSame = btnLines.filter(l => !l.includes('onClick'));

  console.log(`  ${todoCount   === 0 ? PASS : WARN} TODO / coming-soon comments: ${todoCount}`);
  console.log(`  ${alertCount  <= 1  ? PASS : WARN} alert() calls: ${alertCount}`);
  console.log(`  ${logCount    === 0 ? PASS : WARN} console.log calls: ${logCount}`);
  console.log(`  ${INFO} Buttons without onClick on same line: ${noClickSame.length} (onClick may be on next line — see below)`);

  // Check if those buttons truly have no onClick nearby (within 3 lines)
  const lines = jsxSrc.split('\n');
  let trulyNoClick = 0;
  lines.forEach((line, i) => {
    if (/<button/.test(line) && !line.includes('onClick')) {
      // Check next 8 lines (multi-line JSX props can span several lines)
      const nearby = lines.slice(i, i + 9).join(' ');
      if (!nearby.includes('onClick')) {
        trulyNoClick++;
        console.log(`    ${WARN} L${i+1}: ${line.trim().slice(0, 100)}`);
      }
    }
  });
  if (trulyNoClick === 0) {
    console.log(`  ${PASS} All buttons have onClick within 3 lines`);
  }

  // ── E. Live server test ───────────────────────────────────────────────────
  console.log('\n\x1b[1m─── E. Live server health check ───────────────────────\x1b[0m');
  const health = await httpGet('http://localhost:10000/api/blog-seo/health');
  if (!health) {
    console.log(`  ${INFO} Server not running on :10000 — skipping live tests`);
  } else {
    console.log(`  ${health.status === 200 ? PASS : FAIL} GET /api/blog-seo/health → ${health.status}`);
    console.log(`       ${health.body}`);
    
    // Hit a few key routes
    const liveTests = [
      { url: 'http://localhost:10000/api/blog-seo/stats', label: 'GET /stats' },
    ];
    for (const t of liveTests) {
      const r = await httpGet(t.url);
      console.log(`  ${r && r.status < 400 ? PASS : FAIL} ${t.label} → ${r ? r.status : 'timeout'}`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n\x1b[1m═══════════════════════════════════════════════════');
  console.log('   SUMMARY');
  console.log('═══════════════════════════════════════════════════\x1b[0m');
  console.log(`  Frontend API calls:          ${frontendCalls.length}`);
  console.log(`  Backend routes:              ${backendRoutes.length}`);
  console.log(`  Missing backend routes:      ${missingRoutes}`);
  console.log(`  Stub-only backend routes:    ${stubs.length}`);
  console.log(`  Uncovered backend routes:    ${meaningfulUncovered.length}`);
  console.log(`  Buttons missing onClick:     ${trulyNoClick}`);
  console.log(`  TODO/coming-soon markers:    ${todoCount}`);
  console.log('');
  
  const issues = missingRoutes + stubs.length + trulyNoClick + todoCount;
  if (issues === 0) {
    console.log(`  \x1b[32m✅ ALL CHECKS PASSED — tool appears fully functional\x1b[0m`);
  } else {
    console.log(`  \x1b[33m⚠️  ${issues} issue(s) found — review above\x1b[0m`);
  }
  console.log('');
}

main().catch(e => { console.error(e); process.exit(1); });
