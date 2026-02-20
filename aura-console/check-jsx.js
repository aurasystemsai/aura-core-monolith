const { transformSync } = require('./node_modules/esbuild');
const src = require('fs').readFileSync('src/dashboard/Dashboard.jsx', 'utf8');
const lines = src.split('\n');

// Check export default count
const exportLines = lines.map((l, i) => ({ l, i })).filter(x => x.l.match(/^export\s+default/));
console.log('export default occurrences:', exportLines.map(x => `line ${x.i + 1}: ${x.l.trim()}`));

// Check for unclosed template literals by scanning file
let inSingleStr = false, inDoubleStr = false, inTemplate = 0;
let lastBacktickLine = -1;
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  for (let j = 0; j < l.length; j++) {
    const c = l[j];
    const prev = j > 0 ? l[j-1] : '';
    if (prev === '\\') continue;
    if (!inSingleStr && !inDoubleStr && c === '`') {
      if (inTemplate > 0) { inTemplate--; } else { inTemplate++; lastBacktickLine = i + 1; }
    } else if (!inDoubleStr && !inTemplate && c === "'") inSingleStr = !inSingleStr;
    else if (!inSingleStr && !inTemplate && c === '"') inDoubleStr = !inDoubleStr;
  }
}
console.log('Template literal depth at end:', inTemplate, '(last backtick line:', lastBacktickLine, ')');

// Find all backtick positions by line
const backtickLines = [];
lines.forEach((l, i) => {
  let count = (l.match(/`/g) || []).length;
  if (count > 0) backtickLines.push(`line ${i+1}: ${count} backtick(s) - ${l.trim().slice(0, 80)}`);
});
console.log('\nLines with backticks:');
backtickLines.forEach(x => console.log(x));
