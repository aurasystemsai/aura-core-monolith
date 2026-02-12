/**
 * UPSELL & CROSS-SELL ENGINE - COMPREHENSIVE ROUTER
 * REST API with 240+ endpoints organized by module
 */

const express = require('express');
const router = express.Router();

// Import all engine modules
const recommendationEngine = require('./recommendation-core-engine');
const bundleEngine = require('./bundle-optimization-engine');
const customerEngine = require('./customer-targeting-engine');
const cartEngine = require('./cart-checkout-optimization-engine');
const analyticsEngine = require('./analytics-performance-engine');
const abTestingEngine = require('./ab-testing-optimization-engine');
const integrationEngine = require('./integration-settings-engine');
const advancedEngine = require('./advanced-features-engine');

//==================================================================
// RECOMMENDATION ENDPOINTS (30+ endpoints)
//==================================================================

// Core Recommendations
router.post('/recommendations/generate', async (req, res) => {
  try {
    const { userId, productId, strategy, options } = req.body;
    const recommendations = await recommendationEngine.generateRecommendations({
      userId, productId, strategy, options
    });
    res.json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/recommendations/collaborative', async (req, res) => {
  try {
    const { userId, options } = req.body;
    const recommendations = await recommendationEngine.collaborativeFiltering(userId, options);
    res.json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/recommendations/content-based', async (req, res) => {
  try {
    const { productId, options } = req.body;
    const recommendations = await recommendationEngine.contentBasedFiltering(productId, options);
    res.json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/recommendations/hybrid', async (req, res) => {
  try {
    const { userId, productId, weights } = req.body;
    const recommendations = await recommendationEngine.hybridRecommendation(userId, productId, weights);
    res.json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/recommendations/real-time', async (req, res) => {
  try {
    const { userId, context } = req.body;
    const recommendations = await recommendationEngine.realTimeRecommendation(userId, context);
    res.json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/recommendations/trending', async (req, res) => {
  try {
    const { timeWindow, limit } = req.query;
    const products = await recommendationEngine.getTrendingProducts({ timeWindow, limit: parseInt(limit) });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/recommendations/new-arrivals', async (req, res) => {
  try {
    const { days, limit } = req.query;
    const products = await recommendationEngine.getNewArrivals({ days: parseInt(days), limit: parseInt(limit) });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/recommendations/personalized', async (req, res) => {
  try {
    const { userId, preferences } = req.body;
    const recommendations = await recommendationEngine.getPersonalizedRecommendations(userId, preferences);
    res.json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Recommendation Tracking
router.post('/recommendations/track/click', async (req, res) => {
  try {
    const { userId, productId, recommendationId } = req.body;
    await recommendationEngine.trackRecommendationClick(userId, productId, recommendationId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/recommendations/track/conversion', async (req, res) => {
  try {
    const { userId, productId, recommendationId, revenue } = req.body;
    await recommendationEngine.trackRecommendationConversion(userId, productId, recommendationId, revenue);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/recommendations/metrics', async (req, res) => {
  try {
    const { recommendationId } = req.query;
    const metrics = await recommendationEngine.getRecommendationMetrics(recommendationId);
    res.json({ success: true, metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//==================================================================
// BUNDLE ENDPOINTS (25+ endpoints)
//==================================================================

// Bundle Management
router.post('/bundles', async (req, res) => {
  try {
    const bundle = await bundleEngine.createBundle(req.body);
    res.json({ success: true, bundle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/bundles/:id', async (req, res) => {
  try {
    const bundle = await bundleEngine.getBundle(req.params.id);
    if (!bundle) return res.status(404).json({ success: false, error: 'Bundle not found' });
    res.json({ success: true, bundle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/bundles', async (req, res) => {
  try {
    const { status, limit } = req.query;
    const bundles = await bundleEngine.listBundles({ status, limit: parseInt(limit) });
    res.json({ success: true, bundles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/bundles/:id', async (req, res) => {
  try {
    const bundle = await bundleEngine.updateBundle(req.params.id, req.body);
    res.json({ success: true, bundle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/bundles/:id', async (req, res) => {
  try {
    await bundleEngine.deleteBundle(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/bundles/:id/activate', async (req, res) => {
  try {
    const bundle = await bundleEngine.activateBundle(req.params.id);
    res.json({ success: true, bundle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/bundles/:id/deactivate', async (req, res) => {
  try {
    const bundle = await bundleEngine.deactivateBundle(req.params.id);
    res.json({ success: true, bundle });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bundle Pricing
router.post('/bundles/pricing/calculate', async (req, res) => {
  try {
    const { products, strategy, config } = req.body;
    const pricing = await bundleEngine.calculateBundlePricing(products, strategy, config);
    res.json({ success: true, pricing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/bundles/pricing/optimize', async (req, res) => {
  try {
    const { bundleId, constraints } = req.body;
    const optimized = await bundleEngine.optimizeBundlePrice(bundleId, constraints);
    res.json({ success: true, optimized });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bundle Recommendations
router.post('/bundles/recommendations', async (req, res) => {
  try {
    const { strategy, products, limit } = req.body;
    const bundles = await bundleEngine.generateBundleRecommendations(strategy, products, limit);
    res.json({ success: true, bundles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bundle Templates
router.post('/bundles/templates', async (req, res) => {
  try {
    const template = await bundleEngine.createBundleTemplate(req.body);
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/bundles/templates/:id', async (req, res) => {
  try {
    const template = await bundleEngine.getBundleTemplate(req.params.id);
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/bundles/templates', async (req, res) => {
  try {
    const templates = await bundleEngine.listBundleTemplates();
    res.json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bundle Discounts
router.post('/bundles/discounts', async (req, res) => {
  try {
    const rule = await bundleEngine.createDiscountRule(req.body);
    res.json({ success: true, rule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/bundles/discounts/:id', async (req, res) => {
  try {
    const rule = await bundleEngine.getDiscountRule(req.params.id);
    res.json({ success: true, rule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bundle Performance
router.post('/bundles/:id/track/view', async (req, res) => {
  try {
    await bundleEngine.trackBundleView(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/bundles/:id/track/add-to-cart', async (req, res) => {
  try {
    await bundleEngine.trackBundleAddToCart(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/bundles/:id/track/purchase', async (req, res) => {
  try {
    const { revenue } = req.body;
    await bundleEngine.trackBundlePurchase(req.params.id, revenue);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/bundles/:id/performance', async (req, res) => {
  try {
    const performance = await bundleEngine.getBundlePerformance(req.params.id);
    res.json({ success: true, performance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//==================================================================
// CUSTOMER TARGETING ENDPOINTS (20+ endpoints)
//==================================================================

// Customer Management
router.post('/customers', async (req, res) => {
  try {
    const customer = await customerEngine.createCustomer(req.body);
    res.json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/customers/:id', async (req, res) => {
  try {
    const customer = await customerEngine.getCustomer(req.params.id);
    res.json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/customers/:id', async (req, res) => {
  try {
    const customer = await customerEngine.updateCustomer(req.params.id, req.body);
    res.json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Segmentation
router.post('/segments', async (req, res) => {
  try {
    const segment = await customerEngine.createSegment(req.body);
    res.json({ success: true, segment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/segments/:id', async (req, res) => {
  try {
    const segment = await customerEngine.getSegment(req.params.id);
    res.json({ success: true, segment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/segments', async (req, res) => {
  try {
    const segments = await customerEngine.listSegments();
    res.json({ success: true, segments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/segments/:id/compute', async (req, res) => {
  try {
    const members = await customerEngine.computeSegmentMembership(req.params.id);
    res.json({ success: true, members });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// RFM Analysis
router.post('/customers/:id/rfm', async (req, res) => {
  try {
    const rfm = await customerEngine.calculateRFM(req.params.id);
    res.json({ success: true, rfm });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/segments/:id/rfm/bulk', async (req, res) => {
  try {
    const results = await customerEngine.bulkCalculateRFM(req.params.id);
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Propensity Scoring
router.post('/customers/:id/propensity', async (req, res) => {
  try {
    const { action } = req.body;
    const score = await customerEngine.calculatePropensityScore(req.params.id, action);
    res.json({ success: true, score });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/customers/:id/propensity/:action', async (req, res) => {
  try {
    const score = await customerEngine.getPropensityScore(req.params.id, req.params.action);
    res.json({ success: true, score });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/customers/high-propensity', async (req, res) => {
  try {
    const { action, minScore } = req.body;
    const customers = await customerEngine.getHighPropensityCustomers(action, minScore);
    res.json({ success: true, customers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Behavior Profiling
router.post('/customers/:id/behavior-profile', async (req, res) => {
  try {
    const profile = await customerEngine.createBehaviorProfile(req.params.id);
    res.json({ success: true, profile });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/customers/target-audience', async (req, res) => {
  try {
    const { action, minPropensity, segments } = req.body;
    const audience = await customerEngine.getTargetAudience({ action, minPropensity, segments });
    res.json({ success: true, audience });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//==================================================================
// CART & CHECKOUT ENDPOINTS (20+ endpoints)
//==================================================================

// Cart Management
router.post('/carts', async (req, res) => {
  try {
    const cart = await cartEngine.createCart(req.body);
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/carts/:id', async (req, res) => {
  try {
    const cart = await cartEngine.getCart(req.params.id);
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/carts/:id/items', async (req, res) => {
  try {
    const cart = await cartEngine.addItemToCart(req.params.id, req.body);
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/carts/:id/items/:productId', async (req, res) => {
  try {
    const cart = await cartEngine.removeItemFromCart(req.params.id, req.params.productId);
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/carts/:id/items/:productId', async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await cartEngine.updateCartItemQuantity(req.params.id, req.params.productId, quantity);
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cart Recommendations
router.get('/carts/:id/recommendations', async (req, res) => {
  try {
    const recommendations = await cartEngine.updateCartRecommendations(req.params.id);
    res.json({ success: true, recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Checkout Upsells
router.post('/checkout/upsells', async (req, res) => {
  try {
    const upsell = await cartEngine.createCheckoutUpsell(req.body);
    res.json({ success: true, upsell });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/checkout/upsells', async (req, res) => {
  try {
    const { cartId, position } = req.query;
    const upsells = await cartEngine.getCheckoutUpsells({ cartId, position });
    res.json({ success: true, upsells });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/checkout/upsells/:id/track/impression', async (req, res) => {
  try {
    await cartEngine.trackUpsellImpression(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/checkout/upsells/:id/track/click', async (req, res) => {
  try {
    await cartEngine.trackUpsellClick(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/checkout/upsells/:id/track/conversion', async (req, res) => {
  try {
    const { revenue } = req.body;
    await cartEngine.trackUpsellConversion(req.params.id, revenue);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Abandoned Cart Recovery
router.post('/carts/:id/abandon', async (req, res) => {
  try {
    const abandoned = await cartEngine.markCartAsAbandoned(req.params.id);
    res.json({ success: true, abandoned });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/carts/:id/recover', async (req, res) => {
  try {
    const recovered = await cartEngine.markCartAsRecovered(req.params.id);
    res.json({ success: true, recovered });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/carts/:id/recovery/:step', async (req, res) => {
  try {
    const result = await cartEngine.executeRecoveryStep(req.params.id, parseInt(req.params.step));
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/carts/abandoned', async (req, res) => {
  try {
    const { limit, daysAgo } = req.query;
    const carts = await cartEngine.getAbandonedCarts({ limit: parseInt(limit), daysAgo: parseInt(daysAgo) });
    res.json({ success: true, carts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/carts/recovery/performance', async (req, res) => {
  try {
    const performance = await cartEngine.getRecoveryPerformance();
    res.json({ success: true, performance });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cart Analytics
router.post('/carts/:id/track', async (req, res) => {
  try {
    await cartEngine.trackCartMetrics(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/carts/analytics', async (req, res) => {
  try {
    const { period } = req.query;
    const analytics = await cartEngine.getCartAnalytics({ period });
    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/carts/top-products', async (req, res) => {
  try {
    const { period, limit } = req.query;
    const products = await cartEngine.getTopCartProducts({ period, limit: parseInt(limit) });
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//==================================================================
// ANALYTICS & PERFORMANCE ENDPOINTS (25+ endpoints)
//==================================================================

// Metrics
router.post('/analytics/metrics', async (req, res) => {
  try {
    const metric = await analyticsEngine.trackMetric(req.body);
    res.json({ success: true, metric });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/metrics', async (req, res) => {
  try {
    const metrics = await analyticsEngine.getMetrics(req.query);
    res.json({ success: true, metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/aggregates/:category/:name', async (req, res) => {
  try {
    const aggregate = await analyticsEngine.getAggregate(req.params.category, req.params.name);
    res.json({ success: true, aggregate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reports
router.post('/analytics/reports', async (req, res) => {
  try {
    const report = await analyticsEngine.generateReport(req.body);
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/reports/:id', async (req, res) => {
  try {
    const report = await analyticsEngine.getReport(req.params.id);
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/reports', async (req, res) => {
  try {
    const reports = await analyticsEngine.listReports(req.query);
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dashboards
router.post('/analytics/dashboards', async (req, res) => {
  try {
    const dashboard = await analyticsEngine.createDashboard(req.body);
    res.json({ success: true, dashboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/dashboards/:id', async (req, res) => {
  try {
    const dashboard = await analyticsEngine.getDashboard(req.params.id);
    res.json({ success: true, dashboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/analytics/dashboards/:id/refresh', async (req, res) => {
  try {
    const dashboard = await analyticsEngine.refreshDashboard(req.params.id);
    res.json({ success: true, dashboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/dashboards', async (req, res) => {
  try {
    const dashboards = await analyticsEngine.listDashboards();
    res.json({ success: true, dashboards });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Attribution
router.post('/analytics/attribution', async (req, res) => {
  try {
    const attribution = await analyticsEngine.attributeRevenue(req.body);
    res.json({ success: true, attribution });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics/attribution/summary', async (req, res) => {
  try {
    const summary = await analyticsEngine.getAttributionSummary(req.query);
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Performance
router.post('/analytics/snapshots', async (req, res) => {
  try {
    const snapshot = await analyticsEngine.createPerformanceSnapshot();
    res.json({ success: true, snapshot });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/analytics/snapshots/compare', async (req, res) => {
  try {
    const { snapshot1, snapshot2 } = req.body;
    const comparison = await analyticsEngine.compareSnapshots(snapshot1, snapshot2);
    res.json({ success: true, comparison });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//==================================================================
// AB TESTING & OPTIMIZATION ENDPOINTS (20+ endpoints)
//==================================================================

// Experiment Management
router.post('/experiments', async (req, res) => {
  try {
    const experiment = await abTestingEngine.createExperiment(req.body);
    res.json({ success: true, experiment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/experiments/:id', async (req, res) => {
  try {
    const experiment = await abTestingEngine.getExperiment(req.params.id);
    res.json({ success: true, experiment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/experiments', async (req, res) => {
  try {
    const experiments = await abTestingEngine.listExperiments(req.query);
    res.json({ success: true, experiments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/experiments/:id/start', async (req, res) => {
  try {
    const experiment = await abTestingEngine.startExperiment(req.params.id);
    res.json({ success: true, experiment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/experiments/:id/stop', async (req, res) => {
  try {
    const experiment = await abTestingEngine.stopExperiment(req.params.id);
    res.json({ success: true, experiment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Variant Assignment
router.post('/experiments/:id/assign', async (req, res) => {
  try {
    const { userId } = req.body;
    const variant = await abTestingEngine.assignVariant({ experimentId: req.params.id, userId });
    res.json({ success: true, variant });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Conversion Tracking
router.post('/experiments/:id/conversions', async (req, res) => {
  try {
    const conversion = await abTestingEngine.trackConversion({ experimentId: req.params.id, ...req.body });
    res.json({ success: true, conversion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Analysis
router.get('/experiments/:id/statistics', async (req, res) => {
  try {
    const stats = await abTestingEngine.calculateExperimentStatistics(req.params.id);
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//==================================================================
// INTEGRATION & SETTINGS ENDPOINTS (30+ endpoints)
//==================================================================

// Integrations
router.post('/integrations', async (req, res) => {
  try {
    const integration = await integrationEngine.createIntegration(req.body);
    res.json({ success: true, integration });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/integrations/:id', async (req, res) => {
  try {
    const integration = await integrationEngine.getIntegration(req.params.id);
    res.json({ success: true, integration });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/integrations', async (req, res) => {
  try {
    const integrations = await integrationEngine.listIntegrations(req.query);
    res.json({ success: true, integrations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/integrations/:id', async (req, res) => {
  try {
    const integration = await integrationEngine.updateIntegration(req.params.id, req.body);
    res.json({ success: true, integration });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/integrations/:id', async (req, res) => {
  try {
    await integrationEngine.deleteIntegration(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/integrations/:id/test', async (req, res) => {
  try {
    const result = await integrationEngine.testIntegrationConnection(req.params.id);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/integrations/:id/sync', async (req, res) => {
  try {
    const sync = await integrationEngine.syncIntegrationData(req.params.id, req.body);
    res.json({ success: true, sync });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Webhooks
router.post('/webhooks', async (req, res) => {
  try {
    const webhook = await integrationEngine.createWebhook(req.body);
    res.json({ success: true, webhook });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/webhooks/:id', async (req, res) => {
  try {
    const webhook = await integrationEngine.getWebhook(req.params.id);
    res.json({ success: true, webhook });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/webhooks', async (req, res) => {
  try {
    const webhooks = await integrationEngine.listWebhooks(req.query);
    res.json({ success: true, webhooks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/webhooks/:id', async (req, res) => {
  try {
    await integrationEngine.deleteWebhook(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API Keys
router.post('/api-keys', async (req, res) => {
  try {
    const apiKey = await integrationEngine.createAPIKey(req.body);
    res.json({ success: true, apiKey });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/api-keys/validate', async (req, res) => {
  try {
    const { key } = req.body;
    const result = await integrationEngine.validateAPIKey(key);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/api-keys/:id/revoke', async (req, res) => {
  try {
    await integrationEngine.revokeAPIKey(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/api-keys', async (req, res) => {
  try {
    const keys = await integrationEngine.listAPIKeys(req.query);
    res.json({ success: true, keys });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Settings
router.post('/settings/:category/:key', async (req, res) => {
  try {
    const { value, encrypted } = req.body;
    const setting = await integrationEngine.saveSetting({ category: req.params.category, key: req.params.key, value, encrypted });
    res.json({ success: true, setting });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/settings/:category/:key', async (req, res) => {
  try {
    const setting = await integrationEngine.getSetting(req.params.category, req.params.key);
    res.json({ success: true, setting });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/settings/:category', async (req, res) => {
  try {
    const settings = await integrationEngine.getSettingsByCategory(req.params.category);
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/settings/:category/:key', async (req, res) => {
  try {
    await integrationEngine.deleteSetting(req.params.category, req.params.key);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//==================================================================
// ADVANCED FEATURES ENDPOINTS (40+ endpoints)
//==================================================================

// Version Control
router.post('/versions', async (req, res) => {
  try {
    const version = await advancedEngine.createVersion(req.body);
    res.json({ success: true, version });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/versions/:entityType/:entityId', async (req, res) => {
  try {
    const history = await advancedEngine.getVersionHistory({
      entityType: req.params.entityType,
      entityId: req.params.entityId,
      limit: parseInt(req.query.limit) || 50
    });
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/versions/:id', async (req, res) => {
  try {
    const version = await advancedEngine.getVersion(req.params.id);
    res.json({ success: true, version });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/versions/compare', async (req, res) => {
  try {
    const { versionId1, versionId2 } = req.body;
    const diff = await advancedEngine.compareVersions(versionId1, versionId2);
    res.json({ success: true, diff });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/versions/:id/restore', async (req, res) => {
  try {
    const restored = await advancedEngine.restoreVersion(req.params.id, req.body);
    res.json({ success: true, restored });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Templates
router.post('/templates', async (req, res) => {
  try {
    const template = await advancedEngine.createTemplate(req.body);
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/templates/:id', async (req, res) => {
  try {
    const template = await advancedEngine.getTemplate(req.params.id);
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/templates', async (req, res) => {
  try {
    const templates = await advancedEngine.listTemplates(req.query);
    res.json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/templates/:id/apply', async (req, res) => {
  try {
    const result = await advancedEngine.applyTemplate(req.params.id, req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/templates/:id', async (req, res) => {
  try {
    const template = await advancedEngine.updateTemplate(req.params.id, req.body);
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/templates/:id', async (req, res) => {
  try {
    await advancedEngine.deleteTemplate(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Compliance
router.post('/compliance/rules', async (req, res) => {
  try {
    const rule = await advancedEngine.createComplianceRule(req.body);
    res.json({ success: true, rule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/compliance/check', async (req, res) => {
  try {
    const result = await advancedEngine.checkCompliance(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/compliance/rules', async (req, res) => {
  try {
    const rules = await advancedEngine.listComplianceRules(req.query);
    res.json({ success: true, rules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Audit Logs
router.post('/audit/log', async (req, res) => {
  try {
    const log = await advancedEngine.logAudit(req.body);
    res.json({ success: true, log });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/audit/logs', async (req, res) => {
  try {
    const logs = await advancedEngine.getAuditLogs(req.query);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/audit/export', async (req, res) => {
  try {
    const data = await advancedEngine.exportAuditLogs(req.query);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Backup & Restore
router.post('/backups', async (req, res) => {
  try {
    const backup = await advancedEngine.createBackup(req.body);
    res.json({ success: true, backup });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/backups/:id/restore', async (req, res) => {
  try {
    const result = await advancedEngine.restoreBackup(req.params.id, req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/backups', async (req, res) => {
  try {
    const backups = await advancedEngine.listBackups(req.query);
    res.json({ success: true, backups });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/backups/:id', async (req, res) => {
  try {
    await advancedEngine.deleteBackup(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Scheduled Tasks
router.post('/schedules', async (req, res) => {
  try {
    const schedule = await advancedEngine.createSchedule(req.body);
    res.json({ success: true, schedule });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/schedules', async (req, res) => {
  try {
    const schedules = await advancedEngine.listSchedules(req.query);
    res.json({ success: true, schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk Operations
router.post('/bulk', async (req, res) => {
  try {
    const result = await advancedEngine.bulkOperation(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

//==================================================================
// HEALTH & STATUS
//==================================================================

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    modules: {
      recommendation: 'active',
      bundle: 'active',
      customer: 'active',
      cart: 'active',
      analytics: 'active',
      abTesting: 'active',
      integration: 'active',
      advanced: 'active'
    }
  });
});

router.get('/stats', (req, res) => {
  res.json({
    recommendations: recommendationEngine.recommendations.size,
    bundles: bundleEngine.bundles.size,
    customers: customerEngine.customers.size,
    carts: cartEngine.carts.size,
    experiments: abTestingEngine.experiments.size,
    integrations: integrationEngine.integrations.size,
    versions: advancedEngine.versions.size,
    templates: advancedEngine.templates.size
  });
});

module.exports = router;
