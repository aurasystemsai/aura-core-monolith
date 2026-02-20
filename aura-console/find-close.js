// Proper parser that handles template literals with ${} interpolation
const src = require('fs').readFileSync('src/dashboard/Dashboard.jsx', 'utf8');

// Find the position of line 159 (0-indexed = 158)
const lines = src.split('\n');
const startPos = lines.slice(0, 158).join('\n').length + 1; // skip to line 159

// State machine
const NORMAL = 0, IN_SINGLE = 1, IN_DOUBLE = 2, IN_TEMPLATE = 3, IN_COMMENT_LINE = 4, IN_COMMENT_BLOCK = 5;
let state = NORMAL;
let braceDepth = 0;
let templateStack = []; // stack of brace depths when we entered template
let lineNum = 159;
let colNum = 0;
let hits = [];
let negatives = [];

const src159 = src.slice(startPos - (lines[158].length > 0 ? 0 : 0));
// Actually slice from the { character on line 159
const line159 = lines[158];
const openBrace = line159.indexOf('{');
const slice = src.slice(lines.slice(0,158).join('\n').length + 1 + openBrace);

let lineOffset = 159;

for (let i = 0; i < slice.length; i++) {
  const c = slice[i];
  const next = slice[i+1] || '';
  
  if (c === '\n') { lineOffset++; continue; }
  
  if (state === IN_COMMENT_LINE) { /* skip until newline handled above */ continue; }
  
  if (state === IN_COMMENT_BLOCK) {
    if (c === '*' && next === '/') { state = NORMAL; i++; }
    continue;
  }
  
  if (state === IN_SINGLE) {
    if (c === '\\') { i++; continue; }
    if (c === "'") state = NORMAL;
    continue;
  }
  
  if (state === IN_DOUBLE) {
    if (c === '\\') { i++; continue; }
    if (c === '"') state = NORMAL;
    continue;
  }
  
  if (state === IN_TEMPLATE) {
    if (c === '\\') { i++; continue; }
    if (c === '`') { 
      // close template - pop stack
      if (templateStack.length > 0) braceDepth = templateStack.pop();
      state = NORMAL; 
      continue; 
    }
    if (c === '$' && next === '{') {
      // interpolation start - push current template state
      templateStack.push(-1); // marker
      braceDepth++;
      i++;
      state = NORMAL;
      continue;
    }
    continue;
  }
  
  // NORMAL state
  if (c === '/' && next === '/') { state = IN_COMMENT_LINE; continue; }
  if (c === '/' && next === '*') { state = IN_COMMENT_BLOCK; i++; continue; }
  if (c === "'") { state = IN_SINGLE; continue; }
  if (c === '"') { state = IN_DOUBLE; continue; }
  if (c === '`') { state = IN_TEMPLATE; continue; }
  
  if (c === '{') {
    braceDepth++;
    if (braceDepth === 1) hits.push({ line: lineOffset, ctx: 'open' });
  }
  if (c === '}') {
    // Check if we're closing a template interpolation
    if (templateStack.length > 0 && templateStack[templateStack.length-1] === -1) {
      templateStack.pop();
      state = IN_TEMPLATE;
      braceDepth--;
      continue;
    }
    braceDepth--;
    if (braceDepth === 0) {
      hits.push({ line: lineOffset, ctx: 'close - Dashboard ends here?' });
      console.log(`Dashboard closes at line ${lineOffset}`);
      // Print next 3 lines
      for (let k = lineOffset; k < Math.min(lineOffset + 3, lines.length); k++) {
        console.log(`  Line ${k+1}: ${lines[k]}`);
      }
    }
    if (braceDepth < 0) {
      negatives.push(lineOffset);
      braceDepth = 0;
    }
  }
}
console.log('Final braceDepth:', braceDepth);
if (negatives.length) console.log('Negative depth at lines:', negatives.slice(0,5));

