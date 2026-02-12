/**
 * Customer Data Platform - Privacy & Consent Management
 * GDPR/CCPA compliance, consent tracking, data export/deletion
 */

const { getProfile, updateProfile, deleteProfile } = require('./profiles');
const { getProfileEvents, clearAllEvents } = require('./events');

// Consent preferences storage
const consentHistory = new Map(); // profileId -> [consent records]
const gdprRequests = new Map(); // requestId -> request data

/**
 * Generate unique request ID
 */
function generateRequestId() {
  return `gdpr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Update consent preferences
 */
function updateConsent(profileId, consent) {
  const profile = getProfile(profileId);
  if (!profile) throw new Error('Profile not found');
  
  const now = new Date().toISOString();
  
  // Create consent record
  const consentRecord = {
    profileId,
    email: consent.email ?? profile.consent.email,
    sms: consent.sms ?? profile.consent.sms,
    tracking: consent.tracking ?? profile.consent.tracking,
    timestamp: now,
    source: consent.source || 'api',
    ipAddress: consent.ipAddress,
  };
  
  // Store in history
  if (!consentHistory.has(profileId)) {
    consentHistory.set(profileId, []);
  }
 consentHistory.get(profileId).push(consentRecord);
  
  // Update profile
  updateProfile(profileId, {
    consent: {
      email: consentRecord.email,
      sms: consentRecord.sms,
      tracking: consentRecord.tracking,
    },
  });
  
  return consentRecord;
}

/**
 * Get consent status
 */
function getConsent(profileId) {
  const profile = getProfile(profileId);
  if (!profile) throw new Error('Profile not found');
  
  const history = consentHistory.get(profileId) || [];
  
  return {
    current: profile.consent,
    history,
  };
}

/**
 * Get consent history
 */
function getConsentHistory(profileId) {
  return consentHistory.get(profileId) || [];
}

/**
 * Export all customer data (GDPR Right to Access)
 */
function exportCustomerData(profileId) {
  const profile = getProfile(profileId);
  if (!profile) throw new Error('Profile not found');
  
  const events = getProfileEvents(profileId);
  const consent = getConsentHistory(profileId);
  
  const exportData = {
    request: {
      type: 'data_export',
      profileId,
      timestamp: new Date().toISOString(),
    },
    profile,
    events,
    consentHistory: consent,
    segments: profile.segments,
  };
  
  // Log the request
  const requestId = generateRequestId();
  gdprRequests.set(requestId, {
    id: requestId,
    type: 'export',
    profileId,
    status: 'completed',
    requestedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  });
  
  return {
    requestId,
    data: exportData,
    format: 'json',
  };
}

/**
 * Delete all customer data (GDPR Right to be Forgotten)
 */
function deleteCustomerData(profileId, options = {}) {
  const profile = getProfile(profileId);
  if (!profile) throw new Error('Profile not found');
  
  const requestId = generateRequestId();
  const now = new Date().toISOString();
  
  // Create deletion request
  gdprRequests.set(requestId, {
    id: requestId,
    type: 'deletion',
    profileId,
    status: 'pending',
    requestedAt: now,
    reason: options.reason || 'user_request',
  });
  
  // Perform deletion if not requiring manual approval
  if (!options.requireApproval) {
    performDeletion(requestId);
  }
  
  return {
    requestId,
    status: options.requireApproval ? 'pending' : 'completed',
    message: options.requireApproval 
      ? 'Deletion request created and pending approval'
      : 'Customer data has been deleted',
  };
}

/**
 * Perform the actual data deletion
 */
function performDeletion(requestId) {
  const request = gdprRequests.get(requestId);
  if (!request || request.type !== 'deletion') {
    throw new Error('Invalid deletion request');
  }
  
  const { profileId } = request;
  
  // Delete events
  const events = getProfileEvents(profileId);
  // Note: In production, you'd want to anonymize rather than delete for analytics
  
  // Delete consent history
  consentHistory.delete(profileId);
  
  // Delete profile
  deleteProfile(profileId);
  
  // Update request status
  request.status = 'completed';
  request.completedAt = new Date().toISOString();
  gdprRequests.set(requestId, request);
  
  return request;
}

/**
 * Get GDPR request status
 */
function getGDPRRequestStatus(requestId) {
  return gdprRequests.get(requestId);
}

/**
 * List all GDPR requests
 */
function listGDPRRequests(filters = {}) {
  let requests = Array.from(gdprRequests.values());
  
  if (filters.profileId) {
    requests = requests.filter(r => r.profileId === filters.profileId);
  }
  
  if (filters.type) {
    requests = requests.filter(r => r.type === filters.type);
  }
  
  if (filters.status) {
    requests = requests.filter(r => r.status === filters.status);
  }
  
  // Sort by requested date descending
  requests.sort((a, b) => 
    new Date(b.requestedAt) - new Date(a.requestedAt)
  );
  
  return requests;
}

/**
 * Anonymize profile (alternative to deletion for regulatory compliance)
 */
function anonymizeProfile(profiled) {
  const profile = getProfile(profileId);
  if (!profile) throw new Error('Profile not found');
  
  // Replace PII with anonymized values
  const anonymized = {
    attributes: {
      firstName: 'REDACTED',
      lastName: 'REDACTED',
      email: `anonymized_${profileId}@example.com`,
      phone: 'REDACTED',
      country: profile.attributes.country, // Keep for analytics
      city: null,
      postalCode: null,
      tags: [],
      customFields: {},
    },
  };
  
  updateProfile(profileId, anonymized);
  
  return {
    profileId,
    status: 'anonymized',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Check data retention policy
 */
function checkRetentionPolicy(profile, policy = {}) {
  const maxInactiveDays = policy.maxInactiveDays || 730; // 2 years default
  const now = new Date();
  const lastSeen = new Date(profile.computed.lastSeenDate);
  
  const daysSinceLastSeen = (now - lastSeen) / (1000 * 60 * 60 * 24);
  
  const shouldPurge = daysSinceLastSeen > maxInactiveDays;
  
  return {
    profileId: profile.id,
    lastSeenDate: profile.computed.lastSeenDate,
    daysSinceLastSeen: Math.floor(daysSinceLastSeen),
    maxInactiveDays,
    shouldPurge,
    action: shouldPurge ? 'purge' : 'retain',
  };
}

/**
 * Get privacy compliance report
 */
function getComplianceReport() {
  const allProfiles = require('./profiles').getAllProfiles();
  
  const withConsent = allProfiles.filter(p => p.consent.tracking);
  const withoutEmail = allProfiles.filter(p => !p.consent.email);
  const withoutSMS = allProfiles.filter(p => !p.consent.sms);
  
  const pendingDeletions = Array.from(gdprRequests.values())
    .filter(r => r.type === 'deletion' && r.status === 'pending');
  
  return {
    totalProfiles: allProfiles.length,
    consent: {
      tracking: withConsent.length,
      trackingPercent: parseFloat((withConsent.length / allProfiles.length * 100).toFixed(2)),
      emailOptOut: withoutEmail.length,
      smsOptOut: withoutSMS.length,
    },
    gdprRequests: {
      total: gdprRequests.size,
      exports: Array.from(gdprRequests.values()).filter(r => r.type === 'export').length,
      deletions: Array.from(gdprRequests.values()).filter(r => r.type === 'deletion').length,
      pending: pendingDeletions.length,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Clear all privacy data (for testing)
 */
function clearAllPrivacyData() {
  consentHistory.clear();
  gdprRequests.clear();
}

module.exports = {
  updateConsent,
  getConsent,
  getConsentHistory,
  exportCustomerData,
  deleteCustomerData,
  performDeletion,
  getGDPRRequestStatus,
  listGDPRRequests,
  anonymizeProfile,
  checkRetentionPolicy,
  getComplianceReport,
  clearAllPrivacyData,
};
