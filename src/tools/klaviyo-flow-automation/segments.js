const fs = require('fs');
const path = require('path');

const DATA_PATH = process.env.KLAVIYO_SEGMENTS_PATH || path.join(__dirname, '../../data/klaviyo-segments.json');

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

let segments = load();
let idCounter = segments.reduce((m, e) => Math.max(m, Number(e.id) || 0), 0) + 1;

module.exports = {
  list: () => segments,
  get: (id) => segments.find((s) => s.id == id),
  create: (data = {}) => {
    const seg = {
      id: idCounter++,
      name: data.name || `Segment ${idCounter}`,
      rules: data.rules || [],
      traits: data.traits || {},
      createdAt: Date.now(),
    };
    segments.push(seg);
    save(segments);
    return seg;
  },
  update: (id, data = {}) => {
    const idx = segments.findIndex((s) => s.id == id);
    if (idx === -1) return null;
    segments[idx] = { ...segments[idx], ...data };
    save(segments);
    return segments[idx];
  },
  delete: (id) => {
    const idx = segments.findIndex((s) => s.id == id);
    if (idx === -1) return false;
    segments.splice(idx, 1);
    save(segments);
    return true;
  },
};
