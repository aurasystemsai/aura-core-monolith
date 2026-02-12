// ================================================================
// KLAVIYO FLOW AUTOMATION - INTEGRATIONS & SETTINGS ENGINE
// ================================================================
// Handles integrations, webhooks, API keys, settings, configurations
// ================================================================

const crypto = require('crypto');

// In-memory stores
const integrations = new Map();
const webhooks = new Map();
const apiKeys = new Map();
const settings = new Map();
const connections = new Map();
const oauthTokens = new Map();

// ================================================================
// INTEGRATIONS
// ================================================================

function listIntegrations(filter = {}) {
  let results = Array.from(integrations.values());
  
  if (filter.type) {
    results = results.filter(i => i.type === filter.type);
  }
  if (filter.status) {
    results = results.filter(i => i.status === filter.status);
  }
  
  return results;
}

function createIntegration(data) {
  const integration = {
    id: `INT-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'Untitled Integration',
    type: data.type || 'custom',
    provider: data.provider || '',
    config: data.config || {},
    credentials: data.credentials || {},
    status: 'active',
    lastSyncAt: null,
    syncFrequency: data.syncFrequency || 'hourly',
    stats: {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      lastError: null
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  integrations.set(integration.id, integration);
  return integration;
}

function getIntegration(id) {
  return integrations.get(id);
}

function updateIntegration(id, updates) {
  const integration = integrations.get(id);
  if (!integration) return null;
  
  Object.assign(integration, updates, { updatedAt: Date.now() });
  integrations.set(id, integration);
  return integration;
}

function deleteIntegration(id) {
  return integrations.delete(id);
}

function testIntegration(id) {
  const integration = integrations.get(id);
  if (!integration) return null;
  
  // Simulate connection test
  const testResult = {
    integrationId: id,
    success: true,
    message: 'Connection successful',
    latency: Math.floor(Math.random() * 200) + 50,
    testedAt: Date.now()
  };
  
  return testResult;
}

function syncIntegration(id) {
  const integration = integrations.get(id);
  if (!integration) return null;
  
  integration.stats.totalSyncs++;
  
  try {
    // Simulate sync
    integration.lastSyncAt = Date.now();
    integration.stats.successfulSyncs++;
    integration.stats.lastError = null;
    
    integrations.set(id, integration);
    
    return {
      integrationId: id,
      success: true,
      recordsSynced: Math.floor(Math.random() * 1000),
      syncedAt: Date.now()
    };
  } catch (error) {
    integration.stats.failedSyncs++;
    integration.stats.lastError = error.message;
    integrations.set(id, integration);
    
    return {
      integrationId: id,
      success: false,
      error: error.message
    };
  }
}

// ================================================================
// WEBHOOKS
// ================================================================

function listWebhooks(filter = {}) {
  let results = Array.from(webhooks.values());
  
  if (filter.event) {
    results = results.filter(w => w.events.includes(filter.event));
  }
  if (filter.status) {
    results = results.filter(w => w.status === filter.status);
  }
  
  return results;
}

function createWebhook(data) {
  const webhook = {
    id: `WH-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'Untitled Webhook',
    url: data.url || '',
    events: data.events || [],
    headers: data.headers || {},
    secret: data.secret || crypto.randomBytes(32).toString('hex'),
    status: 'active',
    retryPolicy: {
      enabled: data.retryEnabled !== false,
      maxAttempts: data.maxRetries || 3,
      backoff: 'exponential'
    },
    stats: {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      averageLatency: 0
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  webhooks.set(webhook.id, webhook);
  return webhook;
}

function getWebhook(id) {
  return webhooks.get(id);
}

function updateWebhook(id, updates) {
  const webhook = webhooks.get(id);
  if (!webhook) return null;
  
  Object.assign(webhook, updates, { updatedAt: Date.now() });
  webhooks.set(id, webhook);
  return webhook;
}

function deleteWebhook(id) {
  return webhooks.delete(id);
}

function triggerWebhook(id, event, payload) {
  const webhook = webhooks.get(id);
  if (!webhook || webhook.status !== 'active') return null;
  
  if (!webhook.events.includes(event)) {
    return { success: false, reason: 'Event not subscribed' };
  }
  
  webhook.stats.totalCalls++;
  
  const startTime = Date.now();
  
  // Simulate webhook call
  try {
    const latency = Math.floor(Math.random() * 300) + 50;
    
    webhook.stats.successfulCalls++;
    webhook.stats.averageLatency = 
      (webhook.stats.averageLatency * (webhook.stats.totalCalls - 1) + latency) / webhook.stats.totalCalls;
    
    webhooks.set(id, webhook);
    
    return {
      webhookId: id,
      success: true,
      event,
      statusCode: 200,
      latency,
      sentAt: Date.now()
    };
  } catch (error) {
    webhook.stats.failedCalls++;
    webhooks.set(id, webhook);
    
    return {
      webhookId: id,
      success: false,
      error: error.message
    };
  }
}

function testWebhook(id) {
  return triggerWebhook(id, 'test', { message: 'Test webhook' });
}

// ================================================================
// API KEYS
// ================================================================

function listAPIKeys(filter = {}) {
  let results = Array.from(apiKeys.values());
  
  if (filter.status) {
    results = results.filter(k => k.status === filter.status);
  }
  
  // Don't return actual keys in list
  return results.map(k => ({
    ...k,
    key: `${k.key.substring(0, 8)}...${k.key.substring(k.key.length - 4)}`
  }));
}

function createAPIKey(data) {
  const key = {
    id: `KEY-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'Untitled API Key',
    key: `ak_${crypto.randomBytes(32).toString('hex')}`,
    permissions: data.permissions || ['read'],
    rateLimit: data.rateLimit || 1000,
    status: 'active',
    expiresAt: data.expiresAt || null,
    lastUsedAt: null,
    usageCount: 0,
    createdAt: Date.now()
  };
  
  apiKeys.set(key.id, key);
  return key;
}

function getAPIKey(id) {
  return apiKeys.get(id);
}

function validateAPIKey(keyString) {
  const key = Array.from(apiKeys.values()).find(k => k.key === keyString);
  
  if (!key) {
    return { valid: false, reason: 'Invalid key' };
  }
  
  if (key.status !== 'active') {
    return { valid: false, reason: 'Key inactive' };
  }
  
  if (key.expiresAt && key.expiresAt < Date.now()) {
    return { valid: false, reason: 'Key expired' };
  }
  
  key.lastUsedAt = Date.now();
  key.usageCount++;
  apiKeys.set(key.id, key);
  
  return {
    valid: true,
    keyId: key.id,
    permissions: key.permissions
  };
}

function revokeAPIKey(id) {
  const key = apiKeys.get(id);
  if (!key) return null;
  
  key.status = 'revoked';
  key.revokedAt = Date.now();
  apiKeys.set(id, key);
  return key;
}

function rotateAPIKey(id) {
  const oldKey = apiKeys.get(id);
  if (!oldKey) return null;
  
  const newKey = createAPIKey({
    name: oldKey.name,
    permissions: oldKey.permissions,
    rateLimit: oldKey.rateLimit
  });
  
  revokeAPIKey(id);
  
  return newKey;
}

// ================================================================
// SETTINGS
// ================================================================

function getSettings(category = 'general') {
  const key = `settings_${category}`;
  return settings.get(key) || {};
}

function updateSettings(category, updates) {
  const key = `settings_${category}`;
  const currentSettings = settings.get(key) || {};
  
  const updatedSettings = {
    ...currentSettings,
    ...updates,
    updatedAt: Date.now()
  };
  
  settings.set(key, updatedSettings);
  return updatedSettings;
}

function resetSettings(category) {
  const key = `settings_${category}`;
  const defaultSettings = getDefaultSettings(category);
  settings.set(key, defaultSettings);
  return defaultSettings;
}

function getDefaultSettings(category) {
  const defaults = {
    general: {
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      language: 'en'
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      digestFrequency: 'daily'
    },
    automation: {
      autoSync: true,
      syncFrequency: 'hourly',
      retryFailedJobs: true
    },
    privacy: {
      dataRetention: 90,
      anonymizeData: false,
      consentRequired: true
    }
  };
  
  return defaults[category] || {};
}

// ================================================================
// CONNECTIONS
// ================================================================

function createConnection(data) {
  const connection = {
    id: `CONN-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    name: data.name || 'Untitled Connection',
    type: data.type || 'database',
    host: data.host || '',
    port: data.port || null,
    config: data.config || {},
    credentials: data.credentials || {},
    status: 'disconnected',
    lastConnectedAt: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  connections.set(connection.id, connection);
  return connection;
}

function getConnection(id) {
  return connections.get(id);
}

function testConnection(id) {
  const connection = connections.get(id);
  if (!connection) return null;
  
  // Simulate connection test
  const success = Math.random() > 0.1;
  
  if (success) {
    connection.status = 'connected';
    connection.lastConnectedAt = Date.now();
    connections.set(id, connection);
  }
  
  return {
    connectionId: id,
    success,
    message: success ? 'Connection successful' : 'Connection failed',
    testedAt: Date.now()
  };
}

function deleteConnection(id) {
  return connections.delete(id);
}

// ================================================================
// OAUTH
// ================================================================

function createOAuthToken(data) {
  const token = {
    id: `OAUTH-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    provider: data.provider || '',
    accessToken: crypto.randomBytes(32).toString('hex'),
    refreshToken: crypto.randomBytes(32).toString('hex'),
    expiresAt: Date.now() + (data.expiresIn || 3600) * 1000,
    scope: data.scope || [],
    createdAt: Date.now()
  };
  
  oauthTokens.set(token.id, token);
  return token;
}

function getOAuthToken(id) {
  return oauthTokens.get(id);
}

function refreshOAuthToken(id) {
  const token = oauthTokens.get(id);
  if (!token) return null;
  
  // Simulate token refresh
  token.accessToken = crypto.randomBytes(32).toString('hex');
  token.expiresAt = Date.now() + 3600 * 1000;
  token.refreshedAt = Date.now();
  
  oauthTokens.set(id, token);
  return token;
}

function revokeOAuthToken(id) {
  return oauthTokens.delete(id);
}

// ================================================================
// PREFERENCES
// ================================================================

function getUserPreferences(userId) {
  const key = `prefs_${userId}`;
  return settings.get(key) || {
    theme: 'light',
    emailDigest: true,
    autoSave: true,
    language: 'en'
  };
}

function updateUserPreferences(userId, updates) {
  const key = `prefs_${userId}`;
  const current = getUserPreferences(userId);
  
  const updated = {
    ...current,
    ...updates,
    updatedAt: Date.now()
  };
  
  settings.set(key, updated);
  return updated;
}

// ================================================================
// EXPORTS
// ================================================================

module.exports = {
  // Integrations
  listIntegrations,
  createIntegration,
  getIntegration,
  updateIntegration,
  deleteIntegration,
  testIntegration,
  syncIntegration,
  
  // Webhooks
  listWebhooks,
  createWebhook,
  getWebhook,
  updateWebhook,
  deleteWebhook,
  triggerWebhook,
  testWebhook,
  
  // API Keys
  listAPIKeys,
  createAPIKey,
  getAPIKey,
  validateAPIKey,
  revokeAPIKey,
  rotateAPIKey,
  
  // Settings
  getSettings,
  updateSettings,
  resetSettings,
  
  // Connections
  createConnection,
  getConnection,
  testConnection,
  deleteConnection,
  
  // OAuth
  createOAuthToken,
  getOAuthToken,
  refreshOAuthToken,
  revokeOAuthToken,
  
  // Preferences
  getUserPreferences,
  updateUserPreferences
};
