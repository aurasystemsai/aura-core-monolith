/**
 * ANALYTICS & INSIGHTS ENGINE
 * Cohort analysis, funnel analytics, attribution modeling,
 * predictive scoring, customer journey mapping
 */

// In-memory stores
const cohorts = new Map();
const funnels = new Map();
const attributionModels = new Map();
const journeyMaps = new Map();
const insights = [];

let cohortCounter = 0;
let funnelCounter = 0;

// ================================================================
// COHORT ANALYSIS
// ================================================================

function createCohort({ name, definition, period = 'month' }) {
  const id = `cohort_${Date.now()}_${++cohortCounter}`;
  
  const cohort = {
    id,
    name,
    definition, // criteria for cohort membership
    period, // 'day', 'week', 'month'
    users: [],
    metrics: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  cohorts.set(id, cohort);
  return cohort;
}

function getCohort(id) {
  return cohorts.get(id) || null;
}

function listCohorts({ limit = 100 }) {
  return Array.from(cohorts.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

function analyzeCohort(id, { metricType = 'retention', periods = 12 }) {
  const cohort = cohorts.get(id);
  if (!cohort) return null;
  
  // Simulate cohort users
  const cohortUsers = generateCohortUsers(cohort.definition, 1000);
  cohort.users = cohortUsers;
  
  // Calculate retention matrix
  const matrix = [];
  const startDate = new Date(cohort.createdAt);
  
  for (let period = 0; period < periods; period++) {
    const periodData = {
      period,
      date: getPeriodDate(startDate, period, cohort.period),
      totalUsers: cohortUsers.length,
      activeUsers: 0,
      retention: 0,
      revenue: 0
    };
    
    // Simulate retention decay
    const retentionRate = Math.max(0.1, 1 - (period * 0.08));
    periodData.activeUsers = Math.floor(cohortUsers.length * retentionRate);
    periodData.retention = (periodData.activeUsers / periodData.totalUsers) * 100;
    periodData.revenue = periodData.activeUsers * (50 + Math.random() * 100);
    
    matrix.push(periodData);
  }
  
  cohort.metrics = {
    metricType,
    matrix,
    averageRetention: matrix.reduce((sum, p) => sum + p.retention, 0) / matrix.length,
    totalRevenue: matrix.reduce((sum, p) => sum + p.revenue, 0),
    analyzedAt: new Date().toISOString()
  };
  
  cohorts.set(id, cohort);
  return cohort;
}

function generateCohortUsers(definition, count) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push({
      userId: `user_${i}`,
      joinedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  return users;
}

function getPeriodDate(startDate, periodOffset, periodType) {
  const date = new Date(startDate);
  
  switch (periodType) {
    case 'day':
      date.setDate(date.getDate() + periodOffset);
      break;
    case 'week':
      date.setDate(date.getDate() + (periodOffset * 7));
      break;
    case 'month':
      date.setMonth(date.getMonth() + periodOffset);
      break;
  }
  
  return date.toISOString();
}

function compareCohorts(cohortIds) {
  const comparison = cohortIds.map(id => {
    const cohort = cohorts.get(id);
    if (!cohort) return null;
    
    return {
      id: cohort.id,
      name: cohort.name,
      users: cohort.users.length,
      averageRetention: cohort.metrics.averageRetention || 0,
      totalRevenue: cohort.metrics.totalRevenue || 0
    };
  }).filter(Boolean);
  
  return {
    cohorts: comparison,
    winner: comparison.reduce((best, current) => 
      current.averageRetention > (best?.averageRetention || 0) ? current : best
    , null)
  };
}

// ================================================================
// FUNNEL ANALYSIS
// ================================================================

function createFunnel({ name, steps, timeWindow = 7 }) {
  const id = `funnel_${Date.now()}_${++funnelCounter}`;
  
  const funnel = {
    id,
    name,
    steps, // [{ name: 'Step 1', event: 'page_view' }, ...]
    timeWindow, // days to complete funnel
    results: null,
    createdAt: new Date().toISOString()
  };
  
  funnels.set(id, funnel);
  return funnel;
}

function getFunnel(id) {
  return funnels.get(id) || null;
}

function listFunnels({ limit = 100 }) {
  return Array.from(funnels.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

function analyzeFunnel(id, { startDate, endDate }) {
  const funnel = funnels.get(id);
  if (!funnel) return null;
  
  // Simulate funnel analysis
  const totalUsers = 10000;
  let remainingUsers = totalUsers;
  
  const stepResults = funnel.steps.map((step, index) => {
    const dropoffRate = 0.15 + (Math.random() * 0.15); // 15-30% dropoff per step
    const completedUsers = Math.floor(remainingUsers * (1 - dropoffRate));
    const droppedUsers = remainingUsers - completedUsers;
    const conversionRate = (completedUsers / totalUsers) * 100;
    const stepConversionRate = (completedUsers / remainingUsers) * 100;
    
    const result = {
      step: index + 1,
      name: step.name,
      event: step.event,
      usersEntered: remainingUsers,
      usersCompleted: completedUsers,
      usersDropped: droppedUsers,
      conversionRate,
      stepConversionRate,
      avgTimeToComplete: Math.floor(Math.random() * 3600) // seconds
    };
    
    remainingUsers = completedUsers;
    return result;
  });
  
  funnel.results = {
    totalUsers,
    completedUsers: remainingUsers,
    overallConversion: (remainingUsers / totalUsers) * 100,
    steps: stepResults,
    analyzedAt: new Date().toISOString(),
    dateRange: { startDate, endDate }
  };
  
  funnels.set(id, funnel);
  return funnel;
}

function identifyBottlenecks(funnelId) {
  const funnel = funnels.get(funnelId);
  if (!funnel || !funnel.results) return null;
  
  const bottlenecks = funnel.results.steps
    .map((step, index) => ({
      ...step,
      dropoffPercentage: (step.usersDropped / step.usersEntered) * 100
    }))
    .filter(step => step.dropoffPercentage > 25) // Flag steps with >25% dropoff
    .sort((a, b) => b.dropoffPercentage - a.dropoffPercentage);
  
  return {
    funnelId,
    funnelName: funnel.name,
    bottlenecks,
    recommendations: bottlenecks.map(b => ({
      step: b.name,
      issue: `High dropoff rate of ${b.dropoffPercentage.toFixed(1)}%`,
      recommendation: generateRecommendation(b)
    }))
  };
}

function generateRecommendation(step) {
  const recommendations = [
    'Simplify form fields and reduce friction',
    'Add trust signals (security badges, reviews)',
    'Improve page load speed',
    'A/B test different CTAs',
    'Add exit-intent popups',
    'Provide live chat support',
    'Clarify value proposition'
  ];
  
  return recommendations[Math.floor(Math.random() * recommendations.length)];
}

// ================================================================
// ATTRIBUTION MODELING
// ================================================================

function createAttributionModel({ name, type, lookbackWindow = 30 }) {
  const id = `attr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const model = {
    id,
    name,
    type, // 'first_touch', 'last_touch', 'linear', 'time_decay', 'position_based', 'data_driven'
    lookbackWindow, // days
    weights: getModelWeights(type),
    createdAt: new Date().toISOString()
  };
  
  attributionModels.set(id, model);
  return model;
}

function getModelWeights(type) {
  switch (type) {
    case 'first_touch':
      return { first: 1.0 };
    case 'last_touch':
      return { last: 1.0 };
    case 'linear':
      return { distributed: 'equal' };
    case 'time_decay':
      return { decay: 0.5 }; // Half-life in days
    case 'position_based':
      return { first: 0.4, middle: 0.2, last: 0.4 };
    case 'data_driven':
      return { ml: 'shapley_value' };
    default:
      return {};
  }
}

function getAttributionModel(id) {
  return attributionModels.get(id) || null;
}

function listAttributionModels({ type, limit = 100 }) {
  let models = Array.from(attributionModels.values());
  
  if (type) {
    models = models.filter(m => m.type === type);
  }
  
  return models.slice(0, limit);
}

function analyzeAttribution(modelId, { conversion, touchpoints }) {
  const model = attributionModels.get(modelId);
  if (!model) return null;
  
  const credits = calculateAttributionCredits(model, touchpoints, conversion.value);
  
  return {
    modelId,
    modelType: model.type,
    conversion,
    touchpoints,
    credits,
    totalCredited: credits.reduce((sum, c) => sum + c.credit, 0)
  };
}

function calculateAttributionCredits(model, touchpoints, conversionValue) {
  const { type } = model;
  const credits = [];
  
  switch (type) {
    case 'first_touch':
      credits.push({
        touchpoint: touchpoints[0],
        credit: conversionValue,
        percentage: 100
      });
      break;
    
    case 'last_touch':
      credits.push({
        touchpoint: touchpoints[touchpoints.length - 1],
        credit: conversionValue,
        percentage: 100
      });
      break;
    
    case 'linear':
      const linearCredit = conversionValue / touchpoints.length;
      touchpoints.forEach(tp => {
        credits.push({
          touchpoint: tp,
          credit: linearCredit,
          percentage: 100 / touchpoints.length
        });
      });
      break;
    
    case 'position_based':
      touchpoints.forEach((tp, index) => {
        let weight;
        if (index === 0) weight = 0.4;
        else if (index === touchpoints.length - 1) weight = 0.4;
        else weight = 0.2 / (touchpoints.length - 2);
        
        credits.push({
          touchpoint: tp,
          credit: conversionValue * weight,
          percentage: weight * 100
        });
      });
      break;
    
    case 'time_decay':
      const halfLife = 7; // days
      const now = Date.now();
      
      const weights = touchpoints.map(tp => {
        const age = (now - new Date(tp.timestamp).getTime()) / (1000 * 60 * 60 * 24);
        return Math.pow(0.5, age / halfLife);
      });
      
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      
      touchpoints.forEach((tp, index) => {
        const weight = weights[index] / totalWeight;
        credits.push({
          touchpoint: tp,
          credit: conversionValue * weight,
          percentage: weight * 100
        });
      });
      break;
  }
  
  return credits;
}

function compareAttributionModels(conversionData) {
  const models = Array.from(attributionModels.values());
  
  const comparison = models.map(model => {
    const analysis = analyzeAttribution(model.id, conversionData);
    
    return {
      modelId: model.id,
      modelName: model.name,
      modelType: model.type,
      channelCredits: aggregateByChannel(analysis.credits)
    };
  });
  
  return comparison;
}

function aggregateByChannel(credits) {
  const byChannel = {};
  
  credits.forEach(c => {
    const channel = c.touchpoint.channel;
    byChannel[channel] = (byChannel[channel] || 0) + c.credit;
  });
  
  return byChannel;
}

// ================================================================
// CUSTOMER JOURNEY MAPPING
// ================================================================

function createJourneyMap({ name, stages }) {
  const id = `journey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const journey = {
    id,
    name,
    stages, // [{ name: 'Awareness', touchpoints: [...] }, ...]
    createdAt: new Date().toISOString()
  };
  
  journeyMaps.set(id, journey);
  return journey;
}

function getJourneyMap(id) {
  return journeyMaps.get(id) || null;
}

function analyzeCustomerJourney(userId, { startDate, endDate }) {
  // Simulate user journey
  const events = generateUserEvents(userId, 50);
  
  const journey = {
    userId,
    totalEvents: events.length,
    stages: categorizeEventsByStage(events),
    touchpoints: extractTouchpoints(events),
    duration: calculateJourneyDuration(events),
    conversionPath: identifyConversionPath(events),
    analyzedAt: new Date().toISOString()
  };
  
  return journey;
}

function generateUserEvents(userId, count) {
  const events = [];
  const startTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
  
  for (let i = 0; i < count; i++) {
    events.push({
      userId,
      event: ['page_view', 'product_view', 'add_to_cart', 'checkout', 'purchase'][Math.floor(Math.random() * 5)],
      channel: ['organic', 'paid', 'email', 'social', 'direct'][Math.floor(Math.random() * 5)],
      timestamp: new Date(startTime + (i * (30 * 24 * 60 * 60 * 1000) / count)).toISOString()
    });
  }
  
  return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

function categorizeEventsByStage(events) {
  const stages = {
    awareness: [],
    consideration: [],
    decision: [],
    retention: []
  };
  
  events.forEach(event => {
    if (event.event === 'page_view') stages.awareness.push(event);
    else if (event.event === 'product_view') stages.consideration.push(event);
    else if (['add_to_cart', 'checkout'].includes(event.event)) stages.decision.push(event);
    else if (event.event === 'purchase') stages.retention.push(event);
  });
  
  return stages;
}

function extractTouchpoints(events) {
  const touchpointMap = new Map();
  
  events.forEach(event => {
    const key = `${event.channel}_${event.event}`;
    if (!touchpointMap.has(key)) {
      touchpointMap.set(key, {
        channel: event.channel,
        event: event.event,
        count: 0,
        firstSeen: event.timestamp,
        lastSeen: event.timestamp
      });
    }
    
    const tp = touchpointMap.get(key);
    tp.count++;
    tp.lastSeen = event.timestamp;
  });
  
  return Array.from(touchpointMap.values());
}

function calculateJourneyDuration(events) {
  if (events.length < 2) return 0;
  
  const first = new Date(events[0].timestamp);
  const last = new Date(events[events.length - 1].timestamp);
  
  return Math.floor((last - first) / (1000 * 60 * 60 * 24)); // days
}

function identifyConversionPath(events) {
  const purchaseIndex = events.findIndex(e => e.event === 'purchase');
  if (purchaseIndex === -1) return null;
  
  const path = events.slice(0, purchaseIndex + 1).map(e => ({
    event: e.event,
    channel: e.channel,
    timestamp: e.timestamp
  }));
  
  return {
    steps: path.length,
    duration: calculateJourneyDuration(path),
    path
  };
}

// ================================================================
// PREDICTIVE ANALYTICS
// ================================================================

function generateInsights({ metric, period = 'month' }) {
  const insight = {
    id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    metric,
    period,
    type: 'predictive',
    findings: [],
    createdAt: new Date().toISOString()
  };
  
  // Generate sample insights
  insight.findings.push({
    title: 'User Retention Trend',
    description: 'Retention rate increased by 15% month-over-month',
    confidence: 0.87,
    impact: 'high'
  });
  
  insight.findings.push({
    title: 'Churn Risk Detected',
    description: '234 users at high risk of churning in next 30 days',
    confidence: 0.92,
    impact: 'critical'
  });
  
  insight.findings.push({
    title: 'Revenue Forecast',
    description: 'Projected 23% revenue growth next quarter',
    confidence: 0.78,
    impact: 'high'
  });
  
  insights.push(insight);
  return insight;
}

function getInsights({ limit = 10 }) {
  return insights
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Cohort Analysis
  createCohort,
  getCohort,
  listCohorts,
  analyzeCohort,
  compareCohorts,
  
  // Funnel Analysis
  createFunnel,
  getFunnel,
  listFunnels,
  analyzeFunnel,
  identifyBottlenecks,
  
  // Attribution Modeling
  createAttributionModel,
  getAttributionModel,
  listAttributionModels,
  analyzeAttribution,
  compareAttributionModels,
  
  // Customer Journey
  createJourneyMap,
  getJourneyMap,
  analyzeCustomerJourney,
  
  // Predictive Insights
  generateInsights,
  getInsights,
  
  // Data stores
  cohorts,
  funnels,
  attributionModels,
  journeyMaps,
  insights
};
