/**
 * A/B Testing Suite - Statistical Analysis Engine
 * 
 * Provides comprehensive statistical methods for experiment analysis:
 * - Frequentist: t-tests, chi-square, ANOVA, p-values
 * - Bayesian: Beta-Binomial, posterior distributions, credible intervals
 * - Sequential: Always-valid inference, early stopping
 * - Power analysis: Sample size calculations, MDE
 * 
 * @module experiment-engine
 */

// In-memory storage (replace with database in production)
const experiments = new Map();
const results = new Map();
const events = new Map();

/**
 * Create a new experiment
 */
function createExperiment(config) {
  const experiment = {
    id: config.id || `exp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    name: config.name,
    description: config.description || '',
    type: config.type || 'ab', // 'ab', 'abn', 'multivariate', 'split-url'
    status: 'draft',
    variants: config.variants || [],
    goals: config.goals || [],
    targeting: config.targeting || {},
    trafficAllocation: config.trafficAllocation || { type: 'fixed', method: 'round-robin' },
    schedule: config.schedule || {},
    sampleSize: config.sampleSize || 1000,
    confidenceLevel: config.confidenceLevel || 0.95,
    minimumDetectableEffect: config.minimumDetectableEffect || 0.05,
    createdAt: new Date().toISOString(),
    createdBy: config.createdBy || 'system',
    metadata: config.metadata || {}
  };
  
  experiments.set(experiment.id, experiment);
  results.set(experiment.id, initializeResults(experiment));
  
  return experiment;
}

/**
 * Initialize results structure for experiment
 */
function initializeResults(experiment) {
  const variantResults = {};
  
  for (const variant of experiment.variants) {
    variantResults[variant.id] = {
      impressions: 0,
      conversions: 0,
      revenue: 0,
      events: [],
      visitors: new Set(),
      sessions: new Map()
    };
  }
  
  return {
    variantResults,
    startedAt: null,
    lastUpdated: null,
    totalImpressions: 0,
    totalConversions: 0,
    totalRevenue: 0
  };
}

/**
 * Track an event (impression, conversion, revenue)
 */
function trackEvent(experimentId, event) {
  const experiment = experiments.get(experimentId);
  const experimentResults = results.get(experimentId);
  
  if (!experiment || !experimentResults) {
    throw new Error('Experiment not found');
  }
  
  const { variantId, type, value, visitorId, sessionId } = event;
  const variantResult = experimentResults.variantResults[variantId];
  
  if (!variantResult) {
    throw new Error('Variant not found');
  }
  
  // Track event
  const eventRecord = {
    type,
    value: value || 1,
    visitorId,
    sessionId,
    timestamp: new Date().toISOString()
  };
  
  variantResult.events.push(eventRecord);
  
  // Update metrics
  if (type === 'impression') {
    variantResult.impressions++;
    experimentResults.totalImpressions++;
    variantResult.visitors.add(visitorId);
  } else if (type === 'conversion') {
    variantResult.conversions++;
    experimentResults.totalConversions++;
  } else if (type === 'revenue') {
    variantResult.revenue += value || 0;
    experimentResults.totalRevenue += value || 0;
  }
  
  experimentResults.lastUpdated = new Date().toISOString();
  
  return eventRecord;
}

// ============================================================================
// FREQUENTIST STATISTICAL ANALYSIS
// ============================================================================

/**
 * Perform frequentist analysis (t-test or chi-square)
 */
function frequentistAnalysis(experimentId) {
  const experiment = experiments.get(experimentId);
  const experimentResults = results.get(experimentId);
  
  if (!experiment || !experimentResults) {
    throw new Error('Experiment not found');
  }
  
  const variants = experiment.variants;
  const variantResults = experimentResults.variantResults;
  
  // Calculate conversion rates
  const rates = {};
  for (const variant of variants) {
    const vr = variantResults[variant.id];
    rates[variant.id] = {
      conversionRate: vr.impressions > 0 ? vr.conversions / vr.impressions : 0,
      impressions: vr.impressions,
      conversions: vr.conversions,
      revenue: vr.revenue,
      revenuePerVisitor: vr.impressions > 0 ? vr.revenue / vr.impressions : 0
    };
  }
  
  // Find control variant
  const control = variants.find(v => v.isControl);
  if (!control) {
    return { error: 'No control variant found' };
  }
  
  // Compare each variant to control
  const comparisons = [];
  
  for (const variant of variants) {
    if (variant.id === control.id) continue;
    
    const controlRate = rates[control.id];
    const variantRate = rates[variant.id];
    
    // Two-proportion z-test
    const zTest = twoProportionZTest(
      controlRate.conversions,
      controlRate.impressions,
      variantRate.conversions,
      variantRate.impressions,
      experiment.confidenceLevel
    );
    
    comparisons.push({
      variantId: variant.id,
      variantName: variant.name,
      controlConversionRate: controlRate.conversionRate,
      variantConversionRate: variantRate.conversionRate,
      absoluteLift: variantRate.conversionRate - controlRate.conversionRate,
      relativeLift: controlRate.conversionRate > 0 
        ? (variantRate.conversionRate - controlRate.conversionRate) / controlRate.conversionRate 
        : 0,
      pValue: zTest.pValue,
      isSignificant: zTest.pValue < (1 - experiment.confidenceLevel),
      confidenceInterval: zTest.confidenceInterval,
      zScore: zTest.zScore,
      standardError: zTest.standardError
    });
  }
  
  return {
    type: 'frequentist',
    experimentId,
    rates,
    comparisons,
    confidenceLevel: experiment.confidenceLevel,
    timestamp: new Date().toISOString()
  };
}

/**
 * Two-proportion z-test
 */
function twoProportionZTest(c1, n1, c2, n2, confidenceLevel = 0.95) {
  const p1 = n1 > 0 ? c1 / n1 : 0;
  const p2 = n2 > 0 ? c2 / n2 : 0;
  const pPooled = (c1 + c2) / (n1 + n2);
  
  // Standard error
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1/n1 + 1/n2));
  
  // Z-score
  const z = se > 0 ? (p2 - p1) / se : 0;
  
  // P-value (two-tailed)
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  
  // Confidence interval for difference
  const zCritical = normalInverseCDF(1 - (1 - confidenceLevel) / 2);
  const seDiff = Math.sqrt(p1 * (1 - p1) / n1 + p2 * (1 - p2) / n2);
  const diff = p2 - p1;
  const ciLower = diff - zCritical * seDiff;
  const ciUpper = diff + zCritical * seDiff;
  
  return {
    zScore: z,
    pValue,
    standardError: se,
    confidenceInterval: {
      lower: ciLower,
      upper: ciUpper,
      level: confidenceLevel
    }
  };
}

/**
 * T-test for continuous metrics (e.g., revenue per visitor)
 */
function tTest(data1, data2, confidenceLevel = 0.95) {
  const n1 = data1.length;
  const n2 = data2.length;
  
  if (n1 < 2 || n2 < 2) {
    return { error: 'Insufficient data for t-test' };
  }
  
  const mean1 = average(data1);
  const mean2 = average(data2);
  const variance1 = sampleVariance(data1);
  const variance2 = sampleVariance(data2);
  
  // Welch's t-test (unequal variances)
  const se = Math.sqrt(variance1 / n1 + variance2 / n2);
  const t = se > 0 ? (mean2 - mean1) / se : 0;
  
  // Degrees of freedom (Welch-Satterthwaite)
  const df = Math.pow(variance1 / n1 + variance2 / n2, 2) / 
             (Math.pow(variance1 / n1, 2) / (n1 - 1) + Math.pow(variance2 / n2, 2) / (n2 - 1));
  
  // P-value (approximation using normal distribution for large samples)
  const pValue = 2 * (1 - normalCDF(Math.abs(t)));
  
  // Confidence interval
  const tCritical = 1.96; // Approximate for large df
  const ciLower = (mean2 - mean1) - tCritical * se;
  const ciUpper = (mean2 - mean1) + tCritical * se;
  
  return {
    tStatistic: t,
    degreesOfFreedom: df,
    pValue,
    mean1,
    mean2,
    meanDifference: mean2 - mean1,
    standardError: se,
    confidenceInterval: {
      lower: ciLower,
      upper: ciUpper,
      level: confidenceLevel
    }
  };
}

// ============================================================================
// BAYESIAN ANALYSIS
// ============================================================================

/**
 * Bayesian analysis using Beta-Binomial model
 */
function bayesianAnalysis(experimentId, priorAlpha = 1, priorBeta = 1) {
  const experiment = experiments.get(experimentId);
  const experimentResults = results.get(experimentId);
  
  if (!experiment || !experimentResults) {
    throw new Error('Experiment not found');
  }
  
  const variants = experiment.variants;
  const variantResults = experimentResults.variantResults;
  
  // Calculate posterior distributions for each variant
  const posteriors = {};
  
  for (const variant of variants) {
    const vr = variantResults[variant.id];
    
    // Beta posterior: Beta(alpha + successes, beta + failures)
    const posteriorAlpha = priorAlpha + vr.conversions;
    const posteriorBeta = priorBeta + (vr.impressions - vr.conversions);
    
    // Posterior mean (expected conversion rate)
    const posteriorMean = posteriorAlpha / (posteriorAlpha + posteriorBeta);
    
    // Posterior variance
    const posteriorVariance = (posteriorAlpha * posteriorBeta) / 
      (Math.pow(posteriorAlpha + posteriorBeta, 2) * (posteriorAlpha + posteriorBeta + 1));
    
    // Credible interval (95% by default)
    const credibleInterval = betaCredibleInterval(posteriorAlpha, posteriorBeta, 0.95);
    
    posteriors[variant.id] = {
      variantId: variant.id,
      variantName: variant.name,
      alpha: posteriorAlpha,
      beta: posteriorBeta,
      mean: posteriorMean,
      variance: posteriorVariance,
      standardDeviation: Math.sqrt(posteriorVariance),
      credibleInterval,
      impressions: vr.impressions,
      conversions: vr.conversions
    };
  }
  
  // Calculate probability each variant is best
  const probabilityBest = calculateProbabilityBest(posteriors, 10000);
  
  // Calculate expected loss for each variant
  const expectedLoss = calculateExpectedLoss(posteriors, 10000);
  
  // Find control variant
  const control = variants.find(v => v.isControl);
  
  // Compare variants to control
  const comparisons = [];
  
  if (control) {
    const controlPosterior = posteriors[control.id];
    
    for (const variant of variants) {
      if (variant.id === control.id) continue;
      
      const variantPosterior = posteriors[variant.id];
      
      // Probability variant beats control
      const probBeatControl = monteCarloComparison(
        controlPosterior.alpha, controlPosterior.beta,
        variantPosterior.alpha, variantPosterior.beta,
        10000
      );
      
      comparisons.push({
        variantId: variant.id,
        variantName: variant.name,
        controlMean: controlPosterior.mean,
        variantMean: variantPosterior.mean,
        relativeLift: controlPosterior.mean > 0 
          ? (variantPosterior.mean - controlPosterior.mean) / controlPosterior.mean 
          : 0,
        probabilityBeatControl: probBeatControl,
        credibleInterval: variantPosterior.credibleInterval
      });
    }
  }
  
  return {
    type: 'bayesian',
    experimentId,
    posteriors,
    probabilityBest,
    expectedLoss,
    comparisons,
    timestamp: new Date().toISOString()
  };
}

/**
 * Calculate credible interval for Beta distribution
 */
function betaCredibleInterval(alpha, beta, level = 0.95) {
  // Using approximation for Beta distribution quantiles
  const mean = alpha / (alpha + beta);
  const variance = (alpha * beta) / (Math.pow(alpha + beta, 2) * (alpha + beta + 1));
  const sd = Math.sqrt(variance);
  
  // Normal approximation for large alpha + beta
  if (alpha + beta > 30) {
    const z = normalInverseCDF(1 - (1 - level) / 2);
    return {
      lower: Math.max(0, mean - z * sd),
      upper: Math.min(1, mean + z * sd),
      level
    };
  }
  
  // Simple approximation for small samples
  return {
    lower: Math.max(0, mean - 1.96 * sd),
    upper: Math.min(1, mean + 1.96 * sd),
    level
  };
}

/**
 * Monte Carlo sampling to calculate probability variant B beats variant A
 */
function monteCarloComparison(alphaA, betaA, alphaB, betaB, numSamples = 10000) {
  let countBBetter = 0;
  
  for (let i = 0; i < numSamples; i++) {
    const sampleA = betaSample(alphaA, betaA);
    const sampleB = betaSample(alphaB, betaB);
    
    if (sampleB > sampleA) {
      countBBetter++;
    }
  }
  
  return countBBetter / numSamples;
}

/**
 * Calculate probability each variant is best using Monte Carlo
 */
function calculateProbabilityBest(posteriors, numSamples = 10000) {
  const variantIds = Object.keys(posteriors);
  const counts = {};
  variantIds.forEach(id => counts[id] = 0);
  
  for (let i = 0; i < numSamples; i++) {
    let bestId = null;
    let bestSample = -Infinity;
    
    for (const id of variantIds) {
      const p = posteriors[id];
      const sample = betaSample(p.alpha, p.beta);
      
      if (sample > bestSample) {
        bestSample = sample;
        bestId = id;
      }
    }
    
    counts[bestId]++;
  }
  
  const probabilities = {};
  for (const id of variantIds) {
    probabilities[id] = counts[id] / numSamples;
  }
  
  return probabilities;
}

/**
 * Calculate expected loss (opportunity cost) for choosing each variant
 */
function calculateExpectedLoss(posteriors, numSamples = 10000) {
  const variantIds = Object.keys(posteriors);
  const losses = {};
  variantIds.forEach(id => losses[id] = 0);
  
  for (let i = 0; i < numSamples; i++) {
    const samples = {};
    let maxSample = -Infinity;
    
    // Draw samples for all variants
    for (const id of variantIds) {
      const p = posteriors[id];
      const sample = betaSample(p.alpha, p.beta);
      samples[id] = sample;
      maxSample = Math.max(maxSample, sample);
    }
    
    // Calculate loss for each variant (difference from best)
    for (const id of variantIds) {
      losses[id] += (maxSample - samples[id]);
    }
  }
  
  // Average losses
  for (const id of variantIds) {
    losses[id] /= numSamples;
  }
  
  return losses;
}

/**
 * Sample from Beta distribution using gamma distribution method
 */
function betaSample(alpha, beta) {
  const gammaA = gammaSample(alpha);
  const gammaB = gammaSample(beta);
  return gammaA / (gammaA + gammaB);
}

/**
 * Sample from Gamma distribution (Marsaglia and Tsang method)
 */
function gammaSample(alpha) {
  if (alpha < 1) {
    return gammaSample(alpha + 1) * Math.pow(Math.random(), 1 / alpha);
  }
  
  const d = alpha - 1/3;
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

/**
 * Sample from standard normal distribution (Box-Muller transform)
 */
function normalSample() {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// ============================================================================
// SEQUENTIAL TESTING
// ============================================================================

/**
 * Sequential testing with always-valid p-values
 */
function sequentialAnalysis(experimentId, alphaSpending = 'obrien-fleming') {
  const experiment = experiments.get(experimentId);
  const experimentResults = results.get(experimentId);
  
  if (!experiment || !experimentResults) {
    throw new Error('Experiment not found');
  }
  
  const maxN = experiment.sampleSize;
  const currentN = experimentResults.totalImpressions;
  const alpha = 1 - experiment.confidenceLevel;
  
  // Calculate alpha spending based on information fraction
  const informationFraction = currentN / maxN;
  const spentAlpha = calculateAlphaSpending(informationFraction, alpha, alphaSpending);
  
  // Perform standard analysis
  const freqAnalysis = frequentistAnalysis(experimentId);
  
  // Get best variant
  const bestComparison = freqAnalysis.comparisons?.reduce((best, current) => {
    if (!best || Math.abs(current.relativeLift) > Math.abs(best.relativeLift)) {
      return current;
    }
    return best;
  }, null);
  
  const decision = {
    canStop: false,
    recommendation: 'continue',
    reason: ''
  };
  
  if (bestComparison) {
    // Check for early stopping (superiority)
    if (bestComparison.pValue < spentAlpha && bestComparison.relativeLift > 0) {
      decision.canStop = true;
      decision.recommendation = 'stop-winner-found';
      decision.reason = `Variant ${bestComparison.variantName} shows significant improvement (p < ${spentAlpha.toFixed(4)})`;
    }
    
    // Check for futility (very unlikely to find significance)
    const predictedPower = estimatePower(currentN, maxN, bestComparison.relativeLift, alpha);
    if (informationFraction > 0.5 && predictedPower < 0.2) {
      decision.canStop = true;
      decision.recommendation = 'stop-futile';
      decision.reason = `Predicted power is too low (${(predictedPower * 100).toFixed(1)}%) to detect meaningful effect`;
    }
  }
  
  return {
    type: 'sequential',
    experimentId,
    analysis: freqAnalysis,
    informationFraction,
    spentAlpha,
    remainingAlpha: alpha - spentAlpha,
    decision,
    timestamp: new Date().toISOString()
  };
}

/**
 * Calculate alpha spending function
 */
function calculateAlphaSpending(t, alpha, method = 'obrien-fleming') {
  if (t <= 0) return 0;
  if (t >= 1) return alpha;
  
  switch (method) {
    case 'obrien-fleming':
      // O'Brien-Fleming: conservative early, aggressive late
      return 2 * (1 - normalCDF(normalInverseCDF(1 - alpha / 2) / Math.sqrt(t)));
    
    case 'pocock':
      // Pocock: constant alpha spending
      return alpha * Math.log(1 + (Math.E - 1) * t);
    
    case 'linear':
      // Linear alpha spending
      return alpha * t;
    
    default:
      return alpha * t;
  }
}

/**
 * Estimate statistical power for remaining sample
 */
function estimatePower(currentN, maxN, observedEffect, alpha) {
  if (currentN >= maxN) return 1.0;
  
  const remainingN = maxN - currentN;
  const totalN = maxN;
  
  // Simplified power calculation
  const se = Math.sqrt(2 / totalN); // Assuming equal split
  const z = Math.abs(observedEffect) / se;
  const zCritical = normalInverseCDF(1 - alpha / 2);
  
  const power = 1 - normalCDF(zCritical - z);
  return Math.max(0, Math.min(1, power));
}

// ============================================================================
// SAMPLE SIZE & POWER ANALYSIS
// ============================================================================

/**
 * Calculate required sample size
 */
function calculateSampleSize(baselineRate, minimumDetectableEffect, alpha = 0.05, power = 0.80) {
  const p1 = baselineRate;
  const p2 = baselineRate * (1 + minimumDetectableEffect);
  
  const zAlpha = normalInverseCDF(1 - alpha / 2);
  const zBeta = normalInverseCDF(power);
  
  const pAvg = (p1 + p2) / 2;
  
  const n = Math.pow(zAlpha + zBeta, 2) * 2 * pAvg * (1 - pAvg) / Math.pow(p2 - p1, 2);
  
  return {
    sampleSizePerVariant: Math.ceil(n),
    totalSampleSize: Math.ceil(n * 2),
    baselineRate: p1,
    variantRate: p2,
    minimumDetectableEffect,
    alpha,
    power
  };
}

/**
 * Calculate statistical power for given sample size
 */
function calculatePower(sampleSize, baselineRate, minimumDetectableEffect, alpha = 0.05) {
  const p1 = baselineRate;
  const p2 = baselineRate * (1 + minimumDetectableEffect);
  const n = sampleSize;
  
  const se = Math.sqrt(p1 * (1 - p1) / n + p2 * (1 - p2) / n);
  const zAlpha = normalInverseCDF(1 - alpha / 2);
  const effect = Math.abs(p2 - p1);
  
  const zBeta = effect / se - zAlpha;
  const power = normalCDF(zBeta);
  
  return {
    power: Math.max(0, Math.min(1, power)),
    sampleSize: n,
    baselineRate: p1,
    variantRate: p2,
    minimumDetectableEffect,
    alpha
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate average
 */
function average(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Calculate sample variance
 */
function sampleVariance(arr) {
  if (arr.length < 2) return 0;
  const mean = average(arr);
  const squaredDiffs = arr.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / (arr.length - 1);
}

/**
 * Normal CDF (cumulative distribution function)
 */
function normalCDF(x) {
  // Approximation using error function
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  
  return x > 0 ? 1 - probability : probability;
}

/**
 * Inverse normal CDF (quantile function)
 */
function normalInverseCDF(p) {
  // Rational approximation for inverse normal CDF
  if (p <= 0 || p >= 1) {
    throw new Error('Probability must be between 0 and 1');
  }
  
  const a = [
    -3.969683028665376e+01, 2.209460984245205e+02,
    -2.759285104469687e+02, 1.383577518672690e+02,
    -3.066479806614716e+01, 2.506628277459239e+00
  ];
  
  const b = [
    -5.447609879822406e+01, 1.615858368580409e+02,
    -1.556989798598866e+02, 6.680131188771972e+01,
    -1.328068155288572e+01
  ];
  
  const c = [
    -7.784894002430293e-03, -3.223964580411365e-01,
    -2.400758277161838e+00, -2.549732539343734e+00,
    4.374664141464968e+00, 2.938163982698783e+00
  ];
  
  const d = [
    7.784695709041462e-03, 3.224671290700398e-01,
    2.445134137142996e+00, 3.754408661907416e+00
  ];
  
  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  
  let q, r, x;
  
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
         ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  
  return x;
}

/**
 * Get experiment by ID
 */
function getExperiment(experimentId) {
  return experiments.get(experimentId);
}

/**
 * Get results by experiment ID
 */
function getResults(experimentId) {
  return results.get(experimentId);
}

/**
 * List all experiments
 */
function listExperiments(filters = {}) {
  const allExperiments = Array.from(experiments.values());
  
  let filtered = allExperiments;
  
  if (filters.status) {
    filtered = filtered.filter(exp => exp.status === filters.status);
  }
  
  if (filters.type) {
    filtered = filtered.filter(exp => exp.type === filters.type);
  }
  
  return filtered;
}

/**
 * Update experiment
 */
function updateExperiment(experimentId, updates) {
  const experiment = experiments.get(experimentId);
  
  if (!experiment) {
    throw new Error('Experiment not found');
  }
  
  Object.assign(experiment, updates);
  experiment.updatedAt = new Date().toISOString();
  
  return experiment;
}

/**
 * Start experiment
 */
function startExperiment(experimentId) {
  const experiment = updateExperiment(experimentId, {
    status: 'running',
    startedAt: new Date().toISOString()
  });
  
  const experimentResults = results.get(experimentId);
  experimentResults.startedAt = experiment.startedAt;
  
  return experiment;
}

/**
 * Stop experiment
 */
function stopExperiment(experimentId) {
  return updateExperiment(experimentId, {
    status: 'stopped',
    stoppedAt: new Date().toISOString()
  });
}

module.exports = {
  // Experiment management
  createExperiment,
  getExperiment,
  listExperiments,
  updateExperiment,
  startExperiment,
  stopExperiment,
  
  // Event tracking
  trackEvent,
  getResults,
  
  // Statistical analysis
  frequentistAnalysis,
  bayesianAnalysis,
  sequentialAnalysis,
  
  // Power & sample size
  calculateSampleSize,
  calculatePower,
  
  // Individual tests
  twoProportionZTest,
  tTest,
  
  // Bayesian utilities
  monteCarloComparison,
  betaSample,
  
  // Storage (for testing)
  experiments,
  results
};
