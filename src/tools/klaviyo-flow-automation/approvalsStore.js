const fs = require('fs');
const path = require('path');

const DATA_PATH = process.env.KLAVIYO_APPROVALS_PATH || path.join(__dirname, '../../data/klaviyo-approvals.json');

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

let approvals = load();

function resetIdCounter() {
  idCounter = approvals.reduce((m, a) => Math.max(m, Number(a.id) || 0), 0) + 1;
}

let idCounter;
resetIdCounter();

const STATUSES = ['pending', 'approved', 'rejected'];

module.exports = {
  create: ({ flowId, requestedBy, reason }) => {
    const entry = { id: idCounter++, flowId, requestedBy, reason, status: 'pending', createdAt: Date.now(), updatedAt: Date.now() };
    approvals.push(entry);
    save(approvals);
    return entry;
  },
  updateStatus: (id, status, actor) => {
    if (!STATUSES.includes(status)) return null;
    const idx = approvals.findIndex(a => String(a.id) === String(id));
    if (idx === -1) return null;
    approvals[idx] = { ...approvals[idx], status, actedBy: actor, updatedAt: Date.now() };
    save(approvals);
    return approvals[idx];
  },
  list: (flowId) => {
    const filtered = flowId ? approvals.filter(a => String(a.flowId) === String(flowId)) : approvals;
    return filtered.slice().sort((a, b) => b.updatedAt - a.updatedAt);
  },
  latest: (flowId) => {
    return approvals
      .filter(a => String(a.flowId) === String(flowId))
      .sort((a, b) => b.updatedAt - a.updatedAt)[0] || null;
  },
  latestApproved: (flowId) => {
    return approvals
      .filter(a => String(a.flowId) === String(flowId) && a.status === 'approved')
      .sort((a, b) => b.updatedAt - a.updatedAt)[0] || null;
  },
  clear: () => {
    approvals = [];
    save(approvals);
    resetIdCounter();
  },
};
