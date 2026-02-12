// Approval workflow system for high-impact pricing rule changes

let approvalRequests = [];
let approvalRequestId = 1;

const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

const APPROVAL_THRESHOLDS = {
  // Rules requiring approval
  globalScope: true, // All global rules need approval
  priceChangePercent: 20, // Price changes > 20% need approval
  affectedProductsCount: 100, // Rules affecting > 100 products need approval
  minimumApprovers: 2 // Dual-control: 2 approvers required
};

// Check if a rule change requires approval
const requiresApproval = (ruleData, context = {}) => {
  const reasons = [];

  // Global scope rules always need approval
  if (ruleData.scope === 'global') {
    reasons.push({ 
      type: 'global_scope', 
      message: 'Global scope rules require approval',
      threshold: 'globalScope'
    });
  }

  // Large price changes need approval
  if (context.priceChangePercent && Math.abs(context.priceChangePercent) > APPROVAL_THRESHOLDS.priceChangePercent) {
    reasons.push({
      type: 'price_change',
      message: `Price change of ${context.priceChangePercent}% exceeds threshold of ${APPROVAL_THRESHOLDS.priceChangePercent}%`,
      threshold: 'priceChangePercent',
      value: context.priceChangePercent
    });
  }

  // Rules affecting many products need approval
  if (context.affectedProductsCount && context.affectedProductsCount > APPROVAL_THRESHOLDS.affectedProductsCount) {
    reasons.push({
      type: 'affected_products',
      message: `Rule affects ${context.affectedProductsCount} products, exceeding threshold of ${APPROVAL_THRESHOLDS.affectedProductsCount}`,
      threshold: 'affectedProductsCount',
      value: context.affectedProductsCount
    });
  }

  return {
    required: reasons.length > 0,
    reasons
  };
};

// Create an approval request
const createApprovalRequest = (ruleId, ruleData, requestedBy, context = {}) => {
  const approvalCheck = requiresApproval(ruleData, context);

  const request = {
    id: approvalRequestId++,
    ruleId,
    ruleData: JSON.parse(JSON.stringify(ruleData)), // Deep copy
    requestedBy,
    requestedAt: new Date().toISOString(),
    status: APPROVAL_STATUS.PENDING,
    reasons: approvalCheck.reasons,
    approvals: [],
    rejections: [],
    comments: [],
    decidedAt: null,
    decidedBy: null,
    context
  };

  approvalRequests.push(request);
  return request;
};

// Approve an approval request
const approve = (requestId, approvedBy, comment = '') => {
  const request = approvalRequests.find(r => r.id === requestId);
  if (!request) return { error: 'Approval request not found' };
  
  if (request.status !== APPROVAL_STATUS.PENDING) {
    return { error: `Request is already ${request.status}` };
  }

  // Check if approver already approved
  if (request.approvals.some(a => a.approvedBy === approvedBy)) {
    return { error: 'You have already approved this request' };
  }

  // Add approval
  request.approvals.push({
    approvedBy,
    approvedAt: new Date().toISOString(),
    comment
  });

  if (comment) {
    request.comments.push({
      by: approvedBy,
      at: new Date().toISOString(),
      text: comment,
      type: 'approval'
    });
  }

  // Check if enough approvals
  if (request.approvals.length >= APPROVAL_THRESHOLDS.minimumApprovers) {
    request.status = APPROVAL_STATUS.APPROVED;
    request.decidedAt = new Date().toISOString();
    request.decidedBy = approvedBy;
  }

  return { ok: true, request };
};

// Reject an approval request
const reject = (requestId, rejectedBy, comment = '') => {
  const request = approvalRequests.find(r => r.id === requestId);
  if (!request) return { error: 'Approval request not found' };
  
  if (request.status !== APPROVAL_STATUS.PENDING) {
    return { error: `Request is already ${request.status}` };
  }

  request.rejections.push({
    rejectedBy,
    rejectedAt: new Date().toISOString(),
    comment
  });

  request.status = APPROVAL_STATUS.REJECTED;
  request.decidedAt = new Date().toISOString();
  request.decidedBy = rejectedBy;

  if (comment) {
    request.comments.push({
      by: rejectedBy,
      at: new Date().toISOString(),
      text: comment,
      type: 'rejection'
    });
  }

  return { ok: true, request };
};

// Cancel an approval request
const cancel = (requestId, cancelledBy, reason = '') => {
  const request = approvalRequests.find(r => r.id === requestId);
  if (!request) return { error: 'Approval request not found' };
  
  if (request.status !== APPROVAL_STATUS.PENDING) {
    return { error: `Request is already ${request.status}` };
  }

  request.status = APPROVAL_STATUS.CANCELLED;
  request.decidedAt = new Date().toISOString();
  request.decidedBy = cancelledBy;

  if (reason) {
    request.comments.push({
      by: cancelledBy,
      at: new Date().toISOString(),
      text: reason,
      type: 'cancellation'
    });
  }

  return { ok: true, request };
};

// Get an approval request
const getRequest = (requestId) => {
  return approvalRequests.find(r => r.id === requestId);
};

// List approval requests with filters
const listRequests = (filters = {}) => {
  let filtered = approvalRequests;

  if (filters.status) {
    filtered = filtered.filter(r => r.status === filters.status);
  }

  if (filters.requestedBy) {
    filtered = filtered.filter(r => r.requestedBy === filters.requestedBy);
  }

  if (filters.ruleId) {
    filtered = filtered.filter(r => r.ruleId === Number(filters.ruleId));
  }

  // Sort by requestedAt descending
  filtered.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

  return filtered;
};

// Get pending approvals for a user
const getPendingApprovals = (userId) => {
  return approvalRequests.filter(r => 
    r.status === APPROVAL_STATUS.PENDING &&
    !r.approvals.some(a => a.approvedBy === userId) &&
    !r.rejections.some(rej => rej.rejectedBy === userId)
  );
};

// Get approval statistics
const getStats = () => {
  const stats = {
    total: approvalRequests.length,
    byStatus: {},
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    averageApprovalTime: 0
  };

  for (const status of Object.values(APPROVAL_STATUS)) {
    stats.byStatus[status] = approvalRequests.filter(r => r.status === status).length;
  }

  stats.pendingCount = stats.byStatus.pending || 0;
  stats.approvedCount = stats.byStatus.approved || 0;
  stats.rejectedCount = stats.byStatus.rejected || 0;

  // Calculate average approval time for approved requests
  const approved = approvalRequests.filter(r => r.status === APPROVAL_STATUS.APPROVED && r.decidedAt);
  if (approved.length > 0) {
    const totalTime = approved.reduce((sum, r) => {
      return sum + (new Date(r.decidedAt) - new Date(r.requestedAt));
    }, 0);
    stats.averageApprovalTime = Math.round(totalTime / approved.length / 1000 / 60); // in minutes
  }

  return stats;
};

// Clear all approval requests (for testing)
const clear = () => {
  approvalRequests = [];
  approvalRequestId = 1;
};

module.exports = {
  requiresApproval,
  createApprovalRequest,
  approve,
  reject,
  cancel,
  getRequest,
  listRequests,
  getPendingApprovals,
  getStats,
  clear,
  APPROVAL_STATUS,
  APPROVAL_THRESHOLDS
};
