// Per-shop request limiter (fixed window, in memory). One noisy or abusive shop gets 429s without slowing
// everyone else. The key is the shop domain header when present, otherwise the client IP. In memory means each
// server instance counts on its own; that is enough to stop runaway loops and abuse until a shared store is used.
function rateLimit({ windowMs = 60000, max = 600, keyFn, skip } = {}) {
  const hits = new Map();
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
  }, windowMs);
  if (sweep.unref) sweep.unref();

  return function limiter(req, res, next) {
    if (skip && skip(req)) return next();
    const key = String((keyFn ? keyFn(req) : null) || req.headers['x-shopify-shop-domain'] || req.ip || 'anon').toLowerCase().slice(0, 200);
    const now = Date.now();
    let e = hits.get(key);
    if (!e || e.reset <= now) { e = { n: 0, reset: now + windowMs }; hits.set(key, e); }
    e.n += 1;
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - e.n)));
    if (e.n > max) {
      const retry = Math.max(1, Math.ceil((e.reset - now) / 1000));
      res.setHeader('Retry-After', String(retry));
      return res.status(429).json({ ok: false, error: `Too many requests. Try again in ${retry} seconds.` });
    }
    return next();
  };
}

module.exports = { rateLimit };
