// In-memory store for winback analytics events
const analytics = [];

function recordEvent(data) {
  const event = { id: Date.now().toString(), timestamp: new Date().toISOString(), ...data };
  analytics.push(event);
  return event;
}

function listEvents({ campaignId, variantId, type } = {}) {
  let events = analytics;
  if (campaignId) events = events.filter(e => e.campaignId === campaignId);
  if (variantId) events = events.filter(e => e.variantId === variantId);
  if (type) events = events.filter(e => e.type === type);
  return events;
}

module.exports = {
  recordEvent,
  listEvents,
};
