/**
 * Platform Analytics Engine
 * Manages multi-platform social media analytics, account health, and growth tracking
 */

// In-memory storage
const platformAccounts = new Map();
const platformMetrics = new Map();
const accountHealth = new Map();
const growthSnapshots = new Map();
const performanceReports = new Map();

let accountIdCounter = 1;
let metricIdCounter = 1;
let healthIdCounter = 1;
let snapshotIdCounter = 1;
let reportIdCounter = 1;

/**
 * Connect social media platform account
 */
function connectPlatformAccount({ platform, accountName, accountId, accessToken, refreshToken, accountType, followerCount, postingFrequency, primaryObjective }) {
  const account = {
    id: accountIdCounter++,
    platform, // facebook, instagram, twitter, linkedin, tiktok, youtube, pinterest
    accountName,
    accountId,
    accessToken,
    refreshToken,
    accountType, // personal, business, creator
    followerCount: followerCount || 0,
    postingFrequency, // daily, weekly, irregular
    primaryObjective, // awareness, engagement, traffic, conversions, community
    connectedAt: new Date(),
    isActive: true,
    lastSyncedAt: null,
    syncStatus: 'pending', // pending, syncing, completed, failed
    permissions: ['read_insights', 'publish_content', 'read_comments', 'manage_messages'],
    healthScore: 0
  };

  platformAccounts.set(account.id, account);

  // Initialize first health check
  calculateAccountHealth(account.id);

  return account;
}

/**
 * Sync platform metrics
 */
function syncPlatformMetrics(accountId, { startDate, endDate }) {
  const account = platformAccounts.get(accountId);
  if (!account) {
    throw new Error('Account not found');
  }

  // Simulate metric collection
  const metric = {
    id: metricIdCounter++,
    accountId,
    platform: account.platform,
    period: {
      startDate: new Date(startDate),
      endDate: new Date(endDate)
    },
    followers: {
      total: account.followerCount,
      gained: Math.floor(Math.random() * 500),
      lost: Math.floor(Math.random() * 100),
      netGrowth: 0,
      growthRate: 0
    },
    engagement: {
      totalEngagements: Math.floor(Math.random() * 10000),
      likes: Math.floor(Math.random() * 5000),
      comments: Math.floor(Math.random() * 1000),
      shares: Math.floor(Math.random() * 500),
      saves: Math.floor(Math.random() * 300),
      clicks: Math.floor(Math.random() * 2000),
      engagementRate: 0
    },
    reach: {
      totalReach: Math.floor(Math.random() * 50000),
      impressions: Math.floor(Math.random() * 75000),
      uniqueViews: Math.floor(Math.random() * 40000),
      reachRate: 0
    },
    content: {
      postsPublished: Math.floor(Math.random() * 30),
      storiesPublished: Math.floor(Math.random() * 50),
      videosPublished: Math.floor(Math.random() * 10),
      avgPostPerformance: 0
    },
    audience: {
      topCountries: ['US', 'UK', 'CA', 'AU'],
      topCities: ['New York', 'London', 'Toronto'],
      ageGroups: { '18-24': 25, '25-34': 35, '35-44': 20, '45-54': 15, '55+': 5 },
      genderSplit: { male: 45, female: 52, other: 3 }
    },
    syncedAt: new Date()
  };

  // Calculate derived metrics
  metric.followers.netGrowth = metric.followers.gained - metric.followers.lost;
  metric.followers.growthRate = (metric.followers.netGrowth / metric.followers.total) * 100;
  metric.engagement.engagementRate = (metric.engagement.totalEngagements / metric.reach.totalReach) * 100;
  metric.reach.reachRate = (metric.reach.totalReach / metric.followers.total) * 100;
  metric.content.avgPostPerformance = metric.engagement.totalEngagements / metric.content.postsPublished;

  platformMetrics.set(metric.id, metric);

  // Update account
  account.lastSyncedAt = new Date();
  account.syncStatus = 'completed';
  account.followerCount = metric.followers.total;

  // Create growth snapshot
  createGrowthSnapshot(accountId, metric);

  return metric;
}

/**
 * Calculate account health score
 */
function calculateAccountHealth(accountId) {
  const account = platformAccounts.get(accountId);
  if (!account) {
    throw new Error('Account not found');
  }

  // Get recent metrics
  const recentMetrics = Array.from(platformMetrics.values())
    .filter(m => m.accountId === accountId)
    .sort((a, b) => b.syncedAt - a.syncedAt)
    .slice(0, 1)[0];

  let healthScore = 0;
  const factors = [];

  if (recentMetrics) {
    // Engagement rate factor (0-30 points)
    if (recentMetrics.engagement.engagementRate > 5) {
      healthScore += 30;
      factors.push({ factor: 'engagement_rate', score: 30, status: 'excellent' });
    } else if (recentMetrics.engagement.engagementRate > 3) {
      healthScore += 20;
      factors.push({ factor: 'engagement_rate', score: 20, status: 'good' });
    } else if (recentMetrics.engagement.engagementRate > 1) {
      healthScore += 10;
      factors.push({ factor: 'engagement_rate', score: 10, status: 'fair' });
    } else {
      factors.push({ factor: 'engagement_rate', score: 0, status: 'poor' });
    }

    // Growth rate factor (0-25 points)
    if (recentMetrics.followers.growthRate > 5) {
      healthScore += 25;
      factors.push({ factor: 'growth_rate', score: 25, status: 'excellent' });
    } else if (recentMetrics.followers.growthRate > 2) {
      healthScore += 15;
      factors.push({ factor: 'growth_rate', score: 15, status: 'good' });
    } else if (recentMetrics.followers.growthRate > 0) {
      healthScore += 5;
      factors.push({ factor: 'growth_rate', score: 5, status: 'fair' });
    } else {
      factors.push({ factor: 'growth_rate', score: 0, status: 'declining' });
    }

    // Posting consistency factor (0-20 points)
    const postsPerDay = recentMetrics.content.postsPublished / 30;
    if (postsPerDay >= 1) {
      healthScore += 20;
      factors.push({ factor: 'posting_consistency', score: 20, status: 'consistent' });
    } else if (postsPerDay >= 0.5) {
      healthScore += 10;
      factors.push({ factor: 'posting_consistency', score: 10, status: 'moderate' });
    } else {
      factors.push({ factor: 'posting_consistency', score: 0, status: 'inconsistent' });
    }

    // Reach rate factor (0-15 points)
    if (recentMetrics.reach.reachRate > 50) {
      healthScore += 15;
      factors.push({ factor: 'reach_rate', score: 15, status: 'excellent' });
    } else if (recentMetrics.reach.reachRate > 25) {
      healthScore += 10;
      factors.push({ factor: 'reach_rate', score: 10, status: 'good' });
    } else {
      healthScore += 5;
      factors.push({ factor: 'reach_rate', score: 5, status: 'fair' });
    }
  }

  // Account activity factor (0-10 points)
  if (account.lastSyncedAt) {
    const daysSinceLastSync = (Date.now() - account.lastSyncedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastSync <= 1) {
      healthScore += 10;
      factors.push({ factor: 'account_activity', score: 10, status: 'active' });
    } else if (daysSinceLastSync <= 7) {
      healthScore += 5;
      factors.push({ factor: 'account_activity', score: 5, status: 'moderate' });
    } else {
      factors.push({ factor: 'account_activity', score: 0, status: 'inactive' });
    }
  }

  const health = {
    id: healthIdCounter++,
    accountId,
    healthScore: Math.min(healthScore, 100),
    status: healthScore >= 75 ? 'excellent' : healthScore >= 50 ? 'good' : healthScore >= 25 ? 'fair' : 'poor',
    factors,
    recommendations: generateHealthRecommendations(healthScore, factors),
    assessedAt: new Date()
  };

  accountHealth.set(health.id, health);
  account.healthScore = health.healthScore;

  return health;
}

/**
 * Generate health recommendations
 */
function generateHealthRecommendations(healthScore, factors) {
  const recommendations = [];

  factors.forEach(factor => {
    if (factor.factor === 'engagement_rate' && factor.status === 'poor') {
      recommendations.push({
        priority: 'high',
        category: 'engagement',
        suggestion: 'Increase engagement by posting more interactive content (polls, questions, stories)',
        expectedImpact: 'Could improve health score by 20-30 points'
      });
    }

    if (factor.factor === 'growth_rate' && factor.status === 'declining') {
      recommendations.push({
        priority: 'high',
        category: 'growth',
        suggestion: 'Focus on follower growth through hashtags, collaborations, and paid promotion',
        expectedImpact: 'Could improve health score by 15-25 points'
      });
    }

    if (factor.factor === 'posting_consistency' && factor.status === 'inconsistent') {
      recommendations.push({
        priority: 'medium',
        category: 'content',
        suggestion: 'Establish a consistent posting schedule (minimum 3-5 posts per week)',
        expectedImpact: 'Could improve health score by 10-20 points'
      });
    }

    if (factor.factor === 'reach_rate' && factor.score < 10) {
      recommendations.push({
        priority: 'medium',
        category: 'reach',
        suggestion: 'Optimize posting times and use trending hashtags to increase reach',
        expectedImpact: 'Could improve health score by 10-15 points'
      });
    }
  });

  if (healthScore >= 75) {
    recommendations.push({
      priority: 'low',
      category: 'optimization',
      suggestion: 'Maintain current strategy and test new content formats',
      expectedImpact: 'Sustain excellent performance'
    });
  }

  return recommendations;
}

/**
 * Create growth snapshot
 */
function createGrowthSnapshot(accountId, metric) {
  const snapshot = {
    id: snapshotIdCounter++,
    accountId,
    timestamp: new Date(),
    followers: metric.followers.total,
    engagement: metric.engagement.totalEngagements,
    reach: metric.reach.totalReach,
    posts: metric.content.postsPublished,
    engagementRate: metric.engagement.engagementRate,
    growthRate: metric.followers.growthRate
  };

  growthSnapshots.set(snapshot.id, snapshot);
  return snapshot;
}

/**
 * Get growth trends
 */
function getGrowthTrends(accountId, { period = 'week', metric = 'followers' }) {
  const snapshots = Array.from(growthSnapshots.values())
    .filter(s => s.accountId === accountId)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (snapshots.length < 2) {
    return {
      trend: 'insufficient_data',
      dataPoints: snapshots.length,
      message: 'Need at least 2 snapshots to calculate trends'
    };
  }

  // Calculate trend
  const firstSnapshot = snapshots[0];
  const lastSnapshot = snapshots[snapshots.length - 1];

  const change = lastSnapshot[metric] - firstSnapshot[metric];
  const percentChange = (change / firstSnapshot[metric]) * 100;

  let trendDirection = 'stable';
  if (percentChange > 5) trendDirection = 'increasing';
  else if (percentChange < -5) trendDirection = 'decreasing';

  return {
    metric,
    period,
    trend: trendDirection,
    startValue: firstSnapshot[metric],
    endValue: lastSnapshot[metric],
    change,
    percentChange: percentChange.toFixed(2),
    dataPoints: snapshots.length,
    snapshots: snapshots.map(s => ({
      timestamp: s.timestamp,
      value: s[metric]
    }))
  };
}

/**
 * Generate performance report
 */
function generatePerformanceReport(accountId, { startDate, endDate, includeComparisons = true }) {
  const account = platformAccounts.get(accountId);
  if (!account) {
    throw new Error('Account not found');
  }

  // Get metrics in date range
  const metrics = Array.from(platformMetrics.values())
    .filter(m => m.accountId === accountId &&
      m.period.startDate >= new Date(startDate) &&
      m.period.endDate <= new Date(endDate))
    .sort((a, b) => b.syncedAt - a.syncedAt);

  if (metrics.length === 0) {
    throw new Error('No metrics found for the specified period');
  }

  // Aggregate metrics
  const aggregated = {
    totalFollowersGained: 0,
    totalFollowersLost: 0,
    totalEngagements: 0,
    totalReach: 0,
    totalPosts: 0,
    avgEngagementRate: 0,
    avgGrowthRate: 0
  };

  metrics.forEach(m => {
    aggregated.totalFollowersGained += m.followers.gained;
    aggregated.totalFollowersLost += m.followers.lost;
    aggregated.totalEngagements += m.engagement.totalEngagements;
    aggregated.totalReach += m.reach.totalReach;
    aggregated.totalPosts += m.content.postsPublished;
  });

  aggregated.avgEngagementRate = (aggregated.totalEngagements / aggregated.totalReach) * 100;
  aggregated.avgGrowthRate = ((aggregated.totalFollowersGained - aggregated.totalFollowersLost) / account.followerCount) * 100;

  const report = {
    id: reportIdCounter++,
    accountId,
    platform: account.platform,
    period: { startDate: new Date(startDate), endDate: new Date(endDate) },
    summary: aggregated,
    topContent: [],
    insights: generateReportInsights(aggregated, account),
    generatedAt: new Date()
  };

  if (includeComparisons) {
    report.comparisons = generateComparisons(accountId, startDate, endDate);
  }

  performanceReports.set(report.id, report);
  return report;
}

/**
 * Generate report insights
 */
function generateReportInsights(aggregated, account) {
  const insights = [];

  if (aggregated.avgEngagementRate > 5) {
    insights.push({
      type: 'positive',
      category: 'engagement',
      message: `Excellent engagement rate of ${aggregated.avgEngagementRate.toFixed(2)}% - well above industry average`,
      recommendation: 'Continue current content strategy'
    });
  } else if (aggregated.avgEngagementRate < 2) {
    insights.push({
      type: 'negative',
      category: 'engagement',
      message: `Low engagement rate of ${aggregated.avgEngagementRate.toFixed(2)}% - below industry standards`,
      recommendation: 'Test more interactive content formats and optimize posting times'
    });
  }

  if (aggregated.avgGrowthRate > 3) {
    insights.push({
      type: 'positive',
      category: 'growth',
      message: `Strong growth rate of ${aggregated.avgGrowthRate.toFixed(2)}%`,
      recommendation: 'Capitalize on momentum with increased posting frequency'
    });
  } else if (aggregated.avgGrowthRate < 0) {
    insights.push({
      type: 'negative',
      category: 'growth',
      message: `Negative growth rate - losing followers`,
      recommendation: 'Analyze content performance and adjust strategy'
    });
  }

  const postsPerDay = aggregated.totalPosts / 30;
  if (postsPerDay < 0.5) {
    insights.push({
      type: 'warning',
      category: 'consistency',
      message: 'Posting frequency is below recommended levels',
      recommendation: 'Aim for at least 3-5 posts per week for optimal performance'
    });
  }

  return insights;
}

/**
 * Generate comparisons
 */
function generateComparisons(accountId, startDate, endDate) {
  // Compare with previous period
  const periodLength = new Date(endDate) - new Date(startDate);
  const previousStartDate = new Date(new Date(startDate) - periodLength);
  const previousEndDate = new Date(startDate);

  const currentMetrics = Array.from(platformMetrics.values())
    .filter(m => m.accountId === accountId &&
      m.period.startDate >= new Date(startDate) &&
      m.period.endDate <= new Date(endDate));

  const previousMetrics = Array.from(platformMetrics.values())
    .filter(m => m.accountId === accountId &&
      m.period.startDate >= previousStartDate &&
      m.period.endDate <= previousEndDate);

  if (previousMetrics.length === 0) {
    return { available: false, message: 'No previous period data available' };
  }

  const currentTotal = currentMetrics.reduce((sum, m) => sum + m.engagement.totalEngagements, 0);
  const previousTotal = previousMetrics.reduce((sum, m) => sum + m.engagement.totalEngagements, 0);
  const change = ((currentTotal - previousTotal) / previousTotal) * 100;

  return {
    available: true,
    previousPeriod: {
      startDate: previousStartDate,
      endDate: previousEndDate
    },
    engagementChange: change.toFixed(2),
    trend: change > 0 ? 'improving' : change < 0 ? 'declining' : 'stable'
  };
}

/**
 * Get platform statistics
 */
function getPlatformStatistics(accountId) {
  const account = platformAccounts.get(accountId);
  if (!account) {
    throw new Error('Account not found');
  }

  const metrics = Array.from(platformMetrics.values()).filter(m => m.accountId === accountId);
  const health = Array.from(accountHealth.values())
    .filter(h => h.accountId === accountId)
    .sort((a, b) => b.assessedAt - a.assessedAt)[0];

  return {
    accountId,
    platform: account.platform,
    isActive: account.isActive,
    totalSyncs: metrics.length,
    lastSyncedAt: account.lastSyncedAt,
    currentFollowers: account.followerCount,
    healthScore: health ? health.healthScore : 0,
    healthStatus: health ? health.status : 'unknown',
    totalSnapshots: Array.from(growthSnapshots.values()).filter(s => s.accountId === accountId).length,
    totalReports: Array.from(performanceReports.values()).filter(r => r.accountId === accountId).length
  };
}

module.exports = {
  connectPlatformAccount,
  syncPlatformMetrics,
  calculateAccountHealth,
  createGrowthSnapshot,
  getGrowthTrends,
  generatePerformanceReport,
  getPlatformStatistics
};
