/**
 * Tier & VIP Management Engine
 * Manages customer tiers, tier upgrades, benefits, and VIP programs
 */

// Storage
const tiers = new Map(); // tierId -> tier
const tierBenefits = new Map(); // benefitId -> benefit
const tierProgresses = new Map(); // customerId -> progress
const tierUpgradeHistory = new Map(); // customerId -> history[]

let tierCounter = 1;
let benefitCounter = 1;

/**
 * Create tier level
 */
function createTier(data) {
  const tier = {
    id: `tier_${tierCounter++}`,
    name: data.name,
    level: data.level, // 1 = bronze, 2 = silver, 3 = gold, 4 = platinum, 5 = diamond
    color: data.color || '#CD7F32',
    icon: data.icon || null,
    requirements: {
      type: data.requirements.type, // points, spending, orders
      threshold: data.requirements.threshold,
      period: data.requirements.period || 'lifetime', // lifetime, annual, monthly
    },
    benefits: data.benefits || [],
    pointsMultiplier: data.pointsMultiplier || 1,
    description: data.description || '',
    welcomeMessage: data.welcomeMessage || null,
    enabled: data.enabled !== false,
    createdAt: new Date().toISOString(),
    statistics: {
      totalMembers: 0,
      newMembersThisMonth: 0,
    },
  };
  
  tiers.set(tier.id, tier);
  return tier;
}

/**
 * Get all tiers
 */
function getTiers(options = {}) {
  const { enabled } = options;
  
  let tierList = Array.from(tiers.values())
    .filter(t => enabled === undefined || t.enabled === enabled)
    .sort((a, b) => a.level - b.level);
  
  return { tiers: tierList, total: tierList.length };
}

/**
 * Get tier by ID or level
 */
function getTier(identifier) {
  // Try by ID first
  if (tiers.has(identifier)) {
    return tiers.get(identifier);
  }
  
  // Try by level
  const tierByLevel = Array.from(tiers.values())
    .find(t => t.level === parseInt(identifier));
  
  return tierByLevel || null;
}

/**
 * Create tier benefit
 */
function createTierBenefit(data) {
  const benefit = {
    id: `benefit_${benefitCounter++}`,
    name: data.name,
    type: data.type, // discount, free_shipping, early_access, exclusive_products, priority_support, bonus_points, birthday_gift
    value: data.value || null,
    description: data.description || '',
    tiers: data.tiers || [], // Which tier levels can access this benefit
    conditions: data.conditions || {},
    enabled: data.enabled !== false,
    createdAt: new Date().toISOString(),
  };
  
  tierBenefits.set(benefit.id, benefit);
  return benefit;
}

/**
 * Get benefits for tier
 */
function getTierBenefits(tierId) {
  const tier = tiers.get(tierId);
  
  if (!tier) {
    throw new Error('Tier not found');
  }
  
  const benefits = Array.from(tierBenefits.values())
    .filter(b => b.enabled)
    .filter(b => b.tiers.includes(tier.level) || b.tiers.includes(tier.name));
  
  return { benefits, total: benefits.length };
}

/**
 * Calculate customer tier progress
 */
function calculateTierProgress(customerId, customerData) {
  const { lifetimePoints, lifetimeSpending, totalOrders, currentTier } = customerData;
  
  // Get all tiers sorted by level
  const allTiers = Array.from(tiers.values())
    .filter(t => t.enabled)
    .sort((a, b) => a.level - b.level);
  
  if (allTiers.length === 0) {
    return null;
  }
  
  // Find current tier
  const current = allTiers.find(t => t.name.toLowerCase() === currentTier?.toLowerCase()) || allTiers[0];
  
  // Find next tier
  const nextTier = allTiers.find(t => t.level > current.level);
  
  // Calculate progress based on requirement type
  let currentValue = 0;
  let requiredValue = 0;
  let requirementType = 'points';
  
  if (current.requirements.type === 'points') {
    currentValue = lifetimePoints || 0;
    requirementType = 'points';
  } else if (current.requirements.type === 'spending') {
    currentValue = lifetimeSpending || 0;
    requirementType = 'spending';
  } else if (current.requirements.type === 'orders') {
    currentValue = totalOrders || 0;
    requirementType = 'orders';
  }
  
  if (nextTier) {
    requiredValue = nextTier.requirements.threshold;
  }
  
  const progress = nextTier && requiredValue > 0
    ? Math.min(100, (currentValue / requiredValue) * 100)
    : 100;
  
  const tierProgress = {
    customerId,
    currentTier: {
      id: current.id,
      name: current.name,
      level: current.level,
      color: current.color,
    },
    nextTier: nextTier ? {
      id: nextTier.id,
      name: nextTier.name,
      level: nextTier.level,
      color: nextTier.color,
      requirementType,
      requiredValue,
    } : null,
    currentValue,
    progress: Math.round(progress),
    remaining: nextTier ? requiredValue - currentValue : 0,
    isMaxTier: !nextTier,
    calculatedAt: new Date().toISOString(),
  };
  
  tierProgresses.set(customerId, tierProgress);
  
  return tierProgress;
}

/**
 * Check and upgrade customer tier
 */
function checkTierUpgrade(customerId, customerData) {
  const progress = calculateTierProgress(customerId, customerData);
  
  if (!progress || !progress.nextTier) {
    return null; // Already at max tier
  }
  
  // Check if eligible for upgrade
  if (progress.currentValue >= progress.nextTier.requiredValue) {
    const upgrade = upgradeTier(customerId, progress.nextTier.id, {
      reason: 'Automatic upgrade',
      previousTier: progress.currentTier.id,
      metRequirement: true,
      requirementType: progress.nextTier.requirementType,
      achievedValue: progress.currentValue,
    });
    
    return upgrade;
  }
  
  return null;
}

/**
 * Upgrade customer tier
 */
function upgradeTier(customerId, newTierId, metadata = {}) {
  const tier = tiers.get(newTierId);
  
  if (!tier) {
    throw new Error('Tier not found');
  }
  
  const upgrade = {
    customerId,
    fromTier: metadata.previousTier || null,
    toTier: newTierId,
    tierName: tier.name,
    tierLevel: tier.level,
    reason: metadata.reason || 'Manual upgrade',
    metadata,
    upgradedAt: new Date().toISOString(),
  };
  
  // Add to history
  if (!tierUpgradeHistory.has(customerId)) {
    tierUpgradeHistory.set(customerId, []);
  }
  tierUpgradeHistory.get(customerId).push(upgrade);
  
  // Update tier statistics
  tier.statistics.totalMembers++;
  tier.statistics.newMembersThisMonth++;
  
  return upgrade;
}

/**
 * Downgrade customer tier
 */
function downgradeTier(customerId, newTierId, reason) {
  const tier = tiers.get(newTierId);
  
  if (!tier) {
    throw new Error('Tier not found');
  }
  
  const downgrade = {
    customerId,
    toTier: newTierId,
    tierName: tier.name,
    tierLevel: tier.level,
    reason,
    downgradedAt: new Date().toISOString(),
  };
  
  // Add to history
  if (!tierUpgradeHistory.has(customerId)) {
    tierUpgradeHistory.set(customerId, []);
  }
  tierUpgradeHistory.get(customerId).push({
    ...downgrade,
    type: 'downgrade',
  });
  
  return downgrade;
}

/**
 * Get tier upgrade history
 */
function getTierHistory(customerId) {
  const history = tierUpgradeHistory.get(customerId) || [];
  
  return {
    customerId,
    history: history.sort((a, b) => 
      new Date(b.upgradedAt || b.downgradedAt) - new Date(a.upgradedAt || a.downgradedAt)
    ),
    total: history.length,
  };
}

/**
 * Get tier progress
 */
function getTierProgress(customerId) {
  return tierProgresses.get(customerId) || null;
}

/**
 * Calculate tier benefits value
 */
function calculateBenefitsValue(tierId, purchaseAmount = 0) {
  const tier = tiers.get(tierId);
  
  if (!tier) {
    return { benefits: [], totalValue: 0 };
  }
  
  const benefits = Array.from(tierBenefits.values())
    .filter(b => b.enabled)
    .filter(b => b.tiers.includes(tier.level));
  
  let totalValue = 0;
  
  const benefitsWithValue = benefits.map(benefit => {
    let value = 0;
    
    if (benefit.type === 'discount' && benefit.value && purchaseAmount > 0) {
      value = (purchaseAmount * benefit.value) / 100;
    } else if (benefit.type === 'free_shipping' && benefit.value) {
      value = benefit.value; // Fixed shipping cost saved
    } else if (benefit.type === 'bonus_points' && benefit.value) {
      value = benefit.value; // Extra points value
    }
    
    totalValue += value;
    
    return {
      ...benefit,
      estimatedValue: value,
    };
  });
  
  return {
    tier: { id: tier.id, name: tier.name, level: tier.level },
    benefits: benefitsWithValue,
    totalValue: Math.round(totalValue * 100) / 100,
    pointsMultiplier: tier.pointsMultiplier,
  };
}

/**
 * Create VIP segment
 */
function createVIPSegment(data) {
  const segment = {
    id: `vip_${Date.now()}`,
    name: data.name,
    criteria: data.criteria, // { minSpending, minOrders, minPoints, tier }
    benefits: data.benefits || [],
    autoEnroll: data.autoEnroll !== false,
    maxMembers: data.maxMembers || null,
    description: data.description || '',
    enabled: data.enabled !== false,
    createdAt: new Date().toISOString(),
    members: new Set(),
  };
  
  return segment;
}

/**
 * Get tier leaderboard
 */
function getTierLeaderboard(options = {}) {
  const { limit = 10, metric = 'points' } = options;
  
  // This would query customer data sorted by the metric
  // For now, returning structure
  return {
    metric,
    leaders: [],
    total: 0,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Predict tier milestones
 */
function predictTierMilestones(customerId, customerData) {
  const progress = calculateTierProgress(customerId, customerData);
  
  if (!progress || !progress.nextTier) {
    return null;
  }
  
  const { currentValue, nextTier } = progress;
  const remaining = nextTier.requiredValue - currentValue;
  
  // Estimate time to next tier based on recent activity
  // This is simplified - would use actual historical data
  const estimatedMonthlyGrowth = currentValue / 12; // Assume 1 year of activity
  const monthsToUpgrade = estimatedMonthlyGrowth > 0
    ? Math.ceil(remaining / estimatedMonthlyGrowth)
    : null;
  
  return {
    nextTier: nextTier.name,
    remaining,
    remainingFormatted: formatRequirement(nextTier.requirementType, remaining),
    estimatedMonthsToUpgrade: monthsToUpgrade,
    estimatedUpgradeDate: monthsToUpgrade
      ? new Date(Date.now() + monthsToUpgrade * 30 * 24 * 60 * 60 * 1000).toISOString()
      : null,
  };
}

/**
 * Format requirement value
 */
function formatRequirement(type, value) {
  if (type === 'points') {
    return `${value.toLocaleString()} points`;
  } else if (type === 'spending') {
    return `$${value.toLocaleString()}`;
  } else if (type === 'orders') {
    return `${value} orders`;
  }
  return value.toString();
}

/**
 * Get tier statistics
 */
function getTierStatistics() {
  const allTiers = Array.from(tiers.values());
  
  const totalMembers = allTiers.reduce((sum, t) => sum + t.statistics.totalMembers, 0);
  
  const tierDistribution = allTiers.map(tier => ({
    tier: tier.name,
    level: tier.level,
    members: tier.statistics.totalMembers,
    percentage: totalMembers > 0 
      ? ((tier.statistics.totalMembers / totalMembers) * 100).toFixed(2)
      : 0,
  }));
  
  return {
    totalTiers: tiers.size,
    totalMembers,
    tierDistribution,
    benefits: {
      total: tierBenefits.size,
      enabled: Array.from(tierBenefits.values()).filter(b => b.enabled).length,
    },
  };
}

module.exports = {
  createTier,
  getTiers,
  getTier,
  createTierBenefit,
  getTierBenefits,
  calculateTierProgress,
  checkTierUpgrade,
  upgradeTier,
  downgradeTier,
  getTierHistory,
  getTierProgress,
  calculateBenefitsValue,
  createVIPSegment,
  getTierLeaderboard,
  predictTierMilestones,
  getTierStatistics,
};
