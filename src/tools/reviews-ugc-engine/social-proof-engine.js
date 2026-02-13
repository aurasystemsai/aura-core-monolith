/**
 * Social Proof Optimization Engine
 * Handles review display optimization, social proof elements, trust badges, and conversion optimization
 */

// In-memory storage
const displayRules = new Map();
const trustBadges = new Map();
const socialProofElements = new Map();
const abTests = new Map();

let ruleIdCounter = 1;
let badgeIdCounter = 1;
let elementIdCounter = 1;
let testIdCounter = 1;

/**
 * Create display rule
 */
function createDisplayRule(ruleData) {
  const rule = {
    id: `display_rule_${ruleIdCounter++}`,
    name: ruleData.name,
    priority: ruleData.priority || 0,
    conditions: ruleData.conditions, // page_type, product_category, visitor_segment
    displaySettings: {
      showRating: ruleData.displaySettings?.showRating !== false,
      showReviewCount: ruleData.displaySettings?.showReviewCount !== false,
      showStars: ruleData.displaySettings?.showStars !== false,
      showTrustBadges: ruleData.displaySettings?.showTrustBadges !== false,
      showTopReviews: ruleData.displaySettings?.showTopReviews !== false,
      reviewCount: ruleData.displaySettings?.reviewCount || 5,
      sortBy: ruleData.displaySettings?.sortBy || 'helpful',
      highlightVerified: ruleData.displaySettings?.highlightVerified !== false,
      showPhotos: ruleData.displaySettings?.showPhotos !== false,
    },
    enabled: ruleData.enabled !== false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  displayRules.set(rule.id, rule);
  return rule;
}

/**
 * Get display rule
 */
function getDisplayRule(ruleId) {
  return displayRules.get(ruleId);
}

/**
 * List display rules
 */
function listDisplayRules() {
  return Array.from(displayRules.values())
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Update display rule
 */
function updateDisplayRule(ruleId, updates) {
  const rule = displayRules.get(ruleId);
  if (!rule) {
    throw new Error('Display rule not found');
  }

  Object.assign(rule, updates, {
    updatedAt: new Date().toISOString(),
  });

  return rule;
}

/**
 * Evaluate which display rule applies
 */
function evaluateDisplayRules(context) {
  const {
    pageType,
    productCategory,
    visitorSegment,
  } = context;

  const rules = Array.from(displayRules.values())
    .filter(rule => rule.enabled)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of rules) {
    const { conditions } = rule;

    let matches = true;

    if (conditions.pageType && conditions.pageType !== pageType) {
      matches = false;
    }
    if (conditions.productCategory && conditions.productCategory !== productCategory) {
      matches = false;
    }
    if (conditions.visitorSegment && conditions.visitorSegment !== visitorSegment) {
      matches = false;
    }

    if (matches) {
      return rule;
    }
  }

  // Return default rule if no match
  return {
    id: 'default',
    displaySettings: {
      showRating: true,
      showReviewCount: true,
      showStars: true,
      reviewCount: 5,
      sortBy: 'helpful',
    },
  };
}

/**
 * Optimize review display based on conversion data
 */
function optimizeReviewDisplay(productId, reviews, performanceData) {
  const optimization = {
    productId,
    recommendedReviews: [],
    displayStrategy: 'balanced',
    reasoning: [],
  };

  // Analyze review distribution
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  const highRatedReviews = reviews.filter(r => r.rating >= 4);
  const lowRatedReviews = reviews.filter(r => r.rating <= 2);
  const verifiedReviews = reviews.filter(r => r.verified);

  // Strategy 1: High average rating - show top reviews
  if (avgRating >= 4.5) {
    optimization.displayStrategy = 'showcase_excellence';
    optimization.recommendedReviews = highRatedReviews
      .sort((a, b) => b.helpfulCount - a.helpfulCount)
      .slice(0, 5);
    optimization.reasoning.push('High rating product - showcasing top positive reviews');
  }
  // Strategy 2: Mixed ratings - show balanced view
  else if (avgRating >= 3.5) {
    optimization.displayStrategy = 'balanced';
    const positiveReviews = highRatedReviews.slice(0, 3);
    const criticalReviews = reviews
      .filter(r => r.rating === 3)
      .sort((a, b) => b.helpfulCount - a.helpfulCount)
      .slice(0, 2);
    optimization.recommendedReviews = [...positiveReviews, ...criticalReviews];
    optimization.reasoning.push('Mixed ratings - showing balanced perspective');
  }
  // Strategy 3: Lower ratings - emphasize verified and helpful
  else {
    optimization.displayStrategy = 'credibility_focus';
    optimization.recommendedReviews = verifiedReviews
      .sort((a, b) => b.helpfulCount - a.helpfulCount)
      .slice(0, 5);
    optimization.reasoning.push('Lower ratings - focusing on verified and helpful reviews');
  }

  // Add photos/videos to top
  const reviewsWithMedia = optimization.recommendedReviews.filter(
    r => (r.photos && r.photos.length > 0) || (r.videos && r.videos.length > 0)
  );
  if (reviewsWithMedia.length > 0) {
    optimization.reasoning.push('Prioritizing reviews with photos/videos for authenticity');
  }

  return optimization;
}

/**
 * Create trust badge
 */
function createTrustBadge(badgeData) {
  const badge = {
    id: `badge_${badgeIdCounter++}`,
    name: badgeData.name,
    type: badgeData.type, // verified_reviews, top_rated, customer_favorite, award
    icon: badgeData.icon || '',
    description: badgeData.description,
    criteria: badgeData.criteria, // min_reviews, min_rating, etc.
    displayLocations: badgeData.displayLocations || ['product_page', 'search_results'],
    style: {
      backgroundColor: badgeData.style?.backgroundColor || '#4CAF50',
      textColor: badgeData.style?.textColor || '#FFFFFF',
      borderColor: badgeData.style?.borderColor || '#45A049',
      size: badgeData.style?.size || 'medium',
    },
    enabled: badgeData.enabled !== false,
    createdAt: new Date().toISOString(),
  };

  trustBadges.set(badge.id, badge);
  return badge;
}

/**
 * Get applicable trust badges for product
 */
function getApplicableBadges(productData) {
  const badges = Array.from(trustBadges.values()).filter(badge => badge.enabled);
  const applicable = [];

  for (const badge of badges) {
    const { criteria } = badge;
    let qualifies = true;

    if (criteria.minReviews && productData.totalReviews < criteria.minReviews) {
      qualifies = false;
    }
    if (criteria.minRating && productData.averageRating < criteria.minRating) {
      qualifies = false;
    }
    if (criteria.minVerifiedReviews && productData.verifiedReviews < criteria.minVerifiedReviews) {
      qualifies = false;
    }
    if (criteria.recommendationRate && productData.recommendationRate < criteria.recommendationRate) {
      qualifies = false;
    }

    if (qualifies) {
      applicable.push(badge);
    }
  }

  return applicable;
}

/**
 * List all trust badges
 */
function listTrustBadges() {
  return Array.from(trustBadges.values());
}

/**
 * Create social proof element
 */
function createSocialProofElement(elementData) {
  const element = {
    id: `element_${elementIdCounter++}`,
    type: elementData.type, // recent_review, trending, customer_count, rating_highlight
    content: elementData.content,
    displayType: elementData.displayType || 'notification', // notification, banner, inline
    triggers: elementData.triggers || {
      pageView: true,
      timeOnPage: 5, // seconds
      scrollDepth: 0, // percentage
    },
    frequency: elementData.frequency || 'once_per_session',
    style: elementData.style || {},
    enabled: elementData.enabled !== false,
    analytics: {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
    },
    createdAt: new Date().toISOString(),
  };

  socialProofElements.set(element.id, element);
  return element;
}

/**
 * Get social proof elements
 */
function getSocialProofElements(context) {
  return Array.from(socialProofElements.values())
    .filter(element => element.enabled);
}

/**
 * Track social proof interaction
 */
function trackSocialProofInteraction(elementId, interactionType) {
  const element = socialProofElements.get(elementId);
  if (!element) {
    throw new Error('Social proof element not found');
  }

  if (interactionType === 'impression') {
    element.analytics.impressions += 1;
  } else if (interactionType === 'click') {
    element.analytics.clicks += 1;
    element.analytics.ctr = (element.analytics.clicks / element.analytics.impressions) * 100;
  } else if (interactionType === 'conversion') {
    element.analytics.conversions += 1;
  }

  return element.analytics;
}

/**
 * Create A/B test for review display
 */
function createABTest(testData) {
  const test = {
    id: `test_${testIdCounter++}`,
    name: testData.name,
    variants: testData.variants, // [{id, name, settings}]
    trafficAllocation: testData.trafficAllocation || { A: 50, B: 50 },
    status: 'active', // active, paused, completed
    startDate: new Date().toISOString(),
    endDate: testData.endDate || null,
    results: testData.variants.reduce((acc, variant) => {
      acc[variant.id] = {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        conversionRate: 0,
        revenue: 0,
      };
      return acc;
    }, {}),
    winner: null,
    createdAt: new Date().toISOString(),
  };

  abTests.set(test.id, test);
  return test;
}

/**
 * Track A/B test variant performance
 */
function trackABTestVariant(testId, variantId, metrics) {
  const test = abTests.get(testId);
  if (!test) {
    throw new Error('A/B test not found');
  }

  if (!test.results[variantId]) {
    throw new Error('Variant not found');
  }

  const variant = test.results[variantId];

  if (metrics.impression) {
    variant.impressions += 1;
  }
  if (metrics.click) {
    variant.clicks += 1;
  }
  if (metrics.conversion) {
    variant.conversions += 1;
    variant.revenue += metrics.revenue || 0;
  }

  variant.conversionRate = variant.impressions > 0
    ? (variant.conversions / variant.impressions) * 100
    : 0;

  return variant;
}

/**
 * Get A/B test results
 */
function getABTestResults(testId) {
  const test = abTests.get(testId);
  if (!test) {
    throw new Error('A/B test not found');
  }

  const variants = Object.entries(test.results).map(([variantId, data]) => ({
    variantId,
    ...data,
    revenuePerVisitor: data.impressions > 0 ? data.revenue / data.impressions : 0,
  }));

  // Determine winner based on conversion rate
  const winner = variants.reduce((best, current) =>
    current.conversionRate > best.conversionRate ? current : best
  );

  test.winner = winner.variantId;

  return {
    testId,
    testName: test.name,
    status: test.status,
    variants,
    winner: winner.variantId,
    winnerConversionRate: winner.conversionRate,
  };
}

/**
 * Generate conversion insights
 */
function generateConversionInsights(productId, reviewData, performanceData) {
  const insights = {
    productId,
    reviewImpact: 'positive',
    recommendations: [],
    metrics: {},
  };

  // Calculate review influence on conversions
  const avgRating = reviewData.averageRating;
  const reviewCount = reviewData.totalReviews;

  if (avgRating >= 4.5 && reviewCount >= 50) {
    insights.reviewImpact = 'high_positive';
    insights.recommendations.push({
      type: 'showcase',
      message: 'Feature reviews prominently - strong conversion driver',
      priority: 'high',
    });
  } else if (avgRating < 3.5) {
    insights.reviewImpact = 'negative';
    insights.recommendations.push({
      type: 'address_concerns',
      message: 'Low ratings may hurt conversions - address customer concerns',
      priority: 'critical',
    });
  }

  if (reviewCount < 10) {
    insights.recommendations.push({
    type: 'collect_more',
      message: 'Low review count - run collection campaign',
      priority: 'high',
    });
  }

  // Calculate expected trust score
  const trustScore = calculateTrustScore(reviewData);
  insights.metrics.trustScore = trustScore;

  if (trustScore < 60) {
    insights.recommendations.push({
      type: 'build_trust',
      message: 'Add verified badges and highlight positive reviews',
      priority: 'medium',
    });
  }

  return insights;
}

/**
 * Calculate trust score
 */
function calculateTrustScore(reviewData) {
  let score = 0;

  // Rating component (40 points)
  score += (reviewData.averageRating / 5) * 40;

  // Volume component (30 points)
  const volumeScore = Math.min(reviewData.totalReviews / 100, 1) * 30;
  score += volumeScore;

  // Verification component (20 points)
  const verificationRate = reviewData.verifiedReviews / reviewData.totalReviews;
  score += verificationRate * 20;

  // Recency component (10 points)
  // Simplified - in production, check review recency
  score += 10;

  return Math.round(score);
}

/**
 * Get optimization statistics
 */
function getOptimizationStatistics() {
  const totalTests = abTests.size;
  const activeTests = Array.from(abTests.values()).filter(t => t.status === 'active').length;
  
  const totalElements = socialProofElements.size;
  const activeElements = Array.from(socialProofElements.values()).filter(e => e.enabled).length;

  const totalImpressions = Array.from(socialProofElements.values())
    .reduce((sum, e) => sum + e.analytics.impressions, 0);
  const totalClicks = Array.from(socialProofElements.values())
    .reduce((sum, e) => sum + e.analytics.clicks, 0);

  return {
    displayRules: displayRules.size,
    trustBadges: trustBadges.size,
    socialProofElements: {
      total: totalElements,
      active: activeElements,
    },
    abTests: {
      total: totalTests,
      active: activeTests,
    },
    performance: {
      totalImpressions,
      totalClicks,
      averageCTR: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0,
    },
  };
}

module.exports = {
  createDisplayRule,
  getDisplayRule,
  listDisplayRules,
  updateDisplayRule,
  evaluateDisplayRules,
  optimizeReviewDisplay,
  createTrustBadge,
  getApplicableBadges,
  listTrustBadges,
  createSocialProofElement,
  getSocialProofElements,
  trackSocialProofInteraction,
  createABTest,
  trackABTestVariant,
  getABTestResults,
  generateConversionInsights,
  getOptimizationStatistics,
};
