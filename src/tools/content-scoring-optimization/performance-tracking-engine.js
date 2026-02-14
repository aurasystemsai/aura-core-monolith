/**
 * Performance Tracking Engine
 * Monitor content performance metrics and track improvements
 */

// In-memory storage
const performanceRecords = new Map();
const abTests = new Map();
let recordIdCounter = 1;
let abTestIdCounter = 1;

/**
 * Track content performance
 */
function trackPerformance(data) {
  const {
    contentId,
    url,
    metrics = {},
    timestamp = new Date().toISOString()
  } = data;

  const record = {
    id: recordIdCounter++,
    contentId,
    url,
    timestamp,
    
    // Traffic metrics
    traffic: {
      pageviews: metrics.pageviews || 0,
      uniqueVisitors: metrics.uniqueVisitors || 0,
      sessions: metrics.sessions || 0,
      avgSessionDuration: metrics.avgSessionDuration || 0,
      bounceRate: metrics.bounceRate || 0,
      avgTimeOnPage: metrics.avgTimeOnPage || 0
    },
    
    // Engagement metrics
    engagement: {
      scrollDepth: metrics.scrollDepth || 0,
      clickThroughRate: metrics.clickThroughRate || 0,
      socialShares: metrics.socialShares || 0,
      comments: metrics.comments || 0,
      backlinks: metrics.backlinks || 0
    },
    
    // Conversion metrics
    conversions: {
      total: metrics.conversions || 0,
      conversionRate: metrics.conversionRate || 0,
      leads: metrics.leads || 0,
      sales: metrics.sales || 0,
      revenue: metrics.revenue || 0
    },
    
    // SEO metrics
    seo: {
      organicTraffic: metrics.organicTraffic || 0,
      ranking: metrics.ranking || null,
      impressions: metrics.impressions || 0,
      clicks: metrics.clicks || 0,
      ctr: metrics.ctr || 0,
      avgPosition: metrics.avgPosition || null
    },
    
    // Calculated scores
    performanceScore: 0,
    trendDirection: 'stable' // up, down, stable
  };

  // Calculate performance score
  record.performanceScore = calculatePerformanceScore(record);

  performanceRecords.set(record.id, record);
  return record;
}

/**
 * Get performance history for content
 */
function getPerformanceHistory(data) {
  const { contentId, startDate, endDate, limit = 30 } = data;

  const records = Array.from(performanceRecords.values())
    .filter(r => r.contentId === contentId);

  // Filter by date range if provided
  let filteredRecords = records;
  if (startDate) {
    filteredRecords = filteredRecords.filter(r => new Date(r.timestamp) >= new Date(startDate));
  }
  if (endDate) {
    filteredRecords = filteredRecords.filter(r => new Date(r.timestamp) <= new Date(endDate));
  }

  // Sort by timestamp descending
  filteredRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Limit results
  const limitedRecords = filteredRecords.slice(0, limit);

  // Calculate trends
  const trends = calculateTrends(limitedRecords);

  return {
    contentId,
    totalRecords: limitedRecords.length,
    dateRange: {
      start: limitedRecords[limitedRecords.length - 1]?.timestamp || null,
      end: limitedRecords[0]?.timestamp || null
    },
    records: limitedRecords,
    trends,
    summary: calculatePerformanceSummary(limitedRecords)
  };
}

/**
 * Compare performance between two periods
 */
function comparePerformance(data) {
  const {
    contentId,
    period1Start,
    period1End,
    period2Start,
    period2End
  } = data;

  const period1Records = Array.from(performanceRecords.values())
    .filter(r => r.contentId === contentId)
    .filter(r => {
      const date = new Date(r.timestamp);
      return date >= new Date(period1Start) && date <= new Date(period1End);
    });

  const period2Records = Array.from(performanceRecords.values())
    .filter(r => r.contentId === contentId)
    .filter(r => {
      const date = new Date(r.timestamp);
      return date >= new Date(period2Start) && date <= new Date(period2End);
    });

  const period1Summary = calculatePerformanceSummary(period1Records);
  const period2Summary = calculatePerformanceSummary(period2Records);

  return {
    contentId,
    period1: {
      dateRange: { start: period1Start, end: period1End },
      recordCount: period1Records.length,
      summary: period1Summary
    },
    period2: {
      dateRange: { start: period2Start, end: period2End },
      recordCount: period2Records.length,
      summary: period2Summary
    },
    changes: {
      pageviews: calculatePercentageChange(period1Summary.traffic.totalPageviews, period2Summary.traffic.totalPageviews),
      bounceRate: calculatePercentageChange(period1Summary.traffic.avgBounceRate, period2Summary.traffic.avgBounceRate),
      timeOnPage: calculatePercentageChange(period1Summary.traffic.avgTimeOnPage, period2Summary.traffic.avgTimeOnPage),
      conversionRate: calculatePercentageChange(period1Summary.conversions.avgConversionRate, period2Summary.conversions.avgConversionRate),
      organicTraffic: calculatePercentageChange(period1Summary.seo.totalOrganicTraffic, period2Summary.seo.totalOrganicTraffic)
    },
    insights: generateComparisonInsights(period1Summary, period2Summary)
  };
}

/**
 * Create A/B test
 */
function createABTest(data) {
  const {
    name,
    contentId,
    variantAId,
    variantBId,
    hypothesis,
    metric,
    duration = 14 // days
  } = data;

  const abTest = {
    id: abTestIdCounter++,
    name,
    contentId,
    variants: {
      A: { id: variantAId, name: 'Control', traffic: 0, conversions: 0 },
      B: { id: variantBId, name: 'Variation', traffic: 0, conversions: 0 }
    },
    hypothesis,
    metric,
    duration,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active', // active, completed, paused
    winner: null,
    confidence: 0,
    results: null
  };

  abTests.set(abTest.id, abTest);
  return abTest;
}

/**
 * Update A/B test results
 */
function updateABTestResults(data) {
  const { testId, variantId, metrics } = data;

  const test = abTests.get(testId);
  if (!test) {
    throw new Error('A/B test not found');
  }

  const variant = variantId === 'A' ? test.variants.A : test.variants.B;
  if (!variant) {
    throw new Error('Invalid variant ID');
  }

  // Update variant metrics
  variant.traffic = metrics.traffic || variant.traffic;
  variant.conversions = metrics.conversions || variant.conversions;
  variant.conversionRate = (variant.conversions / Math.max(variant.traffic, 1)) * 100;

  // Calculate test results
  test.results = calculateABTestResults(test);
  
  // Check if we have a winner
  if (test.results.confidence >= 95) {
    test.winner = test.results.winner;
    test.confidence = test.results.confidence;
  }

  // Check if test should be completed
  if (new Date() >= new Date(test.endDate)) {
    test.status = 'completed';
  }

  return test;
}

/**
 * Get A/B test by ID
 */
function getABTest(testId) {
  const test = abTests.get(testId);
  if (!test) {
    throw new Error('A/B test not found');
  }
  return test;
}

/**
 * Track content improvement impact
 */
function trackImprovementImpact(data) {
  const {
    contentId,
    improvementDate,
    changesImplemented = [],
    daysBeforeImpact = 7,
    daysAfterImpact = 7
  } = data;

  const improvementDateObj = new Date(improvementDate);
  const beforeStart = new Date(improvementDateObj.getTime() - daysBeforeImpact * 24 * 60 * 60 * 1000);
  const afterEnd = new Date(improvementDateObj.getTime() + daysAfterImpact * 24 * 60 * 60 * 1000);

  const beforeRecords = Array.from(performanceRecords.values())
    .filter(r => r.contentId === contentId)
    .filter(r => {
      const date = new Date(r.timestamp);
      return date >= beforeStart && date < improvementDateObj;
    });

  const afterRecords = Array.from(performanceRecords.values())
    .filter(r => r.contentId === contentId)
    .filter(r => {
      const date = new Date(r.timestamp);
      return date >= improvementDateObj && date <= afterEnd;
    });

  const beforeSummary = calculatePerformanceSummary(beforeRecords);
  const afterSummary = calculatePerformanceSummary(afterRecords);

  return {
    contentId,
    improvementDate,
    changesImplemented,
    analysis: {
      before: {
        dateRange: { start: beforeStart.toISOString(), end: improvementDate },
        recordCount: beforeRecords.length,
        metrics: beforeSummary
      },
      after: {
        dateRange: { start: improvementDate, end: afterEnd.toISOString() },
        recordCount: afterRecords.length,
        metrics: afterSummary
      }
    },
    impact: {
      pageviews: {
        change: afterSummary.traffic.totalPageviews - beforeSummary.traffic.totalPageviews,
        percentChange: calculatePercentageChange(beforeSummary.traffic.totalPageviews, afterSummary.traffic.totalPageviews),
        direction: afterSummary.traffic.totalPageviews > beforeSummary.traffic.totalPageviews ? 'up' : 'down'
      },
      bounceRate: {
        change: afterSummary.traffic.avgBounceRate - beforeSummary.traffic.avgBounceRate,
        percentChange: calculatePercentageChange(beforeSummary.traffic.avgBounceRate, afterSummary.traffic.avgBounceRate),
        direction: afterSummary.traffic.avgBounceRate < beforeSummary.traffic.avgBounceRate ? 'up' : 'down'
      },
      conversionRate: {
        change: afterSummary.conversions.avgConversionRate - beforeSummary.conversions.avgConversionRate,
        percentChange: calculatePercentageChange(beforeSummary.conversions.avgConversionRate, afterSummary.conversions.avgConversionRate),
        direction: afterSummary.conversions.avgConversionRate > beforeSummary.conversions.avgConversionRate ? 'up' : 'down'
      },
      organicTraffic: {
        change: afterSummary.seo.totalOrganicTraffic - beforeSummary.seo.totalOrganicTraffic,
        percentChange: calculatePercentageChange(beforeSummary.seo.totalOrganicTraffic, afterSummary.seo.totalOrganicTraffic),
        direction: afterSummary.seo.totalOrganicTraffic > beforeSummary.seo.totalOrganicTraffic ? 'up' : 'down'
      }
    },
    verdict: determineImprovementVerdict(beforeSummary, afterSummary),
    recommendations: generateImprovementRecommendations(beforeSummary, afterSummary, changesImplemented)
  };
}

/**
 * Get performance statistics
 */
function getPerformanceStatistics() {
  const allRecords = Array.from(performanceRecords.values());
  const allTests = Array.from(abTests.values());

  return {
    totalRecords: allRecords.length,
    totalABTests: allTests.length,
    activeTests: allTests.filter(t => t.status === 'active').length,
    completedTests: allTests.filter(t => t.status === 'completed').length,
    averagePerformanceScore: allRecords.reduce((sum, r) => sum + r.performanceScore, 0) / allRecords.length || 0,
    topPerformingContent: allRecords
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 5)
      .map(r => ({
        contentId: r.contentId,
        score: r.performanceScore,
        pageviews: r.traffic.pageviews
      })),
    averageMetrics: {
      pageviews: Math.round(allRecords.reduce((sum, r) => sum + r.traffic.pageviews, 0) / allRecords.length || 0),
      bounceRate: Math.round(allRecords.reduce((sum, r) => sum + r.traffic.bounceRate, 0) / allRecords.length || 0),
      conversionRate: (allRecords.reduce((sum, r) => sum + r.conversions.conversionRate, 0) / allRecords.length || 0).toFixed(2)
    }
  };
}

// Helper functions

function calculatePerformanceScore(record) {
  let score = 0;
  
  // Traffic score (0-30 points)
  if (record.traffic.pageviews >= 1000) score += 15;
  else if (record.traffic.pageviews >= 500) score += 10;
  else if (record.traffic.pageviews >= 100) score += 5;
  
  if (record.traffic.bounceRate <= 40) score += 15;
  else if (record.traffic.bounceRate <= 60) score += 10;
  else if (record.traffic.bounceRate <= 80) score += 5;
  
  // Engagement score (0-25 points)
  if (record.traffic.avgTimeOnPage >= 180) score += 10;
  else if (record.traffic.avgTimeOnPage >= 120) score += 7;
  else if (record.traffic.avgTimeOnPage >= 60) score += 4;
  
  if (record.engagement.scrollDepth >= 75) score += 8;
  else if (record.engagement.scrollDepth >= 50) score += 5;
  else if (record.engagement.scrollDepth >= 25) score += 2;
  
  if (record.engagement.socialShares >= 10) score += 7;
  else if (record.engagement.socialShares >= 5) score += 4;
  else if (record.engagement.socialShares >= 1) score += 2;
  
  // Conversion score (0-25 points)
  if (record.conversions.conversionRate >= 5) score += 25;
  else if (record.conversions.conversionRate >= 3) score += 18;
  else if (record.conversions.conversionRate >= 1) score += 10;
  else if (record.conversions.conversionRate > 0) score += 5;
  
  // SEO score (0-20 points)
  if (record.seo.avgPosition && record.seo.avgPosition <= 3) score += 20;
  else if (record.seo.avgPosition && record.seo.avgPosition <= 10) score += 15;
  else if (record.seo.avgPosition && record.seo.avgPosition <= 20) score += 10;
  else if (record.seo.avgPosition) score += 5;
  
  return Math.min(100, score);
}

function calculateTrends(records) {
  if (records.length < 2) {
    return {
      pageviews: 'insufficient_data',
      bounceRate: 'insufficient_data',
      conversionRate: 'insufficient_data'
    };
  }

  const recent = records.slice(0, Math.ceil(records.length / 2));
  const older = records.slice(Math.ceil(records.length / 2));

  const recentAvg = {
    pageviews: recent.reduce((sum, r) => sum + r.traffic.pageviews, 0) / recent.length,
    bounceRate: recent.reduce((sum, r) => sum + r.traffic.bounceRate, 0) / recent.length,
    conversionRate: recent.reduce((sum, r) => sum + r.conversions.conversionRate, 0) / recent.length
  };

  const olderAvg = {
    pageviews: older.reduce((sum, r) => sum + r.traffic.pageviews, 0) / older.length,
    bounceRate: older.reduce((sum, r) => sum + r.traffic.bounceRate, 0) / older.length,
    conversionRate: older.reduce((sum, r) => sum + r.conversions.conversionRate, 0) / older.length
  };

  return {
    pageviews: recentAvg.pageviews > olderAvg.pageviews * 1.05 ? 'up' : 
               recentAvg.pageviews < olderAvg.pageviews * 0.95 ? 'down' : 'stable',
    bounceRate: recentAvg.bounceRate < olderAvg.bounceRate * 0.95 ? 'up' : 
                recentAvg.bounceRate > olderAvg.bounceRate * 1.05 ? 'down' : 'stable',
    conversionRate: recentAvg.conversionRate > olderAvg.conversionRate * 1.05 ? 'up' : 
                    recentAvg.conversionRate < olderAvg.conversionRate * 0.95 ? 'down' : 'stable'
  };
}

function calculatePerformanceSummary(records) {
  if (records.length === 0) {
    return {
      traffic: { totalPageviews: 0, avgBounceRate: 0, avgTimeOnPage: 0 },
      engagement: { totalShares: 0, avgScrollDepth: 0 },
      conversions: { totalConversions: 0, avgConversionRate: 0, totalRevenue: 0 },
      seo: { totalOrganicTraffic: 0, avgPosition: null }
    };
  }

  return {
    traffic: {
      totalPageviews: records.reduce((sum, r) => sum + r.traffic.pageviews, 0),
      avgBounceRate: records.reduce((sum, r) => sum + r.traffic.bounceRate, 0) / records.length,
      avgTimeOnPage: records.reduce((sum, r) => sum + r.traffic.avgTimeOnPage, 0) / records.length
    },
    engagement: {
      totalShares: records.reduce((sum, r) => sum + r.engagement.socialShares, 0),
      avgScrollDepth: records.reduce((sum, r) => sum + r.engagement.scrollDepth, 0) / records.length
    },
    conversions: {
      totalConversions: records.reduce((sum, r) => sum + r.conversions.total, 0),
      avgConversionRate: records.reduce((sum, r) => sum + r.conversions.conversionRate, 0) / records.length,
      totalRevenue: records.reduce((sum, r) => sum + r.conversions.revenue, 0)
    },
    seo: {
      totalOrganicTraffic: records.reduce((sum, r) => sum + r.seo.organicTraffic, 0),
      avgPosition: records.filter(r => r.seo.avgPosition !== null).length > 0 
        ? records.reduce((sum, r) => sum + (r.seo.avgPosition || 0), 0) / records.filter(r => r.seo.avgPosition !== null).length
        : null
    }
  };
}

function calculatePercentageChange(oldValue, newValue) {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

function generateComparisonInsights(period1, period2) {
  const insights = [];

  const pageviewsChange = calculatePercentageChange(period1.traffic.totalPageviews, period2.traffic.totalPageviews);
  if (Math.abs(pageviewsChange) >= 10) {
    insights.push(`Pageviews ${pageviewsChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(pageviewsChange).toFixed(1)}%`);
  }

  const bounceRateChange = calculatePercentageChange(period1.traffic.avgBounceRate, period2.traffic.avgBounceRate);
  if (Math.abs(bounceRateChange) >= 10) {
    insights.push(`Bounce rate ${bounceRateChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(bounceRateChange).toFixed(1)}%`);
  }

  const conversionChange = calculatePercentageChange(period1.conversions.avgConversionRate, period2.conversions.avgConversionRate);
  if (Math.abs(conversionChange) >= 10) {
    insights.push(`Conversion rate ${conversionChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(conversionChange).toFixed(1)}%`);
  }

  return insights;
}

function calculateABTestResults(test) {
  const variantA = test.variants.A;
  const variantB = test.variants.B;

  const aRate = (variantA.conversions / Math.max(variantA.traffic, 1)) * 100;
  const bRate = (variantB.conversions / Math.max(variantB.traffic, 1)) * 100;

  const improvement = ((bRate - aRate) / Math.max(aRate, 0.1)) * 100;
  
  // Simplified confidence calculation (in production, use proper statistical test)
  const minSampleSize = 100;
  const confidence = Math.min(variantA.traffic, variantB.traffic) >= minSampleSize && Math.abs(improvement) > 5 
    ? Math.min(95, 70 + Math.abs(improvement)) 
    : 0;

  return {
    variantA: { rate: aRate, traffic: variantA.traffic, conversions: variantA.conversions },
    variantB: { rate: bRate, traffic: variantB.traffic, conversions: variantB.conversions },
    improvement,
    winner: improvement > 5 ? 'B' : improvement < -5 ? 'A' : null,
    confidence
  };
}

function determineImprovementVerdict(before, after) {
  let improvements = 0;
  let regressions = 0;

  if (after.traffic.totalPageviews > before.traffic.totalPageviews * 1.05) improvements++;
  else if (after.traffic.totalPageviews < before.traffic.totalPageviews * 0.95) regressions++;

  if (after.traffic.avgBounceRate < before.traffic.avgBounceRate * 0.95) improvements++;
  else if (after.traffic.avgBounceRate > before.traffic.avgBounceRate * 1.05) regressions++;

  if (after.conversions.avgConversionRate > before.conversions.avgConversionRate * 1.05) improvements++;
  else if (after.conversions.avgConversionRate < before.conversions.avgConversionRate * 0.95) regressions++;

  if (improvements > regressions) return 'positive';
  if (regressions > improvements) return 'negative';
  return 'neutral';
}

function generateImprovementRecommendations(before, after, changesImplemented) {
  const recommendations = [];

  if (after.traffic.avgBounceRate > before.traffic.avgBounceRate) {
    recommendations.push({
      priority: 'high',
      issue: 'Bounce rate increased',
      suggestion: 'Review recent changes that may have affected user experience'
    });
  }

  if (after.conversions.avgConversionRate < before.conversions.avgConversionRate) {
    recommendations.push({
      priority: 'high',
      issue: 'Conversion rate decreased',
      suggestion: 'Consider reverting changes or conducting A/B test'
    });
  }

  if (after.traffic.totalPageviews > before.traffic.totalPageviews * 1.2) {
    recommendations.push({
      priority: 'low',
      issue: 'Great traffic growth',
      suggestion: 'Document successful changes and apply to similar content'
    });
  }

  return recommendations;
}

module.exports = {
  trackPerformance,
  getPerformanceHistory,
  comparePerformance,
  createABTest,
  updateABTestResults,
  getABTest,
  trackImprovementImpact,
  getPerformanceStatistics
};
