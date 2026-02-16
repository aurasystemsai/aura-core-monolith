/**
 * DISTRIBUTION & CHANNELS ENGINE
 * Multi-channel publishing, scheduling, cross-posting, syndication,
 * platform optimization, and distribution analytics
 */

const crypto = require('crypto');

// In-memory stores
const distributions = new Map();
const channels = new Map();
const schedules = new Map();
const syndications = new Map();
const platformOptimizations = new Map();
const distributionAnalytics = new Map();

// ================================================================
// CHANNEL MANAGEMENT
// ================================================================

function createChannel({ name, type, platform, config = {}, status = 'active' }) {
  const channelId = `channel-${crypto.randomBytes(4).toString('hex')}`;
  
  const channel = {
    channelId,
    name,
    type, // 'blog', 'email', 'social', 'partner', 'paid', 'syndication'
    platform, // 'wordpress', 'medium', 'linkedin', 'twitter', etc.
    config,
    status,
    publishCount: 0,
    lastPublishedAt: null,
    createdAt: new Date().toISOString()
  };
  
  channels.set(channelId, channel);
  return channel;
}

function getChannel(channelId) {
  return channels.get(channelId) || null;
}

function listChannels({ type, platform, status }) {
  let results = Array.from(channels.values());
  
  if (type) {
    results = results.filter(c => c.type === type);
  }
  
  if (platform) {
    results = results.filter(c => c.platform === platform);
  }
  
  if (status) {
    results = results.filter(c => c.status === status);
  }
  
  return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function updateChannel(channelId, updates) {
  const channel = channels.get(channelId);
  if (!channel) return null;
  
  Object.assign(channel, updates);
  channels.set(channelId, channel);
  
  return channel;
}

function deleteChannel(channelId) {
  // Remove associated distributions
  const channelDists = Array.from(distributions.values())
    .filter(d => d.channelId === channelId);
  
  channelDists.forEach(d => distributions.delete(d.distributionId));
  
  return channels.delete(channelId);
}

// ================================================================
// DISTRIBUTION PLANNING
// ================================================================

function createDistributionPlan(draftId, channelIds = [], scheduledAt = null) {
  const planId = `plan-${crypto.randomBytes(4).toString('hex')}`;
  
  const plan = {
    planId,
    draftId,
    channels: channelIds.map(channelId => {
      const channel = channels.get(channelId);
      return {
        channelId,
        name: channel?.name || 'Unknown',
        platform: channel?.platform || 'Unknown',
        status: 'pending',
        publishedAt: null,
        optimizedContent: null
      };
    }),
    scheduledAt,
    status: 'pending',
    readinessScore: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Calculate readiness
  plan.readinessScore = calculateReadiness(plan);
  
  distributions.set(planId, plan);
  return plan;
}

function getDistributionPlan(planId) {
  return distributions.get(planId) || null;
}

function listDistributionPlans({ draftId, status, limit = 50 }) {
  let results = Array.from(distributions.values());
  
  if (draftId) {
    results = results.filter(d => d.draftId === draftId);
  }
  
  if (status) {
    results = results.filter(d => d.status === status);
  }
  
  results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return results.slice(0, limit);
}

function updateDistributionPlan(planId, updates) {
  const plan = distributions.get(planId);
  if (!plan) return null;
  
  Object.assign(plan, updates);
  plan.updatedAt = new Date().toISOString();
  
  // Recalculate readiness if channels changed
  if (updates.channels) {
    plan.readinessScore = calculateReadiness(plan);
  }
  
  distributions.set(planId, plan);
  return plan;
}

function calculateReadiness(plan) {
  const readyChannels = plan.channels.filter(c => {
    const channel = channels.get(c.channelId);
    return channel && channel.status === 'active' && c.status === 'ready';
  });
  
  const readinessPercent = plan.channels.length > 0
    ? (readyChannels.length / plan.channels.length) * 100
    : 0;
  
  return Math.round(readinessPercent);
}

// ================================================================
// PUBLISHING
// ================================================================

function publishToChannel(planId, channelId, content) {
  const plan = distributions.get(planId);
  if (!plan) return null;
  
  const channel = channels.get(channelId);
  if (!channel) return null;
  
  // Optimize content for platform
  const optimized = optimizeForPlatform(content, channel.platform);
  
  // Update channel in plan
  const channelIndex = plan.channels.findIndex(c => c.channelId === channelId);
  if (channelIndex !== -1) {
    plan.channels[channelIndex].status = 'published';
    plan.channels[channelIndex].publishedAt = new Date().toISOString();
    plan.channels[channelIndex].optimizedContent = optimized;
  }
  
  // Update channel stats
  channel.publishCount++;
  channel.lastPublishedAt = new Date().toISOString();
  channels.set(channelId, channel);
  
  // Update plan status
  const allPublished = plan.channels.every(c => c.status === 'published');
  if (allPublished) {
    plan.status = 'published';
  }
  
  distributions.set(planId, plan);
  
  return {
    planId,
    channelId,
    status: 'published',
    optimizedContent: optimized,
    publishedAt: new Date().toISOString()
  };
}

function optimizeForPlatform(content, platform) {
  const optimizations = {
    linkedin: optimizeForLinkedIn(content),
    twitter: optimizeForTwitter(content),
    medium: optimizeForMedium(content),
    wordpress: optimizeForWordPress(content),
    email: optimizeForEmail(content),
    facebook: optimizeForFacebook(content)
  };
  
  return optimizations[platform] || content;
}

function optimizeForLinkedIn(content) {
  // LinkedIn prefers professional tone, 1300-2000 words
  return {
    title: content.title,
    body: content.body,
    hashtags: extractHashtags(content, 3),
    hook: generateLinkedInHook(content),
    cta: 'Share your thoughts in the comments 👇'
  };
}

function optimizeForTwitter(content) {
  // Twitter thread format
  const threads = chunkContent(content.body, 250);
  
  return {
    threads: threads.map((chunk, i) => ({
      position: i + 1,
      text: chunk,
      length: chunk.length
    })),
    hashtags: extractHashtags(content, 2),
    mentionSuggestions: []
  };
}

function optimizeForMedium(content) {
  // Medium prefers longer-form (1500+ words)
  return {
    title: content.title,
    subtitle: content.metaDescription || '',
    body: content.body,
    tags: extractHashtags(content, 5).map(h => h.replace('#', '')),
    seriesName: null
  };
}

function optimizeForWordPress(content) {
  return {
    title: content.title,
    content: content.body,
    excerpt: content.metaDescription,
    categories: [],
    tags: extractHashtags(content, 10).map(h => h.replace('#', '')),
    featuredImage: null
  };
}

function optimizeForEmail(content) {
  return {
    subject: content.title,
    preheader: content.metaDescription?.substring(0, 100) || '',
    body: content.body,
    cta: {
      text: 'Read full article',
      url: content.url || '#'
    }
  };
}

function optimizeForFacebook(content) {
  return {
    text: generateSocialSnippet(content, 500),
    link: content.url || '#',
    linkPreview: {
      title: content.title,
      description: content.metaDescription,
      image: content.image
    }
  };
}

function extractHashtags(content, limit = 5) {
  const text = `${content.title} ${content.body}`;
  const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
  
  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  const sorted = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
  
  return sorted.map(([word]) => `#${word}`);
}

function generateLinkedInHook(content) {
  const firstSentence = content.body.split(/[.!?]/)[0] || '';
  return firstSentence.length > 100 
    ? firstSentence.substring(0, 97) + '...'
    : firstSentence;
}

function chunkContent(text, maxLength) {
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const chunks = [];
  let currentChunk = '';
  
  sentences.forEach(sentence => {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += sentence + '. ';
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence + '. ';
    }
  });
  
  if (currentChunk) chunks.push(currentChunk.trim());
  
  return chunks;
}

function generateSocialSnippet(content, maxLength) {
  const snippet = `${content.title}\n\n${content.metaDescription || ''}`;
  
  return snippet.length > maxLength
    ? snippet.substring(0, maxLength - 3) + '...'
    : snippet;
}

// ================================================================
// SCHEDULING
// ================================================================

function scheduleDistribution(planId, scheduledAt, timezone = 'UTC') {
  const plan = distributions.get(planId);
  if (!plan) return null;
  
  const scheduleId = `schedule-${crypto.randomBytes(4).toString('hex')}`;
  
  const schedule = {
    scheduleId,
    planId,
    scheduledAt,
    timezone,
    status: 'scheduled',
    createdAt: new Date().toISOString()
  };
  
  schedules.set(scheduleId, schedule);
  
  plan.scheduledAt = scheduledAt;
  plan.status = 'scheduled';
  distributions.set(planId, plan);
  
  return schedule;
}

function getSchedule(scheduleId) {
  return schedules.get(scheduleId) || null;
}

function listSchedules({ status, upcoming = false }) {
  let results = Array.from(schedules.values());
  
  if (status) {
    results = results.filter(s => s.status === status);
  }
  
  if (upcoming) {
    const now = new Date();
    results = results.filter(s => new Date(s.scheduledAt) > now);
  }
  
  return results.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
}

function cancelSchedule(scheduleId) {
  const schedule = schedules.get(scheduleId);
  if (!schedule) return null;
  
  schedule.status = 'cancelled';
  schedules.set(scheduleId, schedule);
  
  // Update plan
  const plan = distributions.get(schedule.planId);
  if (plan) {
    plan.status = 'draft';
    plan.scheduledAt = null;
    distributions.set(schedule.planId, plan);
  }
  
  return schedule;
}

// ================================================================
// SYNDICATION
// ================================================================

function createSyndicationPartner({ name, url, apiKey, type = 'rss', status = 'active' }) {
  const partnerId = `partner-${crypto.randomBytes(4).toString('hex')}`;
  
  const partner = {
    partnerId,
    name,
    url,
    apiKey,
    type, // 'rss', 'api', 'manual'
    status,
    syndicationCount: 0,
    lastSyncedAt: null,
    createdAt: new Date().toISOString()
  };
  
  syndications.set(partnerId, partner);
  return partner;
}

function syndicateContent(draftId, partnerIds = []) {
  const syndicationId = `sync-${crypto.randomBytes(4).toString('hex')}`;
  
  const syndication = {
    syndicationId,
    draftId,
    partners: partnerIds.map(partnerId => {
      const partner = syndications.get(partnerId);
      return {
        partnerId,
        name: partner?.name || 'Unknown',
        status: 'pending',
        syncedAt: null
      };
    }),
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  // Mock syndication to partners
  syndication.partners.forEach(p => {
    const partner = syndications.get(p.partnerId);
    if (partner) {
      p.status = 'synced';
      p.syncedAt = new Date().toISOString();
      
      partner.syndicationCount++;
      partner.lastSyncedAt = new Date().toISOString();
      syndications.set(p.partnerId, partner);
    }
  });
  
  syndication.status = 'completed';
  
  return syndication;
}

function listSyndicationPartners({ status, type }) {
  let results = Array.from(syndications.values());
  
  if (status) {
    results = results.filter(s => s.status === status);
  }
  
  if (type) {
    results = results.filter(s => s.type === type);
  }
  
  return results.sort((a, b) => b.syndicationCount - a.syndicationCount);
}

// ================================================================
// DISTRIBUTION ANALYTICS
// ================================================================

function trackDistributionPerformance(planId, metrics) {
  const analyticsId = `analytics-${crypto.randomBytes(4).toString('hex')}`;
  
  const analytics = {
    analyticsId,
    planId,
    metrics: {
      impressions: metrics.impressions || 0,
      clicks: metrics.clicks || 0,
      shares: metrics.shares || 0,
      comments: metrics.comments || 0,
      conversions: metrics.conversions || 0
    },
    calculated: {
      ctr: metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0,
      engagementRate: metrics.impressions > 0 
        ? ((metrics.clicks + metrics.shares + metrics.comments) / metrics.impressions) * 100 
        : 0,
      conversionRate: metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0
    },
    timestamp: new Date().toISOString()
  };
  
  distributionAnalytics.set(analyticsId, analytics);
  return analytics;
}

function getDistributionAnalytics(planId) {
  return Array.from(distributionAnalytics.values())
    .filter(a => a.planId === planId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function aggregateChannelPerformance(channelId, startDate, endDate) {
  const channelPlans = Array.from(distributions.values())
    .filter(d => d.channels.some(c => c.channelId === channelId && c.status === 'published'));
  
  const analytics = channelPlans.map(p => distributionAnalytics.get(p.planId)).filter(Boolean);
  
  const totals = analytics.reduce((acc, a) => ({
    impressions: acc.impressions + (a.metrics.impressions || 0),
    clicks: acc.clicks + (a.metrics.clicks || 0),
    shares: acc.shares + (a.metrics.shares || 0),
    comments: acc.comments + (a.metrics.comments || 0),
    conversions: acc.conversions + (a.metrics.conversions || 0)
  }), { impressions: 0, clicks: 0, shares: 0, comments: 0, conversions: 0 });
  
  return {
    channelId,
    period: { startDate, endDate },
    publishCount: channelPlans.length,
    totals,
    averages: {
      impressions: Math.round(totals.impressions / channelPlans.length) || 0,
      clicks: Math.round(totals.clicks / channelPlans.length) || 0,
      ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
    }
  };
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Channel management
  createChannel,
  getChannel,
  listChannels,
  updateChannel,
  deleteChannel,
  
  // Distribution planning
  createDistributionPlan,
  getDistributionPlan,
  listDistributionPlans,
  updateDistributionPlan,
  calculateReadiness,
  
  // Publishing
  publishToChannel,
  optimizeForPlatform,
  
  // Scheduling
  scheduleDistribution,
  getSchedule,
  listSchedules,
  cancelSchedule,
  
  // Syndication
  createSyndicationPartner,
  syndicateContent,
  listSyndicationPartners,
  
  // Analytics
  trackDistributionPerformance,
  getDistributionAnalytics,
  aggregateChannelPerformance,
  
  // Internal stores
  distributions,
  channels,
  schedules,
  syndications,
  platformOptimizations,
  distributionAnalytics
};
