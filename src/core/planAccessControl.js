// Plan-based Access Control Middleware
// Restricts features based on subscription plan

const shopifyBillingService = require('./shopifyBillingService');

// Define feature access by plan
const PLAN_FEATURES = {
  free: {
    ai_runs_limit: 100,
    products_limit: 50,
    team_members: 1,
    tools: ['blog-seo', 'product-seo', 'keyword-research-basic'],
    features: ['basic_analytics', 'email_support']
  },
  professional: {
    ai_runs_limit: 10000,
    products_limit: 10000,
    team_members: 5,
    tools: ['blog-seo', 'product-seo', 'keyword-research', 'content-brief-generator', 'blog-draft-engine', 'weekly-blog-content', 'abandoned-checkout', 'reviews-ugc'],
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

// Tool-to-plan mapping for quick checks
const TOOL_PLAN_REQUIREMENTS = {
  // Free tier tools
  'blog-seo': 'free',
  'product-seo': 'free',
  'keyword-research-basic': 'free',
  
  // Professional tier tools
  'keyword-research': 'professional',
  'content-brief-generator': 'professional',
  'blog-draft-engine': 'professional',
  'weekly-blog-content': 'professional',
  'abandoned-checkout': 'professional',
  'reviews-ugc': 'professional',
  'customer-data-platform': 'professional',
  'social-media-analytics': 'professional',
  
  // Enterprise tier tools
  'ai-support-assistant': 'enterprise',
  'advanced-personalization': 'enterprise',
  'ab-testing-suite': 'enterprise',
  'data-warehouse-connector': 'enterprise',
  'white-label-api': 'enterprise'
};

const PLAN_HIERARCHY = {
  free: 0,
  professional: 1,
  enterprise: 2
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
        const requiredPlan = TOOL_PLAN_REQUIREMENTS[toolId] || 'professional';
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
