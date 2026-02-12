// ================================================================
// KLAVIYO FLOW AUTOMATION - ANALYTICS & REPORTING ENGINE
// ================================================================
// Handles metrics, reports, dashboards, insights, attribution
// ================================================================

const crypto = require('crypto');

// In-memory stores
const metrics = new Map();
const reports = new Map();
const dashboards = new Map();
const insights = new Map();
const events = new Map();
const attributionModels = new Map();

// ================================================================
// METRICS TRACKING
// ================================================================

function trackMetric(data) {
  const metric = {
    id: `METRIC-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || '',
    type: data.type || 'counter',
    value: data.value || 0,
    dimensions: data.dimensions || {},
    flowId: data.flowId || null,
    campaignId: data.campaignId || null,
    timestamp: Date.now()
  };
  
  metrics.set(metric.id, metric);
  return metric;
}

function getMetrics(filter = {}) {
  let results = Array.from(metrics.values());
  
  if (filter.name) {
    results = results.filter(m => m.name === filter.name);
  }
  if (filter.flowId) {
    results = results.filter(m => m.flowId === filter.flowId);
  }
  if (filter.startDate) {
    results = results.filter(m => m.timestamp >= filter.startDate);
  }
  if (filter.endDate) {
    results = results.filter(m => m.timestamp <= filter.endDate);
  }
  
  return results.sort((a, b) => b.timestamp - a.timestamp);
}

function aggregateMetrics(metricName, aggregation = 'sum', filter = {}) {
  const filteredMetrics = getMetrics({ ...filter, name: metricName });
  
  if (filteredMetrics.length === 0) return 0;
  
  const values = filteredMetrics.map(m => m.value);
  
  switch (aggregation) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'count':
      return values.length;
    default:
      return values.reduce((a, b) => a + b, 0);
  }
}

// ================================================================
// REPORTS
// ================================================================

function listReports(filter = {}) {
  let results = Array.from(reports.values());
  
  if (filter.type) {
    results = results.filter(r => r.type === filter.type);
  }
  
  return results;
}

function createReport(data) {
  const report = {
    id: `RPT-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'Untitled Report',
    type: data.type || 'custom',
    dateRange: data.dateRange || { start: Date.now() - 30 * 24 * 60 * 60 * 1000, end: Date.now() },
    metrics: data.metrics || [],
    dimensions: data.dimensions || [],
    filters: data.filters || [],
    schedule: data.schedule || null,
    recipients: data.recipients || [],
    format: data.format || 'pdf',
    status: 'active',
    lastGeneratedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  reports.set(report.id, report);
  return report;
}

function getReport(id) {
  return reports.get(id);
}

function updateReport(id, updates) {
  const report = reports.get(id);
  if (!report) return null;
  
  Object.assign(report, updates, { updatedAt: Date.now() });
  reports.set(id, report);
  return report;
}

function deleteReport(id) {
  return reports.delete(id);
}

function generateReport(id) {
  const report = reports.get(id);
  if (!report) return null;
  
  const data = {
    reportId: id,
    name: report.name,
    generatedAt: Date.now(),
    dateRange: report.dateRange,
    sections: []
  };
  
  // Generate metrics sections
  report.metrics.forEach(metricName => {
    const value = aggregateMetrics(metricName, 'sum', {
      startDate: report.dateRange.start,
      endDate: report.dateRange.end
    });
    
    data.sections.push({
      metric: metricName,
      value,
      change: calculateChange(metricName, report.dateRange)
    });
  });
  
  report.lastGeneratedAt = Date.now();
  reports.set(id, report);
  
  return data;
}

function calculateChange(metricName, dateRange) {
  const duration = dateRange.end - dateRange.start;
  const previousRange = {
    start: dateRange.start - duration,
    end: dateRange.start
  };
  
  const currentValue = aggregateMetrics(metricName, 'sum', {
    startDate: dateRange.start,
    endDate: dateRange.end
  });
  
  const previousValue = aggregateMetrics(metricName, 'sum', {
    startDate: previousRange.start,
    endDate: previousRange.end
  });
  
  if (previousValue === 0) return 0;
  return ((currentValue - previousValue) / previousValue * 100).toFixed(2);
}

// ================================================================
// DASHBOARDS
// ================================================================

function listDashboards(filter = {}) {
  return Array.from(dashboards.values());
}

function createDashboard(data) {
  const dashboard = {
    id: `DASH-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'Untitled Dashboard',
    widgets: data.widgets || [],
    layout: data.layout || 'grid',
    filters: data.filters || [],
    refreshInterval: data.refreshInterval || 300,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  dashboards.set(dashboard.id, dashboard);
  return dashboard;
}

function getDashboard(id) {
  return dashboards.get(id);
}

function updateDashboard(id, updates) {
  const dashboard = dashboards.get(id);
  if (!dashboard) return null;
  
  Object.assign(dashboard, updates, { updatedAt: Date.now() });
  dashboards.set(id, dashboard);
  return dashboard;
}

function deleteDashboard(id) {
  return dashboards.delete(id);
}

function getDashboardData(id, filter = {}) {
  const dashboard = dashboards.get(id);
  if (!dashboard) return null;
  
  const data = {
    dashboardId: id,
    name: dashboard.name,
    generatedAt: Date.now(),
    widgets: []
  };
  
  dashboard.widgets.forEach(widget => {
    const widgetData = {
      id: widget.id,
      type: widget.type,
      title: widget.title,
      data: null
    };
    
    if (widget.type === 'metric') {
      widgetData.data = aggregateMetrics(widget.metricName, widget.aggregation || 'sum', filter);
    } else if (widget.type === 'chart') {
      widgetData.data = getTimeSeriesData(widget.metricName, filter);
    } else if (widget.type === 'table') {
      widgetData.data = getMetrics({ ...filter, name: widget.metricName }).slice(0, widget.limit || 10);
    }
    
    data.widgets.push(widgetData);
  });
  
  return data;
}

function getTimeSeriesData(metricName, filter = {}) {
  const filteredMetrics = getMetrics({ ...filter, name: metricName });
  
  // Group by day
  const grouped = {};
  filteredMetrics.forEach(m => {
    const day = new Date(m.timestamp).toISOString().split('T')[0];
    if (!grouped[day]) grouped[day] = 0;
    grouped[day] += m.value;
  });
  
  return Object.entries(grouped).map(([date, value]) => ({ date, value }));
}

// ================================================================
// INSIGHTS & AI
// ================================================================

function generateInsights(filter = {}) {
  const insight = {
    id: `INS-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    type: 'trend',
    title: '',
    description: '',
    impact: 'medium',
    recommendation: '',
    data: {},
    generatedAt: Date.now()
  };
  
  // Analyze revenue trend
  const revenueData = getMetrics({ ...filter, name: 'revenue' });
  if (revenueData.length > 0) {
    const totalRevenue = revenueData.reduce((sum, m) => sum + m.value, 0);
    const avgRevenue = totalRevenue / revenueData.length;
    
    insight.title = 'Revenue Trend Analysis';
    insight.description = `Generated $${totalRevenue.toFixed(2)} in total revenue with an average of $${avgRevenue.toFixed(2)} per event.`;
    insight.impact = totalRevenue > 10000 ? 'high' : 'medium';
    insight.data = { totalRevenue, avgRevenue, eventCount: revenueData.length };
  }
  
  insights.set(insight.id, insight);
  return insight;
}

function listInsights(filter = {}) {
  let results = Array.from(insights.values());
  
  if (filter.type) {
    results = results.filter(i => i.type === filter.type);
  }
  if (filter.impact) {
    results = results.filter(i => i.impact === filter.impact);
  }
  
  return results.sort((a, b) => b.generatedAt - a.generatedAt);
}

function getInsight(id) {
  return insights.get(id);
}

// ================================================================
// EVENT TRACKING
// ================================================================

function trackEvent(data) {
  const event = {
    id: `EVT-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
    name: data.name || '',
    contactId: data.contactId || null,
    properties: data.properties || {},
    flowId: data.flowId || null,
    campaignId: data.campaignId || null,
    timestamp: Date.now()
  };
  
  events.set(event.id, event);
  
  // Auto-track as metric
  trackMetric({
    name: event.name,
    type: 'counter',
    value: 1,
    dimensions: event.properties,
    flowId: event.flowId,
    campaignId: event.campaignId
  });
  
  return event;
}

function getEvents(filter = {}) {
  let results = Array.from(events.values());
  
  if (filter.name) {
    results = results.filter(e => e.name === filter.name);
  }
  if (filter.contactId) {
    results = results.filter(e => e.contactId === filter.contactId);
  }
  if (filter.flowId) {
    results = results.filter(e => e.flowId === filter.flowId);
  }
  if (filter.startDate) {
    results = results.filter(e => e.timestamp >= filter.startDate);
  }
  if (filter.endDate) {
    results = results.filter(e => e.timestamp <= filter.endDate);
  }
  
  return results.sort((a, b) => b.timestamp - a.timestamp);
}

// ================================================================
// ATTRIBUTION
// ================================================================

function createAttributionModel(data) {
  const model = {
    id: `ATTR-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'Custom Attribution',
    type: data.type || 'last_touch',
    lookbackWindow: data.lookbackWindow || 30,
    touchpoints: data.touchpoints || [],
    weights: data.weights || {},
    createdAt: Date.now()
  };
  
  attributionModels.set(model.id, model);
  return model;
}

function getAttributionModel(id) {
  return attributionModels.get(id);
}

function calculateAttribution(modelId, conversionEvents) {
  const model = attributionModels.get(modelId);
  if (!model) return null;
  
  const attribution = {
    modelId,
    modelType: model.type,
    totalConversions: conversionEvents.length,
    attributions: []
  };
  
  conversionEvents.forEach(conversion => {
    const touchpoints = getEvents({
      contactId: conversion.contactId,
      endDate: conversion.timestamp,
      startDate: conversion.timestamp - (model.lookbackWindow * 24 * 60 * 60 * 1000)
    });
    
    let credits = {};
    
    if (model.type === 'last_touch') {
      if (touchpoints.length > 0) {
        const lastTouch = touchpoints[0];
        credits[lastTouch.flowId || 'unknown'] = 1;
      }
    } else if (model.type === 'first_touch') {
      if (touchpoints.length > 0) {
        const firstTouch = touchpoints[touchpoints.length - 1];
        credits[firstTouch.flowId || 'unknown'] = 1;
      }
    } else if (model.type === 'linear') {
      const creditPerTouch = 1 / touchpoints.length;
      touchpoints.forEach(t => {
        const key = t.flowId || 'unknown';
        credits[key] = (credits[key] || 0) + creditPerTouch;
      });
    }
    
    attribution.attributions.push({
      conversionId: conversion.id,
      credits
    });
  });
  
  return attribution;
}

// ================================================================
// PERFORMANCE ANALYTICS
// ================================================================

function getFlowPerformance(flowId, dateRange = {}) {
  const flowMetrics = getMetrics({
    flowId,
    startDate: dateRange.start || Date.now() - 30 * 24 * 60 * 60 * 1000,
    endDate: dateRange.end || Date.now()
  });
  
  const stats = {
    flowId,
    triggered: 0,
    completed: 0,
    converted: 0,
    revenue: 0,
    completionRate: 0,
    conversionRate: 0,
    averageRevenue: 0
  };
  
  flowMetrics.forEach(m => {
    if (m.name === 'flow_triggered') stats.triggered += m.value;
    if (m.name === 'flow_completed') stats.completed += m.value;
    if (m.name === 'flow_converted') stats.converted += m.value;
    if (m.name === 'revenue') stats.revenue += m.value;
  });
  
  stats.completionRate = stats.triggered > 0 ? (stats.completed / stats.triggered * 100).toFixed(2) : 0;
  stats.conversionRate = stats.completed > 0 ? (stats.converted / stats.completed * 100).toFixed(2) : 0;
  stats.averageRevenue = stats.converted > 0 ? (stats.revenue / stats.converted).toFixed(2) : 0;
  
  return stats;
}

function getCampaignPerformance(campaignId, dateRange = {}) {
  const campaignMetrics = getMetrics({
    campaignId,
    startDate: dateRange.start || Date.now() - 30 * 24 * 60 * 60 * 1000,
    endDate: dateRange.end || Date.now()
  });
  
  const stats = {
    campaignId,
    sent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    revenue: 0,
    deliveryRate: 0,
    openRate: 0,
    clickRate: 0,
    conversionRate: 0,
    roi: 0
  };
  
  campaignMetrics.forEach(m => {
    if (m.name === 'sent') stats.sent += m.value;
    if (m.name === 'delivered') stats.delivered += m.value;
    if (m.name === 'opened') stats.opened += m.value;
    if (m.name === 'clicked') stats.clicked += m.value;
    if (m.name === 'converted') stats.converted += m.value;
    if (m.name === 'revenue') stats.revenue += m.value;
  });
  
  stats.deliveryRate = stats.sent > 0 ? (stats.delivered / stats.sent * 100).toFixed(2) : 0;
  stats.openRate = stats.delivered > 0 ? (stats.opened / stats.delivered * 100).toFixed(2) : 0;
  stats.clickRate = stats.opened > 0 ? (stats.clicked / stats.opened * 100).toFixed(2) : 0;
  stats.conversionRate = stats.clicked > 0 ? (stats.converted / stats.clicked * 100).toFixed(2) : 0;
  
  return stats;
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Metrics
  trackMetric,
  getMetrics,
  aggregateMetrics,
  
  // Reports
  listReports,
  createReport,
  getReport,
  updateReport,
  deleteReport,
  generateReport,
  
  // Dashboards
  listDashboards,
  createDashboard,
  getDashboard,
  updateDashboard,
  deleteDashboard,
  getDashboardData,
  
  // Insights
  generateInsights,
  listInsights,
  getInsight,
  
  // Events
  trackEvent,
  getEvents,
  
  // Attribution
  createAttributionModel,
  getAttributionModel,
  calculateAttribution,
  
  // Performance
  getFlowPerformance,
  getCampaignPerformance
};
