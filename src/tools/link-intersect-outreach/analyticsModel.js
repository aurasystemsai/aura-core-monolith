const events = [];
module.exports = {
  recordEvent: (data) => { const e = { ...data, timestamp: Date.now() }; events.push(e); return e; },
  list: () => events,
};
