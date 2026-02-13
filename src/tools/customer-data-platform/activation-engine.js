/**
 * ACTIVATION ENGINE
 * Audience syncing to destinations (email, ads, CRM),
 * campaign triggers, webhook delivery, cross-channel orchestration
 */

// In-memory stores
const activations = new Map();
const destinations = new Map();
const campaigns = new Map();
const syncLogs = [];
const webhooks = new Map();

let activationCounter = 0;
let campaignCounter = 0;

// ================================================================
// DESTINATION MANAGEMENT
// ================================================================

function createDestination({ name, type, config, credentials }) {
  const id = `dest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const destination = {
    id,
    name,
    type, // 'email', 'facebook_ads', 'google_ads', 'salesforce', 'hubspot', 'slack', 'webhook'
    config,
    credentials,
    status: 'active',
    lastSync: null,
    totalSyncs: 0,
    totalRecords: 0,
    errorCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  destinations.set(id, destination);
  return destination;
}

function getDestination(id) {
  return destinations.get(id) || null;
}

function listDestinations({ type, status, limit = 100 }) {
  let results = Array.from(destinations.values());
  
  if (type) {
    results = results.filter(d => d.type === type);
  }
  
  if (status) {
    results = results.filter(d => d.status === status);
  }
  
  return results.slice(0, limit);
}

function updateDestination(id, updates) {
  const destination = destinations.get(id);
  if (!destination) return null;
  
  Object.assign(destination, updates);
  destination.updatedAt = new Date().toISOString();
  destinations.set(id, destination);
  
  return destination;
}

function testDestination(id) {
  const destination = destinations.get(id);
  if (!destination) return { success: false, error: 'Destination not found' };
  
  // Simulate connection test
  return {
    success: true,
    destinationId: id,
    type: destination.type,
    latency: Math.floor(Math.random() * 100) + 10,
    testedAt: new Date().toISOString()
  };
}

// ================================================================
// AUDIENCE ACTIVATION
// ================================================================

function createActivation({ name, segmentId, destinationId, mapping, schedule, enabled = true }) {
  const id = `activation_${Date.now()}_${++activationCounter}`;
  
  const activation = {
    id,
    name,
    segmentId,
    destinationId,
    mapping, // { destField: 'segmentField' }
    schedule, // cron expression or null for manual
    enabled,
    status: 'pending',
    lastRun: null,
    nextRun: schedule ? calculateNextRun(schedule) : null,
    totalRuns: 0,
    totalRecordsSynced: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  activations.set(id, activation);
  
  // Start immediate sync if no schedule
  if (!schedule && enabled) {
    executeActivation(id);
  }
  
  return activation;
}

function calculateNextRun(cronExpression) {
  // Simplified: assume hourly/daily schedules
  const now = new Date();
  now.setHours(now.getHours() + 1);
  return now.toISOString();
}

function getActivation(id) {
  return activations.get(id) || null;
}

function listActivations({ segmentId, destinationId, enabled, limit = 100 }) {
  let results = Array.from(activations.values());
  
  if (segmentId) {
    results = results.filter(a => a.segmentId === segmentId);
  }
  
  if (destinationId) {
    results = results.filter(a => a.destinationId === destinationId);
  }
  
  if (enabled !== undefined) {
    results = results.filter(a => a.enabled === enabled);
  }
  
  return results
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

function executeActivation(id) {
  const activation = activations.get(id);
  if (!activation || !activation.enabled) return null;
  
  activation.status = 'running';
  activation.lastRun = new Date().toISOString();
  activation.totalRuns++;
  
  const destination = destinations.get(activation.destinationId);
  if (!destination) {
    activation.status = 'failed';
    logSync({ activationId: id, status: 'failed', error: 'Destination not found' });
    activations.set(id, activation);
    return activation;
  }
  
  // Simulate syncing segment members to destination
  const result = syncToDestination(activation, destination);
  
  activation.status = result.success ? 'completed' : 'failed';
  activation.totalRecordsSynced += result.recordsSynced;
  activation.nextRun = activation.schedule ? calculateNextRun(activation.schedule) : null;
  
  // Update destination stats
  destination.lastSync = new Date().toISOString();
  destination.totalSyncs++;
  destination.totalRecords += result.recordsSynced;
  destination.errorCount += result.errors;
  destinations.set(destination.id, destination);
  
  activations.set(id, activation);
  
  logSync({
    activationId: id,
    destinationId: destination.id,
    status: activation.status,
    recordsSynced: result.recordsSynced,
    errors: result.errors
  });
  
  return activation;
}

function syncToDestination(activation, destination) {
  // Simulate fetching segment members
  const memberCount = Math.floor(Math.random() * 5000) + 1000;
  
  // Apply mapping and sync
  const recordsSynced = Math.floor(memberCount * 0.95); // 95% success rate
  const errors = memberCount - recordsSynced;
  
  return {
    success: errors < memberCount * 0.1, // Success if <10% error rate
    recordsSynced,
    errors
  };
}

function pauseActivation(id) {
  const activation = activations.get(id);
  if (!activation) return null;
  
  activation.enabled = false;
  activation.status = 'paused';
  activation.updatedAt = new Date().toISOString();
  activations.set(id, activation);
  
  return activation;
}

function resumeActivation(id) {
  const activation = activations.get(id);
  if (!activation) return null;
  
  activation.enabled = true;
  activation.status = 'pending';
  activation.updatedAt = new Date().toISOString();
  activations.set(id, activation);
  
  return activation;
}

function deleteActivation(id) {
  return activations.delete(id);
}

// ================================================================
// CAMPAIGN TRIGGERS
// ================================================================

function createCampaign({ name, type, trigger, actions, enabled = true }) {
  const id = `campaign_${Date.now()}_${++campaignCounter}`;
  
  const campaign = {
    id,
    name,
    type, // 'welcome', 'abandoned_cart', 'win_back', 'upsell', 'event_based'
    trigger, // { event: 'user_signup', conditions: [...] }
    actions, // [{ type: 'send_email', config: {...} }, ...]
    enabled,
    status: 'active',
    stats: {
      triggered: 0,
      completed: 0,
      failed: 0
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  campaigns.set(id, campaign);
  return campaign;
}

function getCampaign(id) {
  return campaigns.get(id) || null;
}

function listCampaigns({ type, enabled, limit = 100 }) {
  let results = Array.from(campaigns.values());
  
  if (type) {
    results = results.filter(c => c.type === type);
  }
  
  if (enabled !== undefined) {
    results = results.filter(c => c.enabled === enabled);
  }
  
  return results
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);
}

function triggerCampaign(campaignId, { userId, eventData }) {
  const campaign = campaigns.get(campaignId);
  if (!campaign || !campaign.enabled) return null;
  
  campaign.stats.triggered++;
  
  // Evaluate trigger conditions
  const shouldExecute = evaluateTriggerConditions(campaign.trigger, { userId, eventData });
  
  if (!shouldExecute) {
    return { triggered: false, reason: 'Conditions not met' };
  }
  
  // Execute campaign actions
  const results = executeCampaignActions(campaign, { userId, eventData });
  
  if (results.success) {
    campaign.stats.completed++;
  } else {
    campaign.stats.failed++;
  }
  
  campaigns.set(campaignId, campaign);
  
  return {
    triggered: true,
    campaignId,
    userId,
    results
  };
}

function evaluateTriggerConditions(trigger, context) {
  // Simple condition evaluation
  if (!trigger.conditions || trigger.conditions.length === 0) return true;
  
  return trigger.conditions.every(condition => {
    const { field, operator, value } = condition;
    const fieldValue = context.eventData?.[field] || context[field];
    
    switch (operator) {
      case 'equals':
        return fieldValue === value;
      case 'greater_than':
        return Number(fieldValue) > Number(value);
      case 'less_than':
        return Number(fieldValue) < Number(value);
      case 'contains':
        return String(fieldValue).includes(value);
      default:
        return false;
    }
  });
}

function executeCampaignActions(campaign, context) {
  const actionResults = [];
  
  campaign.actions.forEach(action => {
    const result = executeAction(action, context);
    actionResults.push(result);
  });
  
  const allSuccessful = actionResults.every(r => r.success);
  
  return {
    success: allSuccessful,
    actions: actionResults
  };
}

function executeAction(action, context) {
  const { type, config } = action;
  
  switch (type) {
    case 'send_email':
      return sendEmail(context.userId, config);
    
    case 'send_sms':
      return sendSMS(context.userId, config);
    
    case 'create_task':
      return createTask(context.userId, config);
    
    case 'update_profile':
      return updateProfile(context.userId, config);
    
    case 'trigger_webhook':
      return triggerWebhook(config.webhookUrl, context);
    
    default:
      return { success: false, error: 'Unknown action type' };
  }
}

function sendEmail(userId, config) {
  // Simulate email sending
  return {
    success: true,
    action: 'send_email',
    userId,
    template: config.template,
    sentAt: new Date().toISOString()
  };
}

function sendSMS(userId, config) {
  // Simulate SMS sending
  return {
    success: true,
    action: 'send_sms',
    userId,
    message: config.message,
    sentAt: new Date().toISOString()
  };
}

function createTask(userId, config) {
  return {
    success: true,
    action: 'create_task',
    userId,
    task: config.task,
    createdAt: new Date().toISOString()
  };
}

function updateProfile(userId, config) {
  return {
    success: true,
    action: 'update_profile',
    userId,
    updates: config.updates,
    updatedAt: new Date().toISOString()
  };
}

function pauseCampaign(id) {
  const campaign = campaigns.get(id);
  if (!campaign) return null;
  
  campaign.enabled = false;
  campaign.status = 'paused';
  campaign.updatedAt = new Date().toISOString();
  campaigns.set(id, campaign);
  
  return campaign;
}

function resumeCampaign(id) {
  const campaign = campaigns.get(id);
  if (!campaign) return null;
  
  campaign.enabled = true;
  campaign.status = 'active';
  campaign.updatedAt = new Date().toISOString();
  campaigns.set(id, campaign);
  
  return campaign;
}

function getCampaignPerformance(id) {
  const campaign = campaigns.get(id);
  if (!campaign) return null;
  
  const { stats } = campaign;
  const total = stats.triggered;
  
  return {
    campaignId: id,
    campaignName: campaign.name,
    triggered: stats.triggered,
    completed: stats.completed,
    failed: stats.failed,
    completionRate: total > 0 ? (stats.completed / total) * 100 : 0,
    failureRate: total > 0 ? (stats.failed / total) * 100 : 0
  };
}

// ================================================================
// WEBHOOK MANAGEMENT
// ================================================================

function createWebhook({ url, events, headers, secret }) {
  const id = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const webhook = {
    id,
    url,
    events, // ['segment.updated', 'profile.created', etc.]
    headers,
    secret,
    enabled: true,
    totalDeliveries: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    lastDelivery: null,
    createdAt: new Date().toISOString()
  };
  
  webhooks.set(id, webhook);
  return webhook;
}

function getWebhook(id) {
  return webhooks.get(id) || null;
}

function listWebhooks({ event, limit = 100 }) {
  let results = Array.from(webhooks.values());
  
  if (event) {
    results = results.filter(w => w.events.includes(event));
  }
  
  return results.slice(0, limit);
}

function triggerWebhook(webhookUrl, payload) {
  // Simulate webhook delivery
  const success = Math.random() > 0.05; // 95% success rate
  
  return {
    success,
    url: webhookUrl,
    payload,
    statusCode: success ? 200 : 500,
    deliveredAt: new Date().toISOString()
  };
}

function deliverWebhook(id, event, payload) {
  const webhook = webhooks.get(id);
  if (!webhook || !webhook.enabled) return null;
  
  if (!webhook.events.includes(event)) {
    return { delivered: false, reason: 'Event not subscribed' };
  }
  
  webhook.totalDeliveries++;
  
  const result = triggerWebhook(webhook.url, {
    event,
    payload,
    timestamp: new Date().toISOString()
  });
  
  if (result.success) {
    webhook.successfulDeliveries++;
  } else {
    webhook.failedDeliveries++;
  }
  
  webhook.lastDelivery = new Date().toISOString();
  webhooks.set(id, webhook);
  
  return {
    delivered: true,
    webhookId: id,
    result
  };
}

function deleteWebhook(id) {
  return webhooks.delete(id);
}

// ================================================================
// SYNC LOGGING
// ================================================================

function logSync(log) {
  const syncLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...log,
    timestamp: new Date().toISOString()
  };
  
  syncLogs.push(syncLog);
  
  // Keep only last 10000 logs
  if (syncLogs.length > 10000) {
    syncLogs.shift();
  }
  
  return syncLog;
}

function getSyncLogs({ activationId, destinationId, status, limit = 100 }) {
  let logs = [...syncLogs];
  
  if (activationId) {
    logs = logs.filter(l => l.activationId === activationId);
  }
  
  if (destinationId) {
    logs = logs.filter(l => l.destinationId === destinationId);
  }
  
  if (status) {
    logs = logs.filter(l => l.status === status);
  }
  
  return logs
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

// ================================================================
// ACTIVATION ANALYTICS
// ================================================================

function getActivationMetrics({ startDate, endDate }) {
  let logs = [...syncLogs];
  
  if (startDate) {
    logs = logs.filter(l => new Date(l.timestamp) >= new Date(startDate));
  }
  
  if (endDate) {
    logs = logs.filter(l => new Date(l.timestamp) <= new Date(endDate));
  }
  
  const total = logs.length;
  const successful = logs.filter(l => l.status === 'completed').length;
  const failed = logs.filter(l => l.status === 'failed').length;
  
  const totalRecords = logs.reduce((sum, l) => sum + (l.recordsSynced || 0), 0);
  const totalErrors = logs.reduce((sum, l) => sum + (l.errors || 0), 0);
  
  return {
    totalSyncs: total,
    successful,
    failed,
    successRate: total > 0 ? (successful / total) * 100 : 0,
    totalRecords,
    totalErrors,
    errorRate: totalRecords > 0 ? (totalErrors / totalRecords) * 100 : 0
  };
}

function getDestinationPerformance(destinationId) {
  const destination = destinations.get(destinationId);
  if (!destination) return null;
  
  const logs = syncLogs.filter(l => l.destinationId === destinationId);
  const successful = logs.filter(l => l.status === 'completed').length;
  
  return {
    destinationId,
    destinationName: destination.name,
    destinationType: destination.type,
    totalSyncs: destination.totalSyncs,
    totalRecords: destination.totalRecords,
    errorCount: destination.errorCount,
    lastSync: destination.lastSync,
    successRate: logs.length > 0 ? (successful / logs.length) * 100 : 0
  };
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Destinations
  createDestination,
  getDestination,
  listDestinations,
  updateDestination,
  testDestination,
  
  // Activations
  createActivation,
  getActivation,
  listActivations,
  executeActivation,
  pauseActivation,
  resumeActivation,
  deleteActivation,
  
  // Campaigns
  createCampaign,
  getCampaign,
  listCampaigns,
  triggerCampaign,
  pauseCampaign,
  resumeCampaign,
  getCampaignPerformance,
  
  // Webhooks
  createWebhook,
  getWebhook,
  listWebhooks,
  deliverWebhook,
  deleteWebhook,
  
  // Logging & Analytics
  logSync,
  getSyncLogs,
  getActivationMetrics,
  getDestinationPerformance,
  
  // Data stores
  activations,
  destinations,
  campaigns,
  syncLogs,
  webhooks
};
