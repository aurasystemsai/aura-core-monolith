/**
 * Brand Mention Tracker V2 - Crisis Detection Engine
 * Real-time crisis alerts, volume spike detection, and escalation workflows
 */

const crises = new Map();
const volumeTracking = new Map();
const escalations = new Map();
const crisisRules = new Map();

/**
 * Detect potential crisis from volume spike
 */
async function detectCrisis(mentionData) {
  const hour = getHourKey();
  const volumeData = volumeTracking.get(hour) || { mentions: [], hour, startedAt: new Date().toISOString() };
  
  volumeData.mentions.push({
    id: mentionData.id,
    sentiment: mentionData.sentiment,
    reach: mentionData.reach,
    capturedAt: new Date().toISOString()
  });
  
  volumeTracking.set(hour, volumeData);
  
  // Check for volume spike
  const spike = detectVolumeSpike(hour);
  
  // Check for negative sentiment threshold
  const negativeSentiment = detectNegativeSentimentSpike(volumeData.mentions);
  
  // Check for viral spread
  const viralSpread = detectViralSpread(volumeData.mentions);
  
  // Determine if crisis
  const isCrisis = spike.isSpike || negativeSentiment.isSpike || viralSpread.isViral;
  
  if (isCrisis) {
    return await createCrisis({
      triggers: {
        volumeSpike: spike.isSpike,
        negativeSentiment: negativeSentiment.isSpike,
        viralSpread: viralSpread.isViral
      },
      severity: calculateCrisisSeverity(spike, negativeSentiment, viralSpread),
      mentions: volumeData.mentions
    });
  }
  
  return { isCrisis: false };
}

/**
 * Get hour key for tracking
 */
function getHourKey() {
  const now = new Date();
  return `${now.toISOString().split('T')[0]}_${now.getHours()}`;
}

/**
 * Detect volume spike compared to baseline
 */
function detectVolumeSpike(currentHour) {
  const current = volumeTracking.get(currentHour);
  if (!current) return { isSpike: false };
  
  // Get baseline from previous 24 hours
  const baseline = calculateBaseline(24);
  
  const currentVolume = current.mentions.length;
  const spikeThreshold = baseline.average * 3; // 3x normal
  
  return {
    isSpike: currentVolume > spikeThreshold,
    currentVolume,
    baselineAverage: baseline.average,
    multiplier: currentVolume / (baseline.average || 1)
  };
}

/**
 * Calculate baseline volume
 */
function calculateBaseline(hours) {
  const now = new Date();
  const hourlyVolumes = [];
  
  for (let i = 1; i <= hours; i++) {
    const date = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hourKey = `${date.toISOString().split('T')[0]}_${date.getHours()}`;
    const data = volumeTracking.get(hourKey);
    
    if (data) {
      hourlyVolumes.push(data.mentions.length);
    }
  }
  
  const average = hourlyVolumes.length > 0
    ? hourlyVolumes.reduce((sum, v) => sum + v, 0) / hourlyVolumes.length
    : 0;
  
  return {
    average,
    samples: hourlyVolumes.length
  };
}

/**
 * Detect negative sentiment spike
 */
function detectNegativeSentimentSpike(mentions) {
  if (mentions.length < 5) return { isSpike: false };
  
  const negativeMentions = mentions.filter(m => m.sentiment < -0.3);
  const negativePercentage = (negativeMentions.length / mentions.length) * 100;
  
  return {
    isSpike: negativePercentage > 60, // 60% negative
    negativeCount: negativeMentions.length,
    totalCount: mentions.length,
    percentage: parseFloat(negativePercentage.toFixed(2))
  };
}

/**
 * Detect viral spread potential
 */
function detectViralSpread(mentions) {
  const totalReach = mentions.reduce((sum, m) => sum + m.reach, 0);
  const recentMentions = mentions.filter(m => {
    const age = Date.now() - new Date(m.capturedAt).getTime();
    return age < 30 * 60 * 1000; // last 30 minutes
  });
  
  const recentReach = recentMentions.reduce((sum, m) => sum + m.reach, 0);
  const growthRate = recentMentions.length / mentions.length;
  
  return {
    isViral: totalReach > 1000000 && growthRate > 0.5,
    totalReach,
    recentReach,
    growthRate: parseFloat(growthRate.toFixed(2))
  };
}

/**
 * Calculate crisis severity
 */
function calculateCrisisSeverity(spike, sentiment, viral) {
  let score = 0;
  
  // Volume spike contribution (0-30)
  if (spike.isSpike) {
    if (spike.multiplier > 10) score += 30;
    else if (spike.multiplier > 5) score += 20;
    else score += 10;
  }
  
  // Negative sentiment contribution (0-40)
  if (sentiment.isSpike) {
    if (sentiment.percentage > 80) score += 40;
    else if (sentiment.percentage > 70) score += 30;
    else score += 20;
  }
  
  // Viral spread contribution (0-30)
  if (viral.isViral) {
    if (viral.totalReach > 10000000) score += 30;
    else if (viral.totalReach > 5000000) score += 20;
    else score += 15;
  }
  
  // Determine severity level
  if (score >= 70) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

/**
 * Create crisis record
 */
async function createCrisis(crisisData) {
  const crisisId = `crisis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const crisis = {
    id: crisisId,
    status: 'active',
    severity: crisisData.severity,
    triggers: crisisData.triggers,
    detectedAt: new Date().toISOString(),
    resolvedAt: null,
    mentionIds: crisisData.mentions.map(m => m.id),
    totalMentions: crisisData.mentions.length,
    totalReach: crisisData.mentions.reduce((sum, m) => sum + m.reach, 0),
    averageSentiment: crisisData.mentions.reduce((sum, m) => sum + (m.sentiment || 0), 0) / crisisData.mentions.length,
    peakVolume: crisisData.mentions.length,
    escalated: false,
    escalatedAt: null,
    assignedTo: null,
    notes: [],
    timeline: [
      {
        event: 'crisis_detected',
        timestamp: new Date().toISOString(),
        details: crisisData.triggers
      }
    ]
  };
  
  crises.set(crisisId, crisis);
  
  // Auto-escalate if critical
  if (crisis.severity === 'critical') {
    await escalateCrisis(crisisId, 'auto');
  }
  
  return { isCrisis: true, crisis };
}

/**
 * Escalate crisis
 */
async function escalateCrisis(crisisId, reason) {
  const crisis = crises.get(crisisId);
  if (!crisis) {
    throw new Error('Crisis not found');
  }
  
  const escalationId = `escalation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const escalation = {
    id: escalationId,
    crisisId,
    reason,
    escalatedAt: new Date().toISOString(),
    escalatedBy: reason === 'auto' ? 'system' : null,
    priority: crisis.severity === 'critical' ? 'urgent' : 'high',
    notificationsSent: []
  };
  
  escalations.set(escalationId, escalation);
  
  crisis.escalated = true;
  crisis.escalatedAt = new Date().toISOString();
  crisis.timeline.push({
    event: 'crisis_escalated',
    timestamp: new Date().toISOString(),
    details: { reason }
  });
  
  crises.set(crisisId, crisis);
  
  return escalation;
}

/**
 * Update crisis status
 */
async function updateCrisisStatus(crisisId, status, notes = null) {
  const crisis = crises.get(crisisId);
  if (!crisis) {
    throw new Error('Crisis not found');
  }
  
  crisis.status = status;
  
  if (status === 'resolved') {
    crisis.resolvedAt = new Date().toISOString();
  }
  
  if (notes) {
    crisis.notes.push({
      note: notes,
      addedAt: new Date().toISOString()
    });
  }
  
  crisis.timeline.push({
    event: `status_changed_to_${status}`,
    timestamp: new  Date().toISOString(),
    details: { notes }
  });
  
  crises.set(crisisId, crisis);
  
  return crisis;
}

/**
 * Assign crisis to team member
 */
async function assignCrisis(crisisId, userId, userName) {
  const crisis = crises.get(crisisId);
  if (!crisis) {
    throw new Error('Crisis not found');
  }
  
  crisis.assignedTo = {
    userId,
    userName,
    assignedAt: new Date().toISOString()
  };
  
  crisis.timeline.push({
    event: 'crisis_assigned',
    timestamp: new Date().toISOString(),
    details: { userId, userName }
  });
  
  crises.set(crisisId, crisis);
  
  return crisis;
}

/**
 * Create crisis detection rule
 */
async function createCrisisRule(ruleData) {
  const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const rule = {
    id: ruleId,
    name: ruleData.name,
    description: ruleData.description || '',
    triggers: {
      volumeThreshold: ruleData.volumeThreshold || null, // mentions per hour
      negativeSentimentPercentage: ruleData.negativeSentimentPercentage || null,
      reachThreshold: ruleData.reachThreshold || null,
      keywords: ruleData.keywords || []
    },
    actions: {
      autoEscalate: ruleData.autoEscalate || false,
      notifyUsers: ruleData.notifyUsers || [],
      assignTo: ruleData.assignTo || null
    },
    isActive: ruleData.isActive !== false,
    createdAt: new Date().toISOString(),
    triggeredCount: 0
  };
  
  crisisRules.set(ruleId, rule);
  return rule;
}

/**
 * Get active crises
 */
async function getActiveCrises(filters = {}) {
  let results = Array.from(crises.values())
    .filter(c => c.status === 'active');
  
  if (filters.severity) {
    results = results.filter(c => c.severity === filters.severity);
  }
  
  if (filters.escalated !== undefined) {
    results = results.filter(c => c.escalated === filters.escalated);
  }
  
  results.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[b.severity] - severityOrder[a.severity];
    }
    return new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime();
  });
  
  return results;
}

/**
 * Get crisis statistics
 */
async function getCrisisStatistics() {
  const allCrises = Array.from(crises.values());
  const activeCrises = allCrises.filter(c => c.status === 'active');
  
  const bySeverity = {
    critical: allCrises.filter(c => c.severity === 'critical').length,
    high: allCrises.filter(c => c.severity === 'high').length,
    medium: allCrises.filter(c => c.severity === 'medium').length,
    low: allCrises.filter(c => c.severity === 'low').length
  };
  
  const resolvedCrises = allCrises.filter(c => c.status === 'resolved');
  const avgResolutionTime = resolvedCrises.length > 0
    ? resolvedCrises.reduce((sum, c) => {
        const detected = new Date(c.detectedAt).getTime();
        const resolved = new Date(c.resolvedAt).getTime();
        return sum + (resolved - detected);
      }, 0) / resolvedCrises.length / (60 * 1000) // minutes
    : 0;
  
  return {
    totalCrises: allCrises.length,
    activeCrises: activeCrises.length,
    resolvedCrises: resolvedCrises.length,
    severityBreakdown: bySeverity,
    escalatedCount: allCrises.filter(c => c.escalated).length,
    averageResolutionTime: parseFloat(avgResolutionTime.toFixed(2)),
    criticalActiveCount: activeCrises.filter(c => c.severity === 'critical').length
  };
}

module.exports = {
  detectCrisis,
  createCrisis,
  escalateCrisis,
  updateCrisisStatus,
  assignCrisis,
  createCrisisRule,
  getActiveCrises,
  getCrisisStatistics
};
