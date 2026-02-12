// Experiments engine for A/B testing and multi-armed bandit pricing strategies

const db = require('./db');

let experiments = [];
let experimentAssignments = new Map(); // userId/sessionId -> experimentId -> variantId
let experimentMetrics = new Map(); // experimentId -> metrics

const EXPERIMENT_STATUS = {
  DRAFT: 'draft',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed'
};

const ALLOCATION_STRATEGY = {
  RANDOM: 'random',
  ROUND_ROBIN: 'round-robin',
  BANDIT: 'bandit' // Multi-armed bandit with Thompson sampling
};

// Create a new pricing experiment
const createExperiment = (config) => {
  const experiment = {
    id: experiments.length + 1,
    name: config.name || `Experiment ${experiments.length + 1}`,
    description: config.description || '',
    status: EXPERIMENT_STATUS.DRAFT,
    allocationStrategy: config.allocationStrategy || ALLOCATION_STRATEGY.RANDOM,
    variants: config.variants || [],
    scope: config.scope || 'global', // global, category, product, segment
    scopeValue: config.scopeValue || null,
    guardrails: config.guardrails || {}, // Same as pricing guardrails
    autoStopOnGuardrailBreach: config.autoStopOnGuardrailBreach !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null
  };

  experiments.push(experiment);
  experimentMetrics.set(experiment.id, {
    totalAssignments: 0,
    variantStats: {}
  });

  return experiment;
};

// Assign a user/session to a variant
const assignVariant = (experimentId, userId, context = {}) => {
  const experiment = experiments.find(e => e.id === experimentId);
  if (!experiment || experiment.status !== EXPERIMENT_STATUS.RUNNING) {
    return null;
  }

  // Check if user already assigned
  const key = `${userId}_${experimentId}`;
  if (experimentAssignments.has(key)) {
    return experimentAssignments.get(key);
  }

  let variantId;
  const variants = experiment.variants;

  if (experiment.allocationStrategy === ALLOCATION_STRATEGY.RANDOM) {
    // Random assignment based on weights
    const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 1), 0);
    const random = Math.random() * totalWeight;
    let cumulative = 0;
    for (const variant of variants) {
      cumulative += (variant.weight || 1);
      if (random <= cumulative) {
        variantId = variant.id;
        break;
      }
    }
  } else if (experiment.allocationStrategy === ALLOCATION_STRATEGY.ROUND_ROBIN) {
    // Round robin distribution
    const metrics = experimentMetrics.get(experimentId);
    const counts = variants.map(v => metrics.variantStats[v.id]?.assignments || 0);
    const minCount = Math.min(...counts);
    const minIndex = counts.indexOf(minCount);
    variantId = variants[minIndex].id;
  } else if (experiment.allocationStrategy === ALLOCATION_STRATEGY.BANDIT) {
    // Thompson sampling for multi-armed bandit
    variantId = thompsonSampling(experimentId, variants);
  }

  const assignment = {
    experimentId,
    variantId,
    userId,
    assignedAt: new Date().toISOString()
  };

  experimentAssignments.set(key, assignment);

  // Update metrics
  const metrics = experimentMetrics.get(experimentId);
  metrics.totalAssignments++;
  if (!metrics.variantStats[variantId]) {
    metrics.variantStats[variantId] = {
      assignments: 0,
      conversions: 0,
      revenue: 0,
      alpha: 1, // Prior for Thompson sampling (successes)
      beta: 1   // Prior for Thompson sampling (failures)
    };
  }
  metrics.variantStats[variantId].assignments++;

  return assignment;
};

// Thompson sampling for multi-armed bandit
const thompsonSampling = (experimentId, variants) => {
  const metrics = experimentMetrics.get(experimentId);
  let bestVariant = null;
  let bestSample = -1;

  for (const variant of variants) {
    const stats = metrics.variantStats[variant.id] || { alpha: 1, beta: 1 };
    // Sample from Beta distribution (simplified approximation)
    const sample = betaSample(stats.alpha, stats.beta);
    if (sample > bestSample) {
      bestSample = sample;
      bestVariant = variant.id;
    }
  }

  return bestVariant || variants[0].id;
};

// Simplified beta distribution sampling
const betaSample = (alpha, beta) => {
  // Approximation using gamma distribution
  const gamma1 = gammaSample(alpha);
  const gamma2 = gammaSample(beta);
  return gamma1 / (gamma1 + gamma2);
};

// Simplified gamma distribution sampling
const gammaSample = (shape) => {
  // Very simple approximation for demonstration
  // In production, use a proper statistical library
  if (shape < 1) return Math.pow(Math.random(), 1 / shape);
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  let x, v;
  do {
    x = normalSample();
    v = 1 + c * x;
  } while (v <= 0);
  return d * Math.pow(v, 3);
};

// Simplified normal distribution sampling (Box-Muller transform)
const normalSample = () => {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
};

// Record conversion/outcome for a user
const recordOutcome = (experimentId, userId, outcome) => {
  const key = `${userId}_${experimentId}`;
  const assignment = experimentAssignments.get(key);
  if (!assignment) return null;

  const metrics = experimentMetrics.get(experimentId);
  const stats = metrics.variantStats[assignment.variantId];

  if (outcome.converted) {
    stats.conversions++;
    stats.alpha++; // Increment successes for Thompson sampling
  } else {
    stats.beta++; // Increment failures for Thompson sampling
  }

  if (outcome.revenue) {
    stats.revenue += outcome.revenue;
  }

  // Check guardrail breach
  const experiment = experiments.find(e => e.id === experimentId);
  if (experiment.autoStopOnGuardrailBreach) {
    if (checkGuardrailBreach(experiment, stats)) {
      pauseExperiment(experimentId, 'Guardrail breach detected');
    }
  }

  return { ok: true, stats };
};

// Check if experiment has breached guardrails
const checkGuardrailBreach = (experiment, stats) => {
  const guardrails = experiment.guardrails;
  
  if (guardrails.minConversionRate && stats.assignments > 100) {
    const conversionRate = stats.conversions / stats.assignments;
    if (conversionRate < guardrails.minConversionRate) return true;
  }

  if (guardrails.minAverageRevenue && stats.conversions > 0) {
    const avgRevenue = stats.revenue / stats.conversions;
    if (avgRevenue < guardrails.minAverageRevenue) return true;
  }

  return false;
};

// Start an experiment
const startExperiment = (experimentId) => {
  const experiment = experiments.find(e => e.id === experimentId);
  if (!experiment) return null;

  experiment.status = EXPERIMENT_STATUS.RUNNING;
  experiment.startedAt = new Date().toISOString();
  experiment.updatedAt = new Date().toISOString();

  return experiment;
};

// Pause an experiment
const pauseExperiment = (experimentId, reason = '') => {
  const experiment = experiments.find(e => e.id === experimentId);
  if (!experiment) return null;

  experiment.status = EXPERIMENT_STATUS.PAUSED;
  experiment.pausedReason = reason;
  experiment.updatedAt = new Date().toISOString();

  return experiment;
};

// Complete an experiment
const completeExperiment = (experimentId) => {
  const experiment = experiments.find(e => e.id === experimentId);
  if (!experiment) return null;

  experiment.status = EXPERIMENT_STATUS.COMPLETED;
  experiment.completedAt = new Date().toISOString();
  experiment.updatedAt = new Date().toISOString();

  return experiment;
};

// Get experiment results
const getExperimentResults = (experimentId) => {
  const experiment = experiments.find(e => e.id === experimentId);
  if (!experiment) return null;

  const metrics = experimentMetrics.get(experimentId);
  const results = {
    experiment,
    metrics: {
      totalAssignments: metrics.totalAssignments,
      variants: []
    }
  };

  for (const variant of experiment.variants) {
    const stats = metrics.variantStats[variant.id] || {};
    results.metrics.variants.push({
      variantId: variant.id,
      variantName: variant.name,
      assignments: stats.assignments || 0,
      conversions: stats.conversions || 0,
      conversionRate: stats.assignments > 0 ? (stats.conversions / stats.assignments) : 0,
      revenue: stats.revenue || 0,
      averageRevenue: stats.conversions > 0 ? (stats.revenue / stats.conversions) : 0
    });
  }

  return results;
};

// List all experiments
const listExperiments = (filters = {}) => {
  let filtered = experiments;
  
  if (filters.status) {
    filtered = filtered.filter(e => e.status === filters.status);
  }

  return filtered;
};

// Clear all experiments (for testing)
const clear = () => {
  experiments = [];
  experimentAssignments.clear();
  experimentMetrics.clear();
};

module.exports = {
  createExperiment,
  assignVariant,
  recordOutcome,
  startExperiment,
  pauseExperiment,
  completeExperiment,
  getExperimentResults,
  listExperiments,
  clear,
  EXPERIMENT_STATUS,
  ALLOCATION_STRATEGY
};
