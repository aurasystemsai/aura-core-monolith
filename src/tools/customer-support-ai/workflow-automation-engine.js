/**
 * Workflow Automation Engine  
 * Handles auto-responses, macros, triggers, business rules
 */

// In-memory storage (replace with database in production)
const macros = new Map();
const triggers = new Map();
const automationRules = new Map();
const workflowExecutions = new Map();
const autoResponses = new Map();

/**
 * Create macro
 */
async function createMacro(macroData) {
  const macroId = `macro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const macro = {
    id: macroId,
    name: macroData.name,
    description: macroData.description,
    category: macroData.category || 'general',
    actions: macroData.actions || [],
    variables: macroData.variables || [],
    enabled: macroData.enabled !== false,
    usageCount: 0,
    createdAt: new Date().toISOString()
  };
  
  macros.set(macroId, macro);
  return macro;
}

/**
 * Execute macro
 */
async function executeMacro(macroId, context = {}) {
  const macro = macros.get(macroId);
  if (!macro) throw new Error('Macro not found');
  
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const results = [];
  
  for (const action of macro.actions) {
    let result = null;
    
    switch (action.type) {
      case 'add_reply':
        result = await addReply(context.ticketId, replaceVariables(action.content, context));
        break;
      case 'set_status':
        result = await setTicketStatus(context.ticketId, action.status);
        break;
      case 'assign_agent':
        result = await assignTicket(context.ticketId, action.agentId);
        break;
      case 'add_tag':
        result = await addTag(context.ticketId, action.tag);
        break;
      case 'set_priority':
        result = await setPriority(context.ticketId, action.priority);
        break;
      case 'send_email':
        result = await sendEmail(action.to, replaceVariables(action.subject, context), replaceVariables(action.body, context));
        break;
    }
    
    results.push({ action: action.type, result, success: true });
  }
  
  // Update usage count
  macro.usageCount++;
  macros.set(macroId, macro);
  
  const execution = {
    id: executionId,
    macroId,
    context,
    results,
    executedAt: new Date().toISOString()
  };
  
  workflowExecutions.set(executionId, execution);
  return execution;
}

/**
 * Replace variables in text
 */
function replaceVariables(text, context) {
  let result = text;
  
  Object.entries(context).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  });
  
  return result;
}

/**
 * Create trigger
 */
async function createTrigger(triggerData) {
  const triggerId = `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const trigger = {
    id: triggerId,
    name: triggerData.name,
    description: triggerData.description,
    event: triggerData.event, // ticket_created, ticket_updated, ticket_closed, response_added
    conditions: triggerData.conditions || [],
    actions: triggerData.actions || [],
    enabled: triggerData.enabled !== false,
    priority: triggerData.priority || 0,
    executionCount: 0,
    createdAt: new Date().toISOString()
  };
  
  triggers.set(triggerId, trigger);
  return trigger;
}

/**
 * Fire triggers
 */
async function fireTriggers(event, eventData = {}) {
  const matchingTriggers = Array.from(triggers.values())
    .filter(t => t.enabled && t.event === event)
    .sort((a, b) => b.priority - a.priority);
  
  const executionResults = [];
  
  for (const trigger of matchingTriggers) {
    // Check conditions
    const conditionsMet = trigger.conditions.every(condition => {
      return evaluateCondition(condition, eventData);
    });
    
    if (!conditionsMet) continue;
    
    // Execute actions
    const actionResults = [];
    for (const action of trigger.actions) {
      const result = await executeAction(action, eventData);
      actionResults.push(result);
    }
    
    trigger.executionCount++;
    triggers.set(trigger.id, trigger);
    
    executionResults.push({
      triggerId: trigger.id,
      triggerName: trigger.name,
      actionResults
    });
  }
  
  return executionResults;
}

/**
 * Evaluate condition
 */
function evaluateCondition(condition, data) {
  const fieldValue = data[condition.field];
  const targetValue = condition.value;
  
  switch (condition.operator) {
    case 'equals':
      return fieldValue === targetValue;
    case 'not_equals':
      return fieldValue !== targetValue;
    case 'contains':
      return String(fieldValue).includes(targetValue);
    case 'not_contains':
      return !String(fieldValue).includes(targetValue);
    case 'greater_than':
      return fieldValue > targetValue;
    case 'less_than':
      return fieldValue < targetValue;
    case 'is_empty':
      return !fieldValue || fieldValue === '';
    case 'is_not_empty':
      return fieldValue && fieldValue !== '';
    default:
      return false;
  }
}

/**
 * Execute action
 */
async function executeAction(action, context) {
  // Simulate action execution
  return {
    type: action.type,
    executed: true,
    timestamp: new Date().toISOString()
  };
}

/**
 * Create automation rule
 */
async function createAutomationRule(ruleData) {
  const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const rule = {
    id: ruleId,
    name: ruleData.name,
    description: ruleData.description,
    type: ruleData.type, // time_based, event_based, condition_based
    schedule: ruleData.schedule, // for time_based rules
    conditions: ruleData.conditions || [],
    actions: ruleData.actions || [],
    enabled: ruleData.enabled !== false,
    lastRun: null,
    nextRun: null,
    executionCount: 0,
    createdAt: new Date().toISOString()
  };
  
  automationRules.set(ruleId, rule);
  return rule;
}

/**
 * Create auto-response
 */
async function createAutoResponse(responseData) {
  const responseId = `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const autoResponse = {
    id: responseId,
    name: responseData.name,
    trigger: responseData.trigger, // ticket_created, business_hours_end, keyword_match
    conditions: responseData.conditions || [],
    messageTemplate: responseData.messageTemplate,
    channel: responseData.channel || 'email',
    delay: responseData.delay || 0, // minutes
    enabled: responseData.enabled !== false,
    sentCount: 0,
    createdAt: new Date().toISOString()
  };
  
  autoResponses.set(responseId, autoResponse);
  return autoResponse;
}

/**
 * Send auto-response
 */
async function sendAutoResponse(responseId, context = {}) {
  const autoResponse = autoResponses.get(responseId);
  if (!autoResponse) throw new Error('Auto-response not found');
  
  // Check conditions
  const conditionsMet = autoResponse.conditions.every(condition => {
    return evaluateCondition(condition, context);
  });
  
  if (!conditionsMet) {
    return { sent: false, reason: 'Conditions not met' };
  }
  
  // Replace variables in message
  const message = replaceVariables(autoResponse.messageTemplate, context);
  
  // Send message (simulated)
  const sent = {
    id: `sent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    autoResponseId: responseId,
    message,
    channel: autoResponse.channel,
    recipient: context.customerId || context.email,
    sentAt: new Date().toISOString()
  };
  
  autoResponse.sentCount++;
  autoResponses.set(responseId, autoResponse);
  
  return { sent: true, details: sent };
}

/**
 * Get macros
 */
async function getMacros(filters = {}) {
  let macroList = Array.from(macros.values());
  
  if (filters.category) {
    macroList = macroList.filter(m => m.category === filters.category);
  }
  if (filters.enabled !== undefined) {
    macroList = macroList.filter(m => m.enabled === filters.enabled);
  }
  
  return macroList.sort((a, b) => b.usageCount - a.usageCount);
}

/**
 * Get triggers
 */
async function getTriggers(filters = {}) {
  let triggerList = Array.from(triggers.values());
  
  if (filters.event) {
    triggerList = triggerList.filter(t => t.event === filters.event);
  }
  if (filters.enabled !== undefined) {
    triggerList = triggerList.filter(t => t.enabled === filters.enabled);
  }
  
  return triggerList.sort((a, b) => b.priority - a.priority);
}

/**
 * Get workflow executions
 */
async function getWorkflowExecutions(filters = {}) {
  let executions = Array.from(workflowExecutions.values());
  
  if (filters.macroId) {
    executions = executions.filter(e => e.macroId === filters.macroId);
  }
  if (filters.startDate) {
    executions = executions.filter(e => new Date(e.executedAt) >= new Date(filters.startDate));
  }
  if (filters.endDate) {
    executions = executions.filter(e => new Date(e.executedAt) <= new Date(filters.endDate));
  }
  
  return executions.sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt));
}

/**
 * Placeholder functions for action execution
 */
async function addReply(ticketId, content) {
  return { ticketId, content, added: true };
}

async function setTicketStatus(ticketId, status) {
  return { ticketId, status, updated: true };
}

async function assignTicket(ticketId, agentId) {
  return { ticketId, agentId, assigned: true };
}

async function addTag(ticketId, tag) {
  return { ticketId, tag, added: true };
}

async function setPriority(ticketId, priority) {
  return { ticketId, priority, updated: true };
}

async function sendEmail(to, subject, body) {
  return { to, subject, sent: true };
}

/**
 * Get automation statistics
 */
async function getAutomationStatistics() {
  return {
    totalMacros: macros.size,
    totalTriggers: triggers.size,
    totalRules: automationRules.size,
    totalAutoResponses: autoResponses.size,
    totalExecutions: workflowExecutions.size,
    activeTriggers: Array.from(triggers.values()).filter(t => t.enabled).length,
    activeRules: Array.from(automationRules.values()).filter(r => r.enabled).length
  };
}

module.exports = {
  createMacro,
  executeMacro,
  createTrigger,
  fireTriggers,
  createAutomationRule,
  createAutoResponse,
  sendAutoResponse,
  getMacros,
  getTriggers,
  getWorkflowExecutions,
  getAutomationStatistics
};
