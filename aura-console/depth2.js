// Track JSX expression depth to find where the main return closes
// This finds the closing paren of the main return() - if it closes before line 1607,
// the export would be "unexpected"

const fs = require('fs');
const src = fs.readFileSync('src/dashboard/Dashboard.jsx', 'utf8');
const lines = src.split('\n');

// Find the main return (after line 600)
let returnLine = -1;
for (let i = 600; i < lines.length; i++) {
  if (lines[i].match(/^\treturn \(/) || lines[i].match(/^\t\treturn \(/)) {
    returnLine = i;
    break;
  }
}
console.log('Main return found at line:', returnLine + 1);
console.log('Line:', lines[returnLine]);

// Track paren depth from the return line
let depth = 0;
let inString = false;
let inTemplate = 0; // template literal nesting
let closedAt = -1;

for (let i = returnLine; i < lines.length; i++) {
  const line = lines[i];
  for (let c = 0; c < line.length; c++) {
    const ch = line[c];
    if (ch === '`') {
      if (inTemplate > 0) inTemplate--;
      else inTemplate++;
    } else if (inTemplate === 0) {
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0 && i > returnLine) {
          closedAt = i;
          break;
        }
      }
    }
  }
  if (closedAt !== -1) break;
}

console.log('Main return closes at line:', closedAt + 1);
console.log('Total lines:', lines.length);
console.log('Lines after close:', lines.length - closedAt - 1);

if (closedAt !== -1 && closedAt < lines.length - 5) {
  console.log('\nContext around close:');
  for (let i = Math.max(0, closedAt - 3); i <= Math.min(lines.length - 1, closedAt + 5); i++) {
    const marker = i === closedAt ? '>>> CLOSE: ' : '           ';
    console.log(`${marker}Line ${i+1}: ${lines[i]}`);
  }
}
