'use strict';
const store = new Map();
let seq = 1;
module.exports = {
  list() { return [...store.values()]; },
  get(id) { return store.get(id) || null; },
  create(data) { const id = 'item_' + (seq++); const rec = { id, ...data, createdAt: new Date().toISOString() }; store.set(id, rec); return rec; },
  update(id, data) { const rec = store.get(id); if (!rec) return null; const u = { ...rec, ...data, updatedAt: new Date().toISOString() }; store.set(id, u); return u; },
  delete(id) { return store.delete(id); },
};
