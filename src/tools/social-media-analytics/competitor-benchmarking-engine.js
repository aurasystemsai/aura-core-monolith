/**
 * Competitor Benchmarking Engine
 * Manages competitive analysis, performance benchmarking, and market positioning insights
 */

// In-memory storage
const competitors = new Map();
const benchmarks = new Map();
const competitorMetrics = new Map();
const marketPosition = new Map();
const competitiveInsights = new Map();

let competitorIdCounter = 1;
let benchmarkIdCounter = 1;
let metricIdCounter = 1;
let positionIdCounter = 1;
let insightIdCounter = 1;

/**
 * Add competitor
 */
function addCompetitor({ accountId, name, handle, platforms, industry, size, primaryObjective }) {
  const competitor = {
    id: competitorIdCounter++,
    accountId,
    name,
    handle, // Social media handle
    platforms: platforms || [], // [{platform: 'instagram', handle: '@competitor'}]
    industry: industry || 'general',
    size: size || 'medium', // small, medium, large, enterprise
    primaryObjective: primaryObjective || 'engagement',
    isActive: true,
    addedAt: new Date(),
    lastAnalyzed: null,
    performanceScore: 0
  };

  competitors.set(competitor.id, competitor);
  return competitor;
}

/**
 * Track competitor metrics
 */
function trackCompetitorMetrics(competitorId, { platform, followers, following, posts, engagement, reach, growthRate }) {
  const competitor = competitors.get(competitorId);
  if (!competitor) {
    throw new Error('Competitor not found');
  }

  const metric = {
    id: metricIdCounter++,
    competitorId,
    platform,
    followers: followers || 0,
    following: following || 0,
    posts: posts || 0,
    engagement: {
      total: engagement?.total || 0,
      likes: engagement?.likes || 0,
      comments: engagement?.comments || 0,
      shares: engagement?.shares || 0,
      avgPerPost: posts > 0 ? (engagement?.total || 0) / posts : 0,
      rate: followers > 0 && engagement?.total ? (engagement.total / followers) * 100 : 0
    },
    reach: {
      total: reach?.total || 0,
      avg PerPost: posts > 0 ? (reach?.total || 0) / posts : 0
    },
    growthRate: growthRate || 0,
    postingFrequency: {
      postsPerWeek: posts || 0,
      consistency: calculateConsistency(posts)
    },
    trackedAt: new Date()
  };

  competitorMetrics.set(metric.id, metric);

  // Update competitor
  competitor.lastAnalyzed = new Date();
  competitor.performanceScore = calculateCompetitorScore(metric);

  return metric;
}

/**
 * Calculate posting consistency
 */
function calculateConsistency(posts) {
  if (posts === 0) return 'none';
  if (posts > 10) return 'high';
  if (posts > 5) return 'medium';
  return 'low';
}

/**
 * Calculate competitor performance score
 */
function calculateCompetitorScore(metric) {
  let score = 0;

  // Engagement rate factor (0-40 points)
  if (metric.engagement.rate > 5) score += 40;
  else if (metric.engagement.rate > 3) score += 30;
  else if (metric.engagement.rate > 1) score += 20;
  else if (metric.engagement.rate > 0.5) score += 10;

  // Growth rate factor (0-30 points)
  if (metric.growthRate > 5) score += 30;
  else if (metric.growthRate > 3) score += 20;
  else if (metric.growthRate > 1) score += 15;
  else if (metric.growthRate > 0) score += 10;

  // Posting frequency factor (0-20 points)
  if (metric.postingFrequency.postsPerWeek > 10) score += 20;
  else if (metric.postingFrequency.postsPerWeek > 5) score += 15;
  else if (metric.postingFrequency.postsPerWeek > 3) score += 10;
  else if (metric.postingFrequency.postsPerWeek > 0) score += 5;

  // Reach factor (0-10 points)
  if (metric.reach.avgPerPost > 10000) score += 10;
  else if (metric.reach.avgPerPost > 5000) score += 8;
  else if (metric.reach.avgPerPost > 1000) score += 5;

  return Math.min(score, 100);
}

/**
 * Create benchmark
 */
function createBenchmark(accountId, { metric, yourValue, competitors, industry }) {
  const competitorValues = competitors || [];

  const benchmark = {
    id: benchmarkIdCounter++,
    accountId,
    metric, // followers, engagement_rate, posting_frequency, growth_rate, reach
    yourValue,
    competitors: competitorValues,
    averageCompetitor: competitorValues.length > 0 ?
      competitorValues.reduce((sum, c) => sum + c.value, 0) / competitorValues.length : 0,
    industryAverage: industry?.average || 0,
    industryTop10: industry?.top10 || 0,
    yourRank: null,
    percentile: 0,
    gap: {
      vsCompetitorAvg: 0,
      vsIndustryAvg: 0,
      vsTop10: 0
    },
    status: 'leading', // leading, competitive, lagging
    createdAt: new Date()
  };

  // Calculate gaps
  if (benchmark.averageCompetitor > 0) {
    benchmark.gap.vsCompetitorAvg = ((yourValue - benchmark.averageCompetitor) / benchmark.averageCompetitor) * 100;
  }

  if (benchmark.industryAverage > 0) {
    benchmark.gap.vsIndustryAvg = ((yourValue - benchmark.industryAverage) / benchmark.industryAverage) * 100;
  }

  if (benchmark.industryTop10 > 0) {
    benchmark.gap.vsTop10 = ((yourValue - benchmark.industryTop10) / benchmark.industryTop10) * 100;
  }

  // Determine status
  if (yourValue >= benchmark.averageCompetitor) {
    benchmark.status = yourValue >= benchmark.industryTop10 ? 'leading' : 'competitive';
  } else {
    benchmark.status = 'lagging';
  }

  // Calculate rank
  const allValues = [yourValue, ...competitorValues.map(c => c.value)].sort((a, b) => b - a);
  benchmark.yourRank = allValues.indexOf(yourValue) + 1;
  benchmark.percentile = ((allValues.length - benchmark.yourRank + 1) / allValues.length) * 100;

  benchmarks.set(benchmark.id, benchmark);
  return benchmark;
}

/**
 * Analyze market position
 */
function analyzeMarketPosition(accountId, { yourMetrics, competitors }) {
  // Calculate market position across multiple dimensions
  const position = {
    id: positionIdCounter++,
    accountId,
    dimensions: {
      followers: calculateDimensionPosition('followers', yourMetrics.followers, competitors),
      engagement: calculateDimensionPosition('engagement', yourMetrics.engagement, competitors),
      growth: calculateDimensionPosition('growth', yourMetrics.growth, competitors),
      contentQuality: calculateDimensionPosition('contentQuality', yourMetrics.contentQuality, competitors)
    },
    overallScore: 0,
    quadrant: '', // leader, challenger, niche_player, follower
    strengths: [],
    weaknesses: [],
    opportunities: [],
    threats: [],
    analyzedAt: new Date()
  };

  // Calculate overall score
  const dimensionScores = Object.values(position.dimensions).map(d => d.score);
  position.overallScore = dimensionScores.reduce((sum, s) => sum + s, 0) / dimensionScores.length;

  // Determine quadrant (simplified BCG matrix style)
  const marketShare = position.dimensions.followers.percentile;
  const marketGrowth = position.dimensions.growth.percentile;

  if (marketShare > 50 && marketGrowth > 50) {
    position.quadrant = 'leader';
  } else if (marketShare <= 50 && marketGrowth > 50) {
    position.quadrant = 'challenger';
  } else if (marketShare > 50 && marketGrowth <= 50) {
    position.quadrant = 'niche_player';
  } else {
    position.quadrant = 'follower';
  }

  // Identify strengths and weaknesses
  Object.entries(position.dimensions).forEach(([dimension, data]) => {
    if (data.percentile > 75) {
      position.strengths.push({
        dimension,
        percentile: data.percentile,
        message: `Strong ${dimension} performance - top 25%`
      });
    } else if (data.percentile < 25) {
      position.weaknesses.push({
        dimension,
        percentile: data.percentile,
        message: `Weak ${dimension} performance - bottom 25%`
      });
    }
  });

  // Generate SWOT
  position.opportunities = generateOpportunities(position);
  position.threats = generateThreats(position, competitors);

  marketPosition.set(position.id, position);
  return position;
}

/**
 * Calculate dimension position
 */
function calculateDimensionPosition(dimension, yourValue, competitors) {
  const competitorValues = competitors.map(c => c[dimension] || 0);
  const allValues = [yourValue, ...competitorValues].sort((a, b) => b - a);

  const yourRank = allValues.indexOf(yourValue) + 1;
  const percentile = ((allValues.length - yourRank + 1) / allValues.length) * 100;

  const average = allValues.reduce((sum, v) => sum + v, 0) / allValues.length;
  const gap = average > 0 ? ((yourValue - average) / average) * 100 : 0;

  return {
    value: yourValue,
    rank: yourRank,
    percentile,
    average,
    gap: gap.toFixed(2),
    score: percentile,
    status: percentile > 75 ? 'leading' : percentile > 50 ? 'competitive' : percentile > 25 ? 'average' : 'lagging'
  };
}

/**
 * Generate opportunities
 */
function generateOpportunities(position) {
  const opportunities = [];

  if (position.dimensions.growth.percentile < 50) {
    opportunities.push({
      type: 'growth',
      priority: 'high',
      suggestion: 'Accelerate follower growth through paid campaigns and collaborations',
      potentialImpact: 'Could move from follower to challenger quadrant'
    });
  }

  if (position.dimensions.engagement.percentile < position.dimensions.followers.percentile) {
    opportunities.push({
      type: 'engagement',
      priority: 'high',
      suggestion: 'Improve engagement through more interactive content and community building',
      potentialImpact: 'Better leverage existing follower base'
    });
  }

  if (position.dimensions.contentQuality.score < 70) {
    opportunities.push({
      type: 'content',
      priority: 'medium',
      suggestion: 'Invest in higher quality content production and storytelling',
      potentialImpact: 'Increase engagement and shareability'
    });
  }

  return opportunities;
}

/**
 * Generate threats
 */
function generateThreats(position, competitors) {
  const threats = [];

  // Fast-growing competitors
  const fastGrowers = competitors.filter(c => (c.growth || 0) > (position.dimensions.growth.value || 0) * 1.5);
  if (fastGrowers.length > 0) {
    threats.push({
      type: 'competition',
      severity: 'high',
      description: `${fastGrowers.length} competitor(s) growing 50%+ faster`,
      mitigation: 'Increase content frequency and marketing spend'
    });
  }

  // Higher engagement competitors
  const highEngagers = competitors.filter(c => (c.engagement || 0) > position.dimensions.engagement.value);
  if (highEngagers.length > competitors.length * 0.7) {
    threats.push({
      type: 'engagement',
      severity: 'medium',
      description: 'Majority of competitors have higher engagement',
      mitigation: 'Revamp content strategy to boost engagement'
    });
  }

  if (position.quadrant === 'follower') {
    threats.push({
      type: 'market_position',
      severity: 'high',
      description: 'Low market share and low growth trajectory',
      mitigation: 'Urgently need differentiation strategy and growth initiatives'
    });
  }

  return threats;
}

/**
 * Generate competitive insights
 */
function generateCompetitiveInsights(accountId) {
  const accountCompetitors = Array.from(competitors.values())
    .filter(c => c.accountId === accountId && c.isActive);

  if (accountCompetitors.length === 0) {
    return { available: false, message: 'No competitors tracked' };
  }

  const recentMetrics = Array.from(competitorMetrics.values())
    .filter(m => {
      const competitor = competitors.get(m.competitorId);
      return competitor && competitor.accountId === accountId;
    })
    .sort((a, b) => b.trackedAt - a.trackedAt);

  // Group by competitor
  const competitorData = {};
  accountCompetitors.forEach(comp => {
    const metrics = recentMetrics.filter(m => m.competitorId === comp.id);
    if (metrics.length > 0) {
      const latest = metrics[0];
      competitorData[comp.id] = {
        name: comp.name,
        platform: latest.platform,
        followers: latest.followers,
        engagementRate: latest.engagement.rate,
        growthRate: latest.growthRate,
        performanceScore: comp.performanceScore
      };
    }
  });

  const insight = {
    id: insightIdCounter++,
    accountId,
    totalCompetitors: accountCompetitors.length,
    topPerformers: Object.entries(competitorData)
      .sort((a, b) => b[1].performanceScore - a[1].performanceScore)
      .slice(0, 3)
      .map(([id, data]) => ({
        competitorId: parseInt(id),
        ...data
      })),
    averages: {
      followers: Object.values(competitorData).reduce((sum, d) => sum + d.followers, 0) / Object.keys(competitorData).length,
      engagementRate: Object.values(competitorData).reduce((sum, d) => sum + d.engagementRate, 0) / Object.keys(competitorData).length,
      growthRate: Object.values(competitorData).reduce((sum, d) => sum + d.growthRate, 0) / Object.keys(competitorData).length
    },
    trends: {
      risingCompetitors: Object.entries(competitorData)
        .filter(([_, d]) => d.growthRate > 3)
        .map(([id, d]) => ({ competitorId: parseInt(id), name: d.name, growthRate: d.growthRate })),
      decliningCompetitors: Object.entries(competitorData)
        .filter(([_, d]) => d.growthRate < 0)
        .map(([id, d]) => ({ competitorId: parseInt(id), name: d.name, growthRate: d.growthRate }))
    },
    recommendations: generateBenchmarkRecommendations(competitorData),
    generatedAt: new Date()
  };

  competitiveInsights.set(insight.id, insight);
  return insight;
}

/**
 * Generate benchmark recommendations
 */
function generateBenchmarkRecommendations(competitorData) {
  const recommendations = [];

  const avgEngagement = Object.values(competitorData)
    .reduce((sum, d) => sum + d.engagementRate, 0) / Object.keys(competitorData).length;

  recommendations.push({
    priority: 'high',
    category: 'benchmark',
    suggestion: `Target engagement rate of ${avgEngagement.toFixed(2)}% to match competitor average`,
    metrics: {
      current: 'Your current rate',
      target: avgEngagement.toFixed(2),
      gap: 'Calculate based on your metrics'
    }
  });

  const topPerformer = Object.values(competitorData)
    .reduce((max, d) => d.performanceScore > (max.performanceScore || 0) ? d : max, {});

  if (topPerformer.name) {
    recommendations.push({
      priority: 'medium',
      category: 'learn',
      suggestion: `Study ${topPerformer.name}'s content strategy - top performer with ${topPerformer.performanceScore} score`,
      actions: [
        'Analyze their posting frequency',
        'Study content types and formats',
        'Review engagement tactics'
      ]
    });
  }

  return recommendations;
}

/**
 * Get competitor statistics
 */
function getCompetitorStatistics(accountId) {
  const accountCompetitors = Array.from(competitors.values())
    .filter(c => c.accountId === accountId);

  if (accountCompetitors.length === 0) {
    return { available: false, message: 'No competitors tracked' };
  }

  return {
    accountId,
    totalCompetitors: accountCompetitors.length,
    activeCompetitors: accountCompetitors.filter(c => c.isActive).length,
    totalMetrics: Array.from(competitorMetrics.values()).filter(m => {
      const competitor = competitors.get(m.competitorId);
      return competitor && competitor.accountId === accountId;
    }).length,
    totalBenchmarks: Array.from(benchmarks.values()).filter(b => b.accountId === accountId).length,
    totalPositionAnalyses: Array.from(marketPosition.values()).filter(p => p.accountId === accountId).length,
    totalInsights: Array.from(competitiveInsights.values()).filter(i => i.accountId === accountId).length,
    industryBreakdown: getIndustryBreakdown(accountCompetitors),
    sizeBreakdown: getSizeBreakdown(accountCompetitors)
  };
}

function getIndustryBreakdown(competitors) {
  const breakdown = {};
  competitors.forEach(c => {
    breakdown[c.industry] = (breakdown[c.industry] || 0) + 1;
  });
  return breakdown;
}

function getSizeBreakdown(competitors) {
  const breakdown = {};
  competitors.forEach(c => {
    breakdown[c.size] = (breakdown[c.size] || 0) + 1;
  });
  return breakdown;
}

module.exports = {
  addCompetitor,
  trackCompetitorMetrics,
  createBenchmark,
  analyzeMarketPosition,
  generateCompetitiveInsights,
  getCompetitorStatistics
};
