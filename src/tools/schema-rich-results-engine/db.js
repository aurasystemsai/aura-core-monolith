// Persistent file-based storage for schema-rich-results-engine
const storage = require('../../core/storageJson');
const KEY = 'schema-rich-results-engine';

function getData() {
  return storage.get(KEY, { history: [], analytics: [], feedback: [] });
}
function save(d) { storage.set(KEY, d); }

module.exports = {
  async listHistory() { return getData().history; },
  async addHistory(entry) {
    const d = getData();
    entry.id = entry.id || `schema-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    entry.createdAt = new Date().toISOString();
    d.history.unshift(entry);
    if (d.history.length > 200) d.history = d.history.slice(0, 200);
    save(d);
    return entry;
  },
  async listAnalytics() { return getData().analytics; },
  async recordEvent(event) {
    const d = getData();
    const ev = { ...event, id: `ev-${Date.now()}`, ts: new Date().toISOString() };
    d.analytics.push(ev);
    if (d.analytics.length > 500) d.analytics = d.analytics.slice(-500);
    save(d);
    return ev;
  },
  async saveFeedback(fb) {
    const d = getData();
    const entry = { ...fb, id: `fb-${Date.now()}`, ts: new Date().toISOString() };
    d.feedback.push(entry);
    if (d.feedback.length > 100) d.feedback = d.feedback.slice(-100);
    save(d);
    return entry;
  },
  async importData(items) {
    const d = getData();
    for (const item of items) {
      item.id = item.id || `schema-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      item.importedAt = new Date().toISOString();
      d.history.push(item);
    }
    if (d.history.length > 500) d.history = d.history.slice(0, 500);
    save(d);
    return d.history.length;
  },
};
