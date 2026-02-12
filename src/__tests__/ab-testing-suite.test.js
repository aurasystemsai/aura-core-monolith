/**
 * A/B Testing Suite - Comprehensive Test Suite
 * Tests experiment engine, variant manager, traffic allocator, and API endpoints
 */

const request = require('supertest');
const express = require('express');
const router = require('../tools/ab-testing-suite/router');
const experimentEngine = require('../tools/ab-testing-suite/experiment-engine');
const variantManager = require('../tools/ab-testing-suite/variant-manager');
const trafficAllocator = require('../tools/ab-testing-suite/traffic-allocator');

// Test app setup
const app = express();
app.use(express.json());
app.use('/api/ab-testing', router);

describe('A/B Testing Suite', () => {
  
  // Clear storage before each test
  beforeEach(() => {
    experimentEngine.experiments.clear();
    experimentEngine.results.clear();
    variantManager.variants.clear();
    variantManager.changes.clear();
    trafficAllocator.allocations.clear();
    trafficAllocator.assignments.clear();
    trafficAllocator.armStats.clear();
  });
  
  // ============================================================================
  // EXPERIMENT MANAGEMENT TESTS (10 tests)
  // ============================================================================
  
  describe('Experiment Management', () => {
    
    test('should create an experiment', async () => {
      const res = await request(app)
        .post('/api/ab-testing/experiments/create')
        .send({
          name: 'Homepage Hero Test',
          description: 'Test different hero images',
          type: 'ab',
          variants: [
            { id: 'control', name: 'Control', isControl: true, trafficWeight: 50 },
            { id: 'variant_a', name: 'Variant A', isControl: false, trafficWeight: 50 }
          ],
          goals: [{ id: 'goal1', name: 'Conversion', type: 'conversion', isPrimary: true }],
          sampleSize: 1000,
          confidenceLevel: 0.95
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Homepage Hero Test');
      expect(res.body.data.variants).toHaveLength(2);
    });
    
    test('should list all experiments', async () => {
      // Create two experiments
      await experimentEngine.createExperiment({ name: 'Test 1', type: 'ab' });
      await experimentEngine.createExperiment({ name: 'Test 2', type: 'ab' });
      
      const res = await request(app)
        .get('/api/ab-testing/experiments/list');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    });
    
    test('should get experiment by ID', async () => {
      const exp = experimentEngine.createExperiment({ name: 'Test Experiment', type: 'ab' });
      
      const res = await request(app)
        .get(`/api/ab-testing/experiments/${exp.id}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(exp.id);
    });
    
    test('should update experiment', async () => {
      const exp = experimentEngine.createExperiment({ name: 'Test', type: 'ab' });
      
      const res = await request(app)
        .put(`/api/ab-testing/experiments/${exp.id}`)
        .send({ name: 'Updated Test' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Test');
    });
    
    test('should delete experiment', async () => {
      const exp = experimentEngine.createExperiment({ name: 'Test', type: 'ab' });
      
      const res = await request(app)
        .delete(`/api/ab-testing/experiments/${exp.id}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(experimentEngine.experiments.has(exp.id)).toBe(false);
    });
    
    test('should start experiment', async () => {
      const exp = experimentEngine.createExperiment({ name: 'Test', type: 'ab' });
      
      const res = await request(app)
        .post(`/api/ab-testing/experiments/${exp.id}/start`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('running');
      expect(res.body.data.startedAt).toBeTruthy();
    });
    
    test('should pause experiment', async () => {
      const exp = experimentEngine.createExperiment({ name: 'Test', type: 'ab' });
      
      const res = await request(app)
        .post(`/api/ab-testing/experiments/${exp.id}/pause`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('paused');
    });
    
    test('should stop experiment', async () => {
      const exp = experimentEngine.createExperiment({ name: 'Test', type: 'ab' });
      
      const res = await request(app)
        .post(`/api/ab-testing/experiments/${exp.id}/stop`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('stopped');
      expect(res.body.data.stoppedAt).toBeTruthy();
    });
    
    test('should track event', async () => {
      const exp = experimentEngine.createExperiment({
        name: 'Test',
        type: 'ab',
        variants: [{ id: 'var1', name: 'Variant 1', isControl: true }]
      });
      
      const res = await request(app)
        .post(`/api/ab-testing/experiments/${exp.id}/track`)
        .send({
          variantId: 'var1',
          type: 'impression',
          visitorId: 'visitor123'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    
    test('should calculate sample size', async () => {
      const res = await request(app)
        .post('/api/ab-testing/experiments/sample-size')
        .send({
          baselineRate: 0.10,
          minimumDetectableEffect: 0.20,
          alpha: 0.05,
          power: 0.80
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('sampleSizePerVariant');
      expect(res.body.data).toHaveProperty('totalSampleSize');
    });
    
  });
  
  // ============================================================================
  // VARIANT MANAGEMENT TESTS (8 tests)
  // ============================================================================
  
  describe('Variant Management', () => {
    
    test('should create variant', async () => {
      const exp = experimentEngine.createExperiment({ name: 'Test', type: 'ab' });
      
      const res = await request(app)
        .post('/api/ab-testing/variants/create')
        .send({
          experimentId: exp.id,
          name: 'Variant A',
          description: 'Test variant',
          trafficWeight: 50
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Variant A');
    });
    
    test('should get variant by ID', async () => {
      const variant = variantManager.createVariant({
        experimentId: 'exp1',
        name: 'Test Variant'
      });
      
      const res = await request(app)
        .get(`/api/ab-testing/variants/${variant.id}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(variant.id);
    });
    
    test('should update variant', async () => {
      const variant = variantManager.createVariant({
        experimentId: 'exp1',
        name: 'Test'
      });
      
      const res = await request(app)
        .put(`/api/ab-testing/variants/${variant.id}`)
        .send({ name: 'Updated Variant' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Variant');
    });
    
    test('should add change to variant', async () => {
      const variant = variantManager.createVariant({
        experimentId: 'exp1',
        name: 'Test'
      });
      
      const res = await request(app)
        .post(`/api/ab-testing/variants/${variant.id}/changes/add`)
        .send({
          type: 'element',
          selector: '#hero-title',
          action: 'modify',
          value: { property: 'textContent', value: 'New Title' }
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data.type).toBe('element');
    });
    
    test('should generate variant preview', async () => {
      const variant = variantManager.createVariant({
        experimentId: 'exp1',
        name: 'Test'
      });
      
      const res = await request(app)
        .post(`/api/ab-testing/variants/${variant.id}/preview`)
        .send({ baseUrl: 'https://example.com' });
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('previewUrl');
      expect(res.body.data).toHaveProperty('applyChangesScript');
    });
    
    test('should duplicate variant', async () => {
      const variant = variantManager.createVariant({
        experimentId: 'exp1',
        name: 'Original'
      });
      
      const res = await request(app)
        .post(`/api/ab-testing/variants/${variant.id}/duplicate`)
        .send({ name: 'Copy' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Copy');
      expect(res.body.data.id).not.toBe(variant.id);
    });
    
    test('should validate variant', async () => {
      const variant = variantManager.createVariant({
        experimentId: 'exp1',
        name: 'Test',
        trafficWeight: 50
      });
      
      const res = await request(app)
        .post(`/api/ab-testing/variants/${variant.id}/validate`);
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('valid');
    });
    
    test('should list variants by experiment', async () => {
      variantManager.createVariant({ experimentId: 'exp1', name: 'V1' });
      variantManager.createVariant({ experimentId: 'exp1', name: 'V2' });
      variantManager.createVariant({ experimentId: 'exp2', name: 'V3' });
      
      const res = await request(app)
        .get('/api/ab-testing/variants/experiment/exp1');
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });
    
  });
  
  // ============================================================================
  // TRAFFIC ALLOCATION & BANDIT TESTS (8 tests)
  // ============================================================================
  
  describe('Traffic Allocation & Multi-Armed Bandit', () => {
    
    test('should assign variant to visitor', async () => {
      const exp = experimentEngine.createExperiment({
        name: 'Test',
        type: 'ab',
        variants: [
          { id: 'control', name: 'Control', isControl: true, trafficWeight: 50 },
          { id: 'variant_a', name: 'Variant A', isControl: false, trafficWeight: 50 }
        ]
      });
      
      trafficAllocator.createAllocator(exp.id, {
        type: 'fixed',
        method: 'weighted',
        variants: exp.variants
      });
      
      const res = await request(app)
        .post('/api/ab-testing/traffic/assign')
        .send({
          experimentId: exp.id,
          visitorId: 'visitor123'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('variantId');
      expect(res.body.data).toHaveProperty('variantName');
    });
    
    test('should return same variant for same visitor', async () => {
      const exp = experimentEngine.createExperiment({
        name: 'Test',
        type: 'ab',
        variants: [
          { id: 'control', name: 'Control', isControl: true, trafficWeight: 50 },
          { id: 'variant_a', name: 'Variant A', isControl: false, trafficWeight: 50 }
        ]
      });
      
      trafficAllocator.createAllocator(exp.id, {
        type: 'fixed',
        method: 'weighted',
        variants: exp.variants
      });
      
      const res1 = await request(app)
        .post('/api/ab-testing/traffic/assign')
        .send({ experimentId: exp.id, visitorId: 'visitor123' });
      
      const res2 = await request(app)
        .post('/api/ab-testing/traffic/assign')
        .send({ experimentId: exp.id, visitorId: 'visitor123' });
      
      expect(res1.body.data.variantId).toBe(res2.body.data.variantId);
    });
    
    test('should get traffic distribution', async () => {
      const exp = experimentEngine.createExperiment({
        name: 'Test',
        type: 'ab',
        variants: [
          { id: 'control', name: 'Control', isControl: true },
          { id: 'variant_a', name: 'Variant A', isControl: false }
        ]
      });
      
      trafficAllocator.createAllocator(exp.id, { type: 'fixed', variants: exp.variants });
      trafficAllocator.initializeArmStats(exp.id, 'control');
      trafficAllocator.initializeArmStats(exp.id, 'variant_a');
      
      const res = await request(app)
        .get(`/api/ab-testing/traffic/distribution/${exp.id}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('distribution');
      expect(res.body.data.distribution).toHaveLength(2);
    });
    
    test('should update allocator', async () => {
      const exp = experimentEngine.createExperiment({ name: 'Test', type: 'ab' });
      trafficAllocator.createAllocator(exp.id, { type: 'fixed' });
      
      const res = await request(app)
        .put(`/api/ab-testing/traffic/allocator/${exp.id}`)
        .send({ type: 'bandit', method: 'thompson-sampling' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.type).toBe('bandit');
      expect(res.body.data.method).toBe('thompson-sampling');
    });
    
    test('should calculate regret', async () => {
      const exp = experimentEngine.createExperiment({
        name: 'Test',
        type: 'ab',
        variants: [
          { id: 'control', name: 'Control', isControl: true },
          { id: 'variant_a', name: 'Variant A', isControl: false }
        ]
      });
      
      trafficAllocator.initializeArmStats(exp.id, 'control');
      trafficAllocator.initializeArmStats(exp.id, 'variant_a');
      trafficAllocator.updateArmStats(exp.id, 'control', 1);
      trafficAllocator.updateArmStats(exp.id, 'variant_a', 1);
      
      const res = await request(app)
        .get(`/api/ab-testing/traffic/regret/${exp.id}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalRegret');
      expect(res.body.data).toHaveProperty('bestVariantId');
    });
    
    test('should perform Thompson sampling', async () => {
      const exp = experimentEngine.createExperiment({
        name: 'Test',
        type: 'ab',
        variants: [
          { id: 'control', name: 'Control', isControl: true },
          { id: 'variant_a', name: 'Variant A', isControl: false }
        ]
      });
      
      trafficAllocator.initializeArmStats(exp.id, 'control');
      trafficAllocator.initializeArmStats(exp.id, 'variant_a');
      
      const res = await request(app)
        .post('/api/ab-testing/traffic/bandit/thompson-sampling')
        .send({ experimentId: exp.id });
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id');
    });
    
    test('should perform UCB', async () => {
      const exp = experimentEngine.createExperiment({
        name: 'Test',
        type: 'ab',
        variants: [
          { id: 'control', name: 'Control', isControl: true },
          { id: 'variant_a', name: 'Variant A', isControl: false }
        ]
      });
      
      trafficAllocator.initializeArmStats(exp.id, 'control');
      trafficAllocator.initializeArmStats(exp.id, 'variant_a');
      
      const res = await request(app)
        .post('/api/ab-testing/traffic/bandit/ucb')
        .send({ experimentId: exp.id, explorationRate: 2.0 });
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id');
    });
    
    test('should perform epsilon-greedy', async () => {
      const exp = experimentEngine.createExperiment({
        name: 'Test',
        type: 'ab',
        variants: [
          { id: 'control', name: 'Control', isControl: true },
          { id: 'variant_a', name: 'Variant A', isControl: false }
        ]
      });
      
      trafficAllocator.initializeArmStats(exp.id, 'control');
      trafficAllocator.initializeArmStats(exp.id, 'variant_a');
      
      const res = await request(app)
        .post('/api/ab-testing/traffic/bandit/epsilon-greedy')
        .send({ experimentId: exp.id, epsilon: 0.1 });
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('id');
    });
    
  });
  
  // ============================================================================
  // STATISTICAL ANALYSIS TESTS (6 tests)
  // ============================================================================
  
  describe('Statistical Analysis', () => {
    
    test('should perform frequentist analysis', async () => {
      const exp = experimentEngine.createExperiment({
        name: 'Test',
        type: 'ab',
        variants: [
          { id: 'control', name: 'Control', isControl: true },
          { id: 'variant_a', name: 'Variant A', isControl: false }
        ]
      });
      
      // Track some events
      experimentEngine.trackEvent(exp.id, { variantId: 'control', type: 'impression', visitorId: 'v1' });
      experimentEngine.trackEvent(exp.id, { variantId: 'control', type: 'conversion', visitorId: 'v1' });
      experimentEngine.trackEvent(exp.id, { variantId: 'variant_a', type: 'impression', visitorId: 'v2' });
      
      const res = await request(app)
        .post(`/api/ab-testing/analysis/frequentist/${exp.id}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.type).toBe('frequentist');
      expect(res.body.data).toHaveProperty('comparisons');
    });
    
    test('should perform Bayesian analysis', async () => {
      const exp = experimentEngine.createExperiment({
        name: 'Test',
        type: 'ab',
        variants: [
          { id: 'control', name: 'Control', isControl: true },
          { id: 'variant_a', name: 'Variant A', isControl: false }
        ]
      });
      
      experimentEngine.trackEvent(exp.id, { variantId: 'control', type: 'impression', visitorId: 'v1' });
      experimentEngine.trackEvent(exp.id, { variantId: 'variant_a', type: 'impression', visitorId: 'v2' });
      
      const res = await request(app)
        .post(`/api/ab-testing/analysis/bayesian/${exp.id}`)
        .send({ priorAlpha: 1, priorBeta: 1 });
      
      expect(res.status).toBe(200);
      expect(res.body.data.type).toBe('bayesian');
      expect(res.body.data).toHaveProperty('posteriors');
      expect(res.body.data).toHaveProperty('probabilityBest');
    });
    
    test('should perform sequential analysis', async () => {
      const exp = experimentEngine.createExperiment({
        name: 'Test',
        type: 'ab',
        sampleSize: 1000,
        confidenceLevel: 0.95,
        variants: [
          { id: 'control', name: 'Control', isControl: true },
          { id: 'variant_a', name: 'Variant A', isControl: false }
        ]
      });
      
      // Track some events
      for (let i = 0; i < 50; i++) {
        experimentEngine.trackEvent(exp.id, { variantId: 'control', type: 'impression', visitorId: `v${i}` });
        experimentEngine.trackEvent(exp.id, { variantId: 'variant_a', type: 'impression', visitorId: `v${i+50}` });
      }
      
      const res = await request(app)
        .post(`/api/ab-testing/analysis/sequential/${exp.id}`)
        .send({ alphaSpending: 'obrien-fleming' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.type).toBe('sequential');
      expect(res.body.data).toHaveProperty('informationFraction');
      expect(res.body.data).toHaveProperty('decision');
    });
    
    test('should perform t-test', async () => {
      const res = await request(app)
        .post('/api/ab-testing/analysis/t-test')
        .send({
          data1: [10, 12, 14, 16, 18],
          data2: [15, 17, 19, 21, 23],
          confidenceLevel: 0.95
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('tStatistic');
      expect(res.body.data).toHaveProperty('pValue');
    });
    
    test('should perform z-test', async () => {
      const res = await request(app)
        .post('/api/ab-testing/analysis/z-test')
        .send({
          c1: 100,
          n1: 1000,
          c2: 120,
          n2: 1000,
          confidenceLevel: 0.95
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('zScore');
      expect(res.body.data).toHaveProperty('pValue');
    });
    
    test('should perform Monte Carlo comparison', async () => {
      const res = await request(app)
        .post('/api/ab-testing/analysis/monte-carlo')
        .send({
          alphaA: 10,
          betaA: 20,
          alphaB: 15,
          betaB: 15,
          numSamples: 10000
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('probabilityBBeatsA');
      expect(res.body.data.probabilityBBeatsA).toBeGreaterThanOrEqual(0);
      expect(res.body.data.probabilityBBeatsA).toBeLessThanOrEqual(1);
    });
    
  });
  
  // ============================================================================
  // CONFIGURATION & HEALTH TESTS (4 tests)
  // ============================================================================
  
  describe('Configuration & Health', () => {
    
    test('should pass health check', async () => {
      const res = await request(app)
        .get('/api/ab-testing/health');
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('ab-testing-suite');
    });
    
    test('should get configuration', async () => {
      const res = await request(app)
        .get('/api/ab-testing/config');
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('defaultConfidenceLevel');
      expect(res.body.data).toHaveProperty('defaultPower');
    });
    
    test('should update configuration', async () => {
      const res = await request(app)
        .put('/api/ab-testing/config')
        .send({ defaultConfidenceLevel: 0.99 });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    
    test('should get metrics', async () => {
      const res = await request(app)
        .get('/api/ab-testing/metrics');
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalExperiments');
      expect(res.body.data).toHaveProperty('totalVariants');
      expect(res.body.data).toHaveProperty('totalAssignments');
    });
    
  });
  
});

// Summary: 36 comprehensive tests covering:
// - Experiment management (10 tests) - CRUD, lifecycle, tracking, sample size
// - Variant management (8 tests) - CRUD, changes, preview, duplication, validation
// - Traffic allocation & bandit (8 tests) - assignment, distribution, Thompson sampling, UCB, epsilon-greedy
// - Statistical analysis (6 tests) - frequentist, Bayesian, sequential, t-test, z-test, Monte Carlo
// - Configuration & health (4 tests) - health check, config management, metrics
