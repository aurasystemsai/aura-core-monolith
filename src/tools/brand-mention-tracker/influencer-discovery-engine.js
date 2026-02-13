/**
 * Brand Mention Tracker V2 - Influencer Discovery Engine
 * Identify and track influencers, measure authority, and manage relationships
 */

const influencers = new Map();
const influencerMentions = new Map();
const relationships = new Map();
const engagementOpportunities = new Map();

/**
 * Identify influencer from mention
 */
async function identifyInfluencer(mentionData) {
  // Check if already tracked
  const existing = Array.from(influencers.values())
    .find(i => i.authorProfile === mentionData.authorProfile || i.username === mentionData.author);
  
  if (existing) {
    return { isNew: false, influencer: existing };
  }
  
  // Calculate authority score
  const authorityScore = calculateAuthorityScore(mentionData);
  
  // Only track if meets minimum authority threshold
  if (authorityScore < 30) {
    return { isNew: false, influencer: null, reason: 'Below authority threshold' };
  }
  
  const influencerId = `influencer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const influencer = {
    id: influencerId,
    username: mentionData.author,
    displayName: mentionData.authorDisplayName || mentionData.author,
    profileUrl: mentionData.authorProfile,
    platform: mentionData.sourceType,
    authorityScore,
    reach: mentionData.reach || 0,
    followers: mentionData.followers || 0,
    following: mentionData.following || 0,
    totalPosts: mentionData.totalPosts || 0,
    engagementRate: calculateEngagementRate(mentionData),
    demographics: {
      primaryAudience: mentionData.demographics?.primaryAudience || 'unknown',
      topCountries: mentionData.demographics?.topCountries || [],
      ageGroups: mentionData.demographics?.ageGroups || {}
    },
    topics: mentionData.topics || [],
    sentiment: null, // to be calculated from mentions
    relationshipStatus: 'unknown', // advocate, neutral, critic
    firstSeenAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    mentionCount: 0,
    isVerified: mentionData.isVerified || false
  };
  
  influencers.set(influencerId, influencer);
  
  return { isNew: true, influencer };
}

/**
 * Calculate authority score (0-100)
 */
function calculateAuthorityScore(data) {
  let score = 0;
  
  // Follower count (max 40 points)
  if (data.followers > 1000000) score += 40;
  else if (data.followers > 100000) score += 30;
  else if (data.followers > 10000) score += 20;
  else if (data.followers > 1000) score += 10;
  else score += 5;
  
  // Engagement rate (max 25 points)
  const engagementRate = calculateEngagementRate(data);
  if (engagementRate > 10) score += 25;
  else if (engagementRate > 5) score += 20;
  else if (engagementRate > 2) score += 15;
  else if (engagementRate > 1) score += 10;
  else score += 5;
  
  // Verified status (15 points)
  if (data.isVerified) score += 15;
  
  // Content quality based on reach (max 20 points)
  if (data.reach > 500000) score += 20;
  else if (data.reach > 100000) score += 15;
  else if (data.reach > 10000) score += 10;
  else score += 5;
  
  return Math.min(100, score);
}

/**
 * Calculate engagement rate
 */
function calculateEngagementRate(data) {
  if (!data.followers || data.followers === 0) return 0;
  
  const engagement = (data.engagement?.likes || 0) + 
                    (data.engagement?.shares || 0) + 
                    (data.engagement?.comments || 0);
  
  return parseFloat(((engagement / data.followers) * 100).toFixed(2));
}

/**
 * Track influencer mention
 */
async function trackInfluencerMention(influencerId, mentionId, mentionData) {
  const trackId = `inf_mention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const mention = {
    id: trackId,
    influencerId,
    mentionId,
    content: mentionData.content,
    sentiment: mentionData.sentiment || null,
    reach: mentionData.reach || 0,
    engagement: {
      likes: mentionData.engagement?.likes || 0,
      shares: mentionData.engagement?.shares || 0,
      comments: mentionData.engagement?.comments || 0
    },
    publishedAt: mentionData.publishedAt || new Date().toISOString(),
    trackedAt: new Date().toISOString()
  };
  
  influencerMentions.set(trackId, mention);
  
  // Update influencer stats
  const influencer = influencers.get(influencerId);
  if (influencer) {
    influencer.mentionCount++;
    influencer.lastActiveAt = new Date().toISOString();
    
    // Update average sentiment
    updateInfluencerSentiment(influencerId);
    
    // Update relationship status
    updateRelationshipStatus(influencerId);
    
    influencers.set(influencerId, influencer);
  }
  
  return mention;
}

/**
 * Update influencer average sentiment
 */
function updateInfluencerSentiment(influencerId) {
  const mentions = Array.from(influencerMentions.values())
    .filter(m => m.influencerId === influencerId && m.sentiment !== null);
  
  if (mentions.length === 0) return;
  
  const avgSentiment = mentions.reduce((sum, m) => sum + m.sentiment, 0) / mentions.length;
  
  const influencer = influencers.get(influencerId);
  if (influencer) {
    influencer.sentiment = parseFloat(avgSentiment.toFixed(3));
    influencers.set(influencerId, influencer);
  }
}

/**
 * Update relationship status based on sentiment
 */
function updateRelationshipStatus(influencerId) {
  const influencer = influencers.get(influencerId);
  if (!influencer || influencer.sentiment === null) return;
  
  let status;
  if (influencer.sentiment > 0.3) status = 'advocate';
  else if (influencer.sentiment < -0.3) status = 'critic';
  else status = 'neutral';
  
  influencer.relationshipStatus = status;
  influencers.set(influencerId, influencer);
  
  // Track relationship change
  trackRelationshipChange(influencerId, status);
}

/**
 * Track relationship status change
 */
function trackRelationshipChange(influencerId, newStatus) {
  const relationshipId = `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const relationship = {
    id: relationshipId,
    influencerId,
    status: newStatus,
    changedAt: new Date().toISOString()
  };
  
  relationships.set(relationshipId, relationship);
}

/**
 * Get influencers by criteria
 */
async function getInfluencers(filters = {}) {
  let results = Array.from(influencers.values());
  
  // Filter by authority score
  if (filters.minAuthority) {
    results = results.filter(i => i.authorityScore >= filters.minAuthority);
  }
  
  // Filter by reach
  if (filters.minReach) {
    results = results.filter(i => i.reach >= filters.minReach);
  }
  
  // Filter by relationship status
  if (filters.relationshipStatus) {
    results = results.filter(i => i.relationshipStatus === filters.relationshipStatus);
  }
  
  // Filter by platform
  if (filters.platform) {
    results = results.filter(i => i.platform === filters.platform);
  }
  
  // Filter by verified status
  if (filters.isVerified !== undefined) {
    results = results.filter(i => i.isVerified === filters.isVerified);
  }
  
  // Sort
  const sortBy = filters.sortBy || 'authorityScore';
  results.sort((a, b) => b[sortBy] - a[sortBy]);
  
  // Pagination
  const limit = filters.limit || 50;
  const offset = filters.offset || 0;
  
  return {
    influencers: results.slice(offset, offset + limit),
    total: results.length,
    offset,
    limit
  };
}

/**
 * Get influencer profile with analytics
 */
async function getInfluencerProfile(influencerId) {
  const influencer = influencers.get(influencerId);
  if (!influencer) {
    throw new Error('Influencer not found');
  }
  
  const mentions = Array.from(influencerMentions.values())
    .filter(m => m.influencerId === influencerId);
  
  const totalReach = mentions.reduce((sum, m) => sum + m.reach, 0);
  const totalEngagement = mentions.reduce((sum, m) => 
    sum + m.engagement.likes + m.engagement.shares + m.engagement.comments, 0
  );
  
  const sentimentBreakdown = {
    positive: mentions.filter(m => m.sentiment > 0.2).length,
    neutral: mentions.filter(m => m.sentiment >= -0.2 && m.sentiment <= 0.2).length,
    negative: mentions.filter(m => m.sentiment < -0.2).length
  };
  
  return {
    ...influencer,
    analytics: {
      totalMentions: mentions.length,
      totalReach,
      totalEngagement,
      averageEngagement: mentions.length > 0 ? totalEngagement / mentions.length : 0,
      sentimentBreakdown
    }
  };
}

/**
 * Detect engagement opportunities
 */
async function detectEngagementOpportunities(options = {}) {
  const minAuthority = options.minAuthority || 50;
  const recentDays = options.recentDays || 7;
  
  const cutoffDate = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);
  
  const opportunities = [];
  
  for (const [infId, influencer] of influencers.entries()) {
    if (influencer.authorityScore < minAuthority) continue;
    
    const recentMentions = Array.from(influencerMentions.values())
      .filter(m => 
        m.influencerId === infId && 
        new Date(m.publishedAt) >= cutoffDate
      );
    
    if (recentMentions.length === 0) continue;
    
    const avgSentiment = recentMentions.reduce((sum, m) => sum + (m.sentiment || 0), 0) / recentMentions.length;
    const totalEngagement = recentMentions.reduce((sum, m) => 
      sum + m.engagement.likes + m.engagement.shares + m.engagement.comments, 0
    );
    
    let opportunityType;
    let priority;
    let suggestedAction;
    
    if (avgSentiment > 0.5) {
      opportunityType = 'advocate_amplification';
      priority = 'high';
      suggestedAction = 'Reach out to thank and possibly collaborate';
    } else if (avgSentiment < -0.5) {
      opportunityType = 'crisis_management';
      priority = 'urgent';
      suggestedAction = 'Address concerns immediately';
    } else if (totalEngagement > 10000) {
      opportunityType = 'high_engagement';
      priority = 'medium';
      suggestedAction = 'Engage in conversation to build relationship';
    } else {
      continue;
    }
    
    const opportunityId = `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const opportunity = {
      id: opportunityId,
      influencerId: infId,
      influencerName: influencer.displayName,
      type: opportunityType,
      priority,
      suggestedAction,
      recentMentions: recentMentions.length,
      averageSentiment: parseFloat(avgSentiment.toFixed(3)),
      totalEngagement,
      detectedAt: new Date().toISOString()
    };
    
    opportunities.push(opportunity);
    engagementOpportunities.set(opportunityId, opportunity);
  }
  
  // Sort by priority and engagement
  opportunities.sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return b.totalEngagement - a.totalEngagement;
  });
  
  return opportunities;
}

/**
 * Get influencer statistics
 */
async function getInfluencerStatistics() {
  const allInfluencers = Array.from(influencers.values());
  const allMentions = Array.from(influencerMentions.values());
  
  const byRelationship = {
    advocate: allInfluencers.filter(i => i.relationshipStatus === 'advocate').length,
    neutral: allInfluencers.filter(i => i.relationshipStatus === 'neutral').length,
    critic: allInfluencers.filter(i => i.relationshipStatus === 'critic').length,
    unknown: allInfluencers.filter(i => i.relationshipStatus === 'unknown').length
  };
  
  const byPlatform = {};
  allInfluencers.forEach(i => {
    byPlatform[i.platform] = (byPlatform[i.platform] || 0) + 1;
  });
  
  return {
    totalInfluencers: allInfluencers.length,
    totalMentions: allMentions.length,
    relationshipBreakdown: byRelationship,
    platformBreakdown: byPlatform,
    verifiedInfluencers: allInfluencers.filter(i => i.isVerified).length,
    averageAuthority: allInfluencers.reduce((sum, i) => sum + i.authorityScore, 0) / allInfluencers.length || 0,
    totalReach: allInfluencers.reduce((sum, i) => sum + i.reach, 0),
    averageEngagementRate: allInfluencers.reduce((sum, i) => sum + i.engagementRate, 0) / allInfluencers.length || 0
  };
}

module.exports = {
  identifyInfluencer,
  trackInfluencerMention,
  getInfluencers,
  getInfluencerProfile,
  detectEngagementOpportunities,
  getInfluencerStatistics
};
