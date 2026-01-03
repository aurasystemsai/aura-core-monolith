// Simple analytics model for content health audits
let events = [];

module.exports = {
  recordEvent: (event) => {
    const evt = { ...event, timestamp: Date.now() };
    events.push(evt);
    return evt;
  },
  listEvents: (query = {}) => {
    // Optionally filter by type, auditId, etc.
    return events.filter(e => {
      if (query.type && e.type !== query.type) return false;
      if (query.auditId && e.auditId !== query.auditId) return false;
      return true;
    });
  },
  clear: () => { events = []; }
};
