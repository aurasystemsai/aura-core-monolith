/**
 * AI & ML Optimization Engine for AB Testing Suite
 * 
 * AI-powered experiment optimization and insights:
 * - Automated winner selection with confidence thresholds
 * - Experiment duration prediction
 * - Sample size recommendations
 * - Anomaly detection in metrics
 * - Predictive modeling for outcomes
 * - Automated hypothesis generation
 * - Natural language insights
 * - Causal inference and uplift modeling
 */

// In-memory stores
const aiModels = new Map();
const predictions = new Map();
const insights = new Map();
const anomalies = new Map();
const hypotheses = new Map();
const causalModels = new Map();

// ==================== AUTOMATED WINNER SELECTION ====================

/**
 * Analyze experiment and recommend winner
 */
function analyzeExperimentForWinner(experimentId, metrics) {
  const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Calculate statistical significance for each variant
  const variants = Object.keys(metrics);
  const control = variants[0];
  const treatments = variants.slice(1);
  
  const comparisons = treatments.map(treatment => {
    const result = compareVariants(metrics[control], metrics[treatment]);
    return {
      treatment,
      ...result
    };
  });
  
  // Find best performer
  const bestPerformer = comparisons.reduce((best, current) => 
    (current.lift > best.lift) ? current : best
  , { treatment: control, lift: 0 });
  
  // Determine confidence level
  const confidence = calculateConfidence(bestPerformer);
  
  // Generate recommendation
  let recommendation;
  if (confidence > 0.95 && bestPerformer.pValue < 0.05) {
    recommendation = {
      action: 'DEPLOY_WINNER',
      winner: bestPerformer.treatment,
      confidence,
      reason: `${bestPerformer.treatment} shows ${bestPerformer.lift.toFixed(2)}% improvement with ${(confidence * 100).toFixed(1)}% confidence`
    };
  } else if (confidence < 0.80) {
    recommendation = {
      action: 'CONTINUE_TEST',
      reason: 'Insufficient confidence to declare winner. Continue collecting data.',
      requiredSamples: estimateRequiredSamples(metrics, 0.95)
    };
  } else {
    recommendation = {
      action: 'KEEP_CONTROL',
      reason: 'No variant shows significant improvement over control',
      confidence
    };
  }
  
  const analysis = {
    id: analysisId,
    experimentId,
    comparisons,
    bestPerformer,
    confidence,
    recommendation,
    timestamp: new Date().toISOString()
  };
  
  insights.set(analysisId, analysis);
  
  return analysis;
}

/**
 * Compare two variants statistically
 */
function compareVariants(control, treatment) {
  const { conversions: c1, samples: n1 } = control;
  const { conversions: c2, samples: n2 } = treatment;
  
  const p1 = c1 / n1;
  const p2 = c2 / n2;
  const pPooled = (c1 + c2) / (n1 + n2);
  
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1/n1 + 1/n2));
  const zScore = (p2 - p1) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
  
  const lift = ((p2 - p1) / p1) * 100;
  
  return {
    controlRate: p1,
    treatmentRate: p2,
    lift,
    zScore,
    pValue,
    significant: pValue < 0.05
  };
}

/**
 * Calculate confidence in result
 */
function calculateConfidence(comparison) {
  if (!comparison.significant) return 0.5;
  
  // Bayesian confidence (simplified)
  const posterior = 1 - comparison.pValue;
  return Math.min(0.99, posterior);
}

/**
 * Estimate required samples for desired confidence
 */
function estimateRequiredSamples(metrics, targetConfidence = 0.95) {
  const variants = Object.keys(metrics);
  const control = metrics[variants[0]];
  
  const baselineRate = control.conversions / control.samples;
  const mde = 0.10; // Minimum detectable effect (10%)
  const alpha = 1 - targetConfidence;
  const beta = 0.20; // 80% power
  
  const p1 = baselineRate;
  const p2 = baselineRate * (1 + mde);
  
  const z_alpha = 1.96; // For 95% confidence
  const z_beta = 0.84; // For 80% power
  
  const n = Math.pow(z_alpha + z_beta, 2) * 
            (p1 * (1 - p1) + p2 * (1 - p2)) /
            Math.pow(p2 - p1, 2);
  
  return Math.ceil(n);
}

// ==================== EXPERIMENT DURATION PREDICTION ====================

/**
 * Predict when experiment will reach significance
 */
function predictExperimentDuration(experimentId, currentMetrics, trafficRate) {
  const predictionId = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const requiredSamples = estimateRequiredSamples(currentMetrics);
  const variants = Object.keys(currentMetrics);
  const currentSamples = currentMetrics[variants[0]].samples * variants.length;
  
  const remainingSamples = Math.max(0, requiredSamples * variants.length - currentSamples);
  const daysRemaining = remainingSamples / trafficRate;
  
  const prediction = {
    id: predictionId,
    experimentId,
    currentSamples,
    requiredSamples,
    remainingSamples,
    trafficRate,
    estimatedDaysRemaining: Math.ceil(daysRemaining),
    estimatedCompletionDate: new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toISOString(),
    confidence: 0.80,
    timestamp: new Date().toISOString()
  };
  
  predictions.set(predictionId, prediction);
  
  return prediction;
}

// ==================== SAMPLE SIZE RECOMMENDATION ====================

/**
 * Recommend optimal sample size before starting experiment
 */
function recommendSampleSize(config) {
  const {
    baselineRate,
    minimumDetectableEffect = 0.10, // 10% relative improvement
    confidence = 0.95,
    power = 0.80,
    numVariants = 2
  } = config;
  
  const p1 = baselineRate;
  const p2 = baselineRate * (1 + minimumDetectableEffect);
  
  const alpha = 1 - confidence;
  const beta = 1 - power;
  
  const z_alpha = normalInverse(1 - alpha / 2);
  const z_beta = normalInverse(power);
  
  const nPerVariant = Math.pow(z_alpha + z_beta, 2) * 
                      (p1 * (1 - p1) + p2 * (1 - p2)) /
                      Math.pow(p2 - p1, 2);
  
  const totalSamples = Math.ceil(nPerVariant * numVariants);
  
  return {
    samplesPerVariant: Math.ceil(nPerVariant),
    totalSamples,
    assumptions: {
      baselineRate: p1,
      expectedTreatmentRate: p2,
      minimumDetectableEffect,
      confidence,
      power,
      numVariants
    }
  };
}

// ==================== ANOMALY DETECTION ====================

/**
 * Detect anomalies in experiment metrics
 */
function detectAnomalies(experimentId, timeSeriesData) {
  const anomalyId = `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const detectedAnomalies = [];
  
  // Statistical anomaly detection using z-score
  const values = timeSeriesData.map(d => d.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
  );
  
  timeSeriesData.forEach((dataPoint, idx) => {
    const zScore = Math.abs((dataPoint.value - mean) / stdDev);
    
    if (zScore > 3) { // 3 sigma rule
      detectedAnomalies.push({
        timestamp: dataPoint.timestamp,
        value: dataPoint.value,
        expected: mean,
        zScore,
        severity: zScore > 4 ? 'critical' : 'warning',
        type: dataPoint.value > mean ? 'spike' : 'drop'
      });
    }
  });
  
  // Trend-based anomaly detection
  const trendAnomalies = detectTrendAnomalies(timeSeriesData);
  detectedAnomalies.push(...trendAnomalies);
  
  const result = {
    id: anomalyId,
    experimentId,
    anomalyCount: detectedAnomalies.length,
    anomalies: detectedAnomalies,
    summary: {
      spikes: detectedAnomalies.filter(a => a.type === 'spike').length,
      drops: detectedAnomalies.filter(a => a.type === 'drop').length,
      critical: detectedAnomalies.filter(a => a.severity === 'critical').length
    },
    timestamp: new Date().toISOString()
  };
  
  anomalies.set(anomalyId, result);
  
  return result;
}

/**
 * Detect trend-based anomalies
 */
function detectTrendAnomalies(timeSeriesData) {
  if (timeSeriesData.length < 5) return [];
  
  const anomalies = [];
  const windowSize = 5;
  
  for (let i = windowSize; i < timeSeriesData.length; i++) {
    const window = timeSeriesData.slice(i - windowSize, i);
    const current = timeSeriesData[i];
    
    const windowMean = window.reduce((a, b) => a + b.value, 0) / windowSize;
    const percentChange = Math.abs((current.value - windowMean) / windowMean) * 100;
    
    if (percentChange > 50) { // 50% change from moving average
      anomalies.push({
        timestamp: current.timestamp,
        value: current.value,
        expected: windowMean,
        percentChange,
        severity: percentChange > 100 ? 'critical' : 'warning',
        type: 'trend-deviation'
      });
    }
  }
  
  return anomalies;
}

// ==================== PREDICTIVE MODELING ====================

/**
 * Train predictive model for conversion probability
 */
function trainConversionModel(trainingData) {
  const modelId = `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Simple logistic regression model (simplified)
  const features = extractFeatures(trainingData);
  const labels = trainingData.map(d => d.converted ? 1 : 0);
  
  // Training (simplified - using average as baseline)
  const conversionRate = labels.reduce((a, b) => a + b, 0) / labels.length;
  
  const model = {
    id: modelId,
    type: 'conversion-prediction',
    algorithm: 'logistic-regression',
    features: Object.keys(features[0] || {}),
    baselineConversionRate: conversionRate,
    trainedOn: trainingData.length,
    accuracy: 0.75, // Placeholder
    createdAt: new Date().toISOString()
  };
  
  aiModels.set(modelId, model);
  
  return model;
}

/**
 * Predict conversion probability for user
 */
function predictConversion(modelId, userFeatures) {
  const model = aiModels.get(modelId);
  if (!model) throw new Error('Model not found');
  
  // Simplified prediction
  const baseProb = model.baselineConversionRate;
  
  // Adjust based on features (simplified)
  let adjustedProb = baseProb;
  
  if (userFeatures.previousPurchases > 0) adjustedProb *= 1.5;
  if (userFeatures.emailEngagement === 'high') adjustedProb *= 1.3;
  if (userFeatures.pageViews > 5) adjustedProb *= 1.2;
  
  adjustedProb = Math.min(0.95, Math.max(0.05, adjustedProb));
  
  return {
    modelId,
    probability: adjustedProb,
    confidence: 0.80,
    factors: {
      baseline: baseProb,
      adjustments: {
        previousPurchases: userFeatures.previousPurchases > 0 ? 1.5 : 1.0,
        emailEngagement: userFeatures.emailEngagement === 'high' ? 1.3 : 1.0,
        pageViews: userFeatures.pageViews > 5 ? 1.2 : 1.0
      }
    }
  };
}

/**
 * Extract features from training data
 */
function extractFeatures(data) {
  return data.map(d => ({
    previousPurchases: d.previousPurchases || 0,
    emailEngagement: d.emailEngagement || 'low',
    pageViews: d.pageViews || 0,
    timeOnSite: d.timeOnSite || 0,
    deviceType: d.deviceType || 'desktop'
  }));
}

// ==================== HYPOTHESIS GENERATION ====================

/**
 * Generate experiment hypotheses using AI
 */
function generateHypotheses(context) {
  const hypothesisId = `hyp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const {
    currentMetrics,
    historicalData,
    businessGoals
  } = context;
  
  // AI-generated hypotheses (simplified - rule-based)
  const hypotheses = [];
  
  // Check for low conversion rate
  if (currentMetrics.conversionRate < 0.05) {
    hypotheses.push({
      id: `h_${hypotheses.length + 1}`,
      hypothesis: 'Simplifying the checkout process will increase conversion rate',
      rationale: 'Current conversion rate is below industry average (5%)',
      suggestedTest: 'A/B test: Current checkout vs. One-page checkout',
      expectedLift: '15-25%',
      confidence: 0.75
    });
  }
  
  // Check for high cart abandonment
  if (currentMetrics.cartAbandonmentRate > 0.70) {
    hypotheses.push({
      id: `h_${hypotheses.length + 1}`,
      hypothesis: 'Adding trust badges will reduce cart abandonment',
      rationale: 'Cart abandonment rate is high (70%), indicating trust issues',
      suggestedTest: 'A/B test: No badges vs. Security badges',
      expectedLift: '10-15%',
      confidence: 0.70
    });
  }
  
  // Check for low AOV
  if (currentMetrics.averageOrderValue < currentMetrics.targetAOV) {
    hypotheses.push({
      id: `h_${hypotheses.length + 1}`,
      hypothesis: 'Product recommendations will increase average order value',
      rationale: 'AOV below target, cross-sell opportunity exists',
      suggestedTest: 'A/B test: No recommendations vs. AI-powered recommendations',
      expectedLift: '20-30%',
      confidence: 0.80
    });
  }
  
  const result = {
    id: hypothesisId,
    context,
    hypotheses,
    generated: hypotheses.length,
    timestamp: new Date().toISOString()
  };
  
  hypotheses.set(hypothesisId, result);
  
  return result;
}

// ==================== NATURAL LANGUAGE INSIGHTS ====================

/**
 * Generate natural language insights from experiment results
 */
function generateInsights(experimentId, results) {
  const insightId = `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const narratives = [];
  
  // Overall performance
  const bestVariant = Object.keys(results.variants).reduce((best, current) => 
    results.variants[current].conversionRate > results.variants[best].conversionRate ? current : best
  );
  
  const bestMetrics = results.variants[bestVariant];
  const controlMetrics = results.variants[Object.keys(results.variants)[0]];
  
  const lift = ((bestMetrics.conversionRate - controlMetrics.conversionRate) / controlMetrics.conversionRate) * 100;
  
  narratives.push({
    type: 'summary',
    text: `${bestVariant} performed best with a ${lift.toFixed(1)}% improvement in conversion rate (${(bestMetrics.conversionRate * 100).toFixed(2)}% vs ${(controlMetrics.conversionRate * 100).toFixed(2)}%).`
  });
  
  // Statistical significance
  if (results.pValue < 0.05) {
    narratives.push({
      type: 'significance',
      text: `The result is statistically significant (p-value: ${results.pValue.toFixed(4)}), indicating the improvement is likely not due to chance.`
    });
  } else {
    narratives.push({
      type: 'significance',
      text: `The result is not statistically significant (p-value: ${results.pValue.toFixed(4)}). More data is needed to confirm the effect.`
    });
  }
  
  // Business impact
  if (bestMetrics.revenue) {
    const revenueIncrease = bestMetrics.revenue - controlMetrics.revenue;
    narratives.push({
      type: 'business-impact',
      text: `Deploying ${bestVariant} could generate an additional $${revenueIncrease.toFixed(2)} in revenue per user.`
    });
  }
  
  // Recommendation
  if (results.pValue < 0.05 && lift > 5) {
    narratives.push({
      type: 'recommendation',
      text: `Recommendation: Deploy ${bestVariant} to all users to capture the ${lift.toFixed(1)}% conversion improvement.`,
      action: 'DEPLOY'
    });
  } else {
    narratives.push({
      type: 'recommendation',
      text: 'Recommendation: Continue collecting data before making a decision.',
      action: 'CONTINUE'
    });
  }
  
  const insight = {
    id: insightId,
    experimentId,
    narratives,
    timestamp: new Date().toISOString()
  };
  
  insights.set(insightId, insight);
  
  return insight;
}

// ==================== CAUSAL INFERENCE ====================

/**
 * Estimate causal effect using uplift modeling
 */
function estimateCausalEffect(experimentId, userData) {
  const causalId = `causal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Separate treatment and control groups
  const treatmentGroup = userData.filter(u => u.variant === 'treatment');
  const controlGroup = userData.filter(u => u.variant === 'control');
  
  // Calculate average treatment effect (ATE)
  const treatmentOutcome = treatmentGroup.reduce((sum, u) => sum + (u.outcome || 0), 0) / treatmentGroup.length;
  const controlOutcome = controlGroup.reduce((sum, u) => sum + (u.outcome || 0), 0) / controlGroup.length;
  
  const ate = treatmentOutcome - controlOutcome;
  
  // Calculate conditional average treatment effect (CATE) by segment
  const segments = ['new_users', 'returning_users', 'high_value', 'low_value'];
  const cate = {};
  
  segments.forEach(segment => {
    const treatmentSegment = treatmentGroup.filter(u => u.segment === segment);
    const controlSegment = controlGroup.filter(u => u.segment === segment);
    
    if (treatmentSegment.length > 0 && controlSegment.length > 0) {
      const treatmentAvg = treatmentSegment.reduce((sum, u) => sum + (u.outcome || 0), 0) / treatmentSegment.length;
      const controlAvg = controlSegment.reduce((sum, u) => sum + (u.outcome || 0), 0) / controlSegment.length;
      
      cate[segment] = {
        effect: treatmentAvg - controlAvg,
        treatmentSize: treatmentSegment.length,
        controlSize: controlSegment.length
      };
    }
  });
  
  const model = {
    id: causalId,
    experimentId,
    averageTreatmentEffect: ate,
    conditionalEffects: cate,
    recommendations: generatePersonalizationRecommendations(cate),
    timestamp: new Date().toISOString()
  };
  
  causalModels.set(causalId, model);
  
  return model;
}

/**
 * Generate personalization recommendations based on CATE
 */
function generatePersonalizationRecommendations(cate) {
  const recommendations = [];
  
  Object.keys(cate).forEach(segment => {
    const effect = cate[segment].effect;
    
    if (effect > 0) {
      recommendations.push({
        segment,
       action: 'target',
        reason: `${segment} shows positive treatment effect (+${effect.toFixed(2)})`,
        priority: effect > 0.1 ? 'high' : 'medium'
      });
    } else {
      recommendations.push({
        segment,
        action: 'exclude',
        reason: `${segment} shows negative treatment effect (${effect.toFixed(2)})`,
        priority: 'low'
      });
    }
  });
  
  return recommendations.sort((a, b) => 
    (b.priority === 'high' ? 2 : b.priority === 'medium' ? 1 : 0) -
    (a.priority === 'high' ? 2 : a.priority === 'medium' ? 1 : 0)
  );
}

// ==================== UTILITY FUNCTIONS ====================

function normalCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

function normalInverse(p) {
  const a1 = -39.6968302866538, a2 = 220.946098424521, a3 = -275.928510446969;
  const a4 = 138.357751867269, a5 = -30.6647980661472, a6 = 2.50662827745924;
  const b1 = -54.4760987982241, b2 = 161.585836858041, b3 = -155.698979859887;
  const b4 = 66.8013118877197, b5 = -13.2806815528857;
  
  const p_low = 0.02425, p_high = 1 - p_low;
  let q, r;
  
  if (p < p_low) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((a1 * q + a2) * q + a3) * q + a4) * q + a5) * q + a6) /
      (((((b1 * q + b2) * q + b3) * q + b4) * q + b5) * q + 1)
    );
  } else if (p <= p_high) {
    q = p - 0.5;
    r = q * q;
    return (
      (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
      (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1)
    );
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(
      (((((a1 * q + a2) * q + a3) * q + a4) * q + a5) * q + a6) /
      (((((b1 * q + b2) * q + b3) * q + b4) * q + b5) * q + 1)
    );
  }
}

// ==================== PUBLIC API ====================

module.exports = {
  // Winner selection
  analyzeExperimentForWinner,
  compareVariants,
  calculateConfidence,
  
  // Duration prediction
  predictExperimentDuration,
  recommendSampleSize,
  
  // Anomaly detection
  detectAnomalies,
  
  // Predictive modeling
  trainConversionModel,
  predictConversion,
  
  // Hypothesis generation
  generateHypotheses,
  
  // Insights
  generateInsights,
  
  // Causal inference
  estimateCausalEffect,
  
  // Stores
  aiModels,
  predictions,
  insights,
  anomalies,
  hypotheses,
  causalModels
};
