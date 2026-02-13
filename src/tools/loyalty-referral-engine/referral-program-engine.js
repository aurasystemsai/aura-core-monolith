/**
 * Referral Program Engine
 * Manages referral codes, tracking, rewards, and referral analytics
 */

// Storage
const referralCodes = new Map(); // code -> referral data
const referrals = new Map(); // referralId -> referral
const referralRewards = new Map(); // rewardId -> reward
const referralCampaigns = new Map(); // campaignId -> campaign

let referralCounter = 1;
let rewardCounter = 1;
let campaignCounter = 1;

/**
 * Generate unique referral code
 */
function generateReferralCode(customerId, prefix = '') {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = prefix || '';
  
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Ensure uniqueness
  if (referralCodes.has(code)) {
    return generateReferralCode(customerId, prefix);
  }
  
  return code;
}

/**
 * Create referral code for customer
 */
function createReferralCode(data) {
  const { customerId, code, customMessage } = data;
  
  const referralCode = code || generateReferralCode(customerId);
  
  if (referralCodes.has(referralCode)) {
    throw new Error('Referral code already exists');
  }
  
  const referral = {
    code: referralCode,
    customerId,
    referrerId: customerId, // The person doing the referring
    customMessage: customMessage || null,
    status: 'active', // active, inactive, expired
    uses: 0,
    maxUses: data.maxUses || null,
    expiresAt: data.expiresAt || null,
    createdAt: new Date().toISOString(),
    statistics: {
      totalClicks: 0,
      totalSignups: 0,
      totalConversions: 0,
      totalRevenue: 0,
      conversionRate: 0,
    },
  };
  
  referralCodes.set(referralCode, referral);
  
  return referral;
}

/**
 * Get referral code
 */
function getReferralCode(code) {
  const referral = referralCodes.get(code);
  
  if (!referral) {
    throw new Error('Referral code not found');
  }
  
  return referral;
}

/**
 * Get customer's referral code
 */
function getCustomerReferralCode(customerId) {
  const codes = Array.from(referralCodes.values())
    .filter(r => r.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return codes[0] || null;
}

/**
 * Track referral click
 */
function trackReferralClick(code, data = {}) {
  const referral = getReferralCode(code);
  
  referral.statistics.totalClicks++;
  
  return {
    code,
    clicked: true,
    timestamp: new Date().toISOString(),
    metadata: data,
  };
}

/**
 * Create referral (when referred customer signs up)
 */
function createReferral(data) {
  const { referralCode, referredCustomerId, referredEmail, referredName } = data;
  
  const code = referralCodes.get(referralCode);
  
  if (!code) {
    throw new Error('Invalid referral code');
  }
  
  if (code.status !== 'active') {
    throw new Error('Referral code is not active');
  }
  
  if (code.maxUses && code.uses >= code.maxUses) {
    throw new Error('Referral code has reached maximum uses');
  }
  
  if (code.expiresAt && new Date(code.expiresAt) < new Date()) {
    throw new Error('Referral code has expired');
  }
  
  const referral = {
    id: `ref_${referralCounter++}`,
    referralCode,
    referrerId: code.customerId,
    referredCustomerId,
    referredEmail,
    referredName: referredName || null,
    status: 'pending', // pending, qualified, rewarded, cancelled
    qualifiedAt: null,
    rewardedAt: null,
    metadata: {
      signupDate: new Date().toISOString(),
      source: data.source || 'direct',
    },
    rewards: {
      referrer: null,
      referred: null,
    },
    createdAt: new Date().toISOString(),
  };
  
  referrals.set(referral.id, referral);
  
  // Update code statistics
  code.uses++;
  code.statistics.totalSignups++;
  
  return referral;
}

/**
 * Qualify referral (when referred customer makes purchase)
 */
function qualifyReferral(referralId, purchaseData = {}) {
  const referral = referrals.get(referralId);
  
  if (!referral) {
    throw new Error('Referral not found');
  }
  
  if (referral.status !== 'pending') {
    throw new Error('Referral is not in pending status');
  }
  
  referral.status = 'qualified';
  referral.qualifiedAt = new Date().toISOString();
  referral.metadata.qualificationPurchase = purchaseData;
  
  // Update code statistics
  const code = referralCodes.get(referral.referralCode);
  if (code) {
    code.statistics.totalConversions++;
    code.statistics.totalRevenue += purchaseData.amount || 0;
    code.statistics.conversionRate = code.statistics.totalSignups > 0
      ? ((code.statistics.totalConversions / code.statistics.totalSignups) * 100).toFixed(2)
      : 0;
  }
  
  return referral;
}

/**
 * Reward referral
 */
function rewardReferral(referralId, rewards) {
  const referral = referrals.get(referralId);
  
  if (!referral) {
    throw new Error('Referral not found');
  }
  
  if (referral.status !== 'qualified') {
    throw new Error('Referral must be qualified before rewarding');
  }
  
  referral.status = 'rewarded';
  referral.rewardedAt = new Date().toISOString();
  referral.rewards = {
    referrer: rewards.referrer || null,
    referred: rewards.referred || null,
  };
  
  return referral;
}

/**
 * Create referral campaign
 */
function createReferralCampaign(data) {
  const campaign = {
    id: `campaign_${campaignCounter++}`,
    name: data.name,
    description: data.description || '',
    type: data.type || 'standard', // standard, tiered, milestone
    rewards: {
      referrer: {
        type: data.rewards.referrer.type, // points, discount, credit, custom
        value: data.rewards.referrer.value,
        description: data.rewards.referrer.description || '',
      },
      referred: {
        type: data.rewards.referred.type,
        value: data.rewards.referred.value,
        description: data.rewards.referred.description || '',
      },
    },
    qualificationRules: data.qualificationRules || {
      requirePurchase: true,
      minPurchaseAmount: 0,
      qualificationPeriod: 30, // days
    },
    tierRewards: data.tierRewards || null, // For tiered campaigns
    milestones: data.milestones || null, // For milestone campaigns
    startDate: data.startDate || new Date().toISOString(),
    endDate: data.endDate || null,
    status: 'active', // active, paused, ended
    createdAt: new Date().toISOString(),
    statistics: {
      totalReferrals: 0,
      qualifiedReferrals: 0,
      totalRewardsIssued: 0,
      totalRevenue: 0,
    },
  };
  
  referralCampaigns.set(campaign.id, campaign);
  
  return campaign;
}

/**
 * Get referral campaign
 */
function getReferralCampaign(campaignId) {
  const campaign = referralCampaigns.get(campaignId);
  
  if (!campaign) {
    throw new Error('Campaign not found');
  }
  
  return campaign;
}

/**
 * List referral campaigns
 */
function listReferralCampaigns(options = {}) {
  const { status } = options;
  
  let campaigns = Array.from(referralCampaigns.values())
    .filter(c => !status || c.status === status)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return {
    campaigns,
    total: campaigns.length,
  };
}

/**
 * Get referrals by customer (as referrer)
 */
function getCustomerReferrals(customerId, options = {}) {
  const { status, limit = 20, offset = 0 } = options;
  
  const customerReferrals = Array.from(referrals.values())
    .filter(r => r.referrerId === customerId)
    .filter(r => !status || r.status === status)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const total = customerReferrals.length;
  const items = customerReferrals.slice(offset, offset + limit);
  
  // Calculate summary
  const summary = {
    total: total,
    pending: customerReferrals.filter(r => r.status === 'pending').length,
    qualified: customerReferrals.filter(r => r.status === 'qualified').length,
    rewarded: customerReferrals.filter(r => r.status === 'rewarded').length,
    totalRewards: customerReferrals
      .filter(r => r.rewards.referrer)
      .reduce((sum, r) => sum + (r.rewards.referrer.value || 0), 0),
  };
  
  return {
    referrals: items,
    summary,
    hasMore: offset + limit < total,
  };
}

/**
 * Get referral analytics
 */
function getReferralAnalytics(options = {}) {
  const { customerId, campaignId, startDate, endDate } = options;
  
  let relevantReferrals = Array.from(referrals.values());
  
  if (customerId) {
    relevantReferrals = relevantReferrals.filter(r => r.referrerId === customerId);
  }
  
  if (startDate) {
    relevantReferrals = relevantReferrals.filter(r => 
      new Date(r.createdAt) >= new Date(startDate)
    );
  }
  
  if (endDate) {
    relevantReferrals = relevantReferrals.filter(r => 
      new Date(r.createdAt) <= new Date(endDate)
    );
  }
  
  const totalReferrals = relevantReferrals.length;
  const qualified = relevantReferrals.filter(r => r.status === 'qualified' || r.status === 'rewarded').length;
  const rewarded = relevantReferrals.filter(r => r.status === 'rewarded').length;
  
  const totalRevenue = relevantReferrals
    .filter(r => r.metadata.qualificationPurchase)
    .reduce((sum, r) => sum + (r.metadata.qualificationPurchase.amount || 0), 0);
  
  const conversionRate = totalReferrals > 0
    ? ((qualified / totalReferrals) * 100).toFixed(2)
    : 0;
  
  // Top referrers
  const referrerStats = new Map();
  relevantReferrals.forEach(r => {
    if (!referrerStats.has(r.referrerId)) {
      referrerStats.set(r.referrerId, {
        customerId: r.referrerId,
        totalReferrals: 0,
        qualifiedReferrals: 0,
        totalRevenue: 0,
      });
    }
    
    const stats = referrerStats.get(r.referrerId);
    stats.totalReferrals++;
    
    if (r.status === 'qualified' || r.status === 'rewarded') {
      stats.qualifiedReferrals++;
      stats.totalRevenue += r.metadata.qualificationPurchase?.amount || 0;
    }
  });
  
  const topReferrers = Array.from(referrerStats.values())
    .sort((a, b) => b.qualifiedReferrals - a.qualifiedReferrals)
    .slice(0, 10);
  
  return {
    overview: {
      totalReferrals,
      qualified,
      rewarded,
      pending: totalReferrals - qualified,
      conversionRate: parseFloat(conversionRate),
      totalRevenue,
      averageOrderValue: qualified > 0 ? (totalRevenue / qualified).toFixed(2) : 0,
    },
    topReferrers,
    period: {
      startDate: startDate || null,
      endDate: endDate || null,
    },
  };
}

/**
 * Generate referral share links
 */
function generateShareLinks(referralCode, options = {}) {
  const baseUrl = options.baseUrl || 'https://example.com';
  const { customMessage, source } = options;
  
  const shareUrl = `${baseUrl}?ref=${referralCode}`;
  
  const links = {
    direct: shareUrl,
    email: `mailto:?subject=Check this out!&body=${encodeURIComponent(customMessage || `Use code ${referralCode}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(customMessage || 'Check this out!')}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent((customMessage || 'Check this out!') + ' ' + shareUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    copy: shareUrl,
  };
  
  return {
    referralCode,
    links,
    customMessage,
  };
}

/**
 * Calculate referral commission
 */
function calculateCommission(referralId, orderAmount) {
  const referral = referrals.get(referralId);
  
  if (!referral) {
    throw new Error('Referral not found');
  }
  
  // This would use campaign rules to calculate commission
  const commissionRate = 0.1; // 10%
  const commission = orderAmount * commissionRate;
  
  return {
    referralId,
    orderAmount,
    commissionRate,
    commission,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Get referral leaderboard
 */
function getReferralLeaderboard(options = {}) {
  const { limit = 10, period = 'all' } = options;
  
  let relevantReferrals = Array.from(referrals.values());
  
  // Filter by period
  if (period === 'month') {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    relevantReferrals = relevantReferrals.filter(r => new Date(r.createdAt) >= monthAgo);
  } else if (period === 'week') {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    relevantReferrals = relevantReferrals.filter(r => new Date(r.createdAt) >= weekAgo);
  }
  
  // Group by referrer
  const leaderboard = new Map();
  relevantReferrals.forEach(r => {
    if (!leaderboard.has(r.referrerId)) {
      leaderboard.set(r.referrerId, {
        customerId: r.referrerId,
        totalReferrals: 0,
        qualifiedReferrals: 0,
        totalRevenue: 0,
        rank: 0,
      });
    }
    
    const entry = leaderboard.get(r.referrerId);
    entry.totalReferrals++;
    
    if (r.status === 'qualified' || r.status === 'rewarded') {
      entry.qualifiedReferrals++;
      entry.totalRevenue += r.metadata.qualificationPurchase?.amount || 0;
    }
  });
  
  // Sort by qualified referrals and assign ranks
  const sortedLeaderboard = Array.from(leaderboard.values())
    .sort((a, b) => b.qualifiedReferrals - a.qualifiedReferrals)
    .slice(0, limit)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  
  return {
    leaderboard: sortedLeaderboard,
    period,
    total: sortedLeaderboard.length,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get referral statistics
 */
function getReferralStatistics() {
  const totalCodes = referralCodes.size;
  const activeCodes = Array.from(referralCodes.values())
    .filter(c => c.status === 'active').length;
  
  const allReferrals = Array.from(referrals.values());
  const totalReferrals = allReferrals.length;
  const qualified = allReferrals.filter(r => r.status === 'qualified' || r.status === 'rewarded').length;
  
  const totalClicks = Array.from(referralCodes.values())
    .reduce((sum, c) => sum + c.statistics.totalClicks, 0);
  
  const totalRevenue = allReferrals
    .filter(r => r.metadata.qualificationPurchase)
    .reduce((sum, r) => sum + (r.metadata.qualificationPurchase.amount || 0), 0);
  
  return {
    codes: {
      total: totalCodes,
      active: activeCodes,
    },
    referrals: {
      total: totalReferrals,
      pending: allReferrals.filter(r => r.status === 'pending').length,
      qualified,
      rewarded: allReferrals.filter(r => r.status === 'rewarded').length,
      conversionRate: totalReferrals > 0 
        ? ((qualified / totalReferrals) * 100).toFixed(2)
        : 0,
    },
    engagement: {
      totalClicks,
      clickToSignupRate: totalClicks > 0
        ? ((totalReferrals / totalClicks) * 100).toFixed(2)
        : 0,
    },
    revenue: {
      total: totalRevenue,
      averageOrderValue: qualified > 0 ? (totalRevenue / qualified).toFixed(2) : 0,
    },
    campaigns: {
      total: referralCampaigns.size,
      active: Array.from(referralCampaigns.values())
        .filter(c => c.status === 'active').length,
    },
  };
}

module.exports = {
  generateReferralCode,
  createReferralCode,
  getReferralCode,
  getCustomerReferralCode,
  trackReferralClick,
  createReferral,
  qualifyReferral,
  rewardReferral,
  createReferralCampaign,
  getReferralCampaign,
  listReferralCampaigns,
  getCustomerReferrals,
  getReferralAnalytics,
  generateShareLinks,
  calculateCommission,
  getReferralLeaderboard,
  getReferralStatistics,
};
