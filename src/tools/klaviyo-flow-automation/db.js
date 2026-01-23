// Persistent JSON-backed store for Klaviyo flows (feature-rich)
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

function applyDefaults(data = {}, existing = {}) {
  const now = Date.now();
  const base = {
    name: data.name || existing.name || `Flow ${idCounter}`,
    status: data.status || existing.status || 'draft',
    nodes: Array.isArray(data.nodes) ? data.nodes : existing.nodes || [],
    edges: Array.isArray(data.edges) ? data.edges : existing.edges || [],
    triggers: Array.isArray(data.triggers) ? data.triggers : existing.triggers || [],
    conditions: Array.isArray(data.conditions) ? data.conditions : existing.conditions || [],
    actions: Array.isArray(data.actions) ? data.actions : existing.actions || [],
    schedule: data.schedule || existing.schedule || { type: 'immediate', timezone: 'UTC', blackout: [] },
    channels: data.channels || existing.channels || ['email', 'sms'],
    variants: data.variants || existing.variants || [{ id: 'control', weight: 100 }],
    preferences: data.preferences || existing.preferences || { zoom: 1, pan: { x: 0, y: 0 }, minimap: true, theme: 'light' },
    collaboration: data.collaboration || existing.collaboration || { comments: [], approvals: [] },
    versions: existing.versions || [],
    dependencies: data.dependencies || existing.dependencies || [],
    consentMode: data.consentMode || existing.consentMode || 'standard',
    health: data.health || existing.health || { status: 'healthy', errors: [], warnings: [] },
    analytics: data.analytics || existing.analytics || { conversions: 0, revenue: 0, sends: 0 },
    brandId: data.brandId || existing.brandId || 'default',
    throttling: data.throttling || existing.throttling || { maxConcurrent: 10, ratePerSecond: 5 },
    createdAt: existing.createdAt || now,
    updatedAt: now,
  };
  return { ...existing, ...base, ...data };
}

function snapshot(flow) {
  const versions = flow.versions || [];
  const versionId = versions.length + 1;
  const entry = { version: versionId, ts: Date.now(), flow: { ...flow } };
  return [...versions, entry];
}

module.exports = {
  list: () => flows,
  get: (id) => flows.find(f => f.id == id),
  create: (data) => {
    const flow = applyDefaults({ ...data, id: idCounter++ });
    flows.push(flow);
    save(flows);
    return flow;
  },
  snapshot: (id) => {
    const flow = flows.find(f => f.id == id);
    if (!flow) return null;
    flow.versions = snapshot(flow);
    flow.updatedAt = Date.now();
    save(flows);
    return flow;
  },
  update: (id, data) => {
    const idx = flows.findIndex(f => f.id == id);
    if (idx === -1) return null;
    const previous = flows[idx];
    const nextVersions = snapshot(previous);
    const updated = applyDefaults({ ...data, versions: nextVersions }, previous);
    flows[idx] = updated;
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
    flows = arr.map((f) => applyDefaults({ ...f, id: idCounter++ }));
    save(flows);
    return flows;
  },
  export: () => flows,
  versions: (id) => {
    const flow = flows.find(f => f.id == id);
    return flow?.versions || [];
  },
  rollback: (id, versionNumber) => {
    const idx = flows.findIndex(f => f.id == id);
    if (idx === -1) return null;
    const flow = flows[idx];
    const target = (flow.versions || []).find(v => v.version == versionNumber);
    if (!target) return null;
    const restored = applyDefaults({ ...target.flow, updatedAt: Date.now(), versions: flow.versions }, target.flow);
    flows[idx] = restored;
    save(flows);
    return restored;
  },
  clear: () => { flows = []; save(flows); },
  applyDefaults,
};
