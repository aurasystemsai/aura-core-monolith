/**
 * AI SUPPORT ASSISTANT - AUTOMATION ENGINE
 * Manages automated workflows, triggers, and intelligent routing
 */

const crypto = require('crypto');

// In-memory storage
const automations = new Map();
const triggers = new Map();
const automationRuns = new Map();
const routingRules = new Map();

/**
 * Create automation workflow
 */
function createAutomation({ name, description, trigger, actions, conditions = [], enabled = true }) {
  const automation = {
    id: `auto_${crypto.randomBytes(8).toString('hex')}`,
    name,
    description,
    trigger, // event type: message_received, ticket_created, sla_breach, etc.
    conditions, // array of {field, operator, value}
    actions, // array of {type, params}
    enabled,
    runCount: 0,
    successCount: 0,
    failureCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  automations.set(automation.id, automation);
  return automation;
}

/**
 * Get automation by ID
 */
function getAutomation(automationId) {
  return automations.get(automationId);
}

/**
 * Update automation
 */
function updateAutomation(automationId, updates) {
  const automation = automations.get(automationId);
  if (!automation) return null;

  Object.assign(automation, updates);
  automation.updatedAt = new Date().toISOString();
  return automation;
}

/**
 * List automations
 */
function listAutomations({ trigger, enabled } = {}) {
  let filtered = Array.from(automations.values());

  if (trigger) filtered = filtered.filter(a => a.trigger === trigger);
  if (enabled !== undefined) filtered = filtered.filter(a => a.enabled === enabled);

  return filtered;
}

/**
 * Delete automation
 */
function deleteAutomation(automationId) {
  return automations.delete(automationId);
}

/**
 * Execute automation
 */
async function executeAutomation(automationId, context) {
  const automation = automations.get(automationId);
  if (!automation || !automation.enabled) return null;

  const run = {
    id: `run_${crypto.randomBytes(8).toString('hex')}`,
    automationId,
    context,
    status: 'running',
    startedAt: new Date().toISOString(),
    completedAt: null,
    results: [],
    errors: [],
  };

  automation.runCount++;

  try {
    // Check conditions
    if (!evaluateConditions(automation.conditions, context)) {
      run.status = 'skipped';
      run.completedAt = new Date().toISOString();
      automationRuns.set(run.id, run);
      return run;
    }

    // Execute actions
    for (const action of automation.actions) {
      const result = await executeAction(action, context);
      run.results.push(result);
    }

    run.status = 'completed';
    automation.successCount++;
  } catch (error) {
    run.status = 'failed';
    run.errors.push(error.message);
    automation.failureCount++;
  }

  run.completedAt = new Date().toISOString();
  automationRuns.set(run.id, run);

  return run;
}

/**
 * Evaluate conditions
 */
function evaluateConditions(conditions, context) {
  if (!conditions || conditions.length === 0) return true;

  return conditions.every(condition => {
    const value = context[condition.field];
    
    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'contains':
        return String(value).includes(condition.value);
      case 'greater_than':
        return value > condition.value;
      case 'less_than':
        return value < condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      default:
        return true;
    }
  });
}

/**
 * Execute action
 */
async function executeAction(action, context) {
  const result = {
    type: action.type,
    status: 'success',
    output: null,
    error: null,
  };

  try {
    switch (action.type) {
      case 'send_email':
        result.output = await sendEmail(action.params, context);
        break;
      case 'create_ticket':
        result.output = await createTicket(action.params, context);
        break;
      case 'assign_agent':
        result.output = await assignAgent(action.params, context);
        break;
      case 'add_tag':
        result.output = await addTag(action.params, context);
        break;
      case 'send_notification':
        result.output = await sendNotification(action.params, context);
        break;
      case 'update_priority':
        result.output = await updatePriority(action.params, context);
        break;
      case 'ai_response':
        result.output = await generateAIResponse(action.params, context);
        break;
      default:
        result.status = 'unsupported';
    }
  } catch (error) {
    result.status = 'error';
    result.error = error.message;
  }

  return result;
}

/**
 * Action implementations (simulated)
 */
async function sendEmail(params, context) {
  return {
    to: params.to || context.userEmail,
    subject: params.subject,
    body: params.body,
    sent: true,
    sentAt: new Date().toISOString(),
  };
}

async function createTicket(params, context) {
  return {
    ticketId: `ticket_${crypto.randomBytes(4).toString('hex')}`,
    subject: params.subject,
    createdAt: new Date().toISOString(),
  };
}

async function assignAgent(params, context) {
  return {
    assignedTo: params.agentId,
    assignedAt: new Date().toISOString(),
  };
}

async function addTag(params, context) {
  return {
    tag: params.tag,
    addedAt: new Date().toISOString(),
  };
}

async function sendNotification(params, context) {
  return {
    recipient: params.recipient,
    message: params.message,
    sentAt: new Date().toISOString(),
  };
}

async function updatePriority(params, context) {
  return {
    priority: params.priority,
    updatedAt: new Date().toISOString(),
  };
}

async function generateAIResponse(params, context) {
  return {
    response: `AI-generated response for: ${context.message}`,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Trigger automation based on event
 */
async function triggerAutomations(event, context) {
  const matchingAutomations = Array.from(automations.values())
    .filter(a => a.enabled && a.trigger === event);

  const results = [];
  for (const automation of matchingAutomations) {
    const result = await executeAutomation(automation.id, context);
    results.push(result);
  }

  return results;
}

/**
 * Create routing rule
 */
function createRoutingRule({ name, conditions, destination, priority = 0 }) {
  const rule = {
    id: `rule_${crypto.randomBytes(8).toString('hex')}`,
    name,
    conditions,
    destination, // agent, team, or queue
    priority, // higher priority rules execute first
    enabled: true,
    matchCount: 0,
    createdAt: new Date().toISOString(),
  };

  routingRules.set(rule.id, rule);
  return rule;
}

/**
 * Route conversation/ticket
 */
function routeItem(item) {
  const sortedRules = Array.from(routingRules.values())
    .filter(r => r.enabled)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of sortedRules) {
    if (evaluateConditions(rule.conditions, item)) {
      rule.matchCount++;
      return {
        matched: true,
        rule: rule.id,
        destination: rule.destination,
      };
    }
  }

  return {
    matched: false,
    destination: 'default_queue',
  };
}

/**
 * Get routing rules
 */
function listRoutingRules() {
  return Array.from(routingRules.values())
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Update routing rule
 */
function updateRoutingRule(ruleId, updates) {
  const rule = routingRules.get(ruleId);
  if (!rule) return null;

  Object.assign(rule, updates);
  return rule;
}

/**
 * Delete routing rule
 */
function deleteRoutingRule(ruleId) {
  return routingRules.delete(ruleId);
}

/**
 * Auto-tag conversations
 */
function autoTagConversation(conversation) {
  const tags = [];
  const content = conversation.lastMessage?.toLowerCase() || '';

  // Topic-based tagging
  if (content.includes('order') || content.includes('shipping')) tags.push('order');
  if (content.includes('return') || content.includes('refund')) tags.push('return');
  if (content.includes('account') || content.includes('password')) tags.push('account');
  if (content.includes('product') || content.includes('item')) tags.push('product');
  if (content.includes('billing') || content.includes('payment')) tags.push('billing');

  // Sentiment-based tagging
  if (conversation.sentiment === 'negative') tags.push('urgent');
  if (conversation.priority === 'high' || conversation.priority === 'urgent') tags.push('priority');

  return tags;
}

/**
 * Get automation statistics
 */
function getAutomationStats() {
  const allAutomations = Array.from(automations.values());
  const allRuns = Array.from(automationRuns.values());

  return {
    totalAutomations: allAutomations.length,
    enabledAutomations: allAutomations.filter(a => a.enabled).length,
    totalRuns: allRuns.length,
    successfulRuns: allRuns.filter(r => r.status === 'completed').length,
    failedRuns: allRuns.filter(r => r.status === 'failed').length,
    skippedRuns: allRuns.filter(r => r.status === 'skipped').length,
    totalRoutingRules: routingRules.size,
    avgRunsPerAutomation: allAutomations.length > 0
      ? (allAutomations.reduce((sum, a) => sum + a.runCount, 0) / allAutomations.length).toFixed(2)
      : 0,
  };
}

/**
 * Get automation run history
 */
function getAutomationRunHistory(automationId, { limit = 50 } = {}) {
  let runs = Array.from(automationRuns.values());
  
  if (automationId) {
    runs = runs.filter(r => r.automationId === automationId);
  }

  return runs
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
    .slice(0, limit);
}

/**
 * Intelligent response suggestions
 */
function getSuggestedActions(context) {
  const suggestions = [];

  // Based on message content
  if (context.message?.toLowerCase().includes('urgent')) {
    suggestions.push({
      action: 'update_priority',
      params: { priority: 'high' },
      reason: 'Message contains urgent keyword',
      confidence: 0.9,
    });
  }

  // Based on sentiment
  if (context.sentiment === 'negative') {
    suggestions.push({
      action: 'assign_agent',
      params: { agentType: 'senior' },
      reason: 'Negative sentiment detected',
      confidence: 0.85,
    });
  }

  // Based on SLA
  if (context.slaStatus === 'at_risk') {
    suggestions.push({
      action: 'send_notification',
      params: { recipient: 'supervisor', message: 'SLA at risk' },
      reason: 'SLA breach imminent',
      confidence: 0.95,
    });
  }

  return suggestions;
}

module.exports = {
  createAutomation,
  getAutomation,
  updateAutomation,
  listAutomations,
  deleteAutomation,
  executeAutomation,
  triggerAutomations,
  createRoutingRule,
  routeItem,
  listRoutingRules,
  updateRoutingRule,
  deleteRoutingRule,
  autoTagConversation,
  getAutomationStats,
  getAutomationRunHistory,
  getSuggestedActions,
};
