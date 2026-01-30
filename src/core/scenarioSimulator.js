// Scenario Simulation and What-If Tools for Aura Systems
// Provides deterministic what-if adjustments and Monte Carlo simulations for KPI planning

const { v4: uuidv4 } = require('uuid');

class ScenarioSimulator {
  constructor() {
    this.scenarios = new Map();
    this.defaultConfig = {
      baseline: { revenue: 10000, cac: 50, conversion: 0.03 },
      adjustments: {},
      iterations: 500,
      volatility: 0.1,
    };
  }

  registerScenario(name, config = {}) {
    const id = uuidv4();
    const scenario = { id, name, config: { ...this.defaultConfig, ...config }, createdAt: Date.now() };
    this.scenarios.set(id, scenario);
    return scenario;
  }

  listScenarios() {
    return Array.from(this.scenarios.values());
  }

  runDeterministic({ baseline, adjustments }) {
    const base = { ...this.defaultConfig.baseline, ...baseline };
    const adj = adjustments || {};
    const result = {};
    Object.keys(base).forEach(k => {
      const change = adj[k] ?? 0;
      result[k] = base[k] * (1 + change);
    });
    return { ok: true, result };
  }

  runMonteCarlo({ baseline, adjustments, iterations = 500, volatility = 0.1 }) {
    const base = { ...this.defaultConfig.baseline, ...baseline };
    const adj = adjustments || {};
    const outputs = [];
    for (let i = 0; i < iterations; i++) {
      const sample = {};
      Object.keys(base).forEach(k => {
        const change = adj[k] ?? 0;
        const noise = this._normal(0, volatility);
        sample[k] = base[k] * (1 + change + noise);
      });
      outputs.push(sample);
    }
    const summary = this._summarize(outputs);
    return { ok: true, outputs, summary };
  }

  _summarize(samples) {
    if (!samples.length) return {};
    const keys = Object.keys(samples[0]);
    const summary = {};
    keys.forEach(k => {
      const vals = samples.map(s => s[k]);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      summary[k] = { avg, min, max };
    });
    return summary;
  }

  _normal(mean = 0, std = 1) {
    // Box-Muller
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * std + mean;
  }
}

module.exports = new ScenarioSimulator();
