const { transformSync } = require('./node_modules/esbuild');
const fs = require('fs');

const src = fs.readFileSync('src/dashboard/Dashboard.jsx', 'utf8');
const lines = src.split('\n');

function testWithExport(n) {
  const partial = lines.slice(0, n).join('\n') + '\nexport default Dashboard;';
  try {
    transformSync(partial, { loader: 'jsx', jsx: 'automatic' });
    return true;
  } catch(e) {
    return e.errors?.[0]?.text || 'ERROR';
  }
}

// Binary search: find first line where it FAILS
// Test every 10 lines under 100
for (let n = 5; n <= 160; n += 5) {
  const result = testWithExport(n);
  const ok = result === true;
  if (!ok) {
    console.log(`L1-${n}: FAIL - ${result}`);
  } else {
    console.log(`L1-${n}: OK`);
  }
}
