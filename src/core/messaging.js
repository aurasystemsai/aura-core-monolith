'use strict';
// Shared guards for outbound messaging: daily per-shop send limits and a send log.
const store = require('./shopStore');

const LIMITS = { test: 20, campaign: 500 };
const today = () => new Date().toISOString().slice(0, 10);

/** Reserve `n` sends of `kind` for today. Returns false (and reserves nothing) if the daily limit would be exceeded. */
function reserve(shop, channel, kind, n) {
  const key = `${channel}-quota`;
  const q = store.read(key, shop, {});
  const day = today();
  const used = (q.day === day ? q[kind] : 0) || 0;
  if (used + n > LIMITS[kind]) return false;
  store.write(key, shop, { ...(q.day === day ? q : {}), day, [kind]: used + n });
  return true;
}

function remaining(shop, channel, kind) {
  const q = store.read(`${channel}-quota`, shop, {});
  return LIMITS[kind] - ((q.day === today() ? q[kind] : 0) || 0);
}

module.exports = { reserve, remaining, LIMITS };
