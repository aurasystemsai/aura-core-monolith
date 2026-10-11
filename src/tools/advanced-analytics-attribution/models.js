// Attribution model implementations for production

function firstTouch(events) {
  if (!Array.isArray(events) || events.length === 0) return null;
  return events[0];
}

function lastTouch(events) {
  if (!Array.isArray(events) || events.length === 0) return null;
  return events[events.length - 1];
}

function linearAttribution(events) {
  if (!Array.isArray(events) || events.length === 0) return [];
  const credit = 1 / events.length;
  return events.map(e => ({ ...e, credit }));
}

function timeDecayAttribution(events, halfLife = 3) {
  if (!Array.isArray(events) || events.length === 0) return [];
  const now = Date.now();
  const weights = events.map(e => Math.pow(0.5, (now - new Date(e.timestamp)) / (halfLife * 24 * 60 * 60 * 1000)));
  const total = weights.reduce((a, b) => a + b, 0);
  return events.map((e, i) => ({ ...e, credit: weights[i] / total }));
}

function positionBasedAttribution(events) {
  if (!Array.isArray(events) || events.length === 0) return [];
  const n = events.length;
  if (n === 1) return [{ ...events[0], credit: 1 }];
  const first = 0.4, last = 0.4, middle = 0.2 / (n - 2);
  return events.map((e, i) => ({ ...e, credit: i === 0 ? first : i === n - 1 ? last : middle }));
}

module.exports = {
  firstTouch,
  lastTouch,
  linearAttribution,
  timeDecayAttribution,
  positionBasedAttribution,
};
