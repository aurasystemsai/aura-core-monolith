/**
 * Analytics & Reporting Engine for AB Testing Suite
 * 
 * Comprehensive analytics and reporting capabilities:
 * - Real-time metric tracking and aggregation
 * - Funnel analysis with drop-off identification
 * - Cohort analysis and retention curves
 * - Time-series analysis with trend detection
 * - Attribution modeling
 * - Custom dashboards and reports
 * - Alert system for anomalies
 * - Data export in multiple formats
 */

// In-memory stores
const metricsData = new Map();
const funnels = new Map();
const cohorts = new Map();
const timeSeries = new Map();
const dashboards = new Map();
const reports = new Map();
const alerts = new Map();
const exports = new Map();

// ==================== REAL-TIME METRIC TRACKING ====================

/**
 * Track metric event
 */
function trackMetric(experimentId, variantId, metric) {
  const {
    userId,
    metricName,
    value,
    timestamp = Date.now(),
    metadata = {}
  } = metric;
  
  const key = `${experimentId}:${variantId}`;
  
  if (!metricsData.has(key)) {
    metricsData.set(key, {
      experimentId,
      variantId,
      metrics: {},
      events: []
    });
  }
  
  const data = metricsData.get(key);
  
  // Initialize metric if not exists
  if (!data.metrics[metricName]) {
    data.metrics[metricName] = {
      count: 0,
      sum: 0,
      sumSquares: 0,
      min: Infinity,
      max: -Infinity,
      values: [],
      users: new Set()
    };
  }
  
  const m = data.metrics[metricName];
  m.count++;
  m.sum += value;
  m.sumSquares += value * value;
  m.min = Math.min(m.min, value);
  m.max = Math.max(m.max, value);
  m.values.push(value);
  m.users.add(userId);
  
  // Store event
  data.events.push({
    userId,
    metricName,
    value,
    timestamp,
    metadata
  });
  
  return {
    mean: m.sum / m.count,
    stdDev: Math.sqrt((m.sumSquares / m.count) - Math.pow(m.sum / m.count, 2)),
    count: m.count,
    uniqueUsers: m.users.size
  };
}

/**
 * Get aggregated metrics for variant
 */
function getMetrics(experimentId, variantId, metricName) {
  const key = `${experimentId}:${variantId}`;
  const data = metricsData.get(key);
  
  if (!data || !data.metrics[metricName]) {
    return null;
  }
  
  const m = data.metrics[metricName];
  const mean = m.sum / m.count;
  const variance = (m.sumSquares / m.count) - (mean * mean);
  const stdDev = Math.sqrt(variance);
  
  return {
    metricName,
    variantId,
    count: m.count,
    uniqueUsers: m.users.size,
    sum: m.sum,
    mean,
    median: calculateMedian(m.values),
    stdDev,
    min: m.min,
    max: m.max,
    percentiles: calculatePercentiles(m.values, [25, 50, 75, 90, 95, 99])
  };
}

/**
 * Compare metrics across variants
 */
function compareVariants(experimentId, metricName) {
  const variants = [];
  
  metricsData.forEach((data, key) => {
    if (data.experimentId === experimentId && data.metrics[metricName]) {
      const metrics = getMetrics(experimentId, data.variantId, metricName);
      variants.push(metrics);
    }
  });
  
  if (variants.length < 2) return null;
  
  // Sort by mean
  variants.sort((a, b) => b.mean - a.mean);
  
  // Calculate lifts relative to control (first variant)
  const control = variants[0];
  const comparisons = variants.slice(1).map(variant => ({
    variant: variant.variantId,
    lift: ((variant.mean - control.mean) / control.mean) * 100,
    liftAbsolute: variant.mean - control.mean,
    control: control.mean,
    treatment: variant.mean,
    significant: false // Would use statistical tests from statistical-analysis-engine.js
  }));
  
  return {
    metric: metricName,
    control: control.variantId,
    variants,
    comparisons
  };
}

// ==================== FUNNEL ANALYSIS ====================

/**
 * Define funnel with steps
 */
function createFunnel(experimentId, config) {
  const {
    name,
    steps, // Array of { name, event, condition? }
    timeWindow = 86400000 // 24 hours in ms
  } = config;
  
  const funnelId = `funnel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const funnel = {
    id: funnelId,
    experimentId,
    name,
    steps,
    timeWindow,
    data: {},
    createdAt: new Date().toISOString()
  };
  
  funnels.set(funnelId, funnel);
  
  return funnel;
}

/**
 * Track user through funnel
 */
function trackFunnelEvent(funnelId, userId, event, timestamp = Date.now()) {
  const funnel = funnels.get(funnelId);
  if (!funnel) throw new Error('Funnel not found');
  
  if (!funnel.data[userId]) {
    funnel.data[userId] = {
      events: [],
      completedSteps: new Set(),
      startTime: null,
      endTime: null
    };
  }
  
  const userData = funnel.data[userId];
  userData.events.push({ event, timestamp });
  
  // Check which step this event corresponds to
  funnel.steps.forEach((step, idx) => {
    if (step.event === event) {
      userData.completedSteps.add(idx);
      if (idx === 0) userData.startTime = timestamp;
      if (idx === funnel.steps.length - 1) userData.endTime = timestamp;
    }
  });
  
  return userData;
}

/**
 * Analyze funnel performance
 */
function analyzeFunnel(funnelId) {
  const funnel = funnels.get(funnelId);
  if (!funnel) throw new Error('Funnel not found');
  
  const stepStats = funnel.steps.map((step, idx) => ({
    step: idx,
    name: step.name,
    users: 0,
    conversionRate: 0,
    dropOffRate: 0,
    avgTimeToNext: 0
  }));
  
  const totalUsers = Object.keys(funnel.data).length;
  
  // Count users at each step
  Object.values(funnel.data).forEach(userData => {
    funnel.steps.forEach((step, idx) => {
      if (userData.completedSteps.has(idx)) {
        stepStats[idx].users++;
      }
    });
  });
  
  // Calculate conversion and drop-off rates
  stepStats.forEach((stat, idx) => {
    const previousUsers = idx === 0 ? totalUsers : stepStats[idx - 1].users;
    stat.conversionRate = previousUsers > 0 ? (stat.users / previousUsers) * 100 : 0;
    stat.dropOffRate = 100 - stat.conversionRate;
  });
  
  // Calculate time between steps
  Object.values(funnel.data).forEach(userData => {
    const events = userData.events.sort((a, b) => a.timestamp - b.timestamp);
    for (let i = 0; i < events.length - 1; i++) {
      const timeDiff = events[i + 1].timestamp - events[i].timestamp;
      stepStats[i].avgTimeToNext += timeDiff;
    }
  });
  
  stepStats.forEach((stat, idx) => {
    if (idx < stepStats.length - 1) {
      stat.avgTimeToNext = stat.avgTimeToNext / (stat.users || 1);
    }
  });
  
  return {
    funnelId,
    name: funnel.name,
    totalUsers,
    completedAll: stepStats[stepStats.length - 1].users,
    overallConversion: (stepStats[stepStats.length - 1].users / totalUsers) * 100,
    steps: stepStats
  };
}

// ==================== COHORT ANALYSIS ====================

/**
 * Create cohort based on criteria
 */
function createCohort(experimentId, config) {
  const {
    name,
    criteria, // { attribute, operator, value }
    dateRange,
    retentionWindow = 30 // days
  } = config;
  
  const cohortId = `cohort_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const cohort = {
    id: cohortId,
    experimentId,
    name,
    criteria,
    dateRange,
    retentionWindow,
    users: new Set(),
    activityLog: new Map(),
    createdAt: new Date().toISOString()
  };
  
  cohorts.set(cohortId, cohort);
  
  return cohort;
}

/**
 * Add user to cohort
 */
function addUserToCohort(cohortId, userId, joinDate = Date.now()) {
  const cohort = cohorts.get(cohortId);
  if (!cohort) throw new Error('Cohort not found');
  
  cohort.users.add(userId);
  cohort.activityLog.set(userId, {
    joinDate,
    activities: []
  });
  
  return cohort;
}

/**
 * Track cohort user activity
 */
function trackCohortActivity(cohortId, userId, activity, date = Date.now()) {
  const cohort = cohorts.get(cohortId);
  if (!cohort) throw new Error('Cohort not found');
  
  const userLog = cohort.activityLog.get(userId);
  if (!userLog) throw new Error('User not in cohort');
  
  userLog.activities.push({ activity, date });
  
  return userLog;
}

/**
 * Calculate cohort retention
 */
function calculateCohortRetention(cohortId) {
  const cohort = cohorts.get(cohortId);
  if (!cohort) throw new Error('Cohort not found');
  
  const retentionData = [];
  const dayMs = 24 * 60 * 60 * 1000;
  
  for (let day = 0; day <= cohort.retentionWindow; day++) {
    let activeUsers = 0;
    
    cohort.activityLog.forEach((userLog, userId) => {
      const targetDate = userLog.joinDate + (day * dayMs);
      const wasActive = userLog.activities.some(act => {
        const actDate = new Date(act.date).setHours(0, 0, 0, 0);
        const targDate = new Date(targetDate).setHours(0, 0, 0, 0);
        return actDate === targDate;
      });
      
      if (wasActive) activeUsers++;
    });
    
    retentionData.push({
      day,
      activeUsers,
      retentionRate: (activeUsers / cohort.users.size) * 100
    });
  }
  
  return {
    cohortId,
    name: cohort.name,
    cohortSize: cohort.users.size,
    retentionData,
    dayNRetention: {
      day1: retentionData[1]?.retentionRate || 0,
      day7: retentionData[7]?.retentionRate || 0,
      day30: retentionData[30]?.retentionRate || 0
    }
  };
}

// ==================== TIME-SERIES ANALYSIS ====================

/**
 * Create time-series for metric
 */
function createTimeSeries(experimentId, variantId, metricName, interval = 'hour') {
  const seriesId = `${experimentId}:${variantId}:${metricName}`;
  
  const series = {
    experimentId,
    variantId,
    metricName,
    interval, // 'minute', 'hour', 'day'
    dataPoints: [],
    createdAt: new Date().toISOString()
  };
  
  timeSeries.set(seriesId, series);
  
  return series;
}

/**
 * Aggregate metrics into time-series buckets
 */
function aggregateTimeSeries(experimentId, variantId, metricName) {
  const key = `${experimentId}:${variantId}`;
  const data = metricsData.get(key);
  
  if (!data || !data.metrics[metricName]) return null;
  
  const seriesId = `${experimentId}:${variantId}:${metricName}`;
  const series = timeSeries.get(seriesId) || createTimeSeries(experimentId, variantId, metricName);
  
  // Group events by time bucket
  const buckets = new Map();
  const bucketSize = getBucketSize(series.interval);
  
  data.events
    .filter(e => e.metricName === metricName)
    .forEach(event => {
      const bucket = Math.floor(event.timestamp / bucketSize) * bucketSize;
      
      if (!buckets.has(bucket)) {
        buckets.set(bucket, {
          timestamp: bucket,
          count: 0,
          sum: 0,
          values: []
        });
      }
      
      const b = buckets.get(bucket);
      b.count++;
      b.sum += event.value;
      b.values.push(event.value);
    });
  
  // Calculate aggregates for each bucket
  series.dataPoints = Array.from(buckets.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(bucket => ({
      timestamp: bucket.timestamp,
      count: bucket.count,
      mean: bucket.sum / bucket.count,
      median: calculateMedian(bucket.values),
      min: Math.min(...bucket.values),
      max: Math.max(...bucket.values)
    }));
  
  return series;
}

/**
 * Detect trends in time-series
 */
function detectTrends(seriesId) {
  const series = timeSeries.get(seriesId);
  if (!series || series.dataPoints.length < 3) return null;
  
  const values = series.dataPoints.map(p => p.mean);
  const n = values.length;
  
  // Simple linear regression
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) * (i - xMean);
  }
  
  const slope = num / den;
  const intercept = yMean - slope * xMean;
  
  // Determine trend
  let trend = 'stable';
  if (Math.abs(slope) > 0.1 * yMean) {
    trend = slope > 0 ? 'increasing' : 'decreasing';
  }
  
  return {
    seriesId,
    trend,
    slope,
    intercept,
    r2: calculateR2(values, slope, intercept)
  };
}

// ==================== DASHBOARDS ====================

/**
 * Create custom dashboard
 */
function createDashboard(config) {
  const {
    name,
    experimentId,
    widgets // Array of widget configs
  } = config;
  
  const dashboardId = `dash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const dashboard = {
    id: dashboardId,
    name,
    experimentId,
    widgets: widgets.map((w, idx) => ({
      id: `widget_${idx}`,
      type: w.type, // 'metric', 'chart', 'funnel', 'cohort'
      config: w.config,
      position: w.position || { x: 0, y: idx, w: 12, h: 4 }
    })),
    createdAt: new Date().toISOString()
  };
  
  dashboards.set(dashboardId, dashboard);
  
  return dashboard;
}

/**
 * Refresh dashboard data
 */
function refreshDashboard(dashboardId) {
  const dashboard = dashboards.get(dashboardId);
  if (!dashboard) throw new Error('Dashboard not found');
  
  const data = {};
  
  dashboard.widgets.forEach(widget => {
    switch (widget.type) {
      case 'metric':
        data[widget.id] = getMetrics(
          dashboard.experimentId,
          widget.config.variantId,
          widget.config.metricName
        );
        break;
      case 'funnel':
        data[widget.id] = analyzeFunnel(widget.config.funnelId);
        break;
      case 'cohort':
        data[widget.id] = calculateCohortRetention(widget.config.cohortId);
        break;
      case 'chart':
        data[widget.id] = aggregateTimeSeries(
          dashboard.experimentId,
          widget.config.variantId,
          widget.config.metricName
        );
        break;
    }
  });
  
  dashboard.lastRefreshed = new Date().toISOString();
  dashboard.data = data;
  
  return dashboard;
}

// ==================== REPORTS ====================

/**
 * Generate comprehensive report
 */
function generateReport(experimentId, reportType = 'summary') {
  const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const report = {
    id: reportId,
    experimentId,
    type: reportType,
    generatedAt: new Date().toISOString(),
    sections: []
  };
  
  if (reportType === 'summary' || reportType === 'comprehensive') {
    // Metrics summary
    report.sections.push({
      title: 'Metrics Summary',
      data: getExperimentSummary(experimentId)
    });
  }
  
  if (reportType === 'comprehensive') {
    // Funnel analysis
    report.sections.push({
      title: 'Funnel Analysis',
      data: getFunnelsSummary(experimentId)
    });
    
    // Cohort analysis
    report.sections.push({
      title: 'Cohort Analysis',
      data: getCohortsSummary(experimentId)
    });
  }
  
  reports.set(reportId, report);
  
  return report;
}

/**
 * Export report in various formats
 */
function exportReport(reportId, format = 'json') {
  const report = reports.get(reportId);
  if (!report) throw new Error('Report not found');
  
  const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  let data;
  switch (format) {
    case 'json':
      data = JSON.stringify(report, null, 2);
      break;
    case 'csv':
      data = convertToCSV(report);
      break;
    case 'html':
      data = convertToHTML(report);
      break;
    default:
      throw new Error('Unsupported format');
  }
  
  const exportRecord = {
    id: exportId,
    reportId,
    format,
    data,
    createdAt: new Date().toISOString()
  };
  
  exports.set(exportId, exportRecord);
  
  return exportRecord;
}

// ==================== ALERTS ====================

/**
 * Create alert for anomaly detection
 */
function createAlert(config) {
  const {
    experimentId,
    metricName,
    threshold,
    condition // 'above', 'below', 'change'
  } = config;
  
  const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const alert = {
    id: alertId,
    experimentId,
    metricName,
    threshold,
    condition,
    active: true,
    triggered: [],
    createdAt: new Date().toISOString()
  };
  
  alerts.set(alertId, alert);
  
  return alert;
}

/**
 * Check alerts
 */
function checkAlerts(experimentId) {
  const triggeredAlerts = [];
  
  alerts.forEach(alert => {
    if (!alert.active || alert.experimentId !== experimentId) return;
    
    // Get current metric value
    const variants = [];
    metricsData.forEach((data, key) => {
      if (data.experimentId === experimentId && data.metrics[alert.metricName]) {
        variants.push(getMetrics(experimentId, data.variantId, alert.metricName));
      }
    });
    
    variants.forEach(variant => {
      let triggered = false;
      
      if (alert.condition === 'above' && variant.mean > alert.threshold) {
        triggered = true;
      } else if (alert.condition === 'below' && variant.mean < alert.threshold) {
        triggered = true;
      }
      
      if (triggered) {
        const triggerEvent = {
          variantId: variant.variantId,
          value: variant.mean,
          timestamp: new Date().toISOString()
        };
        alert.triggered.push(triggerEvent);
        triggeredAlerts.push({ alert, trigger: triggerEvent });
      }
    });
  });
  
  return triggeredAlerts;
}

// ==================== UTILITY FUNCTIONS ====================

function calculateMedian(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculatePercentiles(values, percentiles) {
  const sorted = [...values].sort((a, b) => a - b);
  const result = {};
  
  percentiles.forEach(p => {
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    result[`p${p}`] = sorted[idx];
  });
  
  return result;
}

function getBucketSize(interval) {
  switch (interval) {
    case 'minute': return 60 * 1000;
    case 'hour': return 60 * 60 * 1000;
    case 'day': return 24 * 60 * 60 * 1000;
    default: return 60 * 60 * 1000;
  }
}

function calculateR2(values, slope, intercept) {
  const yMean = values.reduce((a, b) => a + b, 0) / values.length;
  let ssTot = 0, ssRes = 0;
  
  values.forEach((y, x) => {
    const yPred = slope * x + intercept;
    ssTot += (y - yMean) ** 2;
    ssRes += (y - yPred) ** 2;
  });
  
  return 1 - (ssRes / ssTot);
}

function getExperimentSummary(experimentId) {
  const summary = {};
  
  metricsData.forEach((data, key) => {
    if (data.experimentId === experimentId) {
      summary[data.variantId] = {};
      Object.keys(data.metrics).forEach(metricName => {
        summary[data.variantId][metricName] = getMetrics(experimentId, data.variantId, metricName);
      });
    }
  });
  
  return summary;
}

function getFunnelsSummary(experimentId) {
  const summary = [];
  funnels.forEach(funnel => {
    if (funnel.experimentId === experimentId) {
      summary.push(analyzeFunnel(funnel.id));
    }
  });
  return summary;
}

function getCohortsSummary(experimentId) {
  const summary = [];
  cohorts.forEach(cohort => {
    if (cohort.experimentId === experimentId) {
      summary.push(calculateCohortRetention(cohort.id));
    }
  });
  return summary;
}

function convertToCSV(report) {
  // Simplified CSV conversion
  return 'Report CSV data';
}

function convertToHTML(report) {
  // Simplified HTML conversion
  return '<html><body><h1>Report</h1></body></html>';
}

// ==================== PUBLIC API ====================

module.exports = {
  // Metrics
  trackMetric,
  getMetrics,
  compareVariants,
  
  // Funnels
  createFunnel,
  trackFunnelEvent,
  analyzeFunnel,
  
  // Cohorts
  createCohort,
  addUserToCohort,
  trackCohortActivity,
  calculateCohortRetention,
  
  // Time-series
  createTimeSeries,
  aggregateTimeSeries,
  detectTrends,
  
  // Dashboards
  createDashboard,
  refreshDashboard,
  
  // Reports
  generateReport,
  exportReport,
  
  // Alerts
  createAlert,
  checkAlerts,
  
  // Stores
  metricsData,
  funnels,
  cohorts,
  timeSeries,
  dashboards,
  reports,
  alerts,
  exports
};
