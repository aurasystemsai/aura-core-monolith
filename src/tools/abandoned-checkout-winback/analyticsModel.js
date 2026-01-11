// In-memory analytics model for winback events
const events = [];

function recordEvent(data) {
  const event = { ...data, timestamp: Date.now() };
  events.push(event);
  return event;
}
function listEvents(filter = {}) {
  return events.filter(e => {
    for (const key of Object.keys(filter)) {
      if (filter[key] && e[key] !== filter[key]) return false;
    }
    return true;
  });
}

module.exports = { recordEvent, listEvents };
