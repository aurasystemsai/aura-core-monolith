// Analytics model for Social Scheduler Content Engine
let events = [];
module.exports = {
  recordEvent: e => { events.push({ ...e, ts: Date.now() }); return e; },
  listEvents: () => events,
};