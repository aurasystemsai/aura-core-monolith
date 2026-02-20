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

// Find lines where the LOCAL MINIMUM LOOKING FORWARD rises
// i.e., after this line, the depth never dips below [threshold]
// Show lines where depth is low AND the next low point is higher
const WINDOW = 30;
for (let i = 0; i < lines.length - WINDOW; i++) {
  const before = Math.min(...s.slice(Math.max(0, i-5), i+1));
  const after = Math.min(...s.slice(i+1, i + WINDOW));
  if (before < after && before <= 5 && after >= before + 2) {
    console.log(`Line ${i+1} baseline rises from ${before} to ${after}+`);
    console.log(`  ${lines[i].trim().slice(0, 80)}`);
  }
}
