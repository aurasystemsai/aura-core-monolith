// Simple in-memory DB for Rank Visibility Tracker tool
// Replace with persistent storage as needed

const data = {
  records: [],
};

module.exports = {
  getAll: () => data.records,
  getById: (id) => data.records.find((r) => r.id === id),
  create: (record) => {
    record.id = String(Date.now()) + Math.random().toString(36).slice(2);
    data.records.push(record);
    return record;
  },
  update: (id, updates) => {
    const idx = data.records.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    data.records[idx] = { ...data.records[idx], ...updates };
    return data.records[idx];
  },
  delete: (id) => {
    const idx = data.records.findIndex((r) => r.id === id);
    if (idx === -1) return false;
    data.records.splice(idx, 1);
    return true;
  },
};
