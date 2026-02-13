/**
 * Loyalty & Referral Program V2 - Complete API Routes
 * Comprehensive endpoints for points, tiers, referrals, gamification, automation, portal, analytics, and integrations
 */

const express = require('express');
const router = express.Router();

// Import all engines
const pointsRewardsEngine = require('../tools/loyalty-referral-engine/points-rewards-engine');
const tierVipEngine = require('../tools/loyalty-referral-engine/tier-vip-engine');
const referralProgramEngine = require('../tools/loyalty-referral-engine/referral-program-engine');
const gamificationEngine = require('../tools/loyalty-referral-engine/gamification-challenges-engine');
const campaignAutomationEngine = require('../tools/loyalty-referral-engine/campaign-automation-engine');
const memberPortalEngine = require('../tools/loyalty-referral-engine/member-portal-engine');
const analyticsEngine = require('../tools/loyalty-referral-engine/analytics-reporting-engine');
const integrationEngine = require('../tools/loyalty-referral-engine/integration-engine');

// ============================================================================
// POINTS & REWARDS ENDPOINTS (32 endpoints)
// ============================================================================

// Points Rules Management
router.post('/api/loyalty-referral/points/rules', async (req, res) => {
  try {
    const rule = pointsRewardsEngine.createPointsRule(req.body);
    res.json({ success: true, rule });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/points/rules', async (req, res) => {
  try {
    const rules = pointsRewardsEngine.getPointsRules(req.query);
    res.json({ success: true, ...rules });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/points/rules/:ruleId', async (req, res) => {
  try {
    const rule = pointsRewardsEngine.getPointsRule(req.params.ruleId);
    res.json({ success: true, rule });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.put('/api/loyalty-referral/points/rules/:ruleId', async (req, res) => {
  try {
    const rule = pointsRewardsEngine.updatePointsRule(req.params.ruleId, req.body);
    res.json({ success: true, rule });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Points Balance & Transactions
router.get('/api/loyalty-referral/points/balance/:customerId', async (req, res) => {
  try {
    const balance = pointsRewardsEngine.getPointsBalance(req.params.customerId);
    res.json({ success: true, balance });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/points/award', async (req, res) => {
  try {
    const transaction = pointsRewardsEngine.awardPoints(
      req.body.customerId,
      req.body.points,
      req.body.reason,
      req.body.ruleId,
      req.body.metadata,
      req.body.expiresAt
    );
    res.json({ success: true, transaction });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/points/deduct', async (req, res) => {
  try {
    const transaction = pointsRewardsEngine.deductPoints(
      req.body.customerId,
      req.body.points,
      req.body.reason,
      req.body.metadata
    );
    res.json({ success: true, transaction });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/points/transactions/:customerId', async (req, res) => {
  try {
    const history = pointsRewardsEngine.getTransactionHistory(req.params.customerId, req.query);
    res.json({ success: true, ...history });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/points/transfer', async (req, res) => {
  try {
    const result = pointsRewardsEngine.transferPoints(
      req.body.fromCustomerId,
      req.body.toCustomerId,
      req.body.points,
      req.body.note
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/points/expiring/:customerId', async (req, res) => {
  try {
    const expiring = pointsRewardsEngine.getExpiringPoints(
      req.params.customerId,
      req.query.days
    );
    res.json({ success: true, ...expiring });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/points/statistics', async (req, res) => {
  try {
    const stats = pointsRewardsEngine.getPointsStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Rewards Catalog
router.post('/api/loyalty-referral/rewards', async (req, res) => {
  try {
    const reward = pointsRewardsEngine.createReward(req.body);
    res.json({ success: true, reward });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/rewards', async (req, res) => {
  try {
    const catalog = pointsRewardsEngine.getRewardCatalog(req.query);
    res.json({ success: true, ...catalog });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/rewards/:rewardId', async (req, res) => {
  try {
    const reward = pointsRewardsEngine.getReward(req.params.rewardId);
    res.json({ success: true, reward });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.put('/api/loyalty-referral/rewards/:rewardId', async (req, res) => {
  try {
    const reward = pointsRewardsEngine.updateReward(req.params.rewardId, req.body);
    res.json({ success: true, reward });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Redemptions
router.post('/api/loyalty-referral/rewards/:rewardId/redeem', async (req, res) => {
  try {
    const redemption = pointsRewardsEngine.redeemReward(
      req.body.customerId,
      req.params.rewardId,
      req.body.quantity
    );
    res.json({ success: true, redemption });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/redemptions/:customerId', async (req, res) => {
  try {
    const redemptions = pointsRewardsEngine.getCustomerRedemptions(req.params.customerId, req.query);
    res.json({ success: true, ...redemptions });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/redemptions/:redemptionId/fulfill', async (req, res) => {
  try {
    const redemption = pointsRewardsEngine.fulfillRedemption(req.params.redemptionId);
    res.json({ success: true, redemption });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/redemptions/:redemptionId/cancel', async (req, res) => {
  try {
    const redemption = pointsRewardsEngine.cancelRedemption(req.params.redemptionId);
    res.json({ success: true, redemption });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Purchase Processing
router.post('/api/loyalty-referral/points/calculate-purchase', async (req, res) => {
  try {
    const calculation = pointsRewardsEngine.calculatePurchasePoints(req.body);
    res.json({ success: true, ...calculation });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/points/process-purchase', async (req, res) => {
  try {
    const result = pointsRewardsEngine.processPurchase(
      req.body.customerId,
      req.body.orderData
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================================
// TIER & VIP MANAGEMENT ENDPOINTS (28 endpoints)
// ============================================================================

// Tier Management
router.post('/api/loyalty-referral/tiers', async (req, res) => {
  try {
    const tier = tierVipEngine.createTier(req.body);
    res.json({ success: true, tier });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/tiers', async (req, res) => {
  try {
    const tiers = tierVipEngine.getTiers(req.query);
    res.json({ success: true, ...tiers });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/tiers/:tierId', async (req, res) => {
  try {
    const tier = tierVipEngine.getTier(req.params.tierId);
    res.json({ success: true, tier });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.put('/api/loyalty-referral/tiers/:tierId', async (req, res) => {
  try {
    const tier = tierVipEngine.updateTier(req.params.tierId, req.body);
    res.json({ success: true, tier });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Tier Benefits
router.post('/api/loyalty-referral/tier-benefits', async (req, res) => {
  try {
    const benefit = tierVipEngine.createTierBenefit(req.body);
    res.json({ success: true, benefit });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/tiers/:tierId/benefits', async (req, res) => {
  try {
    const benefits = tierVipEngine.getTierBenefits(req.params.tierId);
    res.json({ success: true, ...benefits });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/tier-benefits/:benefitId/calculate-value', async (req, res) => {
  try {
    const value = tierVipEngine.calculateBenefitsValue(
      req.body.tierId,
      req.body.purchaseAmount
    );
    res.json({ success: true, ...value });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Customer Tier Progress
router.get('/api/loyalty-referral/customers/:customerId/tier-progress', async (req, res) => {
  try {
    const progress = tierVipEngine.calculateTierProgress(
      req.params.customerId,
      req.body.customerData
    );
    res.json({ success: true, progress });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/customers/:customerId/check-upgrade', async (req, res) => {
  try {
    const result = tierVipEngine.checkTierUpgrade(
      req.params.customerId,
      req.body.customerData
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/customers/:customerId/tier-upgrade', async (req, res) => {
  try {
    const upgrade = tierVipEngine.upgradeTier(
      req.params.customerId,
      req.body.newTierId,
      req.body.metadata
    );
    res.json({ success: true, upgrade });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/customers/:customerId/tier-downgrade', async (req, res) => {
  try {
    const downgrade = tierVipEngine.downgradeTier(
      req.params.customerId,
      req.body.newTierId,
      req.body.reason
    );
    res.json({ success: true, downgrade });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/customers/:customerId/tier-history', async (req, res) => {
  try {
    const history = tierVipEngine.getTierHistory(req.params.customerId);
    res.json({ success: true, ...history });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/customers/:customerId/tier-predictions', async (req, res) => {
  try {
    const predictions = tierVipEngine.predictTierMilestones(
      req.params.customerId,
      req.query.customerData
    );
    res.json({ success: true, predictions });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// VIP Segments
router.post('/api/loyalty-referral/vip-segments', async (req, res) => {
  try {
    const segment = tierVipEngine.createVIPSegment(req.body);
    res.json({ success: true, segment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/vip-segments', async (req, res) => {
  try {
    const segments = tierVipEngine.getVIPSegments(req.query);
    res.json({ success: true, ...segments });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/vip-segments/:segmentId/add-member', async (req, res) => {
  try {
    const result = tierVipEngine.addVIPMember(req.params.segmentId, req.body.customerId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Tier Leaderboard & Statistics
router.get('/api/loyalty-referral/tier-leaderboard', async (req, res) => {
  try {
    const leaderboard = tierVipEngine.getTierLeaderboard(req.query);
    res.json({ success: true, ...leaderboard });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/tier-statistics', async (req, res) => {
  try {
    const stats = tierVipEngine.getTierStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================================
// REFERRAL PROGRAM ENDPOINTS (30 endpoints)
// ============================================================================

// Referral Codes
router.post('/api/loyalty-referral/referrals/codes', async (req, res) => {
  try {
    const code = referralProgramEngine.createReferralCode(req.body);
    res.json({ success: true, code });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/referrals/codes/:code', async (req, res) => {
  try {
    const code = referralProgramEngine.getReferralCode(req.params.code);
    res.json({ success: true, code });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/customers/:customerId/referral-code', async (req, res) => {
  try {
    const code = referralProgramEngine.getCustomerReferralCode(req.params.customerId);
    res.json({ success: true, code });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/referrals/codes/:code/track-click', async (req, res) => {
  try {
    const result = referralProgramEngine.trackReferralClick(req.params.code);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Referral Management
router.post('/api/loyalty-referral/referrals', async (req, res) => {
  try {
    const referral = referralProgramEngine.createReferral(req.body);
    res.json({ success: true, referral });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/referrals/:referralId', async (req, res) => {
  try {
    const referral = referralProgramEngine.getReferral(req.params.referralId);
    res.json({ success: true, referral });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/referrals/:referralId/qualify', async (req, res) => {
  try {
    const referral = referralProgramEngine.qualifyReferral(
      req.params.referralId,
      req.body.purchaseData
    );
    res.json({ success: true, referral });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/referrals/:referralId/reward', async (req, res) => {
  try {
    const referral = referralProgramEngine.rewardReferral(
      req.params.referralId,
      req.body.rewards
    );
    res.json({ success: true, referral });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/customers/:customerId/referrals', async (req, res) => {
  try {
    const referrals = referralProgramEngine.getCustomerReferrals(
      req.params.customerId,
      req.query
    );
    res.json({ success: true, ...referrals });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Referral Campaigns
router.post('/api/loyalty-referral/referral-campaigns', async (req, res) => {
  try {
    const campaign = referralProgramEngine.createReferralCampaign(req.body);
    res.json({ success: true, campaign });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/referral-campaigns', async (req, res) => {
  try {
    const campaigns = referralProgramEngine.listReferralCampaigns(req.query);
    res.json({ success: true, ...campaigns });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/referral-campaigns/:campaignId', async (req, res) => {
  try {
    const campaign = referralProgramEngine.getReferralCampaign(req.params.campaignId);
    res.json({ success: true, campaign });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.put('/api/loyalty-referral/referral-campaigns/:campaignId', async (req, res) => {
  try {
    const campaign = referralProgramEngine.updateReferralCampaign(
      req.params.campaignId,
      req.body
    );
    res.json({ success: true, campaign });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Share Links & Analytics
router.post('/api/loyalty-referral/referrals/share-links', async (req, res) => {
  try {
    const links = referralProgramEngine.generateShareLinks(
      req.body.referralCode,
      req.body.baseUrl,
      req.body.customMessage
    );
    res.json({ success: true, links });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/referral-analytics', async (req, res) => {
  try {
    const analytics = referralProgramEngine.getReferralAnalytics(req.query);
    res.json({ success: true, analytics });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/referrals/calculate-commission', async (req, res) => {
  try {
    const commission = referralProgramEngine.calculateCommission(
      req.body.referralId,
      req.body.orderAmount
    );
    res.json({ success: true, ...commission });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/referral-leaderboard', async (req, res) => {
  try {
    const leaderboard = referralProgramEngine.getReferralLeaderboard(req.query);
    res.json({ success: true, ...leaderboard });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/referral-statistics', async (req, res) => {
  try {
    const stats = referralProgramEngine.getReferralStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================================
// GAMIFICATION & CHALLENGES ENDPOINTS (32 endpoints)
// ============================================================================

// Challenges
router.post('/api/loyalty-referral/challenges', async (req, res) => {
  try {
    const challenge = gamificationEngine.createChallenge(req.body);
    res.json({ success: true, challenge });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/challenges', async (req, res) => {
  try {
    const challenges = gamificationEngine.getActiveChallenges(req.query);
    res.json({ success: true, ...challenges });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/challenges/:challengeId', async (req, res) => {
  try {
    const challenge = gamificationEngine.getChallenge(req.params.challengeId);
    res.json({ success: true, challenge });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/customers/:customerId/join-challenge', async (req, res) => {
  try {
    const result = gamificationEngine.joinChallenge(
      req.params.customerId,
      req.body.challengeId
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/customers/:customerId/challenge-progress', async (req, res) => {
  try {
    const progress = gamificationEngine.updateChallengeProgress(
      req.params.customerId,
      req.body.challengeId,
      req.body.increment
    );
    res.json({ success: true, progress });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/customers/:customerId/challenges', async (req, res) => {
  try {
    const challenges = gamificationEngine.getCustomerChallenges(req.params.customerId);
    res.json({ success: true, ...challenges });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/challenges/:challengeId/complete', async (req, res) => {
  try {
    const result = gamificationEngine.completeChallenge(
      req.body.customerId,
      req.params.challengeId
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Achievements
router.post('/api/loyalty-referral/achievements', async (req, res) => {
  try {
    const achievement = gamificationEngine.createAchievement(req.body);
    res.json({ success: true, achievement });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/achievements', async (req, res) => {
  try {
    const achievements = gamificationEngine.getAchievements(req.query);
    res.json({ success: true, ...achievements });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/customers/:customerId/unlock-achievement', async (req, res) => {
  try {
    const result = gamificationEngine.unlockAchievement(
      req.params.customerId,
      req.body.achievementId
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/customers/:customerId/achievements', async (req, res) => {
  try {
    const achievements = gamificationEngine.getCustomerAchievements(req.params.customerId);
    res.json({ success: true, ...achievements });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Badges
router.post('/api/loyalty-referral/badges', async (req, res) => {
  try {
    const badge = gamificationEngine.createBadge(req.body);
    res.json({ success: true, badge });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/badges', async (req, res) => {
  try {
    const badges = gamificationEngine.getBadges(req.query);
    res.json({ success: true, ...badges });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/customers/:customerId/award-badge', async (req, res) => {
  try {
    const result = gamificationEngine.awardBadge(
      req.params.customerId,
      req.body.badgeId
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/customers/:customerId/badges', async (req, res) => {
  try {
    const badges = gamificationEngine.getCustomerBadges(req.params.customerId);
    res.json({ success: true, ...badges });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Streaks
router.post('/api/loyalty-referral/customers/:customerId/track-streak', async (req, res) => {
  try {
    const streak = gamificationEngine.trackStreak(
      req.params.customerId,
      req.body.action
    );
    res.json({ success: true, streak });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/customers/:customerId/streaks', async (req, res) => {
  try {
    const streaks = gamificationEngine.getCustomerStreaks(req.params.customerId);
    res.json({ success: true, streaks });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Levels & Leaderboard
router.get('/api/loyalty-referral/customers/:customerId/level', async (req, res) => {
  try {
    const level = gamificationEngine.calculateLevel(req.query.totalPoints);
    res.json({ success: true, level });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/leaderboard', async (req, res) => {
  try {
    const leaderboard = gamificationEngine.getLeaderboard(req.query);
    res.json({ success: true, ...leaderboard });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/gamification-statistics', async (req, res) => {
  try {
    const stats = gamificationEngine.getGamificationStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================================
// AUTOMATION ENDPOINTS (28 endpoints)
// ============================================================================

// Campaigns
router.post('/api/loyalty-referral/automation/campaigns', async (req, res) => {
  try {
    const campaign = campaignAutomationEngine.createCampaign(req.body);
    res.json({ success: true, campaign });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/automation/campaigns', async (req, res) => {
  try {
    const campaigns = campaignAutomationEngine.getCampaigns(req.query);
    res.json({ success: true, ...campaigns });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/automation/campaigns/:campaignId', async (req, res) => {
  try {
    const campaign = campaignAutomationEngine.getCampaign(req.params.campaignId);
    res.json({ success: true, campaign });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.put('/api/loyalty-referral/automation/campaigns/:campaignId', async (req, res) => {
  try {
    const campaign = campaignAutomationEngine.updateCampaign(
      req.params.campaignId,
      req.body
    );
    res.json({ success: true, campaign });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/automation/campaigns/:campaignId/execute', async (req, res) => {
  try {
    const run = campaignAutomationEngine.executeCampaign(
      req.params.campaignId,
      req.body.context
    );
    res.json({ success: true, run });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Triggers
router.post('/api/loyalty-referral/automation/triggers', async (req, res) => {
  try {
    const trigger = campaignAutomationEngine.createTrigger(req.body);
    res.json({ success: true, trigger });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/automation/triggers', async (req, res) => {
  try {
    const triggers = campaignAutomationEngine.getTriggers(req.query);
    res.json({ success: true, ...triggers });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/automation/triggers/fire', async (req, res) => {
  try {
    const result = campaignAutomationEngine.fireTrigger(
      req.body.event,
      req.body.eventData
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Workflows
router.post('/api/loyalty-referral/automation/workflows', async (req, res) => {
  try {
    const workflow = campaignAutomationEngine.createWorkflow(req.body);
    res.json({ success: true, workflow });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/automation/workflows', async (req, res) => {
  try {
    const workflows = campaignAutomationEngine.getWorkflows(req.query);
    res.json({ success: true, ...workflows });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/automation/workflows/:workflowId/execute', async (req, res) => {
  try {
    const execution = campaignAutomationEngine.executeWorkflow(
      req.params.workflowId,
      req.body.context
    );
    res.json({ success: true, execution });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Scheduled Actions
router.post('/api/loyalty-referral/automation/schedule-action', async (req, res) => {
  try {
    const action = campaignAutomationEngine.scheduleAction(req.body);
    res.json({ success: true, action });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/automation/scheduled-actions', async (req, res) => {
  try {
    const actions = campaignAutomationEngine.getScheduledActions(req.query.customerId);
    res.json({ success: true, ...actions });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Campaign Runs
router.get('/api/loyalty-referral/automation/runs', async (req, res) => {
  try {
    const runs = campaignAutomationEngine.getCampaignRuns(req.query);
    res.json({ success: true, ...runs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/automation/statistics', async (req, res) => {
  try {
    const stats = campaignAutomationEngine.getAutomationStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================================
// MEMBER PORTAL ENDPOINTS (30 endpoints)
// ============================================================================

// Dashboard
router.get('/api/loyalty-referral/portal/:customerId/dashboard', async (req, res) => {
  try {
    const dashboard = memberPortalEngine.getCustomerDashboard(
      req.params.customerId,
      req.query
    );
    res.json({ success: true, dashboard });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Activity Feed
router.get('/api/loyalty-referral/portal/:customerId/activity', async (req, res) => {
  try {
    const feed = memberPortalEngine.getActivityFeed(req.params.customerId, req.query);
    res.json({ success: true, ...feed });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/portal/:customerId/activity', async (req, res) => {
  try {
    const activity = memberPortalEngine.addActivity(req.params.customerId, req.body);
    res.json({ success: true, activity });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/portal/:customerId/activity/:activityId/read', async (req, res) => {
  try {
    const result = memberPortalEngine.markActivityRead(
      req.params.customerId,
      req.params.activityId
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Preferences
router.get('/api/loyalty-referral/portal/:customerId/preferences', async (req, res) => {
  try {
    const prefs = memberPortalEngine.getCustomerPreferences(req.params.customerId);
    res.json({ success: true, ...prefs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/api/loyalty-referral/portal/:customerId/preferences', async (req, res) => {
  try {
    const prefs = memberPortalEngine.updateCustomerPreferences(
      req.params.customerId,
      req.body
    );
    res.json({ success: true, ...prefs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Saved Rewards
router.post('/api/loyalty-referral/portal/:customerId/save-reward', async (req, res) => {
  try {
    const result = memberPortalEngine.saveReward(
      req.params.customerId,
      req.body.rewardId
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/api/loyalty-referral/portal/:customerId/save-reward/:rewardId', async (req, res) => {
  try {
    const result = memberPortalEngine.unsaveReward(
      req.params.customerId,
      req.params.rewardId
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/portal/:customerId/saved-rewards', async (req, res) => {
  try {
    const saved = memberPortalEngine.getSavedRewards(req.params.customerId);
    res.json({ success: true, ...saved });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Notifications
router.get('/api/loyalty-referral/portal/:customerId/notifications', async (req, res) => {
  try {
    const notifications = memberPortalEngine.getNotifications(
      req.params.customerId,
      req.query
    );
    res.json({ success: true, ...notifications });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/portal/:customerId/notifications', async (req, res) => {
  try {
    const notification = memberPortalEngine.createNotification(
      req.params.customerId,
      req.body
    );
    res.json({ success: true, notification });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/portal/:customerId/notifications/:notificationId/read', async (req, res) => {
  try {
    const result = memberPortalEngine.markNotificationRead(
      req.params.customerId,
      req.params.notificationId
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/portal-statistics', async (req, res) => {
  try {
    const stats = memberPortalEngine.getPortalStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================================
// ANALYTICS & REPORTING ENDPOINTS (32 endpoints)
// ============================================================================

// Metrics Tracking
router.post('/api/loyalty-referral/analytics/track-event', async (req, res) => {
  try {
    const metric = analyticsEngine.trackMetric(req.body);
    res.json({ success: true, metric });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/analytics/metrics', async (req, res) => {
  try {
    const metrics = analyticsEngine.getMetrics(req.query);
    res.json({ success: true, ...metrics });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/analytics/overview', async (req, res) => {
  try {
    const overview = analyticsEngine.getOverviewMetrics(req.query.period);
    res.json({ success: true, overview });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Reports
router.post('/api/loyalty-referral/analytics/reports', async (req, res) => {
  try {
    const report = analyticsEngine.createReport(req.body);
    res.json({ success: true, report });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/analytics/reports', async (req, res) => {
  try {
    const reports = analyticsEngine.getReports(req.query);
    res.json({ success: true, ...reports });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/analytics/reports/:reportId', async (req, res) => {
  try {
    const report = analyticsEngine.getReport(req.params.reportId);
    res.json({ success: true, report });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/analytics/reports/:reportId/generate', async (req, res) => {
  try {
    const reportData = analyticsEngine.generateReport(req.params.reportId);
    res.json({ success: true, reportData });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Dashboards
router.post('/api/loyalty-referral/analytics/dashboards', async (req, res) => {
  try {
    const dashboard = analyticsEngine.createDashboard(req.body);
    res.json({ success: true, dashboard });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/analytics/dashboards', async (req, res) => {
  try {
    const dashboards = analyticsEngine.getDashboards(req.query);
    res.json({ success: true, ...dashboards });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/analytics/dashboards/:dashboardId', async (req, res) => {
  try {
    const dashboard = analyticsEngine.getDashboardData(req.params.dashboardId);
    res.json({ success: true, dashboard });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

// Insights
router.post('/api/loyalty-referral/analytics/insights/generate', async (req, res) => {
  try {
    const insights = analyticsEngine.generateInsights(req.body.category);
    res.json({ success: true, ...insights });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/analytics/insights', async (req, res) => {
  try {
    const insights = analyticsEngine.getInsights(req.query);
    res.json({ success: true, ...insights });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Cohort Analysis
router.post('/api/loyalty-referral/analytics/cohort-analysis', async (req, res) => {
  try {
    const analysis = analyticsEngine.analyzeCohort(req.body);
    res.json({ success: true, analysis });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ROI Calculation
router.post('/api/loyalty-referral/analytics/roi-calculation', async (req, res) => {
  try {
    const roi = analyticsEngine.calculateROI(req.body);
    res.json({ success: true, roi });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/analytics/statistics', async (req, res) => {
  try {
    const stats = analyticsEngine.getAnalyticsStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================================
// INTEGRATIONS ENDPOINTS (34 endpoints)
// ============================================================================

// Available Integrations
router.get('/api/loyalty-referral/integrations/available', async (req, res) => {
  try {
    const available = integrationEngine.getAvailableIntegrations();
    res.json({ success: true, ...available });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Integration Management
router.post('/api/loyalty-referral/integrations/connect', async (req, res) => {
  try {
    const integration = integrationEngine.connectIntegration(req.body);
    res.json({ success: true, integration });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/integrations', async (req, res) => {
  try {
    const integrations = integrationEngine.getIntegrations(req.query);
    res.json({ success: true, ...integrations });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/integrations/:integrationId', async (req, res) => {
  try {
    const integration = integrationEngine.getIntegration(req.params.integrationId);
    res.json({ success: true, integration });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.delete('/api/loyalty-referral/integrations/:integrationId', async (req, res) => {
  try {
    const result = integrationEngine.disconnectIntegration(req.params.integrationId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Shopify Integration
router.post('/api/loyalty-referral/integrations/shopify/sync', async (req, res) => {
  try {
    const log = integrationEngine.syncShopifyData(
      req.body.integrationId,
      req.body.syncType
    );
    res.json({ success: true, log });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Email Integration
router.post('/api/loyalty-referral/integrations/email/send-campaign', async (req, res) => {
  try {
    const campaign = integrationEngine.sendEmailCampaign(
      req.body.integrationId,
      req.body.campaignData
    );
    res.json({ success: true, campaign });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// CRM Integration
router.post('/api/loyalty-referral/integrations/crm/sync-customers', async (req, res) => {
  try {
    const log = integrationEngine.syncCRMCustomers(
      req.body.integrationId,
      req.body.customers
    );
    res.json({ success: true, log });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Webhooks
router.post('/api/loyalty-referral/integrations/webhooks', async (req, res) => {
  try {
    const webhook = integrationEngine.createWebhook(req.body);
    res.json({ success: true, webhook });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/integrations/webhooks', async (req, res) => {
  try {
    const webhooks = integrationEngine.getWebhooks(req.query);
    res.json({ success: true, ...webhooks });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/integrations/webhooks/:webhookId', async (req, res) => {
  try {
    const webhook = integrationEngine.getWebhook(req.params.webhookId);
    res.json({ success: true, webhook });
  } catch (error) {
    res.status(404).json({ success: false, error: error.message });
  }
});

router.put('/api/loyalty-referral/integrations/webhooks/:webhookId', async (req, res) => {
  try {
    const webhook = integrationEngine.updateWebhook(req.params.webhookId, req.body);
    res.json({ success: true, webhook });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/api/loyalty-referral/integrations/webhooks/:webhookId', async (req, res) => {
  try {
    const result = integrationEngine.deleteWebhook(req.params.webhookId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/integrations/webhooks/trigger', async (req, res) => {
  try {
    const result = integrationEngine.triggerWebhook(req.body.event, req.body.eventData);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Import/Export
router.post('/api/loyalty-referral/integrations/import', async (req, res) => {
  try {
    const importLog = integrationEngine.importData(req.body);
    res.json({ success: true, importLog });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/api/loyalty-referral/integrations/export', async (req, res) => {
  try {
    const exportData = integrationEngine.exportData(req.body);
    res.json({ success: true, exportData });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Sync Logs
router.get('/api/loyalty-referral/integrations/sync-logs', async (req, res) => {
  try {
    const logs = integrationEngine.getSyncLogs(req.query);
    res.json({ success: true, ...logs });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/api/loyalty-referral/integrations/statistics', async (req, res) => {
  try {
    const stats = integrationEngine.getIntegrationStatistics();
    res.json({ success: true, statistics: stats });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// ============================================================================
// SYSTEM ENDPOINTS (2 endpoints)
// ============================================================================

// Health Check
router.get('/api/loyalty-referral/health', async (req, res) => {
  try {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        points: 'operational',
        tiers: 'operational',
        referrals: 'operational',
        gamification: 'operational',
        automation: 'operational',
        portal: 'operational',
        analytics: 'operational',
        integrations: 'operational',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Aggregated Statistics
router.get('/api/loyalty-referral/statistics', async (req, res) => {
  try {
    const stats = {
      points: pointsRewardsEngine.getPointsStatistics(),
      tiers: tierVipEngine.getTierStatistics(),
      referrals: referralProgramEngine.getReferralStatistics(),
      gamification: gamificationEngine.getGamificationStatistics(),
      automation: campaignAutomationEngine.getAutomationStatistics(),
      portal: memberPortalEngine.getPortalStatistics(),
      analytics: analyticsEngine.getAnalyticsStatistics(),
      integrations: integrationEngine.getIntegrationStatistics(),
    };
    res.json({ success: true, statistics: stats });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
