// NEW CONTENT - overwrite
const { transformSync } = require('./node_modules/esbuild');
const fs = require('fs');

const src774 = fs.readFileSync('dash-774.jsx', 'utf8');
const src3a0 = fs.readFileSync('dash-3a0.jsx', 'utf8');
const lines774 = src774.split('\n');
const lines3a0 = src3a0.split('\n');

// Find the diff - lines where they diverge
// Simple line diff
let divergeStart = -1;
for (let i = 0; i < Math.min(lines774.length, lines3a0.length); i++) {
  if (lines774[i] !== lines3a0[i]) {
    divergeStart = i;
    break;
  }
}
console.log('Files diverge at line', divergeStart + 1);
console.log('774 line:', JSON.stringify(lines774[divergeStart]));
console.log('3a0 line:', JSON.stringify(lines3a0[divergeStart]));

// Find where they reconverge (if they do)
let reconverge = -1;
for (let i = divergeStart + 1; i < Math.min(lines774.length, lines3a0.length); i++) {
  // Look for section headers that would mark sections
  if (lines774[i] && lines3a0[i] && lines774[i] === lines3a0[i] && lines774[i].includes('{/*')) {
    reconverge = i;
    break;
  }
}
if (reconverge !== -1) {
  console.log('Files reconverge at line', reconverge + 1, ':', JSON.stringify(lines774[reconverge]));
}

// Binary search: replace section from divergeStart onwards with 774 content
// and test if it fixes
console.log('\nBinary search to find which added section breaks it...');
const lo3a0 = lines3a0.slice(divergeStart).length;
const lo774 = lines774.slice(divergeStart).length;

// Test: take 3a0 start + 774 end - if OK, problem is in the new code
const test1 = [...lines3a0.slice(0, divergeStart), ...lines774.slice(divergeStart)].join('\n');
try { transformSync(test1, {loader:'jsx',jsx:'automatic'}); console.log('Hybrid (3a0 start + 774 end): OK - problem is in new code section starting at', divergeStart+1); }
catch(e) { console.log('Hybrid still fails at line', e.errors[0].location.line); }
