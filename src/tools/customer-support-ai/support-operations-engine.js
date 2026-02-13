/**
 * Support Operations Engine
 * Handles ticket routing, SLA management, escalation workflows, team assignments
 */

// In-memory storage (replace with database in production)
const tickets = new Map();
const routingRules = new Map();
const slaConfigs = new Map();
const escalations = new Map();
const teamAssignments = new Map();
const workloadStats = new Map();

/**
 * Create support ticket
 */
async function createTicket(ticketData) {
  const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const ticket = {
    id: ticketId,
    subject: ticketData.subject,
    description: ticketData.description,
    customerId: ticketData.customerId,
    channel: ticketData.channel || 'email',
    priority: ticketData.priority || 'medium',
    status: 'open',
    category: ticketData.category,
    tags: ticketData.tags || [],
    assignedTo: null,
    teamId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    firstResponseAt: null,
    resolvedAt: null,
    reopenedCount: 0,
    metadata: ticketData.metadata || {}
  };
  
  tickets.set(ticketId, ticket);
  
  // Auto-route ticket
  const routing = await routeTicket(ticketId);
  
  return { ...ticket, routing };
}

/**
 * Route ticket based on rules
 */
async function routeTicket(ticketId) {
  const ticket = tickets.get(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  
  // Find matching routing rule
  let matchedRule = null;
  for (const [ruleId, rule] of routingRules.entries()) {
    if (!rule.enabled) continue;
    
    let matches = true;
    
    // Check conditions
    if (rule.conditions.priority && rule.conditions.priority !== ticket.priority) {
      matches = false;
    }
    if (rule.conditions.category && rule.conditions.category !== ticket.category) {
      matches = false;
    }
    if (rule.conditions.channel && rule.conditions.channel !== ticket.channel) {
      matches = false;
    }
    if (rule.conditions.tags && rule.conditions.tags.length > 0) {
      const hasTag = rule.conditions.tags.some(tag => ticket.tags.includes(tag));
      if (!hasTag) matches = false;
    }
    
    if (matches) {
      matchedRule = rule;
      break;
    }
  }
  
  if (matchedRule) {
    ticket.assignedTo = matchedRule.assignTo;
    ticket.teamId = matchedRule.teamId;
    ticket.updatedAt = new Date().toISOString();
    tickets.set(ticketId, ticket);
    
    return {
      ruleId: matchedRule.id,
      ruleName: matchedRule.name,
      assignedTo: ticket.assignedTo,
      teamId: ticket.teamId,
      reason: matchedRule.description
    };
  }
  
  // Default routing - round-robin
  return await assignRoundRobin(ticketId);
}

/**
 * Create routing rule
 */
async function createRoutingRule(ruleData) {
  const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const rule = {
    id: ruleId,
    name: ruleData.name,
    description: ruleData.description,
    priority: ruleData.priority || 0,
    conditions: ruleData.conditions || {},
    assignTo: ruleData.assignTo,
    teamId: ruleData.teamId,
    enabled: ruleData.enabled !== false,
    createdAt: new Date().toISOString()
  };
  
  routingRules.set(ruleId, rule);
  return rule;
}

/**
 * Get routing rules
 */
async function getRoutingRules(filters = {}) {
  let rules = Array.from(routingRules.values());
  
  if (filters.enabled !== undefined) {
    rules = rules.filter(r => r.enabled === filters.enabled);
  }
  if (filters.teamId) {
    rules = rules.filter(r => r.teamId === filters.teamId);
  }
  
  return rules.sort((a, b) => b.priority - a.priority);
}

/**
 * Assign ticket round-robin
 */
async function assignRoundRobin(ticketId, teamId = null) {
  const ticket = tickets.get(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  
  // Get available agents
  const assignments = Array.from(teamAssignments.values())
    .filter(a => a.status === 'available')
    .filter(a => !teamId || a.teamId === teamId);
  
  if (assignments.length === 0) {
    return { assigned: false, reason: 'No available agents' };
  }
  
  // Find agent with least workload
  assignments.sort((a, b) => a.currentWorkload - b.currentWorkload);
  const agent = assignments[0];
  
  ticket.assignedTo = agent.agentId;
  ticket.teamId = agent.teamId;
  ticket.updatedAt = new Date().toISOString();
  tickets.set(ticketId, ticket);
  
  // Update agent workload
  agent.currentWorkload++;
  teamAssignments.set(agent.agentId, agent);
  
  return {
    assigned: true,
    assignedTo: agent.agentId,
    teamId: agent.teamId,
    method: 'round-robin'
  };
}

/**
 * Create SLA configuration
 */
async function createSLAConfig(slaData) {
  const slaId = `sla_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const sla = {
    id: slaId,
    name: slaData.name,
    priority: slaData.priority,
    firstResponseTime: slaData.firstResponseTime, // minutes
    resolutionTime: slaData.resolutionTime, // minutes
    businessHours: slaData.businessHours || {
      enabled: false,
      timezone: 'UTC',
      hours: { start: 9, end: 17 },
      days: [1, 2, 3, 4, 5]
    },
    escalationEnabled: slaData.escalationEnabled !== false,
    escalationThreshold: slaData.escalationThreshold || 0.8,
    enabled: slaData.enabled !== false,
    createdAt: new Date().toISOString()
  };
  
  slaConfigs.set(slaId, sla);
  return sla;
}

/**
 * Calculate SLA breach time
 */
async function calculateSLABreach(ticketId) {
  const ticket = tickets.get(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  
  // Find matching SLA
  const sla = Array.from(slaConfigs.values())
    .find(s => s.priority === ticket.priority && s.enabled);
  
  if (!sla) {
    return { hasSLA: false };
  }
  
  const now = new Date();
  const createdAt = new Date(ticket.createdAt);
  const elapsedMinutes = (now - createdAt) / (1000 * 60);
  
  // First response SLA
  const firstResponseBreached = !ticket.firstResponseAt && 
    elapsedMinutes > sla.firstResponseTime;
  const firstResponseTimeRemaining = ticket.firstResponseAt ? 
    0 : Math.max(0, sla.firstResponseTime - elapsedMinutes);
  
  // Resolution SLA
  const resolutionBreached = !ticket.resolvedAt && 
    elapsedMinutes > sla.resolutionTime;
  const resolutionTimeRemaining = ticket.resolvedAt ?
    0 : Math.max(0, sla.resolutionTime - elapsedMinutes);
  
  return {
    hasSLA: true,
    slaId: sla.id,
    slaName: sla.name,
    firstResponse: {
      target: sla.firstResponseTime,
      elapsed: elapsedMinutes,
      remaining: firstResponseTimeRemaining,
      breached: firstResponseBreached,
      percentage: (elapsedMinutes / sla.firstResponseTime) * 100
    },
    resolution: {
      target: sla.resolutionTime,
      elapsed: elapsedMinutes,
      remaining: resolutionTimeRemaining,
      breached: resolutionBreached,
      percentage: (elapsedMinutes / sla.resolutionTime) * 100
    }
  };
}

/**
 * Check for escalations
 */
async function checkEscalations() {
  const needsEscalation = [];
  
  for (const [ticketId, ticket] of tickets.entries()) {
    if (ticket.status === 'closed') continue;
    
    const slaBreach = await calculateSLABreach(ticketId);
    
    if (slaBreach.hasSLA) {
      // Check if approaching breach (80% threshold)
      if (slaBreach.firstResponse.percentage >= 80 || 
          slaBreach.resolution.percentage >= 80) {
        needsEscalation.push({
          ticketId,
          ticket,
          slaBreach,
          reason: slaBreach.firstResponse.breached || slaBreach.resolution.breached ?
            'SLA breached' : 'SLA at risk'
        });
      }
    }
  }
  
  return needsEscalation;
}

/**
 * Create escalation
 */
async function createEscalation(escalationData) {
  const escalationId = `esc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const escalation = {
    id: escalationId,
    ticketId: escalationData.ticketId,
    reason: escalationData.reason,
    escalatedFrom: escalationData.escalatedFrom,
    escalatedTo: escalationData.escalatedTo,
    priority: escalationData.priority || 'high',
    status: 'pending',
    notes: escalationData.notes || '',
    createdAt: new Date().toISOString(),
    resolvedAt: null
  };
  
  escalations.set(escalationId, escalation);
  
  // Update ticket priority if needed
  const ticket = tickets.get(escalationData.ticketId);
  if (ticket && escalation.priority === 'urgent') {
    ticket.priority = 'urgent';
    tickets.set(escalationData.ticketId, ticket);
  }
  
  return escalation;
}

/**
 * Manage team assignments
 */
async function manageTeamAssignment(assignmentData) {
  const assignment = {
    agentId: assignmentData.agentId,
    teamId: assignmentData.teamId,
    skills: assignmentData.skills || [],
    maxWorkload: assignmentData.maxWorkload || 10,
    currentWorkload: 0,
    status: assignmentData.status || 'available',
    shiftStart: assignmentData.shiftStart,
    shiftEnd: assignmentData.shiftEnd,
    updatedAt: new Date().toISOString()
  };
  
  teamAssignments.set(assignmentData.agentId, assignment);
  return assignment;
}

/**
 * Get tickets
 */
async function getTickets(filters = {}) {
  let ticketList = Array.from(tickets.values());
  
  if (filters.status) {
    ticketList = ticketList.filter(t => t.status === filters.status);
  }
  if (filters.priority) {
    ticketList = ticketList.filter(t => t.priority === filters.priority);
  }
  if (filters.assignedTo) {
    ticketList = ticketList.filter(t => t.assignedTo === filters.assignedTo);
  }
  if (filters.teamId) {
    ticketList = ticketList.filter(t => t.teamId === filters.teamId);
  }
  if (filters.customerId) {
    ticketList = ticketList.filter(t => t.customerId === filters.customerId);
  }
  
  return ticketList.sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );
}

/**
 * Update ticket
 */
async function updateTicket(ticketId, updates) {
  const ticket = tickets.get(ticketId);
  if (!ticket) throw new Error('Ticket not found');
  
  Object.assign(ticket, updates, {
    updatedAt: new Date().toISOString()
  });
  
  tickets.set(ticketId, ticket);
  return ticket;
}

/**
 * Get operations statistics
 */
async function getOperationsStatistics() {
  const ticketList = Array.from(tickets.values());
  const now = new Date();
  
  // Ticket status breakdown
  const statusBreakdown = {};
  ticketList.forEach(t => {
    statusBreakdown[t.status] = (statusBreakdown[t.status] || 0) + 1;
  });
  
  // Priority breakdown
  const priorityBreakdown = {};
  ticketList.forEach(t => {
    priorityBreakdown[t.priority] = (priorityBreakdown[t.priority] || 0) + 1;
  });
  
  // Channel breakdown
  const channelBreakdown = {};
  ticketList.forEach(t => {
    channelBreakdown[t.channel] = (channelBreakdown[t.channel] || 0) + 1;
  });
  
  // SLA compliance
  let slaCompliant = 0;
  let slaBreached = 0;
  for (const ticket of ticketList) {
    const slaBreach = await calculateSLABreach(ticket.id);
    if (slaBreach.hasSLA) {
      if (slaBreach.firstResponse.breached || slaBreach.resolution.breached) {
        slaBreached++;
      } else {
        slaCompliant++;
      }
    }
  }
  
  // Average response time
  const respondedTickets = ticketList.filter(t => t.firstResponseAt);
  const avgFirstResponse = respondedTickets.length > 0 ?
    respondedTickets.reduce((sum, t) => {
      const diff = new Date(t.firstResponseAt) - new Date(t.createdAt);
      return sum + diff / (1000 * 60);
    }, 0) / respondedTickets.length : 0;
  
  // Average resolution time
  const resolvedTickets = ticketList.filter(t => t.resolvedAt);
  const avgResolution = resolvedTickets.length > 0 ?
    resolvedTickets.reduce((sum, t) => {
      const diff = new Date(t.resolvedAt) - new Date(t.createdAt);
      return sum + diff / (1000 * 60);
    }, 0) / resolvedTickets.length : 0;
  
  return {
    totalTickets: ticketList.length,
    statusBreakdown,
    priorityBreakdown,
    channelBreakdown,
    sla: {
      compliant: slaCompliant,
      breached: slaBreached,
      complianceRate: slaCompliant + slaBreached > 0 ?
        (slaCompliant / (slaCompliant + slaBreached)) * 100 : 0
    },
    averageFirstResponseTime: Math.round(avgFirstResponse),
    averageResolutionTime: Math.round(avgResolution),
    totalRoutingRules: routingRules.size,
    totalSLAConfigs: slaConfigs.size,
    activeEscalations: Array.from(escalations.values())
      .filter(e => e.status === 'pending').length,
    activeAgents: Array.from(teamAssignments.values())
      .filter(a => a.status === 'available').length
  };
}

module.exports = {
  createTicket,
  routeTicket,
  createRoutingRule,
  getRoutingRules,
  assignRoundRobin,
  createSLAConfig,
  calculateSLABreach,
  checkEscalations,
  createEscalation,
  manageTeamAssignment,
  getTickets,
  updateTicket,
  getOperationsStatistics
};
