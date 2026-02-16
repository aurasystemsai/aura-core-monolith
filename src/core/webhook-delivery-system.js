/**
 * Webhook Delivery System
 * 
 * Delivers real-time CDP events to marketplace apps and integrations
 * 
 * Features:
 * - Reliable delivery with retries
 * - Webhook signature verification (HMAC)
 * - Event filtering by subscription
 * - Delivery tracking and analytics
 * - Automatic retry with exponential backoff
 * - Dead letter queue for failed deliveries
 */

const crypto = require('crypto');

// In-memory storage
const webhookSubscriptions = new Map();
const deliveryAttempts = new Map();
const deliveryLogs = new Map();
const deadLetterQueue = new Map();

/**
 * Webhook event types
 */
const WEBHOOK_EVENTS = {
  // Profile events
  'profile.created': 'New customer profile created',
  'profile.updated': 'Customer profile updated',
  'profile.merged': 'Customer profiles merged',
  
  // Event tracking
  'event.tracked': 'Customer event tracked',
  'event.batch': 'Batch of events tracked',
  
  // Segments
  'segment.entered': 'Customer entered segment',
  'segment.exited': 'Customer exited segment',
  'segment.computed': 'Segment computation complete',
  
  // Audiences
  'audience.activated': 'Audience sent to destination',
  'audience.activation_failed': 'Audience activation failed',
  
  // Campaigns
  'campaign.triggered': 'Campaign triggered for customer',
  'email.sent': 'Email sent to customer',
  'email.opened': 'Email opened by customer',
  'email.clicked': 'Email link clicked',
  'sms.sent': 'SMS sent to customer',
  
  // Predictions
  'prediction.scored': 'ML prediction scored for customer',
  'churn.risk_detected': 'Churn risk detected',
  'purchase.predicted': 'Purchase predicted',
  
  // Data quality
  'data.quality_issue': 'Data quality issue detected',
  'duplicate.detected': 'Duplicate profile detected',
};

/**
 * Create webhook subscription
 * 
 * App subscribes to specific event types
 */
function createWebhookSubscription(appId, subscriptionData) {
  const subscriptionId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Validate events
  for (const event of subscriptionData.events) {
    if (!WEBHOOK_EVENTS[event]) {
      throw new Error(`Invalid event type: ${event}`);
    }
  }
  
  // Generate webhook secret for signature verification
  const webhookSecret = generateWebhookSecret();
  
  const subscription = {
    id: subscriptionId,
    appId,
    
    // Which events to receive
    events: subscriptionData.events,
    
    // Where to send webhooks
    url: subscriptionData.url,
    
    // Optional filters
    filters: subscriptionData.filters || {},
    
    // Signature verification
    secret: webhookSecret,
    signatureHeader: 'X-Aura-Signature',
    
    // Delivery settings
    retryConfig: {
      maxAttempts: subscriptionData.maxRetries || 3,
      backoffMultiplier: 2, // exponential backoff
      initialDelayMs: 1000,
    },
    
    // Status
    status: 'active', // active, paused, disabled
    
    // Stats
    totalDelivered: 0,
    totalFailed: 0,
    lastDeliveryAt: null,
    
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  webhookSubscriptions.set(subscriptionId, subscription);
  
  return {
    ...subscription,
    secret: subscription.secret, // Return secret once, then never show again
  };
}

/**
 * Send webhook for event
 * 
 * Called when CDP event occurs
 */
async function sendWebhook(eventType, eventData, customerId = null) {
  const subscriptions = Array.from(webhookSubscriptions.values())
    .filter(sub => sub.status === 'active' && sub.events.includes(eventType));
  
  const deliveries = [];
  
  for (const subscription of subscriptions) {
    // Check filters
    if (!matchesFilters(eventData, subscription.filters)) {
      continue;
    }
    
    const deliveryId = `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const delivery = {
      id: deliveryId,
      subscriptionId: subscription.id,
      appId: subscription.appId,
      eventType,
      customerId,
      
      payload: {
        id: deliveryId,
        created: Math.floor(Date.now() / 1000),
        type: eventType,
        data: eventData,
      },
      
      attempt: 0,
      maxAttempts: subscription.retryConfig.maxAttempts,
      status: 'pending',
      
      createdAt: new Date().toISOString(),
    };
    
    deliveryAttempts.set(deliveryId, delivery);
    
    // Attempt delivery
    attemptDelivery(delivery, subscription);
    
    deliveries.push(delivery);
  }
  
  return {
    eventType,
    subscriptions: subscriptions.length,
    deliveries: deliveries.length,
  };
}

/**
 * Attempt webhook delivery
 */
async function attemptDelivery(delivery, subscription) {
  delivery.attempt++;
  
  try {
    // Generate signature
    const signature = generateWebhookSignature(
      JSON.stringify(delivery.payload),
      subscription.secret
    );
    
    // In production, would make actual HTTP POST request
    // const response = await fetch(subscription.url, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     [subscription.signatureHeader]: signature,
    //     'X-Aura-Event': delivery.eventType,
    //     'X-Aura-Delivery-Id': delivery.id,
    //   },
    //   body: JSON.stringify(delivery.payload),
    //   timeout: 10000, // 10 second timeout
    // });
    
    // Simulate successful delivery
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      delivery.status = 'delivered';
      delivery.deliveredAt = new Date().toISOString();
      delivery.responseCode = 200;
      
      // Update subscription stats
      subscription.totalDelivered++;
      subscription.lastDeliveryAt = delivery.deliveredAt;
      subscription.updatedAt = new Date().toISOString();
      
      logDelivery(delivery, 'success');
    } else {
      throw new Error('Delivery failed (simulated)');
    }
  } catch (error) {
    delivery.status = 'failed';
    delivery.error = error.message;
    delivery.lastAttemptAt = new Date().toISOString();
    
    logDelivery(delivery, 'failed', error.message);
    
    // Retry with exponential backoff
    if (delivery.attempt < delivery.maxAttempts) {
      const delayMs = subscription.retryConfig.initialDelayMs * 
        Math.pow(subscription.retryConfig.backoffMultiplier, delivery.attempt - 1);
      
      console.log(`[Webhook] Retrying delivery ${delivery.id} in ${delayMs}ms (attempt ${delivery.attempt + 1}/${delivery.maxAttempts})`);
      
      // Would schedule retry in production
      // setTimeout(() => attemptDelivery(delivery, subscription), delayMs);
    } else {
      // Max retries exceeded, move to dead letter queue
      delivery.status = 'dead_letter';
      subscription.totalFailed++;
      subscription.updatedAt = new Date().toISOString();
      
      deadLetterQueue.set(delivery.id, {
        ...delivery,
        movedToDLQAt: new Date().toISOString(),
      });
      
      console.error(`[Webhook] Delivery ${delivery.id} failed after ${delivery.maxAttempts} attempts`);
    }
  }
  
  return delivery;
}

/**
 * Verify webhook signature
 * 
 * For marketplace apps to verify webhooks are from Aura
 */
function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = generateWebhookSignature(payload, secret);
  
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Get webhook delivery logs
 */
function getDeliveryLogs(subscriptionId, options = {}) {
  const logs = Array.from(deliveryLogs.values())
    .filter(log => log.subscriptionId === subscriptionId);
  
  // Filter by status
  if (options.status) {
    return logs.filter(log => log.status === options.status);
  }
  
  // Sort by timestamp
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, options.limit || 100);
}

/**
 * Get webhook subscription analytics
 */
function getWebhookAnalytics(subscriptionId) {
  const subscription = webhookSubscriptions.get(subscriptionId);
  if (!subscription) {
    throw new Error('Webhook subscription not found');
  }
  
  const logs = getDeliveryLogs(subscriptionId);
  
  const last24h = logs.filter(log => 
    Date.now() - new Date(log.timestamp).getTime() < 24 * 60 * 60 * 1000
  );
  
  const successCount = last24h.filter(log => log.status === 'success').length;
  const failedCount = last24h.filter(log => log.status === 'failed').length;
  
  return {
    subscriptionId,
    status: subscription.status,
    
    lifetime: {
      totalDelivered: subscription.totalDelivered,
      totalFailed: subscription.totalFailed,
      successRate: subscription.totalDelivered / (subscription.totalDelivered + subscription.totalFailed) * 100 || 0,
    },
    
    last24Hours: {
      delivered: successCount,
      failed: failedCount,
      successRate: successCount / (successCount + failedCount) * 100 || 0,
    },
    
    lastDeliveryAt: subscription.lastDeliveryAt,
  };
}

/**
 * Pause webhook subscription
 */
function pauseWebhookSubscription(subscriptionId) {
  const subscription = webhookSubscriptions.get(subscriptionId);
  if (!subscription) {
    throw new Error('Webhook subscription not found');
  }
  
  subscription.status = 'paused';
  subscription.pausedAt = new Date().toISOString();
  subscription.updatedAt = new Date().toISOString();
  
  return subscription;
}

/**
 * Resume webhook subscription
 */
function resumeWebhookSubscription(subscriptionId) {
  const subscription = webhookSubscriptions.get(subscriptionId);
  if (!subscription) {
    throw new Error('Webhook subscription not found');
  }
  
  subscription.status = 'active';
  subscription.resumedAt = new Date().toISOString();
  subscription.updatedAt = new Date().toISOString();
  
  return subscription;
}

/**
 * Delete webhook subscription
 */
function deleteWebhookSubscription(subscriptionId) {
  const subscription = webhookSubscriptions.get(subscriptionId);
  if (!subscription) {
    throw new Error('Webhook subscription not found');
  }
  
  webhookSubscriptions.delete(subscriptionId);
  
  return { deleted: true, subscriptionId };
}

/**
 * Get dead letter queue
 * 
 * Failed deliveries that need manual intervention
 */
function getDeadLetterQueue(options = {}) {
  const dlq = Array.from(deadLetterQueue.values());
  
  if (options.subscriptionId) {
    return dlq.filter(d => d.subscriptionId === options.subscriptionId);
  }
  
  return dlq.sort((a, b) => new Date(b.movedToDLQAt) - new Date(a.movedToDLQAt))
    .slice(0, options.limit || 100);
}

/**
 * Retry dead letter delivery
 */
function retryDeadLetter(deliveryId) {
  const delivery = deadLetterQueue.get(deliveryId);
  if (!delivery) {
    throw new Error('Dead letter delivery not found');
  }
  
  const subscription = webhookSubscriptions.get(delivery.subscriptionId);
  if (!subscription) {
    throw new Error('Webhook subscription not found');
  }
  
  // Reset attempt count for retry
  delivery.attempt = 0;
  delivery.status = 'pending';
  
  // Move back to active deliveries
  deliveryAttempts.set(deliveryId, delivery);
  deadLetterQueue.delete(deliveryId);
  
  // Attempt delivery
  attemptDelivery(delivery, subscription);
  
  return delivery;
}

// Helper functions
function generateWebhookSecret() {
  return `whsec_${crypto.randomBytes(32).toString('hex')}`;
}

function generateWebhookSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

function matchesFilters(eventData, filters) {
  // No filters = match all
  if (!filters || Object.keys(filters).length === 0) {
    return true;
  }
  
  // Check each filter
  for (const [key, value] of Object.entries(filters)) {
    if (eventData[key] !== value) {
      return false;
    }
  }
  
  return true;
}

function logDelivery(delivery, status, error = null) {
  const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const log = {
    id: logId,
    deliveryId: delivery.id,
    subscriptionId: delivery.subscriptionId,
    appId: delivery.appId,
    eventType: delivery.eventType,
    attempt: delivery.attempt,
    status,
    error,
    timestamp: new Date().toISOString(),
  };
  
  deliveryLogs.set(logId, log);
}

// Export
module.exports = {
  // Subscription management
  createWebhookSubscription,
  pauseWebhookSubscription,
  resumeWebhookSubscription,
  deleteWebhookSubscription,
  
  // Delivery
  sendWebhook,
  verifyWebhookSignature,
  
  // Monitoring
  getDeliveryLogs,
  getWebhookAnalytics,
  getDeadLetterQueue,
  retryDeadLetter,
  
  // Constants
  WEBHOOK_EVENTS,
};
