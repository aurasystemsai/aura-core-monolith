/**
 * Customer Data Platform - Segmentation Engine
 * Dynamicsegmentation with rule evaluation, RFM analysis, and behavioral segments
 */

const crypto = require('crypto');
const { getAllProfiles, getProfile, updateProfile } = require('./profiles');
const { getProfileEvents } = require('./events');

// In-memory storage
const segments = new Map();
const segmentMembership = new Map(); // segmentId -> Set of profileIds

/**
 * Generate unique segment ID
 */
function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Evaluate a single condition against a profile
 */
function evaluateCondition(profile, condition, events = []) {
  const { field, operator, value } = condition;
  
  // Get the field value from profile (supports nested paths like 'computed.ltv')
  let fieldValue = field.split('.').reduce((obj, key) => obj?.[key], profile);
  
  // Special handling for event-based conditions
  if (field.startsWith('events.')) {
    const eventCondition = field.split('.')[1];
    
    if (eventCondition === 'count') {
      fieldValue = events.length;
    } else if (eventCondition === 'type_count') {
      fieldValue = events.filter(e => e.type === value.type).length;
    } else if (eventCondition === 'last_event_days_ago') {
      if (events.length === 0) return false;
      const lastEvent = events.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      )[0];
      const daysAgo = (new Date() - new Date(lastEvent.timestamp)) / (1000 * 60 * 60 * 24);
      fieldValue = Math.floor(daysAgo);
    }
  }
  
  // Evaluate operator
  switch (operator) {
    case '=':
    case '==':
    case 'equals':
      return fieldValue == value;
    
    case '!=':
    case 'not_equals':
      return fieldValue != value;
    
    case '>':
    case 'greater_than':
      return Number(fieldValue) > Number(value);
    
    case '<':
    case 'less_than':
      return Number(fieldValue) < Number(value);
    
    case '>=':
    case 'greater_than_or_equal':
      return Number(fieldValue) >= Number(value);
    
    case '<=':
    case 'less_than_or_equal':
      return Number(fieldValue) <= Number(value);
    
    case 'contains':
      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(value);
      }
      return String(fieldValue).includes(String(value));
    
    case 'not_contains':
      if (Array.isArray(fieldValue)) {
        return !fieldValue.includes(value);
      }
      return !String(fieldValue).includes(String(value));
    
    case 'in':
      return Array.isArray(value) && value.includes(fieldValue);
    
    case 'not_in':
      return Array.isArray(value) && !value.includes(fieldValue);
    
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null;
    
    case 'not_exists':
      return fieldValue === undefined || fieldValue === null;
    
    default:
      throw new Error(`Unknown operator: ${operator}`);
  }
}

/**
 * Evaluate segment rules against a profile
 */
function evaluateSegmentRules(profile, rules, events = []) {
  if (!rules || !rules.conditions || rules.conditions.length === 0) {
    return false;
  }
  
  const operator = rules.operator || 'AND';
  const results = rules.conditions.map(condition => 
    evaluateCondition(profile, condition, events)
  );
  
  if (operator === 'AND') {
    return results.every(r => r === true);
  } else if (operator === 'OR') {
    return results.some(r => r === true);
  }
  
  throw new Error(`Unknown logical operator: ${operator}`);
}

/**
 * Calculate RFM score for a profile
 */
function calculateRFM(profile, events = []) {
  const purchases = events.filter(e => e.type === 'purchase');
  
  if (purchases.length === 0) {
    return { recency: 0, frequency: 0, monetary: 0, score: '000' };
  }
  
  const now = new Date();
  
  // Recency: days since last purchase
  const lastPurchase = purchases
    .map(p => new Date(p.timestamp))
    .sort((a, b) => b - a)[0];
  const daysSinceLastPurchase = (now - lastPurchase) / (1000 * 60 * 60 * 24);
  
  let recency;
  if (daysSinceLastPurchase <= 30) recency = 5;
  else if (daysSinceLastPurchase <= 60) recency = 4;
  else if (daysSinceLastPurchase <= 90) recency = 3;
  else if (daysSinceLastPurchase <= 180) recency = 2;
  else recency = 1;
  
  // Frequency: number of purchases
  const frequency = purchases.length;
  let frequencyScore;
  if (frequency >= 10) frequencyScore = 5;
  else if (frequency >= 5) frequencyScore = 4;
  else if (frequency >= 3) frequencyScore = 3;
  else if (frequency >= 2) frequencyScore = 2;
  else frequencyScore = 1;
  
  // Monetary: total revenue
  const monetary = purchases.reduce((sum, p) => sum + (p.properties?.revenue || 0), 0);
  let monetaryScore;
  if (monetary >= 1000) monetaryScore = 5;
  else if (monetary >= 500) monetaryScore = 4;
  else if (monetary >= 250) monetaryScore = 3;
  else if (monetary >= 100) monetaryScore = 2;
  else monetaryScore = 1;
  
  return {
    recency,
    frequency: frequencyScore,
    monetary: monetaryScore,
    score: `${recency}${frequencyScore}${monetaryScore}`,
    rawFrequency: frequency,
    rawMonetary: monetary,
  };
}

/**
 * Create a new segment
 */
function createSegment(data) {
  const id = generateId();
  const now = new Date().toISOString();
  
  const segment = {
    id,
    name: data.name,
    description: data.description,
    type: data.type || 'rule-based',
    rules: data.rules || { operator: 'AND', conditions: [] },
    size: 0,
    createdAt: now,
    updatedAt: now,
    lastComputed: null,
  };
  
  segments.set(id, segment);
  segmentMembership.set(id, new Set());
  
  // Compute initial membership
  computeSegmentMembership(id);
  
  return segment;
}

/**
 * Get segment by ID
 */
function getSegment(id) {
  return segments.get(id);
}

/**
 * Update segment
 */
function updateSegment(id, updates) {
  const segment = segments.get(id);
  if (!segment) return null;
  
  const now = new Date().toISOString();
  
  if (updates.name) segment.name = updates.name;
  if (updates.description !== undefined) segment.description = updates.description;
  if (updates.rules) segment.rules = updates.rules;
  
  segment.updatedAt = now;
  segments.set(id, segment);
  
  // Recompute membership if rules changed
  if (updates.rules) {
    computeSegmentMembership(id);
  }
  
  return segment;
}

/**
 * Delete segment
 */
function deleteSegment(id) {
  const segment = segments.get(id);
  if (!segment) return false;
  
  // Remove from profile memberships
  const members = segmentMembership.get(id) || new Set();
  members.forEach(profileId => {
    const profile = getProfile(profileId);
    if (profile) {
      profile.segments = profile.segments.filter(s => s !== id);
      updateProfile(profileId, { segments: profile.segments });
    }
  });
  
  segments.delete(id);
  segmentMembership.delete(id);
  return true;
}

/**
 * Compute segment membership for all profiles
 */
function computeSegmentMembership(segmentId) {
  const segment = segments.get(segmentId);
  if (!segment) return;
  
  const profiles = getAllProfiles();
  const members = new Set();
  
  profiles.forEach(profile => {
    let matches = false;
    
    if (segment.type === 'rule-based') {
      const events = getProfileEvents(profile.id);
      matches = evaluateSegmentRules(profile, segment.rules, events);
    } else if (segment.type === 'rfm') {
      const events = getProfileEvents(profile.id);
      const rfm = calculateRFM(profile, events);
      
      // Match based on RFM scores in rules
      if (segment.rules.rfmScores) {
        matches = segment.rules.rfmScores.includes(rfm.score);
      }
    }
    
    if (matches) {
      members.add(profile.id);
      
      // Add segment to profile
      if (!profile.segments.includes(segmentId)) {
        profile.segments.push(segmentId);
        updateProfile(profile.id, { segments: profile.segments });
      }
    } else {
      // Remove segment from profile if it was there
      if (profile.segments.includes(segmentId)) {
        profile.segments = profile.segments.filter(s => s !== segmentId);
        updateProfile(profile.id, { segments: profile.segments });
      }
    }
  });
  
  segmentMembership.set(segmentId, members);
  segment.size = members.size;
  segment.lastComputed = new Date().toISOString();
  segments.set(segmentId, segment);
}

/**
 * Get all segments
 */
function getAllSegments() {
  return Array.from(segments.values());
}

/**
 * Get segment members
 */
function getSegmentMembers(segmentId, options = {}) {
  const limit = options.limit || 100;
  const offset = options.offset || 0;
  
  const memberIds = Array.from(segmentMembership.get(segmentId) || new Set());
  const total = memberIds.size;
  
  const paginatedIds = memberIds.slice(offset, offset + limit);
  const members = paginatedIds.map(id => getProfile(id)).filter(Boolean);
  
  return {
    members,
    total,
    limit,
    offset,
  };
}

/**
 * Get segment size (count)
 */
function getSegmentSize(segmentId) {
  const members = segmentMembership.get(segmentId) || new Set();
  return members.size;
}

/**
 * Calculate segment overlap
 */
function calculateSegmentOverlap(segmentId1, segmentId2) {
  const members1 = segmentMembership.get(segmentId1) || new Set();
  const members2 = segmentMembership.get(segmentId2) || new Set();
  
  const overlap = new Set([...members1].filter(id => members2.has(id)));
  const union = new Set([...members1, ...members2]);
  
  return {
    segment1: {
      id: segmentId1,
      size: members1.size,
    },
    segment2: {
      id: segmentId2,
      size: members2.size,
    },
    overlap: overlap.size,
    overlapPercent: parseFloat((overlap.size / members1.size * 100).toFixed(2)),
    unique1: members1.size - overlap.size,
    unique2: members2.size - overlap.size,
    jaccardIndex: parseFloat((overlap.size / union.size).toFixed(4)),
  };
}

/**
 * Check if profile belongs to segment
 */
function isProfileInSegment(profileId, segmentId) {
  const members = segmentMembership.get(segmentId) || new Set();
  return members.has(profileId);
}

/**
 * Add profile to segment manually (for manual segments)
 */
function addProfileToSegment(profileId, segmentId) {
  const segment = segments.get(segmentId);
  if (!segment) throw new Error('Segment not found');
  
  const members = segmentMembership.get(segmentId) || new Set();
  members.add(profileId);
  segmentMembership.set(segmentId, members);
  
  const profile = getProfile(profileId);
  if (profile && !profile.segments.includes(segmentId)) {
    profile.segments.push(segmentId);
    updateProfile(profileId, { segments: profile.segments });
  }
  
  segment.size = members.size;
  segments.set(segmentId, segment);
}

/**
 * Remove profile from segment manually
 */
function removeProfileFromSegment(profileId, segmentId) {
  const members = segmentMembership.get(segmentId) || new Set();
  members.delete(profileId);
  segmentMembership.set(segmentId, members);
  
  const profile = getProfile(profileId);
  if (profile) {
    profile.segments = profile.segments.filter(s => s !== segmentId);
    updateProfile(profileId, { segments: profile.segments });
  }
  
  const segment = segments.get(segmentId);
  if (segment) {
    segment.size = members.size;
    segments.set(segmentId, segment);
  }
}

/**
 * Recompute all segments
 */
function recomputeAllSegments() {
  const allSegments = getAllSegments();
  allSegments.forEach(segment => {
    computeSegmentMembership(segment.id);
  });
  
  return {
    segmentsRecomputed: allSegments.length,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Clear all segments (for testing)
 */
function clearAllSegments() {
  segments.clear();
  segmentMembership.clear();
  
  // Clear segments from profiles
  const profiles = getAllProfiles();
  profiles.forEach(profile => {
    if (profile.segments.length > 0) {
      profile.segments = [];
      updateProfile(profile.id, { segments: [] });
    }
  });
}

module.exports = {
  createSegment,
  getSegment,
  updateSegment,
  deleteSegment,
  getAllSegments,
  getSegmentMembers,
  getSegmentSize,
  calculateSegmentOverlap,
  isProfileInSegment,
  addProfileToSegment,
  removeProfileFromSegment,
  computeSegmentMembership,
  recomputeAllSegments,
  calculateRFM,
  clearAllSegments,
};
