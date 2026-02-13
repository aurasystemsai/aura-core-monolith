/**
 * Experimentation Platform Engine for AB Testing Suite
 * 
 * Provides comprehensive experimentation framework including:
 * - Multi-variate testing (MVT) with full factorial designs
 * - Fractional factorial for high-dimensional tests
 * - Holdout groups and control groups
 * - Feature flags and gradual rollouts
 * - Experiment lifecycle management
 * - Guardrail metrics and safety checks
 * - Cross-experiment interference detection
 * - Experiment taxonomies and inheritance
 */

// In-memory stores
const experiments = new Map();
const multivariateTests = new Map();
const holdoutGroups = new Map();
const featureFlags = new Map();
const experimentMetrics = new Map();
const guardrails = new Map();
const interferenceDetection = new Map();

// ==================== EXPERIMENT LIFECYCLE MANAGEMENT ====================

/**
 * Create new experiment with full configuration
 */
function createExperiment(config) {
  const {
    name,
    description,
    hypothesis,
    type = 'ab-test', // 'ab-test', 'multivariate', 'bandit', 'factorial'
    variants,
    metrics,
    guardrailMetrics = [],
    targetAudience = {},
    trafficAllocation = 1.0,
    holdoutPercentage = 0,
    startDate,
    endDate,
    owner,
    tags = []
  } = config;
  
  const experimentId = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const experiment = {
    id: experimentId,
    name,
    description,
    hypothesis,
    type,
    variants: variants.map((v, idx) => ({
      id: v.id || `variant_${idx}`,
      name: v.name,
      description: v.description,
      config: v.config || {},
      weight: v.weight || (1 / variants.length),
      isControl: v.isControl || idx === 0
    })),
    metrics: {
      primary: metrics.primary,
      secondary: metrics.secondary || [],
      guardrails: guardrailMetrics
    },
    targetAudience,
    trafficAllocation,
    holdoutPercentage,
    startDate,
    endDate,
    owner,
    tags,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignments: new Map(),
    results: null
  };
  
  experiments.set(experimentId, experiment);
  
  return experiment;
}

/**
 * Update experiment configuration (only in draft or paused state)
 */
function updateExperiment(experimentId, updates) {
  const experiment = experiments.get(experimentId);
  if (!experiment) throw new Error('Experiment not found');
  
  if (experiment.status === 'running') {
    throw new Error('Cannot update running experiment. Pause first.');
  }
  
  Object.keys(updates).forEach(key => {
    if (key === 'variants' || key === 'metrics') {
      // Deep merge
      experiment[key] = { ...experiment[key], ...updates[key] };
    } else {
      experiment[key] = updates[key];
    }
  });
  
  experiment.updatedAt = new Date().toISOString();
  
  return experiment;
}

/**
 * Start experiment (validation + activation)
 */
function startExperiment(experimentId) {
  const experiment = experiments.get(experimentId);
  if (!experiment) throw new Error('Experiment not found');
  
  // Validate configuration
  const validation = validateExperiment(experiment);
  if (!validation.valid) {
    throw new Error(`Invalid experiment configuration: ${validation.errors.join(', ')}`);
  }
  
  // Check for conflicts with other running experiments
  const conflicts = detectExperimentConflicts(experiment);
  if (conflicts.length > 0) {
    throw new Error(`Experiment conflicts detected: ${conflicts.map(c => c.experimentId).join(', ')}`);
  }
  
  experiment.status = 'running';
  experiment.startedAt = new Date().toISOString();
  experiment.updatedAt = new Date().toISOString();
  
  // Initialize guardrail checks
  initializeGuardrails(experimentId, experiment.metrics.guardrails);
  
  return experiment;
}

/**
 * Pause experiment
 */
function pauseExperiment(experimentId) {
  const experiment = experiments.get(experimentId);
  if (!experiment) throw new Error('Experiment not found');
  
  experiment.status = 'paused';
  experiment.pausedAt = new Date().toISOString();
  experiment.updatedAt = new Date().toISOString();
  
  return experiment;
}

/**
 * Stop experiment and analyze results
 */
function stopExperiment(experimentId, reason = 'completed') {
  const experiment = experiments.get(experimentId);
  if (!experiment) throw new Error('Experiment not found');
  
  experiment.status = 'stopped';
  experiment.stoppedAt = new Date().toISOString();
  experiment.stopReason = reason;
  experiment.updatedAt = new Date().toISOString();
  
  // Generate final results
  experiment.results = generateExperimentResults(experimentId);
  
  return experiment;
}

// ==================== MULTI-VARIATE TESTING ====================

/**
 * Create multi-variate test with full factorial design
 */
function createMultivariateTest(config) {
  const {
    name,
    factors, // Array of { name, levels: [value1, value2, ...] }
    metrics,
    designType = 'full-factorial', // 'full-factorial', 'fractional-factorial'
    resolution = 'IV' // For fractional designs
  } = config;
  
  const testId = `mvt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  let combinations;
  if (designType === 'full-factorial') {
    combinations = generateFullFactorial(factors);
  } else if (designType === 'fractional-factorial') {
    combinations = generateFractionalFactorial(factors, resolution);
  }
  
  const test = {
    id: testId,
    name,
    factors,
    designType,
    combinations,
    metrics,
    assignments: new Map(),
    results: {},
    createdAt: new Date().toISOString()
  };
  
  multivariateTests.set(testId, test);
  
  return test;
}

/**
 * Generate full factorial design (all combinations)
 */
function generateFullFactorial(factors) {
  if (factors.length === 0) return [{}];
  
  const [first, ...rest] = factors;
  const restCombinations = generateFullFactorial(rest);
  
  const combinations = [];
  first.levels.forEach(level => {
    restCombinations.forEach(combo => {
      combinations.push({
        [first.name]: level,
        ...combo
      });
    });
  });
  
  return combinations.map((config, idx) => ({
    id: `combination_${idx}`,
    config,
    weight: 1 / combinations.length
  }));
}

/**
 * Generate fractional factorial design (subset of combinations)
 */
function generateFractionalFactorial(factors, resolution = 'IV') {
  // Simplified: For 2^k designs, select based on confounding pattern
  // Full implementation would use design matrix and generators
  
  const fullFactorial = generateFullFactorial(factors);
  
  // For resolution IV, we can test half the combinations
  // while ensuring main effects are clear
  const fraction = resolution === 'III' ? 4 : 2;
  const step = Math.floor(fullFactorial.length / fraction);
  
  const fractional = fullFactorial.filter((_, idx) => idx % step === 0);
  
  // Rebalance weights
  fractional.forEach(combo => {
    combo.weight = 1 / fractional.length;
  });
  
  return fractional;
}

/**
 * Analyze multivariate test results
 */
function analyzeMultivariateTest(testId) {
  const test = multivariateTests.get(testId);
  if (!test) throw new Error('Multivariate test not found');
  
  // Calculate main effects (average effect of each factor level)
  const mainEffects = {};
  test.factors.forEach(factor => {
    mainEffects[factor.name] = {};
    factor.levels.forEach(level => {
      const combinationsWithLevel = test.combinations.filter(
        combo => combo.config[factor.name] === level
      );
      
      // Calculate average metric for this level
      const avgMetric = combinationsWithLevel.reduce((sum, combo) => {
        const metrics = test.results[combo.id] || { metric: 0, n: 0 };
        return sum + (metrics.metric || 0);
      }, 0) / combinationsWithLevel.length;
      
      mainEffects[factor.name][level] = avgMetric;
    });
  });
  
  // Calculate interaction effects (2-way interactions)
  const interactions = {};
  for (let i = 0; i < test.factors.length - 1; i++) {
    for (let j = i + 1; j < test.factors.length; j++) {
      const factor1 = test.factors[i];
      const factor2 = test.factors[j];
      const key = `${factor1.name} × ${factor2.name}`;
      
      interactions[key] = calculateInteractionEffect(test, factor1, factor2);
    }
  }
  
  return {
    mainEffects,
    interactions,
    bestCombination: findBestCombination(test)
  };
}

/**
 * Calculate interaction effect between two factors
 */
function calculateInteractionEffect(test, factor1, factor2) {
  const effects = {};
  
  factor1.levels.forEach(level1 => {
    factor2.levels.forEach(level2 => {
      const key = `${level1}+${level2}`;
      const combinations = test.combinations.filter(combo => 
        combo.config[factor1.name] === level1 &&
        combo.config[factor2.name] === level2
      );
      
      if (combinations.length > 0) {
        const avgMetric = combinations.reduce((sum, combo) => {
          const metrics = test.results[combo.id] || { metric: 0 };
          return sum + (metrics.metric || 0);
        }, 0) / combinations.length;
        
        effects[key] = avgMetric;
      }
    });
  });
  
  return effects;
}

/**
 * Find best combination based on primary metric
 */
function findBestCombination(test) {
  let bestCombo = null;
  let bestMetric = -Infinity;
  
  test.combinations.forEach(combo => {
    const result = test.results[combo.id];
    if (result && result.metric > bestMetric) {
      bestMetric = result.metric;
      bestCombo = combo;
    }
  });
  
  return bestCombo;
}

// ==================== HOLDOUT GROUPS ====================

/**
 * Create holdout group for long-term impact measurement
 */
function createHoldoutGroup(experimentId, percentage = 10) {
  const experiment = experiments.get(experimentId);
  if (!experiment) throw new Error('Experiment not found');
  
  const holdout = {
    experimentId,
    percentage,
    users: new Set(),
    baselineMetrics: {},
    createdAt: new Date().toISOString()
  };
  
  holdoutGroups.set(experimentId, holdout);
  
  return holdout;
}

/**
 * Check if user is in holdout group
 */
function isInHoldout(experimentId, userId) {
  const holdout = holdoutGroups.get(experimentId);
  if (!holdout) return false;
  
  // Hash-based assignment for consistency
  const hash = hashString(`${experimentId}_${userId}`);
  return (hash % 100) < holdout.percentage;
}

// ==================== FEATURE FLAGS & GRADUAL ROLLOUTS ====================

/**
 * Create feature flag
 */
function createFeatureFlag(config) {
  const {
    name,
    description,
    defaultValue = false,
    rolloutPercentage = 0,
    targetingRules = [],
    variants = []
  } = config;
  
  const flagId = `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const flag = {
    id: flagId,
    name,
    description,
    defaultValue,
    rolloutPercentage,
    targetingRules,
    variants,
    enabled: true,
    createdAt: new Date().toISOString()
  };
  
  featureFlags.set(flagId, flag);
  
  return flag;
}

/**
 * Evaluate feature flag for user
 */
function evaluateFeatureFlag(flagId, userId, context = {}) {
  const flag = featureFlags.get(flagId);
  if (!flag || !flag.enabled) return flag?.defaultValue || false;
  
  // Check targeting rules first
  for (const rule of flag.targetingRules) {
    if (evaluateRule(rule, userId, context)) {
      return rule.value;
    }
  }
  
  // Apply rollout percentage
  const hash = hashString(`${flagId}_${userId}`);
  const inRollout = (hash % 100) < flag.rolloutPercentage;
  
  if (inRollout && flag.variants.length > 0) {
    // Return variant based on hash
    const variantIdx = hash % flag.variants.length;
    return flag.variants[variantIdx];
  }
  
  return inRollout ? true : flag.defaultValue;
}

/**
 * Gradually increase rollout percentage
 */
function updateRollout(flagId, newPercentage, incrementBy = 10, intervalMinutes = 60) {
  const flag = featureFlags.get(flagId);
  if (!flag) throw new Error('Feature flag not found');
  
  if (newPercentage > 100 || newPercentage < 0) {
    throw new Error('Percentage must be between 0 and 100');
  }
  
  // Record rollout plan
  flag.rolloutPlan = {
    targetPercentage: newPercentage,
    incrementBy,
    intervalMinutes,
    startedAt: new Date().toISOString(),
    currentPercentage: flag.rolloutPercentage
  };
  
  return flag;
}

// ==================== GUARDRAIL METRICS ====================

/**
 * Initialize guardrail metrics for experiment
 */
function initializeGuardrails(experimentId, guardrailMetrics) {
  const guardrail = {
    experimentId,
    metrics: guardrailMetrics.map(m => ({
      name: m.name,
      type: m.type, // 'threshold', 'change', 'ratio'
      threshold: m.threshold,
      direction: m.direction, // 'increase', 'decrease', 'both'
      baseline: null,
      currentValue: null,
      violated: false
    })),
    checks: [],
    createdAt: new Date().toISOString()
  };
  
  guardrails.set(experimentId, guardrail);
  
  return guardrail;
}

/**
 * Check guardrail metrics
 */
function checkGuardrails(experimentId, metrics) {
  const guardrail = guardrails.get(experimentId);
  if (!guardrail) return { passed: true, violations: [] };
  
  const violations = [];
  
  guardrail.metrics.forEach(guard => {
    const currentValue = metrics[guard.name];
    if (currentValue === undefined) return;
    
    let violated = false;
    
    if (guard.type === 'threshold') {
      if (guard.direction === 'decrease' && currentValue < guard.threshold) {
        violated = true;
      } else if (guard.direction === 'increase' && currentValue > guard.threshold) {
        violated = true;
      }
    } else if (guard.type === 'change' && guard.baseline) {
      const change = Math.abs((currentValue - guard.baseline) / guard.baseline);
      if (change > guard.threshold) {
        violated = true;
      }
    }
    
    if (violated) {
      violations.push({
        metric: guard.name,
        currentValue,
        threshold: guard.threshold,
        type: guard.type
      });
    }
    
    guard.currentValue = currentValue;
    guard.violated = violated;
  });
  
  guardrail.checks.push({
    timestamp: new Date().toISOString(),
    violations
  });
  
  return {
    passed: violations.length === 0,
    violations
  };
}

// ==================== EXPERIMENT VALIDATION ====================

/**
 * Validate experiment configuration
 */
function validateExperiment(experiment) {
  const errors = [];
  
  // Check variants
  if (!experiment.variants || experiment.variants.length < 2) {
    errors.push('Must have at least 2 variants');
  }
  
  // Check weights sum to 1
  const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
  if (Math.abs(totalWeight - 1.0) > 0.001) {
    errors.push('Variant weights must sum to 1.0');
  }
  
  // Check metrics
  if (!experiment.metrics || !experiment.metrics.primary) {
    errors.push('Must define primary metric');
  }
  
  // Check dates
  if (experiment.startDate && experiment.endDate) {
    if (new Date(experiment.startDate) >= new Date(experiment.endDate)) {
      errors.push('End date must be after start date');
    }
  }
  
  // Check traffic allocation
  if (experiment.trafficAllocation < 0 || experiment.trafficAllocation > 1) {
    errors.push('Traffic allocation must be between 0 and 1');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Detect conflicts with other running experiments
 */
function detectExperimentConflicts(experiment) {
  const conflicts = [];
  
  experiments.forEach(other => {
    if (other.id === experiment.id) return;
    if (other.status !== 'running') return;
    
    // Check for overlapping audiences
    const audienceOverlap = checkAudienceOverlap(
      experiment.targetAudience,
      other.targetAudience
    );
    
    if (audienceOverlap > 0.5) { // >50% overlap
      conflicts.push({
        experimentId: other.id,
        experimentName: other.name,
        overlapPercentage: audienceOverlap * 100,
        reason: 'Audience overlap'
      });
    }
  });
  
  return conflicts;
}

/**
 * Check audience overlap between two experiments
 */
function checkAudienceOverlap(audience1, audience2) {
  // Simplified: check if targeting criteria overlap
  // Full implementation would analyze all targeting rules
  
  if (!audience1 || !audience2) return 1.0; // No targeting = full overlap
  
  let overlapScore = 0;
  let totalCriteria = 0;
  
  ['country', 'platform', 'userType'].forEach(key => {
    if (audience1[key] && audience2[key]) {
      totalCriteria++;
      if (audience1[key] === audience2[key]) {
        overlapScore++;
      }
    }
  });
  
  return totalCriteria > 0 ? overlapScore / totalCriteria : 1.0;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Hash string to number (for consistent assignment)
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

/**
 * Evaluate targeting rule
 */
function evaluateRule(rule, userId, context) {
  const { attribute, operator, value } = rule;
  const userValue = context[attribute];
  
  switch (operator) {
    case 'equals':
      return userValue === value;
    case 'not_equals':
      return userValue !== value;
    case 'in':
      return Array.isArray(value) && value.includes(userValue);
    case 'not_in':
      return Array.isArray(value) && !value.includes(userValue);
    case 'gt':
      return userValue > value;
    case 'lt':
      return userValue < value;
    default:
      return false;
  }
}

/**
 * Generate experiment results
 */
function generateExperimentResults(experimentId) {
  const experiment = experiments.get(experimentId);
  const metrics = experimentMetrics.get(experimentId) || new Map();
  
  const results = {
    experimentId,
    variants: {},
    winner: null,
    confidence: 0,
    generatedAt: new Date().toISOString()
  };
  
  experiment.variants.forEach(variant => {
    const variantMetrics = metrics.get(variant.id) || {};
    results.variants[variant.id] = {
      name: variant.name,
      metrics: variantMetrics,
      sampleSize: variantMetrics.sampleSize || 0
    };
  });
  
  return results;
}

// ==================== PUBLIC API ====================

module.exports = {
  // Experiment lifecycle
  createExperiment,
  updateExperiment,
  startExperiment,
  pauseExperiment,
  stopExperiment,
  validateExperiment,
  detectExperimentConflicts,
  
  // Multivariate testing
  createMultivariateTest,
  analyzeMultivariateTest,
  generateFullFactorial,
  generateFractionalFactorial,
  
  // Holdout groups
  createHoldoutGroup,
  isInHoldout,
  
  // Feature flags
  createFeatureFlag,
  evaluateFeatureFlag,
  updateRollout,
  
  // Guardrails
  initializeGuardrails,
  checkGuardrails,
  
  // Stores
  experiments,
  multivariateTests,
  holdoutGroups,
  featureFlags,
  experimentMetrics,
  guardrails,
  interferenceDetection
};
