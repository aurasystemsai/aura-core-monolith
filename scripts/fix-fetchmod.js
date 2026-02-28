const fs = require('fs');
const file = 'src/tools/blog-seo/router.js';
let c = fs.readFileSync(file, 'utf8');

const before = (c.match(/const fetchMod = \(await import\('node-fetch'\)\)\.default;\s*const r = await fetchMod\(url,/g) || []).length;

// Replace the standard pattern: fetch(url) for content analysis
c = c.replace(
  /const fetchMod = \(await import\('node-fetch'\)\)\.default;\s*const r = await fetchMod\(url, \{ headers: \{ 'User-Agent': 'Mozilla\/5\.0 \(compatible; AuraSEO\/1\.0\)' \}, timeout: 12000 \}\);\s*const html = await r\.text\(\);/g,
  "const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');\n    const { html } = await _fetchPageHtml(url, req);"
);

const after = (c.match(/const fetchMod = \(await import\('node-fetch'\)\)\.default;\s*const r = await fetchMod\(url,/g) || []).length;
fs.writeFileSync(file, c);
console.log('Replaced', before - after, 'occurrences. Remaining fetchMod(url..:', after);

// Show what's left
const remaining = (c.match(/fetchMod = \(await import\('node-fetch'\)\)\.default/g) || []).length;
console.log('Total remaining fetchMod usages:', remaining);
