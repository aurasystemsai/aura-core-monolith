// Analytics model for Inventory Supplier Sync
let events = [];
module.exports = {
  recordEvent: e => { events.push({ ...e, ts: Date.now() }); return e; },
  listEvents: () => events,
};