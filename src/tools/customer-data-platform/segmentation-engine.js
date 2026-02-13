/**
 * SEGMENTATION ENGINE
 * Dynamic audience building, RFM analysis, behavioral segments
 * lookalike audiences, and segment performance tracking
 */

// In-memory stores
const segments = new Map();
const segmentMemberships = new Map();
const rfmScores = new Map();
const lookalikeModels = new Map();

// ================================================================
// SEGMENT MANAGEMENT
// ================================================================

function createSegment({ name, description, conditions, type = 'dynamic', refreshInterval = '1h' }) {
  const id = `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const segment = {
    id,
    name,
    description,
    conditions,
    type, // 'dynamic', 'static', 'lookalike'
    refreshInterval,
    memberCount: 0,
    lastComputed: null,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  segments.set(id, segment);
  
  // Compute initial members for dynamic segments
  if (type === 'dynamic') {
    computeSegmentMembers(id);
  }
  
  return segment;
}

function getSegment(id) {
  return segments.get(id) || null;
}

function listSegments({ type, status, limit = 100 }) {
  let results = Array.from(segments.values());
  
  if (type) {
    results = results.filter(s => s.type === type);
  }
  
  if (status) {
    results = results.filter(s => s.status === status);
  }
  
  return results
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

function updateSegment(id, updates) {
  const segment = segments.get(id);
  if (!segment) return null;
  
  Object.assign(segment, updates);
  segment.updatedAt = new Date().toISOString();
  segments.set(id, segment);
  
  // Recompute if conditions changed
  if (updates.conditions && segment.type === 'dynamic') {
    computeSegmentMembers(id);
  }
  
  return segment;
}

function deleteSegment(id) {
  // Remove all memberships
  const members = getSegmentMembers(id);
  members.forEach(profileId => {
    removeMembership(id, profileId);
  });
  
  return segments.delete(id);
}

// ================================================================
// SEGMENT COMPUTATION
// ================================================================

function computeSegmentMembers(segmentId) {
  const segment = segments.get(segmentId);
  if (!segment) return null;
  
  // Get all profiles (in production, this would query the database)
  const profiles = require('./profile-management-engine').profiles;
  const events = require('./event-tracking-engine').events;
  
  const matches = [];
  
  // Evaluate conditions for each profile
  profiles.forEach((profile, profileId) => {
    const evaluationContext = {
      profile,
      events: Array.from(events.values()).filter(e => e.profileId === profileId)
    };
    
    const match = evaluateConditions(segment.conditions, evaluationContext);
    
    if (match) {
      matches.push(profileId);
      addMembership(segmentId, profileId);
    } else {
      removeMembership(segmentId, profileId);
    }
  });
  
  segment.memberCount = matches.length;
  segment.lastComputed = new Date().toISOString();
  segments.set(segmentId, segment);
  
  return { segmentId, memberCount: matches.length, members: matches };
}

function evaluateConditions(conditions, context) {
  const { profile, events } = context;
  
  // Conditions structure: { operator: 'and'/'or', rules: [...] }
  const operator = conditions.operator || 'and';
  const rules = conditions.rules || [];
  
  const results = rules.map(rule => evaluateRule(rule, profile, events));
  
  if (operator === 'and') {
    return results.every(r => r);
  } else {
    return results.some(r => r);
  }
}

function evaluateRule(rule, profile, events) {
  const { field, operator, value } = rule;
  
  // Profile field rules
  if (field.startsWith('profile.')) {
    const fieldPath = field.substring(8);
    const fieldValue = getNestedValue(profile, fieldPath);
    
    return compareValues(fieldValue, operator, value);
  }
  
  // Event rules
  if (field.startsWith('event.')) {
    const eventName = field.substring(6);
    const eventCount = events.filter(e => e.event === eventName).length;
    
    return compareValues(eventCount, operator, value);
  }
  
  return false;
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

function compareValues(fieldValue, operator, value) {
  switch (operator) {
    case 'equals':
      return fieldValue === value;
    case 'not_equals':
      return fieldValue !== value;
    case 'contains':
      return String(fieldValue).includes(value);
    case 'not_contains':
      return !String(fieldValue).includes(value);
    case 'greater_than':
      return Number(fieldValue) > Number(value);
    case 'less_than':
      return Number(fieldValue) < Number(value);
    case 'greater_or_equal':
      return Number(fieldValue) >= Number(value);
    case 'less_or_equal':
      return Number(fieldValue) <= Number(value);
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null;
    case 'not_exists':
      return fieldValue === undefined || fieldValue === null;
    default:
      return false;
  }
}

// ================================================================
// MEMBERSHIP MANAGEMENT
// ================================================================

function addMembership(segmentId, profileId) {
  const key = `${segmentId}:${profileId}`;
  
  const membership = {
    segmentId,
    profileId,
    addedAt: new Date().toISOString()
  };
  
  segmentMemberships.set(key, membership);
  return membership;
}

function removeMembership(segmentId, profileId) {
  const key = `${segmentId}:${profileId}`;
  return segmentMemberships.delete(key);
}

function getSegmentMembers(segmentId) {
  const members = [];
  
  segmentMemberships.forEach((membership, key) => {
    if (membership.segmentId === segmentId) {
      members.push(membership.profileId);
    }
  });
  
  return members;
}

function getProfileSegments(profileId) {
  const memberSegments = [];
  
  segmentMemberships.forEach((membership, key) => {
    if (membership.profileId === profileId) {
      const segment = segments.get(membership.segmentId);
      if (segment) {
        memberSegments.push({
          ...segment,
          memberSince: membership.addedAt
        });
      }
    }
  });
  
  return memberSegments;
}

function isMember(segmentId, profileId) {
  const key = `${segmentId}:${profileId}`;
  return segmentMemberships.has(key);
}

// ================================================================
// RFM ANALYSIS
// ================================================================

function calculateRFMScores() {
  const profiles = require('./profile-management-engine').profiles;
  const events = require('./event-tracking-engine').events;
  
  const eventsArray = Array.from(events.values());
  const now = Date.now();
  
  const scores = [];
  
  profiles.forEach((profile, profileId) => {
    const profileEvents = eventsArray.filter(e => e.profileId === profileId);
    
    // Recency: days since last event
    const sortedEvents = profileEvents.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    const lastEventDate = sortedEvents.length > 0 ? new Date(sortedEvents[0].timestamp) : null;
    const recencyDays = lastEventDate ? Math.floor((now - lastEventDate.getTime()) / (1000 * 60 * 60 * 24)) : 999;
    
    // Frequency: number of events in last 90 days
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
    const frequency = profileEvents.filter(e => 
      new Date(e.timestamp).getTime() > ninetyDaysAgo
    ).length;
    
    // Monetary: total value
    const monetary = profile.totalValue || 0;
    
    scores.push({
      profileId,
      recency: recencyDays,
      frequency,
      monetary
    });
  });
  
  // Calculate quintiles for scoring
  const recencyQuintiles = calculateQuintiles(scores.map(s => s.recency));
  const frequencyQuintiles = calculateQuintiles(scores.map(s => s.frequency));
  const monetaryQuintiles = calculateQuintiles(scores.map(s => s.monetary));
  
  // Assign R, F, M scores (1-5)
  scores.forEach(score => {
    score.R = assignScore(score.recency, recencyQuintiles, true); // Lower is better
    score.F = assignScore(score.frequency, frequencyQuintiles, false); // Higher is better
    score.M = assignScore(score.monetary, monetaryQuintiles, false); // Higher is better
    
    score.rfmScore = `${score.R}${score.F}${score.M}`;
    score.totalScore = score.R + score.F + score.M;
    score.segment = classifyRFMSegment(score.R, score.F, score.M);
    
    rfmScores.set(score.profileId, score);
  });
  
  return scores.sort((a, b) => b.totalScore - a.totalScore);
}

function calculateQuintiles(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const len = sorted.length;
  
  return {
    q1: sorted[Math.floor(len * 0.2)],
    q2: sorted[Math.floor(len * 0.4)],
    q3: sorted[Math.floor(len * 0.6)],
    q4: sorted[Math.floor(len * 0.8)]
  };
}

function assignScore(value, quintiles, reverse = false) {
  let score;
  
  if (value <= quintiles.q1) score = 1;
  else if (value <= quintiles.q2) score = 2;
  else if (value <= quintiles.q3) score = 3;
  else if (value <= quintiles.q4) score = 4;
  else score = 5;
  
  // Reverse for recency (lower days = better)
  return reverse ? (6 - score) : score;
}

function classifyRFMSegment(R, F, M) {
  if (R >= 4 && F >= 4 && M >= 4) return 'Champions';
  if (R >= 3 && F >= 4 && M >= 4) return 'Loyal Customers';
  if (R >= 4 && F >= 1 && M >= 4) return 'Big Spenders';
  if (R >= 4 && F >= 3 && M >= 1) return 'Promising';
  if (R >= 3 && F >= 1 && M >= 1) return 'Need Attention';
  if (R >= 4 && F <= 1) return 'New Customers';
  if (R <= 2 && F >= 4 && M >= 4) return 'At Risk';
  if (R <= 2 && F >= 1) return 'Hibernating';
  return 'Lost';
}

function getRFMScore(profileId) {
  return rfmScores.get(profileId) || null;
}

function getRFMSegment(segmentName) {
  return Array.from(rfmScores.values())
    .filter(score => score.segment === segmentName)
    .sort((a, b) => b.totalScore - a.totalScore);
}

// ================================================================
// LOOKALIKE AUDIENCES
// ================================================================

function createLookalikeAudience({ seedSegmentId, size = 1000, similarity = 0.8 }) {
  const id = `lookalike_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const seedSegment = segments.get(seedSegmentId);
  if (!seedSegment) return null;
  
  const profiles = require('./profile-management-engine').profiles;
  const seedMembers = getSegmentMembers(seedSegmentId);
  
  // Calculate average traits of seed audience
  const seedProfiles = seedMembers.map(pid => profiles.get(pid)).filter(Boolean);
  const avgTraits = calculateAverageTraits(seedProfiles);
  
  // Find similar profiles
  const similarities = [];
  
  profiles.forEach((profile, profileId) => {
    if (!seedMembers.includes(profileId)) {
      const sim = calculateSimilarity(profile, avgTraits);
      if (sim >= similarity) {
        similarities.push({ profileId, similarity: sim });
      }
    }
  });
  
  // Take top N most similar
  const lookalikes = similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, size)
    .map(s => s.profileId);
  
  // Create lookalike segment
  const segment = {
    id,
    name: `Lookalike - ${seedSegment.name}`,
    description: `${size} profiles similar to ${seedSegment.name}`,
    type: 'lookalike',
    seedSegmentId,
    similarity,
    memberCount: lookalikes.length,
    members: lookalikes,
    lastComputed: new Date().toISOString(),
    status: 'active',
    createdAt: new Date().toISOString()
  };
  
  segments.set(id, segment);
  
  // Add memberships
  lookalikes.forEach(profileId => {
    addMembership(id, profileId);
  });
  
  // Store model
  lookalikeModels.set(id, {
    segmentId: id,
    seedSegmentId,
    avgTraits,
    similarity
  });
  
  return segment;
}

function calculateAverageTraits(profiles) {
  const traitSums = {};
  const traitCounts = {};
  
  profiles.forEach(profile => {
    if (profile.traits) {
      Object.keys(profile.traits).forEach(key => {
        const value = profile.traits[key];
        if (typeof value === 'number') {
          traitSums[key] = (traitSums[key] || 0) + value;
          traitCounts[key] = (traitCounts[key] || 0) + 1;
        }
      });
    }
  });
  
  const avgTraits = {};
  Object.keys(traitSums).forEach(key => {
    avgTraits[key] = traitSums[key] / traitCounts[key];
  });
  
  return avgTraits;
}

function calculateSimilarity(profile, avgTraits) {
  const keys = Object.keys(avgTraits);
  if (keys.length === 0) return 0;
  
  let matches = 0;
  
  keys.forEach(key => {
    const profileValue = profile.traits?.[key];
    const avgValue = avgTraits[key];
    
    if (profileValue !== undefined) {
      // Normalize and compare (simplified cosine similarity)
      const diff = Math.abs(profileValue - avgValue);
      const similarity = 1 - Math.min(diff / avgValue, 1);
      matches += similarity;
    }
  });
  
  return matches / keys.length;
}

// ================================================================
// SEGMENT ANALYTICS
// ================================================================

function getSegmentGrowth(segmentId, { days = 30 }) {
  // Track segment size over time (mock data)
  const growth = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    growth.push({
      date: date.toISOString().split('T')[0],
      memberCount: Math.floor(Math.random() * 1000) + 500
    });
  }
  
  return growth;
}

function compareSegments(segmentId1, segmentId2) {
  const seg1Members = new Set(getSegmentMembers(segmentId1));
  const seg2Members = new Set(getSegmentMembers(segmentId2));
  
  const overlap = new Set([...seg1Members].filter(x => seg2Members.has(x)));
  const uniqueTo1 = new Set([...seg1Members].filter(x => !seg2Members.has(x)));
  const uniqueTo2 = new Set([...seg2Members].filter(x => !seg1Members.has(x)));
  
  return {
    segment1: {
      id: segmentId1,
      totalMembers: seg1Members.size,
      uniqueMembers: uniqueTo1.size
    },
    segment2: {
      id: segmentId2,
      totalMembers: seg2Members.size,
      uniqueMembers: uniqueTo2.size
    },
    overlap: {
      count: overlap.size,
      percentage: seg1Members.size > 0 ? (overlap.size / seg1Members.size) * 100 : 0
    }
  };
}

function getSegmentPerformance(segmentId) {
  const members = getSegmentMembers(segmentId);
  const profiles = require('./profile-management-engine').profiles;
  
  let totalValue = 0;
  let totalEvents = 0;
  
  members.forEach(profileId => {
    const profile = profiles.get(profileId);
    if (profile) {
      totalValue += profile.totalValue || 0;
      totalEvents += profile.totalEvents || 0;
    }
  });
  
  return {
    segmentId,
    memberCount: members.length,
    totalValue,
    avgValuePerMember: members.length > 0 ? totalValue / members.length : 0,
    totalEvents,
    avgEventsPerMember: members.length > 0 ? totalEvents / members.length : 0
  };
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Segment Management
  createSegment,
  getSegment,
  listSegments,
  updateSegment,
  deleteSegment,
  
  // Segment Computation
  computeSegmentMembers,
  
  // Membership
  addMembership,
  removeMembership,
  getSegmentMembers,
  getProfileSegments,
  isMember,
  
  // RFM Analysis
  calculateRFMScores,
  getRFMScore,
  getRFMSegment,
  
  // Lookalike Audiences
  createLookalikeAudience,
  
  // Analytics
  getSegmentGrowth,
  compareSegments,
  getSegmentPerformance,
  
  // Data stores
  segments,
  segmentMemberships,
  rfmScores,
  lookalikeModels
};
