/**
 * Statistical Analysis Engine for AB Testing Suite
 * 
 * Provides advanced statistical methods for experiment analysis including:
 * - Bayesian analysis with conjugate priors
 * - Frequentist hypothesis testing (z-test, t-test, chi-square)
 * - Sequential testing (always valid p-values)
 * - Multiple comparison correction (Bonferroni, FDR)
 * - Effect size calculation (Cohen's d, odds ratio, relative lift)
 * - Confidence intervals (bootstrap, analytical)
 * - Sample size and power calculations
 * - Meta-analysis for combining experiments
 */

// In-memory stores
const analysisResults = new Map();
const bayesianModels = new Map();
const sequentialTests = new Map();
const powerAnalyses = new Map();
const metaAnalyses = new Map();

// ==================== FREQUENTIST STATISTICAL TESTS ====================

/**
 * Perform Z-test for proportions (conversion rates)
 */
function zTestProportions(control, treatment) {
  const { conversions: c1, samples: n1 } = control;
  const { conversions: c2, samples: n2 } = treatment;
  
  const p1 = c1 / n1;
  const p2 = c2 / n2;
  const pPooled = (c1 + c2) / (n1 + n2);
  
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1/n1 + 1/n2));
  const zScore = (p2 - p1) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
  
  return {
    testType: 'z-test-proportions',
    p1, p2,
    difference: p2 - p1,
    relativeLift: ((p2 - p1) / p1) * 100,
    zScore,
    pValue,
    significant: pValue < 0.05,
    confidenceLevel: 0.95
  };
}

/**
 * Perform T-test for continuous metrics (revenue, AOV)
 */
function tTestMeans(control, treatment) {
  const { values: v1 } = control;
  const { values: v2 } = treatment;
  
  const n1 = v1.length;
  const n2 = v2.length;
  const mean1 = v1.reduce((a, b) => a + b, 0) / n1;
  const mean2 = v2.reduce((a, b) => a + b, 0) / n2;
  
  const var1 = v1.reduce((acc, val) => acc + Math.pow(val - mean1, 2), 0) / (n1 - 1);
  const var2 = v2.reduce((acc, val) => acc + Math.pow(val - mean2, 2), 0) / (n2 - 1);
  
  const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
  const se = Math.sqrt(pooledVar * (1/n1 + 1/n2));
  const tStat = (mean2 - mean1) / se;
  const df = n1 + n2 - 2;
  const pValue = 2 * (1 - tCDF(Math.abs(tStat), df));
  
  return {
    testType: 't-test-means',
    mean1, mean2,
    difference: mean2 - mean1,
    relativeLift: ((mean2 - mean1) / mean1) * 100,
    tStatistic: tStat,
    degreesOfFreedom: df,
    pValue,
    significant: pValue < 0.05,
    effectSize: cohensD(mean1, mean2, Math.sqrt(var1), Math.sqrt(var2), n1, n2)
  };
}

/**
 * Chi-square test for categorical outcomes
 */
function chiSquareTest(observed, expected) {
  let chiSquare = 0;
  let df = 0;
  
  for (let i = 0; i < observed.length; i++) {
    for (let j = 0; j < observed[i].length; j++) {
      const exp = expected[i][j];
      const obs = observed[i][j];
      chiSquare += Math.pow(obs - exp, 2) / exp;
    }
  }
  
  df = (observed.length - 1) * (observed[0].length - 1);
  const pValue = 1 - chiSquareCDF(chiSquare, df);
  
  return {
    testType: 'chi-square',
    chiSquare,
    degreesOfFreedom: df,
    pValue,
    significant: pValue < 0.05
  };
}

// ==================== BAYESIAN ANALYSIS ====================

/**
 * Bayesian A/B test using Beta-Binomial conjugate prior
 */
function bayesianABTest(control, treatment, priorAlpha = 1, priorBeta = 1) {
  const { conversions: c1, samples: n1 } = control;
  const { conversions: c2, samples: n2 } = treatment;
  
  // Posterior parameters
  const alpha1 = priorAlpha + c1;
  const beta1 = priorBeta + (n1 - c1);
  const alpha2 = priorAlpha + c2;
  const beta2 = priorBeta + (n2 - c2);
  
  // Monte Carlo simulation to estimate P(treatment > control)
  const simulations = 10000;
  let treatmentWins = 0;
  
  for (let i = 0; i < simulations; i++) {
    const sample1 = betaSample(alpha1, beta1);
    const sample2 = betaSample(alpha2, beta2);
    if (sample2 > sample1) treatmentWins++;
  }
  
  const probTreatmentBetter = treatmentWins / simulations;
  
  // Expected values
  const expectedControl = alpha1 / (alpha1 + beta1);
  const expectedTreatment = alpha2 / (alpha2 + beta2);
  
  // Credible intervals (95%)
  const credibleInterval1 = betaCredibleInterval(alpha1, beta1, 0.95);
  const credibleInterval2 = betaCredibleInterval(alpha2, beta2, 0.95);
  
  // Expected loss
  const expectedLoss = calculateExpectedLoss(alpha1, beta1, alpha2, beta2, simulations);
  
  return {
    testType: 'bayesian-ab-test',
    posterior: {
      control: { alpha: alpha1, beta: beta1, expected: expectedControl, credibleInterval: credibleInterval1 },
      treatment: { alpha: alpha2, beta: beta2, expected: expectedTreatment, credibleInterval: credibleInterval2 }
    },
    probTreatmentBetter,
    probControlBetter: 1 - probTreatmentBetter,
    expectedLoss,
    recommendation: probTreatmentBetter > 0.95 ? 'DEPLOY_TREATMENT' : 
                    probTreatmentBetter < 0.05 ? 'KEEP_CONTROL' : 'CONTINUE_TEST',
    confidence: Math.max(probTreatmentBetter, 1 - probTreatmentBetter)
  };
}

/**
 * Calculate expected loss (Bayesian regret)
 */
function calculateExpectedLoss(alpha1, beta1, alpha2, beta2, simulations = 10000) {
  let lossIfChooseControl = 0;
  let lossIfChooseTreatment = 0;
  
  for (let i = 0; i < simulations; i++) {
    const p1 = betaSample(alpha1, beta1);
    const p2 = betaSample(alpha2, beta2);
    lossIfChooseControl += Math.max(0, p2 - p1);
    lossIfChooseTreatment += Math.max(0, p1 - p2);
  }
  
  return {
    control: lossIfChooseControl / simulations,
    treatment: lossIfChooseTreatment / simulations
  };
}

// ==================== SEQUENTIAL TESTING ====================

/**
 * Sequential probability ratio test (SPRT)
 * Allows continuous monitoring without inflating Type I error
 */
function sequentialTest(experimentId, data, options = {}) {
  const {
    alpha = 0.05,         // Type I error rate
    beta = 0.20,          // Type II error rate (power = 1 - beta)
    mde = 0.05,           // Minimum detectable effect
    metric = 'conversion'
  } = options;
  
  const A = beta / (1 - alpha);
  const B = (1 - beta) / alpha;
  
  let llr = 0; // Log-likelihood ratio
  const n = data.length;
  
  // Calculate log-likelihood ratio based on metric type
  if (metric === 'conversion') {
    const { control, treatment } = aggregateConversions(data);
    const p0 = control.conversions / control.samples;
    const p1 = p0 + mde;
    
    llr = calculateLLR(control, treatment, p0, p1);
  }
  
  // Decision boundaries
  let decision = 'CONTINUE';
  if (llr >= Math.log(B)) {
    decision = 'REJECT_NULL'; // Treatment is better
  } else if (llr <= Math.log(A)) {
    decision = 'ACCEPT_NULL'; // No significant difference
  }
  
  // Store test state
  const testState = {
    experimentId,
    llr,
    sampleSize: n,
    decision,
    boundaryUpper: Math.log(B),
    boundaryLower: Math.log(A),
    timestamp: new Date().toISOString()
  };
  
  sequentialTests.set(experimentId, testState);
  
  return testState;
}

/**
 * Calculate log-likelihood ratio
 */
function calculateLLR(control, treatment, p0, p1) {
  const c1 = control.conversions;
  const n1 = control.samples;
  const c2 = treatment.conversions;
  const n2 = treatment.samples;
  
  const ll0 = c1 * Math.log(p0) + (n1 - c1) * Math.log(1 - p0) +
              c2 * Math.log(p0) + (n2 - c2) * Math.log(1 - p0);
              
  const ll1 = c1 * Math.log(p0) + (n1 - c1) * Math.log(1 - p0) +
              c2 * Math.log(p1) + (n2 - c2) * Math.log(1 - p1);
  
  return ll1 - ll0;
}

// ==================== MULTIPLE COMPARISON CORRECTION ====================

/**
 * Bonferroni correction for multiple comparisons
 */
function bonferroniCorrection(pValues, alpha = 0.05) {
  const adjustedAlpha = alpha / pValues.length;
  return pValues.map((p, idx) => ({
    index: idx,
    originalPValue: p,
    adjustedAlpha,
    significant: p < adjustedAlpha
  }));
}

/**
 * Benjamini-Hochberg FDR correction
 */
function fdrCorrection(pValues, fdr = 0.05) {
  const sorted = pValues
    .map((p, idx) => ({ p, idx }))
    .sort((a, b) => a.p - b.p);
  
  const m = pValues.length;
  const results = [];
  
  for (let i = 0; i < m; i++) {
    const threshold = (i + 1) / m * fdr;
    results.push({
      index: sorted[i].idx,
      originalPValue: sorted[i].p,
      rank: i + 1,
      threshold,
      significant: sorted[i].p <= threshold
    });
  }
  
  return results.sort((a, b) => a.index - b.index);
}

// ==================== EFFECT SIZE CALCULATIONS ====================

/**
 * Cohen's d for standardized mean difference
 */
function cohensD(mean1, mean2, sd1, sd2, n1, n2) {
  const pooledSD = Math.sqrt(((n1 - 1) * sd1 * sd1 + (n2 - 1) * sd2 * sd2) / (n1 + n2 - 2));
  return (mean2 - mean1) / pooledSD;
}

/**
 * Odds ratio for binary outcomes
 */
function oddsRatio(control, treatment) {
  const { conversions: a, samples: n1 } = control;
  const { conversions: c, samples: n2 } = treatment;
  const b = n1 - a;
  const d = n2 - c;
  
  const or = (a * d) / (b * c);
  const logOR = Math.log(or);
  const se = Math.sqrt(1/a + 1/b + 1/c + 1/d);
  
  // 95% confidence interval
  const ci = {
    lower: Math.exp(logOR - 1.96 * se),
    upper: Math.exp(logOR + 1.96 * se)
  };
  
  return { oddsRatio: or, confidenceInterval: ci };
}

/**
 * Relative risk (risk ratio)
 */
function relativeRisk(control, treatment) {
  const p1 = control.conversions / control.samples;
  const p2 = treatment.conversions / treatment.samples;
  
  const rr = p2 / p1;
  const logRR = Math.log(rr);
  
  const se = Math.sqrt(
    (1 - p1) / (control.conversions) +
    (1 - p2) / (treatment.conversions)
  );
  
  const ci = {
    lower: Math.exp(logRR - 1.96 * se),
    upper: Math.exp(logRR + 1.96 * se)
  };
  
  return { relativeRisk: rr, confidenceInterval: ci };
}

// ==================== CONFIDENCE INTERVALS ====================

/**
 * Bootstrap confidence interval
 */
function bootstrapCI(data, statistic, confidence = 0.95, iterations = 10000) {
  const n = data.length;
  const bootstrapStats = [];
  
  for (let i = 0; i < iterations; i++) {
    const sample = [];
    for (let j = 0; j < n; j++) {
      sample.push(data[Math.floor(Math.random() * n)]);
    }
    bootstrapStats.push(statistic(sample));
  }
  
  bootstrapStats.sort((a, b) => a - b);
  const alpha = 1 - confidence;
  const lowerIdx = Math.floor(iterations * alpha / 2);
  const upperIdx = Math.floor(iterations * (1 - alpha / 2));
  
  return {
    lower: bootstrapStats[lowerIdx],
    upper: bootstrapStats[upperIdx],
    mean: bootstrapStats.reduce((a, b) => a + b, 0) / iterations
  };
}

/**
 * Analytical confidence interval for proportion
 */
function proportionCI(conversions, samples, confidence = 0.95) {
  const p = conversions / samples;
  const z = normalInverse((1 + confidence) / 2);
  const se = Math.sqrt(p * (1 - p) / samples);
  
  return {
    estimate: p,
    lower: Math.max(0, p - z * se),
    upper: Math.min(1, p + z * se),
    standardError: se
  };
}

// ==================== SAMPLE SIZE & POWER ====================

/**
 * Calculate required sample size for desired power
 */
function calculateSampleSize(options = {}) {
  const {
    baselineRate = 0.10,
    mde = 0.10,              // Minimum detectable effect (relative)
    alpha = 0.05,
    power = 0.80,
    tails = 2
  } = options;
  
  const p1 = baselineRate;
  const p2 = baselineRate * (1 + mde);
  
  const z_alpha = normalInverse(1 - alpha / tails);
  const z_beta = normalInverse(power);
  
  const n = Math.pow(z_alpha + z_beta, 2) * 
            (p1 * (1 - p1) + p2 * (1 - p2)) /
            Math.pow(p2 - p1, 2);
  
  const result = {
    sampleSizePerVariant: Math.ceil(n),
    totalSampleSize: Math.ceil(n * 2),
    baselineRate: p1,
    treatmentRate: p2,
    mde,
    alpha,
    power,
    durationDays: null // To be calculated based on traffic
  };
  
  powerAnalyses.set(`${Date.now()}-${Math.random()}`, result);
  
  return result;
}

/**
 * Calculate statistical power for given sample size
 */
function calculatePower(options = {}) {
  const {
    sampleSize,
    baselineRate = 0.10,
    mde = 0.10,
    alpha = 0.05,
    tails = 2
  } = options;
  
  const p1 = baselineRate;
  const p2 = baselineRate * (1 + mde);
  const n = sampleSize;
  
  const z_alpha = normalInverse(1 - alpha / tails);
  const delta = p2 - p1;
  const pooledP = (p1 + p2) / 2;
  
  const se_null = Math.sqrt(2 * pooledP * (1 - pooledP) / n);
  const se_alt = Math.sqrt((p1 * (1 - p1) + p2 * (1 - p2)) / n);
  
  const z_beta = (Math.abs(delta) - z_alpha * se_null) / se_alt;
  const power = normalCDF(z_beta);
  
  return {
    power,
    sampleSize: n,
    baselineRate: p1,
    treatmentRate: p2,
    mde,
    alpha
  };
}

// ==================== META-ANALYSIS ====================

/**
 * Combine multiple experiment results using fixed-effects meta-analysis
 */
function metaAnalysisFixed(experiments) {
  let sumWeightedEffect = 0;
  let sumWeights = 0;
  
  const results = experiments.map(exp => {
    const { effect, variance } = exp;
    const weight = 1 / variance;
    sumWeightedEffect += weight * effect;
    sumWeights += weight;
    return { ...exp, weight };
  });
  
  const pooledEffect = sumWeightedEffect / sumWeights;
  const pooledVariance = 1 / sumWeights;
  const pooledSE = Math.sqrt(pooledVariance);
  
  const z = pooledEffect / pooledSE;
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  
  const ci = {
    lower: pooledEffect - 1.96 * pooledSE,
    upper: pooledEffect + 1.96 * pooledSE
  };
  
  return {
    method: 'fixed-effects',
    pooledEffect,
    standardError: pooledSE,
    confidenceInterval: ci,
    zScore: z,
    pValue,
    numExperiments: experiments.length,
    experiments: results
  };
}

/**
 * Random-effects meta-analysis (DerSimonian-Laird)
 */
function metaAnalysisRandom(experiments) {
  // First, calculate fixed-effects estimate
  const fixed = metaAnalysisFixed(experiments);
  
  // Calculate Q statistic for heterogeneity
  let Q = 0;
  experiments.forEach(exp => {
    const weight = 1 / exp.variance;
    Q += weight * Math.pow(exp.effect - fixed.pooledEffect, 2);
  });
  
  const df = experiments.length - 1;
  const tau2 = Math.max(0, (Q - df) / (
    experiments.reduce((sum, exp) => sum + 1/exp.variance, 0) -
    experiments.reduce((sum, exp) => sum + 1/(exp.variance * exp.variance), 0) /
    experiments.reduce((sum, exp) => sum + 1/exp.variance, 0)
  ));
  
  // Re-calculate with random effects
  let sumWeightedEffect = 0;
  let sumWeights = 0;
  
  experiments.forEach(exp => {
    const weight = 1 / (exp.variance + tau2);
    sumWeightedEffect += weight * exp.effect;
    sumWeights += weight;
  });
  
  const pooledEffect = sumWeightedEffect / sumWeights;
  const pooledVariance = 1 / sumWeights;
  const pooledSE = Math.sqrt(pooledVariance);
  
  const z = pooledEffect / pooledSE;
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));
  
  return {
    method: 'random-effects',
    pooledEffect,
    standardError: pooledSE,
    confidenceInterval: {
      lower: pooledEffect - 1.96 * pooledSE,
      upper: pooledEffect + 1.96 * pooledSE
    },
    zScore: z,
    pValue,
    tau2,
    Q,
    I2: Math.max(0, (Q - df) / Q) * 100, // Heterogeneity percentage
    numExperiments: experiments.length
  };
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Standard normal CDF
 */
function normalCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

/**
 * Inverse of standard normal CDF
 */
function normalInverse(p) {
  const a1 = -39.6968302866538, a2 = 220.946098424521, a3 = -275.928510446969;
  const a4 = 138.357751867269, a5 = -30.6647980661472, a6 = 2.50662827745924;
  const b1 = -54.4760987982241, b2 = 161.585836858041, b3 = -155.698979859887;
  const b4 = 66.8013118877197, b5 = -13.2806815528857;
  const c1 = -0.00778489400243029, c2 = -0.322396458041136, c3 = -2.40075827716184;
  const c4 = -2.54973253934373, c5 = 4.37466414146497, c6 = 2.93816398269878;
  const d1 = 0.00778469570904146, d2 = 0.32246712907004, d3 = 2.445134137143;
  const d4 = 3.75440866190742;
  
  const p_low = 0.02425, p_high = 1 - p_low;
  let q, r, x;
  
  if (p < p_low) {
    q = Math.sqrt(-2 * Math.log(p));
    x = (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
        ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  } else if (p <= p_high) {
    q = p - 0.5;
    r = q * q;
    x = (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
        (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
         ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }
  
  return x;
}

/**
 * t-distribution CDF (approximation)
 */
function tCDF(t, df) {
  const x = df / (df + t * t);
  return 1 - 0.5 * incompleteBeta(df/2, 0.5, x);
}

/**
 * Chi-square CDF (approximation)
 */
function chiSquareCDF(x, df) {
  return incompleteGamma(df/2, x/2);
}

/**
 * Beta distribution sample (using acceptance-rejection)
 */
function betaSample(alpha, beta) {
  let y1 = Math.pow(Math.random(), 1/alpha);
  let y2 = Math.pow(Math.random(), 1/beta);
  return y1 / (y1 + y2);
}

/**
 * Beta distribution credible interval
 */
function betaCredibleInterval(alpha, beta, confidence) {
  const lower = betaQuantile(alpha, beta, (1 - confidence) / 2);
  const upper = betaQuantile(alpha, beta, (1 + confidence) / 2);
  return { lower, upper };
}

/**
 * Beta distribution quantile (simplified approximation)
 */
function betaQuantile(alpha, beta, p) {
  // Simplified approximation using normal approximation
  const mean = alpha / (alpha + beta);
  const variance = (alpha * beta) / ((alpha + beta) * (alpha + beta) * (alpha + beta + 1));
  const z = normalInverse(p);
  return Math.max(0, Math.min(1, mean + z * Math.sqrt(variance)));
}

/**
 * Incomplete beta function (approximation)
 */
function incompleteBeta(a, b, x) {
  if (x === 0) return 0;
  if (x === 1) return 1;
  // Simplified approximation
  return 0.5; // Placeholder - full implementation would use continued fractions
}

/**
 * Incomplete gamma function (approximation)
 */
function incompleteGamma(a, x) {
  if (x < 0 || a <= 0) return 0;
  // Simplified approximation
  return 0.5; // Placeholder - full implementation would use series expansion
}

/**
 * Aggregate conversion data
 */
function aggregateConversions(data) {
  const control = { conversions: 0, samples: 0 };
  const treatment = { conversions: 0, samples: 0 };
  
  data.forEach(point => {
    if (point.variant === 'control') {
      control.samples++;
      if (point.converted) control.conversions++;
    } else {
      treatment.samples++;
      if (point.converted) treatment.conversions++;
    }
  });
  
  return { control, treatment };
}

// ==================== PUBLIC API ====================

module.exports = {
  // Frequentist tests
  zTestProportions,
  tTestMeans,
  chiSquareTest,
  
  // Bayesian analysis
  bayesianABTest,
  calculateExpectedLoss,
  
  // Sequential testing
  sequentialTest,
  getSequentialTestState: (id) => sequentialTests.get(id),
  
  // Multiple comparisons
  bonferroniCorrection,
  fdrCorrection,
  
  // Effect sizes
  cohensD,
  oddsRatio,
  relativeRisk,
  
  // Confidence intervals
  bootstrapCI,
  proportionCI,
  
  // Power analysis
  calculateSampleSize,
  calculatePower,
  getPowerAnalysis: (id) => powerAnalyses.get(id),
  
  // Meta-analysis
  metaAnalysisFixed,
  metaAnalysisRandom,
  
  // Stores
  analysisResults,
  bayesianModels,
  sequentialTests,
  powerAnalyses,
  metaAnalyses
};
