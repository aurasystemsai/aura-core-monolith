// Analyze Dashboard.jsx for structural parse issues
const { transformSync } = require('./node_modules/esbuild');
const fs = require('fs');

const src = fs.readFileSync('src/dashboard/Dashboard.jsx', 'utf8');
const lines = src.split('\n');
console.log('Total lines:', lines.length);

// Count backticks
let btCount = 0;
for (const line of lines) {
  for (const c of line) {
    if (c === '`') btCount++;
  }
}
console.log('Backtick count:', btCount, btCount % 2 === 0 ? '(EVEN - OK)' : '(ODD - PROBLEM!)');

// Find all JSX expression containers that might be unclosed
// Use a simple approach: test each 100-line section
console.log('\nTesting sections of 100 lines each to find broken area...');
for (let start = 0; start < lines.length - 100; start += 50) {
  const end = Math.min(start + 200, lines.length);
  const section = lines.slice(start, end).join('\n');
  // We can't test sections in isolation, so test prefix
}

// Binary search approach using just the file itself
// Test: take first N lines + a dummy export
function testPrefix(n) {
  // Close with minimal valid end
  const prefix = lines.slice(0, n).join('\n');
  // Count open braces to close them
  const test = prefix + '\nexport default function Dummy() { return null; }';
  try {
    transformSync(test, { loader: 'jsx', jsx: 'automatic' });
    return true;
  } catch(e) {
    return false;
  }
}

// Instead, look for specific patterns that could break parsing
// Search for: unmatched JSX, regex-like expressions, etc.

// Check for common issues:
// 1. Bare < > in JSX that look like comparisons
// 2. Regex literals that look like JSX
// 3. } followed by JSX on same line without semicolon/comma

const issues = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  // Look for lines that have unbalanced { without matching } and contain JSX
  const opens = (line.match(/\{/g) || []).length;
  const closes = (line.match(/\}/g) || []).length;
  // Flag only really suspicious ones
  if (Math.abs(opens - closes) > 3) {
    issues.push({ line: i+1, content: line.slice(0, 80), opens, closes });
  }
}

if (issues.length > 0) {
  console.log('\nLines with very unbalanced braces:');
  issues.forEach(x => console.log(`  Line ${x.line} (+${x.opens}-${x.closes}): ${x.content}`));
} else {
  console.log('\nNo single-line brace imbalances > 3 found');
}

// Look for the actual JSX return block - find lines with just closing tags
// that might be in wrong place
const modalLines = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('showScanModal') || lines[i].includes('scanModal')) {
    modalLines.push({ line: i+1, content: lines[i].trim().slice(0, 80) });
  }
}
console.log('\nLines mentioning showScanModal/scanModal:', modalLines.length);
modalLines.forEach(x => console.log(`  Line ${x.line}: ${x.content}`));
