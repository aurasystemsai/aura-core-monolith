// ================================================================
// KLAVIYO FLOW AUTOMATION - AI & PERSONALIZATION ENGINE
// ================================================================
// Handles AI predictions, personalization, recommendations, optimization
// ================================================================

const crypto = require('crypto');

// In-memory stores
const predictions = new Map();
const personalizationRules = new Map();
const recommendations = new Map();
const abTests = new Map();
const optimizations = new Map();
const models = new Map();

// ================================================================
// AI PREDICTIONS
// ================================================================

function createPrediction(data) {
  const prediction = {
    id: `PRED-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    type: data.type || 'churn',
    contactId: data.contactId || null,
    score: data.score || 0,
    confidence: data.confidence || 0,
    factors: data.factors || [],
    recommendation: data.recommendation || '',
    expiresAt: Date.now() + (data.ttl || 7 * 24 * 60 * 60 * 1000),
    createdAt: Date.now()
  };
  
  predictions.set(prediction.id, prediction);
  return prediction;
}

function getPrediction(id) {
  return predictions.get(id);
}

function getPredictionsByContact(contactId, type = null) {
  let results = Array.from(predictions.values()).filter(p => p.contactId === contactId);
  
  if (type) {
    results = results.filter(p => p.type === type);
  }
  
  return results.sort((a, b) => b.createdAt - a.createdAt);
}

function predictChurn(contactId, data = {}) {
  // Simulate ML prediction
  const daysSinceLastEngagement = data.daysSinceLastEngagement || 0;
  const totalEngagements = data.totalEngagements || 0;
  const averageOrderValue = data.averageOrderValue || 0;
  
  let score = 0;
  if (daysSinceLastEngagement > 30) score += 30;
  if (totalEngagements < 5) score += 25;
  if (averageOrderValue < 50) score += 20;
  
  const churnRisk = Math.min(score, 100);
  
  const prediction = createPrediction({
    type: 'churn',
    contactId,
    score: churnRisk,
    confidence: 0.85,
    factors: [
      { factor: 'days_since_engagement', value: daysSinceLastEngagement, weight: 0.4 },
      { factor: 'total_engagements', value: totalEngagements, weight: 0.3 },
      { factor: 'avg_order_value', value: averageOrderValue, weight: 0.3 }
    ],
    recommendation: churnRisk > 70 ? 'Send win-back campaign' : 'Monitor engagement'
  });
  
  return prediction;
}

function predictLTV(contactId, data = {}) {
  // Simulate LTV prediction
  const avgOrderValue = data.avgOrderValue || 0;
  const purchaseFrequency = data.purchaseFrequency || 0;
  const customerLifespan = data.customerLifespan || 12;
  
  const ltv = avgOrderValue * purchaseFrequency * customerLifespan;
  
  const prediction = createPrediction({
    type: 'ltv',
    contactId,
    score: ltv,
    confidence: 0.78,
    factors: [
      { factor: 'avg_order_value', value: avgOrderValue, weight: 0.4 },
      { factor: 'purchase_frequency', value: purchaseFrequency, weight: 0.35 },
      { factor: 'customer_lifespan', value: customerLifespan, weight: 0.25 }
    ],
    recommendation: ltv > 1000 ? 'Upsell premium products' : 'Cross-sell related items'
  });
  
  return prediction;
}

function predictNextPurchase(contactId, data = {}) {
  // Simulate next purchase prediction
  const daysBetweenPurchases = data.daysBetweenPurchases || 30;
  const daysSinceLastPurchase = data.daysSinceLastPurchase || 0;
  
  const daysUntilNext = Math.max(daysBetweenPurchases - daysSinceLastPurchase, 0);
  const probability = Math.max(0, 100 - (daysUntilNext / daysBetweenPurchases * 100));
  
  const prediction = createPrediction({
    type: 'next_purchase',
    contactId,
    score: probability,
    confidence: 0.72,
    factors: [
      { factor: 'avg_days_between_purchases', value: daysBetweenPurchases, weight: 0.5 },
      { factor: 'days_since_last_purchase', value: daysSinceLastPurchase, weight: 0.5 }
    ],
    recommendation: probability > 70 ? 'Send product recommendation email' : 'Wait for optimal timing'
  });
  
  return prediction;
}

// ================================================================
// PERSONALIZATION
// ================================================================

function listPersonalizationRules(filter = {}) {
  let results = Array.from(personalizationRules.values());
  
  if (filter.type) {
    results = results.filter(r => r.type === filter.type);
  }
  if (filter.active !== undefined) {
    results = results.filter(r => r.active === filter.active);
  }
  
  return results;
}

function createPersonalizationRule(data) {
  const rule = {
    id: `PERS-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'Untitled Rule',
    type: data.type || 'content',
    conditions: data.conditions || [],
    transformations: data.transformations || [],
    priority: data.priority || 0,
    active: data.active !== false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  personalizationRules.set(rule.id, rule);
  return rule;
}

function getPersonalizationRule(id) {
  return personalizationRules.get(id);
}

function updatePersonalizationRule(id, updates) {
  const rule = personalizationRules.get(id);
  if (!rule) return null;
  
  Object.assign(rule, updates, { updatedAt: Date.now() });
  personalizationRules.set(id, rule);
  return rule;
}

function deletePersonalizationRule(id) {
  return personalizationRules.delete(id);
}

function personalizeContent(content, contactData = {}) {
  const applicableRules = Array.from(personalizationRules.values())
    .filter(r => r.active && r.type === 'content')
    .sort((a, b) => b.priority - a.priority);
  
  let personalizedContent = content;
  
  applicableRules.forEach(rule => {
    const conditionsMet = rule.conditions.every(condition => {
      const value = contactData[condition.field];
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return String(value).includes(condition.value);
        case 'greater_than':
          return Number(value) > Number(condition.value);
        default:
          return true;
      }
    });
    
    if (conditionsMet) {
      rule.transformations.forEach(transform => {
        if (transform.type === 'replace') {
          personalizedContent = personalizedContent.replace(transform.pattern, transform.replacement);
        } else if (transform.type === 'insert_variable') {
          personalizedContent = personalizedContent.replace(`{{${transform.variable}}}`, contactData[transform.variable] || '');
        }
      });
    }
  });
  
  return personalizedContent;
}

// ================================================================
// RECOMMENDATIONS
// ================================================================

function generateRecommendations(contactId, data = {}) {
  const recommendation = {
    id: `REC-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    contactId,
    type: data.type || 'product',
    items: data.items || [],
    algorithm: data.algorithm || 'collaborative_filtering',
    score: data.score || 0,
    reason: data.reason || 'Based on purchase history',
    generatedAt: Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000)
  };
  
  // Simulate recommendation generation
  if (recommendation.type === 'product') {
    recommendation.items = [
      { id: 'PROD-001', name: 'Premium Widget', score: 0.92 },
      { id: 'PROD-002', name: 'Deluxe Gadget', score: 0.87 },
      { id: 'PROD-003', name: 'Super Tool', score: 0.81 }
    ];
  } else if (recommendation.type === 'content') {
    recommendation.items = [
      { id: 'ART-001', title: 'How to Maximize ROI', score: 0.89 },
      { id: 'ART-002', title: 'Best Practices Guide', score: 0.84 }
    ];
  }
  
  recommendations.set(recommendation.id, recommendation);
  return recommendation;
}

function getRecommendations(contactId, type = null) {
  let results = Array.from(recommendations.values())
    .filter(r => r.contactId === contactId && r.expiresAt > Date.now());
  
  if (type) {
    results = results.filter(r => r.type === type);
  }
  
  return results.sort((a, b) => b.score - a.score);
}

// ================================================================
// A/B TESTING
// ================================================================

function createABTest(data) {
  const test = {
    id: `ABT-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'Untitled A/B Test',
    type: data.type || 'email',
    variants: data.variants || [],
    trafficSplit: data.trafficSplit || [50, 50],
    metric: data.metric || 'conversion_rate',
    startDate: data.startDate || Date.now(),
    endDate: data.endDate || null,
    status: 'active',
    results: {
      variantStats: [],
      winner: null,
      confidence: 0
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  abTests.set(test.id, test);
  return test;
}

function getABTest(id) {
  return abTests.get(id);
}

function assignVariant(testId, contactId) {
  const test = abTests.get(testId);
  if (!test || test.status !== 'active') return null;
  
  // Simple hash-based assignment for consistency
  const hash = contactId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variantIndex = hash % test.variants.length;
  
  return {
    testId,
    contactId,
    variant: test.variants[variantIndex],
    assignedAt: Date.now()
  };
}

function recordABTestResult(testId, variantId, outcome) {
  const test = abTests.get(testId);
  if (!test) return null;
  
  let variantStats = test.results.variantStats.find(v => v.variantId === variantId);
  if (!variantStats) {
    variantStats = {
      variantId,
      impressions: 0,
      conversions: 0,
      conversionRate: 0
    };
    test.results.variantStats.push(variantStats);
  }
  
  variantStats.impressions++;
  if (outcome === 'converted') {
    variantStats.conversions++;
  }
  variantStats.conversionRate = (variantStats.conversions / variantStats.impressions * 100).toFixed(2);
  
  test.updatedAt = Date.now();
  abTests.set(testId, test);
  
  return test;
}

function analyzeABTest(testId) {
  const test = abTests.get(testId);
  if (!test) return null;
  
  if (test.results.variantStats.length < 2) {
    return { error: 'Need at least 2 variants with data' };
  }
  
  const sorted = [...test.results.variantStats].sort((a, b) => b.conversionRate - a.conversionRate);
  test.results.winner = sorted[0].variantId;
  test.results.confidence = calculateConfidence(sorted[0], sorted[1]);
  
  abTests.set(testId, test);
  return test.results;
}

function calculateConfidence(variantA, variantB) {
  // Simplified confidence calculation
  const diff = Math.abs(variantA.conversionRate - variantB.conversionRate);
  const totalSamples = variantA.impressions + variantB.impressions;
  
  if (totalSamples < 100) return 0;
  if (diff > 20 && totalSamples > 1000) return 99;
  if (diff > 10 && totalSamples > 500) return 95;
  if (diff > 5 && totalSamples > 200) return 90;
  
  return 85;
}

// ================================================================
// SEND TIME OPTIMIZATION
// ================================================================

function optimizeSendTime(contactId, data = {}) {
  const optimization = {
    id: `OPT-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    contactId,
    type: 'send_time',
    recommendedTime: null,
    timezone: data.timezone || 'UTC',
    confidence: 0,
    basedOn: 'historical_engagement',
    createdAt: Date.now()
  };
  
  // Simulate optimization based on past engagement
  const engagementHours = data.engagementHours || [9, 14, 18];
  const bestHour = engagementHours.reduce((a, b) => 
    (data.hourlyEngagement?.[b] || 0) > (data.hourlyEngagement?.[a] || 0) ? b : a
  );
  
  optimization.recommendedTime = new Date();
  optimization.recommendedTime.setHours(bestHour, 0, 0, 0);
  optimization.confidence = 0.82;
  
  optimizations.set(optimization.id, optimization);
  return optimization;
}

function optimizeFrequency(contactId, data = {}) {
  const optimization = {
    id: `OPT-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    contactId,
    type: 'frequency',
    recommendedFrequency: 'weekly',
    maxPerWeek: 3,
    confidence: 0.75,
    basedOn: 'engagement_patterns',
    createdAt: Date.now()
  };
  
  // Simulate frequency optimization
  const avgEngagementRate = data.avgEngagementRate || 0;
  
  if (avgEngagementRate > 50) {
    optimization.recommendedFrequency = 'daily';
    optimization.maxPerWeek = 5;
  } else if (avgEngagementRate > 25) {
    optimization.recommendedFrequency = 'bi-weekly';
    optimization.maxPerWeek = 2;
  } else {
    optimization.recommendedFrequency = 'weekly';
    optimization.maxPerWeek = 1;
  }
  
  optimizations.set(optimization.id, optimization);
  return optimization;
}

// ================================================================
// ML MODELS
// ================================================================

function trainModel(data) {
  const model = {
    id: `MODEL-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'Untitled Model',
    type: data.type || 'classification',
    algorithm: data.algorithm || 'random_forest',
    features: data.features || [],
    target: data.target || '',
    hyperparameters: data.hyperparameters || {},
    status: 'training',
    accuracy: 0,
    trainedAt: null,
    createdAt: Date.now()
  };
  
  models.set(model.id, model);
  
  // Simulate training
  setTimeout(() => {
    model.status = 'trained';
    model.accuracy = 0.85 + (Math.random() * 0.1);
    model.trainedAt = Date.now();
    models.set(model.id, model);
  }, 100);
  
  return model;
}

function getModel(id) {
  return models.get(id);
}

function listModels(filter = {}) {
  let results = Array.from(models.values());
  
  if (filter.type) {
    results = results.filter(m => m.type === filter.type);
  }
  if (filter.status) {
    results = results.filter(m => m.status === filter.status);
  }
  
  return results;
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Predictions
  createPrediction,
  getPrediction,
  getPredictionsByContact,
  predictChurn,
  predictLTV,
  predictNextPurchase,
  
  // Personalization
  listPersonalizationRules,
  createPersonalizationRule,
  getPersonalizationRule,
  updatePersonalizationRule,
  deletePersonalizationRule,
  personalizeContent,
  
  // Recommendations
  generateRecommendations,
  getRecommendations,
  
  // A/B Testing
  createABTest,
  getABTest,
  assignVariant,
  recordABTestResult,
  analyzeABTest,
  
  // Optimization
  optimizeSendTime,
  optimizeFrequency,
  
  // ML Models
  trainModel,
  getModel,
  listModels
};
