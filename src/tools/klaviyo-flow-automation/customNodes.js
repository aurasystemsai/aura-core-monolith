const fs = require('fs');
const path = require('path');

const DATA_PATH = process.env.KLAVIYO_CUSTOM_NODES_PATH || path.join(__dirname, '../../data/klaviyo-custom-nodes.json');

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

let nodes = load();
let idCounter = nodes.reduce((m, e) => Math.max(m, Number(e.id) || 0), 0) + 1;

module.exports = {
  list: () => nodes,
  get: (id) => nodes.find(n => n.id == id),
  create: (data = {}) => {
    const node = { id: idCounter++, ts: Date.now(), ...data };
    nodes.push(node);
    save(nodes);
    return node;
  },
  update: (id, data = {}) => {
    const idx = nodes.findIndex(n => n.id == id);
    if (idx === -1) return null;
    nodes[idx] = { ...nodes[idx], ...data, updatedAt: Date.now() };
    save(nodes);
    return nodes[idx];
  },
  delete: (id) => {
    const idx = nodes.findIndex(n => n.id == id);
    if (idx === -1) return false;
    nodes.splice(idx, 1);
    save(nodes);
    return true;
  },
  clear: () => { nodes = []; save(nodes); },
};
