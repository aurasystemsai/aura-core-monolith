const fs = require('fs');
const path = require('path');

const DATA_PATH = process.env.KLAVIYO_PRESENCE_PATH || path.join(__dirname, '../../data/klaviyo-presence.json');
const TTL_MS = 5 * 60 * 1000;

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

function prune() {
  const cutoff = Date.now() - TTL_MS;
  entries = entries.filter(e => e.ts >= cutoff);
}

module.exports = {
  upsert: ({ user, status = 'editing', locale = 'en', flowId = null }) => {
    prune();
    const existingIdx = entries.findIndex(e => e.user === user);
    const record = { user, status, locale, flowId, ts: Date.now() };
    if (existingIdx >= 0) entries[existingIdx] = record; else entries.push(record);
    save(entries);
    return record;
  },
  list: () => {
    prune();
    return entries.slice().sort((a, b) => b.ts - a.ts);
  },
  clear: () => { entries = []; save(entries); },
};
