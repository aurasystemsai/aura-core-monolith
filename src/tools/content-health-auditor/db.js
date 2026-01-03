// Simple in-memory DB for content health audits
let audits = [];

module.exports = {
  list: () => audits,
  get: (id) => audits.find(a => a.id === id),
  create: (data) => {
    const audit = { ...data, id: Date.now().toString() };
    audits.push(audit);
    return audit;
  },
  update: (id, data) => {
    const idx = audits.findIndex(a => a.id === id);
    if (idx === -1) return null;
    audits[idx] = { ...audits[idx], ...data };
    return audits[idx];
  },
  delete: (id) => {
    const idx = audits.findIndex(a => a.id === id);
    if (idx === -1) return false;
    audits.splice(idx, 1);
    return true;
  },
  import: (arr) => { audits = audits.concat(arr); },
  export: () => audits,
  clear: () => { audits = []; }
};
