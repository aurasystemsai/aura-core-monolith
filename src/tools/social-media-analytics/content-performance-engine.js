/**
 * Content Performance Engine
 * Manages content analytics, performance scoring, and optimization recommendations
 */

// In-memory storage
const contentPosts = new Map();
const contentScores = new Map();
const bestTimeAnalysis = new Map();
const contentTypes = new Map();
const performanceBaselines = new Map();

let postIdCounter = 1;
let scoreIdCounter = 1;
let analysisIdCounter = 1;
let typeIdCounter = 1;
let baselineIdCounter = 1;

/**
 * Track content post
 */
function trackContentPost({ accountId, platform, postId, postType, content, mediaType, publishedAt, url, hashtags, mentions, location }) {
  const post = {
    id: postIdCounter++,
    accountId,
    platform,
    postId,
    postType, // feed, story, reel, video, carousel, live
    content: {
      text: content.text || '',
      mediaType, // image, video, carousel, text_only
      mediaCount: content.mediaCount || 1,
      hasHashtags: hashtags && hashtags.length > 0,
      hasMentions: mentions && mentions.length > 0,
      hasLocation: !!location,
      hashtags: hashtags || [],
      mentions: mentions || [],
      location: location || null,
      characterCount: content.text ? content.text.length : 0
    },
    metrics: {
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      views: 0,
      clicks: 0,
      reach: 0,
      impressions: 0,
      engagementRate: 0,
      viewRate: 0
    },
    publishedAt: new Date(publishedAt),
    url,
    performanceScore: 0,
    lastUpdatedAt: new Date()
  };

  contentPosts.set(post.id, post);

  // Calculate initial performance score
  calculateContentScore(post.id);

  return post;
}

/**
 * Update post metrics
 */
function updatePostMetrics(postId, metrics) {
  const post = contentPosts.get(postId);
  if (!post) {
    throw new Error('Post not found');
  }

  post.metrics = {
    ...post.metrics,
    ...metrics
  };

  // Calculate engagement rate
  const totalEngagement = post.metrics.likes + post.metrics.comments + post.metrics.shares + post.metrics.saves;
  post.metrics.engagementRate = post.metrics.reach > 0 ? (totalEngagement / post.metrics.reach) * 100 : 0;
  post.metrics.viewRate = post.metrics.impressions > 0 ? (post.metrics.views / post.metrics.impressions) * 100 : 0;

  post.lastUpdatedAt = new Date();

  // Recalculate performance score
  calculateContentScore(postId);

  return post;
}

/**
 * Calculate content performance score
 */
function calculateContentScore(postId) {
  const post = contentPosts.get(postId);
  if (!post) {
    throw new Error('Post not found');
  }

  let score = 0;
  const factors = [];

  // Engagement rate factor (0-40 points)
  if (post.metrics.engagementRate > 10) {
    score += 40;
    factors.push({ factor: 'engagement_rate', score: 40, status: 'viral' });
  } else if (post.metrics.engagementRate > 5) {
    score += 30;
    factors.push({ factor: 'engagement_rate', score: 30, status: 'excellent' });
  } else if (post.metrics.engagementRate > 2) {
    score += 20;
    factors.push({ factor: 'engagement_rate', score: 20, status: 'good' });
  } else if (post.metrics.engagementRate > 0.5) {
    score += 10;
    factors.push({ factor: 'engagement_rate', score: 10, status: 'fair' });
  } else {
    factors.push({ factor: 'engagement_rate', score: 0, status: 'poor' });
  }

  // Reach factor (0-25 points)
  if (post.metrics.reach > 10000) {
    score += 25;
    factors.push({ factor: 'reach', score: 25, status: 'viral' });
  } else if (post.metrics.reach > 5000) {
    score += 20;
    factors.push({ factor: 'reach', score: 20, status: 'high' });
  } else if (post.metrics.reach > 1000) {
    score += 15;
    factors.push({ factor: 'reach', score: 15, status: 'medium' });
  } else if (post.metrics.reach > 100) {
    score += 5;
    factors.push({ factor: 'reach', score: 5, status: 'low' });
  } else {
    factors.push({ factor: 'reach', score: 0, status: 'very_low' });
  }

  // Content quality factor (0-20 points)
  let qualityScore = 0;
  if (post.content.mediaType === 'video' || post.content.mediaType === 'carousel') qualityScore += 8;
  if (post.content.hasHashtags && post.content.hashtags.length >= 3) qualityScore += 5;
  if (post.content.hasMentions) qualityScore += 3;
  if (post.content.hasLocation) qualityScore += 2;
  if (post.content.characterCount >= 50 && post.content.characterCount <= 300) qualityScore += 2;

  score += qualityScore;
  factors.push({ factor: 'content_quality', score: qualityScore, status: qualityScore > 15 ? 'high' : qualityScore > 10 ? 'medium' : 'low' });

  // Saves/shares factor (0-15 points)
  const saveShareRate = post.metrics.reach > 0 ? ((post.metrics.saves + post.metrics.shares) / post.metrics.reach) * 100 : 0;
  if (saveShareRate > 2) {
    score += 15;
    factors.push({ factor: 'save_share', score: 15, status: 'excellent' });
  } else if (saveShareRate > 1) {
    score += 10;
    factors.push({ factor: 'save_share', score: 10, status: 'good' });
  } else if (saveShareRate > 0.5) {
    score += 5;
    factors.push({ factor: 'save_share', score: 5, status: 'fair' });
  } else {
    factors.push({ factor: 'save_share', score: 0, status: 'low' });
  }

  const contentScore = {
    id: scoreIdCounter++,
    postId,
    score: Math.min(score, 100),
    rating: score >= 80 ? 'viral' : score >= 60 ? 'excellent' : score >= 40 ? 'good' : score >= 20 ? 'fair' : 'poor',
    factors,
    recommendations: generateContentRecommendations(post, factors),
    calculatedAt: new Date()
  };

  contentScores.set(contentScore.id, contentScore);
  post.performanceScore = contentScore.score;

  return contentScore;
}

/**
 * Generate content recommendations
 */
function generateContentRecommendations(post, factors) {
  const recommendations = [];

  factors.forEach(factor => {
    if (factor.factor === 'engagement_rate' && factor.status === 'poor') {
      recommendations.push({
        priority: 'high',
        category: 'engagement',
        suggestion: 'Add a clear call-to-action and ask questions to encourage engagement',
        exampleActions: ['Add "Double tap if you agree"', 'End with a question', 'Create a poll or quiz']
      });
    }

    if (factor.factor === 'reach' && factor.status === 'low') {
      recommendations.push({
        priority: 'high',
        category: 'reach',
        suggestion: 'Use 5-10 relevant hashtags and post during peak hours',
        exampleActions: ['Research trending hashtags', 'Tag relevant accounts', 'Enable cross-posting']
      });
    }

    if (factor.factor === 'content_quality' && factor.score < 10) {
      const improvements = [];
      if (!post.content.hasHashtags) improvements.push('Add hashtags');
      if (post.content.mediaType === 'text_only') improvements.push('Include visual media');
      if (!post.content.hasLocation) improvements.push('Add location');
      if (post.content.characterCount < 50) improvements.push('Write more engaging caption');

      recommendations.push({
        priority: 'medium',
        category: 'quality',
        suggestion: 'Improve content quality elements',
        exampleActions: improvements
      });
    }

    if (factor.factor === 'save_share' && factor.status === 'low') {
      recommendations.push({
        priority: 'medium',
        category: 'value',
        suggestion: 'Create more shareable and saveable content (tips, tutorials, infographics)',
        exampleActions: ['Share actionable tips', 'Create "save this for later" content', 'Make carousels']
      });
    }
  });

  return recommendations;
}

/**
 * Analyze best time to post
 */
function analyzeBestTimeToPost(accountId, { lookbackDays = 30 }) {
  const posts = Array.from(contentPosts.values())
    .filter(p => p.accountId === accountId);

  if (posts.length < 10) {
    return {
      available: false,
      message: 'Need at least 10 posts to analyze best posting times',
      postsAnalyzed: posts.length
    };
  }

  // Analyze by hour and day of week
  const hourPerformance = {};
  const dayPerformance = {};

  posts.forEach(post => {
    const hour = post.publishedAt.getHours();
    const day = post.publishedAt.getDay(); // 0 = Sunday

    if (!hourPerformance[hour]) hourPerformance[hour] = { totalEngagement: 0, count: 0, avgEngagement: 0 };
    if (!dayPerformance[day]) dayPerformance[day] = { totalEngagement: 0, count: 0, avgEngagement: 0 };

    const engagement = post.metrics.likes + post.metrics.comments + post.metrics.shares;

    hourPerformance[hour].totalEngagement += engagement;
    hourPerformance[hour].count++;

    dayPerformance[day].totalEngagement += engagement;
    dayPerformance[day].count++;
  });

  // Calculate averages
  Object.keys(hourPerformance).forEach(hour => {
    hourPerformance[hour].avgEngagement = hourPerformance[hour].totalEngagement / hourPerformance[hour].count;
  });

  Object.keys(dayPerformance).forEach(day => {
    dayPerformance[day].avgEngagement = dayPerformance[day].totalEngagement / dayPerformance[day].count;
  });

  // Find best hours and days
  const bestHours = Object.entries(hourPerformance)
    .sort((a, b) => b[1].avgEngagement - a[1].avgEngagement)
    .slice(0, 3)
    .map(([hour, data]) => ({
      hour: parseInt(hour),
      hourLabel: `${hour}:00 - ${hour}:59`,
      avgEngagement: data.avgEngagement.toFixed(0),
      postsCount: data.count
    }));

  const bestDays = Object.entries(dayPerformance)
    .sort((a, b) => b[1].avgEngagement - a[1].avgEngagement)
    .slice(0, 3)
    .map(([day, data]) => ({
      day: parseInt(day),
      dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
      avgEngagement: data.avgEngagement.toFixed(0),
      postsCount: data.count
    }));

  const analysis = {
    id: analysisIdCounter++,
    accountId,
    lookbackDays,
    postsAnalyzed: posts.length,
    bestHours,
    bestDays,
    recommendations: {
      optimalPostingTimes: bestHours.map(h => h.hourLabel),
      optimalPostingDays: bestDays.map(d => d.dayName),
      suggestion: `Best performance on ${bestDays[0].dayName}s at ${bestHours[0].hourLabel}`
    },
    analyzedAt: new Date()
  };

  bestTimeAnalysis.set(analysis.id, analysis);
  return analysis;
}

/**
 * Get top performing content
 */
function getTopPerformingContent(accountId, { metric = 'engagementRate', limit = 10, postType = null, daysSince = 30 }) {
  const cutoffDate = new Date(Date.now() - daysSince * 24 * 60 * 60 * 1000);

  let posts = Array.from(contentPosts.values())
    .filter(p => p.accountId === accountId && p.publishedAt >= cutoffDate);

  if (postType) {
    posts = posts.filter(p => p.postType === postType);
  }

  // Sort by metric
  const sortedPosts = posts.sort((a, b) => {
    if (metric === 'engagementRate') return b.metrics.engagementRate - a.metrics.engagementRate;
    if (metric === 'reach') return b.metrics.reach - a.metrics.reach;
    if (metric === 'likes') return b.metrics.likes - a.metrics.likes;
    if (metric === 'comments') return b.metrics.comments - a.metrics.comments;
    if (metric === 'shares') return b.metrics.shares - a.metrics.shares;
    if (metric === 'saves') return b.metrics.saves - a.metrics.saves;
    return b.performanceScore - a.performanceScore;
  }).slice(0, limit);

  return {
    metric,
    postType: postType || 'all',
    daysSince,
    totalPosts: posts.length,
    topPosts: sortedPosts.map(p => ({
      id: p.id,
      postId: p.postId,
      postType: p.postType,
      content: p.content.text.substring(0, 100),
      metrics: p.metrics,
      performanceScore: p.performanceScore,
      publishedAt: p.publishedAt,
      url: p.url
    }))
  };
}

/**
 * Analyze content type performance
 */
function analyzeContentTypePerformance(accountId) {
  const posts = Array.from(contentPosts.values())
    .filter(p => p.accountId === accountId);

  if (posts.length === 0) {
    return { available: false, message: 'No posts found' };
  }

  const typeStats = {};

  posts.forEach(post => {
    const key = `${post.postType}_${post.content.mediaType}`;
    if (!typeStats[key]) {
      typeStats[key] = {
        postType: post.postType,
        mediaType: post.content.mediaType,
        count: 0,
        totalEngagement: 0,
        totalReach: 0,
        avgEngagementRate: 0,
        avgPerformanceScore: 0
      };
    }

    typeStats[key].count++;
    typeStats[key].totalEngagement += post.metrics.likes + post.metrics.comments + post.metrics.shares;
    typeStats[key].totalReach += post.metrics.reach;
  });

  // Calculate averages
  Object.keys(typeStats).forEach(key => {
    const stat = typeStats[key];
    stat.avgEngagementRate = stat.totalReach > 0 ? (stat.totalEngagement / stat.totalReach) * 100 : 0;

    const typePosts = posts.filter(p =>
      p.postType === stat.postType && p.content.mediaType === stat.mediaType
    );
    const totalScore = typePosts.reduce((sum, p) => sum + p.performanceScore, 0);
    stat.avgPerformanceScore = totalScore / typePosts.length;
  });

  const typeAnalysis = {
    id: typeIdCounter++,
    accountId,
    totalPosts: posts.length,
    typeBreakdown: Object.values(typeStats).sort((a, b) => b.avgPerformanceScore - a.avgPerformanceScore),
    recommendations: generateTypeRecommendations(Object.values(typeStats)),
    analyzedAt: new Date()
  };

  contentTypes.set(typeAnalysis.id, typeAnalysis);
  return typeAnalysis;
}

/**
 * Generate type recommendations
 */
function generateTypeRecommendations(typeStats) {
  const recommendations = [];

  const sortedByPerformance = [...typeStats].sort((a, b) => b.avgPerformanceScore - a.avgPerformanceScore);

  if (sortedByPerformance.length > 0) {
    const best = sortedByPerformance[0];
    recommendations.push({
      priority: 'high',
      category: 'content_mix',
      suggestion: `${best.postType} ${best.mediaType} performs best - increase this content type`,
      data: {
        postType: best.postType,
        mediaType: best.mediaType,
        avgScore: best.avgPerformanceScore.toFixed(0)
      }
    });
  }

  if (sortedByPerformance.length > 2) {
    const worst = sortedByPerformance[sortedByPerformance.length - 1];
    if (worst.avgPerformanceScore < 40) {
      recommendations.push({
        priority: 'medium',
        category: 'content_mix',
        suggestion: `${worst.postType} ${worst.mediaType} underperforming - reduce or optimize this content type`,
        data: {
          postType: worst.postType,
          mediaType: worst.mediaType,
          avgScore: worst.avgPerformanceScore.toFixed(0)
        }
      });
    }
  }

  return recommendations;
}

/**
 * Set performance baseline
 */
function setPerformanceBaseline(accountId, { metric, value, period }) {
  const baseline = {
    id: baselineIdCounter++,
    accountId,
    metric, // engagementRate, reach, likes, etc.
    value,
    period, // daily, weekly, monthly
    setAt: new Date()
  };

  performanceBaselines.set(baseline.id, baseline);
  return baseline;
}

/**
 * Get content statistics
 */
function getContentStatistics(accountId) {
  const posts = Array.from(contentPosts.values()).filter(p => p.accountId === accountId);
  const scores = Array.from(contentScores.values()).filter(s => {
    const post = contentPosts.get(s.postId);
    return post && post.accountId === accountId;
  });

  if (posts.length === 0) {
    return { available: false, message: 'No content tracked' };
  }

  const totalEngagement = posts.reduce((sum, p) =>
    sum + p.metrics.likes + p.metrics.comments + p.metrics.shares + p.metrics.saves, 0);
  const totalReach = posts.reduce((sum, p) => sum + p.metrics.reach, 0);
  const avgEngagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

  return {
    accountId,
    totalPosts: posts.length,
    totalEngagement,
    totalReach,
    avgEngagementRate: avgEngagementRate.toFixed(2),
    avgPerformanceScore: scores.length > 0 ?
      (scores.reduce((sum, s) => sum + s.score, 0) / scores.length).toFixed(0) : 0,
    postTypeBreakdown: getPostTypeBreakdown(posts),
    mediaTypeBreakdown: getMediaTypeBreakdown(posts),
    totalAnalyses: Array.from(bestTimeAnalysis.values()).filter(a => a.accountId === accountId).length
  };
}

function getPostTypeBreakdown(posts) {
  const breakdown = {};
  posts.forEach(p => {
    breakdown[p.postType] = (breakdown[p.postType] || 0) + 1;
  });
  return breakdown;
}

function getMediaTypeBreakdown(posts) {
  const breakdown = {};
  posts.forEach(p => {
    breakdown[p.content.mediaType] = (breakdown[p.content.mediaType] || 0) + 1;
  });
  return breakdown;
}

module.exports = {
  trackContentPost,
  updatePostMetrics,
  calculateContentScore,
  analyzeBestTimeToPost,
  getTopPerformingContent,
  analyzeContentTypePerformance,
  setPerformanceBaseline,
  getContentStatistics
};
