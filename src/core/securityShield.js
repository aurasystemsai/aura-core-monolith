// Security upgrades: zero trust posture, auditability, and edge-friendly policy checks

const EventEmitter = require('events');

class SecurityShield extends EventEmitter {
  constructor() {
    super();
    this.policies = new Map(); // id -> { resource, action, rule }
    this.audit = [];
    this.maxAudit = 1000;
  }

  definePolicy(id, { resource, action, rule }) {
    this.policies.set(id, { id, resource, action, rule });
    return this.policies.get(id);
  }

  checkAccess({ user, resource, action, context = {} }) {
    const matches = Array.from(this.policies.values()).filter(p => p.resource === resource && p.action === action);
    let allowed = false;
    if (!matches.length) allowed = false;
    else {
      allowed = matches.every(p => (typeof p.rule === 'function' ? p.rule({ user, context }) : !!p.rule));
    }
    this._audit({ userId: user?.id, resource, action, allowed, context });
    return { ok: allowed, decision: allowed ? 'allow' : 'deny' };
  }

  rateLimit(key, limit = 60, windowMs = 60_000) {
    if (!this._buckets) this._buckets = new Map();
    const now = Date.now();
    if (!this._buckets.has(key)) this._buckets.set(key, []);
    const bucket = this._buckets.get(key).filter(ts => ts > now - windowMs);
    bucket.push(now);
    this._buckets.set(key, bucket);
    const allowed = bucket.length <= limit;
    return { ok: allowed, remaining: Math.max(0, limit - bucket.length) };
  }

  _audit(entry) {
    const record = { ...entry, ts: Date.now() };
    this.audit.push(record);
    if (this.audit.length > this.maxAudit) this.audit.shift();
    this.emit('audit', record);
  }

  listAudit(limit = 100) {
    return this.audit.slice(-limit).reverse();
  }

  reset() {
    this.policies.clear();
    this.audit = [];
    this._buckets = new Map();
  }
}

module.exports = new SecurityShield();
