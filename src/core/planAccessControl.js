// Plan-based Access Control Middleware
// Restricts features based on subscription plan

const shopifyBillingService = require('./shopifyBillingService');

// Temporary bypass flag: defaults to disabled (open access) until explicitly re-enabled.
// Set DISABLE_PLAN_CHECKS=false to turn gating back on.
const PLAN_CHECKS_DISABLED = process.env.DISABLE_PLAN_CHECKS !== 'false';

// Define feature access by plan
// 4 tiers: free (10 credits) → growth (5,000) → pro (25,000) → enterprise (unlimited)
const PLAN_FEATURES = {
  free: {
    ai_runs_limit: 10,
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
      'blog-seo', 'image-alt-media-seo', 'product-seo', 'seo-site-crawler',
      'on-page-seo-engine', 'blog-draft-engine', 'weekly-blog-content-engine',
      'ai-content-brief-generator', 'content-scoring-optimization',
      'keyword-research-suite', 'internal-link-optimizer', 'technical-seo-auditor',
      'schema-rich-results-engine', 'rank-visibility-tracker', 'ai-visibility-tracker',
      'local-seo-toolkit', 'email-automation-builder', 'abandoned-checkout-winback',
      'review-ugc-engine', 'social-scheduler-content-engine', 'brand-mention-tracker',
      'dynamic-pricing-engine', 'inbox-assistant', 'ltv-churn-predictor',
      'finance-autopilot', 'inventory-supplier-sync'
    ],
    features: ['basic_analytics', 'advanced_analytics', 'priority_support']
  },
  pro: {
    ai_runs_limit: 25000,
    products_limit: 50000,
    team_members: 10,
    tools: [
      'blog-seo', 'image-alt-media-seo', 'product-seo', 'seo-site-crawler',
      'on-page-seo-engine', 'blog-draft-engine', 'weekly-blog-content-engine',
      'ai-content-brief-generator', 'content-scoring-optimization',
      'keyword-research-suite', 'internal-link-optimizer', 'technical-seo-auditor',
      'schema-rich-results-engine', 'rank-visibility-tracker', 'ai-visibility-tracker',
      'local-seo-toolkit', 'email-automation-builder', 'abandoned-checkout-winback',
      'review-ugc-engine', 'social-scheduler-content-engine', 'brand-mention-tracker',
      'dynamic-pricing-engine', 'inbox-assistant', 'ltv-churn-predictor',
      'finance-autopilot', 'inventory-supplier-sync',
      'backlink-explorer', 'link-intersect-outreach', 'competitive-analysis',
      'ai-content-image-gen', 'automation-templates', 'collaboration-approval-workflows',
      'returns-rma-automation', 'ai-support-assistant', 'self-service-portal',
      'social-media-analytics-listening', 'creative-automation-engine',
      'brand-intelligence-layer', 'google-ads-integration', 'facebook-ads-integration',
      'tiktok-ads-integration', 'ads-anomaly-guard', 'ad-creative-optimizer',
      'omnichannel-campaign-builder', 'advanced-analytics-attribution',
      'predictive-analytics-widgets', 'self-service-analytics', 'auto-insights',
      'ai-segmentation-engine', 'upsell-cross-sell-engine', 'customer-data-platform',
      'personalization-recommendation-engine', 'advanced-personalization-engine',
      'churn-prediction-playbooks', 'inventory-forecasting', 'compliance-privacy-suite'
    ],
    features: ['basic_analytics', 'advanced_analytics', 'priority_support', 'api_access', 'webhooks']
  },
  enterprise: {
    ai_runs_limit: -1, // unlimited
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
  'local-seo-toolkit': 'growth',
  'email-automation-builder': 'growth',
  'abandoned-checkout-winback': 'growth',
  'review-ugc-engine': 'growth',
  'social-scheduler-content-engine': 'growth',
  'brand-mention-tracker': 'growth',
  'dynamic-pricing-engine': 'growth',
  'inbox-assistant': 'growth',
  'ltv-churn-predictor': 'growth',
  'finance-autopilot': 'growth',
  'inventory-supplier-sync': 'growth',

  // Pro tier
  'backlink-explorer': 'pro',
  'link-intersect-outreach': 'pro',
  'competitive-analysis': 'pro',
  'ai-content-image-gen': 'pro',
  'automation-templates': 'pro',
  'collaboration-approval-workflows': 'pro',
  'returns-rma-automation': 'pro',
  'ai-support-assistant': 'pro',
  'self-service-portal': 'pro',
  'social-media-analytics-listening': 'pro',
  'creative-automation-engine': 'pro',
  'brand-intelligence-layer': 'pro',
  'google-ads-integration': 'pro',
  'facebook-ads-integration': 'pro',
  'tiktok-ads-integration': 'pro',
  'ads-anomaly-guard': 'pro',
  'ad-creative-optimizer': 'pro',
  'omnichannel-campaign-builder': 'pro',
  'advanced-analytics-attribution': 'pro',
  'predictive-analytics-widgets': 'pro',
  'self-service-analytics': 'pro',
  'auto-insights': 'pro',
  'ai-segmentation-engine': 'pro',
  'upsell-cross-sell-engine': 'pro',
  'customer-data-platform': 'pro',
  'personalization-recommendation-engine': 'pro',
  'advanced-personalization-engine': 'pro',
  'churn-prediction-playbooks': 'pro',
  'inventory-forecasting': 'pro',
  'compliance-privacy-suite': 'pro',

  // Enterprise tier
  'reporting-integrations': 'enterprise',
  'custom-dashboard-builder': 'enterprise',
  'scheduled-export': 'enterprise',
  'data-warehouse-connector': 'enterprise',
  'customer-segmentation-engine': 'enterprise',
  'customer-journey-mapping': 'enterprise',
  'data-enrichment-suite': 'enterprise',
  'aura-operations-ai': 'enterprise',
  'ai-launch-planner': 'enterprise',
  'aura-api-sdk': 'enterprise',
  'webhook-api-triggers': 'enterprise',
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
