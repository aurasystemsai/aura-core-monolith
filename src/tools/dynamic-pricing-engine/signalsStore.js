// In-memory signals store (stub)
let signals = [];

const ingest = (items = []) => {
  const now = Date.now();
  const normalized = items.map((item, idx) => ({
    id: `${now}-${idx}`,
    ...item,
    receivedAt: now
  }));
  signals.push(...normalized);
  return normalized;
};

const summary = () => {
  const counts = signals.reduce((acc, s) => {
    const type = s.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const lastReceivedAt = signals.length ? Math.max(...signals.map(s => s.receivedAt || 0)) : null;

  return {
    total: signals.length,
    counts,
    lastReceivedAt
  };
};

const list = (filter = {}) => {
  return signals.filter((s) => {
    if (filter.type && s.type !== filter.type) return false;
    return true;
  });
};

const clear = () => { signals = []; };

module.exports = {
  ingest,
  summary,
  list,
  clear
};
