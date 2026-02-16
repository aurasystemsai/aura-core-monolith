/**
 * Vertical Edition Templates Engine
 * 
 * Industry-specific CDP configurations with 3x pricing premium
 * Foundation for $240M+ vertical-specific revenue
 * 
 * Verticals:
 * - Fashion & Apparel
 * - Beauty & Cosmetics
 * - Food & Beverage
 * - Home & Garden
 * - Pet Products
 * - Health & Wellness
 * - Electronics & Tech
 * - Jewelry & Accessories
 * 
 * Each vertical includes:
 * - Pre-built segments
 * - Industry-specific metrics
 * - Vertical integrations
 * - Custom workflows
 * - Benchmarking data
 */

// In-memory storage
const verticalTemplates = new Map();
const deployedVerticals = new Map();

/**
 * Vertical Editions
 */
const VERTICAL_EDITIONS = {
  fashion: {
    id: 'fashion',
    name: 'Fashion & Apparel CDP',
    monthlyPrice: 899, // 3x base price of $299
    targetCustomers: 'Fashion brands, clothing retailers, apparel DTC',
    
    valueProps: [
      'Pre-built segments for fashion shoppers',
      'Trend forecasting AI',
      'Influencer marketplace integration',
      'Size consistency tracking',
      'Style preference analytics',
      'Seasonal trend analysis',
      'Sample & returns management',
    ],
    
    prebuiltSegments: [
      {
        name: 'New Season Shoppers',
        description: 'Customers who buy within 2 weeks of collection launch',
        criteria: 'Purchase within 14 days of new collection release',
      },
      {
        name: 'Size Consistent Buyers',
        description: 'Customers with low return rate (good fit)',
        criteria: 'Return rate < 10% AND purchases > 3',
      },
      {
        name: 'Style Loyalists',
        description: 'Customers who repeatedly buy same style/aesthetic',
        criteria: 'Category consistency > 70% (e.g., always buys minimalist)',
      },
      {
        name: 'Trend Early Adopters',
        description: 'First to buy trending items',
        criteria: 'Purchases trending items in first 20% of lifecycle',
      },
      {
        name: 'High Return Risk',
        description: 'Customers with >30% return rate',
        criteria: 'Return rate > 30% for fit/size issues',
      },
    ],
    
    customMetrics: [
      { name: 'Return Rate', formula: 'returns / purchases' },
      { name: 'Fit Issues %', formula: 'size-related returns / total returns' },
      { name: 'Trend Adoption Speed', formula: 'days from trend emergence to purchase' },
      { name: 'Style Consistency', formula: 'purchases in primary category / total purchases' },
      { name: 'Seasonal Purchase Pattern', formula: 'quarterly purchase distribution' },
    ],
    
    integrations: [
      { name: 'Instagram Shopping', type: 'social_commerce' },
      { name: 'TikTok Shop', type: 'social_commerce' },
      { name: 'LTK (LikeToKnow.it)', type: 'influencer' },
      { name: 'Refersion', type: 'influencer' },
      { name: 'Returnly', type: 'returns_management' },
      { name: 'Loop Returns', type: 'returns_management' },
    ],
    
    workflows: [
      'New collection launch campaign',
      'Seasonal transition email flow',
      'Size recommendation quiz',
      'Influencer gifting automation',
      'Return prevention for high-risk',
    ],
  },
  
  beauty: {
    id: 'beauty',
    name: 'Beauty & Cosmetics CDP',
    monthlyPrice: 899,
    targetCustomers: 'Beauty brands, cosmetics, skincare, haircare DTC',
    
    valueProps: [
      'Skin type & preference segments',
      'Ingredient preference tracking',
      'Subscription optimization',
      'Shade matching history',
      'Product affinity mapping',
      'Influencer ROI tracking',
    ],
    
    prebuiltSegments: [
      {
        name: 'Dry Skin Shoppers',
        description: 'Customers who buy hydrating/moisturizing products',
        criteria: 'Product purchases tagged with "dry skin", "hydrating", "moisturizing"',
      },
      {
        name: 'Clean Beauty Advocates',
        description: 'Customers who prefer clean/natural ingredients',
        criteria: 'Product preferences include "clean", "natural", "organic"',
      },
      {
        name: 'Subscription Members',
        description: 'Active subscription box customers',
        criteria: 'Active subscription status',
      },
      {
        name: 'Shade Match Successful',
        description: 'Customers with low return rate on color products',
        criteria: 'Foundation/concealer return rate < 5%',
      },
      {
        name: 'Product Loyalists',
        description: 'Customers who repurchase same products',
        criteria: 'Repurchase rate > 50%',
      },
    ],
    
    customMetrics: [
      { name: 'Repurchase Rate', formula: 'repeat purchases / total purchases' },
      { name: 'Subscription LTV', formula: 'total subscription revenue / subscriber' },
      { name: 'Shade Match Accuracy', formula: '1 - (color product returns / color purchases)' },
      { name: 'Ingredient Preference', formula: 'top ingredient tags in purchase history' },
      { name: 'Product Affinity Score', formula: 'categories purchased together' },
    ],
    
    integrations: [
      { name: 'Recharge', type: 'subscriptions' },
      { name: 'Yotpo Reviews', type: 'reviews_ugc' },
      { name: 'Ipsy/Boxycharm', type: 'subscription_boxes' },
      { name: 'ShadeScout', type: 'shade_matching' },
      { name: 'Influencer Gifting Platform', type: 'influencer' },
    ],
    
    workflows: [
      'Subscription upsell for high LTV',
      'Replenishment reminder (30 days before runout)',
      'Clean beauty education series',
      'Shade finder quiz',
      'Influencer PR box automation',
    ],
  },
  
  food: {
    id: 'food',
    name: 'Food & Beverage CDP',
    monthlyPrice: 899,
    targetCustomers: 'Food brands, beverage companies, meal kits, specialty foods',
    
    valueProps: [
      'Dietary preference segmentation',
      'Allergen tracking',
      'Recipe content personalization',
      'Purchase frequency optimization',
      'Subscription box intelligence',
    ],
    
    prebuiltSegments: [
      {
        name: 'Vegan Shoppers',
        description: 'Customers buying only vegan products',
        criteria: 'Product tags include "vegan" AND never purchased non-vegan',
      },
      {
        name: 'Allergen Aware',
        description: 'Customers avoiding specific allergens',
        criteria: 'Profile custom field has allergen preferences',
      },
      {
        name: 'High Frequency Buyers',
        description: 'Weekly/biweekly purchasers',
        criteria: 'Average purchase frequency < 14 days',
      },
      {
        name: 'Recipe Engagers',
        description: 'Customers who click recipe content',
        criteria: 'Recipe email click rate > 20%',
      },
      {
        name: 'Subscription Churners',
        description: 'Subscription members showing churn signals',
        criteria: 'Subscription active BUT skipped 2+ deliveries',
      },
    ],
    
    customMetrics: [
      { name: 'Purchase Frequency', formula: 'days between orders' },
      { name: 'Dietary Consistency', formula: 'purchases matching stated diet / total purchases' },
      { name: 'Recipe Engagement', formula: 'recipe clicks / recipe emails sent' },
      { name: 'Subscription Retention', formula: 'active subscribers / total signups' },
      { name: 'Flavor Preference', formula: 'most purchased flavor profiles' },
    ],
    
    integrations: [
      { name: 'Recharge', type: 'subscriptions' },
      { name: 'Recipe Syndication API', type: 'content' },
      { name: 'Allergen Database', type: 'safety' },
      { name: 'Nutrition API', type: 'data' },
    ],
    
    workflows: [
      'Replenishment reminder based on consumption rate',
      'Recipe recommendations by purchase history',
      'Allergen alert for new products',
      'Subscription skip prevention',
      'Dietary education series',
    ],
  },
  
  home_garden: {
    id: 'home_garden',
    name: 'Home & Garden CDP',
    monthlyPrice: 899,
    targetCustomers: 'Home decor, furniture, gardening, outdoor living',
    
    valueProps: [
      'Room-based segmentation',
      'Style preference mapping',
      'Project completion tracking',
      'Seasonal purchase patterns',
    ],
    
    prebuiltSegments: [
      {
        name: 'Modern Minimalist',
        description: 'Customers buying modern, minimal aesthetic',
        criteria: 'Style tags include "modern", "minimalist", "contemporary"',
      },
      {
        name: 'DIY Enthusiasts',
        description: 'Customers buying project materials',
        criteria: 'Purchase history includes DIY/project categories',
      },
      {
        name: 'Seasonal Decorators',
        description: 'Customers who update decor seasonally',
        criteria: 'Purchases in 3+ seasonal categories (spring, summer, fall, winter)',
      },
    ],
    
    customMetrics: [
      { name: 'Style Consistency', formula: 'primary style tag frequency' },
      { name: 'Room Coverage', formula: 'distinct room categories purchased' },
      { name: 'Project Completion', formula: 'complementary items purchased together' },
    ],
    
    integrations: [
      { name: 'Houzz', type: 'marketplace' },
      { name: 'Pinterest', type: 'inspiration' },
      { name: 'AR Visualization', type: 'try_before_buy' },
    ],
    
    workflows: [
      'Room refresh campaign',
      'Style quiz onboarding',
      'Seasonal decor reminders',
      'Project completion follow-up',
    ],
  },
  
  pet: {
    id: 'pet',
    name: 'Pet Products CDP',
    monthlyPrice: 899,
    targetCustomers: 'Pet food, pet supplies, pet subscription boxes',
    
    valueProps: [
      'Pet profile tracking (age, breed, size)',
      'Replenishment optimization',
      'Multi-pet household management',
      'Veterinary event tracking',
    ],
    
    prebuiltSegments: [
      {
        name: 'Large Breed Owners',
        description: 'Customers with large dogs',
        criteria: 'Pet profile: weight > 50 lbs',
      },
      {
        name: 'Multi-Pet Households',
        description: 'Customers with 2+ pets',
        criteria: 'Pet count >= 2',
      },
      {
        name: 'Premium Buyers',
        description: 'Customers buying premium/organic pet food',
        criteria: 'Product tags include "premium", "organic", "grain-free"',
      },
    ],
    
    customMetrics: [
      { name: 'Repurchase Frequency', formula: 'food repurchase interval' },
      { name: 'Pet Lifetime Value', formula: 'total spend / pet age in months' },
      { name: 'Multi-Pet Spend', formula: 'spend per pet in household' },
    ],
    
    integrations: [
      { name: 'Recharge', type: 'subscriptions' },
      { name: 'Vet Records API', type: 'health' },
      { name: 'Pet Adoption Services', type: 'lifecycle' },
    ],
    
    workflows: [
      'Food replenishment by pet weight/breed',
      'Birthday/adoption day celebration',
      'New pet onboarding series',
      'Vet visit follow-up',
    ],
  },
  
  health_wellness: {
    id: 'health_wellness',
    name: 'Health & Wellness CDP',
    monthlyPrice: 899,
    targetCustomers: 'Supplements, fitness, wellness brands',
    
    valueProps: [
      'Goal-based segmentation',
      'Compliance tracking',
      'Protocol completion rates',
      'Health outcome correlation',
    ],
    
    prebuiltSegments: [
      {
        name: 'Weight Loss Goal',
        description: 'Customers buying weight management products',
        criteria: 'Product categories: weight loss, metabolism',
      },
      {
        name: 'High Compliance',
        description: 'Customers with consistent repurchase',
        criteria: 'Repurchase on schedule +/- 3 days',
      },
      {
        name: 'Protocol Completers',
        description: 'Customers who finish recommended protocol',
        criteria: 'Purchased all steps in protocol',
      },
    ],
    
    customMetrics: [
      { name: 'Compliance Rate', formula: 'on-time repurchases / expected repurchases' },
      { name: 'Protocol Completion', formula: 'completed protocols / started protocols' },
      { name: 'Goal Achievement Time', formula: 'days from start to goal product purchase' },
    ],
    
    integrations: [
      { name: 'Recharge', type: 'subscriptions' },
      { name: 'Health Tracker APIs', type: 'data' },
      { name: 'Quiz Platform', type: 'onboarding' },
    ],
    
    workflows: [
      'Protocol adherence reminders',
      'Goal milestone celebrations',
      'Replenishment optimization',
      'Health education series',
    ],
  },
  
  electronics: {
    id: 'electronics',
    name: 'Electronics & Tech CDP',
    monthlyPrice: 899,
    targetCustomers: 'Consumer electronics, tech accessories, gadgets',
    
    valueProps: [
      'Product lifecycle tracking',
      'Upgrade opportunity detection',
      'Accessory cross-sell',
      'Warranty & support integration',
    ],
    
    prebuiltSegments: [
      {
        name: 'Early Adopters',
        description: 'Customers who buy new releases',
        criteria: 'Purchase within 30 days of product launch',
      },
      {
        name: 'Accessory Buyers',
        description: 'High accessory attach rate',
        criteria: 'Accessories per main product > 2',
      },
      {
        name: 'Upgrade Candidates',
        description: 'Customers with aging devices',
        criteria: 'Last purchase > 18 months ago AND device category',
      },
    ],
    
    customMetrics: [
      { name: 'Accessory Attach Rate', formula: 'accessories / main products' },
      { name: 'Upgrade Cycle', formula: 'months between device purchases' },
      { name: 'Warranty Purchase Rate', formula: 'warranties / main products' },
    ],
    
    integrations: [
      { name: 'Product Launch Calendar', type: 'inventory' },
      { name: 'Warranty Provider', type: 'protection' },
      { name: 'Trade-In Platform', type: 'recycling' },
    ],
    
    workflows: [
      'New release notification',
      'Accessory recommendations',
      'Upgrade opportunity campaign',
      'Warranty expiration reminder',
    ],
  },
  
  jewelry: {
    id: 'jewelry',
    name: 'Jewelry & Accessories CDP',
    monthlyPrice: 899,
    targetCustomers: 'Fine jewelry, fashion jewelry, watches, accessories',
    
    valueProps: [
      'Style preference tracking',
      'Gifting occasion detection',
      'Metal/stone preference',
      'Price sensitivity segmentation',
    ],
    
    prebuiltSegments: [
      {
        name: 'Gold Lovers',
        description: 'Customers preferring gold jewelry',
        criteria: 'Metal preference: gold (75%+ of purchases)',
      },
      {
        name: 'Gift Buyers',
        description: 'Customers buying for others',
        criteria: 'Purchase with gift message OR around holidays/occasions',
      },
      {
        name: 'Fine Jewelry Collectors',
        description: 'High-value jewelry buyers',
        criteria: 'Average order value > $1,000',
      },
    ],
    
    customMetrics: [
      { name: 'Metal Preference', formula: 'most purchased metal type' },
      { name: 'Stone Preference', formula: 'most purchased gemstone' },
      { name: 'Gifting Frequency', formula: 'gift purchases / total purchases' },
    ],
    
    integrations: [
      { name: 'Virtual Try-On', type: 'ar' },
      { name: 'Occasion Calendar', type: 'reminders' },
      { name: 'Insurance Provider', type: 'protection' },
    ],
    
    workflows: [
      'Anniversary/birthday reminders',
      'Style recommendation quiz',
      'New collection early access',
      'Jewelry care education',
    ],
  },
};

/**
 * Deploy vertical template to customer
 */
function deployVerticalTemplate(customerId, verticalId, customization = {}) {
  const template = VERTICAL_EDITIONS[verticalId];
  if (!template) {
    throw new Error(`Invalid vertical: ${verticalId}`);
  }
  
  const deploymentId = `vdeploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const deployment = {
    id: deploymentId,
    customerId,
    verticalId,
    verticalName: template.name,
    
    monthlyPrice: customization.monthlyPrice || template.monthlyPrice,
    
    // Deployed segments
    segments: template.prebuiltSegments.map(seg => ({
      ...seg,
      segmentId: `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      enabled: true,
    })),
    
    // Deployed metrics
    metrics: template.customMetrics,
    
    // Active integrations
    integrations: customization.integrations || [],
    
    // Active workflows
    workflows: customization.workflows || [],
    
    customization,
    
    status: 'active',
    deployedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  deployedVerticals.set(deploymentId, deployment);
  return deployment;
}

/**
 * Get vertical template catalog
 */
function getVerticalCatalog() {
  return Object.values(VERTICAL_EDITIONS).map(v => ({
    id: v.id,
    name: v.name,
    monthlyPrice: v.monthlyPrice,
    targetCustomers: v.targetCustomers,
    valueProps: v.valueProps,
    segmentCount: v.prebuiltSegments.length,
    metricCount: v.customMetrics.length,
    integrationCount: v.integrations.length,
  }));
}

/**
 * Get vertical template details
 */
function getVerticalTemplate(verticalId) {
  return VERTICAL_EDITIONS[verticalId] || null;
}

/**
 * Get customer's deployed verticals
 */
function getCustomerVerticals(customerId) {
  return Array.from(deployedVerticals.values()).filter(d => d.customerId === customerId);
}

/**
 * Get vertical revenue analytics (admin)
 */
function getVerticalRevenueAnalytics() {
  const deployments = Array.from(deployedVerticals.values()).filter(d => d.status === 'active');
  
  const analytics = {
    totalDeployments: deployments.length,
    totalMRR: 0,
    byVertical: {},
  };
  
  for (const deployment of deployments) {
    const vertical = deployment.verticalId;
    
    if (!analytics.byVertical[vertical]) {
      analytics.byVertical[vertical] = {
        name: VERTICAL_EDITIONS[vertical].name,
        deployments: 0,
        mrr: 0,
      };
    }
    
    analytics.byVertical[vertical].deployments++;
    analytics.byVertical[vertical].mrr += deployment.monthlyPrice;
    analytics.totalMRR += deployment.monthlyPrice;
  }
  
  return analytics;
}

// Export
module.exports = {
  // Deployment
  deployVerticalTemplate,
  
  // Discovery
  getVerticalCatalog,
  getVerticalTemplate,
  getCustomerVerticals,
  
  // Analytics
  getVerticalRevenueAnalytics,
  
  // Constants
  VERTICAL_EDITIONS,
};
