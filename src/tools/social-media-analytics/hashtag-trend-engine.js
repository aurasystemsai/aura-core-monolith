/**
 * Hashtag & Trend Engine
 * Manages hashtag performance tracking, trend discovery, and trending topic analysis
 */

// In-memory storage
const hashtags = new Map();
const hashtagPerformance = new Map();
const trends = new Map();
const trendingTopics = new Map();
const hashtagSuggestions = new Map();

let hashtagIdCounter = 1;
let performanceIdCounter = 1;
let trendIdCounter = 1;
let topicIdCounter = 1;
let suggestionIdCounter = 1;

/**
 * Track hashtag
 */
function trackHashtag({ accountId, hashtag, category, isCustom }) {
  const existing = Array.from(hashtags.values())
    .find(h => h.hashtag.toLowerCase() === hashtag.toLowerCase() && h.accountId === accountId);

  if (existing) {
    return existing;
  }

  const tag = {
    id: hashtagIdCounter++,
    accountId,
    hashtag: hashtag.startsWith('#') ? hashtag : `#${hashtag}`,
    category: category || 'general', // branded, trending, niche, industry, general
    isCustom: isCustom || false,
    firstUsed: new Date(),
    lastUsed: null,
    totalUses: 0,
    totalReach: 0,
    totalEngagement: 0,
    avgEngagementRate: 0,
    performanceScore: 0,
    status: 'active' // active, trending, declining, inactive
  };

  hashtags.set(tag.id, tag);
  return tag;
}

/**
 * Update hashtag performance
 */
function updateHashtagPerformance(hashtagId, { postId, reach, engagement, impressions }) {
  const hashtag = hashtags.get(hashtagId);
  if (!hashtag) {
    throw new Error('Hashtag not found');
  }

  const performance = {
    id: performanceIdCounter++,
    hashtagId,
    postId,
    reach: reach || 0,
    engagement: engagement || 0,
    impressions: impressions || 0,
    engagementRate: reach > 0 ? (engagement / reach) * 100 : 0,
    recordedAt: new Date()
  };

  hashtagPerformance.set(performance.id, performance);

  // Update hashtag stats
  hashtag.totalUses++;
  hashtag.totalReach += reach;
  hashtag.totalEngagement += engagement;
  hashtag.avgEngagementRate = hashtag.totalReach > 0 ?
    (hashtag.totalEngagement / hashtag.totalReach) * 100 : 0;
  hashtag.lastUsed = new Date();

  // Calculate performance score
hashtag.performanceScore = calculateHashtagScore(hashtag);

  // Update status based on recent performance
  updateHashtagStatus(hashtagId);

  return performance;
}

/**
 * Calculate hashtag performance score
 */
function calculateHashtagScore(hashtag) {
  let score = 0;

  // Engagement rate factor (0-40 points)
  if (hashtag.avgEngagementRate > 8) score += 40;
  else if (hashtag.avgEngagementRate > 5) score += 30;
  else if (hashtag.avgEngagementRate > 3) score += 20;
  else if (hashtag.avgEngagementRate > 1) score += 10;

  // Reach factor (0-30 points)
  const avgReach = hashtag.totalUses > 0 ? hashtag.totalReach / hashtag.totalUses : 0;
  if (avgReach > 10000) score += 30;
  else if (avgReach > 5000) score += 25;
  else if (avgReach > 1000) score += 20;
  else if (avgReach > 500) score += 10;

  // Usage frequency factor (0-20 points)
  if (hashtag.totalUses > 50) score += 20;
  else if (hashtag.totalUses > 20) score += 15;
  else if (hashtag.totalUses > 10) score += 10;
  else if (hashtag.totalUses > 5) score += 5;

  // Category bonus (0-10 points)
  if (hashtag.category === 'branded') score += 10;
  else if (hashtag.category === 'trending') score += 8;
  else if (hashtag.category === 'niche') score += 6;

  return Math.min(score, 100);
}

/**
 * Update hashtag status
 */
function updateHashtagStatus(hashtagId) {
  const hashtag = hashtags.get(hashtagId);
  if (!hashtag) return;

  // Get recent performance (last 10 uses)
  const recentPerformance = Array.from(hashtagPerformance.values())
    .filter(p => p.hashtagId === hashtagId)
    .sort((a, b) => b.recordedAt - a.recordedAt)
    .slice(0, 10);

  if (recentPerformance.length < 3) {
    hashtag.status = 'active';
    return;
  }

  // Calculate trend
  const recentAvgEngagement = recentPerformance.slice(0, 5)
    .reduce((sum, p) => sum + p.engagementRate, 0) / Math.min(5, recentPerformance.length);

  const olderAvgEngagement = recentPerformance.slice(5, 10)
    .reduce((sum, p) => sum + p.engagementRate, 0) / Math.max(1, recentPerformance.length - 5);

  const trendChange = ((recentAvgEngagement - olderAvgEngagement) / olderAvgEngagement) * 100;

  if (trendChange > 20) {
    hashtag.status = 'trending';
  } else if (trendChange < -20) {
    hashtag.status = 'declining';
  } else {
    hashtag.status = 'active';
  }

  // Check if inactive
  const daysSinceLastUse = hashtag.lastUsed ?
    (Date.now() - hashtag.lastUsed.getTime()) / (1000 * 60 * 60 * 24) : 999;

  if (daysSinceLastUse > 30) {
    hashtag.status = 'inactive';
  }
}

/**
 * Discover trending topics
 */
function discoverTrendingTopics({ platform, category, location }) {
  // Simulate trend discovery
  const topics = [
    { topic: '#AI', volume: 1250000, growth: 45, category: 'technology' },
    { topic: '#SustainableFashion', volume: 850000, growth: 38, category: 'fashion' },
    { topic: '#WFH', volume: 680000, growth: 25, category: 'lifestyle' },
    { topic: '#DigitalMarketing', volume: 520000, growth: 32, category: 'business' },
    { topic: '#FitnessMotivation', volume: 450000, growth: 28, category: 'health' },
    { topic: '#TravelTuesday', volume: 380000, growth: 22, category: 'travel' },
    { topic: '#FoodieFriday', volume: 320000, growth: 18, category: 'food' },
    { topic: '#TechNews', volume: 285000, growth: 35, category: 'technology' }
  ];

  let filteredTopics = topics;

  if (category) {
    filteredTopics = topics.filter(t => t.category === category);
  }

  const discovery = {
    id: topicIdCounter++,
    platform: platform || 'all',
    category: category || 'all',
    location: location || 'global',
    topics: filteredTopics.map((t, index) => ({
      rank: index + 1,
      topic: t.topic,
      volume: t.volume,
      growthRate: t.growth,
      category: t.category,
      relevanceScore: calculateRelevanceScore(t),
      estimatedReach: Math.floor(t.volume * 0.1),
      competition: t.volume > 500000 ? 'high' : t.volume > 100000 ? 'medium' : 'low'
    })),
    discoveredAt: new Date()
  };

  trendingTopics.set(discovery.id, discovery);
  return discovery;
}

/**
 * Calculate relevance score
 */
function calculateRelevanceScore(topic) {
  let score = 0;

  // Volume factor (0-40 points)
  if (topic.volume > 1000000) score += 40;
  else if (topic.volume > 500000) score += 30;
  else if (topic.volume > 100000) score += 20;
  else score += 10;

  // Growth factor (0-40 points)
  if (topic.growth > 40) score += 40;
  else if (topic.growth > 30) score += 30;
  else if (topic.growth > 20) score += 20;
  else score += 10;

  // Competition factor (0-20 points, inversely proportional)
  if (topic.volume < 100000) score += 20; // Low competition
  else if (topic.volume < 500000) score += 10; // Medium competition
  // High competition gets 0 points

  return Math.min(score, 100);
}

/**
 * Analyze trend
 */
function analyzeTrend({ keyword, timeframe }) {
  const trend = {
    id: trendIdCounter++,
    keyword,
    timeframe: timeframe || '7days',
    data: {
      currentVolume: Math.floor(Math.random() * 500000) + 50000,
      peakVolume: Math.floor(Math.random() * 750000) + 100000,
      avgVolume: Math.floor(Math.random() * 300000) + 50000,
      growth: Math.floor(Math.random() * 50) - 10, // -10% to +40%
      momentum: 'increasing' // increasing, stable, decreasing
    },
    timeline: generateTrendTimeline(timeframe),
    relatedHashtags: [
      `${keyword}Tips`,
      `${keyword}2024`,
      `${keyword}Community`,
      `Best${keyword}`
    ].map(h => `#${h}`),
    topInfluencers: [
      { username: '@influencer1', followers: 250000, posts: 15 },
      { username: '@influencer2', followers: 180000, posts: 12 },
      { username: '@influencer3', followers: 120000, posts: 10 }
    ],
    sentiment: {
      positive: 62,
      neutral: 28,
      negative: 10
    },
    recommendations: generateTrendRecommendations(keyword),
    analyzedAt: new Date()
  };

  // Set momentum based on growth
  if (trend.data.growth > 15) trend.data.momentum = 'increasing';
  else if (trend.data.growth < -5) trend.data.momentum = 'decreasing';
  else trend.data.momentum = 'stable';

  trends.set(trend.id, trend);
  return trend;
}

/**
 * Generate trend timeline
 */
function generateTrendTimeline(timeframe) {
  const days = timeframe === '30days' ? 30 : timeframe === '7days' ? 7 : 1;
  const timeline = [];

  for (let i = days; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    timeline.push({
      date,
      volume: Math.floor(Math.random() * 100000) + 10000,
      engagement: Math.floor(Math.random() * 50000) + 5000,
      posts: Math.floor(Math.random() * 5000) + 1000
    });
  }

  return timeline;
}

/**
 * Generate trend recommendations
 */
function generateTrendRecommendations(keyword) {
  return [
    {
      priority: 'high',
      action: 'create_content',
      suggestion: `Create timely content around ${keyword} while it's trending`,
      timing: 'Publish within next 24-48 hours'
    },
    {
      priority: 'medium',
      action: 'engage',
      suggestion: `Engage with top posts using ${keyword}`,
      timing: 'Ongoing'
    },
    {
      priority: 'medium',
      action: 'collaborate',
      suggestion: `Reach out to influencers posting about ${keyword}`,
      timing: 'This week'
    }
  ];
}

/**
 * Suggest hashtags
 */
function suggestHashtags(accountId, { contentText, category, targetReach }) {
  const suggestion = {
    id: suggestionIdCounter++,
    accountId,
    contentText: contentText.substring(0, 100),
    category: category || 'general',
    targetReach: targetReach || 'medium', // low, medium, high
    suggestions: {
      branded: [],
      trending: [],
      niche: [],
      general: []
    },
    recommendedMix: [],
    estimatedReach: {
      min: 0,
      max: 0,
      avg: 0
    },
    generatedAt: new Date()
  };

  // Get trending hashtags
  const allTrending = Array.from(trendingTopics.values())
    .flatMap(t => t.topics)
    .slice(0, 5);

  suggestion.suggestions.trending = allTrending.map(t => ({
    hashtag: t.topic,
    volume: t.volume,
    competition: t.competition,
    score: t.relevanceScore
  }));

  // Get account's best performing hashtags
  const accountHashtags = Array.from(hashtags.values())
    .filter(h => h.accountId === accountId && h.status === 'active')
    .sort((a, b) => b.performanceScore - a.performanceScore)
    .slice(0, 10);

  accountHashtags.forEach(h => {
    if (h.category === 'branded') {
      suggestion.suggestions.branded.push({
        hashtag: h.hashtag,
        score: h.performanceScore,
        avgReach: h.totalUses > 0 ? Math.floor(h.totalReach / h.totalUses) : 0
      });
    } else if (h.category === 'niche') {
      suggestion.suggestions.niche.push({
        hashtag: h.hashtag,
        score: h.performanceScore,
        avgReach: h.totalUses > 0 ? Math.floor(h.totalReach / h.totalUses) : 0
      });
    } else {
      suggestion.suggestions.general.push({
        hashtag: h.hashtag,
        score: h.performanceScore,
        avgReach: h.totalUses > 0 ? Math.floor(h.totalReach / h.totalUses) : 0
      });
    }
  });

  // Create recommended mix
  const mix = [];

  // Add 1-2 branded hashtags
  if (suggestion.suggestions.branded.length > 0) {
    mix.push(...suggestion.suggestions.branded.slice(0, 2));
  }

  // Add 1-2 trending hashtags (if not too competitive)
  const approachableTrending = suggestion.suggestions.trending
    .filter(t => targetReach === 'high' || t.competition !== 'high')
    .slice(0, 2);
  mix.push(...approachableTrending);

  // Add 2-3 niche hashtags
  if (suggestion.suggestions.niche.length > 0) {
    mix.push(...suggestion.suggestions.niche.slice(0, 3));
  }

  // Add 2-3 general hashtags
  if (suggestion.suggestions.general.length > 0) {
    mix.push(...suggestion.suggestions.general.slice(0, 3));
  }

  suggestion.recommendedMix = mix.slice(0, 10); // Max 10 hashtags

  // Calculate estimated reach
  if (mix.length > 0) {
    const reaches = mix.map(h => h.avgReach || h.volume * 0.001 || 0);
    suggestion.estimatedReach.min = Math.min(...reaches);
    suggestion.estimatedReach.max = Math.max(...reaches);
    suggestion.estimatedReach.avg = reaches.reduce((sum, r) => sum + r, 0) / reaches.length;
  }

  hashtagSuggestions.set(suggestion.id, suggestion);
  return suggestion;
}

/**
 * Get hashtag leaderboard
 */
function getHashtagLeaderboard(accountId, { sortBy = 'performanceScore', limit = 20 }) {
  const accountHashtags = Array.from(hashtags.values())
    .filter(h => h.accountId === accountId);

  const sorted = accountHashtags.sort((a, b) => {
    if (sortBy === 'performanceScore') return b.performanceScore - a.performanceScore;
    if (sortBy === 'reach') return b.totalReach - a.totalReach;
    if (sortBy === 'engagement') return b.totalEngagement - a.totalEngagement;
    if (sortBy === 'uses') return b.totalUses - a.totalUses;
    return b.avgEngagementRate - a.avgEngagementRate;
  }).slice(0, limit);

  return {
    accountId,
    sortBy,
    totalHashtags: accountHashtags.length,
    topHashtags: sorted.map((h, index) => ({
      rank: index + 1,
      hashtag: h.hashtag,
      category: h.category,
      uses: h.totalUses,
      reach: h.totalReach,
      engagement: h.totalEngagement,
      engagementRate: h.avgEngagementRate.toFixed(2),
      performanceScore: h.performanceScore,
      status: h.status
    }))
  };
}

/**
 * Get hashtag statistics
 */
function getHashtagStatistics(accountId) {
  const accountHashtags = Array.from(hashtags.values()).filter(h => h.accountId === accountId);
  const totalPerformance = Array.from(hashtagPerformance.values()).filter(p => {
    const hashtag = hashtags.get(p.hashtagId);
    return hashtag && hashtag.accountId === accountId;
  });

  if (accountHashtags.length === 0) {
    return { available: false, message: 'No hashtags tracked' };
  }

  return {
    accountId,
    totalHashtags: accountHashtags.length,
    activeHashtags: accountHashtags.filter(h => h.status === 'active').length,
    trendingHashtags: accountHashtags.filter(h => h.status === 'trending').length,
    decliningHashtags: accountHashtags.filter(h => h.status === 'declining').length,
    totalUses: accountHashtags.reduce((sum, h) => sum + h.totalUses, 0),
    totalReach: accountHashtags.reduce((sum, h) => sum + h.totalReach, 0),
    totalEngagement: accountHashtags.reduce((sum, h) => sum + h.totalEngagement, 0),
    avgPerformanceScore: (accountHashtags.reduce((sum, h) => sum + h.performanceScore, 0) / accountHashtags.length).toFixed(0),
    categoryBreakdown: {
      branded: accountHashtags.filter(h => h.category === 'branded').length,
      trending: accountHashtags.filter(h => h.category === 'trending').length,
      niche: accountHashtags.filter(h => h.category === 'niche').length,
      industry: accountHashtags.filter(h => h.category === 'industry').length,
      general: accountHashtags.filter(h => h.category === 'general').length
    },
    totalSuggestions: Array.from(hashtagSuggestions.values()).filter(s => s.accountId === accountId).length
  };
}

module.exports = {
  trackHashtag,
  updateHashtagPerformance,
  discoverTrendingTopics,
  analyzeTrend,
  suggestHashtags,
  getHashtagLeaderboard,
  getHashtagStatistics
};
