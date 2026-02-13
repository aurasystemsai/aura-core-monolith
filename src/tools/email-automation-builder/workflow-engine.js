/**
 * Workflow Automation Engine - Visual workflow builder, triggers, actions
 * Part of Email Automation Builder enterprise upgrade
 */

const { v4: uuidv4 } = require('uuid');

const workflows = new Map();
const workflowTemplates = new Map();
const workflowExecutions = new Map();

//=============================================================================
// WORKFLOW MANAGEMENT
//=============================================================================

function listWorkflows(query = {}) {
  const { status, limit = 100, offset = 0 } = query;
  let list = Array.from(workflows.values());
  
  if (status) list = list.filter(w => w.status === status);
  
  return {
    workflows: list.slice(offset, offset + limit),
    total: list.length
  };
}

function getWorkflow(id) {
  return workflows.get(id) || null;
}

function createWorkflow(data) {
  const workflow = {
    id: uuidv4(),
    name: data.name || 'Untitled Workflow',
    description: data.description || '',
    status: 'inactive', // inactive, active
    triggers: data.triggers || [],
    steps: data.steps || [],
    conditions: data.conditions || [],
    goals: data.goals || [],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    createdBy: data.createdBy || 'system',
    stats: {
      executions: 0,
      completions: 0,
      failures: 0,
      goalAchievements: 0
    }
  };
  
  workflows.set(workflow.id, workflow);
  return workflow;
}

function updateWorkflow(id, updates) {
  const workflow = workflows.get(id);
  if (!workflow) return null;
  
  const updated = {
    ...workflow,
    ...updates,
    id: workflow.id,
    created: workflow.created,
    updated: new Date().toISOString(),
    stats: workflow.stats
  };
  
  workflows.set(id, updated);
  return updated;
}

function deleteWorkflow(id) {
  return workflows.delete(id);
}

function activateWorkflow(id) {
  return updateWorkflow(id, { status: 'active' });
}

function deactivateWorkflow(id) {
  return updateWorkflow(id, { status: 'inactive' });
}

function cloneWorkflow(id, newName) {
  const original = workflows.get(id);
  if (!original) return null;
  
  return createWorkflow({
    ...original,
    name: newName || `${original.name} (Copy)`,
    status: 'inactive'
  });
}

//=============================================================================
// TRIGGERS
//=============================================================================

function listStepTypes() {
  return [
    { id: 'email', name: 'Send Email', category: 'communication' },
    { id: 'sms', name: 'Send SMS', category: 'communication' },
    { id: 'wait', name: 'Wait', category: 'flow' },
    { id: 'condition', name: 'Conditional Split', category: 'flow' },
    { id: 'tag', name: 'Add Tag', category: 'data' },
    { id: 'webhook', name: 'Call Webhook', category: 'integration' },
    { id: 'goal', name: 'Track Goal', category: 'analytics' }
  ];
}

//=============================================================================
// WORKFLOW TEMPLATES
//=============================================================================

function getWorkflowTemplates() {
  return Array.from(workflowTemplates.values());
}

function createWorkflowFromTemplate(templateId) {
  const template = workflowTemplates.get(templateId);
  if (!template) return null;
  
  return createWorkflow({
    name: template.name,
    description: template.description,
    triggers: template.triggers,
    steps: template.steps,
    conditions: template.conditions
  });
}

function saveAsTemplate(workflowId, templateData) {
  const workflow = workflows.get(workflowId);
  if (!workflow) return null;
  
  const template = {
    id: uuidv4(),
    name: templateData.name || `${workflow.name} Template`,
    description: templateData.description || workflow.description,
    category: templateData.category || 'custom',
    triggers: workflow.triggers,
    steps: workflow.steps,
    conditions: workflow.conditions,
    created: new Date().toISOString(),
    createdBy: workflow.createdBy
  };
  
  workflowTemplates.set(template.id, template);
  return template;
}

//=============================================================================
// SEED DATA
//=============================================================================

function _seedDemoData() {
  // Create demo workflow
  const welcomeWorkflow = createWorkflow({
    name: 'Welcome Series',
    description: 'Automated welcome email series for new subscribers',
    triggers: [{ type: 'contact_created', conditions: [] }],
    steps: [
      { id: '1', type: 'email', config: { templateId: 'welcome-1', delay: 0 } },
      { id: '2', type: 'wait', config: { duration: 86400 } },
      { id: '3', type: 'email', config: { templateId: 'welcome-2', delay: 0 } },
      { id: '4', type: 'wait', config: { duration: 172800 } },
      { id: '5', type: 'email', config: { templateId: 'welcome-3', delay: 0 } }
    ],
    goals: [{ type: 'purchase', value: 1 }]
  });
  
  activateWorkflow(welcomeWorkflow.id);
  
  // Create template
  workflowTemplates.set('abandoned-cart', {
    id: 'abandoned-cart',
    name: 'Abandoned Cart Recovery',
    description: 'Recover abandoned carts with automated reminders',
    category: 'ecommerce',
    triggers: [{ type: 'cart_abandoned', conditions: [{ field: 'cart_value', op: '>', value: 50 }] }],
    steps: [
      { id: '1', type: 'wait', config: { duration: 3600 } },
      { id: '2', type: 'email', config: { templateId: 'cart-reminder-1' } },
      { id: '3', type: 'wait', config: { duration: 86400 } },
      { id: '4', type: 'email', config: { templateId: 'cart-reminder-2' } }
    ],
    created: new Date().toISOString(),
    createdBy: 'system'
  });
}

_seedDemoData();

module.exports = {
  listWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  activateWorkflow,
  deactivateWorkflow,
  cloneWorkflow,
  listStepTypes,
  getWorkflowTemplates,
  createWorkflowFromTemplate,
  saveAsTemplate
};
