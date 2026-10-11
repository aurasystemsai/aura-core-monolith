// Plan-based Access Control Middleware
// Restricts features based on subscription plan

const shopifyBillingService = require('./shopifyBillingService');

// Temporary bypass flag: defaults to disabled (open access) until explicitly re-enabled.
// Set DISABLE_PLAN_CHECKS=false to turn gating back on.
const PLAN_CHECKS_DISABLED = process.env.DISABLE_PLAN_CHECKS !== 'false';

// Define feature access by plan
// 4 tiers: free (10 credits) â†’ growth (5,000) â†’ pro (25,000) â†’ enterprise (100,000 a month, then top-ups)
const PLAN_FEATURES = {
  free: {
    ai_runs_limit: 50,
    products_limit: 50,
    team_members: 1,
    tools: ['blog-seo', 'image-alt-media-seo'],
    features: ['basic_analytics', 'email_support']
  },
  growth: {
    ai_runs_limit: 5000,
    products_limit: 5000,
    team_members: 3,
    tools: [
      'blog-seo', 'image-alt-media-seo', 'product-seo', 'product-feed', 'translations', 'discounts-bundles', 'order-tracking', 'back-in-stock', 'popups', 'size-guides', 'seo-site-crawler', 'finance-autopilot', 'inbox-assistant', 'inventory-supplier-sync', 'local-seo-toolkit', 'ltv-churn-predictor', 'social-scheduler-content-engine',
      'on-page-seo-engine', 'blog-draft-engine', 'weekly-blog-content-engine',
      'ai-content-brief-generator', 'content-scoring-optimization',
      'keyword-research-suite', 'internal-link-optimizer', 'technical-seo-auditor',
      'schema-rich-results-engine', 'rank-visibility-tracker', 'ai-visibility-tracker', 'ai-shopping-readiness',
      'email-automation-builder', 'abandoned-checkout-winback',
      'review-ugc-engine', 'brand-mention-tracker',
      'dynamic-pricing-engine', 'profit-analytics', 'order-risk'
    ],
    features: ['basic_analytics', 'advanced_analytics', 'priority_support']
  },
  pro: {
    ai_runs_limit: 25000,
    products_limit: 50000,
    team_members: 10,
    tools: [
      'blog-seo', 'image-alt-media-seo', 'product-seo', 'product-feed', 'translations', 'discounts-bundles', 'order-tracking', 'back-in-stock', 'popups', 'size-guides', 'seo-site-crawler', 'advanced-analytics-attribution', 'advanced-finance-inventory-planning', 'advanced-personalization-engine', 'affiliate-partner-management', 'ai-segmentation-engine', 'automation-templates', 'backlink-explorer', 'brand-intelligence-layer', 'churn-prediction-playbooks', 'collaboration-approval-workflows', 'competitive-analysis', 'compliance-privacy-suite', 'conditional-logic-automation', 'conversion-rate-optimization', 'creative-automation-engine', 'daily-cfo-pack', 'digital-asset-management', 'finance-autopilot', 'inbox-assistant', 'inventory-supplier-sync', 'link-intersect-outreach', 'local-seo-toolkit', 'ltv-churn-predictor', 'multi-channel-optimizer', 'newsletter-automation', 'omnichannel-campaign-builder', 'personalization-recommendation-engine', 'predictive-analytics-widgets', 'self-service-analytics', 'self-service-portal', 'social-media-analytics-listening', 'social-scheduler-content-engine', 'subscription-management', 'video-podcast-seo', 'visual-workflow-builder', 'voice-search-optimization', 'workflow-orchestrator',
      'on-page-seo-engine', 'blog-draft-engine', 'weekly-blog-content-engine',
      'ai-content-brief-generator', 'content-scoring-optimization',
      'keyword-research-suite', 'internal-link-optimizer', 'technical-seo-auditor',
      'schema-rich-results-engine', 'rank-visibility-tracker', 'ai-visibility-tracker', 'ai-shopping-readiness',
      'email-automation-builder', 'abandoned-checkout-winback',
      'review-ugc-engine', 'brand-mention-tracker',
      'dynamic-pricing-engine', 'profit-analytics', 'order-risk',
      'ai-content-image-gen', 
      'returns-rma-automation', 'ai-support-assistant', 
      'google-ads-integration', 'facebook-ads-integration',
      'tiktok-ads-integration', 'ads-anomaly-guard', 'ad-creative-optimizer',
      'auto-insights',
      'upsell-cross-sell-engine', 'customer-data-platform',
      'inventory-forecasting'
    ],
    features: ['basic_analytics', 'advanced_analytics', 'priority_support', 'api_access', 'webhooks']
  },
  enterprise: {
    ai_runs_limit: -1, // no separate run cap; the credit balance is the limit
    products_limit: -1, // unlimited
    team_members: -1, // unlimited
    tools: ['*'], // all tools
    features: ['*'], // all features
  }
};

// Tool-to-plan mapping for quick checks (matches usePlan.js TOOL_PLAN)
const TOOL_PLAN_REQUIREMENTS = {
  // Free tier
  'blog-seo': 'free',
  'image-alt-media-seo': 'free',

  // Growth tier
  'product-seo': 'growth',
  'product-feed': 'growth',
  'workflow-orchestrator': 'pro',
  'webhook-api-triggers': 'enterprise',
  'voice-search-optimization': 'pro',
  'visual-workflow-builder': 'pro',
  'video-podcast-seo': 'pro',
  'subscription-management': 'pro',
  'social-scheduler-content-engine': 'growth',
  'social-media-analytics-listening': 'pro',
  'self-service-portal': 'pro',
  'self-service-analytics': 'pro',
  'scheduled-export': 'enterprise',
  'reporting-integrations': 'enterprise',
  'predictive-analytics-widgets': 'pro',
  'personalization-recommendation-engine': 'pro',
  'omnichannel-campaign-builder': 'pro',
  'newsletter-automation': 'pro',
  'multi-channel-optimizer': 'pro',
  'ltv-churn-predictor': 'growth',
  'local-seo-toolkit': 'growth',
  'link-intersect-outreach': 'pro',
  'inventory-supplier-sync': 'growth',
  'inbox-assistant': 'growth',
  'finance-autopilot': 'growth',
  'digital-asset-management': 'pro',
  'daily-cfo-pack': 'pro',
  'custom-dashboard-builder': 'enterprise',
  'creative-automation-engine': 'pro',
  'conversion-rate-optimization': 'pro',
  'conditional-logic-automation': 'pro',
  'compliance-privacy-suite': 'pro',
  'competitive-analysis': 'pro',
  'collaboration-approval-workflows': 'pro',
  'churn-prediction-playbooks': 'pro',
  'brand-intelligence-layer': 'pro',
  'backlink-explorer': 'pro',
  'automation-templates': 'pro',
  'aura-operations-ai': 'enterprise',
  'aura-api-sdk': 'enterprise',
  'ai-segmentation-engine': 'pro',
  'ai-launch-planner': 'enterprise',
  'affiliate-partner-management': 'pro',
  'advanced-personalization-engine': 'pro',
  'advanced-finance-inventory-planning': 'pro',
  'advanced-analytics-attribution': 'pro',
  'translations': 'growth',
  'discounts-bundles': 'growth',
  'order-tracking': 'growth',
  'back-in-stock': 'growth',
  'popups': 'growth',
  'size-guides': 'growth',
  'seo-site-crawler': 'growth',
  'on-page-seo-engine': 'growth',
  'blog-draft-engine': 'growth',
  'weekly-blog-content-engine': 'growth',
  'ai-content-brief-generator': 'growth',
  'content-scoring-optimization': 'growth',
  'keyword-research-suite': 'growth',
  'internal-link-optimizer': 'growth',
  'technical-seo-auditor': 'growth',
  'schema-rich-results-engine': 'growth',
  'rank-visibility-tracker': 'growth',
  'ai-visibility-tracker': 'growth',
  'ai-shopping-readiness': 'growth',
  'email-automation-builder': 'growth',
  'abandoned-checkout-winback': 'growth',
  'review-ugc-engine': 'growth',
  'brand-mention-tracker': 'growth',
  'dynamic-pricing-engine': 'growth',
  'profit-analytics': 'growth',
  'order-risk': 'growth',

  // Pro tier
  'ai-content-image-gen': 'pro',
  'returns-rma-automation': 'pro',
  'ai-support-assistant': 'pro',
  'google-ads-integration': 'pro',
  'facebook-ads-integration': 'pro',
  'tiktok-ads-integration': 'pro',
  'ads-anomaly-guard': 'pro',
  'ad-creative-optimizer': 'pro',
  'auto-insights': 'pro',
  'upsell-cross-sell-engine': 'pro',
  'customer-data-platform': 'pro',
  'inventory-forecasting': 'pro',
  'ab-testing-suite': 'pro',

  // Enterprise tier
  'data-warehouse-connector': 'enterprise',
  'loyalty-referral-programs': 'enterprise',
};

const PLAN_HIERARCHY = {
  free: 0,
  growth: 1,
  pro: 2,
  enterprise: 3
};

/**
 * Check if user's plan has access to a feature
 */
function hasAccess(userPlan, requiredPlan) {
  const userLevel = PLAN_HIERARCHY[userPlan] || 0;
  const requiredLevel = PLAN_HIERARCHY[requiredPlan] || 0;
  return userLevel >= requiredLevel;
}

/**
 * Get plan features for a specific plan
 */
function getPlanFeatures(planId) {
  return PLAN_FEATURES[planId] || PLAN_FEATURES.free;
}

/**
 * Check if plan has access to a specific tool
 */
function canAccessTool(planId, toolId) {
  const features = PLAN_FEATURES[planId] || PLAN_FEATURES.free;
  
  // Enterprise has access to all tools
  if (features.tools.includes('*')) {
    return true;
  }
  
  return features.tools.includes(toolId);
}

/**
 * Check if plan has access to a specific feature
 */
function canAccessFeature(planId, featureId) {
  const features = PLAN_FEATURES[planId] || PLAN_FEATURES.free;
  
  // Enterprise has access to all features
  if (features.features && features.features.includes('*')) {
    return true;
  }
  
  return features.features && features.features.includes(featureId);
}

/**
 * Middleware: Require specific plan
 */
function requirePlan(requiredPlan) {
  return async (req, res, next) => {
    if (PLAN_CHECKS_DISABLED) return next();
    try {
      const shop = req.session?.shop || req.query.shop;
      
      if (!shop) {
        return res.status(401).json({ 
          error: 'Shop not connected',
          upgrade_required: true,
          required_plan: requiredPlan
        });
      }

      // Get current subscription
      const subscription = await shopifyBillingService.getSubscription(shop);
      const currentPlan = subscription.plan_id || 'free';

      // Check if user has required plan level
      if (!hasAccess(currentPlan, requiredPlan)) {
        return res.status(403).json({ 
          error: 'Plan upgrade required',
          current_plan: currentPlan,
          required_plan: requiredPlan,
          upgrade_url: '/billing',
          upgrade_required: true
        });
      }

      // Attach plan info to request
      req.subscription = subscription;
      req.plan = currentPlan;
      
      next();
    } catch (error) {
      console.error('Plan check error:', error);
      res.status(500).json({ error: 'Failed to verify subscription' });
    }
  };
}

/**
 * Middleware: Require specific tool access
 */
function requireTool(toolId) {
  return async (req, res, next) => {
    if (PLAN_CHECKS_DISABLED) return next();
    try {
      const shop = req.session?.shop || req.query.shop;
      
      if (!shop) {
        return res.status(401).json({ 
          error: 'Shop not connected',
          upgrade_required: true
        });
      }

      const subscription = await shopifyBillingService.getSubscription(shop);
      const currentPlan = subscription.plan_id || 'free';

      if (!canAccessTool(currentPlan, toolId)) {
        const requiredPlan = TOOL_PLAN_REQUIREMENTS[toolId] || 'growth';
        return res.status(403).json({ 
          error: `This tool requires ${requiredPlan} plan`,
          current_plan: currentPlan,
          required_plan: requiredPlan,
          tool_id: toolId,
          upgrade_url: '/billing',
          upgrade_required: true
        });
      }

      req.subscription = subscription;
      req.plan = currentPlan;
      
      next();
    } catch (error) {
      console.error('Tool access check error:', error);
      res.status(500).json({ error: 'Failed to verify tool access' });
    }
  };
}

/**
 * Middleware: Require specific feature
 */
function requireFeature(featureId) {
  return async (req, res, next) => {
    if (PLAN_CHECKS_DISABLED) return next();
    try {
      const shop = req.session?.shop || req.query.shop;
      
      if (!shop) {
        return res.status(401).json({ error: 'Shop not connected' });
      }

      const subscription = await shopifyBillingService.getSubscription(shop);
      const currentPlan = subscription.plan_id || 'free';

      if (!canAccessFeature(currentPlan, featureId)) {
        return res.status(403).json({ 
          error: `This feature requires a paid plan`,
          current_plan: currentPlan,
          feature_id: featureId,
          upgrade_url: '/billing',
          upgrade_required: true
        });
      }

      req.subscription = subscription;
      req.plan = currentPlan;
      
      next();
    } catch (error) {
      console.error('Feature access check error:', error);
      res.status(500).json({ error: 'Failed to verify feature access' });
    }
  };
}

/**
 * Check usage limits
 */
async function checkUsageLimit(shop, limitType) {
  const subscription = await shopifyBillingService.getSubscription(shop);
  const currentPlan = subscription.plan_id || 'free';
  const features = getPlanFeatures(currentPlan);
  
  const limitKey = `${limitType}_limit`;
  const limit = features[limitKey];
  
  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, limit: -1, usage: 0 };
  }
  
  // Get current usage (would query database in production)
  const usage = await shopifyBillingService.getUsageStats(shop);
  const currentUsage = usage[limitType] || 0;
  
  return {
    allowed: currentUsage < limit,
    limit,
    usage: currentUsage,
    remaining: Math.max(0, limit - currentUsage)
  };
}

/**
 * Middleware: Check usage limits
 */
function checkLimit(limitType) {
  return async (req, res, next) => {
    if (PLAN_CHECKS_DISABLED) return next();
    try {
      const shop = req.session?.shop || req.query.shop;
      
      if (!shop) {
        return res.status(401).json({ error: 'Shop not connected' });
      }

      const limitCheck = await checkUsageLimit(shop, limitType);
      
      if (!limitCheck.allowed) {
        return res.status(429).json({ 
          error: `${limitType} limit exceeded`,
          limit: limitCheck.limit,
          usage: limitCheck.usage,
          upgrade_required: true,
          upgrade_url: '/billing'
        });
      }

      req.usageLimit = limitCheck;
      
      next();
    } catch (error) {
      console.error('Usage limit check error:', error);
      // Allow on error to prevent blocking users
      next();
    }
  };
}

/**
 * Get accessible tools for a plan
 */
function getAccessibleTools(planId) {
  const features = PLAN_FEATURES[planId] || PLAN_FEATURES.free;
  
  if (features.tools.includes('*')) {
    return Object.keys(TOOL_PLAN_REQUIREMENTS);
  }
  
  return features.tools;
}

/**
 * API endpoint to check access (for frontend)
 */
async function checkAccess(req, res) {
  try {
    const shop = req.session?.shop || req.query.shop;
    const { tool, feature } = req.query;
    
    if (!shop) {
      return res.json({ 
        plan: 'free',
        has_access: false,
        upgrade_required: true
      });
    }

    const subscription = await shopifyBillingService.getSubscription(shop);
    const currentPlan = subscription.plan_id || 'free';
    
    let hasAccess = true;
    let message = null;
    
    if (tool) {
      hasAccess = canAccessTool(currentPlan, tool);
      message = hasAccess ? null : `Requires ${TOOL_PLAN_REQUIREMENTS[tool]} plan`;
    }
    
    if (feature) {
      hasAccess = canAccessFeature(currentPlan, feature);
      message = hasAccess ? null : 'Requires paid plan';
    }
    
    res.json({
      plan: currentPlan,
      has_access: hasAccess,
      message,
      accessible_tools: getAccessibleTools(currentPlan),
      features: getPlanFeatures(currentPlan)
    });
  } catch (error) {
    console.error('Check access error:', error);
    res.status(500).json({ error: 'Failed to check access' });
  }
}

module.exports = {
  requirePlan,
  requireTool,
  requireFeature,
  checkLimit,
  hasAccess,
  canAccessTool,
  canAccessFeature,
  getPlanFeatures,
  getAccessibleTools,
  checkUsageLimit,
  checkAccess,
  PLAN_FEATURES,
  TOOL_PLAN_REQUIREMENTS
};

