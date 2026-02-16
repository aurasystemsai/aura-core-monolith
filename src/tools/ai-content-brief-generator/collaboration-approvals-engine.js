const crypto = require('crypto');

// ============================================================================
// DATA STORES
// ============================================================================

const collaborations = new Map();
const tasks = new Map();
const comments = new Map();
const approvals = new Map();
const workflows = new Map();
const activityLog = [];
const notifications = new Map();
const reviewCycles = new Map();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateId(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

// ============================================================================
// COLLABORATION MANAGEMENT
// ============================================================================

function initCollab(briefId) {
  if (!collaborations.has(briefId)) {
    collaborations.set(briefId, {
      briefId,
      taskIds: [],
      commentIds: [],
      reviewers: [],
      collaborators: [],
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  return collaborations.get(briefId);
}

function getCollaboration(briefId) {
  return initCollab(briefId);
}

function updateCollaboration(briefId, updates) {
  const collab = initCollab(briefId);
  
  const updated = {
    ...collab,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  collaborations.set(briefId, updated);
  logActivity(briefId, `Collaboration updated`, 'system');
  
  return updated;
}

function addCollaborator(briefId, collaboratorData) {
  const collab = initCollab(briefId);
  
  const collaborator = {
    id: generateId('collaborator'),
    name: collaboratorData.name,
    role: collaboratorData.role || 'contributor',
    permissions: collaboratorData.permissions || ['comment', 'suggest'],
    addedAt: new Date().toISOString()
  };
  
  collab.collaborators = collab.collaborators || [];
  collab.collaborators.push(collaborator);
  
  collaborations.set(briefId, collab);
  logActivity(briefId, `${collaborator.name} added as ${collaborator.role}`, 'collaboration');
  
  return collaborator;
}

function removeCollaborator(briefId, collaboratorId) {
  const collab = initCollab(briefId);
  
  collab.collaborators = (collab.collaborators || []).filter(c => c.id !== collaboratorId);
  
  collaborations.set(briefId, collab);
  logActivity(briefId, `Collaborator removed`, 'collaboration');
  
  return collab;
}

function listCollaborations(filters = {}) {
  let results = Array.from(collaborations.values());
  
  if (filters.status) {
    results = results.filter(c => c.status === filters.status);
  }
  
  if (filters.hasReviewers) {
    results = results.filter(c => c.reviewers && c.reviewers.length > 0);
  }
  
  return results;
}

// ============================================================================
// TASK MANAGEMENT
// ============================================================================

function createTask(data = {}) {
  const taskId = generateId('task');
  const briefId = data.briefId || generateId('brief');
  
  const task = {
    taskId,
    briefId,
    title: data.title || 'New Task',
    description: data.description || '',
    owner: data.owner || 'Unassigned',
    assignedTo: data.assignedTo || null,
    status: data.status || 'open',
    priority: data.priority || 'medium',
    dueDate: data.dueDate || new Date(Date.now() + 48 * 3600e3).toISOString(),
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: data.tags || [],
    dependencies: data.dependencies || []
  };
  
  tasks.set(taskId, task);
  
  const collab = initCollab(briefId);
  collab.taskIds = collab.taskIds || [];
  collab.taskIds.push(taskId);
  collaborations.set(briefId, collab);
  
  logActivity(briefId, `Task created: ${task.title}`, 'task');
  
  return task;
}

function getTask(taskId) {
  if (!tasks.has(taskId)) {
    throw new Error('Task not found');
  }
  return tasks.get(taskId);
}

function updateTask(taskId, updates) {
  const task = getTask(taskId);
  
  const updated = {
    ...task,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  if (updates.status === 'completed' && task.status !== 'completed') {
    updated.completedAt = new Date().toISOString();
  }
  
  tasks.set(taskId, updated);
  logActivity(task.briefId, `Task updated: ${task.title}`, 'task');
  
  return updated;
}

function deleteTask(taskId) {
  const task = getTask(taskId);
  
  tasks.delete(taskId);
  
  // Remove from collaboration
  const collab = collaborations.get(task.briefId);
  if (collab) {
    collab.taskIds = (collab.taskIds || []).filter(id => id !== taskId);
    collaborations.set(task.briefId, collab);
  }
  
  logActivity(task.briefId, `Task deleted: ${task.title}`, 'task');
  
  return { success: true, message: 'Task deleted' };
}

function listTasks(filters = {}) {
  let results = Array.from(tasks.values());
  
  if (filters.briefId) {
    results = results.filter(t => t.briefId === filters.briefId);
  }
  
  if (filters.status) {
    results = results.filter(t => t.status === filters.status);
  }
  
  if (filters.assignedTo) {
    results = results.filter(t => t.assignedTo === filters.assignedTo);
  }
  
  if (filters.priority) {
    results = results.filter(t => t.priority === filters.priority);
  }
  
  if (filters.overdue) {
    const now = new Date();
    results = results.filter(t => t.status !== 'completed' && new Date(t.dueDate) < now);
  }
  
  return results;
}

function assignTask(taskId, assignee) {
  const task = getTask(taskId);
  
  const updated = updateTask(taskId, {
    assignedTo: assignee,
    status: task.status === 'open' ? 'in_progress' : task.status
  });
  
  logActivity(task.briefId, `Task "${task.title}" assigned to ${assignee}`, 'task');
  
  return updated;
}

function completeTask(taskId) {
  const task = getTask(taskId);
  
  const updated = updateTask(taskId, {
    status: 'completed',
    completedAt: new Date().toISOString()
  });
  
  logActivity(task.briefId, `Task completed: ${task.title}`, 'task');
  
  return updated;
}

// ============================================================================
// COMMENTS & FEEDBACK
// ============================================================================

function addComment(data = {}) {
  const commentId = generateId('cmt');
  const briefId = data.briefId || generateId('brief');
  
  const comment = {
    commentId,
    briefId,
    sectionId: data.sectionId || null,
    author: data.author || 'Anonymous',
    text: data.text || 'Comment text',
    type: data.type || 'general', // general, suggestion, question, approval, rejection
    status: data.status || 'open',
    resolved: false,
    resolvedBy: null,
    resolvedAt: null,
    parentCommentId: data.parentCommentId || null, // For threaded comments
    reactions: data.reactions || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  comments.set(commentId, comment);
  
  const collab = initCollab(briefId);
  collab.commentIds = collab.commentIds || [];
  collab.commentIds.push(commentId);
  collaborations.set(briefId, collab);
  
  logActivity(briefId, `Comment from ${comment.author}`, 'comment');
  
  return comment;
}

function getComment(commentId) {
  if (!comments.has(commentId)) {
    throw new Error('Comment not found');
  }
  return comments.get(commentId);
}

function updateComment(commentId, updates) {
  const comment = getComment(commentId);
  
  const updated = {
    ...comment,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  comments.set(commentId, updated);
  
  return updated;
}

function deleteComment(commentId) {
  const comment = getComment(commentId);
  
  comments.delete(commentId);
  
  logActivity(comment.briefId, `Comment deleted`, 'comment');
  
  return { success: true, message: 'Comment deleted' };
}

function resolveComment(commentId, resolvedBy) {
  const comment = getComment(commentId);
  
  const updated = updateComment(commentId, {
    resolved: true,
    resolvedBy,
    resolvedAt: new Date().toISOString(),
    status: 'resolved'
  });
  
  logActivity(comment.briefId, `Comment resolved by ${resolvedBy}`, 'comment');
  
  return updated;
}

function listComments(filters = {}) {
  let results = Array.from(comments.values());
  
  if (filters.briefId) {
    results = results.filter(c => c.briefId === filters.briefId);
  }
  
  if (filters.sectionId) {
    results = results.filter(c => c.sectionId === filters.sectionId);
  }
  
  if (filters.author) {
    results = results.filter(c => c.author === filters.author);
  }
  
  if (filters.type) {
    results = results.filter(c => c.type === filters.type);
  }
  
  if (filters.resolved !== undefined) {
    results = results.filter(c => c.resolved === filters.resolved);
  }
  
  if (filters.status) {
    results = results.filter(c => c.status === filters.status);
  }
  
  return results;
}

// ============================================================================
// APPROVAL WORKFLOWS
// ============================================================================

function createApproval(data = {}) {
  const approvalId = generateId('approval');
  const briefId = data.briefId || generateId('brief');
  
  const approval = {
    approvalId,
    briefId,
    name: data.name || 'Content Approval',
    approvers: data.approvers || [],
    requiredApprovals: data.requiredApprovals || 1,
    currentApprovals: 0,
    rejections: 0,
    status: 'pending',
    approvalHistory: [],
    deadline: data.deadline || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  approvals.set(approvalId, approval);
  logActivity(briefId, `Approval workflow created: ${approval.name}`, 'approval');
  
  return approval;
}

function getApproval(approvalId) {
  if (!approvals.has(approvalId)) {
    throw new Error('Approval not found');
  }
  return approvals.get(approvalId);
}

function submitApprovalDecision(approvalId, decision, approver, comments = '') {
  const approval = getApproval(approvalId);
  
  const approvalEntry = {
    approver,
    decision, // 'approved' or 'rejected'
    comments,
    timestamp: new Date().toISOString()
  };
  
  approval.approvalHistory.push(approvalEntry);
  
  if (decision === 'approved') {
    approval.currentApprovals++;
  } else if (decision === 'rejected') {
    approval.rejections++;
    approval.status = 'rejected';
  }
  
  if (approval.currentApprovals >= approval.requiredApprovals) {
    approval.status = 'approved';
  }
  
  approval.updatedAt = new Date().toISOString();
  
  approvals.set(approvalId, approval);
  logActivity(approval.briefId, `${approver} ${decision} approval`, 'approval');
  
  return approval;
}

function assignReviewer(briefId, reviewer) {
  const collab = initCollab(briefId);
  
  if (!collab.reviewers.includes(reviewer)) {
    collab.reviewers.push(reviewer);
    logActivity(briefId, `Reviewer assigned: ${reviewer}`, 'approval');
  }
  
  collaborations.set(briefId, collab);
  
  return collab;
}

function listApprovals(filters = {}) {
  let results = Array.from(approvals.values());
  
  if (filters.briefId) {
    results = results.filter(a => a.briefId === filters.briefId);
  }
  
  if (filters.status) {
    results = results.filter(a => a.status === filters.status);
  }
  
  return results;
}

// ============================================================================
// WORKFLOW MANAGEMENT
// ============================================================================

function createWorkflow(data = {}) {
  const workflowId = generateId('workflow');
  
  const workflow = {
    workflowId,
    name: data.name || 'Content Workflow',
    briefId: data.briefId || null,
    stages: data.stages || [
      { id: generateId('stage'), name: 'Draft', status: 'current', completedAt: null },
      { id: generateId('stage'), name: 'Review', status: 'pending', completedAt: null },
      { id: generateId('stage'), name: 'Approval', status: 'pending', completedAt: null },
      { id: generateId('stage'), name: 'Published', status: 'pending', completedAt: null }
    ],
    currentStage: 0,
    status: 'in_progress',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  workflows.set(workflowId, workflow);
  
  return workflow;
}

function advanceWorkflow(workflowId) {
  const workflow = workflows.get(workflowId);
  
  if (!workflow) {
    throw new Error('Workflow not found');
  }
  
  if (workflow.currentStage < workflow.stages.length - 1) {
    workflow.stages[workflow.currentStage].status = 'completed';
    workflow.stages[workflow.currentStage].completedAt = new Date().toISOString();
    
    workflow.currentStage++;
    workflow.stages[workflow.currentStage].status = 'current';
    workflow.updatedAt = new Date().toISOString();
    
    if (workflow.currentStage === workflow.stages.length - 1 && workflow.stages[workflow.currentStage].status === 'completed') {
      workflow.status = 'completed';
    }
    
    workflows.set(workflowId, workflow);
    
    if (workflow.briefId) {
      logActivity(workflow.briefId, `Workflow advanced to ${workflow.stages[workflow.currentStage].name}`, 'workflow');
    }
  }
  
  return workflow;
}

function getWorkflowStatus(workflowId) {
  const workflow = workflows.get(workflowId);
  
  if (!workflow) {
    throw new Error('Workflow not found');
  }
  
  const completedStages = workflow.stages.filter(s => s.status === 'completed').length;
  const progress = Math.round((completedStages / workflow.stages.length) * 100);
  
  return {
    workflowId,
    name: workflow.name,
    currentStage: workflow.stages[workflow.currentStage],
    progress,
    status: workflow.status,
    completedStages,
    totalStages: workflow.stages.length
  };
}

// ============================================================================
// ACTIVITY LOG
// ============================================================================

function logActivity(briefId, message, type = 'general') {
  const entry = { 
    id: generateId('act'), 
    briefId, 
    message, 
    type,
    timestamp: Date.now(),
    createdAt: new Date().toISOString()
  };
  
  activityLog.push(entry);
  
  return entry;
}

function listActivities(briefId, filters = {}) {
  let results = activityLog.filter((a) => !briefId || a.briefId === briefId);
  
  if (filters.type) {
    results = results.filter(a => a.type === filters.type);
  }
  
  if (filters.limit) {
    results = results.slice(-filters.limit);
  } else {
    results = results.slice(-50); // Default last 50
  }
  
  return results;
}

// ============================================================================
// STATUS MANAGEMENT
// ============================================================================

function updateStatus(briefId, status) {
  const collab = initCollab(briefId);
  const previousStatus = collab.status;
  
  collab.status = status;
  collab.updatedAt = new Date().toISOString();
  
  collaborations.set(briefId, collab);
  logActivity(briefId, `Status updated from ${previousStatus} to ${status}`, 'status');
  
  return collab;
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

function createNotification(data = {}) {
  const notificationId = generateId('notif');
  
  const notification = {
    id: notificationId,
    briefId: data.briefId,
    recipient: data.recipient,
    type: data.type || 'info', // info, warning, action_required
    message: data.message,
    read: false,
    actionUrl: data.actionUrl || null,
    createdAt: new Date().toISOString()
  };
  
  if (!notifications.has(data.recipient)) {
    notifications.set(data.recipient, []);
  }
  
  notifications.get(data.recipient).push(notification);
  
  return notification;
}

function getNotifications(recipient, unreadOnly = false) {
  const userNotifications = notifications.get(recipient) || [];
  
  if (unreadOnly) {
    return userNotifications.filter(n => !n.read);
  }
  
  return userNotifications;
}

function markNotificationRead(notificationId, recipient) {
  const userNotifications = notifications.get(recipient) || [];
  const notification = userNotifications.find(n => n.id === notificationId);
  
  if (notification) {
    notification.read = true;
  }
  
  return notification;
}

// ============================================================================
// STATISTICS & REPORTING
// ============================================================================

function getStats() {
  const allTasks = Array.from(tasks.values());
  const allComments = Array.from(comments.values());
  const allApprovals = Array.from(approvals.values());
  
  return {
    totalCollaborations: collaborations.size,
    totalTasks: allTasks.length,
    openTasks: allTasks.filter(t => t.status === 'open').length,
    completedTasks: allTasks.filter(t => t.status === 'completed').length,
    overdueTasks: allTasks.filter(t => t.status !== 'completed' && new Date(t.dueDate) < new Date()).length,
    totalComments: allComments.length,
    unresolvedComments: allComments.filter(c => !c.resolved).length,
    resolvedComments: allComments.filter(c => c.resolved).length,
    totalApprovals: allApprovals.length,
    pendingApprovals: allApprovals.filter(a => a.status === 'pending').length,
    approvedApprovals: allApprovals.filter(a => a.status === 'approved').length,
    rejectedApprovals: allApprovals.filter(a => a.status === 'rejected').length,
    totalActivities: activityLog.length,
    totalWorkflows: workflows.size
  };
}

// ============================================================================
// MODULE EXPORTS
// ============================================================================

module.exports = {
  // Collaboration
  initCollab,
  getCollaboration,
  updateCollaboration,
  addCollaborator,
  removeCollaborator,
  listCollaborations,
  
  // Tasks
  createTask,
  getTask,
  updateTask,
  deleteTask,
  listTasks,
  assignTask,
  completeTask,
  
  // Comments
  addComment,
  getComment,
  updateComment,
  deleteComment,
  resolveComment,
  listComments,
  
  // Approvals
  createApproval,
  getApproval,
  submitApprovalDecision,
  assignReviewer,
  listApprovals,
  
  // Workflows
  createWorkflow,
  advanceWorkflow,
  getWorkflowStatus,
  
  // Activity
  logActivity,
  listActivities,
  
  // Status
  updateStatus,
  
  // Notifications
  createNotification,
  getNotifications,
  markNotificationRead,
  
  // Statistics
  getStats,
};
