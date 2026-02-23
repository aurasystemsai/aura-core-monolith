// Persistent file-based storage for rank-visibility-tracker
const storage = require('../../core/storageJson');
const KEY = 'rank-visibility-tracker';

function getData() {
  return storage.get(KEY, { items: [], analytics: [], feedback: [] });
}
function save(d) {
  storage.set(KEY, d);
}

module.exports = {
  // ── Items (tracked keywords / reports) ────────────────────────
  async list() {
    return getData().items;
  },
  async get(id) {
    return getData().items.find(i => i.id === id) || null;
  },
  async create(item) {
    const d = getData();
    item.id = item.id || `rvt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    item.createdAt = item.createdAt || new Date().toISOString();
    d.items.unshift(item);
    if (d.items.length > 200) d.items = d.items.slice(0, 200);
    save(d);
    return item;
  },
  async update(id, updates) {
    const d = getData();
    const idx = d.items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    d.items[idx] = { ...d.items[idx], ...updates, updatedAt: new Date().toISOString() };
    save(d);
    return d.items[idx];
  },
  async delete(id) {
    const d = getData();
    const idx = d.items.findIndex(i => i.id === id);
    if (idx === -1) return false;
    d.items.splice(idx, 1);
    save(d);
    return true;
  },

  // ── Analytics ─────────────────────────────────────────────────
  async recordEvent(event) {
    const d = getData();
    const ev = { ...event, id: `ev-${Date.now()}`, ts: new Date().toISOString() };
    d.analytics.push(ev);
    if (d.analytics.length > 500) d.analytics = d.analytics.slice(-500);
    save(d);
    return ev;
  },
  async listEvents() {
    return getData().analytics;
  },

  // ── Feedback ──────────────────────────────────────────────────
  async saveFeedback(fb) {
    const d = getData();
    const entry = { ...fb, id: `fb-${Date.now()}`, ts: new Date().toISOString() };
    d.feedback.push(entry);
    if (d.feedback.length > 100) d.feedback = d.feedback.slice(-100);
    save(d);
    return entry;
  },
};

