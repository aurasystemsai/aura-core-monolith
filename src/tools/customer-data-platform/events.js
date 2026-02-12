/**
 * Customer Data Platform - Event Tracking
 * Handles customer event ingestion, session tracking, and timeline generation
 */

const crypto = require('crypto');
const { getProfile, updateProfile } = require('./profiles');

// In-memory storage
const events = new Map(); // eventId -> event
const profileEvents = new Map(); // profileId -> [eventIds]
const sessions = new Map(); // sessionId -> session data

/**
 * Generate unique event ID
 */
function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Track a single event
 */
function trackEvent(data) {
  const id = generateId();
  const timestamp = data.timestamp || new Date().toISOString();
  
  if (!data.profileId) {
    throw new Error('profileId is required');
  }
  
  if (!data.type) {
    throw new Error('event type is required');
  }
  
  const event = {
    id,
    profileId: data.profileId,
    type: data.type,
    timestamp,
    properties: data.properties || {},
    sessionId: data.sessionId,
    deviceId: data.deviceId,
    source: data.source || 'api',
  };
  
  // Store event
  events.set(id, event);
  
  // Index by profile
  if (!profileEvents.has(data.profileId)) {
    profileEvents.set(data.profileId, []);
  }
  profileEvents.get(data.profileId).push(id);
  
  // Update session if provided
  if (data.sessionId) {
    updateSession(data.sessionId, event);
  }
  
  // Update profile computed fields
  const profile = getProfile(data.profileId);
  if (profile) {
    const allEvents = getProfileEvents(data.profileId);
    updateProfile(data.profileId, {}, allEvents);
  }
  
  return event;
}

/**
 * Track multiple events in batch
 */
function trackEventsBatch(eventData) {
  const results = [];
  const errors = [];
  
  for (let i = 0; i < eventData.length; i++) {
    try {
      const event = trackEvent(eventData[i]);
      results.push(event);
    } catch (err) {
      errors.push({
        index: i,
        error: err.message,
        data: eventData[i],
      });
    }
  }
  
  return {
    success: results,
    errors,
    total: eventData.length,
    successful: results.length,
    failed: errors.length,
  };
}

/**
 * Get events by profile ID
 */
function getProfileEvents(profileId) {
  const eventIds = profileEvents.get(profileId) || [];
  return eventIds.map(id => events.get(id)).filter(Boolean);
}

/**
 * Get timeline for a profile (events sorted by timestamp)
 */
function getProfileTimeline(profileId, options = {}) {
  const limit = options.limit || 100;
  const offset = options.offset || 0;
  const eventType = options.eventType;
  const startDate = options.startDate;
  const endDate = options.endDate;
  
  let profileEventsList = getProfileEvents(profileId);
  
  // Filter by event type
  if (eventType) {
    profileEventsList = profileEventsList.filter(e => e.type === eventType);
  }
  
  // Filter by date range
  if (startDate) {
    profileEventsList = profileEventsList.filter(e => 
      new Date(e.timestamp) >= new Date(startDate)
    );
  }
  
  if (endDate) {
    profileEventsList = profileEventsList.filter(e => 
      new Date(e.timestamp) <= new Date(endDate)
    );
  }
  
  // Sort by timestamp descending (most recent first)
  profileEventsList.sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
  
  const total = profileEventsList.length;
  const paginatedEvents = profileEventsList.slice(offset, offset + limit);
  
  return {
    events: paginatedEvents,
    total,
    limit,
    offset,
  };
}

/**
 * Query events with filters
 */
function queryEvents(filters = {}, options = {}) {
  const limit = options.limit || 100;
  const offset = options.offset || 0;
  
  let results = Array.from(events.values());
  
  // Filter by profile
  if (filters.profileId) {
    results = results.filter(e => e.profileId === filters.profileId);
  }
  
  // Filter by type
  if (filters.type) {
    results = results.filter(e => e.type === filters.type);
  }
  
  // Filter by source
  if (filters.source) {
    results = results.filter(e => e.source === filters.source);
  }
  
  // Filter by session
  if (filters.sessionId) {
    results = results.filter(e => e.sessionId === filters.sessionId);
  }
  
  // Filter by date range
  if (filters.startDate) {
    results = results.filter(e => 
      new Date(e.timestamp) >= new Date(filters.startDate)
    );
  }
  
  if (filters.endDate) {
    results = results.filter(e => 
      new Date(e.timestamp) <= new Date(filters.endDate)
    );
  }
  
  // Filter by properties
  if (filters.properties) {
    results = results.filter(e => {
      return Object.keys(filters.properties).every(key => 
        e.properties[key] === filters.properties[key]
      );
    });
  }
  
  // Sort by timestamp descending
  results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  const total = results.length;
  results = results.slice(offset, offset + limit);
  
  return {
    events: results,
    total,
    limit,
    offset,
  };
}

/**
 * Update or create session
 */
function updateSession(sessionId, event) {
  let session = sessions.get(sessionId);
  
  if (!session) {
    session = {
      id: sessionId,
      profileId: event.profileId,
      deviceId: event.deviceId,
      startTime: event.timestamp,
      endTime: event.timestamp,
      eventCount: 0,
      events: [],
      landingPage: event.type === 'page_view' ? event.properties.url : null,
      exitPage: null,
      source: event.source,
      converted: false,
    };
  }
  
  // Update session
  session.endTime = event.timestamp;
  session.eventCount++;
  session.events.push(event.id);
  
  if (event.type === 'page_view') {
    session.exitPage = event.properties.url;
  }
  
  if (event.type === 'purchase') {
    session.converted = true;
    session.revenue = (session.revenue || 0) + (event.properties.revenue || 0);
  }
  
  sessions.set(sessionId, session);
  return session;
}

/**
 * Get session by ID
 */
function getSession(sessionId) {
  return sessions.get(sessionId);
}

/**
 * Get sessions for a profile
 */
function getProfileSessions(profileId) {
  return Array.from(sessions.values())
    .filter(s => s.profileId === profileId)
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
}

/**
 * Calculate funnel conversion rates
 */
function calculateFunnel(steps, filters = {}) {
  // Get all events matching filters
  let funnelEvents = Array.from(events.values());
  
  if (filters.startDate) {
    funnelEvents = funnelEvents.filter(e => 
      new Date(e.timestamp) >= new Date(filters.startDate)
    );
  }
  
  if (filters.endDate) {
    funnelEvents = funnelEvents.filter(e => 
      new Date(e.timestamp) <= new Date(filters.endDate)
    );
  }
  
  // Group events by profile
  const profileEventMap = new Map();
  funnelEvents.forEach(event => {
    if (!profileEventMap.has(event.profileId)) {
      profileEventMap.set(event.profileId, []);
    }
    profileEventMap.get(event.profileId).push(event);
  });
  
  // Calculate conversions through each step
  const results = [];
  let previousCount = profileEventMap.size;
  
  steps.forEach((step, index) => {
    const profilesAtStep = new Set();
    
    for (const [profileId, profileEvs] of profileEventMap.entries()) {
      const hasStep = profileEvs.some(e => {
        if (e.type !== step.type) return false;
        
        // Check properties match if specified
        if (step.properties) {
          return Object.keys(step.properties).every(key => 
            e.properties[key] === step.properties[key]
          );
        }
        
        return true;
      });
      
      if (hasStep) {
        profilesAtStep.add(profileId);
      }
    }
    
    const count = profilesAtStep.size;
    const conversionRate = index === 0 
      ? 100 
      : (count / previousCount) * 100;
    
    results.push({
      step: index + 1,
      name: step.name || step.type,
      type: step.type,
      count,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      dropoff: previousCount - count,
      dropoffRate: parseFloat(((previousCount - count) / previousCount * 100).toFixed(2)),
    });
    
    previousCount = count;
  });
  
  return {
    funnel: results,
    totalProfiles: profileEventMap.size,
    completed: results[results.length - 1]?.count || 0,
    overallConversion: parseFloat(
      ((results[results.length - 1]?.count || 0) / profileEventMap.size * 100).toFixed(2)
    ),
  };
}

/**
 * Get event statistics
 */
function getEventStats(filters = {}) {
  let filteredEvents = Array.from(events.values());
  
  if (filters.startDate) {
    filteredEvents = filteredEvents.filter(e => 
      new Date(e.timestamp) >= new Date(filters.startDate)
    );
  }
  
  if (filters.endDate) {
    filteredEvents = filteredEvents.filter(e => 
      new Date(e.timestamp) <= new Date(filters.endDate)
    );
  }
  
  const byType = {};
  const bySource = {};
  const uniqueProfiles = new Set();
  const uniqueSessions = new Set();
  
  filteredEvents.forEach(event => {
    // Count by type
    byType[event.type] = (byType[event.type] || 0) + 1;
    
    // Count by source
    bySource[event.source] = (bySource[event.source] || 0) + 1;
    
    // Track uniques
    uniqueProfiles.add(event.profileId);
    if (event.sessionId) uniqueSessions.add(event.sessionId);
  });
  
  return {
    totalEvents: filteredEvents.length,
    uniqueProfiles: uniqueProfiles.size,
    uniqueSessions: uniqueSessions.size,
    byType,
    bySource,
    avgEventsPerProfile: parseFloat((filteredEvents.length / uniqueProfiles.size).toFixed(2)),
  };
}

/**
 * Clear all events (for testing)
 */
function clearAllEvents() {
  events.clear();
  profileEvents.clear();
  sessions.clear();
}

module.exports = {
  trackEvent,
  trackEventsBatch,
  getProfileEvents,
  getProfileTimeline,
  queryEvents,
  getSession,
  getProfileSessions,
  calculateFunnel,
  getEventStats,
  clearAllEvents,
};
