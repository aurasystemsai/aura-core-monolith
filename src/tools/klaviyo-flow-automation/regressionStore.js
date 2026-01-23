const fs = require('fs');
const path = require('path');

const DATA_PATH = process.env.KLAVIYO_REGRESSION_PATH || path.join(__dirname, '../../data/klaviyo-regression.json');

function ensureDirSync(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function load() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}

function save(items) {
  ensureDirSync(DATA_PATH);
  fs.writeFileSync(DATA_PATH, JSON.stringify(items, null, 2), 'utf8');
}

let cases = load();
let idCounter = cases.reduce((m, c) => Math.max(m, Number(c.id) || 0), 0) + 1;

module.exports = {
  list: (flowId) => flowId ? cases.filter(c => String(c.flowId) === String(flowId)) : cases,
  create: ({ flowId, name, input, expected }) => {
    const entry = { id: idCounter++, flowId, name, input, expected, createdAt: Date.now() };
    cases.push(entry);
    save(cases);
    return entry;
  },
  clear: () => { cases = []; save(cases); },
};
