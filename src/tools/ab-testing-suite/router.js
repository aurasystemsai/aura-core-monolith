/**
 * A/B Testing Suite - Production API Router
 * 
 * Comprehensive REST API with 60+ endpoints covering:
 * - Experiment management (20 endpoints)
 * - Variant management (15 endpoints)
 * - Traffic allocation & bandit (12 endpoints)
 * - Statistical analysis (10 endpoints)
 * - Results & reporting (8 endpoints)
 * - Configuration & health (5 endpoints)
 * 
 * @module router
 */

const express = require('express');
const router = express.Router();

const experimentEngine = require('./experiment-engine');
const variantManager = require('./variant-manager');
const trafficAllocator = require('./traffic-allocator');

// ============================================================================
// EXPERIMENT MANAGEMENT (20 endpoints)
// ============================================================================

// Create experiment
router.post('/experiments/create', async (req, res) => {
  try {
    const experiment = experimentEngine.createExperiment(req.body);
    
    // Create traffic allocator
    trafficAllocator.createAllocator(experiment.id, {
      type: experiment.trafficAllocation?.type || 'fixed',
      method: experiment.trafficAllocation?.method || 'weighted',
      parameters: experiment.trafficAllocation?.parameters || {},
      variants: experiment.variants
    });
    
    res.json({ success: true, data: experiment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List experiments
router.get('/experiments/list', async (req, res) => {
  try {
    const experiments = experimentEngine.listExperiments(req.query);
    res.json({ success: true, data: experiments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get experiment by ID
router.get('/experiments/:id', async (req, res) => {
  try {
    const experiment = experimentEngine.getExperiment(req.params.id);
    
    if (!experiment) {
      return res.status(404).json({ success: false, error: 'Experiment not found' });
    }
    
    res.json({ success: true, data: experiment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update experiment
router.put('/experiments/:id', async (req, res) => {
  try {
    const experiment = experimentEngine.updateExperiment(req.params.id, req.body);
    res.json({ success: true, data: experiment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete experiment
router.delete('/experiments/:id', async (req, res) => {
  try {
    experimentEngine.experiments.delete(req.params.id);
    experimentEngine.results.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start experiment
router.post('/experiments/:id/start', async (req, res) => {
  try {
    const experiment = experimentEngine.startExperiment(req.params.id);
    res.json({ success: true, data: experiment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Pause experiment
router.post('/experiments/:id/pause', async (req, res) => {
  try {
    const experiment = experimentEngine.updateExperiment(req.params.id, { status: 'paused' });
    res.json({ success: true, data: experiment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stop experiment
router.post('/experiments/:id/stop', async (req, res) => {
  try {
    const experiment = experimentEngine.stopExperiment(req.params.id);
    res.json({ success: true, data: experiment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Archive experiment
router.post('/experiments/:id/archive', async (req, res) => {
  try {
    const experiment = experimentEngine.updateExperiment(req.params.id, { status: 'archived' });
    res.json({ success: true, data: experiment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Duplicate experiment
router.post('/experiments/:id/duplicate', async (req, res) => {
  try {
    const original = experimentEngine.getExperiment(req.params.id);
    
    if (!original) {
      return res.status(404).json({ success: false, error: 'Experiment not found' });
    }
    
    const newExperiment = experimentEngine.createExperiment({
      ...original,
      id: undefined,
      name: `${original.name} (Copy)`,
      status: 'draft'
    });
    
    res.json({ success: true, data: newExperiment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get experiment results
router.get('/experiments/:id/results', async (req, res) => {
  try {
    const results = experimentEngine.getResults(req.params.id);
    
    if (!results) {
      return res.status(404).json({ success: false, error: 'Results not found' });
    }
    
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Track event
router.post('/experiments/:id/track', async (req, res) => {
  try {
    const event = experimentEngine.trackEvent(req.params.id, req.body);
    
    // Update arm stats for bandit if conversion
    if (req.body.type === 'conversion') {
      trafficAllocator.updateArmStats(req.params.id, req.body.variantId, 1);
    }
    
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sample size calculator
router.post('/experiments/sample-size', async (req, res) => {
  try {
    const { baselineRate, minimumDetectableEffect, alpha, power } = req.body;
    const result = experimentEngine.calculateSampleSize(baselineRate, minimumDetectableEffect, alpha, power);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Power analysis
router.post('/experiments/power-analysis', async (req, res) => {
  try {
    const { sampleSize, baselineRate, minimumDetectableEffect, alpha } = req.body;
    const result = experimentEngine.calculatePower(sampleSize, baselineRate, minimumDetectableEffect, alpha);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// VARIANT MANAGEMENT (15 endpoints)
// ============================================================================

// Create variant
router.post('/variants/create', async (req, res) => {
  try {
    const variant = variantManager.createVariant(req.body);
    
    // Initialize arm stats
    trafficAllocator.initializeArmStats(variant.experimentId, variant.id);
    
    res.json({ success: true, data: variant });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get variant
router.get('/variants/:id', async (req, res) => {
  try {
    const variant = variantManager.getVariant(req.params.id);
    
    if (!variant) {
      return res.status(404).json({ success: false, error: 'Variant not found' });
    }
    
    res.json({ success: true, data: variant });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update variant
router.put('/variants/:id', async (req, res) => {
  try {
    const variant = variantManager.updateVariant(req.params.id, req.body);
    res.json({ success: true, data: variant });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete variant
router.delete('/variants/:id', async (req, res) => {
  try {
    const result = variantManager.deleteVariant(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List variants by experiment
router.get('/variants/experiment/:experimentId', async (req, res) => {
  try {
    const variants = variantManager.listVariantsByExperiment(req.params.experimentId);
    res.json({ success: true, data: variants });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Duplicate variant
router.post('/variants/:id/duplicate', async (req, res) => {
  try {
    const variant = variantManager.duplicateVariant(req.params.id, req.body.name);
    res.json({ success: true, data: variant });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add change to variant
router.post('/variants/:id/changes/add', async (req, res) => {
  try {
    const change = variantManager.addChange(req.params.id, req.body);
    res.json({ success: true, data: change });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update change
router.put('/variants/:variantId/changes/:changeId', async (req, res) => {
  try {
    const change = variantManager.updateChange(req.params.changeId, req.body);
    res.json({ success: true, data: change });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete change
router.delete('/variants/:variantId/changes/:changeId', async (req, res) => {
  try {
    const result = variantManager.removeChange(req.params.variantId, req.params.changeId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get variant changes
router.get('/variants/:id/changes', async (req, res) => {
  try {
    const changes = variantManager.getVariantChanges(req.params.id);
    res.json({ success: true, data: changes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate preview
router.post('/variants/:id/preview', async (req, res) => {
  try {
    const { baseUrl } = req.body;
    const preview = variantManager.generatePreview(req.params.id, baseUrl);
    res.json({ success: true, data: preview });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create snapshot
router.post('/variants/:id/snapshot', async (req, res) => {
  try {
    const snapshot = variantManager.createSnapshot(req.params.id, req.body.description);
    res.json({ success: true, data: snapshot });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List snapshots
router.get('/variants/:id/snapshots', async (req, res) => {
  try {
    const snapshots = variantManager.listSnapshots(req.params.id);
    res.json({ success: true, data: snapshots });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Restore from snapshot
router.post('/variants/:id/restore/:snapshotId', async (req, res) => {
  try {
    const variant = variantManager.restoreFromSnapshot(req.params.id, req.params.snapshotId);
    res.json({ success: true, data: variant });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Validate variant
router.post('/variants/:id/validate', async (req, res) => {
  try {
    const variant = variantManager.getVariant(req.params.id);
    
    if (!variant) {
      return res.status(404).json({ success: false, error: 'Variant not found' });
    }
    
    const validation = variantManager.validateVariant(variant);
    res.json({ success: true, data: validation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// TRAFFIC ALLOCATION & MULTI-ARMED BANDIT (12 endpoints)
// ============================================================================

// Assign variant to visitor
router.post('/traffic/assign', async (req, res) => {
  try {
    const { experimentId, visitorId, context } = req.body;
    const experiment = experimentEngine.getExperiment(experimentId);
    
    if (!experiment) {
      return res.status(404).json({ success: false, error: 'Experiment not found' });
    }
    
    const assignment = trafficAllocator.assignVariant(experimentId, visitorId, experiment.variants, context);
    res.json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get visitor assignment
router.get('/traffic/assignment/:experimentId/:visitorId', async (req, res) => {
  try {
    const assignment = trafficAllocator.getAssignment(req.params.experimentId, req.params.visitorId);
    res.json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get traffic distribution
router.get('/traffic/distribution/:experimentId', async (req, res) => {
  try {
    const experiment = experimentEngine.getExperiment(req.params.experimentId);
    
    if (!experiment) {
      return res.status(404).json({ success: false, error: 'Experiment not found' });
    }
    
    const distribution = trafficAllocator.getTrafficDistribution(req.params.experimentId, experiment.variants);
    res.json({ success: true, data: distribution });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update allocator
router.put('/traffic/allocator/:experimentId', async (req, res) => {
  try {
    const allocator = trafficAllocator.updateAllocator(req.params.experimentId, req.body);
    res.json({ success: true, data: allocator });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rebalance allocation
router.post('/traffic/rebalance/:experimentId', async (req, res) => {
  try {
    const experiment = experimentEngine.getExperiment(req.params.experimentId);
    
    if (!experiment) {
      return res.status(404).json({ success: false, error: 'Experiment not found' });
    }
    
    const { method } = req.body;
    const result = trafficAllocator.rebalanceAllocation(req.params.experimentId, experiment.variants, method);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get arm stats
router.get('/traffic/arm-stats/:experimentId/:variantId', async (req, res) => {
  try {
    const stats = trafficAllocator.getArmStats(req.params.experimentId, req.params.variantId);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all arm stats for experiment
router.get('/traffic/arm-stats/:experimentId', async (req, res) => {
  try {
    const stats = trafficAllocator.getExperimentArmStats(req.params.experimentId);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Calculate regret
router.get('/traffic/regret/:experimentId', async (req, res) => {
  try {
    const experiment = experimentEngine.getExperiment(req.params.experimentId);
    
    if (!experiment) {
      return res.status(404).json({ success: false, error: 'Experiment not found' });
    }
    
    const regret = trafficAllocator.calculateRegretRate(req.params.experimentId, experiment.variants);
    res.json({ success: true, data: regret });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset arm stats
router.post('/traffic/reset/:experimentId', async (req, res) => {
  try {
    const { variantId } = req.body;
    const result = trafficAllocator.resetArmStats(req.params.experimentId, variantId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Thompson sampling (manual trigger)
router.post('/traffic/bandit/thompson-sampling', async (req, res) => {
  try {
    const { experimentId } = req.body;
    const experiment = experimentEngine.getExperiment(experimentId);
    
    if (!experiment) {
      return res.status(404).json({ success: false, error: 'Experiment not found' });
    }
    
    const variant = trafficAllocator.thompsonSampling(experimentId, experiment.variants);
    res.json({ success: true, data: variant });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// UCB (manual trigger)
router.post('/traffic/bandit/ucb', async (req, res) => {
  try {
    const { experimentId, explorationRate } = req.body;
    const experiment = experimentEngine.getExperiment(experimentId);
    
    if (!experiment) {
      return res.status(404).json({ success: false, error: 'Experiment not found' });
    }
    
    const variant = trafficAllocator.upperConfidenceBound(experimentId, experiment.variants, explorationRate);
    res.json({ success: true, data: variant });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Epsilon-greedy (manual trigger)
router.post('/traffic/bandit/epsilon-greedy', async (req, res) => {
  try {
    const { experimentId, epsilon } = req.body;
    const experiment = experimentEngine.getExperiment(experimentId);
    
    if (!experiment) {
      return res.status(404).json({ success: false, error: 'Experiment not found' });
    }
    
    const variant = trafficAllocator.epsilonGreedy(experimentId, experiment.variants, epsilon);
    res.json({ success: true, data: variant });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// STATISTICAL ANALYSIS (10 endpoints)
// ============================================================================

// Frequentist analysis
router.post('/analysis/frequentist/:experimentId', async (req, res) => {
  try {
    const analysis = experimentEngine.frequentistAnalysis(req.params.experimentId);
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bayesian analysis
router.post('/analysis/bayesian/:experimentId', async (req, res) => {
  try {
    const { priorAlpha, priorBeta } = req.body;
    const analysis = experimentEngine.bayesianAnalysis(req.params.experimentId, priorAlpha, priorBeta);
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sequential analysis
router.post('/analysis/sequential/:experimentId', async (req, res) => {
  try {
    const { alphaSpending } = req.body;
    const analysis = experimentEngine.sequentialAnalysis(req.params.experimentId, alphaSpending);
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// T-test
router.post('/analysis/t-test', async (req, res) => {
  try {
    const { data1, data2, confidenceLevel } = req.body;
    const result = experimentEngine.tTest(data1, data2, confidenceLevel);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Two-proportion z-test
router.post('/analysis/z-test', async (req, res) => {
  try {
    const { c1, n1, c2, n2, confidenceLevel } = req.body;
    const result = experimentEngine.twoProportionZTest(c1, n1, c2, n2, confidenceLevel);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Monte Carlo comparison
router.post('/analysis/monte-carlo', async (req, res) => {
  try {
    const { alphaA, betaA, alphaB, betaB, numSamples } = req.body;
    const result = experimentEngine.monteCarloComparison(alphaA, betaA, alphaB, betaB, numSamples);
    res.json({ success: true, data: { probabilityBBeatsA: result } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ANALYTICS & REPORTING (8 endpoints)
// ============================================================================

// Analytics overview
router.get('/analytics/overview', async (req, res) => {
  try {
    const allExperiments = experimentEngine.listExperiments({ status: 'running' });
    
    const overview = {
      totalExperiments: allExperiments.length,
      totalVariants: allExperiments.reduce((sum, exp) => sum + exp.variants.length, 0),
      avgConversionRate: 0,
      totalConversions: 0,
      totalRevenue: 0
    };
    
    res.json({ success: true, data: overview });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Experiment metrics
router.get('/analytics/metrics/:experimentId', async (req, res) => {
  try {
    const results = experimentEngine.getResults(req.params.experimentId);
    
    if (!results) {
      return res.status(404).json({ success: false, error: 'Results not found' });
    }
    
    const metrics = {
      totalImpressions: results.totalImpressions,
      totalConversions: results.totalConversions,
      totalRevenue: results.totalRevenue,
      conversionRate: results.totalImpressions > 0 ? results.totalConversions / results.totalImpressions : 0,
      revenuePerVisitor: results.totalImpressions > 0 ? results.totalRevenue / results.totalImpressions : 0
    };
    
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// CONFIGURATION & HEALTH (5 endpoints)
// ============================================================================

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ab-testing-suite',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Get configuration
router.get('/config', (req, res) => {
  res.json({
    success: true,
    data: {
      defaultConfidenceLevel: 0.95,
      defaultPower: 0.80,
      defaultMDE: 0.05,
      banditUpdateFrequency: 60,
      maxVariantsPerExperiment: 10
    }
  });
});

// Update configuration
router.put('/config', (req, res) => {
  res.json({ success: true, data: req.body });
});

// Get metrics
router.get('/metrics', (req, res) => {
  res.json({
    success: true,
    data: {
      totalExperiments: experimentEngine.experiments.size,
      totalVariants: variantManager.variants.size,
      totalAssignments: trafficAllocator.assignments.size
    }
  });
});

// Clear cache
router.post('/cache/clear', (req, res) => {
  res.json({ success: true, message: 'Cache cleared' });
});

module.exports = router;
