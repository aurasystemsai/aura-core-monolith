/**
 * Tier Management & Pricing Engine
 * 
 * Manages subscription tiers, feature flags, and usage limits
 * Supports freemium → enterprise pricing ladder
 * Enables dynamic upsell recommendations
 * 
 * Features:
 * - Flexible tier configuration
 * - Feature flag management per tier
 * - Usage limit enforcement
 * - Automatic upgrade recommendations
 * - Grandfathering logic
 * - Trial management
 * - Discounting engine
 */

// Subscription Tier Definitions
const TIERS = {
  free: {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Perfect for getting started',
    
    limits: {
      profiles: 1000,
      events_per_month: 10000,
      segments: 5,
      audience_exports_per_month:1,
      ai_briefs_per_month: 10,
      api_calls_per_month: 10000,
      users: 1,
      data_retention_days: 30,
    },
    
    features: {
      // Core features
      profile_management: true,
      event_tracking: true,
      basic_segmentation: true,
      basic_analytics: true,
      
      // Advanced features
      advanced_segmentation: false,
      ml_predictions: false,
      platform_activations: false,
      data_enrichment: false,
      white_label: false,
      custom_integrations: false,
      advanced_analytics: false,
      cohort_analysis: false,
      funnel_analytics: false,
      multi_touch_attribution: false,
      
      // AI features
      ai_content_briefs: true,
      ai_customer_insights: false,
      ai_recommendations: false,
      
      // Support
      support_level: 'community',
      sla: false,
      dedicated_csm: false,
      
      // Technical
      api_access: 'limited',
      webhook_support: false,
      custom_domain: false,
      sso_saml: false,
      audit_logs: false,
    },
    
    branding: {
      remove_powered_by: false,
      custom_logo: false,
    },
  },
  
  starter: {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 99,
    annualPrice: 990, // 2 months free
    description: 'For small businesses getting serious',
    
    limits: {
      profiles: 10000,
      events_per_month: 100000,
      segments: 20,
      audience_exports_per_month: 10,
      ai_briefs_per_month: 50,
      api_calls_per_month: 100000,
      users: 3,
      data_retention_days: 90,
    },
    
    features: {
      profile_management: true,
      event_tracking: true,
      basic_segmentation: true,
      basic_analytics: true,
      advanced_segmentation: true,
      ml_predictions: false,
      platform_activations: false,
      data_enrichment: false,
      white_label: false,
      custom_integrations: false,
      advanced_analytics: true,
      cohort_analysis: true,
      funnel_analytics: false,
      multi_touch_attribution: false,
      ai_content_briefs: true,
      ai_customer_insights: false,
      ai_recommendations: false,
      support_level: 'email',
      sla: false,
      dedicated_csm: false,
      api_access: 'standard',
      webhook_support: true,
      custom_domain: false,
      sso_saml: false,
      audit_logs: false,
    },
    
    branding: {
      remove_powered_by: true,
      custom_logo: false,
    },
  },
  
  growth: {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 299,
    annualPrice: 2990, // 2 months free
    description: 'Most popular • Scale your marketing',
    badge: 'MOST POPULAR',
    
    limits: {
      profiles: 100000,
      events_per_month: 1000000,
      segments: 100,
      audience_exports_per_month: 999999,
      ai_briefs_per_month: 200,
      api_calls_per_month: 1000000,
      users: 5,
      data_retention_days: 365,
    },
    
    features: {
      profile_management: true,
      event_tracking: true,
      basic_segmentation: true,
      basic_analytics: true,
      advanced_segmentation: true,
      ml_predictions: false,
      platform_activations: true,
      data_enrichment: true,
      white_label: false,
      custom_integrations: false,
      advanced_analytics: true,
      cohort_analysis: true,
      funnel_analytics: true,
      multi_touch_attribution: true,
      ai_content_briefs: true,
      ai_customer_insights: true,
      ai_recommendations: false,
      support_level: 'chat',
      sla: false,
      dedicated_csm: false,
      api_access: 'full',
      webhook_support: true,
      custom_domain: false,
      sso_saml: false,
      audit_logs: true,
    },
    
    branding: {
      remove_powered_by: true,
      custom_logo: true,
    },
  },
  
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 799,
    annualPrice: 7990, // 2 months free
    description: 'Best value • For growing brands',
    badge: 'BEST VALUE',
    
    limits: {
      profiles: 500000,
      events_per_month: 10000000,
      segments: 999999,
      audience_exports_per_month: 999999,
      ai_briefs_per_month: 999999,
      api_calls_per_month: 10000000,
      users: 10,
      data_retention_days: 730,
    },
    
    features: {
      profile_management: true,
      event_tracking: true,
      basic_segmentation: true,
      basic_analytics: true,
      advanced_segmentation: true,
      ml_predictions: true,
      platform_activations: true,
      data_enrichment: true,
      white_label: false,
      custom_integrations: true,
      advanced_analytics: true,
      cohort_analysis: true,
      funnel_analytics: true,
      multi_touch_attribution: true,
      ai_content_briefs: true,
      ai_customer_insights: true,
      ai_recommendations: true,
      support_level: 'priority',
      sla: false,
      dedicated_csm: false,
      api_access: 'unlimited',
      webhook_support: true,
      custom_domain: true,
      sso_saml: false,
      audit_logs: true,
    },
    
    branding: {
      remove_powered_by: true,
      custom_logo: true,
    },
  },
  
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 2999,
    annualPrice: 29990, // 3 months free
    description: 'Custom solutions for large teams',
    customPricing: true,
    
    limits: {
      profiles: 999999999,
      events_per_month: 999999999,
      segments: 999999999,
      audience_exports_per_month: 999999999,
      ai_briefs_per_month: 999999999,
      api_calls_per_month: 999999999,
      users: 999999,
      data_retention_days: 999999,
    },
    
    features: {
      profile_management: true,
      event_tracking: true,
      basic_segmentation: true,
      basic_analytics: true,
      advanced_segmentation: true,
      ml_predictions: true,
      platform_activations: true,
      data_enrichment: true,
      white_label: true,
      custom_integrations: true,
      advanced_analytics: true,
      cohort_analysis: true,
      funnel_analytics: true,
      multi_touch_attribution: true,
      ai_content_briefs: true,
      ai_customer_insights: true,
      ai_recommendations: true,
      support_level: 'dedicated',
      sla: true,
      dedicated_csm: true,
      api_access: 'unlimited',
      webhook_support: true,
      custom_domain: true,
      sso_saml: true,
      audit_logs: true,
    },
    
    branding: {
      remove_powered_by: true,
      custom_logo: true,
    },
  },
};

// In-memory storage
const subscriptions = new Map();
const usageLimits = new Map();
const upgradeRecommendations = new Map();

/**
 * Create a new subscription
 */
function createSubscription(customerId, tierId, billingCycle = 'monthly') {
  const tier = TIERS[tierId];
  if (!tier) {
    throw new Error(`Invalid tier: ${tierId}`);
  }
  
  const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const subscription = {
    id: subscriptionId,
    customerId,
    tier: tierId,
    billingCycle,
    
    // Pricing
    price: billingCycle === 'annual' ? tier.annualPrice : tier.monthlyPrice,
    
    // Trial
    trialEndsAt: tierId === 'free' ? null : calculateTrialEnd(14), // 14-day trial
    
    // Billing
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: calculatePeriodEnd(billingCycle),
    
    // Status
    status: 'active', // active, trialing, past_due, canceled, paused
    
    // Grandfathering
    grandfathered: false,
    grandfatheredPrice: null,
    grandfatheredFeatures: null,
    
    // Metadata
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  subscriptions.set(subscriptionId, subscription);
  
  // Initialize usage limits
  initializeUsageLimits(customerId, tierId);
  
  return subscription;
}

/**
 * Get subscription
 */
function getSubscription(subscriptionId) {
  const sub = subscriptions.get(subscriptionId);
  if (!sub) throw new Error(`Subscription not found: ${subscriptionId}`);
  return sub;
}

/**
 * Upgrade/downgrade subscription
 */
function changeSubscriptionTier(subscriptionId, newTierId, billingCycle = null) {
  const subscription = getSubscription(subscriptionId);
  const oldTier = subscription.tier;
  const newTier = TIERS[newTierId];
  
  if (!newTier) {
    throw new Error(`Invalid tier: ${newTierId}`);
  }
  
  // Handle grandfathering for downgrades
  if (isDowngrade(oldTier, newTierId)) {
    subscription.grandfathered = true;
    subscription.grandfatheredPrice = subscription.price;
    subscription.grandfatheredFeatures = TIERS[oldTier].features;
  }
  
  subscription.tier = newTierId;
  subscription.billingCycle = billingCycle || subscription.billingCycle;
  subscription.price = subscription.billingCycle === 'annual' 
    ? newTier.annualPrice 
    : newTier.monthlyPrice;
  subscription.updatedAt = new Date().toISOString();
  
  subscriptions.set(subscriptionId, subscription);
  
  // Update usage limits
  initializeUsageLimits(subscription.customerId, newTierId);
  
  return subscription;
}

/**
 * Initialize usage limits for a customer
 */
function initializeUsageLimits(customerId, tierId) {
  const tier = TIERS[tierId];
  const period = getCurrentBillingPeriod();
  const key = `${customerId}_${period}`;
  
  usageLimits.set(key, {
    customerId,
    tier: tierId,
    period,
    limits: { ...tier.limits },
    usage: {
      profiles: 0,
      events_per_month: 0,
      segments: 0,
      audience_exports_per_month: 0,
      ai_briefs_per_month: 0,
      api_calls_per_month: 0,
      users: 0,
    },
    exceeded: {},
  });
}

/**
 * Check if usage is within limits
 */
function checkUsageLimit(customerId, limitType, quantity = 1) {
  const period = getCurrentBillingPeriod();
  const key = `${customerId}_${period}`;
  const limits = usageLimits.get(key);
  
  if (!limits) {
    throw new Error(`Usage limits not initialized for customer: ${customerId}`);
  }
  
  const currentUsage = limits.usage[limitType] || 0;
  const limit = limits.limits[limitType];
  const newUsage = currentUsage + quantity;
  
  const allowed = newUsage <= limit;
  const percentUsed = (newUsage / limit * 100).toFixed(1);
  
  return {
    allowed,
    currentUsage,
    newUsage,
    limit,
    remaining: Math.max(0, limit - newUsage),
    percentUsed: parseFloat(percentUsed),
    exceeded: !allowed,
  };
}

/**
 * Track usage against limits
 */
function trackUsage(customerId, limitType, quantity = 1) {
  const check = checkUsageLimit(customerId, limitType, quantity);
  
  if (!check.allowed) {
    // Generate upgrade recommendation
    const recommendation = generateUpgradeRecommendation(customerId, limitType);
    upgradeRecommendations.set(`${customerId}_${limitType}`, recommendation);
    
    throw new Error(
      `Usage limit exceeded for ${limitType}. Current: ${check.currentUsage}, Limit: ${check.limit}. ` +
      `Upgrade to ${recommendation.recommendedTier} to continue.`
    );
  }
  
  // Update usage
  const period = getCurrentBillingPeriod();
  const key = `${customerId}_${period}`;
  const limits = usageLimits.get(key);
  limits.usage[limitType] = check.newUsage;
  usageLimits.set(key, limits);
  
  // Alert if approaching limit (80%+)
  if (check.percentUsed >= 80 && check.percentUsed < 100) {
    const recommendation = generateUpgradeRecommendation(customerId, limitType);
    upgradeRecommendations.set(`${customerId}_${limitType}`, {
      ...recommendation,
      type: 'approaching_limit',
      percentUsed: check.percentUsed,
    });
  }
  
  return check;
}

/**
 * Generate upgrade recommendation
 */
function generateUpgradeRecommendation(customerId, triggeredBy = null) {
  const subscription = Array.from(subscriptions.values()).find(s => s.customerId === customerId);
  if (!subscription) {
    throw new Error(`No subscription found for customer: ${customerId}`);
  }
  
  const currentTierId = subscription.tier;
  const tierOrder = ['free', 'starter', 'growth', 'pro', 'enterprise'];
const currentIndex = tierOrder.indexOf(currentTierId);
  
  // Recommend next tier up
  const recommendedTierId = currentIndex < tierOrder.length - 1 
    ? tierOrder[currentIndex + 1]
    : 'enterprise';
  
  const recommendedTier = TIERS[recommendedTierId];
  const currentTier = TIERS[currentTierId];
  
  // Calculate benefit
  const benefits = [];
  
  // Limits
  for (const [limit, value] of Object.entries(recommendedTier.limits)) {
    const currentLimit = currentTier.limits[limit];
    if (value > currentLimit) {
      const increase = currentLimit > 0 
        ? Math.round((value / currentLimit - 1) * 100)
        : 999;
      benefits.push({
        type: 'limit',
        name: formatLimitName(limit),
        currentValue: currentLimit,
        newValue: value,
        increasePercent: increase,
      });
    }
  }
  
  // Features
  for (const [feature, enabled] of Object.entries(recommendedTier.features)) {
    if (enabled && !currentTier.features[feature]) {
      benefits.push({
        type: 'feature',
        name: formatFeatureName(feature),
        new: true,
      });
    }
  }
  
  const monthlyIncrease = recommendedTier.monthlyPrice - currentTier.monthlyPrice;
  
  return {
    customerId,
    currentTier: currentTierId,
    recommendedTier: recommendedTierId,
    triggeredBy,
    reason: triggeredBy 
      ? `You've reached your ${formatLimitName(triggeredBy)} limit`
      : 'Unlock more features and higher limits',
    pricing: {
      currentMonthly: currentTier.monthlyPrice,
      recommendedMonthly: recommendedTier.monthlyPrice,
      monthlyIncrease,
      annualSavings: recommendedTier.monthlyPrice * 12 - recommendedTier.annualPrice,
    },
    benefits: benefits.slice(0, 5), // Top 5 benefits
    cta: `Upgrade to ${recommendedTier.name}`,
    urgency: triggeredBy ? 'high' : 'medium',
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get upgrade recommendations for customer
 */
function getUpgradeRecommendations(customerId) {
  const recs = [];
  for (const [key, rec] of upgradeRecommendations.entries()) {
    if (rec.customerId === customerId) {
      recs.push(rec);
    }
  }
  return recs.sort((a, b) => {
    const urgencyOrder = { high: 1, medium: 2, low: 3 };
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });
}

/**
 * Get tier comparison (for pricing page)
 */
function getTierComparison() {
  const tierOrder = ['free', 'starter', 'growth', 'pro', 'enterprise'];
  
  return tierOrder.map(tierId => {
    const tier = TIERS[tierId];
    return {
      id: tier.id,
      name: tier.name,
      monthlyPrice: tier.monthlyPrice,
      annualPrice: tier.annualPrice,
      description: tier.description,
      badge: tier.badge || null,
      limits: Object.entries(tier.limits).map(([key, value]) => ({
        name: formatLimitName(key),
        value: formatLimitValue(value),
      })),
      features: Object.entries(tier.features)
        .filter(([, enabled]) => enabled)
        .map(([key]) => formatFeatureName(key)),
      cta: tier.id === 'enterprise' ? 'Contact Sales' : tier.id === 'free' ? 'Get Started' : 'Start Trial',
    };
  });
}

/**
 * Check feature access
 */
function hasFeatureAccess(customerId, featureName) {
  const subscription = Array.from(subscriptions.values()).find(s => s.customerId === customerId);
  if (!subscription) {
    return false;
  }
  
  const tier = TIERS[subscription.tier];
  
  // Check grandfathered features first
  if (subscription.grandfathered && subscription.grandfatheredFeatures) {
    if (subscription.grandfatheredFeatures[featureName]) {
      return true;
    }
  }
  
  return tier.features[featureName] || false;
}

/**
 * Get usage analytics for customer dashboard
 */
function getUsageAnalytics(customerId) {
  const period = getCurrentBillingPeriod();
  const key = `${customerId}_${period}`;
  const limits = usageLimits.get(key);
  
  if (!limits) {
    return null;
  }
  
  const analytics = {
    tier: limits.tier,
    period,
    usage: [],
  };
  
  for (const [limitType, limit] of Object.entries(limits.limits)) {
    const used = limits.usage[limitType] || 0;
    const percentUsed = (used / limit * 100).toFixed(1);
    
    analytics.usage.push({
      type: limitType,
      name: formatLimitName(limitType),
      used,
      limit,
      remaining: Math.max(0, limit - used),
      percentUsed: parseFloat(percentUsed),
      status: percentUsed >= 100 ? 'exceeded' : percentUsed >= 80 ? 'warning' : 'ok',
    });
  }
  
  return analytics;
}

// Helper functions
function isDowngrade(fromTierId, toTierId) {
  const tierOrder = ['free', 'starter', 'growth', 'pro', 'enterprise'];
  return tierOrder.indexOf(toTierId) < tierOrder.indexOf(fromTierId);
}

function calculateTrialEnd(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function calculatePeriodEnd(billingCycle) {
  const now = new Date();
  if (billingCycle === 'annual') {
    return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString();
  } else {
    return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString();
  }
}

function getCurrentBillingPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatLimitName(key) {
  const names = {
    profiles: 'Customer Profiles',
    events_per_month: 'Events per Month',
    segments: 'Segments',
    audience_exports_per_month: 'Audience Exports/Month',
    ai_briefs_per_month: 'AI Content Briefs/Month',
    api_calls_per_month: 'API Calls/Month',
    users: 'Team Members',
    data_retention_days: 'Data Retention',
  };
  return names[key] || key;
}

function formatLimitValue(value) {
  if (value >= 999999) return 'Unlimited';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
}

function formatFeatureName(key) {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Export
module.exports = {
  // Subscription management
  createSubscription,
  getSubscription,
  changeSubscriptionTier,
  
  // Usage tracking
  checkUsageLimit,
  trackUsage,
  getUsageAnalytics,
  
  // Feature access
  hasFeatureAccess,
  
  // Upgrades
  generateUpgradeRecommendation,
  getUpgradeRecommendations,
  
  // Comparison
  getTierComparison,
  
  // Constants
  TIERS,
};
