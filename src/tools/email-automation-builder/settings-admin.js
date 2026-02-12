/**
 * Email Automation Builder - Settings & Administration
 * ESP configuration, domain management, API keys, webhooks, compliance
 */

const { v4: uuidv4 } = require('uuid');

// Mock data stores
const espConfigurations = new Map();
const domains = new Map();
const apiKeys = new Map();
const webhooks = new Map();
const users = new Map();
const auditLogs = [];

//=============================================================================
// ESP (Email Service Provider) MANAGEMENT
//=============================================================================

function listESPProviders() {
  return {
    providers: [
      {
        id: 'sendgrid',
        name: 'SendGrid',
        description: 'Twilio SendGrid email delivery platform',
        capabilities: ['transactional', 'marketing', 'templates', 'analytics'],
        pricing: 'Usage-based',
        documentation: 'https://docs.sendgrid.com'
      },
      {
        id: 'aws-ses',
        name: 'Amazon SES',
        description: 'Amazon Simple Email Service',
        capabilities: ['transactional', 'marketing', 'high-volume'],
        pricing: '$0.10 per 1,000 emails',
        documentation: 'https://docs.aws.amazon.com/ses'
      },
      {
        id: 'mailgun',
        name: 'Mailgun',
        description: 'Email API service by Sinch',
        capabilities: ['transactional', 'marketing', 'validation'],
        pricing: 'Usage-based',
        documentation: 'https://documentation.mailgun.com'
      },
      {
        id: 'postmark',
        name: 'Postmark',
        description: 'Fast and reliable transactional email',
        capabilities: ['transactional', 'templates', 'analytics'],
        pricing: '$10 per 10,000 emails',
        documentation: 'https://postmarkapp.com/developer'
      },
      {
        id: 'sparkpost',
        name: 'SparkPost',
        description: 'Email delivery and analytics platform',
        capabilities: ['transactional', 'marketing', 'analytics', 'ai'],
        pricing: 'Usage-based',
        documentation: 'https://developers.sparkpost.com'
      }
    ]
  };
}

function configureESP(config) {
  const { provider, credentials, settings = {} } = config;
  
  if (!provider) {
    throw new Error('Provider is required');
  }
  
  const espConfig = {
    id: uuidv4(),
    provider,
    credentials: credentials || {},
    settings: {
      defaultFromEmail: settings.defaultFromEmail || '',
      defaultFromName: settings.defaultFromName || '',
      replyTo: settings.replyTo || '',
      trackOpens: settings.trackOpens !== false,
      trackClicks: settings.trackClicks !== false,
      unsubscribeUrl: settings.unsubscribeUrl || '',
      ...settings
    },
    status: 'active',
    configured: new Date().toISOString(),
    lastTested: null
  };
  
  espConfigurations.set(provider, espConfig);
  
  logAudit({
    action: 'esp.configure',
    details: { provider },
    userId: 'system'
  });
  
  return espConfig;
}

function getESPConfiguration(provider) {
  const config = espConfigurations.get(provider);
  if (!config) {
    throw new Error(`ESP ${provider} not configured`);
  }
  
  // Don't expose credentials
  const safeCopy = { ...config };
  if (safeCopy.credentials) {
    safeCopy.credentials = Object.keys(safeCopy.credentials).reduce((acc, key) => {
      acc[key] = '[CONFIGURED]';
      return acc;
    }, {});
  }
  
  return safeCopy;
}

function testESPConnection(provider) {
  const config = espConfigurations.get(provider);
  if (!config) {
    throw new Error(`ESP ${provider} not configured`);
  }
  
  // Simulated connection test
  const success = Math.random() > 0.05; // 95% success rate
  
  const result = {
    provider,
    success,
    latency: Math.floor(Math.random() * 300 + 100), // 100-400ms
    timestamp: new Date().toISOString(),
    error: success ? null : 'Authentication failed'
  };
  
  if (success) {
    config.lastTested = result.timestamp;
  }
  
  logAudit({
    action: 'esp.test',
    details: { provider, success },
    userId: 'system'
  });
  
  return result;
}

//=============================================================================
// DOMAIN MANAGEMENT
//=============================================================================

function listDomains(filters = {}) {
  let allDomains = Array.from(domains.values());
  
  if (filters.verified !== undefined) {
    allDomains = allDomains.filter(d => d.verified === filters.verified);
  }
  
  return {
    domains: allDomains,
    total: allDomains.length
  };
}

function addDomain(domainConfig) {
  const { domain, purpose = 'sending' } = domainConfig;
  
  if (!domain) {
    throw new Error('Domain is required');
  }
  
  if (Array.from(domains.values()).find(d => d.domain === domain)) {
    throw new Error('Domain already exists');
  }
  
  const domainRecord = {
    id: uuidv4(),
    domain,
    purpose, // sending, tracking, both
    verified: false,
    dnsRecords: {
      spf: {
        type: 'TXT',
        name: domain,
        value: 'v=spf1 include:_spf.example.com ~all',
        status: 'pending'
      },
      dkim: {
        type: 'TXT',
        name: `dkim._domainkey.${domain}`,
        value: 'v=DKIM1; k=rsa; p=MIGfMA0GCS...',
        status: 'pending'
      },
      dmarc: {
        type: 'TXT',
        name: `_dmarc.${domain}`,
        value: 'v=DMARC1; p=none; rua=mailto:dmarc@example.com',
        status: 'pending'
      }
    },
    created: new Date().toISOString(),
    lastVerified: null
  };
  
  domains.set(domainRecord.id, domainRecord);
  
  logAudit({
    action: 'domain.add',
    details: { domain },
    userId: 'system'
  });
  
  return domainRecord;
}

function getDomain(domainId) {
  const domain = domains.get(domainId);
  if (!domain) {
    throw new Error('Domain not found');
  }
  return domain;
}

function verifyDomain(domainId) {
  const domain = domains.get(domainId);
  if (!domain) {
    throw new Error('Domain not found');
  }
  
  // Simulated DNS verification
  const allVerified = Math.random() > 0.3; // 70% success rate
  
  if (allVerified) {
    domain.verified = true;
    domain.lastVerified = new Date().toISOString();
    domain.dnsRecords.spf.status = 'verified';
    domain.dnsRecords.dkim.status = 'verified';
    domain.dnsRecords.dmarc.status = 'verified';
  }
  
  logAudit({
    action: 'domain.verify',
    details: { domainId, domain: domain.domain, success: allVerified },
    userId: 'system'
  });
  
  return {
    domainId,
    domain: domain.domain,
    verified: domain.verified,
    dnsRecords: domain.dnsRecords,
    lastVerified: domain.lastVerified
  };
}

function deleteDomain(domainId) {
  const domain = domains.get(domainId);
  if (!domain) {
    return false;
  }
  
  logAudit({
    action: 'domain.delete',
    details: { domainId, domain: domain.domain },
    userId: 'system'
  });
  
  return domains.delete(domainId);
}

//=============================================================================
// API KEY MANAGEMENT
//=============================================================================

function listAPIKeys(filters = {}) {
  let keys = Array.from(apiKeys.values());
  
  if (filters.active !== undefined) {
    keys = keys.filter(k => k.active === filters.active);
  }
  
  // Don't expose actual keys
  return {
    apiKeys: keys.map(k => ({
      id: k.id,
      name: k.name,
      keyPreview: k.key.substring(0, 12) + '...',
      permissions: k.permissions,
      active: k.active,
      lastUsed: k.lastUsed,
      created: k.created,
      expiresAt: k.expiresAt
    })),
    total: keys.length
  };
}

function createAPIKey(config) {
  const { name, permissions = [], expiresAt = null } = config;
  
  if (!name) {
    throw new Error('API key name is required');
  }
  
  const apiKey = {
    id: uuidv4(),
    name,
    key: `sk_live_${uuidv4()}${uuidv4()}`.replace(/-/g, ''),
    permissions: permissions.length > 0 ? permissions : ['read', 'write'],
    active: true,
    lastUsed: null,
    created: new Date().toISOString(),
    expiresAt
  };
  
  apiKeys.set(apiKey.id, apiKey);
  
  logAudit({
    action: 'apikey.create',
    details: { keyId: apiKey.id, name },
    userId: 'system'
  });
  
  return apiKey; // Only return full key on creation
}

function getAPIKey(keyId) {
  const key = apiKeys.get(keyId);
  if (!key) {
    throw new Error('API key not found');
  }
  
  // Don't expose full key
  return {
    id: key.id,
    name: key.name,
    keyPreview: key.key.substring(0, 12) + '...',
    permissions: key.permissions,
    active: key.active,
    lastUsed: key.lastUsed,
    created: key.created,
    expiresAt: key.expiresAt
  };
}

function revokeAPIKey(keyId) {
  const key = apiKeys.get(keyId);
  if (!key) {
    throw new Error('API key not found');
  }
  
  key.active = false;
  key.revokedAt = new Date().toISOString();
  
  logAudit({
    action: 'apikey.revoke',
    details: { keyId, name: key.name },
    userId: 'system'
  });
  
  return key;
}

function deleteAPIKey(keyId) {
  const key = apiKeys.get(keyId);
  if (!key) {
    return false;
  }
  
  logAudit({
    action: 'apikey.delete',
    details: { keyId, name: key.name },
    userId: 'system'
  });
  
  return apiKeys.delete(keyId);
}

//=============================================================================
// WEBHOOK MANAGEMENT
//=============================================================================

function listWebhooks(filters = {}) {
  let hooks = Array.from(webhooks.values());
  
  if (filters.active !== undefined) {
    hooks = hooks.filter(h => h.active === filters.active);
  }
  
  return {
    webhooks: hooks,
    total: hooks.length
  };
}

function createWebhook(config) {
  const { url, events = [], secret = null } = config;
  
  if (!url) {
    throw new Error('Webhook URL is required');
  }
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error('Webhook URL must start with http:// or https://');
  }
  
  if (events.length === 0) {
    throw new Error('At least one event is required');
  }
  
  const webhook = {
    id: uuidv4(),
    url,
    events,
    secret: secret || uuidv4(),
    active: true,
    deliveryAttempts: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    lastDelivery: null,
    created: new Date().toISOString()
  };
  
  webhooks.set(webhook.id, webhook);
  
  logAudit({
    action: 'webhook.create',
    details: { webhookId: webhook.id, url, events },
    userId: 'system'
  });
  
  return webhook;
}

function getWebhook(webhookId) {
  const webhook = webhooks.get(webhookId);
  if (!webhook) {
    throw new Error('Webhook not found');
  }
  return webhook;
}

function updateWebhook(webhookId, updates) {
  const webhook = webhooks.get(webhookId);
  if (!webhook) {
    throw new Error('Webhook not found');
  }
  
  if (updates.url) webhook.url = updates.url;
  if (updates.events) webhook.events = updates.events;
  if (updates.active !== undefined) webhook.active = updates.active;
  
  webhook.updated = new Date().toISOString();
  
  logAudit({
    action: 'webhook.update',
    details: { webhookId, updates: Object.keys(updates) },
    userId: 'system'
  });
  
  return webhook;
}

function deleteWebhook(webhookId) {
  const webhook = webhooks.get(webhookId);
  if (!webhook) {
    return false;
  }
  
  logAudit({
    action: 'webhook.delete',
    details: { webhookId, url: webhook.url },
    userId: 'system'
  });
  
  return webhooks.delete(webhookId);
}

function testWebhook(webhookId) {
  const webhook = webhooks.get(webhookId);
  if (!webhook) {
    throw new Error('Webhook not found');
  }
  
  // Simulated webhook test
  const success = Math.random() > 0.2; // 80% success rate
  
  const result = {
    webhookId,
    url: webhook.url,
    success,
    statusCode: success ? 200 : 500,
    latency: Math.floor(Math.random() * 500 + 100),
    timestamp: new Date().toISOString(),
    error: success ? null : 'Connection timeout'
  };
  
  webhook.deliveryAttempts++;
  if (success) {
    webhook.successfulDeliveries++;
  } else {
    webhook.failedDeliveries++;
  }
  webhook.lastDelivery = result.timestamp;
  
  return result;
}

//=============================================================================
// COMPLIANCE & GDPR
//=============================================================================

function getComplianceSettings() {
  return {
    gdpr: {
      enabled: true,
      dataRetention: 730, // days
      consentRequired: true,
      rightToErasure: true,
      dataPortability: true
    },
    canSpam: {
      enabled: true,
      physicalAddress: '123 Business St, City, ST 12345',
      unsubscribeRequired: true,
      honorUnsubscribesWithin: 10 // days
    },
    casl: {
      enabled: false,
      consentRequired: true
    },
    dataProcessing: {
      location: 'US',
      encryption: true,
      backups: true,
      backupRetention: 90 // days
    },
    doubleOptIn: true,
    suppressionList: {
      enabled: true,
      autoAdd: true,
      types: ['unsubscribed', 'bounced', 'complained']
    }
  };
}

function updateComplianceSettings(updates) {
  // Simulated update
  const current = getComplianceSettings();
  const merged = { ...current, ...updates };
  
  logAudit({
    action: 'compliance.update',
    details: { updates: Object.keys(updates) },
    userId: 'system'
  });
  
  return merged;
}

//=============================================================================
// AUDIT LOGGING
//=============================================================================

function logAudit(entry) {
  const auditEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    action: entry.action,
    userId: entry.userId || 'system',
    details: entry.details || {},
    ipAddress: entry.ipAddress || null
  };
  
  auditLogs.push(auditEntry);
  
  // Keep only last 1000 entries
  if (auditLogs.length > 1000) {
    auditLogs.shift();
  }
  
  return auditEntry;
}

function getAuditLogs(filters = {}) {
  let logs = [...auditLogs];
  
  if (filters.action) {
    logs = logs.filter(l => l.action.includes(filters.action));
  }
  
  if (filters.userId) {
    logs = logs.filter(l => l.userId === filters.userId);
  }
  
  // Sort by timestamp descending
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return {
    logs: logs.slice(0, 100), // Limit to 100
    total: logs.length
  };
}

//=============================================================================
// EXPORTS
//=============================================================================

module.exports = {
  // ESP
  listESPProviders,
  configureESP,
  getESPConfiguration,
  testESPConnection,
  
  // Domains
  listDomains,
  addDomain,
  getDomain,
  verifyDomain,
  deleteDomain,
  
  // API Keys
  listAPIKeys,
  createAPIKey,
  getAPIKey,
  revokeAPIKey,
  deleteAPIKey,
  
  // Webhooks
  listWebhooks,
  createWebhook,
  getWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  
  // Compliance
  getComplianceSettings,
  updateComplianceSettings,
  
  // Audit
  logAudit,
  getAuditLogs
};
