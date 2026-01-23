const fs = require('fs');
const path = require('path');

const DATA_PATH = process.env.KLAVIYO_TRACE_PATH || path.join(__dirname, '../../data/klaviyo-traces.json');

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

let traces = load();
let idCounter = traces.reduce((m, t) => Math.max(m, Number(t.id) || 0), 0) + 1;

function withinRange(ts, from, to) {
  if (!ts) return false;
  if (from && ts < from) return false;
  if (to && ts > to) return false;
  return true;
}

module.exports = {
  record: ({ flowId, runId, steps = [], status = 'ok', meta = {} }) => {
    const entry = { id: idCounter++, flowId, runId: runId || `run-${Date.now()}`, steps, status, meta, ts: Date.now() };
    traces.push(entry);
    save(traces);
    return entry;
  },
  list: ({ flowId, runId, from, to } = {}) => traces.filter(t => {
    if (flowId && String(t.flowId) !== String(flowId)) return false;
    if (runId && t.runId !== runId) return false;
    if (from || to) return withinRange(t.ts, from, to);
    return true;
  }).sort((a, b) => b.ts - a.ts),
  clear: () => { traces = []; save(traces); },
};
