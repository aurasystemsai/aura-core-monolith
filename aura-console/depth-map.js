const src = require('fs').readFileSync('src/dashboard/Dashboard.jsx', 'utf8');
const lines = src.split('\n');
let d = 0;
const s = [];
lines.forEach((l, i) => {
  const o = (l.match(/<div[\s>]/g)||[]).length - (l.match(/<div[/]>/g)||[]).length;
  const c = (l.match(/<[/]div>/g)||[]).length;
  d += o - c;
  s.push(d);
});

// Find all lines where depth increases significantly (new section opens)
let maxD = 0;
for (let i = 0; i < s.length; i++) {
  if (s[i] > maxD) maxD = s[i];
}
console.log('Max div depth:', maxD);

// Print depth profile in ranges: show where depth never comes back down
// Find the minimum depth at each 50-line chunk
for (let i = 0; i < lines.length; i += 50) {
  const slice = s.slice(i, i + 50);
  const min = Math.min(...slice);
  const max = Math.max(...slice);
  console.log(`Lines ${i+1}-${i+50}: min=${min} max=${max}`);
}
