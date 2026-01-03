// Simple analytics model for Inbox Assistant tickets
let events = [];

module.exports = {
  recordEvent: (event) => {
    const evt = { ...event, timestamp: Date.now() };
    events.push(evt);
    return evt;
  },
  listEvents: (query = {}) => {
    // Optionally filter by type, ticketId, etc.
    return events.filter(e => {
      if (query.type && e.type !== query.type) return false;
      if (query.ticketId && e.ticketId != query.ticketId) return false;
      return true;
    });
  },
  clear: () => { events = []; }
};
