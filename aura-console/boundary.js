// Find ALL function/component boundaries and their return() close points
const { transformSync } = require('./node_modules/esbuild');
const fs = require('fs');

const src = fs.readFileSync('src/dashboard/Dashboard.jsx', 'utf8');
const lines = src.split('\n');

// Strategy: use binary search on ACTUAL file
// Test: first N lines + '\nexport default Dashboard;'
// Find the LAST line N where it FAILS, then N+1 it passes → that's a structure close

function testWithExport(n) {
  const partial = lines.slice(0, n).join('\n') + '\nexport default Dashboard;';
  try {
    transformSync(partial, { loader: 'jsx', jsx: 'automatic' });
    return true; // OK
  } catch(e) {
    return false; // FAIL
  }
}

// We know: full file (1608 lines) FAILS
// Try: small prefixes
// Find the boundary where adding 'export default Dashboard;' transitions from OK to FAIL

// Test a few key points
const tests = [100, 200, 400, 600, 700, 710, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1604, 1605, 1606];
for (const n of tests) {
  const result = testWithExport(n);
  console.log(`Lines 1-${n}: ${result ? 'OK' : 'FAIL'}`);
}
