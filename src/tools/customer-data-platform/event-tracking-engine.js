/**
 * EVENT TRACKING ENGINE
 * Behavioral events, session tracking, custom events, event schemas,
 * real-time stream processing, and event analytics
 */

// In-memory stores
const events = new Map();
const sessions = new Map();
const eventSchemas = new Map();
const eventStream = [];
const aggregations = new Map();

let eventCounter = 0;

// ================================================================
// EVENT TRACKING
// ================================================================

function trackEvent({ profileId, event, properties = {}, timestamp, sessionId, context = {} }) {
  const id = `evt_${Date.now()}_${++eventCounter}`;
  
  const evt = {
    id,
    profileId,
    event,
    properties,
    timestamp: timestamp || new Date().toISOString(),
    sessionId,
    context: {
      ...context,
      ip: context.ip || '127.0.0.1',
      userAgent: context.userAgent || 'unknown',
      device: context.device || 'desktop',
      os: context.os || 'unknown',
      browser: context.browser || 'unknown',
      referrer: context.referrer || null,
      utm: context.utm || {}
    },
    metadata: {},
    receivedAt: new Date().toISOString()
  };
  
  events.set(id, evt);
  eventStream.push(evt);
  
  // Trim stream to last 10000 events
  if (eventStream.length > 10000) {
    eventStream.shift();
  }
  
  // Update session if provided
  if (sessionId) {
    updateSession(sessionId, evt);
  }
  
  // Validate against schema if exists
  const schema = eventSchemas.get(event);
  if (schema) {
    validateEventSchema(evt, schema);
  }
  
  return evt;
}

function getEvent(id) {
  return events.get(id) || null;
}

function listEvents({ profileId, event, sessionId, limit = 100, offset = 0 }) {
  let results = Array.from(events.values());
  
  if (profileId) {
    results = results.filter(e => e.profileId === profileId);
  }
  
  if (event) {
    results = results.filter(e => e.event === event);
  }
  
  if (sessionId) {
    results = results.filter(e => e.sessionId === sessionId);
  }
  
  // Sort by timestamp desc
  results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return {
    events: results.slice(offset, offset + limit),
    total: results.length,
    offset,
    limit
  };
}

function queryEvents(query) {
  const {
    profileId,
    events: eventNames,
    dateFrom,
    dateTo,
    properties,
    limit = 1000
  } = query;
  
  let results = Array.from(events.values());
  
  // Filter by profile
  if (profileId) {
    results = results.filter(e => e.profileId === profileId);
  }
  
  // Filter by event names
  if (eventNames && eventNames.length > 0) {
    results = results.filter(e => eventNames.includes(e.event));
  }
  
  // Filter by date range
  if (dateFrom) {
    results = results.filter(e => new Date(e.timestamp) >= new Date(dateFrom));
  }
  
  if (dateTo) {
    results = results.filter(e => new Date(e.timestamp) <= new Date(dateTo));
  }
  
  // Filter by properties
  if (properties) {
    Object.keys(properties).forEach(key => {
      results = results.filter(e => e.properties[key] === properties[key]);
    });
  }
  
  return results
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

function deleteEvent(id) {
  return events.delete(id);
}

// ================================================================
// SESSION TRACKING
// ================================================================

function createSession({ profileId, deviceId, context = {} }) {
  const id = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const session = {
    id,
    profileId,
    deviceId,
    startedAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    endedAt: null,
    duration: 0,
    events: [],
    eventCount: 0,
    pageViews: 0,
    context,
    status: 'active'
  };
  
  sessions.set(id, session);
  return session;
}

function getSession(id) {
  return sessions.get(id) || null;
}

function updateSession(sessionId, event) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  
  session.lastActivityAt = event.timestamp;
  session.events.push(event.id);
  session.eventCount += 1;
  
  if (event.event === 'page_view') {
    session.pageViews += 1;
  }
  
  // Calculate duration
  const started = new Date(session.startedAt);
  const lastActivity = new Date(session.lastActivityAt);
  session.duration = Math.floor((lastActivity - started) / 1000); // seconds
  
  sessions.set(sessionId, session);
  return session;
}

function endSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  
  session.endedAt = new Date().toISOString();
  session.status = 'ended';
  
  sessions.set(sessionId, session);
  return session;
}

function listSessions({ profileId, status, limit = 100 }) {
  let results = Array.from(sessions.values());
  
  if (profileId) {
    results = results.filter(s => s.profileId === profileId);
  }
  
  if (status) {
    results = results.filter(s => s.status === status);
  }
  
  return results
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
    .slice(0, limit);
}

function getSessionMetrics(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return null;
  
  // Get all events for this session
  const sessionEvents = Array.from(events.values())
    .filter(e => e.sessionId === sessionId)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  const eventTypes = {};
  sessionEvents.forEach(e => {
    eventTypes[e.event] = (eventTypes[e.event] || 0) + 1;
  });
  
  const pages = sessionEvents
    .filter(e => e.event === 'page_view')
    .map(e => e.properties.url || e.properties.path);
  
  return {
    sessionId,
    duration: session.duration,
    eventCount: session.eventCount,
    pageViews: session.pageViews,
    eventTypes,
    pages,
    entryPage: pages[0] || null,
    exitPage: pages[pages.length - 1] || null,
    bounced: session.pageViews <= 1
  };
}

// ================================================================
// EVENT SCHEMAS
// ================================================================

function createEventSchema({ event, properties, required = [] }) {
  const schema = {
    event,
    properties,
    required,
    createdAt: new Date().toISOString()
  };
  
  eventSchemas.set(event, schema);
  return schema;
}

function getEventSchema(event) {
  return eventSchemas.get(event) || null;
}

function listEventSchemas() {
  return Array.from(eventSchemas.values());
}

function validateEventSchema(evt, schema) {
  const errors = [];
  
  // Check required properties
  schema.required.forEach(prop => {
    if (!(prop in evt.properties)) {
      errors.push(`Missing required property: ${prop}`);
    }
  });
  
  // Check property types
  Object.keys(schema.properties).forEach(prop => {
    if (prop in evt.properties) {
      const expectedType = schema.properties[prop];
      const actualType = typeof evt.properties[prop];
      
      if (expectedType !== actualType) {
        errors.push(`Property ${prop} should be ${expectedType}, got ${actualType}`);
      }
    }
  });
  
  if (errors.length > 0) {
    evt.metadata.schemaErrors = errors;
  }
  
  return errors.length === 0;
}

function deleteEventSchema(event) {
  return eventSchemas.delete(event);
}

// ================================================================
// EVENT STREAM PROCESSING
// ================================================================

function getEventStream({ since, limit = 100 }) {
  let stream = [...eventStream];
  
  if (since) {
    const sinceDate = new Date(since);
    stream = stream.filter(e => new Date(e.timestamp) > sinceDate);
  }
  
  return stream.slice(-limit);
}

function subscribeToEvents(callback, filter = {}) {
  const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // In production, this would use WebSockets or Server-Sent Events
  // For now, return a mock subscription
  return {
    id: subscriptionId,
    filter,
    status: 'active',
    createdAt: new Date().toISOString()
  };
}

function publishEvent(event) {
  // Publish to all subscribers (mock)
  // In production, this would broadcast to WebSocket clients or message queue
  return {
    published: true,
    eventId: event.id,
    timestamp: new Date().toISOString()
  };
}

// ================================================================
// EVENT ANALYTICS
// ================================================================

function getEventCounts({ dateFrom, dateTo, event, groupBy = 'day' }) {
  let eventList = Array.from(events.values());
  
  // Filter by date range
  if (dateFrom) {
    eventList = eventList.filter(e => new Date(e.timestamp) >= new Date(dateFrom));
  }
  
  if (dateTo) {
    eventList = eventList.filter(e => new Date(e.timestamp) <= new Date(dateTo));
  }
  
  // Filter by event name
  if (event) {
    eventList = eventList.filter(e => e.event === event);
  }
  
  // Group by time period
  const counts = {};
  
  eventList.forEach(e => {
    const timestamp = new Date(e.timestamp);
    let key;
    
    if (groupBy === 'hour') {
      key = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')} ${String(timestamp.getHours()).padStart(2, '0')}:00`;
    } else if (groupBy === 'day') {
      key = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')}`;
    } else if (groupBy === 'week') {
      const weekNum = Math.floor(timestamp.getDate() / 7);
      key = `${timestamp.getFullYear()}-W${weekNum}`;
    } else if (groupBy === 'month') {
      key = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}`;
    }
    
    counts[key] = (counts[key] || 0) + 1;
  });
  
  return Object.entries(counts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getTopEvents({ limit = 10, dateFrom, dateTo }) {
  let eventList = Array.from(events.values());
  
  if (dateFrom) {
    eventList = eventList.filter(e => new Date(e.timestamp) >= new Date(dateFrom));
  }
  
  if (dateTo) {
    eventList = eventList.filter(e => new Date(e.timestamp) <= new Date(dateTo));
  }
  
  const counts = {};
  eventList.forEach(e => {
    counts[e.event] = (counts[e.event] || 0) + 1;
  });
  
  return Object.entries(counts)
    .map(([event, count]) => ({ event, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getEventFunnel(steps) {
  // Track dropoff through funnel
  const profiles = new Set();
  const funnelData = [];
  
  steps.forEach((step, index) => {
    const stepEvents = Array.from(events.values()).filter(e => e.event === step);
    
    if (index === 0) {
      stepEvents.forEach(e => profiles.add(e.profileId));
      funnelData.push({
        step,
        index,
        users: profiles.size,
        conversionRate: 100,
        dropoff: 0
      });
    } else {
      const prevStepProfiles = new Set(profiles);
      profiles.clear();
      
      stepEvents.forEach(e => {
        if (prevStepProfiles.has(e.profileId)) {
          profiles.add(e.profileId);
        }
      });
      
      const initialUsers = funnelData[0].users;
      const conversionRate = initialUsers > 0 ? (profiles.size / initialUsers) * 100 : 0;
      const dropoff = 100 - conversionRate;
      
      funnelData.push({
        step,
        index,
        users: profiles.size,
        conversionRate,
        dropoff
      });
    }
  });
  
  return funnelData;
}

function getEventPropertyDistribution(event, property) {
  const eventList = Array.from(events.values())
    .filter(e => e.event === event && property in e.properties);
  
  const distribution = {};
  
  eventList.forEach(e => {
    const value = e.properties[property];
    distribution[value] = (distribution[value] || 0) + 1;
  });
  
  return Object.entries(distribution)
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

// ================================================================
// REAL-TIME AGGREGATIONS
// ================================================================

function createAggregation({ name, event, metric, groupBy, window = '1h' }) {
  const id = `agg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const aggregation = {
    id,
    name,
    event,
    metric, // 'count', 'sum', 'avg', 'min', 'max'
    groupBy, // property to group by
    window,
    data: {},
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  
  aggregations.set(id, aggregation);
  return aggregation;
}

function updateAggregation(aggId, evt) {
  const agg = aggregations.get(aggId);
  if (!agg || evt.event !== agg.event) return;
  
  const groupValue = agg.groupBy ? evt.properties[agg.groupBy] : 'all';
  
  if (!agg.data[groupValue]) {
    agg.data[groupValue] = { count: 0, sum: 0, values: [] };
  }
  
  const group = agg.data[groupValue];
  group.count += 1;
  
  if (agg.metric === 'sum' || agg.metric === 'avg') {
    const value = evt.properties.value || 0;
    group.sum += value;
    group.values.push(value);
  }
  
  agg.lastUpdated = new Date().toISOString();
  aggregations.set(aggId, agg);
}

function getAggregationResults(aggId) {
  const agg = aggregations.get(aggId);
  if (!agg) return null;
  
  const results = {};
  
  Object.keys(agg.data).forEach(groupValue => {
    const group = agg.data[groupValue];
    
    let result;
    switch (agg.metric) {
      case 'count':
        result = group.count;
        break;
      case 'sum':
        result = group.sum;
        break;
      case 'avg':
        result = group.values.length > 0 ? group.sum / group.values.length : 0;
        break;
      case 'min':
        result = group.values.length > 0 ? Math.min(...group.values) : 0;
        break;
      case 'max':
        result = group.values.length > 0 ? Math.max(...group.values) : 0;
        break;
      default:
        result = group.count;
    }
    
    results[groupValue] = result;
  });
  
  return {
    aggregationId: aggId,
    name: agg.name,
    metric: agg.metric,
    results,
    lastUpdated: agg.lastUpdated
  };
}

function listAggregations() {
  return Array.from(aggregations.values());
}

function deleteAggregation(id) {
  return aggregations.delete(id);
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Event Tracking
  trackEvent,
  getEvent,
  listEvents,
  queryEvents,
  deleteEvent,
  
  // Session Tracking
  createSession,
  getSession,
  updateSession,
  endSession,
  listSessions,
  getSessionMetrics,
  
  // Event Schemas
  createEventSchema,
  getEventSchema,
  listEventSchemas,
  validateEventSchema,
  deleteEventSchema,
  
  // Stream Processing
  getEventStream,
  subscribeToEvents,
  publishEvent,
  
  // Analytics
  getEventCounts,
  getTopEvents,
  getEventFunnel,
  getEventPropertyDistribution,
  
  // Aggregations
  createAggregation,
  updateAggregation,
  getAggregationResults,
  listAggregations,
  deleteAggregation,
  
  // Data stores
  events,
  sessions,
  eventSchemas,
  eventStream,
  aggregations
};
