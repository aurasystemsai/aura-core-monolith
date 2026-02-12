/**
 * Email Automation Builder - Analytics Engine
 * Comprehensive campaign analytics, performance tracking, and reporting
 */

const { v4: uuidv4 } = require('uuid');

// Mock data stores
const campaignAnalytics = new Map();
const reports = new Map();
const performanceHistory = [];

// Initialize with demo analytics data
function initializeDemoData() {
  const demoAnalytics = {
    'campaign-001': {
      campaignId: 'campaign-001',
      sent: 5000,
      delivered: 4900,
      opened: 1200,
      clicked: 400,
      conversions: 60,
      bounced: 100,
      unsubscribed: 10,
      spam: 5,
      revenue: 6000,
      avgOrderValue: 100,
      openRate: 0.24,
      clickRate: 0.08,
      conversionRate: 0.012,
      bounceRate: 0.02,
      unsubscribeRate: 0.002,
      spamRate: 0.001,
      roas: 12.0,
      deviceBreakdown: {
        desktop: 0.45,
        mobile: 0.5,
        tablet: 0.05
      },
      locationBreakdown: {
        'US': 0.6,
        'UK': 0.2,
        'CA': 0.1,
        'Other': 0.1
      },
      timeSeriesData: generateTimeSeriesData(),
      lastUpdated: new Date().toISOString()
    }
  };
  
  campaignAnalytics.set('campaign-001', demoAnalytics['campaign-001']);
}

function generateTimeSeriesData() {
  const data = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now);
    hour.setHours(hour.getHours() - i);
    data.push({
      timestamp: hour.toISOString(),
      opens: Math.floor(Math.random() * 50 + 10),
      clicks: Math.floor(Math.random() * 20 + 5),
      conversions: Math.floor(Math.random() * 5)
    });
  }
  return data;
}

//=============================================================================
// ANALYTICS OVERVIEW
//=============================================================================

function getAnalyticsOverview(filters = {}) {
  const { timeframe = '30d', campaignIds = [] } = filters;
  
  let analyticsToAggregate = [];
  if (campaignIds.length > 0) {
    analyticsToAggregate = campaignIds
      .map(id => campaignAnalytics.get(id))
      .filter(Boolean);
  } else {
    analyticsToAggregate = Array.from(campaignAnalytics.values());
  }
  
  if (analyticsToAggregate.length === 0) {
    return {
      totalCampaigns: 0,
      totalContacts: 0,
      totalSent: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalConversions: 0,
      totalRevenue: 0,
      avgOpenRate: 0,
      avgClickRate: 0,
      avgConversionRate: 0,
      avgUnsubscribeRate: 0,
      avgBounceRate: 0,
      roas: 0,
      timeframe
    };
  }
  
  const totals = analyticsToAggregate.reduce((acc, analytics) => {
    acc.sent += analytics.sent;
    acc.opened += analytics.opened;
    acc.clicked += analytics.clicked;
    acc.conversions += analytics.conversions;
    acc.revenue += analytics.revenue;
    acc.bounced += analytics.bounced;
    acc.unsubscribed += analytics.unsubscribed;
    return acc;
  }, { sent: 0, opened: 0, clicked: 0, conversions: 0, revenue: 0, bounced: 0, unsubscribed: 0 });
  
  return {
    totalCampaigns: analyticsToAggregate.length,
    totalContacts: totals.sent,
    totalSent: totals.sent,
    totalOpened: totals.opened,
    totalClicked: totals.clicked,
    totalConversions: totals.conversions,
    totalRevenue: totals.revenue,
    avgOpenRate: totals.sent > 0 ? totals.opened / totals.sent : 0,
    avgClickRate: totals.sent > 0 ? totals.clicked / totals.sent : 0,
    avgConversionRate: totals.sent > 0 ? totals.conversions / totals.sent : 0,
    avgUnsubscribeRate: totals.sent > 0 ? totals.unsubscribed / totals.sent : 0,
    avgBounceRate: totals.sent > 0 ? totals.bounced / totals.sent : 0,
    roas: totals.revenue > 0 ? totals.revenue / (totals.sent * 0.05) : 0,
    timeframe
  };
}

function getCampaignAnalytics(campaignId) {
  return campaignAnalytics.get(campaignId) || null;
}

function trackCampaignEvent(campaignId, eventType, data = {}) {
  let analytics = campaignAnalytics.get(campaignId);
  
  if (!analytics) {
    analytics = {
      campaignId,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      conversions: 0,
      bounced: 0,
      unsubscribed: 0,
      spam: 0,
      revenue: 0,
      avgOrderValue: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      bounceRate: 0,
      unsubscribeRate: 0,
      spamRate: 0,
      roas: 0,
      deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 },
      locationBreakdown: {},
      timeSeriesData: [],
      lastUpdated: new Date().toISOString()
    };
    campaignAnalytics.set(campaignId, analytics);
  }
  
  // Track event
  switch (eventType) {
    case 'sent':
      analytics.sent += data.count || 1;
      break;
    case 'delivered':
      analytics.delivered += data.count || 1;
      break;
    case 'opened':
      analytics.opened += data.count || 1;
      break;
    case 'clicked':
      analytics.clicked += data.count || 1;
      break;
    case 'conversion':
      analytics.conversions += data.count || 1;
      analytics.revenue += data.revenue || 0;
      break;
    case 'bounced':
      analytics.bounced += data.count || 1;
      break;
    case 'unsubscribed':
      analytics.unsubscribed += data.count || 1;
      break;
    case 'spam':
      analytics.spam += data.count || 1;
      break;
  }
  
  // Recalculate rates
  if (analytics.sent > 0) {
    analytics.openRate = analytics.opened / analytics.sent;
    analytics.clickRate = analytics.clicked / analytics.sent;
    analytics.conversionRate = analytics.conversions / analytics.sent;
    analytics.bounceRate = analytics.bounced / analytics.sent;
    analytics.unsubscribeRate = analytics.unsubscribed / analytics.sent;
    analytics.spamRate = analytics.spam / analytics.sent;
  }
  
  if (analytics.conversions > 0) {
    analytics.avgOrderValue = analytics.revenue / analytics.conversions;
  }
  
  const campaignCost = analytics.sent * 0.05; // Assume $0.05 per email
  if (campaignCost > 0) {
    analytics.roas = analytics.revenue / campaignCost;
  }
  
  analytics.lastUpdated = new Date().toISOString();
  
  return analytics;
}

//=============================================================================
// ENGAGEMENT ANALYTICS
//=============================================================================

function getEngagementOverview(filters = {}) {
  const overview = getAnalyticsOverview(filters);
  
  return {
    avgOpenRate: overview.avgOpenRate,
    avgClickRate: overview.avgClickRate,
    avgConversionRate: overview.avgConversionRate,
    avgUnsubscribeRate: overview.avgUnsubscribeRate,
    avgBounceRate: overview.avgBounceRate,
    totalOpens: overview.totalOpened,
    totalClicks: overview.totalClicked,
    totalConversions: overview.totalConversions,
    totalUnsubscribes: overview.totalSent * overview.avgUnsubscribeRate,
    engagementScore: calculateEngagementScore(overview),
    timeframe: filters.timeframe || '30d'
  };
}

function calculateEngagementScore(overview) {
  // Weighted engagement score (0-100)
  const openWeight = 0.3;
  const clickWeight = 0.4;
  const conversionWeight = 0.3;
  
  const score = (
    (overview.avgOpenRate * 100 * openWeight) +
    (overview.avgClickRate * 100 * clickWeight) +
    (overview.avgConversionRate * 100 * conversionWeight)
  );
  
  return Math.min(100, Math.max(0, score));
}

function getEngagementTrends(campaignId, timeframe = '30d') {
  const analytics = campaignAnalytics.get(campaignId);
  if (!analytics) return null;
  
  return {
    campaignId,
    timeSeriesData: analytics.timeSeriesData,
    trends: {
      opens: calculateTrend(analytics.timeSeriesData, 'opens'),
      clicks: calculateTrend(analytics.timeSeriesData, 'clicks'),
      conversions: calculateTrend(analytics.timeSeriesData, 'conversions')
    },
    timeframe
  };
}

function calculateTrend(timeSeriesData, metric) {
  if (timeSeriesData.length < 2) return 0;
  
  const firstHalf = timeSeriesData.slice(0, Math.floor(timeSeriesData.length / 2));
  const secondHalf = timeSeriesData.slice(Math.floor(timeSeriesData.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, d) => sum + d[metric], 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d[metric], 0) / secondHalf.length;
  
  if (firstAvg === 0) return 0;
  
  return ((secondAvg - firstAvg) / firstAvg) * 100; // Percentage change
}

//=============================================================================
// REVENUE ANALYTICS
//=============================================================================

function getRevenueOverview(filters = {}) {
  const overview = getAnalyticsOverview(filters);
  
  const avgOrderValue = overview.totalConversions > 0 
    ? overview.totalRevenue / overview.totalConversions 
    : 0;
  
  return {
    totalRevenue: overview.totalRevenue,
    totalConversions: overview.totalConversions,
    avgOrderValue,
    roas: overview.roas,
    revenuePerEmail: overview.totalSent > 0 ? overview.totalRevenue / overview.totalSent : 0,
    campaignCost: overview.totalSent * 0.05,
    profit: overview.totalRevenue - (overview.totalSent * 0.05),
    timeframe: filters.timeframe || '30d'
  };
}

function getRevenueBySegment(filters = {}) {
  // Simulated segment revenue breakdown
  return {
    segments: [
      { segmentId: 'seg-001', name: 'High Value Customers', revenue: 8500, conversions: 45, avgOrderValue: 189 },
      { segmentId: 'seg-002', name: 'Recent Purchasers', revenue: 2100, conversions: 28, avgOrderValue: 75 },
      { segmentId: 'seg-003', name: 'Engaged Users', revenue: 1850, conversions: 37, avgOrderValue: 50 }
    ],
    totalRevenue: 12450,
    timeframe: filters.timeframe || '30d'
  };
}

function getRevenueByProduct(filters = {}) {
  // Simulated product revenue breakdown
  return {
    products: [
      { productId: 'prod-001', name: 'Premium Package', revenue: 6800, conversions: 34, avgOrderValue: 200 },
      { productId: 'prod-002', name: 'Standard Package', revenue: 3900, conversions: 52, avgOrderValue: 75 },
      { productId: 'prod-003', name: 'Starter Package', revenue: 1750, conversions: 70, avgOrderValue: 25 }
    ],
    totalRevenue: 12450,
    timeframe: filters.timeframe || '30d'
  };
}

//=============================================================================
// REPORTING
//=============================================================================

function listReports(filters = {}) {
  const allReports = Array.from(reports.values());
  
  let filtered = allReports;
  if (filters.type) {
    filtered = filtered.filter(r => r.type === filters.type);
  }
  
  // Sort by creation date
  filtered.sort((a, b) => new Date(b.created) - new Date(a.created));
  
  return {
    reports: filtered,
    total: filtered.length
  };
}

function createReport(config) {
  const report = {
    id: uuidv4(),
    name: config.name || 'Untitled Report',
    type: config.type || 'custom', // custom, campaign, engagement, revenue
    filters: config.filters || {},
    schedule: config.schedule || null, // null, daily, weekly, monthly
    recipients: config.recipients || [],
    format: config.format || 'pdf', // pdf, csv, excel
    status: 'draft',
    lastGenerated: null,
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  };
  
  reports.set(report.id, report);
  return report;
}

function getReport(reportId) {
  return reports.get(reportId) || null;
}

function updateReport(reportId, updates) {
  const report = reports.get(reportId);
  if (!report) return null;
  
  Object.assign(report, updates, { updated: new Date().toISOString() });
  return report;
}

function deleteReport(reportId) {
  return reports.delete(reportId);
}

function generateReport(reportId) {
  const report = reports.get(reportId);
  if (!report) return null;
  
  let data = {};
  
  switch (report.type) {
    case 'campaign':
      data = getAnalyticsOverview(report.filters);
      break;
    case 'engagement':
      data = getEngagementOverview(report.filters);
      break;
    case 'revenue':
      data = getRevenueOverview(report.filters);
      break;
    case 'custom':
      data = {
        overview: getAnalyticsOverview(report.filters),
        engagement: getEngagementOverview(report.filters),
        revenue: getRevenueOverview(report.filters)
      };
      break;
  }
  
  report.lastGenerated = new Date().toISOString();
  report.status = 'generated';
  
  return {
    reportId: report.id,
    name: report.name,
    type: report.type,
    data,
    generatedAt: report.lastGenerated,
    format: report.format
  };
}

function scheduleReport(reportId, schedule) {
  const report = reports.get(reportId);
  if (!report) return null;
  
  report.schedule = schedule;
  report.updated = new Date().toISOString();
  
  return report;
}

//=============================================================================
// DEVICE & LOCATION ANALYTICS
//=============================================================================

function getDeviceBreakdown(campaignId) {
  const analytics = campaignAnalytics.get(campaignId);
  if (!analytics) return null;
  
  return {
    campaignId,
    devices: analytics.deviceBreakdown,
    total: analytics.opened
  };
}

function getLocationBreakdown(campaignId) {
  const analytics = campaignAnalytics.get(campaignId);
  if (!analytics) return null;
  
  return {
    campaignId,
    locations: analytics.locationBreakdown,
    total: analytics.opened
  };
}

//=============================================================================
// COMPARATIVE ANALYTICS
//=============================================================================

function compareCampaigns(campaignIds) {
  const comparisons = campaignIds.map(id => {
    const analytics = campaignAnalytics.get(id);
    if (!analytics) return null;
    
    return {
      campaignId: id,
      sent: analytics.sent,
      openRate: analytics.openRate,
      clickRate: analytics.clickRate,
      conversionRate: analytics.conversionRate,
      revenue: analytics.revenue,
      roas: analytics.roas
    };
  }).filter(Boolean);
  
  return {
    campaigns: comparisons,
    count: comparisons.length
  };
}

function getBenchmarks() {
  // Industry benchmarks
  return {
    industry: 'E-commerce',
    benchmarks: {
      openRate: 0.18,
      clickRate: 0.025,
      conversionRate: 0.008,
      bounceRate: 0.015,
      unsubscribeRate: 0.002
    },
    source: 'Industry Average 2024'
  };
}

//=============================================================================
// EXPORTS
//=============================================================================

// Initialize demo data
initializeDemoData();

module.exports = {
  // Overview
  getAnalyticsOverview,
  getCampaignAnalytics,
  trackCampaignEvent,
  
  // Engagement
  getEngagementOverview,
  getEngagementTrends,
  
  // Revenue
  getRevenueOverview,
  getRevenueBySegment,
  getRevenueByProduct,
  
  // Reporting
  listReports,
  createReport,
  getReport,
  updateReport,
  deleteReport,
  generateReport,
  scheduleReport,
  
  // Device & Location
  getDeviceBreakdown,
  getLocationBreakdown,
  
  // Comparative
  compareCampaigns,
  getBenchmarks
};
