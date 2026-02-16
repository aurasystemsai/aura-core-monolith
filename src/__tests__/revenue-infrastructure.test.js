/**
 * Revenue Infrastructure Integration Tests
 * 
 * Tests the complete revenue flow across all engines:
 * - Customer signup → subscription creation → usage tracking → billing
 * - White-label partner → client creation → revenue sharing
 * - Marketplace app → installation → commission tracking
 * - Tier upgrades → feature access → invoicing
 */

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

describe('Revenue Infrastructure Integration Tests', () => {
  
  describe('Customer Lifecycle Flow', () => {
    let customerId;
    
    test('should initialize revenue infrastructure on customer signup', async () => {
      customerId = 'test_customer_' + Date.now();
      
      const result = await revenueOrchestrator.initializeCustomerRevenue(customerId, {
        email: 'test@example.com',
        companyName: 'Test Company',
        tier: 'growth',
        billingCycle: 'monthly',
        vertical: 'fashion',
      });
      
      expect(result.subscription).toBeDefined();
      expect(result.subscription.tier).toBe('growth');
      expect(result.usage).toBeDefined();
      expect(result.vertical).toBeDefined();
      expect(result.vertical.verticalId).toBe('fashion');
      expect(result.auraScore).toBeDefined();
      expect(result.auraScore.score).toBeGreaterThan(0);
    });
    
    test('should track CDP events and trigger usage metering', async () => {
      const eventResult = await revenueOrchestrator.trackCDPEvent(
        customerId,
        'event.tracked',
        { type: 'page_view', url: '/products/dress-123' }
      );
      
      expect(eventResult.tracked).toBe(true);
      expect(eventResult.billableEventType).toBe('event_tracked');
      
      // Verify usage was tracked
      const usage = usageMetering.getUsage(customerId);
      expect(usage.event_tracked).toBeGreaterThan(0);
    });
    
    test('should enforce feature access based on tier', () => {
      // Growth tier should have platform activations
      const accessCheck = revenueOrchestrator.checkFeatureAccess(
        customerId,
        'platform_activations'
      );
      expect(accessCheck.allowed).toBe(true);
      
      // Growth tier should NOT have white-label
      const whiteLabelCheck = revenueOrchestrator.checkFeatureAccess(
        customerId,
        'white_label'
      );
      expect(whiteLabelCheck.allowed).toBe(false);
      expect(whiteLabelCheck.upgradeRequired).toBe('enterprise');
    });
    
    test('should generate monthly invoice combining subscription + usage', async () => {
      // Track some billable usage
      for (let i = 0; i < 1000; i++) {
        usageMetering.trackUsageEvent(customerId, 'event_tracked', {});
      }
      
      const invoice = await revenueOrchestrator.generateMonthlyInvoice(customerId);
      
      expect(invoice.lineItems).toContainEqual(
        expect.objectContaining({ type: 'subscription' })
      );
      expect(invoice.lineItems).toContainEqual(
        expect.objectContaining({ type: 'usage' })
      );
      expect(invoice.lineItems).toContainEqual(
        expect.objectContaining({ type: 'vertical' })
      );
      expect(invoice.total).toBeGreaterThan(299); // Base Growth price
    });
    
    test('should handle customer upgrade with prorated billing', async () => {
      const upgrade = await revenueOrchestrator.handleCustomerUpgrade(
        customerId,
        'pro'
      );
      
      expect(upgrade.oldTier).toBe('growth');
      expect(upgrade.newTier).toBe('pro');
      
      // Verify feature access updated
      const mlCheck = revenueOrchestrator.checkFeatureAccess(
        customerId,
        'ml_predictions'
      );
      expect(mlCheck.allowed).toBe(true);
    });
  });
  
  describe('White-Label Partnership Flow', () => {
    let partnerId;
    let clientId;
    
    test('should register white-label partner', () => {
      const partner = whiteLabelEngine.createPartner('professional', {
        companyName: 'Test Agency',
        contactName: 'John Smith',
        email: 'john@testagency.com',
        revenueSharePercent: 20,
      });
      
      partnerId = partner.id;
      
      expect(partner.tier).toBe('professional');
      expect(partner.sharePercent).toBe(20);
      expect(partner.monthlyPrice).toBe(5999);
    });
    
    test('should create client under white-label partner', () => {
      const client = whiteLabelEngine.createClient(partnerId, {
        companyName: 'Client Brand',
        email: 'admin@clientbrand.com',
        tier: 'growth',
      });
      
      clientId = client.clientId;
      
      expect(client.partnerId).toBe(partnerId);
      expect(client.subscription.tier).toBe('growth');
    });
    
    test('should track client usage and calculate revenue share', async () => {
      const revenueResult = await revenueOrchestrator.trackWhiteLabelClientUsage(
        partnerId,
        clientId,
        { amount: 1000, description: 'Monthly usage charges' }
      );
      
      expect(revenueResult.totalRevenue).toBe(1000);
      expect(revenueResult.partnerEarnings).toBe(200); // 20% share
      expect(revenueResult.platformEarnings).toBe(800); // 80% retained
    });
    
    test('should generate partner payout', () => {
      const payout = revenueShareEngine.generateMonthlyPayout(partnerId);
      
      expect(payout.partnerName).toBe('Test Agency');
      expect(payout.totalEarnings).toBeGreaterThan(0);
      expect(payout.lineItems.length).toBeGreaterThan(0);
    });
  });
  
  describe('Marketplace App Flow', () => {
    let developerId;
    let appId;
    let customerId;
    
    test('should register marketplace developer', () => {
      const developer = marketplaceEngine.registerDeveloper({
        name: 'Test Developer',
        email: 'dev@testapp.com',
        company: 'Test App Inc',
      });
      
      developerId = developer.id;
      
      expect(developer.status).toBe('active');
    });
    
    test('should create marketplace app', () => {
      const app = marketplaceEngine.createApp(developerId, {
        name: 'Email Superpowers',
        description: 'Advanced email automation',
        category: 'email_marketing',
        pricingModel: 'paid',
        monthlyPrice: 99,
      });
      
      appId = app.id;
      
      expect(app.status).toBe('draft');
      expect(app.monthlyPrice).toBe(99);
    });
    
    test('should submit app for review and approve', () => {
      marketplaceEngine.submitAppForReview(appId);
      
      const app = marketplaceEngine.getApp(appId);
      expect(app.status).toBe('review');
      
      // Simulate approval
      marketplaceEngine.publishApp(appId);
      
      const published = marketplaceEngine.getApp(appId);
      expect(published.status).toBe('published');
    });
    
    test('should install app and track commission', async () => {
      customerId = 'test_customer_marketplace_' + Date.now();
      
      const installation = await revenueOrchestrator.handleAppInstallation(
        customerId,
        appId,
        { scopes: ['profiles:read', 'events:write'] }
      );
      
      expect(installation.customerId).toBe(customerId);
      expect(installation.appId).toBe(appId);
      expect(installation.status).toBe('active');
    });
    
    test('should generate developer payout with commission', () => {
      const payout = revenueShareEngine.generateMonthlyPayout(developerId);
      
      // Developer gets 75%, platform keeps 25%
      expect(payout.sharePercent).toBe(75);
      expect(payout.totalEarnings).toBeGreaterThan(0);
    });
  });
  
  describe('Fintech Lending Flow', () => {
    let customerId;
    
    beforeAll(() => {
      customerId = 'test_fintech_customer_' + Date.now();
      
      // Initialize customer with good revenue history
      revenueOrchestrator.initializeCustomerRevenue(customerId, {
        email: 'fintech@example.com',
        companyName: 'Growing Brand',
        tier: 'pro',
        estimatedRevenue: 500000,
      });
    });
    
    test('should calculate Aura Score based on CDP data', () => {
      const mockCDPData = {
        revenue: [
          { month: '2026-01', amount: 50000 },
          { month: '2025-12', amount: 45000 },
          { month: '2025-11', amount: 40000 },
        ],
        cohorts: [
          { cohort: '2025-10', retention: 0.72 },
        ],
        metrics: {
          ltv: 487,
          cac: 89,
        },
        transactions: [
          { amount: 299, paidOnTime: true },
          { amount: 299, paidOnTime: true },
        ],
      };
      
      const auraScore = fintechEngine.calculateAuraScore(customerId, mockCDPData);
      
      expect(auraScore.score).toBeGreaterThanOrEqual(300);
      expect(auraScore.score).toBeLessThanOrEqual(850);
      expect(auraScore.tier).toBeDefined();
      expect(auraScore.factors).toBeDefined();
    });
    
    test('should originate Net-30 terms for qualified customer', () => {
      const netTerms = fintechEngine.originateNetTerms(customerId, {
        invoiceAmount: 100000,
        supplierName: 'Supplier Inc',
      });
      
      expect(netTerms.status).toBe('approved');
      expect(netTerms.invoiceAmount).toBe(100000);
      expect(netTerms.feeAmount).toBeGreaterThan(0);
      expect(netTerms.feeAmount).toBeLessThanOrEqual(3000); // Max 3%
    });
    
    test('should originate working capital loan', () => {
      const loan = fintechEngine.originateWorkingCapitalLoan(customerId, {
        amount: 50000,
        termMonths: 6,
      });
      
      expect(loan.status).toBe('approved');
      expect(loan.principal).toBe(50000);
      expect(loan.interestRate).toBeGreaterThanOrEqual(8);
      expect(loan.interestRate).toBeLessThanOrEqual(15);
    });
  });
  
  describe('Data Products Flow', () => {
    test('should subscribe to industry benchmarks', () => {
      const customerId = 'test_data_products_' + Date.now();
      
      const subscription = dataProductsEngine.subscribeToDataProduct(
        customerId,
        'benchmarks',
        'fashion_apparel'
      );
      
      expect(subscription.productId).toBe('benchmarks');
      expect(subscription.vertical).toBe('fashion_apparel');
      expect(subscription.status).toBe('active');
    });
    
    test('should generate industry benchmarks with sufficient data', () => {
      const benchmarks = dataProductsEngine.generateIndustryBenchmarks(
        'beauty_cosmetics',
        '2026-02'
      );
      
      expect(benchmarks.vertical).toBe('beauty_cosmetics');
      expect(benchmarks.sampleSize).toBeGreaterThanOrEqual(50);
      expect(benchmarks.metrics.conversion_rate).toBeDefined();
      expect(benchmarks.metrics.customer_ltv).toBeDefined();
    });
    
    test('should generate competitive intelligence', () => {
      const customerId = 'test_competitive_' + Date.now();
      
      const customerMetrics = {
        conversion_rate: 2.8,
        cart_abandonment_rate: 68.5,
        customer_ltv: 412,
        email_open_rate: 28.3,
      };
      
      const competitive = dataProductsEngine.generateCompetitiveIntelligence(
        customerId,
        customerMetrics,
        'fashion_apparel'
      );
      
      expect(competitive.rankings).toBeDefined();
      expect(competitive.gaps).toBeDefined();
      expect(competitive.recommendations).toBeDefined();
    });
  });
  
  describe('Multi-Tenant Enterprise Flow', () => {
    let tenantId;
    
    test('should provision enterprise tenant', () => {
      const tenant = multiTenantEngine.provisionTenant({
        companyName: 'Enterprise Corp',
        adminEmail: 'admin@enterprise.com',
        tier: 'premium',
        customDomain: 'cdp.enterprise.com',
      });
      
      tenantId = tenant.id;
      
      expect(tenant.status).toBe('active');
      expect(tenant.tier).toBe('premium');
      expect(tenant.customDomain).toBe('cdp.enterprise.com');
    });
    
    test('should track tenant resource usage', () => {
      multiTenantEngine.trackTenantUsage(tenantId, 'storage', 100); // 100 GB
      multiTenantEngine.trackTenantUsage(tenantId, 'api_call', 1);
      
      const usage = multiTenantEngine.getTenantDashboard(tenantId).usage;
      
      expect(usage.storage.usedGB).toBe(100);
      expect(usage.apiCalls.today).toBeGreaterThan(0);
    });
    
    test('should alert when approaching quota limits', () => {
      // Track usage to 85% of quota (should trigger alert)
      const quotaGB = 2000; // Premium tier quota
      multiTenantEngine.trackTenantUsage(tenantId, 'storage', quotaGB * 0.85);
      
      const alerts = multiTenantEngine.checkQuotaLimits(tenantId);
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].type).toBe('storage');
      expect(alerts[0].severity).toBe('warning');
    });
  });
  
  describe('Vertical Templates Flow', () => {
    test('should deploy vertical template to customer', () => {
      const customerId = 'test_vertical_' + Date.now();
      
      const deployment = verticalTemplates.deployVerticalTemplate(
        customerId,
        'beauty',
        {}
      );
      
      expect(deployment.verticalId).toBe('beauty');
      expect(deployment.segments.length).toBeGreaterThan(0);
      expect(deployment.metrics.length).toBeGreaterThan(0);
      expect(deployment.status).toBe('active');
    });
    
    test('should include pre-built segments in vertical template', () => {
      const template = verticalTemplates.getVerticalTemplate('food');
      
      expect(template.prebuiltSegments).toBeDefined();
      expect(template.prebuiltSegments.length).toBeGreaterThan(0);
      
      const veganSegment = template.prebuiltSegments.find(
        s => s.name === 'Vegan Shoppers'
      );
      expect(veganSegment).toBeDefined();
    });
  });
  
  describe('Revenue Analytics', () => {
    test('should calculate customer LTV', () => {
      const customerId = 'test_ltv_' + Date.now();
      
      // Create subscription
      tierManagement.createSubscription(customerId, 'growth', 'monthly');
      
      // Track usage
      for (let i = 0; i < 10000; i++) {
        usageMetering.trackUsageEvent(customerId, 'event_tracked', {});
      }
      
      const ltv = revenueOrchestrator.calculateCustomerLTV(customerId);
      
      expect(ltv.monthlyRecurring).toBe(299); // Growth tier
      expect(ltv.monthlyUsage).toBeGreaterThan(0);
      expect(ltv.ltv).toBeGreaterThan(299 * 36); // At least base * 36 months
    });
    
    test('should generate platform-wide revenue analytics', () => {
      const analytics = revenueOrchestrator.getPlatformRevenueAnalytics();
      
      expect(analytics.subscriptions).toBeDefined();
      expect(analytics.usage).toBeDefined();
      expect(analytics.marketplace).toBeDefined();
      expect(analytics.dataProducts).toBeDefined();
      expect(analytics.verticals).toBeDefined();
      expect(analytics.revenueSharing).toBeDefined();
    });
  });
  
  describe('Revenue Share Consolidation', () => {
    test('should generate 1099 forms for US partners', () => {
      // Register partner with W9 on file
      const partner = revenueShareEngine.registerPartner('affiliate', {
        companyName: 'US Affiliate Inc',
        email: 'affiliate@us.com',
        taxId: '12-3456789',
        taxCountry: 'US',
        w9OnFile: true,
      });
      
      // Track revenue events totaling >$600
      for (let i = 0; i < 10; i++) {
        revenueShareEngine.trackRevenueEvent(partner.id, {
          amount: 100,
          description: 'Affiliate commission',
        });
      }
      
      // Generate payout
      const payout = revenueShareEngine.generateMonthlyPayout(partner.id);
      revenueShareEngine.processPayout(payout.id, { reference: 'test_payout' });
      
      // Generate 1099s
      const forms = revenueShareEngine.generate1099Forms(2026);
      
      expect(forms.length).toBeGreaterThan(0);
      const partnerForm = forms.find(f => f.partnerId === partner.id);
      expect(partnerForm).toBeDefined();
      expect(partnerForm.totalNonemployeeCompensation).toBeGreaterThan(600);
    });
  });
  
  describe('End-to-End Revenue Flow', () => {
    test('should handle complete customer lifecycle with all revenue streams', async () => {
      const customerId = 'test_e2e_' + Date.now();
      
      // 1. Customer signs up
      const signup = await revenueOrchestrator.initializeCustomerRevenue(customerId, {
        email: 'e2e@example.com',
        companyName: 'E2E Test Co',
        tier: 'starter',
        vertical: 'pet',
      });
      expect(signup.subscription.tier).toBe('starter');
      
      // 2. Customer uses product (generates usage events)
      for (let i = 0; i < 5000; i++) {
        await revenueOrchestrator.trackCDPEvent(
          customerId,
          'event.tracked',
          { type: 'test' }
        );
      }
      
      // 3. Customer installs marketplace app
      const developer = marketplaceEngine.registerDeveloper({
        name: 'E2E Dev',
        email: 'dev@e2e.com',
      });
      const app = marketplaceEngine.createApp(developer.id, {
        name: 'E2E App',
        category: 'analytics',
        pricingModel: 'paid',
        monthlyPrice: 29,
      });
      marketplaceEngine.publishApp(app.id);
      await revenueOrchestrator.handleAppInstallation(customerId, app.id, {});
      
      // 4. Customer subscribes to data product
      dataProductsEngine.subscribeToDataProduct(
        customerId,
        'benchmarks',
        'pet_products'
      );
      
      // 5. Customer upgrades tier
      await revenueOrchestrator.handleCustomerUpgrade(customerId, 'pro');
      
      // 6. Generate invoice (should include all revenue streams)
      const invoice = await revenueOrchestrator.generateMonthlyInvoice(customerId);
      
      expect(invoice.lineItems.length).toBeGreaterThan(3);
      expect(invoice.lineItems).toContainEqual(
        expect.objectContaining({ type: 'subscription' })
      );
      expect(invoice.lineItems).toContainEqual(
        expect.objectContaining({ type: 'usage' })
      );
      expect(invoice.lineItems).toContainEqual(
        expect.objectContaining({ type: 'vertical' })
      );
      expect(invoice.total).toBeGreaterThan(799); // Pro tier base
      
      // 7. Calculate LTV
      const ltv = revenueOrchestrator.calculateCustomerLTV(customerId);
      expect(ltv.ltv).toBeGreaterThan(10000); // Significant LTV from multiple streams
    });
  });
});
