// RMA CRUD model for Returns/RMA Automation
let rmas = [];
module.exports = {
  createRma(data) {
    const rma = { ...data, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, created: new Date().toISOString(), status: 'pending' };
    rmas.push(rma);
    return rma;
  },
  listRmas() {
    return rmas;
  },
  getRma(id) {
    return rmas.find(r => r.id === id);
  },
  updateRma(id, data) {
    const rma = rmas.find(r => r.id === id);
    if (!rma) return null;
    Object.assign(rma, data);
    return rma;
  },
  deleteRma(id) {
    const idx = rmas.findIndex(r => r.id === id);
    if (idx === -1) return false;
    rmas.splice(idx, 1);
    return true;
  },
};
