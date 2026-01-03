// Simple analytics model for Dynamic Pricing Engine rules
let events = [];

module.exports = {
  recordEvent: (event) => {
    const evt = { ...event, timestamp: Date.now() };
    events.push(evt);
    return evt;
  },
  listEvents: (query = {}) => {
    // Optionally filter by type, ruleId, etc.
    return events.filter(e => {
      if (query.type && e.type !== query.type) return false;
      if (query.ruleId && e.ruleId != query.ruleId) return false;
      return true;
    });
  },
  clear: () => { events = []; }
};
