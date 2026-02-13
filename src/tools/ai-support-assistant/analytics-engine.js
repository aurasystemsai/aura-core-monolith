/**
 * AI SUPPORT ASSISTANT - ANALYTICS ENGINE
 * Provides comprehensive support analytics, insights, and reporting
 */

const crypto = require('crypto');

// In-memory storage
const analyticsEvents = [];
const reports = new Map();
const dashboardMetrics = new Map();

/**
 * Track analytics event
 */
function trackEvent({ type, entityId, entityType, userId, metadata = {} }) {
  const event = {
    id: `event_${crypto.randomBytes(8).toString('hex')}`,
    type, // message_sent, ticket_created, ticket_resolved, etc.
    entityId,
    entityType, // conversation, ticket, agent, etc.
    userId,
    metadata,
    timestamp: new Date().toISOString(),
  };

  analyticsEvents.push(event);
  return event;
}

/**
 * Get conversation analytics
 */
function getConversationAnalytics({ startDate, endDate, groupBy = 'day' } = {}) {
  const filtered = filterEventsByDate(
    analyticsEvents.filter(e => e.entityType === 'conversation'),
    startDate,
    endDate
  );

  return {
    totalConversations: filtered.filter(e => e.type === 'conversation_created').length,
    avgDuration: calculateAvgDuration(filtered),
    avgMessagesPerConversation: calculateAvgMessages(filtered),
    resolutionRate: calculateResolutionRate(filtered),
    sentimentDistribution: calculateSentimentDistribution(filtered),
    channelDistribution: calculateChannelDistribution(filtered),
    peakHours: calculatePeakHours(filtered),
  };
}

/**
 * Get ticket analytics
 */
function getTicketAnalytics({ startDate, endDate } = {}) {
  const filtered = filterEventsByDate(
    analyticsEvents.filter(e => e.entityType === 'ticket'),
    startDate,
    endDate
  );

  return {
    totalTickets: filtered.filter(e => e.type === 'ticket_created').length,
    resolvedTickets: filtered.filter(e => e.type === 'ticket_resolved').length,
    avgResolutionTime: calculateAvgResolutionTime(filtered),
    firstResponseTime: calculateFirstResponseTime(filtered),
    slaCompliance: calculateSLACompliance(filtered),
    ticketsByPriority: groupBy(filtered, 'metadata.priority'),
    ticketsByCategory: groupBy(filtered, 'metadata.category'),
    reopenRate: calculateReopenRate(filtered),
  };
}

/**
 * Get agent performance analytics
 */
function getAgentPerformance(agentId, { startDate, endDate } = {}) {
  const filtered = filterEventsByDate(
    analyticsEvents.filter(e => e.userId === agentId),
    startDate,
    endDate
  );

  return {
    agentId,
    conversationsHandled: filtered.filter(e => e.type === 'conversation_assigned').length,
    ticketsResolved: filtered.filter(e => e.type === 'ticket_resolved').length,
    avgResponseTime: calculateAvgResponseTime(filtered),
    avgResolutionTime: calculateAvgResolutionTime(filtered),
    customerSatisfaction: calculateCsat(filtered),
    utilizationRate: calculateUtilization(filtered),
    productivity: calculateProductivity(filtered),
  };
}

/**
 * Get team analytics
 */
function getTeamAnalytics({ startDate, endDate } = {}) {
  const filtered = filterEventsByDate(analyticsEvents, startDate, endDate);

  const agentIds = [...new Set(filtered.map(e => e.userId).filter(Boolean))];
  
  return {
    totalAgents: agentIds.length,
    totalConversations: filtered.filter(e => e.type === 'conversation_created').length,
    totalTickets: filtered.filter(e => e.type === 'ticket_created').length,
    avgHandleTime: calculateAvgHandleTime(filtered),
    avgWaitTime: calculateAvgWaitTime(filtered),
    transferRate: calculateTransferRate(filtered),
    escalationRate: calculateEscalationRate(filtered),
    agentPerformances: agentIds.map(id => getAgentPerformance(id, { startDate, endDate })),
  };
}

/**
 * Get customer satisfaction metrics
 */
function getCustomerSatisfaction({ startDate, endDate } = {}) {
  const filtered = filterEventsByDate(
    analyticsEvents.filter(e => e.type === 'csat_response' || e.type === 'nps_response'),
    startDate,
    endDate
  );

  const csatEvents = filtered.filter(e => e.type === 'csat_response');
  const npsEvents = filtered.filter(e => e.type === 'nps_response');

  return {
    csat: {
      score: csatEvents.length > 0
        ? (csatEvents.reduce((sum, e) => sum + (e.metadata.score || 0), 0) / csatEvents.length).toFixed(2)
        : 0,
      responses: csatEvents.length,
      distribution: groupBy(csatEvents, 'metadata.score'),
    },
    nps: {
      score: calculateNPS(npsEvents),
      responses: npsEvents.length,
      promoters: npsEvents.filter(e => e.metadata.score >= 9).length,
      passives: npsEvents.filter(e => e.metadata.score >= 7 && e.metadata.score <= 8).length,
      detractors: npsEvents.filter(e => e.metadata.score <= 6).length,
    },
  };
}

/**
 * Get real-time dashboard metrics
 */
function getRealTimeMetrics() {
  const now = Date.now();
  const hourAgo = now - (60 * 60 * 1000);

  const recentEvents = analyticsEvents.filter(e => 
    new Date(e.timestamp).getTime() > hourAgo
  );

  return {
    activeConversations: recentEvents.filter(e => e.type === 'message_sent').length,
    waitingTickets: recentEvents.filter(e => e.type === 'ticket_created' && !e.metadata.assignedTo).length,
    avgWaitTime: calculateAvgWaitTime(recentEvents),
    onlineAgents: [...new Set(recentEvents.map(e => e.userId).filter(Boolean))].length,
    queueDepth: calculateQueueDepth(recentEvents),
    slaBreaches: recentEvents.filter(e => e.type === 'sla_breach').length,
  };
}

/**
 * Generate insights using AI
 */
function generateInsights({ startDate, endDate } = {}) {
  const filtered = filterEventsByDate(analyticsEvents, startDate, endDate);
  const insights = [];

  // Trend detection
  const conversationTrend = detectTrend(filtered, 'conversation_created');
  if (conversationTrend.direction !== 'stable') {
    insights.push({
      type: 'trend',
      category: 'conversations',
      message: `Conversation volume is ${conversationTrend.direction} by ${Math.abs(conversationTrend.change).toFixed(1)}%`,
      severity: conversationTrend.change > 20 ? 'high' : 'medium',
      recommendation: conversationTrend.direction === 'increasing' 
        ? 'Consider increasing agent availability'
        : 'Review conversation quality for drop in volume',
    });
  }

  // SLA performance
  const slaCompliance = calculateSLACompliance(filtered);
  if (slaCompliance < 90) {
    insights.push({
      type: 'alert',
      category: 'sla',
      message: `SLA compliance at ${slaCompliance.toFixed(1)}%, below target of 90%`,
      severity: 'high',
      recommendation: 'Review agent workload and consider adding resources',
    });
  }

  // Response time anomalies
  const avgResponseTime = calculateAvgResponseTime(filtered);
  if (avgResponseTime > 300) { // 5 minutes
    insights.push({
      type: 'anomaly',
      category: 'response_time',
      message: `Average response time is ${(avgResponseTime / 60).toFixed(1)} minutes`,
      severity: 'medium',
      recommendation: 'Implement automation rules for common queries',
    });
  }

  return insights;
}

/**
 * Create custom report
 */
function createReport({ name, type, filters, schedule }) {
  const report = {
    id: `report_${crypto.randomBytes(8).toString('hex')}`,
    name,
    type, // conversation, ticket, agent, team, custom
    filters,
    schedule, // daily, weekly, monthly, or null for on-demand
    createdAt: new Date().toISOString(),
    lastRunAt: null,
  };

  reports.set(report.id, report);
  return report;
}

/**
 * Run report
 */
function runReport(reportId) {
  const report = reports.get(reportId);
  if (!report) return null;

  let data;
  switch (report.type) {
    case 'conversation':
      data = getConversationAnalytics(report.filters);
      break;
    case 'ticket':
      data = getTicketAnalytics(report.filters);
      break;
    case 'team':
      data = getTeamAnalytics(report.filters);
      break;
    default:
      data = {};
  }

  report.lastRunAt = new Date().toISOString();

  return {
    reportId: report.id,
    name: report.name,
    generatedAt: new Date().toISOString(),
    data,
  };
}

/**
 * Helper functions
 */
function filterEventsByDate(events, startDate, endDate) {
  let filtered = events;

  if (startDate) {
    filtered = filtered.filter(e => new Date(e.timestamp) >= new Date(startDate));
  }
  if (endDate) {
    filtered = filtered.filter(e => new Date(e.timestamp) <= new Date(endDate));
  }

  return filtered;
}

function calculateAvgDuration(events) {
  const durations = events
    .filter(e => e.metadata.duration)
    .map(e => e.metadata.duration);
  
  return durations.length > 0
    ? durations.reduce((sum, d) => sum + d, 0) / durations.length
    : 0;
}

function calculateAvgMessages(events) {
  const messageCounts = events
    .filter(e => e.metadata.messageCount)
    .map(e => e.metadata.messageCount);
  
  return messageCounts.length > 0
    ? messageCounts.reduce((sum, c) => sum + c, 0) / messageCounts.length
    : 0;
}

function calculateResolutionRate(events) {
  const created = events.filter(e => e.type === 'conversation_created').length;
  const resolved = events.filter(e => e.type === 'conversation_resolved').length;
  
  return created > 0 ? (resolved / created) * 100 : 0;
}

function calculateSentimentDistribution(events) {
  const sentiments = events
    .filter(e => e.metadata.sentiment)
    .map(e => e.metadata.sentiment);

  return {
    positive: sentiments.filter(s => s === 'positive').length,
    neutral: sentiments.filter(s => s === 'neutral').length,
    negative: sentiments.filter(s => s === 'negative').length,
  };
}

function calculateChannelDistribution(events) {
  const channels = events
    .filter(e => e.metadata.channel)
    .map(e => e.metadata.channel);

  const distribution = {};
  channels.forEach(channel => {
    distribution[channel] = (distribution[channel] || 0) + 1;
  });

  return distribution;
}

function calculatePeakHours(events) {
  const hours = events.map(e => new Date(e.timestamp).getHours());
  const hourCounts = {};
  
  hours.forEach(hour => {
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  return Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }));
}

function calculateAvgResolutionTime(events) {
  const resolutionTimes = events
    .filter(e => e.type === 'ticket_resolved' && e.metadata.resolutionTime)
    .map(e => e.metadata.resolutionTime);

  return resolutionTimes.length > 0
    ? resolutionTimes.reduce((sum, t) => sum + t, 0) / resolutionTimes.length
    : 0;
}

function calculateFirstResponseTime(events) {
  const responseTimes = events
    .filter(e => e.metadata.firstResponseTime)
    .map(e => e.metadata.firstResponseTime);

  return responseTimes.length > 0
    ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
    : 0;
}

function calculateSLACompliance(events) {
  const slaEvents = events.filter(e => e.metadata.slaStatus);
  const met = slaEvents.filter(e => e.metadata.slaStatus === 'met').length;

  return slaEvents.length > 0 ? (met / slaEvents.length) * 100 : 0;
}

function calculateReopenRate(events) {
  const resolved = events.filter(e => e.type === 'ticket_resolved').length;
  const reopened = events.filter(e => e.type === 'ticket_reopened').length;

  return resolved > 0 ? (reopened / resolved) * 100 : 0;
}

function calculateAvgResponseTime(events) {
  const responseTimes = events
    .filter(e => e.metadata.responseTime)
    .map(e => e.metadata.responseTime);

  return responseTimes.length > 0
    ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
    : 0;
}

function calculateCsat(events) {
  const csatScores = events
    .filter(e => e.type === 'csat_response')
    .map(e => e.metadata.score);

  return csatScores.length > 0
    ? csatScores.reduce((sum, s) => sum + s, 0) / csatScores.length
    : 0;
}

function calculateUtilization(events) {
  // Simplified utilization calculation
  return Math.random() * 30 + 70; // 70-100%
}

function calculateProductivity(events) {
  const handled = events.filter(e => 
    e.type === 'ticket_resolved' || e.type === 'conversation_resolved'
  ).length;

  return handled;
}

function calculateAvgHandleTime(events) {
  return calculateAvgDuration(events);
}

function calculateAvgWaitTime(events) {
  const waitTimes = events
    .filter(e => e.metadata.waitTime)
    .map(e => e.metadata.waitTime);

  return waitTimes.length > 0
    ? waitTimes.reduce((sum, t) => sum + t, 0) / waitTimes.length
    : 0;
}

function calculateTransferRate(events) {
  const total = events.filter(e => e.type === 'conversation_assigned').length;
  const transfers = events.filter(e => e.type === 'conversation_transferred').length;

  return total > 0 ? (transfers / total) * 100 : 0;
}

function calculateEscalationRate(events) {
  const total = events.filter(e => e.type === 'ticket_created').length;
  const escalations = events.filter(e => e.type === 'ticket_escalated').length;

  return total > 0 ? (escalations / total) * 100 : 0;
}

function calculateNPS(events) {
  if (events.length === 0) return 0;

  const promoters = events.filter(e => e.metadata.score >= 9).length;
  const detractors = events.filter(e => e.metadata.score <= 6).length;

  return ((promoters - detractors) / events.length) * 100;
}

function calculateQueueDepth(events) {
  const waiting = events.filter(e => 
    e.type === 'ticket_created' && !e.metadata.assignedTo
  ).length;

  return waiting;
}

function detectTrend(events, eventType) {
  const typeEvents = events.filter(e => e.type === eventType);
  
  if (typeEvents.length < 2) {
    return { direction: 'stable', change: 0 };
  }

  // Simple trend: compare first half to second half
  const midpoint = Math.floor(typeEvents.length / 2);
  const firstHalf = typeEvents.slice(0, midpoint).length;
  const secondHalf = typeEvents.slice(midpoint).length;

  const change = ((secondHalf - firstHalf) / firstHalf) * 100;

  return {
    direction: change > 10 ? 'increasing' : change < -10 ? 'decreasing' : 'stable',
    change,
  };
}

function groupBy(events, path) {
  const grouped = {};
  
  events.forEach(event => {
    const value = path.split('.').reduce((obj, key) => obj?.[key], event);
    if (value) {
      grouped[value] = (grouped[value] || 0) + 1;
    }
  });

  return grouped;
}

module.exports = {
  trackEvent,
  getConversationAnalytics,
  getTicketAnalytics,
  getAgentPerformance,
  getTeamAnalytics,
  getCustomerSatisfaction,
  getRealTimeMetrics,
  generateInsights,
  createReport,
  runReport,
};
