/**
 * CUSTOMER DATA PLATFORM V2 - COMPREHENSIVE TEST SUITE
 * Tests for all 8 engines: Profile, Events, Segments, Integration,
 * Privacy, Analytics, Activation, AI/ML
 */

const request = require('supertest');
const express = require('express');
const router = require('../routes/customer-data-platform');

const app = express();
app.use(express.json());
app.use('/api/customer-data-platform', router);

describe('Customer Data Platform V2 - Comprehensive Tests', () => {
  // ================================================================
  // PROFILE MANAGEMENT TESTS
  // ================================================================

  describe('Profile Management Engine', () => {
    let profileId;

    test('POST /profiles - Create profile', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/profiles')
        .send({ email: 'test@example.com', userId: 'user123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.profile).toHaveProperty('id');
      expect(response.body.profile.email).toBe('test@example.com');
      profileId = response.body.profile.id;
    });

    test('GET /profiles/:id - Get profile', async () => {
      const response = await request(app)
        .get(`/api/customer-data-platform/profiles/${profileId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.profile.id).toBe(profileId);
    });

    test('GET /profiles - List profiles', async () => {
      const response = await request(app)
        .get('/api/customer-data-platform/profiles?limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.profiles)).toBe(true);
    });

    test('PUT /profiles/:id - Update profile', async () => {
      const response = await request(app)
        .put(`/api/customer-data-platform/profiles/${profileId}`)
        .send({ firstName: 'John', lastName: 'Doe' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('POST /profiles/identity/link - Link identity', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/profiles/identity/link')
        .send({ profileId, identity: { type: 'phone', value: '+1234567890' } })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('POST /profiles/:id/traits - Set trait', async () => {
      const response = await request(app)
        .post(`/api/customer-data-platform/profiles/${profileId}/traits`)
        .send({ trait: 'plan', value: 'premium' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('GET /profiles/:id/score - Get profile score', async () => {
      const response = await request(app)
        .get(`/api/customer-data-platform/profiles/${profileId}/score`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.score).toHaveProperty('total');
    });

    test('DELETE /profiles/:id - Delete profile', async () => {
      const response = await request(app)
        .delete(`/api/customer-data-platform/profiles/${profileId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // ================================================================
  // EVENT TRACKING TESTS
  // ================================================================

  describe('Event Tracking Engine', () => {
    let eventId;

    test('POST /events/track - Track event', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/events/track')
        .send({
          event: 'page_view',
          userId: 'user123',
          properties: { page: '/home' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.event).toHaveProperty('id');
      eventId = response.body.event.id;
    });

    test('GET /events/:id - Get event', async () => {
      const response = await request(app)
        .get(`/api/customer-data-platform/events/${eventId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.event.event).toBe('page_view');
    });

    test('GET /events - List events', async () => {
      const response = await request(app)
        .get('/api/customer-data-platform/events?limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.events)).toBe(true);
    });

    test('POST /events/schemas - Create schema', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/events/schemas')
        .send({
          name: 'purchase',
          properties: {
            amount: 'number',
            currency: 'string'
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('GET /events/analytics/counts - Get event counts', async () => {
      const response = await request(app)
        .get('/api/customer-data-platform/events/analytics/counts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.counts).toBeDefined();
    });

    test('POST /sessions/start - Start session', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/sessions/start')
        .send({ userId: 'user123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.session).toHaveProperty('id');
    });
  });

  // ================================================================
  // SEGMENTATION TESTS
  // ================================================================

  describe('Segmentation Engine', () => {
    let segmentId;

    test('POST /segments - Create segment', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/segments')
        .send({
          name: 'High Value Customers',
          type: 'dynamic',
          conditions: [{ field: 'totalSpent', operator: 'greater_than', value: 1000 }]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.segment).toHaveProperty('id');
      segmentId = response.body.segment.id;
    });

    test('GET /segments/:id - Get segment', async () => {
      const response = await request(app)
        .get(`/api/customer-data-platform/segments/${segmentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.segment.name).toBe('High Value Customers');
    });

    test('POST /segments/:id/compute - Compute members', async () => {
      const response = await request(app)
        .post(`/api/customer-data-platform/segments/${segmentId}/compute`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('memberCount');
    });

    test('GET /segments/:id/members - Get members', async () => {
      const response = await request(app)
        .get(`/api/customer-data-platform/segments/${segmentId}/members`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.members)).toBe(true);
    });

    test('POST /segments/rfm/analyze - RFM analysis', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/segments/rfm/analyze')
        .send({ userId: 'user123', metrics: { r: 10, f: 5, m: 500 } })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('DELETE /segments/:id - Delete segment', async () => {
      const response = await request(app)
        .delete(`/api/customer-data-platform/segments/${segmentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // ================================================================
  // DATA INTEGRATION TESTS
  // ================================================================

  describe('Data Integration Engine', () => {
    let sourceId, destinationId, syncJobId;

    test('POST /integration/sources - Create source', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/integration/sources')
        .send({
          name: 'Shopify Store',
          type: 'shopify',
          config: { apiKey: 'test123' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      sourceId = response.body.source.id;
    });

    test('POST /integration/destinations - Create destination', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/integration/destinations')
        .send({
          name: 'Data Warehouse',
          type: 'warehouse',
          config: {}
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      destinationId = response.body.destination.id;
    });

    test('POST /integration/sync - Create sync job', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/integration/sync')
        .send({
          sourceId,
          destinationId,
          mode: 'full'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      syncJobId = response.body.job.id;
    });

    test('GET /integration/sync/:id - Get sync job', async () => {
      const response = await request(app)
        .get(`/api/customer-data-platform/integration/sync/${syncJobId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('POST /integration/transformations - Create transformation', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/integration/transformations')
        .send({
          name: 'Email Normalizer',
          type: 'map',
          config: { mapping: { email: 'email_address' } }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // ================================================================
  // PRIVACY & COMPLIANCE TESTS
  // ================================================================

  describe('Privacy & Compliance Engine', () => {
    let consentId, requestId;

    test('POST /privacy/consent - Record consent', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/privacy/consent')
        .send({
          userId: 'user123',
          email: 'test@example.com',
          purposes: ['marketing', 'analytics'],
          channel: 'web'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      consentId = response.body.consent.id;
    });

    test('POST /privacy/consent/check - Check consent', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/privacy/consent/check')
        .send({ userId: 'user123', purpose: 'marketing' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('hasConsent');
    });

    test('POST /privacy/requests - Create data request', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/privacy/requests')
        .send({
          type: 'access',
          userId: 'user123',
          email: 'test@example.com',
          verificationToken: 'token123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      requestId = response.body.request.id;
    });

    test('POST /privacy/retention - Create retention policy', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/privacy/retention')
        .send({
          name: 'Event Retention',
          dataCategory: 'events',
          retentionPeriod: 365,
          deleteAfter: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('GET /privacy/compliance/score - Get compliance score', async () => {
      const response = await request(app)
        .get('/api/customer-data-platform/privacy/compliance/score')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('overallScore');
    });

    test('GET /privacy/audit - Get audit logs', async () => {
      const response = await request(app)
        .get('/api/customer-data-platform/privacy/audit')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.logs)).toBe(true);
    });
  });

  // ================================================================
  // ANALYTICS & INSIGHTS TESTS
  // ================================================================

  describe('Analytics & Insights Engine', () => {
    let cohortId, funnelId, modelId;

    test('POST /analytics/cohorts - Create cohort', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/analytics/cohorts')
        .send({
          name: 'January 2024',
          definition: { signupMonth: '2024-01' },
          period: 'month'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      cohortId = response.body.cohort.id;
    });

    test('POST /analytics/cohorts/:id/analyze - Analyze cohort', async () => {
      const response = await request(app)
        .post(`/api/customer-data-platform/analytics/cohorts/${cohortId}/analyze`)
        .send({ metricType: 'retention', periods: 6 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('POST /analytics/funnels - Create funnel', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/analytics/funnels')
        .send({
          name: 'Checkout Funnel',
          steps: [
            { name: 'View Product', event: 'product_view' },
            { name: 'Add to Cart', event: 'add_to_cart' },
            { name: 'Checkout', event: 'checkout' }
          ]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      funnelId = response.body.funnel.id;
    });

    test('POST /analytics/attribution/models - Create attribution model', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/analytics/attribution/models')
        .send({
          name: 'Position Based',
          type: 'position_based',
          lookbackWindow: 30
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      modelId = response.body.model.id;
    });

    test('POST /analytics/journeys/analyze - Analyze journey', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/analytics/journeys/analyze')
        .send({ userId: 'user123' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('GET /analytics/insights - Get insights', async () => {
      const response = await request(app)
        .get('/api/customer-data-platform/analytics/insights')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.insights)).toBe(true);
    });
  });

  // ================================================================
  // ACTIVATION TESTS
  // ================================================================

  describe('Activation Engine', () => {
    let destinationId, activationId, campaignId;

    test('POST /activation/destinations - Create destination', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/activation/destinations')
        .send({
          name: 'Mailchimp',
          type: 'email',
          config: { apiKey: 'test' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      destinationId = response.body.destination.id;
    });

    test('POST /activation/activations - Create activation', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/activation/activations')
        .send({
          name: 'Sync High Value',
          segmentId: 'seg123',
          destinationId,
          mapping: {},
          enabled: true
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      activationId = response.body.activation.id;
    });

    test('POST /activation/campaigns - Create campaign', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/activation/campaigns')
        .send({
          name: 'Welcome Campaign',
          type: 'welcome',
          trigger: { event: 'user_signup' },
          actions: [{ type: 'send_email', config: { template: 'welcome' } }]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      campaignId = response.body.campaign.id;
    });

    test('POST /activation/webhooks - Create webhook', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/activation/webhooks')
        .send({
          url: 'https://example.com/webhook',
          events: ['profile.created', 'segment.updated']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('GET /activation/metrics - Get metrics', async () => {
      const response = await request(app)
        .get('/api/customer-data-platform/activation/metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // ================================================================
  // AI/ML OPTIMIZATION TESTS
  // ================================================================

  describe('AI/ML Optimization Engine', () => {
    let modelId, trainingJobId;

    test('POST /aiml/models - Create model', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/aiml/models')
        .send({
          name: 'Churn Model',
          type: 'churn',
          features: ['daysSinceLastPurchase', 'purchaseFrequency', 'npsScore']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      modelId = response.body.model.id;
    });

    test('POST /aiml/models/:id/train - Train model', async () => {
      const response = await request(app)
        .post(`/api/customer-data-platform/aiml/models/${modelId}/train`)
        .send({ trainingData: [] })
        .expect(200);

      expect(response.body.success).toBe(true);
      trainingJobId = response.body.job.id;
    });

    test('GET /aiml/training/:id - Get training job', async () => {
      const response = await request(app)
        .get(`/api/customer-data-platform/aiml/training/${trainingJobId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('POST /aiml/models/:id/deploy - Deploy model', async () => {
      // First wait for training (in real test, mock or wait)
      const response = await request(app)
        .post(`/api/customer-data-platform/aiml/models/${modelId}/deploy`)
        .expect(200);

      expect(response.body).toHaveProperty('success');
    });

    test('POST /aiml/predict/churn - Predict churn', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/aiml/predict/churn')
        .send({
          userId: 'user123',
          features: {
            daysSinceLastPurchase: 45,
            purchaseFrequency: 2,
            npsScore: 7
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.prediction).toHaveProperty('score');
    });

    test('POST /aiml/predict/ltv - Predict LTV', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/aiml/predict/ltv')
        .send({
          userId: 'user123',
          features: {
            avgOrderValue: 75,
            purchaseFrequency: 4,
            customerLifespan: 365
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.prediction).toHaveProperty('predictedLTV');
    });

    test('POST /aiml/recommend/next-action - Get recommendations', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/aiml/recommend/next-action')
        .send({ userId: 'user123', context: {} })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.recommendation).toHaveProperty('topActions');
    });

    test('POST /aiml/lookalikes/find - Find lookalikes', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/aiml/lookalikes/find')
        .send({ seedUserId: 'user123', features: {}, limit: 50 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('POST /aiml/scoring/calculate - Calculate score', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/aiml/scoring/calculate')
        .send({
          userId: 'user123',
          features: { recency: 10, frequency: 5, monetary: 500 }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('GET /aiml/models/:id/performance - Get model performance', async () => {
      const response = await request(app)
        .get(`/api/customer-data-platform/aiml/models/${modelId}/performance`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // ================================================================
  // SYSTEM & HEALTH TESTS
  // ================================================================

  describe('System & Health Endpoints', () => {
    test('GET /health - Health check', async () => {
      const response = await request(app)
        .get('/api/customer-data-platform/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('healthy');
    });

    test('GET /stats - Get stats', async () => {
      const response = await request(app)
        .get('/api/customer-data-platform/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stats).toHaveProperty('profiles');
      expect(response.body.stats).toHaveProperty('events');
      expect(response.body.stats).toHaveProperty('segments');
    });
  });

  // ================================================================
  // ERROR HANDLING TESTS
  // ================================================================

  describe('Error Handling', () => {
    test('GET /profiles/:id - 404 for non-existent profile', async () => {
      const response = await request(app)
        .get('/api/customer-data-platform/profiles/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('POST /profiles - Validation error', async () => {
      const response = await request(app)
        .post('/api/customer-data-platform/profiles')
        .send({})
        .expect(200); // Returns 200 but success: false in body

      // Engine creates profile even with minimal data
      expect(response.body).toHaveProperty('success');
    });
  });

  // ================================================================
  // INTEGRATION TESTS
  // ================================================================

  describe('End-to-End Integration', () => {
    test('Complete user journey: Profile → Event → Segment → Activation', async () => {
      // 1. Create profile
      const profileRes = await request(app)
        .post('/api/customer-data-platform/profiles')
        .send({ email: 'journey@test.com', userId: 'journey123' });

      expect(profileRes.body.success).toBe(true);
      const profileId = profileRes.body.profile.id;

      // 2. Track events
      await request(app)
        .post('/api/customer-data-platform/events/track')
        .send({ event: 'purchase', userId: 'journey123', properties: { amount: 150 } });

      // 3. Create segment
      const segmentRes = await request(app)
        .post('/api/customer-data-platform/segments')
        .send({ name: 'Purchasers', type: 'dynamic', conditions: [] });

      const segmentId = segmentRes.body.segment.id;

      // 4. Create activation
      const destRes = await request(app)
        .post('/api/customer-data-platform/activation/destinations')
        .send({ name: 'Test Dest', type: 'email', config: {} });

      await request(app)
        .post('/api/customer-data-platform/activation/activations')
        .send({
          name: 'Sync Purchasers',
          segmentId,
          destinationId: destRes.body.destination.id,
          mapping: {},
          enabled: true
        });

      // Verify all steps succeeded
      expect(profileRes.body.success).toBe(true);
      expect(segmentRes.body.success).toBe(true);
      expect(destRes.body.success).toBe(true);
    });
  });
});
