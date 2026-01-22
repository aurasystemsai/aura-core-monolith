const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_PATH = process.env.KLAVIYO_CONNECTORS_PATH || path.join(__dirname, '../../data/klaviyo-connectors.json');

function ensureDirSync(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function load() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_err) {
    return {};
  }
}

function save(cfg) {
  ensureDirSync(DATA_PATH);
  fs.writeFileSync(DATA_PATH, JSON.stringify(cfg, null, 2), 'utf8');
}

let connectors = load();

function hashPII(value) {
  if (!value) return value;
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

module.exports = {
  all: () => connectors,
  set: (key, data) => {
    connectors[key] = { ...(connectors[key] || {}), ...data, updatedAt: Date.now() };
    save(connectors);
    return connectors[key];
  },
  consentSync: ({ userId, consent }) => {
    connectors.consent = connectors.consent || {};
    connectors.consent[userId] = { consent, updatedAt: Date.now() };
    save(connectors);
    return connectors.consent[userId];
  },
  hashPII,
};
