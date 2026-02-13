/**
 * Points & Rewards Engine
 * Manages point earning, redemption, balances, and reward catalog
 */

// Storage
const customers = new Map(); // customerId -> customer data
const pointsTransactions = new Map(); // transactionId -> transaction
const rewards = new Map(); // rewardId -> reward
const redemptions = new Map(); // redemptionId -> redemption
const pointsRules = new Map(); // ruleId -> rule

let transactionCounter = 1;
let rewardCounter = 1;
let redemptionCounter = 1;
let ruleCounter = 1;

/**
 * Get or create customer points account
 */
function getCustomerAccount(customerId) {
  if (!customers.has(customerId)) {
    customers.set(customerId, {
      customerId,
      pointsBalance: 0,
      lifetimePoints: 0,
      totalRedeemed: 0,
      tier: 'bronze',
      joinedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    });
  }
  return customers.get(customerId);
}

/**
 * Create points earning rule
 */
function createPointsRule(data) {
  const rule = {
    id: `rule_${ruleCounter++}`,
    name: data.name,
    type: data.type, // purchase, signup, review, referral, birthday, social_share, custom
    points: data.points || 0,
    multiplier: data.multiplier || 1,
    conditions: data.conditions || {},
    enabled: data.enabled !== false,
    priority: data.priority || 0,
    validFrom: data.validFrom || null,
    validUntil: data.validUntil || null,
    createdAt: new Date().toISOString(),
    statistics: {
      timesApplied: 0,
      totalPointsAwarded: 0,
    },
  };
  
  pointsRules.set(rule.id, rule);
  return rule;
}

/**
 * Award points to customer
 */
function awardPoints(data) {
  const { customerId, points, reason, ruleId, metadata } = data;
  
  const customer = getCustomerAccount(customerId);
  
  const transaction = {
    id: `txn_${transactionCounter++}`,
    customerId,
    type: 'earn',
    points,
    reason,
    ruleId: ruleId || null,
    metadata: metadata || {},
    balanceBefore: customer.pointsBalance,
    balanceAfter: customer.pointsBalance + points,
    status: 'completed',
    createdAt: new Date().toISOString(),
    expiresAt: data.expiresAt || null,
  };
  
  // Update customer balance
  customer.pointsBalance += points;
  customer.lifetimePoints += points;
  customer.lastActivity = new Date().toISOString();
  
  pointsTransactions.set(transaction.id, transaction);
  
  // Update rule statistics
  if (ruleId && pointsRules.has(ruleId)) {
    const rule = pointsRules.get(ruleId);
    rule.statistics.timesApplied++;
    rule.statistics.totalPointsAwarded += points;
  }
  
  return transaction;
}

/**
 * Deduct points (for redemption or adjustment)
 */
function deductPoints(data) {
  const { customerId, points, reason, metadata } = data;
  
  const customer = getCustomerAccount(customerId);
  
  if (customer.pointsBalance < points) {
    throw new Error('Insufficient points balance');
  }
  
  const transaction = {
    id: `txn_${transactionCounter++}`,
    customerId,
    type: 'redeem',
    points: -points,
    reason,
    metadata: metadata || {},
    balanceBefore: customer.pointsBalance,
    balanceAfter: customer.pointsBalance - points,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };
  
  customer.pointsBalance -= points;
  customer.totalRedeemed += points;
  customer.lastActivity = new Date().toISOString();
  
  pointsTransactions.set(transaction.id, transaction);
  
  return transaction;
}

/**
 * Get customer points balance
 */
function getPointsBalance(customerId) {
  const customer = getCustomerAccount(customerId);
  return {
    customerId,
    pointsBalance: customer.pointsBalance,
    lifetimePoints: customer.lifetimePoints,
    totalRedeemed: customer.totalRedeemed,
    tier: customer.tier,
    lastActivity: customer.lastActivity,
  };
}

/**
 * Get points transaction history
 */
function getTransactionHistory(customerId, options = {}) {
  const { limit = 50, offset = 0, type } = options;
  
  const customerTransactions = Array.from(pointsTransactions.values())
    .filter(txn => txn.customerId === customerId)
    .filter(txn => !type || txn.type === type)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const total = customerTransactions.length;
  const transactions = customerTransactions.slice(offset, offset + limit);
  
  return {
    transactions,
    total,
    hasMore: offset + limit < total,
  };
}

/**
 * Create reward in catalog
 */
function createReward(data) {
  const reward = {
    id: `reward_${rewardCounter++}`,
    name: data.name,
    description: data.description || '',
    type: data.type, // discount, free_shipping, product, gift_card, custom
    pointsCost: data.pointsCost,
    value: data.value || null, // monetary value or discount percentage
    imageUrl: data.imageUrl || null,
    category: data.category || 'general',
    stockLimit: data.stockLimit || null,
    stockAvailable: data.stockLimit || null,
    requiresTier: data.requiresTier || null,
    conditions: data.conditions || {},
    enabled: data.enabled !== false,
    featured: data.featured || false,
    expiryDays: data.expiryDays || null,
    createdAt: new Date().toISOString(),
    statistics: {
      totalRedemptions: 0,
      totalPointsRedeemed: 0,
    },
  };
  
  rewards.set(reward.id, reward);
  return reward;
}

/**
 * Get reward catalog
 */
function getRewardCatalog(options = {}) {
  const { category, minPoints, maxPoints, featured, enabled = true, tier } = options;
  
  let rewardList = Array.from(rewards.values())
    .filter(r => enabled === null || r.enabled === enabled)
    .filter(r => !category || r.category === category)
    .filter(r => !minPoints || r.pointsCost >= minPoints)
    .filter(r => !maxPoints || r.pointsCost <= maxPoints)
    .filter(r => !featured || r.featured === featured)
    .filter(r => !tier || !r.requiresTier || r.requiresTier === tier)
    .filter(r => !r.stockLimit || r.stockAvailable > 0);
  
  // Sort by featured first, then by points cost
  rewardList.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return a.pointsCost - b.pointsCost;
  });
  
  return { rewards: rewardList, total: rewardList.length };
}

/**
 * Redeem reward
 */
function redeemReward(data) {
  const { customerId, rewardId, quantity = 1 } = data;
  
  const customer = getCustomerAccount(customerId);
  const reward = rewards.get(rewardId);
  
  if (!reward) {
    throw new Error('Reward not found');
  }
  
  if (!reward.enabled) {
    throw new Error('Reward is not available');
  }
  
  const totalCost = reward.pointsCost * quantity;
  
  if (customer.pointsBalance < totalCost) {
    throw new Error('Insufficient points balance');
  }
  
  if (reward.stockLimit && reward.stockAvailable < quantity) {
    throw new Error('Insufficient stock available');
  }
  
  if (reward.requiresTier && customer.tier !== reward.requiresTier) {
    throw new Error(`Requires ${reward.requiresTier} tier`);
  }
  
  // Create redemption
  const redemption = {
    id: `redemption_${redemptionCounter++}`,
    customerId,
    rewardId,
    rewardName: reward.name,
    quantity,
    pointsCost: totalCost,
    status: 'pending', // pending, fulfilled, cancelled
    code: generateRedemptionCode(),
    expiresAt: reward.expiryDays 
      ? new Date(Date.now() + reward.expiryDays * 24 * 60 * 60 * 1000).toISOString()
      : null,
    redeemedAt: new Date().toISOString(),
    fulfilledAt: null,
  };
  
  // Deduct points
  deductPoints({
    customerId,
    points: totalCost,
    reason: `Redeemed: ${reward.name}`,
    metadata: { redemptionId: redemption.id, rewardId },
  });
  
  // Update stock
  if (reward.stockLimit) {
    reward.stockAvailable -= quantity;
  }
  
  // Update reward statistics
  reward.statistics.totalRedemptions += quantity;
  reward.statistics.totalPointsRedeemed += totalCost;
  
  redemptions.set(redemption.id, redemption);
  
  return redemption;
}

/**
 * Get customer redemptions
 */
function getCustomerRedemptions(customerId, options = {}) {
  const { status, limit = 20, offset = 0 } = options;
  
  const customerRedemptions = Array.from(redemptions.values())
    .filter(r => r.customerId === customerId)
    .filter(r => !status || r.status === status)
    .sort((a, b) => new Date(b.redeemedAt) - new Date(a.redeemedAt));
  
  const total = customerRedemptions.length;
  const items = customerRedemptions.slice(offset, offset + limit);
  
  return {
    redemptions: items,
    total,
    hasMore: offset + limit < total,
  };
}

/**
 * Fulfill redemption
 */
function fulfillRedemption(redemptionId, data = {}) {
  const redemption = redemptions.get(redemptionId);
  
  if (!redemption) {
    throw new Error('Redemption not found');
  }
  
  if (redemption.status === 'fulfilled') {
    throw new Error('Redemption already fulfilled');
  }
  
  redemption.status = 'fulfilled';
  redemption.fulfilledAt = new Date().toISOString();
  redemption.fulfillmentNotes = data.notes || null;
  
  return redemption;
}

/**
 * Cancel redemption and refund points
 */
function cancelRedemption(redemptionId, reason) {
  const redemption = redemptions.get(redemptionId);
  
  if (!redemption) {
    throw new Error('Redemption not found');
  }
  
  if (redemption.status === 'cancelled') {
    throw new Error('Redemption already cancelled');
  }
  
  // Refund points
  awardPoints({
    customerId: redemption.customerId,
    points: redemption.pointsCost,
    reason: `Refund: ${redemption.rewardName} (${reason})`,
    metadata: { redemptionId, refund: true },
  });
  
  // Restore stock
  const reward = rewards.get(redemption.rewardId);
  if (reward && reward.stockLimit) {
    reward.stockAvailable += redemption.quantity;
  }
  
  redemption.status = 'cancelled';
  redemption.cancelledAt = new Date().toISOString();
  redemption.cancellationReason = reason;
  
  return redemption;
}

/**
 * Calculate points for purchase
 */
function calculatePurchasePoints(orderData) {
  const { orderTotal, customerId, items } = orderData;
  
  const customer = getCustomerAccount(customerId);
  
  // Find applicable purchase rules
  const applicableRules = Array.from(pointsRules.values())
    .filter(rule => rule.enabled && rule.type === 'purchase')
    .filter(rule => {
      if (rule.validFrom && new Date(rule.validFrom) > new Date()) return false;
      if (rule.validUntil && new Date(rule.validUntil) < new Date()) return false;
      return true;
    })
    .sort((a, b) => b.priority - a.priority);
  
  let totalPoints = 0;
  const appliedRules = [];
  
  for (const rule of applicableRules) {
    let points = 0;
    
    // Check conditions
    if (rule.conditions.minOrderValue && orderTotal < rule.conditions.minOrderValue) {
      continue;
    }
    
    if (rule.conditions.category && items) {
      const categoryItems = items.filter(item => item.category === rule.conditions.category);
      if (categoryItems.length === 0) continue;
    }
    
    // Calculate points
    if (rule.points) {
      points = rule.points; // Fixed points
    } else if (rule.multiplier) {
      points = Math.floor(orderTotal * rule.multiplier); // Points per dollar
    }
    
    totalPoints += points;
    appliedRules.push({ ruleId: rule.id, ruleName: rule.name, points });
  }
  
  return {
    totalPoints,
    appliedRules,
    orderTotal,
  };
}

/**
 * Process purchase and award points
 */
function processPurchase(orderData) {
  const { customerId, orderId, orderTotal } = orderData;
  
  const calculation = calculatePurchasePoints(orderData);
  
  if (calculation.totalPoints > 0) {
    const transaction = awardPoints({
      customerId,
      points: calculation.totalPoints,
      reason: `Purchase: Order ${orderId}`,
      metadata: {
        orderId,
        orderTotal,
        appliedRules: calculation.appliedRules,
      },
    });
    
    return {
      transaction,
      pointsEarned: calculation.totalPoints,
      appliedRules: calculation.appliedRules,
    };
  }
  
  return null;
}

/**
 * Transfer points between customers
 */
function transferPoints(data) {
  const { fromCustomerId, toCustomerId, points, reason } = data;
  
  // Deduct from sender
  deductPoints({
    customerId: fromCustomerId,
    points,
    reason: `Transfer to ${toCustomerId}: ${reason}`,
    metadata: { transfer: true, toCustomerId },
  });
  
  // Award to recipient
  awardPoints({
    customerId: toCustomerId,
    points,
    reason: `Transfer from ${fromCustomerId}: ${reason}`,
    metadata: { transfer: true, fromCustomerId },
  });
  
  return {
    success: true,
    fromCustomerId,
    toCustomerId,
    points,
  };
}

/**
 * Get points expiring soon
 */
function getExpiringPoints(customerId, days = 30) {
  const cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  
  const expiringTransactions = Array.from(pointsTransactions.values())
    .filter(txn => txn.customerId === customerId)
    .filter(txn => txn.type === 'earn')
    .filter(txn => txn.expiresAt && new Date(txn.expiresAt) <= cutoffDate)
    .filter(txn => txn.status === 'completed')
    .sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt));
  
  const totalExpiring = expiringTransactions.reduce((sum, txn) => sum + txn.points, 0);
  
  return {
    transactions: expiringTransactions,
    totalExpiring,
    expiryDate: days,
  };
}

/**
 * Generate redemption code
 */
function generateRedemptionCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Get points statistics
 */
function getPointsStatistics() {
  const totalCustomers = customers.size;
  const totalPointsIssued = Array.from(customers.values())
    .reduce((sum, c) => sum + c.lifetimePoints, 0);
  const totalPointsRedeemed = Array.from(customers.values())
    .reduce((sum, c) => sum + c.totalRedeemed, 0);
  const activeBalance = Array.from(customers.values())
    .reduce((sum, c) => sum + c.pointsBalance, 0);
  
  return {
    totalCustomers,
    totalPointsIssued,
    totalPointsRedeemed,
    activeBalance,
    redemptionRate: totalPointsIssued > 0 
      ? ((totalPointsRedeemed / totalPointsIssued) * 100).toFixed(2)
      : 0,
    rewards: {
      total: rewards.size,
      enabled: Array.from(rewards.values()).filter(r => r.enabled).length,
      totalRedemptions: Array.from(rewards.values())
        .reduce((sum, r) => sum + r.statistics.totalRedemptions, 0),
    },
    rules: {
      total: pointsRules.size,
      active: Array.from(pointsRules.values()).filter(r => r.enabled).length,
    },
  };
}

module.exports = {
  getCustomerAccount,
  createPointsRule,
  awardPoints,
  deductPoints,
  getPointsBalance,
  getTransactionHistory,
  createReward,
  getRewardCatalog,
  redeemReward,
  getCustomerRedemptions,
  fulfillRedemption,
  cancelRedemption,
  calculatePurchasePoints,
  processPurchase,
  transferPoints,
  getExpiringPoints,
  getPointsStatistics,
};
