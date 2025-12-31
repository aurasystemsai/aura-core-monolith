// Analytics model for Returns/RMA Automation
let events = [];
module.exports = {
  recordEvent(event) {
    const e = { ...event, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, created: new Date().toISOString() };
    events.push(e);
    return e;
  },
  listEvents({ rmaId, type } = {}) {
    return events.filter(e => (!rmaId || e.rmaId === rmaId) && (!type || e.type === type));
  },
};
