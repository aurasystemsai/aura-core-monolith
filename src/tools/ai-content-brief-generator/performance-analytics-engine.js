const crypto = require('crypto');

// ============================================================================
// DATA STORES
// ============================================================================

const performanceStore = new Map();
const metrics = new Map();
const goals = new Map();
const abTests = new Map();
const cohorts = new Map();
const funnels = new Map();
const forecasts = new Map();
const anomalies = new Map();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

function calculatePercentChange(current, previous) {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

function calculateMovingAverage(values, window = 7) {
  if (values.length < window) return values[values.length - 1] || 0;
  const slice = values.slice(-window);
  return slice.reduce((sum, v) => sum + v, 0) / slice.length;
}

// ============================================================================
// PERFORMANCE TRACKING
// ============================================================================

function recordPerformance(data = {}) {
  const id = data.briefId || generateId('perf');
  const entry = {
    briefId: id,
    views: data.views || 1200,
    engagementRate: data.engagementRate || 0.42,
    conversionRate: data.conversionRate || 0.08,
    shares: data.shares || 52,
    bounceRate: data.bounceRate || 0.35,
    timeOnPage: data.timeOnPage || 185,
    revenue: data.revenue || 0,
    period: data.period || '7d',
    channel: data.channel || 'organic',
    recordedAt: new Date().toISOString(),
  };
  performanceStore.set(id, entry);
  
  // Update metrics tracking
  updateMetrics(id, entry);
  
  return entry;
}

function getPerformance(briefId) {
  if (!performanceStore.has(briefId)) {
    throw new Error('Performance not found');
  }
  return performanceStore.get(briefId);
}

function listPerformance(filters = {}) {
  let results = Array.from(performanceStore.values());
  
  if (filters.channel) {
    results = results.filter(p => p.channel === filters.channel);
  }
  
  if (filters.minViews) {
    results = results.filter(p => p.views >= filters.minViews);
  }
  
  return results;
}

// ============================================================================
// METRICS TRACKING
// ============================================================================

function updateMetrics(briefId, performance) {
  const metricId = generateId('metric');
  
  const metric = {
    id: metricId,
    briefId,
    timestamp: new Date().toISOString(),
    views: performance.views,
    engagement: performance.engagementRate,
    conversion: performance.conversionRate,
    revenue: performance.revenue || 0,
    channel: performance.channel
  };
  
  metrics.set(metricId, metric);
  return metric;
}

function getMetricsTimeSeries(briefId, options = {}) {
  const briefMetrics = Array.from(metrics.values())
    .filter(m => m.briefId === briefId)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  return {
    briefId,
    dataPoints: briefMetrics,
    trends: {
      viewsTrend: calculateTrend(briefMetrics.map(m => m.views)),
      engagementTrend: calculateTrend(briefMetrics.map(m => m.engagement)),
      conversionTrend: calculateTrend(briefMetrics.map(m => m.conversion))
    }
  };
}

function calculateTrend(values) {
  if (values.length < 2) return 'stable';
  const recent = values.slice(-5);
  const avg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
  const previousAvg = values.slice(-10, -5).reduce((sum, v) => sum + v, 0) / 5 || avg;
  const change = ((avg - previousAvg) / previousAvg) * 100;
  
  if (change > 10) return 'rising';
  if (change < -10) return 'declining';
  return 'stable';
}

// ============================================================================
// GOAL MANAGEMENT
// ============================================================================

function createGoal(goalData) {
  const goalId = generateId('goal');
  
  const goal = {
    id: goalId,
    name: goalData.name || 'New Goal',
    metric: goalData.metric || 'views',
    target: goalData.target || 10000,
    current: goalData.current || 0,
    deadline: goalData.deadline || new Date(Date.now() + 30 * 24 * 3600e3).toISOString(),
    status: 'active',
    createdAt: new Date().toISOString()
  };
  
  goals.set(goalId, goal);
  return goal;
}

function updateGoalProgress(goalId, current) {
  const goal = goals.get(goalId);
  if (!goal) throw new Error('Goal not found');
  
  goal.current = current;
  goal.progress = Math.round((current / goal.target) * 100);
  goal.status = goal.progress >= 100 ? 'achieved' : 
                new Date(goal.deadline) < new Date() ? 'missed' : 'active';
  goal.updatedAt = new Date().toISOString();
  
  goals.set(goalId, goal);
  return goal;
}

function listGoals(filters = {}) {
  let results = Array.from(goals.values());
  
  if (filters.status) {
    results = results.filter(g => g.status === filters.status);
  }
  
  if (filters.metric) {
    results = results.filter(g => g.metric === filters.metric);
  }
  
  return results;
}

// ============================================================================
// A/B TESTING
// ============================================================================

function createABTest(testData) {
  const testId = generateId('test');
  
  const test = {
    id: testId,
    name: testData.name || 'New A/B Test',
    variants: testData.variants || [
      { id: 'A', name: 'Control', traffic: 50 },
      { id: 'B', name: 'Variant', traffic: 50 }
    ],
    metric: testData.metric || 'conversionRate',
    status: 'running',
    startedAt: new Date().toISOString(),
    results: {}
  };
  
  abTests.set(testId, test);
  return test;
}

function recordTestResult(testId, variantId, metrics) {
  const test = abTests.get(testId);
  if (!test) throw new Error('A/B test not found');
  
  if (!test.results[variantId]) {
    test.results[variantId] = {
      samples: 0,
      conversions: 0,
      revenue: 0,
      metrics: []
    };
  }
  
  test.results[variantId].samples++;
  test.results[variantId].conversions += metrics.converted ? 1 : 0;
  test.results[variantId].revenue += metrics.revenue || 0;
  test.results[variantId].metrics.push(metrics);
  
  abTests.set(testId, test);
  return test.results[variantId];
}

function analyzeABTest(testId) {
  const test = abTests.get(testId);
  if (!test) throw new Error('A/B test not found');
  
  const analysis = {
    testId,
    variants: []
  };
  
  for (const variantId in test.results) {
    const result = test.results[variantId];
    const conversionRate = result.samples > 0 ? (result.conversions / result.samples) * 100 : 0;
    const avgRevenue = result.samples > 0 ? result.revenue / result.samples : 0;
    
    analysis.variants.push({
      variantId,
      samples: result.samples,
      conversionRate: conversionRate.toFixed(2),
      avgRevenue: avgRevenue.toFixed(2),
      totalRevenue: result.revenue
    });
  }
  
  // Determine winner
  analysis.variants.sort((a, b) => b.conversionRate - a.conversionRate);
  if (analysis.variants.length > 1 && analysis.variants[0].samples >= 100) {
    const lift = ((analysis.variants[0].conversionRate - analysis.variants[1].conversionRate) / 
                  analysis.variants[1].conversionRate) * 100;
    analysis.winner = {
      variantId: analysis.variants[0].variantId,
      lift: lift.toFixed(2) + '%',
      significant: lift > 10
    };
  }
  
  return analysis;
}

// ============================================================================
// COHORT ANALYSIS
// ============================================================================

function createCohort(cohortData) {
  const cohortId = generateId('cohort');
  
  const cohort = {
    id: cohortId,
    name: cohortData.name || 'New Cohort',
    criteria: cohortData.criteria || {},
    startDate: cohortData.startDate || new Date().toISOString(),
    endDate: cohortData.endDate || new Date(Date.now() + 30 * 24 * 3600e3).toISOString(),
    size: cohortData.size || 0,
    metrics: {}
  };
  
  cohorts.set(cohortId, cohort);
  return cohort;
}

function trackCohortMetrics(cohortId, metricsData) {
  const cohort = cohorts.get(cohortId);
  if (!cohort) throw new Error('Cohort not found');
  
  const week = metricsData.week || 1;
  
  cohort.metrics[week] = {
    retention: metricsData.retention || 0,
    engagement: metricsData.engagement || 0,
    revenue: metricsData.revenue || 0,
    recordedAt: new Date().toISOString()
  };
  
  cohorts.set(cohortId, cohort);
  return cohort;
}

function analyzeCohort(cohortId) {
  const cohort = cohorts.get(cohortId);
  if (!cohort) throw new Error('Cohort not found');
  
  const weeks = Object.keys(cohort.metrics).map(Number).sort((a, b) => a - b);
  
  return {
    cohortId,
    name: cohort.name,
    size: cohort.size,
    retentionCurve: weeks.map(w => ({
      week: w,
      retention: cohort.metrics[w].retention
    })),
    totalRevenue: weeks.reduce((sum, w) => sum + (cohort.metrics[w].revenue || 0), 0),
    avgEngagement: weeks.length > 0 
      ? weeks.reduce((sum, w) => sum + cohort.metrics[w].engagement, 0) / weeks.length
      : 0
  };
}

// ============================================================================
// FUNNEL ANALYSIS
// ============================================================================

function createFunnel(funnelData) {
  const funnelId = generateId('funnel');
  
  const funnel = {
    id: funnelId,
    name: funnelData.name || 'New Funnel',
    steps: funnelData.steps || [
      { id: 'awareness', name: 'Awareness', count: 0 },
      { id: 'interest', name: 'Interest', count: 0 },
      { id: 'consideration', name: 'Consideration', count: 0 },
      { id: 'conversion', name: 'Conversion', count: 0 }
    ],
    createdAt: new Date().toISOString()
  };
  
  funnels.set(funnelId, funnel);
  return funnel;
}

function recordFunnelStep(funnelId, stepId) {
  const funnel = funnels.get(funnelId);
  if (!funnel) throw new Error('Funnel not found');
  
  const step = funnel.steps.find(s => s.id === stepId);
  if (step) {
    step.count++;
  }
  
  funnels.set(funnelId, funnel);
  return funnel;
}

function analyzeFunnel(funnelId) {
  const funnel = funnels.get(funnelId);
  if (!funnel) throw new Error('Funnel not found');
  
  const analysis = {
    funnelId,
    name: funnel.name,
    steps: [],
    dropoffs: []
  };
  
  for (let i = 0; i < funnel.steps.length; i++) {
    const step = funnel.steps[i];
    const conversionRate = i === 0 ? 100 : 
      (step.count / funnel.steps[0].count) * 100;
    
    analysis.steps.push({
      id: step.id,
      name: step.name,
      count: step.count,
      conversionRate: conversionRate.toFixed(2) + '%'
    });
    
    if (i > 0) {
      const dropoff = funnel.steps[i - 1].count - step.count;
      const dropoffRate = (dropoff / funnel.steps[i - 1].count) * 100;
      
      analysis.dropoffs.push({
        from: funnel.steps[i - 1].name,
        to: step.name,
        count: dropoff,
        rate: dropoffRate.toFixed(2) + '%'
      });
    }
  }
  
  return analysis;
}

// ============================================================================
// FORECASTING
// ============================================================================

function forecastPerformance(data = {}) {
  const base = data.current || { views: 1000, engagementRate: 0.4, conversionRate: 0.08 };
  const horizon = data.horizon || '30d';
  const days = parseInt(horizon) || 30;
  
  const forecastId = generateId('forecast');
  
  const historicalGrowth = data.historicalGrowth || 0.05;
  const seasonality = data.seasonality || 1.0;
  
  const forecast = {
    id: forecastId,
    forecastHorizon: horizon,
    predictedViews: Math.round(base.views * (1 + historicalGrowth * (days / 30)) * seasonality),
    predictedEngagementRate: +(base.engagementRate * (1 + historicalGrowth * 0.5)).toFixed(3),
    predictedConversionRate: +(base.conversionRate * (1 + historicalGrowth * 0.3)).toFixed(3),
    confidence: data.confidence || 0.72,
    factors: {
      historicalGrowth,
      seasonality,
      trend: historicalGrowth > 0 ? 'positive' : historicalGrowth < 0 ? 'negative' : 'neutral'
    },
    createdAt: new Date().toISOString()
  };
  
  forecasts.set(forecastId, forecast);
  return forecast;
}

function getForecast(forecastId) {
  if (!forecasts.has(forecastId)) {
    throw new Error('Forecast not found');
  }
  return forecasts.get(forecastId);
}

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

function detectAnomalies(briefId) {
  const performance = Array.from(performanceStore.values())
    .filter(p => p.briefId === briefId);
  
  if (performance.length < 7) {
    return { briefId, anomalies: [], message: 'Insufficient data for anomaly detection' };
  }
  
  const avgViews = performance.reduce((sum, p) => sum + p.views, 0) / performance.length;
  const stdDev = Math.sqrt(
    performance.reduce((sum, p) => sum + Math.pow(p.views - avgViews, 2), 0) / performance.length
  );
  
  const anomalyList = [];
  const threshold = 2; // standard deviations
  
  performance.forEach(p => {
    const zScore = (p.views - avgViews) / stdDev;
    if (Math.abs(zScore) > threshold) {
      anomalyList.push({
        timestamp: p.recordedAt,
        metric: 'views',
        value: p.views,
        expected: avgViews.toFixed(0),
        deviation: zScore.toFixed(2),
        type: zScore > 0 ? 'spike' : 'drop'
      });
    }
  });
  
  const anomalyId = generateId('anomaly');
  const result = {
    id: anomalyId,
    briefId,
    anomalies: anomalyList,
    detectedAt: new Date().toISOString()
  };
  
  anomalies.set(anomalyId, result);
  return result;
}

// ============================================================================
// PERIOD COMPARISON
// ============================================================================

function comparePeriods(data = {}) {
  const { period1 = {}, period2 = {} } = data;
  
  return {
    period1,
    period2,
    deltas: {
      views: (period2.views || 0) - (period1.views || 0),
      viewsPercent: calculatePercentChange(period2.views, period1.views).toFixed(2) + '%',
      engagementRate: +((period2.engagementRate || 0) - (period1.engagementRate || 0)).toFixed(3),
      engagementPercent: calculatePercentChange(period2.engagementRate, period1.engagementRate).toFixed(2) + '%',
      conversionRate: +((period2.conversionRate || 0) - (period1.conversionRate || 0)).toFixed(3),
      conversionPercent: calculatePercentChange(period2.conversionRate, period1.conversionRate).toFixed(2) + '%',
    },
    summary: (period2.views || 0) > (period1.views || 0) ? 'improving' : 'declining'
  };
}

// ============================================================================
// STATISTICS
// ============================================================================

function getStats() {
  const all = Array.from(performanceStore.values());
  
  return {
    totalTracked: all.length,
    averageViews: all.length ? Math.round(all.reduce((acc, p) => acc + p.views, 0) / all.length) : 0,
    averageEngagement: all.length ? +(all.reduce((acc, p) => acc + p.engagementRate, 0) / all.length).toFixed(3) : 0,
    averageConversion: all.length ? +(all.reduce((acc, p) => acc + p.conversionRate, 0) / all.length).toFixed(3) : 0,
    totalRevenue: all.reduce((sum, p) => sum + (p.revenue || 0), 0),
    totalGoals: goals.size,
    activeGoals: Array.from(goals.values()).filter(g => g.status === 'active').length,
    achievedGoals: Array.from(goals.values()).filter(g => g.status === 'achieved').length,
    totalABTests: abTests.size,
    runningTests: Array.from(abTests.values()).filter(t => t.status === 'running').length,
    totalCohorts: cohorts.size,
    totalFunnels: funnels.size,
    totalForecasts: forecasts.size,
    totalAnomalies: anomalies.size
  };
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================

module.exports = {
  // Performance Tracking
  recordPerformance,
  getPerformance,
  listPerformance,
  
  // Metrics
  getMetricsTimeSeries,
  
  // Goals
  createGoal,
  updateGoalProgress,
  listGoals,
  
  // A/B Testing
  createABTest,
  recordTestResult,
  analyzeABTest,
  
  // Cohort Analysis
  createCohort,
  trackCohortMetrics,
  analyzeCohort,
  
  // Funnel Analysis
  createFunnel,
  recordFunnelStep,
  analyzeFunnel,
  
  // Forecasting
  forecastPerformance,
  getForecast,
  
  // Anomaly Detection
  detectAnomalies,
  
  // Period Comparison
  comparePeriods,
  
  // Statistics
  getStats,
};
