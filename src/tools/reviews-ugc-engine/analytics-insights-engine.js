/**
 * Analytics & Insights Engine
 * Handles review analytics, trends, reporting, and performance metrics
 */

// In-memory storage
const analyticsEvents = [];
const reports = new Map();
const dashboards = new Map();
const alerts = new Map();

let reportIdCounter = 1;
let dashboardIdCounter = 1;
let alertIdCounter = 1;

/**
 * Track analytics event
 */
function trackEvent(eventData) {
  const event = {
    id: `event_${analyticsEvents.length + 1}`,
    type: eventData.type, // review_created, review_moderated, widget_view, etc.
    entity: eventData.entity, // review, widget, campaign, etc.
    entityId: eventData.entityId,
    userId: eventData.userId || null,
    productId: eventData.productId || null,
    metadata: eventData.metadata || {},
    timestamp: new Date().toISOString(),
  };

  analyticsEvents.push(event);
  return event;
}

/**
 * Get review metrics
 */
function getReviewMetrics(options = {}) {
  const {
    productId = null,
    startDate = null,
    endDate = null,
  } = options;

  let events = [...analyticsEvents];

  // Filter by date range
  if (startDate || endDate) {
    events = events.filter(e => {
      const eventDate = new Date(e.timestamp);
      if (startDate && eventDate < new Date(startDate)) return false;
      if (endDate && eventDate > new Date(endDate)) return false;
      return true;
    });
  }

  // Filter by product
  if (productId) {
    events = events.filter(e => e.productId === productId);
  }

  // Calculate metrics
  const reviewCreated = events.filter(e => e.type === 'review_created').length;
  const reviewApproved = events.filter(e => e.type === 'review_approved').length;
  const reviewRejected = events.filter(e => e.type === 'review_rejected').length;
  const reviewFlagged = events.filter(e => e.type === 'review_flagged').length;

  const approvalRate = reviewCreated > 0
    ? ((reviewApproved / reviewCreated) * 100).toFixed(2)
    : 0;

  const moderationTime = calculateAverageModerationTime(events);

  return {
    totalReviews: reviewCreated,
    approved: reviewApproved,
    rejected: reviewRejected,
    flagged: reviewFlagged,
    approvalRate: parseFloat(approvalRate),
    avgModerationTime: moderationTime,
  };
}

/**
 * Calculate average moderation time
 */
function calculateAverageModerationTime(events) {
  const createdEvents = events.filter(e => e.type === 'review_created');
  const moderatedEvents = events.filter(e =>
    e.type === 'review_approved' || e.type === 'review_rejected'
  );

  if (createdEvents.length === 0 || moderatedEvents.length === 0) {
    return 0;
  }

  // Simplified calculation
  return 24; // hours (mock value)
}

/**
 * Get collection performance
 */
function getCollectionPerformance(options = {}) {
  const {
    campaignId = null,
    startDate = null,
    endDate = null,
  } = options;

  let events = [...analyticsEvents].filter(e =>
    e.type === 'request_sent' ||
    e.type === 'request_opened' ||
    e.type === 'request_clicked' ||
    e.type === 'review_submitted'
  );

  // Filter by date range
  if (startDate || endDate) {
    events = events.filter(e => {
      const eventDate = new Date(e.timestamp);
      if (startDate && eventDate < new Date(startDate)) return false;
      if (endDate && eventDate > new Date(endDate)) return false;
      return true;
    });
  }

  // Filter by campaign
  if (campaignId) {
    events = events.filter(e => e.metadata?.campaignId === campaignId);
  }

  const requestsSent = events.filter(e => e.type === 'request_sent').length;
  const requestsOpened = events.filter(e => e.type === 'request_opened').length;
  const requestsClicked = events.filter(e => e.type === 'request_clicked').length;
  const reviewsSubmitted = events.filter(e => e.type === 'review_submitted').length;

  const openRate = requestsSent > 0
    ? ((requestsOpened / requestsSent) * 100).toFixed(2)
    : 0;
  const clickRate = requestsOpened > 0
    ? ((requestsClicked / requestsOpened) * 100).toFixed(2)
    : 0;
  const conversionRate = requestsSent > 0
    ? ((reviewsSubmitted / requestsSent) * 100).toFixed(2)
    : 0;

  return {
    requestsSent,
    requestsOpened,
    requestsClicked,
    reviewsSubmitted,
    openRate: parseFloat(openRate),
    clickRate: parseFloat(clickRate),
    conversionRate: parseFloat(conversionRate),
  };
}

/**
 * Get widget performance
 */
function getWidgetPerformance(widgetId = null) {
  let events = [...analyticsEvents].filter(e =>
    e.type === 'widget_view' ||
    e.type === 'widget_interaction' ||
    e.type === 'widget_conversion'
  );

  if (widgetId) {
    events = events.filter(e => e.entityId === widgetId);
  }

  const views = events.filter(e => e.type === 'widget_view').length;
  const interactions = events.filter(e => e.type === 'widget_interaction').length;
  const conversions = events.filter(e => e.type === 'widget_conversion').length;

  const interactionRate = views > 0
    ? ((interactions / views) * 100).toFixed(2)
    : 0;
  const conversionRate = views > 0
    ? ((conversions / views) * 100).toFixed(2)
    : 0;

  return {
    views,
    interactions,
    conversions,
    interactionRate: parseFloat(interactionRate),
    conversionRate: parseFloat(conversionRate),
  };
}

/**
 * Get sentiment trends
 */
function getSentimentTrends(productId, timeframe = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeframe);

  const sentimentEvents = analyticsEvents.filter(e =>
    e.type === 'sentiment_analyzed' &&
    e.productId === productId &&
    new Date(e.timestamp) >= cutoffDate
  );

  // Group by day
  const trendsByDay = {};
  sentimentEvents.forEach(event => {
    const day = event.timestamp.split('T')[0];
    if (!trendsByDay[day]) {
      trendsByDay[day] = {
        positive: 0,
        negative: 0,
        neutral: 0,
        mixed: 0,
        total: 0,
      };
    }

    const sentiment = event.metadata?.sentiment || 'neutral';
    trendsByDay[day][sentiment] = (trendsByDay[day][sentiment] || 0) + 1;
    trendsByDay[day].total += 1;
  });

  // Convert to array and calculate percentages
  const trends = Object.entries(trendsByDay).map(([date, counts]) => ({
    date,
    positive: Math.round((counts.positive / counts.total) * 100),
    negative: Math.round((counts.negative / counts.total) * 100),
    neutral: Math.round((counts.neutral / counts.total) * 100),
    mixed: Math.round((counts.mixed / counts.total) * 100),
    total: counts.total,
  }));

  trends.sort((a, b) => new Date(a.date) - new Date(b.date));

  return {
    productId,
    timeframe,
    trends,
  };
}

/**
 * Get rating distribution
 */
function getRatingDistribution(productId = null) {
  let events = [...analyticsEvents].filter(e => e.type === 'review_created');

  if (productId) {
    events = events.filter(e => e.productId === productId);
  }

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  events.forEach(event => {
    const rating = event.metadata?.rating;
    if (rating && rating >= 1 && rating <= 5) {
      distribution[rating] += 1;
    }
  });

  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);

  const percentages = {};
  for (const [rating, count] of Object.entries(distribution)) {
    percentages[rating] = total > 0
      ? Math.round((count / total) * 100)
      : 0;
  }

  return {
    counts: distribution,
    percentages,
    total,
  };
}

/**
 * Get top reviewers
 */
function getTopReviewers(limit = 10) {
  const reviewerStats = {};

  analyticsEvents
    .filter(e => e.type === 'review_created' && e.userId)
    .forEach(event => {
      const userId = event.userId;
      if (!reviewerStats[userId]) {
        reviewerStats[userId] = {
          userId,
          reviewCount: 0,
          totalHelpfulVotes: 0,
          avgRating: 0,
          totalRating: 0,
        };
      }

      reviewerStats[userId].reviewCount += 1;
      reviewerStats[userId].totalHelpfulVotes += event.metadata?.helpfulVotes || 0;
      reviewerStats[userId].totalRating += event.metadata?.rating || 0;
    });

  // Calculate average rating
  Object.values(reviewerStats).forEach(stats => {
    stats.avgRating = stats.reviewCount > 0
      ? (stats.totalRating / stats.reviewCount).toFixed(1)
      : 0;
  });

  // Sort by review count
  const topReviewers = Object.values(reviewerStats)
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, limit);

  return topReviewers;
}

/**
 * Get product comparison
 */
function getProductComparison(productIds) {
  const comparison = {};

  productIds.forEach(productId => {
    const metrics = getReviewMetrics({ productId });
    const distribution = getRatingDistribution(productId);

    comparison[productId] = {
      productId,
      totalReviews: metrics.totalReviews,
      approvalRate: metrics.approvalRate,
      ratingDistribution: distribution.percentages,
      avgRating: calculateAvgRating(distribution.counts),
    };
  });

  return comparison;
}

/**
 * Calculate average rating from distribution
 */
function calculateAvgRating(distribution) {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  if (total === 0) return 0;

  const weightedSum = Object.entries(distribution).reduce(
    (sum, [rating, count]) => sum + (parseInt(rating) * count),
    0
  );

  return (weightedSum / total).toFixed(1);
}

/**
 * Create analytics report
 */
function createReport(reportData) {
  const report = {
    id: `report_${reportIdCounter++}`,
    name: reportData.name,
    type: reportData.type, // reviews, collection, widgets, sentiment
    filters: reportData.filters || {},
    schedule: reportData.schedule || null, // daily, weekly, monthly
    format: reportData.format || 'json', // json, csv, pdf
    recipients: reportData.recipients || [],
    status: 'active',
    lastRunAt: null,
    nextRunAt: reportData.nextRunAt || null,
    createdAt: new Date().toISOString(),
  };

  reports.set(report.id, report);
  return report;
}

/**
 * Run report
 */
function runReport(reportId) {
  const report = reports.get(reportId);
  if (!report) {
    throw new Error('Report not found');
  }

  let data = {};

  switch (report.type) {
    case 'reviews':
      data = getReviewMetrics(report.filters);
      break;
    case 'collection':
      data = getCollectionPerformance(report.filters);
      break;
    case 'widgets':
      data = getWidgetPerformance(report.filters.widgetId);
      break;
    case 'sentiment':
      data = getSentimentTrends(report.filters.productId, report.filters.timeframe);
      break;
  }

  report.lastRunAt = new Date().toISOString();

  return {
    reportId,
    reportName: report.name,
    type: report.type,
    runAt: report.lastRunAt,
    data,
  };
}

/**
 * List reports
 */
function listReports() {
  return Array.from(reports.values());
}

/**
 * Create analytics dashboard
 */
function createDashboard(dashboardData) {
  const dashboard = {
    id: `dashboard_${dashboardIdCounter++}`,
    name: dashboardData.name,
    widgets: dashboardData.widgets || [], // Array of metric widgets
    layout: dashboardData.layout || 'grid', // grid, list
    refreshInterval: dashboardData.refreshInterval || 300, // seconds
    filters: dashboardData.filters || {},
    isDefault: dashboardData.isDefault || false,
    createdAt: new Date().toISOString(),
  };

  dashboards.set(dashboard.id, dashboard);
  return dashboard;
}

/**
 * Get dashboard data
 */
function getDashboardData(dashboardId) {
  const dashboard = dashboards.get(dashboardId);
  if (!dashboard) {
    throw new Error('Dashboard not found');
  }

  const data = {
    dashboardId,
    dashboardName: dashboard.name,
    refreshedAt: new Date().toISOString(),
    metrics: {},
  };

  // Gather metrics for each widget
  dashboard.widgets.forEach(widget => {
    switch (widget.type) {
      case 'review_metrics':
        data.metrics.reviews = getReviewMetrics(dashboard.filters);
        break;
      case 'collection_performance':
        data.metrics.collection = getCollectionPerformance(dashboard.filters);
        break;
      case 'widget_performance':
        data.metrics.widgets = getWidgetPerformance();
        break;
      case 'rating_distribution':
        data.metrics.distribution = getRatingDistribution(dashboard.filters.productId);
        break;
      case 'top_reviewers':
        data.metrics.topReviewers = getTopReviewers(10);
        break;
    }
  });

  return data;
}

/**
 * Create analytics alert
 */
function createAlert(alertData) {
  const alert = {
    id: `alert_${alertIdCounter++}`,
    name: alertData.name,
    type: alertData.type, // threshold, anomaly, trend
    metric: alertData.metric, // review_count, rating, sentiment, etc.
    conditions: alertData.conditions, // threshold, comparison
    recipients: alertData.recipients || [],
    channels: alertData.channels || ['email'], // email, sms, slack
    enabled: alertData.enabled !== false,
    lastTriggeredAt: null,
    createdAt: new Date().toISOString(),
  };

  alerts.set(alert.id, alert);
  return alert;
}

/**
 * Check alerts
 */
function checkAlerts(currentMetrics) {
  const triggeredAlerts = [];

  for (const alert of alerts.values()) {
    if (!alert.enabled) continue;

    let triggered = false;

    switch (alert.type) {
      case 'threshold':
        const metricValue = currentMetrics[alert.metric];
        if (metricValue !== undefined) {
          if (alert.conditions.operator === 'greater_than' && metricValue > alert.conditions.value) {
            triggered = true;
          } else if (alert.conditions.operator === 'less_than' && metricValue < alert.conditions.value) {
            triggered = true;
          }
        }
        break;
    }

    if (triggered) {
      alert.lastTriggeredAt = new Date().toISOString();
      triggeredAlerts.push({
        alertId: alert.id,
        alertName: alert.name,
        metric: alert.metric,
        triggeredAt: alert.lastTriggeredAt,
      });
    }
  }

  return triggeredAlerts;
}

/**
 * Get comprehensive analytics statistics
 */
function getAnalyticsStatistics() {
  const totalEvents = analyticsEvents.length;
  const reviewMetrics = getReviewMetrics();
  const collectionMetrics = getCollectionPerformance();
  const widgetMetrics = getWidgetPerformance();

  return {
    overview: {
      totalEvents,
      totalReviews: reviewMetrics.totalReviews,
      approvalRate: reviewMetrics.approvalRate,
    },
    reviews: reviewMetrics,
    collection: collectionMetrics,
    widgets: widgetMetrics,
    reports: {
      total: reports.size,
      active: Array.from(reports.values()).filter(r => r.status === 'active').length,
    },
    dashboards: dashboards.size,
    alerts: {
      total: alerts.size,
      active: Array.from(alerts.values()).filter(a => a.enabled).length,
    },
  };
}

module.exports = {
  trackEvent,
  getReviewMetrics,
  getCollectionPerformance,
  getWidgetPerformance,
  getSentimentTrends,
  getRatingDistribution,
  getTopReviewers,
  getProductComparison,
  createReport,
  runReport,
  listReports,
  createDashboard,
  getDashboardData,
  createAlert,
  checkAlerts,
  getAnalyticsStatistics,
};
