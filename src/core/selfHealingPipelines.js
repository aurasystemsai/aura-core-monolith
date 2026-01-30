// Self-healing data pipelines and governance for Aura Systems
// Tracks pipeline health, retries failures, and enforces lightweight data quality gates

const EventEmitter = require('events');
const notifications = require('./notifications');

class SelfHealingPipelines extends EventEmitter {
  constructor() {
    super();
    this.pipelines = new Map(); // id -> { meta, state }
    this.defaultBackoff = [1_000, 5_000, 15_000, 60_000];
  }

  registerPipeline(id, { description = '', check, repair, backoff } = {}) {
    this.pipelines.set(id, {
      id,
      description,
      check,
      repair,
      backoff: backoff || this.defaultBackoff,
      failures: 0,
      lastStatus: 'unknown',
      lastHeartbeat: null,
    });
    return this.pipelines.get(id);
  }

  async heartbeat(id) {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) return { ok: false, error: 'pipeline not found' };
    pipeline.lastHeartbeat = Date.now();
    if (typeof pipeline.check === 'function') {
      try {
        const ok = await pipeline.check();
        pipeline.lastStatus = ok ? 'healthy' : 'unhealthy';
        if (!ok) await this._handleFailure(pipeline);
      } catch (err) {
        pipeline.lastStatus = 'unhealthy';
        await this._handleFailure(pipeline, err);
      }
    }
    this.emit('heartbeat', { id, status: pipeline.lastStatus });
    return { ok: true, status: pipeline.lastStatus };
  }

  async _handleFailure(pipeline, err) {
    pipeline.failures += 1;
    const attempt = pipeline.failures;
    const delay = pipeline.backoff[Math.min(attempt - 1, pipeline.backoff.length - 1)];
    notifications.addNotification({ type: 'pipeline', message: `Pipeline ${pipeline.id} failed (attempt ${attempt}). Retrying in ${delay}ms. ${err ? err.message : ''}`, time: Date.now() });
    this.emit('pipeline:failure', { id: pipeline.id, attempt, err });
    if (typeof pipeline.repair === 'function') {
      setTimeout(async () => {
        try {
          await pipeline.repair();
          pipeline.lastStatus = 'recovering';
          this.emit('pipeline:repairing', { id: pipeline.id });
          await this.heartbeat(pipeline.id);
        } catch (repairErr) {
          this.emit('pipeline:repair_failed', { id: pipeline.id, repairErr });
        }
      }, delay);
    }
  }

  validateRecord(record, schema) {
    const missing = [];
    Object.keys(schema).forEach(key => {
      if (record[key] === undefined || record[key] === null) missing.push(key);
    });
    if (missing.length) {
      return { ok: false, error: `Missing required fields: ${missing.join(', ')}` };
    }
    return { ok: true };
  }

  quarantine(record, reason = 'failed validation') {
    this.emit('quarantine', { record, reason, time: Date.now() });
    notifications.addNotification({ type: 'pipeline', message: `Record quarantined: ${reason}`, time: Date.now() });
    return { ok: true };
  }

  status() {
    return Array.from(this.pipelines.values()).map(p => ({ id: p.id, status: p.lastStatus, failures: p.failures, lastHeartbeat: p.lastHeartbeat }));
  }

  reset(id) {
    if (id) this.pipelines.delete(id);
    else this.pipelines.clear();
  }
}

module.exports = new SelfHealingPipelines();
