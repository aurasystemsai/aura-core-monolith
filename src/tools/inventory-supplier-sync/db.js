const storage = require('../../core/storageJson');
const KEY = 'inventory-supplier-sync';

function load() { return storage.get(KEY, { syncs: [], analytics: [] }); }
function save(d) { storage.set(KEY, d); }

module.exports = {
  async listSyncs() { return load().syncs; },
  async addSync(data) {
    const d = load(); const item = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
    d.syncs.push(item); if (d.syncs.length > 500) d.syncs = d.syncs.slice(-500); save(d); return item;
  },
  async recordEvent(evt) {
    const d = load(); d.analytics.push({ ...evt, ts: new Date().toISOString() });
    if (d.analytics.length > 500) d.analytics = d.analytics.slice(-500); save(d);
  },
  async listEvents() { return load().analytics; },
};