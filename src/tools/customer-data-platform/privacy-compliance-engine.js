/**
 * PRIVACY & COMPLIANCE ENGINE
 * GDPR, CCPA, consent management, data retention,
 * access/deletion requests, audit logs
 */

// In-memory stores
const consentRecords = new Map();
const dataRequests = new Map();
const retentionPolicies = new Map();
const auditLogs = [];
const dataCategories = new Map();
const legalBases = new Map();

let requestCounter = 0;

// ================================================================
// CONSENT MANAGEMENT
// ================================================================

function recordConsent({ userId, email, purposes, channel, ipAddress, userAgent }) {
  const id = `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const consent = {
    id,
    userId,
    email,
    purposes, // ['marketing', 'analytics', 'personalization', 'third_party']
    status: 'granted',
    channel, // 'web', 'email', 'sms', 'api'
    ipAddress,
    userAgent,
    grantedAt: new Date().toISOString(),
    revokedAt: null,
    expiresAt: null,
    version: '1.0'
  };
  
  consentRecords.set(id, consent);
  
  logAudit({
    action: 'consent_granted',
    userId,
    details: { purposes, channel }
  });
  
  return consent;
}

function getConsent(id) {
  return consentRecords.get(id) || null;
}

function getUserConsents(userId) {
  return Array.from(consentRecords.values())
    .filter(c => c.userId === userId)
    .sort((a, b) => new Date(b.grantedAt) - new Date(a.grantedAt));
}

function checkConsent(userId, purpose) {
  const consents = getUserConsents(userId);
  
  // Find active consent for purpose
  const activeConsent = consents.find(c => 
    c.status === 'granted' &&
    c.purposes.includes(purpose) &&
    (!c.expiresAt || new Date(c.expiresAt) > new Date())
  );
  
  return {
    hasConsent: !!activeConsent,
    purpose,
    userId,
    consent: activeConsent || null
  };
}

function revokeConsent(id, reason) {
  const consent = consentRecords.get(id);
  if (!consent) return null;
  
  consent.status = 'revoked';
  consent.revokedAt = new Date().toISOString();
  consent.revocationReason = reason;
  consentRecords.set(id, consent);
  
  logAudit({
    action: 'consent_revoked',
    userId: consent.userId,
    details: { consentId: id, reason }
  });
  
  return consent;
}

function updateConsent(id, { purposes, expiresAt }) {
  const consent = consentRecords.get(id);
  if (!consent) return null;
  
  if (purposes) consent.purposes = purposes;
  if (expiresAt) consent.expiresAt = expiresAt;
  
  consent.updatedAt = new Date().toISOString();
  consentRecords.set(id, consent);
  
  logAudit({
    action: 'consent_updated',
    userId: consent.userId,
    details: { consentId: id, purposes, expiresAt }
  });
  
  return consent;
}

function getConsentReport({ startDate, endDate }) {
  let consents = Array.from(consentRecords.values());
  
  if (startDate) {
    consents = consents.filter(c => new Date(c.grantedAt) >= new Date(startDate));
  }
  
  if (endDate) {
    consents = consents.filter(c => new Date(c.grantedAt) <= new Date(endDate));
  }
  
  const total = consents.length;
  const granted = consents.filter(c => c.status === 'granted').length;
  const revoked = consents.filter(c => c.status === 'revoked').length;
  
  const byPurpose = {};
  consents.forEach(consent => {
    consent.purposes.forEach(purpose => {
      byPurpose[purpose] = (byPurpose[purpose] || 0) + 1;
    });
  });
  
  const byChannel = {};
  consents.forEach(consent => {
    byChannel[consent.channel] = (byChannel[consent.channel] || 0) + 1;
  });
  
  return {
    total,
    granted,
    revoked,
    consentRate: total > 0 ? (granted / total) * 100 : 0,
    byPurpose,
    byChannel
  };
}

// ================================================================
// DATA SUBJECT REQUESTS (GDPR/CCPA)
// ================================================================

function createDataRequest({ type, userId, email, reason, verificationToken }) {
  const id = `req_${Date.now()}_${++requestCounter}`;
  
  const request = {
    id,
    type, // 'access', 'deletion', 'portability', 'rectification', 'restriction'
    userId,
    email,
    reason,
    status: 'pending',
    verificationToken,
    verified: false,
    submittedAt: new Date().toISOString(),
    verifiedAt: null,
    completedAt: null,
    dueDate: calculateDueDate(type),
    assignedTo: null,
    notes: [],
    dataPackage: null
  };
  
  dataRequests.set(id, request);
  
  logAudit({
    action: 'data_request_created',
    userId,
    details: { requestId: id, type }
  });
  
  return request;
}

function calculateDueDate(type) {
  const now = new Date();
  const daysToAdd = type === 'deletion' ? 30 : 30; // GDPR: 1 month
  now.setDate(now.getDate() + daysToAdd);
  return now.toISOString();
}

function getDataRequest(id) {
  return dataRequests.get(id) || null;
}

function listDataRequests({ type, status, userId, limit = 100 }) {
  let requests = Array.from(dataRequests.values());
  
  if (type) {
    requests = requests.filter(r => r.type === type);
  }
  
  if (status) {
    requests = requests.filter(r => r.status === status);
  }
  
  if (userId) {
    requests = requests.filter(r => r.userId === userId);
  }
  
  return requests
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .slice(0, limit);
}

function verifyDataRequest(id, verificationToken) {
  const request = dataRequests.get(id);
  if (!request) return { success: false, error: 'Request not found' };
  
  if (request.verificationToken !== verificationToken) {
    return { success: false, error: 'Invalid verification token' };
  }
  
  request.verified = true;
  request.verifiedAt = new Date().toISOString();
  request.status = 'verified';
  dataRequests.set(id, request);
  
  logAudit({
    action: 'data_request_verified',
    userId: request.userId,
    details: { requestId: id, type: request.type }
  });
  
  return { success: true, request };
}

function processDataRequest(id) {
  const request = dataRequests.get(id);
  if (!request) return null;
  
  if (!request.verified) {
    return { success: false, error: 'Request not verified' };
  }
  
  request.status = 'processing';
  dataRequests.set(id, request);
  
  // Simulate processing
  const result = performDataOperation(request);
  
  request.status = 'completed';
  request.completedAt = new Date().toISOString();
  request.dataPackage = result;
  dataRequests.set(id, request);
  
  logAudit({
    action: 'data_request_completed',
    userId: request.userId,
    details: { requestId: id, type: request.type }
  });
  
  return request;
}

function performDataOperation(request) {
  const { type, userId } = request;
  
  switch (type) {
    case 'access':
      return generateDataPackage(userId);
    
    case 'deletion':
      return deleteUserData(userId);
    
    case 'portability':
      return generatePortableData(userId);
    
    case 'rectification':
      return { message: 'Data rectification ready for manual review' };
    
    case 'restriction':
      return restrictDataProcessing(userId);
    
    default:
      return { message: 'Unknown request type' };
  }
}

function generateDataPackage(userId) {
  // Collect all user data
  return {
    userId,
    profile: { email: `user${userId}@example.com`, name: 'User Name' },
    consents: getUserConsents(userId),
    events: [], // Would fetch from event-tracking-engine
    segments: [], // Would fetch from segmentation-engine
    generatedAt: new Date().toISOString()
  };
}

function deleteUserData(userId) {
  // Mark for deletion (actual deletion would be batched)
  const deleted = {
    userId,
    profileDeleted: true,
    eventsDeleted: true,
    consentsDeleted: true,
    deletedAt: new Date().toISOString()
  };
  
  logAudit({
    action: 'user_data_deleted',
    userId,
    details: deleted
  });
  
  return deleted;
}

function generatePortableData(userId) {
  const data = generateDataPackage(userId);
  
  return {
    format: 'JSON',
    size: JSON.stringify(data).length,
    downloadUrl: `/api/downloads/${userId}_data.json`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    data
  };
}

function restrictDataProcessing(userId) {
  return {
    userId,
    restricted: true,
    restrictedAt: new Date().toISOString(),
    allowedOperations: ['storage', 'legal_compliance']
  };
}

function addRequestNote(id, note, author) {
  const request = dataRequests.get(id);
  if (!request) return null;
  
  request.notes.push({
    text: note,
    author,
    createdAt: new Date().toISOString()
  });
  
  dataRequests.set(id, request);
  return request;
}

// ================================================================
// DATA RETENTION POLICIES
// ================================================================

function createRetentionPolicy({ name, dataCategory, retentionPeriod, deleteAfter, enabled = true }) {
  const id = `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const policy = {
    id,
    name,
    dataCategory, // 'events', 'profiles', 'consents', 'sessions'
    retentionPeriod, // in days
    deleteAfter, // true/false - delete or archive
    enabled,
    lastRun: null,
    recordsProcessed: 0,
    createdAt: new Date().toISOString()
  };
  
  retentionPolicies.set(id, policy);
  return policy;
}

function getRetentionPolicy(id) {
  return retentionPolicies.get(id) || null;
}

function listRetentionPolicies({ enabled, limit = 100 }) {
  let policies = Array.from(retentionPolicies.values());
  
  if (enabled !== undefined) {
    policies = policies.filter(p => p.enabled === enabled);
  }
  
  return policies.slice(0, limit);
}

function updateRetentionPolicy(id, updates) {
  const policy = retentionPolicies.get(id);
  if (!policy) return null;
  
  Object.assign(policy, updates);
  retentionPolicies.set(id, policy);
  
  return policy;
}

function executeRetentionPolicy(id) {
  const policy = retentionPolicies.get(id);
  if (!policy || !policy.enabled) return null;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriod);
  
  // Simulate retention execution
  const recordsProcessed = Math.floor(Math.random() * 1000);
  
  policy.lastRun = new Date().toISOString();
  policy.recordsProcessed += recordsProcessed;
  retentionPolicies.set(id, policy);
  
  logAudit({
    action: 'retention_policy_executed',
    details: {
      policyId: id,
      dataCategory: policy.dataCategory,
      recordsProcessed,
      cutoffDate: cutoffDate.toISOString()
    }
  });
  
  return {
    policyId: id,
    recordsProcessed,
    cutoffDate: cutoffDate.toISOString(),
    action: policy.deleteAfter ? 'deleted' : 'archived'
  };
}

// ================================================================
// DATA CATEGORIES & LEGAL BASIS
// ================================================================

function createDataCategory({ name, description, sensitivity, legalBasis }) {
  const id = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const category = {
    id,
    name,
    description,
    sensitivity, // 'low', 'medium', 'high', 'critical'
    legalBasis, // 'consent', 'contract', 'legal_obligation', 'legitimate_interest'
    createdAt: new Date().toISOString()
  };
  
  dataCategories.set(id, category);
  return category;
}

function getDataCategory(id) {
  return dataCategories.get(id) || null;
}

function listDataCategories({ sensitivity, limit = 100 }) {
  let categories = Array.from(dataCategories.values());
  
  if (sensitivity) {
    categories = categories.filter(c => c.sensitivity === sensitivity);
  }
  
  return categories.slice(0, limit);
}

function recordLegalBasis({ dataCategory, legalBasis, userId, purpose, validUntil }) {
  const id = `legal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const record = {
    id,
    dataCategory,
    legalBasis, // 'consent', 'contract', 'legal_obligation', 'legitimate_interest', 'vital_interest', 'public_task'
    userId,
    purpose,
    validFrom: new Date().toISOString(),
    validUntil,
    createdAt: new Date().toISOString()
  };
  
  legalBases.set(id, record);
  
  logAudit({
    action: 'legal_basis_recorded',
    userId,
    details: { dataCategory, legalBasis, purpose }
  });
  
  return record;
}

function getLegalBasis(userId, dataCategory) {
  return Array.from(legalBases.values())
    .filter(lb => lb.userId === userId && lb.dataCategory === dataCategory)
    .filter(lb => !lb.validUntil || new Date(lb.validUntil) > new Date());
}

// ================================================================
// AUDIT LOGGING
// ================================================================

function logAudit({ action, userId, details }) {
  const log = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    action,
    userId,
    details,
    timestamp: new Date().toISOString(),
    ipAddress: '127.0.0.1',
    userAgent: 'system'
  };
  
  auditLogs.push(log);
  
  // Keep only last 10000 logs
  if (auditLogs.length > 10000) {
    auditLogs.shift();
  }
  
  return log;
}

function getAuditLogs({ userId, action, startDate, endDate, limit = 100 }) {
  let logs = [...auditLogs];
  
  if (userId) {
    logs = logs.filter(l => l.userId === userId);
  }
  
  if (action) {
    logs = logs.filter(l => l.action === action);
  }
  
  if (startDate) {
    logs = logs.filter(l => new Date(l.timestamp) >= new Date(startDate));
  }
  
  if (endDate) {
    logs = logs.filter(l => new Date(l.timestamp) <= new Date(endDate));
  }
  
  return logs
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

// ================================================================
// COMPLIANCE DASHBOARD
// ================================================================

function getComplianceScore() {
  const consents = Array.from(consentRecords.values());
  const requests = Array.from(dataRequests.values());
  const policies = Array.from(retentionPolicies.values());
  
  // Calculate score based on multiple factors
  const consentScore = consents.length > 0 ? 100 : 0;
  
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const overdueRequests = requests.filter(r => new Date(r.dueDate) < new Date() && r.status !== 'completed');
  const requestScore = requests.length > 0 
    ? Math.max(0, 100 - (overdueRequests.length / requests.length) * 100)
    : 100;
  
  const activePolicies = policies.filter(p => p.enabled);
  const policyScore = policies.length > 0 ? (activePolicies.length / policies.length) * 100 : 0;
  
  const overallScore = (consentScore * 0.4 + requestScore * 0.4 + policyScore * 0.2);
  
  return {
    overallScore: Math.round(overallScore),
    breakdown: {
      consentManagement: Math.round(consentScore),
      dataRequests: Math.round(requestScore),
      retentionPolicies: Math.round(policyScore)
    },
    metrics: {
      totalConsents: consents.length,
      activeConsents: consents.filter(c => c.status === 'granted').length,
      pendingRequests: pendingRequests.length,
      overdueRequests: overdueRequests.length,
      activePolicies: activePolicies.length
    }
  };
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Consent Management
  recordConsent,
  getConsent,
  getUserConsents,
  checkConsent,
  revokeConsent,
  updateConsent,
  getConsentReport,
  
  // Data Subject Requests
  createDataRequest,
  getDataRequest,
  listDataRequests,
  verifyDataRequest,
  processDataRequest,
  addRequestNote,
  
  // Retention Policies
  createRetentionPolicy,
  getRetentionPolicy,
  listRetentionPolicies,
  updateRetentionPolicy,
  executeRetentionPolicy,
  
  // Data Categories & Legal Basis
  createDataCategory,
  getDataCategory,
  listDataCategories,
  recordLegalBasis,
  getLegalBasis,
  
  // Audit Logging
  logAudit,
  getAuditLogs,
  
  // Compliance Dashboard
  getComplianceScore,
  
  // Data stores
  consentRecords,
  dataRequests,
  retentionPolicies,
  auditLogs,
  dataCategories,
  legalBases
};
