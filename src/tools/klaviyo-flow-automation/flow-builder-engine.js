// ================================================================
// KLAVIYO FLOW AUTOMATION - FLOW BUILDER ENGINE
// ================================================================
// Handles flow templates, builder, triggers, actions, and campaigns
// ================================================================

const crypto = require('crypto');

// In-memory stores
const flows = new Map();
const templates = new Map();
const triggers = new Map();
const actions = new Map();
const campaigns = new Map();

// ================================================================
// FLOW TEMPLATES
// ================================================================

function listFlowTemplates(filter = {}) {
  let results = Array.from(templates.values());
  
  if (filter.category) {
    results = results.filter(t => t.category === filter.category);
  }
  if (filter.channel) {
    results = results.filter(t => t.channels && t.channels.includes(filter.channel));
  }
  
  return results;
}

function createFlowTemplate(data) {
  const template = {
    id: `TMPL-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'Untitled Template',
    category: data.category || 'general',
    description: data.description || '',
    channels: data.channels || ['email'],
    nodes: data.nodes || [],
    edges: data.edges || [],
    variables: data.variables || [],
    estimatedRevenue: data.estimatedRevenue || 0,
    difficulty: data.difficulty || 'beginner',
    usageCount: 0,
    rating: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  templates.set(template.id, template);
  return template;
}

function getFlowTemplate(id) {
  return templates.get(id);
}

function updateFlowTemplate(id, updates) {
  const template = templates.get(id);
  if (!template) return null;
  
  Object.assign(template, updates, { updatedAt: Date.now() });
  templates.set(id, template);
  return template;
}

function deleteFlowTemplate(id) {
  return templates.delete(id);
}

function cloneFlowTemplate(id, newName) {
  const template = templates.get(id);
  if (!template) return null;
  
  const cloned = {
    ...template,
    id: `TMPL-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: newName || `${template.name} (Copy)`,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  templates.set(cloned.id, cloned);
  return cloned;
}

// ================================================================
// FLOW BUILDER
// ================================================================

function listFlows(filter = {}) {
  let results = Array.from(flows.values());
  
  if (filter.status) {
    results = results.filter(f => f.status === filter.status);
  }
  if (filter.category) {
    results = results.filter(f => f.category === filter.category);
  }
  
  return results;
}

function createFlow(data) {
  const flow = {
    id: `FLOW-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'Untitled Flow',
    description: data.description || '',
    category: data.category || 'general',
    status: 'draft',
    templateId: data.templateId || null,
    nodes: data.nodes || [],
    edges: data.edges || [],
    triggers: data.triggers || [],
    variables: data.variables || {},
    settings: {
      timezone: data.timezone || 'UTC',
      throttle: data.throttle || null,
      scheduling: data.scheduling || null
    },
    stats: {
      triggered: 0,
      completed: 0,
      conversions: 0,
      revenue: 0
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: data.createdBy || 'system',
    lastEditedBy: data.lastEditedBy || 'system'
  };
  
  flows.set(flow.id, flow);
  return flow;
}

function getFlow(id) {
  return flows.get(id);
}

function updateFlow(id, updates) {
  const flow = flows.get(id);
  if (!flow) return null;
  
  Object.assign(flow, updates, { 
    updatedAt: Date.now(),
    lastEditedBy: updates.lastEditedBy || flow.lastEditedBy
  });
  flows.set(id, flow);
  return flow;
}

function deleteFlow(id) {
  return flows.delete(id);
}

function cloneFlow(id, newName) {
  const flow = flows.get(id);
  if (!flow) return null;
  
  const cloned = {
    ...flow,
    id: `FLOW-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: newName || `${flow.name} (Copy)`,
    status: 'draft',
    stats: { triggered: 0, completed: 0, conversions: 0, revenue: 0 },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  flows.set(cloned.id, cloned);
  return cloned;
}

function activateFlow(id) {
  const flow = flows.get(id);
  if (!flow) return null;
  
  flow.status = 'active';
  flow.activatedAt = Date.now();
  flow.updatedAt = Date.now();
  flows.set(id, flow);
  return flow;
}

function pauseFlow(id) {
  const flow = flows.get(id);
  if (!flow) return null;
  
  flow.status = 'paused';
  flow.pausedAt = Date.now();
  flow.updatedAt = Date.now();
  flows.set(id, flow);
  return flow;
}

function archiveFlow(id) {
  const flow = flows.get(id);
  if (!flow) return null;
  
  flow.status = 'archived';
  flow.archivedAt = Date.now();
  flow.updatedAt = Date.now();
  flows.set(id, flow);
  return flow;
}

function validateFlow(id) {
  const flow = flows.get(id);
  if (!flow) return { valid: false, errors: ['Flow not found'] };
  
  const errors = [];
  
  if (!flow.name || flow.name.length < 3) {
    errors.push('Flow name must be at least 3 characters');
  }
  
  if (!flow.triggers || flow.triggers.length === 0) {
    errors.push('Flow must have at least one trigger');
  }
  
  if (!flow.nodes || flow.nodes.length === 0) {
    errors.push('Flow must have at least one node');
  }
  
  // Check for orphaned nodes
  const nodeIds = new Set(flow.nodes.map(n => n.id));
  const connectedNodes = new Set();
  flow.edges?.forEach(edge => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });
  
  const orphanedNodes = flow.nodes.filter(n => !connectedNodes.has(n.id) && n.type !== 'trigger');
  if (orphanedNodes.length > 0) {
    errors.push(`${orphanedNodes.length} orphaned node(s) detected`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
    suggestions: orphanedNodes.length > 0 ? ['Connect all nodes or remove orphaned nodes'] : []
  };
}

// ================================================================
// TRIGGERS
// ================================================================

function listTriggers(filter = {}) {
  let results = Array.from(triggers.values());
  
  if (filter.type) {
    results = results.filter(t => t.type === filter.type);
  }
  if (filter.enabled !== undefined) {
    results = results.filter(t => t.enabled === filter.enabled);
  }
  
  return results;
}

function createTrigger(data) {
  const trigger = {
    id: `TRIG-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'New Trigger',
    type: data.type || 'event',
    event: data.event || null,
    conditions: data.conditions || [],
    scheduleType: data.scheduleType || 'immediate',
    delay: data.delay || { value: 0, unit: 'minutes' },
    enabled: data.enabled !== false,
    flowId: data.flowId || null,
    stats: {
      fired: 0,
      lastFired: null
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  triggers.set(trigger.id, trigger);
  return trigger;
}

function getTrigger(id) {
  return triggers.get(id);
}

function updateTrigger(id, updates) {
  const trigger = triggers.get(id);
  if (!trigger) return null;
  
  Object.assign(trigger, updates, { updatedAt: Date.now() });
  triggers.set(id, trigger);
  return trigger;
}

function deleteTrigger(id) {
  return triggers.delete(id);
}

function testTrigger(id, testData) {
  const trigger = triggers.get(id);
  if (!trigger) return null;
  
  // Simulate trigger evaluation
  const result = {
    triggerId: id,
    triggered: true,
    conditions: trigger.conditions.map(c => ({
      condition: c,
      met: Math.random() > 0.2 // Simulate 80% success rate
    })),
    testData,
    timestamp: Date.now()
  };
  
  result.triggered = result.conditions.every(c => c.met);
  return result;
}

// ================================================================
// ACTIONS
// ================================================================

function listActions(filter = {}) {
  let results = Array.from(actions.values());
  
  if (filter.type) {
    results = results.filter(a => a.type === filter.type);
  }
  if (filter.channel) {
    results = results.filter(a => a.channel === filter.channel);
  }
  
  return results;
}

function createAction(data) {
  const action = {
    id: `ACT-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'New Action',
    type: data.type || 'send-email',
    channel: data.channel || 'email',
    template: data.template || null,
    content: data.content || {},
    config: data.config || {},
    flowId: data.flowId || null,
    stats: {
      executed: 0,
      succeeded: 0,
      failed: 0,
      lastExecuted: null
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  actions.set(action.id, action);
  return action;
}

function getAction(id) {
  return actions.get(id);
}

function updateAction(id, updates) {
  const action = actions.get(id);
  if (!action) return null;
  
  Object.assign(action, updates, { updatedAt: Date.now() });
  actions.set(id, action);
  return action;
}

function deleteAction(id) {
  return actions.delete(id);
}

function testAction(id, testData) {
  const action = actions.get(id);
  if (!action) return null;
  
  // Simulate action execution
  const success = Math.random() > 0.1; // 90% success rate
  return {
    actionId: id,
    success,
    testData,
    output: success ? { delivered: true, messageId: `MSG-${crypto.randomBytes(4).toString('hex')}` } : { error: 'Simulated failure' },
    timestamp: Date.now()
  };
}

// ================================================================
// CAMPAIGNS
// ================================================================

function listCampaigns(filter = {}) {
  let results = Array.from(campaigns.values());
  
  if (filter.status) {
    results = results.filter(c => c.status === filter.status);
  }
  if (filter.type) {
    results = results.filter(c => c.type === filter.type);
  }
  
  return results;
}

function createCampaign(data) {
  const campaign = {
    id: `CAMP-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'New Campaign',
    type: data.type || 'one-time',
    flowIds: data.flowIds || [],
    status: 'draft',
    schedule: data.schedule || null,
    targeting: data.targeting || {},
    budget: data.budget || null,
    stats: {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
      revenue: 0
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  campaigns.set(campaign.id, campaign);
  return campaign;
}

function getCampaign(id) {
  return campaigns.get(id);
}

function updateCampaign(id, updates) {
  const campaign = campaigns.get(id);
  if (!campaign) return null;
  
  Object.assign(campaign, updates, { updatedAt: Date.now() });
  campaigns.set(id, campaign);
  return campaign;
}

function deleteCampaign(id) {
  return campaigns.delete(id);
}

function launchCampaign(id) {
  const campaign = campaigns.get(id);
  if (!campaign) return null;
  
  campaign.status = 'active';
  campaign.launchedAt = Date.now();
  campaign.updatedAt = Date.now();
  campaigns.set(id, campaign);
  return campaign;
}

function pauseCampaign(id) {
  const campaign = campaigns.get(id);
  if (!campaign) return null;
  
  campaign.status = 'paused';
  campaign.pausedAt = Date.now();
  campaign.updatedAt = Date.now();
  campaigns.set(id, campaign);
  return campaign;
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Flow Templates
  listFlowTemplates,
  createFlowTemplate,
  getFlowTemplate,
  updateFlowTemplate,
  deleteFlowTemplate,
  cloneFlowTemplate,
  
  // Flow Builder
  listFlows,
  createFlow,
  getFlow,
  updateFlow,
  deleteFlow,
  cloneFlow,
  activateFlow,
  pauseFlow,
  archiveFlow,
  validateFlow,
  
  // Triggers
  listTriggers,
  createTrigger,
  getTrigger,
  updateTrigger,
  deleteTrigger,
  testTrigger,
  
  // Actions
  listActions,
  createAction,
  getAction,
  updateAction,
  deleteAction,
  testAction,
  
  // Campaigns
  listCampaigns,
  createCampaign,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  launchCampaign,
  pauseCampaign
};
