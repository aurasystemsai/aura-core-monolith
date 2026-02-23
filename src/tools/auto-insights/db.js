const storage = require('../../core/storageJson');
const KEY = 'auto-insights';

function load() { return storage.get(KEY, { insights: [], analytics: [] }); }
function save(d) { storage.set(KEY, d); }

module.exports = {
  async listInsights() { return load().insights; },
  async addInsight(data) {
    const d = load(); const item = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
    d.insights.push(item); if (d.insights.length > 500) d.insights = d.insights.slice(-500); save(d); return item;
  },
  async recordEvent(evt) {
    const d = load(); d.analytics.push({ ...evt, ts: new Date().toISOString() });
    if (d.analytics.length > 500) d.analytics = d.analytics.slice(-500); save(d);
  },
  async listEvents() { return load().analytics; },
};