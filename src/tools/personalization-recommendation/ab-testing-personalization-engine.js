/**
 * AB TESTING PERSONALIZATION ENGINE
 * Test personalization strategies and optimize performance
 */

// Storage
const experiments = new Map();
const variants = new Map();
const assignments = new Map(); // userId -> experimentId -> variantId
const results = new Map();
const statisticalTests = new Map();

// Generate unique ID
function generateId(prefix = 'exp') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create A/B test experiment
 */
function createExperiment({ name, hypothesis, metric, variants: variantConfigs, traffic = 100 }) {
  const experimentId = generateId('exp');
  
  const experiment = {
    id: experimentId,
    name,
    hypothesis,
    primaryMetric: metric, // conversion_rate, ctr, revenue, engagement
    variants: [],
    traffic, // Percentage of users to include (0-100)
    status: 'draft', // draft, running, paused, completed
    startedAt: null,
    completedAt: null,
    results: {
      totalUsers: 0,
      confidence: 0,
      winner: null,
      uplift: 0
    },
    createdAt: new Date().toISOString()
  };
  
  // Create variants
  variantConfigs.forEach((config, index) => {
    const variantId = generateId('var');
    
    const variant = {
      id: variantId,
      experimentId,
      name: config.name || `Variant ${String.fromCharCode(65 + index)}`,
      isControl: index === 0,
      trafficAllocation: config.traffic || (100 / variantConfigs.length),
      config: config.config || {},
      metrics: {
        users: 0,
        conversions: 0,
        conversionRate: 0,
        clicks: 0,
        ctr: 0,
        revenue: 0,
        avgRevenue: 0,
        engagement: 0
      }
    };
    
    variants.set(variantId, variant);
    experiment.variants.push(variantId);
  });
  
  experiments.set(experimentId, experiment);
  
  return experiment;
}

/**
 * Start experiment
 */
function startExperiment(experimentId) {
  const experiment = experiments.get(experimentId);
  if (!experiment) {
    throw new Error('Experiment not found');
  }
  
  experiment.status = 'running';
  experiment.startedAt = new Date().toISOString();
  
  return experiment;
}

/**
 * Assign user to variant
 */
function assignUserToVariant(experimentId, userId) {
  const experiment = experiments.get(experimentId);
  if (!experiment || experiment.status !== 'running') {
    throw new Error('Experiment not found or not running');
  }
  
  // Check if user already assigned
  if (!assignments.has(userId)) {
    assignments.set(userId, new Map());
  }
  
  const userAssignments = assignments.get(userId);
  if (userAssignments.has(experimentId)) {
    return variants.get(userAssignments.get(experimentId));
  }
  
  // Check if user should be included (traffic percentage)
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const bucket = hash % 100;
  
  if (bucket >= experiment.traffic) {
    return null; // User not in experiment
  }
  
  // Assign to variant based on traffic allocation
  let cumulative = 0;
  let selectedVariant = null;
  
  for (const variantId of experiment.variants) {
    const variant = variants.get(variantId);
    cumulative += variant.trafficAllocation;
    
    if (bucket < cumulative) {
      selectedVariant = variant;
      break;
    }
  }
  
  if (!selectedVariant) {
    selectedVariant = variants.get(experiment.variants[experiment.variants.length - 1]);
  }
  
  // Store assignment
  userAssignments.set(experimentId, selectedVariant.id);
  selectedVariant.metrics.users++;
  experiment.results.totalUsers++;
  
  return selectedVariant;
}

/**
 * Track experiment metric
 */
function trackExperimentMetric({ experimentId, userId, metric, value = 1 }) {
  const userAssignments = assignments.get(userId);
  if (!userAssignments?.has(experimentId)) {
    throw new Error('User not assigned to experiment');
  }
  
  const variantId = userAssignments.get(experimentId);
  const variant = variants.get(variantId);
  
  // Update metrics
  if (metric === 'conversion') {
    variant.metrics.conversions += value;
  } else if (metric === 'click') {
    variant.metrics.clicks += value;
  } else if (metric === 'revenue') {
    variant.metrics.revenue += value;
  } else if (metric === 'engagement') {
    variant.metrics.engagement += value;
  }
  
  // Recalculate rates
  if (variant.metrics.users > 0) {
    variant.metrics.conversionRate = (variant.metrics.conversions / variant.metrics.users) * 100;
    variant.metrics.ctr = (variant.metrics.clicks / variant.metrics.users) * 100;
    variant.metrics.avgRevenue = variant.metrics.revenue / variant.metrics.users;
  }
  
  return variant.metrics;
}

/**
 * Calculate statistical significance
 */
function calculateSignificance(experimentId) {
  const experiment = experiments.get(experimentId);
  if (!experiment) {
    throw new Error('Experiment not found');
  }
  
  const variantData = experiment.variants.map(vid => variants.get(vid));
  const control = variantData.find(v => v.isControl);
  
  if (!control) {
    throw new Error('No control variant found');
  }
  
  const results = [];
  
  variantData.forEach(variant => {
    if (variant.isControl) return;
    
    // Z-test for conversion rates
    const p1 = control.metrics.conversionRate / 100;
    const p2 = variant.metrics.conversionRate / 100;
    const n1 = control.metrics.users;
    const n2 = variant.metrics.users;
    
    if (n1 < 30 || n2 < 30) {
      results.push({
        variantId: variant.id,
        variantName: variant.name,
        significant: false,
        confidence: 0,
        pValue: 1,
        uplift: 0,
        note: 'Insufficient sample size (need 30+ users per variant)'
      });
      return;
    }
    
    const pPool = (p1 * n1 + p2 * n2) / (n1 + n2);
    const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2));
    
    if (se === 0) {
      results.push({
        variantId: variant.id,
        variantName: variant.name,
        significant: false,
        confidence: 0,
        pValue: 1,
        uplift: 0,
        note: 'No variance in data'
      });
      return;
    }
    
    const zScore = (p2 - p1) / se;
    const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
    const confidence = (1 - pValue) * 100;
    const uplift = ((p2 - p1) / p1) * 100;
    
    results.push({
      variantId: variant.id,
      variantName: variant.name,
      significant: pValue < 0.05,
      confidence: Math.round(confidence * 100) / 100,
      pValue: Math.round(pValue * 1000) / 1000,
      zScore: Math.round(zScore * 100) / 100,
      uplift: Math.round(uplift * 100) / 100,
      controlRate: Math.round(p1 * 10000) / 100,
      variantRate: Math.round(p2 * 10000) / 100
    });
  });
  
  statisticalTests.set(experimentId, {
    experimentId,
    results,
    calculatedAt: new Date().toISOString()
  });
  
  // Update experiment results
  const significantWinner = results.find(r => r.significant && r.uplift > 0);
  if (significantWinner) {
    experiment.results.winner = significantWinner.variantId;
    experiment.results.uplift = significantWinner.uplift;
    experiment.results.confidence = significantWinner.confidence;
  }
  
  return results;
}

/**
 * Normal CDF approximation
 */
function normalCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

/**
 * Pause experiment
 */
function pauseExperiment(experimentId) {
  const experiment = experiments.get(experimentId);
  if (!experiment) {
    throw new Error('Experiment not found');
  }
  
  experiment.status = 'paused';
  
  return experiment;
}

/**
 * Complete experiment
 */
function completeExperiment(experimentId) {
  const experiment = experiments.get(experimentId);
  if (!experiment) {
    throw new Error('Experiment not found');
  }
  
  // Calculate final significance
  calculateSignificance(experimentId);
  
  experiment.status = 'completed';
  experiment.completedAt = new Date().toISOString();
  
  return experiment;
}

/**
 * Get experiment results
 */
function getExperimentResults(experimentId) {
  const experiment = experiments.get(experimentId);
  if (!experiment) {
    throw new Error('Experiment not found');
  }
  
  const variantResults = experiment.variants.map(vid => {
    const variant = variants.get(vid);
    return {
      id: variant.id,
      name: variant.name,
      isControl: variant.isControl,
      users: variant.metrics.users,
      conversions: variant.metrics.conversions,
      conversionRate: Math.round(variant.metrics.conversionRate * 100) / 100,
      clicks: variant.metrics.clicks,
      ctr: Math.round(variant.metrics.ctr * 100) / 100,
      revenue: Math.round(variant.metrics.revenue * 100) / 100,
      avgRevenue: Math.round(variant.metrics.avgRevenue * 100) / 100
    };
  });
  
  const statistical = statisticalTests.get(experimentId);
  
  return {
    experiment: {
      id: experiment.id,
      name: experiment.name,
      status: experiment.status,
      totalUsers: experiment.results.totalUsers,
      winner: experiment.results.winner,
      uplift: experiment.results.uplift,
      confidence: experiment.results.confidence
    },
    variants: variantResults,
    statistical: statistical?.results || []
  };
}

/**
 * Get recommended sample size
 */
function calculateSampleSize({ baselineRate, minimumDetectableEffect, power = 0.8, alpha = 0.05 }) {
  // baselineRate: control conversion rate (0-1)
  // minimumDetectableEffect: minimum improvement to detect (e.g., 0.1 for 10%)
  // power: statistical power (usually 0.8)
  // alpha: significance level (usually 0.05)
  
  const p1 = baselineRate;
  const p2 = p1 * (1 + minimumDetectableEffect);
  
  const zAlpha = 1.96; // for alpha = 0.05 (two-tailed)
  const zBeta = 0.84; // for power = 0.8
  
  const pBar = (p1 + p2) / 2;
  
  const numerator = Math.pow(zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) + zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2);
  const denominator = Math.pow(p2 - p1, 2);
  
  const sampleSizePerVariant = Math.ceil(numerator / denominator);
  
  return {
    perVariant: sampleSizePerVariant,
    total: sampleSizePerVariant * 2, // Assuming 2 variants
    estimatedDays: Math.ceil(sampleSizePerVariant * 2 / 1000), // Assuming 1000 users/day
    assumptions: {
      baselineRate,
      targetRate: p2,
      minimumDetectableEffect,
      power,
      alpha
    }
  };
}

/**
 * Create multivariate test
 */
function createMultivariateTest({ name, factors }) {
  // factors: array of { name, levels: [level configs] }
  const testId = generateId('mvt');
  
  // Generate all combinations
  const combinations = [];
  
  function generateCombinations(index, current) {
    if (index === factors.length) {
      combinations.push([...current]);
      return;
    }
    
    factors[index].levels.forEach(level => {
      current.push(level);
      generateCombinations(index + 1, current);
      current.pop();
    });
  }
  
  generateCombinations(0, []);
  
  // Create experiment with all combinations as variants
  const variantConfigs = combinations.map((combo, index) => ({
    name: `Combination ${index + 1}`,
    config: combo.reduce((acc, level, idx) => {
      acc[factors[idx].name] = level;
      return acc;
    }, {})
  }));
  
  return createExperiment({
    name,
    hypothesis: `Multivariate test of ${factors.map(f => f.name).join(', ')}`,
    metric: 'conversion_rate',
    variants: variantConfigs
  });
}

/**
 * Get testing analytics
 */
function getTestingAnalytics() {
  const allExperiments = Array.from(experiments.values());
  
  const byStatus = {
    draft: allExperiments.filter(e => e.status === 'draft').length,
    running: allExperiments.filter(e => e.status === 'running').length,
    paused: allExperiments.filter(e => e.status === 'paused').length,
    completed: allExperiments.filter(e => e.status === 'completed').length
  };
  
  const completedExperiments = allExperiments.filter(e => e.status === 'completed');
  const withWinners = completedExperiments.filter(e => e.results.winner);
  
  return {
    totalExperiments: allExperiments.length,
    byStatus,
    totalUsers: allExperiments.reduce((sum, e) => sum + e.results.totalUsers, 0),
    completedTests: completedExperiments.length,
    testsWithWinner: withWinners.length,
    winRate: completedExperiments.length > 0 
      ? (withWinners.length / completedExperiments.length) * 100 : 0,
    avgUplift: withWinners.length > 0
      ? withWinners.reduce((sum, e) => sum + e.results.uplift, 0) / withWinners.length : 0,
    totalVariants: variants.size
  };
}

module.exports = {
  createExperiment,
  startExperiment,
  assignUserToVariant,
  trackExperimentMetric,
  calculateSignificance,
  pauseExperiment,
  completeExperiment,
  getExperimentResults,
  calculateSampleSize,
  createMultivariateTest,
  getTestingAnalytics
};
