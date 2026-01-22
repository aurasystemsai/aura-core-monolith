// Persistent JSON-backed store for Klaviyo flows
const fs = require('fs');
const path = require('path');

const DATA_PATH = process.env.KLAVIYO_FLOWS_PATH || path.join(__dirname, '../../data/klaviyo-flows.json');

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

function save(flows) {
  ensureDirSync(DATA_PATH);
  fs.writeFileSync(DATA_PATH, JSON.stringify(flows, null, 2), 'utf8');
}

let flows = load();
let idCounter = flows.reduce((max, f) => Math.max(max, Number(f.id) || 0), 0) + 1;

module.exports = {
  list: () => flows,
  get: (id) => flows.find(f => f.id == id),
  create: (data) => {
    const flow = { ...data, id: idCounter++ };
    flows.push(flow);
    save(flows);
    return flow;
  },
  update: (id, data) => {
    const idx = flows.findIndex(f => f.id == id);
    if (idx === -1) return null;
    flows[idx] = { ...flows[idx], ...data };
    save(flows);
    return flows[idx];
  },
  delete: (id) => {
    const idx = flows.findIndex(f => f.id == id);
    if (idx === -1) return false;
    flows.splice(idx, 1);
    save(flows);
    return true;
  },
  import: (arr = []) => {
    flows = arr.map((f) => ({ ...f, id: idCounter++ }));
    save(flows);
    return flows;
  },
  export: () => flows,
  clear: () => { flows = []; save(flows); }
};
