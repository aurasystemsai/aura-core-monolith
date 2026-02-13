/**
 * Advanced Features Engine for AB Testing Suite
 * 
 * Enterprise features for governance and collaboration:
 * - Version control for experiments
 * - Template library for common test patterns
 * - Compliance and governance rules
 * - Audit logging and history
 * - Backup and restore
 * - Team collaboration and approvals
 * - Experiment scheduling
 * - Cost tracking and budgeting
 */

// In-memory stores
const versions = new Map();
const templates = new Map();
const complianceRules = new Map();
const auditLogs = new Map();
const backups = new Map();
const approvals = new Map();
const schedules = new Map();
const budgets = new Map();

// ==================== VERSION CONTROL ====================

/**
 * Create version snapshot of experiment
 */
function createVersion(experimentId, experiment, message = '') {
  const versionId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Get previous version for comparison
  const previousVersions = Array.from(versions.values())
    .filter(v => v.experimentId === experimentId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  const versionNumber = previousVersions.length + 1;
  const previousVersion = previousVersions[0];
  
  const version = {
    id: versionId,
    experimentId,
    versionNumber,
    snapshot: JSON.parse(JSON.stringify(experiment)), // Deep clone
    message,
    changes: previousVersion ? calculateChanges(previousVersion.snapshot, experiment) : [],
    createdBy: experiment.owner || 'system',
    createdAt: new Date().toISOString()
  };
  
  versions.set(versionId, version);
  
  // Add to audit log
  logAudit({
    action: 'version_created',
    entityType: 'experiment',
    entityId: experimentId,
    versionId,
    message
  });
  
  return version;
}

/**
 * Get version history for experiment
 */
function getVersionHistory(experimentId) {
  return Array.from(versions.values())
    .filter(v => v.experimentId === experimentId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Compare two versions
 */
function compareVersions(versionId1, versionId2) {
  const v1 = versions.get(versionId1);
  const v2 = versions.get(versionId2);
  
  if (!v1 || !v2) throw new Error('Version not found');
  
  const changes = calculateChanges(v1.snapshot, v2.snapshot);
  
  return {
    from: { id: versionId1, version: v1.versionNumber, date: v1.createdAt },
    to: { id: versionId2, version: v2.versionNumber, date: v2.createdAt },
    changes
  };
}

/**
 * Restore experiment to previous version
 */
function restoreVersion(experimentId, versionId) {
  const version = versions.get(versionId);
  if (!version || version.experimentId !== experimentId) {
    throw new Error('Version not found');
  }
  
  // Create backup of current state before restore
  const backupId = createBackup(experimentId, 'pre-restore-backup');
  
  // Restore snapshot
  const restoredExperiment = JSON.parse(JSON.stringify(version.snapshot));
  restoredExperiment.restoredFrom = versionId;
  restoredExperiment.restoredAt = new Date().toISOString();
  
  // Create new version for the restore
  createVersion(experimentId, restoredExperiment, `Restored from version ${version.versionNumber}`);
  
  logAudit({
    action: 'version_restored',
    entityType: 'experiment',
    entityId: experimentId,
    versionId,
    backupId
  });
  
  return restoredExperiment;
}

/**
 * Calculate changes between two objects
 */
function calculateChanges(oldObj, newObj, path = '') {
  const changes = [];
  
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  
  allKeys.forEach(key => {
    const currentPath = path ? `${path}.${key}` : key;
    const oldValue = oldObj[key];
    const newValue = newObj[key];
    
    if (oldValue === undefined && newValue !== undefined) {
      changes.push({ type: 'added', path: currentPath, value: newValue });
    } else if (oldValue !== undefined && newValue === undefined) {
      changes.push({ type: 'removed', path: currentPath, value: oldValue });
    } else if (typeof oldValue === 'object' && typeof newValue === 'object' && oldValue !== null && newValue !== null) {
      changes.push(...calculateChanges(oldValue, newValue, currentPath));
    } else if (oldValue !== newValue) {
      changes.push({ type: 'modified', path: currentPath, oldValue, newValue });
    }
  });
  
  return changes;
}

// ==================== TEMPLATE LIBRARY ====================

/**
 * Create experiment template
 */
function createTemplate(config) {
  const {
    name,
    description,
    category, // 'pricing', 'ui', 'messaging', 'flow', 'feature'
    baseExperiment,
    variables = {}, // Placeholders to be filled
    tags = []
  } = config;
  
  const templateId = `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const template = {
    id: templateId,
    name,
    description,
    category,
    baseExperiment,
    variables,
    tags,
    useCount: 0,
    createdAt: new Date().toISOString()
  };
  
  templates.set(templateId, template);
  
  return template;
}

/**
 * List templates by category
 */
function listTemplates(category = null, tags = []) {
  let results = Array.from(templates.values());
  
  if (category) {
    results = results.filter(t => t.category === category);
  }
  
  if (tags.length > 0) {
    results = results.filter(t => tags.some(tag => t.tags.includes(tag)));
  }
  
  return results.sort((a, b) => b.useCount - a.useCount);
}

/**
 * Apply template to create new experiment
 */
function applyTemplate(templateId, variableValues = {}) {
  const template = templates.get(templateId);
  if (!template) throw new Error('Template not found');
  
  // Clone base experiment
  let experiment = JSON.parse(JSON.stringify(template.baseExperiment));
  
  // Replace variables
  experiment = replaceVariables(experiment, template.variables, variableValues);
  
  // Update metadata
  experiment.createdFromTemplate = templateId;
  experiment.createdAt = new Date().toISOString();
  
  // Increment use count
  template.useCount++;
  template.lastUsed = new Date().toISOString();
  
  logAudit({
    action: 'template_applied',
    entityType: 'template',
    entityId: templateId,
    variables: variableValues
  });
  
  return experiment;
}

/**
 * Replace variables in template
 */
function replaceVariables(obj, schema, values) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => replaceVariables(item, schema, values));
  }
  
  const result = {};
  Object.keys(obj).forEach(key => {
    let value = obj[key];
    
    // Check if value is a variable placeholder
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      const varName = value.slice(2, -2);
      value = values[varName] !== undefined ? values[varName] : value;
    } else if (typeof value === 'object') {
      value = replaceVariables(value, schema, values);
    }
    
    result[key] = value;
  });
  
  return result;
}

// ==================== COMPLIANCE & GOVERNANCE ====================

/**
 * Create compliance rule
 */
function createComplianceRule(config) {
  const {
    name,
    type, // 'data-retention', 'consent', 'geographic', 'budget-limit'
    condition,
    action, // 'block', 'warn', 'require-approval'
    severity = 'medium'
  } = config;
  
  const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const rule = {
    id: ruleId,
    name,
    type,
    condition,
    action,
    severity,
    active: true,
    violations: [],
    createdAt: new Date().toISOString()
  };
  
  complianceRules.set(ruleId, rule);
  
  return rule;
}

/**
 * Check experiment against compliance rules
 */
function checkCompliance(experimentId, experiment) {
  const violations = [];
  
  complianceRules.forEach(rule => {
    if (!rule.active) return;
    
    const violated = evaluateComplianceRule(rule, experiment);
    
    if (violated) {
      violations.push({
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        action: rule.action,
        message: violated.message
      });
      
      rule.violations.push({
        experimentId,
        timestamp: new Date().toISOString(),
        details: violated.details
      });
    }
  });
  
  const result = {
    experimentId,
    compliant: violations.length === 0,
    violations,
    blockers: violations.filter(v => v.action === 'block'),
    warnings: violations.filter(v => v.action === 'warn'),
    requiresApproval: violations.some(v => v.action === 'require-approval'),
    timestamp: new Date().toISOString()
  };
  
  logAudit({
    action: 'compliance_check',
    entityType: 'experiment',
    entityId: experimentId,
    result: result.compliant ? 'passed' : 'failed',
    violations: violations.length
  });
  
  return result;
}

/**
 * Evaluate single compliance rule
 */
function evaluateComplianceRule(rule, experiment) {
  switch (rule.type) {
    case 'data-retention':
      if (experiment.endDate) {
        const endDate = new Date(experiment.endDate);
        const maxRetention = new Date();
        maxRetention.setDate(maxRetention.getDate() + rule.condition.maxDays);
        
        if (endDate > maxRetention) {
          return {
            message: `Experiment duration exceeds maximum data retention period (${rule.condition.maxDays} days)`,
            details: { endDate: experiment.endDate, maxDate: maxRetention.toISOString() }
          };
        }
      }
      break;
      
    case 'consent':
      if (!experiment.consentRequired && rule.condition.requiredFor.includes(experiment.type)) {
        return {
          message: 'User consent is required for this type of experiment',
          details: { experimentType: experiment.type }
        };
      }
      break;
      
    case 'geographic':
      if (experiment.targetAudience?.countries) {
        const blockedCountries = rule.condition.blockedCountries || [];
        const hasBlocked = experiment.targetAudience.countries.some(c => blockedCountries.includes(c));
        
        if (hasBlocked) {
          return {
            message: 'Experiment targets blocked geographic regions',
            details: { targetedCountries: experiment.targetAudience.countries }
          };
        }
      }
      break;
      
    case 'budget-limit':
      if (experiment.estimatedCost > rule.condition.maxCost) {
        return {
          message: `Estimated cost exceeds budget limit ($${rule.condition.maxCost})`,
          details: { estimatedCost: experiment.estimatedCost }
        };
      }
      break;
  }
  
  return null;
}

// ==================== AUDIT LOGGING ====================

/**
 * Log audit event
 */
function logAudit(event) {
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const entry = {
    id: auditId,
    timestamp: new Date().toISOString(),
    ...event
  };
  
  auditLogs.set(auditId, entry);
  
  return entry;
}

/**
 * Get audit logs
 */
function getAuditLogs(filters = {}) {
  let logs = Array.from(auditLogs.values());
  
  if (filters.entityType) {
    logs = logs.filter(l => l.entityType === filters.entityType);
  }
  
  if (filters.entityId) {
    logs = logs.filter(l => l.entityId === filters.entityId);
  }
  
  if (filters.action) {
    logs = logs.filter(l => l.action === filters.action);
  }
  
  if (filters.startDate) {
    logs = logs.filter(l => new Date(l.timestamp) >= new Date(filters.startDate));
  }
  
  if (filters.endDate) {
    logs = logs.filter(l => new Date(l.timestamp) <= new Date(filters.endDate));
  }
  
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Export audit logs
 */
function exportAuditLogs(format = 'json') {
  const logs = Array.from(auditLogs.values());
  
  switch (format) {
    case 'json':
      return JSON.stringify(logs, null, 2);
    case 'csv':
      return convertLogsToCSV(logs);
    default:
      return JSON.stringify(logs);
  }
}

/**
 * Convert logs to CSV
 */
function convertLogsToCSV(logs) {
  if (logs.length === 0) return '';
  
  const headers = ['id', 'timestamp', 'action', 'entityType', 'entityId'];
  const rows = logs.map(log => 
    headers.map(h => JSON.stringify(log[h] || '')).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

// ==================== BACKUP & RESTORE ====================

/**
 * Create backup
 */
function createBackup(experimentId, description = '') {
  const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const backup = {
    id: backupId,
    experimentId,
    description,
    data: {
      versions: Array.from(versions.values()).filter(v => v.experimentId === experimentId),
      auditLogs: Array.from(auditLogs.values()).filter(l => l.entityId === experimentId)
    },
    createdAt: new Date().toISOString()
  };
  
  backups.set(backupId, backup);
  
  logAudit({
    action: 'backup_created',
    entityType: 'experiment',
    entityId: experimentId,
    backupId
  });
  
  return backupId;
}

/**
 * Restore from backup
 */
function restoreBackup(backupId) {
  const backup = backups.get(backupId);
  if (!backup) throw new Error('Backup not found');
  
  // Restore versions
  backup.data.versions.forEach(version => {
    versions.set(version.id, version);
  });
  
  logAudit({
    action: 'backup_restored',
    entityType: 'experiment',
    entityId: backup.experimentId,
    backupId
  });
  
  return {
    experimentId: backup.experimentId,
    versionsRestored: backup.data.versions.length,
    restoredAt: new Date().toISOString()
  };
}

/**
 * List backups
 */
function listBackups(experimentId = null) {
  let results = Array.from(backups.values());
  
  if (experimentId) {
    results = results.filter(b => b.experimentId === experimentId);
  }
  
  return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// ==================== APPROVALS ====================

/**
 * Request approval for experiment
 */
function requestApproval(experimentId, config) {
  const {
    requester,
    approvers = [],
    reason = '',
    metadata = {}
  } = config;
  
  const approvalId = `appr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const approval = {
    id: approvalId,
    experimentId,
    requester,
    approvers: approvers.map(a => ({
      userId: a,
      status: 'pending',
      respondedAt: null,
      comments: ''
    })),
    reason,
    metadata,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  approvals.set(approvalId, approval);
  
  logAudit({
    action: 'approval_requested',
    entityType: 'experiment',
    entityId: experimentId,
    approvalId,
    approvers
  });
  
  return approval;
}

/**
 * Respond to approval request
 */
function respondToApproval(approvalId, userId, response) {
  const approval = approvals.get(approvalId);
  if (!approval) throw new Error('Approval not found');
  
  const approver = approval.approvers.find(a => a.userId === userId);
  if (!approver) throw new Error('User not in approvers list');
  
  approver.status = response.approved ? 'approved' : 'rejected';
  approver.respondedAt = new Date().toISOString();
  approver.comments = response.comments || '';
  
  // Update overall status
  const allResponded = approval.approvers.every(a => a.status !== 'pending');
  const anyRejected = approval.approvers.some(a => a.status === 'rejected');
  
  if (anyRejected) {
    approval.status = 'rejected';
  } else if (allResponded) {
    approval.status = 'approved';
  }
  
  logAudit({
    action: 'approval_responded',
    entityType: 'approval',
    entityId: approvalId,
    userId,
    response: approver.status
  });
  
  return approval;
}

// ==================== SCHEDULING ====================

/**
 * Schedule experiment
 */
function scheduleExperiment(experimentId, schedule) {
  const {
    startAt,
    endAt,
    recurrence = null, // 'daily', 'weekly', 'monthly'
    timezone = 'UTC'
  } = schedule;
  
  const scheduleId = `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const scheduledExperiment = {
    id: scheduleId,
    experimentId,
    startAt,
    endAt,
    recurrence,
    timezone,
    status: 'scheduled',
    executions: [],
    createdAt: new Date().toISOString()
  };
  
  schedules.set(scheduleId, scheduledExperiment);
  
  logAudit({
    action: 'experiment_scheduled',
    entityType: 'experiment',
    entityId: experimentId,
    scheduleId,
    startAt,
    endAt
  });
  
  return scheduledExperiment;
}

/**
 * Execute scheduled experiment
 */
function executeScheduledExperiment(scheduleId) {
  const schedule = schedules.get(scheduleId);
  if (!schedule) throw new Error('Schedule not found');
  
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const execution = {
    id: executionId,
    scheduleId,
    status: 'running',
    startedAt: new Date().toISOString(),
    completedAt: null
  };
  
  schedule.executions.push(execution);
  schedule.status = 'running';
  
  logAudit({
    action: 'scheduled_experiment_executed',
    entityType: 'schedule',
    entityId: scheduleId,
    executionId
  });
  
  return execution;
}

// ==================== COST TRACKING ====================

/**
 * Track experiment costs
 */
function trackCost(experimentId, cost) {
  const {
    amount,
    currency = 'USD',
    category, // 'infrastructure', 'traffic', 'analysis', 'personnel'
    description = ''
  } = cost;
  
  if (!budgets.has(experimentId)) {
    budgets.set(experimentId, {
      experimentId,
      totalCost: 0,
      costs: [],
      createdAt: new Date().toISOString()
    });
  }
  
  const budget = budgets.get(experimentId);
  
  const costEntry = {
    amount,
    currency,
    category,
    description,
    timestamp: new Date().toISOString()
  };
  
  budget.costs.push(costEntry);
  budget.totalCost += amount;
  budget.lastUpdated = new Date().toISOString();
  
  logAudit({
    action: 'cost_tracked',
    entityType: 'experiment',
    entityId: experimentId,
    amount,
    category
  });
  
  return budget;
}

/**
 * Get cost summary
 */
function getCostSummary(experimentId) {
  const budget = budgets.get(experimentId);
  if (!budget) return null;
  
  const byCategory = {};
  budget.costs.forEach(cost => {
    if (!byCategory[cost.category]) {
      byCategory[cost.category] = 0;
    }
    byCategory[cost.category] += cost.amount;
  });
  
  return {
    experimentId,
    totalCost: budget.totalCost,
    currency: budget.costs[0]?.currency || 'USD',
    byCategory,
    costCount: budget.costs.length,
    averageCost: budget.totalCost / budget.costs.length
  };
}

// ==================== PUBLIC API ====================

module.exports = {
  // Version control
  createVersion,
  getVersionHistory,
  compareVersions,
  restoreVersion,
  
  // Templates
  createTemplate,
  listTemplates,
  applyTemplate,
  
  // Compliance
  createComplianceRule,
  checkCompliance,
  
  // Audit logging
  logAudit,
  getAuditLogs,
  exportAuditLogs,
  
  // Backup & restore
  createBackup,
  restoreBackup,
  listBackups,
  
  // Approvals
  requestApproval,
  respondToApproval,
  
  // Scheduling
  scheduleExperiment,
  executeScheduledExperiment,
  
  // Cost tracking
  trackCost,
  getCostSummary,
  
  // Stores
  versions,
  templates,
  complianceRules,
  auditLogs,
  backups,
  approvals,
  schedules,
  budgets
};
