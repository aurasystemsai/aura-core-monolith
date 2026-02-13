/**
 * AI SUPPORT ASSISTANT - INTEGRATION ENGINE
 * Manages external integrations with CRM, helpdesk, and communication platforms
 */

const crypto = require('crypto');

// In-memory storage
const integrations = new Map();
const syncLogs = new Map();
const webhooks = new Map();

/**
 * Initialize default integrations
 */
function initializeIntegrations() {
  const defaultIntegrations = [
    {
      id: 'shopify',
      name: 'Shopify',
      type: 'ecommerce',
      status: 'connected',
      config: { apiKey: 'sk_****', shop: 'store.myshopify.com' },
    },
    {
      id: 'zendesk',
      name: 'Zendesk',
      type: 'helpdesk',
      status: 'disconnected',
      config: {},
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      type: 'crm',
      status: 'disconnected',
      config: {},
    },
    {
      id: 'slack',
      name: 'Slack',
      type: 'communication',
      status: 'disconnected',
      config: {},
    },
  ];

  defaultIntegrations.forEach(integration => {
    integrations.set(integration.id, {
      ...integration,
      createdAt: new Date().toISOString(),
      lastSyncAt: null,
      syncCount: 0,
    });
  });
}

initializeIntegrations();

/**
 * Create integration
 */
function createIntegration({ id, name, type, config }) {
  const integration = {
    id: id || `int_${crypto.randomBytes(6).toString('hex')}`,
    name,
    type, // crm, helpdesk, ecommerce, communication, etc.
    status: 'disconnected',
    config,
    createdAt: new Date().toISOString(),
    lastSyncAt: null,
    syncCount: 0,
  };

  integrations.set(integration.id, integration);
  return integration;
}

/**
 * Connect integration
 */
async function connectIntegration(integrationId, credentials) {
  const integration = integrations.get(integrationId);
  if (!integration) return null;

  // Simulate connection
  integration.status = 'connected';
  integration.config = { ...integration.config, ...credentials };
  integration.connectedAt = new Date().toISOString();

  return integration;
}

/**
 * Disconnect integration
 */
function disconnectIntegration(integrationId) {
  const integration = integrations.get(integrationId);
  if (!integration) return null;

  integration.status = 'disconnected';
  integration.disconnectedAt = new Date().toISOString();

  return integration;
}

/**
 * Get integration
 */
function getIntegration(integrationId) {
  return integrations.get(integrationId);
}

/**
 * List integrations
 */
function listIntegrations({ type, status } = {}) {
  let filtered = Array.from(integrations.values());

  if (type) filtered = filtered.filter(i => i.type === type);
  if (status) filtered = filtered.filter(i => i.status === status);

  return filtered;
}

/**
 * Sync customer data from CRM
 */
async function syncCustomerData(integrationId, customerId) {
  const integration = integrations.get(integrationId);
  if (!integration || integration.status !== 'connected') {
    throw new Error('Integration not connected');
  }

  // Simulate API call
  const customerData = {
    id: customerId,
    email: 'customer@example.com',
    name: 'John Doe',
    phone: '+1234567890',
    company: 'Acme Corp',
    tags: ['enterprise', 'vip'],
    customFields: {
      accountManager: 'Jane Smith',
      contractValue: 50000,
      renewalDate: '2024-12-31',
    },
    syncedAt: new Date().toISOString(),
    source: integration.id,
  };

  integration.lastSyncAt = new Date().toISOString();
  integration.syncCount++;

  logSync(integrationId, {
    type: 'customer_sync',
    entityId: customerId,
    status: 'success',
  });

  return customerData;
}

/**
 * Sync order data from Shopify
 */
async function syncOrderData(integrationId, orderId) {
  const integration = integrations.get(integrationId);
  if (!integration || integration.status !== 'connected') {
    throw new Error('Integration not connected');
  }

  // Simulate Shopify API call
  const orderData = {
    id: orderId,
    orderNumber: `#${Math.floor(1000 + Math.random() * 9000)}`,
    customer: {
      id: 'cust_123',
      email: 'customer@example.com',
      name: 'John Doe',
    },
    items: [
      { id: 'item_1', name: 'Product A', quantity: 2, price: 29.99 },
      { id: 'item_2', name: 'Product B', quantity: 1, price: 49.99 },
    ],
    total: 109.97,
    status: 'fulfilled',
    fulfillmentStatus: 'shipped',
    trackingNumber: '1Z999AA10123456784',
    trackingUrl: 'https://track.example.com/1Z999AA10123456784',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    syncedAt: new Date().toISOString(),
  };

  integration.lastSyncAt = new Date().toISOString();
  integration.syncCount++;

  logSync(integrationId, {
    type: 'order_sync',
    entityId: orderId,
    status: 'success',
  });

  return orderData;
}

/**
 * Create ticket in external helpdesk
 */
async function createExternalTicket(integrationId, ticketData) {
  const integration = integrations.get(integrationId);
  if (!integration || integration.status !== 'connected') {
    throw new Error('Integration not connected');
  }

  // Simulate helpdesk API call (Zendesk, Freshdesk, etc.)
  const externalTicket = {
    id: `ext_ticket_${crypto.randomBytes(6).toString('hex')}`,
    externalId: Math.floor(100000 + Math.random() * 900000),
    subject: ticketData.subject,
    description: ticketData.description,
    priority: ticketData.priority,
    status: 'open',
    requester: ticketData.userId,
    createdAt: new Date().toISOString(),
    url: `https://${integration.config.subdomain || 'example'}.zendesk.com/tickets/${Math.floor(Math.random() * 100000)}`,
  };

  logSync(integrationId, {
    type: 'ticket_create',
    entityId: externalTicket.id,
    status: 'success',
  });

  return externalTicket;
}

/**
 * Send notification to Slack
 */
async function sendSlackNotification(integrationId, { channel, message, user }) {
  const integration = integrations.get(integrationId);
  if (!integration || integration.status !== 'connected') {
    throw new Error('Integration not connected');
  }

  // Simulate Slack API call
  const notification = {
    id: `slack_msg_${crypto.randomBytes(6).toString('hex')}`,
    channel: channel || '#support',
    message,
    user,
    timestamp: new Date().toISOString(),
    status: 'sent',
  };

  logSync(integrationId, {
    type: 'slack_notification',
    entityId: notification.id,
    status: 'success',
  });

  return notification;
}

/**
 * Register webhook
 */
function registerWebhook({ url, events, secret }) {
  const webhook = {
    id: `webhook_${crypto.randomBytes(8).toString('hex')}`,
    url,
    events, // array of event types to listen for
    secret,
    status: 'active',
    deliveryCount: 0,
    failureCount: 0,
    createdAt: new Date().toISOString(),
    lastDeliveryAt: null,
  };

  webhooks.set(webhook.id, webhook);
  return webhook;
}

/**
 * Trigger webhook
 */
async function triggerWebhook(webhookId, event, payload) {
  const webhook = webhooks.get(webhookId);
  if (!webhook || webhook.status !== 'active') return null;

  if (!webhook.events.includes(event)) return null;

  // Simulate webhook delivery
  try {
    const delivery = {
      id: `delivery_${crypto.randomBytes(6).toString('hex')}`,
      webhookId,
      event,
      payload,
      status: 'success',
      responseCode: 200,
      deliveredAt: new Date().toISOString(),
    };

    webhook.deliveryCount++;
    webhook.lastDeliveryAt = new Date().toISOString();

    return delivery;
  } catch (error) {
    webhook.failureCount++;
    throw error;
  }
}

/**
 * List webhooks
 */
function listWebhooks() {
  return Array.from(webhooks.values());
}

/**
 * Delete webhook
 */
function deleteWebhook(webhookId) {
  return webhooks.delete(webhookId);
}

/**
 * Get customer from CRM
 */
async function getCustomerFromCRM(integrationId, customerId) {
  const integration = integrations.get(integrationId);
  if (!integration || integration.status !== 'connected') {
    throw new Error('Integration not connected');
  }

  return syncCustomerData(integrationId, customerId);
}

/**
 * Update customer in CRM
 */
async function updateCustomerInCRM(integrationId, customerId, updates) {
  const integration = integrations.get(integrationId);
  if (!integration || integration.status !== 'connected') {
    throw new Error('Integration not connected');
  }

  // Simulate CRM update
  const updated = {
    id: customerId,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  logSync(integrationId, {
    type: 'customer_update',
    entityId: customerId,
    status: 'success',
  });

  return updated;
}

/**
 * Search knowledge base in external system
 */
async function searchExternalKnowledgeBase(integrationId, query) {
  const integration = integrations.get(integrationId);
  if (!integration || integration.status !== 'connected') {
    throw new Error('Integration not connected');
  }

  // Simulate knowledge base search
  return [
    {
      id: 'kb_1',
      title: 'How to track your order',
      url: 'https://help.example.com/track-order',
      excerpt: 'Learn how to track your order using the tracking number...',
      relevanceScore: 0.92,
    },
    {
      id: 'kb_2',
      title: 'Return and refund policy',
      url: 'https://help.example.com/returns',
      excerpt: 'Our return policy allows returns within 30 days...',
      relevanceScore: 0.85,
    },
  ];
}

/**
 * Log sync activity
 */
function logSync(integrationId, { type, entityId, status, error = null }) {
  const log = {
    id: `log_${crypto.randomBytes(6).toString('hex')}`,
    integrationId,
    type,
    entityId,
    status, // success, error
    error,
    timestamp: new Date().toISOString(),
  };

  const logs = syncLogs.get(integrationId) || [];
  logs.push(log);
  syncLogs.set(integrationId, logs);

  return log;
}

/**
 * Get sync  logs
 */
function getSyncLogs(integrationId, { limit = 50 } = {}) {
  const logs = syncLogs.get(integrationId) || [];
  return logs
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

/**
 * Test integration connection
 */
async function testConnection(integrationId) {
  const integration = integrations.get(integrationId);
  if (!integration) return null;

  // Simulate connection test
  const isConnected = integration.status === 'connected';

  return {
    integrationId,
    name: integration.name,
    status: isConnected ? 'success' : 'failed',
    message: isConnected
      ? 'Connection successful'
      : 'Connection failed - please check credentials',
    testedAt: new Date().toISOString(),
  };
}

/**
 * Get integration statistics
 */
function getIntegrationStats() {
  const allIntegrations = Array.from(integrations.values());

  return {
    totalIntegrations: allIntegrations.length,
    connectedIntegrations: allIntegrations.filter(i => i.status === 'connected').length,
    disconnectedIntegrations: allIntegrations.filter(i => i.status === 'disconnected').length,
    totalSyncs: allIntegrations.reduce((sum, i) => sum + i.syncCount, 0),
    integrationsByType: {
      crm: allIntegrations.filter(i => i.type === 'crm').length,
      helpdesk: allIntegrations.filter(i => i.type === 'helpdesk').length,
      ecommerce: allIntegrations.filter(i => i.type === 'ecommerce').length,
      communication: allIntegrations.filter(i => i.type === 'communication').length,
    },
    totalWebhooks: webhooks.size,
    activeWebhooks: Array.from(webhooks.values()).filter(w => w.status === 'active').length,
  };
}

/**
 * Bulk sync
 */
async function bulkSync(integrationId, entityType, entityIds) {
  const integration = integrations.get(integrationId);
  if (!integration || integration.status !== 'connected') {
    throw new Error('Integration not connected');
  }

  const results = [];
  
  for (const entityId of entityIds) {
    try {
      let result;
      if (entityType === 'customer') {
        result = await syncCustomerData(integrationId, entityId);
      } else if (entityType === 'order') {
        result = await syncOrderData(integrationId, entityId);
      }
      results.push({ entityId, status: 'success', data: result });
    } catch (error) {
      results.push({ entityId, status: 'error', error: error.message });
    }
  }

  return {
    total: entityIds.length,
    successful: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'error').length,
    results,
  };
}

module.exports = {
  createIntegration,
  connectIntegration,
  disconnectIntegration,
  getIntegration,
  listIntegrations,
  syncCustomerData,
  syncOrderData,
  createExternalTicket,
  sendSlackNotification,
  registerWebhook,
  triggerWebhook,
  listWebhooks,
  deleteWebhook,
  getCustomerFromCRM,
  updateCustomerInCRM,
  searchExternalKnowledgeBase,
  getSyncLogs,
  testConnection,
  getIntegrationStats,
  bulkSync,
};
