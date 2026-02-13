/**
 * Comprehensive Test Suite for AB Testing Suite V2
 * 
 * Tests all 8 modules:
 * - Statistical Analysis Engine
 * - Multi-Armed Bandit Engine
 * - Experimentation Platform Engine
 * - Analytics & Reporting Engine
 * - Traffic Management Engine
 * - Integration & API Engine
 * - AI & ML Optimization Engine
 * - Advanced Features Engine
 * 
 * Also tests router endpoints and integration flows
 */

const request = require('supertest');
const express = require('express');

// Import all engines
const statisticalEngine = require('../statistical-analysis-engine');
const banditEngine = require('../multi-armed-bandit-engine');
const experimentEngine = require('../experimentation-platform-engine');
const analyticsEngine = require('../analytics-reporting-engine');
const trafficEngine = require('../traffic-management-engine');
const integrationEngine = require('../integration-api-engine');
const aiEngine = require('../ai-ml-optimization-engine');
const advancedEngine = require('../advanced-features-engine');
const router = require('../comprehensive-router-v2');

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use('/api/tools/ab-testing-suite', router);

describe('AB Testing Suite V2 - Comprehensive Tests', () => {

  // ==================== STATISTICAL ANALYSIS TESTS ====================
  
  describe('Statistical Analysis Engine', () => {
    
    test('Z-Test for proportions', () => {
      const result = statisticalEngine.zTestProportions(
        { conversions: 100, samples: 1000 },
        { conversions: 120, samples: 1000 }
      );
      expect(result).toHaveProperty('pValue');
      expect(result).toHaveProperty('zScore');
      expect(result).toHaveProperty('significant');
      expect(typeof result.pValue).toBe('number');
    });

    test('Bayesian A/B test', () => {
      const result = statisticalEngine.bayesianABTest(
        { conversions: 100, samples: 1000 },
        { conversions: 120, samples: 1000 }
      );
      expect(result).toHaveProperty('probabilityBBeatsA');
      expect(result).toHaveProperty('expectedLossA');
      expect(result).toHaveProperty('expectedLossB');
      expect(result.probabilityBBeatsA).toBeGreaterThan(0);
      expect(result.probabilityBBeatsA).toBeLessThanOrEqual(1);
    });

    test('Sequential testing (SPRT)', () => {
      const experimentId = 'test-sprt-1';
      const result = statisticalEngine.sequentialTest(
        experimentId,
        { control: [0, 1, 0, 1], treatment: [1, 1, 1, 1] },
        { alpha: 0.05, beta: 0.2 }
      );
      expect(result).toHaveProperty('decision');
      expect(['continue', 'accept_h1', 'accept_h0']).toContain(result.decision);
    });

    test('Power analysis - sample size calculation', () => {
      const result = statisticalEngine.calculateSampleSize({
        baselineRate: 0.10,
        minimumDetectableEffect: 0.02,
        alpha: 0.05,
        power: 0.80,
        numVariants: 2
      });
      expect(result).toHaveProperty('samplesPerVariant');
      expect(result).toHaveProperty('totalSamples');
      expect(result.samplesPerVariant).toBeGreaterThan(0);
    });

    test('Meta-analysis - fixed effects', () => {
      const experiments = [
        { effect: 0.15, variance: 0.01, n: 1000 },
        { effect: 0.20, variance: 0.015, n: 800 },
        { effect: 0.18, variance: 0.012, n: 1200 }
      ];
      const result = statisticalEngine.metaAnalysisFixed(experiments);
      expect(result).toHaveProperty('pooledEffect');
      expect(result).toHaveProperty('variance');
      expect(result).toHaveProperty('confidenceInterval');
    });
  });

  // ==================== MULTI-ARMED BANDIT TESTS ====================
  
  describe('Multi-Armed Bandit Engine', () => {
    
    test('Thompson Sampling - binary rewards', () => {
      const experimentId = 'thompson-test-1';
      banditEngine.initThompsonSampling(experimentId, ['A', 'B', 'C'], 'binary');
      
      const selected = banditEngine.thompsonSample(experimentId);
      expect(['A', 'B', 'C']).toContain(selected);
      
      banditEngine.updateThompsonSampling(experimentId, selected, 1);
      const stats = banditEngine.getArmStats(experimentId);
      expect(stats).toHaveProperty(selected);
    });

    test('UCB1 algorithm', () => {
      const experimentId = 'ucb-test-1';
      banditEngine.initUCB(experimentId, ['A', 'B', 'C'], 'ucb1');
      
      for (let i = 0; i < 10; i++) {
        const selected = banditEngine.ucb1Select(experimentId);
        banditEngine.updateUCB(experimentId, selected, Math.random());
      }
      
      const stats = banditEngine.getArmStats(experimentId);
      expect(Object.keys(stats).length).toBe(3);
    });

    test('Contextual bandits - LinUCB', () => {
      const experimentId = 'linucb-test-1';
      banditEngine.initContextualBandit(experimentId, ['A', 'B'], 3);
      
      const context = [0.5, 0.8, 0.3];
      const selected = banditEngine.linUCBSelect(experimentId, context, 1.0);
      expect(['A', 'B']).toContain(selected);
      
      banditEngine.updateContextualBandit(experimentId, selected, context, 1);
    });

    test('Regret calculation', () => {
      const experimentId = 'regret-test-1';
      banditEngine.initEpsilonGreedy(experimentId, ['A', 'B'], 0.1, 0.99);
      
      for (let i = 0; i < 20; i++) {
        const selected = banditEngine.epsilonGreedySelect(experimentId);
        banditEngine.updateEpsilonGreedy(experimentId, selected, Math.random());
      }
      
      const regret = banditEngine.calculateRegret(experimentId);
      expect(regret).toHaveProperty('cumulativeRegret');
      expect(regret).toHaveProperty('instantaneousRegret');
    });
  });

  // ==================== EXPERIMENTATION PLATFORM TESTS ====================
  
  describe('Experimentation Platform Engine', () => {
    
    test('Create and start experiment', () => {
      const experiment = experimentEngine.createExperiment({
        name: 'Test Experiment',
        type: 'ab',
        variants: [
          { id: 'control', name: 'Control', weight: 0.5 },
          { id: 'treatment', name: 'Treatment', weight: 0.5 }
        ],
        targetMetric: 'conversion_rate'
      });
      
      expect(experiment).toHaveProperty('id');
      expect(experiment.status).toBe('draft');
      
      const started = experimentEngine.startExperiment(experiment.id);
      expect(started.status).toBe('active');
    });

    test('Multivariate testing - full factorial', () => {
      const factors = [
        { name: 'color', levels: ['red', 'blue'] },
        { name: 'cta', levels: ['buy', 'shop', 'order'] }
      ];
      
      const combinations = experimentEngine.generateFullFactorial(factors);
      expect(combinations.length).toBe(6); // 2 × 3
    });

    test('Feature flags with rollout', () => {
      const flag = experimentEngine.createFeatureFlag({
        name: 'new_feature',
        enabled: true,
        rolloutPercentage: 0
      });
      
      expect(flag).toHaveProperty('id');
      
      experimentEngine.updateRollout(flag.id, 50, 10, 60);
      const updated = experimentEngine.featureFlags.get(flag.id);
      expect(updated.rolloutPercentage).toBe(50);
    });

    test('Guardrail metrics checking', () => {
      const experimentId = 'guardrail-test-1';
      experimentEngine.initializeGuardrails(experimentId, [
        { name: 'revenue', type: 'threshold', threshold: 100, direction: 'above' }
      ]);
      
      const violations = experimentEngine.checkGuardrails(experimentId, {
        revenue: 95
      });
      
      expect(violations).toHaveLength(1);
      expect(violations[0].violated).toBe(true);
    });
  });

  // ==================== ANALYTICS & REPORTING TESTS ====================
  
  describe('Analytics & Reporting Engine', () => {
    
    test('Track and retrieve metrics', () => {
      analyticsEngine.trackMetric('exp-1', 'var-a', 'clicks', 1, 'user-123');
      analyticsEngine.trackMetric('exp-1', 'var-a', 'clicks', 1, 'user-124');
      analyticsEngine.trackMetric('exp-1', 'var-a', 'clicks', 0, 'user-125');
      
      const metrics = analyticsEngine.getMetrics('exp-1', 'var-a', 'clicks');
      expect(metrics).toHaveProperty('mean');
      expect(metrics).toHaveProperty('median');
      expect(metrics).toHaveProperty('percentiles');
      expect(metrics.count).toBe(3);
    });

    test('Funnel analysis', () => {
      const funnel = analyticsEngine.createFunnel({
        name: 'Checkout Funnel',
        steps: ['view', 'add_to_cart', 'checkout', 'purchase']
      });
      
      analyticsEngine.trackFunnelEvent(funnel.id, 'user-1', 'view');
      analyticsEngine.trackFunnelEvent(funnel.id, 'user-1', 'add_to_cart');
      analyticsEngine.trackFunnelEvent(funnel.id, 'user-1', 'purchase');
      
      const analysis = analyticsEngine.analyzeFunnel(funnel.id);
      expect(analysis).toHaveProperty('conversionRates');
      expect(analysis).toHaveProperty('dropOff');
    });

    test('Cohort retention analysis', () => {
      const cohort = analyticsEngine.createCohort({
        name: 'Week 1',
        startDate: new Date('2026-02-01')
      });
      
      analyticsEngine.addUserToCohort(cohort.id, 'user-1');
      analyticsEngine.trackCohortActivity(cohort.id, 'user-1', 'purchase');
      
      const retention = analyticsEngine.calculateCohortRetention(cohort.id);
      expect(retention).toHaveProperty('day1Retention');
      expect(retention).toHaveProperty('day7Retention');
      expect(retention).toHaveProperty('day30Retention');
    });

    test('Time-series trend detection', () => {
      const ts = analyticsEngine.createTimeSeries({
        experimentId: 'exp-1',
        metricName: 'revenue'
      });
      
      // Add time-series data points...
      const trends = analyticsEngine.detectTrends(ts.id, Date.now() - 86400000, Date.now());
      expect(trends).toHaveProperty('slope');
      expect(trends).toHaveProperty('rSquared');
      expect(trends).toHaveProperty('trend');
    });
  });

  // ==================== TRAFFIC MANAGEMENT TESTS ====================
  
  describe('Traffic Management Engine', () => {
    
    test('Hash-based traffic allocation', () => {
      const rule = trafficEngine.createTrafficRule({
        experimentId: 'exp-1',
        method: 'hash',
        variants: [
          { id: 'control', weight: 50 },
          { id: 'treatment', weight: 50 }
        ]
      });
      
      const assignment1 = trafficEngine.assignVariant(rule.id, 'user-123');
      const assignment2 = trafficEngine.assignVariant(rule.id, 'user-123');
      expect(assignment1).toBe(assignment2); // Consistent
    });

    test('Audience targeting with rules', () => {
      const audience = trafficEngine.createAudience({
        name: 'High Value',
        rules: [
          { field: 'totalPurchases', operator: 'gte', value: 10 }
        ]
      });
      
      const matches = trafficEngine.matchesAudience(audience.id, {
        totalPurchases: 15
      });
      
      expect(matches).toBe(true);
    });

    test('Gradual rollout execution', () => {
      const ramp = trafficEngine.createRampSchedule({
        experimentId: 'exp-1',
        variantId: 'treatment',
        startPercentage: 10,
        endPercentage: 100,
        incrementPercentage: 10,
        intervalMinutes: 60
      });
      
      trafficEngine.executeRampStep(ramp.id);
      const updated = trafficEngine.rampSchedules.get(ramp.id);
      expect(updated.currentPercentage).toBe(20);
    });

    test('Bot detection scoring', () => {
      const botRequest = {
        userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1)',
        requestRate: 100,
        behaviorScore: 20
      };
      
      const result = trafficEngine.isBotTraffic(botRequest);
      expect(result.isBot).toBe(true);
      expect(result.score).toBeGreaterThan(50);
    });
  });

  // ==================== INTEGRATION & API TESTS ====================
  
  describe('Integration & API Engine', () => {
    
    test('Webhook registration and triggering', async () => {
      const webhook = integrationEngine.registerWebhook({
        url: 'https://example.com/webhook',
        events: ['experiment.started', 'experiment.completed'],
        secret: 'test-secret'
      });
      
      expect(webhook).toHaveProperty('id');
      
      // Note: In real tests, would mock HTTP requests
      const result = await integrationEngine.triggerWebhook('experiment.started', {
        experimentId: 'exp-1'
      });
      
      expect(Array.isArray(result)).toBe(true);
    });

    test('API key creation and validation', () => {
      const apiKey = integrationEngine.createAPIKey(
        'Test Key',
        ['read', 'write'],
        1000,
        90
      );
      
      expect(apiKey).toHaveProperty('key');
      expect(apiKey).toHaveProperty('keyHash');
      
      const validated = integrationEngine.validateAPIKey(apiKey.key, ['read']);
      expect(validated.valid).toBe(true);
    });

    test('Rate limiting', () => {
      const apiKey = integrationEngine.createAPIKey('Rate Test', ['read'], 5);
      
      for (let i = 0; i < 5; i++) {
        const check = integrationEngine.checkRateLimit(apiKey.key);
        expect(check.allowed).toBe(true);
      }
      
      const exceeded = integrationEngine.checkRateLimit(apiKey.key);
      expect(exceeded.allowed).toBe(false);
    });

    test('Data export creation', () => {
      const dataExport = integrationEngine.createDataExport({
        name: 'Daily Export',
        destination: 'bigquery',
        format: 'json',
        config: {
          projectId: 'test-project',
          dataset: 'experiments',
          table: 'results'
        }
      });
      
      expect(dataExport).toHaveProperty('id');
      expect(dataExport.destination).toBe('bigquery');
    });
  });

  // ==================== AI & ML OPTIMIZATION TESTS ====================
  
  describe('AI & ML Optimization Engine', () => {
    
    test('Automated winner analysis', () => {
      const result = aiEngine.analyzeExperimentForWinner('exp-1', 0.95);
      expect(result).toHaveProperty('recommendation');
      expect(['DEPLOY_WINNER', 'CONTINUE_TEST', 'KEEP_CONTROL']).toContain(
        result.recommendation.action
      );
    });

    test('Duration prediction', () => {
      const prediction = aiEngine.predictExperimentDuration('exp-1', 1000, 10000);
      expect(prediction).toHaveProperty('estimatedDays');
      expect(prediction).toHaveProperty('estimatedEndDate');
    });

    test('Sample size recommendation', () => {
      const recommendation = aiEngine.recommendSampleSize({
        baselineRate: 0.10,
        mde: 0.02,
        confidence: 0.95,
        power: 0.80,
        numVariants: 2
      });
      
      expect(recommendation).toHaveProperty('samplesPerVariant');
      expect(recommendation.samplesPerVariant).toBeGreaterThan(0);
    });

    test('Anomaly detection', () => {
      const anomalies = aiEngine.detectAnomalies('exp-1', 'conversion_rate', 3);
      expect(Array.isArray(anomalies)).toBe(true);
    });

    test('Hypothesis generation', () => {
      const hypotheses = aiEngine.generateHypotheses({
        conversionRate: 0.03,
        cartAbandonmentRate: 0.75,
        avgOrderValue: 45
      });
      
      expect(Array.isArray(hypotheses)).toBe(true);
      expect(hypotheses.length).toBeGreaterThan(0);
    });

    test('Causal effect estimation', () => {
      const causal = aiEngine.estimateCausalEffect('exp-1', 'user_type');
      expect(causal).toHaveProperty('ate');
      expect(causal).toHaveProperty('cate');
    });
  });

  // ==================== ADVANCED FEATURES TESTS ====================
  
  describe('Advanced Features Engine', () => {
    
    test('Version control', () => {
      const version1 = advancedEngine.createVersion(
        'experiment',
        'exp-1',
        { name: 'Test', status: 'draft' },
        'user-1',
        'Initial version'
      );
      
      expect(version1).toHaveProperty('id');
      expect(version1.version).toBe(1);
      
      const history = advancedEngine.getVersionHistory('experiment', 'exp-1');
      expect(history.length).toBe(1);
    });

    test('Template creation and application', () => {
      const template = advancedEngine.createTemplate({
        name: 'Pricing Test',
        category: 'pricing',
        template: {
          name: '{{product_name}} Pricing Test',
          variants: [
            { price: '{{control_price}}' },
            { price: '{{test_price}}' }
          ]
        }
      });
      
      const applied = advancedEngine.applyTemplate(template.id, {
        product_name: 'Widget',
        control_price: '10',
        test_price: '12'
      });
      
      expect(applied.name).toBe('Widget Pricing Test');
    });

    test('Compliance rule checking', () => {
      const rule = advancedEngine.createComplianceRule({
        name: 'Data Retention',
        type: 'data-retention',
        condition: { maxDays: 90 },
        action: 'warn'
      });
      
      const violations = advancedEngine.checkCompliance({
        type: 'experiment',
        createdAt: new Date(Date.now() - 100 * 86400000) // 100 days ago
      });
      
      expect(violations.length).toBeGreaterThan(0);
    });

    test('Audit logging', () => {
      const log = advancedEngine.logAudit(
        'experiment',
        'exp-1',
        'update',
        'user-1',
        { status: { from: 'draft', to: 'active' } }
      );
      
      expect(log).toHaveProperty('id');
      expect(log).toHaveProperty('timestamp');
      
      const logs = advancedEngine.getAuditLogs({ entityId: 'exp-1' });
      expect(logs.length).toBeGreaterThan(0);
    });

    test('Backup and restore', () => {
      const backup = advancedEngine.createBackup('Test backup', 'user-1');
      expect(backup).toHaveProperty('id');
      expect(backup).toHaveProperty('data');
      
      const backups = advancedEngine.listBackups();
      expect(backups.length).toBeGreaterThan(0);
    });

    test('Approval workflow', () => {
      const approval = advancedEngine.requestApproval({
        entityType: 'experiment',
        entityId: 'exp-1',
        requestedBy: 'user-1',
        approvers: ['manager-1', 'manager-2'],
        reason: 'High-risk experiment'
      });
      
      expect(approval.status).toBe('pending');
      
      advancedEngine.respondToApproval(approval.id, 'manager-1', 'approved', 'LGTM');
      const updated = advancedEngine.approvals.get(approval.id);
      expect(updated.responses.length).toBe(1);
    });

    test('Cost tracking', () => {
      advancedEngine.trackCost('exp-1', 'infrastructure', 150, 'Server costs');
      advancedEngine.trackCost('exp-1', 'analysis', 50, 'Data processing');
      
      const summary = advancedEngine.getCostSummary('exp-1');
      expect(summary.totalCost).toBe(200);
      expect(summary.byCategory.infrastructure).toBe(150);
    });
  });

  // ==================== INTEGRATION TESTS (Router Endpoints) ====================
  
  describe('Router Integration Tests', () => {
    
    test('GET /health - Health check', async () => {
      const res = await request(app).get('/api/tools/ab-testing-suite/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.health).toHaveProperty('status');
      expect(res.body.health.status).toBe('healthy');
    });

    test('GET /stats - Platform statistics', async () => {
      const res = await request(app).get('/api/tools/ab-testing-suite/stats');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats).toHaveProperty('totalExperiments');
    });

    test('POST /statistical/z-test - Z-test endpoint', async () => {
      const res = await request(app)
        .post('/api/tools/ab-testing-suite/statistical/z-test')
        .send({
          control: { conversions: 100, samples: 1000 },
          treatment: { conversions: 120, samples: 1000 }
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.result).toHaveProperty('pValue');
    });

    test('POST /experiments - Create experiment via API', async () => {
      const res = await request(app)
        .post('/api/tools/ab-testing-suite/experiments')
        .send({
          name: 'API Test Experiment',
          type: 'ab',
          variants: [
            { id: 'control', name: 'Control', weight: 0.5 },
            { id: 'treatment', name: 'Treatment', weight: 0.5 }
          ]
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.result).toHaveProperty('id');
    });
  });
});
