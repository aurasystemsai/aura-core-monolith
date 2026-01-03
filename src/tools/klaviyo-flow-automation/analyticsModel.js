// Simple analytics model for Klaviyo flows
let events = [];

module.exports = {
  recordEvent: (event) => {
    const evt = { ...event, timestamp: Date.now() };
    events.push(evt);
    return evt;
  },
  listEvents: (query = {}) => {
    // Optionally filter by type, flowId, etc.
    return events.filter(e => {
      if (query.type && e.type !== query.type) return false;
      if (query.flowId && e.flowId != query.flowId) return false;
      return true;
    });
  },
  clear: () => { events = []; }
};
