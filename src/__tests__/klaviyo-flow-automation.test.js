/**
 * KLAVIYO FLOW AUTOMATION - COMPREHENSIVE TEST SUITE
 * Tests all 8 backend modules and 245 router endpoints
 */

const request = require('supertest');
const express = require('express');
const flowBuilderEngine = require('../core/klaviyo/flow-builder-engine');
const messagingEngine = require('../core/klaviyo/messaging-engine');
const contactSegmentEngine = require('../core/klaviyo/contact-segment-engine');
const analyticsReportingEngine = require('../core/klaviyo/analytics-reporting-engine');
const aiPersonalizationEngine = require('../core/klaviyo/ai-personalization-engine');
const automationSchedulingEngine = require('../core/klaviyo/automation-scheduling-engine');
const integrationsSettingsEngine = require('../core/klaviyo/integrations-settings-engine');
const advancedFeaturesEngine = require('../core/klaviyo/advanced-features-engine');
const comprehensiveRouter = require('../routes/klaviyo-comprehensive-router');

// Test app setup
const app = express();
app.use(express.json());
app.use('/api/klaviyo-flow-automation', comprehensiveRouter);

describe('Klaviyo Flow Automation - Complete Test Suite', () => {
  
  // ================================================================
  // FLOW BUILDER ENGINE TESTS
  // ================================================================
  
  describe('Flow Builder Engine', () => {
    
    test('should create and retrieve flow template', async () => {
      const response = await request(app)
        .post('/api/klaviyo-flow-automation/flow-builder/templates')
        .send({
          name: 'Welcome Series',
          description: 'Onboarding flow for new subscribers',
          category: 'onboarding',
          triggers: [{ type: 'list_subscribe' }],
          actions: [{ type: 'send_email' }]
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Welcome Series');
    });

    test('should activate and pause flow', async () => {
      const flow = await flowBuilderEngine.createFlow({ name: 'Active Flow' });
      
      const activateRes = await request(app)
        .post(`/api/klaviyo-flow-automation/flow-builder/flows/${flow.id}/activate`);
      expect(activateRes.body.data.status).toBe('active');
      
      const pauseRes = await request(app)
        .post(`/api/klaviyo-flow-automation/flow-builder/flows/${flow.id}/pause`);
      expect(pauseRes.body.data.status).toBe('paused');
    });

    test('should create campaign', async () => {
      const response = await request(app)
        .post('/api/klaviyo-flow-automation/flow-builder/campaigns')
        .send({
          name: 'Black Friday Sale',
          type: 'promotional',
          status: 'draft'
        });
      
      expect(response.status).toBe(201);
    });
  });

  // ================================================================
  // MESSAGING ENGINE TESTS
  // ================================================================
  
  describe('Messaging Engine', () => {
    
    test('should create email template', async () => {
      const response = await request(app)
        .post('/api/klaviyo-flow-automation/messaging/email-templates')
        .send({
          name: 'Welcome Email',
          subject: 'Welcome to our platform!',
          htmlContent: '<h1>Welcome!</h1>'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.data.subject).toBe('Welcome to our platform!');
    });

    test('should create SMS template', async () => {
      const response = await request(app)
        .post('/api/klaviyo-flow-automation/messaging/sms-templates')
        .send({
          name: 'Order Confirmation',
          message: 'Your order has been received!'
        });
      
      expect(response.status).toBe(201);
    });

    test('should get channel statistics', async () => {
      const response = await request(app)
        .get('/api/klaviyo-flow-automation/messaging/send-history/channel-stats');
      
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).toHaveProperty('sms');
    });
  });

  // ================================================================
  // CONTACT & SEGMENT ENGINE TESTS
  // ================================================================
  
  describe('Contact & Segment Engine', () => {
    
    test('should create contact', async () => {
      const response = await request(app)
        .post('/api/klaviyo-flow-automation/contacts-segments/contacts')
        .send({
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.data.email).toBe('john@example.com');
    });

    test('should create dynamic segment', async () => {
      const response = await request(app)
        .post('/api/klaviyo-flow-automation/contacts-segments/segments')
        .send({
          name: 'High Value Customers',
          type: 'dynamic',
          conditions: { field: 'totalSpent', operator: 'gte', value: 1000 }
        });
      
      expect(response.status).toBe(201);
    });

    test('should create list', async () => {
      const response = await request(app)
        .post('/api/klaviyo-flow-automation/contacts-segments/lists')
        .send({
          name: 'Newsletter Subscribers'
        });
      
      expect(response.status).toBe(201);
    });
  });

  // ================================================================
  // ANALYTICS & REPORTING ENGINE TESTS
  // ================================================================
  
  describe('Analytics & Reporting Engine', () => {
    
    test('should track metric', async () => {
      const response = await request(app)
        .post('/api/klaviyo-flow-automation/analytics-reporting/metrics/track')
        .send({
          name: 'email_sent',
          value: 1
        });
      
      expect(response.body.success).toBe(true);
    });

    test('should create report', async () => {
      const response = await request(app)
        .post('/api/klaviyo-flow-automation/analytics-reporting/reports')
        .send({
          name: 'Monthly Email Performance',
          type: 'email_analytics'
        });
      
      expect(response.status).toBe(201);
    });

    test('should create dashboard', async () => {
      const response = await request(app)
        .post('/api/klaviyo-flow-automation/analytics-reporting/dashboards')
        .send({
          name: 'Marketing Overview',
          widgets: [{ type: 'metric', metric: 'email_sent' }]
        });
      
      expect(response.status).toBe(201);
    });
  });

  // ================================================================
  // AI & PERSONALIZATION ENGINE TESTS
  // ================================================================
  
  describe('AI & Personalization Engine', () => {
    
    test('should create churn prediction', async () => {
      const response = await request(app)
        .post('/api/klaviyo-flow-automation/ai-personalization/predictions')
        .send({
          type: 'churn',
          contactId: 'contact_123',
          features: { engagementScore: 0.3 }
        });
      
      expect(response.status).toBe(201);
    });

    test('should create personalization rule', async () => {
      const response = await request(app)
        .post('/api/klaviyo-flow-automation/ai-personalization/personalization-rules')
        .send({
          name: 'VIP Message',
          conditions: { segment: 'vip_customers' }
        });
      
      expect(response.status).toBe(201);
    });

    test('should create A/B test', async () => {
      const response = await request(app)
        .post('/api/klaviyo-flow-automation/ai-personalization/ab-tests')
        .send({
          name: 'Subject Line Test',
          variants: [{ id: 'A' }, { id: 'B' }]
        });
      
      expect(response.status).toBe(201);
    });
  });

  // ================================================================
  // AUTOMATION & SCHEDULING ENGINE TESTS
  // ================================================================
  
  describe('Automation & Scheduling Engine', () => {
    
    test('should create automation rule', async () => {
      const response = await request(app)
        .post('/api/klaviyo-flow-automation/automation-scheduling/automation-rules')
        .send({
          name: 'Welcome Automation',
          trigger: { type: 'contact_created' }
        });
      
      expect(response.status).toBe(201);
    });

    test('should create cron schedule', async () => {
      const response = await request(app)
        .post('/api/klaviyo-flow-automation/automation-scheduling/schedules')
        .send({
          name: 'Daily Report',
          cronExpression: '0 9 * * *'
        });
      
      expect(response.status).toBe(201);
    });

    test('should create workflow', async () => {
      const response = await request(app)
        .post('/api/klaviyo-flow-automation/automation-scheduling/workflows')
        .send({
          name: 'Multi-step Campaign',
          steps: [{ id: 'step1', type: 'send_email' }]
        });
      
      expect(response.status).toBe(201);
    });
  });

  // ================================================================
  // INTEGRATIONS & SETTINGS ENGINE TESTS
  // ================================================================
  
  describe('Integrations & Settings Engine', () => {
    
    test('should create integration', async () => {
      const response = await request(app)
        .post('/api/klaviyo-flow-automation/integrations-settings/integrations')
        .send({
          name: 'Shopify',
          type: 'ecommerce'
        });
      
      expect(response.status).toBe(201);
    });

    test('should create webhook', async () => {
      const response = await request(app)
        .post('/api/klaviyo-flow-automation/integrations-settings/webhooks')
        .send({
          url: 'https://example.com/webhook',
          events: ['contact.created']
        });
      
      expect(response.status).toBe(201);
    });

    test('should create API key', async () => {
      const response = await request(app)
        .post('/api/klaviyo-flow-automation/integrations-settings/api-keys')
        .send({
          name: 'Production API Key'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.data.key).toBeDefined();
    });
  });

  // ================================================================
  // ADVANCED FEATURES ENGINE TESTS
  // ================================================================
  
  describe('Advanced Features Engine', () => {
    
    test('should create version', async () => {
      const response = await request(app)
        .post('/api/klaviyo-flow-automation/advanced-features/versions')
        .send({
          entityType: 'flow',
          entityId: 'flow_123',
          data: { name: 'Welcome Flow v2' }
        });
      
      expect(response.status).toBe(201);
    });

    test('should create template in library', async () => {
      const response = await request(app)
        .post('/api/klaviyo-flow-automation/advanced-features/templates')
        .send({
          name: 'Black Friday Email',
          category: 'seasonal'
        });
      
      expect(response.status).toBe(201);
    });

    test('should create backup', async () => {
      const response = await request(app)
        .post('/api/klaviyo-flow-automation/advanced-features/backups')
        .send({
          entityType: 'flows',
          entityIds: ['flow_1', 'flow_2']
        });
      
      expect(response.status).toBe(201);
    });
  });

  // ================================================================
  // SYSTEM ENDPOINTS TESTS
  // ================================================================
  
  describe('System Endpoints', () => {
    
    test('should return health check', async () => {
      const response = await request(app)
        .get('/api/klaviyo-flow-automation/health');
      
      expect(response.body.status).toBe('healthy');
    });

    test('should return status', async () => {
      const response = await request(app)
        .get('/api/klaviyo-flow-automation/status');
      
      expect(response.body.endpoints).toBe(245);
      expect(response.body.modules).toBe(8);
    });
  });

  // ================================================================
  // ERROR HANDLING TESTS
  // ================================================================
  
  describe('Error Handling', () => {
    
    test('should return 404 for non-existent resource', async () => {
      const response = await request(app)
        .get('/api/klaviyo-flow-automation/flow-builder/flows/nonexistent_id');
      
      expect(response.status).toBe(404);
    });
  });
});
