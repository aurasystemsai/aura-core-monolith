const babel = require('@babel/parser');
const src = require('fs').readFileSync('src/dashboard/Dashboard.jsx', 'utf8');

// Try parsing with error recovery
let ast;
try {
  ast = babel.parse(src, {
    sourceType: 'module',
    plugins: ['jsx'],
    errorRecovery: true,
  });
} catch(e) {
  console.log('Fatal parse error:', e.message);
  process.exit(1);
}

// Print any errors collected during error recovery
if (ast.errors && ast.errors.length) {
  console.log('Parse errors found:', ast.errors.length);
  ast.errors.forEach(e => {
    console.log(`  Line ${e.loc.line}:${e.loc.column} - ${e.reasonCode || e.message}`);
  });
} else {
  console.log('No errors found with error recovery!');
}
