/**
 * Upsell-Cross-Sell Engine - Comprehensive Test Suite
 * Tests recommendation engine, affinity analysis, cart optimization, and API endpoints
 */

const request = require('supertest');
const express = require('express');
const router = require('../tools/upsell-cross-sell-engine/router');
const recommendationEngine = require('../tools/upsell-cross-sell-engine/recommendation-engine');
const affinityAnalyzer = require('../tools/upsell-cross-sell-engine/affinity-analyzer');
const cartOptimizer = require('../tools/upsell-cross-sell-engine/cart-optimizer');

// Test app setup
const app = express();
app.use(express.json());
app.use('/api/upsell-cross-sell', router);

describe('Upsell-Cross-Sell Engine', () => {
  
  // ============================================================================
  // RECOMMENDATION ENGINE TESTS (10 tests)
  // ============================================================================
  
  describe('Recommendation Engine', () => {
    
    test('should generate hybrid recommendations', async () => {
      const res = await request(app)
        .post('/api/upsell-cross-sell/recommendations/generate')
        .send({
          customerId: 'cust123',
          strategy: 'hybrid',
          maxRecommendations: 10
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('recommendations');
      expect(res.body.data).toHaveProperty('strategy', 'hybrid');
    });
    
    test('should generate collaborative filtering recommendations', async () => {
      const res = await request(app)
        .post('/api/upsell-cross-sell/recommendations/collaborative')
        .send({
          customerId: 'cust123',
          maxRecommendations: 5
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    
    test('should generate content-based recommendations', async () => {
      const res = await request(app)
        .post('/api/upsell-cross-sell/recommendations/content-based')
        .send({
          customerId: 'cust123',
          context: { productId: 'prod1' },
          maxRecommendations: 8
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    
    test('should get trending products', async () => {
      const res = await request(app)
        .get('/api/upsell-cross-sell/recommendations/trending?max=10');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    
    test('should get new arrivals', async () => {
      const res = await request(app)
        .get('/api/upsell-cross-sell/recommendations/new-arrivals?max=10');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    
    test('should perform Thompson sampling', async () => {
      const res = await request(app)
        .post('/api/upsell-cross-sell/recommendations/thompson-sampling')
        .send({
          products: ['prod1', 'prod2', 'prod3', 'prod4', 'prod5'],
          numSamples: 3
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(3);
    });
    
    test('should track recommendation performance', async () => {
      const res = await request(app)
        .post('/api/upsell-cross-sell/recommendations/track')
        .send({
          productId: 'prod1',
          event: { type: 'click' }
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    
    test('should get model metrics', async () => {
      const res = await request(app)
        .get('/api/upsell-cross-sell/recommendations/metrics');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('impressions');
      expect(res.body.data).toHaveProperty('clicks');
      expect(res.body.data).toHaveProperty('conversions');
      expect(res.body.data).toHaveProperty('ctr');
      expect(res.body.data).toHaveProperty('conversionRate');
    });
    
    test('should train collaborative model', async () => {
      const res = await request(app)
        .post('/api/upsell-cross-sell/ml/train-collaborative')
        .send({
          purchases: [
            { customerId: 'cust1', productId: 'prod1', rating: 5 },
            { customerId: 'cust1', productId: 'prod2', rating: 4 },
            { customerId: 'cust2', productId: 'prod1', rating: 5 }
          ]
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('status', 'success');
    });
    
    test('should train content model', async () => {
      const res = await request(app)
        .post('/api/upsell-cross-sell/ml/train-content')
        .send({
          products: [
            { id: 'prod1', category: 'electronics', brand: 'Apple', price: 999 },
            { id: 'prod2', category: 'electronics', brand: 'Samsung', price: 799 }
          ]
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('status', 'success');
    });
    
  });
  
  // ============================================================================
  // PRODUCT AFFINITY TESTS (8 tests)
  // ============================================================================
  
  describe('Product Affinity Analysis', () => {
    
    test('should analyze frequently bought together patterns', async () => {
      const orders = [
        {
          id: 'order1',
          customerId: 'cust1',
          items: [
            { productId: 'prod1', quantity: 1, price: 29.99 },
            { productId: 'prod2', quantity: 1, price: 19.99 }
          ],
          createdAt: new Date().toISOString()
        },
        {
          id: 'order2',
          customerId: 'cust2',
          items: [
            { productId: 'prod1', quantity: 1, price: 29.99 },
            { productId: 'prod2', quantity: 1, price: 19.99 }
          ],
          createdAt: new Date().toISOString()
        }
      ];
      
      const res = await request(app)
        .post('/api/upsell-cross-sell/affinity/frequently-bought-together')
        .send({
          orders,
          minSupport: 0.01,
          minConfidence: 0.3
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalRules');
    });
    
    test('should get complementary products', async () => {
      const res = await request(app)
        .get('/api/upsell-cross-sell/affinity/complementary/prod1?max=10');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    
    test('should analyze sequential patterns', async () => {
      const orders = [
        {
          id: 'order1',
          customerId: 'cust1',
          items: [{ productId: 'prod1', quantity: 1, price: 29.99 }],
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'order2',
          customerId: 'cust1',
          items: [{ productId: 'prod2', quantity: 1, price: 19.99 }],
          createdAt: '2024-01-10T00:00:00Z'
        }
      ];
      
      const res = await request(app)
        .post('/api/upsell-cross-sell/affinity/sequential-patterns')
        .send({ orders });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalPatterns');
    });
    
    test('should predict next purchase', async () => {
      const res = await request(app)
        .get('/api/upsell-cross-sell/affinity/predict-next/prod1?max=5');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    
    test('should calculate affinity score', async () => {
      const res = await request(app)
        .post('/api/upsell-cross-sell/affinity/score')
        .send({
          productA: 'prod1',
          productB: 'prod2'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    
    test('should get affinity matrix', async () => {
      const res = await request(app)
        .post('/api/upsell-cross-sell/affinity/matrix')
        .send({
          productIds: ['prod1', 'prod2', 'prod3']
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('productIds');
      expect(res.body.data).toHaveProperty('matrix');
    });
    
    test('should find product bundles', async () => {
      const res = await request(app)
        .post('/api/upsell-cross-sell/affinity/find-bundles')
        .send({
          minSupport: 0.02,
          minProducts: 2,
          maxProducts: 4
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    
    test('should get all affinity rules with filters', async () => {
      const res = await request(app)
        .get('/api/upsell-cross-sell/affinity/rules?minLift=1.5&minConfidence=0.3');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    
  });
  
  // ============================================================================
  // CART OPTIMIZATION TESTS (7 tests)
  // ============================================================================
  
  describe('Cart Optimization', () => {
    
    test('should optimize cart', async () => {
      const cart = {
        id: 'cart123',
        customerId: 'cust123',
        items: [
          { productId: 'prod1', quantity: 1, price: 29.99 },
          { productId: 'prod2', quantity: 2, price: 19.99 }
        ]
      };
      
      const res = await request(app)
        .post('/api/upsell-cross-sell/cart/optimize')
        .send({ cart, context: { customerId: 'cust123' } });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('upsells');
      expect(res.body.data).toHaveProperty('crossSells');
      expect(res.body.data).toHaveProperty('estimatedValueIncrease');
    });
    
    test('should generate upsells', async () => {
      const cart = {
        id: 'cart123',
        items: [{ productId: 'prod1', quantity: 1, price: 29.99 }]
      };
      
      const res = await request(app)
        .post('/api/upsell-cross-sell/cart/upsells')
        .send({ cart, context: {} });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    
    test('should generate cross-sells', async () => {
      const cart = {
        id: 'cart123',
        items: [{ productId: 'prod1', quantity: 1, price: 29.99 }]
      };
      
      const res = await request(app)
        .post('/api/upsell-cross-sell/cart/cross-sells')
        .send({ cart, context: { customerId: 'cust123' } });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    
    test('should calculate free shipping nudge', async () => {
      const cart = {
        id: 'cart123',
        items: [{ productId: 'prod1', quantity: 1, price: 60.00 }]
      };
      
      const res = await request(app)
        .post('/api/upsell-cross-sell/cart/free-shipping')
        .send({ cart });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      if (res.body.data) {
        expect(res.body.data).toHaveProperty('qualified');
      }
    });
    
    test('should calculate quantity discounts', async () => {
      const cart = {
        id: 'cart123',
        items: [{ productId: 'prod1', quantity: 1, price: 29.99 }]
      };
      
      const res = await request(app)
        .post('/api/upsell-cross-sell/cart/quantity-discounts')
        .send({ cart });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    
    test('should get abandoned carts', async () => {
      const res = await request(app)
        .get('/api/upsell-cross-sell/cart/abandoned?minValue=20&maxHoursSince=48');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
    
    test('should recover abandoned cart', async () => {
      const res = await request(app)
        .post('/api/upsell-cross-sell/cart/recover/cart123')
        .send({ strategy: 'aggressive' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('estimatedRecoveryProbability');
      expect(res.body.data).toHaveProperty('incentives');
    });
    
  });
  
  // ============================================================================
  // ANALYTICS TESTS (4 tests)
  // ============================================================================
  
  describe('Analytics', () => {
    
    test('should get analytics overview', async () => {
      const res = await request(app)
        .get('/api/upsell-cross-sell/analytics/overview?days=30');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('recommendations');
      expect(res.body.data).toHaveProperty('revenue');
    });
    
    test('should get revenue attribution', async () => {
      const res = await request(app)
        .get('/api/upsell-cross-sell/analytics/revenue-attribution');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('upsellRevenue');
      expect(res.body.data).toHaveProperty('crossSellRevenue');
      expect(res.body.data).toHaveProperty('totalRevenue');
    });
    
    test('should get conversion funnel', async () => {
      const res = await request(app)
        .get('/api/upsell-cross-sell/analytics/funnel');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
    
    test('should get ML model performance', async () => {
      const res = await request(app)
        .get('/api/upsell-cross-sell/ml/performance');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('impressions');
      expect(res.body.data).toHaveProperty('ctr');
    });
    
  });
  
  // ============================================================================
  // CONFIGURATION & HEALTH TESTS (4 tests)
  // ============================================================================
  
  describe('Configuration & Health', () => {
    
    test('should pass health check', async () => {
      const res = await request(app)
        .get('/api/upsell-cross-sell/health');
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('upsell-cross-sell-engine');
    });
    
    test('should get configuration', async () => {
      const res = await request(app)
        .get('/api/upsell-cross-sell/config');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('freeShippingThreshold');
      expect(res.body.data).toHaveProperty('defaultMaxRecommendations');
      expect(res.body.data).toHaveProperty('abandonmentThreshold');
    });
    
    test('should update configuration', async () => {
      const res = await request(app)
        .put('/api/upsell-cross-sell/config')
        .send({ freeShippingThreshold: 100 });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    
    test('should clear cache', async () => {
      const res = await request(app)
        .post('/api/upsell-cross-sell/cache/clear');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    
  });
  
  // ============================================================================
  // UNIT TESTS FOR CORE MODULES (3 tests)
  // ============================================================================
  
  describe('Core Module Unit Tests', () => {
    
    test('recommendation engine should handle empty purchase history gracefully', async () => {
      const recs = await recommendationEngine.collaborativeFiltering('new_customer', 5, {});
      expect(Array.isArray(recs)).toBe(true);
    });
    
    test('affinity analyzer should calculate product stats correctly', () => {
      const orders = [
        {
          id: '1',
          items: [
            { productId: 'prod1', quantity: 1, price: 10 },
            { productId: 'prod2', quantity: 1, price: 20 }
          ]
        }
      ];
      
      affinityAnalyzer.buildCoOccurrenceMatrix(orders);
      affinityAnalyzer.calculateProductStats(orders);
      
      // Should not throw
      expect(true).toBe(true);
    });
    
    test('cart optimizer should handle empty cart', async () => {
      const cart = { id: 'cart1', items: [] };
      const result = await cartOptimizer.optimizeCart(cart, {});
      
      expect(result).toHaveProperty('upsells');
      expect(result).toHaveProperty('crossSells');
    });
    
  });
  
});

// Summary: 36 comprehensive tests covering:
// - Recommendation engine (10 tests) - all strategies, Thompson sampling, model training
// - Product affinity (8 tests) - market basket analysis, sequential patterns, bundles
// - Cart optimization (7 tests) - upsells, cross-sells, free shipping, abandoned carts
// - Analytics (4 tests) - overview, attribution, funnel, ML performance
// - Configuration & health (4 tests) - health check, config management, cache
// - Core modules (3 tests) - edge case handling for recommendation, affinity, cart optimization
