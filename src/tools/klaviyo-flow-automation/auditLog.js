const fs = require('fs');
const path = require('path');

const DATA_PATH = process.env.KLAVIYO_AUDIT_PATH || path.join(__dirname, '../../data/klaviyo-audit.json');

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

let entries = load();
let idCounter = entries.reduce((m, e) => Math.max(m, Number(e.id) || 0), 0) + 1;

module.exports = {
  record: (data = {}) => {
    const entry = { id: idCounter++, ts: Date.now(), ...data };
    entries.push(entry);
    save(entries);
    return entry;
  },
  list: (limit = 200) => entries.slice(-limit).reverse(),
  clear: () => { entries = []; save(entries); },
};
