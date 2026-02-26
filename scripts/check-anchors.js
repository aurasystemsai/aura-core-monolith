const fs = require('fs');
const src = fs.readFileSync('aura-console/src/components/tools/BlogSEO.jsx', 'utf8').replace(/\r\n/g, '\n');

// Find xRes useState declaration
const idx = src.indexOf('const [xRes, setXRes]');
if (idx !== -1) {
  console.log('xRes decl:', JSON.stringify(src.slice(idx - 10, idx + 400)));
} else {
  console.log('xRes decl NOT FOUND');
}


// Find contentLengthNum
const idx2 = src.indexOf('contentLengthNum');
if (idx2 !== -1) {
  console.log('contentLengthNum context:', JSON.stringify(src.slice(idx2 - 30, idx2 + 100)));
}

// Show VoiceProfileLoad anchor
console.log('VoiceProfileLoad:', src.includes('{/* === Voice Profile Load === */}'));

// Show Trend Scout first 200 chars after its opening
const tsIdx = src.indexOf('{/* TREND SCOUT TAB */}');
console.log('Trend Scout start:', JSON.stringify(src.slice(tsIdx, tsIdx + 120)));

// Check for rankIdInput already
console.log('rankIdInput exists:', src.includes('rankIdInput'));
