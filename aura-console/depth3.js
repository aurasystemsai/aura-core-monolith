const fs = require('fs');
const lines = fs.readFileSync('src/dashboard/Dashboard.jsx', 'utf8').split('\n');
const returnLine = 709; // line 710, 0-indexed (main JSX return)

let depth = 0;
let inTemplateLit = false;
let closedAt = -1;

for (let i = returnLine; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    if (ch === String.fromCharCode(96)) { // backtick
      inTemplateLit = !inTemplateLit;
    } else if (!inTemplateLit) {
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0) {
          closedAt = i;
          break;
        }
      }
    }
  }
  if (closedAt !== -1) break;
}

console.log('Return at line 710 closes at line:', closedAt + 1);
console.log('Total lines:', lines.length);
if (closedAt !== -1 && closedAt < lines.length - 5) {
  console.log('\n*** EARLY CLOSE DETECTED ***');
  for (let i = Math.max(0, closedAt - 5); i <= Math.min(lines.length - 1, closedAt + 5); i++) {
    const marker = i === closedAt ? '>>>' : '   ';
    console.log(marker, 'L' + (i + 1) + ':', lines[i].slice(0, 100));
  }
} else {
  console.log('Return closes at end of file (expected)');
}
