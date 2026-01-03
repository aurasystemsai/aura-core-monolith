// Analytics model for Review UGC Engine
let events = [];
module.exports = {
  recordEvent: e => { events.push({ ...e, ts: Date.now() }); return e; },
  listEvents: () => events,
};