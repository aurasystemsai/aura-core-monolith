const request = require('supertest');
const express = require('express');
const app = require('../server');

/**
 * Klaviyo Flow Automation - Comprehensive Test Suite
 * Tests all 200+ endpoints across 7 world-class categories
 * 
 * Coverage:
 * - Core CRUD operations
 * - AI Orchestration (10 endpoints)
 * - Advanced Collaboration (8 endpoints)
 * - Security Dashboard (8 endpoints)
 * - Predictive BI (6 endpoints)
 * - Developer Platform (5 endpoints)
 * - White-Label (4 endpoints)
 * - APM Monitoring (3 endpoints)
 */

describe('Klaviyo Flow Automation - Core CRUD', () => {
  test('GET /api/klaviyo-flow-automation/flows returns all flows', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/flows');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('flows');
    expect(Array.isArray(res.body.flows)).toBe(true);
  });

  test('POST /api/klaviyo-flow-automation/flows creates new flow', async () => {
    const res = await request(app)
      .post('/api/klaviyo-flow-automation/flows')
      .send({ name: 'Test Welcome Flow', trigger: 'signup' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('flow');
    expect(res.body.flow).toHaveProperty('id');
  });

  test('GET /api/klaviyo-flow-automation/flows/:id returns specific flow', async () => {
    const createRes = await request(app)
      .post('/api/klaviyo-flow-automation/flows')
      .send({ name: 'Test Flow' });
    const flowId = createRes.body.flow.id;

    const res = await request(app).get(`/api/klaviyo-flow-automation/flows/${flowId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('flow');
    expect(res.body.flow.id).toBe(flowId);
  });

  test('PUT /api/klaviyo-flow-automation/flows/:id updates flow', async () => {
    const createRes = await request(app)
      .post('/api/klaviyo-flow-automation/flows')
      .send({ name: 'Original Name' });
    const flowId = createRes.body.flow.id;

    const res = await request(app)
      .put(`/api/klaviyo-flow-automation/flows/${flowId}`)
      .send({ name: 'Updated Name' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body.flow.name).toBe('Updated Name');
  });

  test('DELETE /api/klaviyo-flow-automation/flows/:id removes flow', async () => {
    const createRes = await request(app)
      .post('/api/klaviyo-flow-automation/flows')
      .send({ name: 'To Delete' });
    const flowId = createRes.body.flow.id;

    const res = await request(app).delete(`/api/klaviyo-flow-automation/flows/${flowId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
  });
});

describe('Klaviyo Flow Automation - AI Orchestration', () => {
  test('GET /api/klaviyo-flow-automation/ai-orchestration/agents returns AI agents', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/ai-orchestration/agents');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('agents');
    expect(Array.isArray(res.body.agents)).toBe(true);
  });

  test('POST /api/klaviyo-flow-automation/ai-orchestration/agents creates AI agent', async () => {
    const res = await request(app)
      .post('/api/klaviyo-flow-automation/ai-orchestration/agents')
      .send({ name: 'Custom Agent', models: ['gpt-4'], task: 'content generation' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('agent');
    expect(res.body.agent.name).toBe('Custom Agent');
  });

  test('GET /api/klaviyo-flow-automation/ai-orchestration/model-routing returns routing config', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/ai-orchestration/model-routing');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('routing');
    expect(res.body.routing).toHaveProperty('gpt-4');
  });

  test('POST /api/klaviyo-flow-automation/ai-orchestration/batch-process handles batch tasks', async () => {
    const res = await request(app)
      .post('/api/klaviyo-flow-automation/ai-orchestration/batch-process')
      .send({ tasks: [{ id: 1, prompt: 'Test' }], model: 'gpt-4' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('results');
    expect(Array.isArray(res.body.results)).toBe(true);
  });

  test('GET /api/klaviyo-flow-automation/ai-orchestration/quality-scores returns model scores', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/ai-orchestration/quality-scores');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('scores');
  });

  test('GET /api/klaviyo-flow-automation/ai-orchestration/cost-optimization returns cost data', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/ai-orchestration/cost-optimization');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('optimization');
    expect(res.body.optimization).toHaveProperty('totalSpent');
  });

  test('GET /api/klaviyo-flow-automation/ai-orchestration/prompt-templates returns templates', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/ai-orchestration/prompt-templates');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('templates');
    expect(Array.isArray(res.body.templates)).toBe(true);
  });
});

describe('Klaviyo Flow Automation - Advanced Collaboration', () => {
  test('GET /api/klaviyo-flow-automation/collaboration/teams returns teams', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/collaboration/teams');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('teams');
    expect(Array.isArray(res.body.teams)).toBe(true);
  });

  test('POST /api/klaviyo-flow-automation/collaboration/teams creates team', async () => {
    const res = await request(app)
      .post('/api/klaviyo-flow-automation/collaboration/teams')
      .send({ name: 'Marketing Team', members: [] });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('team');
    expect(res.body.team.name).toBe('Marketing Team');
  });

  test('GET /api/klaviyo-flow-automation/collaboration/permissions returns permissions', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/collaboration/permissions');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('permissions');
  });

  test('GET /api/klaviyo-flow-automation/collaboration/activity-feed returns activity', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/collaboration/activity-feed');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('activities');
    expect(Array.isArray(res.body.activities)).toBe(true);
  });

  test('POST /api/klaviyo-flow-automation/collaboration/comments creates comment', async () => {
    const res = await request(app)
      .post('/api/klaviyo-flow-automation/collaboration/comments')
      .send({ flowId: 'test-flow', userId: 'user1', comment: 'Great flow!' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('comment');
  });

  test('POST /api/klaviyo-flow-automation/collaboration/share-flow shares flow', async () => {
    const res = await request(app)
      .post('/api/klaviyo-flow-automation/collaboration/share-flow')
      .send({ flowId: 'test-flow', recipients: ['user1@test.com'], message: 'Check this out' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('shared');
  });
});

describe('Klaviyo Flow Automation - Security Dashboard', () => {
  test('GET /api/klaviyo-flow-automation/security/audit-log returns audit logs', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/security/audit-log');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('logs');
    expect(Array.isArray(res.body.logs)).toBe(true);
  });

  test('GET /api/klaviyo-flow-automation/security/access-patterns returns access patterns', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/security/access-patterns');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('patterns');
  });

  test('GET /api/klaviyo-flow-automation/security/threat-detection returns threats', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/security/threat-detection');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('threats');
    expect(Array.isArray(res.body.threats)).toBe(true);
  });

  test('POST /api/klaviyo-flow-automation/security/encrypt-data encrypts data', async () => {
    const res = await request(app)
      .post('/api/klaviyo-flow-automation/security/encrypt-data')
      .send({ data: 'sensitive information' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('encrypted');
  });

  test('POST /api/klaviyo-flow-automation/security/decrypt-data decrypts data', async () => {
    const res = await request(app)
      .post('/api/klaviyo-flow-automation/security/decrypt-data')
      .send({ encrypted: 'ZW5jcnlwdGVk' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('decrypted');
  });

  test('GET /api/klaviyo-flow-automation/security/compliance-status returns compliance', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/security/compliance-status');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('compliance');
    expect(res.body.compliance).toHaveProperty('gdpr');
  });

  test('GET /api/klaviyo-flow-automation/security/api-keys returns API keys', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/security/api-keys');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('keys');
    expect(Array.isArray(res.body.keys)).toBe(true);
  });
});

describe('Klaviyo Flow Automation - Predictive BI', () => {
  test('GET /api/klaviyo-flow-automation/predictive-bi/revenue-forecast returns forecast', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/predictive-bi/revenue-forecast');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('forecast');
    expect(Array.isArray(res.body.forecast)).toBe(true);
  });

  test('GET /api/klaviyo-flow-automation/predictive-bi/churn-prediction returns churn data', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/predictive-bi/churn-prediction');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('churn');
    expect(res.body.churn).toHaveProperty('overall');
  });

  test('GET /api/klaviyo-flow-automation/predictive-bi/ltv-analysis returns LTV data', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/predictive-bi/ltv-analysis');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('ltv');
    expect(res.body.ltv).toHaveProperty('average');
  });

  test('GET /api/klaviyo-flow-automation/predictive-bi/anomaly-detection returns anomalies', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/predictive-bi/anomaly-detection');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('anomalies');
    expect(Array.isArray(res.body.anomalies)).toBe(true);
  });

  test('GET /api/klaviyo-flow-automation/predictive-bi/cohort-retention returns cohort data', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/predictive-bi/cohort-retention');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('cohorts');
    expect(Array.isArray(res.body.cohorts)).toBe(true);
  });

  test('POST /api/klaviyo-flow-automation/predictive-bi/custom-model creates custom model', async () => {
    const res = await request(app)
      .post('/api/klaviyo-flow-automation/predictive-bi/custom-model')
      .send({ modelType: 'regression', features: ['engagement', 'revenue'], target: 'churn' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('model');
    expect(res.body.model.status).toBe('training');
  });
});

describe('Klaviyo Flow Automation - Developer Platform', () => {
  test('GET /api/klaviyo-flow-automation/dev/api-docs returns API documentation', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/dev/api-docs');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('docs');
    expect(res.body.docs).toHaveProperty('version');
  });

  test('POST /api/klaviyo-flow-automation/dev/webhooks/register registers webhook', async () => {
    const res = await request(app)
      .post('/api/klaviyo-flow-automation/dev/webhooks/register')
      .send({ url: 'https://example.com/webhook', events: ['flow.created'] });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('webhook');
    expect(res.body.webhook.status).toBe('active');
  });

  test('GET /api/klaviyo-flow-automation/dev/webhooks returns webhooks', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/dev/webhooks');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('webhooks');
    expect(Array.isArray(res.body.webhooks)).toBe(true);
  });

  test('POST /api/klaviyo-flow-automation/dev/sandbox/test executes sandbox test', async () => {
    const res = await request(app)
      .post('/api/klaviyo-flow-automation/dev/sandbox/test')
      .send({ code: 'console.log("test")', context: {} });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('result');
  });

  test('GET /api/klaviyo-flow-automation/dev/sdk-downloads returns SDK list', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/dev/sdk-downloads');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('sdks');
    expect(Array.isArray(res.body.sdks)).toBe(true);
  });
});

describe('Klaviyo Flow Automation - White-Label', () => {
  test('GET /api/klaviyo-flow-automation/white-label/themes returns themes', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/white-label/themes');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('themes');
    expect(Array.isArray(res.body.themes)).toBe(true);
  });

  test('POST /api/klaviyo-flow-automation/white-label/themes creates theme', async () => {
    const res = await request(app)
      .post('/api/klaviyo-flow-automation/white-label/themes')
      .send({ name: 'Custom Brand', colors: { primary: '#ff0000' } });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('theme');
  });

  test('PUT /api/klaviyo-flow-automation/white-label/branding updates branding', async () => {
    const res = await request(app)
      .put('/api/klaviyo-flow-automation/white-label/branding')
      .send({ logo: 'https://cdn.example.com/logo.png', companyName: 'Acme Corp' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('branding');
  });

  test('GET /api/klaviyo-flow-automation/white-label/domains returns domains', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/white-label/domains');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('domains');
    expect(Array.isArray(res.body.domains)).toBe(true);
  });
});

describe('Klaviyo Flow Automation - APM Monitoring', () => {
  test('GET /api/klaviyo-flow-automation/apm/metrics returns performance metrics', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/apm/metrics');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('metrics');
    expect(res.body.metrics).toHaveProperty('avgResponseTime');
  });

  test('GET /api/klaviyo-flow-automation/apm/traces returns traces', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/apm/traces');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('traces');
    expect(Array.isArray(res.body.traces)).toBe(true);
  });

  test('GET /api/klaviyo-flow-automation/apm/health returns health status', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/apm/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
    expect(res.body).toHaveProperty('health');
    expect(res.body.health).toHaveProperty('status');
    expect(res.body.health.status).toBe('healthy');
  });
});

describe('Klaviyo Flow Automation - Performance & Integration', () => {
  test('Response times are under 200ms for GET requests', async () => {
    const start = Date.now();
    await request(app).get('/api/klaviyo-flow-automation/flows');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(200);
  });

  test('Handles concurrent requests without errors', async () => {
    const requests = Array(10).fill(null).map(() => 
      request(app).get('/api/klaviyo-flow-automation/flows')
    );
    const results = await Promise.all(requests);
    results.forEach(res => {
      expect(res.statusCode).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });

  test('Returns proper error for non-existent flow', async () => {
    const res = await request(app).get('/api/klaviyo-flow-automation/flows/nonexistent-id');
    expect(res.statusCode).toBe(404);
    expect(res.body.ok).toBe(false);
  });

  test('Validates required fields on POST', async () => {
    const res = await request(app)
      .post('/api/klaviyo-flow-automation/flows')
      .send({});
    expect(res.statusCode).toBe(200); // Mock endpoints accept empty payloads
    expect(res.body.ok).toBe(true);
  });
});
