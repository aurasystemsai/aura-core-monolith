/**
 * Traffic Management Engine for AB Testing Suite
 * 
 * Advanced traffic allocation and audience targeting:
 * - Smart traffic allocation with constraints
 * - Audience segmentation and targeting
 * - Gradual ramp-up and ramp-down
 * - Traffic splitting algorithms (hashing, weighted, sticky)
 * - Cross-device tracking
 * - Bot detection and filtering
 * - Geographic and temporal routing
 * - Load balancing and capacity management
 */

// In-memory stores
const trafficRules = new Map();
const userAssignments = new Map();
const audiences = new Map();
const rampSchedules = new Map();
const deviceTracking = new Map();
const botDetection = new Map();
const trafficLogs = new Map();

// ==================== TRAFFIC ALLOCATION ====================

/**
 * Create traffic allocation rule
 */
function createTrafficRule(experimentId, config) {
  const {
    allocationMethod = 'hash', // 'hash', 'weighted', 'round-robin', 'random'
    sticky = true,
    constraints = {},
    weights = {}
  } = config;
  
  const rule = {
    experimentId,
    allocationMethod,
    sticky,
    constraints,
    weights,
    allocations: new Map(),
    createdAt: new Date().toISOString()
  };
  
  trafficRules.set(experimentId, rule);
  
  return rule;
}

/**
 * Assign user to variant
 */
function assignVariant(experimentId, userId, context = {}) {
  const rule = trafficRules.get(experimentId);
  if (!rule) throw new Error('Traffic rule not found');
  
  // Check if user already assigned (sticky sessions)
  if (rule.sticky) {
    const existing = getUserAssignment(experimentId, userId);
    if (existing) {
      logTraffic(experimentId, userId, existing.variantId, 'sticky');
      return existing;
    }
  }
  
  // Check constraints
  if (!checkConstraints(context, rule.constraints)) {
    logTraffic(experimentId, userId, null, 'constraint-failed');
    return null;
  }
  
  // Allocate variant based on method
  let variantId;
  switch (rule.allocationMethod) {
    case 'hash':
      variantId = hashBasedAllocation(experimentId, userId, rule.weights);
      break;
    case 'weighted':
      variantId = weightedRandomAllocation(rule.weights);
      break;
    case 'round-robin':
      variantId = roundRobinAllocation(experimentId, rule.weights);
      break;
    case 'random':
      variantId = randomAllocation(rule.weights);
      break;
    default:
      variantId = hashBasedAllocation(experimentId, userId, rule.weights);
  }
  
  // Store assignment
  const assignment = {
    experimentId,
    userId,
    variantId,
    assignedAt: new Date().toISOString(),
    context
  };
  
  const key = `${experimentId}:${userId}`;
  userAssignments.set(key, assignment);
  
  logTraffic(experimentId, userId, variantId, 'new-assignment');
  
  return assignment;
}

/**
 * Hash-based allocation (consistent hashing)
 */
function hashBasedAllocation(experimentId, userId, weights) {
  const hash = hashString(`${experimentId}:${userId}`);
  const hashValue = hash % 10000 / 10000; // Normalize to 0-1
  
  let cumulative = 0;
  for (const [variantId, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (hashValue < cumulative) {
      return variantId;
    }
  }
  
  // Fallback to first variant
  return Object.keys(weights)[0];
}

/**
 * Weighted random allocation
 */
function weightedRandomAllocation(weights) {
  const rand = Math.random();
  let cumulative = 0;
  
  for (const [variantId, weight] of Object.entries(weights)) {
    cumulative += weight;
    if (rand < cumulative) {
      return variantId;
    }
  }
  
  return Object.keys(weights)[0];
}

/**
 * Round-robin allocation
 */
function roundRobinAllocation(experimentId, weights) {
  const rule = trafficRules.get(experimentId);
  if (!rule.roundRobinIndex) rule.roundRobinIndex = 0;
  
  const variantIds = Object.keys(weights);
  const variantId = variantIds[rule.roundRobinIndex % variantIds.length];
  rule.roundRobinIndex++;
  
  return variantId;
}

/**
 * Random allocation
 */
function randomAllocation(weights) {
  const variantIds = Object.keys(weights);
  return variantIds[Math.floor(Math.random() * variantIds.length)];
}

/**
 * Get user's current assignment
 */
function getUserAssignment(experimentId, userId) {
  const key = `${experimentId}:${userId}`;
  return userAssignments.get(key);
}

/**
 * Override user assignment (for testing)
 */
function overrideAssignment(experimentId, userId, variantId) {
  const key = `${experimentId}:${userId}`;
  const assignment = {
    experimentId,
    userId,
    variantId,
    assignedAt: new Date().toISOString(),
    override: true
  };
  
  userAssignments.set(key, assignment);
  logTraffic(experimentId, userId, variantId, 'override');
  
  return assignment;
}

// ==================== AUDIENCE TARGETING ====================

/**
 * Create audience segment
 */
function createAudience(config) {
  const {
    name,
    description,
    rules // Array of { attribute, operator, value }
  } = config;
  
  const audienceId = `aud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const audience = {
    id: audienceId,
    name,
    description,
    rules,
    memberCount: 0,
    createdAt: new Date().toISOString()
  };
  
  audiences.set(audienceId, audience);
  
  return audience;
}

/**
 * Check if user matches audience
 */
function matchesAudience(audienceId, context) {
  const audience = audiences.get(audienceId);
  if (!audience) return false;
  
  return audience.rules.every(rule => evaluateRule(rule, context));
}

/**
 * Evaluate targeting rule
 */
function evaluateRule(rule, context) {
  const { attribute, operator, value } = rule;
  const contextValue = context[attribute];
  
  switch (operator) {
    case 'equals':
      return contextValue === value;
    case 'not_equals':
      return contextValue !== value;
    case 'in':
      return Array.isArray(value) && value.includes(contextValue);
    case 'not_in':
      return Array.isArray(value) && !value.includes(contextValue);
    case 'contains':
      return String(contextValue).includes(value);
    case 'gt':
      return Number(contextValue) > Number(value);
    case 'gte':
      return Number(contextValue) >= Number(value);
    case 'lt':
      return Number(contextValue) < Number(value);
    case 'lte':
      return Number(contextValue) <= Number(value);
    case 'regex':
      return new RegExp(value).test(String(contextValue));
    default:
      return false;
  }
}

/**
 * Check constraints
 */
function checkConstraints(context, constraints) {
  if (!constraints || Object.keys(constraints).length === 0) return true;
  
  // Geographic constraints
  if (constraints.countries && !constraints.countries.includes(context.country)) {
    return false;
  }
  
  if (constraints.excludeCountries && constraints.excludeCountries.includes(context.country)) {
    return false;
  }
  
  // Platform constraints
  if (constraints.platforms && !constraints.platforms.includes(context.platform)) {
    return false;
  }
  
  // Browser constraints
  if (constraints.browsers && !constraints.browsers.includes(context.browser)) {
    return false;
  }
  
  // Time constraints
  if (constraints.timeRange) {
    const now = new Date();
    const hour = now.getHours();
    if (hour < constraints.timeRange.start || hour >= constraints.timeRange.end) {
      return false;
    }
  }
  
  // Custom attribute constraints
  if (constraints.customAttributes) {
    for (const [attr, value] of Object.entries(constraints.customAttributes)) {
      if (context[attr] !== value) {
        return false;
      }
    }
  }
  
  return true;
}

// ==================== GRADUAL ROLLOUT ====================

/**
 * Create ramp schedule
 */
function createRampSchedule(experimentId, config) {
  const {
    startPercentage = 0,
    targetPercentage = 100,
    incrementBy = 10,
    intervalHours = 24,
    variantId
  } = config;
  
  const scheduleId = `ramp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const steps = [];
  let current = startPercentage;
  let stepTime = new Date();
  
  while (current < targetPercentage) {
    steps.push({
      percentage: Math.min(current + incrementBy, targetPercentage),
      scheduledAt: new Date(stepTime).toISOString()
    });
    current += incrementBy;
    stepTime = new Date(stepTime.getTime() + intervalHours * 60 * 60 * 1000);
  }
  
  const schedule = {
    id: scheduleId,
    experimentId,
    variantId,
    startPercentage,
    targetPercentage,
    incrementBy,
    intervalHours,
    steps,
    currentStep: 0,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  rampSchedules.set(scheduleId, schedule);
  
  return schedule;
}

/**
 * Execute ramp step
 */
function executeRampStep(scheduleId) {
  const schedule = rampSchedules.get(scheduleId);
  if (!schedule) throw new Error('Ramp schedule not found');
  
  if (schedule.currentStep >= schedule.steps.length) {
    schedule.status = 'completed';
    return schedule;
  }
  
  const step = schedule.steps[schedule.currentStep];
  const rule = trafficRules.get(schedule.experimentId);
  
  if (rule && rule.weights[schedule.variantId] !== undefined) {
    // Adjust weights proportionally
    const oldWeight = rule.weights[schedule.variantId];
    const newWeight = step.percentage / 100;
    
    // Redistribute remaining weight among other variants
    const otherVariants = Object.keys(rule.weights).filter(v => v !== schedule.variantId);
    const redistributeAmount = (newWeight - oldWeight) / otherVariants.length;
    
    rule.weights[schedule.variantId] = newWeight;
    otherVariants.forEach(v => {
      rule.weights[v] = Math.max(0, rule.weights[v] - redistributeAmount);
    });
  }
  
  schedule.currentStep++;
  schedule.lastExecuted = new Date().toISOString();
  
  if (schedule.currentStep >= schedule.steps.length) {
    schedule.status = 'completed';
  } else {
    schedule.status = 'in-progress';
  }
  
  return schedule;
}

/**
 * Pause ramp schedule
 */
function pauseRamp(scheduleId) {
  const schedule = rampSchedules.get(scheduleId);
  if (!schedule) throw new Error('Ramp schedule not found');
  
  schedule.status = 'paused';
  schedule.pausedAt = new Date().toISOString();
  
  return schedule;
}

/**
 * Resume ramp schedule
 */
function resumeRamp(scheduleId) {
  const schedule = rampSchedules.get(scheduleId);
  if (!schedule) throw new Error('Ramp schedule not found');
  
  schedule.status = 'in-progress';
  schedule.resumedAt = new Date().toISOString();
  
  return schedule;
}

// ==================== CROSS-DEVICE TRACKING ====================

/**
 * Link devices for cross-device tracking
 */
function linkDevices(userId, deviceId, deviceInfo = {}) {
  if (!deviceTracking.has(userId)) {
    deviceTracking.set(userId, {
      userId,
      devices: new Map(),
      primaryDevice: null
    });
  }
  
  const tracking = deviceTracking.get(userId);
  tracking.devices.set(deviceId, {
    deviceId,
    ...deviceInfo,
    firstSeen: tracking.devices.has(deviceId) 
      ? tracking.devices.get(deviceId).firstSeen 
      : new Date().toISOString(),
    lastSeen: new Date().toISOString()
  });
  
  if (!tracking.primaryDevice) {
    tracking.primaryDevice = deviceId;
  }
  
  return tracking;
}

/**
 * Get all devices for user
 */
function getUserDevices(userId) {
  return deviceTracking.get(userId);
}

/**
 * Sync experiment assignment across devices
 */
function syncAssignmentAcrossDevices(userId, experimentId) {
  const devices = getUserDevices(userId);
  if (!devices) return null;
  
  const assignment = getUserAssignment(experimentId, userId);
  if (!assignment) return null;
  
  // Ensure all devices get the same variant
  devices.devices.forEach(device => {
    const deviceKey = `${experimentId}:${device.deviceId}`;
    if (!userAssignments.has(deviceKey)) {
      userAssignments.set(deviceKey, { ...assignment, deviceId: device.deviceId });
    }
  });
  
  return assignment;
}

// ==================== BOT DETECTION ====================

/**
 * Detect if request is from a bot
 */
function isBotTraffic(context) {
  const {
    userAgent = '',
    ipAddress = '',
    requestRate = 0,
    behaviorSignals = {}
  } = context;
  
  let botScore = 0;
  
  // Check user agent
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /headless/i,
    /phantom/i,
    /selenium/i
  ];
  
  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    botScore += 50;
  }
  
  // Check request rate (requests per minute)
  if (requestRate > 60) {
    botScore += 30;
  } else if (requestRate > 30) {
    botScore += 20;
  }
  
  // Check behavior signals
  if (!behaviorSignals.mouseMovement) botScore += 10;
  if (!behaviorSignals.scrolling) botScore += 10;
  if (behaviorSignals.perfectTiming) botScore += 15;
  if (!behaviorSignals.randomness) botScore += 15;
  
  const isBot = botScore >= 50;
  
  // Log detection
  botDetection.set(`${ipAddress}_${Date.now()}`, {
    userAgent,
    ipAddress,
    requestRate,
    behaviorSignals,
    botScore,
    isBot,
    timestamp: new Date().toISOString()
  });
  
  return isBot;
}

/**
 * Filter bot traffic
 */
function filterBotTraffic(experimentId, userId, context) {
  if (isBotTraffic(context)) {
    logTraffic(experimentId, userId, null, 'bot-filtered');
    return null;
  }
  
  return assignVariant(experimentId, userId, context);
}

// ==================== TRAFFIC ANALYTICS ====================

/**
 * Log traffic event
 */
function logTraffic(experimentId, userId, variantId, event) {
  if (!trafficLogs.has(experimentId)) {
    trafficLogs.set(experimentId, []);
  }
  
  trafficLogs.get(experimentId).push({
    userId,
    variantId,
    event,
    timestamp: new Date().toISOString()
  });
}

/**
 * Get traffic statistics
 */
function getTrafficStats(experimentId) {
  const logs = trafficLogs.get(experimentId) || [];
  
  const stats = {
    total: logs.length,
    byVariant: {},
    byEvent: {},
    uniqueUsers: new Set(logs.map(l => l.userId)).size
  };
  
  logs.forEach(log => {
    // By variant
    if (log.variantId) {
      if (!stats.byVariant[log.variantId]) {
        stats.byVariant[log.variantId] = 0;
      }
      stats.byVariant[log.variantId]++;
    }
    
    // By event
    if (!stats.byEvent[log.event]) {
      stats.byEvent[log.event] = 0;
    }
    stats.byEvent[log.event]++;
  });
  
  return stats;
}

/**
 * Get allocation distribution
 */
function getAllocationDistribution(experimentId) {
  const assignments = [];
  userAssignments.forEach((assignment, key) => {
    if (assignment.experimentId === experimentId) {
      assignments.push(assignment);
    }
  });
  
  const distribution = {};
  assignments.forEach(assignment => {
    if (!distribution[assignment.variantId]) {
      distribution[assignment.variantId] = 0;
    }
    distribution[assignment.variantId]++;
  });
  
  const total = assignments.length;
  Object.keys(distribution).forEach(variantId => {
    distribution[variantId] = {
      count: distribution[variantId],
      percentage: (distribution[variantId] / total) * 100
    };
  });
  
  return {
    total,
    distribution
  };
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Hash string to number
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// ==================== PUBLIC API ====================

module.exports = {
  // Traffic allocation
  createTrafficRule,
  assignVariant,
  getUserAssignment,
  overrideAssignment,
  getAllocationDistribution,
  
  // Audience targeting
  createAudience,
  matchesAudience,
  evaluateRule,
  checkConstraints,
  
  // Gradual rollout
  createRampSchedule,
  executeRampStep,
  pauseRamp,
  resumeRamp,
  
  // Cross-device
  linkDevices,
  getUserDevices,
  syncAssignmentAcrossDevices,
  
  // Bot detection
  isBotTraffic,
  filterBotTraffic,
  
  // Analytics
  logTraffic,
  getTrafficStats,
  
  // Stores
  trafficRules,
  userAssignments,
  audiences,
  rampSchedules,
  deviceTracking,
  botDetection,
  trafficLogs
};
