/**
 * Integration & API Engine for AB Testing Suite
 * 
 * External integrations and data connectivity:
 * - Webhook system for event publishing
 * - REST API with rate limiting
 * - GraphQL API for flexible queries
 * - Data export to warehouses (BigQuery, Snowflake, Redshift)
 * - Integration with analytics platforms (GA, Amplitude, Mixpanel)
 * - CRM integration (Salesforce, HubSpot)
 * - Tag management (GTM, Segment)
 * - Real-time streaming (Kafka, kinesis)
 */

// In-memory stores
const webhooks = new Map();
const apiKeys = new Map();
const integrations = new Map();
const dataExports = new Map();
const rateLimits = new Map();
const streamConnections = new Map();

// ==================== WEBHOOK SYSTEM ====================

/**
 * Register webhook endpoint
 */
function registerWebhook(config) {
  const {
    url,
    events, // Array of event types to subscribe to
    secret,
    headers = {},
    retryPolicy = {
      maxRetries: 3,
      backoffMs: 1000,
      backoffMultiplier: 2
    }
  } = config;
  
  const webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const webhook = {
    id: webhookId,
    url,
    events,
    secret,
    headers,
    retryPolicy,
    deliveries: [],
    active: true,
    createdAt: new Date().toISOString()
  };
  
  webhooks.set(webhookId, webhook);
  
  return webhook;
}

/**
 * Trigger webhook
 */
async function triggerWebhook(webhookId, event, payload) {
  const webhook = webhooks.get(webhookId);
  if (!webhook || !webhook.active) return null;
  
  // Check if webhook subscribes to this event
  if (!webhook.events.includes(event)) return null;
  
  const deliveryId = `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const delivery = {
    id: deliveryId,
    webhookId,
    event,
    payload,
    attempts: [],
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  webhook.deliveries.push(delivery);
  
  // Attempt delivery with retries
  await attemptDelivery(webhook, delivery);
  
  return delivery;
}

/**
 * Attempt webhook delivery with retry logic
 */
async function attemptDelivery(webhook, delivery, attemptNumber = 1) {
  const attempt = {
    number: attemptNumber,
    timestamp: new Date().toISOString(),
    status: 'pending'
  };
  
  delivery.attempts.push(attempt);
  
  try {
    // Generate signature
    const signature = generateWebhookSignature(delivery.payload, webhook.secret);
    
    // Make HTTP request (simulated)
    const response = await simulateHTTPRequest(webhook.url, {
      method: 'POST',
      headers: {
        ...webhook.headers,
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': delivery.event,
        'X-Delivery-Id': delivery.id
      },
      body: JSON.stringify(delivery.payload)
    });
    
    if (response.status >= 200 && response.status < 300) {
      attempt.status = 'success';
      attempt.responseStatus = response.status;
      delivery.status = 'delivered';
      return true;
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    attempt.status = 'failed';
    attempt.error = error.message;
    
    // Retry logic
    if (attemptNumber < webhook.retryPolicy.maxRetries) {
      const backoffMs = webhook.retryPolicy.backoffMs * 
        Math.pow(webhook.retryPolicy.backoffMultiplier, attemptNumber - 1);
      
      setTimeout(() => {
        attemptDelivery(webhook, delivery, attemptNumber + 1);
      }, backoffMs);
    } else {
      delivery.status = 'failed';
    }
    
    return false;
  }
}

/**
 * Generate webhook signature (HMAC SHA256)
 */
function generateWebhookSignature(payload, secret) {
  // Simplified signature generation
  const payloadStr = JSON.stringify(payload);
  return `sha256=${Buffer.from(payloadStr + secret).toString('base64')}`;
}

/**
 * Simulated HTTP request
 */
async function simulateHTTPRequest(url, options) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Simulate success most of the time
  const status = Math.random() > 0.1 ? 200 : 500;
  
  return { status };
}

// ==================== API KEY MANAGEMENT ====================

/**
 * Create API key
 */
function createAPIKey(config) {
  const {
    name,
    scopes = [], // ['read:experiments', 'write:experiments', etc.]
    rateLimit = { requestsPerMinute: 60 },
    expiresAt
  } = config;
  
  const keyId = `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const secret = generateAPISecret();
  
  const apiKey = {
    id: keyId,
    name,
    key: `aura_${keyId}`,
    secret,
    scopes,
    rateLimit,
    expiresAt,
    active: true,
    createdAt: new Date().toISOString(),
    lastUsed: null,
    usageCount: 0
  };
  
  apiKeys.set(apiKey.key, apiKey);
  
  return {
    ...apiKey,
    secret: `${secret.substr(0, 4)}${'*'.repeat(secret.length - 4)}`
  };
}

/**
 * Validate API key
 */
function validateAPIKey(key, requiredScope) {
  const apiKey = apiKeys.get(key);
  
  if (!apiKey || !apiKey.active) {
    return { valid: false, reason: 'Invalid or inactive API key' };
  }
  
  // Check expiration
  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    return { valid: false, reason: 'API key expired' };
  }
  
  // Check scopes
  if (requiredScope && !apiKey.scopes.includes(requiredScope)) {
    return { valid: false, reason: 'Insufficient permissions' };
  }
  
  // Check rate limit
  const rateLimitResult = checkRateLimit(key, apiKey.rateLimit);
  if (!rateLimitResult.allowed) {
    return { valid: false, reason: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter };
  }
  
  // Update usage
  apiKey.lastUsed = new Date().toISOString();
  apiKey.usageCount++;
  
  return { valid: true, apiKey };
}

/**
 * Check rate limit
 */
function checkRateLimit(key, limit) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  
  if (!rateLimits.has(key)) {
    rateLimits.set(key, {
      requests: [],
      windowStart: now
    });
  }
  
  const tracking = rateLimits.get(key);
  
  // Remove old requests outside window
  tracking.requests = tracking.requests.filter(t => now - t < windowMs);
  
  if (tracking.requests.length >= limit.requestsPerMinute) {
    const oldestRequest = Math.min(...tracking.requests);
    const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);
    
    return { allowed: false, retryAfter };
  }
  
  tracking.requests.push(now);
  
  return { allowed: true, remaining: limit.requestsPerMinute - tracking.requests.length };
}

/**
 * Generate API secret
 */
function generateAPISecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

// ==================== PLATFORM INTEGRATIONS ====================

/**
 * Create integration
 */
function createIntegration(config) {
  const {
    platform, // 'google-analytics', 'amplitude', 'mixpanel', 'segment', 'salesforce', 'hubspot'
    credentials,
    settings = {},
    eventMapping = {}
  } = config;
  
  const integrationId = `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const integration = {
    id: integrationId,
    platform,
    credentials: encryptCredentials(credentials),
    settings,
    eventMapping,
    active: true,
    lastSync: null,
    createdAt: new Date().toISOString()
  };
  
  integrations.set(integrationId, integration);
  
  return integration;
}

/**
 * Sync experiment data to integration
 */
async function syncToIntegration(integrationId, experimentId, data) {
  const integration = integrations.get(integrationId);
  if (!integration || !integration.active) {
    throw new Error('Integration not found or inactive');
  }
  
  const syncId = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Platform-specific sync logic
    let result;
    switch (integration.platform) {
      case 'google-analytics':
        result = await syncToGoogleAnalytics(integration, experimentId, data);
        break;
      case 'amplitude':
        result = await syncToAmplitude(integration, experimentId, data);
        break;
      case 'mixpanel':
        result = await syncToMixpanel(integration, experimentId, data);
        break;
      case 'segment':
        result = await syncToSegment(integration, experimentId, data);
        break;
      case 'salesforce':
        result = await syncToSalesforce(integration, experimentId, data);
        break;
      case 'hubspot':
        result = await syncToHubSpot(integration, experimentId, data);
        break;
      default:
        throw new Error(`Unsupported platform: ${integration.platform}`);
    }
    
    integration.lastSync = new Date().toISOString();
    
    return {
      syncId,
      status: 'success',
      result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      syncId,
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Platform-specific sync functions (simplified implementations)

async function syncToGoogleAnalytics(integration, experimentId, data) {
  // Send experiment data to GA via Measurement Protocol
  return { platform: 'google-analytics', eventsTracked: data.events?.length || 0 };
}

async function syncToAmplitude(integration, experimentId, data) {
  // Send events to Amplitude HTTP API
  return { platform: 'amplitude', eventsTracked: data.events?.length || 0 };
}

async function syncToMixpanel(integration, experimentId, data) {
  // Send events to Mixpanel HTTP API
  return { platform: 'mixpanel', eventsTracked: data.events?.length || 0 };
}

async function syncToSegment(integration, experimentId, data) {
  // Send events to Segment HTTP API
  return { platform: 'segment', eventsTracked: data.events?.length || 0 };
}

async function syncToSalesforce(integration, experimentId, data) {
  // Create/update custom objects in Salesforce
  return { platform: 'salesforce', recordsUpdated: data.conversions?.length || 0 };
}

async function syncToHubSpot(integration, experimentId, data) {
  // Update contacts and custom events in HubSpot
  return { platform: 'hubspot', contactsUpdated: data.users?.length || 0 };
}

// ==================== DATA EXPORT ====================

/**
 * Create data export job
 */
function createDataExport(config) {
  const {
    experimentId,
    destination, // 'bigquery', 'snowflake', 'redshift', 's3', 'gcs'
    format = 'json', // 'json', 'csv', 'parquet'
    schedule, // Optional: cron expression
    credentials
  } = config;
  
  const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const exportJob = {
    id: exportId,
    experimentId,
    destination,
    format,
    schedule,
    credentials: encryptCredentials(credentials),
    status: 'pending',
    exports: [],
    createdAt: new Date().toISOString()
  };
  
  dataExports.set(exportId, exportJob);
  
  return exportJob;
}

/**
 * Execute data export
 */
async function executeDataExport(exportId) {
  const exportJob = dataExports.get(exportId);
  if (!exportJob) throw new Error('Export job not found');
  
  exportJob.status = 'running';
  
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Collect data
    const data = await collectExperimentData(exportJob.experimentId);
    
    // Transform to format
    const transformed = transformData(data, exportJob.format);
    
    // Upload to destination
    const result = await uploadToDestination(
      transformed,
      exportJob.destination,
      exportJob.credentials
    );
    
    exportJob.exports.push({
      executionId,
      status: 'success',
      recordCount: data.length,
      sizeBytes: transformed.length,
      location: result.location,
      timestamp: new Date().toISOString()
    });
    
    exportJob.status = 'completed';
    exportJob.lastExport = new Date().toISOString();
    
    return exportJob.exports[exportJob.exports.length - 1];
  } catch (error) {
    exportJob.exports.push({
      executionId,
      status: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    exportJob.status = 'failed';
    
    throw error;
  }
}

/**
 * Collect experiment data for export
 */
async function collectExperimentData(experimentId) {
  // Simulate data collection
  return [
    { userId: 'user1', variant: 'A', converted: true, revenue: 100 },
    { userId: 'user2', variant: 'B', converted: false, revenue: 0 }
  ];
}

/**
 * Transform data to specified format
 */
function transformData(data, format) {
  switch (format) {
    case 'json':
      return JSON.stringify(data);
    case 'csv':
      return convertToCSV(data);
    case 'parquet':
      return Buffer.from('parquet-data'); // Simplified
    default:
      return JSON.stringify(data);
  }
}

/**
 * Upload data to destination
 */
async function uploadToDestination(data, destination, credentials) {
  // Simulate upload
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    location: `${destination}://bucket/path/to/export_${Date.now()}.json`,
    status: 'uploaded'
  };
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => JSON.stringify(row[header] || '')).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

// ==================== REAL-TIME STREAMING ====================

/**
 * Create stream connection
 */
function createStreamConnection(config) {
  const {
    platform, // 'kafka', 'kinesis', 'pubsub'
    topic,
    credentials,
    batchSize = 100,
    flushIntervalMs = 1000
  } = config;
  
  const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const connection = {
    id: streamId,
    platform,
    topic,
    credentials: encryptCredentials(credentials),
    batchSize,
    flushIntervalMs,
    buffer: [],
    active: true,
    messagesSent: 0,
    createdAt: new Date().toISOString()
  };
  
  streamConnections.set(streamId, connection);
  
  // Start auto-flush
  startAutoFlush(streamId);
  
  return connection;
}

/**
 * Publish message to stream
 */
async function publishToStream(streamId, message) {
  const connection = streamConnections.get(streamId);
  if (!connection || !connection.active) {
    throw new Error('Stream connection not found or inactive');
  }
  
  connection.buffer.push({
    ...message,
    timestamp: new Date().toISOString()
  });
  
  // Flush if batch size reached
  if (connection.buffer.length >= connection.batchSize) {
    await flushStream(streamId);
  }
  
  return { streamId, buffered: connection.buffer.length };
}

/**
 * Flush stream buffer
 */
async function flushStream(streamId) {
  const connection = streamConnections.get(streamId);
  if (!connection || connection.buffer.length === 0) return;
  
  const messages = [...connection.buffer];
  connection.buffer = [];
  
  try {
    // Platform-specific publish
    await publishMessages(connection.platform, connection.topic, messages, connection.credentials);
    
    connection.messagesSent += messages.length;
    connection.lastFlush = new Date().toISOString();
    
    return { sent: messages.length, total: connection.messagesSent };
  } catch (error) {
    // Re-add messages to buffer on failure
    connection.buffer = [...messages, ...connection.buffer];
    throw error;
  }
}

/**
 * Start auto-flush interval
 */
function startAutoFlush(streamId) {
  const connection = streamConnections.get(streamId);
  if (!connection) return;
  
  connection.flushInterval = setInterval(() => {
    if (connection.buffer.length > 0) {
      flushStream(streamId).catch(err => {
        console.error(`Auto-flush failed for stream ${streamId}:`, err);
      });
    }
  }, connection.flushIntervalMs);
}

/**
 * Publish messages to platform
 */
async function publishMessages(platform, topic, messages, credentials) {
  // Simulate message publishing
  await new Promise(resolve => setTimeout(resolve, 50));
  return { published: messages.length };
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Encrypt credentials (simplified)
 */
function encryptCredentials(credentials) {
  // In production, use proper encryption
  return Buffer.from(JSON.stringify(credentials)).toString('base64');
}

/**
 * Decrypt credentials (simplified)
 */
function decryptCredentials(encrypted) {
  return JSON.parse(Buffer.from(encrypted, 'base64').toString());
}

// ==================== PUBLIC API ====================

module.exports = {
  // Webhooks
  registerWebhook,
  triggerWebhook,
  
  // API Keys
  createAPIKey,
  validateAPIKey,
  checkRateLimit,
  
  // Integrations
  createIntegration,
  syncToIntegration,
  
  // Data Export
  createDataExport,
  executeDataExport,
  
  // Streaming
  createStreamConnection,
  publishToStream,
  flushStream,
  
  // Stores
  webhooks,
  apiKeys,
  integrations,
  dataExports,
  rateLimits,
  streamConnections
};
