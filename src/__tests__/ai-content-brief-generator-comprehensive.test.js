/**
 * AI Content Brief Generator - Comprehensive Test Suite
 *
 * Tests all 8 engines + system health + E2E journey
 * Total: 49 tests (48 unit tests + 1 E2E test)
 */

const request = require('supertest');
const express = require('express');
const router = require('../tools/ai-content-brief-generator/router');

const app = express();
app.use(express.json());
app.use('/api/ai-content-brief-generator', router);

let briefId;
let outlineId;
let seoId;
let planId;
let approvalId;
let runId;

describe('AI Content Brief Generator - Comprehensive Test Suite', () => {
  // ============================================================================
  // SYSTEM HEALTH (2 tests)
  // ============================================================================
  describe('System', () => {
    test('health endpoint returns ok', async () => {
      const res = await request(app).get('/api/ai-content-brief-generator/health');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.status).toMatch(/running/);
    });

    test('stats endpoint returns aggregates', async () => {
      const res = await request(app).get('/api/ai-content-brief-generator/stats');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.stats).toHaveProperty('research');
      expect(res.body.stats).toHaveProperty('outlines');
      expect(res.body.stats).toHaveProperty('seo');
    });
  });

  // ============================================================================
  // RESEARCH & STRATEGY (6 tests)
  // ============================================================================
  describe('Research & Strategy Engine', () => {
    test('creates a research brief', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/research/brief')
        .send({
          topic: 'AI content brief best practices',
          primaryKeyword: 'ai content brief',
          audience: 'Demand Gen',
          goal: 'Pipeline',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('briefId');
      briefId = res.body.data.briefId;
    });

    test('gets the research brief by id', async () => {
      const res = await request(app).get(`/api/ai-content-brief-generator/research/brief/${briefId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.briefId).toBe(briefId);
      expect(res.body.data).toHaveProperty('research');
    });

    test('lists research briefs', async () => {
      const res = await request(app).get('/api/ai-content-brief-generator/research/briefs');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('scores an idea', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/research/score-idea')
        .send({ idea: 'Launch a compliance-focused brief pack' });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('strength');
      expect(res.body.data).toHaveProperty('recommendations');
    });

    test('returns frameworks for industry', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/research/frameworks')
        .send({ industry: 'SaaS' });
      expect(res.status).toBe(200);
      expect(res.body.data.frameworks.length).toBeGreaterThan(0);
    });

    test('logs research notes', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/research/notes')
        .send({ briefId, note: 'Add competitor mapping' });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
    });
  });

  // ============================================================================
  // OUTLINE ENGINE (6 tests)
  // ============================================================================
  describe('Outline Engine', () => {
    test('generates an outline', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/outline/generate')
        .send({ briefId, topic: 'AI Brief Outline', persona: 'Content Lead' });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('outlineId');
      outlineId = res.body.data.outlineId;
    });

    test('gets outline by id', async () => {
      const res = await request(app).get(`/api/ai-content-brief-generator/outline/${outlineId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.outlineId).toBe(outlineId);
      expect(res.body.data.sections.length).toBeGreaterThan(0);
    });

    test('updates outline sections', async () => {
      const res = await request(app)
        .put(`/api/ai-content-brief-generator/outline/${outlineId}`)
        .send({
          sections: [
            { heading: 'Problem', notes: 'Updated problem statement', wordCount: 100 },
            { heading: 'Solution', notes: 'Updated solution', wordCount: 200 },
          ],
        });
      expect(res.status).toBe(200);
      expect(res.body.data.sections.length).toBe(2);
    });

    test('creates an outline version', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/outline/version')
        .send({ outlineId, name: 'v2' });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('versionId');
    });

    test('scores outline', async () => {
      const res = await request(app).get(`/api/ai-content-brief-generator/outline/${outlineId}/score`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('score');
      expect(res.body.data).toHaveProperty('grade');
    });

    test('lists outlines', async () => {
      const res = await request(app).get('/api/ai-content-brief-generator/outline');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ============================================================================
  // SEO BRIEF ENGINE (6 tests)
  // ============================================================================
  describe('SEO Brief Engine', () => {
    test('scores SEO brief', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/seo-brief/score')
        .send({
          contentId: briefId,
          title: 'AI Content Brief Generator',
          metaDescription: 'Generate SEO-ready content briefs with AI, governance, and collaboration built-in.',
          headings: { h1: ['AI Content Brief Generator'], h2: ['Why briefs matter'] },
          keywords: ['ai content brief', 'seo content outline'],
          internalLinks: 4,
          externalLinks: 2,
        });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('score');
      expect(res.body.data).toHaveProperty('grade');
      seoId = res.body.data.contentId;
    });

    test('gets SEO brief by id', async () => {
      const res = await request(app).get(`/api/ai-content-brief-generator/seo-brief/${seoId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.contentId).toBe(seoId);
      expect(res.body.data).toHaveProperty('breakdown');
    });

    test('analyzes keywords', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/seo-brief/keywords')
        .send({ primaryKeyword: 'content brief', content: 'content brief content brief', targetDensity: 2.0 });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('density');
      expect(res.body.data).toHaveProperty('status');
    });

    test('analyzes metadata', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/seo-brief/metadata')
        .send({ title: 'AI Content Briefs', description: 'Detailed description for SEO', keywords: ['brief', 'ai'] });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('score');
    });

    test('suggests schema', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/seo-brief/schema')
        .send({ contentType: 'Article', title: 'Brief', keywords: ['ai'] });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('required');
    });

    test('returns SEO statistics', async () => {
      const res = await request(app).get('/api/ai-content-brief-generator/seo-brief/statistics');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalScores');
      expect(res.body.data).toHaveProperty('byGrade');
    });
  });

  // ============================================================================
  // DISTRIBUTION & WORKFLOWS (6 tests)
  // ============================================================================
  describe('Distribution & Workflows', () => {
    test('creates distribution plan', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/distribution/plan')
        .send({ briefId, topic: 'AI content brief launch' });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('planId');
      planId = res.body.data.planId;
    });

    test('gets distribution plan', async () => {
      const res = await request(app).get(`/api/ai-content-brief-generator/distribution/plan/${planId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.planId).toBe(planId);
      expect(res.body.data.channels.length).toBeGreaterThan(0);
    });

    test('activates a channel', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/distribution/activate')
        .send({ planId, channel: 'Email' });
      expect(res.status).toBe(200);
      expect(res.body.data.channels.find((c) => c.channel === 'Email').status).toBe('ready');
    });

    test('returns readiness score', async () => {
      const res = await request(app).get(`/api/ai-content-brief-generator/distribution/plan/${planId}/readiness`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('score');
    });

    test('returns schedule window', async () => {
      const res = await request(app)
        .get(`/api/ai-content-brief-generator/distribution/plan/${planId}/window`)
        .query({ window: 'next_7_days' });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('window');
    });

    test('distribution stats', async () => {
      const res = await request(app).get('/api/ai-content-brief-generator/distribution/stats');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalPlans');
    });
  });

  // ============================================================================
  // COLLABORATION & APPROVALS (6 tests)
  // ============================================================================
  describe('Collaboration & Approvals', () => {
    test('creates a collaboration task', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/collaboration/task')
        .send({ briefId, title: 'Add product screenshots' });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('taskId');
    });

    test('adds a comment', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/collaboration/comment')
        .send({ briefId, author: 'Reviewer', text: 'Need ROI proof point' });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('commentId');
    });

    test('assigns reviewer', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/collaboration/reviewer')
        .send({ briefId, reviewer: 'Legal' });
      expect(res.status).toBe(200);
      expect(res.body.data.reviewers).toContain('Legal');
    });

    test('updates collaboration status', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/collaboration/status')
        .send({ briefId, status: 'in_review' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('in_review');
    });

    test('gets collaboration state', async () => {
      const res = await request(app).get(`/api/ai-content-brief-generator/collaboration/${briefId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBeGreaterThan(0);
      expect(res.body.data.comments.length).toBeGreaterThan(0);
    });

    test('lists collaboration activities', async () => {
      const res = await request(app).get(`/api/ai-content-brief-generator/collaboration/${briefId}/activities`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ============================================================================
  // GOVERNANCE & COMPLIANCE (6 tests)
  // ============================================================================
  describe('Governance & Compliance', () => {
    test('evaluates compliance', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/governance/check')
        .send({ briefId, containsPII: false, citations: 1, tone: 'off-brand' });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('status');
      expect(res.body.data).toHaveProperty('issues');
    });

    test('lists policies', async () => {
      const res = await request(app).get('/api/ai-content-brief-generator/governance/policies');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('requests approval', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/governance/approval')
        .send({ briefId, owner: 'Content Lead', reviewer: 'Legal' });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('approvalId');
      approvalId = res.body.data.approvalId;
    });

    test('gets approval', async () => {
      const res = await request(app).get(`/api/ai-content-brief-generator/governance/approval/${approvalId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.approvalId).toBe(approvalId);
    });

    test('returns audit trail', async () => {
      const res = await request(app).get(`/api/ai-content-brief-generator/governance/audit/${briefId}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('feature endpoints respond', async () => {
      const res = await request(app).get('/api/ai-content-brief-generator/governance/feature-1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ============================================================================
  // PERFORMANCE & ANALYTICS (6 tests)
  // ============================================================================
  describe('Performance & Analytics', () => {
    test('records performance', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/performance/record')
        .send({ briefId, views: 1500, engagementRate: 0.48 });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('views');
    });

    test('gets performance', async () => {
      const res = await request(app).get(`/api/ai-content-brief-generator/performance/${briefId}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('engagementRate');
    });

    test('forecasts performance', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/performance/forecast')
        .send({ horizon: '30d', current: { views: 2000, engagementRate: 0.5, conversionRate: 0.09 } });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('predictedViews');
    });

    test('compares periods', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/performance/compare')
        .send({
          period1: { views: 1000, engagementRate: 0.4, conversionRate: 0.06 },
          period2: { views: 1400, engagementRate: 0.46, conversionRate: 0.08 },
        });
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('deltas');
    });

    test('performance stats', async () => {
      const res = await request(app).get('/api/ai-content-brief-generator/performance/stats');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('totalTracked');
    });

    test('performance feature endpoint responds', async () => {
      const res = await request(app).get('/api/ai-content-brief-generator/performance/feature-2');
      expect(res.status).toBe(200);
    });
  });

  // ============================================================================
  // AI ORCHESTRATION (6 tests)
  // ============================================================================
  describe('AI Orchestration', () => {
    test('orchestrates a brief', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/ai/orchestrate')
        .send({ topic: 'AI brief orchestration', priority: 'quality' });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('runId');
      runId = res.body.data.runId;
    });

    test('runs ensemble', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/ai/ensemble')
        .send({ strategy: 'best_of_n' });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('outputs');
    });

    test('lists providers', async () => {
      const res = await request(app).get('/api/ai-content-brief-generator/ai/providers');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test('captures feedback', async () => {
      const res = await request(app)
        .post('/api/ai-content-brief-generator/ai/feedback')
        .send({ runId, feedback: 'Great summary' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('recorded');
    });

    test('gets run by id', async () => {
      const res = await request(app).get(`/api/ai-content-brief-generator/ai/run/${runId}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('runId');
    });

    test('feature endpoint responds', async () => {
      const res = await request(app).get('/api/ai-content-brief-generator/ai/feature-3');
      expect(res.status).toBe(200);
    });
  });

  // ============================================================================
  // E2E JOURNEY (1 test)
  // ============================================================================
  describe('E2E Journey', () => {
    test('research -> outline -> SEO -> distribution -> governance -> performance journey', async () => {
      // Research summary
      const research = await request(app).get('/api/ai-content-brief-generator/research/briefs');
      expect(research.status).toBe(200);

      // Outline score
      const outlineScore = await request(app).get(`/api/ai-content-brief-generator/outline/${outlineId}/score`);
      expect(outlineScore.status).toBe(200);

      // SEO stats
      const seoStats = await request(app).get('/api/ai-content-brief-generator/seo-brief/statistics');
      expect(seoStats.status).toBe(200);

      // Distribution readiness
      const readiness = await request(app).get(`/api/ai-content-brief-generator/distribution/plan/${planId}/readiness`);
      expect(readiness.status).toBe(200);

      // Governance policies
      const policies = await request(app).get('/api/ai-content-brief-generator/governance/policies');
      expect(policies.status).toBe(200);

      // Performance stats
      const perfStats = await request(app).get('/api/ai-content-brief-generator/performance/stats');
      expect(perfStats.status).toBe(200);
    });
  });
});
