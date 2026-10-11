'use strict';
// Simple in-memory store for personalization recommendations
const store = new Map();
let seq = 1;
module.exports = {
  list() { return [...store.values()]; },
  get(id) { return store.get(id) || null; },
  create(data) { const id = 'rec_' + (seq++); const rec = { id, ...data, createdAt: new Date().toISOString() }; store.set(id, rec); return rec; },
  update(id, data) { const rec = store.get(id); if (!rec) return null; const updated = { ...rec, ...data, updatedAt: new Date().toISOString() }; store.set(id, updated); return updated; },
  delete(id) { return store.delete(id); },
};
