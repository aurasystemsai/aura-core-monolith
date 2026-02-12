/**
 * ANALYTICS & PERFORMANCE ENGINE
 * Comprehensive analytics, reporting, performance tracking,
 * revenue attribution, and dashboard metrics
 */

// In-memory stores
const metrics = new Map();
const reports = new Map();
const dashboards = new Map();
const attributions = new Map();
const performanceSnapshots = new Map();

// ================================================================
// METRICS TRACKING
// ================================================================

function trackMetric({ category, name, value, metadata = {} }) {
  const id = `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const metric = {
    id,
    category, // 'recommendation', 'bundle', 'cart', 'checkout', 'recovery'
    name,
    value,
    metadata,
    timestamp: new Date().toISOString()
  };
  
  metrics.set(id, metric);
  
  // Update aggregates
  updateAggregates(category, name, value);
  
  return metric;
}

function getMetrics({ category, name, startDate, endDate, limit = 1000 }) {
  let results = Array.from(metrics.values());
  
  if (category) {
    results = results.filter(m => m.category === category);
  }
  
  if (name) {
    results = results.filter(m => m.name === name);
  }
  
  if (startDate) {
    results = results.filter(m => new Date(m.timestamp) >= new Date(startDate));
  }
  
  if (endDate) {
    results = results.filter(m => new Date(m.timestamp) <= new Date(endDate));
  }
  
  return results
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

function updateAggregates(category, name, value) {
  const key = `${category}:${name}`;
  
  let agg = metrics.get(`aggregate_${key}`) || {
    category,
    name,
    count: 0,
    sum: 0,
    min: Infinity,
    max: -Infinity,
    avg: 0
  };
  
  agg.count += 1;
  agg.sum += value;
  agg.min = Math.min(agg.min, value);
  agg.max = Math.max(agg.max, value);
  agg.avg = agg.sum / agg.count;
  agg.lastUpdated = new Date().toISOString();
  
  metrics.set(`aggregate_${key}`, agg);
}

function getAggregate(category, name) {
  const key = `${category}:${name}`;
  return metrics.get(`aggregate_${key}`) || null;
}

// ================================================================
// REPORT GENERATION
// ================================================================

function generateReport({ type, period = '30d', filters = {} }) {
  const id = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  let data;
  
  switch (type) {
    case 'recommendation_performance':
      data = generateRecommendationReport(period, filters);
      break;
    case 'bundle_performance':
      data = generateBundleReport(period, filters);
      break;
    case 'cart_analytics':
      data = generateCartReport(period, filters);
      break;
    case 'revenue_attribution':
      data = generateRevenueReport(period, filters);
      break;
    case 'customer_insights':
      data = generateCustomerReport(period, filters);
      break;
    case 'comprehensive':
      data = generateComprehensiveReport(period, filters);
      break;
    default:
      data = { error: 'Unknown report type' };
  }
  
  const report = {
    id,
    type,
    period,
    filters,
    data,
    generatedAt: new Date().toISOString()
  };
  
  reports.set(id, report);
  return report;
}

function generateRecommendationReport(period, filters) {
  const metricsData = getMetrics({ category: 'recommendation', ...filters });
  
  const totalViews = metricsData.filter(m => m.name === 'view').length;
  const totalClicks = metricsData.filter(m => m.name === 'click').length;
  const totalConversions = metricsData.filter(m => m.name === 'conversion').length;
  
  const clickRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  
  const revenue = metricsData
    .filter(m => m.name === 'conversion')
    .reduce((sum, m) => sum + (m.metadata.revenue || 0), 0);
  
  return {
    period,
    totalViews,
    totalClicks,
    totalConversions,
    clickRate,
    conversionRate,
    revenue,
    avgOrderValue: totalConversions > 0 ? revenue / totalConversions : 0
  };
}

function generateBundleReport(period, filters) {
  const metricsData = getMetrics({ category: 'bundle', ...filters });
  
  const bundleViews = metricsData.filter(m => m.name === 'view').length;
  const bundleAdds = metricsData.filter(m => m.name === 'add_to_cart').length;
  const bundlePurchases = metricsData.filter(m => m.name === 'purchase').length;
  
  const addToCartRate = bundleViews > 0 ? (bundleAdds / bundleViews) * 100 : 0;
  const purchaseRate = bundleAdds > 0 ? (bundlePurchases / bundleAdds) * 100 : 0;
  
  const revenue = metricsData
    .filter(m => m.name === 'purchase')
    .reduce((sum, m) => sum + (m.metadata.revenue || 0), 0);
  
  const margin = metricsData
    .filter(m => m.name === 'purchase')
    .reduce((sum, m) => sum + (m.metadata.margin || 0), 0);
  
  return {
    period,
    bundleViews,
    bundleAdds,
    bundlePurchases,
    addToCartRate,
    purchaseRate,
    revenue,
    margin,
    avgBundleValue: bundlePurchases > 0 ? revenue / bundlePurchases : 0
  };
}

function generateCartReport(period, filters) {
  const metricsData = getMetrics({ category: 'cart', ...filters });
  
  const cartsCreated = metricsData.filter(m => m.name === 'created').length;
  const cartsAbandoned = metricsData.filter(m => m.name === 'abandoned').length;
  const cartsCompleted = metricsData.filter(m => m.name === 'completed').length;
  
  const abandonmentRate = cartsCreated > 0 ? (cartsAbandoned / cartsCreated) * 100 : 0;
  const completionRate = cartsCreated > 0 ? (cartsCompleted / cartsCreated) * 100 : 0;
  
  const totalValue = metricsData
    .filter(m => m.name === 'completed')
    .reduce((sum, m) => sum + (m.metadata.cartValue || 0), 0);
  
  return {
    period,
    cartsCreated,
    cartsAbandoned,
    cartsCompleted,
    abandonmentRate,
    completionRate,
    totalRevenue: totalValue,
    avgCartValue: cartsCompleted > 0 ? totalValue / cartsCompleted : 0
  };
}

function generateRevenueReport(period, filters) {
  const allMetrics = getMetrics({ ...filters });
  
  const revenueBySource = {
    recommendations: 0,
    bundles: 0,
    upsells: 0,
    cross_sells: 0,
    organic: 0
  };
  
  allMetrics.forEach(m => {
    if (m.name === 'conversion' || m.name === 'purchase') {
      const revenue = m.metadata.revenue || 0;
      const source = m.metadata.source || 'organic';
      revenueBySource[source] = (revenueBySource[source] || 0) + revenue;
    }
  });
  
  const totalRevenue = Object.values(revenueBySource).reduce((sum, v) => sum + v, 0);
  
  const attribution = {};
  Object.keys(revenueBySource).forEach(source => {
    attribution[source] = {
      revenue: revenueBySource[source],
      percentage: totalRevenue > 0 ? (revenueBySource[source] / totalRevenue) * 100 : 0
    };
  });
  
  return {
    period,
    totalRevenue,
    revenueBySource,
    attribution
  };
}

function generateCustomerReport(period, filters) {
  const metricsData = getMetrics({ category: 'customer', ...filters });
  
  const uniqueCustomers = new Set(metricsData.map(m => m.metadata.customerId)).size;
  const repeatPurchases = metricsData.filter(m => m.metadata.isRepeat).length;
  const repeatRate = uniqueCustomers > 0 ? (repeatPurchases / uniqueCustomers) * 100 : 0;
  
  return {
    period,
    uniqueCustomers,
    repeatPurchases,
    repeatRate
  };
}

function generateComprehensiveReport(period, filters) {
  return {
    recommendations: generateRecommendationReport(period, filters),
    bundles: generateBundleReport(period, filters),
    carts: generateCartReport(period, filters),
    revenue: generateRevenueReport(period, filters),
    customers: generateCustomerReport(period, filters)
  };
}

function getReport(id) {
  return reports.get(id) || null;
}

function listReports({ type, limit = 50 }) {
  let results = Array.from(reports.values());
  
  if (type) {
    results = results.filter(r => r.type === type);
  }
  
  return results
    .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
    .slice(0, limit);
}

// ================================================================
// DASHBOARD MANAGEMENT
// ================================================================

function createDashboard({ name, widgets, refreshInterval = 300 }) {
  const id = `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const dashboard = {
    id,
    name,
    widgets,
    refreshInterval, // seconds
    layout: 'grid',
    createdAt: new Date().toISOString(),
    lastRefreshed: null
  };
  
  dashboards.set(id, dashboard);
  return dashboard;
}

function getDashboard(id) {
  return dashboards.get(id) || null;
}

function refreshDashboard(id) {
  const dashboard = dashboards.get(id);
  if (!dashboard) return null;
  
  // Refresh each widget
  dashboard.widgets.forEach(widget => {
    widget.data = fetchWidgetData(widget);
    widget.lastUpdated = new Date().toISOString();
  });
  
  dashboard.lastRefreshed = new Date().toISOString();
  dashboards.set(id, dashboard);
  
  return dashboard;
}

function fetchWidgetData(widget) {
  const { type, config } = widget;
  
  switch (type) {
    case 'metric':
      return getAggregate(config.category, config.name);
    case 'chart':
      return getMetrics({ category: config.category, limit: config.limit || 100 });
    case 'report_summary':
      const report = generateReport({ type: config.reportType, period: config.period });
      return report.data;
    case 'live_feed':
      return getMetrics({ category: config.category, limit: 10 });
    default:
      return null;
  }
}

function listDashboards() {
  return Array.from(dashboards.values());
}

// ================================================================
// REVENUE ATTRIBUTION
// ================================================================

function attributeRevenue({ orderId, amount, touchpoints }) {
  const id = `attribution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Use different attribution models
  const models = {
    lastTouch: lastTouchAttribution(touchpoints, amount),
    firstTouch: firstTouchAttribution(touchpoints, amount),
    linear: linearAttribution(touchpoints, amount),
    timeDecay: timeDecayAttribution(touchpoints, amount),
    positionBased: positionBasedAttribution(touchpoints, amount)
  };
  
  const attribution = {
    id,
    orderId,
    amount,
    touchpoints,
    models,
    createdAt: new Date().toISOString()
  };
  
  attributions.set(id, attribution);
  return attribution;
}

function lastTouchAttribution(touchpoints, amount) {
  if (touchpoints.length === 0) return {};
  
  const last = touchpoints[touchpoints.length - 1];
  return { [last.source]: amount };
}

function firstTouchAttribution(touchpoints, amount) {
  if (touchpoints.length === 0) return {};
  
  const first = touchpoints[0];
  return { [first.source]: amount };
}

function linearAttribution(touchpoints, amount) {
  if (touchpoints.length === 0) return {};
  
  const perTouch = amount / touchpoints.length;
  const result = {};
  
  touchpoints.forEach(tp => {
    result[tp.source] = (result[tp.source] || 0) + perTouch;
  });
  
  return result;
}

function timeDecayAttribution(touchpoints, amount) {
  if (touchpoints.length === 0) return {};
  
  const halfLife = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
  const now = Date.now();
  
  let totalWeight = 0;
  const weights = touchpoints.map(tp => {
    const age = now - new Date(tp.timestamp).getTime();
    const weight = Math.exp(-age / halfLife);
    totalWeight += weight;
    return { source: tp.source, weight };
  });
  
  const result = {};
  weights.forEach(({ source, weight }) => {
    result[source] = (result[source] || 0) + (amount * weight / totalWeight);
  });
  
  return result;
}

function positionBasedAttribution(touchpoints, amount) {
  if (touchpoints.length === 0) return {};
  
  if (touchpoints.length === 1) {
    return { [touchpoints[0].source]: amount };
  }
  
  // 40% first, 40% last, 20% distributed middle
  const result = {};
  const first = touchpoints[0].source;
  const last = touchpoints[touchpoints.length - 1].source;
  
  result[first] = (result[first] || 0) + amount * 0.4;
  result[last] = (result[last] || 0) + amount * 0.4;
  
  if (touchpoints.length > 2) {
    const middle = touchpoints.slice(1, -1);
    const perMiddle = (amount * 0.2) / middle.length;
    middle.forEach(tp => {
      result[tp.source] = (result[tp.source] || 0) + perMiddle;
    });
  }
  
  return result;
}

function getAttributionSummary({ period = '30d', model = 'linear' }) {
  const attrs = Array.from(attributions.values())
    .filter(a => isWithinPeriod(a.createdAt, period));
  
  const summary = {};
  
  attrs.forEach(a => {
    const modelData = a.models[model] || {};
    Object.keys(modelData).forEach(source => {
      summary[source] = (summary[source] || 0) + modelData[source];
    });
  });
  
  const total = Object.values(summary).reduce((sum, v) => sum + v, 0);
  
  const withPercentages = {};
  Object.keys(summary).forEach(source => {
    withPercentages[source] = {
      revenue: summary[source],
      percentage: total > 0 ? (summary[source] / total) * 100 : 0
    };
  });
  
  return {
    period,
    model,
    totalRevenue: total,
    bySource: withPercentages
  };
}

// ================================================================
// PERFORMANCE SNAPSHOTS
// ================================================================

function createPerformanceSnapshot() {
  const id = `snapshot_${Date.now()}`;
  
  const snapshot = {
    id,
    timestamp: new Date().toISOString(),
    metrics: {
      recommendations: getAggregate('recommendation', 'conversion'),
      bundles: getAggregate('bundle', 'purchase'),
      carts: getAggregate('cart', 'completed')
    },
    reports: {
      recommendations: generateRecommendationReport('24h'),
      bundles: generateBundleReport('24h'),
      carts: generateCartReport('24h')
    }
  };
  
  performanceSnapshots.set(id, snapshot);
  return snapshot;
}

function compareSnapshots(snapshotId1, snapshotId2) {
  const s1 = performanceSnapshots.get(snapshotId1);
  const s2 = performanceSnapshots.get(snapshotId2);
  
  if (!s1 || !s2) return null;
  
  const comparison = {
    timeRange: { from: s1.timestamp, to: s2.timestamp },
    changes: {}
  };
  
  // Compare recommendation metrics
  const r1 = s1.reports.recommendations;
  const r2 = s2.reports.recommendations;
  
  comparison.changes.recommendations = {
    revenue: calculateChange(r1.revenue, r2.revenue),
    conversionRate: calculateChange(r1.conversionRate, r2.conversionRate),
    clickRate: calculateChange(r1.clickRate, r2.clickRate)
  };
  
  return comparison;
}

function calculateChange(before, after) {
  if (before === 0) return after > 0 ? 100 : 0;
  return ((after - before) / before) * 100;
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function isWithinPeriod(dateString, period) {
  const date = new Date(dateString);
  const now = new Date();
  const match = period.match(/^(\d+)([hdwmy])$/);
  
  if (!match) return true;
  
  const [, amount, unit] = match;
  const units = { h: 1/24, d: 1, w: 7, m: 30, y: 365 };
  const days = parseInt(amount) * (units[unit] || 1);
  const cutoff = new Date(now - days * 24 * 60 * 60 * 1000);
  
  return date > cutoff;
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Metrics
  trackMetric,
  getMetrics,
  getAggregate,
  
  // Reports
  generateReport,
  getReport,
  listReports,
  
  // Dashboards
  createDashboard,
  getDashboard,
  refreshDashboard,
  listDashboards,
  
  // Attribution
  attributeRevenue,
  getAttributionSummary,
  
  // Performance
  createPerformanceSnapshot,
  compareSnapshots,
  
  // Data stores
  metrics,
  reports,
  dashboards,
  attributions,
  performanceSnapshots
};
