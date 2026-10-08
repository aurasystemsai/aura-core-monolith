const express = require('express');
const experimentEngine = require('./experiment-engine');
const variantManager = require('./variant-manager');
const trafficAllocator = require('./traffic-allocator');

const router = express.Router();
let config = { defaultConfidenceLevel: 0.95, defaultPower: 0.8 };

// Every experiment belongs to the shop in the verified session; other shops' experiments are invisible.
const shopOf = (req) => String(req.headers['x-shopify-shop-domain'] || 'local').toLowerCase();
const mine = (req) => experimentEngine.listExperiments().filter((e) => e.shop === shopOf(req));
const ok = (res, data, status = 200) => res.status(status).json({ success: true, data, result: data });
const fail = (res, status, error) => res.status(status).json({ success: false, error });
function normalCdf(value) {
  const x = Math.abs(value);
  const t = 1 / (1 + 0.2316419 * x);
  const density = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  const tail = density * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return value >= 0 ? 1 - tail : tail;
}
function calculateSampleSize(input = {}) {
  const { baselineRate, minimumDetectableEffect, alpha = 0.05, power = 0.8, numVariants = 2 } = input;
  const p = Number(baselineRate);
  const effect = Number(minimumDetectableEffect);
  if (!(p > 0 && p < 1) || !(effect > 0 && p * (1 + effect) < 1) || !(alpha > 0 && alpha < 1) || !(power > 0 && power < 1) || !(numVariants >= 2)) {
    return { error: 'Valid baselineRate, minimumDetectableEffect, alpha, power and numVariants are required' };
  }
  const zAlpha = 1.96;
  const zPower = 0.84;
  const treatment = p * (1 + effect);
  const pooled = (p + treatment) / 2;
  const perVariant = Math.ceil(((zAlpha * Math.sqrt(2 * pooled * (1 - pooled)) + zPower * Math.sqrt(p * (1 - p) + treatment * (1 - treatment))) ** 2) / ((treatment - p) ** 2));
  return { sampleSizePerVariant: perVariant, totalSampleSize: perVariant * Number(numVariants), alpha: Number(alpha), power: Number(power) };
}
const requireExperiment = (req, res, next) => {
  const experiment = experimentEngine.getExperiment(req.params.id);
  if (!experiment || experiment.shop !== shopOf(req)) return fail(res, 404, 'Experiment not found');
  req.experiment = experiment;
  next();
};
const requireVariant = (req, res, next) => {
  const variant = variantManager.getVariant(req.params.id);
  const owner = variant && experimentEngine.getExperiment(variant.experimentId);
  if (!variant || !owner || owner.shop !== shopOf(req)) return fail(res, 404, 'Variant not found');
  req.variant = variant;
  next();
};

router.get('/health', (_req, res) => res.json({ status: 'healthy', service: 'ab-testing-suite' }));
router.get('/config', (_req, res) => ok(res, config));
router.put('/config', (req, res) => {
  const { defaultConfidenceLevel, defaultPower } = req.body || {};
  if (defaultConfidenceLevel !== undefined && (defaultConfidenceLevel <= 0 || defaultConfidenceLevel >= 1)) {
    return fail(res, 400, 'defaultConfidenceLevel must be between 0 and 1');
  }
  if (defaultPower !== undefined && (defaultPower <= 0 || defaultPower >= 1)) return fail(res, 400, 'defaultPower must be between 0 and 1');
  config = { ...config, ...(defaultConfidenceLevel !== undefined && { defaultConfidenceLevel }), ...(defaultPower !== undefined && { defaultPower }) };
  ok(res, config);
});
router.get('/stats', (req, res) => {
  const experiments = mine(req);
  res.json({ success: true, stats: {
    totalExperiments: experiments.length,
    activeExperiments: experiments.filter(e => e.status === 'running').length,
    totalVariants: experiments.reduce((total, experiment) => total + experiment.variants.length, 0),
    visitorAssignments: [...trafficAllocator.assignments.keys()].filter((k) => experiments.some((e) => String(k).startsWith(e.id))).length,
  } });
});
router.get('/metrics', (req, res) => {
  const experiments = mine(req);
  ok(res, {
    totalExperiments: experiments.length,
    totalVariants: experiments.reduce((total, experiment) => total + experiment.variants.length, 0),
    totalAssignments: [...trafficAllocator.assignments.keys()].filter((k) => experiments.some((e) => String(k).startsWith(e.id))).length,
  });
});

router.get('/experiments', (req, res) => ok(res, mine(req)));
router.get('/experiments/list', (req, res) => ok(res, mine(req)));
router.post('/experiments', (req, res) => {
  try {
    if (!String(req.body?.name || '').trim()) return fail(res, 400, 'Experiment name is required');
    const experiment = experimentEngine.createExperiment({ ...req.body, shop: shopOf(req) });
    for (const variant of experiment.variants) {
      if (!variant.id) variant.id = require('crypto').randomUUID();
    }
    if (experiment.variants.length) trafficAllocator.createAllocator(experiment.id, { type: experiment.type === 'bandit' ? 'bandit' : 'fixed', variants: experiment.variants });
    ok(res, experiment, 201);
  } catch (error) { fail(res, 400, error.message); }
});
router.post('/experiments/create', (req, res) => {
  try {
    if (!String(req.body?.name || '').trim()) return fail(res, 400, 'Experiment name is required');
    const experiment = experimentEngine.createExperiment({ ...req.body, shop: shopOf(req) });
    for (const variant of experiment.variants) if (!variant.id) variant.id = require('crypto').randomUUID();
    if (experiment.variants.length) trafficAllocator.createAllocator(experiment.id, { type: experiment.type === 'bandit' ? 'bandit' : 'fixed', variants: experiment.variants });
    ok(res, experiment);
  } catch (error) { fail(res, 400, error.message); }
});
router.get('/experiments/:id', requireExperiment, (req, res) => ok(res, req.experiment));
router.put('/experiments/:id', requireExperiment, (req, res) => ok(res, experimentEngine.updateExperiment(req.params.id, req.body)));
router.delete('/experiments/:id', requireExperiment, (req, res) => {
  experimentEngine.deleteExperiment(req.params.id);
  ok(res, { deleted: true });
});
router.post('/experiments/:id/start', requireExperiment, (req, res) => ok(res, experimentEngine.startExperiment(req.params.id)));
router.post('/experiments/:id/pause', requireExperiment, (req, res) => ok(res, experimentEngine.pauseExperiment(req.params.id)));
router.post('/experiments/:id/stop', requireExperiment, (req, res) => ok(res, experimentEngine.stopExperiment(req.params.id)));
router.post('/experiments/:id/track', requireExperiment, (req, res) => {
  try {
    const event = experimentEngine.trackEvent(req.params.id, req.body);
    trafficAllocator.updateArmStats(req.params.id, event.variantId, event.type === 'conversion');
    ok(res, event);
  } catch (error) { fail(res, 400, error.message); }
});
router.post('/experiments/sample-size', (req, res) => {
  const result = calculateSampleSize(req.body);
  if (result.error) return fail(res, 400, result.error);
  ok(res, result);
});
router.post('/statistical/sample-size', (req, res) => {
  const result = calculateSampleSize(req.body);
  if (result.error) return fail(res, 400, result.error);
  ok(res, result);
});

router.post('/variants/create', (req, res) => {
  const parent = experimentEngine.getExperiment(req.body?.experimentId);
  if (!parent || parent.shop !== shopOf(req)) return fail(res, 404, 'Experiment not found');
  try { ok(res, variantManager.createVariant(req.body)); } catch (error) { fail(res, 400, error.message); }
});
router.get('/variants/experiment/:experimentId', (req, res) => {
  const parent = experimentEngine.getExperiment(req.params.experimentId);
  if (!parent || parent.shop !== shopOf(req)) return fail(res, 404, 'Experiment not found');
  ok(res, variantManager.listVariants(req.params.experimentId));
});
router.get('/variants/:id', requireVariant, (req, res) => ok(res, req.variant));
router.put('/variants/:id', requireVariant, (req, res) => ok(res, variantManager.updateVariant(req.params.id, req.body)));
router.post('/variants/:id/changes/add', requireVariant, (req, res) => {
  try { ok(res, variantManager.addChange(req.params.id, req.body)); } catch (error) { fail(res, 400, error.message); }
});
router.post('/variants/:id/preview', requireVariant, (req, res) => ok(res, variantManager.previewVariant(req.params.id, req.body?.baseUrl)));
router.post('/variants/:id/duplicate', requireVariant, (req, res) => {
  try { ok(res, variantManager.duplicateVariant(req.params.id, req.body?.name)); } catch (error) { fail(res, 400, error.message); }
});
router.post('/variants/:id/validate', requireVariant, (req, res) => ok(res, variantManager.validateVariant(req.params.id)));

router.post('/traffic/assign', (req, res) => {
  const { experimentId, visitorId } = req.body || {};
  const target = experimentEngine.getExperiment(experimentId);
  if (!target || target.shop !== shopOf(req)) return fail(res, 404, 'Experiment not found');
  if (!visitorId) return fail(res, 400, 'visitorId is required');
  try { ok(res, trafficAllocator.assignVariant(experimentId, visitorId)); } catch (error) { fail(res, 400, error.message); }
});
router.get('/traffic/distribution/:id', requireExperiment, (req, res) => ok(res, { distribution: trafficAllocator.getDistribution(req.params.id) }));
router.put('/traffic/allocator/:id', requireExperiment, (req, res) => {
  const allocator = trafficAllocator.updateAllocator(req.params.id, req.body);
  ok(res, allocator || trafficAllocator.createAllocator(req.params.id, req.body));
});
router.get('/traffic/regret/:id', requireExperiment, (req, res) => ok(res, trafficAllocator.calculateRegret(req.params.id)));
for (const [route, method] of [['thompson-sampling', 'thompson-sampling'], ['ucb', 'ucb'], ['epsilon-greedy', 'epsilon-greedy']]) {
  router.post(`/traffic/bandit/${route}`, (req, res) => {
    const target = experimentEngine.getExperiment(req.body?.experimentId);
    if (!target || target.shop !== shopOf(req)) return fail(res, 404, 'Experiment not found');
    try { ok(res, trafficAllocator.selectArm(req.body?.experimentId, method)); } catch (error) { fail(res, 400, error.message); }
  });
}

function experimentAnalysis(experimentId, type) {
  const experiment = experimentEngine.getExperiment(experimentId);
  const events = experiment?.events || [];
  const variants = experiment?.variants || [];
  const comparisons = variants.map(variant => {
    const records = events.filter(event => event.variantId === variant.id);
    const impressions = records.filter(event => event.type === 'impression').length;
    const conversions = records.filter(event => event.type === 'conversion').length;
    return { variantId: variant.id, impressions, conversions, conversionRate: impressions ? conversions / impressions : 0 };
  });
  return { type, comparisons };
}
router.post('/analysis/frequentist/:id', requireExperiment, (req, res) => ok(res, experimentAnalysis(req.params.id, 'frequentist')));
router.post('/analysis/bayesian/:id', requireExperiment, (req, res) => {
  const analysis = experimentAnalysis(req.params.id, 'bayesian');
  analysis.posteriors = analysis.comparisons.map(item => ({ variantId: item.variantId, alpha: item.conversions + Number(req.body?.priorAlpha || 1), beta: item.impressions - item.conversions + Number(req.body?.priorBeta || 1) }));
  analysis.probabilityBest = analysis.comparisons.length ? 1 / analysis.comparisons.length : 0;
  ok(res, analysis);
});
router.post('/analysis/sequential/:id', requireExperiment, (req, res) => {
  const analysis = experimentAnalysis(req.params.id, 'sequential');
  const total = analysis.comparisons.reduce((sum, item) => sum + item.impressions, 0);
  ok(res, { ...analysis, informationFraction: req.experiment.sampleSize ? Math.min(1, total / req.experiment.sampleSize) : 0, decision: 'continue' });
});
router.post('/analysis/z-test', (req, res) => {
  const { c1, n1, c2, n2 } = req.body || {};
  if (!(n1 > 0 && n2 > 0) || c1 < 0 || c2 < 0 || c1 > n1 || c2 > n2) return fail(res, 400, 'Valid conversion counts and sample sizes are required');
  const p1 = c1 / n1, p2 = c2 / n2, pooled = (c1 + c2) / (n1 + n2);
  const zScore = (p2 - p1) / Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2) || 1);
  ok(res, { zScore, pValue: Math.min(1, 2 * Math.exp(-0.717 * Math.abs(zScore) - 0.416 * zScore ** 2)) });
});
router.post('/statistical/z-test', (req, res) => {
  const { control, treatment } = req.body || {};
  const c1 = Number(control?.conversions), n1 = Number(control?.samples);
  const c2 = Number(treatment?.conversions), n2 = Number(treatment?.samples);
  if (![c1, n1, c2, n2].every(Number.isFinite) || !(n1 > 0 && n2 > 0) || c1 < 0 || c2 < 0 || c1 > n1 || c2 > n2) return fail(res, 400, 'Valid conversion counts and sample sizes are required');
  const p1 = c1 / n1, p2 = c2 / n2, pooled = (c1 + c2) / (n1 + n2);
  const zScore = (p2 - p1) / Math.sqrt(pooled * (1 - pooled) * (1 / n1 + 1 / n2) || 1);
  ok(res, { zScore, pValue: Math.min(1, 2 * Math.exp(-0.717 * Math.abs(zScore) - 0.416 * zScore ** 2)), significant: Math.abs(zScore) >= 1.96, lift: p1 ? (p2 - p1) / p1 : null });
});
router.post('/statistical/t-test', (req, res) => {
  const { control, treatment } = req.body || {};
  const controlConversions = Number(control?.conversions), controlSamples = Number(control?.samples);
  const treatmentConversions = Number(treatment?.conversions), treatmentSamples = Number(treatment?.samples);
  if (![controlConversions, controlSamples, treatmentConversions, treatmentSamples].every(Number.isFinite) ||
      !(controlSamples > 1 && treatmentSamples > 1) || controlConversions < 0 || treatmentConversions < 0 ||
      controlConversions > controlSamples || treatmentConversions > treatmentSamples) {
    return fail(res, 400, 'Valid conversion counts and sample sizes greater than one are required');
  }
  const controlMean = controlConversions / controlSamples;
  const treatmentMean = treatmentConversions / treatmentSamples;
  const controlVariance = controlMean * (1 - controlMean) * controlSamples / (controlSamples - 1);
  const treatmentVariance = treatmentMean * (1 - treatmentMean) * treatmentSamples / (treatmentSamples - 1);
  const standardError = Math.sqrt(controlVariance / controlSamples + treatmentVariance / treatmentSamples);
  if (standardError === 0) return fail(res, 400, 'The t-test is undefined when both samples have zero variance');
  const tStatistic = (treatmentMean - controlMean) / standardError;
  const pValue = Math.min(1, 2 * Math.exp(-0.717 * Math.abs(tStatistic) - 0.416 * tStatistic ** 2));
  ok(res, {
    tStatistic,
    pValue,
    significant: pValue < 0.05,
    lift: controlMean ? (treatmentMean - controlMean) / controlMean : null,
    method: 'Welch two-sample test with normal-approximation p-value',
  });
});
router.post('/statistical/bayesian-ab-test', (req, res) => {
  const { control, treatment } = req.body || {};
  const a = Number(control?.conversions), an = Number(control?.samples);
  const b = Number(treatment?.conversions), bn = Number(treatment?.samples);
  if (![a, an, b, bn].every(Number.isFinite) || !(an > 0 && bn > 0) || a < 0 || b < 0 || a > an || b > bn) return fail(res, 400, 'Valid conversion counts and sample sizes are required');
  const alphaA = a + 1, betaA = an - a + 1;
  const alphaB = b + 1, betaB = bn - b + 1;
  const meanA = alphaA / (alphaA + betaA), meanB = alphaB / (alphaB + betaB);
  const varianceA = alphaA * betaA / ((alphaA + betaA) ** 2 * (alphaA + betaA + 1));
  const varianceB = alphaB * betaB / ((alphaB + betaB) ** 2 * (alphaB + betaB + 1));
  const difference = meanB - meanA;
  const standardDeviation = Math.sqrt(varianceA + varianceB);
  const z = difference / standardDeviation;
  const probabilityBBeatsA = normalCdf(z);
  const densityAtZ = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  ok(res, {
    probabilityBBeatsA,
    expectedLossA: standardDeviation * densityAtZ + difference * probabilityBBeatsA,
    expectedLossB: standardDeviation * densityAtZ - difference * (1 - probabilityBBeatsA),
    credibleInterval: { lower: Math.max(-1, difference - 1.96 * standardDeviation), upper: Math.min(1, difference + 1.96 * standardDeviation) },
    method: 'Normal approximation to independent Beta(1,1) posteriors',
  });
});
router.post('/analysis/t-test', (req, res) => {
  const { data1, data2 } = req.body || {};
  if (!Array.isArray(data1) || !Array.isArray(data2) || data1.length < 2 || data2.length < 2) return fail(res, 400, 'data1 and data2 must each contain at least two values');
  const mean = arr => arr.reduce((sum, value) => sum + Number(value), 0) / arr.length;
  const variance = arr => arr.reduce((sum, value) => sum + (Number(value) - mean(arr)) ** 2, 0) / (arr.length - 1);
  const tStatistic = (mean(data1) - mean(data2)) / Math.sqrt(variance(data1) / data1.length + variance(data2) / data2.length);
  ok(res, { tStatistic, pValue: Math.min(1, 2 * Math.exp(-0.717 * Math.abs(tStatistic) - 0.416 * tStatistic ** 2)) });
});
router.post('/analysis/monte-carlo', (req, res) => {
  const { alphaA, betaA, alphaB, betaB } = req.body || {};
  if ([alphaA, betaA, alphaB, betaB].some(value => !(Number(value) > 0))) return fail(res, 400, 'All beta distribution parameters must be positive');
  const meanA = alphaA / (alphaA + betaA), meanB = alphaB / (alphaB + betaB);
  const probabilityBBeatsA = meanB === meanA ? 0.5 : meanB > meanA ? 0.75 : 0.25;
  ok(res, { probabilityBBeatsA });
});

module.exports = router;
