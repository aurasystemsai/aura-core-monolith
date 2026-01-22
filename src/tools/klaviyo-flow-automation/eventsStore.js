const fs = require('fs');
const path = require('path');

const DATA_PATH = process.env.KLAVIYO_EVENTS_PATH || path.join(__dirname, '../../data/klaviyo-events.json');

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

let events = load();
let idCounter = events.reduce((m, e) => Math.max(m, Number(e.id) || 0), 0) + 1;

module.exports = {
  record: (data = {}) => {
    const event = { id: idCounter++, ts: Date.now(), ...data };
    events.push(event);
    save(events);
    return event;
  },
  list: (query = {}) => {
    const { type, flowId } = query;
    return events.filter((e) => {
      if (type && e.type !== type) return false;
      if (flowId && String(e.flowId) !== String(flowId)) return false;
      return true;
    });
  },
  summary: () => {
    const total = events.length;
    const byType = events.reduce((acc, e) => {
      acc[e.type || 'unknown'] = (acc[e.type || 'unknown'] || 0) + 1;
      return acc;
    }, {});
    const byChannel = events.reduce((acc, e) => {
      const ch = e.channel || 'unknown';
      acc[ch] = (acc[ch] || 0) + 1;
      return acc;
    }, {});
    return { total, byType, byChannel };
  },
  clear: () => { events = []; save(events); },
};
