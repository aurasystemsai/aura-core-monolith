// Binary search: find exact line in 3a0 where the break occurs
// Strategy: test 3a0[0..N] + 774[190..end], binary search N
const { transformSync } = require('./node_modules/esbuild');
const fs = require('fs');

const src774 = fs.readFileSync('dash-774.jsx', 'utf8');
const src3a0 = fs.readFileSync('dash-3a0.jsx', 'utf8');
const lines774 = src774.split('\n');
const lines3a0 = src3a0.split('\n');

// Tail from 774 starting at line 191 (index 190)
const tail774 = lines774.slice(190);

function test(n) {
  const combo = [...lines3a0.slice(0, n), ...tail774].join('\n');
  try {
    transformSync(combo, { loader: 'jsx', jsx: 'automatic' });
    return true; // OK
  } catch(e) {
    return false; // FAIL
  }
}

// We know: n=190 → OK (from diff-check.js), n=lines3a0.length → FAIL
// Binary search for smallest n where it FAILS
let lo = 190, hi = lines3a0.length;
while (hi - lo > 1) {
  const mid = Math.floor((lo + hi) / 2);
  if (test(mid)) {
    lo = mid;
  } else {
    hi = mid;
  }
}

console.log(`Break found at 3a0 line ${hi} (0-indexed) = file line ${hi}`);
console.log(`Line content: ${JSON.stringify(lines3a0[hi - 1])}`);
console.log('\nContext (lines around break):');
for (let i = Math.max(0, hi - 5); i < Math.min(lines3a0.length, hi + 5); i++) {
  const marker = i === hi - 1 ? '>>> ' : '    ';
  console.log(`${marker}${i + 1}: ${lines3a0[i]}`);
}
