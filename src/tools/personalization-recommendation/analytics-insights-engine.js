/**
 * ANALYTICS & INSIGHTS ENGINE
 * Measure personalization performance and generate insights
 */

// Storage
const personalizationEvents = new Map();
const performanceMetrics = new Map();
const insights = new Map();
const segments = new Map();
const cohorts = new Map();

// Generate unique ID
function generateId(prefix = 'anlyt') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Track personalization event
 */
function trackPersonalizationEvent({ userId, eventType, context = {}, outcome = null }) {
  const eventId = generateId('evt');
  
  const event = {
    id: eventId,
    userId,
    eventType, // recommendation_shown, content_personalized, search_personalized, email_personalized
    context,
    outcome, // clicked, converted, ignored
    value: context.value || 0,
    timestamp: new Date().toISOString()
  };
  
  personalizationEvents.set(eventId, event);
  
  // Update performance metrics
  updatePerformanceMetrics(event);
  
  return event;
}

/**
 * Update performance metrics
 */
function updatePerformanceMetrics(event) {
  const metricKey = `${event.eventType}:${new Date(event.timestamp).toISOString().split('T')[0]}`;
  
  if (!performanceMetrics.has(metricKey)) {
    performanceMetrics.set(metricKey, {
      eventType: event.eventType,
      date: new Date(event.timestamp).toISOString().split('T')[0],
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      ctr: 0,
      cvr: 0,
      rpc: 0 // Revenue per click
    });
  }
  
  const metrics = performanceMetrics.get(metricKey);
  
  metrics.impressions++;
  
  if (event.outcome === 'clicked') {
    metrics.clicks++;
  } else if (event.outcome === 'converted') {
    metrics.conversions++;
    metrics.revenue += event.value;
  }
  
  // Calculate rates
  if (metrics.impressions > 0) {
    metrics.ctr = (metrics.clicks / metrics.impressions) * 100;
    metrics.cvr = (metrics.conversions / metrics.impressions) * 100;
  }
  
  if (metrics.clicks > 0) {
    metrics.rpc = metrics.revenue / metrics.clicks;
  }
}

/**
 * Get personalization performance
 */
function getPersonalizationPerformance(options = {}) {
  const { eventType = null, dateRange = null } = options;
  
  let metrics = Array.from(performanceMetrics.values());
  
  // Filter by event type
  if (eventType) {
    metrics = metrics.filter(m => m.eventType === eventType);
  }
  
  // Filter by date range
  if (dateRange) {
    metrics = metrics.filter(m => {
      const date = new Date(m.date);
      return (!dateRange.start || date >= new Date(dateRange.start)) &&
             (!dateRange.end || date <= new Date(dateRange.end));
    });
  }
  
  // Aggregate metrics
  const totals = {
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0
  };
  
  metrics.forEach(m => {
    totals.impressions += m.impressions;
    totals.clicks += m.clicks;
    totals.conversions += m.conversions;
    totals.revenue += m.revenue;
  });
  
  return {
    totals,
    avgCTR: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
    avgCVR: totals.impressions > 0 ? (totals.conversions / totals.impressions) * 100 : 0,
    totalRevenue: Math.round(totals.revenue * 100) / 100,
    rpc: totals.clicks > 0 ? totals.revenue / totals.clicks : 0,
    dailyMetrics: metrics.sort((a, b) => new Date(a.date) - new Date(b.date))
  };
}

/**
 * Analyze recommendation impact
 */
function analyzeRecommendationImpact(options = {}) {
  const { timeWindow = 30 } = options;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeWindow);
  
  const recEvents = Array.from(personalizationEvents.values())
    .filter(e => e.eventType === 'recommendation_shown' && new Date(e.timestamp) > cutoffDate);
  
  const totalShown = recEvents.length;
  const totalClicked = recEvents.filter(e => e.outcome === 'clicked').length;
  const totalConverted = recEvents.filter(e => e.outcome === 'converted').length;
  const totalRevenue = recEvents
    .filter(e => e.outcome === 'converted')
    .reduce((sum, e) => sum + e.value, 0);
  
  // Analyze by algorithm
  const byAlgorithm = {};
  recEvents.forEach(e => {
    const algo = e.context.algorithm || 'unknown';
    if (!byAlgorithm[algo]) {
      byAlgorithm[algo] = {
        shown: 0,
        clicked: 0,
        converted: 0,
        revenue: 0
      };
    }
    
    byAlgorithm[algo].shown++;
    if (e.outcome === 'clicked') byAlgorithm[algo].clicked++;
    if (e.outcome === 'converted') {
      byAlgorithm[algo].converted++;
      byAlgorithm[algo].revenue += e.value;
    }
  });
  
  // Calculate performance by algorithm
  Object.keys(byAlgorithm).forEach(algo => {
    const data = byAlgorithm[algo];
    data.ctr = data.shown > 0 ? (data.clicked / data.shown) * 100 : 0;
    data.cvr = data.shown > 0 ? (data.converted / data.shown) * 100 : 0;
    data.rpc = data.clicked > 0 ? data.revenue / data.clicked : 0;
  });
  
  return {
    overall: {
      totalShown,
      totalClicked,
      totalConverted,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      ctr: totalShown > 0 ? (totalClicked / totalShown) * 100 : 0,
      cvr: totalShown > 0 ? (totalConverted / totalShown) * 100 : 0
    },
    byAlgorithm
  };
}

/**
 * Generate personalization insights
 */
function generateInsights(options = {}) {
  const { minConfidence = 0.7 } = options;
  
  const generatedInsights = [];
  
  // Insight: Best performing recommendation algorithm
  const recImpact = analyzeRecommendationImpact({ timeWindow: 30 });
  if (Object.keys(recImpact.byAlgorithm).length > 0) {
    const bestAlgo = Object.entries(recImpact.byAlgorithm)
      .sort((a, b) => b[1].cvr - a[1].cvr)[0];
    
    if (bestAlgo && bestAlgo[1].shown > 50) {
      generatedInsights.push({
        id: generateId('insight'),
        type: 'algorithm_performance',
        title: `${bestAlgo[0]} algorithm performing best`,
        description: `The ${bestAlgo[0]} recommendation algorithm has a ${Math.round(bestAlgo[1].cvr * 10) / 10}% conversion rate, outperforming other algorithms.`,
        confidence: Math.min(bestAlgo[1].shown / 1000, 1.0),
        impact: 'high',
        recommendation: `Increase traffic to ${bestAlgo[0]} algorithm`,
        metrics: bestAlgo[1],
        createdAt: new Date().toISOString()
      });
    }
  }
  
  // Insight: Personalization uplift
  const perf = getPersonalizationPerformance({ dateRange: { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
  if (perf.totals.impressions > 1000) {
    const uplift = perf.avgCVR - 2.5; // Assuming 2.5% baseline
    if (Math.abs(uplift) > 0.5) {
      generatedInsights.push({
        id: generateId('insight'),
        type: 'overall_impact',
        title: uplift > 0 ? 'Personalization driving conversions' : 'Personalization underperforming',
        description: `Personalization is ${uplift > 0 ? 'increasing' : 'decreasing'} conversion rate by ${Math.abs(Math.round(uplift * 10) / 10)}% vs baseline.`,
        confidence: 0.85,
        impact: Math.abs(uplift) > 2 ? 'high' : 'medium',
        recommendation: uplift > 0 
          ? 'Expand personalization to more touchpoints'
          : 'Review personalization strategy and algorithms',
        metrics: perf,
        createdAt: new Date().toISOString()
      });
    }
  }
  
  // Insight: Segment performance
  const segmentPerf = analyzeSegmentPerformance();
  if (segmentPerf.length > 0) {
    const topSegment = segmentPerf[0];
    const bottomSegment = segmentPerf[segmentPerf.length - 1];
    
    if (topSegment.conversions > 20 && bottomSegment.conversions > 20) {
      const performanceGap = topSegment.cvr - bottomSegment.cvr;
      
      if (performanceGap > 5) {
        generatedInsights.push({
          id: generateId('insight'),
          type: 'segment_gap',
          title: 'Large performance gap between segments',
          description: `${topSegment.segment} converts at ${Math.round(topSegment.cvr * 10) / 10}% vs ${bottomSegment.segment} at ${Math.round(bottomSegment.cvr * 10) / 10}%.`,
          confidence: 0.8,
          impact: 'high',
          recommendation: `Create targeted campaigns for ${bottomSegment.segment}`,
          metrics: { topSegment, bottomSegment },
          createdAt: new Date().toISOString()
        });
      }
    }
  }
  
  // Filter by confidence
  const filteredInsights = generatedInsights.filter(i => i.confidence >= minConfidence);
  
  // Store insights
  filteredInsights.forEach(insight => {
    insights.set(insight.id, insight);
  });
  
  return filteredInsights;
}

/**
 * Analyze segment performance
 */
function analyzeSegmentPerformance() {
  const segmentMetrics = {};
  
  personalizationEvents.forEach(event => {
    const segment = event.context.userSegment || 'unknown';
    
    if (!segmentMetrics[segment]) {
      segmentMetrics[segment] = {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0
      };
    }
    
    segmentMetrics[segment].impressions++;
    if (event.outcome === 'clicked') segmentMetrics[segment].clicks++;
    if (event.outcome === 'converted') {
      segmentMetrics[segment].conversions++;
      segmentMetrics[segment].revenue += event.value;
    }
  });
  
  return Object.entries(segmentMetrics)
    .map(([segment, metrics]) => ({
      segment,
      ...metrics,
      ctr: metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0,
      cvr: metrics.impressions > 0 ? (metrics.conversions / metrics.impressions) * 100 : 0
    }))
    .sort((a, b) => b.cvr - a.cvr);
}

/**
 * Calculate personalization ROI
 */
function calculatePersonalizationROI(options = {}) {
  const { timeWindow = 30, implementationCost = 0, monthlyCost = 0 } = options;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeWindow);
  
  const events = Array.from(personalizationEvents.values())
    .filter(e => new Date(e.timestamp) > cutoffDate && e.outcome === 'converted');
  
  const totalRevenue = events.reduce((sum, e) => sum + e.value, 0);
  
  // Estimate incremental revenue (assuming 20% of revenue is incremental)
  const incrementalRevenue = totalRevenue * 0.2;
  
  // Calculate costs
  const monthlyPeriods = timeWindow / 30;
  const totalCost = implementationCost + (monthlyCost * monthlyPeriods);
  
  const roi = totalCost > 0 ? ((incrementalRevenue - totalCost) / totalCost) * 100 : 0;
  
  return {
    timeWindow,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    incrementalRevenue: Math.round(incrementalRevenue * 100) / 100,
    implementationCost,
    monthlyCost,
    totalCost,
    roi: Math.round(roi * 100) / 100,
    paybackPeriod: incrementalRevenue > 0 
      ? Math.ceil((totalCost / incrementalRevenue) * timeWindow) 
      : null
  };
}

/**
 * Create cohort analysis
 */
function createCohortAnalysis({ cohortDefinition, metric = 'conversion_rate', periods = 12 }) {
  const cohortId = generateId('cohort');
  
  // Group users into cohorts by join date
  const cohortData = new Map();
  
  personalizationEvents.forEach(event => {
    const period = new Date(event.timestamp).toISOString().substring(0, 7); // YYYY-MM
    
    if (!cohortData.has(period)) {
      cohortData.set(period, {
        users: new Set(),
        events: []
      });
    }
    
    cohortData.get(period).users.add(event.userId);
    cohortData.get(period).events.push(event);
  });
  
  // Calculate retention/metric for each cohort over time
  const cohortAnalysis = {
    id: cohortId,
    metric,
    periods: []
  };
  
  cohortData.forEach((data, period) => {
    const periodAnalysis = {
      period,
      cohortSize: data.users.size,
      retention: []
    };
    
    for (let i = 0; i < periods; i++) {
      // Calculate metric for this period offset
      // Simplified - would need actual user tracking over time
      periodAnalysis.retention.push({
        period: i,
        value: data.users.size * (1 - i * 0.1), // Mock decay
        rate: 100 - i * 10
      });
    }
    
    cohortAnalysis.periods.push(periodAnalysis);
  });
  
  cohorts.set(cohortId, cohortAnalysis);
  
  return cohortAnalysis;
}

/**
 * Get analytics dashboard data
 */
function getAnalyticsDashboard(options = {}) {
  const { timeWindow = 7 } = options;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeWindow);
  
  const events = Array.from(personalizationEvents.values())
    .filter(e => new Date(e.timestamp) > cutoffDate);
  
  // Overall metrics
  const totalEvents = events.length;
  const clickedEvents = events.filter(e => e.outcome === 'clicked').length;
  const convertedEvents = events.filter(e => e.outcome === 'converted').length;
  const totalRevenue = events
    .filter(e => e.outcome === 'converted')
    .reduce((sum, e) => sum + e.value, 0);
  
  // By event type
  const byEventType = {};
  events.forEach(e => {
    if (!byEventType[e.eventType]) {
      byEventType[e.eventType] = { count: 0, conversions: 0, revenue: 0 };
    }
    byEventType[e.eventType].count++;
    if (e.outcome === 'converted') {
      byEventType[e.eventType].conversions++;
      byEventType[e.eventType].revenue += e.value;
    }
  });
  
  // Trending
  const dailyTrend = {};
  events.forEach(e => {
    const date = new Date(e.timestamp).toISOString().split('T')[0];
    if (!dailyTrend[date]) {
      dailyTrend[date] = { impressions: 0, clicks: 0, conversions: 0, revenue: 0 };
    }
    dailyTrend[date].impressions++;
    if (e.outcome === 'clicked') dailyTrend[date].clicks++;
    if (e.outcome === 'converted') {
      dailyTrend[date].conversions++;
      dailyTrend[date].revenue += e.value;
    }
  });
  
  return {
    overview: {
      totalEvents,
      clickedEvents,
      convertedEvents,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      overallCTR: totalEvents > 0 ? (clickedEvents / totalEvents) * 100 : 0,
      overallCVR: totalEvents > 0 ? (convertedEvents / totalEvents) * 100 : 0
    },
    byEventType,
    dailyTrend: Object.entries(dailyTrend)
      .map(([date, metrics]) => ({ date, ...metrics }))
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    recentInsights: Array.from(insights.values())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
  };
}

/**
 * Export analytics data
 */
function exportAnalytics(options = {}) {
  const { format = 'json', dateRange = null } = options;
  
  let events = Array.from(personalizationEvents.values());
  
  if (dateRange) {
    events = events.filter(e => {
      const date = new Date(e.timestamp);
      return (!dateRange.start || date >= new Date(dateRange.start)) &&
             (!dateRange.end || date <= new Date(dateRange.end));
    });
  }
  
  if (format === 'json') {
    return {
      events,
      metrics: Array.from(performanceMetrics.values()),
      insights: Array.from(insights.values()),
      exportedAt: new Date().toISOString()
    };
  } else if (format === 'csv') {
    // Convert to CSV format
    const headers = ['timestamp', 'userId', 'eventType', 'outcome', 'value'];
    const rows = events.map(e => [
      e.timestamp,
      e.userId,
      e.eventType,
      e.outcome || 'none',
      e.value
    ]);
    
    return {
      headers,
      rows,
      exportedAt: new Date().toISOString()
    };
  }
  
  return null;
}

module.exports = {
  trackPersonalizationEvent,
  getPersonalizationPerformance,
  analyzeRecommendationImpact,
  generateInsights,
  analyzeSegmentPerformance,
  calculatePersonalizationROI,
  createCohortAnalysis,
  getAnalyticsDashboard,
  exportAnalytics
};
