/**
 * Revenue API Routes
 * 
 * Exposes revenue engines and analytics via REST API
 * 
 * Routes:
 * - Admin dashboard analytics
 * - Customer subscriptions
 * - Usage tracking
 * - Marketplace operations
 * - White-label partner management
 * - Fintech products
 * - Data products
 * - Vertical templates
 */

const express = require('express');
const router = express.Router();

// Import revenue engines
const revenueOrchestrator = require('../core/revenue-integration-orchestrator');
const tierManagement = require('../core/tier-management-engine');
const usageMetering = require('../core/usage-metering-engine');
const whiteLabelEngine = require('../core/white-label-config-engine');
const marketplaceEngine = require('../core/marketplace-platform-engine');
const fintechEngine = require('../core/fintech-integration-engine');
const dataProductsEngine = require('../core/data-products-engine');
const verticalTemplates = require('../core/vertical-templates-engine');
const multiTenantEngine = require('../core/multi-tenant-engine');
const revenueShareEngine = require('../core/revenue-share-consolidation-engine');
const adminDashboard = require('../core/admin-revenue-dashboard');

// =============================================================================
// ADMIN REVENUE DASHBOARD
// =============================================================================

/**
 * GET /api/admin/revenue/dashboard
 * Get comprehensive revenue dashboard
 */
router.get('/admin/revenue/dashboard', async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const dashboard = adminDashboard.getRevenueDashboard(period);
    res.json(dashboard);
  } catch (error) {
    console.error('Failed to get revenue dashboard:', error);
    res.status(500).json({ error: 'Failed to load revenue dashboard' });
  }
});

/**
 * GET /api/admin/revenue/summary
 * Get revenue summary (MRR, ARR, growth, churn)
 */
router.get('/admin/revenue/summary', (req, res) => {
  try {
    const summary = adminDashboard.getRevenueSummary();
    res.json(summary);
  } catch (error) {
    console.error('Failed to get revenue summary:', error);
    res.status(500).json({ error: 'Failed to load revenue summary' });
  }
});

/**
 * GET /api/admin/revenue/streams
 * Get breakdown by revenue stream
 */
router.get('/admin/revenue/streams', (req, res) => {
  try {
    const subscriptions = adminDashboard.getSubscriptionRevenue();
    const usage = adminDashboard.getUsageRevenue();
    const marketplace = adminDashboard.getMarketplaceRevenue();
    const whiteLabel = adminDashboard.getWhiteLabelRevenue();
    const dataProducts = adminDashboard.getDataProductsRevenue();
    const fintech = adminDashboard.getFintechRevenue();
    const verticals = adminDashboard.getVerticalsRevenue();
    const enterprise = adminDashboard.getEnterpriseRevenue();
    
    res.json({
      subscriptions,
      usage,
      marketplace,
      whiteLabel,
      dataProducts,
      fintech,
      verticals,
      enterprise,
    });
  } catch (error) {
    console.error('Failed to get revenue streams:', error);
    res.status(500).json({ error: 'Failed to load revenue streams' });
  }
});

/**
 * GET /api/admin/revenue/growth
 * Get growth metrics
 */
router.get('/admin/revenue/growth', (req, res) => {
  try {
    const growth = adminDashboard.getGrowthMetrics();
    res.json(growth);
  } catch (error) {
    console.error('Failed to get growth metrics:', error);
    res.status(500).json({ error: 'Failed to load growth metrics' });
  }
});

/**
 * GET /api/admin/revenue/projections
 * Get revenue projections
 */
router.get('/admin/revenue/projections', (req, res) => {
  try {
    const projections = adminDashboard.getRevenueProjections();
    res.json(projections);
  } catch (error) {
    console.error('Failed to get revenue projections:', error);
    res.status(500).json({ error: 'Failed to load revenue projections' });
  }
});

/**
 * GET /api/admin/revenue/cohorts
 * Get cohort analysis
 */
router.get('/admin/revenue/cohorts', (req, res) => {
  try {
    const cohorts = adminDashboard.getCohortAnalysis();
    res.json(cohorts);
  } catch (error) {
    console.error('Failed to get cohort analysis:', error);
    res.status(500).json({ error: 'Failed to load cohort analysis' });
  }
});

// =============================================================================
// CUSTOMER SUBSCRIPTIONS
// =============================================================================

/**
 * POST /api/customers/:customerId/subscription
 * Create customer subscription
 */
router.post('/customers/:customerId/subscription', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { tier, billingCycle, vertical } = req.body;
    
    const result = await revenueOrchestrator.initializeCustomerRevenue(customerId, {
      tier,
      billingCycle,
      vertical,
      ...req.body,
    });
    
    res.json(result);
  } catch (error) {
    console.error('Failed to create subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/customers/:customerId/subscription
 * Get customer subscription
 */
router.get('/customers/:customerId/subscription', (req, res) => {
  try {
    const { customerId } = req.params;
    const subscription = tierManagement.getSubscription(customerId);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    res.json(subscription);
  } catch (error) {
    console.error('Failed to get subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/customers/:customerId/subscription/tier
 * Upgrade/downgrade customer tier
 */
router.put('/customers/:customerId/subscription/tier', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { newTier } = req.body;
    
    const result = await revenueOrchestrator.handleCustomerUpgrade(customerId, newTier);
    res.json(result);
  } catch (error) {
    console.error('Failed to change tier:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/customers/:customerId/subscription
 * Cancel customer subscription
 */
router.delete('/customers/:customerId/subscription', (req, res) => {
  try {
    const { customerId } = req.params;
    const { reason } = req.body;
    
    tierManagement.cancelSubscription(customerId, reason);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// USAGE TRACKING
// =============================================================================

/**
 * POST /api/customers/:customerId/usage
 * Track usage event
 */
router.post('/customers/:customerId/usage', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { eventType, eventData } = req.body;
    
    const result = await revenueOrchestrator.trackCDPEvent(
      customerId,
      eventType,
      eventData
    );
    
    res.json(result);
  } catch (error) {
    console.error('Failed to track usage:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/customers/:customerId/usage
 * Get customer usage
 */
router.get('/customers/:customerId/usage', (req, res) => {
  try {
    const { customerId } = req.params;
    const usage = usageMetering.getUsage(customerId);
    
    res.json(usage || {});
  } catch (error) {
    console.error('Failed to get usage:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/customers/:customerId/invoice
 * Generate customer invoice
 */
router.get('/customers/:customerId/invoice', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { period } = req.query;
    
    const invoice = await revenueOrchestrator.generateMonthlyInvoice(
      customerId,
      period
    );
    
    res.json(invoice);
  } catch (error) {
    console.error('Failed to generate invoice:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// MARKETPLACE
// =============================================================================

/**
 * POST /api/marketplace/developers
 * Register marketplace developer
 */
router.post('/marketplace/developers', (req, res) => {
  try {
    const developer = marketplaceEngine.registerDeveloper(req.body);
    res.json(developer);
  } catch (error) {
    console.error('Failed to register developer:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/marketplace/apps
 * Create marketplace app
 */
router.post('/marketplace/apps', (req, res) => {
  try {
    const { developerId, ...appData } = req.body;
    const app = marketplaceEngine.createApp(developerId, appData);
    res.json(app);
  } catch (error) {
    console.error('Failed to create app:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/marketplace/apps
 * List marketplace apps
 */
router.get('/marketplace/apps', (req, res) => {
  try {
    const { category, status } = req.query;
    const apps = marketplaceEngine.listApps({ category, status });
    res.json(apps);
  } catch (error) {
    console.error('Failed to list apps:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/customers/:customerId/marketplace/:appId/install
 * Install marketplace app
 */
router.post('/customers/:customerId/marketplace/:appId/install', async (req, res) => {
  try {
    const { customerId, appId } = req.params;
    const { scopes } = req.body;
    
    const installation = await revenueOrchestrator.handleAppInstallation(
      customerId,
      appId,
      { scopes }
    );
    
    res.json(installation);
  } catch (error) {
    console.error('Failed to install app:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// WHITE-LABEL PARTNERS
// =============================================================================

/**
 * POST /api/partners
 * Register white-label partner
 */
router.post('/partners', (req, res) => {
  try {
    const { tier, ...partnerData } = req.body;
    const partner = whiteLabelEngine.createPartner(tier, partnerData);
    res.json(partner);
  } catch (error) {
    console.error('Failed to create partner:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/partners/:partnerId/clients
 * Create client under partner
 */
router.post('/partners/:partnerId/clients', (req, res) => {
  try {
    const { partnerId } = req.params;
    const client = whiteLabelEngine.createClient(partnerId, req.body);
    res.json(client);
  } catch (error) {
    console.error('Failed to create client:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/partners/:partnerId/dashboard
 * Get partner dashboard
 */
router.get('/partners/:partnerId/dashboard', (req, res) => {
  try {
    const { partnerId } = req.params;
    const dashboard = whiteLabelEngine.getPartnerDashboard(partnerId);
    res.json(dashboard);
  } catch (error) {
    console.error('Failed to get partner dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/partners/:partnerId/payouts
 * Get partner payouts
 */
router.get('/partners/:partnerId/payouts', (req, res) => {
  try {
    const { partnerId } = req.params;
    const { period } = req.query;
    
    const payout = revenueShareEngine.generateMonthlyPayout(partnerId, period);
    res.json(payout);
  } catch (error) {
    console.error('Failed to get payout:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// FINTECH PRODUCTS
// =============================================================================

/**
 * POST /api/customers/:customerId/aura-score
 * Calculate Aura Score
 */
router.post('/customers/:customerId/aura-score', (req, res) => {
  try {
    const { customerId } = req.params;
    const { cdpData } = req.body;
    
    const auraScore = fintechEngine.calculateAuraScore(customerId, cdpData);
    res.json(auraScore);
  } catch (error) {
    console.error('Failed to calculate Aura Score:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/customers/:customerId/fintech/net-terms
 * Apply for Net-30 terms
 */
router.post('/customers/:customerId/fintech/net-terms', (req, res) => {
  try {
    const { customerId } = req.params;
    const application = fintechEngine.originateNetTerms(customerId, req.body);
    res.json(application);
  } catch (error) {
    console.error('Failed to originate Net-30 terms:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/customers/:customerId/fintech/working-capital
 * Apply for working capital loan
 */
router.post('/customers/:customerId/fintech/working-capital', (req, res) => {
  try {
    const { customerId } = req.params;
    const loan = fintechEngine.originateWorkingCapitalLoan(customerId, req.body);
    res.json(loan);
  } catch (error) {
    console.error('Failed to originate working capital loan:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// DATA PRODUCTS
// =============================================================================

/**
 * POST /api/customers/:customerId/data-products/subscribe
 * Subscribe to data product
 */
router.post('/customers/:customerId/data-products/subscribe', (req, res) => {
  try {
    const { customerId } = req.params;
    const { productId, vertical } = req.body;
    
    const subscription = dataProductsEngine.subscribeToDataProduct(
      customerId,
      productId,
      vertical
    );
    
    res.json(subscription);
  } catch (error) {
    console.error('Failed to subscribe to data product:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/data-products/benchmarks
 * Get industry benchmarks
 */
router.get('/data-products/benchmarks', (req, res) => {
  try {
    const { vertical, period } = req.query;
    const benchmarks = dataProductsEngine.generateIndustryBenchmarks(vertical, period);
    res.json(benchmarks);
  } catch (error) {
    console.error('Failed to generate benchmarks:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/data-products/market-intelligence
 * Get market intelligence
 */
router.get('/data-products/market-intelligence', (req, res) => {
  try {
    const { vertical } = req.query;
    const intelligence = dataProductsEngine.generateMarketIntelligence(vertical);
    res.json(intelligence);
  } catch (error) {
    console.error('Failed to generate market intelligence:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// VERTICAL TEMPLATES
// =============================================================================

/**
 * GET /api/vertical-templates
 * List available vertical templates
 */
router.get('/vertical-templates', (req, res) => {
  try {
    const catalog = verticalTemplates.getVerticalCatalog();
    res.json(catalog);
  } catch (error) {
    console.error('Failed to get vertical catalog:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/customers/:customerId/vertical-templates/:verticalId/deploy
 * Deploy vertical template
 */
router.post('/customers/:customerId/vertical-templates/:verticalId/deploy', (req, res) => {
  try {
    const { customerId, verticalId } = req.params;
    const { customization } = req.body;
    
    const deployment = verticalTemplates.deployVerticalTemplate(
      customerId,
      verticalId,
      customization
    );
    
    res.json(deployment);
  } catch (error) {
    console.error('Failed to deploy vertical template:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================================================================
// MULTI-TENANT ENTERPRISE
// =============================================================================

/**
 * POST /api/enterprise/tenants
 * Provision enterprise tenant
 */
router.post('/enterprise/tenants', (req, res) => {
  try {
    const tenant = multiTenantEngine.provisionTenant(req.body);
    res.json(tenant);
  } catch (error) {
    console.error('Failed to provision tenant:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/enterprise/tenants/:tenantId
 * Get tenant dashboard
 */
router.get('/enterprise/tenants/:tenantId', (req, res) => {
  try {
    const { tenantId } = req.params;
    const dashboard = multiTenantEngine.getTenantDashboard(tenantId);
    res.json(dashboard);
  } catch (error) {
    console.error('Failed to get tenant dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/enterprise/tenants/:tenantId/usage
 * Track tenant resource usage
 */
router.post('/enterprise/tenants/:tenantId/usage', (req, res) => {
  try {
    const { tenantId } = req.params;
    const { resourceType, amount } = req.body;
    
    multiTenantEngine.trackTenantUsage(tenantId, resourceType, amount);
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to track tenant usage:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
