// Simple in-memory DB for blog SEO analyses
let analyses = [];

module.exports = {
  list: () => analyses,
  get: (id) => analyses.find(a => a.id === id),
  create: (data) => {
    const analysis = { ...data, id: Date.now().toString() };
    analyses.push(analysis);
    return analysis;
  },
  update: (id, data) => {
    const idx = analyses.findIndex(a => a.id === id);
    if (idx === -1) return null;
    analyses[idx] = { ...analyses[idx], ...data };
    return analyses[idx];
  },
  delete: (id) => {
    const idx = analyses.findIndex(a => a.id === id);
    if (idx === -1) return false;
    analyses.splice(idx, 1);
    return true;
  },
  import: (arr) => { analyses = analyses.concat(arr); },
  export: () => analyses,
  clear: () => { analyses = []; }
};
