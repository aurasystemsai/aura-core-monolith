/**
 * PROFILE MANAGEMENT ENGINE
 * Unified customer profiles, identity resolution, trait management,
 * profile merging, cross-device tracking, and contact enrichment
 */

// In-memory stores
const profiles = new Map();
const identities = new Map();
const traits = new Map();
const mergeHistory = new Map();
const enrichmentQueue = new Map();

// ================================================================
// PROFILE MANAGEMENT
// ================================================================

function createProfile({ userId, email, phone, externalId, traits = {}, metadata = {} }) {
  const id = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const profile = {
    id,
    userId,
    email,
    phone,
    externalId,
    traits,
    metadata,
    identities: [],
    devices: [],
    sessions: [],
    firstSeen: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    totalEvents: 0,
    totalValue: 0,
    tags: [],
    segments: [],
    score: null,
    lifecycle: 'new',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  profiles.set(id, profile);
  
  // Index by identifiers
  if (email) identities.set(`email:${email}`, id);
  if (phone) identities.set(`phone:${phone}`, id);
  if (userId) identities.set(`userId:${userId}`, id);
  if (externalId) identities.set(`externalId:${externalId}`, id);
  
  return profile;
}

function getProfile(id) {
  return profiles.get(id) || null;
}

function findProfileByIdentity(type, value) {
  const profileId = identities.get(`${type}:${value}`);
  return profileId ? profiles.get(profileId) : null;
}

function listProfiles({ limit = 100, offset = 0, filters = {} }) {
  let results = Array.from(profiles.values());
  
  // Apply filters
  if (filters.lifecycle) {
    results = results.filter(p => p.lifecycle === filters.lifecycle);
  }
  
  if (filters.status) {
    results = results.filter(p => p.status === filters.status);
  }
  
  if (filters.tags && filters.tags.length > 0) {
    results = results.filter(p => 
      filters.tags.some(tag => p.tags.includes(tag))
    );
  }
  
  if (filters.minValue) {
    results = results.filter(p => p.totalValue >= filters.minValue);
  }
  
  // Sort by last seen
  results.sort((a, b) => new Date(b.lastSeen) - new Date(a.lastSeen));
  
  return {
    profiles: results.slice(offset, offset + limit),
    total: results.length,
    offset,
    limit
  };
}

function updateProfile(id, updates) {
  const profile = profiles.get(id);
  if (!profile) return null;
  
  // Update fields
  Object.keys(updates).forEach(key => {
    if (key === 'traits') {
      profile.traits = { ...profile.traits, ...updates.traits };
    } else if (key === 'metadata') {
      profile.metadata = { ...profile.metadata, ...updates.metadata };
    } else {
      profile[key] = updates[key];
    }
  });
  
  profile.updatedAt = new Date().toISOString();
  profiles.set(id, profile);
  
  return profile;
}

function deleteProfile(id) {
  const profile = profiles.get(id);
  if (!profile) return false;
  
  // Remove from identity index
  if (profile.email) identities.delete(`email:${profile.email}`);
  if (profile.phone) identities.delete(`phone:${profile.phone}`);
  if (profile.userId) identities.delete(`userId:${profile.userId}`);
  if (profile.externalId) identities.delete(`externalId:${profile.externalId}`);
  
  return profiles.delete(id);
}

// ================================================================
// IDENTITY RESOLUTION
// ================================================================

function resolveIdentity({ email, phone, userId, deviceId }) {
  const matches = [];
  
  if (email) {
    const id = identities.get(`email:${email}`);
    if (id) matches.push({ type: 'email', value: email, profileId: id });
  }
  
  if (phone) {
    const id = identities.get(`phone:${phone}`);
    if (id) matches.push({ type: 'phone', value: phone, profileId: id });
  }
  
  if (userId) {
    const id = identities.get(`userId:${userId}`);
    if (id) matches.push({ type: 'userId', value: userId, profileId: id });
  }
  
  if (deviceId) {
    const id = identities.get(`deviceId:${deviceId}`);
    if (id) matches.push({ type: 'deviceId', value: deviceId, profileId: id });
  }
  
  if (matches.length === 0) {
    return { resolved: false, profileId: null, confidence: 0 };
  }
  
  // Check if all matches point to same profile
  const uniqueProfiles = [...new Set(matches.map(m => m.profileId))];
  
  if (uniqueProfiles.length === 1) {
    return {
      resolved: true,
      profileId: uniqueProfiles[0],
      identities: matches,
      confidence: 1.0
    };
  }
  
  // Multiple profiles found - needs merging
  return {
    resolved: false,
    conflict: true,
    profiles: uniqueProfiles,
    identities: matches,
    confidence: 0.5
  };
}

function linkIdentity(profileId, type, value) {
  const profile = profiles.get(profileId);
  if (!profile) return null;
  
  const key = `${type}:${value}`;
  
  // Check if already linked elsewhere
  const existingProfileId = identities.get(key);
  if (existingProfileId && existingProfileId !== profileId) {
    return {
      success: false,
      error: 'Identity already linked to another profile',
      conflictingProfileId: existingProfileId
    };
  }
  
  identities.set(key, profileId);
  
  if (!profile.identities) profile.identities = [];
  profile.identities.push({ type, value, linkedAt: new Date().toISOString() });
  profile.updatedAt = new Date().toISOString();
  
  profiles.set(profileId, profile);
  
  return { success: true, profile };
}

function unlinkIdentity(profileId, type, value) {
  const profile = profiles.get(profileId);
  if (!profile) return null;
  
  const key = `${type}:${value}`;
  identities.delete(key);
  
  if (profile.identities) {
    profile.identities = profile.identities.filter(
      i => !(i.type === type && i.value === value)
    );
  }
  
  profile.updatedAt = new Date().toISOString();
  profiles.set(profileId, profile);
  
  return profile;
}

// ================================================================
// PROFILE MERGING
// ================================================================

function mergeProfiles(sourceId, targetId, strategy = 'latest') {
  const source = profiles.get(sourceId);
  const target = profiles.get(targetId);
  
  if (!source || !target) return null;
  
  const mergeId = `merge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Merge traits
  const mergedTraits = mergeTraits(source.traits, target.traits, strategy);
  
  // Merge metadata
  const mergedMetadata = { ...source.metadata, ...target.metadata };
  
  // Merge arrays
  const mergedIdentities = [...(source.identities || []), ...(target.identities || [])];
  const mergedDevices = [...(source.devices || []), ...(target.devices || [])];
  const mergedTags = [...new Set([...(source.tags || []), ...(target.tags || [])])];
  const mergedSegments = [...new Set([...(source.segments || []), ...(target.segments || [])])];
  
  // Update target profile
  target.traits = mergedTraits;
  target.metadata = mergedMetadata;
  target.identities = mergedIdentities;
  target.devices = mergedDevices;
  target.tags = mergedTags;
  target.segments = mergedSegments;
  target.totalEvents = source.totalEvents + target.totalEvents;
  target.totalValue = source.totalValue + target.totalValue;
  target.firstSeen = source.firstSeen < target.firstSeen ? source.firstSeen : target.firstSeen;
  target.updatedAt = new Date().toISOString();
  
  profiles.set(targetId, target);
  
  // Record merge history
  const merge = {
    id: mergeId,
    sourceId,
    targetId,
    strategy,
    mergedAt: new Date().toISOString(),
    sourceSnapshot: { ...source },
    targetSnapshot: { ...target }
  };
  
  mergeHistory.set(mergeId, merge);
  
  // Delete source profile
  deleteProfile(sourceId);
  
  // Re-index identities to point to target
  source.identities?.forEach(identity => {
    const key = `${identity.type}:${identity.value}`;
    identities.set(key, targetId);
  });
  
  return {
    mergeId,
    mergedProfile: target,
    sourceProfileId: sourceId,
    targetProfileId: targetId
  };
}

function mergeTraits(sourceTraits, targetTraits, strategy) {
  const merged = { ...sourceTraits };
  
  Object.keys(targetTraits).forEach(key => {
    if (!(key in merged)) {
      merged[key] = targetTraits[key];
    } else if (strategy === 'latest') {
      merged[key] = targetTraits[key];
    } else if (strategy === 'oldest') {
      // Keep source (older) value
    } else if (strategy === 'max') {
      merged[key] = Math.max(merged[key], targetTraits[key]);
    } else if (strategy === 'sum') {
      merged[key] = merged[key] + targetTraits[key];
    }
  });
  
  return merged;
}

function getMergeHistory({ profileId, limit = 50 }) {
  let results = Array.from(mergeHistory.values());
  
  if (profileId) {
    results = results.filter(m => m.sourceId === profileId || m.targetId === profileId);
  }
  
  return results
    .sort((a, b) => new Date(b.mergedAt) - new Date(a.mergedAt))
    .slice(0, limit);
}

// ================================================================
// TRAIT MANAGEMENT
// ================================================================

function setTrait(profileId, key, value, options = {}) {
  const profile = profiles.get(profileId);
  if (!profile) return null;
  
  if (!profile.traits) profile.traits = {};
  
  const trait = {
    key,
    value,
    type: typeof value,
    source: options.source || 'manual',
    updatedAt: new Date().toISOString()
  };
  
  profile.traits[key] = value;
  profile.updatedAt = new Date().toISOString();
  
  profiles.set(profileId, profile);
  
  // Store trait metadata
  const traitKey = `${profileId}:${key}`;
  traits.set(traitKey, trait);
  
  return trait;
}

function getTrait(profileId, key) {
  const profile = profiles.get(profileId);
  if (!profile || !profile.traits) return null;
  
  return profile.traits[key];
}

function removeTrait(profileId, key) {
  const profile = profiles.get(profileId);
  if (!profile || !profile.traits) return false;
  
  delete profile.traits[key];
  profile.updatedAt = new Date().toISOString();
  profiles.set(profileId, profile);
  
  const traitKey = `${profileId}:${key}`;
  traits.delete(traitKey);
  
  return true;
}

function incrementTrait(profileId, key, amount = 1) {
  const profile = profiles.get(profileId);
  if (!profile) return null;
  
  if (!profile.traits) profile.traits = {};
  
  const currentValue = profile.traits[key] || 0;
  profile.traits[key] = currentValue + amount;
  profile.updatedAt = new Date().toISOString();
  
  profiles.set(profileId, profile);
  
  return profile.traits[key];
}

function listTraitKeys({ limit = 100 }) {
  const keys = new Set();
  
  profiles.forEach(profile => {
    if (profile.traits) {
      Object.keys(profile.traits).forEach(key => keys.add(key));
    }
  });
  
  return Array.from(keys).slice(0, limit);
}

// ================================================================
// ENRICHMENT
// ================================================================

function enqueueEnrichment(profileId, provider = 'clearbit') {
  const id = `enrich_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const job = {
    id,
    profileId,
    provider,
    status: 'pending',
    attempts: 0,
    result: null,
    error: null,
    createdAt: new Date().toISOString()
  };
  
  enrichmentQueue.set(id, job);
  
  // Simulate enrichment
  setTimeout(() => performEnrichment(id), 1000);
  
  return job;
}

function performEnrichment(jobId) {
  const job = enrichmentQueue.get(jobId);
  if (!job) return;
  
  const profile = profiles.get(job.profileId);
  if (!profile) {
    job.status = 'failed';
    job.error = 'Profile not found';
    enrichmentQueue.set(jobId, job);
    return;
  }
  
  // Simulate enrichment data
  const enrichedData = {
    company: 'Acme Corp',
    jobTitle: 'Software Engineer',
    seniority: 'mid',
    industry: 'Technology',
    employeeCount: '100-500',
    revenue: '$10M-$50M',
    location: 'San Francisco, CA',
    linkedin: 'https://linkedin.com/in/example',
    twitter: '@example'
  };
  
  // Update profile with enriched data
  profile.traits = { ...profile.traits, ...enrichedData };
  profile.metadata.enriched = true;
  profile.metadata.enrichedAt = new Date().toISOString();
  profile.metadata.enrichmentProvider = job.provider;
  profile.updatedAt = new Date().toISOString();
  
  profiles.set(job.profileId, profile);
  
  job.status = 'completed';
  job.result = enrichedData;
  job.completedAt = new Date().toISOString();
  enrichmentQueue.set(jobId, job);
}

function getEnrichmentJob(id) {
  return enrichmentQueue.get(id) || null;
}

function listEnrichmentJobs({ status, limit = 100 }) {
  let results = Array.from(enrichmentQueue.values());
  
  if (status) {
    results = results.filter(j => j.status === status);
  }
  
  return results
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

// ================================================================
// PROFILE SCORING
// ================================================================

function calculateProfileScore(profileId) {
  const profile = profiles.get(profileId);
  if (!profile) return null;
  
  let score = 0;
  
  // Completeness (0-30 points)
  const fieldsPresent = [
    profile.email,
    profile.phone,
    profile.traits?.firstName,
    profile.traits?.lastName,
    profile.traits?.company,
    profile.traits?.jobTitle
  ].filter(Boolean).length;
  score += (fieldsPresent / 6) * 30;
  
  // Engagement (0-30 points)
  const eventScore = Math.min(profile.totalEvents / 100, 1) * 30;
  score += eventScore;
  
  // Value (0-30 points)
  const valueScore = Math.min(profile.totalValue / 10000, 1) * 30;
  score += valueScore;
  
  // Recency (0-10 points)
  const daysSinceLastSeen = (Date.now() - new Date(profile.lastSeen)) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 10 - daysSinceLastSeen);
  score += recencyScore;
  
  // Round to integer
  score = Math.round(score);
  
  profile.score = score;
  profile.updatedAt = new Date().toISOString();
  profiles.set(profileId, profile);
  
  return score;
}

function scoreAllProfiles() {
  const results = [];
  
  profiles.forEach((profile, id) => {
    const score = calculateProfileScore(id);
    results.push({ profileId: id, score });
  });
  
  return results.sort((a, b) => b.score - a.score);
}

// ================================================================
// LIFECYCLE MANAGEMENT
// ================================================================

function updateLifecycleStage(profileId, stage) {
  const profile = profiles.get(profileId);
  if (!profile) return null;
  
  const validStages = ['new', 'lead', 'marketing_qualified', 'sales_qualified', 'opportunity', 'customer', 'champion', 'inactive'];
  
  if (!validStages.includes(stage)) {
    throw new Error(`Invalid lifecycle stage: ${stage}`);
  }
  
  profile.lifecycle = stage;
  profile.updatedAt = new Date().toISOString();
  profiles.set(profileId, profile);
  
  return profile;
}

function getProfilesByLifecycle(stage) {
  return Array.from(profiles.values())
    .filter(p => p.lifecycle === stage)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Profile CRUD
  createProfile,
  getProfile,
  findProfileByIdentity,
  listProfiles,
  updateProfile,
  deleteProfile,
  
  // Identity Resolution
  resolveIdentity,
  linkIdentity,
  unlinkIdentity,
  
  // Merging
  mergeProfiles,
  getMergeHistory,
  
  // Traits
  setTrait,
  getTrait,
  removeTrait,
  incrementTrait,
  listTraitKeys,
  
  // Enrichment
  enqueueEnrichment,
  getEnrichmentJob,
  listEnrichmentJobs,
  
  // Scoring
  calculateProfileScore,
  scoreAllProfiles,
  
  // Lifecycle
  updateLifecycleStage,
  getProfilesByLifecycle,
  
  // Data stores
  profiles,
  identities,
  traits,
  mergeHistory,
  enrichmentQueue
};
