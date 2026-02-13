/**
 * CONTENT PERSONALIZATION ENGINE
 * Personalize page content, banners, messaging, and layouts
 */

// Storage
const contentVariants = new Map();
const personalizedContent = new Map();
const contentRules = new Map();
const dynamicBlocks = new Map();
const abTests = new Map();
const contentPerformance = new Map();

// Generate unique ID
function generateId(prefix = 'cnt') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create content variant
 */
function createContentVariant({ name, type, content, targeting = {}, metadata = {} }) {
  const variantId = generateId('var');
  
  const variant = {
    id: variantId,
    name,
    type, // banner, hero, cta, message, layout, widget
    content, // HTML, text, or config object
    targeting: {
      segments: targeting.segments || [],
      interests: targeting.interests || [],
      lifecycle: targeting.lifecycle || [],
      location: targeting.location || {},
      device: targeting.device || [],
      ...targeting
    },
    metadata,
    performance: {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cvr: 0
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  contentVariants.set(variantId, variant);
  
  return variant;
}

/**
 * Create personalization rule
 */
function createPersonalizationRule({ name, conditions, actions, priority = 0 }) {
  const ruleId = generateId('rule');
  
  const rule = {
    id: ruleId,
    name,
    conditions, // Array of condition objects
    actions, // Array of action objects (show, hide, replace, etc.)
    priority,
    enabled: true,
    matchCount: 0,
    createdAt: new Date().toISOString()
  };
  
  contentRules.set(ruleId, rule);
  
  return rule;
}

/**
 * Evaluate personalization rules for user
 */
function evaluateRules(userProfile, context = {}) {
  const applicableActions = [];
  
  // Get all enabled rules sorted by priority
  const rules = Array.from(contentRules.values())
    .filter(r => r.enabled)
    .sort((a, b) => b.priority - a.priority);
  
  rules.forEach(rule => {
    // Evaluate all conditions
    const allConditionsMet = rule.conditions.every(condition => 
      evaluateCondition(condition, userProfile, context)
    );
    
    if (allConditionsMet) {
      rule.matchCount++;
      applicableActions.push(...rule.actions.map(action => ({
        ...action,
        ruleId: rule.id,
        ruleName: rule.name
      })));
    }
  });
  
  return applicableActions;
}

/**
 * Evaluate single condition
 */
function evaluateCondition(condition, userProfile, context) {
  const { field, operator, value } = condition;
  
  let fieldValue;
  
  // Extract field value from profile or context
  if (field.startsWith('profile.')) {
    const path = field.substring(8).split('.');
    fieldValue = path.reduce((obj, key) => obj?.[key], userProfile);
  } else if (field.startsWith('context.')) {
    const path = field.substring(8).split('.');
    fieldValue = path.reduce((obj, key) => obj?.[key], context);
  }
  
  // Evaluate operator
  switch (operator) {
    case 'equals':
      return fieldValue === value;
    case 'not_equals':
      return fieldValue !== value;
    case 'contains':
      return Array.isArray(fieldValue) && fieldValue.includes(value);
    case 'not_contains':
      return Array.isArray(fieldValue) && !fieldValue.includes(value);
    case 'greater_than':
      return fieldValue > value;
    case 'less_than':
      return fieldValue < value;
    case 'in':
      return Array.isArray(value) && value.includes(fieldValue);
    case 'not_in':
      return Array.isArray(value) && !value.includes(fieldValue);
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null;
    case 'not_exists':
      return fieldValue === undefined || fieldValue === null;
    default:
      return false;
  }
}

/**
 * Get personalized content for user
 */
function getPersonalizedContent({ userId, profileId, page, slot, userProfile = {} }) {
  const contentId = generateId('pcnt');
  
  // Find matching variants
  const matchingVariants = Array.from(contentVariants.values()).filter(variant => {
    if (variant.status !== 'active') return false;
    
    // Check targeting
    const { targeting } = variant;
    
    // Segment match
    if (targeting.segments?.length > 0) {
      const userSegments = userProfile.segments?.map(s => s.segmentId) || [];
      if (!targeting.segments.some(seg => userSegments.includes(seg))) {
        return false;
      }
    }
    
    // Interest match
    if (targeting.interests?.length > 0) {
      const userInterests = userProfile.interests?.map(i => i.interest) || [];
      if (!targeting.interests.some(int => userInterests.includes(int))) {
        return false;
      }
    }
    
    // Lifecycle match
    if (targeting.lifecycle?.length > 0) {
      if (!targeting.lifecycle.includes(userProfile.lifecycle)) {
        return false;
      }
    }
    
    return true;
  });
  
  // Select best variant (simple ranking for now)
  const selectedVariant = matchingVariants.length > 0
    ? matchingVariants[0]
    : null;
  
  if (selectedVariant) {
    // Track impression
    selectedVariant.performance.impressions++;
    
    // Store personalization
    personalizedContent.set(contentId, {
      id: contentId,
      userId,
      profileId,
      page,
      slot,
      variantId: selectedVariant.id,
      content: selectedVariant.content,
      timestamp: new Date().toISOString()
    });
  }
  
  return {
    contentId,
    variant: selectedVariant,
    content: selectedVariant?.content || null
  };
}

/**
 * Track content interaction
 */
function trackContentInteraction({ contentId, interactionType, metadata = {} }) {
  const content = personalizedContent.get(contentId);
  if (!content) {
    throw new Error('Content not found');
  }
  
  const variant = contentVariants.get(content.variantId);
  if (!variant) return;
  
  // Update performance metrics
  if (interactionType === 'click') {
    variant.performance.clicks++;
  } else if (interactionType === 'conversion') {
    variant.performance.conversions++;
  }
  
  // Calculate rates
  if (variant.performance.impressions > 0) {
    variant.performance.ctr = (variant.performance.clicks / variant.performance.impressions) * 100;
    variant.performance.cvr = (variant.performance.conversions / variant.performance.impressions) * 100;
  }
  
  // Track in performance map
  const perfKey = `${content.variantId}:${interactionType}`;
  contentPerformance.set(perfKey, (contentPerformance.get(perfKey) || 0) + 1);
  
  return variant.performance;
}

/**
 * Create dynamic content block
 */
function createDynamicBlock({ name, template, dataSource, personalization = {} }) {
  const blockId = generateId('blk');
  
  const block = {
    id: blockId,
    name,
    template, // Template string with {{placeholders}}
    dataSource, // Function or endpoint to fetch data
    personalization: {
      useRecommendations: personalization.useRecommendations || false,
      useTrending: personalization.useTrending || false,
      useAffinities: personalization.useAffinities || false,
      maxItems: personalization.maxItems || 10,
      ...personalization
    },
    createdAt: new Date().toISOString()
  };
  
  dynamicBlocks.set(blockId, block);
  
  return block;
}

/**
 * Render dynamic block for user
 */
function renderDynamicBlock({ blockId, userProfile = {}, context = {} }) {
  const block = dynamicBlocks.get(blockId);
  if (!block) {
    throw new Error('Block not found');
  }
  
  let data = {};
  
  // Fetch data based on personalization settings
  if (block.personalization.useRecommendations && userProfile.userId) {
    // Would call recommendation engine here
    data.recommendations = [];
  }
  
  if (block.personalization.useTrending) {
    data.trending = [];
  }
  
  if (block.personalization.useAffinities && userProfile.affinities) {
    data.topAffinities = Object.entries(userProfile.affinities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([entity, score]) => ({ entity, score }));
  }
  
  // Merge with context
  data = { ...data, ...context, userProfile };
  
  // Render template
  let rendered = block.template;
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(placeholder, JSON.stringify(value));
  });
  
  return {
    blockId,
    rendered,
    data
  };
}

/**
 * A/B test content variants
 */
function createContentABTest({ name, variantIds, traffic = {} }) {
  const testId = generateId('test');
  
  const test = {
    id: testId,
    name,
    variants: variantIds.map((variantId, index) => ({
      variantId,
      traffic: traffic[variantId] || (100 / variantIds.length), // Equal split by default
      name: `Variant ${String.fromCharCode(65 + index)}` // A, B, C...
    })),
    status: 'active',
    startedAt: new Date().toISOString(),
    results: {
      totalUsers: 0,
      variantPerformance: {}
    }
  };
  
  abTests.set(testId, test);
  
  return test;
}

/**
 * Assign user to A/B test variant
 */
function assignToVariant(testId, userId) {
  const test = abTests.get(testId);
  if (!test || test.status !== 'active') {
    throw new Error('Test not found or inactive');
  }
  
  // Deterministic assignment based on user ID hash
  const hash = userId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  const bucket = hash % 100;
  
  // Assign to variant based on traffic split
  let cumulative = 0;
  for (const variant of test.variants) {
    cumulative += variant.traffic;
    if (bucket < cumulative) {
      test.results.totalUsers++;
      return variant;
    }
  }
  
  return test.variants[test.variants.length - 1];
}

/**
 * Personalize hero banner
 */
function personalizeHero(userProfile) {
  const heroVariants = {
    new_visitor: {
      headline: 'Welcome! Discover Amazing Products',
      subheadline: 'Get 15% off your first order',
      cta: 'Shop Now',
      image: '/images/hero-welcome.jpg'
    },
    returning_customer: {
      headline: 'Welcome Back!',
      subheadline: 'Check out what\'s new since your last visit',
      cta: 'See New Arrivals',
      image: '/images/hero-returning.jpg'
    },
    vip_customer: {
      headline: 'Exclusive VIP Access',
      subheadline: 'Shop early access to new collections',
      cta: 'Shop VIP Collection',
      image: '/images/hero-vip.jpg'
    }
  };
  
  const tier = userProfile.tier || 'new';
  let selectedVariant = heroVariants.new_visitor;
  
  if (tier === 'vip' || userProfile.lifecycle === 'advocate') {
    selectedVariant = heroVariants.vip_customer;
  } else if (userProfile.lifecycle === 'customer') {
    selectedVariant = heroVariants.returning_customer;
  }
  
  return selectedVariant;
}

/**
 * Personalize CTAs based on lifecycle
 */
function personalizeCTA(userProfile, context = {}) {
  const ctaVariants = {
    visitor: {
      primary: 'Start Shopping',
      secondary: 'Learn More',
      urgency: 'Limited Time: 15% Off First Order'
    },
    engaged: {
      primary: 'Add to Cart',
      secondary: 'Save for Later',
      urgency: 'Only {{stock}} left in stock!'
    },
    customer: {
      primary: 'Buy Again',
      secondary: 'View Recommendations',
      urgency: 'Reorder your favorites'
    },
    advocate: {
      primary: 'Shop Early Access',
      secondary: 'Refer a Friend (Get $10)',
      urgency: 'VIP Exclusive: New Collection Live'
    }
  };
  
  const lifecycle = userProfile.lifecycle || 'visitor';
  const cta = ctaVariants[lifecycle] || ctaVariants.visitor;
  
  // Apply context (e.g., stock level)
  if (context.stock) {
    cta.urgency = cta.urgency.replace('{{stock}}', context.stock);
  }
  
  return cta;
}

/**
 * Get content performance analytics
 */
function getContentAnalytics() {
  const variants = Array.from(contentVariants.values());
  
  return {
    totalVariants: variants.length,
    activeVariants: variants.filter(v => v.status === 'active').length,
    totalImpressions: variants.reduce((sum, v) => sum + v.performance.impressions, 0),
    totalClicks: variants.reduce((sum, v) => sum + v.performance.clicks, 0),
    totalConversions: variants.reduce((sum, v) => sum + v.performance.conversions, 0),
    avgCTR: variants.length > 0
      ? variants.reduce((sum, v) => sum + v.performance.ctr, 0) / variants.length
      : 0,
    avgCVR: variants.length > 0
      ? variants.reduce((sum, v) => sum + v.performance.cvr, 0) / variants.length
      : 0,
    topPerformingVariants: variants
      .sort((a, b) => b.performance.cvr - a.performance.cvr)
      .slice(0, 10)
      .map(v => ({
        id: v.id,
        name: v.name,
        impressions: v.performance.impressions,
        ctr: v.performance.ctr,
        cvr: v.performance.cvr
      }))
  };
}

module.exports = {
  createContentVariant,
  createPersonalizationRule,
  evaluateRules,
  getPersonalizedContent,
  trackContentInteraction,
  createDynamicBlock,
  renderDynamicBlock,
  createContentABTest,
  assignToVariant,
  personalizeHero,
  personalizeCTA,
  getContentAnalytics
};
