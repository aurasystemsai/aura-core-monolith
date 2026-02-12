// Simple in-memory DB for Dynamic Pricing Engine rules
const versioning = require('./versioning');

let rules = [];
let idCounter = 1;

module.exports = {
  list: () => rules,
  get: (id) => rules.find(r => r.id == id),
  create: (data) => {
    const now = Date.now();
    const rule = { status: 'draft', createdAt: now, updatedAt: now, ...data, id: idCounter++ };
    rules.push(rule);
    
    // Save initial version
    versioning.saveVersion(rule.id, rule, 'create', data.createdBy || 'system');
    
    return rule;
  },
  update: (id, data) => {
    const idx = rules.findIndex(r => r.id == id);
    if (idx === -1) return null;
    rules[idx] = { ...rules[idx], ...data, updatedAt: Date.now() };
    
    // Save version after update
    versioning.saveVersion(id, rules[idx], 'update', data.updatedBy || 'system');
    
    return rules[idx];
  },
  delete: (id) => {
    const idx = rules.findIndex(r => r.id == id);
    if (idx === -1) return false;
    
    // Save version before deletion
    versioning.saveVersion(id, rules[idx], 'delete', 'system');
    
    rules.splice(idx, 1);
    return true;
  },
  publish: (id, publishedBy = 'system') => {
    const rule = rules.find(r => r.id == id);
    if (!rule) return null;
    rule.status = 'published';
    rule.publishedAt = Date.now();
    
    // Save version on publish
    versioning.saveVersion(id, rule, 'publish', publishedBy);
    
    return rule;
  },
  rollback: (id, rolledBackBy = 'system') => {
    const rule = rules.find(r => r.id == id);
    if (!rule) return null;
    rule.status = 'draft';
    rule.rollbackAt = Date.now();
    
    // Save version on rollback
    versioning.saveVersion(id, rule, 'rollback', rolledBackBy);
    
    return rule;
  },
  import: (arr) => { rules = arr.map((r, i) => ({ ...r, id: idCounter++ })); },
  export: () => rules,
  clear: () => { 
    rules = []; 
    versioning.clear();
  }
};
