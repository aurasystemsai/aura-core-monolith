const request = require('supertest');
const express = require('express');
const loyaltyReferralRouter = require('../routes/loyalty-referral-engine');

const app = express();
app.use(express.json());
app.use(loyaltyReferralRouter);

describe('Loyalty & Referral Program V2 - Comprehensive Test Suite', () => {
  
  // ============================================================================
  // POINTS & REWARDS TESTS (6 tests)
  // ============================================================================
  
  describe('Points & Rewards Engine', () => {
    test('Should create points earning rule', async () => {
      const response = await request(app)
        .post('/api/loyalty-referral/points/rules')
        .send({
          name: 'Purchase Points',
          type: 'purchase',
          points: 0,
          multiplier: 0.1,
          conditions: { minOrderValue: 50 },
          enabled: true,
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.rule).toHaveProperty('id');
      expect(response.body.rule.type).toBe('purchase');
    });
    
    test('Should award points to customer', async () => {
      const response = await request(app)
        .post('/api/loyalty-referral/points/award')
        .send({
          customerId: 'customer_123',
          points: 100,
          reason: 'Purchase reward',
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.transaction).toHaveProperty('id');
      expect(response.body.transaction.points).toBe(100);
    });
    
    test('Should redeem reward with points', async () => {
      const rewardResponse = await request(app)
        .post('/api/loyalty-referral/rewards')
        .send({
          name: '10% Discount',
          type: 'discount',
          pointsCost: 500,
          value: 10,
          stockLimit: 100,
        });
      
      const rewardId = rewardResponse.body.reward.id;
      
      const response = await request(app)
        .post(`/api/loyalty-referral/rewards/${rewardId}/redeem`)
        .send({
          customerId: 'customer_123',
          quantity: 1,
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.redemption).toHaveProperty('code');
    });
    
    test('Should transfer points between customers', async () => {
      const response = await request(app)
        .post('/api/loyalty-referral/points/transfer')
        .send({
          fromCustomerId: 'customer_123',
          toCustomerId: 'customer_456',
          points: 50,
          note: 'Gift',
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('Should track expiring points', async () => {
      const response = await request(app)
        .get('/api/loyalty-referral/points/expiring/customer_123')
        .query({ days: 30 });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('totalExpiring');
    });
    
    test('Should retrieve points statistics', async () => {
      const response = await request(app)
        .get('/api/loyalty-referral/points/statistics');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.statistics).toHaveProperty('totalPointsIssued');
      expect(response.body.statistics).toHaveProperty('totalPointsRedeemed');
    });
  });
  
  // ============================================================================
  // TIER MANAGEMENT TESTS (5 tests)
  // ============================================================================
  
  describe('Tier & VIP Management Engine', () => {
    test('Should create tier level', async () => {
      const response = await request(app)
        .post('/api/loyalty-referral/tiers')
        .send({
          name: 'Gold',
          level: 3,
          color: '#ffd700',
          requirements: {
            type: 'points',
            threshold: 5000,
            period: 'lifetime',
          },
          pointsMultiplier: 1.5,
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.tier.name).toBe('Gold');
      expect(response.body.tier.level).toBe(3);
    });
    
    test('Should calculate tier progression', async () => {
      const response = await request(app)
        .get('/api/loyalty-referral/customers/customer_123/tier-progress')
        .send({
          customerData: {
            lifetimePoints: 3000,
            currentTier: 'bronze',
          },
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.progress).toHaveProperty('currentTier');
      expect(response.body.progress).toHaveProperty('nextTier');
    });
    
    test('Should check and perform tier upgrade', async () => {
      const response = await request(app)
        .post('/api/loyalty-referral/customers/customer_123/check-upgrade')
        .send({
          customerData: {
            lifetimePoints: 6000,
          },
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('Should retrieve tier benefits', async () => {
      const tierResponse = await request(app).get('/api/loyalty-referral/tiers');
      const tierId = tierResponse.body.tiers?.[0]?.id;
      
      if (tierId) {
        const response = await request(app)
          .get(`/api/loyalty-referral/tiers/${tierId}/benefits`);
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });
    
    test('Should retrieve tier history', async () => {
      const response = await request(app)
        .get('/api/loyalty-referral/customers/customer_123/tier-history');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('history');
    });
  });
  
  // ============================================================================
  // REFERRAL PROGRAM TESTS (5 tests)
  // ============================================================================
  
  describe('Referral Program Engine', () => {
    test('Should create referral code', async () => {
      const response = await request(app)
        .post('/api/loyalty-referral/referrals/codes')
        .send({
          customerId: 'customer_123',
          maxUses: 10,
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.code).toHaveProperty('code');
    });
    
    test('Should track referral click', async () => {
      const codeResponse = await request(app)
        .post('/api/loyalty-referral/referrals/codes')
        .send({ customerId: 'customer_123' });
      
      const code = codeResponse.body.code.code;
      
      const response = await request(app)
        .post(`/api/loyalty-referral/referrals/codes/${code}/track-click`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('Should create and qualify referral', async () => {
      const codeResponse = await request(app)
        .post('/api/loyalty-referral/referrals/codes')
        .send({ customerId: 'customer_123' });
      
      const code = codeResponse.body.code.code;
      
      const referralResponse = await request(app)
        .post('/api/loyalty-referral/referrals')
        .send({
          referralCode: code,
          referredCustomerId: 'customer_789',
          referredEmail: 'referred@example.com',
        });
      
      const referralId = referralResponse.body.referral.id;
      
      const response = await request(app)
        .post(`/api/loyalty-referral/referrals/${referralId}/qualify`)
        .send({
          purchaseData: { amount: 100 },
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.referral.status).toBe('qualified');
    });
    
    test('Should generate share links', async () => {
      const response = await request(app)
        .post('/api/loyalty-referral/referrals/share-links')
        .send({
          referralCode: 'TEST1234',
          baseUrl: 'https://example.com',
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.links).toHaveProperty('email');
      expect(response.body.links).toHaveProperty('facebook');
      expect(response.body.links).toHaveProperty('twitter');
    });
    
    test('Should retrieve referral analytics', async () => {
      const response = await request(app)
        .get('/api/loyalty-referral/referral-analytics');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toHaveProperty('overview');
    });
  });
  
  // ============================================================================
  // GAMIFICATION TESTS (6 tests)
  // ============================================================================
  
  describe('Gamification & Challenges Engine', () => {
    test('Should award badge to customer', async () => {
      const badgeResponse = await request(app)
        .post('/api/loyalty-referral/badges')
        .send({
          name: 'First Purchase',
          description: 'Made first purchase',
          category: 'purchase',
        });
      
      const badgeId = badgeResponse.body.badge.id;
      
      const response = await request(app)
        .post('/api/loyalty-referral/customers/customer_123/award-badge')
        .send({ badgeId });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('Should create and join challenge', async () => {
      const challengeResponse = await request(app)
        .post('/api/loyalty-referral/challenges')
        .send({
          name: 'Weekly Warrior',
          type: 'weekly',
          goal: { action: 'purchase', target: 5 },
          rewards: { points: 500 },
        });
      
      const challengeId = challengeResponse.body.challenge.id;
      
      const response = await request(app)
        .post('/api/loyalty-referral/customers/customer_123/join-challenge')
        .send({ challengeId });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.joined).toBe(true);
    });
    
    test('Should track challenge progress', async () => {
      const challengeResponse = await request(app)
        .post('/api/loyalty-referral/challenges')
        .send({
          name: 'Test Challenge',
          type: 'daily',
          goal: { action: 'purchase', target: 10 },
          rewards: { points: 100 },
        });
      
      const challengeId = challengeResponse.body.challenge.id;
      
      await request(app)
        .post('/api/loyalty-referral/customers/customer_123/join-challenge')
        .send({ challengeId });
      
      const response = await request(app)
        .post('/api/loyalty-referral/customers/customer_123/challenge-progress')
        .send({ challengeId, increment: 3 });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('Should track customer streak', async () => {
      const response = await request(app)
        .post('/api/loyalty-referral/customers/customer_123/track-streak')
        .send({ action: 'login' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.streak).toHaveProperty('current');
      expect(response.body.streak).toHaveProperty('longest');
    });
    
    test('Should retrieve leaderboard', async () => {
      const response = await request(app)
        .get('/api/loyalty-referral/leaderboard')
        .query({ metric: 'points', limit: 10 });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('leaders');
    });
    
    test('Should retrieve gamification statistics', async () => {
      const response = await request(app)
        .get('/api/loyalty-referral/gamification-statistics');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.statistics).toHaveProperty('challenges');
      expect(response.body.statistics).toHaveProperty('achievements');
      expect(response.body.statistics).toHaveProperty('badges');
    });
  });
  
  // ============================================================================
  // AUTOMATION TESTS (5 tests)
  // ============================================================================
  
  describe('Campaign Automation Engine', () => {
    test('Should create automated campaign', async () => {
      const response = await request(app)
        .post('/api/loyalty-referral/automation/campaigns')
        .send({
          name: 'Welcome Campaign',
          type: 'welcome',
          trigger: 'customer.signup',
          actions: [
            { type: 'award_points', config: { points: 100 } },
            { type: 'send_email', config: { template: 'welcome' } },
          ],
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.campaign).toHaveProperty('id');
    });
    
    test('Should create and fire trigger', async () => {
      const triggerResponse = await request(app)
        .post('/api/loyalty-referral/automation/triggers')
        .send({
          name: 'Tier Upgrade',
          event: 'tier.upgraded',
          actions: [
            { type: 'send_notification', config: { message: 'Congrats!' } },
          ],
        });
      
      expect(triggerResponse.status).toBe(200);
      
      const response = await request(app)
        .post('/api/loyalty-referral/automation/triggers/fire')
        .send({
          event: 'tier.upgraded',
          eventData: { customerId: 'customer_123' },
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('Should execute workflow', async () => {
      const workflowResponse = await request(app)
        .post('/api/loyalty-referral/automation/workflows')
        .send({
          name: 'Onboarding Flow',
          steps: [
            { id: 1, type: 'action', action: { type: 'award_points' } },
            { id: 2, type: 'delay', delay: 86400 },
            { id: 3, type: 'action', action: { type: 'send_email' } },
          ],
        });
      
      const workflowId = workflowResponse.body.workflow.id;
      
      const response = await request(app)
        .post(`/api/loyalty-referral/automation/workflows/${workflowId}/execute`)
        .send({ context: { customerId: 'customer_123' } });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('Should schedule action', async () => {
      const response = await request(app)
        .post('/api/loyalty-referral/automation/schedule-action')
        .send({
          type: 'award_points',
          config: { points: 50 },
          scheduledFor: new Date(Date.now() + 86400000).toISOString(),
          customerId: 'customer_123',
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.action.status).toBe('scheduled');
    });
    
    test('Should retrieve automation statistics', async () => {
      const response = await request(app)
        .get('/api/loyalty-referral/automation/statistics');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.statistics).toHaveProperty('campaigns');
      expect(response.body.statistics).toHaveProperty('triggers');
    });
  });
  
  // ============================================================================
  // MEMBER PORTAL TESTS (6 tests)
  // ============================================================================
  
  describe('Member Portal Engine', () => {
    test('Should retrieve customer dashboard', async () => {
      const response = await request(app)
        .get('/api/loyalty-referral/portal/customer_123/dashboard');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.dashboard).toHaveProperty('overview');
      expect(response.body.dashboard).toHaveProperty('quickActions');
    });
    
    test('Should retrieve activity feed', async () => {
      const response = await request(app)
        .get('/api/loyalty-referral/portal/customer_123/activity')
        .query({ limit: 20 });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('activities');
    });
    
    test('Should update customer preferences', async () => {
      const response = await request(app)
        .put('/api/loyalty-referral/portal/customer_123/preferences')
        .send({
          notifications: {
            email: { pointsEarned: true },
          },
          display: {
            theme: 'dark',
          },
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.preferences).toHaveProperty('notifications');
    });
    
    test('Should save and unsave rewards', async () => {
      const saveResponse = await request(app)
        .post('/api/loyalty-referral/portal/customer_123/save-reward')
        .send({ rewardId: 'reward_123' });
      
      expect(saveResponse.status).toBe(200);
      expect(saveResponse.body.success).toBe(true);
      
      const unsaveResponse = await request(app)
        .delete('/api/loyalty-referral/portal/customer_123/save-reward/reward_123');
      
      expect(unsaveResponse.status).toBe(200);
      expect(unsaveResponse.body.success).toBe(true);
    });
    
    test('Should create and read notification', async () => {
      const createResponse = await request(app)
        .post('/api/loyalty-referral/portal/customer_123/notifications')
        .send({
          type: 'points_earned',
          title: 'Points Earned',
          message: 'You earned 100 points!',
        });
      
      expect(createResponse.status).toBe(200);
      const notificationId = createResponse.body.notification.id;
      
      const readResponse = await request(app)
        .post(`/api/loyalty-referral/portal/customer_123/notifications/${notificationId}/read`);
      
      expect(readResponse.status).toBe(200);
      expect(readResponse.body.success).toBe(true);
    });
    
    test('Should retrieve portal statistics', async () => {
      const response = await request(app)
        .get('/api/loyalty-referral/portal-statistics');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.statistics).toHaveProperty('totalCustomers');
    });
  });
  
  // ============================================================================
  // ANALYTICS TESTS (6 tests)
  // ============================================================================
  
  describe('Analytics & Reporting Engine', () => {
    test('Should track custom metric', async () => {
      const response = await request(app)
        .post('/api/loyalty-referral/analytics/track-event')
        .send({
          category: 'points',
          name: 'points_awarded',
          value: 100,
          metadata: { customerId: 'customer_123' },
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.metric).toHaveProperty('id');
    });
    
    test('Should retrieve overview metrics', async () => {
      const response = await request(app)
        .get('/api/loyalty-referral/analytics/overview')
        .query({ period: 'all' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.overview).toHaveProperty('points');
      expect(response.body.overview).toHaveProperty('tiers');
    });
    
    test('Should create and generate report', async () => {
      const createResponse = await request(app)
        .post('/api/loyalty-referral/analytics/reports')
        .send({
          name: 'Monthly Summary',
          type: 'executive_summary',
          schedule: 'monthly',
        });
      
      expect(createResponse.status).toBe(200);
      const reportId = createResponse.body.report.id;
      
      const generateResponse = await request(app)
        .post(`/api/loyalty-referral/analytics/reports/${reportId}/generate`);
      
      expect(generateResponse.status).toBe(200);
      expect(generateResponse.body.success).toBe(true);
    });
    
    test('Should create dashboard', async () => {
      const response = await request(app)
        .post('/api/loyalty-referral/analytics/dashboards')
        .send({
          name: 'Executive Dashboard',
          widgets: [
            { type: 'points_flow', config: {} },
            { type: 'tier_distribution', config: {} },
          ],
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.dashboard).toHaveProperty('id');
    });
    
    test('Should perform cohort analysis', async () => {
      const response = await request(app)
        .post('/api/loyalty-referral/analytics/cohort-analysis')
        .send({
          segmentBy: 'tier',
          metrics: ['lifetime_value', 'order_frequency'],
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.analysis).toHaveProperty('cohorts');
    });
    
    test('Should calculate ROI', async () => {
      const response = await request(app)
        .post('/api/loyalty-referral/analytics/roi-calculation')
        .send({
          programCosts: 10000,
          revenue: 50000,
          period: '2024-Q1',
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.roi).toHaveProperty('roi');
      expect(response.body.roi).toHaveProperty('profit');
    });
  });
  
  // ============================================================================
  // INTEGRATIONS TESTS (6 tests)
  // ============================================================================
  
  describe('Integration Engine', () => {
    test('Should list available integrations', async () => {
      const response = await request(app)
        .get('/api/loyalty-referral/integrations/available');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.integrations).toBeInstanceOf(Array);
    });
    
    test('Should connect integration', async () => {
      const response = await request(app)
        .post('/api/loyalty-referral/integrations/connect')
        .send({
          platform: 'shopify',
          name: 'My Store',
          credentials: { apiKey: 'test_key' },
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.integration.platform).toBe('shopify');
    });
    
    test('Should sync Shopify data', async () => {
      const connectResponse = await request(app)
        .post('/api/loyalty-referral/integrations/connect')
        .send({ platform: 'shopify', credentials: {} });
      
      const integrationId = connectResponse.body.integration.id;
      
      const response = await request(app)
        .post('/api/loyalty-referral/integrations/shopify/sync')
        .send({ integrationId, syncType: 'orders' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
    
    test('Should create and manage webhook', async () => {
      const createResponse = await request(app)
        .post('/api/loyalty-referral/integrations/webhooks')
        .send({
          url: 'https://example.com/webhook',
          events: ['points.earned', 'tier.upgraded'],
        });
      
      expect(createResponse.status).toBe(200);
      const webhookId = createResponse.body.webhook.id;
      
      const updateResponse = await request(app)
        .put(`/api/loyalty-referral/integrations/webhooks/${webhookId}`)
        .send({ enabled: false });
      
      expect(updateResponse.status).toBe(200);
      
      const deleteResponse = await request(app)
        .delete(`/api/loyalty-referral/integrations/webhooks/${webhookId}`);
      
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
    });
    
    test('Should import/export data', async () => {
      const importResponse = await request(app)
        .post('/api/loyalty-referral/integrations/import')
        .send({
          type: 'customers',
          records: [{ id: 1, email: 'test@example.com' }],
        });
      
      expect(importResponse.status).toBe(200);
      
      const exportResponse = await request(app)
        .post('/api/loyalty-referral/integrations/export')
        .send({ type: 'points', format: 'csv' });
      
      expect(exportResponse.status).toBe(200);
      expect(exportResponse.body.success).toBe(true);
    });
    
    test('Should retrieve integration statistics', async () => {
      const response = await request(app)
        .get('/api/loyalty-referral/integrations/statistics');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.statistics).toHaveProperty('integrations');
      expect(response.body.statistics).toHaveProperty('webhooks');
    });
  });
  
  // ============================================================================
  // SYSTEM TESTS (2 tests)
  // ============================================================================
  
  describe('System Endpoints', () => {
    test('Should return health check', async () => {
      const response = await request(app)
        .get('/api/loyalty-referral/health');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('healthy');
      expect(response.body.services).toHaveProperty('points');
      expect(response.body.services).toHaveProperty('tiers');
    });
    
    test('Should return aggregated statistics', async () => {
      const response = await request(app)
        .get('/api/loyalty-referral/statistics');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.statistics).toHaveProperty('points');
      expect(response.body.statistics).toHaveProperty('tiers');
      expect(response.body.statistics).toHaveProperty('referrals');
      expect(response.body.statistics).toHaveProperty('gamification');
      expect(response.body.statistics).toHaveProperty('automation');
      expect(response.body.statistics).toHaveProperty('portal');
      expect(response.body.statistics).toHaveProperty('analytics');
      expect(response.body.statistics).toHaveProperty('integrations');
    });
  });
  
  // ============================================================================
  // E2E LOYALTY JOURNEY TEST (1 test)
  // ============================================================================
  
  describe('E2E Loyalty Journey', () => {
    test('Complete loyalty program workflow', async () => {
      const customerId = 'journey_customer_' + Date.now();
      
      // 1. Customer earns points from purchase
      const earnResponse = await request(app)
        .post('/api/loyalty-referral/points/award')
        .send({ customerId, points: 1000, reason: 'Purchase' });
      expect(earnResponse.status).toBe(200);
      
      // 2. Check tier upgrade eligibility
      const upgradeCheck = await request(app)
        .post(`/api/loyalty-referral/customers/${customerId}/check-upgrade`)
        .send({ customerData: { lifetimePoints: 1000 } });
      expect(upgradeCheck.status).toBe(200);
      
      // 3. Redeem a reward
      const rewardResponse = await request(app)
        .post('/api/loyalty-referral/rewards')
        .send({ name: 'Test Reward', pointsCost: 500, type: 'discount', value: 10 });
      const rewardId = rewardResponse.body.reward.id;
      
      const redeemResponse = await request(app)
        .post(`/api/loyalty-referral/rewards/${rewardId}/redeem`)
        .send({ customerId, quantity: 1 });
      expect(redeemResponse.status).toBe(200);
      
      // 4. Create referral code
      const codeResponse = await request(app)
        .post('/api/loyalty-referral/referrals/codes')
        .send({ customerId });
      expect(codeResponse.status).toBe(200);
      const referralCode = codeResponse.body.code.code;
      
      // 5. Friend uses referral
      const friendId = 'friend_' + Date.now();
      const referralResponse = await request(app)
        .post('/api/loyalty-referral/referrals')
        .send({ referralCode, referredCustomerId: friendId });
      expect(referralResponse.status).toBe(200);
      
      // 6. Qualify referral
      const qualifyResponse = await request(app)
        .post(`/api/loyalty-referral/referrals/${referralResponse.body.referral.id}/qualify`)
        .send({ purchaseData: { amount: 100 } });
      expect(qualifyResponse.status).toBe(200);
      
      // 7. Join and complete challenge
      const challengeResponse = await request(app)
        .post('/api/loyalty-referral/challenges')
        .send({ name: 'Test', type: 'daily', goal: { action: 'purchase', target: 1 }, rewards: { points: 50 } });
      const challengeId = challengeResponse.body.challenge.id;
      
      await request(app)
        .post(`/api/loyalty-referral/customers/${customerId}/join-challenge`)
        .send({ challengeId });
      
      const completeResponse = await request(app)
        .post(`/api/loyalty-referral/challenges/${challengeId}/complete`)
        .send({ customerId });
      expect(completeResponse.status).toBe(200);
      
      // 8. Unlock badge
      const badgeResponse = await request(app)
        .post('/api/loyalty-referral/badges')
        .send({ name: 'Achiever', category: 'general' });
      const badgeId = badgeResponse.body.badge.id;
      
      const unlockResponse = await request(app)
        .post(`/api/loyalty-referral/customers/${customerId}/award-badge`)
        .send({ badgeId });
      expect(unlockResponse.status).toBe(200);
      
      // Verify journey completion
      const statsResponse = await request(app)
        .get('/api/loyalty-referral/statistics');
      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.success).toBe(true);
    });
  });
});
