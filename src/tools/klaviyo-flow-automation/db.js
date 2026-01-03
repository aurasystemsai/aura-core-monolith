// Simple in-memory DB for Klaviyo flows
let flows = [];
let idCounter = 1;

module.exports = {
  list: () => flows,
  get: (id) => flows.find(f => f.id == id),
  create: (data) => {
    const flow = { ...data, id: idCounter++ };
    flows.push(flow);
    return flow;
  },
  update: (id, data) => {
    const idx = flows.findIndex(f => f.id == id);
    if (idx === -1) return null;
    flows[idx] = { ...flows[idx], ...data };
    return flows[idx];
  },
  delete: (id) => {
    const idx = flows.findIndex(f => f.id == id);
    if (idx === -1) return false;
    flows.splice(idx, 1);
    return true;
  },
  import: (arr) => { flows = arr.map((f, i) => ({ ...f, id: idCounter++ })); },
  export: () => flows,
  clear: () => { flows = []; }
};
