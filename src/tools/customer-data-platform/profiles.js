/**
 * Customer Data Platform - Profile Management
 * Handles customer profile CRUD, identity resolution, and golden record creation
 */

const crypto = require('crypto');

// In-memory storage (replace with database in production)
const profiles = new Map();
const identityIndex = new Map(); // Maps external IDs to profile IDs

/**
 * Generate unique profile ID
 */
function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Index external IDs for identity resolution
 */
function indexIdentifiers(profileId, externalIds) {
  const ids = [];
  
  if (externalIds.shopifyId) ids.push(`shopify:${externalIds.shopifyId}`);
  if (externalIds.email) ids.push(`email:${externalIds.email.toLowerCase()}`);
  if (externalIds.phone) ids.push(`phone:${externalIds.phone}`);
  if (externalIds.customerId) ids.push(`customer:${externalIds.customerId}`);
  if (externalIds.deviceIds) {
    externalIds.deviceIds.forEach(id => ids.push(`device:${id}`));
  }
  
  ids.forEach(id => identityIndex.set(id, profileId));
}

/**
 * Remove external ID indexes
 */
function removeIdentifiers(externalIds) {
  const ids = [];
  
  if (externalIds.shopifyId) ids.push(`shopify:${externalIds.shopifyId}`);
  if (externalIds.email) ids.push(`email:${externalIds.email.toLowerCase()}`);
  if (externalIds.phone) ids.push(`phone:${externalIds.phone}`);
  if (externalIds.customerId) ids.push(`customer:${externalIds.customerId}`);
  if (externalIds.deviceIds) {
    externalIds.deviceIds.forEach(id => ids.push(`device:${id}`));
  }
  
  ids.forEach(id => identityIndex.delete(id));
}

/**
 * Find profile by any external ID (identity resolution)
 */
function findProfileByIdentity(externalIds) {
  const candidates = new Set();
  
  if (externalIds.shopifyId) {
    const id = identityIndex.get(`shopify:${externalIds.shopifyId}`);
    if (id) candidates.add(id);
  }
  if (externalIds.email) {
    const id = identityIndex.get(`email:${externalIds.email.toLowerCase()}`);
    if (id) candidates.add(id);
  }
  if (externalIds.phone) {
    const id = identityIndex.get(`phone:${externalIds.phone}`);
    if (id) candidates.add(id);
  }
  if (externalIds.customerId) {
    const id = identityIndex.get(`customer:${externalIds.customerId}`);
    if (id) candidates.add(id);
  }
  if (externalIds.deviceIds) {
    externalIds.deviceIds.forEach(deviceId => {
      const id = identityIndex.get(`device:${deviceId}`);
      if (id) candidates.add(id);
    });
  }
  
  // Return array of matching profile IDs
  return Array.from(candidates);
}

/**
 * Calculate computed fields from profile data and events
 */
function calculateComputedFields(profile, events = []) {
  const now = new Date();
  const computed = {
    firstSeenDate: profile.createdAt,
    lastSeenDate: profile.updatedAt || profile.createdAt,
  };
  
  // Calculate from events if available
  if (events.length > 0) {
    const purchases = events.filter(e => e.type === 'purchase');
    
    if (purchases.length > 0) {
      computed.purchaseCount = purchases.length;
      computed.ltv = purchases.reduce((sum, p) => sum + (p.properties?.revenue || 0), 0);
      computed.aov = computed.ltv / computed.purchaseCount;
      
      const dates = purchases.map(p => new Date(p.timestamp)).sort((a, b) => b - a);
      computed.lastPurchaseDate = dates[0].toISOString();
      
      // Simple churn risk: days since last purchase
      const daysSinceLastPurchase = (now - dates[0]) / (1000 * 60 * 60 * 24);
      if (daysSinceLastPurchase > 90) computed.churnRisk = 0.8;
      else if (daysSinceLastPurchase > 60) computed.churnRisk = 0.5;
      else if (daysSinceLastPurchase > 30) computed.churnRisk = 0.3;
      else computed.churnRisk = 0.1;
    }
    
    // Engagement score based on recent activity
    const recentEvents = events.filter(e => {
      const eventDate = new Date(e.timestamp);
      const daysAgo = (now - eventDate) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    });
    computed.engagementScore = Math.min(100, recentEvents.length * 2);
  }
  
  return computed;
}

/**
 * Create a new customer profile
 */
function createProfile(data, events = []) {
  const id = generateId();
  const now = new Date().toISOString();
  
  // Check for existing profiles with same identity
  const matchingProfileIds = findProfileByIdentity(data.externalIds || {});
  if (matchingProfileIds.length > 0) {
    // Return existing profile instead of creating duplicate
    return profiles.get(matchingProfileIds[0]);
  }
  
  const profile = {
    id,
    externalIds: data.externalIds || {},
    attributes: {
      firstName: data.attributes?.firstName,
      lastName: data.attributes?.lastName,
      email: data.attributes?.email,
      phone: data.attributes?.phone,
      country: data.attributes?.country,
      city: data.attributes?.city,
      postalCode: data.attributes?.postalCode,
      tags: data.attributes?.tags || [],
      customFields: data.attributes?.customFields || {},
    },
    computed: calculateComputedFields({ createdAt: now, updatedAt: now }, events),
    consent: {
      email: data.consent?.email ?? true,
      sms: data.consent?.sms ?? true,
      tracking: data.consent?.tracking ?? true,
      updatedAt: now,
    },
    segments: [],
    createdAt: now,
    updatedAt: now,
  };
  
  profiles.set(id, profile);
  indexIdentifiers(id, profile.externalIds);
  
  return profile;
}

/**
 * Get profile by ID
 */
function getProfile(id) {
  return profiles.get(id);
}

/**
 * Update profile
 */
function updateProfile(id, updates, events = []) {
  const profile = profiles.get(id);
  if (!profile) return null;
  
  const now = new Date().toISOString();
  
  // Update external IDs if provided
  if (updates.externalIds) {
    // Remove old indexes
    removeIdentifiers(profile.externalIds);
    
    // Merge new IDs
    profile.externalIds = {
      ...profile.externalIds,
      ...updates.externalIds,
    };
    
    // Re-index
    indexIdentifiers(id, profile.externalIds);
  }
  
  // Update attributes
  if (updates.attributes) {
    profile.attributes = {
      ...profile.attributes,
      ...updates.attributes,
    };
    
    // Merge custom fields
    if (updates.attributes.customFields) {
      profile.attributes.customFields = {
        ...profile.attributes.customFields,
        ...updates.attributes.customFields,
      };
    }
    
    // Merge tags
    if (updates.attributes.tags) {
      profile.attributes.tags = [
        ...new Set([...profile.attributes.tags, ...updates.attributes.tags])
      ];
    }
  }
  
  // Update consent
  if (updates.consent) {
    profile.consent = {
      ...profile.consent,
      ...updates.consent,
      updatedAt: now,
    };
  }
  
  // Recalculate computed fields
  profile.computed = calculateComputedFields(profile, events);
  profile.updatedAt = now;
  
  profiles.set(id, profile);
  return profile;
}

/**
 * Delete profile (GDPR compliance)
 */
function deleteProfile(id) {
  const profile = profiles.get(id);
  if (!profile) return false;
  
  removeIdentifiers(profile.externalIds);
  profiles.delete(id);
  return true;
}

/**
 * Merge two profiles (identity resolution)
 */
function mergeProfiles(primaryId, secondaryId) {
  const primary = profiles.get(primaryId);
  const secondary = profiles.get(secondaryId);
  
  if (!primary || !secondary) {
    throw new Error('Both profiles must exist');
  }
  
  // Remove secondary indexes
  removeIdentifiers(secondary.externalIds);
  
  // Merge external IDs
  primary.externalIds = {
    shopifyId: primary.externalIds.shopifyId || secondary.externalIds.shopifyId,
    email: primary.externalIds.email || secondary.externalIds.email,
    phone: primary.externalIds.phone || secondary.externalIds.phone,
    customerId: primary.externalIds.customerId || secondary.externalIds.customerId,
    deviceIds: [
      ...(primary.externalIds.deviceIds || []),
      ...(secondary.externalIds.deviceIds || []),
    ],
  };
  
  // Merge attributes (primary takes precedence)
  primary.attributes = {
    firstName: primary.attributes.firstName || secondary.attributes.firstName,
    lastName: primary.attributes.lastName || secondary.attributes.lastName,
    email: primary.attributes.email || secondary.attributes.email,
    phone: primary.attributes.phone || secondary.attributes.phone,
    country: primary.attributes.country || secondary.attributes.country,
    city: primary.attributes.city || secondary.attributes.city,
    postalCode: primary.attributes.postalCode || secondary.attributes.postalCode,
    tags: [...new Set([...primary.attributes.tags, ...secondary.attributes.tags])],
    customFields: {
      ...secondary.attributes.customFields,
      ...primary.attributes.customFields,
    },
  };
  
  // Merge consent (most restrictive)
  primary.consent = {
    email: primary.consent.email && secondary.consent.email,
    sms: primary.consent.sms && secondary.consent.sms,
    tracking: primary.consent.tracking && secondary.consent.tracking,
    updatedAt: new Date().toISOString(),
  };
  
  // Merge segments
  primary.segments = [...new Set([...primary.segments, ...secondary.segments])];
  
  // Use earliest created date
  if (new Date(secondary.createdAt) < new Date(primary.createdAt)) {
    primary.createdAt = secondary.createdAt;
  }
  
  primary.updatedAt = new Date().toISOString();
  
  // Re-index merged profile
  indexIdentifiers(primaryId, primary.externalIds);
  
  // Save and delete secondary
  profiles.set(primaryId, primary);
  profiles.delete(secondaryId);
  
  return primary;
}

/**
 * Search profiles with filters
 */
function searchProfiles(filters = {}, options = {}) {
  const limit = options.limit || 100;
  const offset = options.offset || 0;
  
  let results = Array.from(profiles.values());
  
  // Filter by attributes
  if (filters.email) {
    results = results.filter(p => 
      p.attributes.email?.toLowerCase().includes(filters.email.toLowerCase())
    );
  }
  
  if (filters.phone) {
    results = results.filter(p => p.attributes.phone?.includes(filters.phone));
  }
  
  if (filters.country) {
    results = results.filter(p => p.attributes.country === filters.country);
  }
  
  if (filters.tags && filters.tags.length > 0) {
    results = results.filter(p => 
      filters.tags.some(tag => p.attributes.tags.includes(tag))
    );
  }
  
  if (filters.segment) {
    results = results.filter(p => p.segments.includes(filters.segment));
  }
  
  // Filter by computed fields
  if (filters.minLTV !== undefined) {
    results = results.filter(p => (p.computed.ltv || 0) >= filters.minLTV);
  }
  
  if (filters.maxChurnRisk !== undefined) {
    results = results.filter(p => (p.computed.churnRisk || 0) <= filters.maxChurnRisk);
  }
  
  if (filters.minEngagement !== undefined) {
    results = results.filter(p => (p.computed.engagementScore || 0) >= filters.minEngagement);
  }
  
  // Sort
  if (options.sortBy) {
    const dir = options.sortDir === 'asc' ? 1 : -1;
    results.sort((a, b) => {
      const aVal = options.sortBy.includes('.') 
        ? options.sortBy.split('.').reduce((obj, key) => obj?.[key], a)
        : a[options.sortBy];
      const bVal = options.sortBy.includes('.')
        ? options.sortBy.split('.').reduce((obj, key) => obj?.[key], b)
        : b[options.sortBy];
      
      if (aVal < bVal) return -dir;
      if (aVal > bVal) return dir;
      return 0;
    });
  }
  
  const total = results.length;
  results = results.slice(offset, offset + limit);
  
  return {
    profiles: results,
    total,
    limit,
    offset,
  };
}

/**
 * Get all profiles (for testing)
 */
function getAllProfiles() {
  return Array.from(profiles.values());
}

/**
 * Clear all profiles (for testing)
 */
function clearAllProfiles() {
  profiles.clear();
  identityIndex.clear();
}

module.exports = {
  createProfile,
  getProfile,
  updateProfile,
  deleteProfile,
  mergeProfiles,
  searchProfiles,
  findProfileByIdentity,
  getAllProfiles,
  clearAllProfiles,
};
