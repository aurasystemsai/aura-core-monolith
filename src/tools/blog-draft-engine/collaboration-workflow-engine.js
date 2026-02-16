/**
 * COLLABORATION & WORKFLOW ENGINE
 * Team collaboration, task management, comments, approvals,
 * activity tracking, notifications, and workflow automation
 */

const crypto = require('crypto');

// In-memory stores
const tasks = new Map();
const comments = new Map();
const approvals = new Map();
const activities = new Map();
const notifications = new Map();
const workflows = new Map();
const teamMembers = new Map();

// ================================================================
// TASK MANAGEMENT
// ================================================================

function createTask({
  draftId,
  title,
  description = '',
  assignedTo,
  priority = 'medium',
  dueDate = null,
  tags = [],
  metadata = {}
}) {
  const taskId = `task-${crypto.randomBytes(4).toString('hex')}`;
  
  const task = {
    taskId,
    draftId,
    title,
    description,
    assignedTo,
    priority, // 'low', 'medium', 'high', 'urgent'
    status: 'open',
    dueDate,
    tags,
    metadata,
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: metadata.userId || 'system'
  };
  
  tasks.set(taskId, task);
  
  // Create activity
  logActivity({
    entityType: 'task',
    entityId: taskId,
    action: 'created',
    userId: task.createdBy,
    details: { title: task.title }
  });
  
  // Notify assignee
  if (assignedTo) {
    createNotification({
      userId: assignedTo,
      type: 'task_assigned',
      message: `You've been assigned: ${title}`,
      entityType: 'task',
      entityId: taskId
    });
  }
  
  return task;
}

function getTask(taskId) {
  return tasks.get(taskId) || null;
}

function listTasks({ draftId, assignedTo, status, priority, limit = 50 }) {
  let results = Array.from(tasks.values());
  
  if (draftId) {
    results = results.filter(t => t.draftId === draftId);
  }
  
  if (assignedTo) {
    results = results.filter(t => t.assignedTo === assignedTo);
  }
  
  if (status) {
    results = results.filter(t => t.status === status);
  }
  
  if (priority) {
    results = results.filter(t => t.priority === priority);
  }
  
  results.sort((a, b) => {
    // Sort by priority first
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then by due date
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  
  return results.slice(0, limit);
}

function updateTask(taskId, updates, userId = 'system') {
  const task = tasks.get(taskId);
  if (!task) return null;
  
  const previousStatus = task.status;
  
  Object.assign(task, updates);
  task.updatedAt = new Date().toISOString();
  
  // Track completion
  if (updates.status === 'completed' && previousStatus !== 'completed') {
    task.completedAt = new Date().toISOString();
    
    logActivity({
      entityType: 'task',
      entityId: taskId,
      action: 'completed',
      userId,
      details: { title: task.title }
    });
    
    // Notify creator
    if (task.createdBy !== userId) {
      createNotification({
        userId: task.createdBy,
        type: 'task_completed',
        message: `Task completed: ${task.title}`,
        entityType: 'task',
        entityId: taskId
      });
    }
  }
  
  tasks.set(taskId, task);
  return task;
}

function deleteTask(taskId) {
  const task = tasks.get(taskId);
  if (!task) return false;
  
  // Delete related comments
  const taskComments = Array.from(comments.values())
    .filter(c => c.entityType === 'task' && c.entityId === taskId);
  
  taskComments.forEach(c => comments.delete(c.commentId));
  
  return tasks.delete(taskId);
}

// ================================================================
// COMMENTS & DISCUSSIONS
// ================================================================

function createComment({
  entityType,
  entityId,
  content,
  userId,
  mentions = [],
  parentCommentId = null
}) {
  const commentId = `comment-${crypto.randomBytes(4).toString('hex')}`;
  
  const comment = {
    commentId,
    entityType, // 'draft', 'task', 'brief', etc.
    entityId,
    content,
    userId,
    mentions,
    parentCommentId,
    replies: [],
    reactions: [],
    editedAt: null,
    createdAt: new Date().toISOString()
  };
  
  comments.set(commentId, comment);
  
  // If it's a reply, add to parent
  if (parentCommentId) {
    const parent = comments.get(parentCommentId);
    if (parent) {
      parent.replies.push(commentId);
      comments.set(parentCommentId, parent);
    }
  }
  
  // Log activity
  logActivity({
    entityType,
    entityId,
    action: 'commented',
    userId,
    details: { comment: content.substring(0, 100) }
  });
  
  // Notify mentioned users
  mentions.forEach(mentionedUserId => {
    if (mentionedUserId !== userId) {
      createNotification({
        userId: mentionedUserId,
        type: 'mentioned',
        message: `${userId} mentioned you in a comment`,
        entityType,
        entityId
      });
    }
  });
  
  return comment;
}

function getComment(commentId) {
  return comments.get(commentId) || null;
}

function listComments({ entityType, entityId, userId, limit = 100 }) {
  let results = Array.from(comments.values());
  
  if (entityType) {
    results = results.filter(c => c.entityType === entityType);
  }
  
  if (entityId) {
    results = results.filter(c => c.entityId === entityId);
  }
  
  if (userId) {
    results = results.filter(c => c.userId === userId);
  }
  
  // Only return top-level comments (not replies)
  results = results.filter(c => !c.parentCommentId);
  
  // Sort by creation date
  results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return results.slice(0, limit);
}

function updateComment(commentId, content, userId) {
  const comment = comments.get(commentId);
  if (!comment) return null;
  
  if (comment.userId !== userId) {
    throw new Error('Unauthorized: Cannot edit another user\'s comment');
  }
  
  comment.content = content;
  comment.editedAt = new Date().toISOString();
  
  comments.set(commentId, comment);
  return comment;
}

function deleteComment(commentId, userId) {
  const comment = comments.get(commentId);
  if (!comment) return false;
  
  if (comment.userId !== userId) {
    throw new Error('Unauthorized: Cannot delete another user\'s comment');
  }
  
  // Delete replies
  comment.replies.forEach(replyId => comments.delete(replyId));
  
  return comments.delete(commentId);
}

function addReaction(commentId, userId, emoji) {
  const comment = comments.get(commentId);
  if (!comment) return null;
  
  const existingReaction = comment.reactions.find(r => r.userId === userId);
  
  if (existingReaction) {
    existingReaction.emoji = emoji;
  } else {
    comment.reactions.push({ userId, emoji, timestamp: new Date().toISOString() });
  }
  
  comments.set(commentId, comment);
  return comment;
}

// ================================================================
// APPROVAL WORKFLOWS
// ================================================================

function submitForApproval({
  draftId,
  approvers,
  approvalType = 'any', // 'any' or 'all'
  dueDate = null,
  message = ''
}) {
  const approvalId = `approval-${crypto.randomBytes(4).toString('hex')}`;
  
  const approval = {
    approvalId,
    draftId,
    approvers: approvers.map(userId => ({
      userId,
      decision: null,
      comments: '',
      timestamp: null
    })),
    approvalType,
    dueDate,
    message,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    resolvedAt: null
  };
  
  approvals.set(approvalId, approval);
  
  // Notify approvers
  approvers.forEach(userId => {
    createNotification({
      userId,
      type: 'approval_requested',
      message: `Approval requested for draft`,
      entityType: 'approval',
      entityId: approvalId
    });
  });
  
  logActivity({
    entityType: 'draft',
    entityId: draftId,
    action: 'approval_requested',
    userId: 'system',
    details: { approvers }
  });
  
  return approval;
}

function recordApprovalDecision(approvalId, userId, decision, comments = '') {
  const approval = approvals.get(approvalId);
  if (!approval) return null;
  
  const approver = approval.approvers.find(a => a.userId === userId);
  if (!approver) {
    throw new Error('User is not an approver for this request');
  }
  
  approver.decision = decision; // 'approved', 'rejected', 'changes_requested'
  approver.comments = comments;
  approver.timestamp = new Date().toISOString();
  
  // Check if approval is complete
  const allResponded = approval.approvers.every(a => a.decision !== null);
  
  if (allResponded || approval.approvalType === 'any') {
    if (approval.approvalType === 'any') {
      // Any approval is sufficient
      const anyApproved = approval.approvers.some(a => a.decision === 'approved');
      const anyRejected = approval.approvers.some(a => a.decision === 'rejected');
      
      if (anyApproved) {
        approval.status = 'approved';
      } else if (anyRejected) {
        approval.status = 'rejected';
      }
    } else {
      // All must approve
      const allApproved = approval.approvers.every(a => a.decision === 'approved');
      const anyRejected = approval.approvers.some(a => a.decision === 'rejected');
      
      if (allApproved) {
        approval.status = 'approved';
      } else if (anyRejected) {
        approval.status = 'rejected';
      } else {
        approval.status = 'changes_requested';
      }
    }
    
    if (approval.status !== 'pending') {
      approval.resolvedAt = new Date().toISOString();
      
      logActivity({
        entityType: 'draft',
        entityId: approval.draftId,
        action: `approval_${approval.status}`,
        userId,
        details: { decision }
      });
    }
  }
  
  approvals.set(approvalId, approval);
  return approval;
}

function getApprovalStatus(approvalId) {
  return approvals.get(approvalId) || null;
}

function listApprovals({ draftId, userId, status }) {
  let results = Array.from(approvals.values());
  
  if (draftId) {
    results = results.filter(a => a.draftId === draftId);
  }
  
  if (userId) {
    results = results.filter(a => a.approvers.some(approver => approver.userId === userId));
  }
  
  if (status) {
    results = results.filter(a => a.status === status);
  }
  
  return results.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
}

// ================================================================
// ACTIVITY TRACKING
// ================================================================

function logActivity({ entityType, entityId, action, userId, details = {} }) {
  const activityId = `activity-${crypto.randomBytes(4).toString('hex')}`;
  
  const activity = {
    activityId,
    entityType,
    entityId,
    action,
    userId,
    details,
    timestamp: new Date().toISOString()
  };
  
  activities.set(activityId, activity);
  return activity;
}

function getActivityLog({ entityType, entityId, userId, limit = 50 }) {
  let results = Array.from(activities.values());
  
  if (entityType) {
    results = results.filter(a => a.entityType === entityType);
  }
  
  if (entityId) {
    results = results.filter(a => a.entityId === entityId);
  }
  
  if (userId) {
    results = results.filter(a => a.userId === userId);
  }
  
  results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return results.slice(0, limit);
}

function getRecentActivity(limit = 20) {
  return Array.from(activities.values())
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

// ================================================================
// NOTIFICATIONS
// ================================================================

function createNotification({ userId, type, message, entityType, entityId }) {
  const notificationId = `notif-${crypto.randomBytes(4).toString('hex')}`;
  
  const notification = {
    notificationId,
    userId,
    type,
    message,
    entityType,
    entityId,
    read: false,
    createdAt: new Date().toISOString()
  };
  
  notifications.set(notificationId, notification);
  return notification;
}

function getNotifications(userId, unreadOnly = false) {
  let results = Array.from(notifications.values())
    .filter(n => n.userId === userId);
  
  if (unreadOnly) {
    results = results.filter(n => !n.read);
  }
  
  return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function markNotificationAsRead(notificationId) {
  const notification = notifications.get(notificationId);
  if (!notification) return null;
  
  notification.read = true;
  notifications.set(notificationId, notification);
  
  return notification;
}

function markAllNotificationsAsRead(userId) {
  const userNotifications = Array.from(notifications.values())
    .filter(n => n.userId === userId && !n.read);
  
  userNotifications.forEach(n => {
    n.read = true;
    notifications.set(n.notificationId, n);
  });
  
  return userNotifications.length;
}

// ================================================================
// WORKFLOW AUTOMATION
// ================================================================

function createWorkflow({ name, description, trigger, actions = [], rules = [] }) {
  const workflowId = `workflow-${crypto.randomBytes(4).toString('hex')}`;
  
  const workflow = {
    workflowId,
    name,
    description,
    trigger, // 'draft_created', 'task_completed', 'approval_requested', etc.
    actions,
    rules,
    enabled: true,
    executionCount: 0,
    lastExecutedAt: null,
    createdAt: new Date().toISOString()
  };
  
  workflows.set(workflowId, workflow);
  return workflow;
}

function executeWorkflow(workflowId, context) {
  const workflow = workflows.get(workflowId);
  if (!workflow || !workflow.enabled) return null;
  
  // Check rules
  const rulesPass = evaluateWorkflowRules(workflow.rules, context);
  if (!rulesPass) {
    return { workflowId, executed: false, reason: 'Rules not met' };
  }
  
  // Execute actions
  const results = workflow.actions.map(action => executeWorkflowAction(action, context));
  
  // Update workflow stats
  workflow.executionCount++;
  workflow.lastExecutedAt = new Date().toISOString();
  workflows.set(workflowId, workflow);
  
  return {
    workflowId,
    executed: true,
    actionResults: results,
    timestamp: new Date().toISOString()
  };
}

function evaluateWorkflowRules(rules, context) {
  if (!rules || rules.length === 0) return true;
  
  return rules.every(rule => {
    const { field, operator, value } = rule;
    const contextValue = getNestedValue(context, field);
    
    return compareValues(contextValue, operator, value);
  });
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

function compareValues(fieldValue, operator, value) {
  switch (operator) {
    case 'equals':
      return fieldValue === value;
    case 'not_equals':
      return fieldValue !== value;
    case 'contains':
      return String(fieldValue).includes(value);
    case 'greater_than':
      return Number(fieldValue) > Number(value);
    case 'less_than':
      return Number(fieldValue) < Number(value);
    default:
      return false;
  }
}

function executeWorkflowAction(action, context) {
  const { type, config } = action;
  
  switch (type) {
    case 'create_task':
      return createTask({
        draftId: context.draftId,
        title: config.title,
        assignedTo: config.assignedTo,
        priority: config.priority
      });
      
    case 'send_notification':
      return createNotification({
        userId: config.userId,
        type: config.notificationType,
        message: config.message,
        entityType: context.entityType,
        entityId: context.entityId
      });
      
    case 'request_approval':
      return submitForApproval({
        draftId: context.draftId,
        approvers: config.approvers,
        approvalType: config.approvalType
      });
      
    default:
      return { success: false, error: `Unknown action type: ${type}` };
  }
}

function listWorkflows({ enabled }) {
  let results = Array.from(workflows.values());
  
  if (enabled !== undefined) {
    results = results.filter(w => w.enabled === enabled);
  }
  
  return results.sort((a, b) => b.executionCount - a.executionCount);
}

// ================================================================
// TEAM MANAGEMENT
// ================================================================

function addTeamMember({ userId, name, role, permissions = [] }) {
  const member = {
    userId,
    name,
    role,
    permissions,
    status: 'active',
    addedAt: new Date().toISOString()
  };
  
  teamMembers.set(userId, member);
  return member;
}

function getTeamMember(userId) {
  return teamMembers.get(userId) || null;
}

function listTeamMembers({ role, status }) {
  let results = Array.from(teamMembers.values());
  
  if (role) {
    results = results.filter(m => m.role === role);
  }
  
  if (status) {
    results = results.filter(m => m.status === status);
  }
  
  return results;
}

function updateTeamMember(userId, updates) {
  const member = teamMembers.get(userId);
  if (!member) return null;
  
  Object.assign(member, updates);
  teamMembers.set(userId, member);
  
  return member;
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Task management
  createTask,
  getTask,
  listTasks,
  updateTask,
  deleteTask,
  
  // Comments
  createComment,
  getComment,
  listComments,
  updateComment,
  deleteComment,
  addReaction,
  
  // Approvals
  submitForApproval,
  recordApprovalDecision,
  getApprovalStatus,
  listApprovals,
  
  // Activity tracking
  logActivity,
  getActivityLog,
  getRecentActivity,
  
  // Notifications
  createNotification,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  
  // Workflows
  createWorkflow,
  executeWorkflow,
  listWorkflows,
  
  // Team management
  addTeamMember,
  getTeamMember,
  listTeamMembers,
  updateTeamMember,
  
  // Internal stores
  tasks,
  comments,
  approvals,
  activities,
  notifications,
  workflows,
  teamMembers
};
