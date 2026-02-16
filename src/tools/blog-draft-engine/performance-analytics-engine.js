/**
 * PERFORMANCE & ANALYTICS ENGINE
 * Metrics tracking, forecasting, benchmarking, A/B testing,
 * cohort analysis, funnel tracking, and predictive modeling
 */

const crypto = require('crypto');

// In-memory stores
const metrics = new Map();
const forecasts = new Map();
const benchmarks = new Map();
const abTests = new Map();
const cohorts = new Map();
const funnels = new Map();
const performanceReports = new Map();

// ================================================================
// METRICS TRACKING
// ================================================================

function trackMetric({
  draftId,
  metricType,
  metricName,
  value,
  dimensions = {},
  timestamp = new Date().toISOString()
}) {
  const metricId = `metric-${crypto.randomBytes(4).toString('hex')}`;
  
  const metric = {
    metricId,
    draftId,
    metricType, // 'traffic', 'engagement', 'conversion', 'revenue', 'seo'
    metricName, // 'pageviews', 'bounce_rate', 'avg_time', 'conversions', etc.
    value,
    dimensions, // { source, medium, campaign, device, location }
    timestamp
  };
  
  metrics.set(metricId, metric);
  return metric;
}

function getMetrics({ draftId, metricType, metricName, startDate, endDate, limit = 100 }) {
  let results = Array.from(metrics.values());
  
  if (draftId) {
    results = results.filter(m => m.draftId === draftId);
  }
  
  if (metricType) {
    results = results.filter(m => m.metricType === metricType);
  }
  
  if (metricName) {
    results = results.filter(m => m.metricName === metricName);
  }
  
  if (startDate) {
    results = results.filter(m => new Date(m.timestamp) >= new Date(startDate));
  }
  
  if (endDate) {
    results = results.filter(m => new Date(m.timestamp) <= new Date(endDate));
  }
  
  results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return results.slice(0, limit);
}

function aggregateMetrics({ draftId, metricName, groupBy = 'day', startDate, endDate }) {
  const metrics = getMetrics({ draftId, metricName, startDate, endDate, limit: 10000 });
  
  const grouped = {};
  
  metrics.forEach(metric => {
    const key = formatDateByGrouping(metric.timestamp, groupBy);
    
    if (!grouped[key]) {
      grouped[key] = {
        period: key,
        count: 0,
        sum: 0,
        avg: 0,
        min: Infinity,
        max: -Infinity,
        values: []
      };
    }
    
    grouped[key].count++;
    grouped[key].sum += metric.value;
    grouped[key].values.push(metric.value);
    grouped[key].min = Math.min(grouped[key].min, metric.value);
    grouped[key].max = Math.max(grouped[key].max, metric.value);
  });
  
  // Calculate averages and percentiles
  Object.keys(grouped).forEach(key => {
    const group = grouped[key];
    group.avg = group.sum / group.count;
    
    // Calculate percentiles
    const sorted = group.values.sort((a, b) => a - b);
    group.p50 = getPercentile(sorted, 50);
    group.p75 = getPercentile(sorted, 75);
    group.p95 = getPercentile(sorted, 95);
    group.p99 = getPercentile(sorted, 99);
    
    delete group.values; // Clean up
  });
  
  return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
}

function formatDateByGrouping(timestamp, groupBy) {
  const date = new Date(timestamp);
  
  switch (groupBy) {
    case 'hour':
      return date.toISOString().substring(0, 13) + ':00:00Z';
    case 'day':
      return date.toISOString().substring(0, 10);
    case 'week':
      const week = getWeekNumber(date);
      return `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;
    case 'month':
      return date.toISOString().substring(0, 7);
    case 'year':
      return date.getFullYear().toString();
    default:
      return date.toISOString().substring(0, 10);
  }
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getPercentile(sortedArray, percentile) {
  const index = (percentile / 100) * (sortedArray.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;
  
  if (lower === upper) {
    return sortedArray[lower];
  }
  
  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}

// ================================================================
// FORECASTING
// ================================================================

function createForecast({ draftId, metricName, historicalData, periods = 30, method = 'linear' }) {
  const forecastId = `forecast-${crypto.randomBytes(4).toString('hex')}`;
  
  let predictions = [];
  
  if (method === 'linear') {
    predictions = linearRegressionForecast(historicalData, periods);
  } else if (method === 'exponential') {
    predictions = exponentialSmoothingForecast(historicalData, periods);
  } else if (method === 'moving_average') {
    predictions = movingAverageForecast(historicalData, periods);
  }
  
  const forecast = {
    forecastId,
    draftId,
    metricName,
    method,
    periods,
    predictions,
    confidence: calculateConfidence(historicalData, predictions),
    createdAt: new Date().toISOString()
  };
  
  forecasts.set(forecastId, forecast);
  return forecast;
}

function linearRegressionForecast(data, periods) {
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = data.map(d => d.value);
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  const predictions = [];
  for (let i = n; i < n + periods; i++) {
    predictions.push({
      period: i,
      value: slope * i + intercept,
      method: 'linear_regression'
    });
  }
  
  return predictions;
}

function exponentialSmoothingForecast(data, periods, alpha = 0.3) {
  const values = data.map(d => d.value);
  let smoothed = values[0];
  
  for (let i = 1; i < values.length; i++) {
    smoothed = alpha * values[i] + (1 - alpha) * smoothed;
  }
  
  const predictions = [];
  for (let i = 0; i < periods; i++) {
    predictions.push({
      period: data.length + i,
      value: smoothed,
      method: 'exponential_smoothing'
    });
  }
  
  return predictions;
}

function movingAverageForecast(data, periods, window = 7) {
  const values = data.map(d => d.value);
  const lastWindow = values.slice(-window);
  const average = lastWindow.reduce((a, b) => a + b, 0) / lastWindow.length;
  
  const predictions = [];
  for (let i = 0; i < periods; i++) {
    predictions.push({
      period: data.length + i,
      value: average,
      method: 'moving_average'
    });
  }
  
  return predictions;
}

function calculateConfidence(historicalData, predictions) {
  // Simple confidence based on historical variance
  const values = historicalData.map(d => d.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower variance = higher confidence
  const cv = stdDev / mean; // coefficient of variation
  
  if (cv < 0.1) return 95;
  if (cv < 0.2) return 85;
  if (cv < 0.3) return 75;
  if (cv < 0.5) return 65;
  return 50;
}

// ================================================================
// BENCHMARKING
// ================================================================

function createBenchmark({ name, metricName, industry, contentType, targets = {} }) {
  const benchmarkId = `benchmark-${crypto.randomBytes(4).toString('hex')}`;
  
  const benchmark = {
    benchmarkId,
    name,
    metricName,
    industry,
    contentType,
    targets, // { min, target, excellent }
    samples: [],
    statistics: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  benchmarks.set(benchmarkId, benchmark);
  return benchmark;
}

function addBenchmarkSample(benchmarkId, value, metadata = {}) {
  const benchmark = benchmarks.get(benchmarkId);
  if (!benchmark) return null;
  
  benchmark.samples.push({
    value,
    metadata,
    timestamp: new Date().toISOString()
  });
  
  // Recalculate statistics
  benchmark.statistics = calculateBenchmarkStatistics(benchmark.samples);
  benchmark.updatedAt = new Date().toISOString();
  
  benchmarks.set(benchmarkId, benchmark);
  return benchmark;
}

function calculateBenchmarkStatistics(samples) {
  const values = samples.map(s => s.value).sort((a, b) => a - b);
  const n = values.length;
  
  if (n === 0) return null;
  
  return {
    count: n,
    min: values[0],
    max: values[n - 1],
    mean: values.reduce((a, b) => a + b, 0) / n,
    median: getPercentile(values, 50),
    p25: getPercentile(values, 25),
    p75: getPercentile(values, 75),
    p90: getPercentile(values, 90),
    p95: getPercentile(values, 95)
  };
}

function compareToBenchmark(benchmarkId, value) {
  const benchmark = benchmarks.get(benchmarkId);
  if (!benchmark || !benchmark.statistics) return null;
  
  const stats = benchmark.statistics;
  
  let percentile = 0;
  const sortedValues = benchmark.samples.map(s => s.value).sort((a, b) => a - b);
  const position = sortedValues.findIndex(v => v >= value);
  
  if (position !== -1) {
    percentile = (position / sortedValues.length) * 100;
  }
  
  return {
    value,
    percentile: Math.round(percentile),
    category: categorizePerformance(percentile),
    comparedTo: {
      mean: stats.mean,
      median: stats.median,
      p75: stats.p75,
      p90: stats.p90
    },
    targets: benchmark.targets
  };
}

function categorizePerformance(percentile) {
  if (percentile >= 90) return 'excellent';
  if (percentile >= 75) return 'good';
  if (percentile >= 50) return 'average';
  if (percentile >= 25) return 'below_average';
  return 'poor';
}

// ================================================================
// A/B TESTING
// ================================================================

function createABTest({ name, draftIds, metricName, hypothesis, startDate, endDate }) {
  const testId = `abtest-${crypto.randomBytes(4).toString('hex')}`;
  
  const test = {
    testId,
    name,
    variants: draftIds.map((draftId, index) => ({
      variantId: `variant-${index}`,
      draftId,
      label: String.fromCharCode(65 + index), // A, B, C, etc.
      traffic: 1.0 / draftIds.length, // Equal split
      metrics: []
    })),
    metricName,
    hypothesis,
    status: 'running',
    startDate,
    endDate,
    results: null,
    createdAt: new Date().toISOString()
  };
  
  abTests.set(testId, test);
  return test;
}

function recordABTestMetric(testId, draftId, metricValue) {
  const test = abTests.get(testId);
  if (!test) return null;
  
  const variant = test.variants.find(v => v.draftId === draftId);
  if (!variant) return null;
  
  variant.metrics.push({
    value: metricValue,
    timestamp: new Date().toISOString()
  });
  
  abTests.set(testId, test);
  return test;
}

function analyzeABTest(testId) {
  const test = abTests.get(testId);
  if (!test) return null;
  
  const results = {
    testId,
    variants: [],
    winner: null,
    confidence: 0
  };
  
  test.variants.forEach(variant => {
    const values = variant.metrics.map(m => m.value);
    
    if (values.length === 0) {
      results.variants.push({
        variantId: variant.variantId,
        label: variant.label,
        sampleSize: 0,
        mean: 0,
        stdDev: 0
      });
      return;
    }
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    results.variants.push({
      variantId: variant.variantId,
      label: variant.label,
      draftId: variant.draftId,
      sampleSize: values.length,
      mean,
      stdDev,
      min: Math.min(...values),
      max: Math.max(...values)
    });
  });
  
  // Determine winner (highest mean)
  if (results.variants.length > 0) {
    const winner = results.variants.reduce((best, current) => 
      current.mean > best.mean ? current : best
    );
    
    results.winner = winner.label;
    
    // Calculate statistical significance (simplified t-test)
    if (results.variants.length === 2) {
      const [variantA, variantB] = results.variants;
      results.confidence = calculateTTestConfidence(variantA, variantB);
    }
  }
  
  test.results = results;
  test.status = 'completed';
  abTests.set(testId, test);
  
  return results;
}

function calculateTTestConfidence(variantA, variantB) {
  if (variantA.sampleSize === 0 || variantB.sampleSize === 0) return 0;
  
  const pooledStdDev = Math.sqrt(
    (Math.pow(variantA.stdDev, 2) + Math.pow(variantB.stdDev, 2)) / 2
  );
  
  const tStatistic = Math.abs(variantA.mean - variantB.mean) / 
    (pooledStdDev * Math.sqrt(2 / Math.min(variantA.sampleSize, variantB.sampleSize)));
  
  // Simplified confidence mapping
  if (tStatistic > 2.58) return 99;
  if (tStatistic > 1.96) return 95;
  if (tStatistic > 1.65) return 90;
  if (tStatistic > 1.28) return 80;
  return 50;
}

// ================================================================
// COHORT ANALYSIS
// ================================================================

function createCohort({ name, definition, startDate, endDate }) {
  const cohortId = `cohort-${crypto.randomBytes(4).toString('hex')}`;
  
  const cohort = {
    cohortId,
    name,
    definition, // Criteria for cohort membership
    startDate,
    endDate,
    members: [],
    metrics: {},
    createdAt: new Date().toISOString()
  };
  
  cohorts.set(cohortId, cohort);
  return cohort;
}

function addCohortMember(cohortId, draftId, joinedAt = new Date().toISOString()) {
  const cohort = cohorts.get(cohortId);
  if (!cohort) return null;
  
  cohort.members.push({ draftId, joinedAt });
  cohorts.set(cohortId, cohort);
  
  return cohort;
}

function analyzeCohort(cohortId, metricName) {
  const cohort = cohorts.get(cohortId);
  if (!cohort) return null;
  
  const analysis = {
    cohortId,
    metricName,
    memberCount: cohort.members.length,
    periods: []
  };
  
  // Group by time periods since joining
  const periodMetrics = {};
  
  cohort.members.forEach(member => {
    const memberMetrics = getMetrics({ 
      draftId: member.draftId, 
      metricName,
      startDate: member.joinedAt
    });
    
    memberMetrics.forEach(metric => {
      const daysSinceJoin = Math.floor(
        (new Date(metric.timestamp) - new Date(member.joinedAt)) / (1000 * 60 * 60 * 24)
      );
      
      if (!periodMetrics[daysSinceJoin]) {
        periodMetrics[daysSinceJoin] = [];
      }
      
      periodMetrics[daysSinceJoin].push(metric.value);
    });
  });
  
  // Calculate averages for each period
  Object.keys(periodMetrics).forEach(period => {
    const values = periodMetrics[period];
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    
    analysis.periods.push({
      period: Number(period),
      sampleCount: values.length,
      average: avg
    });
  });
  
  analysis.periods.sort((a, b) => a.period - b.period);
  
  cohort.metrics[metricName] = analysis;
  cohorts.set(cohortId, cohort);
  
  return analysis;
}

// ================================================================
// FUNNEL TRACKING
// ================================================================

function createFunnel({ name, steps }) {
  const funnelId = `funnel-${crypto.randomBytes(4).toString('hex')}`;
  
  const funnel = {
    funnelId,
    name,
    steps: steps.map((step, index) => ({
      stepId: `step-${index}`,
      name: step.name,
      eventType: step.eventType,
      count: 0
    })),
    sessions: new Map(),
    createdAt: new Date().toISOString()
  };
  
  funnels.set(funnelId, funnel);
  return funnel;
}

function trackFunnelEvent(funnelId, sessionId, eventType) {
  const funnel = funnels.get(funnelId);
  if (!funnel) return null;
  
  const step = funnel.steps.find(s => s.eventType === eventType);
  if (!step) return null;
  
  if (!funnel.sessions.has(sessionId)) {
    funnel.sessions.set(sessionId, {
      sessionId,
      steps: [],
      startedAt: new Date().toISOString()
    });
  }
  
  const session = funnel.sessions.get(sessionId);
  session.steps.push({
    stepId: step.stepId,
    timestamp: new Date().toISOString()
  });
  
  funnel.sessions.set(sessionId, session);
  funnels.set(funnelId, funnel);
  
  return funnel;
}

function analyzeFunnel(funnelId) {
  const funnel = funnels.get(funnelId);
  if (!funnel) return null;
  
  const analysis = {
    funnelId,
    totalSessions: funnel.sessions.size,
    steps: []
  };
  
  funnel.steps.forEach((step, index) => {
    const sessionsAtStep = Array.from(funnel.sessions.values())
      .filter(session => session.steps.some(s => s.stepId === step.stepId));
    
    const count = sessionsAtStep.length;
    const percentage = (count / funnel.sessions.size) * 100;
    
    let dropoff = 0;
    if (index > 0) {
      const previousCount = analysis.steps[index - 1].count;
      dropoff = ((previousCount - count) / previousCount) * 100;
    }
    
    analysis.steps.push({
      stepId: step.stepId,
      name: step.name,
      count,
      percentage: Math.round(percentage * 10) / 10,
      dropoff: Math.round(dropoff * 10) / 10
    });
  });
  
  return analysis;
}

// ================================================================
// PERFORMANCE REPORTS
// ================================================================

function generatePerformanceReport({ draftId, startDate, endDate, metrics: metricNames = [] }) {
  const reportId = `report-${crypto.randomBytes(4).toString('hex')}`;
  
  const report = {
    reportId,
    draftId,
    period: { startDate, endDate },
    metrics: {},
    summary: {},
    createdAt: new Date().toISOString()
  };
  
  metricNames.forEach(metricName => {
    const metricData = getMetrics({ draftId, metricName, startDate, endDate, limit: 10000 });
    const aggregated = aggregateMetrics({ draftId, metricName, groupBy: 'day', startDate, endDate });
    
    report.metrics[metricName] = {
      totalEvents: metricData.length,
      aggregated
    };
  });
  
  // Generate summary
  report.summary = {
    totalMetrics: metricNames.length,
    period: endDate && startDate 
      ? Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
      : 0
  };
  
  performanceReports.set(reportId, report);
  return report;
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Metrics
  trackMetric,
  getMetrics,
  aggregateMetrics,
  
  // Forecasting
  createForecast,
  
  // Benchmarking
  createBenchmark,
  addBenchmarkSample,
  compareToBenchmark,
  
  // A/B Testing
  createABTest,
  recordABTestMetric,
  analyzeABTest,
  
  // Cohort Analysis
  createCohort,
  addCohortMember,
  analyzeCohort,
  
  // Funnel Tracking
  createFunnel,
  trackFunnelEvent,
  analyzeFunnel,
  
  // Reports
  generatePerformanceReport,
  
  // Internal stores
  metrics,
  forecasts,
  benchmarks,
  abTests,
  cohorts,
  funnels,
  performanceReports
};
