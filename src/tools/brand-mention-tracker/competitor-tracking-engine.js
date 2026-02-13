/**
 * Brand Mention Tracker V2 - Competitor Tracking Engine
 * Multi-competitor monitoring, share of voice, and comparative analysis
 */

const competitors = new Map();
const competitorMentions = new Map();
const shareOfVoice = new Map();
const comparativeData = new Map();

/**
 * Add competitor to track
 */
async function addCompetitor(competitorData) {
  const competitorId = `competitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const competitor = {
    id: competitorId,
    name: competitorData.name,
    aliases: competitorData.aliases || [],
    website: competitorData.website || null,
    category: competitorData.category || 'general',
    socialProfiles: competitorData.socialProfiles || {},
    trackingEnabled: competitorData.trackingEnabled !== false,
    addedAt: new Date().toISOString(),
    lastUpdatedAt: null,
    mentionCount: 0
  };
  
  competitors.set(competitorId, competitor);
  return competitor;
}

/**
 * Track competitor mention
 */
async function trackCompetitorMention(competitorId, mentionId, mentionData) {
  const trackId = `comp_mention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const mention = {
    id: trackId,
    competitorId,
    mentionId,
    content: mentionData.content,
    sentiment: mentionData.sentiment || null,
    reach: mentionData.reach || 0,
    engagement: mentionData.engagement || 0,
    sourceType: mentionData.sourceType,
    publishedAt: mentionData.publishedAt || new Date().toISOString(),
    capturedAt: new Date().toISOString()
  };
  
  competitorMentions.set(trackId, mention);
  
  // Update competitor stats
  const competitor = competitors.get(competitorId);
  if (competitor) {
    competitor.mentionCount++;
    competitor.lastUpdatedAt = new Date().toISOString();
    competitors.set(competitorId, competitor);
  }
  
  // Update share of voice
  updateShareOfVoice(competitorId);
  
  return mention;
}

/**
 * Calculate share of voice
 */
async function calculateShareOfVoice(brandName, period = 'week') {
  const periodStart = getPeriodStart(period);
  
  // Get brand mentions
  const brandMentions = Array.from(competitorMentions.values())
    .filter(m => new Date(m.publishedAt) >= periodStart);
  
  const totalMentions = brandMentions.length;
  
  // Calculate per competitor
  const sovData = {};
  
  for (const [compId, comp] of competitors.entries()) {
    const compMentions = brandMentions.filter(m => m.competitorId === compId);
    const count = compMentions.length;
    const percentage = totalMentions > 0 ? (count / totalMentions) * 100 : 0;
    const totalReach = compMentions.reduce((sum, m) => sum + m.reach, 0);
    const avgSentiment = compMentions.length > 0
      ? compMentions.reduce((sum, m) => sum + (m.sentiment || 0), 0) / compMentions.length
      : 0;
    
    sovData[compId] = {
      competitorId: compId,
      competitorName: comp.name,
      mentions: count,
      percentage: parseFloat(percentage.toFixed(2)),
      reach: totalReach,
      averageSentiment: parseFloat(avgSentiment.toFixed(3))
    };
  }
  
  const sovId = `sov_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const sov = {
    id: sovId,
    period,
    periodStart: periodStart.toISOString(),
    periodEnd: new Date().toISOString(),
    totalMentions,
    competitors: sovData,
    calculatedAt: new Date().toISOString()
  };
  
  shareOfVoice.set(sovId, sov);
  return sov;
}

/**
 * Get period start date
 */
function getPeriodStart(period) {
  const now = new Date();
  const periodDays = {
    day: 1,
    week: 7,
    month: 30,
    quarter: 90
  };
  
  const days = periodDays[period] || 7;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

/**
 * Update share of voice cache
 */
function updateShareOfVoice(competitorId) {
  const today = new Date().toISOString().split('T')[0];
  const key = `${competitorId}:${today}`;
  
  const sov = shareOfVoice.get(key) || {
    competitorId,
    date: today,
    mentions: 0
  };
  
  sov.mentions++;
  shareOfVoice.set(key, sov);
}

/**
 * Compare competitors by metric
 */
async function compareCompetitors(metric, period = 'week') {
  const periodStart = getPeriodStart(period);
  
  const mentions = Array.from(competitorMentions.values())
    .filter(m => new Date(m.publishedAt) >= periodStart);
  
  const comparison = [];
  
  for (const [compId, comp] of competitors.entries()) {
    const compMentions = mentions.filter(m => m.competitorId === compId);
    
    let value;
    switch (metric) {
      case 'mentions':
        value = compMentions.length;
        break;
      case 'reach':
        value = compMentions.reduce((sum, m) => sum + m.reach, 0);
        break;
      case 'engagement':
        value = compMentions.reduce((sum, m) => sum + m.engagement, 0);
        break;
      case 'sentiment':
        value = compMentions.length > 0
          ? compMentions.reduce((sum, m) => sum + (m.sentiment || 0), 0) / compMentions.length
          : 0;
        break;
      default:
        value = compMentions.length;
    }
    
    comparison.push({
      competitorId: compId,
      competitorName: comp.name,
      metric,
      value: parseFloat(value.toFixed(2)),
      rank: 0 // will be calculated
    });
  }
  
  // Sort and assign ranks
  comparison.sort((a, b) => b.value - a.value);
  comparison.forEach((item, index) => {
    item.rank = index + 1;
  });
  
  return comparison;
}

/**
 * Get competitor sentiment comparison
 */
async function getCompetitorSentimentComparison(period = 'week') {
  const periodStart = getPeriodStart(period);
  
  const mentions = Array.from(competitorMentions.values())
    .filter(m => new Date(m.publishedAt) >= periodStart);
  
  const sentiments = {};
  
  for (const [compId, comp] of competitors.entries()) {
    const compMentions = mentions.filter(m => m.competitorId === compId);
    
    const positive = compMentions.filter(m => m.sentiment > 0.2).length;
    const neutral = compMentions.filter(m => m.sentiment >= -0.2 && m.sentiment <= 0.2).length;
    const negative = compMentions.filter(m => m.sentiment < -0.2).length;
    const total = compMentions.length;
    
    sentiments[compId] = {
      competitorId: compId,
      competitorName: comp.name,
      positive,
      positivePercentage: total > 0 ? (positive / total) * 100 : 0,
      neutral,
      neutralPercentage: total > 0 ? (neutral / total) * 100 : 0,
      negative,
      negativePercentage: total > 0 ? (negative / total) * 100 : 0,
      total,
      averageSentiment: total > 0
        ? compMentions.reduce((sum, m) => sum + (m.sentiment || 0), 0) / total
        : 0
    };
  }
  
  return sentiments;
}

/**
 * Track competitor features mentioned
 */
async function trackFeatureMentions(competitorId, features) {
  const trackId = `feature_track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const data = {
    id: trackId,
    competitorId,
    features: features.map(f => ({
      name: f.name,
      mentionCount: f.mentionCount || 0,
      sentiment: f.sentiment || null,
      context: f.context || []
    })),
    trackedAt: new Date().toISOString()
  };
  
  comparativeData.set(trackId, data);
  return data;
}

/**
 * Get competitive positioning analysis
 */
async function getCompetitivePositioning(period = 'month') {
  const periodStart = getPeriodStart(period);
  
  const mentions = Array.from(competitorMentions.values())
    .filter(m => new Date(m.publishedAt) >= periodStart);
  
  const positioning = {};
  
  for (const [compId, comp] of competitors.entries()) {
    const compMentions = mentions.filter(m => m.competitorId === compId);
    
    const totalReach = compMentions.reduce((sum, m) => sum + m.reach, 0);
    const totalEngagement = compMentions.reduce((sum, m) => sum + m.engagement, 0);
    const avgSentiment = compMentions.length > 0
      ? compMentions.reduce((sum, m) => sum + (m.sentiment || 0), 0) / compMentions.length
      : 0;
    
    // Calculate positioning score (0-100)
    const visibilityScore = Math.min(100, (compMentions.length / 100) * 50);
    const sentimentScore = ((avgSentiment + 1) / 2) * 30; // normalize -1 to 1 range to 0-30
    const engagementScore = Math.min(20, (totalEngagement / 10000) * 20);
    
    const positioningScore = visibilityScore + sentimentScore + engagementScore;
    
    positioning[compId] = {
      competitorId: compId,
      competitorName: comp.name,
      mentions: compMentions.length,
      reach: totalReach,
      engagement: totalEngagement,
      averageSentiment: parseFloat(avgSentiment.toFixed(3)),
      positioningScore: parseFloat(positioningScore.toFixed(2)),
      category: getPositioningCategory(positioningScore)
    };
  }
  
  return positioning;
}

/**
 * Get positioning category
 */
function getPositioningCategory(score) {
  if (score >= 80) return 'market leader';
  if (score >= 60) return 'strong contender';
  if (score >= 40) return 'emerging player';
  if (score >= 20) return 'niche player';
  return 'low visibility';
}

/**
 * Get competitors list
 */
async function getCompetitors(filters = {}) {
  let results = Array.from(competitors.values());
  
  if (filters.category) {
    results = results.filter(c => c.category === filters.category);
  }
  
  if (filters.trackingEnabled !== undefined) {
    results = results.filter(c => c.trackingEnabled === filters.trackingEnabled);
  }
  
  results.sort((a, b) => b.mentionCount - a.mentionCount);
  
  return results;
}

/**
 * Get competitor statistics
 */
async function getCompetitorStatistics() {
  const allMentions = Array.from(competitorMentions.values());
  
  // Mentions by competitor
  const byCompetitor = {};
  for (const [compId, comp] of competitors.entries()) {
    byCompetitor[comp.name] = allMentions.filter(m => m.competitorId === compId).length;
  }
  
  // Recent share of voice (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentMentions = allMentions.filter(m => new Date(m.publishedAt) >= weekAgo);
  
  return {
    totalCompetitors: competitors.size,
    activeCompetitors: Array.from(competitors.values()).filter(c => c.trackingEnabled).length,
    totalMentions: allMentions.length,
    recentMentions: recentMentions.length,
    mentionsByCompetitor: byCompetitor,
    averageReach: allMentions.reduce((sum, m) => sum + m.reach, 0) / allMentions.length || 0,
    averageSentiment: allMentions.reduce((sum, m) => sum + (m.sentiment || 0), 0) / allMentions.length || 0
  };
}

module.exports = {
  addCompetitor,
  trackCompetitorMention,
  calculateShareOfVoice,
  compareCompetitors,
  getCompetitorSentimentComparison,
  trackFeatureMentions,
  getCompetitivePositioning,
  getCompetitors,
  getCompetitorStatistics
};
