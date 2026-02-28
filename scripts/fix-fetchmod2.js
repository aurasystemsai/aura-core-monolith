const fs = require('fs');

const files = [
  'src/tools/blog-seo/router.js',
  'src/tools/on-page-seo-engine/router.js',
];

// Matches any fetchMod call that:
//  - fetches the local `url` variable (not link.url, apiUrl, robotsUrl, pageUrl, etc.)
//  - has a single-line options object
//  - assigns result to `html` variable (with or without const, with possible extra spaces)
const PATTERN = /const fetchMod = \(await import\('node-fetch'\)\)\.default;\r?\n(\s+)const \w+ = await fetchMod\(url, \{[^\r\n]*\}\);\r?\n\s+(?:const )?html\s+=\s+await \w+\.text\(\);/g;

const REPLACEMENT = "const { fetchForAnalysis: _fetchPageHtml } = require('../../core/shopifyContentFetcher');\n$1const { html } = await _fetchPageHtml(url, req);";

for (const file of files) {
  let c = fs.readFileSync(file, 'utf8');
  const before = (c.match(/fetchMod = \(await import/g) || []).length;

  // Test pattern on first match before replacing all
  const testMatch = PATTERN.exec(c);
  PATTERN.lastIndex = 0; // reset
  if (testMatch) {
    console.log(`${file} - first match preview:`, JSON.stringify(testMatch[0].slice(0, 120)));
  } else {
    console.log(`${file} - NO MATCHES found`);
  }

  c = c.replace(PATTERN, REPLACEMENT);
  const after = (c.match(/fetchMod = \(await import/g) || []).length;
  console.log(`${file}: replaced ${before - after} of ${before} (remaining: ${after})`);
  fs.writeFileSync(file, c);
}
