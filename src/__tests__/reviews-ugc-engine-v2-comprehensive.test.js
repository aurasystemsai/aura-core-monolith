/**
 * Reviews & UGC Engine V2 - Comprehensive Test Suite
 * 48 tests covering all 8 engines + E2E workflow
 */

const request = require('supertest');
const express = require('express');
const reviewsUGCRouter = require('../routes/reviews-ugc-engine');

const app = express();
app.use(express.json());
app.use('/api/reviews-ugc-engine', reviewsUGCRouter);

describe('Reviews & UGC Engine V2 - Comprehensive Tests', () => {
  // ========== Review Management Tests (6 tests) ==========
  
  describe('Review Management Engine', () => {
    let reviewId;

    test('should create a review with 5-star rating', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/reviews')
        .send({
          productId: 'prod_001',
          customerId: 'cust_001',
          customerName: 'John Doe',
          rating: 5,
          title: 'Excellent product!',
          content: 'This product exceeded my expectations. Great quality and fast shipping.',
          verified: true,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.rating).toBe(5);
      expect(response.body.status).toBe('pending');
      reviewId = response.body.id;
    });

    test('should get product reviews with filters', async () => {
      const response = await request(app)
        .get('/api/reviews-ugc-engine/products/prod_001/reviews')
        .query({ status: 'approved', sortBy: 'recent', limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('reviews');
      expect(Array.isArray(response.body.reviews)).toBe(true);
    });

    test('should moderate review (approve)', async () => {
      const response = await request(app)
        .post(`/api/reviews-ugc-engine/reviews/${reviewId}/moderate`)
        .send({
          status: 'approved',
          moderatorId: 'mod_001',
          notes: 'Review looks legitimate',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('approved');
      expect(response.body.moderatedBy).toBe('mod_001');
    });

    test('should add merchant response to review', async () => {
      const response = await request(app)
        .post(`/api/reviews-ugc-engine/reviews/${reviewId}/responses`)
        .send({
          responderId: 'merchant_001',
          responderName: 'Shop Owner',
          responderType: 'merchant',
          content: 'Thank you for your feedback!',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toContain('Thank you');
    });

    test('should vote review as helpful', async () => {
      const response = await request(app)
        .post(`/api/reviews-ugc-engine/reviews/${reviewId}/vote`)
        .send({
          voterId: 'user_002',
          helpful: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should get product rating summary', async () => {
      const response = await request(app)
        .get('/api/reviews-ugc-engine/products/prod_001/rating-summary');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('averageRating');
      expect(response.body).toHaveProperty('totalReviews');
      expect(response.body).toHaveProperty('ratingDistribution');
    });
  });

  // ========== UGC Collection Tests (5 tests) ==========
  
  describe('UGC Collection Engine', () => {
    let campaignId;

    test('should create post-purchase campaign', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/campaigns')
        .send({
          name: 'Post-Purchase Review Requests',
          type: 'post_purchase',
          channels: ['email', 'sms'],
          triggers: {
            event: 'order_delivered',
            delay: 7,
          },
          products: ['all'],
          emailTemplate: 'template_001',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe('post_purchase');
      campaignId = response.body.id;
    });

    test('should send review request', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/campaigns/send-request')
        .send({
          campaignId,
          customerId: 'cust_002',
          customerEmail: 'customer@example.com',
          productId: 'prod_001',
          orderId: 'order_001',
          channel: 'email',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('submissionId');
      expect(response.body.status).toBe('sent');
    });

    test('should track review request interaction', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/campaigns/track/sub_001')
        .send({ interactionType: 'opened' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('opened');
    });

    test('should create collection widget', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/collection-widgets')
        .send({
          name: 'Product Page Widget',
          type: 'inline',
          placement: 'product_page',
          productId: 'prod_001',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe('inline');
    });

    test('should get collection statistics', async () => {
      const response = await request(app)
        .get('/api/reviews-ugc-engine/collection/statistics');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('campaigns');
      expect(response.body).toHaveProperty('requests');
      expect(response.body.requests).toHaveProperty('conversionRate');
    });
  });

  // ========== Moderation Tests (6 tests) ==========
  
  describe('Moderation Engine', () => {
    let ruleId;

    test('should create moderation rule', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/moderation/rules')
        .send({
          name: 'Auto-approve verified reviews',
          type: 'auto_approve',
          conditions: {
            rating: 4,
            verified: true,
          },
          action: 'approve',
          priority: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe('auto_approve');
      ruleId = response.body.id;
    });

    test('should moderate content (profanity detection)', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/moderation/moderate')
        .send({
          content: 'This product contains inappropriate word here',
          rating: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('score');
      expect(response.body.score).toBeGreaterThanOrEqual(0);
      expect(response.body.score).toBeLessThanOrEqual(100);
    });

    test('should moderate content (spam detection)', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/moderation/moderate')
        .send({
          content: 'Click here http://spam.com for deals!!! Email me at spam@test.com!!!',
          rating: 5,
        });

      expect(response.status).toBe(200);
      expect(response.body.flags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'spam' }),
        ])
      );
    });

    test('should get moderation queue with priority filter', async () => {
      const response = await request(app)
        .get('/api/reviews-ugc-engine/moderation/queue')
        .query({ status: 'pending', priority: 'high', limit: 20 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    test('should review queue item (approve)', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/moderation/queue/queue_001/review')
        .send({
          action: 'approve',
          reviewedBy: 'mod_001',
          notes: 'Content is acceptable',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('reviewed');
    });

    test('should get moderation statistics', async () => {
      const response = await request(app)
        .get('/api/reviews-ugc-engine/moderation/statistics');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('queue');
      expect(response.body).toHaveProperty('decisions');
      expect(response.body.decisions).toHaveProperty('approvalRate');
    });
  });

  // ========== Sentiment AI Tests (5 tests) ==========
  
  describe('Sentiment AI Engine', () => {
    let analysisId;

    test('should analyze sentiment of review', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/sentiment/analyze')
        .send({
          reviewId: 'review_001',
          content: 'Amazing product! Love it so much. Great quality and excellent service.',
          rating: 5,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.sentiment).toBe('positive');
      expect(response.body.sentimentScore).toBeGreaterThan(0);
      expect(response.body.confidence).toBeGreaterThanOrEqual(0.5);
      analysisId = response.body.id;
    });

    test('should detect emotions in review', async () => {
      const response = await request(app)
        .get(`/api/reviews-ugc-engine/sentiment/analyses/${analysisId}`);

      expect(response.status).toBe(200);
      expect(response.body.emotions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            emotion: expect.any(String),
            confidence: expect.any(Number),
          }),
        ])
      );
    });

    test('should extract topics from reviews', async () => {
      const response = await request(app)
        .get(`/api/reviews-ugc-engine/sentiment/analyses/${analysisId}`);

      expect(response.status).toBe(200);
      expect(response.body.topics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            topic: expect.any(String),
            relevance: expect.any(Number),
          }),
        ])
      );
    });

    test('should generate insights for product', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/sentiment/insights')
        .send({
          productId: 'prod_001',
          reviews: [
            { content: 'Great quality', rating: 5 },
            { content: 'Love the design', rating: 5 },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalReviews');
      expect(response.body).toHaveProperty('sentimentBreakdown');
      expect(response.body).toHaveProperty('recommendations');
    });

    test('should detect sentiment trends over time', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/sentiment/trends')
        .send({
          productId: 'prod_001',
          reviews: [
            { content: 'Good', rating: 4, createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
            { content: 'Excellent', rating: 5, createdAt: new Date() },
          ],
          timeframe: 30,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('trend');
      expect(['improving', 'declining', 'stable']).toContain(response.body.trend);
    });
  });

  // ========== Social Proof Tests (5 tests) ==========
  
  describe('Social Proof Engine', () => {
    let ruleId, badgeId;

    test('should create display rule', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/social-proof/display-rules')
        .send({
          name: 'Product Page Rule',
          priority: 1,
          conditions: {
            pageType: 'product_page',
          },
          displaySettings: {
            showRating: true,
            showReviewCount: true,
            reviewCount: 5,
          },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      ruleId = response.body.id;
    });

    test('should optimize review display based on rating', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/social-proof/optimize-display')
        .send({
          productId: 'prod_001',
          reviews: [
            { rating: 5, content: 'Great!' },
            { rating: 5, content: 'Excellent!' },
            { rating: 4, content: 'Good' },
          ],
          performanceData: { averageRating: 4.7 },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('displayStrategy');
      expect(response.body).toHaveProperty('recommendedReviews');
      expect(['showcase_excellence', 'balanced', 'credibility_focus']).toContain(response.body.displayStrategy);
    });

    test('should create trust badge', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/social-proof/trust-badges')
        .send({
          name: 'Verified Reviews',
          type: 'verified_reviews',
          criteria: {
            minReviews: 100,
            minRating: 4.0,
            minVerifiedReviews: 50,
          },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      badgeId = response.body.id;
    });

    test('should get applicable badges for product', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/social-proof/applicable-badges')
        .send({
          totalReviews: 150,
          averageRating: 4.5,
          verifiedReviews: 80,
          recommendationRate: 85,
        });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should create A/B test for display variants', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/social-proof/ab-tests')
        .send({
          name: 'Widget Position Test',
          variants: [
            { id: 'A', name: 'Top', settings: { position: 'top' } },
            { id: 'B', name: 'Bottom', settings: { position: 'bottom' } },
          ],
          trafficAllocation: { A: 50, B: 50 },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('active');
    });
  });

  // ========== Display Widgets Tests (6 tests) ==========
  
  describe('Display Widget Engine', () => {
    let widgetId, themeId;

    test('should create review widget', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/widgets')
        .send({
          name: 'Product Page Widget',
          type: 'standard',
          productId: 'prod_001',
          layout: { columns: 2, maxReviews: 10 },
          display: { showRating: true, showPhotos: true },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      widgetId = response.body.id;
    });

    test('should generate widget embed code', async () => {
      const response = await request(app)
        .get(`/api/reviews-ugc-engine/widgets/${widgetId}/embed-code`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('embedCode');
      expect(response.body.embedCode).toContain('<script');
    });

    test('should track widget analytics', async () => {
      const response = await request(app)
        .post(`/api/reviews-ugc-engine/widgets/${widgetId}/analytics`)
        .send({ eventType: 'view' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('analytics');
      expect(response.body.analytics.views).toBeGreaterThan(0);
    });

    test('should create carousel', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/carousels')
        .send({
          name: 'Homepage Carousel',
          productIds: ['prod_001', 'prod_002'],
          display: { autoPlay: true, slidesToShow: 3 },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    test('should create theme', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/themes')
        .send({
          name: 'Custom Theme',
          colors: { primary: '#4CAF50', star: '#FFC107' },
          typography: { fontFamily: 'Arial', fontSize: '14px' },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      themeId = response.body.id;
    });

    test('should generate widget preview', async () => {
      const response = await request(app)
        .post(`/api/reviews-ugc-engine/widgets/${widgetId}/preview`)
        .send({
          sampleReviews: [
            { rating: 5, content: 'Great!', customerName: 'John' },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('reviews');
    });
  });

  // ========== Analytics Tests (6 tests) ==========
  
  describe('Analytics & Insights Engine', () => {
    test('should track analytics event', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/analytics/events')
        .send({
          type: 'review_created',
          entity: 'review',
          entityId: 'review_001',
          productId: 'prod_001',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    test('should get review metrics', async () => {
      const response = await request(app)
        .get('/api/reviews-ugc-engine/analytics/reviews')
        .query({ productId: 'prod_001' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalReviews');
      expect(response.body).toHaveProperty('approvalRate');
    });

    test('should get collection performance', async () => {
      const response = await request(app)
        .get('/api/reviews-ugc-engine/analytics/collection');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('requestsSent');
      expect(response.body).toHaveProperty('conversionRate');
    });

    test('should get sentiment trends', async () => {
      const response = await request(app)
        .get('/api/reviews-ugc-engine/analytics/sentiment-trends/prod_001')
        .query({ timeframe: 30 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('trends');
      expect(Array.isArray(response.body.trends)).toBe(true);
    });

    test('should create analytics report', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/analytics/reports')
        .send({
          name: 'Monthly Review Report',
          type: 'reviews',
          schedule: 'monthly',
          format: 'json',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    test('should get dashboard data', async () => {
      const response = await request(app)
        .get('/api/reviews-ugc-engine/analytics/dashboards/dash_001');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('dashboard');
    });
  });

  // ========== Integration Tests (6 tests) ==========
  
  describe('Integration Engine', () => {
    test('should list integrations', async () => {
      const response = await request(app)
        .get('/api/reviews-ugc-engine/integrations');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('integrations');
      expect(Array.isArray(response.body.integrations)).toBe(true);
    });

    test('should connect integration', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/integrations/shopify/connect')
        .send({
          apiKey: 'test_key',
          shopDomain: 'test-shop.myshopify.com',
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('connected');
    });

    test('should import reviews from integration', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/integrations/import-reviews')
        .send({
          integrationId: 'yotpo',
          source: 'yotpo_api',
          filters: { startDate: '2024-01-01' },
        });

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('jobId');
      expect(response.body.status).toBe('processing');
    });

    test('should create webhook', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/integrations/webhooks')
        .send({
          url: 'https://example.com/webhook',
          events: ['review.created', 'review.approved'],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('active');
    });

    test('should trigger webhook', async () => {
      const response = await request(app)
        .post('/api/reviews-ugc-engine/integrations/webhooks/webhook_001/trigger')
        .send({
          type: 'review.created',
          data: { reviewId: 'review_001' },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });

    test('should get integration statistics', async () => {
      const response = await request(app)
        .get('/api/reviews-ugc-engine/integrations/statistics');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('integrations');
      expect(response.body).toHaveProperty('webhooks');
    });
  });

  // ========== System Tests (2 tests) ==========
  
  describe('System Endpoints', () => {
    test('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/reviews-ugc-engine/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.services).toHaveProperty('reviewManagement', 'operational');
      expect(response.body.services).toHaveProperty('ugcCollection', 'operational');
      expect(response.body.services).toHaveProperty('moderation', 'operational');
      expect(response.body.services).toHaveProperty('sentiment', 'operational');
      expect(response.body.services).toHaveProperty('socialProof', 'operational');
      expect(response.body.services).toHaveProperty('display', 'operational');
      expect(response.body.services).toHaveProperty('analytics', 'operational');
      expect(response.body.services).toHaveProperty('integrations', 'operational');
    });

    test('should return aggregated system statistics', async () => {
      const response = await request(app)
        .get('/api/reviews-ugc-engine/statistics');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('reviews');
      expect(response.body).toHaveProperty('collection');
      expect(response.body).toHaveProperty('moderation');
      expect(response.body).toHaveProperty('sentiment');
      expect(response.body).toHaveProperty('socialProof');
      expect(response.body).toHaveProperty('display');
      expect(response.body).toHaveProperty('analytics');
      expect(response.body).toHaveProperty('integrations');
    });
  });

  // ========== E2E Workflow Test (1 test) ==========
  
  describe('End-to-End Review Lifecycle', () => {
    test('should complete full review lifecycle', async () => {
      // 1. Create review
      const createResponse = await request(app)
        .post('/api/reviews-ugc-engine/reviews')
        .send({
          productId: 'prod_e2e',
          customerId: 'cust_e2e',
          rating: 5,
          content: 'Amazing product! Highly recommended.',
          verified: true,
        });
      expect(createResponse.status).toBe(201);
      const reviewId = createResponse.body.id;

      // 2. Analyze sentiment
      const sentimentResponse = await request(app)
        .post('/api/reviews-ugc-engine/sentiment/analyze')
        .send({
          reviewId,
          content: createResponse.body.content,
          rating: createResponse.body.rating,
        });
      expect(sentimentResponse.status).toBe(201);
      expect(sentimentResponse.body.sentiment).toBe('positive');

      // 3. Moderate with auto-rules
      const moderateResponse = await request(app)
        .post('/api/reviews-ugc-engine/moderation/moderate')
        .send({
          content: createResponse.body.content,
          rating: createResponse.body.rating,
        });
      expect(moderateResponse.status).toBe(200);
      expect(moderateResponse.body.score).toBeGreaterThan(50);

      // 4. Approve review
      const approveResponse = await request(app)
        .post(`/api/reviews-ugc-engine/reviews/${reviewId}/moderate`)
        .send({ status: 'approved', moderatorId: 'auto_mod' });
      expect(approveResponse.status).toBe(200);

      // 5. Display on widget (create widget and track view)
      const widgetResponse = await request(app)
        .post('/api/reviews-ugc-engine/widgets')
        .send({
          name: 'E2E Widget',
          type: 'standard',
          productId: 'prod_e2e',
        });
      expect(widgetResponse.status).toBe(201);
      const widgetId = widgetResponse.body.id;

      // 6. Track analytics
      const analyticsResponse = await request(app)
        .post(`/api/reviews-ugc-engine/widgets/${widgetId}/analytics`)
        .send({ eventType: 'view' });
      expect(analyticsResponse.status).toBe(200);

      // 7. Generate insights
      const insightsResponse = await request(app)
        .post('/api/reviews-ugc-engine/sentiment/insights')
        .send({
          productId: 'prod_e2e',
          reviews: [{ content: createResponse.body.content, rating: 5 }],
        });
      expect(insightsResponse.status).toBe(200);
      expect(insightsResponse.body).toHaveProperty('recommendations');

      // 8. Export to Google Shopping
      const exportResponse = await request(app)
        .post('/api/reviews-ugc-engine/integrations/google-shopping/submit')
        .send({
          reviewIds: [reviewId],
          productMappings: { [reviewId]: 'gtin_12345' },
        });
      expect(exportResponse.status).toBe(200);
      expect(exportResponse.body.success).toBe(true);
    });
  });
});
