/**
 * Blog Draft Engine - Workflow Automation Engine
 * Automates content workflows with triggers, actions, and conditional logic
 */

class WorkflowAutomationEngine {
  constructor() {
    this.workflows = new Map();
    this.triggers = new Map();
    this.actions = new Map();
    this.executions = new Map();
    this.templates = new Map();
  }

  /**
   * Create automated workflow
   */
  async createWorkflow(params) {
    const {
      name,
      description,
      trigger,
      conditions = [],
      actions = [],
      schedule = null,
      enabled = true
    } = params;

    const workflow = {
      id: this.generateId(),
      name,
      description,
      trigger: {
        type: trigger.type, // draft_created, draft_updated, draft_published, schedule, manual
        config: trigger.config || {},
        filters: trigger.filters || {}
      },
      conditions: conditions.map(condition => ({
        field: condition.field,
        operator: condition.operator, // equals, contains, greater_than, less_than, in, not_in
        value: condition.value,
        logicalOperator: condition.logicalOperator || 'AND' // AND, OR
      })),
      actions: actions.map((action, index) => ({
        id: `action_${index}`,
        type: action.type,
        config: action.config || {},
        order: index,
        continueOnError: action.continueOnError !== false
      })),
      schedule,
      enabled,
      executionCount: 0,
      lastExecuted: null,
      lastStatus: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.workflows.set(workflow.id, workflow);

    // Register trigger
    this.registerTrigger(workflow);

    return {
      success: true,
      workflow,
      message: 'Workflow created'
    };
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(workflowId, context = {}) {
    if (!this.workflows.has(workflowId)) {
      return { success: false, error: 'Workflow not found' };
    }

    const workflow = this.workflows.get(workflowId);

    if (!workflow.enabled) {
      return { success: false, error: 'Workflow is disabled' };
    }

    const execution = {
      id: this.generateId(),
      workflowId,
      status: 'running',
      context,
      results: [],
      startedAt: new Date().toISOString(),
      completedAt: null,
      error: null
    };

    this.executions.set(execution.id, execution);

    try {
      // Check conditions
      const conditionsMet = await this.evaluateConditions(workflow.conditions, context);

      if (!conditionsMet) {
        execution.status = 'skipped';
        execution.completedAt = new Date().toISOString();
        execution.results.push({
          step: 'conditions',
          success: false,
          message: 'Conditions not met'
        });

        this.executions.set(execution.id, execution);

        return {
          success: false,
          execution,
          message: 'Workflow conditions not met'
        };
      }

      // Execute actions in sequence
      for (const action of workflow.actions) {
        try {
          const result = await this.executeAction(action, context);
          
          execution.results.push({
            actionId: action.id,
            actionType: action.type,
            success: result.success,
            data: result.data,
            timestamp: new Date().toISOString()
          });

          // Update context with action results for next action
          if (result.data) {
            context = { ...context, ...result.data };
          }

          // Stop if action failed and continueOnError is false
          if (!result.success && !action.continueOnError) {
            break;
          }

        } catch (error) {
          execution.results.push({
            actionId: action.id,
            actionType: action.type,
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          });

          if (!action.continueOnError) {
            throw error;
          }
        }
      }

      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();

      // Update workflow stats
      workflow.executionCount++;
      workflow.lastExecuted = new Date().toISOString();
      workflow.lastStatus = 'success';
      this.workflows.set(workflowId, workflow);

      this.executions.set(execution.id, execution);

      return {
        success: true,
        execution,
        message: 'Workflow executed successfully'
      };

    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.completedAt = new Date().toISOString();

      workflow.lastStatus = 'failed';
      this.workflows.set(workflowId, workflow);

      this.executions.set(execution.id, execution);

      return {
        success: false,
        execution,
        error: error.message,
        message: 'Workflow execution failed'
      };
    }
  }

  /**
   * Execute single action
   */
  async executeAction(action, context) {
    switch (action.type) {
      case 'send_notification':
        return await this.sendNotification(action.config, context);
      
      case 'assign_user':
        return await this.assignUser(action.config, context);
      
      case 'update_draft':
        return await this.updateDraft(action.config, context);
      
      case 'create_task':
        return await this.createTask(action.config, context);
      
      case 'send_email':
        return await this.sendEmail(action.config, context);
      
      case 'webhook':
        return await this.callWebhook(action.config, context);
      
      case 'wait':
        return await this.wait(action.config, context);
      
      case 'conditional':
        return await this.conditionalAction(action.config, context);
      
      case 'ai_generate':
        return await this.aiGenerateContent(action.config, context);
      
      case 'publish':
        return await this.publishDraft(action.config, context);
      
      case 'schedule':
        return await this.scheduleDraft(action.config, context);
      
      case 'request_review':
        return await this.requestReview(action.config, context);
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Action implementations
   */
  async sendNotification(config, context) {
    const { recipients, message, channel = 'email' } = config;
    
    // Mock notification
    console.log(`Sending ${channel} notification to ${recipients.join(', ')}: ${message}`);
    
    return {
      success: true,
      data: { notificationSent: true, recipients: recipients.length }
    };
  }

  async assignUser(config, context) {
    const { userId, draftId = context.draftId } = config;
    
    // Mock assignment
    console.log(`Assigning draft ${draftId} to user ${userId}`);
    
    return {
      success: true,
      data: { assigned: true, userId, draftId }
    };
  }

  async updateDraft(config, context) {
    const { draftId = context.draftId, updates } = config;
    
    // Mock update
    console.log(`Updating draft ${draftId} with`, updates);
    
    return {
      success: true,
      data: { updated: true, draftId }
    };
  }

  async createTask(config, context) {
    const { title, assignee, dueDate } = config;
    
    // Mock task creation
    const taskId = this.generateId();
    console.log(`Creating task: ${title} for ${assignee}`);
    
    return {
      success: true,
      data: { taskCreated: true, taskId }
    };
  }

  async sendEmail(config, context) {
    const { to, subject, body, template } = config;
    
    // Mock email
    console.log(`Sending email to ${to}: ${subject}`);
    
    return {
      success: true,
      data: { emailSent: true, to }
    };
  }

  async callWebhook(config, context) {
    const { url, method = 'POST', headers = {}, body } = config;
    
    // Mock webhook call
    console.log(`Calling webhook: ${method} ${url}`);
    
    return {
      success: true,
      data: { webhookCalled: true, url, status: 200 }
    };
  }

  async wait(config, context) {
    const { duration } = config; // in milliseconds
    
    await new Promise(resolve => setTimeout(resolve, duration));
    
    return {
      success: true,
      data: { waited: duration }
    };
  }

  async conditionalAction(config, context) {
    const { condition, ifTrue, ifFalse } = config;
    
    const isTrue = await this.evaluateConditions([condition], context);
    const actionToExecute = isTrue ? ifTrue : ifFalse;
    
    if (actionToExecute) {
      return await this.executeAction(actionToExecute, context);
    }
    
    return {
      success: true,
      data: { conditionResult: isTrue }
    };
  }

  async aiGenerateContent(config, context) {
    const { prompt, model = 'gpt-4', draftId = context.draftId } = config;
    
    // Mock AI generation
    console.log(`Generating content with ${model} for draft ${draftId}`);
    
    return {
      success: true,
      data: { generated: true, content: 'AI generated content...' }
    };
  }

  async publishDraft(config, context) {
    const { draftId = context.draftId, channels = [] } = config;
    
    // Mock publishing
    console.log(`Publishing draft ${draftId} to ${channels.length} channels`);
    
    return {
      success: true,
      data: { published: true, draftId, channels }
    };
  }

  async scheduleDraft(config, context) {
    const { draftId = context.draftId, publishAt } = config;
    
    // Mock scheduling
    console.log(`Scheduling draft ${draftId} for ${publishAt}`);
    
    return {
      success: true,
      data: { scheduled: true, draftId, publishAt }
    };
  }

  async requestReview(config, context) {
    const { draftId = context.draftId, reviewers = [] } = config;
    
    // Mock review request
    console.log(`Requesting review for draft ${draftId} from ${reviewers.join(', ')}`);
    
    return {
      success: true,
      data: { reviewRequested: true, draftId, reviewers }
    };
  }

  /**
   * Evaluate workflow conditions
   */
  async evaluateConditions(conditions, context) {
    if (conditions.length === 0) return true;

    let result = true;
    let currentLogicalOp = 'AND';

    for (const condition of conditions) {
      const conditionMet = this.evaluateSingleCondition(condition, context);

      if (currentLogicalOp === 'AND') {
        result = result && conditionMet;
      } else {
        result = result || conditionMet;
      }

      currentLogicalOp = condition.logicalOperator || 'AND';
    }

    return result;
  }

  evaluateSingleCondition(condition, context) {
    const { field, operator, value } = condition;
    const actualValue = this.getFieldValue(context, field);

    switch (operator) {
      case 'equals':
        return actualValue === value;
      case 'not_equals':
        return actualValue !== value;
      case 'contains':
        return String(actualValue).includes(value);
      case 'not_contains':
        return !String(actualValue).includes(value);
      case 'greater_than':
        return Number(actualValue) > Number(value);
      case 'less_than':
        return Number(actualValue) < Number(value);
      case 'greater_than_or_equal':
        return Number(actualValue) >= Number(value);
      case 'less_than_or_equal':
        return Number(actualValue) <= Number(value);
      case 'in':
        return Array.isArray(value) && value.includes(actualValue);
      case 'not_in':
        return Array.isArray(value) && !value.includes(actualValue);
      case 'is_empty':
        return !actualValue || actualValue.length === 0;
      case 'is_not_empty':
        return actualValue && actualValue.length > 0;
      default:
        return false;
    }
  }

  getFieldValue(context, field) {
    // Support nested field access (e.g., "draft.metadata.status")
    return field.split('.').reduce((obj, key) => obj?.[key], context);
  }

  /**
   * Create workflow from template
   */
  async createFromTemplate(templateId, customizations = {}) {
    if (!this.templates.has(templateId)) {
      return { success: false, error: 'Template not found' };
    }

    const template = this.templates.get(templateId);
    
    const workflow = await this.createWorkflow({
      ...template,
      ...customizations,
      name: customizations.name || `${template.name} (from template)`
    });

    return workflow;
  }

  /**
   * Save workflow as template
   */
  async saveAsTemplate(workflowId, params) {
    if (!this.workflows.has(workflowId)) {
      return { success: false, error: 'Workflow not found' };
    }

    const workflow = this.workflows.get(workflowId);
    
    const template = {
      id: this.generateId(),
      name: params.name,
      description: params.description,
      category: params.category || 'custom',
      trigger: workflow.trigger,
      conditions: workflow.conditions,
      actions: workflow.actions,
      schedule: workflow.schedule,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };

    this.templates.set(template.id, template);

    return {
      success: true,
      template,
      message: 'Workflow saved as template'
    };
  }

  /**
   * Bulk operations
   */
  async pauseWorkflow(workflowId) {
    if (!this.workflows.has(workflowId)) {
      return { success: false, error: 'Workflow not found' };
    }

    const workflow = this.workflows.get(workflowId);
    workflow.enabled = false;
    workflow.updatedAt = new Date().toISOString();
    this.workflows.set(workflowId, workflow);

    return {
      success: true,
      workflow,
      message: 'Workflow paused'
    };
  }

  async resumeWorkflow(workflowId) {
    if (!this.workflows.has(workflowId)) {
      return { success: false, error: 'Workflow not found' };
    }

    const workflow = this.workflows.get(workflowId);
    workflow.enabled = true;
    workflow.updatedAt = new Date().toISOString();
    this.workflows.set(workflowId, workflow);

    return {
      success: true,
      workflow,
      message: 'Workflow resumed'
    };
  }

  async deleteWorkflow(workflowId) {
    if (!this.workflows.has(workflowId)) {
      return { success: false, error: 'Workflow not found' };
    }

    this.workflows.delete(workflowId);

    return {
      success: true,
      message: 'Workflow deleted'
    };
  }

  /**
   * Get workflow execution history
   */
  async getExecutionHistory(workflowId, limit = 50) {
    const executions = Array.from(this.executions.values())
      .filter(exec => exec.workflowId === workflowId)
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(0, limit);

    return {
      success: true,
      workflowId,
      executions,
      total: executions.length
    };
  }

  /**
   * Helper methods
   */
  registerTrigger(workflow) {
    const triggerId = `${workflow.trigger.type}_${workflow.id}`;
    this.triggers.set(triggerId, {
      workflowId: workflow.id,
      type: workflow.trigger.type,
      config: workflow.trigger.config
    });
  }

  generateId() {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = WorkflowAutomationEngine;
