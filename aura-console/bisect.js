const { transformSync } = require('./node_modules/esbuild');
const src = require('fs').readFileSync('src/dashboard/Dashboard.jsx', 'utf8');
const lines = src.split('\n');

// Binary search: find smallest range that when REMOVED fixes the error
// First confirm full file fails
try {
  transformSync(src, { loader: 'jsx', jsx: 'automatic' });
  console.log('File parses OK!');
  process.exit(0);
} catch (e) {
  console.log('Confirmed fail at line', e.errors[0].location.line);
}

// Find which line block removal fixes it
// Start from line 160, try removing each block of 50 lines
for (let start = 159; start < lines.length - 10; start += 25) {
  const end = start + 50;
  const test = [...lines.slice(0, start), ...lines.slice(end)].join('\n');
  try {
    transformSync(test, { loader: 'jsx', jsx: 'automatic' });
    console.log(`Removing lines ${start+1}-${end} FIXES it! Narrowing...`);
    // Narrow down within this range
    for (let s2 = start; s2 < Math.min(end, lines.length); s2++) {
      const t2 = [...lines.slice(0, s2), ...lines.slice(s2 + 1)].join('\n');
      try {
        transformSync(t2, { loader: 'jsx', jsx: 'automatic' });
        console.log(`  Removing single line ${s2+1} FIXES it: ${lines[s2].trim().slice(0,80)}`);
        process.exit(0);
      } catch {}
    }
    break;
  } catch {}
}
console.log('Could not isolate by single line removal');
