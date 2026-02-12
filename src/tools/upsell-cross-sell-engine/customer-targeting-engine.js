/**
 * CUSTOMER TARGETING ENGINE
 * Handles customer segmentation, propensity scoring, behavior analysis,
 * RFM analysis, and personalized targeting strategies
 */

// In-memory stores
const customers = new Map();
const segments = new Map();
const propensityScores = new Map();
const behaviorProfiles = new Map();

// ================================================================
// CUSTOMER MANAGEMENT
// ================================================================

function createCustomer({ email, firstName, lastName, properties = {} }) {
  const id = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const customer = {
    id,
    email,
    firstName,
    lastName,
    properties,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    purchaseHistory: [],
    interactions: [],
    segments: []
  };
  
  customers.set(id, customer);
  return customer;
}

function getCustomer(id) {
  return customers.get(id) || null;
}

function updateCustomer(id, updates) {
  const customer = customers.get(id);
  if (!customer) return null;
  
  const updated = {
    ...customer,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  customers.set(id, updated);
  return updated;
}

// ================================================================
// SEGMENTATION
// ================================================================

function createSegment({ name, description, rules, type = 'dynamic' }) {
  const id = `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const segment = {
    id,
    name,
    description,
    rules, // Array of conditions
    type, // 'dynamic' or 'static'
    customerCount: 0,
    createdAt: new Date().toISOString()
  };
  
  segments.set(id, segment);
  
  // Compute initial membership
  if (type === 'dynamic') {
    computeSegmentMembership(id);
  }
  
  return segment;
}

function getSegment(id) {
  return segments.get(id) || null;
}

function listSegments({ limit = 100 }) {
  return Array.from(segments.values())
    .sort((a, b) => b.customerCount - a.customerCount)
    .slice(0, limit);
}

function computeSegmentMembership(segmentId) {
  const segment = segments.get(segmentId);
  if (!segment) return null;
  
  let matchedCustomers = [];
  
  customers.forEach(customer => {
    if (customerMatchesRules(customer, segment.rules)) {
      matchedCustomers.push(customer.id);
      if (!customer.segments.includes(segmentId)) {
        customer.segments.push(segmentId);
        customers.set(customer.id, customer);
      }
    }
  });
  
  segment.customerCount = matchedCustomers.length;
  segments.set(segmentId, segment);
  
  return { segmentId, customerCount: matchedCustomers.length, customers: matchedCustomers };
}

function customerMatchesRules(customer, rules) {
  return rules.every(rule => evaluateRule(customer, rule));
}

function evaluateRule(customer, rule) {
  const { field, operator, value } = rule;
  const customerValue = getCustomerField(customer, field);
  
  switch (operator) {
    case 'equals':
      return customerValue === value;
    case 'not_equals':
      return customerValue !== value;
    case 'greater_than':
      return customerValue > value;
    case 'less_than':
      return customerValue < value;
    case 'contains':
      return String(customerValue).includes(value);
    case 'in':
      return Array.isArray(value) && value.includes(customerValue);
    default:
      return false;
  }
}

function getCustomerField(customer, field) {
  if (field.startsWith('properties.')) {
    const prop = field.split('.')[1];
    return customer.properties[prop];
  }
  
  if (field === 'totalSpent') {
    return calculateTotalSpent(customer);
  }
  
  if (field === 'orderCount') {
    return customer.purchaseHistory.length;
  }
  
  if (field === 'avgOrderValue') {
    return calculateAvgOrderValue(customer);
  }
  
  return customer[field];
}

// ================================================================
// RFM ANALYSIS
// ================================================================

function calculateRFM(customerId) {
  const customer = customers.get(customerId);
  if (!customer || !customer.purchaseHistory.length) {
    return { recency: 0, frequency: 0, monetary: 0, score: 0 };
  }
  
  // Recency: days since last purchase
  const lastPurchase = new Date(Math.max(...customer.purchaseHistory.map(p => new Date(p.date))));
  const recencyDays = Math.floor((Date.now() - lastPurchase) / (1000 * 60 * 60 * 24));
  const recencyScore = getRecencyScore(recencyDays);
  
  // Frequency: number of purchases
  const frequency = customer.purchaseHistory.length;
  const frequencyScore = getFrequencyScore(frequency);
  
  // Monetary: total spent
  const monetary = calculateTotalSpent(customer);
  const monetaryScore = getMonetaryScore(monetary);
  
  const rfmScore = (recencyScore * 100) + (frequencyScore * 10) + monetaryScore;
  
  return {
    recency: recencyDays,
    recencyScore,
    frequency,
    frequencyScore,
    monetary,
    monetaryScore,
    score: rfmScore,
    segment: getRFMSegment(rfmScore)
  };
}

function getRecencyScore(days) {
  if (days <= 30) return 5;
  if (days <= 90) return 4;
  if (days <= 180) return 3;
  if (days <= 365) return 2;
  return 1;
}

function getFrequencyScore(count) {
  if (count >= 10) return 5;
  if (count >= 5) return 4;
  if (count >= 3) return 3;
  if (count >= 2) return 2;
  return 1;
}

function getMonetaryScore(amount) {
  if (amount >= 1000) return 5;
  if (amount >= 500) return 4;
  if (amount >= 250) return 3;
  if (amount >= 100) return 2;
  return 1;
}

function getRFMSegment(score) {
  if (score >= 444) return 'Champions';
  if (score >= 344) return 'Loyal Customers';
  if (score >= 333) return 'Potential Loyalists';
  if (score >= 244) return 'Recent Customers';
  if (score >= 233) return 'Promising';
  if (score >= 222) return 'Need Attention';
  if (score >= 144) return 'About to Sleep';
 if (score >= 133) return 'At Risk';
  if (score >= 122) return 'Cannot Lose';
  return 'Lost';
}

function bulkCalculateRFM({ segmentId, limit = 1000 }) {
  let customersToAnalyze = Array.from(customers.values());
  
  if (segmentId) {
    const segment = segments.get(segmentId);
    if (segment) {
      customersToAnalyze = customersToAnalyze.filter(c => c.segments.includes(segmentId));
    }
  }
  
  return customersToAnalyze
    .slice(0, limit)
    .map(customer => ({
      customerId: customer.id,
      email: customer.email,
      ...calculateRFM(customer.id)
    }))
    .sort((a, b) => b.score - a.score);
}

// ================================================================
// PROPENSITY SCORING
// ================================================================

function calculatePropensityScore({ customerId, action, features = {} }) {
  const customer = customers.get(customerId);
  if (!customer) return null;
  
  // Combine customer features with provided features
  const allFeatures = {
    ...extractCustomerFeatures(customer),
    ...features
  };
  
  // Calculate propensity for specific action
  let score = 0;
  
  switch (action) {
    case 'upsell':
      score = calculateUpsellPropensity(allFeatures);
      break;
    case 'cross_sell':
      score = calculateCrossSellPropensity(allFeatures);
      break;
    case 'churn':
      score = calculateChurnPropensity(allFeatures);
      break;
    case 'purchase':
      score = calculatePurchasePropensity(allFeatures);
      break;
    default:
      score = 0.5;
  }
  
  const propensity = {
    customerId,
    action,
    score,
    confidence: 0.75,
    features: allFeatures,
    calculatedAt: new Date().toISOString()
  };
  
  const key = `${customerId}_${action}`;
  propensityScores.set(key, propensity);
  
  return propensity;
}

function extractCustomerFeatures(customer) {
  const rfm = calculateRFM(customer.id);
  
  return {
    recencyDays: rfm.recency,
    orderCount: customer.purchaseHistory.length,
    totalSpent: calculateTotalSpent(customer),
    avgOrderValue: calculateAvgOrderValue(customer),
    daysSinceFirstPurchase: calculateDaysSince(customer.createdAt),
    engagementScore: calculateEngagementScore(customer),
    rfmScore: rfm.score
  };
}

function calculateUpsellPropensity(features) {
  // Higher AOV, higher recency = higher upsell propensity
  let score = 0.5;
  
  if (features.avgOrderValue > 200) score += 0.2;
  else if (features.avgOrderValue > 100) score += 0.1;
  
  if (features.recencyDays < 30) score += 0.2;
  else if (features.recencyDays < 90) score += 0.1;
  
  if (features.orderCount > 5) score += 0.1;
  
  return Math.min(Math.max(score, 0), 1);
}

function calculateCrossSellPropensity(features) {
  // More orders, higher engagement = higher cross-sell propensity
  let score = 0.5;
  
  if (features.orderCount > 3) score += 0.2;
  if (features.engagementScore > 0.7) score += 0.2;
  if (features.recencyDays < 60) score += 0.1;
  
  return Math.min(Math.max(score, 0), 1);
}

function calculateChurnPropensity(features) {
  // Low recency, declining engagement = higher churn
  let score = 0.2;
  
  if (features.recencyDays > 180) score += 0.3;
  else if (features.recencyDays > 90) score += 0.2;
  
  if (features.engagementScore < 0.3) score += 0.3;
  if (features.orderCount === 1) score += 0.2;
  
  return Math.min(Math.max(score, 0), 1);
}

function calculatePurchasePropensity(features) {
  // Combination of recency and historical behavior
  let score = 0.5;
  
  if (features.recencyDays < 30) score += 0.2;
  if (features.orderCount > 2) score += 0.15;
  if (features.engagementScore > 0.6) score += 0.15;
  
  return Math.min(Math.max(score, 0), 1);
}

function getPropensityScore(customerId, action) {
  const key = `${customerId}_${action}`;
  return propensityScores.get(key) || null;
}

function getHighPropensityCustomers({ action, minScore = 0.7, limit = 100 }) {
  const filtered = Array.from(propensityScores.values())
    .filter(p => p.action === action && p.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  
  return filtered;
}

// ================================================================
// BEHAVIOR ANALYSIS
// ================================================================

function createBehaviorProfile(customerId) {
  const customer = customers.get(customerId);
  if (!customer) return null;
  
  const profile = {
    customerId,
    browsingBehavior: analyzeBrowsingBehavior(customer),
    purchaseBehavior: analyzePurchaseBehavior(customer),
    engagementBehavior: analyzeEngagementBehavior(customer),
    preferences: extractPreferences(customer),
    createdAt: new Date().toISOString()
  };
  
  behaviorProfiles.set(customerId, profile);
  return profile;
}

function analyzeBrowsingBehavior(customer) {
  return {
    categoriesViewed: [],
    avgSessionDuration: 0,
    pagesPerSession: 0,
    favoriteCategories: []
  };
}

function analyzePurchaseBehavior(customer) {
  return {
    avgOrderValue: calculateAvgOrderValue(customer),
    preferredPaymentMethod: 'credit_card',
    avgTimeBetweenOrders: calculateAvgTimeBetweenOrders(customer),
    preferredCategories: [],
    priceRange: { min: 0, max: 1000 }
  };
}

function analyzeEngagementBehavior(customer) {
  return {
    emailOpenRate: 0.3,
    emailClickRate: 0.15,
    smsResponseRate: 0.2,
    lastEngagement: customer.updatedAt
  };
}

function extractPreferences(customer) {
  return {
    channels: ['email', 'sms'],
    frequency: 'weekly',
    contentTypes: ['promotions', 'new_arrivals']
  };
}

function getBehaviorProfile(customerId) {
  let profile = behaviorProfiles.get(customerId);
  if (!profile) {
    profile = createBehaviorProfile(customerId);
  }
  return profile;
}

// ================================================================
// TARGETING
// ================================================================

function getTargetAudience({ action, minPropensity = 0.6, segments: segmentIds = [], limit = 500 }) {
  let audience = Array.from(customers.values());
  
  // Filter by segments
  if (segmentIds.length > 0) {
    audience = audience.filter(c => 
      segmentIds.some(sid => c.segments.includes(sid))
    );
  }
  
  // Calculate propensity for each customer
  const scored = audience.map(customer => {
    const propensity = calculatePropensityScore({
      customerId: customer.id,
      action
    });
    
    return {
      customer,
      propensityScore: propensity.score
    };
  });
  
  // Filter by minimum propensity
  const targeted = scored
    .filter(s => s.propensityScore >= minPropensity)
    .sort((a, b) => b.propensityScore - a.propensityScore)
    .slice(0, limit);
  
  return {
    action,
    audienceSize: targeted.length,
    avgPropensity: targeted.reduce((sum, t) => sum + t.propensityScore, 0) / targeted.length,
    customers: targeted.map(t => ({
      customerId: t.customer.id,
      email: t.customer.email,
      propensityScore: t.propensityScore
    }))
  };
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function calculateTotalSpent(customer) {
  return customer.purchaseHistory.reduce((sum, p) => sum + p.amount, 0);
}

function calculateAvgOrderValue(customer) {
  if (!customer.purchaseHistory.length) return 0;
  return calculateTotalSpent(customer) / customer.purchaseHistory.length;
}

function calculateAvgTimeBetweenOrders(customer) {
  if (customer.purchaseHistory.length < 2) return 0;
  
  const dates = customer.purchaseHistory
    .map(p => new Date(p.date))
    .sort((a, b) => a - b);
  
  let totalDays = 0;
  for (let i = 1; i < dates.length; i++) {
    const days = (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
    totalDays += days;
  }
  
  return totalDays / (dates.length - 1);
}

function calculateEngagementScore(customer) {
  // Placeholder engagement calculation
  return 0.5;
}

function calculateDaysSince(dateString) {
  const date = new Date(dateString);
  return Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24));
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Customer Management
  createCustomer,
  getCustomer,
  updateCustomer,
  
  // Segmentation
  createSegment,
  getSegment,
  listSegments,
  computeSegmentMembership,
  
  // RFM Analysis
  calculateRFM,
  bulkCalculateRFM,
  
  // Propensity Scoring
  calculatePropensityScore,
  getPropensityScore,
  getHighPropensityCustomers,
  
  // Behavior Analysis
  createBehaviorProfile,
  getBehaviorProfile,
  
  // Targeting
  getTargetAudience,
  
  // Data stores
  customers,
  segments,
  propensityScores,
  behaviorProfiles
};
