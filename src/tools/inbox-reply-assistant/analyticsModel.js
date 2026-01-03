// Analytics model for Inbox Reply Assistant
let events = [];
module.exports = {
  recordEvent: e => { events.push({ ...e, ts: Date.now() }); return e; },
  listEvents: () => events,
};