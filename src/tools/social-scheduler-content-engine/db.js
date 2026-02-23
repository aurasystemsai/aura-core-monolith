const storage = require('../../core/storageJson');
const KEY = 'social-scheduler-content-engine';

function load() { return storage.get(KEY, { history: [], analytics: [], feedback: [] }); }
function save(d) { storage.set(KEY, d); }

module.exports = {
  async listHistory() { return load().history; },
  async addHistory(data) {
    const d = load(); const item = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
    d.history.push(item); if (d.history.length > 500) d.history = d.history.slice(-500); save(d); return item;
  },
  async listAnalytics() { return load().analytics; },
  async recordEvent(evt) {
    const d = load(); d.analytics.push({ ...evt, ts: new Date().toISOString() });
    if (d.analytics.length > 500) d.analytics = d.analytics.slice(-500); save(d);
  },
  async saveFeedback(fb) {
    const d = load(); d.feedback.push({ ...fb, id: Date.now().toString(), createdAt: new Date().toISOString() });
    if (d.feedback.length > 200) d.feedback = d.feedback.slice(-200); save(d);
  },
  async importData(data) {
    const d = load(); if (Array.isArray(data)) d.history = d.history.concat(data); save(d);
  },
};