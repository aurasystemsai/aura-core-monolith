const fs = require('fs');
const backSrc = fs.readFileSync('src/routes/reviews-ugc-engine.js', 'utf8');
const backRoutes = [...backSrc.matchAll(/router\.(get|post|put|delete|patch)\s*\(\s*'([^']+)'/gi)]
  .map(m => m[1].toUpperCase() + '|' + m[2]);

const frontSrc = fs.readFileSync('aura-console/src/components/tools/ReviewUGCEngine.jsx', 'utf8');

// Extract all apiFetch calls with method and path
const frontCalls = [];
const callRegex = /apiFetch\(`\$\{BASE\}([^`]+)`(?:[^;]*?method:\s*'([A-Z]+)')?/g;
let match;
while ((match = callRegex.exec(frontSrc)) !== null) {
  const rawPath = match[1].split('`')[0];
  const method = match[2] || 'GET';
  frontCalls.push({ path: rawPath, method: method.toUpperCase() });
}

function normalize(path) {
  return path.replace(/\$\{[^}]+\}/g, ':param');
}

function matchesRoute(method, path, routes) {
  const np = normalize(path);
  return routes.some(r => {
    const pipeIdx = r.indexOf('|');
    const rm = r.slice(0, pipeIdx);
    const rp = r.slice(pipeIdx + 1);
    if (rm !== method) return false;
    const reStr = '^' + rp.replace(/:[^/]+/g, '[^/]+') + '$';
    try {
      const re = new RegExp(reStr);
      return re.test(np);
    } catch(e) { return false; }
  });
}

let ok = 0, fail = [];
frontCalls.forEach(c => {
  if (matchesRoute(c.method, c.path, backRoutes)) ok++;
  else fail.push(c.method + ' ' + c.path);
});

console.log('Checked:', frontCalls.length, '| OK:', ok, '| UNMATCHED:', fail.length);
fail.forEach(f => console.log('  MISSING BACKEND ROUTE:', f));
if (fail.length === 0) console.log('All frontend API calls have matching backend routes!');
