const { transformSync } = require('./node_modules/esbuild');
const fs = require('fs');

const src = fs.readFileSync('src/dashboard/Dashboard.jsx', 'utf8');

try {
  transformSync(src, { loader: 'jsx', jsx: 'automatic' });
  console.log('PARSE OK');
} catch(e) {
  console.log('PARSE FAILED');
  if (e.errors) {
    e.errors.forEach(err => {
      console.log(`Error at line ${err.location?.line}, col ${err.location?.column}: ${err.text}`);
      if (err.location?.lineText) {
        console.log('Line text:', JSON.stringify(err.location.lineText));
      }
    });
  }
  
  // Also try to show context around the error line
  const lines = src.split('\n');
  const errLine = e.errors?.[0]?.location?.line;
  if (errLine) {
    console.log('\nContext around error line', errLine, ':');
    for (let i = Math.max(0, errLine - 10); i <= Math.min(lines.length - 1, errLine + 2); i++) {
      console.log((i + 1 === errLine ? '>>> ' : '    ') + 'L' + (i + 1) + ': ' + lines[i].slice(0, 100));
    }
  }
}
