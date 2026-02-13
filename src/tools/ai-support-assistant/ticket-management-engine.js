/**
 * AI SUPPORT ASSISTANT - TICKET MANAGEMENT ENGINE
 * Manages support tickets, workflows, SLA tracking, and escalations
 */

const crypto = require('crypto');

// In-memory storage
const tickets = new Map();
const ticketComments = new Map();
const slaConfigs = new Map();
const workflows = new Map();

/**
 * Initialize default SLA configs
 */
function initializeSLAs() {
  const defaultSLAs = [
    { priority: 'urgent', responseTime: 1, resolutionTime: 4 }, // hours
    { priority: 'high', responseTime: 4, resolutionTime: 24 },
    { priority: 'normal', responseTime: 8, resolutionTime: 48 },
    { priority: 'low', responseTime: 24, resolutionTime: 120 },
  ];

  defaultSLAs.forEach(sla => {
    slaConfigs.set(sla.priority, sla);
  });
}

initializeSLAs();

/**
 * Create support ticket
 */
function createTicket({
  subject,
  description,
  userId,
  conversationId,
  priority = 'normal',
  category,
  channel = 'web',
}) {
  const ticket = {
    id: `ticket_${crypto.randomBytes(8).toString('hex')}`,
    ticketNumber: `#${Math.floor(100000 + Math.random() * 900000)}`,
    subject,
    description,
    userId,
    conversationId,
    priority, // low, normal, high, urgent
    category,
    channel,
    status: 'open', // open, in_progress, waiting, resolved, closed
    assignedTo: null,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    firstResponseAt: null,
    resolvedAt: null,
    closedAt: null,
    slaStatus: 'on_track', // on_track, at_risk, breached
    metadata: {},
  };

  tickets.set(ticket.id, ticket);
  calculateSLAStatus(ticket.id);
  
  return ticket;
}

/**
 * Get ticket by ID
 */
function getTicket(ticketId) {
  return tickets.get(ticketId);
}

/**
 * Update ticket
 */
function updateTicket(ticketId, updates) {
  const ticket = tickets.get(ticketId);
  if (!ticket) return null;

  Object.assign(ticket, updates);
  ticket.updatedAt = new Date().toISOString();

  // Track status changes
  if (updates.status === 'resolved' && !ticket.resolvedAt) {
    ticket.resolvedAt = new Date().toISOString();
  }
  if (updates.status === 'closed' && !ticket.closedAt) {
    ticket.closedAt = new Date().toISOString();
  }

  calculateSLAStatus(ticketId);
  return ticket;
}

/**
 * List tickets with filters
 */
function listTickets({ status, priority, assignedTo, userId, limit = 50, offset = 0 } = {}) {
  let filtered = Array.from(tickets.values());

  if (status) filtered = filtered.filter(t => t.status === status);
  if (priority) filtered = filtered.filter(t => t.priority === priority);
  if (assignedTo) filtered = filtered.filter(t => t.assignedTo === assignedTo);
  if (userId) filtered = filtered.filter(t => t.userId === userId);

  filtered.sort((a, b) => {
    // Sort by priority first, then by creation date
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return {
    tickets: filtered.slice(offset, offset + limit),
    total: filtered.length,
  };
}

/**
 * Assign ticket to agent
 */
function assignTicket(ticketId, agentId) {
  const ticket = tickets.get(ticketId);
  if (!ticket) return null;

  ticket.assignedTo = agentId;
  ticket.status = 'in_progress';
  ticket.updatedAt = new Date().toISOString();

  return ticket;
}

/**
 * Add comment to ticket
 */
function addTicketComment(ticketId, { userId, content, internal = false }) {
  const ticket = tickets.get(ticketId);
  if (!ticket) return null;

  const comment = {
    id: `comment_${crypto.randomBytes(8).toString('hex')}`,
    ticketId,
    userId,
    content,
    internal, // internal notes vs customer-visible
    createdAt: new Date().toISOString(),
  };

  const comments = ticketComments.get(ticketId) || [];
  comments.push(comment);
  ticketComments.set(ticketId, comments);

  ticket.updatedAt = new Date().toISOString();
  
  // Track first response
  if (!ticket.firstResponseAt && !internal) {
    ticket.firstResponseAt = new Date().toISOString();
    calculateSLAStatus(ticketId);
  }

  return comment;
}

/**
 * Get ticket comments
 */
function getTicketComments(ticketId, { includeInternal = true } = {}) {
  let comments = ticketComments.get(ticketId) || [];
  
  if (!includeInternal) {
    comments = comments.filter(c => !c.internal);
  }

  return comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

/**
 * Calculate SLA status
 */
function calculateSLAStatus(ticketId) {
  const ticket = tickets.get(ticketId);
  if (!ticket) return null;

  const sla = slaConfigs.get(ticket.priority);
  if (!sla) return ticket;

  const now = Date.now();
  const createdTime = new Date(ticket.createdAt).getTime();
  const hoursElapsed = (now - createdTime) / (1000 * 60 * 60);

  // Check response SLA
  if (!ticket.firstResponseAt) {
    if (hoursElapsed >= sla.responseTime) {
      ticket.slaStatus = 'breached';
    } else if (hoursElapsed >= sla.responseTime * 0.8) {
      ticket.slaStatus = 'at_risk';
    } else {
      ticket.slaStatus = 'on_track';
    }
  }
  // Check resolution SLA
  else if (!ticket.resolvedAt) {
    if (hoursElapsed >= sla.resolutionTime) {
      ticket.slaStatus = 'breached';
    } else if (hoursElapsed >= sla.resolutionTime * 0.8) {
      ticket.slaStatus = 'at_risk';
    } else {
      ticket.slaStatus = 'on_track';
    }
  } else {
    ticket.slaStatus = 'met';
  }

  return ticket;
}

/**
 * Get SLA breached tickets
 */
function getSLABreachedTickets() {
  return Array.from(tickets.values())
    .filter(t => t.slaStatus === 'breached' && !t.resolvedAt)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

/**
 * Get SLA at-risk tickets
 */
function getSLAAtRiskTickets() {
  return Array.from(tickets.values())
    .filter(t => t.slaStatus === 'at_risk' && !t.resolvedAt)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

/**
 * Escalate ticket
 */
function escalateTicket(ticketId, { reason, escalatedTo }) {
  const ticket = tickets.get(ticketId);
  if (!ticket) return null;

  // Increase priority
  const priorityLevels = ['low', 'normal', 'high', 'urgent'];
  const currentIndex = priorityLevels.indexOf(ticket.priority);
  if (currentIndex < priorityLevels.length - 1) {
    ticket.priority = priorityLevels[currentIndex + 1];
  }

  ticket.assignedTo = escalatedTo;
  ticket.metadata.escalation = {
    reason,
    escalatedAt: new Date().toISOString(),
    escalatedTo,
  };

  addTicketComment(ticketId, {
    userId: 'system',
    content: `Ticket escalated to ${ticket.priority} priority. Reason: ${reason}`,
    internal: true,
  });

  return ticket;
}

/**
 * Merge tickets
 */
function mergeTickets(primaryTicketId, secondaryTicketIds) {
  const primaryTicket = tickets.get(primaryTicketId);
  if (!primaryTicket) return null;

  secondaryTicketIds.forEach(ticketId => {
    const ticket = tickets.get(ticketId);
    if (!ticket) return;

    // Add comment to primary ticket
    addTicketComment(primaryTicketId, {
      userId: 'system',
      content: `Merged ticket ${ticket.ticketNumber}: ${ticket.subject}`,
      internal: true,
    });

    // Close secondary ticket
    updateTicket(ticketId, {
      status: 'closed',
      metadata: {
        ...ticket.metadata,
        mergedInto: primaryTicketId,
      },
    });
  });

  return primaryTicket;
}

/**
 * Auto-assign tickets based on rules
 */
function autoAssignTicket(ticketId) {
  const ticket = tickets.get(ticketId);
  if (!ticket) return null;

  // Simple round-robin assignment
  const agents = ['agent_1', 'agent_2', 'agent_3'];
  const assignedAgent = agents[tickets.size % agents.length];

  return assignTicket(ticketId, assignedAgent);
}

/**
 * Get ticket statistics
 */
function getTicketStats() {
  const allTickets = Array.from(tickets.values());
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;

  const openTickets = allTickets.filter(t => ['open', 'in_progress', 'waiting'].includes(t.status));
  const resolvedTickets = allTickets.filter(t => t.resolvedAt);

  // Calculate avg resolution time
  const resolutionTimes = resolvedTickets.map(t => 
    new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()
  );
  const avgResolutionTime = resolutionTimes.length > 0
    ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length / (1000 * 60 * 60)
    : 0;

  return {
    totalTickets: allTickets.length,
    openTickets: openTickets.length,
    inProgressTickets: allTickets.filter(t => t.status === 'in_progress').length,
    resolvedTickets: resolvedTickets.length,
    closedTickets: allTickets.filter(t => t.status === 'closed').length,
    ticketsToday: allTickets.filter(t => 
      now - new Date(t.createdAt).getTime() < dayInMs
    ).length,
    avgResolutionTimeHours: avgResolutionTime.toFixed(2),
    slaBreached: allTickets.filter(t => t.slaStatus === 'breached').length,
    slaAtRisk: allTickets.filter(t => t.slaStatus === 'at_risk').length,
    byPriority: {
      urgent: allTickets.filter(t => t.priority === 'urgent').length,
      high: allTickets.filter(t => t.priority === 'high').length,
      normal: allTickets.filter(t => t.priority === 'normal').length,
      low: allTickets.filter(t => t.priority === 'low').length,
    },
  };
}

/**
 * Get agent workload
 */
function getAgentWorkload(agentId) {
  const agentTickets = Array.from(tickets.values())
    .filter(t => t.assignedTo === agentId);

  return {
    totalAssigned: agentTickets.length,
    open: agentTickets.filter(t => t.status === 'open').length,
    inProgress: agentTickets.filter(t => t.status === 'in_progress').length,
    resolved: agentTickets.filter(t => t.status === 'resolved').length,
  };
}

/**
 * Search tickets
 */
function searchTickets(query) {
  const lowerQuery = query.toLowerCase();
  
  return Array.from(tickets.values())
    .filter(ticket => 
      ticket.subject.toLowerCase().includes(lowerQuery) ||
      ticket.description.toLowerCase().includes(lowerQuery) ||
      ticket.ticketNumber.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Bulk update tickets
 */
function bulkUpdateTickets(ticketIds, updates) {
  return ticketIds.map(ticketId => updateTicket(ticketId, updates)).filter(Boolean);
}

module.exports = {
  createTicket,
  getTicket,
  updateTicket,
  listTickets,
  assignTicket,
  addTicketComment,
  getTicketComments,
  calculateSLAStatus,
  getSLABreachedTickets,
  getSLAAtRiskTickets,
  escalateTicket,
  mergeTickets,
  autoAssignTicket,
  getTicketStats,
  getAgentWorkload,
  searchTickets,
  bulkUpdateTickets,
};
