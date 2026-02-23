const storage = require('../../core/storageJson');
const KEY = 'brand-intelligence-layer';

function load() { return storage.get(KEY, { items: [], feedback: [], analytics: [] }); }
function save(d) { storage.set(KEY, d); }

module.exports = {
  async listItems() { return load().items; },
  async createItem(data) {
    const d = load(); const item = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
    d.items.push(item); if (d.items.length > 500) d.items = d.items.slice(-500); save(d); return item;
  },
  async saveFeedback(fb) {
    const d = load(); d.feedback.push({ ...fb, id: Date.now().toString(), createdAt: new Date().toISOString() });
    if (d.feedback.length > 200) d.feedback = d.feedback.slice(-200); save(d);
  },
  async recordEvent(evt) {
    const d = load(); d.analytics.push({ ...evt, ts: new Date().toISOString() });
    if (d.analytics.length > 500) d.analytics = d.analytics.slice(-500); save(d);
  },
  async listEvents() { return load().analytics; },
};
