// Auto-Generated A/B/n Testing & Rollback Engine
// Launches experiments, analyzes results, and can auto-rollback underperformance.
// Phase 1: Simple experiment manager, result analysis, and rollback trigger.

const { getMetrics, logMetric } = require('./metrics');
const { sendNotification } = require('./notifications');

class ABNTestingEngine {
  constructor() {
    this.experiments = [];
    this.results = [];
  }

  launchExperiment({ name, variants, metric, durationMs = 3600000 }) {
    const exp = {
      id: Date.now() + Math.random(),
      name,
      variants,
      metric,
      start: Date.now(),
      end: Date.now() + durationMs,
      status: 'running',
      data: {},
    };
    this.experiments.push(exp);
    sendNotification({
      type: 'experiment',
      message: `Launched experiment: ${name} on ${metric} (${variants.length} variants)`
    });
    return exp.id;
  }

  recordResult(expId, variant, value) {
    const exp = this.experiments.find(e => e.id === expId);
    if (!exp) return;
    if (!exp.data[variant]) exp.data[variant] = [];
    exp.data[variant].push(value);
  }

  analyzeExperiment(expId) {
    const exp = this.experiments.find(e => e.id === expId);
    if (!exp) return null;
    // Simple mean comparison
    const means = {};
    for (const v of exp.variants) {
      const arr = exp.data[v] || [];
      means[v] = arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    }
    // Find best and worst
    const sorted = Object.entries(means).sort((a, b) => b[1] - a[1]);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    exp.status = 'analyzed';
    this.results.push({ expId, means, best, worst, analyzedAt: Date.now() });
    // Auto-rollback if best is not control
    if (best[0] !== exp.variants[0]) {
      this.rollbackExperiment(expId, best[0]);
    }
    return { means, best, worst };
  }

  rollbackExperiment(expId, winningVariant) {
    const exp = this.experiments.find(e => e.id === expId);
    if (!exp) return;
    exp.status = 'rolled_back';
    sendNotification({
      type: 'rollback',
      message: `Experiment ${exp.name} auto-rolled back to variant: ${winningVariant}`
    });
    logMetric('experiment_rollback', { expId, winningVariant, ts: Date.now() });
  }
}

module.exports = new ABNTestingEngine();
