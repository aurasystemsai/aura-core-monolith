/**
 * A/B Testing Suite - Traffic Allocator & Multi-Armed Bandit
 * 
 * Intelligent traffic allocation algorithms:
 * - Fixed allocation (round-robin, weighted)  
 * - Multi-armed bandit (Thompson sampling, UCB, epsilon-greedy)
 * - Contextual bandits (personalized allocation)
 * - Regret analysis (opportunity cost tracking)
 * 
 * @module traffic-allocator
 */

const { betaSample } = require('./experiment-engine');

// In-memory storage
const allocations = new Map();
const assignments = new Map(); // visitor -> variant assignments
const armStats = new Map(); // arms (variants) performance tracking

/**
 * Create traffic allocator for experiment
 */
function createAllocator(experimentId, config) {
  const allocator = {
    experimentId,
    type: config.type || 'fixed', // 'fixed' | 'bandit' | 'contextual'
    method: config.method || 'round-robin', // 'round-robin' | 'weighted' | 'thompson-sampling' | 'ucb' | 'epsilon-greedy'
    parameters: config.parameters || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  allocations.set(experimentId, allocator);
  
  // Initialize arm stats
  if (config.variants) {
    for (const variant of config.variants) {
      initializeArmStats(experimentId, variant.id);
    }
  }
  
  return allocator;
}

/**
 * Initialize statistics for an arm (variant)
 */
function initializeArmStats(experimentId, variantId) {
  const key = `${experimentId}:${variantId}`;
  
  if (!armStats.has(key)) {
    armStats.set(key, {
      experimentId,
      variantId,
      pulls: 0, // number of times shown
      rewards: 0, // total rewards (conversions)
      rewardSum: 0, // sum of reward values
      alpha: 1, // Beta distribution parameter (successes + 1)
      beta: 1, // Beta distribution parameter (failures + 1)
      avgReward: 0,
      lastPulled: null,
      createdAt: new Date().toISOString()
    });
  }
  
  return armStats.get(key);
}

/**
 * Get arm stats
 */
function getArmStats(experimentId, variantId) {
  const key = `${experimentId}:${variantId}`;
  return armStats.get(key);
}

/**
 * Update arm stats with reward
 */
function updateArmStats(experimentId, variantId, reward = 1) {
  const key = `${experimentId}:${variantId}`;
  const stats = armStats.get(key);
  
  if (!stats) {
    throw new Error('Arm stats not found');
  }
  
  stats.pulls++;
  stats.rewardSum += reward;
  stats.rewards += (reward > 0 ? 1 : 0);
  stats.avgReward = stats.rewardSum / stats.pulls;
  
  // Update Beta distribution parameters
  if (reward > 0) {
    stats.alpha++;
  } else {
    stats.beta++;
  }
  
  stats.lastPulled = new Date().toISOString();
  stats.updatedAt = new Date().toISOString();
  
  return stats;
}

// ============================================================================
// VARIANT ASSIGNMENT
// ============================================================================

/**
 * Assign variant to visitor
 */
function assignVariant(experimentId, visitorId, variants, context = {}) {
  // Check for existing assignment
  const existingAssignment = getAssignment(experimentId, visitorId);
  if (existingAssignment) {
    return existingAssignment;
  }
  
  const allocator = allocations.get(experimentId);
  
  if (!allocator) {
    throw new Error('Allocator not found');
  }
  
  let selectedVariant;
  
  // Select variant based on allocation method
  switch (allocator.type) {
    case 'fixed':
      selectedVariant = fixedAllocation(experimentId, visitorId, variants, allocator.method);
      break;
    
    case 'bandit':
      selectedVariant = banditAllocation(experimentId, variants, allocator.method, allocator.parameters);
      break;
    
    case 'contextual':
      selectedVariant = contextualAllocation(experimentId, visitorId, variants, context, allocator.parameters);
      break;
    
    default:
      throw new Error(`Unknown allocator type: ${allocator.type}`);
  }
  
  // Record assignment
  const assignment = {
    experimentId,
    visitorId,
    variantId: selectedVariant.id,
    variantName: selectedVariant.name,
    method: allocator.method,
    context,
    assignedAt: new Date().toISOString()
  };
  
  const key = `${experimentId}:${visitorId}`;
  assignments.set(key, assignment);
  
  // Update arm stats
  updateArmStats(experimentId, selectedVariant.id, 0); // Pull without reward yet
  
  return assignment;
}

/**
 * Get existing assignment
 */
function getAssignment(experimentId, visitorId) {
  const key = `${experimentId}:${visitorId}`;
  return assignments.get(key);
}

// ============================================================================
// FIXED ALLOCATION STRATEGIES
// ============================================================================

/**
 * Fixed allocation (deterministic)
 */
function fixedAllocation(experimentId, visitorId, variants, method = 'round-robin') {
  switch (method) {
    case 'round-robin':
      return roundRobinAllocation(experimentId, variants);
    
    case 'weighted':
      return weightedAllocation(variants);
    
    case 'hash':
      return hashAllocation(visitorId, variants);
    
    default:
      return roundRobinAllocation(experimentId, variants);
  }
}

/**
 * Round-robin allocation
 */
function roundRobinAllocation(experimentId, variants) {
  const allStats = variants.map(v => getArmStats(experimentId, v.id) || initializeArmStats(experimentId, v.id));
  
  // Find variant with fewest pulls
  const minPulls = Math.min(...allStats.map(s => s.pulls));
  const candidates = allStats.filter(s => s.pulls === minPulls);
  
  // Random selection among ties
  const selected = candidates[Math.floor(Math.random() * candidates.length)];
  
  return variants.find(v => v.id === selected.variantId);
}

/**
 * Weighted allocation based on traffic weights
 */
function weightedAllocation(variants) {
  const totalWeight = variants.reduce((sum, v) => sum + v.trafficWeight, 0);
  const random = Math.random() * totalWeight;
  
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.trafficWeight;
    if (random <= cumulative) {
      return variant;
    }
  }
  
  return variants[variants.length - 1];
}

/**
 * Consistent hash allocation (same visitor always gets same variant)
 */
function hashAllocation(visitorId, variants) {
  const hash = simpleHash(visitorId);
  const index = hash % variants.length;
  return variants[index];
}

/**
 * Simple hash function
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// ============================================================================
// MULTI-ARMED BANDIT ALLOCATION
// ============================================================================

/**
 * Multi-armed bandit allocation
 */
function banditAllocation(experimentId, variants, method = 'thompson-sampling', parameters = {}) {
  switch (method) {
    case 'thompson-sampling':
      return thompsonSampling(experimentId, variants);
    
    case 'ucb':
      return upperConfidenceBound(experimentId, variants, parameters.explorationRate || 2.0);
    
    case 'epsilon-greedy':
      return epsilonGreedy(experimentId, variants, parameters.epsilon || 0.1);
    
    default:
      return thompsonSampling(experimentId, variants);
  }
}

/**
 * Thompson Sampling (Bayesian multi-armed bandit)
 */
function thompsonSampling(experimentId, variants) {
  const samples = [];
  
  for (const variant of variants) {
    const stats = getArmStats(experimentId, variant.id) || initializeArmStats(experimentId, variant.id);
    
    // Sample from posterior Beta distribution
    const sample = betaSample(stats.alpha, stats.beta);
    
    samples.push({
      variant,
      sample,
      stats
    });
  }
  
  // Select variant with highest sample
  samples.sort((a, b) => b.sample - a.sample);
  
  return samples[0].variant;
}

/**
 * Upper Confidence Bound (UCB1)
 */
function upperConfidenceBound(experimentId, variants, explorationRate = 2.0) {
  const totalPulls = variants.reduce((sum, v) => {
    const stats = getArmStats(experimentId, v.id);
    return sum + (stats ? stats.pulls : 0);
  }, 0);
  
  // Return random variant if no data yet
  if (totalPulls === 0) {
    return variants[Math.floor(Math.random() * variants.length)];
  }
  
  const ucbScores = [];
  
  for (const variant of variants) {
    const stats = getArmStats(experimentId, variant.id) || initializeArmStats(experimentId, variant.id);
    
    if (stats.pulls === 0) {
      // Give unpulled arms highest priority
      ucbScores.push({
        variant,
        score: Infinity
      });
    } else {
      // UCB1 formula: avgReward + explorationRate * sqrt(ln(totalPulls) / pulls)
      const exploitation = stats.avgReward;
      const exploration = explorationRate * Math.sqrt(Math.log(totalPulls) / stats.pulls);
      const ucbScore = exploitation + exploration;
      
      ucbScores.push({
        variant,
        score: ucbScore
      });
    }
  }
  
  // Select variant with highest UCB score
  ucbScores.sort((a, b) => b.score - a.score);
  
  return ucbScores[0].variant;
}

/**
 * Epsilon-Greedy
 */
function epsilonGreedy(experimentId, variants, epsilon = 0.1) {
  // Explore: random variant
  if (Math.random() < epsilon) {
    return variants[Math.floor(Math.random() * variants.length)];
  }
  
  // Exploit: best performing variant
  const stats = variants.map(v => ({
    variant: v,
    stats: getArmStats(experimentId, v.id) || initializeArmStats(experimentId, v.id)
  }));
  
  stats.sort((a, b) => b.stats.avgReward - a.stats.avgReward);
  
  return stats[0].variant;
}

// ============================================================================
// CONTEXTUAL BANDITS
// ============================================================================

/**
 * Contextual bandit allocation (personalized based on context)
 */
function contextualAllocation(experimentId, visitorId, variants, context, parameters = {}) {
  // Simplified contextual bandit using context features to bias selection
  const contextualScores = [];
  
  for (const variant of variants) {
    const stats = getArmStats(experimentId, variant.id) || initializeArmStats(experimentId, variant.id);
    
    // Calculate base score (Thompson sampling)
    const baseSample = betaSample(stats.alpha, stats.beta);
    
    // Adjust based on context (simple heuristic for demo)
    const contextBonus = calculateContextBonus(variant, context);
    const finalScore = baseSample * (1 + contextBonus);
    
    contextualScores.push({
      variant,
      score: finalScore,
      baseSample,
      contextBonus
    });
  }
  
  // Select variant with highest contextual score
  contextualScores.sort((a, b) => b.score - a.score);
  
  return contextualScores[0].variant;
}

/**
 * Calculate context bonus for variant
 */
function calculateContextBonus(variant, context) {
  let bonus = 0;
  
  // Example: boost score for mobile users if variant is mobile-optimized
  if (context.device === 'mobile' && variant.metadata?.mobileOptimized) {
    bonus += 0.2;
  }
  
  // Example: boost score for returning visitors if variant targets them
  if (context.isReturningVisitor && variant.metadata?.targetReturning) {
    bonus += 0.15;
  }
  
  // Example: boost score for high-value segments
  if (context.customerSegment === 'high-value' && variant.metadata?.targetHighValue) {
    bonus += 0.25;
  }
  
  return bonus;
}

// ============================================================================
// REGRET ANALYSIS
// ============================================================================

/**
 * Calculate cumulative regret (opportunity cost)
 */
function calculateRegret(experimentId, variants) {
  const allStats = variants.map(v => getArmStats(experimentId, v.id) || initializeArmStats(experimentId, v.id));
  
  // Find best arm (highest average reward)
  const bestArm = allStats.reduce((best, current) => {
    if (!best || current.avgReward > best.avgReward) {
      return current;
    }
    return best;
  });
  
  if (!bestArm) {
    return {
      totalRegret: 0,
      perArmRegret: {},
      bestVariantId: null
    };
  }
  
  const bestReward = bestArm.avgReward;
  let totalRegret = 0;
  const perArmRegret = {};
  
  for (const stats of allStats) {
    // Regret = (best reward - actual reward) * number of pulls
    const armRegret = (bestReward - stats.avgReward) * stats.pulls;
    totalRegret += armRegret;
    perArmRegret[stats.variantId] = armRegret;
  }
  
  return {
    totalRegret,
    perArmRegret,
    bestVariantId: bestArm.variantId,
    bestReward,
    totalPulls: allStats.reduce((sum, s) => sum + s.pulls, 0)
  };
}

/**
 * Calculate expected regret rate (regret per pull)
 */
function calculateRegretRate(experimentId, variants) {
  const regret = calculateRegret(experimentId, variants);
  
  return {
    ...regret,
    regretRate: regret.totalPulls > 0 ? regret.totalRegret / regret.totalPulls : 0
  };
}

// ============================================================================
// TRAFFIC DISTRIBUTION ANALYSIS
// ============================================================================

/**
 * Get traffic distribution across variants
 */
function getTrafficDistribution(experimentId, variants) {
  const distribution = [];
  let totalPulls = 0;
  
  for (const variant of variants) {
    const stats = getArmStats(experimentId, variant.id) || initializeArmStats(experimentId, variant.id);
    totalPulls += stats.pulls;
    
    distribution.push({
      variantId: variant.id,
      variantName: variant.name,
      pulls: stats.pulls,
      rewards: stats.rewards,
      avgReward: stats.avgReward,
      percentage: 0 // Will calculate after total known
    });
  }
  
  // Calculate percentages
  for (const item of distribution) {
    item.percentage = totalPulls > 0 ? (item.pulls / totalPulls) * 100 : 0;
  }
  
  return {
    distribution,
    totalPulls,
    experimentId
  };
}

/**
 * Rebalance traffic allocation (for adaptive experiments)
 */
function rebalanceAllocation(experimentId, variants, targetMethod = 'thompson-sampling') {
  const allocator = allocations.get(experimentId);
  
  if (!allocator) {
    throw new Error('Allocator not found');
  }
  
  // Update allocation method
  allocator.method = targetMethod;
  allocator.updatedAt = new Date().toISOString();
  
  // Calculate recommended new weights based on performance
  const distribution = getTrafficDistribution(experimentId, variants);
  const recommendations = [];
  
  for (const item of distribution.distribution) {
    const stats = getArmStats(experimentId, item.variantId);
    
    // Calculate recommended weight based on performance
    // Better performing variants get more traffic
    const performanceScore = stats ? stats.avgReward : 0;
    
    recommendations.push({
      variantId: item.variantId,
      variantName: item.variantName,
      currentPulls: item.pulls,
      currentPercentage: item.percentage,
      avgReward: item.avgReward,
      recommendedWeight: performanceScore > 0 ? Math.round(performanceScore * 100) : 10
    });
  }
  
  return {
    experimentId,
    newMethod: targetMethod,
    recommendations,
    updatedAt: allocator.updatedAt
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get allocator configuration
 */
function getAllocator(experimentId) {
  return allocations.get(experimentId);
}

/**
 * Update allocator configuration
 */
function updateAllocator(experimentId, updates) {
  const allocator = allocations.get(experimentId);
  
  if (!allocator) {
    throw new Error('Allocator not found');
  }
  
  Object.assign(allocator, updates);
  allocator.updatedAt = new Date().toISOString();
  
  return allocator;
}

/**
 * Get all assignments for experiment
 */
function getExperimentAssignments(experimentId) {
  const allAssignments = Array.from(assignments.values());
  return allAssignments.filter(a => a.experimentId === experimentId);
}

/**
 * Get all arm statistics for experiment
 */
function getExperimentArmStats(experimentId) {
  const allStats = Array.from(armStats.values());
  return allStats.filter(s => s.experimentId === experimentId);
}

/**
 * Reset arm statistics (for testing or restarting experiment)
 */
function resetArmStats(experimentId, variantId = null) {
  if (variantId) {
    // Reset specific arm
    const key = `${experimentId}:${variantId}`;
    armStats.delete(key);
    initializeArmStats(experimentId, variantId);
  } else {
    // Reset all arms for experiment
    const keys = Array.from(armStats.keys()).filter(k => k.startsWith(`${experimentId}:`));
    keys.forEach(key => armStats.delete(key));
  }
  
  return { success: true, reset: variantId || 'all' };
}

module.exports = {
  // Allocator management
  createAllocator,
  getAllocator,
  updateAllocator,
  rebalanceAllocation,
  
  // Variant assignment
  assignVariant,
  getAssignment,
  getExperimentAssignments,
  
  // Arm statistics
  initializeArmStats,
  getArmStats,
  updateArmStats,
  getExperimentArmStats,
  resetArmStats,
  
  // Allocation strategies
  fixedAllocation,
  banditAllocation,
  contextualAllocation,
  
  // Multi-armed bandit algorithms
  thompsonSampling,
  upperConfidenceBound,
  epsilonGreedy,
  
  // Analysis
  calculateRegret,
  calculateRegretRate,
  getTrafficDistribution,
  
  // Storage (for testing)
  allocations,
  assignments,
  armStats
};
