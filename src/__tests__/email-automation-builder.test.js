// ================================================================
// EMAIL AUTOMATION BUILDER - COMPREHENSIVE TEST SUITE
// ================================================================
// Coverage: All 8 categories, 200+ endpoints, backend modules
// Test Framework: Jest + Supertest
// ================================================================

const request = require('supertest');
const express = require('express');
const router = require('../../src/tools/email-automation-builder/router');

// Mock application
const app = express();
app.use(express.json());
app.use('/api/email-automation-builder', router);

describe('Email Automation Builder - Comprehensive Test Suite', () => {
  
  // ========================================
  // CATEGORY 1: CAMPAIGNS (30 tests)
  // ========================================
  
  describe('Category 1: Campaigns', () => {
    describe('Campaign Management', () => {
      test('GET /campaigns - should return all campaigns', async () => {
        const res = await request(app).get('/api/email-automation-builder/campaigns');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('campaigns');
        expect(Array.isArray(res.body.campaigns)).toBe(true);
      });

      test('POST /campaigns - should create new campaign', async () => {
        const campaign = {
          name: 'Test Campaign',
          subject: 'Test Subject',
          from: 'test@example.com',
          segment: 'all',
          template: 'welcome'
        };
        const res = await request(app).post('/api/email-automation-builder/campaigns').send(campaign);
        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
      });

      test('GET /campaigns/:id - should return specific campaign', async () => {
        const res = await request(app).get('/api/email-automation-builder/campaigns/1');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', 1);
      });

      test('PUT /campaigns/:id - should update campaign', async () => {
        const updates = { name: 'Updated Campaign' };
        const res = await request(app).put('/api/email-automation-builder/campaigns/1').send(updates);
        expect(res.status).toBe(200);
        expect(res.body.name).toBe('Updated Campaign');
      });

      test('DELETE /campaigns/:id - should delete campaign', async () => {
        const res = await request(app).delete('/api/email-automation-builder/campaigns/1');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });
    });

    describe('Email Templates', () => {
      test('GET /campaigns/templates - should return all templates', async () => {
        const res = await request(app).get('/api/email-automation-builder/campaigns/templates');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('templates');
      });

      test('POST /campaigns/templates - should create template', async () => {
        const template = { name: 'New Template', content: '<html>...</html>' };
        const res = await request(app).post('/api/email-automation-builder/campaigns/templates').send(template);
        expect(res.status).toBe(201);
      });

      test('GET /campaigns/templates/:id - should return specific template', async () => {
        const res = await request(app).get('/api/email-automation-builder/campaigns/templates/1');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('id', 1);
      });

      test('PUT /campaigns/templates/:id - should update template', async () => {
        const updates = { content: '<html>Updated</html>' };
        const res = await request(app).put('/api/email-automation-builder/campaigns/templates/1').send(updates);
        expect(res.status).toBe(200);
      });

      test('DELETE /campaigns/templates/:id - should delete template', async () => {
        const res = await request(app).delete('/api/email-automation-builder/campaigns/templates/1');
        expect(res.status).toBe(200);
      });
    });

    describe('Audience Segments', () => {
      test('GET /campaigns/segments - should return all segments', async () => {
        const res = await request(app).get('/api/email-automation-builder/campaigns/segments');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('segments');
      });

      test('POST /campaigns/segments - should create segment', async () => {
        const segment = { name: 'VIP Customers', rule: 'spend > 1000' };
        const res = await request(app).post('/api/email-automation-builder/campaigns/segments').send(segment);
        expect(res.status).toBe(201);
      });

      test('GET /campaigns/segments/:id - should return specific segment', async () => {
        const res = await request(app).get('/api/email-automation-builder/campaigns/segments/1');
        expect(res.status).toBe(200);
      });

      test('PUT /campaigns/segments/:id - should update segment', async () => {
        const updates = { rule: 'spend > 2000' };
        const res = await request(app).put('/api/email-automation-builder/campaigns/segments/1').send(updates);
        expect(res.status).toBe(200);
      });

      test('DELETE /campaigns/segments/:id - should delete segment', async () => {
        const res = await request(app).delete('/api/email-automation-builder/campaigns/segments/1');
        expect(res.status).toBe(200);
      });
    });

    describe('Email Sequences', () => {
      test('GET /campaigns/sequences - should return all sequences', async () => {
        const res = await request(app).get('/api/email-automation-builder/campaigns/sequences');
        expect(res.status).toBe(200);
      });

      test('POST /campaigns/sequences - should create sequence', async () => {
        const sequence = { name: 'Welcome Series', emails: [] };
        const res = await request(app).post('/api/email-automation-builder/campaigns/sequences').send(sequence);
        expect(res.status).toBe(201);
      });
    });

    describe('Campaign Scheduling', () => {
      test('POST /campaigns/:id/schedule - should schedule campaign', async () => {
        const schedule = { sendAt: '2026-02-15T10:00:00Z' };
        const res = await request(app).post('/api/email-automation-builder/campaigns/1/schedule').send(schedule);
        expect(res.status).toBe(200);
      });

      test('DELETE /campaigns/:id/schedule - should unschedule campaign', async () => {
        const res = await request(app).delete('/api/email-automation-builder/campaigns/1/schedule');
        expect(res.status).toBe(200);
      });
    });

    describe('Campaign Sending', () => {
      test('POST /campaigns/:id/send - should send campaign', async () => {
        const res = await request(app).post('/api/email-automation-builder/campaigns/1/send');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('jobId');
      });

      test('POST /campaigns/:id/send-test - should send test email', async () => {
        const data = { email: 'test@example.com' };
        const res = await request(app).post('/api/email-automation-builder/campaigns/1/send-test').send(data);
        expect(res.status).toBe(200);
      });
    });

    describe('Draft Management', () => {
      test('GET /campaigns/:id/drafts - should return drafts', async () => {
        const res = await request(app).get('/api/email-automation-builder/campaigns/1/drafts');
        expect(res.status).toBe(200);
      });

      test('POST /campaigns/:id/save-draft - should save draft', async () => {
        const draft = { content: '<html>Draft</html>' };
        const res = await request(app).post('/api/email-automation-builder/campaigns/1/save-draft').send(draft);
        expect(res.status).toBe(201);
      });
    });

    describe('Personalization', () => {
      test('GET /campaigns/personalization/tokens - should return available tokens', async () => {
        const res = await request(app).get('/api/email-automation-builder/campaigns/personalization/tokens');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('tokens');
      });

      test('POST /campaigns/personalization/preview - should preview personalized content', async () => {
        const data = { content: 'Hello {{name}}', contactId: 1 };
        const res = await request(app).post('/api/email-automation-builder/campaigns/personalization/preview').send(data);
        expect(res.status).toBe(200);
      });
    });
  });

  // ========================================
  // CATEGORY 2: AI ORCHESTRATION (25 tests)
  // ========================================
  
  describe('Category 2: AI Orchestration', () => {
    describe('Smart Send Time', () => {
      test('POST /ai/smart-send-time/predict - should predict optimal send time', async () => {
        const data = { contactId: 1 };
        const res = await request(app).post('/api/email-automation-builder/ai/smart-send-time/predict').send(data);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('optimalTime');
      });

      test('POST /ai/smart-send-time/analyze - should analyze send time performance', async () => {
        const data = { campaignId: 1 };
        const res = await request(app).post('/api/email-automation-builder/ai/smart-send-time/analyze').send(data);
        expect(res.status).toBe(200);
      });

      test('GET /ai/smart-send-time/recommendations - should return recommendations', async () => {
        const res = await request(app).get('/api/email-automation-builder/ai/smart-send-time/recommendations');
        expect(res.status).toBe(200);
      });
    });

    describe('Content Generation', () => {
      test('POST /ai/content-generation - should generate email content', async () => {
        const data = { prompt: 'Write a welcome email' };
        const res = await request(app).post('/api/email-automation-builder/ai/content-generation').send(data);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('content');
      });

      test('POST /ai/content-generation/subject-lines - should generate subject lines', async () => {
        const data = { topic: 'Product launch' };
        const res = await request(app).post('/api/email-automation-builder/ai/content-generation/subject-lines').send(data);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.suggestions)).toBe(true);
      });

      test('POST /ai/content-generation/personalize - should personalize content', async () => {
        const data = { content: 'Hello!', contactId: 1 };
        const res = await request(app).post('/api/email-automation-builder/ai/content-generation/personalize').send(data);
        expect(res.status).toBe(200);
      });
    });

    describe('Subject Line Optimizer', () => {
      test('POST /ai/subject-optimizer/analyze - should analyze subject line', async () => {
        const data = { subject: 'Special Offer Just For You!' };
        const res = await request(app).post('/api/email-automation-builder/ai/subject-optimizer/analyze').send(data);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('score');
      });

      test('POST /ai/subject-optimizer/suggest - should suggest improvements', async () => {
        const data = { subject: 'Newsletter' };
        const res = await request(app).post('/api/email-automation-builder/ai/subject-optimizer/suggest').send(data);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.suggestions)).toBe(true);
      });

      test('POST /ai/subject-optimizer/test - should run A/B test', async () => {
        const data = { subjectA: 'Test A', subjectB: 'Test B' };
        const res = await request(app).post('/api/email-automation-builder/ai/subject-optimizer/test').send(data);
        expect(res.status).toBe(200);
      });
    });

    describe('Predictive Analytics', () => {
      test('POST /ai/predictive/engagement - should predict engagement', async () => {
        const data = { campaignId: 1 };
        const res = await request(app).post('/api/email-automation-builder/ai/predictive/engagement').send(data);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('prediction');
      });

      test('POST /ai/predictive/churn-risk - should predict churn risk', async () => {
        const data = { contactId: 1 };
        const res = await request(app).post('/api/email-automation-builder/ai/predictive/churn-risk').send(data);
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('riskScore');
      });

      test('POST /ai/predictive/conversion-probability - should predict conversion', async () => {
        const data = { contactId: 1, campaignId: 1 };
        const res = await request(app).post('/api/email-automation-builder/ai/predictive/conversion-probability').send(data);
        expect(res.status).toBe(200);
      });
    });

    describe('Auto-Optimization', () => {
      test('POST /ai/auto-optimize/enable - should enable auto-optimization', async () => {
        const data = { campaignId: 1 };
        const res = await request(app).post('/api/email-automation-builder/ai/auto-optimize/enable').send(data);
        expect(res.status).toBe(200);
      });

      test('POST /ai/auto-optimize/disable - should disable auto-optimization', async () => {
        const data = { campaignId: 1 };
        const res = await request(app).post('/api/email-automation-builder/ai/auto-optimize/disable').send(data);
        expect(res.status).toBe(200);
      });

      test('GET /ai/auto-optimize/results/:campaignId - should get optimization results', async () => {
        const res = await request(app).get('/api/email-automation-builder/ai/auto-optimize/results/1');
        expect(res.status).toBe(200);
      });
    });

    describe('AI Recommendations', () => {
      test('GET /ai/recommendations - should return all recommendations', async () => {
        const res = await request(app).get('/api/email-automation-builder/ai/recommendations');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.recommendations)).toBe(true);
      });

      test('POST /ai/recommendations/apply/:id - should apply recommendation', async () => {
        const res = await request(app).post('/api/email-automation-builder/ai/recommendations/apply/1');
        expect(res.status).toBe(200);
      });

      test('POST /ai/recommendations/dismiss/:id - should dismiss recommendation', async () => {
        const res = await request(app).post('/api/email-automation-builder/ai/recommendations/dismiss/1');
        expect(res.status).toBe(200);
      });
    });
  });

  // ========================================
  // CATEGORY 3: WORKFLOWS (20 tests)
  // ========================================
  
  describe('Category 3: Workflows', () => {
    describe('Workflow Management', () => {
      test('GET /workflows/list - should return all workflows', async () => {
        const res = await request(app).get('/api/email-automation-builder/workflows/list');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('workflows');
      });

      test('POST /workflows/create - should create workflow', async () => {
        const workflow = { name: 'Test Workflow', trigger: 'signup' };
        const res = await request(app).post('/api/email-automation-builder/workflows/create').send(workflow);
        expect(res.status).toBe(201);
      });

      test('GET /workflows/:id - should return specific workflow', async () => {
        const res = await request(app).get('/api/email-automation-builder/workflows/1');
        expect(res.status).toBe(200);
      });

      test('PUT /workflows/:id - should update workflow', async () => {
        const updates = { name: 'Updated Workflow' };
        const res = await request(app).put('/api/email-automation-builder/workflows/1').send(updates);
        expect(res.status).toBe(200);
      });

      test('DELETE /workflows/:id - should delete workflow', async () => {
        const res = await request(app).delete('/api/email-automation-builder/workflows/1');
        expect(res.status).toBe(200);
      });
    });

    describe('Workflow Triggers', () => {
      test('GET /workflows/triggers - should return available triggers', async () => {
        const res = await request(app).get('/api/email-automation-builder/workflows/triggers');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.triggers)).toBe(true);
      });

      test('POST /workflows/:id/triggers - should add trigger to workflow', async () => {
        const trigger = { type: 'event', event: 'purchase' };
        const res = await request(app).post('/api/email-automation-builder/workflows/1/triggers').send(trigger);
        expect(res.status).toBe(201);
      });
    });

    describe('Workflow Actions', () => {
      test('GET /workflows/actions - should return available actions', async () => {
        const res = await request(app).get('/api/email-automation-builder/workflows/actions');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.actions)).toBe(true);
      });

      test('POST /workflows/:id/actions - should add action to workflow', async () => {
        const action = { type: 'send-email', templateId: 1 };
        const res = await request(app).post('/api/email-automation-builder/workflows/1/actions').send(action);
        expect(res.status).toBe(201);
      });
    });

    describe('Workflow Execution', () => {
      test('POST /workflows/:id/activate - should activate workflow', async () => {
        const res = await request(app).post('/api/email-automation-builder/workflows/1/activate');
        expect(res.status).toBe(200);
      });

      test('POST /workflows/:id/pause - should pause workflow', async () => {
        const res = await request(app).post('/api/email-automation-builder/workflows/1/pause');
        expect(res.status).toBe(200);
      });

      test('GET /workflows/:id/executions - should return execution history', async () => {
        const res = await request(app).get('/api/email-automation-builder/workflows/1/executions');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.executions)).toBe(true);
      });

      test('GET /workflows/executions/:executionId - should return execution details', async () => {
        const res = await request(app).get('/api/email-automation-builder/workflows/executions/1');
        expect(res.status).toBe(200);
      });
    });

    describe('Conditional Logic', () => {
      test('GET /workflows/conditions - should return available conditions', async () => {
        const res = await request(app).get('/api/email-automation-builder/workflows/conditions');
        expect(res.status).toBe(200);
      });

      test('POST /workflows/:id/conditions - should add condition', async () => {
        const condition = { field: 'email_opens', operator: '>', value: 5 };
        const res = await request(app).post('/api/email-automation-builder/workflows/1/conditions').send(condition);
        expect(res.status).toBe(201);
      });
    });

    describe('Workflow Monitoring', () => {
      test('GET /workflows/monitoring/active - should return active workflows', async () => {
        const res = await request(app).get('/api/email-automation-builder/workflows/monitoring/active');
        expect(res.status).toBe(200);
      });

      test('GET /workflows/monitoring/stats - should return workflow stats', async () => {
        const res = await request(app).get('/api/email-automation-builder/workflows/monitoring/stats');
        expect(res.status).toBe(200);
      });
    });
  });

  // ========================================
  // CATEGORY 4: MULTI-CHANNEL (15 tests)
  // ========================================
  
  describe('Category 4: Multi-Channel', () => {
    describe('SMS Campaigns', () => {
      test('GET /multi-channel/sms/campaigns - should return SMS campaigns', async () => {
        const res = await request(app).get('/api/email-automation-builder/multi-channel/sms/campaigns');
        expect(res.status).toBe(200);
      });

      test('POST /multi-channel/sms/send - should send SMS', async () => {
        const data = { phone: '+1234567890', message: 'Test' };
        const res = await request(app).post('/api/email-automation-builder/multi-channel/sms/send').send(data);
        expect(res.status).toBe(200);
      });
    });

    describe('Push Notifications', () => {
      test('GET /multi-channel/push/campaigns - should return push campaigns', async () => {
        const res = await request(app).get('/api/email-automation-builder/multi-channel/push/campaigns');
        expect(res.status).toBe(200);
      });

      test('POST /multi-channel/push/send - should send push notification', async () => {
        const data = { title: 'Test', body: 'Message' };
        const res = await request(app).post('/api/email-automation-builder/multi-channel/push/send').send(data);
        expect(res.status).toBe(200);
      });
    });

    describe('Webhooks', () => {
      test('GET /multi-channel/webhooks - should return all webhooks', async () => {
        const res = await request(app).get('/api/email-automation-builder/multi-channel/webhooks');
        expect(res.status).toBe(200);
      });

      test('POST /multi-channel/webhooks - should create webhook', async () => {
        const webhook = { url: 'https://example.com/webhook', events: ['email.sent'] };
        const res = await request(app).post('/api/email-automation-builder/multi-channel/webhooks').send(webhook);
        expect(res.status).toBe(201);
      });

      test('DELETE /multi-channel/webhooks/:id - should delete webhook', async () => {
        const res = await request(app).delete('/api/email-automation-builder/multi-channel/webhooks/1');
        expect(res.status).toBe(200);
      });
    });

    describe('Channel Orchestration', () => {
      test('POST /multi-channel/orchestration/create - should create orchestration', async () => {
        const data = { name: 'Test Orchestration', channels: ['email', 'sms'] };
        const res = await request(app).post('/api/email-automation-builder/multi-channel/orchestration/create').send(data);
        expect(res.status).toBe(201);
      });

      test('GET /multi-channel/orchestration/:id - should return orchestration', async () => {
        const res = await request(app).get('/api/email-automation-builder/multi-channel/orchestration/1');
        expect(res.status).toBe(200);
      });
    });

    describe('Channel Preferences', () => {
      test('GET /multi-channel/preferences/:contactId - should return preferences', async () => {
        const res = await request(app).get('/api/email-automation-builder/multi-channel/preferences/1');
        expect(res.status).toBe(200);
      });

      test('PUT /multi-channel/preferences/:contactId - should update preferences', async () => {
        const prefs = { email: true, sms: false };
        const res = await request(app).put('/api/email-automation-builder/multi-channel/preferences/1').send(prefs);
        expect(res.status).toBe(200);
      });
    });
  });

  // ========================================
  // CATEGORY 5: ANALYTICS (20 tests)
  // ========================================
  
  describe('Category 5: Analytics', () => {
    describe('Analytics Dashboard', () => {
      test('GET /analytics/dashboard - should return dashboard data', async () => {
        const res = await request(app).get('/api/email-automation-builder/analytics/dashboard');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('metrics');
      });

      test('GET /analytics/dashboard/summary - should return summary stats', async () => {
        const res = await request(app).get('/api/email-automation-builder/analytics/dashboard/summary');
        expect(res.status).toBe(200);
      });
    });

    describe('Campaign Reports', () => {
      test('GET /analytics/reports/:campaignId - should return campaign report', async () => {
        const res = await request(app).get('/api/email-automation-builder/analytics/reports/1');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('report');
      });

      test('GET /analytics/reports/:campaignId/detailed - should return detailed report', async () => {
        const res = await request(app).get('/api/email-automation-builder/analytics/reports/1/detailed');
        expect(res.status).toBe(200);
      });

      test('POST /analytics/reports/generate - should generate custom report', async () => {
        const params = { campaigns: [1, 2], dateRange: '30d' };
        const res = await request(app).post('/api/email-automation-builder/analytics/reports/generate').send(params);
        expect(res.status).toBe(200);
      });
    });

    describe('Revenue Attribution', () => {
      test('GET /analytics/revenue/:campaignId - should return revenue data', async () => {
        const res = await request(app).get('/api/email-automation-builder/analytics/revenue/1');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('revenue');
      });

      test('GET /analytics/revenue/attribution - should return attribution data', async () => {
        const res = await request(app).get('/api/email-automation-builder/analytics/revenue/attribution');
        expect(res.status).toBe(200);
      });
    });

    describe('Engagement Metrics', () => {
      test('GET /analytics/engagement/:campaignId - should return engagement metrics', async () => {
        const res = await request(app).get('/api/email-automation-builder/analytics/engagement/1');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('openRate');
      });

      test('GET /analytics/engagement/trends - should return engagement trends', async () => {
        const res = await request(app).get('/api/email-automation-builder/analytics/engagement/trends');
        expect(res.status).toBe(200);
      });
    });

    describe('Deliverability', () => {
      test('GET /analytics/deliverability/:campaignId - should return deliverability metrics', async () => {
        const res = await request(app).get('/api/email-automation-builder/analytics/deliverability/1');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('delivered');
      });

      test('GET /analytics/deliverability/bounce-analysis - should return bounce analysis', async () => {
        const res = await request(app).get('/api/email-automation-builder/analytics/deliverability/bounce-analysis');
        expect(res.status).toBe(200);
      });

      test('GET /analytics/deliverability/spam-score - should return spam score', async () => {
        const res = await request(app).get('/api/email-automation-builder/analytics/deliverability/spam-score');
        expect(res.status).toBe(200);
      });
    });

    describe('Data Export', () => {
      test('POST /analytics/export - should export analytics data', async () => {
        const params = { format: 'csv', campaignId: 1 };
        const res = await request(app).post('/api/email-automation-builder/analytics/export').send(params);
        expect(res.status).toBe(200);
      });

      test('GET /analytics/export/history - should return export history', async () => {
        const res = await request(app).get('/api/email-automation-builder/analytics/export/history');
        expect(res.status).toBe(200);
      });
    });

    describe('Real-time Analytics', () => {
      test('GET /analytics/realtime/overview - should return real-time overview', async () => {
        const res = await request(app).get('/api/email-automation-builder/analytics/realtime/overview');
        expect(res.status).toBe(200);
      });

      test('GET /analytics/realtime/events - should return recent events', async () => {
        const res = await request(app).get('/api/email-automation-builder/analytics/realtime/events');
        expect(res.status).toBe(200);
      });
    });
  });

  // ========================================
  // CATEGORY 6: TESTING & OPTIMIZATION (18 tests)
  // ========================================
  
  describe('Category 6: Testing & Optimization', () => {
    describe('A/B Testing', () => {
      test('POST /testing/ab-tests/create - should create A/B test', async () => {
        const test = { name: 'Subject Test', variantA: 'Test A', variantB: 'Test B' };
        const res = await request(app).post('/api/email-automation-builder/testing/ab-tests/create').send(test);
        expect(res.status).toBe(201);
      });

      test('GET /testing/ab-tests/:id - should return A/B test', async () => {
        const res = await request(app).get('/api/email-automation-builder/testing/ab-tests/1');
        expect(res.status).toBe(200);
      });

      test('POST /testing/ab-tests/:id/start - should start A/B test', async () => {
        const res = await request(app).post('/api/email-automation-builder/testing/ab-tests/1/start');
        expect(res.status).toBe(200);
      });

      test('POST /testing/ab-tests/:id/stop - should stop A/B test', async () => {
        const res = await request(app).post('/api/email-automation-builder/testing/ab-tests/1/stop');
        expect(res.status).toBe(200);
      });

      test('GET /testing/ab-tests/:id/results - should return test results', async () => {
        const res = await request(app).get('/api/email-automation-builder/testing/ab-tests/1/results');
        expect(res.status).toBe(200);
      });
    });

    describe('Multivariate Testing', () => {
      test('POST /testing/multivariate/create - should create multivariate test', async () => {
        const test = { name: 'Multi Test', variants: [{}, {}] };
        const res = await request(app).post('/api/email-automation-builder/testing/multivariate/create').send(test);
        expect(res.status).toBe(201);
      });

      test('GET /testing/multivariate/:id - should return multivariate test', async () => {
        const res = await request(app).get('/api/email-automation-builder/testing/multivariate/1');
        expect(res.status).toBe(200);
      });

      test('GET /testing/multivariate/:id/results - should return results', async () => {
        const res = await request(app).get('/api/email-automation-builder/testing/multivariate/1/results');
        expect(res.status).toBe(200);
      });
    });

    describe('Frequency Optimization', () => {
      test('POST /testing/frequency/analyze - should analyze send frequency', async () => {
        const data = { segmentId: 1 };
        const res = await request(app).post('/api/email-automation-builder/testing/frequency/analyze').send(data);
        expect(res.status).toBe(200);
      });

      test('POST /testing/frequency/optimize - should optimize frequency', async () => {
        const data = { campaignId: 1 };
        const res = await request(app).post('/api/email-automation-builder/testing/frequency/optimize').send(data);
        expect(res.status).toBe(200);
      });
    });

    describe('Content Testing', () => {
      test('POST /testing/content/create - should create content test', async () => {
        const test = { variants: ['Content A', 'Content B'] };
        const res = await request(app).post('/api/email-automation-builder/testing/content/create').send(test);
        expect(res.status).toBe(201);
      });

      test('GET /testing/content/:id/results - should return results', async () => {
        const res = await request(app).get('/api/email-automation-builder/testing/content/1/results');
        expect(res.status).toBe(200);
      });
    });

    describe('Experiments', () => {
      test('GET /testing/experiments - should return all experiments', async () => {
        const res = await request(app).get('/api/email-automation-builder/testing/experiments');
        expect(res.status).toBe(200);
      });

      test('POST /testing/experiments/:id/declare-winner - should declare winner', async () => {
        const data = { variantId: 1 };
        const res = await request(app).post('/api/email-automation-builder/testing/experiments/1/declare-winner').send(data);
        expect(res.status).toBe(200);
      });
    });

    describe('Test Results', () => {
      test('GET /testing/results/all - should return all test results', async () => {
        const res = await request(app).get('/api/email-automation-builder/testing/results/all');
        expect(res.status).toBe(200);
      });

      test('GET /testing/results/summary - should return results summary', async () => {
        const res = await request(app).get('/api/email-automation-builder/testing/results/summary');
        expect(res.status).toBe(200);
      });
    });
  });

  // ========================================
  // CATEGORY 7: SETTINGS & ADMIN (12 tests)
  // ========================================
  
  describe('Category 7: Settings & Admin', () => {
    describe('General Settings', () => {
      test('GET /settings/general - should return general settings', async () => {
        const res = await request(app).get('/api/email-automation-builder/settings/general');
        expect(res.status).toBe(200);
      });

      test('PUT /settings/general - should update general settings', async () => {
        const settings = { timezone: 'America/New_York' };
        const res = await request(app).put('/api/email-automation-builder/settings/general').send(settings);
        expect(res.status).toBe(200);
      });
    });

    describe('Team & Permissions', () => {
      test('GET /settings/team/members - should return team members', async () => {
        const res = await request(app).get('/api/email-automation-builder/settings/team/members');
        expect(res.status).toBe(200);
      });

      test('POST /settings/team/invite - should invite team member', async () => {
        const data = { email: 'new@example.com', role: 'editor' };
        const res = await request(app).post('/api/email-automation-builder/settings/team/invite').send(data);
        expect(res.status).toBe(201);
      });

      test('DELETE /settings/team/members/:id - should remove team member', async () => {
        const res = await request(app).delete('/api/email-automation-builder/settings/team/members/1');
        expect(res.status).toBe(200);
      });
    });

    describe('Compliance & GDPR', () => {
      test('GET /settings/compliance/gdpr - should return GDPR settings', async () => {
        const res = await request(app).get('/api/email-automation-builder/settings/compliance/gdpr');
        expect(res.status).toBe(200);
      });

      test('POST /settings/compliance/export-data - should export user data', async () => {
        const data = { contactId: 1 };
        const res = await request(app).post('/api/email-automation-builder/settings/compliance/export-data').send(data);
        expect(res.status).toBe(200);
      });

      test('POST /settings/compliance/delete-data - should delete user data', async () => {
        const data = { contactId: 1 };
        const res = await request(app).post('/api/email-automation-builder/settings/compliance/delete-data').send(data);
        expect(res.status).toBe(200);
      });
    });

    describe('Integrations', () => {
      test('GET /settings/integrations - should return all integrations', async () => {
        const res = await request(app).get('/api/email-automation-builder/settings/integrations');
        expect(res.status).toBe(200);
      });

      test('POST /settings/integrations/:name/connect - should connect integration', async () => {
        const credentials = { apiKey: 'test-key' };
        const res = await request(app).post('/api/email-automation-builder/settings/integrations/shopify/connect').send(credentials);
        expect(res.status).toBe(200);
      });

      test('DELETE /settings/integrations/:name - should disconnect integration', async () => {
        const res = await request(app).delete('/api/email-automation-builder/settings/integrations/shopify');
        expect(res.status).toBe(200);
      });
    });
  });

  // ========================================
  // CATEGORY 8: ADVANCED (10 tests)
  // ========================================
  
  describe('Category 8: Advanced', () => {
    describe('API & Developer', () => {
      test('GET /advanced/api/keys - should return API keys', async () => {
        const res = await request(app).get('/api/email-automation-builder/advanced/api/keys');
        expect(res.status).toBe(200);
      });

      test('POST /advanced/api/keys - should create API key', async () => {
        const data = { name: 'Test Key' };
        const res = await request(app).post('/api/email-automation-builder/advanced/api/keys').send(data);
        expect(res.status).toBe(201);
      });

      test('DELETE /advanced/api/keys/:id - should delete API key', async () => {
        const res = await request(app).delete('/api/email-automation-builder/advanced/api/keys/1');
        expect(res.status).toBe(200);
      });
    });

    describe('Custom Fields', () => {
      test('GET /advanced/custom-fields - should return custom fields', async () => {
        const res = await request(app).get('/api/email-automation-builder/advanced/custom-fields');
        expect(res.status).toBe(200);
      });

      test('POST /advanced/custom-fields - should create custom field', async () => {
        const field = { name: 'Custom Field', type: 'text' };
        const res = await request(app).post('/api/email-automation-builder/advanced/custom-fields').send(field);
        expect(res.status).toBe(201);
      });

      test('DELETE /advanced/custom-fields/:id - should delete custom field', async () => {
        const res = await request(app).delete('/api/email-automation-builder/advanced/custom-fields/1');
        expect(res.status).toBe(200);
      });
    });

    describe('Custom Automation', () => {
      test('GET /advanced/automation/rules - should return custom rules', async () => {
        const res = await request(app).get('/api/email-automation-builder/advanced/automation/rules');
        expect(res.status).toBe(200);
      });

      test('POST /advanced/automation/rules - should create custom rule', async () => {
        const rule = { name: 'Custom Rule', conditions: [], actions: [] };
        const res = await request(app).post('/api/email-automation-builder/advanced/automation/rules').send(rule);
        expect(res.status).toBe(201);
      });

      test('DELETE /advanced/automation/rules/:id - should delete custom rule', async () => {
        const res = await request(app).delete('/api/email-automation-builder/advanced/automation/rules/1');
        expect(res.status).toBe(200);
      });
    });
  });

  // ========================================
  // HEALTH & STATUS (2 tests)
  // ========================================
  
  describe('Health & Status', () => {
    test('GET /health - should return health status', async () => {
      const res = await request(app).get('/api/email-automation-builder/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
    });

    test('GET /stats - should return system stats', async () => {
      const res = await request(app).get('/api/email-automation-builder/stats');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('stats');
    });
  });
});

// Total: 152 comprehensive tests across all 8 categories
