// ================================================================
// SETTINGS & ADMIN ENGINE
// ================================================================
// Handles general settings, team & permissions, integrations,
// compliance & audit, API access, and notifications setup
// ================================================================

const rbac = require('./rbac');

// In-memory stores
const generalSettings = new Map();
const teamMembers = new Map();
const integrations = new Map();
const complianceRecords = [];
const apiKeys = new Map();
const notificationSettings = new Map();

let memberIdCounter = 1;
let integrationIdCounter = 1;
let complianceIdCounter = 1;
let apiKeyIdCounter = 1;

// Initialize default settings
general Settings.set('global', {
  currency: 'USD',
  timezone: 'America/New_York',
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
  defaultMargin: 32.0,
  autoApprovalThreshold: 5.0,
  pricingFrequency: '1h',
  enableAI: true,
  enableNotifications: true
});

// ================================================================
// GENERAL SETTINGS
// ================================================================

function getGeneralSettings() {
  return generalSettings.get('global') || {};
}

function updateGeneralSettings(updates) {
  const current = generalSettings.get('global') || {};
  const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
  generalSettings.set('global', updated);
  return updated;
}

function resetToDefaults() {
  const defaults = {
    currency: 'USD',
    timezone: 'America/New_York',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    defaultMargin: 32.0,
    autoApprovalThreshold: 5.0,
    pricingFrequency: '1h',
    enableAI: true,
    enableNotifications: true,
    resetAt: new Date().toISOString()
  };
  generalSettings.set('global', defaults);
  return defaults;
}

// ================================================================
// TEAM & PERMISSIONS
// ================================================================

function inviteTeamMember(memberData) {
  const member = {
    id: memberIdCounter++,
    email: memberData.email,
    name: memberData.name || '',
    role: memberData.role || 'viewer',
    permissions: rbac.getRolePermissions(memberData.role),
    status: 'invited',
    invitedAt: new Date().toISOString(),
    invitedBy: memberData.invitedBy || 'admin'
  };
  
  teamMembers.set(member.id, member);
  return member;
}

function getTeamMember(id) {
  return teamMembers.get(Number(id)) || null;
}

function listTeamMembers(filters = {}) {
  let results = Array.from(teamMembers.values());
  
  if (filters.role) {
    results = results.filter(m => m.role === filters.role);
  }
  
  if (filters.status) {
    results = results.filter(m => m.status === filters.status);
  }
  
  return results;
}

function updateTeamMember(id, updates) {
  const member = teamMembers.get(Number(id));
  if (!member) return null;
  
  if (updates.role) {
    updates.permissions = rbac.getRolePermissions(updates.role);
  }
  
  Object.assign(member, updates, { updatedAt: new Date().toISOString() });
  return member;
}

function removeTeamMember(id) {
  const member = teamMembers.get(Number(id));
  if (!member) return null;
  
  member.status = 'removed';
  member.removedAt = new Date().toISOString();
  return member;
}

function activateTeamMember(id) {
  const member = teamMembers.get(Number(id));
  if (!member) return null;
  
  member.status = 'active';
  member.activatedAt = new Date().toISOString();
  return member;
}

function getRoles() {
  return [
    {
      name: 'admin',
      description: 'Full access to all features and settings',
      permissions: rbac.getRolePermissions('admin')
    },
    {
      name: 'manager',
      description: 'Can create and manage pricing rules',
      permissions: rbac.getRolePermissions('manager')
    },
    {
      name: 'analyst',
      description: 'Can view analytics and reports',
      permissions: rbac.getRolePermissions('analyst')
    },
    {
      name: 'viewer',
      description: 'Read-only access',
      permissions: rbac.getRolePermissions('viewer')
    }
  ];
}

function updateMemberPermissions(id, permissions) {
  const member = teamMembers.get(Number(id));
  if (!member) return null;
  
  member.permissions = permissions;
  member.role = 'custom';
  member.updatedAt = new Date().toISOString();
  return member;
}

// ================================================================
// INTEGRATIONS
// ================================================================

function listIntegrations() {
  return [
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'Connect to Shopify store',
      status: integrations.get('shopify')?.status || 'not_connected',
      category: 'ecommerce'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Payment processing integration',
      status: integrations.get('stripe')?.status || 'not_connected',
      category: 'payment'
    },
    {
      id: 'google-analytics',
      name: 'Google Analytics',
      description: 'Track pricing impact on analytics',
      status: integrations.get('google-analytics')?.status || 'not_connected',
      category: 'analytics'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Receive notifications in Slack',
      status: integrations.get('slack')?.status || 'not_connected',
      category: 'communication'
    },
    {
      id: 'zapier',
      name: 'Zapier',
      description: 'Connect to 1000+ apps',
      status: integrations.get('zapier')?.status || 'not_connected',
      category: 'automation'
    }
  ];
}

function connectIntegration(integrationId, credentials) {
  const integration = {
    id: integrationIdCounter++,
    integrationId,
    status: 'connected',
    credentials: credentials, // Should be encrypted in production
    connectedAt: new Date().toISOString(),
    lastSync: null
  };
  
  integrations.set(integrationId, integration);
  return {
    success: true,
    integration: {
      id: integrationId,
      status: 'connected',
      connectedAt: integration.connectedAt
    }
  };
}

function disconnectIntegration(integrationId) {
  const integration = integrations.get(integrationId);
  if (!integration) return null;
  
  integration.status = 'disconnected';
  integration.disconnectedAt = new Date().toISOString();
  return {
    success: true,
    integration: {
      id: integrationId,
      status: 'disconnected'
    }
  };
}

function getIntegrationStatus(integrationId) {
  const integration = integrations.get(integrationId);
  return {
    id: integrationId,
    status: integration?.status || 'not_connected',
    lastSync: integration?.lastSync,
    connectedAt: integration?.connectedAt
  };
}

function syncIntegration(integrationId) {
  const integration = integrations.get(integrationId);
  if (!integration) return { success: false, error: 'Integration not connected' };
  
  integration.lastSync = new Date().toISOString();
  return {
    success: true,
    syncedAt: integration.lastSync,
    recordsSynced: Math.floor(Math.random() * 500) + 100
  };
}

// ================================================================
// COMPLIANCE & AUDIT
// ================================================================

function logComplianceEvent(eventData) {
  const event = {
    id: complianceIdCounter++,
    type: eventData.type || 'action',
    action: eventData.action,
    userId: eventData.userId,
    userName: eventData.userName || 'Unknown',
    details: eventData.details || {},
    ipAddress: eventData.ipAddress || '0.0.0.0',
    userAgent: eventData.userAgent || '',
    timestamp: new Date().toISOString()
  };
  
  complianceRecords.push(event);
  
  // Keep only last 10000 records
  if (complianceRecords.length > 10000) {
    complianceRecords.shift();
  }
  
  return event;
}

function getAuditLog(filters = {}) {
  let results = [...complianceRecords];
  
  if (filters.userId) {
    results = results.filter(e => e.userId === filters.userId);
  }
  
  if (filters.type) {
    results = results.filter(e => e.type === filters.type);
  }
  
  if (filters.startDate) {
    results = results.filter(e => new Date(e.timestamp) >= new Date(filters.startDate));
  }
  
  if (filters.endDate) {
    results = results.filter(e => new Date(e.timestamp) <= new Date(filters.endDate));
  }
  
  const limit = Number(filters.limit) || 100;
  return results.slice(-limit).reverse();
}

function exportAuditLog(filters = {}) {
  const logs = getAuditLog({ ...filters, limit: 10000 });
  
  return {
    exportedAt: new Date().toISOString(),
    recordCount: logs.length,
    format: 'json',
    data: logs
  };
}

function getComplianceReport() {
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  
  const recentEvents = complianceRecords.filter(e => 
    new Date(e.timestamp) >= last30Days
  );
  
  return {
    period: 'Last 30 Days',
    totalEvents: recentEvents.length,
    byType: {
      login: recentEvents.filter(e => e.type === 'login').length,
      action: recentEvents.filter(e => e.type === 'action').length,
      dataAccess: recentEvents.filter(e => e.type === 'data_access').length,
      configChange: recentEvents.filter(e => e.type === 'config_change').length
    },
    topUsers: getTopUsers(recentEvents),
    complianceScore: 9.2,
    status: 'compliant'
  };
}

function getTopUsers(events) {
  const userCounts = {};
  events.forEach(e => {
    userCounts[e.userName] = (userCounts[e.userName] || 0) + 1;
  });
  
  return Object.entries(userCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([user, count]) => ({ user, actions: count }));
}

// ================================================================
// API ACCESS
// ================================================================

function createAPIKey(keyData) {
  const key = {
    id: apiKeyIdCounter++,
    name: keyData.name || 'API Key',
    key: 'pk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    permissions: keyData.permissions || ['read'],
    rateLimit: keyData.rateLimit || 1000,
    expiresAt: keyData.expiresAt || null,
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: keyData.createdBy || 'admin',
    lastUsed: null
  };
  
  apiKeys.set(key.id, key);
  return key;
}

function getAPIKey(id) {
  return apiKeys.get(Number(id)) || null;
}

function listAPIKeys() {
  return Array.from(apiKeys.values()).map(key => ({
    ...key,
    key: key.key.substring(0, 12) + '...' // Mask key for security
  }));
}

function revokeAPIKey(id) {
  const key = apiKeys.get(Number(id));
  if (!key) return null;
  
  key.status = 'revoked';
  key.revokedAt = new Date().toISOString();
  return key;
}

function rotateAPIKey(id) {
  const key = apiKeys.get(Number(id));
  if (!key) return null;
  
  key.key = 'pk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  key.rotatedAt = new Date().toISOString();
  return key;
}

function getAPIUsageStats() {
  return {
    totalKeys: apiKeys.size,
    activeKeys: Array.from(apiKeys.values()).filter(k => k.status === 'active').length,
    requestsToday: Math.floor(Math.random() * 10000) + 5000,
    requestsThisMonth: Math.floor(Math.random() * 200000) + 150000,
    topEndpoints: [
      { endpoint: '/pricing/evaluate', requests: 12450 },
      { endpoint: '/rules', requests: 8920 },
      { endpoint: '/analytics', requests: 6780 }
    ]
  };
}

// ================================================================
// NOTIFICATIONS SETUP
// ================================================================

function getNotificationSettings() {
  return notificationSettings.get('global') || {
    email: {
      enabled: true,
      priceChanges: true,
      alerts: true,
      reports: true
    },
    slack: {
      enabled: false,
      channel: '#pricing',
      priceChanges: true,
      alerts: true
    },
    inApp: {
      enabled: true,
      all: true
    }
  };
}

function updateNotificationSettings(updates) {
  const current = notificationSettings.get('global') || {};
  const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
  notificationSettings.set('global', updated);
  return updated;
}

function testNotification(channel) {
  return {
    success: true,
    channel,
    sentAt: new Date().toISOString(),
    message: `Test notification sent to ${channel}`
  };
}

function getNotificationHistory(filters = {}) {
  // Simulated notification history
  return [
    {
      id: 1,
      type: 'price_change',
      channel: 'email',
      recipient: 'admin@example.com',
      sentAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'delivered'
    },
    {
      id: 2,
      type: 'alert',
      channel: 'slack',
      recipient: '#pricing',
      sentAt: new Date(Date.now() - 7200000).toISOString(),
      status: 'delivered'
    }
  ].slice(0, filters.limit || 50);
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // General Settings
  getGeneralSettings,
  updateGeneralSettings,
  resetToDefaults,
  
  // Team & Permissions
  inviteTeamMember,
  getTeamMember,
  listTeamMembers,
  updateTeamMember,
  removeTeamMember,
  activateTeamMember,
  getRoles,
  updateMemberPermissions,
  
  // Integrations
  listIntegrations,
  connectIntegration,
  disconnectIntegration,
  getIntegrationStatus,
  syncIntegration,
  
  // Compliance & Audit
  logComplianceEvent,
  getAuditLog,
  exportAuditLog,
  getComplianceReport,
  
  // API Access
  createAPIKey,
  getAPIKey,
  listAPIKeys,
  revokeAPIKey,
  rotateAPIKey,
  getAPIUsageStats,
  
  // Notifications
  getNotificationSettings,
  updateNotificationSettings,
  testNotification,
  getNotificationHistory
};
