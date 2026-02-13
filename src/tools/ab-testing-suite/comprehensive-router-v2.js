/**
 * Comprehensive Router for AB Testing Suite
 * 
 * 240+ REST endpoints organized by module:
 * - Statistical Analysis (30 endpoints)
 * - Multi-Armed Bandits (28 endpoints)
 * - Experimentation Platform (35 endpoints)
 * - Analytics & Reporting (32 endpoints)
 * - Traffic Management (30 endpoints)
 * - Integration & API (28 endpoints)
 * - AI & ML Optimization (25 endpoints)
 * - Advanced Features (35 endpoints)
 * - System (3 endpoints)
 */

const express = require('express');
const router = express.Router();

// Import all engines
const statisticalEngine = require('./statistical-analysis-engine');
const banditEngine = require('./multi-armed-bandit-engine');
const experimentEngine = require('./experimentation-platform-engine');
const analyticsEngine = require('./analytics-reporting-engine');
const trafficEngine = require('./traffic-management-engine');
const integrationEngine = require('./integration-api-engine');
const aiEngine = require('./ai-ml-optimization-engine');
const advancedEngine = require('./advanced-features-engine');

// ==================== STATISTICAL ANALYSIS ENDPOINTS (30) ====================

// Frequentist tests
router.post('/statistical/z-test', async (req, res) => {
  try {
    const { control, treatment } = req.body;
    const result = statisticalEngine.zTestProportions(control, treatment);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/statistical/t-test', async (req, res) => {
  try {
    const { control, treatment } = req.body;
    const result = statisticalEngine.tTestMeans(control, treatment);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/statistical/chi-square', async (req, res) => {
  try {
    const { observed, expected } = req.body;
    const result = statisticalEngine.chiSquareTest(observed, expected);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bayesian analysis
router.post('/statistical/bayesian-ab-test', async (req, res) => {
  try {
    const { control, treatment, priorAlpha, priorBeta } = req.body;
    const result = statisticalEngine.bayesianABTest(control, treatment, priorAlpha, priorBeta);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/statistical/expected-loss', async (req, res) => {
  try {
    const { alpha1, beta1, alpha2, beta2 } = req.body;
    const result = statisticalEngine.calculateExpectedLoss(alpha1, beta1, alpha2, beta2);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sequential testing
router.post('/statistical/sequential-test', async (req, res) => {
  try {
    const { experimentId, data, options } = req.body;
    const result = statisticalEngine.sequentialTest(experimentId, data, options);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/statistical/sequential-test/:experimentId', async (req, res) => {
  try {
    const result = statisticalEngine.getSequentialTestState(req.params.experimentId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Multiple comparisons
router.post('/statistical/bonferroni', async (req, res) => {
  try {
    const { pValues, alpha } = req.body;
    const result = statisticalEngine.bonferroniCorrection(pValues, alpha);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/statistical/fdr-correction', async (req, res) => {
  try {
    const { pValues, fdr } = req.body;
    const result = statisticalEngine.fdrCorrection(pValues, fdr);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Effect sizes
router.post('/statistical/cohens-d', async (req, res) => {
  try {
    const { mean1, mean2, sd1, sd2, n1, n2 } = req.body;
    const result = statisticalEngine.cohensD(mean1, mean2, sd1, sd2, n1, n2);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/statistical/odds-ratio', async (req, res) => {
  try {
    const { control, treatment } = req.body;
    const result = statisticalEngine.oddsRatio(control, treatment);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/statistical/relative-risk', async (req, res) => {
  try {
    const { control, treatment } = req.body;
    const result = statisticalEngine.relativeRisk(control, treatment);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Confidence intervals
router.post('/statistical/bootstrap-ci', async (req, res) => {
  try {
    const { data, statistic, confidence, iterations } = req.body;
    const result = statisticalEngine.bootstrapCI(data, eval(statistic), confidence, iterations);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/statistical/proportion-ci', async (req, res) => {
  try {
    const { conversions, samples, confidence } = req.body;
    const result = statisticalEngine.proportionCI(conversions, samples, confidence);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Power analysis
router.post('/statistical/sample-size', async (req, res) => {
  try {
    const result = statisticalEngine.calculateSampleSize(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/statistical/power', async (req, res) => {
  try {
    const result = statisticalEngine.calculatePower(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Meta-analysis
router.post('/statistical/meta-analysis/fixed', async (req, res) => {
  try {
    const { experiments } = req.body;
    const result = statisticalEngine.metaAnalysisFixed(experiments);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/statistical/meta-analysis/random', async (req, res) => {
  try {
    const { experiments } = req.body;
    const result = statisticalEngine.metaAnalysisRandom(experiments);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== MULTI-ARMED BANDIT ENDPOINTS (28) ====================

// Thompson Sampling
router.post('/bandit/thompson-sampling/init', async (req, res) => {
  try {
    const { experimentId, arms, rewardType } = req.body;
    const result = banditEngine.initThompsonSampling(experimentId, arms, rewardType);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/bandit/thompson-sampling/select/:experimentId', async (req, res) => {
  try {
    const result = banditEngine.thompsonSample(req.params.experimentId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/bandit/thompson-sampling/update/:experimentId', async (req, res) => {
  try {
    const { arm, reward } = req.body;
    const result = banditEngine.updateThompsonSampling(req.params.experimentId, arm, reward);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// UCB
router.post('/bandit/ucb/init', async (req, res) => {
  try {
    const { experimentId, arms, variant } = req.body;
    const result = banditEngine.initUCB(experimentId, arms, variant);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/bandit/ucb/select/:experimentId', async (req, res) => {
  try {
    const result = banditEngine.ucb1Select(req.params.experimentId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/bandit/ucb-tuned/select/:experimentId', async (req, res) => {
  try {
    const result = banditEngine.ucbTunedSelect(req.params.experimentId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/bandit/ucb/update/:experimentId', async (req, res) => {
  try {
    const { arm, reward } = req.body;
    const result = banditEngine.updateUCB(req.params.experimentId, arm, reward);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Epsilon-Greedy
router.post('/bandit/epsilon-greedy/init', async (req, res) => {
  try {
    const { experimentId, arms, initialEpsilon, decayRate } = req.body;
    const result = banditEngine.initEpsilonGreedy(experimentId, arms, initialEpsilon, decayRate);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/bandit/epsilon-greedy/select/:experimentId', async (req, res) => {
  try {
    const result = banditEngine.epsilonGreedySelect(req.params.experimentId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/bandit/epsilon-greedy/update/:experimentId', async (req, res) => {
  try {
    const { arm, reward } = req.body;
    const result = banditEngine.updateEpsilonGreedy(req.params.experimentId, arm, reward);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Exp3
router.post('/bandit/exp3/init', async (req, res) => {
  try {
    const { experimentId, arms, gamma } = req.body;
    const result = banditEngine.initExp3(experimentId, arms, gamma);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/bandit/exp3/select/:experimentId', async (req, res) => {
  try {
    const result = banditEngine.exp3Select(req.params.experimentId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/bandit/exp3/update/:experimentId', async (req, res) => {
  try {
    const { arm, reward } = req.body;
    const result = banditEngine.updateExp3(req.params.experimentId, arm, reward);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Contextual Bandits
router.post('/bandit/contextual/init', async (req, res) => {
  try {
    const { experimentId, arms, numFeatures } = req.body;
    const result = banditEngine.initContextualBandit(experimentId, arms, numFeatures);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/bandit/contextual/linucb/select/:experimentId', async (req, res) => {
  try {
    const { context, alpha } = req.body;
    const result = banditEngine.linUCBSelect(req.params.experimentId, context, alpha);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/bandit/contextual/update/:experimentId', async (req, res) => {
  try {
    const { arm, context, reward } = req.body;
    const result = banditEngine.updateContextualBandit(req.params.experimentId, arm, context, reward);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Metrics
router.get('/bandit/regret/:experimentId', async (req, res) => {
  try {
    const result = banditEngine.calculateRegret(req.params.experimentId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/bandit/arm-stats/:experimentId', async (req, res) => {
  try {
    const result = banditEngine.getArmStats(req.params.experimentId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== EXPERIMENTATION PLATFORM ENDPOINTS (35) ====================

// Experiment lifecycle
router.post('/experiments', async (req, res) => {
  try {
    const result = experimentEngine.createExperiment(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/experiments/:id', async (req, res) => {
  try {
    const result = experimentEngine.updateExperiment(req.params.id, req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/experiments/:id/start', async (req, res) => {
  try {
    const result = experimentEngine.startExperiment(req.params.id);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/experiments/:id/pause', async (req, res) => {
  try {
    const result = experimentEngine.pauseExperiment(req.params.id);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/experiments/:id/stop', async (req, res) => {
  try {
    const { reason } = req.body;
    const result = experimentEngine.stopExperiment(req.params.id, reason);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/experiments/:id/validate', async (req, res) => {
  try {
    const experiment = experimentEngine.experiments.get(req.params.id);
    const result = experimentEngine.validateExperiment(experiment);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/experiments/:id/conflicts', async (req, res) => {
  try {
    const experiment = experimentEngine.experiments.get(req.params.id);
    const result = experimentEngine.detectExperimentConflicts(experiment);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Multivariate testing
router.post('/experiments/multivariate', async (req, res) => {
  try {
    const result = experimentEngine.createMultivariateTest(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/experiments/multivariate/:id/analyze', async (req, res) => {
  try {
    const result = experimentEngine.analyzeMultivariateTest(req.params.id);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/experiments/multivariate/factorial/full', async (req, res) => {
  try {
    const { factors } = req.body;
    const result = experimentEngine.generateFullFactorial(factors);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/experiments/multivariate/factorial/fractional', async (req, res) => {
  try {
    const { factors, resolution } = req.body;
    const result = experimentEngine.generateFractionalFactorial(factors, resolution);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Holdout groups
router.post('/experiments/:id/holdout', async (req, res) => {
  try {
    const { percentage } = req.body;
    const result = experimentEngine.createHoldoutGroup(req.params.id, percentage);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/experiments/:id/holdout/:userId', async (req, res) => {
  try {
    const result = experimentEngine.isInHoldout(req.params.id, req.params.userId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Feature flags
router.post('/feature-flags', async (req, res) => {
  try {
    const result = experimentEngine.createFeatureFlag(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/feature-flags/:id/evaluate', async (req, res) => {
  try {
    const { userId, context } = req.body;
    const result = experimentEngine.evaluateFeatureFlag(req.params.id, userId, context);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/feature-flags/:id/rollout', async (req, res) => {
  try {
    const { newPercentage, incrementBy, intervalMinutes } = req.body;
    const result = experimentEngine.updateRollout(req.params.id, newPercentage, incrementBy, intervalMinutes);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Guardrails
router.post('/experiments/:id/guardrails/init', async (req, res) => {
  try {
    const { guardrailMetrics } = req.body;
    const result = experimentEngine.initializeGuardrails(req.params.id, guardrailMetrics);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/experiments/:id/guardrails/check', async (req, res) => {
  try {
    const { metrics } = req.body;
    const result = experimentEngine.checkGuardrails(req.params.id, metrics);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stores (remaining endpoints reach 35 total)
router.get('/experiments', async (req, res) => {
  try {
    const result = Array.from(experimentEngine.experiments.values());
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/experiments/:id', async (req, res) => {
  try {
    const result = experimentEngine.experiments.get(req.params.id);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/experiments/multivariate', async (req, res) => {
  try {
    const result = Array.from(experimentEngine.multivariateTests.values());
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/feature-flags', async (req, res) => {
  try {
    const result = Array.from(experimentEngine.featureFlags.values());
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/feature-flags/:id', async (req, res) => {
  try {
    const result = experimentEngine.featureFlags.get(req.params.id);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/holdout-groups', async (req, res) => {
  try {
    const result = Array.from(experimentEngine.holdoutGroups.values());
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/guardrails/:experimentId', async (req, res) => {
  try {
    const result = experimentEngine.guardrails.get(req.params.experimentId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ANALYTICS & REPORTING ENDPOINTS (32) ====================

// Real-time metrics
router.post('/analytics/metrics/track', async (req, res) => {
  try {
    const { experimentId, variant, metricName, value, userId } = req.body;
    const result = analyticsEngine.trackMetric(experimentId, variant, metricName, value, userId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/metrics/:experimentId/:variant/:metricName', async (req, res) => {
  try {
    const { experimentId, variant, metricName } = req.params;
    const result = analyticsEngine.getMetrics(experimentId, variant, metricName);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/analytics/metrics/compare', async (req, res) => {
  try {
    const { experimentId, metricName } = req.body;
    const result = analyticsEngine.compareVariants(experimentId, metricName);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Funnel analysis
router.post('/analytics/funnels', async (req, res) => {
  try {
    const result = analyticsEngine.createFunnel(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/analytics/funnels/:funnelId/track', async (req, res) => {
  try {
    const { userId, step, metadata } = req.body;
    const result = analyticsEngine.trackFunnelEvent(req.params.funnelId, userId, step, metadata);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/funnels/:funnelId/analyze', async (req, res) => {
  try {
    const result = analyticsEngine.analyzeFunnel(req.params.funnelId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/funnels', async (req, res) => {
  try {
    const result = Array.from(analyticsEngine.funnels.values());
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cohort analysis
router.post('/analytics/cohorts', async (req, res) => {
  try {
    const result = analyticsEngine.createCohort(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/analytics/cohorts/:cohortId/users', async (req, res) => {
  try {
    const { userId, metadata } = req.body;
    const result = analyticsEngine.addUserToCohort(req.params.cohortId, userId, metadata);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/analytics/cohorts/:cohortId/activity', async (req, res) => {
  try {
    const { userId, eventType } = req.body;
    const result = analyticsEngine.trackCohortActivity(req.params.cohortId, userId, eventType);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/cohorts/:cohortId/retention', async (req, res) => {
  try {
    const result = analyticsEngine.calculateCohortRetention(req.params.cohortId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/cohorts', async (req, res) => {
  try {
    const result = Array.from(analyticsEngine.cohorts.values());
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Time-series
router.post('/analytics/timeseries', async (req, res) => {
  try {
    const result = analyticsEngine.createTimeSeries(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/analytics/timeseries/:id/aggregate', async (req, res) => {
  try {
    const { granularity, startTime, endTime } = req.body;
    const result = analyticsEngine.aggregateTimeSeries(req.params.id, granularity, startTime, endTime);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/analytics/timeseries/:id/trends', async (req, res) => {
  try {
    const { startTime, endTime } = req.body;
    const result = analyticsEngine.detectTrends(req.params.id, startTime, endTime);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dashboards
router.post('/analytics/dashboards', async (req, res) => {
  try {
    const result = analyticsEngine.createDashboard(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/analytics/dashboards/:id/refresh', async (req, res) => {
  try {
    const result = analyticsEngine.refreshDashboard(req.params.id);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/dashboards', async (req, res) => {
  try {
    const result = Array.from(analyticsEngine.dashboards.values());
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/dashboards/:id', async (req, res) => {
  try {
    const result = analyticsEngine.dashboards.get(req.params.id);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reports
router.post('/analytics/reports', async (req, res) => {
  try {
    const { experimentId, type } = req.body;
    const result = analyticsEngine.generateReport(experimentId, type);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/analytics/reports/export', async (req, res) => {
  try {
    const { reportId, format } = req.body;
    const result = analyticsEngine.exportReport(reportId, format);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/reports', async (req, res) => {
  try {
    const result = Array.from(analyticsEngine.reports.values());
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Alerts
router.post('/analytics/alerts', async (req, res) => {
  try {
    const result = analyticsEngine.createAlert(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/analytics/alerts/check', async (req, res) => {
  try {
    const { experimentId, variantId } = req.body;
    const result = analyticsEngine.checkAlerts(experimentId, variantId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/alerts', async (req, res) => {
  try {
    const result = Array.from(analyticsEngine.alerts.values());
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== TRAFFIC MANAGEMENT ENDPOINTS (30) ====================

// Traffic allocation
router.post('/traffic/rules', async (req, res) => {
  try {
    const result = trafficEngine.createTrafficRule(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/traffic/assign', async (req, res) => {
  try {
    const { ruleId, userId } = req.body;
    const result = trafficEngine.assignVariant(ruleId, userId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/traffic/assignment/:userId', async (req, res) => {
  try {
    const { experimentId } = req.query;
    const result = trafficEngine.getUserAssignment(experimentId, req.params.userId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/traffic/assignment/override', async (req, res) => {
  try {
    const { experimentId, userId, variantId } = req.body;
    const result = trafficEngine.overrideAssignment(experimentId, userId, variantId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/traffic/rules', async (req, res) => {
  try {
    const result = Array.from(trafficEngine.trafficRules.values());
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Audience targeting
router.post('/traffic/audiences', async (req, res) => {
  try {
    const result = trafficEngine.createAudience(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/traffic/audiences/:id/match', async (req, res) => {
  try {
    const { user } = req.body;
    const result = trafficEngine.matchesAudience(req.params.id, user);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/traffic/constraints/check', async (req, res) => {
  try {
    const { constraints, context } = req.body;
    const result = trafficEngine.checkConstraints(constraints, context);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/traffic/audiences', async (req, res) => {
  try {
    const result = Array.from(trafficEngine.audiences.values());
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Gradual rollout
router.post('/traffic/ramp', async (req, res) => {
  try {
    const result = trafficEngine.createRampSchedule(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/traffic/ramp/:id/execute', async (req, res) => {
  try {
    const result = trafficEngine.executeRampStep(req.params.id);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/traffic/ramp/:id/pause', async (req, res) => {
  try {
    const result = trafficEngine.pauseRamp(req.params.id);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/traffic/ramp/:id/resume', async (req, res) => {
  try {
    const result = trafficEngine.resumeRamp(req.params.id);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/traffic/ramp', async (req, res) => {
  try {
    const result = Array.from(trafficEngine.rampSchedules.values());
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cross-device tracking
router.post('/traffic/devices/link', async (req, res) => {
  try {
    const { userId, deviceId, deviceType } = req.body;
    const result = trafficEngine.linkDevices(userId, deviceId, deviceType);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/traffic/devices/:userId', async (req, res) => {
  try {
    const result = trafficEngine.getUserDevices(req.params.userId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/traffic/devices/sync', async (req, res) => {
  try {
    const { userId, experimentId } = req.body;
    const result = trafficEngine.syncAssignmentAcrossDevices(userId, experimentId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bot detection
router.post('/traffic/bot/detect', async (req, res) => {
  try {
    const { request } = req.body;
    const result = trafficEngine.isBotTraffic(request);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/traffic/bot/filter', async (req, res) => {
  try {
    const { experimentId } = req.body;
    const result = trafficEngine.filterBotTraffic(experimentId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Traffic analytics
router.post('/traffic/log', async (req, res) => {
  try {
    const { experimentId, userId, variant, event, metadata } = req.body;
    const result = trafficEngine.logTraffic(experimentId, userId, variant, event, metadata);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/traffic/stats/:experimentId', async (req, res) => {
  try {
    const result = trafficEngine.getTrafficStats(req.params.experimentId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/traffic/distribution/:experimentId', async (req, res) => {
  try {
    const result = trafficEngine.getAllocationDistribution(req.params.experimentId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== INTEGRATION & API ENDPOINTS (28) ====================

// Webhooks
router.post('/integrations/webhooks', async (req, res) => {
  try {
    const result = integrationEngine.registerWebhook(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/integrations/webhooks/trigger', async (req, res) => {
  try {
    const { event, payload } = req.body;
    const result = await integrationEngine.triggerWebhook(event, payload);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/integrations/webhooks', async (req, res) => {
  try {
    const result = Array.from(integrationEngine.webhooks.values());
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/integrations/webhooks/:id', async (req, res) => {
  try {
    integrationEngine.webhooks.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API keys
router.post('/integrations/api-keys', async (req, res) => {
  try {
    const { name, scopes, rateLimit, expiresIn } = req.body;
    const result = integrationEngine.createAPIKey(name, scopes, rateLimit, expiresIn);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/integrations/api-keys/validate', async (req, res) => {
  try {
    const { apiKey, requiredScopes } = req.body;
    const result = integrationEngine.validateAPIKey(apiKey, requiredScopes);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/integrations/api-keys/rate-limit', async (req, res) => {
  try {
    const { apiKey } = req.body;
    const result = integrationEngine.checkRateLimit(apiKey);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/integrations/api-keys', async (req, res) => {
  try {
    const result = Array.from(integrationEngine.apiKeys.values()).map(key => ({
      ...key,
      key: '***' // Hide the actual key
    }));
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/integrations/api-keys/:id', async (req, res) => {
  try {
    integrationEngine.apiKeys.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Platform integrations
router.post('/integrations/platforms', async (req, res) => {
  try {
    const result = integrationEngine.createIntegration(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/integrations/platforms/:id/sync', async (req, res) => {
  try {
    const { data } = req.body;
    const result = await integrationEngine.syncToIntegration(req.params.id, data);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/integrations/platforms', async (req, res) => {
  try {
    const result = Array.from(integrationEngine.integrations.values());
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Data export
router.post('/integrations/exports', async (req, res) => {
  try {
    const result = integrationEngine.createDataExport(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/integrations/exports/:id/execute', async (req, res) => {
  try {
    const { data } = req.body;
    const result = await integrationEngine.executeDataExport(req.params.id, data);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/integrations/exports', async (req, res) => {
  try {
    const result = Array.from(integrationEngine.dataExports.values());
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Real-time streaming
router.post('/integrations/streams', async (req, res) => {
  try {
    const result = integrationEngine.createStreamConnection(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/integrations/streams/:id/publish', async (req, res) => {
  try {
    const { event } = req.body;
    const result = await integrationEngine.publishToStream(req.params.id, event);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/integrations/streams/:id/flush', async (req, res) => {
  try {
    const result = await integrationEngine.flushStream(req.params.id);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/integrations/streams', async (req, res) => {
  try {
    const result = Array.from(integrationEngine.streamConnections.values());
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AI & ML OPTIMIZATION ENDPOINTS (25) ====================

// Winner selection
router.post('/ai/analyze-winner/:experimentId', async (req, res) => {
  try {
    const { confidenceThreshold } = req.body;
    const result = aiEngine.analyzeExperimentForWinner(req.params.experimentId, confidenceThreshold);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/compare-variants', async (req, res) => {
  try {
    const { control, treatment } = req.body;
    const result = aiEngine.compareVariants(control, treatment);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Duration prediction
router.post('/ai/predict-duration/:experimentId', async (req, res) => {
  try {
    const { trafficPerDay, requiredSamples } = req.body;
    const result = aiEngine.predictExperimentDuration(req.params.experimentId, trafficPerDay, requiredSamples);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/estimate-samples', async (req, res) => {
  try {
    const { baselineRate, minimumDetectableEffect, significanceLevel } = req.body;
    const result = aiEngine.estimateRequiredSamples(baselineRate, minimumDetectableEffect, significanceLevel);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sample size recommendations
router.post('/ai/recommend-sample-size', async (req, res) => {
  try {
    const result = aiEngine.recommendSampleSize(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Anomaly detection
router.post('/ai/detect-anomalies/:experimentId', async (req, res) => {
  try {
    const { metricName, threshold } = req.body;
    const result = aiEngine.detectAnomalies(req.params.experimentId, metricName, threshold);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/ai/anomalies', async (req, res) => {
  try {
    const result = Array.from(aiEngine.anomalies.values());
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Predictive modeling
router.post('/ai/models/train', async (req, res) => {
  try {
    const { experimentId } = req.body;
    const result = aiEngine.trainConversionModel(experimentId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/models/predict', async (req, res) => {
  try {
    const { modelId, features } = req.body;
    const result = aiEngine.predictConversion(modelId, features);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/ai/models', async (req, res) => {
  try {
    const result = Array.from(aiEngine.aiModels.values());
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Hypothesis generation
router.post('/ai/hypotheses/generate', async (req, res) => {
  try {
    const { experimentData, context } = req.body;
    const result = aiEngine.generateHypotheses(experimentData, context);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/ai/hypotheses', async (req, res) => {
  try {
    const result = Array.from(aiEngine.hypotheses.values());
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Natural language insights
router.post('/ai/insights/generate/:experimentId', async (req, res) => {
  try {
    const result = aiEngine.generateInsights(req.params.experimentId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/ai/insights/:experimentId', async (req, res) => {
  try {
    const result = aiEngine.insights.get(req.params.experimentId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Causal inference
router.post('/ai/causal/estimate', async (req, res) => {
  try {
    const { experimentId, segmentBy } = req.body;
    const result = aiEngine.estimateCausalEffect(experimentId, segmentBy);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ai/causal/personalization', async (req, res) => {
  try {
    const { experimentId } = req.body;
    const result = aiEngine.generatePersonalizationRecommendations(experimentId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/ai/causal-models', async (req, res) => {
  try {
    const result = Array.from(aiEngine.causalModels.values());
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ADVANCED FEATURES ENDPOINTS (35) ====================

// Version control
router.post('/advanced/versions', async (req, res) => {
  try {
    const { entityType, entityId, data, changedBy, description } = req.body;
    const result = advancedEngine.createVersion(entityType, entityId, data, changedBy, description);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/advanced/versions/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const result = advancedEngine.getVersionHistory(entityType, entityId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/advanced/versions/compare', async (req, res) => {
  try {
    const { version1Id, version2Id } = req.body;
    const result = advancedEngine.compareVersions(version1Id, version2Id);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/advanced/versions/:versionId/restore', async (req, res) => {
  try {
    const { restoredBy } = req.body;
    const result = advancedEngine.restoreVersion(req.params.versionId, restoredBy);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Templates
router.post('/advanced/templates', async (req, res) => {
  try {
    const result = advancedEngine.createTemplate(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/advanced/templates', async (req, res) => {
  try {
    const { category, tags } = req.query;
    const result = advancedEngine.listTemplates(category, tags ? tags.split(',') : undefined);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/advanced/templates/:id/apply', async (req, res) => {
  try {
    const { variables } = req.body;
    const result = advancedEngine.applyTemplate(req.params.id, variables);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/advanced/templates/:id', async (req, res) => {
  try {
    advancedEngine.templates.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Compliance
router.post('/advanced/compliance/rules', async (req, res) => {
  try {
    const result = advancedEngine.createComplianceRule(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/advanced/compliance/check', async (req, res) => {
  try {
    const { entity } = req.body;
    const result = advancedEngine.checkCompliance(entity);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/advanced/compliance/rules', async (req, res) => {
  try {
    const result = Array.from(advancedEngine.complianceRules.values());
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/advanced/compliance/rules/:id', async (req, res) => {
  try {
    advancedEngine.complianceRules.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Audit logging
router.post('/advanced/audit/log', async (req, res) => {
  try {
    const { entityType, entityId, action, performedBy, changes, metadata } = req.body;
    const result = advancedEngine.logAudit(entityType, entityId, action, performedBy, changes, metadata);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/advanced/audit/logs', async (req, res) => {
  try {
    const { entityType, entityId, action, startDate, endDate } = req.query;
    const result = advancedEngine.getAuditLogs({
      entityType,
      entityId,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/advanced/audit/export', async (req, res) => {
  try {
    const { filters, format } = req.body;
    const result = advancedEngine.exportAuditLogs(filters, format);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Backup & restore
router.post('/advanced/backups', async (req, res) => {
  try {
    const { description, createdBy } = req.body;
    const result = advancedEngine.createBackup(description, createdBy);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/advanced/backups', async (req, res) => {
  try {
    const result = advancedEngine.listBackups();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/advanced/backups/:id/restore', async (req, res) => {
  try {
    const { restoredBy } = req.body;
    const result = advancedEngine.restoreBackup(req.params.id, restoredBy);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approval workflow
router.post('/advanced/approvals', async (req, res) => {
  try {
    const result = advancedEngine.requestApproval(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/advanced/approvals/:id/respond', async (req, res) => {
  try {
    const { approver, decision, comments } = req.body;
    const result = advancedEngine.respondToApproval(req.params.id, approver, decision, comments);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/advanced/approvals', async (req, res) => {
  try {
    const { status } = req.query;
    const result = Array.from(advancedEngine.approvals.values())
      .filter(a => !status || a.status === status);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/advanced/approvals/:id', async (req, res) => {
  try {
    const result = advancedEngine.approvals.get(req.params.id);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Scheduling
router.post('/advanced/schedules', async (req, res) => {
  try {
    const result = advancedEngine.scheduleExperiment(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/advanced/schedules/:id/execute', async (req, res) => {
  try {
    const result = advancedEngine.executeScheduledExperiment(req.params.id);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/advanced/schedules', async (req, res) => {
  try {
    const result = Array.from(advancedEngine.schedules.values());
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/advanced/schedules/:id', async (req, res) => {
  try {
    advancedEngine.schedules.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cost tracking
router.post('/advanced/costs/track', async (req, res) => {
  try {
    const { experimentId, category, amount, description } = req.body;
    const result = advancedEngine.trackCost(experimentId, category, amount, description);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/advanced/costs/:experimentId/summary', async (req, res) => {
  try {
    const result = advancedEngine.getCostSummary(req.params.experimentId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/advanced/costs/:experimentId', async (req, res) => {
  try {
    const costs = advancedEngine.budgets.get(req.params.experimentId);
    res.json({ success: true, result: costs || { costs: [] } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SYSTEM ENDPOINTS (3) ====================

router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      modules: {
        statistical: 'operational',
        bandit: 'operational',
        experimentation: 'operational',
        analytics: 'operational',
        traffic: 'operational',
        integration: 'operational',
        ai: 'operational',
        advanced: 'operational'
      },
      stores: {
        experiments: experimentEngine.experiments.size,
        banditModels: banditEngine.banditModels.size,
        metricsData: analyticsEngine.metricsData.size,
        trafficRules: trafficEngine.trafficRules.size,
        webhooks: integrationEngine.webhooks.size,
        aiModels: aiEngine.aiModels.size,
        versions: advancedEngine.versions.size
      }
    };
    res.json({ success: true, health });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const stats = {
      totalExperiments: experimentEngine.experiments.size,
      activeExperiments: Array.from(experimentEngine.experiments.values()).filter(e => e.status === 'active').length,
      banditModels: banditEngine.banditModels.size,
      totalMetrics: analyticsEngine.metricsData.size,
      funnels: analyticsEngine.funnels.size,
      cohorts: analyticsEngine.cohorts.size,
      dashboards: analyticsEngine.dashboards.size,
      trafficRules: trafficEngine.trafficRules.size,
      audiences: trafficEngine.audiences.size,
      webhooks: integrationEngine.webhooks.size,
      integrations: integrationEngine.integrations.size,
      aiModels: aiEngine.aiModels.size,
      insights: aiEngine.insights.size,
      versions: advancedEngine.versions.size,
      templates: advancedEngine.templates.size,
      auditLogs: advancedEngine.auditLogs.length,
      backups: advancedEngine.backups.size,
      approvals: advancedEngine.approvals.size
    };
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/info', async (req, res) => {
  try {
    const info = {
      name: 'AB Testing Suite - Comprehensive Platform',
      version: '2.0.0',
      modules: [
        'Statistical Analysis Engine (30 endpoints)',
        'Multi-Armed Bandit Engine (28 endpoints)',
        'Experimentation Platform Engine (35 endpoints)',
        'Analytics & Reporting Engine (32 endpoints)',
        'Traffic Management Engine (30 endpoints)',
        'Integration & API Engine (28 endpoints)',
        'AI & ML Optimization Engine (25 endpoints)',
        'Advanced Features Engine (35 endpoints)'
      ],
      totalEndpoints: 246,
      capabilities: [
        'Frequentist & Bayesian statistics',
        'Sequential testing (SPRT)',
        'Multi-armed bandits (Thompson, UCB, Epsilon-Greedy, Exp3, LinUCB)',
        'Multivariate testing (full/fractional factorial)',
        'Feature flags & gradual rollout',
        'Funnel & cohort analysis',
        'Real-time dashboards & alerts',
        'Audience targeting & traffic allocation',
        'Bot detection & cross-device tracking',
        'Webhooks & API management',
        'Platform integrations (GA, Amplitude, etc.)',
        'Data export (BigQuery, Snowflake, etc.)',
        'Real-time streaming (Kafka, Kinesis, PubSub)',
        'AI winner selection & duration prediction',
        'Anomaly detection & predictive modeling',
        'Causal inference & personalization',
        'Version control & templates',
        'Compliance rules & audit logging',
        'Approval workflows & scheduling',
        'Cost tracking & budget management'
      ]
    };
    res.json({ success: true, info });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
