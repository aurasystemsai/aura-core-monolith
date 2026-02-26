const fs = require('fs');
const src = fs.readFileSync(__dirname + '/../src/tools/blog-seo/router.js', 'utf8');
const jsxSrc = fs.readFileSync(__dirname + '/../aura-console/src/components/tools/BlogSEO.jsx', 'utf8');

const beRoutes = [];
const re = /router\.(get|post|put|delete|patch)\(\s*'([^']+)'/gi;
let m;
while ((m = re.exec(src)) !== null) beRoutes.push({ method: m[1].toUpperCase(), path: m[2] });

const feCalls = new Set();
const re1 = /apiFetch\(`\$\{API\}\/([^`]+)`/g;
while ((m = re1.exec(jsxSrc)) !== null) feCalls.add(m[1].replace(/\$\{[^}]+\}/g, ':x').split('?')[0].trim());
const re2 = /apiFetch\(["'`]\/api\/blog-seo\/([^"'`?]+)/g;
while ((m = re2.exec(jsxSrc)) !== null) feCalls.add(m[1].replace(/\$\{[^}]+\}/g, ':x').trim());

function norm(p) { return p.replace(/:[^/]+/g, ':x').replace(/^\//, ''); }

const uncovered = beRoutes.filter(r =>
  !r.path.match(/^\/(health|stats)$/) &&
  ![...feCalls].find(c => norm(c) === norm(r.path))
);

// Group by prefix
const groups = {};
uncovered.forEach(r => {
  const prefix = r.path.split('/')[1] || 'root';
  if (!groups[prefix]) groups[prefix] = [];
  groups[prefix].push(r);
});

console.log('Total uncovered:', uncovered.length, '\n');
Object.entries(groups).sort().forEach(([g, routes]) => {
  console.log(`\n[${g}] (${routes.length})`);
  routes.forEach(r => console.log(`  ${r.method} ${r.path}`));
});
