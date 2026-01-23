const fs = require('fs');
const path = require('path');

const DATA_PATH = process.env.KLAVIYO_METRICS_PATH || path.join(__dirname, '../../data/klaviyo-metrics.json');

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

let metrics = load();
let idCounter = metrics.reduce((m, c) => Math.max(m, Number(c.id) || 0), 0) + 1;

module.exports = {
  list: (flowId) => flowId ? metrics.filter(m => String(m.flowId) === String(flowId)) : metrics,
  create: ({ flowId, name, target }) => {
    const entry = { id: idCounter++, flowId, name, target, createdAt: Date.now() };
    metrics.push(entry);
    save(metrics);
    return entry;
  },
  record: ({ flowId, name, value, ts = Date.now() }) => {
    const entry = { id: idCounter++, flowId, name, value, ts, type: 'metric' };
    metrics.push(entry);
    save(metrics);
    return entry;
  },
  summary: (flowId) => {
    const items = flowId ? metrics.filter(m => String(m.flowId) === String(flowId)) : metrics;
    return items.reduce((acc, m) => {
      if (!acc[m.name]) acc[m.name] = { name: m.name, points: [] };
      if (m.value !== undefined) acc[m.name].points.push({ value: m.value, ts: m.ts });
      return acc;
    }, {});
  },
  rollup: (flowId) => {
    const items = flowId ? metrics.filter(m => String(m.flowId) === String(flowId)) : metrics;
    const byName = items.reduce((acc, m) => {
      if (!acc[m.name]) acc[m.name] = [];
      if (m.value !== undefined) acc[m.name].push(Number(m.value));
      return acc;
    }, {});
    return Object.entries(byName).map(([name, values]) => {
      const count = values.length || 1;
      const sum = values.reduce((s, v) => s + v, 0);
      const avg = sum / count;
      const min = Math.min(...values);
      const max = Math.max(...values);
      return { name, count, sum, avg, min, max };
    });
  },
  clear: () => { metrics = []; save(metrics); },
};
