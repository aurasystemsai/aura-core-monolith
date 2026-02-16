const crypto = require('crypto');

// ============================================================================
// DATA STORES
// ============================================================================

const plans = new Map();
const schedules = new Map();
const publications = new Map();
const syndicationRules = new Map();
const distributionHistory = [];
const channelAnalytics = new Map();
const abTests = new Map();
const audienceSegments = new Map();

function generateId(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

// ============================================================================
// DISTRIBUTION PLAN MANAGEMENT
// ============================================================================

function createDistributionPlan(data = {}) {
  const planId = data.planId || generateId('plan');
  const channelsList = data.channels || [
    { id: generateId('ch'), channel: 'Blog', status: 'ready', owner: 'Content', publishAt: new Date().toISOString(), priority: 'high' },
    { id: generateId('ch'), channel: 'Email', status: 'draft', owner: 'Lifecycle', publishAt: new Date(Date.now() + 3600e3).toISOString(), priority: 'medium' },
    { id: generateId('ch'), channel: 'LinkedIn', status: 'queued', owner: 'Social', publishAt: new Date(Date.now() + 7200e3).toISOString(), priority: 'medium' },
  ];
  const plan = {
    planId,
    briefId: data.briefId || null,
    topic: data.topic || 'Untitled distribution plan',
    channels: channelsList,
    targetAudience: data.targetAudience || 'B2B decision makers',
    guardrails: data.guardrails || ['No PII', 'Legal-approved messaging'],
    targeting: data.targeting || { region: 'NA', persona: 'Demand Gen', language: 'EN' },
    objectives: data.objectives || [],
    metrics: data.metrics || { reach: 0, engagement: 0, conversions: 0 },
    status: data.status || 'draft',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  plans.set(planId, plan);
  return plan;
}

function getDistributionPlan(planId) {
  if (!plans.has(planId)) {
    throw new Error('Distribution plan not found');
  }
  return plans.get(planId);
}

function updateDistributionPlan(planId, updates) {
  const plan = getDistributionPlan(planId);
  const updated = { ...plan, ...updates, updatedAt: new Date().toISOString() };
  plans.set(planId, updated);
  return updated;
}

function deleteDistributionPlan(planId) {
  if (!plans.has(planId)) throw new Error('Distribution plan not found');
  plans.delete(planId);
  return { success: true, message: 'Distribution plan deleted' };
}

function listPlans(filters = {}) {
  let results = Array.from(plans.values());
  if (filters.status) results = results.filter(p => p.status === filters.status);
  if (filters.briefId) results = results.filter(p => p.briefId === filters.briefId);
  return results;
}

// ============================================================================
// CHANNEL MANAGEMENT
// ============================================================================

function addChannel(planId, channelData) {
  const plan = getDistributionPlan(planId);
  const channel = {
    id: generateId('ch'),
    channel: channelData.channel || 'NewChannel',
    status: channelData.status || 'draft',
    owner: channelData.owner || 'Unassigned',
    publishAt: channelData.publishAt || new Date().toISOString(),
    priority: channelData.priority || 'medium',
    customization: channelData.customization || {},
    metrics: channelData.metrics || { reach: 0, clicks: 0, conversions: 0 }
  };
  plan.channels = plan.channels || [];
  plan.channels.push(channel);
  return updateDistributionPlan(planId, { channels: plan.channels });
}

function updateChannel(planId, channelId, updates) {
  const plan = getDistributionPlan(planId);
  const channelIndex = plan.channels.findIndex(ch => ch.id === channelId);
  if (channelIndex === -1) throw new Error('Channel not found');
  plan.channels[channelIndex] = { ...plan.channels[channelIndex], ...updates };
  return updateDistributionPlan(planId, { channels: plan.channels });
}

function removeChannel(planId, channelId) {
  const plan = getDistributionPlan(planId);
  plan.channels = plan.channels.filter(ch => ch.id !== channelId);
  return updateDistributionPlan(planId, { channels: plan.channels });
}

function activateChannel(planId, channelName) {
  const plan = getDistributionPlan(planId);
  plan.channels = plan.channels.map(ch => ch.channel === channelName ? { ...ch, status: 'ready' } : ch);
  return updateDistributionPlan(planId, { channels: plan.channels });
}

function listChannels(planId) {
  const plan = getDistributionPlan(planId);
  return plan.channels || [];
}

// ============================================================================
// SCHEDULING
// ============================================================================

function createSchedule(data = {}) {
  const scheduleId = generateId('schedule');
  const schedule = {
    id: scheduleId,
    planId: data.planId,
    channelId: data.channelId,
    publishAt: data.publishAt || new Date().toISOString(),
    timezone: data.timezone || 'UTC',
    recurrence: data.recurrence || null,
    endDate: data.endDate || null,
    status: 'scheduled',
    createdAt: new Date().toISOString()
  };
  schedules.set(scheduleId, schedule);
  return schedule;
}

function getSchedule(scheduleId) {
  if (!schedules.has(scheduleId)) throw new Error('Schedule not found');
  return schedules.get(scheduleId);
}

function updateSchedule(scheduleId, updates) {
  const schedule = getSchedule(scheduleId);
  const updated = { ...schedule, ...updates, updatedAt: new Date().toISOString() };
  schedules.set(scheduleId, updated);
  return updated;
}

function cancelSchedule(scheduleId) {
  const schedule = getSchedule(scheduleId);
  schedule.status = 'cancelled';
  schedule.cancelledAt = new Date().toISOString();
  schedules.set(scheduleId, schedule);
  return schedule;
}

function scheduleWindow(planId, window = 'next_7_days') {
  const plan = getDistributionPlan(planId);
  const now = Date.now();
  const windows = {
    next_24_hours: [now, now + 24 * 3600e3],
    next_3_days: [now, now + 3 * 24 * 3600e3],
    next_7_days: [now, now + 7 * 24 * 3600e3],
    next_30_days: [now, now + 30 * 24 * 3600e3]
  };
  const [start, end] = windows[window] || windows.next_7_days;
  const scheduled = plan.channels.filter(c => {
    const ts = new Date(c.publishAt).getTime();
    return ts >= start && ts <= end;
  });
  return {
    window,
    count: scheduled.length,
    channels: scheduled,
    timeRange: { start: new Date(start).toISOString(), end: new Date(end).toISOString() }
  };
}

function optimizeSchedule(planId) {
  const plan = getDistributionPlan(planId);
  const optimalTimes = { 'Blog': '09:00', 'Email': '10:00', 'LinkedIn': '12:00', 'Twitter': '15:00', 'Facebook': '13:00' };
  const recommendations = plan.channels.map(ch => ({
    channel: ch.channel,
    currentTime: new Date(ch.publishAt).toTimeString().substring(0, 5),
    optimalTime: optimalTimes[ch.channel] || '10:00',
    timezone: plan.targeting?.timezone || 'UTC',
    estimatedReachIncrease: Math.round(Math.random() * 30) + 10 +  '%'
  }));
  return {
    planId,
    recommendations,
    summary: `Optimizing schedule could increase reach by up to ${Math.max(...recommendations.map(r => parseInt(r.estimatedReachIncrease)))}%`
  };
}

// ============================================================================
// PUBLICATION MANAGEMENT
// ============================================================================

function publishContent(planId, channelId) {
  const plan = getDistributionPlan(planId);
  const channel = plan.channels.find(ch => ch.id === channelId);
  if (!channel) throw new Error('Channel not found');
  const publicationId = generateId('pub');
  const publication = {
    id: publicationId,
    planId,
    channelId,
    channel: channel.channel,
    status: 'published',
    publishedAt: new Date().toISOString(),
    metrics: { impressions: 0, clicks: 0, engagement: 0, conversions: 0 },
    url: `https://${channel.channel.toLowerCase()}.example.com/content/${publicationId}`
  };
  publications.set(publicationId, publication);
  updateChannel(planId, channelId, { status: 'published' });
  distributionHistory.push({ id: generateId('history'), planId, channelId, action: 'published', timestamp: Date.now(), createdAt: new Date().toISOString() });
  return publication;
}

function getPublication(publicationId) {
  if (!publications.has(publicationId)) throw new Error('Publication not found');
  return publications.get(publicationId);
}

function updatePublicationMetrics(publicationId, metrics) {
  const publication = getPublication(publicationId);
  publication.metrics = { ...publication.metrics, ...metrics, lastUpdated: new Date().toISOString() };
  publications.set(publicationId, publication);
  return publication;
}

function listPublications(filters = {}) {
  let results = Array.from(publications.values());
  if (filters.planId) results = results.filter(p => p.planId === filters.planId);
  if (filters.channel) results = results.filter(p => p.channel === filters.channel);
  if (filters.status) results = results.filter(p => p.status === filters.status);
  return results;
}

// ============================================================================
// SYNDICATION
// ============================================================================

function createSyndicationRule(data = {}) {
  const ruleId = generateId('syndication');
  const rule = {
    id: ruleId,
    name: data.name || 'Auto-syndicate rule',
    sourceChannel: data.sourceChannel,
    targetChannels: data.targetChannels || [],
    delay: data.delay || 0,
    customization: data.customization || {},
    active: data.active !== false,
    conditions: data.conditions || [],
    createdAt: new Date().toISOString()
  };
  syndicationRules.set(ruleId, rule);
  return rule;
}

function applySyndication(planId, publicationId) {
  const publication = getPublication(publicationId);
  const activeRules = Array.from(syndicationRules.values()).filter(r => r.active);
  const syndicatedPublications = [];
  activeRules.forEach(rule => {
    if (rule.sourceChannel === publication.channel) {
      rule.targetChannels.forEach(targetChannel => {
        const syndicatedPub = {
          id: generateId('syndicated'),
          originalPublicationId: publicationId,
          planId,
          channel: targetChannel,
          status: 'syndicated',
          publishedAt: new Date(Date.now() + rule.delay * 60 * 1000).toISOString(),
          ruleId: rule.id,
          metrics: { impressions: 0, clicks: 0, engagement: 0, conversions: 0 }
        };
        publications.set(syndicatedPub.id, syndicatedPub);
        syndicatedPublications.push(syndicatedPub);
      });
    }
  });
  return { originalPublication: publication, syndicatedTo: syndicatedPublications, totalSyndications: syndicatedPublications.length };
}

function listSyndicationRules(filters = {}) {
  let results = Array.from(syndicationRules.values());
  if (filters.active !== undefined) results = results.filter(r => r.active === filters.active);
  if (filters.sourceChannel) results = results.filter(r => r.sourceChannel === filters.sourceChannel);
  return results;
}

// ============================================================================
// READINESS & SCORING
// ============================================================================

function readinessScore(plan) {
  const channels = plan.channels || [];
  const total = channels.length || 1;
  const readyCount = channels.filter(c => c.status === 'ready' || c.status === 'published').length;
  const score = Math.round((readyCount / total) * 100);
  const blockers = channels.filter(c => c.status === 'blocked' || c.status === 'failed').map(c => c.channel);
  return {
    score,
    readyCount,
    total,
    status: score === 100 ? 'ready_to_publish' : score > 80 ? 'go' : score > 50 ? 'needs_polish' : 'blocked',
    blockers
  };
}

function validateDistributionReadiness(planId) {
  const plan = getDistributionPlan(planId);
  const readiness = readinessScore(plan);
  const checks = {
    hasChannels: plan.channels && plan.channels.length > 0,
    allChannelsConfigured: plan.channels.every(ch => ch.publishAt && ch.owner),
    hasTargeting: !!plan.targeting,
    hasGuardrails: plan.guardrails && plan.guardrails.length > 0,
    hasObjectives: plan.objectives && plan.objectives.length > 0
  };
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const totalChecks = Object.keys(checks).length;
  const validationScore = Math.round((passedChecks / totalChecks) * 100);
  return {
    planId,
    readiness,
    checks,
    validationScore,
    ready: readiness.score >= 80 && validationScore >= 80,
    recommendations: Object.entries(checks).filter(([key, passed]) => !passed).map(([key]) => `Complete ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`)
  };
}

// ============================================================================
// STATISTICS & REPORTING
// ============================================================================

function getStats() {
  const allPlans = Array.from(plans.values());
  const allPublications = Array.from(publications.values());
  const totalChannels = allPlans.reduce((acc, p) => acc + (p.channels?.length || 0), 0);
  const avgChannelsPerPlan = allPlans.length ? Math.round(totalChannels / allPlans.length) : 0;
  const avgReadiness = allPlans.length ? Math.round(allPlans.reduce((acc, p) => acc + readinessScore(p).score, 0) / allPlans.length) : 0;
  const publicationsByChannel = allPublications.reduce((acc, pub) => {
    acc[pub.channel] = (acc[pub.channel] || 0) + 1;
    return acc;
  }, {});
  return {
    totalPlans: allPlans.length,
    totalChannels,
    avgChannelsPerPlan,
    avgReadiness,
    totalPublications: allPublications.length,
    publicationsByChannel,
    totalSchedules: schedules.size,
    totalSyndicationRules: syndicationRules.size,
    activeSyndicationRules: Array.from(syndicationRules.values()).filter(r => r.active).length,
    totalDistributionActions: distributionHistory.length
  };
}

function getDistributionHistory(planId, limit = 50) {
  let history = distributionHistory;
  if (planId) history = history.filter(h => h.planId === planId);
  return history.slice(-limit);
}

// ============================================================================
// CHANNEL ANALYTICS & PERFORMANCE
// ============================================================================

function trackChannelAnalytics(planId, channelId, data = {}) {
  const analyticsId = generateId('analytics');
  
  const analytics = {
    id: analyticsId,
    planId,
    channelId,
    impressions: data.impressions || 0,
    clicks: data.clicks || 0,
    engagement: data.engagement || 0,
    conversions: data.conversions || 0,
    revenue: data.revenue || 0,
    ctr: data.clicks && data.impressions ? (data.clicks / data.impressions) * 100 : 0,
    conversionRate: data.conversions && data.clicks ? (data.conversions / data.clicks) * 100 : 0,
    timestamp: new Date().toISOString()
  };
  
  channelAnalytics.set(analyticsId, analytics);
  return analytics;
}

function getChannelPerformance(planId, channelId) {
  const analytics = Array.from(channelAnalytics.values())
    .filter(a => a.planId === planId && (!channelId || a.channelId === channelId));
  
  if (analytics.length === 0) {
    return { planId, channelId, message: 'No analytics data available' };
  }
  
  const totals = analytics.reduce((acc, a) => ({
    impressions: acc.impressions + a.impressions,
    clicks: acc.clicks + a.clicks,
    engagement: acc.engagement + a.engagement,
    conversions: acc.conversions + a.conversions,
    revenue: acc.revenue + a.revenue
  }), { impressions: 0, clicks: 0, engagement: 0, conversions: 0, revenue: 0 });
  
  return {
    planId,
    channelId,
    totals,
    averages: {
      ctr: totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(2) + '%' : '0%',
      conversionRate: totals.clicks > 0 ? ((totals.conversions / totals.clicks) * 100).toFixed(2) + '%' : '0%',
      revenuePerClick: totals.clicks > 0 ? (totals.revenue / totals.clicks).toFixed(2) : '0'
    },
    dataPoints: analytics.length
  };
}

function compareChannelPerformance(planId) {
  const plan = getDistributionPlan(planId);
  const comparisons = [];
  
  plan.channels.forEach(channel => {
    const performance = getChannelPerformance(planId, channel.id);
    
    if (performance.totals) {
      comparisons.push({
        channel: channel.channel,
        channelId: channel.id,
        impressions: performance.totals.impressions,
        clicks: performance.totals.clicks,
        conversions: performance.totals.conversions,
        revenue: performance.totals.revenue,
        ctr: performance.averages.ctr,
        conversionRate: performance.averages.conversionRate
      });
    }
  });
  
  // Sort by conversions
  comparisons.sort((a, b) => b.conversions - a.conversions);
  
  return {
    planId,
    channels: comparisons,
    topPerformer: comparisons[0] || null,
    totalConversions: comparisons.reduce((sum, c) => sum + c.conversions, 0),
    totalRevenue: comparisons.reduce((sum, c) => sum + c.revenue, 0)
  };
}

// ============================================================================
// A/B TESTING FOR DISTRIBUTION
// ============================================================================

function createDistributionABTest(data = {}) {
  const testId = generateId('abtest');
  
  const test = {
    id: testId,
    planId: data.planId,
    name: data.name || 'Distribution A/B Test',
    variants: data.variants || [
      { id: 'A', name: 'Control', channels: [], trafficSplit: 50 },
      { id: 'B', name: 'Variant', channels: [], trafficSplit: 50 }
    ],
    metric: data.metric || 'conversions',
    status: 'running',
    startedAt: new Date().toISOString(),
    results: {}
  };
  
  abTests.set(testId, test);
  return test;
}

function recordABTestResult(testId, variantId, result = {}) {
  const test = abTests.get(testId);
  if (!test) throw new Error('A/B test not found');
  
  if (!test.results[variantId]) {
    test.results[variantId] = {
      impressions: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      samples: 0
    };
  }
  
  test.results[variantId].impressions += result.impressions || 0;
  test.results[variantId].clicks += result.clicks || 0;
  test.results[variantId].conversions += result.conversions || 0;
  test.results[variantId].revenue += result.revenue || 0;
  test.results[variantId].samples += 1;
  
  abTests.set(testId, test);
  return test.results[variantId];
}

function analyzeDistributionABTest(testId) {
  const test = abTests.get(testId);
  if (!test) throw new Error('A/B test not found');
  
  const analysis = {
    testId,
    name: test.name,
    variants: []
  };
  
  for (const variantId in test.results) {
    const result = test.results[variantId];
    const ctr = result.impressions > 0 ? (result.clicks / result.impressions) * 100 : 0;
    const conversionRate = result.clicks > 0 ? (result.conversions / result.clicks) * 100 : 0;
    
    analysis.variants.push({
      variantId,
      samples: result.samples,
      impressions: result.impressions,
      clicks: result.clicks,
      conversions: result.conversions,
      revenue: result.revenue.toFixed(2),
      ctr: ctr.toFixed(2) + '%',
      conversionRate: conversionRate.toFixed(2) + '%'
    });
  }
  
  // Determine winner
  analysis.variants.sort((a, b) => b.conversions - a.conversions);
  
  if (analysis.variants.length > 1 && analysis.variants[0].samples >= 100) {
    const control = analysis.variants.find(v => v.variantId === 'A') || analysis.variants[1];
    const winner = analysis.variants[0];
    
    const lift = control.conversions > 0 
      ? ((winner.conversions - control.conversions) / control.conversions) * 100
      : 0;
    
    analysis.winner = {
      variantId: winner.variantId,
      lift: lift.toFixed(2) + '%',
      significant: Math.abs(lift) > 10,
      recommendation: lift > 10 ? `Use ${winner.variantId} distribution strategy` : 'No significant difference'
    };
  }
  
  return analysis;
}

// ============================================================================
// AUDIENCE SEGMENTATION
// ============================================================================

function createAudienceSegment(data = {}) {
  const segmentId = generateId('segment');
  
  const segment = {
    id: segmentId,
    name: data.name || 'New Segment',
    criteria: data.criteria || {},
    size: data.size || 0,
    channels: data.channels || [],
    performance: {
      conversions: 0,
      revenue: 0,
      engagement: 0
    },
    createdAt: new Date().toISOString()
  };
  
  audienceSegments.set(segmentId, segment);
  return segment;
}

function targetSegment(planId, segmentId) {
  const plan = getDistributionPlan(planId);
  const segment = audienceSegments.get(segmentId);
  
  if (!segment) throw new Error('Audience segment not found');
  
  // Update plan targeting with segment
  const updated = updateDistributionPlan(planId, {
    targeting: {
      ...plan.targeting,
      segmentId: segment.id,
      segmentName: segment.name,
      criteria: segment.criteria
    }
  });
  
  return {
    planId,
    segment,
    recommendedChannels: segment.channels,
    message: `Plan targeted to ${segment.name} segment (${segment.size} users)`
  };
}

function getSegmentPerformance(segmentId) {
  const segment = audienceSegments.get(segmentId);
  if (!segment) throw new Error('Audience segment not found');
  
  return {
    segmentId,
    name: segment.name,
    size: segment.size,
    performance: segment.performance,
    conversionRate: segment.size > 0 
      ? ((segment.performance.conversions / segment.size) * 100).toFixed(2) + '%'
      : '0%',
    revenuePerUser: segment.size > 0
      ? (segment.performance.revenue / segment.size).toFixed(2)
      : '0'
  };
}

// ============================================================================
// CHANNEL OPTIMIZATION
// ============================================================================

function optimizeChannelMix(planId) {
  const comparison = compareChannelPerformance(planId);
  
  if (!comparison.channels || comparison.channels.length === 0) {
    return {
      planId,
      message: 'No performance data available for optimization'
    };
  }
  
  // Calculate efficiency score for each channel
  const channelScores = comparison.channels.map(ch => {
    const efficiencyScore = 
      (ch.conversions * 0.4) +
      (parseFloat(ch.conversionRate) * 0.3) +
      (ch.revenue * 0.3);
    
    return {
      ...ch,
      efficiencyScore: efficiencyScore.toFixed(2)
    };
  });
  
  channelScores.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
  
  const recommendations = [];
  
  // Recommend increasing investment in top performers
  if (channelScores.length >= 3) {
    const top3 = channelScores.slice(0, 3);
    recommendations.push({
      action: 'increase_investment',
      channels: top3.map(c => c.channel),
      reason: 'Highest efficiency scores',
      expectedImpact: '+25% conversions'
    });
    
    const bottom = channelScores.slice(-2);
    recommendations.push({
      action: 'optimize_or_reduce',
      channels: bottom.map(c => c.channel),
      reason: 'Low efficiency scores',
      expectedImpact: 'Improve ROI by 15%'
    });
  }
  
  return {
    planId,
    channelScores,
    recommendations,
    optimalMix: channelScores.slice(0, Math.min(5, channelScores.length)).map(c => c.channel)
  };
}

module.exports = {
  // Distribution Plans
  createDistributionPlan,
  getDistributionPlan,
  updateDistributionPlan,
  deleteDistributionPlan,
  listPlans,
  
  // Channel Management
  addChannel,
  updateChannel,
  removeChannel,
  activateChannel,
  listChannels,
  
  // Scheduling
  createSchedule,
  getSchedule,
  updateSchedule,
  cancelSchedule,
  scheduleWindow,
  optimizeSchedule,
  
  // Publications
  publishContent,
  getPublication,
  updatePublicationMetrics,
  listPublications,
  
  // Syndication
  createSyndicationRule,
  applySyndication,
  listSyndicationRules,
  
  // Readiness & Validation
  readinessScore,
  validateDistributionReadiness,
  
  // Channel Analytics
  trackChannelAnalytics,
  getChannelPerformance,
  compareChannelPerformance,
  
  // A/B Testing
  createDistributionABTest,
  recordABTestResult,
  analyzeDistributionABTest,
  
  // Audience Segmentation
  createAudienceSegment,
  targetSegment,
  getSegmentPerformance,
  
  // Channel Optimization
  optimizeChannelMix,
  
  // Statistics & History
  getStats,
  getDistributionHistory
};
