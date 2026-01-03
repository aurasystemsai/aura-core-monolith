// Simple in-memory DB for Inbox Assistant tickets
let tickets = [];
let idCounter = 1;

module.exports = {
  list: () => tickets,
  get: (id) => tickets.find(t => t.id == id),
  create: (data) => {
    const ticket = { ...data, id: idCounter++ };
    tickets.push(ticket);
    return ticket;
  },
  update: (id, data) => {
    const idx = tickets.findIndex(t => t.id == id);
    if (idx === -1) return null;
    tickets[idx] = { ...tickets[idx], ...data };
    return tickets[idx];
  },
  delete: (id) => {
    const idx = tickets.findIndex(t => t.id == id);
    if (idx === -1) return false;
    tickets.splice(idx, 1);
    return true;
  },
  import: (arr) => { tickets = arr.map((t, i) => ({ ...t, id: idCounter++ })); },
  export: () => tickets,
  clear: () => { tickets = []; }
};
