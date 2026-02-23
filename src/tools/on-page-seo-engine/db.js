// Persistent file-based storage for On-Page SEO Engine
const storage = require('../../core/storageJson');

const STORAGE_KEY = 'on-page-seo-engine';

async function loadAll() {
  return storage.get(STORAGE_KEY, { items: [], analytics: [] });
}

async function saveAll(data) {
  return storage.set(STORAGE_KEY, data);
}

let _idCounter = null;

async function nextId() {
  const data = await loadAll();
  if (_idCounter === null) {
    _idCounter = data.items.reduce((max, i) => Math.max(max, Number(i.id) || 0), 0);
  }
  _idCounter++;
  return _idCounter;
}

module.exports = {
  list: async () => {
    const data = await loadAll();
    return data.items || [];
  },

  get: async (id) => {
    const data = await loadAll();
    return (data.items || []).find(i => String(i.id) === String(id)) || null;
  },

  create: async (item) => {
    const data = await loadAll();
    const id = await nextId();
    const record = { ...item, id, createdAt: new Date().toISOString() };
    data.items = data.items || [];
    data.items.push(record);
    if (data.items.length > 200) data.items = data.items.slice(-200);
    await saveAll(data);
    return record;
  },

  update: async (id, updates) => {
    const data = await loadAll();
    const idx = (data.items || []).findIndex(i => String(i.id) === String(id));
    if (idx === -1) return null;
    data.items[idx] = { ...data.items[idx], ...updates, updatedAt: new Date().toISOString() };
    await saveAll(data);
    return data.items[idx];
  },

  delete: async (id) => {
    const data = await loadAll();
    const idx = (data.items || []).findIndex(i => String(i.id) === String(id));
    if (idx === -1) return false;
    data.items.splice(idx, 1);
    await saveAll(data);
    return true;
  },

  recordEvent: async (event) => {
    const data = await loadAll();
    data.analytics = data.analytics || [];
    data.analytics.push({ ...event, ts: new Date().toISOString() });
    if (data.analytics.length > 500) data.analytics = data.analytics.slice(-500);
    await saveAll(data);
    return event;
  },

  listEvents: async () => {
    const data = await loadAll();
    return data.analytics || [];
  },

  import: async (items) => {
    const data = await loadAll();
    data.items = items.map((item, i) => ({ ...item, id: i + 1, importedAt: new Date().toISOString() }));
    _idCounter = items.length;
    await saveAll(data);
    return { count: items.length };
  },
};