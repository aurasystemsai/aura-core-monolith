// ================================================================
// RULES & AUTOMATION ENGINE
// ================================================================
// Handles rule building, automated workflows, scheduled pricing,
// conditional pricing, and bulk operations
// ================================================================

const db = require('./db');

// In-memory stores
const workflows = new Map();
const scheduledPrices = new Map();
const conditionalRules = new Map();
const bulkOperations = [];

let workflowIdCounter = 1;
let scheduleIdCounter = 1;
let conditionalIdCounter = 1;
let bulkOpIdCounter = 1;

// ================================================================
// RULE BUILDER
// ================================================================

function buildRule(ruleConfig) {
  const {
    name,
    description,
    conditions,
    actions,
    priority,
    enabled
  } = ruleConfig;
  
  const rule = {
    id: db.list().length + 1,
    name: name || 'New Rule',
    description: description || '',
    scope: 'global',
    conditions: conditions || [],
    actions: actions || [],
    priority: priority || 0,
    enabled: enabled !== false,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString()
  };
  
  const created = db.create(rule);
  return created;
}

function validateRuleLogic(rule) {
  const errors = [];
  
  if (!rule.name || rule.name.trim() === '') {
    errors.push('Rule name is required');
  }
  
  if (!rule.conditions || rule.conditions.length === 0) {
    errors.push('At least one condition is required');
  }
  
  if (!rule.actions || rule.actions.length === 0) {
    errors.push('At least one action is required');
  }
  
  // Validate condition structure
  rule.conditions?.forEach((condition, i) => {
    if (!condition.field) {
      errors.push(`Condition ${i + 1}: field is required`);
    }
    if (!condition.operator) {
      errors.push(`Condition ${i + 1}: operator is required`);
    }
  });
  
  // Validate action structure
  rule.actions?.forEach((action, i) => {
    if (!action.type) {
      errors.push(`Action ${i + 1}: type is required`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

function testRule(ruleId, testData) {
  const rule = db.get(Number(ruleId));
  if (!rule) return { success: false, error: 'Rule not found' };
  
  // Simulate rule execution
  const conditionsMet = rule.conditions.every(condition => {
    // Simple condition evaluation
    return true; // Simplified for demo
  });
  
  return {
    ruleId,
    conditionsMet,
    actionsExecuted: conditionsMet ? rule.actions.length : 0,
    result: conditionsMet ? 'Rule would be applied' : 'Rule would not be applied',
    testData
  };
}

function cloneRule(ruleId) {
  const rule = db.get(Number(ruleId));
  if (!rule) return null;
  
  const cloned = {
    ...rule,
    id: undefined,
    name: rule.name + ' (Copy)',
    createdAt: new Date().toISOString()
  };
  
  return db.create(cloned);
}

// ================================================================
// AUTOMATED WORKFLOWS
// ================================================================

function createWorkflow(workflowData) {
  const workflow = {
    id: workflowIdCounter++,
    name: workflowData.name || 'New Workflow',
    description: workflowData.description || '',
    trigger: workflowData.trigger || { type: 'manual' },
    steps: workflowData.steps || [],
    enabled: workflowData.enabled !== false,
    lastRun: null,
    nextRun: null,
    status: 'idle',
    createdAt: new Date().toISOString()
  };
  
  workflows.set(workflow.id, workflow);
  return workflow;
}

function getWorkflow(id) {
  return workflows.get(Number(id)) || null;
}

function listWorkflows(filters = {}) {
  let results = Array.from(workflows.values());
  
  if (filters.enabled !== undefined) {
    const enabled = filters.enabled === 'true' || filters.enabled === true;
    results = results.filter(w => w.enabled === enabled);
  }
  
  return results;
}

function updateWorkflow(id, updates) {
  const workflow = workflows.get(Number(id));
  if (!workflow) return null;
  
  Object.assign(workflow, updates, { updatedAt: new Date().toISOString() });
  return workflow;
}

function deleteWorkflow(id) {
  return workflows.delete(Number(id));
}

function executeWorkflow(id, context = {}) {
  const workflow = workflows.get(Number(id));
  if (!workflow) return { success: false, error: 'Workflow not found' };
  
  workflow.status = 'running';
  workflow.lastRun = new Date().toISOString();
  
  const results = [];
  
  // Simulate workflow execution
  workflow.steps.forEach((step, i) => {
    results.push({
      step: i + 1,
      name: step.name || `Step ${i + 1}`,
      status: 'completed',
      result: 'Success'
    });
  });
  
  workflow.status = 'completed';
  workflow.lastResult = {
    success: true,
    steps: results,
    completedAt: new Date().toISOString()
  };
  
  return {
    success: true,
    workflowId: id,
    results
  };
}

// ================================================================
// SCHEDULED PRICING
// ================================================================

function schedulePrice(scheduleData) {
  const schedule = {
    id: scheduleIdCounter++,
    productId: scheduleData.productId,
    productName: scheduleData.productName || 'Unknown Product',
    newPrice: scheduleData.newPrice,
    currentPrice: scheduleData.currentPrice,
    scheduledFor: scheduleData.scheduledFor,
    timezone: scheduleData.timezone || 'UTC',
    recurring: scheduleData.recurring || false,
    recurrencePattern: scheduleData.recurrencePattern || null,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    createdBy: scheduleData.createdBy || 'system'
  };
  
  scheduledPrices.set(schedule.id, schedule);
  return schedule;
}

function getScheduledPrice(id) {
  return scheduledPrices.get(Number(id)) || null;
}

function listScheduledPrices(filters = {}) {
  let results = Array.from(scheduledPrices.values());
  
  if (filters.productId) {
    results = results.filter(s => s.productId === filters.productId);
  }
  
  if (filters.status) {
    results = results.filter(s => s.status === filters.status);
  }
  
  return results;
}

function cancelScheduledPrice(id) {
  const schedule = scheduledPrices.get(Number(id));
  if (!schedule) return null;
  
  schedule.status = 'cancelled';
  schedule.cancelledAt = new Date().toISOString();
  return schedule;
}

function executeScheduledPrices() {
  const now = new Date();
  const executed = [];
  
  scheduledPrices.forEach(schedule => {
    if (schedule.status === 'scheduled' && new Date(schedule.scheduledFor) <= now) {
      schedule.status = 'executed';
      schedule.executedAt = new Date().toISOString();
      executed.push(schedule);
    }
  });
  
  return {
    executedCount: executed.length,
    executed
  };
}

// ================================================================
// CONDITIONAL PRICING
// ================================================================

function createConditionalRule(ruleData) {
  const rule = {
    id: conditionalIdCounter++,
    name: ruleData.name || 'New Conditional Rule',
    productSelector: ruleData.productSelector || { type: 'all' },
    conditions: ruleData.conditions || [],
    priceModification: ruleData.priceModification || { type: 'percentage', value: 0 },
    priority: ruleData.priority || 0,
    enabled: ruleData.enabled !== false,
    validFrom: ruleData.validFrom || null,
    validUntil: ruleData.validUntil || null,
    createdAt: new Date().toISOString()
  };
  
  conditionalRules.set(rule.id, rule);
  return rule;
}

function getConditionalRule(id) {
  return conditionalRules.get(Number(id)) || null;
}

function listConditionalRules(filters = {}) {
  let results = Array.from(conditionalRules.values());
  
  if (filters.enabled !== undefined) {
    const enabled = filters.enabled === 'true' || filters.enabled === true;
    results = results.filter(r => r.enabled === enabled);
  }
  
  return results;
}

function updateConditionalRule(id, updates) {
  const rule = conditionalRules.get(Number(id));
  if (!rule) return null;
  
  Object.assign(rule, updates, { updatedAt: new Date().toISOString() });
  return rule;
}

function deleteConditionalRule(id) {
  return conditionalRules.delete(Number(id));
}

function evaluateConditionalPricing(productData) {
  const applicableRules = Array.from(conditionalRules.values())
    .filter(rule => rule.enabled)
    .sort((a, b) => b.priority - a.priority);
  
  let finalPrice = productData.basePrice;
  const appliedRules = [];
  
  applicableRules.forEach(rule => {
    // Simple condition evaluation (placeholder)
    const conditionsMet = true; // Simplified
    
    if (conditionsMet) {
      if (rule.priceModification.type === 'percentage') {
        finalPrice *= (1 + rule.priceModification.value / 100);
      } else if (rule.priceModification.type === 'fixed') {
        finalPrice += rule.priceModification.value;
      }
      
      appliedRules.push({
        ruleId: rule.id,
        ruleName: rule.name,
        modification: rule.priceModification
      });
    }
  });
  
  return {
    productId: productData.productId,
    basePrice: productData.basePrice,
    finalPrice: Math.round(finalPrice * 100) / 100,
    appliedRules,
    rulesCount: appliedRules.length
  };
}

// ================================================================
// BULK OPERATIONS
// ================================================================

function createBulkOperation(operationData) {
  const operation = {
    id: bulkOpIdCounter++,
    type: operationData.type || 'price_update',
    productSelector: operationData.productSelector || { type: 'all' },
    modification: operationData.modification || {},
    status: 'pending',
    progress: 0,
    totalItems: operationData.totalItems || 0,
    processedItems: 0,
    errors: [],
    createdAt: new Date().toISOString(),
    createdBy: operationData.createdBy || 'system'
  };
  
  bulkOperations.push(operation);
  
  // Simulate bulk operation processing
  setTimeout(() => {
    operation.status = 'processing';
    operation.startedAt = new Date().toISOString();
  }, 500);
  
  setTimeout(() => {
    operation.progress = 50;
    operation.processedItems = Math.floor(operation.totalItems * 0.5);
  }, 2000);
  
  setTimeout(() => {
    operation.status = 'completed';
    operation.progress = 100;
    operation.processedItems = operation.totalItems;
    operation.completedAt = new Date().toISOString();
  }, 4000);
  
  return operation;
}

function getBulkOperation(id) {
  return bulkOperations.find(op => op.id === Number(id)) || null;
}

function listBulkOperations(filters = {}) {
  let results = [...bulkOperations];
  
  if (filters.status) {
    results = results.filter(op => op.status === filters.status);
  }
  
  if (filters.type) {
    results = results.filter(op => op.type === filters.type);
  }
  
  return results.slice(-50).reverse();
}

function cancelBulkOperation(id) {
  const operation = bulkOperations.find(op => op.id === Number(id));
  if (!operation) return null;
  
  operation.status = 'cancelled';
  operation.cancelledAt = new Date().toISOString();
  return operation;
}

// ================================================================
// IMPORT/EXPORT
// ================================================================

function exportRules(filters = {}) {
  const rules = db.list();
  let filtered = rules;
  
  if (filters.enabled !== undefined) {
    filtered = rules.filter(r => r.enabled === (filters.enabled === 'true' || filters.enabled === true));
  }
  
  return {
    exportedAt: new Date().toISOString(),
    count: filtered.length,
    rules: filtered
  };
}

function importRules(rulesData, options = {}) {
  const imported = [];
  const errors = [];
  
  rulesData.forEach((ruleData, i) => {
    try {
      const validation = validateRuleLogic(ruleData);
      if (!validation.valid && !options.skipValidation) {
        errors.push({
          index: i,
          rule: ruleData.name,
          errors: validation.errors
        });
        return;
      }
      
      const rule = db.create(ruleData);
      imported.push(rule);
    } catch (err) {
      errors.push({
        index: i,
        rule: ruleData.name,
        error: err.message
      });
    }
  });
  
  return {
    success: errors.length === 0,
    imported: imported.length,
    errors: errors.length,
    details: { imported, errors }
  };
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Rule Builder
  buildRule,
  validateRuleLogic,
  testRule,
  cloneRule,
  
  // Workflows
  createWorkflow,
  getWorkflow,
  listWorkflows,
  updateWorkflow,
  deleteWorkflow,
  executeWorkflow,
  
  // Scheduled Pricing
  schedulePrice,
  getScheduledPrice,
  listScheduledPrices,
  cancelScheduledPrice,
  executeScheduledPrices,
  
  // Conditional Pricing
  createConditionalRule,
  getConditionalRule,
  listConditionalRules,
  updateConditionalRule,
  deleteConditionalRule,
  evaluateConditionalPricing,
  
  // Bulk Operations
  createBulkOperation,
  getBulkOperation,
  listBulkOperations,
  cancelBulkOperation,
  
  // Import/Export
  exportRules,
  importRules
};
