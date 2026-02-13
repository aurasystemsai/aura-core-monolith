/**
 * Integration Engine
 * Handles external platform integrations (Shopify, Google, Yotpo, etc.) and data import/export
 */

// In-memory storage
const integrations = new Map();
const webhooks = new Map();
const importJobs = new Map();
const exportJobs = new Map();
const syncLogs = [];

let integrationIdCounter = 1;
let webhookIdCounter = 1;
let jobIdCounter = 1;

/**
 * Initialize default integrations
 */
function initializeIntegrations() {
  // Shopify
  integrations.set('shopify', {
    id: 'shopify',
    name: 'Shopify',
    type: 'ecommerce',
    status: 'disconnected',
    capabilities: ['orders', 'products', 'customers'],
    config: {},
    connectedAt: null,
  });

  // Google Merchant Center / Shopping
  integrations.set('google_shopping', {
    id: 'google_shopping',
    name: 'Google Shopping',
    type: 'marketplace',
    status: 'disconnected',
    capabilities: ['product_ratings', 'seller_ratings'],
    config: {},
    connectedAt: null,
  });

  // Yotpo
  integrations.set('yotpo', {
    id: 'yotpo',
    name: 'Yotpo',
    type: 'reviews_platform',
    status: 'disconnected',
    capabilities: ['import_reviews', 'sync_reviews'],
    config: {},
    connectedAt: null,
  });

  // Trustpilot
  integrations.set('trustpilot', {
    id: 'trustpilot',
    name: 'Trustpilot',
    type: 'reviews_platform',
    status: 'disconnected',
    capabilities: ['import_reviews'],
    config: {},
    connectedAt: null,
  });

  // Klaviyo
  integrations.set('klaviyo', {
    id: 'klaviyo',
    name: 'Klaviyo',
    type: 'marketing',
    status: 'disconnected',
    capabilities: ['email_campaigns', 'customer_sync'],
    config: {},
    connectedAt: null,
  });
}

// Initialize on module load
initializeIntegrations();

/**
 * Get integration
 */
function getIntegration(integrationId) {
  return integrations.get(integrationId);
}

/**
 * List integrations
 */
function listIntegrations(options = {}) {
  const { type = null, status = null } = options;

  let integrationList = Array.from(integrations.values());

  if (type) {
    integrationList = integrationList.filter(i => i.type === type);
  }
  if (status) {
    integrationList = integrationList.filter(i => i.status === status);
  }

  return integrationList;
}

/**
 * Connect integration
 */
function connectIntegration(integrationId, credentials) {
  const integration = integrations.get(integrationId);
  if (!integration) {
    throw new Error('Integration not found');
  }

  // Validate credentials (simplified)
  if (!credentials || !credentials.apiKey) {
    throw new Error('Invalid credentials');
  }

  integration.status = 'connected';
  integration.config = credentials;
  integration.connectedAt = new Date().toISOString();

  logSync({
    integrationId,
    type: 'connection',
    status: 'success',
    message: 'Integration connected successfully',
  });

  return integration;
}

/**
 * Disconnect integration
 */
function disconnectIntegration(integrationId) {
  const integration = integrations.get(integrationId);
  if (!integration) {
    throw new Error('Integration not found');
  }

  integration.status = 'disconnected';
  integration.config = {};
  integration.connectedAt = null;

  logSync({
    integrationId,
    type: 'disconnection',
    status: 'success',
    message: 'Integration disconnected',
  });

  return integration;
}

/**
 * Test integration connection
 */
function testConnection(integrationId) {
  const integration = integrations.get(integrationId);
  if (!integration) {
    throw new Error('Integration not found');
  }

  if (integration.status !== 'connected') {
    return {
      success: false,
      message: 'Integration is not connected',
    };
  }

  // Simulate connection test
  return {
    success: true,
    message: `Successfully connected to ${integration.name}`,
    capabilities: integration.capabilities,
  };
}

/**
 * Import reviews from external platform
 */
function importReviews(importData) {
  const {
    integrationId,
    source,
    filters = {},
  } = importData;

  const integration = integrations.get(integrationId);
  if (!integration) {
    throw new Error('Integration not found');
  }

  if (integration.status !== 'connected') {
    throw new Error('Integration is not connected');
  }

  const job = {
    id: `import_${jobIdCounter++}`,
    integrationId,
    source,
    type: 'import',
    status: 'processing', // processing, completed, failed
    filters,
    progress: {
      total: 0,
      processed: 0,
      imported: 0,
      skipped: 0,
      failed: 0,
    },
    startedAt: new Date().toISOString(),
    completedAt: null,
    errors: [],
  };

  importJobs.set(job.id, job);

  // Simulate import process
  setTimeout(() => {
    job.status = 'completed';
    job.progress.total = 100;
    job.progress.processed = 100;
    job.progress.imported = 95;
    job.progress.skipped = 3;
    job.progress.failed = 2;
    job.completedAt = new Date().toISOString();

    logSync({
      integrationId,
      type: 'import',
      status: 'success',
      message: `Imported ${job.progress.imported} reviews from ${source}`,
      metadata: { jobId: job.id },
    });
  }, 1000);

  return job;
}

/**
 * Get import job status
 */
function getImportJob(jobId) {
  return importJobs.get(jobId);
}

/**
 * Export reviews to external platform
 */
function exportReviews(exportData) {
  const {
    integrationId,
    destination,
    reviewIds = [],
    filters = {},
  } = exportData;

  const integration = integrations.get(integrationId);
  if (!integration) {
    throw new Error('Integration not found');
  }

  if (integration.status !== 'connected') {
    throw new Error('Integration is not connected');
  }

  const job = {
    id: `export_${jobIdCounter++}`,
    integrationId,
    destination,
    type: 'export',
    status: 'processing',
    reviewCount: reviewIds.length,
    filters,
    progress: {
      total: reviewIds.length,
      processed: 0,
      exported: 0,
      failed: 0,
    },
    startedAt: new Date().toISOString(),
    completedAt: null,
    errors: [],
  };

  exportJobs.set(job.id, job);

  // Simulate export process
  setTimeout(() => {
    job.status = 'completed';
    job.progress.processed = reviewIds.length;
    job.progress.exported = reviewIds.length - 1;
    job.progress.failed = 1;
    job.completedAt = new Date().toISOString();

    logSync({
      integrationId,
      type: 'export',
      status: 'success',
      message: `Exported ${job.progress.exported} reviews to ${destination}`,
      metadata: { jobId: job.id },
    });
  }, 1000);

  return job;
}

/**
 * Get export job status
 */
function getExportJob(jobId) {
  return exportJobs.get(jobId);
}

/**
 * Sync products from Shopify
 */
function syncShopifyProducts(shopifyData) {
  const integration = integrations.get('shopify');
  if (!integration || integration.status !== 'connected') {
    throw new Error('Shopify integration not connected');
  }

  // Simulate syncing products
  const products = [
    { id: 'prod_1', title: 'Product 1', handle: 'product-1' },
    { id: 'prod_2', title: 'Product 2', handle: 'product-2' },
    { id: 'prod_3', title: 'Product 3', handle: 'product-3' },
  ];

  logSync({
    integrationId: 'shopify',
    type: 'product_sync',
    status: 'success',
    message: `Synced ${products.length} products from Shopify`,
  });

  return {
    success: true,
    products,
    syncedCount: products.length,
    syncedAt: new Date().toISOString(),
  };
}

/**
 * Sync orders from Shopify for review requests
 */
function syncShopifyOrders(orderData) {
  const integration = integrations.get('shopify');
  if (!integration || integration.status !== 'connected') {
    throw new Error('Shopify integration not connected');
  }

  const { startDate, endDate, status = 'fulfilled' } = orderData;

  // Simulate syncing orders
  const orders = [
    {
      id: 'order_1',
      orderNumber: '1001',
      customerId: 'cust_1',
      customerEmail: 'customer1@example.com',
      status: 'fulfilled',
      items: [{ productId: 'prod_1', quantity: 1 }],
      fulfilledAt: new Date().toISOString(),
    },
    {
      id: 'order_2',
      orderNumber: '1002',
      customerId: 'cust_2',
      customerEmail: 'customer2@example.com',
      status: 'fulfilled',
      items: [{ productId: 'prod_2', quantity: 2 }],
      fulfilledAt: new Date().toISOString(),
    },
  ];

  logSync({
    integrationId: 'shopify',
    type: 'order_sync',
    status: 'success',
    message: `Synced ${orders.length} orders from Shopify`,
  });

  return {
    success: true,
    orders,
    syncedCount: orders.length,
    syncedAt: new Date().toISOString(),
  };
}

/**
 * Submit reviews to Google Shopping
 */
function submitToGoogleShopping(submissionData) {
  const integration = integrations.get('google_shopping');
  if (!integration || integration.status !== 'connected') {
    throw new Error('Google Shopping integration not connected');
  }

  const { reviewIds, productMappings } = submissionData;

  // Simulate submission
  const result = {
    success: true,
    submitted: reviewIds.length,
    failed: 0,
    submittedAt: new Date().toISOString(),
  };

  logSync({
    integrationId: 'google_shopping',
    type: 'review_submission',
    status: 'success',
    message: `Submitted ${result.submitted} reviews to Google Shopping`,
  });

  return result;
}

/**
 * Create webhook
 */
function createWebhook(webhookData) {
  const webhook = {
    id: `webhook_${webhookIdCounter++}`,
    url: webhookData.url,
    events: webhookData.events, // ['review.created', 'review.approved', etc.]
    secret: webhookData.secret || generateWebhookSecret(),
    status: 'active', // active, paused, failed
    deliverySettings: {
      retryCount: webhookData.deliverySettings?.retryCount || 3,
      retryBackoff: webhookData.deliverySettings?.retryBackoff || 'exponential',
      timeout: webhookData.deliverySettings?.timeout || 30000, // ms
    },
    statistics: {
      totalDeliveries: 0,
      successfulDeliveries: 0,
      failedDeliveries: 0,
      lastDeliveryAt: null,
      lastStatus: null,
    },
    createdAt: new Date().toISOString(),
  };

  webhooks.set(webhook.id, webhook);
  return webhook;
}

/**
 * Get webhook
 */
function getWebhook(webhookId) {
  return webhooks.get(webhookId);
}

/**
 * List webhooks
 */
function listWebhooks(options = {}) {
  const { status = null } = options;

  let webhookList = Array.from(webhooks.values());

  if (status) {
    webhookList = webhookList.filter(w => w.status === status);
  }

  return webhookList;
}

/**
 * Update webhook
 */
function updateWebhook(webhookId, updates) {
  const webhook = webhooks.get(webhookId);
  if (!webhook) {
    throw new Error('Webhook not found');
  }

  Object.assign(webhook, updates);
  return webhook;
}

/**
 * Delete webhook
 */
function deleteWebhook(webhookId) {
  const deleted = webhooks.delete(webhookId);
  if (!deleted) {
    throw new Error('Webhook not found');
  }
  return { success: true, deletedWebhookId: webhookId };
}

/**
 * Trigger webhook
 */
function triggerWebhook(webhookId, eventData) {
  const webhook = webhooks.get(webhookId);
  if (!webhook) {
    throw new Error('Webhook not found');
  }

  if (webhook.status !== 'active') {
    return {
      success: false,
      message: 'Webhook is not active',
    };
  }

  if (!webhook.events.includes(eventData.type)) {
    return {
      success: false,
      message: 'Event type not subscribed',
    };
  }

  // Simulate webhook delivery
  const delivery = {
    webhookId,
    eventType: eventData.type,
    payload: eventData.data,
    attemptedAt: new Date().toISOString(),
    success: true,
    responseCode: 200,
    responseTime: 45, // ms
  };

  webhook.statistics.totalDeliveries += 1;
  webhook.statistics.successfulDeliveries += 1;
  webhook.statistics.lastDeliveryAt = delivery.attemptedAt;
  webhook.statistics.lastStatus = 'success';

  return delivery;
}

/**
 * Log sync operation
 */
function logSync(logData) {
  const log = {
    id: `log_${syncLogs.length + 1}`,
    integrationId: logData.integrationId,
    type: logData.type,
    status: logData.status,
    message: logData.message,
    metadata: logData.metadata || {},
    timestamp: new Date().toISOString(),
  };

  syncLogs.push(log);
  return log;
}

/**
 * Get sync logs
 */
function getSyncLogs(options = {}) {
  const {
    integrationId = null,
    type = null,
    status = null,
    limit = 50,
    offset = 0,
  } = options;

  let logs = [...syncLogs];

  if (integrationId) {
    logs = logs.filter(log => log.integrationId === integrationId);
  }
  if (type) {
    logs = logs.filter(log => log.type === type);
  }
  if (status) {
    logs = logs.filter(log => log.status === status);
  }

  // Sort by timestamp (most recent first)
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return {
    logs: logs.slice(offset, offset + limit),
    total: logs.length,
  };
}

/**
 * Generate webhook secret
 */
function generateWebhookSecret() {
  return `whsec_${Math.random().toString(36).substr(2, 16)}${Date.now()}`;
}

/**
 * Bulk import from CSV
 */
function importFromCSV(csvData) {
  const { fileContent, mapping, skipFirstRow = true } = csvData;

  const job = {
    id: `csv_import_${jobIdCounter++}`,
    type: 'csv_import',
    status: 'processing',
    progress: {
      total: 0,
      processed: 0,
      imported: 0,
      skipped: 0,
      failed: 0,
    },
    startedAt: new Date().toISOString(),
    completedAt: null,
    errors: [],
  };

  importJobs.set(job.id, job);

  // Simulate CSV processing
  setTimeout(() => {
    job.status = 'completed';
    job.progress.total = 50;
    job.progress.processed = 50;
    job.progress.imported = 47;
    job.progress.skipped = 2;
    job.progress.failed = 1;
    job.completedAt = new Date().toISOString();
  }, 1500);

  return job;
}

/**
 * Export to CSV
 */
function exportToCSV(exportData) {
  const { reviewIds, fields = [] } = exportData;

  const csvContent = generateCSVContent(reviewIds, fields);

  return {
    success: true,
    filename: `reviews_export_${Date.now()}.csv`,
    content: csvContent,
    rowCount: reviewIds.length,
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Generate CSV content
 */
function generateCSVContent(reviewIds, fields) {
  const headers = fields.join(',');
  const rows = reviewIds.map((id, index) =>
    `${id},Sample Review ${index + 1},5,Sample content,true`
  );

  return `${headers}\n${rows.join('\n')}`;
}

/**
 * Get integration statistics
 */
function getIntegrationStatistics() {
  const totalIntegrations = integrations.size;
  const connectedIntegrations = Array.from(integrations.values())
    .filter(i => i.status === 'connected').length;

  const totalImports = importJobs.size;
  const completedImports = Array.from(importJobs.values())
    .filter(j => j.status === 'completed').length;

  const totalExports = exportJobs.size;
  const completedExports = Array.from(exportJobs.values())
    .filter(j => j.status === 'completed').length;

  const totalWebhooks = webhooks.size;
  const activeWebhooks = Array.from(webhooks.values())
    .filter(w => w.status === 'active').length;

  const totalDeliveries = Array.from(webhooks.values())
    .reduce((sum, w) => sum + w.statistics.totalDeliveries, 0);
  const successfulDeliveries = Array.from(webhooks.values())
    .reduce((sum, w) => sum + w.statistics.successfulDeliveries, 0);

  return {
    integrations: {
      total: totalIntegrations,
      connected: connectedIntegrations,
    },
    imports: {
      total: totalImports,
      completed: completedImports,
      processing: totalImports - completedImports,
    },
    exports: {
      total: totalExports,
      completed: completedExports,
      processing: totalExports - completedExports,
    },
    webhooks: {
      total: totalWebhooks,
      active: activeWebhooks,
      totalDeliveries,
      successfulDeliveries,
      successRate: totalDeliveries > 0
        ? ((successfulDeliveries / totalDeliveries) * 100).toFixed(2)
        : 0,
    },
    syncLogs: syncLogs.length,
  };
}

module.exports = {
  getIntegration,
  listIntegrations,
  connectIntegration,
  disconnectIntegration,
  testConnection,
  importReviews,
  getImportJob,
  exportReviews,
  getExportJob,
  syncShopifyProducts,
  syncShopifyOrders,
  submitToGoogleShopping,
  createWebhook,
  getWebhook,
  listWebhooks,
  updateWebhook,
  deleteWebhook,
  triggerWebhook,
  getSyncLogs,
  importFromCSV,
  exportToCSV,
  getIntegrationStatistics,
};
