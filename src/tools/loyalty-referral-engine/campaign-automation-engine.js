/**
 * Campaign Automation Engine
 * Manages automated campaigns, triggers, workflows, and scheduled actions
 */

// Storage
const campaigns = new Map(); // campaignId -> campaign
const triggers = new Map(); // triggerId -> trigger
const workflows = new Map(); // workflowId -> workflow
const campaignRuns = new Map(); // runId -> run details
const scheduledActions = new Map(); // actionId -> scheduled action

let campaignCounter = 1;
let triggerCounter = 1;
let workflowCounter = 1;
let runCounter = 1;
let actionCounter = 1;

/**
 * Create automated campaign
 */
function createCampaign(data) {
  const campaign = {
    id: `campaign_${campaignCounter++}`,
    name: data.name,
    description: data.description || '',
    type: data.type, // welcome, birthday, anniversary, points_expiry, tier_upgrade, inactivity
    trigger: data.trigger, // Event that starts the campaign
    actions: data.actions || [], // Array of actions to perform
    conditions: data.conditions || {}, // Additional conditions
    schedule: data.schedule || null, // Cron expression or specific times
    enabled: data.enabled !== false,
    status: 'active', // active, paused, completed
    createdAt: new Date().toISOString(),
    statistics: {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      totalRecipients: 0,
      successRate: 0,
    },
  };
  
  campaigns.set(campaign.id, campaign);
  return campaign;
}

/**
 * Get campaigns
 */
function getCampaigns(options = {}) {
  const { type, status, enabled } = options;
  
  let results = Array.from(campaigns.values());
  
  if (type) {
    results = results.filter(c => c.type === type);
  }
  
  if (status) {
    results = results.filter(c => c.status === status);
  }
  
  if (enabled !== undefined) {
    results = results.filter(c => c.enabled === enabled);
  }
  
  return {
    campaigns: results,
    total: results.length,
  };
}

/**
 * Execute campaign
 */
function executeCampaign(campaignId, context = {}) {
  const campaign = campaigns.get(campaignId);
  
  if (!campaign) {
    throw new Error('Campaign not found');
  }
  
  if (!campaign.enabled) {
    throw new Error('Campaign is disabled');
  }
  
  const runId = `run_${runCounter++}`;
  const run = {
    id: runId,
    campaignId,
    startedAt: new Date().toISOString(),
    status: 'running',
    context,
    results: [],
  };
  
  campaignRuns.set(runId, run);
  campaign.statistics.totalRuns++;
  
  try {
    // Execute each action
    for (const action of campaign.actions) {
      const result = executeAction(action, context);
      run.results.push(result);
    }
    
    run.status = 'completed';
    run.completedAt = new Date().toISOString();
    campaign.statistics.successfulRuns++;
    campaign.statistics.totalRecipients += (context.recipients?.length || 1);
    
  } catch (error) {
    run.status = 'failed';
    run.error = error.message;
    run.completedAt = new Date().toISOString();
    campaign.statistics.failedRuns++;
  }
  
  campaign.statistics.successRate = campaign.statistics.totalRuns > 0
    ? ((campaign.statistics.successfulRuns / campaign.statistics.totalRuns) * 100).toFixed(2)
    : 0;
  
  return run;
}

/**
 * Execute action
 */
function executeAction(action, context) {
  const { type, config } = action;
  
  const result = {
    type,
    executedAt: new Date().toISOString(),
    success: false,
    output: null,
  };
  
  try {
    switch (type) {
      case 'award_points':
        result.output = {
          customerId: context.customerId,
          points: config.points,
          reason: config.reason,
        };
        result.success = true;
        break;
        
      case 'send_email':
        result.output = {
          to: context.email,
          subject: config.subject,
          template: config.template,
        };
        result.success = true;
        break;
        
      case 'send_notification':
        result.output = {
          customerId: context.customerId,
          message: config.message,
          type: config.notificationType,
        };
        result.success = true;
        break;
        
      case 'upgrade_tier':
        result.output = {
          customerId: context.customerId,
          newTier: config.tierId,
        };
        result.success = true;
        break;
        
      case 'award_badge':
        result.output = {
          customerId: context.customerId,
          badgeId: config.badgeId,
        };
        result.success = true;
        break;
        
      default:
        result.output = { message: 'Unknown action type' };
    }
  } catch (error) {
    result.error = error.message;
  }
  
  return result;
}

/**
 * Create trigger
 */
function createTrigger(data) {
  const trigger = {
    id: `trigger_${triggerCounter++}`,
    name: data.name,
    event: data.event, // customer.signup, customer.purchase, points.earned, tier.upgraded
    conditions: data.conditions || {},
    actions: data.actions || [],
    enabled: data.enabled !== false,
    createdAt: new Date().toISOString(),
    statistics: {
      totalTriggers: 0,
      totalActions: 0,
    },
  };
  
  triggers.set(trigger.id, trigger);
  return trigger;
}

/**
 * Fire trigger
 */
function fireTrigger(event, eventData = {}) {
  const matchingTriggers = Array.from(triggers.values())
    .filter(t => t.enabled && t.event === event);
  
  const results = [];
  
  for (const trigger of matchingTriggers) {
    // Check conditions
    if (trigger.conditions && !evaluateConditions(trigger.conditions, eventData)) {
      continue;
    }
    
    trigger.statistics.totalTriggers++;
    
    // Execute actions
    for (const action of trigger.actions) {
      const result = executeAction(action, eventData);
      results.push({
        triggerId: trigger.id,
        action: result,
      });
      trigger.statistics.totalActions++;
    }
  }
  
  return {
    event,
    triggersExecuted: results.length,
    results,
  };
}

/**
 * Evaluate conditions
 */
function evaluateConditions(conditions, data) {
  // Simple condition evaluation
  for (const [key, value] of Object.entries(conditions)) {
    if (data[key] !== value) {
      return false;
    }
  }
  return true;
}

/**
 * Create workflow
 */
function createWorkflow(data) {
  const workflow = {
    id: `workflow_${workflowCounter++}`,
    name: data.name,
    description: data.description || '',
    steps: data.steps || [], // Array of workflow steps
    startTrigger: data.startTrigger,
    enabled: data.enabled !== false,
    createdAt: new Date().toISOString(),
    statistics: {
      totalExecutions: 0,
      successfulExecutions: 0,
    },
  };
  
  workflows.set(workflow.id, workflow);
  return workflow;
}

/**
 * Execute workflow
 */
function executeWorkflow(workflowId, context = {}) {
  const workflow = workflows.get(workflowId);
  
  if (!workflow) {
    throw new Error('Workflow not found');
  }
  
  if (!workflow.enabled) {
    throw new Error('Workflow is disabled');
  }
  
  workflow.statistics.totalExecutions++;
  
  const execution = {
    workflowId,
    startedAt: new Date().toISOString(),
    steps: [],
    status: 'running',
  };
  
  try {
    for (const step of workflow.steps) {
      const stepResult = executeWorkflowStep(step, context);
      execution.steps.push(stepResult);
      
      // If step has delay, note it
      if (step.delay) {
        stepResult.delayedUntil = new Date(Date.now() + step.delay * 1000).toISOString();
      }
    }
    
    execution.status = 'completed';
    execution.completedAt = new Date().toISOString();
    workflow.statistics.successfulExecutions++;
    
  } catch (error) {
    execution.status = 'failed';
    execution.error = error.message;
    execution.completedAt = new Date().toISOString();
  }
  
  return execution;
}

/**
 * Execute workflow step
 */
function executeWorkflowStep(step, context) {
  const result = {
    stepId: step.id,
    type: step.type,
    executedAt: new Date().toISOString(),
  };
  
  if (step.condition && !evaluateConditions(step.condition, context)) {
    result.skipped = true;
    result.reason = 'Condition not met';
    return result;
  }
  
  if (step.action) {
    result.actionResult = executeAction(step.action, context);
  }
  
  result.success = true;
  return result;
}

/**
 * Schedule action
 */
function scheduleAction(data) {
  const action = {
    id: `action_${actionCounter++}`,
    type: data.type,
    config: data.config || {},
    scheduledFor: data.scheduledFor, // ISO date string
    customerId: data.customerId,
    status: 'scheduled', // scheduled, executed, cancelled
    createdAt: new Date().toISOString(),
  };
  
  scheduledActions.set(action.id, action);
  return action;
}

/**
 * Get scheduled actions
 */
function getScheduledActions(customerId) {
  const actions = Array.from(scheduledActions.values())
    .filter(a => !customerId || a.customerId === customerId)
    .filter(a => a.status === 'scheduled');
  
  return {
    actions,
    total: actions.length,
  };
}

/**
 * Get automation statistics
 */
function getAutomationStatistics() {
  return {
    campaigns: {
      total: campaigns.size,
      active: Array.from(campaigns.values()).filter(c => c.status === 'active').length,
      totalRuns: Array.from(campaigns.values())
        .reduce((sum, c) => sum + c.statistics.totalRuns, 0),
      totalRecipients: Array.from(campaigns.values())
        .reduce((sum, c) => sum + c.statistics.totalRecipients, 0),
    },
    triggers: {
      total: triggers.size,
      enabled: Array.from(triggers.values()).filter(t => t.enabled).length,
      totalTriggers: Array.from(triggers.values())
        .reduce((sum, t) => sum + t.statistics.totalTriggers, 0),
    },
    workflows: {
      total: workflows.size,
      totalExecutions: Array.from(workflows.values())
        .reduce((sum, w) => sum + w.statistics.totalExecutions, 0),
    },
    scheduledActions: {
      total: scheduledActions.size,
      pending: Array.from(scheduledActions.values())
        .filter(a => a.status === 'scheduled').length,
    },
  };
}

module.exports = {
  createCampaign,
  getCampaigns,
  executeCampaign,
  createTrigger,
  fireTrigger,
  createWorkflow,
  executeWorkflow,
  scheduleAction,
  getScheduledActions,
  getAutomationStatistics,
};
