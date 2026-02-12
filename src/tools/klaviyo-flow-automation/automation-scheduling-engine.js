// ================================================================
// KLAVIYO FLOW AUTOMATION - AUTOMATION & SCHEDULING ENGINE
// ================================================================
// Handles automation rules, scheduling, cron jobs, delays, retries
// ================================================================

const crypto = require('crypto');

// In-memory stores
const automationRules = new Map();
const schedules = new Map();
const jobs = new Map();
const delays = new Map();
const retries = new Map();
const workflows = new Map();

// ================================================================
// AUTOMATION RULES
// ================================================================

function listAutomationRules(filter = {}) {
  let results = Array.from(automationRules.values());
  
  if (filter.type) {
    results = results.filter(r => r.type === filter.type);
  }
  if (filter.status) {
    results = results.filter(r => r.status === filter.status);
  }
  
  return results;
}

function createAutomationRule(data) {
  const rule = {
    id: `RULE-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'Untitled Rule',
    type: data.type || 'trigger_action',
    trigger: data.trigger || {},
    conditions: data.conditions || [],
    actions: data.actions || [],
    priority: data.priority || 0,
    status: data.status || 'active',
    executionCount: 0,
    lastExecutedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  automationRules.set(rule.id, rule);
  return rule;
}

function getAutomationRule(id) {
  return automationRules.get(id);
}

function updateAutomationRule(id, updates) {
  const rule = automationRules.get(id);
  if (!rule) return null;
  
  Object.assign(rule, updates, { updatedAt: Date.now() });
  automationRules.set(id, rule);
  return rule;
}

function deleteAutomationRule(id) {
  return automationRules.delete(id);
}

function executeAutomationRule(id, context = {}) {
  const rule = automationRules.get(id);
  if (!rule || rule.status !== 'active') return null;
  
  // Evaluate conditions
  const conditionsMet = rule.conditions.every(condition => {
    return evaluateCondition(condition, context);
  });
  
  if (!conditionsMet) {
    return { executed: false, reason: 'Conditions not met' };
  }
  
  // Execute actions
  const results = rule.actions.map(action => {
    return executeAction(action, context);
  });
  
  rule.executionCount++;
  rule.lastExecutedAt = Date.now();
  automationRules.set(id, rule);
  
  return {
    executed: true,
    ruleId: id,
    actionResults: results,
    executedAt: Date.now()
  };
}

function evaluateCondition(condition, context) {
  const value = context[condition.field];
  
  switch (condition.operator) {
    case 'equals':
      return value === condition.value;
    case 'not_equals':
      return value !== condition.value;
    case 'contains':
      return String(value).includes(condition.value);
    case 'greater_than':
      return Number(value) > Number(condition.value);
    case 'less_than':
      return Number(value) < Number(condition.value);
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(value);
    default:
      return true;
  }
}

function executeAction(action, context) {
  return {
    actionType: action.type,
    status: 'executed',
    timestamp: Date.now(),
    context
  };
}

// ================================================================
// SCHEDULING
// ================================================================

function listSchedules(filter = {}) {
  let results = Array.from(schedules.values());
  
  if (filter.type) {
    results = results.filter(s => s.type === filter.type);
  }
  if (filter.status) {
    results = results.filter(s => s.status === filter.status);
  }
  
  return results;
}

function createSchedule(data) {
  const schedule = {
    id: `SCHED-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'Untitled Schedule',
    type: data.type || 'recurring',
    cronExpression: data.cronExpression || '0 0 * * *',
    timezone: data.timezone || 'UTC',
    action: data.action || {},
    status: 'active',
    nextRunAt: calculateNextRun(data.cronExpression || '0 0 * * *'),
    lastRunAt: null,
    executionCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  schedules.set(schedule.id, schedule);
  return schedule;
}

function getSchedule(id) {
  return schedules.get(id);
}

function updateSchedule(id, updates) {
  const schedule = schedules.get(id);
  if (!schedule) return null;
  
  Object.assign(schedule, updates, { updatedAt: Date.now() });
  
  if (updates.cronExpression) {
    schedule.nextRunAt = calculateNextRun(updates.cronExpression);
  }
  
  schedules.set(id, schedule);
  return schedule;
}

function deleteSchedule(id) {
  return schedules.delete(id);
}

function pauseSchedule(id) {
  return updateSchedule(id, { status: 'paused' });
}

function resumeSchedule(id) {
  return updateSchedule(id, { status: 'active' });
}

function calculateNextRun(cronExpression) {
  // Simplified cron calculation - in production would use a cron library
  const now = Date.now();
  const parts = cronExpression.split(' ');
  
  // Parse hour from cron (assuming simple daily format)
  const hour = parseInt(parts[1]) || 0;
  
  const nextRun = new Date();
  nextRun.setHours(hour, 0, 0, 0);
  
  if (nextRun.getTime() <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }
  
  return nextRun.getTime();
}

function executeSchedule(id) {
  const schedule = schedules.get(id);
  if (!schedule) return null;
  
  const result = executeAction(schedule.action, {});
  
  schedule.lastRunAt = Date.now();
  schedule.executionCount++;
  schedule.nextRunAt = calculateNextRun(schedule.cronExpression);
  schedules.set(id, schedule);
  
  return result;
}

// ================================================================
// JOB QUEUE
// ================================================================

function createJob(data) {
  const job = {
    id: `JOB-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
    name: data.name || 'Untitled Job',
    type: data.type || 'execute_flow',
    payload: data.payload || {},
    priority: data.priority || 0,
    status: 'queued',
    attempts: 0,
    maxAttempts: data.maxAttempts || 3,
    scheduledFor: data.scheduledFor || Date.now(),
    startedAt: null,
    completedAt: null,
    error: null,
    createdAt: Date.now()
  };
  
  jobs.set(job.id, job);
  return job;
}

function getJob(id) {
  return jobs.get(id);
}

function listJobs(filter = {}) {
  let results = Array.from(jobs.values());
  
  if (filter.status) {
    results = results.filter(j => j.status === filter.status);
  }
  if (filter.type) {
    results = results.filter(j => j.type === filter.type);
  }
  
  return results.sort((a, b) => b.priority - a.priority || a.scheduledFor - b.scheduledFor);
}

function processJob(id) {
  const job = jobs.get(id);
  if (!job || job.status !== 'queued') return null;
  
  job.status = 'processing';
  job.startedAt = Date.now();
  job.attempts++;
  jobs.set(id, job);
  
  try {
    // Simulate job processing
    setTimeout(() => {
      job.status = 'completed';
      job.completedAt = Date.now();
      jobs.set(id, job);
    }, 100);
    
    return job;
  } catch (error) {
    job.error = error.message;
    
    if (job.attempts < job.maxAttempts) {
      job.status = 'queued';
      job.scheduledFor = Date.now() + (60000 * job.attempts);
    } else {
      job.status = 'failed';
      job.completedAt = Date.now();
    }
    
    jobs.set(id, job);
    return job;
  }
}

function retryJob(id) {
  const job = jobs.get(id);
  if (!job || job.status !== 'failed') return null;
  
  job.status = 'queued';
  job.attempts = 0;
  job.error = null;
  job.scheduledFor = Date.now();
  jobs.set(id, job);
  
  return job;
}

function cancelJob(id) {
  const job = jobs.get(id);
  if (!job || !['queued', 'processing'].includes(job.status)) return null;
  
  job.status = 'cancelled';
  job.completedAt = Date.now();
  jobs.set(id, job);
  
  return job;
}

// ================================================================
// DELAYS & TIMING
// ================================================================

function createDelay(data) {
  const delay = {
    id: `DELAY-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    flowId: data.flowId || null,
    contactId: data.contactId || null,
    delayType: data.delayType || 'fixed',
    duration: data.duration || 0,
    until: data.until || null,
    executeAt: data.delayType === 'until' ? data.until : Date.now() + data.duration,
    action: data.action || {},
    status: 'pending',
    createdAt: Date.now()
  };
  
  delays.set(delay.id, delay);
  return delay;
}

function getDelay(id) {
  return delays.get(id);
}

function listDelays(filter = {}) {
  let results = Array.from(delays.values());
  
  if (filter.status) {
    results = results.filter(d => d.status === filter.status);
  }
  if (filter.flowId) {
    results = results.filter(d => d.flowId === filter.flowId);
  }
  
  return results.sort((a, b) => a.executeAt - b.executeAt);
}

function processPendingDelays() {
  const now = Date.now();
  const pending = Array.from(delays.values()).filter(d => 
    d.status === 'pending' && d.executeAt <= now
  );
  
  pending.forEach(delay => {
    delay.status = 'executing';
    executeAction(delay.action, { delayId: delay.id });
    delay.status = 'executed';
    delay.executedAt = Date.now();
    delays.set(delay.id, delay);
  });
  
  return pending.length;
}

// ================================================================
// WORKFLOWS
// ================================================================

function createWorkflow(data) {
  const workflow = {
    id: `WF-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'Untitled Workflow',
    steps: data.steps || [],
    currentStep: 0,
    status: 'pending',
    context: data.context || {},
    startedAt: null,
    completedAt: null,
    createdAt: Date.now()
  };
  
  workflows.set(workflow.id, workflow);
  return workflow;
}

function getWorkflow(id) {
  return workflows.get(id);
}

function executeWorkflow(id) {
  const workflow = workflows.get(id);
  if (!workflow) return null;
  
  workflow.status = 'running';
  workflow.startedAt = Date.now();
  
  const executeStep = (stepIndex) => {
    if (stepIndex >= workflow.steps.length) {
      workflow.status = 'completed';
      workflow.completedAt = Date.now();
      workflows.set(id, workflow);
      return workflow;
    }
    
    const step = workflow.steps[stepIndex];
    workflow.currentStep = stepIndex;
    
    // Execute step
    const result = executeAction(step.action, workflow.context);
    
    // Update context with result
    if (step.outputKey) {
      workflow.context[step.outputKey] = result;
    }
    
    workflows.set(id, workflow);
    
    // Handle delays
    if (step.delayAfter) {
      setTimeout(() => executeStep(stepIndex + 1), step.delayAfter);
    } else {
      executeStep(stepIndex + 1);
    }
  };
  
  executeStep(0);
  return workflow;
}

function pauseWorkflow(id) {
  const workflow = workflows.get(id);
  if (!workflow || workflow.status !== 'running') return null;
  
  workflow.status = 'paused';
  workflows.set(id, workflow);
  return workflow;
}

function resumeWorkflow(id) {
  const workflow = workflows.get(id);
  if (!workflow || workflow.status !== 'paused') return null;
  
  workflow.status = 'running';
  workflows.set(id, workflow);
  return workflow;
}

function cancelWorkflow(id) {
  const workflow = workflows.get(id);
  if (!workflow) return null;
  
  workflow.status = 'cancelled';
  workflow.completedAt = Date.now();
  workflows.set(id, workflow);
  return workflow;
}

// ================================================================
// RETRY LOGIC
// ================================================================

function createRetryPolicy(data) {
  const policy = {
    id: `RETRY-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'Default Retry',
    maxAttempts: data.maxAttempts || 3,
    backoffStrategy: data.backoffStrategy || 'exponential',
    initialDelay: data.initialDelay || 60000,
    maxDelay: data.maxDelay || 3600000,
    retryableErrors: data.retryableErrors || ['TIMEOUT', 'NETWORK_ERROR'],
    createdAt: Date.now()
  };
  
  retries.set(policy.id, policy);
  return policy;
}

function getRetryPolicy(id) {
  return retries.get(id);
}

function calculateRetryDelay(policy, attemptNumber) {
  if (policy.backoffStrategy === 'exponential') {
    const delay = policy.initialDelay * Math.pow(2, attemptNumber - 1);
    return Math.min(delay, policy.maxDelay);
  } else if (policy.backoffStrategy === 'linear') {
    const delay = policy.initialDelay * attemptNumber;
    return Math.min(delay, policy.maxDelay);
  } else {
    return policy.initialDelay;
  }
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Automation Rules
  listAutomationRules,
  createAutomationRule,
  getAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
  executeAutomationRule,
  
  // Scheduling
  listSchedules,
  createSchedule,
  getSchedule,
  updateSchedule,
  deleteSchedule,
  pauseSchedule,
  resumeSchedule,
  executeSchedule,
  
  // Job Queue
  createJob,
  getJob,
  listJobs,
  processJob,
  retryJob,
  cancelJob,
  
  // Delays
  createDelay,
  getDelay,
  listDelays,
  processPendingDelays,
  
  // Workflows
  createWorkflow,
  getWorkflow,
  executeWorkflow,
  pauseWorkflow,
  resumeWorkflow,
  cancelWorkflow,
  
  // Retry Logic
  createRetryPolicy,
  getRetryPolicy,
  calculateRetryDelay
};
