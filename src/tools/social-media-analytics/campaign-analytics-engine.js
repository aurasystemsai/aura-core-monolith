/**
 * Campaign Analytics Engine
 * Manages campaign tracking, ROI analysis, attribution, and performance measurement
 */

// In-memory storage
const campaigns = new Map();
const campaignMetrics = new Map();
const attributionModels = new Map();
const roiAnalysis = new Map();
const campaignGoals = new Map();

let campaignIdCounter = 1;
let metricIdCounter = 1;
let attributionIdCounter = 1;
let roiIdCounter = 1;
let goalIdCounter = 1;

/**
 * Create campaign
 */
function createCampaign({ accountId, name, type, objective, budget, startDate, endDate, platforms, targetAudience, content }) {
  const campaign = {
    id: campaignIdCounter++,
    accountId,
    name,
    type, // awareness, engagement, traffic, conversions, lead_generation, app_installs
    objective: objective || {
      primary: 'increase_engagement',
      secondary: ['brand_awareness', 'website_traffic']
    },
    budget: {
      total: budget?.total || 0,
      spent: 0,
      remaining: budget?.total || 0,
      currency: budget?.currency || 'USD',
      dailyLimit: budget?.dailyLimit || null
    },
    schedule: {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      duration: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
    },
    platforms: platforms || [],
    targetAudience: targetAudience || {
      demographics: {},
      interests: [],
      behaviors: [],
      locations: []
    },
    content: {
      posts: content?.posts || [],
      creatives: content?.creatives || [],
      copyVariations: content?.copyVariations || []
    },
    status: 'draft', // draft, active, paused, completed, cancelled
    performance: {
      impressions: 0,
      reach: 0,
      engagement: 0,
      clicks: 0,
      conversions: 0,
      revenue: 0
    },
    createdAt: new Date(),
    launchedAt: null
  };

  campaigns.set(campaign.id, campaign);
  return campaign;
}

/**
 * Launch campaign
 */
function launchCampaign(campaignId) {
  const campaign = campaigns.get(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }

  if (campaign.status !== 'draft') {
    throw new Error('Only draft campaigns can be launched');
  }

  campaign.status = 'active';
  campaign.launchedAt = new Date();

  return campaign;
}

/**
 * Update campaign metrics
 */
function updateCampaignMetrics(campaignId, { impressions, reach, engagement, clicks, conversions, revenue, spent }) {
  const campaign = campaigns.get(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }

  const metric = {
    id: metricIdCounter++,
    campaignId,
    timestamp: new Date(),
    impressions: impressions || 0,
    reach: reach || 0,
    engagement: engagement || 0,
    clicks: clicks || 0,
    conversions: conversions || 0,
    revenue: revenue || 0,
    spent: spent || 0,
    metrics: {
      ctr: reach > 0 ? (clicks / reach) * 100 : 0, // Click-through rate
      engagementRate: reach > 0 ? (engagement / reach) * 100 : 0,
      conversionRate: clicks > 0 ? (conversions / clicks) * 100 : 0,
      cpc: clicks > 0 ? spent / clicks : 0, // Cost per click
      cpa: conversions > 0 ? spent / conversions : 0, // Cost per acquisition
      roas: spent > 0 ? revenue / spent : 0 // Return on ad spend
    }
  };

  campaignMetrics.set(metric.id, metric);

  // Update campaign performance
  campaign.performance.impressions += impressions || 0;
  campaign.performance.reach += reach || 0;
  campaign.performance.engagement += engagement || 0;
  campaign.performance.clicks += clicks || 0;
  campaign.performance.conversions += conversions || 0;
  campaign.performance.revenue += revenue || 0;
  campaign.budget.spent += spent || 0;
  campaign.budget.remaining = campaign.budget.total - campaign.budget.spent;

  return metric;
}

/**
 * Set campaign goal
 */
function setCampaignGoal(campaignId, { metric, target, deadline }) {
  const campaign = campaigns.get(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }

  const goal = {
    id: goalIdCounter++,
    campaignId,
    metric, // impressions, reach, clicks, conversions, revenue, engagement
    target,
    current: campaign.performance[metric] || 0,
    progress: 0,
    deadline: deadline ? new Date(deadline) : campaign.schedule.endDate,
    status: 'in_progress', // in_progress, achieved, failed, at_risk
    createdAt: new Date()
  };

  // Calculate progress
  goal.progress = goal.target > 0 ? (goal.current / goal.target) * 100 : 0;

  // Determine status
  if (goal.progress >= 100) {
    goal.status = 'achieved';
  } else if (goal.progress >= 75) {
    goal.status = 'in_progress';
  } else {
    const daysRemaining = (goal.deadline - new Date()) / (1000 * 60 * 60 * 24);
    const campaignDays = campaign.schedule.duration;
    const daysElapsed = campaignDays - daysRemaining;
    const expectedProgress = (daysElapsed / campaignDays) * 100;

    if (goal.progress < expectedProgress * 0.7) {
      goal.status = 'at_risk';
    }
  }

  campaignGoals.set(goal.id, goal);
  return goal;
}

/**
 * Track attribution
 */
function trackAttribution(campaignId, { conversionId, touchpoints, attributionModel }) {
  const campaign = campaigns.get(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }

  const attribution = {
    id: attributionIdCounter++,
    campaignId,
    conversionId,
    touchpoints: touchpoints || [], // Array of {platform, type, timestamp, value}
    attributionModel: attributionModel || 'last_click', // first_click, last_click, linear, time_decay, position_based
    credits: {},
    totalValue: 0,
    trackedAt: new Date()
  };

  // Calculate attribution credits based on model
  attribution.credits = calculateAttributionCredits(touchpoints, attributionModel);

  // Sum total value
  attribution.totalValue = touchpoints.reduce((sum, tp) => sum + (tp.value || 0), 0);

  attributionModels.set(attribution.id, attribution);
  return attribution;
}

/**
 * Calculate attribution credits
 */
function calculateAttributionCredits(touchpoints, model) {
  const credits = {};
  const totalTouchpoints = touchpoints.length;

  if (totalTouchpoints === 0) return credits;

  touchpoints.forEach((tp, index) => {
    const platform = tp.platform;
    if (!credits[platform]) credits[platform] = 0;

    switch (model) {
      case 'first_click':
        if (index === 0) credits[platform] += 1;
        break;

      case 'last_click':
        if (index === totalTouchpoints - 1) credits[platform] += 1;
        break;

      case 'linear':
        credits[platform] += 1 / totalTouchpoints;
        break;

      case 'time_decay':
        // More recent touchpoints get more credit
        const daysSince = (Date.now() - new Date(tp.timestamp)) / (1000 * 60 * 60 * 24);
        const decayFactor = Math.exp(-daysSince / 7); // 7-day half-life
        credits[platform] += decayFactor;
        break;

      case 'position_based':
        // 40% first, 40% last, 20% distributed among middle
        if (index === 0) {
          credits[platform] += 0.4;
        } else if (index === totalTouchpoints - 1) {
          credits[platform] += 0.4;
        } else {
          credits[platform] += 0.2 / (totalTouchpoints - 2);
        }
        break;

      default:
        credits[platform] += 1 / totalTouchpoints;
    }
  });

  return credits;
}

/**
 * Analyze ROI
 */
function analyzeROI(campaignId) {
  const campaign = campaigns.get(campaignId);
  if (!campaign) {
    throw new Error('Campaign not found');
  }

  const metrics = Array.from(campaignMetrics.values())
    .filter(m => m.campaignId === campaignId);

  if (metrics.length === 0) {
    return { available: false, message: 'No metrics available for ROI analysis' };
  }

  // Aggregate metrics
  const totals = metrics.reduce((acc, m) => ({
    impressions: acc.impressions + m.impressions,
    reach: acc.reach + m.reach,
    engagement: acc.engagement + m.engagement,
    clicks: acc.clicks + m.clicks,
    conversions: acc.conversions + m.conversions,
    revenue: acc.revenue + m.revenue,
    spent: acc.spent + m.spent
  }), {
    impressions: 0,
    reach: 0,
    engagement: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    spent: 0
  });

  const analysis = {
    id: roiIdCounter++,
    campaignId,
    campaignName: campaign.name,
    period: {
      startDate: campaign.schedule.startDate,
      endDate: campaign.schedule.endDate,
      duration: campaign.schedule.duration
    },
    investment: {
      budgetAllocated: campaign.budget.total,
      budgetSpent: totals.spent,
      budgetRemaining: campaign.budget.remaining,
      utilizationRate: campaign.budget.total > 0 ?
        (totals.spent / campaign.budget.total) * 100 : 0
    },
    returns: {
      totalRevenue: totals.revenue,
      netProfit: totals.revenue - totals.spent,
      roi: totals.spent > 0 ? ((totals.revenue - totals.spent) / totals.spent) * 100 : 0,
      roas: totals.spent > 0 ? totals.revenue / totals.spent : 0
    },
    efficiency: {
      cpm: totals.impressions > 0 ? (totals.spent / totals.impressions) * 1000 : 0, // Cost per thousand
      cpc: totals.clicks > 0 ? totals.spent / totals.clicks : 0,
      cpa: totals.conversions > 0 ? totals.spent / totals.conversions : 0,
      ltv: totals.conversions > 0 ? totals.revenue / totals.conversions : 0 // Lifetime value per customer
    },
    performance: {
      impressions: totals.impressions,
      reach: totals.reach,
      engagement: totals.engagement,
      clicks: totals.clicks,
      conversions: totals.conversions,
      ctr: totals.reach > 0 ? (totals.clicks / totals.reach) * 100 : 0,
      conversionRate: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0
    },
    insights: generateROIInsights(campaign, totals),
    analyzedAt: new Date()
  };

  roiAnalysis.set(analysis.id, analysis);
  return analysis;
}

/**
 * Generate ROI insights
 */
function generateROIInsights(campaign, totals) {
  const insights = [];

  const roi = totals.spent > 0 ? ((totals.revenue - totals.spent) / totals.spent) * 100 : 0;

  if (roi > 100) {
    insights.push({
      type: 'positive',
      category: 'roi',
      message: `Excellent ROI of ${roi.toFixed(0)}% - campaign is highly profitable`,
      recommendation: 'Consider increasing budget to scale success'
    });
  } else if (roi > 0) {
    insights.push({
      type: 'positive',
      category: 'roi',
      message: `Positive ROI of ${roi.toFixed(0)}% - campaign is profitable`,
      recommendation: 'Continue optimizing to improve ROI further'
    });
  } else {
    insights.push({
      type: 'negative',
      category: 'roi',
      message: `Negative ROI of ${roi.toFixed(0)}% - campaign is not profitable`,
      recommendation: 'Analyze underperforming elements and adjust targeting or creative'
    });
  }

  const utilizationRate = campaign.budget.total > 0 ?
    (totals.spent / campaign.budget.total) * 100 : 0;

  if (utilizationRate < 50) {
    insights.push({
      type: 'warning',
      category: 'budget',
      message: `Only ${utilizationRate.toFixed(0)}% of budget utilized`,
      recommendation: 'Increase bid amounts or expand targeting to utilize full budget'
    });
  }

  const conversionRate = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;

  if (conversionRate < 2) {
    insights.push({
      type: 'warning',
      category: 'conversions',
      message: `Low conversion rate of ${conversionRate.toFixed(2)}%`,
      recommendation: 'Optimize landing page and ensure audience alignment'
    });
  }

  return insights;
}

/**
 * Compare campaigns
 */
function compareCampaigns(campaignIds) {
  if (campaignIds.length < 2) {
    throw new Error('Need at least 2 campaigns to compare');
  }

  const comparisons = campaignIds.map(id => {
    const campaign = campaigns.get(id);
    if (!campaign) return null;

    const roiData = Array.from(roiAnalysis.values())
      .filter(r => r.campaignId === id)
      .sort((a, b) => b.analyzedAt - a.analyzedAt)[0];

    return {
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      performance: campaign.performance,
      budget: campaign.budget,
      roi: roiData ? roiData.returns.roi : 0,
      roas: roiData ? roiData.returns.roas : 0
    };
  }).filter(c => c !== null);

  // Find best and worst performers
  const bestROI = comparisons.reduce((max, c) => c.roi > max.roi ? c : max, comparisons[0]);
  const bestROAS = comparisons.reduce((max, c) => c.roas > max.roas ? c : max, comparisons[0]);

  return {
    campaigns: comparisons,
    totalCampaigns: comparisons.length,
    bestPerformers: {
      roi: {
        campaignId: bestROI.id,
        campaignName: bestROI.name,
        value: bestROI.roi.toFixed(2)
      },
      roas: {
        campaignId: bestROAS.id,
        campaignName: bestROAS.name,
        value: bestROAS.roas.toFixed(2)
      }
    },
    comparedAt: new Date()
  };
}

/**
 * Get campaign statistics
 */
function getCampaignStatistics(accountId) {
  const accountCampaigns = Array.from(campaigns.values()).filter(c => c.accountId === accountId);

  if (accountCampaigns.length === 0) {
    return { available: false, message: 'No campaigns found' };
  }

  const totalBudget = accountCampaigns.reduce((sum, c) => sum + c.budget.total, 0);
  const totalSpent = accountCampaigns.reduce((sum, c) => sum + c.budget.spent, 0);
  const totalRevenue = accountCampaigns.reduce((sum, c) => sum + c.performance.revenue, 0);

  return {
    accountId,
    totalCampaigns: accountCampaigns.length,
    activeCampaigns: accountCampaigns.filter(c => c.status === 'active').length,
    completedCampaigns: accountCampaigns.filter(c => c.status === 'completed').length,
    draftCampaigns: accountCampaigns.filter(c => c.status === 'draft').length,
    totalBudget,
    totalSpent,
    totalRevenue,
    overallROI: totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0,
    overallROAS: totalSpent > 0 ? totalRevenue / totalSpent : 0,
    typeBreakdown: getCampaignTypeBreakdown(accountCampaigns),
    platformBreakdown: getPlatformBreakdown(accountCampaigns),
    totalGoals: Array.from(campaignGoals.values()).length,
    achievedGoals: Array.from(campaignGoals.values()).filter(g => g.status === 'achieved').length
  };
}

function getCampaignTypeBreakdown(campaigns) {
  const breakdown = {};
  campaigns.forEach(c => {
    breakdown[c.type] = (breakdown[c.type] || 0) + 1;
  });
  return breakdown;
}

function getPlatformBreakdown(campaigns) {
  const breakdown = {};
  campaigns.forEach(c => {
    c.platforms.forEach(p => {
      breakdown[p] = (breakdown[p] || 0) + 1;
    });
  });
  return breakdown;
}

module.exports = {
  createCampaign,
  launchCampaign,
  updateCampaignMetrics,
  setCampaignGoal,
  trackAttribution,
  analyzeROI,
  compareCampaigns,
  getCampaignStatistics
};
