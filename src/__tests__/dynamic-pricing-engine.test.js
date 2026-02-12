process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../server');
const db = require('../tools/dynamic-pricing-engine/db');
const analyticsModel = require('../tools/dynamic-pricing-engine/analyticsModel');
const signalsStore = require('../tools/dynamic-pricing-engine/signalsStore');
const experiments = require('../tools/dynamic-pricing-engine/experiments');
const { sampleRule, sampleSignals, priceRequest } = require('../tools/dynamic-pricing-engine/fixtures');

describe('Dynamic Pricing Engine API', () => {
  beforeEach(() => {
    db.clear();
    analyticsModel.clear();
    signalsStore.clear();
    experiments.clear();
  });

  it('validates rules on create', async () => {
    const badRes = await request(app).post('/api/dynamic-pricing-engine/rules').send({ scope: 'global' });
    expect(badRes.statusCode).toBe(400);
    expect(badRes.body.ok).toBe(false);

    const goodRes = await request(app).post('/api/dynamic-pricing-engine/rules').send(sampleRule);
    expect(goodRes.statusCode).toBe(200);
    expect(goodRes.body.ok).toBe(true);
    expect(goodRes.body.rule).toHaveProperty('id');
  });

  it('publishes rules', async () => {
    const create = await request(app).post('/api/dynamic-pricing-engine/rules').send(sampleRule);
    const id = create.body.rule.id;
    const publish = await request(app).post(`/api/dynamic-pricing-engine/rules/${id}/publish`);
    expect(publish.statusCode).toBe(200);
    expect(publish.body.rule.status).toBe('published');
  });

  it('evaluates pricing with guardrails and rounding disabled', async () => {
    const res = await request(app)
      .post('/api/dynamic-pricing-engine/pricing/evaluate')
      .send({ ...priceRequest, rules: [{ ...sampleRule, actions: [{ type: 'discount-percent', value: 10 }] }] });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.price).toBeCloseTo(90); // 10% discount on 100
    expect(res.body.diagnostics.guardrailHits.length).toBe(0);
    expect(res.body.diagnostics.appliedRules.length).toBeGreaterThan(0);
  });

  it('ingests signals and returns summary', async () => {
    const ingest = await request(app)
      .post('/api/dynamic-pricing-engine/signals/ingest')
      .send({ items: sampleSignals });
    expect(ingest.statusCode).toBe(200);
    expect(ingest.body.ok).toBe(true);
    expect(ingest.body.summary.total).toBe(2);

    const summary = await request(app).get('/api/dynamic-pricing-engine/signals/summary');
    expect(summary.statusCode).toBe(200);
    expect(summary.body.summary.total).toBe(2);
  });

  it('summarizes analytics after pricing evaluate', async () => {
    await request(app).post('/api/dynamic-pricing-engine/pricing/evaluate').send(priceRequest);
    const analytics = await request(app).get('/api/dynamic-pricing-engine/analytics/summary');
    expect(analytics.statusCode).toBe(200);
    expect(analytics.body.summary.total).toBeGreaterThan(0);
    expect(Object.keys(analytics.body.summary.counts)).toContain('pricing.evaluate');
  });

  it('falls back on AI price when no key is set', async () => {
    const aiRes = await request(app)
      .post('/api/dynamic-pricing-engine/ai/price')
      .send({ basePrice: 50, productId: 'sku-1' });

    expect(aiRes.statusCode).toBe(200);
    expect(aiRes.body.ok).toBe(true);
    expect(typeof aiRes.body.price).toBe('number');
  });

  describe('Rounding Strategies', () => {
    it('applies ending-99 rounding', async () => {
      const res = await request(app)
        .post('/api/dynamic-pricing-engine/pricing/evaluate')
        .send({
          basePrice: 103.45,
          rounding: 'ending-99'
        });
      expect(res.body.price).toBe(102.99);
    });

    it('applies ending-95 rounding', async () => {
      const res = await request(app)
        .post('/api/dynamic-pricing-engine/pricing/evaluate')
        .send({
          basePrice: 103.45,
          rounding: 'ending-95'
        });
      expect(res.body.price).toBe(102.95);
    });

    it('applies step rounding to nearest 5', async () => {
      const res = await request(app)
        .post('/api/dynamic-pricing-engine/pricing/evaluate')
        .send({
          basePrice: 103.45,
          rounding: 'step',
          roundingStep: 5
        });
      expect(res.body.price).toBe(105);
    });

    it('skips rounding when set to none', async () => {
      const res = await request(app)
        .post('/api/dynamic-pricing-engine/pricing/evaluate')
        .send({
          basePrice: 103.45,
          rounding: 'none'
        });
      expect(res.body.price).toBe(103.45);
    });
  });

  describe('Guardrail Enforcement', () => {
    it('enforces floor price', async () => {
      const res = await request(app)
        .post('/api/dynamic-pricing-engine/pricing/evaluate')
        .send({
          basePrice: 50,
          guardrails: { floor: 80 },
          rules: [{ scope: 'global', actions: [{ type: 'discount-percent', value: 50 }] }]
        });
      expect(res.body.price).toBe(80);
      expect(res.body.diagnostics.guardrailHits).toContainEqual(
        expect.objectContaining({ type: 'floor', value: 80 })
      );
    });

    it('enforces ceiling price', async () => {
      const res = await request(app)
        .post('/api/dynamic-pricing-engine/pricing/evaluate')
        .send({
          basePrice: 100,
          guardrails: { ceiling: 120 },
          rules: [{ scope: 'global', actions: [{ type: 'surcharge-percent', value: 50 }] }]
        });
      expect(res.body.price).toBe(120);
      expect(res.body.diagnostics.guardrailHits).toContainEqual(
        expect.objectContaining({ type: 'ceiling', value: 120 })
      );
    });

    it('enforces MAP (minimum advertised price)', async () => {
      const res = await request(app)
        .post('/api/dynamic-pricing-engine/pricing/evaluate')
        .send({
          basePrice: 100,
          guardrails: { map: 90 },
          rules: [{ scope: 'global', actions: [{ type: 'discount-percent', value: 20 }] }]
        });
      expect(res.body.price).toBe(90);
      expect(res.body.diagnostics.guardrailHits).toContainEqual(
        expect.objectContaining({ type: 'map', value: 90 })
      );
    });

    it('enforces minimum margin', async () => {
      const res = await request(app)
        .post('/api/dynamic-pricing-engine/pricing/evaluate')
        .send({
          basePrice: 100,
          cost: 80,
          guardrails: { minMargin: 0.25 }, // require 25% margin
          rules: [{ scope: 'global', actions: [{ type: 'discount-percent', value: 15 }] }]
        });
      expect(res.body.price).toBe(100); // margin enforced
      expect(res.body.diagnostics.guardrailHits).toContainEqual(
        expect.objectContaining({ type: 'minMargin' })
      );
    });
  });

  describe('Action Types', () => {
    it('applies set-price action', async () => {
      const res = await request(app)
        .post('/api/dynamic-pricing-engine/pricing/evaluate')
        .send({
          basePrice: 100,
          rounding: 'none',
          rules: [{ scope: 'global', actions: [{ type: 'set-price', value: 75 }] }]
        });
      expect(res.body.price).toBe(75);
    });

    it('applies discount-amount action', async () => {
      const res = await request(app)
        .post('/api/dynamic-pricing-engine/pricing/evaluate')
        .send({
          basePrice: 100,
          rounding: 'none',
          rules: [{ scope: 'global', actions: [{ type: 'discount-amount', value: 15 }] }]
        });
      expect(res.body.price).toBe(85);
    });

    it('applies surcharge-percent action', async () => {
      const res = await request(app)
        .post('/api/dynamic-pricing-engine/pricing/evaluate')
        .send({
          basePrice: 100,
          rounding: 'none',
          rules: [{ scope: 'global', actions: [{ type: 'surcharge-percent', value: 10 }] }]
        });
      expect(res.body.price).toBe(110);
    });

    it('applies surcharge-amount action', async () => {
      const res = await request(app)
        .post('/api/dynamic-pricing-engine/pricing/evaluate')
        .send({
          basePrice: 100,
          rounding: 'none',
          rules: [{ scope: 'global', actions: [{ type: 'surcharge-amount', value: 20 }] }]
        });
      expect(res.body.price).toBe(120);
    });
  });

  describe('Rule Priority', () => {
    it('applies higher priority rules first', async () => {
      const res = await request(app)
        .post('/api/dynamic-pricing-engine/pricing/evaluate')
        .send({
          basePrice: 100,
          rules: [
            { scope: 'global', priority: 10, actions: [{ type: 'discount-percent', value: 10 }] },
            { scope: 'global', priority: 20, actions: [{ type: 'discount-percent', value: 5 }] }
          ]
        });
      expect(res.body.price).toBeLessThan(100);
      expect(res.body.diagnostics.appliedRules.length).toBeGreaterThan(0);
    });
  });

  describe('Rule Scopes', () => {
    it('applies category-scoped rules', async () => {
      const res = await request(app)
        .post('/api/dynamic-pricing-engine/pricing/evaluate')
        .send({
          basePrice: 100,
          category: 'electronics',
          rounding: 'none',
          rules: [
            { scope: 'category', scopeValue: 'electronics', actions: [{ type: 'discount-percent', value: 15 }] }
          ]
        });
      expect(res.body.price).toBe(85);
    });

    it('applies product-scoped rules', async () => {
      const res = await request(app)
        .post('/api/dynamic-pricing-engine/pricing/evaluate')
        .send({
          basePrice: 100,
          productId: 'sku-123',
          rounding: 'none',
          rules: [
            { scope: 'product', scopeValue: 'sku-123', actions: [{ type: 'set-price', value: 79.99 }] }
          ]
        });
      expect(res.body.price).toBe(79.99);
    });

    it('applies segment-scoped rules', async () => {
      const res = await request(app)
        .post('/api/dynamic-pricing-engine/pricing/evaluate')
        .send({
          basePrice: 100,
          segment: 'vip',
          rounding: 'none',
          rules: [
            { scope: 'segment', scopeValue: 'vip', actions: [{ type: 'discount-percent', value: 20 }] }
          ]
        });
      expect(res.body.price).toBe(80);
    });
  });

  describe('Error Handling', () => {
    it('rejects invalid rule validation', async () => {
      const res = await request(app)
        .post('/api/dynamic-pricing-engine/rules/validate')
        .send({ scope: 'global' }); // missing name and actions
      expect(res.statusCode).toBe(400);
      expect(res.body.valid).toBe(false);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('handles rollback for non-existent rule', async () => {
      const res = await request(app)
        .post('/api/dynamic-pricing-engine/rules/999/rollback');
      expect(res.statusCode).toBe(404);
    });

    it('handles publish for non-existent rule', async () => {
      const res = await request(app)
        .post('/api/dynamic-pricing-engine/rules/999/publish');
      expect(res.statusCode).toBe(404);
    });
  });

  describe('Experiments & A/B Testing', () => {
    it('creates a pricing experiment', async () => {
      const res = await request(app)
        .post('/api/dynamic-pricing-engine/experiments')
        .send({
          name: 'Holiday Pricing Test',
          description: 'Test .99 vs .95 vs .89 endings',
          allocationStrategy: 'random',
          variants: [
            { id: 'v1', name: 'Control', weight: 1, rounding: 'ending-99' },
            { id: 'v2', name: 'Variant A', weight: 1, rounding: 'ending-95' },
            { id: 'v3', name: 'Variant B', weight: 1, rounding: 'none' }
          ],
          scope: 'category',
          scopeValue: 'electronics'
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.experiment).toHaveProperty('id');
      expect(res.body.experiment.status).toBe('draft');
    });

    it('starts and assigns variants to users', async () => {
      const create = await request(app)
        .post('/api/dynamic-pricing-engine/experiments')
        .send({
          name: 'Test Experiment',
          variants: [
            { id: 'control', name: 'Control', weight: 1 },
            { id: 'variant', name: 'Variant', weight: 1 }
          ]
        });
      const experimentId = create.body.experiment.id;

      const start = await request(app)
        .post(`/api/dynamic-pricing-engine/experiments/${experimentId}/start`);
      expect(start.body.experiment.status).toBe('running');

      const assign = await request(app)
        .post(`/api/dynamic-pricing-engine/experiments/${experimentId}/assign`)
        .send({ userId: 'user-123' });
      expect(assign.statusCode).toBe(200);
      expect(assign.body.assignment).toHaveProperty('variantId');
      expect(['control', 'variant']).toContain(assign.body.assignment.variantId);
    });

    it('records outcomes and updates metrics', async () => {
      const create = await request(app)
        .post('/api/dynamic-pricing-engine/experiments')
        .send({
          name: 'Revenue Test',
          variants: [{ id: 'v1', name: 'Variant 1', weight: 1 }]
        });
      const experimentId = create.body.experiment.id;

      await request(app).post(`/api/dynamic-pricing-engine/experiments/${experimentId}/start`);
      await request(app)
        .post(`/api/dynamic-pricing-engine/experiments/${experimentId}/assign`)
        .send({ userId: 'user-456' });

      const outcome = await request(app)
        .post(`/api/dynamic-pricing-engine/experiments/${experimentId}/outcome`)
        .send({
          userId: 'user-456',
          outcome: { converted: true, revenue: 125.50 }
        });
      expect(outcome.statusCode).toBe(200);
      expect(outcome.body.ok).toBe(true);
    });

    it('retrieves experiment results', async () => {
      const create = await request(app)
        .post('/api/dynamic-pricing-engine/experiments')
        .send({
          name: 'Results Test',
          variants: [
            { id: 'a', name: 'A', weight: 1 },
            { id: 'b', name: 'B', weight: 1 }
          ]
        });
      const experimentId = create.body.experiment.id;

      await request(app).post(`/api/dynamic-pricing-engine/experiments/${experimentId}/start`);
      
      const results = await request(app)
        .get(`/api/dynamic-pricing-engine/experiments/${experimentId}`);
      expect(results.statusCode).toBe(200);
      expect(results.body.experiment).toHaveProperty('id');
      expect(results.body.metrics).toHaveProperty('variants');
      expect(results.body.metrics.variants.length).toBe(2);
    });

    it('pauses experiment on guardrail breach', async () => {
      const create = await request(app)
        .post('/api/dynamic-pricing-engine/experiments')
        .send({
          name: 'Guardrail Test',
          variants: [{ id: 'v1', name: 'V1', weight: 1 }],
          guardrails: { minConversionRate: 0.05 },
          autoStopOnGuardrailBreach: true
        });
      const experimentId = create.body.experiment.id;

      await request(app).post(`/api/dynamic-pricing-engine/experiments/${experimentId}/start`);

      // Simulate many non-conversions to trigger guardrail
      for (let i = 0; i < 150; i++) {
        await request(app)
          .post(`/api/dynamic-pricing-engine/experiments/${experimentId}/assign`)
          .send({ userId: `user-${i}` });
        await request(app)
          .post(`/api/dynamic-pricing-engine/experiments/${experimentId}/outcome`)
          .send({ userId: `user-${i}`, outcome: { converted: false } });
      }

      const results = await request(app)
        .get(`/api/dynamic-pricing-engine/experiments/${experimentId}`);
      expect(results.body.experiment.status).toBe('paused');
    });

    it('lists experiments with filters', async () => {
      await request(app)
        .post('/api/dynamic-pricing-engine/experiments')
        .send({ name: 'Draft Exp', variants: [{ id: 'v', name: 'V' }] });
      
      const create = await request(app)
        .post('/api/dynamic-pricing-engine/experiments')
        .send({ name: 'Running Exp', variants: [{ id: 'v', name: 'V' }] });
      
      await request(app)
        .post(`/api/dynamic-pricing-engine/experiments/${create.body.experiment.id}/start`);

      const all = await request(app).get('/api/dynamic-pricing-engine/experiments');
      expect(all.body.experiments.length).toBeGreaterThanOrEqual(2);

      const running = await request(app)
        .get('/api/dynamic-pricing-engine/experiments?status=running');
      expect(running.body.experiments.length).toBeGreaterThanOrEqual(1);
      expect(running.body.experiments[0].status).toBe('running');
    });
  });

  describe('Rule Versioning & History', () => {
    it('tracks version history on rule creation', async () => {
      const create = await request(app)
        .post('/api/dynamic-pricing-engine/rules')
        .send(sampleRule);
      const ruleId = create.body.rule.id;

      const history = await request(app)
        .get(`/api/dynamic-pricing-engine/rules/${ruleId}/history`);
      expect(history.statusCode).toBe(200);
      expect(history.body.ok).toBe(true);
      expect(history.body.history.length).toBe(1);
      expect(history.body.history[0].changeType).toBe('create');
    });

    it('tracks version history on rule update', async () => {
      const create = await request(app)
        .post('/api/dynamic-pricing-engine/rules')
        .send(sampleRule);
      const ruleId = create.body.rule.id;

      await request(app)
        .put(`/api/dynamic-pricing-engine/rules/${ruleId}`)
        .send({ name: 'Updated Rule Name' });

      const history = await request(app)
        .get(`/api/dynamic-pricing-engine/rules/${ruleId}/history`);
      expect(history.body.history.length).toBe(2);
      expect(history.body.history[1].changeType).toBe('update');
      expect(history.body.history[1].changes.length).toBeGreaterThan(0);
    });

    it('retrieves specific version', async () => {
      const create = await request(app)
        .post('/api/dynamic-pricing-engine/rules')
        .send(sampleRule);
      const ruleId = create.body.rule.id;

      const version = await request(app)
        .get(`/api/dynamic-pricing-engine/rules/${ruleId}/versions/1`);
      expect(version.statusCode).toBe(200);
      expect(version.body.version.version).toBe(1);
      expect(version.body.version.snapshot).toHaveProperty('name');
    });

    it('compares two versions and shows diff', async () => {
      const create = await request(app)
        .post('/api/dynamic-pricing-engine/rules')
        .send(sampleRule);
      const ruleId = create.body.rule.id;

      await request(app)
        .put(`/api/dynamic-pricing-engine/rules/${ruleId}`)
        .send({ name: 'Modified Name', priority: 20 });

      const compare = await request(app)
        .get(`/api/dynamic-pricing-engine/rules/${ruleId}/compare?version1=1&version2=2`);
      expect(compare.statusCode).toBe(200);
      expect(compare.body.comparison.diff.length).toBeGreaterThan(0);
      expect(compare.body.comparison.diff.some(d => d.field === 'name')).toBe(true);
    });

    it('reverts rule to previous version', async () => {
      const create = await request(app)
        .post('/api/dynamic-pricing-engine/rules')
        .send({ ...sampleRule, name: 'Original Name' });
      const ruleId = create.body.rule.id;

      await request(app)
        .put(`/api/dynamic-pricing-engine/rules/${ruleId}`)
        .send({ name: 'Changed Name' });

      const revert = await request(app)
        .post(`/api/dynamic-pricing-engine/rules/${ruleId}/revert/1`)
        .send({ revertedBy: 'admin' });
      expect(revert.statusCode).toBe(200);
      expect(revert.body.ok).toBe(true);
      expect(revert.body.revertedTo).toBe(1);

      const history = await request(app)
        .get(`/api/dynamic-pricing-engine/rules/${ruleId}/history`);
      expect(history.body.history.length).toBe(3); // create, update, rollback
      expect(history.body.history[2].changeType).toBe('rollback');
    });

    it('retrieves recent changes across all rules', async () => {
      await request(app).post('/api/dynamic-pricing-engine/rules').send(sampleRule);
      await request(app).post('/api/dynamic-pricing-engine/rules').send({ ...sampleRule, name: 'Another Rule' });

      const recent = await request(app).get('/api/dynamic-pricing-engine/versions/recent?limit=5');
      expect(recent.statusCode).toBe(200);
      expect(recent.body.changes.length).toBeGreaterThan(0);
      expect(recent.body.changes[0]).toHaveProperty('changeType');
      expect(recent.body.changes[0]).toHaveProperty('changedAt');
    });

    it('retrieves version summary for all rules', async () => {
      await request(app).post('/api/dynamic-pricing-engine/rules').send(sampleRule);
      
      const summary = await request(app).get('/api/dynamic-pricing-engine/versions/summary');
      expect(summary.statusCode).toBe(200);
      expect(summary.body.summary.length).toBeGreaterThan(0);
      expect(summary.body.summary[0]).toHaveProperty('versionCount');
      expect(summary.body.summary[0]).toHaveProperty('currentVersion');
    });
  });
});
