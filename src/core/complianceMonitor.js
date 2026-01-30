// Explainable AI and Compliance Monitoring for Aura Systems
// Tracks model activity, flags risky content, and produces lightweight audit reports

const EventEmitter = require('events');
const notifications = require('./notifications');

class ComplianceMonitor extends EventEmitter {
  constructor() {
    super();
    this.models = new Map(); // name -> { policies }
    this.events = []; // audit trail in-memory (can be persisted later)
    this.maxEvents = 1000;
  }

  registerModel(name, policies = {}) {
    this.models.set(name, { name, policies });
    return this.models.get(name);
  }

  logInference({ model, input, output, meta = {} }) {
    const ts = Date.now();
    const event = { model, input, output, meta, ts };
    const checks = this._policyChecks(event);
    const record = { ...event, checks };
    this.events.push(record);
    if (this.events.length > this.maxEvents) this.events.shift();

    if (!checks.ok) {
      notifications.addNotification({ type: 'compliance', message: `Compliance flag on ${model}: ${checks.reason}`, time: ts });
      this.emit('flag', record);
    }
    this.emit('inference', record);
    return record;
  }

  auditReport(limit = 50) {
    const recent = this.events.slice(-limit).reverse();
    const flagged = recent.filter(e => e.checks && !e.checks.ok);
    return {
      total: this.events.length,
      recent: recent.length,
      flagged: flagged.length,
      events: recent,
    };
  }

  _policyChecks(event) {
    // Simple heuristics: detect emails/phones and banned terms
    const text = `${event.output || ''} ${JSON.stringify(event.meta || {})}`.toLowerCase();
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phonePattern = /(\+?\d[\d\s\-]{7,}\d)/;
    const banned = ['ssn', 'credit card', 'social security'];

    if (emailPattern.test(text)) return { ok: false, reason: 'PII (email) detected' };
    if (phonePattern.test(text)) return { ok: false, reason: 'PII (phone) detected' };
    if (banned.some(term => text.includes(term))) return { ok: false, reason: 'Sensitive term detected' };

    return { ok: true };
  }

  reset() {
    this.events = [];
    this.models.clear();
  }
}

module.exports = new ComplianceMonitor();
