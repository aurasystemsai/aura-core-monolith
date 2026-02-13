/**
 * USER PROFILING ENGINE
 * Builds rich user profiles from behavioral data, preferences, and demographics
 */

// Storage
const userProfiles = new Map();
const behavioralSignals = new Map();
const preferences = new Map();
const segments = new Map();
const affinityScores = new Map();
const interestGraph = new Map();

// Generate unique ID
function generateId(prefix = 'prof') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create or update user profile
 */
function createProfile({ userId, email, demographics = {}, sourceData = {} }) {
  const profileId = generateId('prof');
  
  const profile = {
    id: profileId,
    userId,
    email,
    demographics: {
      age: demographics.age || null,
      gender: demographics.gender || null,
      location: demographics.location || {},
      language: demographics.language || 'en',
      timezone: demographics.timezone || 'UTC',
      ...demographics
    },
    behavioral: {
      pageViews: 0,
      sessions: 0,
      purchases: 0,
      avgSessionDuration: 0,
      lastActive: new Date().toISOString(),
      firstSeen: new Date().toISOString(),
      deviceTypes: [],
      browsers: []
    },
    interests: [],
    affinities: {},
    segments: [],
    preferences: {},
    customAttributes: {},
    sourceData,
    score: 0,
    tier: 'new',
    lifecycle: 'visitor',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  userProfiles.set(profileId, profile);
  
  // Index by userId
  if (userId) {
    userProfiles.set(`user:${userId}`, profileId);
  }
  
  return profile;
}

/**
 * Get user profile
 */
function getProfile(profileId) {
  // Check if it's a userId lookup
  if (profileId.startsWith('user:')) {
    const actualId = userProfiles.get(profileId);
    if (actualId) {
      return userProfiles.get(actualId);
    }
  }
  return userProfiles.get(profileId);
}

/**
 * Track behavioral signal
 */
function trackBehavioralSignal({ userId, profileId, signal, data = {}, weight = 1.0 }) {
  const signalId = generateId('sig');
  
  const behavioralSignal = {
    id: signalId,
    userId,
    profileId,
    signal, // e.g., 'page_view', 'product_view', 'add_to_cart', 'purchase'
    data,
    weight,
    timestamp: new Date().toISOString()
  };
  
  behavioralSignals.set(signalId, behavioralSignal);
  
  // Update profile behavioral stats
  const profile = getProfile(profileId || `user:${userId}`);
  if (profile) {
    profile.behavioral.lastActive = new Date().toISOString();
    
    // Update specific metrics
    if (signal === 'page_view') {
      profile.behavioral.pageViews++;
    } else if (signal === 'session_start') {
      profile.behavioral.sessions++;
    } else if (signal === 'purchase') {
      profile.behavioral.purchases++;
    }
    
    // Track device and browser
    if (data.device && !profile.behavioral.deviceTypes.includes(data.device)) {
      profile.behavioral.deviceTypes.push(data.device);
    }
    if (data.browser && !profile.behavioral.browsers.includes(data.browser)) {
      profile.behavioral.browsers.push(data.browser);
    }
    
    profile.updatedAt = new Date().toISOString();
  }
  
  return behavioralSignal;
}

/**
 * Extract interests from behavioral signals
 */
function extractInterests(profileId, options = {}) {
  const { lookbackDays = 30, minOccurrences = 3 } = options;
  
  const profile = getProfile(profileId);
  if (!profile) {
    throw new Error('Profile not found');
  }
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);
  
  // Get recent signals
  const signals = Array.from(behavioralSignals.values()).filter(
    s => (s.profileId === profileId || s.userId === profile.userId) &&
         new Date(s.timestamp) > cutoffDate
  );
  
  // Count categories/topics
  const categoryCount = {};
  const productCount = {};
  
  signals.forEach(signal => {
    if (signal.data.category) {
      categoryCount[signal.data.category] = (categoryCount[signal.data.category] || 0) + signal.weight;
    }
    if (signal.data.tags) {
      signal.data.tags.forEach(tag => {
        categoryCount[tag] = (categoryCount[tag] || 0) + (signal.weight * 0.5);
      });
    }
    if (signal.data.productId) {
      productCount[signal.data.productId] = (productCount[signal.data.productId] || 0) + signal.weight;
    }
  });
  
  // Extract top interests
  const interests = Object.entries(categoryCount)
    .filter(([_, count]) => count >= minOccurrences)
    .sort((a, b) => b[1] - a[1])
    .map(([interest, score]) => ({ interest, score, type: 'category' }));
  
  const productInterests = Object.entries(productCount)
    .filter(([_, count]) => count >= minOccurrences)
    .sort((a, b) => b[1] - a[1])
    .map(([productId, score]) => ({ productId, score, type: 'product' }));
  
  profile.interests = [...interests.slice(0, 20), ...productInterests.slice(0, 10)];
  profile.updatedAt = new Date().toISOString();
  
  return profile.interests;
}

/**
 * Calculate affinity scores for categories/brands
 */
function calculateAffinityScores(profileId, options = {}) {
  const { lookbackDays = 90 } = options;
  
  const profile = getProfile(profileId);
  if (!profile) {
    throw new Error('Profile not found');
  }
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);
  
  const signals = Array.from(behavioralSignals.values()).filter(
    s => (s.profileId === profileId || s.userId === profile.userId) &&
         new Date(s.timestamp) > cutoffDate
  );
  
  // Calculate affinity by signal type and recency
  const affinities = {};
  const now = Date.now();
  
  signals.forEach(signal => {
    const entity = signal.data.category || signal.data.brand || signal.data.productType;
    if (!entity) return;
    
    // Time decay (more recent = higher weight)
    const ageHours = (now - new Date(signal.timestamp).getTime()) / (1000 * 60 * 60);
    const timeDecay = Math.exp(-ageHours / (24 * 30)); // Decay over 30 days
    
    // Signal weights
    const signalWeights = {
      purchase: 10,
      add_to_cart: 5,
      product_view: 2,
      page_view: 1,
      search: 3
    };
    
    const weight = (signalWeights[signal.signal] || 1) * signal.weight * timeDecay;
    
    affinities[entity] = (affinities[entity] || 0) + weight;
  });
  
  // Normalize to 0-100 scale
  const maxScore = Math.max(...Object.values(affinities), 1);
  Object.keys(affinities).forEach(entity => {
    affinities[entity] = Math.round((affinities[entity] / maxScore) * 100);
  });
  
  profile.affinities = affinities;
  affinityScores.set(profileId, affinities);
  profile.updatedAt = new Date().toISOString();
  
  return affinities;
}

/**
 * Set user preferences
 */
function setPreference({ profileId, userId, category, key, value }) {
  const profile = getProfile(profileId || `user:${userId}`);
  if (!profile) {
    throw new Error('Profile not found');
  }
  
  if (!profile.preferences[category]) {
    profile.preferences[category] = {};
  }
  
  profile.preferences[category][key] = value;
  profile.updatedAt = new Date().toISOString();
  
  preferences.set(`${profile.id}:${category}:${key}`, value);
  
  return profile.preferences;
}

/**
 * Get user preferences
 */
function getPreferences(profileId, category = null) {
  const profile = getProfile(profileId);
  if (!profile) {
    throw new Error('Profile not found');
  }
  
  if (category) {
    return profile.preferences[category] || {};
  }
  
  return profile.preferences;
}

/**
 * Assign user to segments
 */
function assignToSegment({ profileId, userId, segmentId, segmentName, auto = true }) {
  const profile = getProfile(profileId || `user:${userId}`);
  if (!profile) {
    throw new Error('Profile not found');
  }
  
  const assignment = {
    segmentId,
    segmentName,
    assignedAt: new Date().toISOString(),
    auto
  };
  
  // Check if already in segment
  const existing = profile.segments.find(s => s.segmentId === segmentId);
  if (!existing) {
    profile.segments.push(assignment);
  }
  
  profile.updatedAt = new Date().toISOString();
  
  // Track in segments map
  if (!segments.has(segmentId)) {
    segments.set(segmentId, []);
  }
  segments.get(segmentId).push(profile.id);
  
  return profile.segments;
}

/**
 * Calculate profile completeness score
 */
function calculateProfileScore(profileId) {
  const profile = getProfile(profileId);
  if (!profile) {
    throw new Error('Profile not found');
  }
  
  let score = 0;
  
  // Demographics (30 points)
  if (profile.demographics.age) score += 5;
  if (profile.demographics.gender) score += 5;
  if (profile.demographics.location?.city) score += 5;
  if (profile.demographics.location?.country) score += 5;
  if (profile.email) score += 10;
  
  // Behavioral (40 points)
  if (profile.behavioral.pageViews > 10) score += 10;
  if (profile.behavioral.sessions > 5) score += 10;
  if (profile.behavioral.purchases > 0) score += 20;
  
  // Interests & Preferences (30 points)
  if (profile.interests.length > 0) score += 10;
  if (Object.keys(profile.affinities).length > 0) score += 10;
  if (Object.keys(profile.preferences).length > 0) score += 10;
  
  profile.score = Math.min(score, 100);
  profile.updatedAt = new Date().toISOString();
  
  return profile.score;
}

/**
 * Update lifecycle stage based on behavior
 */
function updateLifecycleStage(profileId) {
  const profile = getProfile(profileId);
  if (!profile) {
    throw new Error('Profile not found');
  }
  
  const { pageViews, sessions, purchases, lastActive } = profile.behavioral;
  const daysSinceActive = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24);
  
  // Determine lifecycle stage
  if (purchases >= 5) {
    profile.lifecycle = 'advocate';
    profile.tier = 'vip';
  } else if (purchases >= 2) {
    profile.lifecycle = 'customer';
    profile.tier = 'loyal';
  } else if (purchases === 1) {
    profile.lifecycle = 'customer';
    profile.tier = 'active';
  } else if (sessions >= 3 && pageViews >= 10) {
    profile.lifecycle = 'engaged';
    profile.tier = 'active';
  } else if (sessions >= 1) {
    profile.lifecycle = 'visitor';
    profile.tier = 'new';
  } else {
    profile.lifecycle = 'anonymous';
    profile.tier = 'new';
  }
  
  // Check for churn
  if (daysSinceActive > 90 && purchases > 0) {
    profile.lifecycle = 'churned';
  } else if (daysSinceActive > 180) {
    profile.lifecycle = 'inactive';
  }
  
  profile.updatedAt = new Date().toISOString();
  
  return profile.lifecycle;
}

/**
 * Build interest graph (relationships between interests)
 */
function buildInterestGraph(profileId) {
  const profile = getProfile(profileId);
  if (!profile) {
    throw new Error('Profile not found');
  }
  
  const signals = Array.from(behavioralSignals.values()).filter(
    s => s.profileId === profileId || s.userId === profile.userId
  );
  
  // Build co-occurrence matrix
  const graph = {};
  
  // Group signals by session (using time proximity)
  const sessionWindow = 30 * 60 * 1000; // 30 minutes
  const sortedSignals = signals.sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
  
  const sessions = [];
  let currentSession = [];
  let lastTime = null;
  
  sortedSignals.forEach(signal => {
    const time = new Date(signal.timestamp).getTime();
    
    if (!lastTime || (time - lastTime) > sessionWindow) {
      if (currentSession.length > 0) {
        sessions.push(currentSession);
      }
      currentSession = [signal];
    } else {
      currentSession.push(signal);
    }
    
    lastTime = time;
  });
  
  if (currentSession.length > 0) {
    sessions.push(currentSession);
  }
  
  // Build graph from co-occurrences
  sessions.forEach(session => {
    const categories = session
      .map(s => s.data.category)
      .filter(c => c);
    
    // Create edges between co-occurring categories
    for (let i = 0; i < categories.length; i++) {
      for (let j = i + 1; j < categories.length; j++) {
        const cat1 = categories[i];
        const cat2 = categories[j];
        
        if (!graph[cat1]) graph[cat1] = {};
        if (!graph[cat2]) graph[cat2] = {};
        
        graph[cat1][cat2] = (graph[cat1][cat2] || 0) + 1;
        graph[cat2][cat1] = (graph[cat2][cat1] || 0) + 1;
      }
    }
  });
  
  interestGraph.set(profileId, graph);
  
  return graph;
}

/**
 * Merge profiles (duplicate detection)
 */
function mergeProfiles(sourceProfileIds, targetProfileId) {
  const target = getProfile(targetProfileId);
  if (!target) {
    throw new Error('Target profile not found');
  }
  
  sourceProfileIds.forEach(sourceId => {
    const source = getProfile(sourceId);
    if (!source) return;
    
    // Merge behavioral data
    target.behavioral.pageViews += source.behavioral.pageViews;
    target.behavioral.sessions += source.behavioral.sessions;
    target.behavioral.purchases += source.behavioral.purchases;
    
    // Take earliest first seen
    if (new Date(source.behavioral.firstSeen) < new Date(target.behavioral.firstSeen)) {
      target.behavioral.firstSeen = source.behavioral.firstSeen;
    }
    
    // Merge interests (union)
    source.interests.forEach(interest => {
      const existing = target.interests.find(i => i.interest === interest.interest);
      if (existing) {
        existing.score = Math.max(existing.score, interest.score);
      } else {
        target.interests.push(interest);
      }
    });
    
    // Merge affinities (max)
    Object.entries(source.affinities).forEach(([entity, score]) => {
      target.affinities[entity] = Math.max(target.affinities[entity] || 0, score);
    });
    
    // Merge preferences (source wins on conflict)
    Object.entries(source.preferences).forEach(([category, prefs]) => {
      if (!target.preferences[category]) {
        target.preferences[category] = {};
      }
      Object.assign(target.preferences[category], prefs);
    });
    
    // Merge segments (union)
    source.segments.forEach(seg => {
      const existing = target.segments.find(s => s.segmentId === seg.segmentId);
      if (!existing) {
        target.segments.push(seg);
      }
    });
    
    // Remove source profile
    userProfiles.delete(sourceId);
    if (source.userId) {
      userProfiles.delete(`user:${source.userId}`);
    }
  });
  
  target.updatedAt = new Date().toISOString();
  
  // Recalculate score
  calculateProfileScore(targetProfileId);
  
  return target;
}

/**
 * Search profiles
 */
function searchProfiles(query = {}) {
  const {
    lifecycle,
    tier,
    minScore = 0,
    interests = [],
    segments: segmentIds = [],
    limit = 50
  } = query;
  
  let results = Array.from(userProfiles.values())
    .filter(p => typeof p === 'object' && p.id); // Filter out index entries
  
  if (lifecycle) {
    results = results.filter(p => p.lifecycle === lifecycle);
  }
  
  if (tier) {
    results = results.filter(p => p.tier === tier);
  }
  
  if (minScore > 0) {
    results = results.filter(p => p.score >= minScore);
  }
  
  if (interests.length > 0) {
    results = results.filter(p => 
      p.interests.some(i => interests.includes(i.interest))
    );
  }
  
  if (segmentIds.length > 0) {
    results = results.filter(p =>
      p.segments.some(s => segmentIds.includes(s.segmentId))
    );
  }
  
  return results.slice(0, limit);
}

/**
 * Get profile analytics
 */
function getProfileAnalytics() {
  const profiles = Array.from(userProfiles.values())
    .filter(p => typeof p === 'object' && p.id);
  
  const analytics = {
    total: profiles.length,
    byLifecycle: {},
    byTier: {},
    avgScore: 0,
    topInterests: {},
    topAffinities: {}
  };
  
  profiles.forEach(profile => {
    // Count by lifecycle
    analytics.byLifecycle[profile.lifecycle] = 
      (analytics.byLifecycle[profile.lifecycle] || 0) + 1;
    
    // Count by tier
    analytics.byTier[profile.tier] = 
      (analytics.byTier[profile.tier] || 0) + 1;
    
    // Sum scores
    analytics.avgScore += profile.score;
    
    // Aggregate interests
    profile.interests.forEach(interest => {
      const key = interest.interest || interest.productId;
      analytics.topInterests[key] = (analytics.topInterests[key] || 0) + 1;
    });
    
    // Aggregate affinities
    Object.keys(profile.affinities).forEach(entity => {
      analytics.topAffinities[entity] = (analytics.topAffinities[entity] || 0) + 1;
    });
  });
  
  analytics.avgScore = profiles.length > 0 
    ? Math.round(analytics.avgScore / profiles.length) 
    : 0;
  
  return analytics;
}

module.exports = {
  createProfile,
  getProfile,
  trackBehavioralSignal,
  extractInterests,
  calculateAffinityScores,
  setPreference,
  getPreferences,
  assignToSegment,
  calculateProfileScore,
  updateLifecycleStage,
  buildInterestGraph,
  mergeProfiles,
  searchProfiles,
  getProfileAnalytics
};
