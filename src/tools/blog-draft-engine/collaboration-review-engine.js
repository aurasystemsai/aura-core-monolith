/**
 * Blog Draft Engine - Collaboration & Review Engine
 * Handles multi-user collaboration, comments, approvals, review workflows
 */

class CollaborationReviewEngine {
  constructor() {
    this.sessions = new Map();
    this.comments = new Map();
    this.reviews = new Map();
    this.approvalWorkflows = new Map();
    this.assignments = new Map();
  }

  /**
   * Create collaboration session for draft
   */
  async createSession(draftId, params) {
    const {
      userId,
      participants = [],
      expiresAt = null,
      settings = {}
    } = params;

    const session = {
      id: this.generateId(),
      draftId,
      createdBy: userId,
      participants: [userId, ...participants],
      activeUsers: new Set([userId]),
      cursors: new Map(),
      selections: new Map(),
      createdAt: new Date().toISOString(),
      expiresAt,
      settings: {
        allowAnonymous: false,
        autoSave: true,
        conflictResolution: 'last-write-wins', // last-write-wins, manual, merge
        ...settings
      }
    };

    this.sessions.set(session.id, session);

    return {
      success: true,
      session,
      message: 'Collaboration session created'
    };
  }

  /**
   * Join collaboration session
   */
  async joinSession(sessionId, userId, userInfo = {}) {
    if (!this.sessions.has(sessionId)) {
      return { success: false, error: 'Session not found' };
    }

    const session = this.sessions.get(sessionId);
    
    // Add user to session
    if (!session.participants.includes(userId)) {
      session.participants.push(userId);
    }
    session.activeUsers.add(userId);

    // Initialize user cursor
    session.cursors.set(userId, {
      userId,
      name: userInfo.name || `User ${userId}`,
      color: userInfo.color || this.generateColor(),
      position: 0,
      lastUpdate: new Date().toISOString()
    });

    this.sessions.set(sessionId, session);

    return {
      success: true,
      session,
      activeUsers: Array.from(session.activeUsers),
      message: 'Joined collaboration session'
    };
  }

  /**
   * Leave collaboration session  */
  async leaveSession(sessionId, userId) {
    if (!this.sessions.has(sessionId)) {
      return { success: false, error: 'Session not found' };
    }

    const session = this.sessions.get(sessionId);
    session.activeUsers.delete(userId);
    session.cursors.delete(userId);
    session.selections.delete(userId);

    this.sessions.set(sessionId, session);

    return {
      success: true,
      activeUsers: Array.from(session.activeUsers),
      message: 'Left collaboration session'
    };
  }

  /**
   * Update user cursor position
   */
  async updateCursor(sessionId, userId, position) {
    if (!this.sessions.has(sessionId)) {
      return { success: false, error: 'Session not found' };
    }

    const session = this.sessions.get(sessionId);
    const cursor = session.cursors.get(userId);
    
    if (cursor) {
      cursor.position = position;
      cursor.lastUpdate = new Date().toISOString();
      session.cursors.set(userId, cursor);
      this.sessions.set(sessionId, session);
    }

    return {
      success: true,
      cursors: Array.from(session.cursors.values())
    };
  }

  /**
   * Update user selection
   */
  async updateSelection(sessionId, userId, selection) {
    if (!this.sessions.has(sessionId)) {
      return { success: false, error: 'Session not found' };
    }

    const session = this.sessions.get(sessionId);
    session.selections.set(userId, {
      userId,
      ...selection,
      timestamp: new Date().toISOString()
    });

    this.sessions.set(sessionId, session);

    return {
      success: true,
      selections: Array.from(session.selections.values())
    };
  }

  /**
   * Collaborative edit with conflict detection
   */
  async collaborativeEdit(sessionId, userId, edit) {
    if (!this.sessions.has(sessionId)) {
      return { success: false, error: 'Session not found' };
    }

    const session = this.sessions.get(sessionId);
    const { position, text, operation} = edit; // insert, delete, replace

    // Check for conflicts with other active selections
    const conflicts = this.detectConflicts(session, position, text.length);

    if (conflicts.length > 0 && session.settings.conflictResolution === 'manual') {
      return {
        success: false,
        conflicts,
        message: 'Edit conflicts with other users. Resolve manually.'
      };
    }

    // Apply edit (in production, use operational transformation)
    const result = {
      success: true,
      edit: {
        userId,
        operation,
        position,
        text,
        timestamp: new Date().toISOString()
      },
      conflicts: conflicts.length > 0 ? conflicts : undefined
    };

    // Broadcast to other users in session
    result.broadcast = {
      sessionId,
      activeUsers: Array.from(session.activeUsers).filter(id => id !== userId)
    };

    return result;
  }

  /**
   * Add comment to draft
   */
  async addComment(params) {
    const {
      draftId,
      userId,
      userName,
      text,
      selection = null, // { start, end, text }
      parentId = null, // for threaded replies
      mentions = []
    } = params;

    const comment = {
      id: this.generateId(),
      draftId,
      userId,
      userName,
      text,
      selection,
      parentId,
      mentions,
      replies: [],
      resolved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!this.comments.has(draftId)) {
      this.comments.set(draftId, []);
    }

    const comments = this.comments.get(draftId);
    
    if (parentId) {
      // Add as reply to parent
      const parent = comments.find(c => c.id === parentId);
      if (parent) {
        parent.replies.push(comment);
      }
    } else {
      // Add as top-level comment
      comments.push(comment);
    }

    this.comments.set(draftId, comments);

    // Notify mentioned users
    if (mentions.length > 0) {
      await this.notifyMentions(comment);
    }

    return {
      success: true,
      comment,
      message: 'Comment added'
    };
  }

  /**
   * Resolve/unresolve comment thread
   */
  async resolveComment(commentId, draftId, resolved = true) {
    if (!this.comments.has(draftId)) {
      return { success: false, error: 'No comments found for draft' };
    }

    const comments = this.comments.get(draftId);
    const comment = comments.find(c => c.id === commentId);

    if (!comment) {
      return { success: false, error: 'Comment not found' };
    }

    comment.resolved = resolved;
    comment.resolvedAt = resolved ? new Date().toISOString() : null;

    this.comments.set(draftId, comments);

    return {
      success: true,
      comment,
      message: resolved ? 'Comment resolved' : 'Comment reopened'
    };
  }

  /**
   * Create review request
   */
  async createReview(params) {
    const {
      draftId,
      requestedBy,
      reviewers = [],
      deadline = null,
      checklist = [],
      message = ''
    } = params;

    const review = {
      id: this.generateId(),
      draftId,
      requestedBy,
      reviewers: reviewers.map(reviewer => ({
        userId: reviewer,
        status: 'pending', // pending, approved, rejected, changes_requested
        feedback: [],
        completedAt: null
      })),
      deadline,
      checklist: checklist.map(item => ({
        id: this.generateId(),
        text: item,
        checked: false,
        checkedBy: null
      })),
      message,
      overallStatus: 'pending',
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    this.reviews.set(review.id, review);

    // Notify reviewers
    await this.notifyReviewers(review);

    return {
      success: true,
      review,
      message: 'Review request created'
    };
  }

  /**
   * Submit review feedback
   */
  async submitReview(reviewId, userId, feedback) {
    if (!this.reviews.has(reviewId)) {
      return { success: false, error: 'Review not found' };
    }

    const review = this.reviews.get(reviewId);
    const reviewer = review.reviewers.find(r => r.userId === userId);

    if (!reviewer) {
      return { success: false, error: 'Not a reviewer for this draft' };
    }

    // Update reviewer status
    reviewer.status = feedback.status; // approved, rejected, changes_requested
    reviewer.feedback = feedback.comments || [];
    reviewer.completedAt = new Date().toISOString();

    // Check if all reviewers have completed
    const allCompleted = review.reviewers.every(r => r.status !== 'pending');
    
    if (allCompleted) {
      review.overallStatus = this.calculateOverallReviewStatus(review.reviewers);
      review.completedAt = new Date().toISOString();
    }

    this.reviews.set(reviewId, review);

    // Notify draft owner
    await this.notifyReviewComplete(review, reviewer);

    return {
      success: true,
      review,
      message: 'Review submitted'
    };
  }

  /**
   * Create approval workflow
   */
  async createApprovalWorkflow(params) {
    const {
      draftId,
      name,
      steps = [],
      autoAdvance = false
    } = params;

    const workflow = {
      id: this.generateId(),
      draftId,
      name,
      steps: steps.map((step, index) => ({
        id: this.generateId(),
        order: index,
        name: step.name,
        approvers: step.approvers || [],
        requiredApprovals: step.requiredApprovals || step.approvers.length,
        approvals: [],
        status: index === 0 ? 'active' : 'pending', // pending, active, approved, rejected
        completedAt: null
      })),
      currentStep: 0,
      autoAdvance,
      overallStatus: 'in_progress',
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    this.approvalWorkflows.set(workflow.id, workflow);

    return {
      success: true,
      workflow,
      message: 'Approval workflow created'
    };
  }

  /**
   * Submit approval decision
   */
  async submitApproval(workflowId, userId, decision) {
    if (!this.approvalWorkflows.has(workflowId)) {
      return { success: false, error: 'Workflow not found' };
    }

    const workflow = this.approvalWorkflows.get(workflowId);
    const currentStep = workflow.steps[workflow.currentStep];

    if (!currentStep.approvers.includes(userId)) {
      return { success: false, error: 'Not an approver for current step' };
    }

    // Record approval
    const approval = {
      userId,
      decision: decision.status, // approved, rejected
      comment: decision.comment || '',
      timestamp: new Date().toISOString()
    };

    currentStep.approvals.push(approval);

    // Check if step is complete
    const approvalCount = currentStep.approvals.filter(a => a.decision === 'approved').length;
    const rejectionCount = currentStep.approvals.filter(a => a.decision === 'rejected').length;

    if (rejectionCount > 0) {
      currentStep.status = 'rejected';
      workflow.overallStatus = 'rejected';
      workflow.completedAt = new Date().toISOString();
    } else if (approvalCount >= currentStep.requiredApprovals) {
      currentStep.status = 'approved';
      currentStep.completedAt = new Date().toISOString();

      // Advance to next step or complete workflow
      if (workflow.currentStep < workflow.steps.length - 1) {
        if (workflow.autoAdvance) {
          workflow.currentStep++;
          workflow.steps[workflow.currentStep].status = 'active';
        }
      } else {
        workflow.overallStatus = 'approved';
        workflow.completedAt = new Date().toISOString();
      }
    }

    this.approvalWorkflows.set(workflowId, workflow);

    return {
      success: true,
      workflow,
      message: 'Approval submitted'
    };
  }

  /**
   * Assign draft to user/team
   */
  async assignDraft(params) {
    const {
      draftId,
      assignedTo,
      assignedBy,
      dueDate = null,
      priority = 'normal', // low, normal, high, urgent
      notes = ''
    } = params;

    const assignment = {
      id: this.generateId(),
      draftId,
      assignedTo,
      assignedBy,
      dueDate,
      priority,
      notes,
      status: 'assigned', // assigned, in_progress, completed, cancelled
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    this.assignments.set(assignment.id, assignment);

    // Notify assignee
    await this.notifyAssignment(assignment);

    return {
      success: true,
      assignment,
      message: 'Draft assigned'
    };
  }

  /**
   * Update assignment status
   */
  async updateAssignment(assignmentId, status) {
    if (!this.assignments.has(assignmentId)) {
      return { success: false, error: 'Assignment not found' };
    }

    const assignment = this.assignments.get(assignmentId);
    assignment.status = status;

    if (status === 'completed' || status === 'cancelled') {
      assignment.completedAt = new Date().toISOString();
    }

    this.assignments.set(assignmentId, assignment);

    return {
      success: true,
      assignment,
      message: `Assignment ${status}`
    };
  }

  /**
   * Helper methods
   */
  detectConflicts(session, position, length) {
    const conflicts = [];
    
    for (const [userId, selection] of session.selections.entries()) {
      // Check if new edit overlaps with existing selection
      if (this.rangesOverlap(
        position,
        position + length,
        selection.start,
        selection.end
      )) {
        conflicts.push({
          userId,
          selection,
          type: 'overlap'
        });
      }
    }

    return conflicts;
  }

  rangesOverlap(start1, end1, start2, end2) {
    return start1 < end2 && end1 > start2;
  }

  calculateOverallReviewStatus(reviewers) {
    const hasRejection = reviewers.some(r => r.status === 'rejected');
    if (hasRejection) return 'rejected';

    const hasChangesRequested = reviewers.some(r => r.status === 'changes_requested');
    if (hasChangesRequested) return 'changes_requested';

    const allApproved = reviewers.every(r => r.status === 'approved');
    if (allApproved) return 'approved';

    return 'pending';
  }

  async notifyMentions(comment) {
    // In production, send notifications to mentioned users
    console.log(`Notifying ${comment.mentions.length} users of mention`);
  }

  async notifyReviewers(review) {
    // In production, send notifications to reviewers
    console.log(`Notifying ${review.reviewers.length} reviewers`);
  }

  async notifyReviewComplete(review, reviewer) {
    // In production, notify draft owner
    console.log(`Review ${reviewer.status} by ${reviewer.userId}`);
  }

  async notifyAssignment(assignment) {
    // In production, send notification to assignee
    console.log(`Draft assigned to ${assignment.assignedTo}`);
  }

  generateColor() {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  generateId() {
    return `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = CollaborationReviewEngine;
