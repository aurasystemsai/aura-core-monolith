/**
 * AB TESTING & OPTIMIZATION ENGINE
 * Experiment creation, variant management, statistical analysis,
 * multi-armed bandit algorithms, and conversion optimization
 */

// In-memory stores
const experiments = new Map();
const variants = new Map();
const assignments = new Map();
const conversions = new Map();
const banditModels = new Map();

// ================================================================
// EXPERIMENT MANAGEMENT
// ================================================================

function createExperiment({ name, description, type = 'ab_test', variants: variantConfigs, targeting = {} }) {
  const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const experiment = {
    id,
    name,
    description,
    type, // 'ab_test', 'multivariate', 'bandit'
    status: 'draft',
    targeting,
    variants: [],
    statistics: {
      totalParticipants: 0,
      totalConversions: 0,
      conversionRate: 0
    },
    settings: {
      minSampleSize: 100,
      confidenceLevel: 0.95,
      trafficAllocation: 1.0 // 100% of traffic
    },
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null
  };
  
  // Create variants
  variantConfigs.forEach((config, index) => {
    const variant = createVariant({
      ...config,
      experimentId: id,
      isControl: index === 0
    });
    experiment.variants.push(variant.id);
  });
  
  experiments.set(id, experiment);
  return experiment;
}

function createVariant({ experimentId, name, config, trafficWeight = 1.0, isControl = false }) {
  const id = `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const variant = {
    id,
    experimentId,
    name,
    config, // The actual variant configuration (product, price, layout, etc.)
    trafficWeight,
    isControl,
    statistics: {
      participants: 0,
      conversions: 0,
      conversionRate: 0,
      revenue: 0,
      avgRevenue: 0
    },
    createdAt: new Date().toISOString()
  };
  
  variants.set(id, variant);
  return variant;
}

function getExperiment(id) {
  return experiments.get(id) || null;
}

function listExperiments({ status, type, limit = 100 }) {
  let results = Array.from(experiments.values());
  
  if (status) {
    results = results.filter(e => e.status === status);
  }
  
  if (type) {
    results = results.filter(e => e.type === type);
  }
  
  return results
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

function startExperiment(id) {
  const experiment = experiments.get(id);
  if (!experiment) return null;
  
  experiment.status = 'running';
  experiment.startedAt = new Date().toISOString();
  
  // Initialize bandit model if needed
  if (experiment.type === 'bandit') {
    initializeBanditModel(id);
  }
  
  experiments.set(id, experiment);
  return experiment;
}

function stopExperiment(id) {
  const experiment = experiments.get(id);
  if (!experiment) return null;
  
  experiment.status = 'completed';
  experiment.completedAt = new Date().toISOString();
  
  // Calculate final statistics
  calculateExperimentStatistics(id);
  
  experiments.set(id, experiment);
  return experiment;
}

// ================================================================
// VARIANT ASSIGNMENT
// ================================================================

function assignVariant({ experimentId, userId }) {
  const experiment = experiments.get(experimentId);
  if (!experiment || experiment.status !== 'running') {
    return null;
  }
  
  // Check if user already assigned
  const existingKey = `${experimentId}_${userId}`;
  if (assignments.has(existingKey)) {
    const variantId = assignments.get(existingKey).variantId;
    return variants.get(variantId);
  }
  
  // Determine variant based on experiment type
  let variantId;
  
  if (experiment.type === 'bandit') {
    variantId = selectBanditVariant(experimentId);
  } else {
    variantId = selectRandomVariant(experiment.variants);
  }
  
  // Record assignment
  const assignment = {
    experimentId,
    userId,
    variantId,
    assignedAt: new Date().toISOString()
  };
  
  assignments.set(existingKey, assignment);
  
  // Update variant participants
  const variant = variants.get(variantId);
  if (variant) {
    variant.statistics.participants += 1;
    variants.set(variantId, variant);
  }
  
  // Update experiment participants
  experiment.statistics.totalParticipants += 1;
  experiments.set(experimentId, experiment);
  
  return variant;
}

function selectRandomVariant(variantIds) {
  const variantList = variantIds.map(id => variants.get(id)).filter(Boolean);
  
  // Weighted random selection
  const totalWeight = variantList.reduce((sum, v) => sum + v.trafficWeight, 0);
  const random = Math.random() * totalWeight;
  
  let cumulative = 0;
  for (const variant of variantList) {
    cumulative += variant.trafficWeight;
    if (random <= cumulative) {
      return variant.id;
    }
  }
  
  return variantList[0]?.id || null;
}

// ================================================================
// CONVERSION TRACKING
// ================================================================

function trackConversion({ experimentId, userId, variantId, revenue = 0, metadata = {} }) {
  const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const conversion = {
    id,
    experimentId,
    userId,
    variantId,
    revenue,
    metadata,
    timestamp: new Date().toISOString()
  };
  
  conversions.set(id, conversion);
  
  // Update variant statistics
  const variant = variants.get(variantId);
  if (variant) {
    variant.statistics.conversions += 1;
    variant.statistics.revenue += revenue;
    variant.statistics.conversionRate = variant.statistics.participants > 0
      ? (variant.statistics.conversions / variant.statistics.participants) * 100
      : 0;
    variant.statistics.avgRevenue = variant.statistics.conversions > 0
      ? variant.statistics.revenue / variant.statistics.conversions
      : 0;
    variants.set(variantId, variant);
  }
  
  // Update experiment statistics
  const experiment = experiments.get(experimentId);
  if (experiment) {
    experiment.statistics.totalConversions += 1;
    experiment.statistics.conversionRate = experiment.statistics.totalParticipants > 0
      ? (experiment.statistics.totalConversions / experiment.statistics.totalParticipants) * 100
      : 0;
    experiments.set(experimentId, experiment);
  }
  
  // Update bandit model if applicable
  if (experiment && experiment.type === 'bandit') {
    updateBanditModel(experimentId, variantId, 1); // Reward = 1 for conversion
  }
  
  return conversion;
}

// ================================================================
// STATISTICAL ANALYSIS
// ================================================================

function calculateExperimentStatistics(experimentId) {
  const experiment = experiments.get(experimentId);
  if (!experiment) return null;
  
  const variantList = experiment.variants.map(id => variants.get(id)).filter(Boolean);
  
  if (variantList.length < 2) {
    return { error: 'Need at least 2 variants for comparison' };
  }
  
  const control = variantList.find(v => v.isControl) || variantList[0];
  const variations = variantList.filter(v => !v.isControl);
  
  const results = variations.map(variation => {
    const comparison = compareVariants(control, variation);
    return {
      variantId: variation.id,
      variantName: variation.name,
      ...comparison
    };
  });
  
  return {
    control: {
      id: control.id,
      name: control.name,
      ...control.statistics
    },
    variations: results,
    winner: determineWinner(variantList)
  };
}

function compareVariants(control, variation) {
  const p1 = control.statistics.conversionRate / 100;
  const p2 = variation.statistics.conversionRate / 100;
  const n1 = control.statistics.participants;
  const n2 = variation.statistics.participants;
  
  if (n1 === 0 || n2 === 0) {
    return {
      significant: false,
      pValue: 1,
      confidenceLevel: 0,
      lift: 0
    };
  }
  
  // Pooled proportion
  const pPool = ((p1 * n1) + (p2 * n2)) / (n1 + n2);
  
  // Standard error
  const se = Math.sqrt(pPool * (1 - pPool) * ((1 / n1) + (1 / n2)));
  
  // Z-score
  const z = se > 0 ? Math.abs(p2 - p1) / se : 0;
  
  // P-value (two-tailed)
  const pValue = 2 * (1 - normalCDF(z));
  
  // Significance
  const significant = pValue < 0.05;
  
  // Lift
  const lift = p1 > 0 ? ((p2 - p1) / p1) * 100 : 0;
  
  return {
    significant,
    pValue,
    confidenceLevel: (1 - pValue) * 100,
    lift,
    absoluteDifference: (p2 - p1) * 100
  };
}

function normalCDF(z) {
  // Approximation of cumulative distribution function
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

function determineWinner(variantList) {
  if (variantList.length === 0) return null;
  
  // Simple winner: highest conversion rate with enough participants
  const minParticipants = 30;
  const qualified = variantList.filter(v => v.statistics.participants >= minParticipants);
  
  if (qualified.length === 0) {
    return { status: 'insufficient_data' };
  }
  
  const winner = qualified.reduce((best, current) => {
    return current.statistics.conversionRate > best.statistics.conversionRate ? current : best;
  });
  
  return {
    variantId: winner.id,
    variantName: winner.name,
    conversionRate: winner.statistics.conversionRate,
    revenue: winner.statistics.revenue
  };
}

// ================================================================
// MULTI-ARMED BANDIT
// ================================================================

function initializeBanditModel(experimentId) {
  const experiment = experiments.get(experimentId);
  if (!experiment) return null;
  
  const model = {
    experimentId,
    epsilon: 0.1, // Exploration rate
    algorithm: 'epsilon_greedy', // 'epsilon_greedy', 'ucb', 'thompson_sampling'
    arms: {}
  };
  
  // Initialize arms for each variant
  experiment.variants.forEach(variantId => {
    model.arms[variantId] = {
      pulls: 0,
      rewards: 0,
      avgReward: 0,
      // For Thompson Sampling
      alpha: 1,
      beta: 1
    };
  });
  
  banditModels.set(experimentId, model);
  return model;
}

function selectBanditVariant(experimentId) {
  const model = banditModels.get(experimentId);
  const experiment = experiments.get(experimentId);
  
  if (!model || !experiment) return null;
  
  const { algorithm, epsilon, arms } = model;
  
  if (algorithm === 'epsilon_greedy') {
    return epsilonGreedy(arms, epsilon);
  } else if (algorithm === 'ucb') {
    return upperConfidenceBound(arms);
  } else if (algorithm === 'thompson_sampling') {
    return thompsonSampling(arms);
  }
  
  // Default: random
  return selectRandomVariant(experiment.variants);
}

function epsilonGreedy(arms, epsilon) {
  // Explore with probability epsilon
  if (Math.random() < epsilon) {
    const armIds = Object.keys(arms);
    return armIds[Math.floor(Math.random() * armIds.length)];
  }
  
  // Exploit: choose best arm
  let bestArm = null;
  let maxReward = -Infinity;
  
  Object.keys(arms).forEach(armId => {
    const arm = arms[armId];
    if (arm.avgReward > maxReward) {
      maxReward = arm.avgReward;
      bestArm = armId;
    }
  });
  
  return bestArm;
}

function upperConfidenceBound(arms) {
  const totalPulls = Object.values(arms).reduce((sum, a) => sum + a.pulls, 0);
  
  if (totalPulls === 0) {
    // Random selection initially
    const armIds = Object.keys(arms);
    return armIds[Math.floor(Math.random() * armIds.length)];
  }
  
  let bestArm = null;
  let maxUCB = -Infinity;
  
  Object.keys(arms).forEach(armId => {
    const arm = arms[armId];
    
    if (arm.pulls === 0) {
      // Prioritize unexplored arms
      maxUCB = Infinity;
      bestArm = armId;
      return;
    }
    
    // UCB formula: avgReward + sqrt(2 * ln(totalPulls) / pulls)
    const ucb = arm.avgReward + Math.sqrt((2 * Math.log(totalPulls)) / arm.pulls);
    
    if (ucb > maxUCB) {
      maxUCB = ucb;
      bestArm = armId;
    }
  });
  
  return bestArm;
}

function thompsonSampling(arms) {
  let bestArm = null;
  let maxSample = -Infinity;
  
  Object.keys(arms).forEach(armId => {
    const arm = arms[armId];
    
    // Sample from Beta distribution
    const sample = betaSample(arm.alpha, arm.beta);
    
    if (sample > maxSample) {
      maxSample = sample;
      bestArm = armId;
    }
  });
  
  return bestArm;
}

function betaSample(alpha, beta) {
  // Simplified beta sampling using gamma distribution
  const x = gammaSample(alpha);
  const y = gammaSample(beta);
  return x / (x + y);
}

function gammaSample(shape) {
  // Marsaglia and Tsang's method for gamma sampling
  if (shape < 1) {
    return gammaSample(shape + 1) * Math.pow(Math.random(), 1 / shape);
  }
  
  const d = shape - 1/3;
  const c = 1 / Math.sqrt(9 * d);
  
  while (true) {
    let x, v;
    do {
      x = normalSample();
      v = 1 + c * x;
    } while (v <= 0);
    
    v = v * v * v;
    const u = Math.random();
    
    if (u < 1 - 0.0331 * x * x * x * x) {
      return d * v;
    }
    
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return d * v;
    }
  }
}

function normalSample() {
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function updateBanditModel(experimentId, variantId, reward) {
  const model = banditModels.get(experimentId);
  if (!model || !model.arms[variantId]) return;
  
  const arm = model.arms[variantId];
  
  arm.pulls += 1;
  arm.rewards += reward;
  arm.avgReward = arm.rewards / arm.pulls;
  
  // Update Thompson Sampling parameters
  if (reward > 0) {
    arm.alpha += 1;
  } else {
    arm.beta += 1;
  }
  
  banditModels.set(experimentId, model);
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Experiment Management
  createExperiment,
  getExperiment,
  listExperiments,
  startExperiment,
  stopExperiment,
  
  // Variants
  createVariant,
  assignVariant,
  
  // Conversions
  trackConversion,
  
  // Analysis
  calculateExperimentStatistics,
  compareVariants,
  
  // Bandit
  initializeBanditModel,
  selectBanditVariant,
  updateBanditModel,
  
  // Data stores
  experiments,
  variants,
  assignments,
  conversions,
  banditModels
};
