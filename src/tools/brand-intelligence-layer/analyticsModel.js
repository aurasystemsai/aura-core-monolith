// Simple analytics model for brand intelligence
let events = [];

module.exports = {
  recordEvent: (event) => {
    const evt = { ...event, timestamp: Date.now() };
    events.push(evt);
    return evt;
  },
  listEvents: (query = {}) => {
    // Optionally filter by type, brand, etc.
    return events.filter(e => {
      if (query.type && e.type !== query.type) return false;
      if (query.brandId && e.brandId !== query.brandId) return false;
      return true;
    });
  },
  clear: () => { events = []; }
};
