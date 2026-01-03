// Analytics model for Technical SEO Auditor
let events = [];
module.exports = {
  recordEvent: e => { events.push({ ...e, ts: Date.now() }); return e; },
  listEvents: () => events,
};