/**
 * UPSELL & CROSS-SELL ENGINE - COMPREHENSIVE TEST SUITE
 * Tests for all 8 engine modules, router, and integration
 */

const request = require('supertest');
const express = require('express');
const router = require('./comprehensive-router');

const recommendationEngine = require('./recommendation-core-engine');
const bundleEngine = require('./bundle-optimization-engine');
const customerEngine = require('./customer-targeting-engine');
const cartEngine = require('./cart-checkout-optimization-engine');
const analyticsEngine = require('./analytics-performance-engine');
const abTestingEngine = require('./ab-testing-optimization-engine');
const integrationEngine = require('./integration-settings-engine');
const advancedEngine = require('./advanced-features-engine');

const app = express();
app.use(express.json());
app.use('/api/upsell', router);

describe('Upsell & Cross-Sell Engine - Complete Test Suite', () => {
  
  //================================================================
  // RECOMMENDATION ENGINE TESTS
  //================================================================
  
  describe('Recommendation Engine', () => {
    test('should generate recommendations', async () => {
      const response = await request(app)
        .post('/api/upsell/recommendations/generate')
        .send({ userId: 'user123', productId: 'prod456', strategy: 'collaborative' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.recommendations).toBeDefined();
    });
    
    test('should track recommendation click', async () => {
      const response = await request(app)
        .post('/api/upsell/recommendations/track/click')
        .send({ userId: 'user123', productId: 'prod456', recommendationId: 'rec789' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should get trending products', async () => {
      const response = await request(app)
        .get('/api/upsell/recommendations/trending?timeWindow=7d&limit=10');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
  
  //================================================================
  // BUNDLE ENGINE TESTS
  //================================================================
  
  describe('Bundle Engine', () => {
    test('should create bundle', async () => {
      const response = await request(app)
        .post('/api/upsell/bundles')
        .send({
          name: 'Test Bundle',
          products: ['prod1', 'prod2', 'prod3'],
          pricingStrategy: 'percentage_off',
          discount: 20
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.bundle).toBeDefined();
    });
    
    test('should calculate bundle pricing', async () => {
      const response = await request(app)
        .post('/api/upsell/bundles/pricing/calculate')
        .send({
          products: [{ id: 'p1', price: 100 }, { id: 'p2', price: 150 }],
          strategy: 'fixed'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should track bundle performance', async () => {
      const response = await request(app)
        .post('/api/upsell/bundles/bundle123/track/view');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
  
  //================================================================
  // CUSTOMER TARGETING TESTS
  //================================================================
  
  describe('Customer Targeting Engine', () => {
    test('should create customer segment', async () => {
      const response = await request(app)
        .post('/api/upsell/segments')
        .send({
          name: 'High Value VIPs',
          type: 'dynamic',
          rules: [{ field: 'totalSpent', operator: 'greater_than', value: 1000 }]
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should calculate RFM score', async () => {
      const response = await request(app)
        .post('/api/upsell/customers/cust123/rfm');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.rfm).toBeDefined();
    });
    
    test('should calculate propensity score', async () => {
      const response = await request(app)
        .post('/api/upsell/customers/cust123/propensity')
        .send({ action: 'upsell' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
  
  //================================================================
  // CART ENGINE TESTS
  //================================================================
  
  describe('Cart & Checkout Engine', () => {
    test('should create cart', async () => {
      const response = await request(app)
        .post('/api/upsell/carts')
        .send({ customerId: 'cust123', sessionId: 'session456' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.cart).toBeDefined();
    });
    
    test('should add item to cart', async () => {
      const response = await request(app)
        .post('/api/upsell/carts/cart123/items')
        .send({ productId: 'prod456', quantity: 2, price: 99.99 });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should mark cart as abandoned', async () => {
      const response = await request(app)
        .post('/api/upsell/carts/cart123/abandon');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should get abandoned carts', async () => {
      const response = await request(app)
        .get('/api/upsell/carts/abandoned?limit=50');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
  
  //================================================================
  // ANALYTICS ENGINE TESTS
  //================================================================
  
  describe('Analytics & Performance Engine', () => {
    test('should track metric', async () => {
      const response = await request(app)
        .post('/api/upsell/analytics/metrics')
        .send({
          category: 'recommendation',
          name: 'click',
          value: 1,
          metadata: { productId: 'prod123' }
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should generate report', async () => {
      const response = await request(app)
        .post('/api/upsell/analytics/reports')
        .send({ type: 'recommendation_performance', period: '30d' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.report).toBeDefined();
    });
    
    test('should create dashboard', async () => {
      const response = await request(app)
        .post('/api/upsell/analytics/dashboards')
        .send({
          name: 'Sales Dashboard',
          widgets: [
            { type: 'metric', config: { category: 'recommendation', name: 'conversion' } }
          ]
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
  
  //================================================================
  // AB TESTING ENGINE TESTS
  //================================================================
  
  describe('AB Testing Engine', () => {
    test('should create experiment', async () => {
      const response = await request(app)
        .post('/api/upsell/experiments')
        .send({
          name: 'Price Test',
          type: 'ab_test',
          variants: [
            { name: 'Control', config: { price: 99.99 } },
            { name: 'Test', config: { price: 89.99 } }
          ]
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should start experiment', async () => {
      const response = await request(app)
        .post('/api/upsell/experiments/exp123/start');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should assign variant', async () => {
      const response = await request(app)
        .post('/api/upsell/experiments/exp123/assign')
        .send({ userId: 'user123' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
  
  //================================================================
  // INTEGRATION ENGINE TESTS
  //================================================================
  
  describe('Integration Engine', () => {
    test('should create integration', async () => {
      const response = await request(app)
        .post('/api/upsell/integrations')
        .send({
          platform: 'shopify',
          credentials: { shopDomain: 'test.myshopify.com', accessToken: 'token123' }
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should test integration connection', async () => {
      const response = await request(app)
        .post('/api/upsell/integrations/int123/test');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should create webhook', async () => {
      const response = await request(app)
        .post('/api/upsell/webhooks')
        .send({
          event: 'order.created',
          url: 'https://example.com/hook',
          integrationId: 'int123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should create API key', async () => {
      const response = await request(app)
        .post('/api/upsell/api-keys')
        .send({ name: 'Production API', permissions: ['read:products', 'write:orders'] });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
  
  //================================================================
  // ADVANCED ENGINE TESTS
  //================================================================
  
  describe('Advanced Features Engine', () => {
    test('should create version', async () => {
      const response = await request(app)
        .post('/api/upsell/versions')
        .send({
          entityType: 'bundle',
          entityId: 'bundle123',
          data: { name: 'Bundle v2' },
          createdBy: 'admin@store.com'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should create template', async () => {
      const response = await request(app)
        .post('/api/upsell/templates')
        .send({
          type: 'bundle',
          name: 'Frequently Bought Together',
          config: { strategy: 'fbt' },
          category: 'bundles'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should check compliance', async () => {
      const response = await request(app)
        .post('/api/upsell/compliance/check')
        .send({ entityType: 'customer', entityData: { email: 'test@example.com' } });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('should create backup', async () => {
      const response = await request(app)
        .post('/api/upsell/backups')
        .send({
          name: 'Full Backup',
          entities: ['recommendations', 'bundles', 'segments'],
          createdBy: 'admin@store.com'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
  
  //================================================================
  // INTEGRATION TESTS
  //================================================================
  
  describe('End-to-End Integration', () => {
    test('should handle complete recommendation flow', async () => {
      // 1. Generate recommendations
      const recResponse = await request(app)
        .post('/api/upsell/recommendations/generate')
        .send({ userId: 'user123', strategy: 'hybrid' });
      
      expect(recResponse.body.success).toBe(true);
      
      // 2. Track click
      const clickResponse = await request(app)
        .post('/api/upsell/recommendations/track/click')
        .send({ userId: 'user123', productId: 'prod456', recommendationId: 'rec789' });
      
      expect(clickResponse.body.success).toBe(true);
      
      // 3. Track conversion
      const convResponse = await request(app)
        .post('/api/upsell/recommendations/track/conversion')
        .send({ userId: 'user123', productId: 'prod456', recommendationId: 'rec789', revenue: 99.99 });
      
      expect(convResponse.body.success).toBe(true);
    });
    
    test('should handle cart abandonment recovery flow', async () => {
      // 1. Create cart
      const cartResponse = await request(app)
        .post('/api/upsell/carts')
        .send({ customerId: 'cust123', sessionId: 'session456' });
      
      const cartId = cartResponse.body.cart?.id;
      
      // 2. Add items
      await request(app)
        .post(`/api/upsell/carts/${cartId}/items`)
        .send({ productId: 'prod1', quantity: 2, price: 50 });
      
      // 3. Mark as abandoned
      const abandonResponse = await request(app)
        .post(`/api/upsell/carts/${cartId}/abandon`);
      
      expect(abandonResponse.body.success).toBe(true);
      
      // 4. Execute recovery step
      const recoveryResponse = await request(app)
        .post(`/api/upsell/carts/${cartId}/recovery/0`);
      
      expect(recoveryResponse.body.success).toBe(true);
    });
  });
  
  //================================================================
  // HEALTH & STATUS TESTS
  //================================================================
  
  describe('System Health', () => {
    test('should return health status', async () => {
      const response = await request(app).get('/api/upsell/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.modules).toBeDefined();
    });
    
    test('should return system stats', async () => {
      const response = await request(app).get('/api/upsell/stats');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('recommendations');
      expect(response.body).toHaveProperty('bundles');
      expect(response.body).toHaveProperty('customers');
    });
  });
});
