// Simple in-memory DB for Social Scheduler Content Engine (replace with real DB in production)
let items = [];
let idCounter = 1;
module.exports = {
  list: () => items,
  get: id => items.find(i => i.id == id),
  create: data => { const item = { ...data, id: idCounter++ }; items.push(item); return item; },
  update: (id, data) => { const idx = items.findIndex(i => i.id == id); if (idx === -1) return null; items[idx] = { ...items[idx], ...data }; return items[idx]; },
  delete: id => { const idx = items.findIndex(i => i.id == id); if (idx === -1) return false; items.splice(idx, 1); return true; },
  import: arr => { items = arr.map((i, idx) => ({ ...i, id: idCounter++ })); },
};