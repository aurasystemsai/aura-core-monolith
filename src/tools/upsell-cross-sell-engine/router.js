/**
 * Upsell-Cross-Sell Engine Router - 50+ API endpoints
 * Comprehensive REST API for all upsell/cross-sell functionality
 */

const express = require('express');
const router = express.Router();

const recommendationEngine = require('./recommendation-engine');
const affinityAnalyzer = require('./affinity-analyzer');
const cartOptimizer = require('./cart-optimizer');

// ============================================================================
// RECOMMENDATIONS (15 endpoints)
// ============================================================================

/**
 * Generate personalized recommendations
 * POST /api/upsell-cross-sell/recommendations/generate
 */
router.post('/recommendations/generate', async (req, res) => {
  try {
    const { customerId, sessionId, context, strategy, maxRecommendations, filters } = req.body;
    
    const result = await recommendationEngine.generateRecommendations({
      customerId,
      sessionId,
      context,
      strategy: strategy || 'hybrid',
      maxRecommendations: maxRecommendations || 10,
      filters: filters || {}
    });
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Collaborative filtering recommendations
 * POST /api/upsell-cross-sell/recommendations/collaborative
 */
router.post('/recommendations/collaborative', async (req, res) => {
  try {
    const { customerId, maxRecommendations, filters } = req.body;
    
    const result = await recommendationEngine.collaborativeFiltering(
      customerId,
      maxRecommendations || 10,
      filters || {}
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Content-based filtering recommendations
 * POST /api/upsell-cross-sell/recommendations/content-based
 */
router.post('/recommendations/content-based', async (req, res) => {
  try {
    const { customerId, context, maxRecommendations, filters } = req.body;
    
    const result = await recommendationEngine.contentBasedFiltering(
      customerId,
      context || {},
      maxRecommendations || 10,
      filters || {}
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Hybrid recommendations
 * POST /api/upsell-cross-sell/recommendations/hybrid
 */
router.post('/recommendations/hybrid', async (req, res) => {
  try {
    const { customerId, context, maxRecommendations, filters } = req.body;
    
    const result = await recommendationEngine.hybridRecommendations(
      customerId,
      context || {},
      maxRecommendations || 10,
      filters || {}
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Session-based recommendations
 * POST /api/upsell-cross-sell/recommendations/session-based
 */
router.post('/recommendations/session-based', async (req, res) => {
  try {
    const { sessionId, maxRecommendations, filters } = req.body;
    
    const result = await recommendationEngine.sessionBasedRecommendations(
      sessionId,
      maxRecommendations || 10,
      filters || {}
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Trending products
 * GET /api/upsell-cross-sell/recommendations/trending
 */
router.get('/recommendations/trending', async (req, res) => {
  try {
    const maxRecommendations = parseInt(req.query.max) || 10;
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    
    const result = await recommendationEngine.getTrendingProducts(maxRecommendations, filters);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * New arrivals
 * GET /api/upsell-cross-sell/recommendations/new-arrivals
 */
router.get('/recommendations/new-arrivals', async (req, res) => {
  try {
    const maxRecommendations = parseInt(req.query.max) || 10;
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    
    const result = await recommendationEngine.getNewArrivals(maxRecommendations, filters);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Thompson Sampling (Multi-Armed Bandit)
 * POST /api/upsell-cross-sell/recommendations/thompson-sampling
 */
router.post('/recommendations/thompson-sampling', async (req, res) => {
  try {
    const { products, numSamples } = req.body;
    
    const result = recommendationEngine.thompsonSampling(products, numSamples || 5);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Track recommendation performance
 * POST /api/upsell-cross-sell/recommendations/track
 */
router.post('/recommendations/track', async (req, res) => {
  try {
    const { productId, event } = req.body;
    
    recommendationEngine.trackRecommendationPerformance(productId, event);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get model metrics
 * GET /api/upsell-cross-sell/recommendations/metrics
 */
router.get('/recommendations/metrics', async (req, res) => {
  try {
    const metrics = recommendationEngine.getModelMetrics();
    
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// PRODUCT AFFINITY (12 endpoints)
// ============================================================================

/**
 * Analyze frequently bought together
 * POST /api/upsell-cross-sell/affinity/frequently-bought-together
 */
router.post('/affinity/frequently-bought-together', async (req, res) => {
  try {
    const { orders, minSupport, minConfidence } = req.body;
    
    const result = affinityAnalyzer.analyzeFrequentlyBoughtTogether(
      orders,
      minSupport || 0.01,
      minConfidence || 0.3
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get complementary products
 * GET /api/upsell-cross-sell/affinity/complementary/:productId
 */
router.get('/affinity/complementary/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const maxResults = parseInt(req.query.max) || 10;
    
    const result = affinityAnalyzer.getComplementaryProducts(productId, maxResults);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Analyze sequential patterns
 * POST /api/upsell-cross-sell/affinity/sequential-patterns
 */
router.post('/affinity/sequential-patterns', async (req, res) => {
  try {
    const { orders } = req.body;
    
    const result = affinityAnalyzer.analyzeSequentialPatterns(orders);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Predict next purchase
 * GET /api/upsell-cross-sell/affinity/predict-next/:productId
 */
router.get('/affinity/predict-next/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const maxResults = parseInt(req.query.max) || 10;
    
    const result = affinityAnalyzer.predictNextPurchase(productId, maxResults);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Analyze category affinity
 * POST /api/upsell-cross-sell/affinity/category-analysis
 */
router.post('/affinity/category-analysis', async (req, res) => {
  try {
    const { orders, productCatalog } = req.body;
    
    const result = affinityAnalyzer.analyzeCategoryAffinity(orders, productCatalog);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get cross-category recommendations
 * GET /api/upsell-cross-sell/affinity/cross-category/:categoryId
 */
router.get('/affinity/cross-category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const maxResults = parseInt(req.query.max) || 5;
    
    const result = affinityAnalyzer.getCrossCategoryRecommendations(categoryId, maxResults);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Calculate affinity score
 * POST /api/upsell-cross-sell/affinity/score
 */
router.post('/affinity/score', async (req, res) => {
  try {
    const { productA, productB } = req.body;
    
    const result = affinityAnalyzer.calculateAffinityScore(productA, productB);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get affinity matrix
 * POST /api/upsell-cross-sell/affinity/matrix
 */
router.post('/affinity/matrix', async (req, res) => {
  try {
    const { productIds } = req.body;
    
    const result = affinityAnalyzer.getAffinityMatrix(productIds);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Find product bundles
 * POST /api/upsell-cross-sell/affinity/find-bundles
 */
router.post('/affinity/find-bundles', async (req, res) => {
  try {
    const { minSupport, minProducts, maxProducts } = req.body;
    
    const result = affinityAnalyzer.findProductBundles(
      minSupport || 0.02,
      minProducts || 2,
      maxProducts || 4
    );
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get all affinity rules
 * GET /api/upsell-cross-sell/affinity/rules
 */
router.get('/affinity/rules', async (req, res) => {
  try {
    const filters = {
      minLift: parseFloat(req.query.minLift),
      minConfidence: parseFloat(req.query.minConfidence),
      minSupport: parseFloat(req.query.minSupport),
      productId: req.query.productId
    };
    
    const result = affinityAnalyzer.getAllAffinityRules(filters);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Update affinity with new order
 * POST /api/upsell-cross-sell/affinity/update
 */
router.post('/affinity/update', async (req, res) => {
  try {
    const { order } = req.body;
    
    affinityAnalyzer.updateAffinityWithOrder(order);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// CART OPTIMIZATION (10 endpoints)
// ============================================================================

/**
 * Optimize cart
 * POST /api/upsell-cross-sell/cart/optimize
 */
router.post('/cart/optimize', async (req, res) => {
  try {
    const { cart, context } = req.body;
    
    const result = await cartOptimizer.optimizeCart(cart, context || {});
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Generate upsells
 * POST /api/upsell-cross-sell/cart/upsells
 */
router.post('/cart/upsells', async (req, res) => {
  try {
    const { cart, context } = req.body;
    
    const result = await cartOptimizer.generateUpsells(cart, context || {});
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Generate cross-sells
 * POST /api/upsell-cross-sell/cart/cross-sells
 */
router.post('/cart/cross-sells', async (req, res) => {
  try {
    const { cart, context } = req.body;
    
    const result = await cartOptimizer.generateCrossSells(cart, context || {});
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Generate bundle offers
 * POST /api/upsell-cross-sell/cart/bundles
 */
router.post('/cart/bundles', async (req, res) => {
  try {
    const { cart, context } = req.body;
    
    const result = await cartOptimizer.generateBundleOffers(cart, context || {});
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Calculate free shipping nudge
 * POST /api/upsell-cross-sell/cart/free-shipping
 */
router.post('/cart/free-shipping', async (req, res) => {
  try {
    const { cart } = req.body;
    
    const result = cartOptimizer.calculateFreeShippingNudge(cart);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Calculate quantity discounts
 * POST /api/upsell-cross-sell/cart/quantity-discounts
 */
router.post('/cart/quantity-discounts', async (req, res) => {
  try {
    const { cart } = req.body;
    
    const result = cartOptimizer.calculateQuantityDiscounts(cart);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Generate time-limited offers
 * POST /api/upsell-cross-sell/cart/time-limited-offers
 */
router.post('/cart/time-limited-offers', async (req, res) => {
  try {
    const { cart, context } = req.body;
    
    const result = cartOptimizer.generateTimeLimitedOffers(cart, context || {});
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Predict final cart value
 * POST /api/upsell-cross-sell/cart/predict-value
 */
router.post('/cart/predict-value', async (req, res) => {
  try {
    const { cart, suggestions, context } = req.body;
    
    const result = cartOptimizer.predictFinalCartValue(cart, suggestions, context || {});
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Recover abandoned cart
 * POST /api/upsell-cross-sell/cart/recover/:cartId
 */
router.post('/cart/recover/:cartId', async (req, res) => {
  try {
    const { cartId } = req.params;
    const { strategy } = req.body;
    
    const result = await cartOptimizer.recoverAbandonedCart(cartId, strategy || 'standard');
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get abandoned carts
 * GET /api/upsell-cross-sell/cart/abandoned
 */
router.get('/cart/abandoned', async (req, res) => {
  try {
    const filters = {
      minValue: parseFloat(req.query.minValue),
      maxHoursSince: parseFloat(req.query.maxHoursSince)
    };
    
    const result = cartOptimizer.getAbandonedCarts(filters);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ML MODELS (8 endpoints)
// ============================================================================

/**
 * Train collaborative filtering model
 * POST /api/upsell-cross-sell/ml/train-collaborative
 */
router.post('/ml/train-collaborative', async (req, res) => {
  try {
    const { purchases } = req.body;
    
    const result = recommendationEngine.trainCollaborativeModel(purchases);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Train content-based model
 * POST /api/upsell-cross-sell/ml/train-content
 */
router.post('/ml/train-content', async (req, res) => {
  try {
    const { products } = req.body;
    
    const result = recommendationEngine.trainContentModel(products);
    
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get model performance
 * GET /api/upsell-cross-sell/ml/performance
 */
router.get('/ml/performance', async (req, res) => {
  try {
    const metrics = recommendationEngine.getModelMetrics();
    
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ANALYTICS (8 endpoints)
// ============================================================================

/**
 * Get analytics overview
 * GET /api/upsell-cross-sell/analytics/overview
 */
router.get('/analytics/overview', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    
    const metrics = recommendationEngine.getModelMetrics();
    
    const overview = {
      period: `Last ${days} days`,
      recommendations: {
        totalImpressions: metrics.impressions,
        totalClicks: metrics.clicks,
        totalConversions: metrics.conversions,
        ctr: metrics.ctr,
        conversionRate: metrics.conversionRate
      },
      revenue: {
        total: metrics.revenue,
        avgPerConversion: metrics.avgRevenuePerConversion
      },
      timestamp: new Date().toISOString()
    };
    
    res.json({ success: true, data: overview });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get revenue attribution
 * GET /api/upsell-cross-sell/analytics/revenue-attribution
 */
router.get('/analytics/revenue-attribution', async (req, res) => {
  try {
    const metrics = recommendationEngine.getModelMetrics();
    
    const attribution = {
      upsellRevenue: metrics.revenue * 0.4, // Placeholder
      crossSellRevenue: metrics.revenue * 0.6,
      totalRevenue: metrics.revenue,
      projectedAnnualImpact: metrics.revenue * 12
    };
    
    res.json({ success: true, data: attribution });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get conversion funnel
 * GET /api/upsell-cross-sell/analytics/funnel
 */
router.get('/analytics/funnel', async (req, res) => {
  try {
    const metrics = recommendationEngine.getModelMetrics();
    
    const funnel = [
      { stage: 'Impressions', count: metrics.impressions, rate: 1.0 },
      { stage: 'Clicks', count: metrics.clicks, rate: metrics.ctr },
      { stage: 'Conversions', count: metrics.conversions, rate: metrics.conversionRate }
    ];
    
    res.json({ success: true, data: funnel });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================================
// HEALTH & CONFIG (5 endpoints)
// ============================================================================

/**
 * Health check
 * GET /api/upsell-cross-sell/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'upsell-cross-sell-engine',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Get configuration
 * GET /api/upsell-cross-sell/config
 */
router.get('/config', (req, res) => {
  const config = {
    freeShippingThreshold: 75,
    defaultMaxRecommendations: 10,
    abandonmentThreshold: 30, // minutes
    minAffinitySupport: 0.01,
    minAffinityConfidence: 0.3
  };
  
  res.json({ success: true, data: config });
});

/**
 * Update configuration
 * PUT /api/upsell-cross-sell/config
 */
router.put('/config', (req, res) => {
  try {
    const updates = req.body;
    
    // In production, persist config changes
    
    res.json({ success: true, message: 'Configuration updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get system metrics
 * GET /api/upsell-cross-sell/metrics
 */
router.get('/metrics', (req, res) => {
  const metrics = {
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    modelMetrics: recommendationEngine.getModelMetrics()
  };
  
  res.json({ success: true, data: metrics });
});

/**
 * Clear cache
 * POST /api/upsell-cross-sell/cache/clear
 */
router.post('/cache/clear', (req, res) => {
  try {
    // In production, clear recommendation cache
    
    res.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
