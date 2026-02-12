// Simple in-memory DB for Dynamic Pricing Engine rules
let rules = [];
let idCounter = 1;

module.exports = {
  list: () => rules,
  get: (id) => rules.find(r => r.id == id),
  create: (data) => {
    const now = Date.now();
    const rule = { status: 'draft', createdAt: now, updatedAt: now, ...data, id: idCounter++ };
    rules.push(rule);
    return rule;
  },
  update: (id, data) => {
    const idx = rules.findIndex(r => r.id == id);
    if (idx === -1) return null;
    rules[idx] = { ...rules[idx], ...data, updatedAt: Date.now() };
    return rules[idx];
  },
  delete: (id) => {
    const idx = rules.findIndex(r => r.id == id);
    if (idx === -1) return false;
    rules.splice(idx, 1);
    return true;
  },
  publish: (id) => {
    const rule = rules.find(r => r.id == id);
    if (!rule) return null;
    rule.status = 'published';
    rule.publishedAt = Date.now();
    return rule;
  },
  rollback: (id) => {
    const rule = rules.find(r => r.id == id);
    if (!rule) return null;
    rule.status = 'draft';
    rule.rollbackAt = Date.now();
    return rule;
  },
  import: (arr) => { rules = arr.map((r, i) => ({ ...r, id: idCounter++ })); },
  export: () => rules,
  clear: () => { rules = []; }
};
