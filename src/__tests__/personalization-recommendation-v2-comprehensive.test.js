/**
 * PERSONALIZATION & RECOMMENDATION ENGINE V2 - COMPREHENSIVE TEST SUITE
 * Tests for all 8 engines: User Profile, Recommendation, Personalization, Campaign,
 * ML Model, Analytics, Optimization, Content
 */

const request = require('supertest');
const express = require('express');
const router = require('../routes/personalization-recommendation');

const app = express();
app.use(express.json());
app.use('/api/personalization-recommendation', router);

describe('Personalization & Recommendation Engine V2 - Comprehensive Tests', () => {
  // ================================================================
  // USER PROFILE TESTS
  // ================================================================

  describe('User Profile Engine', () => {
    let profileId;

    test('POST /profiles - Create profile', async () => {
      const response = await request(app)
        .post('/api/personalization-recommendation/profiles')
        .send({ email: 'test@example.com', userId: 'user123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.profile).toHaveProperty('id');
      profileId = response.body.profile.id;
    });

    test('GET /profiles/:id - Get profile', async () => {
      const response = await request(app)
        .get(`/api/personalization-recommendation/profiles/${profileId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.profile.id).toBe(profileId);
    });

    test('POST /profiles/:id/preferences - Update preferences', async () => {
      const response = await request(app)
        .post(`/api/personalization-recommendation/profiles/${profileId}/preferences`)
        .send({ categories: ['electronics', 'books'], priceRange: { min: 10, max: 100 } })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('POST /profiles/:id/behavior - Track behavior', async () => {
      const response = await request(app)
        .post(`/api/personalization-recommendation/profiles/${profileId}/behavior`)
        .send({ action: 'view', itemId: 'prod_123' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('GET /profiles/:id/score - Get engagement score', async () => {
      const response = await request(app)
        .get(`/api/personalization-recommendation/profiles/${profileId}/score`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.score).toHaveProperty('total');
    });
  });

  // ================================================================
  // RECOMMENDATION TESTS
  // ================================================================

  describe('Recommendation Engine', () => {
    test('POST /recommendations/generate - Generate recommendations', async () => {
      const response = await request(app)
        .post('/api/personalization-recommendation/recommendations/generate')
        .send({ userId: 'user123', method: 'collaborative', limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.recommendations)).toBe(true);
    });

    test('POST /recommendations/similar - Find similar items', async () => {
      const response = await request(app)
        .post('/api/personalization-recommendation/recommendations/similar')
        .send({ itemId: 'prod_123', limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.items).toBeDefined();
    });

    test('GET /recommendations/trending - Get trending items', async () => {
      const response = await request(app)
        .get('/api/personalization-recommendation/recommendations/trending?limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    test('POST /recommendations/track-click - Track recommendation click', async () => {
      const response = await request(app)
        .post('/api/personalization-recommendation/recommendations/track-click')
        .send({ userId: 'user123', itemId: 'prod_123', recommendationId: 'rec_456' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // ================================================================
  // PERSONALIZATION TESTS
  // ================================================================

  describe('Personalization Engine', () => {
    let ruleId;

    test('POST /personalization/rules - Create rule', async () => {
      const response = await request(app)
        .post('/api/personalization-recommendation/personalization/rules')
        .send({
          name: 'VIP Banner',
          conditions: [{ field: 'segment', operator: 'equals', value: 'vip' }],
          content: { banner: 'vip-special.jpg' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      ruleId = response.body.rule.id;
    });

    test('POST /personalization/evaluate - Evaluate personalization', async () => {
      const response = await request(app)
        .post('/api/personalization-recommendation/personalization/evaluate')
        .send({ userId: 'user123', context: { page: 'homepage' } })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.content).toBeDefined();
    });

    test('POST /personalization/ab-test - Create A/B test', async () => {
      const response = await request(app)
        .post('/api/personalization-recommendation/personalization/ab-test')
        .send({
          name: 'Homepage Banner Test',
          variants: [
            { id: 'control', content: { banner: 'control.jpg' }, weight: 50 },
            { id: 'variant', content: { banner: 'variant.jpg' }, weight: 50 }
          ]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // ================================================================
  // CAMPAIGN TESTS
  // ================================================================

  describe('Campaign Engine', () => {
    let campaignId;

    test('POST /campaigns - Create campaign', async () => {
      const response = await request(app)
        .post('/api/personalization-recommendation/campaigns')
        .send({
          name: 'Welcome Campaign',
          type: 'email',
          target: { segment: 'new_users' },
          content: { template: 'welcome_email' }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      campaignId = response.body.campaign.id;
    });

    test('GET /campaigns/:id - Get campaign', async () => {
      const response = await request(app)
        .get(`/api/personalization-recommendation/campaigns/${campaignId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.campaign.name).toBe('Welcome Campaign');
    });

    test('POST /campaigns/:id/activate - Activate campaign', async () => {
      const response = await request(app)
        .post(`/api/personalization-recommendation/campaigns/${campaignId}/activate`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('GET /campaigns/:id/performance - Get performance', async () => {
      const response = await request(app)
        .get(`/api/personalization-recommendation/campaigns/${campaignId}/performance`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toBeDefined();
    });
  });

  // ================================================================
  // ML MODEL TESTS
  // ================================================================

  describe('ML Model Engine', () => {
    let modelId;

    test('POST /models - Create model', async () => {
      const response = await request(app)
        .post('/api/personalization-recommendation/models')
        .send({
          name: 'Collaborative Filter',
          type: 'collaborative_filtering',
          config: { minSupport: 3 }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      modelId = response.body.model.id;
    });

    test('POST /models/:id/train - Train model', async () => {
      const response = await request(app)
        .post(`/api/personalization-recommendation/models/${modelId}/train`)
        .send({ trainingData: [] })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('GET /models/:id/performance - Get model performance', async () => {
      const response = await request(app)
        .get(`/api/personalization-recommendation/models/${modelId}/performance`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // ================================================================
  // ANALYTICS TESTS
  // ================================================================

  describe('Analytics Engine', () => {
    test('GET /analytics/engagement - Get engagement metrics', async () => {
      const response = await request(app)
        .get('/api/personalization-recommendation/analytics/engagement')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toBeDefined();
    });

    test('GET /analytics/conversion - Get conversion metrics', async () => {
      const response = await request(app)
        .get('/api/personalization-recommendation/analytics/conversion')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('GET /analytics/revenue - Get revenue analytics', async () => {
      const response = await request(app)
        .get('/api/personalization-recommendation/analytics/revenue')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('POST /analytics/insights - Generate AI insights', async () => {
      const response = await request(app)
        .post('/api/personalization-recommendation/analytics/insights')
        .send({ timeframe: '30d' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.insights)).toBe(true);
    });
  });

  // ================================================================
  // OPTIMIZATION TESTS
  // ================================================================

  describe('Optimization Engine', () => {
    test('POST /optimization/realtime - Real-time optimization', async () => {
      const response = await request(app)
        .post('/api/personalization-recommendation/optimization/realtime')
        .send({ userId: 'user123', context: {} })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('POST /optimization/multivariate - Create multivariate test', async () => {
      const response = await request(app)
        .post('/api/personalization-recommendation/optimization/multivariate')
        .send({
          name: 'Product Page Test',
          factors: [
            { name: 'heading', variants: ['A', 'B'] },
            { name: 'cta', variants: ['Buy Now', 'Add to Cart'] }
          ]
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('POST /optimization/bandit - Multi-armed bandit', async () => {
      const response = await request(app)
        .post('/api/personalization-recommendation/optimization/bandit')
        .send({
          arms: ['variant_a', 'variant_b', 'variant_c'],
          algorithm: 'thompson_sampling'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // ================================================================
  // CONTENT TESTS
  // ================================================================

  describe('Content Engine', () => {
    let contentId;

    test('POST /content - Create content', async () => {
      const response = await request(app)
        .post('/api/personalization-recommendation/content')
        .send({
          title: 'Test Article',
          category: 'blog',
          tags: ['technology', 'ai']
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      contentId = response.body.content.id;
    });

    test('POST /content/recommend - Recommend content', async () => {
      const response = await request(app)
        .post('/api/personalization-recommendation/content/recommend')
        .send({ userId: 'user123', limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('GET /content/:id/similar - Find similar content', async () => {
      const response = await request(app)
        .get(`/api/personalization-recommendation/content/${contentId}/similar?limit=5`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  // ================================================================
  // SYSTEM TESTS
  // ================================================================

  describe('System & Health Endpoints', () => {
    test('GET /health - Health check', async () => {
      const response = await request(app)
        .get('/api/personalization-recommendation/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('healthy');
    });

    test('GET /stats - Get stats', async () => {
      const response = await request(app)
        .get('/api/personalization-recommendation/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stats).toHaveProperty('profiles');
      expect(response.body.stats).toHaveProperty('recommendations');
      expect(response.body.stats).toHaveProperty('campaigns');
      expect(response.body.stats).toHaveProperty('models');
    });
  });

  // ================================================================
  // INTEGRATION TESTS
  // ================================================================

  describe('End-to-End Integration', () => {
    test('Complete personalization flow: Profile → Behavior → Recommendations → Campaign', async () => {
      // 1. Create profile
      const profileRes = await request(app)
        .post('/api/personalization-recommendation/profiles')
        .send({ email: 'integration@test.com', userId: 'int_user_123' });

      expect(profileRes.body.success).toBe(true);
      const profileId = profileRes.body.profile.id;

      // 2. Track behavior
      await request(app)
        .post(`/api/personalization-recommendation/profiles/${profileId}/behavior`)
        .send({ action: 'view', itemId: 'prod_456' });

      // 3. Update preferences
      await request(app)
        .post(`/api/personalization-recommendation/profiles/${profileId}/preferences`)
        .send({ categories: ['electronics'], priceRange: { min: 50, max: 500 } });

      // 4. Generate recommendations
      const recRes = await request(app)
        .post('/api/personalization-recommendation/recommendations/generate')
        .send({ userId: 'int_user_123', method: 'hybrid', limit: 5 });

      expect(recRes.body.success).toBe(true);

      // 5. Create targeted campaign
      const campaignRes = await request(app)
        .post('/api/personalization-recommendation/campaigns')
        .send({
          name: 'Integration Test Campaign',
          type: 'email',
          target: { userId: 'int_user_123' },
          content: { template: 'personalized_recommendations' }
        });

      expect(campaignRes.body.success).toBe(true);

      // Verify all steps succeeded
      expect(profileRes.body.success).toBe(true);
      expect(recRes.body.success).toBe(true);
      expect(campaignRes.body.success).toBe(true);
    });
  });
});
