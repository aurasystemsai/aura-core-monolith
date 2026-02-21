const fs = require('fs');
const filePath = 'aura-console/src/components/tools/ReviewUGCEngine.jsx';
let c = fs.readFileSync(filePath, 'utf8');

// Fix ?? -- } → ?? '--' }
c = c.replace(/\?\? --\}/g, "?? '--'}");

// Fix || -- } → || '--' }
c = c.replace(/\|\| --\}/g, "|| '--'}");

// Fix : -- } → : '--' }
c = c.replace(/: --\}/g, ": '--'}");

fs.writeFileSync(filePath, c, 'utf8');

// Verify no unquoted -- remain in JSX expressions
const lines = c.split('\n');
let issues = 0;
for (let i = 0; i < lines.length; i++) {
  if (/\?\? --\}|\|\| --\}|: --\}/.test(lines[i])) {
    console.log('STILL BROKEN L' + (i + 1) + ': ' + lines[i].trim());
    issues++;
  }
}
console.log(issues === 0 ? 'All fixed! No bare -- remaining.' : issues + ' issues remain.');
